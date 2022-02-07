

export function getClassesOfInstance(obj: any){
  if(typeof obj !== "object"){
    return false;
  }
  if(typeof obj === "function") return false;
  if(Array.isArray(obj)) return [Array];
  const found: Array<any> = [];
  return found
}


type ClassFn = (
  Function & {
    prototype: {
      __proto__: ClassFn | Object
    }
  }
)
export function collectParentsOfClass(proto: ClassFn){
  const found: Array<ClassFn> = [];
  while((proto as ClassFn | Object) !== Object){
    found.push(proto);
    proto = proto.prototype.__proto__
  }

  return found
}
