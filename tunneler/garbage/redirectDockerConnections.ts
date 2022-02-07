type RediDocConArg = {
  dockerUsername: string, dockerPassword: string,
  dockerHost: string, dockerSshPort: number,
  desiredDockerPort: number,
  localHostname: string, localPort: number
}

export function redirectDockerConnections({
  dockerUsername, dockerPassword,
  dockerHost, dockerSshPort,
  desiredDockerPort,
  localHostname, localPort
}: RediDocConArg){
  const dockerClient = new DockerClient({
    username: dockerUsername, password: dockerPassword,
    dockerHost: dockerHost,
    dockerPort: dockerSshPort,
    desiredPort: desiredDockerPort
  })
  dockerClient.on("tcp connection", async (info, accept, reject)=>{
    console.log('REMOTE TCP :: INCOMING CONNECTION:');
    console.dir(info);
    try {
      const { channel, socket } = await channelToLocalAddress(
        accept,
        reject,
        {
          address: localHostname,
          port: localPort
        }
      )
      console.log("LOCAL TCP :: READY")
      channel.on("close", ()=>{
        console.log("REMOTE TCP :: CLOSED")
      })
      socket.on("close", ()=>{
        console.log("LOCAL TCP :: CLOSED")
      })
    }catch(e){
      console.error("Error before connection:", e);
    }
  })
  return dockerClient;
}
