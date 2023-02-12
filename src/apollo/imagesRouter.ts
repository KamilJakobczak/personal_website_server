import express from 'express';
import path from 'path';
import { coverResize } from '../utility/coverResize';
import fs from 'fs';
export const imagesRouter = express.Router();
const imagesDir = path.join(__dirname, '..', '..', 'images');

imagesRouter.use((req, res, next) => {
  {
    console.log('Time: ', Date.now());

    next();
  }
});

imagesRouter.get('/covers/:bookId/:file', async (req, res) => {
  const { bookId, file } = req.params;
  const coversPath = path.join(imagesDir, 'covers');
  const filePath = path.join(coversPath, bookId, `${file}`);

  const fileExists = fs.existsSync(filePath);

  if (fileExists) {
    res.sendFile(filePath);
  } else {
    console.log('Something went wrong with preparing the cover for this one');
    res.send('Something went wrong with preparing the cover for this one');
  }

  coverResize(filePath);
});
