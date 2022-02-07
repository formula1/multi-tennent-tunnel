
export const MIN_SAFE_PORT = 1024;
export const MAX_PORT = Math.pow(2, 16) - 1;
export function ensureValidPort(port: number){
  if(Number.isNaN(port)){
    throw new Error("Port is not a number");
  }
  if(port < MIN_SAFE_PORT){
    throw new Error("port cannot be < " + MIN_SAFE_PORT + ", got: " + port);
  }
  if(port > MAX_PORT){
    throw new Error("port cannot be > " + MAX_PORT + ", got: " + port);
  }

}
