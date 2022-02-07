import { Client } from "ssh2";
import { promisify } from "util";
import { TypeUrlHost } from "../types/url";

export const EVENT_ForwardIn = "new forward in";

export interface ForwardInListeners {
  [EVENT_ForwardIn]: (foundPort: number)=>any
}

export class ForwardInClient<C> extends Client<C & ForwardInListeners> {
  constructor(args: TypeUrlHost){
    super()
    this.on("ready", async ()=>{
      try {
        const foundPort = await promisify(this.forwardIn.bind(this))(
          args.hostname, args.port
        )
        this.emit(EVENT_ForwardIn, foundPort)
      }catch(err){
        this.emit("error",err);
        this.end();
      }
    })
  }
}
