import { Client } from 'ssh2';
import { Socket } from "net";

const conn1 = new Client();
const conn2 = new Client();

// Checks uptime on 10.1.1.40 via 192.168.1.1

conn1.on('ready', () => {
  console.log('FIRST :: connection ready');
  // Alternatively, you could use something like netcat or socat with exec()
  // instead of forwardOut(), depending on what the server allows
  conn1.on("tcp connection", (info, accept, reject)=>{
    const socket = new Socket();
    socket.on("connect", ()=>{
      console.log("connected")
      const channel = accept();
      socket.pipe(channel).pipe(socket);
    })
    socket.on("error", ()=>{
      reject()
    })
    socket.connect(8080, "127.0.0.1")
  })
  conn1.forwardIn("127.0.0.1", 0, (err, foundPort)=>{
    if (err) {
      console.log('FORWARD IN :: error: ' + err);
      return conn1.end();
    }
    console.log("connection available at:", foundPort);
    conn1.forwardOut('127.0.0.1', 0, 'dev-proxy', 2222, (err, stream) => {
      if (err) {
        console.log('FORWARD OUT :: error: ' + err);
        return conn1.end();
      }
      conn2.connect({
        sock: stream,
        username: 'localdev',
        password: 'hello-world',
      });
    });

    // conn1.shell((err, stream) => {
    //   if (err) {
    //     console.log('SECOND :: exec error: ' + err);
    //     return conn1.end();
    //   }
    //   stream.on('data', (data: Buffer) => {
    //     const str = data.toString();
    //     if(/'s password\:/.test(str)){
    //       stream.write("hello-world\n");
    //     }
    //     console.log(data.toString());
    //   });
    //   stream.write(
    //     "ssh -R "+foundPort+":localhost:"+foundPort+" -p 2222 localdev@dev-proxy\n"
    //   );
    // })
  });

}).connect({
  host: '127.0.0.1',
  port: 2223,
  username: 'localdev',
  password: 'hello-world',
});

conn2.on('ready', () => {
  // This connection is the one to 10.1.1.40

  console.log('SECOND :: connection ready');
  conn2.exec('uptime', {}, (err, stream) => {
    if (err) {
      console.log('SECOND :: exec error: ' + err);
      return conn1.end();
    }
    stream.on('close', () => {
      conn1.end(); // close parent (and this) connection
    }).on('data', (data: Buffer) => {
      console.log(data.toString());
    });
  });
});
