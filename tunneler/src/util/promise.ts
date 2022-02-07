import { EventEmitter } from "events";


export function eventToPromise(ee: EventEmitter, successEvent: string|symbol, start: ()=>any){
  return new Promise((res, rej)=>{
    const l = [
      (err: any)=>{
        ee.off(successEvent, l[1])
        rej(err);
      },
      (...results: Array<any>)=>{
        ee.off("error", l[0]);
        if(results.length === 0) return res(void 0);
        if(results.length === 1) return res(results[0]);
        res(results);
      }
    ]
    ee.once("error", l[0])
    ee.once(successEvent, l[1]);
    start();
  });
}


type StateName = string|symbol;
type RunnableResult = {
  nextState: StateName | void,
  result: any
};
type Runnable = ()=>RunnableResult | Promise<RunnableResult>;
type TypeStateRunner = {
  name: StateName,
  fn: Runnable
};
type TypeStateRunners = {
  [key: StateName]: TypeStateRunner
}

enum RunningState {
  stopped,
  running,
}

const Error_MutateWhileRunning = "Mutating the states while running is dangerous";
const SymEmit = Symbol("state machine emit");
export class StateMachine extends EventEmitter {
  private runners: TypeStateRunners;
  private state: RunningState = RunningState.stopped;
  private noMoreStatesWaiters: Array<[(n: void)=>any, (e?: any)=>any]> = []
  private finishWaiters: Array<[(n: void)=>any, (e?: any)=>any]> = []
  private [SymEmit] = (event: StateName, ...args: Array<any>)=>{
    console.log("new event:", event);
    super.emit(event, ...args);
  }
  refs: { [key: StateName]: number } = {}

  constructor(runners: TypeStateRunners){
    super();
    this.runners = runners;
  }
  waitForStateFinish(){
    return new Promise((res, rej)=>{
      this.noMoreStatesWaiters.push([res, rej]);
    })
  }
  waitToFullyFinish(){
    return new Promise((res, rej)=>{
      this.finishWaiters.push([res, rej])
    })
  }
  start(initialState: StateName){
    if(this.state === RunningState.running){
      return this.waitForStateFinish();
    }
    // Hopefully the waiter is added before the next promise resolved
    const waiter = this.waitForStateFinish();
    Promise.resolve().then(()=>{
      return this.resolveState(initialState)
    })
    return waiter;
  }
  addState(stateName: StateName, fn: Runnable){
    if(this.state === RunningState.running){
      throw new Error(Error_MutateWhileRunning)
    }
    if(stateName in this.runners){
      throw new Error("state name is already in runners: " + stateName.toString())
    }
    this.runners[stateName] = {
      name: stateName, fn: fn
    }
  }
  updateState(stateName: StateName, fn: Runnable){
    if(this.state === RunningState.running){
      throw new Error(Error_MutateWhileRunning)
    }
    if(!(stateName in this.runners)){
      throw new Error("state name is not in runners: " + stateName.toString())
    }
    this.runners[stateName] = {
      name: stateName, fn: fn
    }
  }
  setState(statename: StateName, fn: Runnable){
    if(this.state === RunningState.running){
      throw new Error(Error_MutateWhileRunning)
    }
    this.runners[statename] = {
      name: statename, fn: fn
    }
  }
  deleteState(state: StateName){
    if(this.state === RunningState.running){
      throw new Error(Error_MutateWhileRunning)
    }
    delete this.runners[state];
  }
  emit(){
    throw new Error("Cannot emit externally");
    return false;
  }
  refOnce(event: StateName){
    const ref = this.ref(event);
    return (...args: Array<any>)=>{
      ref.emit(...args);
      ref.finish();
    }
  }
  ref(event: StateName){
    var finished = false;
    if(!(event in this.refs)) this.refs[event] = 0
    this.refs[event]++
    return {
      emit: (...args: Array<any>)=>{
        if(finished){
          throw new Error("This ref has already been finished")
        }
        this[SymEmit](event, ...args);
      },
      finish: ()=>{
        if(finished) return;
        finished = true;
        this.refs[event]--
        if(this.refs[event] === 0) delete this.refs[event];
        this.tryToFinish()
      }
    }
  }
  private async resolveState(initialStateName: StateName){
    try {
      this.state = RunningState.running
      var previousName: StateName | void;
      var stateName: StateName | void = initialStateName;
      do{
        if(!(stateName in this.runners)){
          throw new Error(
            [
              "got a state name that does not exist in the supplied runners.",
              !previousName ? "" : "previous state name: " + (previousName).toString(),
              "next state name: " + stateName.toString()
            ].join("\n")
          )
        }
        previousName = stateName;
        var state: TypeStateRunner = this.runners[stateName];
        const result = await state.fn();
        this[SymEmit](stateName, result.result);
        stateName = result.nextState
      }while(stateName !== void 0);
      this.state = RunningState.stopped
      console.log("waiters resolved:", this.noMoreStatesWaiters);
      this.noMoreStatesWaiters.forEach(([res, _])=>{
        res()
      })
      this.noMoreStatesWaiters.length = 0
      this.tryToFinish();
    }catch(error){
      this.state = RunningState.stopped
      console.error("error:", error)
      this.noMoreStatesWaiters.forEach(([res, _])=>{
        res()
      })
      this.noMoreStatesWaiters.length = 0
      this.finishWaiters.forEach(([_, rej])=>{
        rej(error)
      })
      this.finishWaiters.length = 0
      this.refs = {}
      this[SymEmit]("error", error);
    }
  }
  private tryToFinish(){
    if(this.state !== RunningState.stopped) return;
    if(Object.keys(this.refs).length > 0) return;
    this.finishWaiters.forEach(([res, _])=>{
      res()
    })
    this.finishWaiters.length = 0
    this.refs = {}
  }
}

type StepRunner = {
  name: StateName,
  fn: ()=>any
};
export class StepMachine extends StateMachine {
  private firstStateName: StateName;
  constructor(steps: Array<StepRunner>){
    super({})
    if(steps.length === 0){
      throw new Error("need at least 1 step");
    }
    this.firstStateName = steps[0].name
    const lastIndex = steps.length - 1;
    steps.forEach((step, index)=>{
      this.addState(
        step.name,
        index === lastIndex ? async ()=>({
          nextState: void 0,
          result: await step.fn()
        }) : async ()=>({
          nextState: steps[index + 1].name,
          result: await step.fn()
        })
      )
    });
  }
  start(){
    return super.start(this.firstStateName)
  }
}
