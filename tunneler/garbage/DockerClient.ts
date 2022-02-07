import { ensureValidPort } from "../validators/url"
import { ERROR_NO_DOCKER_IP } from "../errors";
import { WaitableClient } from "./WaitableClient";
import { execPromise } from "../util/child_process"

type ConnectionConfig = {
  dockerHost: string,
  dockerPort: number,
  username: string,
  password: string,
  desiredPort: number
}

type TypeOfClassMethod<T, M extends keyof T> = T[M] extends Function ? T[M] : never;

type WaitableInstance = InstanceType<typeof WaitableClient>

interface DockerListeners {
  "new forward": (foundPort: number)=>any
}

export class DockerClient
  extends WaitableClient<DockerListeners>{
  private config: ConnectionConfig;
  constructor(connectionConfig: ConnectionConfig){
    super();
    ensureValidPort(connectionConfig.dockerPort);
    ensureValidPort(connectionConfig.desiredPort);
    this.config = connectionConfig;

    this.on('ready', () => {
      console.log('Client :: ready');
      this.forwardIn("127.0.0.1", 0, (err, foundPort) => {
        if(err){
          this.emit("error",err);
          this.end();
          return;
        }
        this.emit("new forward", foundPort)
      });
    })
  }

  connect(){
    throw new Error("Please use .waitToConnect()")
    return this;
  }
  async waitToConnect(){
    // const dockerIP = await getDockerIP(this.config.containerName)
    // console.log("this is the ip address but we won't be using it:", dockerIP);
    // console.log("Fortunately, the compose file should have exposed the port to the system")
    // console.warn("And you should not expose that port to the outside world!");
    super.connect({
      port: this.config.dockerPort,
      host: this.config.dockerHost,
      username: this.config.username,
      password: this.config.password
    })
    return super.waitToConnect();
  }
}


const BASE_IP_LOC = "{{ .NetworkSettings.IPAddress }}";
const NESTED_IP_LOC = "{{ .NetworkSettings.Networks.server_default.IPAddress }}";

/^\s/
async function getDockerIP(containerName: string){
  console.log("containerName:", containerName);
  var result = await execPromise(
    `docker inspect -f "${BASE_IP_LOC}" "${containerName}"`
  );
  result.stdout = result.stdout.replace(/^\s+|\s+$/g, '');
  console.log("initial promise:", result);
  if(result.stdout !== ""){
    return result.stdout;
  }
  result = await execPromise(
    `docker inspect -f "${NESTED_IP_LOC}" "${containerName}"`
  );
  result.stdout = result.stdout.replace(/^\s+|\s+$/g, '');
  console.log("second promise:", result);
  if(result.stdout !== ""){
    return result.stdout;
  }
  throw new Error(ERROR_NO_DOCKER_IP);
}
