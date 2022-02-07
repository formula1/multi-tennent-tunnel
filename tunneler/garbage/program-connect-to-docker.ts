

const dockerClient = redirectDockerConnections({
  dockerUsername, dockerPassword,
  dockerHost, dockerSshPort,
  desiredDockerPort: localPort,
  localHostname: localTcpAddress, localPort
});
dockerClient.on("new forward", (foundport)=>{
console.log("website available at", foundport + ".dev.localhost.test")

})
await dockerClient.waitToConnect();


const conn = new TunnelClient({
  address: localHost,
  port: localPort
});
conn.connect({
  host: remoteAddress,
  port: remoteSSHPort,
  username: username,
  password: password
});
await conn.waitToConnect();
