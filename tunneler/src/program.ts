import { Command } from "commander";
import { ERROR_NO_DOCKER_IP } from "./errors";
import { tunnelToDocker, tunnelToDockerStepper, anotherGo } from "./index";
import { isNodeEnvironment, hasParent } from "./util/module";
import * as dotenv from "dotenv";
import { readFile } from "fs/promises";
import { resolve as pathResolve } from "path";
import { Client } from "ssh2";

type Options = {
  username: string, password: string,
  redirectTcpHost: string, redirectTcpPort: string,
  remoteSshHost: string, remoteSshPort: string,
  dockerSshHost: string, dockerSshPort: string,
}

export class SSHTunnelCommand extends Command {
  constructor(){
    super();
    this
    .version(process.version)
    .option(
      "-u, --username <username>", "The username to ssh into the docker container as"
    )
    .option(
      "-p, --password <password>", "The password to use when sshing into the docker container"
    )
    .option(
      "-rsh, --remote-ssh-host <host>",
      [
        "The remote host to connect the ssh session to and will recieve tcp connections from.",
        "Can be either an ip address or a hostname"
      ].join("\n"),
      "127.0.0.1"
    )
    .option(
      "-rsp, --remote-ssh-port <port>",
      "The remote ssh port to connect the ssh session to",
      "22"
    )
    .option(
      "-dsh, --docker-ssh-host <host>",
      [
        "The way for our tunnel to contact thye docker container.",
        "If sshing into a normal server, you can probably just allow this to be default.",
        "The tunnel-proxy-server probably has an exposed ssh port.",
        "If it doesn't I'm not sure how you plan on getting in.",
        "For local development, you may want to ssh into a docker container then go to another one.",
        "As a result, this is available to be set.",
        "This can be an Ip address, a hostname or a valid docker container name"
      ].join("\n"),
      "127.0.0.1"
    )
    .option(
      "-dsp, --docker-ssh-port <port>",
      [
        "The docker container's ssh port that we will be forwarding connections from.",
        "Note: since ssh normally runs on port 22 and the server is exposing it's own ssh port,",
        "it needs to run on a diffeent port than the actual server it runs on",
      ].join("\n"),
      "2222",
    ).option(
      "-rth, --redirect-tcp-hostname <address>",
      [
        "The hostname to redirect forwarded tcp connections to",
        "Http and websockets should count as tcp",
        "Can be a domain name or a ip address. If in a docker container, can use a container name as well"
      ].join("\n"),
      "127.0.0.1"
    )
    .option(
      "-rtp, --redirect-tcp-port <port>",
      [
        "The http port to redirect incomming tcp connections to.",
        "Http and websockets should count as tcp"
      ].join("\n"),
      "80"
    ).action(async (options: Options)=>{
      console.log(options);
      try {
        const {
          username: dockerUsername, password: dockerPassword,
          redirectTcpHost, redirectTcpPort: redirectPortStr,
          remoteSshHost, remoteSshPort: remoteSSHPortStr,
          dockerSshHost, dockerSshPort: dockerSshPortStr
        } = options
        const remoteSshPort = Number.parseInt(remoteSSHPortStr);
        console.log("remote port:", remoteSshPort, remoteSSHPortStr);
        const redirectTcpPort = Number.parseInt(redirectPortStr);
        console.log("redirect port:", redirectTcpPort, redirectPortStr)
        const dockerSshPort = Number.parseInt(dockerSshPortStr);
        console.log("docker port:", dockerSshPort, dockerSshPortStr)
        if(Number.isNaN(remoteSshPort)){
          throw new Error("--remote-ssh-port is not a number:" + remoteSSHPortStr)
        }
        if(Number.isNaN(redirectTcpHost)){
          throw new Error("--local-port is not a number:" + redirectPortStr)
        }
        if(Number.isNaN(dockerSshPort)){
          throw new Error("--docker-ssh-port is not a number:" + dockerSshPortStr)
        }

        // const env = await readFile(pathResolve(
        //   __dirname, "../../../development/env-vars/hidden.local-dev.env"
        // ));
        // const config: { PRIVATE_KEY_FILE: string } = dotenv.parse(env) // will return an object
        const privateKeyBuff = await readFile(pathResolve(
          __dirname, "../../../development/tmp/docker_id_rsa"
        ));

        return await anotherGo({
          remoteSsh: {
            hostname: remoteSshHost,
            port: remoteSshPort
          },
          remoteLogin: {
            username: "localdev",
            password: "hello-world"
          },
          dockerSsh: {
            hostname: dockerSshHost,
            port: dockerSshPort
          },
          dockerLogin: {
            username: "localdev",
            password: "hello-world"
          },
          redirectTcp: {
            hostname: redirectTcpHost,
            port: redirectTcpPort
          }
        })

        const stepper = tunnelToDockerStepper({
          remoteSsh: {
            hostname: remoteSshHost,
            port: remoteSshPort
          },
          remoteLogin: {
            username: "localdev",
            password: "hello-world"
          },
          dockerSsh: {
            hostname: dockerSshHost,
            port: dockerSshPort
          },
          dockerLogin: {
            username: "localdev",
            password: "hello-world"
          },
          redirectTcp: {
            hostname: redirectTcpHost,
            port: redirectTcpPort
          }
        })

        stepper.on("remote ssh ready", ()=>{
          console.log("REMOTE SSH :: READY");
        })

        stepper.on(
          "remote ssh forward out", ({ remoteClient, remoteChannel })=>{
            console.log('REMOTE TCP :: FORWARD OUT SUCCESS:');
            console.log(
              "We should be able to use this channel to connect to the docker container"
            );
            console.log("remote client:", remoteClient)
            console.log("remote channel:", remoteChannel)
          }
        )
        stepper.on("docker ready", ()=>{
          console.log("DOCKER SSH :: READY");
        })
        stepper.on(
          "docker ssh forward in", ({ dockerClient, foundPort })=>{
            console.log("docker forward in ready")
            console.log("docker client:", dockerClient)
            console.log("docker port:", foundPort)
            console.log(
              "You should be able to access your server from:",
              `${foundPort}.${remoteSshHost}`
            )
          }
        )
        stepper.on(
          "tcp connection", (info)=>{
            console.log("DOCKER TCP :: READY")
            console.dir(info);
          }
        )
        stepper.on(
          "new tunnel", (channel, socket)=>{
            console.log("DOCKET TUNNEL :: SUCCESS")
            channel.on("close", ()=>{
              console.log("DOCKET TUNNEL :: SOURCE CLOSE")
            })
            socket.on("close", ()=>{
              console.log("DOCKET TUNNEL :: REDIRECT CLOSE")
            })
          }
        )
        await stepper.start();
        console.log("Finished initial steps")
        await stepper.waitToFullyFinish()
        console.log("Fully finished, should close now")
      } catch(e){
        if(e instanceof Error){
          switch(e.message){
            case ERROR_NO_DOCKER_IP: {
              console.error("Couldn't get docker ip");
              console.error("You may not be including a valid docker container name");
              console.error("use \"docker ps\" to find a valid container name");
              break;
            }
            default: {
              console.error("Unknown error");
              break;
            }
          }
        }
        throw e;
      }
    });
  }
}

if(isNodeEnvironment()){
  if(!hasParent(module)){
    const program = new SSHTunnelCommand();
    program.parse(process.argv);
    process.on("unhandledRejection", (e)=>{
      console.error(e);
      throw e;
    })
  } else {
    console.warn(
      "this module has parents, maybe it's getting added as a subcommand"
    );
  }
} else {
  console.log(
    "not sure what you plan to do with this but it intrigues me."
  )
}
