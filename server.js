const http = require('http');
const Koa = require('koa');
const Router = require('koa-router');
const cors = require('@koa/cors');
const koaBody = require('koa-body').default;
const uuid = require('uuid');
const WS = require('ws');

const app = new Koa();
const router = new Router();

app.use(cors());

app.use(koaBody({
    text: true,
    urlencoded: true,
    multipart: true,
    json: true,
}));

// app.use(async ctx => {
//     const met = ctx.request['method'];
//     const { method, id } = ctx.request.query;
//     ctx.response.set('Access-Control-Allow-Origin', '*');
//     ctx.response.set('Access-Control-Allow-Methods', 'DELETE, PUT, PATCH, GET, POST');

//     if (!method) {
//         ctx.response.body = 'server response';
//         ctx.response.status = 204;
//     };
//     switch (method) {
//       // GET
//         case 'allTickets':
//     }
//   });

// app.use((ctx) => {
//     console.log(ctx.headers);
// });

app
  .use(router.routes())
  .use(router.allowedMethods());

const port = 7070;

const server = app.listen(port, (err) => {
    if (err) {
        console.error(err);
        return;
    };

    console.log('Сервер запущен порт: ' + port);
});

const wsServer = new WS.Server({ server });

// !!!!!!Старая верси кода!!!!!!
// const chat = ['Здоровеньки булы'];

// wsServer.on('connection', (ws) => {
//   ws.on('message', (message) => {
//     const messageText = message.toString('utf8')
//     chat.push(messageText);
    
//     console.log(messageText);
//     console.log(chat);

//     // const eventData = JSON.stringify({ chat: [message] });

//     const eventData = JSON.stringify({chat: [message.toString()]});

    
//     Array.from(wsServer.clients)
//       .filter(client => client.readyState === WS.OPEN)
//       .forEach(client => client.send(eventData))
//   });

//   ws.on('close', () => {

//   })

//   // ws.send(wsServer.clients);


  

//   ws.send(JSON.stringify({ chat }));
// });

const users = [];

wsServer.on('connection', (ws, req) => {
  ws.on('message', (message) => {
    const request = JSON.parse(message);

    if (request.event === 'login') {
      const nickname = users.findIndex((item) => item.name.toLowerCase() === request.message.toLowerCase());
      console.log(nickname);

      if (nickname !== -1) {
        ws.close(1000, 'error');
      }

      ws.name = request.message
      const userList = users.map((item) => item.name);
      ws.send(JSON.stringify(
        {
          event: 'connect',
          message: userList,
      }
      ));

      // console.log(ws)

      users.push(ws);
        users.forEach((item) => {
          const userMsg = JSON.stringify({
            event: 'system',
            message: {
              action: 'login',
              name: ws.name,
            }
          });
          item.send(userMsg);
        });
    }

    if (request.event === 'chat') {
      users.forEach(item => {
        const userMsg = JSON.stringify({
          event: 'chat',
          message: {
            name: ws.name,
            created: new Date(),
            text: request.message,
          }
      })
      item.send(userMsg);
      });
    }
  });

  ws.on('close', () => {
    const nickname = users.findIndex(item => item.name === ws.name);
    if (nickname !== -1) {
      users.splice(nickname, 1);
      users.forEach(item => {
        const userMsg = JSON.stringify({
          event: 'system',
          message: {
            action: 'logout',
            name: ws.name,
          }
        });
        item.send(userMsg);
      })
    }
  })
});