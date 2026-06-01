// server.js

const cluster = require('cluster');
const os = require('os');

const numCPUs = os.cpus().length;
console.log("Number of CPU core : " , numCPUs);
const PORT = process.env.PORT || 3000;


if (cluster.isPrimary) {

  console.log(`Primary process ${process.pid}`);
  console.log(`Starting ${numCPUs} workers`);

  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(
      `Worker ${worker.process.pid} died`
    );

    console.log("Starting replacement worker");
    cluster.fork();
  });

} else {

  const app = require('./app');
  app.get('/pid', (req, res) => {
    console.log(`Request handled by ${process.pid}`);
  res.send(`PID: ${process.pid}`);
});


  const server = app.listen(PORT, () => {
    console.log(
      `Worker ${process.pid} listening on ${PORT}`
    );
  });
server.keepAliveTimeout = 65000;
server.headersTimeout = 66000;
}
//did pm2 and clustering 