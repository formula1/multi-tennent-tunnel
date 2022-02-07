import { Client } from "ssh2";
import { ForwardInListeners, EVENT_ForwardIn } from "./ForwardInClient";
import { ForwardOutListeners, EVENT_ForwardOut } from "./ForwardOutClient";
import { promisify } from "util";
import { TypeUrlHost } from "../types/url";

const EVENT_NewSsh = "new sub ssh";

interface SubSshListeners extends ForwardInListeners, ForwardOutListeners {
  [EVENT_NewSsh]: (client: Client)=>any,
}

type SubSshArgs = {
  forwardIn: TypeUrlHost
  targetSsh: TypeUrlHost,
}

export class SubSshClient<C={}> extends Client<C & SubSshListeners> {
  constructor(target: TypeUrlHost){
    super()
    this.on("ready", async ()=>{
      try {
        const foundPort = await promisify(this.forwardIn.bind(this))(
          "127.0.0.1", 0
        )
        this.emit(EVENT_ForwardIn, foundPort)
        const channel = await promisify(this.forwardOut.bind(this))(
          "127.0.0.1", foundPort,
          target.hostname, target.port,
        );
        this.emit(EVENT_ForwardOut, channel)
      }catch(err){
        this.emit("error",err);
        this.end();
      }
    })
  }
}
