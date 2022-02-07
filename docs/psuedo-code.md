## Domain Requirements
- a wild card subdomain
  - something like *.dev.host.name
- ssl proxy server to pass the connection
  - this doesn't have ssl installed even though it may be a good idea
  - I might be able to test it without it though

## The dockerfile
- based on node
- install openssh-server
- start the openssh-server
- expose port 22 so people can ssh into it
  - I actually need to set the port to something other than 22
    - theres already an ssh server running on 22
  - perhaps 2222 is good enough
- load up the proxy server files and dependencies
- create a start command

## The client
- Forward localport to remote port
  - would like to get a remote port at random
    - `ssh 0:localhost:$LOCAL_PORT root@$REMOTE_ADDRESS`
    - but how do I save it as a variable after I'm done
- While in the remote server
  - get the docker containers ip address
    - the docker container needs a predictable name
    - `sudo docker inspect -f "{{ .NetworkSettings.IPAddress }}" $CONTAINER_NAME`
    - save it to `$CONTAINER_IP`
  - `ssh -p $CUSTOM_SSHD_PORT $RANDOM_PORT:localhost:$RANDOM_PORT root@$CONTAINER_IP`
  - we should be good

## Proxy server
- Recieves calls on port 80
- probably should make sure the person has some sort of authentication
  - this may use cookies, so the person should be notified
- `const port = Number.parseInt(host.split(".")[0])`
  - may want to ensure the host is correct
    - can do this by setting an environment variable
  - it should not be accessible by anythingh but ssh and the proxy server
  - If theres an error, end the connection
- Ensure the port is greater than 0 and less than max (2^16 -1 i believe)
  - if not - end the connection
- checks if the found ip is active
  - https://www.npmjs.com/package/tcp-port-used
  - if not end the connection
- passes the connection to that port
  - since the port should be done over ssh, it should be encrypted
