import { Socket } from "net"

const socket = new Socket();
socket.emit("hello world")

import { EventEmitter } from "events"


interface ExampleListeners extends KeyListener {
  "hello": ["a"]
  "world": ["a"]
}

const see: ITypedEmitter<ExampleListeners> = new EventEmitter()

see.on("poop", ()=>{

})

class ChildEmitter extends EventEmitter implements TypedEmitter<ExampleListeners> {
}

const c = new ChildEmitter();
c.on("swsw", ()=>{

})
c.emit("ello", "b");

type ExampleEmitter = EventEmitter & TypedEmitter<ExampleListeners>



class ExtendedEmitter extends ExampleEmitter {

}



const ee = new ExampleEmitter();


interface ITypedEmitter<C extends KeyListener = {}> extends EventEmitter {
  on: (
    <T extends keyof Omit<C, number>>(
      event: T, listener: (...args: C[T])=>void
    )=>this
  )
  addListener: (
    <T extends keyof Omit<C, number>>(
      event: T, listener: (...args: C[T])=>void
    )=>this
  )
  emit: (
    <T extends keyof Omit<C, number>>(
      event: T, ...args: C[T]
    )=>boolean
  )
  off: (
    <T extends keyof Omit<C, number>>(
      event: T, listener: (...args: C[T])=>void
    )=>this
  )
  removeListener: (
    <T extends keyof Omit<C, number>>(
      event: T, listener: (...args: C[T])=>void
    )=>this
  )
}


type EventName = string | symbol;
type AnyArgs = Array<any>

interface KeyListener {
  [key: string]: Array<any>
  [key: symbol]: Array<any>
}

function v<O extends KeyListener, T extends keyof O>(o: O): T{
  return Object.keys(o)[0];
}


type BaseListener = (...args: Array<any>)=>void

class TypedEmitter<O extends KeyListener> extends EventEmitter {
  on<T extends keyof Omit<C, number>>(
    event: T, listener: (...args: C[T])=>void
  ){
    super.on(event, listener as BaseListener);
    return this
  }
  addListener<T extends keyof Omit<C, number>>(
    event: T, listener: (...args: C[T])=>void
  ){
    super.addListener(event, listener as BaseListener)
    return this
  }
  emit<T extends keyof Omit<C, number>>(
    key: T, ...args: C[T]
  ){
    return super.emit(key, ...args)
  }
  off<T extends keyof Omit<C, number>>(
    event: T, listener?: (...args: C[T])=>void
  ){
    super.off(event, listener as BaseListener);
    return this;
  }
  removeListener<T extends keyof Omit<C, number>>(
    event: T, listener: (...args: C[T])=>void
  ){
    super.removeListener(event, listener as BaseListener);
    return this;
  }
}

interface HelloWorldListeners extends KeyListener {
  "hello": ["a"]
  "world": ["b"]
}


const te = new TypedEmitter<HelloWorldListeners>();

te.on("hello", (a)=>{

})

te.emit("hello", "a");




te.on("poop", (a)=>{
  return a * a
})
