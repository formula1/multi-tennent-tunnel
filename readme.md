# Multi Tennent Tunnel

I recently made some changes to some of my other modules so probably isn't working

# Next Steps

- Right now the ssh server that I'm using is ok but it requires more installs and etc
- I think I'm better off just using ssh2's server, that way all the containers can be based off the same image meaning less to install

# The Basic Idea

- The tunneler runs a simple script to tunnel in. The tunneler provides it with
  - The remote hostname
  - The ssh port of the docker container that we will tunnel into
    - the docker container can't listen on port 22 as that would interfere with the servers ssh
  - the local portname
- From ther the tunnel script
  - sshs into the remote host
  - sshs again into the docker container
  - then forward Ins all connections on a random port to the local port
  - the script then echos the random port for the tunneler
- From there they can access their tunnel through
  - `https://$FOUND_PORT.tunnel.website.me`

- There should be a hostname resolver in front of this
  - We add a wildcard hostname that targets this server
  - something like *.tunnel.website.me
  - The hosthame resolves the wildcard and proxies to the tunnel container
- The tunnel recieves the request and checks if the port is in use
  - if not, it just closes the connection
  - if yes, it pipes the data to the port and pipes the data from the port
