import { exec as execCallback, ExecOptions } from "child_process";

export function execPromise(
  command: string, options: Partial<ExecOptions> = {}
): Promise<{ stdout: string, stderr: string }>{
  return new Promise(function(res, rej){
    execCallback(command, options, (err, stdout, stderr)=>{
      if(err){
        return rej(err);
      }
      res({
        stdout: stdout,
        stderr: stderr
      })
    });
  })
}
