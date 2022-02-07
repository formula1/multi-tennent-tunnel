import { Client } from "ssh2";
import { promisify } from "util";
import { TypeUrlHost } from "../types/url";
import { Channel } from "ssh2";

export const EVENT_ForwardOut = "new forward out";

export interface ForwardOutListeners {
  [EVENT_ForwardOut]: (channel: Channel)=>any
}

type ForwardOutArgs = {
  src: TypeUrlHost,
  dest: TypeUrlHost,
  reconnect?: boolean
}

export class ForwardOutClient<C> extends Client<C & ForwardOutListeners> {
  private open: boolean = false;
  reconnect: boolean;
  constructor({ src, dest, reconnect }: ForwardOutArgs){
    super()
    this.reconnect = !!reconnect;
    this.forwardOut = this.forwardOut.bind(this);
    const connect = async ()=>{
      try {
        console.log(src, dest)
        const channel = await promisify(this.forwardOut)(
          src.hostname, src.port,
          dest.hostname, dest.port,
        );
        channel.on("close", ()=>{
          if(this.reconnect && this.open) connect();
        })
        this.emit(EVENT_ForwardOut, channel)
      }catch(err){
        this.emit("error",err);
        this.end();
      }
    }
    this.on("close", ()=>{
      // hopefully the client closes before the channel
      this.open = false;
    })
    this.on("ready", ()=>{
      this.open = true;
      connect();
    });
  }
}
