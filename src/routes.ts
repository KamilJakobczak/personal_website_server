import express from 'express';
import fs from 'fs/promises';
import { v4 } from 'uuid';
import path from 'path';

interface Cell {
  id: string;
  content: string;
  type: 'text' | 'code';
}

interface LocalApiError {
  code: string;
}

export const createCellsRouter = () => {
  const router = express.Router();
  router.use((req, res, next) => {
    {
      console.log('Time: ', Date.now());

      next();
    }
  });

  const sessionDir = path.join(__dirname, '..', 'sessions');

  router.get('/cells/session', async (req, res) => {
    const id = v4();
    const sessionPath = path.join(sessionDir, id);
    fs.writeFile(`${sessionPath}.json`, '');
    res.cookie('sessionId', id, {
      maxAge: 90000000,
      httpOnly: false,
      secure: false,
    });
    res.send({
      sessionId: id,
    });
  });
  router.get('/cells/:sessionId', async (req, res) => {
    const isLocalApiError = (err: any): err is LocalApiError => {
      return typeof err.code === 'string';
    };
    const { sessionId } = req.params;
    console.log(sessionId);
    const filePath = path.join(sessionDir, sessionId);
    try {
      const result = await fs.readFile(`${filePath}.json`, {
        encoding: 'utf-8',
      });
      if (result) {
        res.send(JSON.parse(result));
      }
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
    //Make sure the cell storage exists
    // If it does not exist, add in a default list of cells4
    //read the file
    //parse a list of cells
    //send list of cells back to browser
  });

  router.post('/cells/:sessionId', async (req, res) => {
    if (req.cookies.sessionId === req.params.sessionId) {
      const { cells }: { cells: Cell[] } = req.body;
      const filename = path.join(sessionDir, req.params.sessionId);
      await fs.writeFile(`${filename}.json`, JSON.stringify(cells), 'utf-8');
      res.send({ status: 'ok' });
    }

    //serialize them

    //write the cells into the file
  });
  return router;
};
