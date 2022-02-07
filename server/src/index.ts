import { Server as HttpServer, ServerResponse } from "http";
import ProxyServer from "http-proxy";
import tcpPortUsed from 'tcp-port-used';
import { Duplex } from "stream";

type ConstructorArgs = {
  minPort?: number,
  maxPort?: number,
}

const isNumber = /^\d+$/
// https://stackoverflow.com/questions/3363892/what-non-standard-ports-are-safe-to-use
export const MIN_SAFE_PORT = 1024;
export const MAX_PORT = Math.pow(2, 16) - 1;
export class DevProxy extends HttpServer {
  proxy: ProxyServer = new ProxyServer({ xfwd: true });
  private minPort = MIN_SAFE_PORT;
  private maxPort = MAX_PORT;
  constructor({ minPort, maxPort }: ConstructorArgs){
    super();
    if(typeof minPort === "number"){
      if(minPort < MIN_SAFE_PORT){
        throw new Error(
          "minPort must not be < " + MIN_SAFE_PORT + ", got " + minPort
        );
      }
      this.minPort = minPort;
    }
    if(typeof maxPort === "number"){
      if(maxPort > MAX_PORT){
        throw new Error(
          "maxPort must not be > " + MAX_PORT + ", got " + maxPort
        )
      }
      this.maxPort = maxPort;
    }
    this.proxy.on("error", function(err) {
        console.error("unkown error:", err);
        console.log(arguments);
    });
    this.on("upgrade", async (req, socket, head)=>{
      var port;
      try {
        port = await this.getPort(req.headers.host)
      }catch(e){
        console.error("error parsing port in ws:", e);
        return destroySocket(socket)
      }
      this.proxy.ws(req, socket, head, {
        ws: true,
        target: `ws://localhost:${port}`
      }, (e)=>{
        console.error("error with proxy in ws:", e);
        return destroySocket(socket)
      });
    });
    this.on("request", async (req, res)=>{
      var port;
      try {
        port = await this.getPort(req.headers.host)
      }catch(e){
        console.error("error parsing port in http:", e);
        return destroyResponse(res);
      }
      this.proxy.web(req, res, {
        target: `http://localhost:${port}`
      }, (e: any)=>{
        console.error("error with proxy in http:", e);
        // Note: the headers may have already been sent
        // Setting the status code may be useless
        destroyResponse(res);
      });
    });
  }
  private async getPort(host: any): Promise<number> {
    if(typeof host !== "string"){
      throw new Error(
        "invalid host"
      );
    }
    const portStr = host.split(".")[0];
    if(!isNumber.test(portStr)){
      throw new Error("recieved port is not a valid number:" + portStr)
    }
    const port = Number.parseInt(portStr)
    if(Number.isNaN(port)){
      throw new Error("Port is not a number");
    }
    if(port < this.minPort){
      throw new Error("port cannot be < " + this.minPort + ", got: " + port);
    }
    if(port > this.maxPort){
      throw new Error("port cannot be > " + this.maxPort + ", got: " + port);
    }
    const address = this.address();
    if(!address){
      throw new Error("We shouldn't recieve requests if not listening");
    }
    if(typeof address === "string"){
      throw new Error("I have no idea what's going on, this shouldn't happen");
    }
    if(port === address.port){
      throw new Error("can't connect to the server's own port");
    }
    if(!await tcpPortUsed.check(port)){
      throw new Error(
        "TCP port not in use, can't proxy it: " + port
      )
    }
    return port;
  }
}

function destroySocket(socket: Duplex){
  var i: NodeJS.Timeout | false = setTimeout(()=>{
    socket.destroy();
    i = false;
  }, 250);
  socket.end(()=>{
    if(i === false) return;
    clearTimeout(i);
    socket.destroy();
  })
}

function destroyResponse(res: ServerResponse){
  res.statusCode = 403;
  res.end();
}
