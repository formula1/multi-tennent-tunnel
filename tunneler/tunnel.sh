#! /bin/bash

# https://www.baeldung.com/linux/use-command-line-arguments-in-bash-script
# maybe i should do
# container_name:container_sshport local_hostname:local_port remote_hostname:remote_sshport

# ssh -R "$4":"$1":"$2" root@$3


# https://stackoverflow.com/questions/30078281/raise-error-in-a-bash-script/50265513

if [ "$#" -eq 0 ]; then
    echo "usage"
    echo "container_name:container_sshport local_hostname:localport remote_hostname:remote_sshport"
    echo "the local_hostname and remote_hostname are allowed to be ip addresses"
    echo "currently this doesn't support ipv6"
    exit 0
fi


DOCKER_ERROR_LOOK="first argument needs to look like \"container_name:ssh_server_port\""
DOCKER_ERROR="use \"docker ps\" to find a valid container name"

LOCAL_ERROR_LOOK="second argument needs to look like \"local_hostname:local_server_port\""

if [ "$1" == "" ]; then
  echo $DOCKER_ERROR_LOOK 1>&2
  echo $DOCKER_ERROR 1>&2
  exit 1
fi

if [ "$2" == "" ]; then
  echo $LOCAL_ERROR_LOOK 1>&2
  exit 1
fi

DOCKER=(`echo $1 | tr ':' ' '`)

if [ ${#DOCKER[*]} -ne 2 ]; then
  echo ${DOCKER[@]} 1>&2
  echo $DOCKER_ERROR_LOOK 1>&2
  echo $DOCKER_ERROR 1>&2
  exit 1
fi

DOCKER_PORT=${DOCKER[1]}

LOCAL=(`echo $2 | tr ':' ' '`)

if [ ${#LOCAL[*]} -lt 2 ]; then
  echo ${LOCAL[@]} 1>&2
  echo "local argument needs to look like \"local_hostname:local_port\"" 1>&2
  echo "This "
  exit 1
fi

joinByColon() {
  a=("$@")
  echo -n ${a[0]}
  # https://stackoverflow.com/questions/57585770/bash-for-loop-skip-first-element-of-array
  for i in "${a[@]:1}"
  do
    echo -n ':'$i
    # do whatever on "$i" here
  done
}

LOCAL_LAST=${#LOCAL[@]}-1
LOCAL_PORT=${LOCAL[$LOCAL_LAST]}
# https://stackoverflow.com/questions/44939747/bash-all-of-array-except-last-element
# https://stackoverflow.com/questions/1527049/how-can-i-join-elements-of-an-array-in-bash
unset LOCAL[$LOCAL_LAST]
# LOCAL_HOST=${LOCAL[@]::$LOCAL_LAST}
LOCAL_HOST=$(joinByColon "${LOCAL[@]}")
# LOCAL_HOST=$(printf "%s" "\:" "${LOCAL_HOST[@]/#/\:}")
# LOCAL_HOST=$(IFS="\:"; echo $LOCAL_HOST)

echo "LOCAL_HOST:"$LOCAL_HOST
echo "LOCAL_PORT:"$LOCAL_PORT

BASE_IP_LOC="{{ .NetworkSettings.IPAddress }}"
NESTED_IP_LOC="{{ .NetworkSettings.Networks.server_default.IPAddress }}"

DOCKER_IP=$(docker inspect -f "${BASE_IP_LOC}" ${DOCKER[0]})

# https://codefather.tech/blog/bash-unary-operator-expected/
if [ "$DOCKER_IP" == "" ]; then
  DOCKER_IP=$(docker inspect -f "$NESTED_IP_LOC" ${DOCKER[0]})
fi

# docker inspect -f ""{{ .NetworkSettings.IPAddress }}"" dev-proxy
# docker inspect -f "{{ .NetworkSettings.Networks.server_default.IPAddress }}" dev-proxy

echo $DOCKER_IP

if [ "$DOCKER_IP" == "" ]; then
  echo "Couldn't get docker ip" 1>&2
  echo "You may not be including a valid docker container name" 1>&2
  echo $DOCKER_ERROR 1>&2
  exit 1
fi

ssh -R -p $DOCKER_PORT "${LOCAL_PORT}:$LOCAL_HOST:${LOCAL_PORT}" root@$DOCKER_IP
