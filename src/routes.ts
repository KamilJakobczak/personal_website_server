import * as express from 'express';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import session from 'express-session';
import MongoStore from 'connect-mongo';

interface Cell {
  id: string;
  content: string;
  type: 'text' | 'code';
}

interface LocalApiError {
  code: string;
}

const mongoStore = MongoStore.create({
  mongoUrl:
    'mongodb+srv://jamardracken:ZdZtNR9jwoqbhRyO@cluster0.0d3ymvv.mongodb.net/sessions?retryWrites=true&w=majority',
  collectionName: 'coding_sessions',
  autoRemove: 'interval',
  autoRemoveInterval: 10,
  touchAfter: 24 * 3600,
  crypto: { secret: 'asdghjfjhf' }, //SET A SERIOUS ONE
});
export const codingSessions = session({
  store: mongoStore,
  secret: process.env.SECRET ? process.env.SECRET : 'dummy_secret', //SET A SERIOUS ONE
  saveUninitialized: false,
  resave: true,
  genid: function (req) {
    return uuidv4();
  },
  name: 'codingSession',
  cookie: {
    httpOnly: true,
    sameSite: 'strict',
    secure: false,
    maxAge: 1000 * 60 * 60 * 24 * 10,
  },
});
const sessionDir = path.join(__dirname, '..', 'sessions');
export const codingProjectRouter = express.Router();

codingProjectRouter.all('/', async (req, res, next) => {
  // console.log(req.session, 'req session router.use');
  // const session = req.session;
  // if (session) {
  //   console.log(session);
  // }
  console.log('Time: ', Date.now());
  res.header('Access-Control-Allow-Origin', 'https://localhost:3000');
  // res.header(
  //   'Access-Control-Allow-Headers',
  //   'Origin, X-Requested-With, Content-Type, Accept'
  // );
  // res.header('Access-Control-Allow-Credentials', 'true');
  next();
});

// router.all('/', codingSession, async (req, res, next) => {
//   {
//     console.log(req.sessionID);
//   }
// });
codingProjectRouter.get('/cells/session', async (req: any, res) => {
  const id = req.sessionID;
  const sessionPath = path.join(sessionDir, id);
  fs.writeFile(`${sessionPath}.json`, '');
  console.log(req.sessionID);
  // req.session.sessionId = id;
  const data = {
    sessionId: id,
  };
  res.send(data);
});

// codingProjectRouter.get('/cells/session', async (req: any, res) => {

// });

codingProjectRouter.get('/cells/:sessionId', async (req, res) => {
  // const isLocalApiError = (err: any): err is LocalApiError => {
  //   return typeof err.code === 'string';
  // };
  // const { sessionId } = req.params;
  // // console.log(sessionId, 'get cells id');
  // if (sessionId) {
  //   const filePath = path.join(sessionDir, sessionId);
  //   try {
  //     const result = await fs.readFile(`${filePath}.json`, {
  //       encoding: 'utf-8',
  //     });
  //     if (result) {
  //       res.send(JSON.parse(result));
  //     }
  //   } catch (err) {
  //     if (isLocalApiError(err)) {
  //       if (err.code === 'ENOENT') {
  //         await fs.writeFile(filePath, '[]', 'utf-8');
  //         res.send([]);
  //       }
  //     } else {
  //       throw err;
  //     }
  //   }
  // }
  //Make sure the cell storage exists
  // If it does not exist, add in a default list of cells4
  //read the file
  //parse a list of cells
  //send list of cells back to browser
});

codingProjectRouter.post('/cells/:sessionId', async (req, res) => {
  // console.log(req.params, req.body, req.sessionID);
  // if (req.session.sessionId === req.params.sessionId) {
  //   const { cells }: { cells: Cell[] } = req.body;
  //   const filename = path.join(sessionDir, req.params.sessionId);
  //   await fs.writeFile(`${filename}.json`, JSON.stringify(cells), 'utf-8');
  //   res.send({ status: 'ok' });
  // }
  // serialize them
  // write the cells into the file
});
