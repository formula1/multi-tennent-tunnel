
https://devconnected.com/docker-exec-command-with-examples/



# SSH and ports
- https://askubuntu.com/questions/958440/can-not-change-ssh-port-server-16-04
- https://www.computerworld.com/article/2693453/running-ssh-on-a-non-standard-port.html
- https://www.whitesourcesoftware.com/free-developer-tools/blog/docker-expose-port/
- https://github.com/linuxserver/docker-openssh-server/issues/34

I believe I need to change the ssh port for my dev-proxy.
Exposing it as 22 would run into issues in my real server since it already uses port 22.
This can be achieved with docker run -p $MY_PORT:$CONTAINER_PORT. So I can let it be default but still make sure it doesn't conflict with the other ssh-server. docker-compose supports it as well but I wasn't sure about docker. But we'll keep the file `/garbage/sshd_config` for future reference. Who knows if it would become useful.
