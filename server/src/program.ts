
import { Command } from "commander";
import { hasParent } from "./util/module";
import { DevProxy, MIN_SAFE_PORT, MAX_PORT } from "./index";

type Options = {
  port: string,
  minPort: string,
  maxPort: string,
}

export class DevProxyCommand extends Command {
  constructor(){
    super();
    this.option(
      "-p, --port <port>",
      [
        "The port the dev proxy should run on.",
      ].join(" "),
      "80"
    ).option(
      "-mnp, --min-port <minimum-port>",
      [
        "The minimum port that the client can connect to.",
        "Must be greater than or equal to " + MIN_SAFE_PORT
      ].join(" "),
      MIN_SAFE_PORT.toString()
    ).option(
      "-mxp, --max-port <maximum-port",
      [
        "The maximum port that the client can connect to.",
        "Must be less than or equal to " + MAX_PORT,
      ].join(" "),
      MAX_PORT.toString()
    ).option(
      "-r, --ranges [ranges...]",
      [
        "Ranges of ports to prevent access to. You can specify multiple.",
        "Should be in the format of $START_PORT:$END_PORT.",
        "Example: -r 2000:3000 4000:5000 6000:7000",
        "This feature hasn't been implemented yet."
      ].join(" ")
    ).action((options: Options)=>{
      const port = Number.parseInt(options.port);
      (new DevProxy({
        minPort: Number.parseInt(options.minPort),
        maxPort: Number.parseInt(options.maxPort)
      })).listen(port, ()=>{
        console.log("dev-proxy listening on http://localhost:" + port);
      });
    });
  }
}
if(
  typeof module !== "undefined"
  &&
  typeof process !== "undefined"
  &&
  typeof require !== "undefined"
){
  if(!hasParent(module)){
    process.on("uncaughtException", (e)=>{
      console.error("uncaughtException:", e)
    });
    process.on("ununhandledRejection", (e)=>{
      console.error("unhandledRejection:", e)
    });
    (new DevProxyCommand()).parse(process.argv);
  } else {
    console.warn(
      "this module has parents, maybe it's getting added as a subcommand"
    );
  }
} else {
  console.log(
    "not sure what you plan to do with this but it intrigues me."
  )
}
