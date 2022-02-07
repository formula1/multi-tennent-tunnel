import { Socket } from "net";
import { Client } from "ssh2";
import { promisify } from "util";
import { SubSshClient } from "./base/SubSshClient";
import { RedirectClient } from "./base/RedirectClient";
import { ForwardOutClient } from "./base/ForwardOutClient"
import { TypeUrlHost, TypeSshLogin } from "./types/url";
import { ClientChannel } from "ssh2";
import { eventToPromise } from "./util/promise";
import { StepMachine } from "./util/promise"

type TunnelToDockerArgs = {
  remoteSsh: TypeUrlHost,
  remoteLogin: TypeSshLogin
  dockerSsh: TypeUrlHost,
  dockerLogin: TypeSshLogin
  redirectTcp: TypeUrlHost
}

export async function anotherGo(
  {
    remoteSsh, remoteLogin,
    dockerSsh, dockerLogin,
    redirectTcp
  }: TunnelToDockerArgs
){
  const remoteClient = new Client();
  const dockerClient = new Client();
  await eventToPromise(remoteClient, "ready", ()=>{
    console.log("about to connect remote client")
    remoteClient.connect({
      ...remoteSsh,
      ...remoteLogin
    })
  })
  console.log("remote ready");

  const channel = await promisify(remoteClient.forwardOut.bind(remoteClient))(
    "127.0.0.1", 0,
    dockerSsh.hostname, dockerSsh.port,
  );
  console.log("forwarding out to docker");

  await eventToPromise(dockerClient, "ready", ()=>{
    dockerClient.connect({
      ...dockerLogin,
      sock: channel
    })
  })
  console.log("docker ready")
  dockerClient.on('tcp connection', async (info, accept, reject) => {
    console.log("tcp connection:", info);
    const socket = new Socket();
    try {
      await eventToPromise(socket, "connect", ()=>{
        socket.connect(redirectTcp.port, redirectTcp.hostname)
      })
    }catch(e){
      return reject();
    }
    const channel = accept();
    socket.pipe(channel).pipe(socket);
    console.log("connected a socket to a channel")
  });
  const foundPort = await promisify(dockerClient.forwardIn.bind(dockerClient))(
    "127.0.0.1", 0
  )
  console.log("forwarding in finished");
  console.log("connection available at found port:", foundPort);

}

export function tunnelToDockerStepper(
  {
    remoteSsh, remoteLogin,
    dockerSsh, dockerLogin,
    redirectTcp
  }: TunnelToDockerArgs
){
  const remoteConfig = remoteLogin.password ? ({
    host: remoteSsh.hostname,
    port: remoteSsh.port,
    username: remoteLogin.username,
    password: remoteLogin.password
  }) : remoteLogin.privateKey ? ({
    host: remoteSsh.hostname,
    port: remoteSsh.port,
    username: remoteLogin.username,
    privateKey: remoteLogin.privateKey
  }) : void 0;
  if(!remoteConfig){
    throw new Error("remote login needs either a username or password")
  }
  console.log("remote config:", remoteConfig);
  const dockerConfig = dockerLogin.password ? ({
    host: dockerSsh.hostname,
    port: dockerSsh.port,
    username: dockerLogin.username,
    password: dockerLogin.password
  }) : dockerLogin.privateKey ? ({
    host: dockerSsh.hostname,
    port: dockerSsh.port,
    username: dockerLogin.username,
    privateKey: dockerLogin.privateKey
  }) : void 0;
  if(!dockerConfig){
    throw new Error("remote login needs either a username or password")
  }
  console.log("docker config:", remoteConfig);

  var remoteClient: SubSshClient | void;
  var remoteChannel: ClientChannel | void;
  const stepper =  new StepMachine([
    {
      name: "remote ssh forward out",
      fn: async()=>{
        remoteClient = new SubSshClient(dockerSsh)

        // remoteClient = new ForwardOutClient({
        //   src: {
        //     hostname: "127.0.0.1",
        //     port: 0
        //   },
        //   dest: dockerSsh,
        //   reconnect: true,
        // });
        const remoteReady = stepper.refOnce("remote ssh ready");
        remoteClient.on("ready", ()=>{
          remoteReady();
        })

        remoteChannel = (await eventToPromise(remoteClient, "new forward out", ()=>{
          (remoteClient as ForwardOutClient<{}>).connect(remoteConfig)
        })) as ClientChannel;
        return { remoteClient, remoteChannel }
      }
    }, {
      name: "docker ssh forward in",
      fn: async ()=>{
        const dockerClient = new RedirectClient({
          forwardIn: {
            hostname: "127.0.0.1",
            port: 0
          },
          redirect: redirectTcp
        })
        const dockerReady = stepper.refOnce("docker ready");
        dockerClient.on("ready", ()=>{
          dockerReady();
        })
        const tcpConnect = stepper.ref("tcp connection");
        dockerClient.on('tcp connection', async (info, __, ___) => {
          tcpConnect.emit(info);
        });
        const newTunnel = stepper.ref("new tunnel");
        dockerClient.on("new tunnel", async (channel, socket)=>{
          newTunnel.emit(channel, socket);
        })
        dockerClient.on("close", ()=>{
          tcpConnect.finish();
          newTunnel.finish()
        })

        const foundPort = (await eventToPromise(dockerClient, "new forward in", ()=>{
          dockerClient.connect(dockerConfig);
        })) as number;
        return {
          dockerClient, foundPort
        }
      }
    }
  ]);
  return stepper;
}

export async function tunnelToDocker(
  {
    remoteSsh, remoteLogin,
    dockerSsh, dockerLogin,
    redirectTcp
  }: TunnelToDockerArgs
){
  const remoteClient = new ForwardOutClient({
    src: {
      hostname: "127.0.0.1",
      port: 2222
    },
    dest: dockerSsh,
    reconnect: true,
  });

  const channel = (await eventToPromise(remoteClient, "new forward out", ()=>{
    remoteClient.connect({
      host: remoteSsh.hostname,
      port: remoteSsh.port,
      username: remoteLogin.username,
      privateKey: remoteLogin.privateKey ? remoteLogin.privateKey : void 0,
      password: remoteLogin.password ? remoteLogin.password : void 0
    })
  })) as ClientChannel;
  console.log('REMOTE TCP :: FORWARD OUT SUCCESS:');
  console.log(
    "We should be able to use this channel to connect to the docker container"
  );
  const dockerClient = new RedirectClient({
    forwardIn: {
      hostname: "127.0.0.1",
      port: 0
    },
    redirect: redirectTcp
  })
  dockerClient.on('tcp connection', async (info, __, ___) => {
    console.dir(info);
    console.log("DOCKER TCP :: READY")
  });
  dockerClient.on("new tunnel", async (channel, socket)=>{
    console.log("DOCKET TUNNEL :: SUCCESS")
    channel.on("close", ()=>{
      console.log("DOCKET TUNNEL :: SOURCE CLOSE")
    })
    socket.on("close", ()=>{
      console.log("DOCKET TUNNEL :: REDIRECT CLOSE")
    })
  })

  const foundPort = (await eventToPromise(dockerClient, "new forward in", ()=>{
    dockerClient.connect({
      sock: channel,
      username: dockerLogin.username,
      privateKey: dockerLogin.privateKey ? dockerLogin.privateKey : void 0,
      password: dockerLogin.password ? dockerLogin.password : void 0
    })
  })) as number;
  console.log(
    "You should be able to access your server from:",
    `${foundPort}.${remoteSsh.hostname}`
  )
  return {
    remoteClient: remoteClient,
    remoteChannel: channel,
    dockerClient: dockerClient,
    dockerListeningPort: foundPort
  }
}
