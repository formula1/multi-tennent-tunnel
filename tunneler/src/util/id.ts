

export function uniqueId(){
  return Date.now().toString(32) + "_" + Math.random().toString(32).substring(2);
}
