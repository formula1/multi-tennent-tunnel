#!/usr/bin/expect
spawn ssh -p 2223 localdev@127.0.0.1
expect "password:"
sleep 1
send "hello-world\n"
sleep 1
ssh -R 0:localhost:8080 -p 2222 localdev@dev-proxy
expect "password:"
sleep 1
send "hello-world\n"
