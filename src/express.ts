import express from 'express';
import bodyParser from 'body-parser';
import { createCellsRouter } from './routes';
import { collectionRouter } from './apollo/routes';
import { imagesRouter } from './apollo/imagesRouter';
import { uploadRouter } from './apollo/uploadRouter';

import { sessionConfig } from './sessions';

export const app = express();

app.use(function (req, res, next) {
  {
    console.log('Time: ', Date.now());

    next();
  }
});

// export const requireAuth = (req: any, res: any, next: any) => {
//   const { user } = req.session;
//   if (!user) {
//     return res.status(401).json({ message: 'not logged in' });
//   }
//   next();
// };

app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/api/projects/coding', createCellsRouter());
app.use('/api/images', imagesRouter);

app.use(sessionConfig);

app.use('/api/graphql', collectionRouter);

app.use('/api/upload', uploadRouter);
