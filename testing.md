
## Setting up a server
- on the server
  - install docker
  - install docker-compose
  - enable port 80 and port 443 on host website
    - this might be different for each host
  - enable port 80 and port 443 on server
    - https://docs.rackspace.com/support/how-to/allow-web-traffic-in-iptables/
    - `sudo iptables -I INPUT -p tcp -m tcp --dport 80 -j ACCEPT`
    - `sudo iptables -I INPUT -p tcp -m tcp --dport 443 -j ACCEPT`
  - Allow port forwarding in /etc/ssh/sshd_config
    - `AllowTcpForwarding yes`
    - `GatewayPorts yes`
    - `PermitTunnel yes`
- locally
  - Start the localserver on port 5000
    - `sudo docker-compose up -f ./server/development/docker-compose.yml`
  - forward the port with
    - https://www.ssh.com/academy/ssh/tunneling/example
    - `ssh -v -R *:80:localhost:5000 root@45.76.66.62`


## Ensure it's working
- locally
  - `curl localhost:5000`
- on the server
  - `curl localhost:80`
- from a browser
  - go to http://45.76.66.62
