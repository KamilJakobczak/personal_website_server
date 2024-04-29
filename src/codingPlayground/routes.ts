import * as express from 'express';
import fs from 'fs/promises';
import path from 'path';

interface Cell {
  id: string;
  content: string;
  type: 'text' | 'code';
}

interface LocalApiError {
  code: string;
}

const sessionDir = path.join(__dirname, '..', 'sessions');
export const codingProjectRouter = express.Router();

codingProjectRouter.all('/', async (req, res, next) => {
  console.log('Time: ', Date.now());
  res.header('Access-Control-Allow-Origin', 'https://localhost:3000');
  next();
});

codingProjectRouter.get('/cells/session', async (req: any, res) => {
  const id = req.sessionID;
  console.log(id);
  const sessionPath = path.join(sessionDir, id);
  if (!sessionPath) {
    fs.writeFile(`${sessionPath}.json`, '');
  }

  const data = {
    sessionId: id,
  };
  res.send(data);
});

codingProjectRouter.get('/cells/:sessionId', async (req, res) => {
  const isLocalApiError = (err: any): err is LocalApiError => {
    return typeof err.code === 'string';
  };
  const { sessionId } = req.params;

  if (sessionId) {
    const filePath = path.join(sessionDir, sessionId);
    try {
      const result = await fs.readFile(`${filePath}.json`, {
        encoding: 'utf-8',
      });

      console.log(result);
      res.send(JSON.parse(result));
    } catch (err) {
      if (isLocalApiError(err)) {
        if (err.code === 'ENOENT') {
          await fs.writeFile(filePath, '[]', 'utf-8');
          res.send([]);
        }
      } else {
        throw err;
      }
    }
  }
  //Make sure the cell storage exists
  // If it does not exist, add in a default list of cells4
  //read the file
  //parse a list of cells
  //send list of cells back to browser
});

codingProjectRouter.post('/cells/:sessionId', async (req, res) => {
  if (req.params.sessionId) {
    const { cells }: { cells: Cell[] } = req.body;
    const filename = path.join(sessionDir, req.params.sessionId);
    await fs.writeFile(`${filename}.json`, JSON.stringify(cells), 'utf-8');
    res.send({ status: 'ok' });
  }
  // serialize them
  // write the cells into the file
});
