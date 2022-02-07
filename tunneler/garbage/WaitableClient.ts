import { Client } from "ssh2";
import { EventEmitter } from "events";
import { eventToPromise } from "../util/promise";
import { uniqueId } from "../util/id";

export interface IWaitable {
  waitToConnect(): Promise<void>
  isClosed: boolean;
}

export const ERROR_ClientClosed = "client is closed";

const SymWaitable = Symbol("Waitable Property");
type HasWaitable<T> = T & { [SymWaitable]: string };

type WaitingStatus = {
  resolved: boolean,
  isError: boolean,
  result: any,
  waiting: Array<[()=>any, (e?: any)=>any]>,
}

const waiters: { [key: string]: WaitingStatus } = {}

function getStatus(uEe: EventEmitter){
  const ee = uEe as HasWaitable<EventEmitter>
  if(!(SymWaitable in ee)){
    ee[SymWaitable] = uniqueId()
    waiters[ee[SymWaitable]] = {
      resolved: false,
      isError: true,
      result: void 0,
      waiting: [],
    }
  }
  return waiters[ee[SymWaitable]]
}

export function bindToListeners(ee: EventEmitter){
  ee.on("close", ()=>{
    const status = getStatus(ee);
    status.resolved = false;
    status.isError = true;
    status.result = void 0
  })
  eventToPromise(
    ee, "ready", ()=>(void 0)
  ).then(()=>{
    const status = getStatus(ee);
    status.resolved = true;
    status.isError = false
    console.log("waiting resolved:", status.waiting);
    status.waiting.forEach(([res, _])=>{
      res()
    })
    status.waiting.length = 0
  }, (error)=>{
    const status = getStatus(ee);
    console.error("error waiting:", error)
    status.resolved = true;
    status.result = error;
    console.log("waiting error:", status.waiting);
    status.waiting.forEach(([_, rej])=>{
      rej(error)
    })
    status.waiting.length = 0
  })
}

export function waitToConnect(ee: EventEmitter){
  return new Promise<void>((res, rej)=>{
    const status = getStatus(ee);
    if(status.resolved){
      if(status.isError) return rej(status.result);
      return res();
    }
    status.waiting.push([res, rej]);
  })
}

export function isClosed(ee: EventEmitter){
  const status = getStatus(ee);
  return !!status.resolved;
}

export class WaitableClient<C = {}> extends Client<C> implements IWaitable {
  constructor(){
    super();
    bindToListeners(this);
  }

  waitToConnect(){
    return waitToConnect(this);
  }
  get isClosed(){
    return isClosed(this)
  }
}
