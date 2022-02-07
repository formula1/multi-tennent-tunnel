# syntax=docker/dockerfile:1
FROM node:16
RUN apt update
RUN apt install openssh-server -y
COPY ./sshd_config /etc/ssh/sshd_config
EXPOSE 80
EXPOSE 2222
RUN apt install net-tools vim -y
RUN useradd localdev
RUN echo localdev:"hello-world" | chpasswd

USER root
COPY ./start.sh ./start.sh
RUN ["chmod", "+x", "./start.sh"]
RUN chmod 744 ./start.sh
CMD ["bash", "./start.sh"]
# ENTRYPOINT ["sh", "-c", "echo \"hello-world\" && service ssh start && npm run dev-watch"]

#WORKDIR /app
#COPY ./src ./src
#COPY ./package.json ./package.json
#COPY ./tsconfig.json ./tsconfig.json
#RUN npm install
#EXPOSE 80
#ENTRYPOINT ["npm", "run", "dev-start"]
