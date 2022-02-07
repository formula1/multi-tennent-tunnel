import { ClientChannel } from "ssh2";
import { eventToPromise } from "../util/promise"
import { Socket } from "net"
import { TypeUrlHost } from "../types/url";

export async function channelToLocalAddress(
  accept: ()=>ClientChannel,
  reject: ()=>any,
  config: TypeUrlHost
){
  const socket = new Socket();
  try {
    await eventToPromise(socket, "connect", ()=>{
      socket.connect(config.port, config.hostname)
    })

  }catch(e){
    return reject();
  }
  console.log("connected")
  const channel = accept();
  socket.pipe(channel).pipe(socket);
  return {
    channel, socket
  };
}
