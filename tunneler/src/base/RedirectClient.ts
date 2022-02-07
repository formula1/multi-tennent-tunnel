import { ForwardInClient } from "./ForwardInClient"
import { Socket } from "net";
import { ensureValidPort } from "../validators/url"
import { channelToLocalAddress } from "./channelToLocalAddress";
import { TypeUrlHost } from "../types/url";
import { ClientChannel } from "ssh2";

type TCConstrArgs = {
  forwardIn: TypeUrlHost,
  redirect: TypeUrlHost
}

export const EVENT_NEW_TUNNEL = "new tunnel";

interface RedirectListeners {
  [EVENT_NEW_TUNNEL]: (channel: ClientChannel, socket: Socket)=>any
}

export class RedirectClient extends ForwardInClient<RedirectListeners> {
  private redirectConfig: TypeUrlHost;
  constructor(connectionConfig: TCConstrArgs){
    super(connectionConfig.forwardIn);
    ensureValidPort(connectionConfig.redirect.port);
    this.redirectConfig = connectionConfig.redirect;
    console.log("Are we a socket?", this instanceof Socket);
    this.on('tcp connection', async (_, accept, reject) => {
      try {
        const { channel, socket } = await channelToLocalAddress(
          accept,
          reject,
          this.redirectConfig
        )
        this.emit(EVENT_NEW_TUNNEL, channel, socket);
      }catch(e){
        console.error("Error before connection:", e);
      }
    })
  }

  setFutureConnectionLocation(config: TypeUrlHost){
    console.warn(
      "We can't change the past but we can direct the future.",
      "Future connections should connect to", config
    )
    ensureValidPort(config.port);
    this.redirectConfig = config;
  }
}
