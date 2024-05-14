import express from 'express';
import path from 'path';
import { coverResize } from '../utility/coverResize';
import fs from 'fs';
import sharp from 'sharp';
import multer from 'multer';

export const imagesRouter = express.Router();
const imagesDir = path.join(__dirname, '..', '..', 'files', 'images');

imagesRouter.use((req, res, next) => {
  {
    console.log('Time: ', Date.now());
    res.header('Access-Control-Allow-Origin', 'https://localhost:3000');
    next();
  }
});

imagesRouter.get('/covers/:bookId/:size', async (req, res) => {
  const { bookId, size } = req.params;
  const coversPath = path.join(imagesDir, 'covers');

  const bookDir = path.join(coversPath, bookId);
  const bookDirExists = fs.existsSync(bookDir);

  if (!bookDirExists) {
    res.send('no cover');
    res.end();
    return;
  }

  const filePath = path.join(bookDir, `${size}.jpg`);

  const fileExists = fs.existsSync(filePath);

  const originalPath = path.join(coversPath, bookId, 'original.jpg');
  const originalExists = fs.existsSync(originalPath);
  const originalHeight =
    originalExists && (await sharp(originalPath).metadata()).height;

  const bigPath = path.join(coversPath, bookId, 'big.jpg');
  const bigExists = fs.existsSync(bigPath);
  // const bigHeight = bigExists && (await sharp(bigPath).metadata()).height;

  const mediumPath = path.join(coversPath, bookId, 'medium.jpg');
  const mediumExists = fs.existsSync(mediumPath);
  const mediumHeight =
    mediumExists && (await sharp(mediumPath).metadata()).height;

  const smallPath = path.join(coversPath, bookId, 'small.jpg');
  const smallExists = fs.existsSync(smallPath);
  const smallHeight = smallExists && (await sharp(smallPath).metadata()).height;

  if (originalExists && (!bigExists || !mediumExists || !smallExists)) {
    await coverResize(path.join(coversPath, bookId, 'original.jpg'));
  }

  if (fileExists) {
    res.sendFile(filePath);
  } else if (size === 'big') {
    if (originalHeight && mediumHeight) {
      if (originalHeight > mediumHeight) {
        res.sendFile(originalPath);
      } else res.sendFile(mediumPath);
    }
  } else if (size === 'medium') {
    if (originalHeight && smallHeight) {
      if (originalHeight > smallHeight) {
        res.sendFile(originalPath);
      } else {
        res.sendFile(smallPath);
      }
    }
  } else {
    console.log('Something went wrong with preparing the cover for this one');
    res.send('Something went wrong with preparing the cover for this one');
  }
});
imagesRouter.get('/uploaded/covers/:id', async (req, res) => {
  const { id } = req.params;
  const tempDir = path.join(__dirname, '..', '..', 'files', 'images', 'temp');
  const filePath = path.join(tempDir, 'covers', id);
  const fileExists = fs.existsSync(filePath);
  if (!fileExists) {
    console.log('error');
  } else {
    res.sendFile(filePath);
  }
});
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(imagesDir, 'temp', 'covers'));
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});
const upload = multer({ storage });

imagesRouter.post(
  '/uploaded/covers',
  upload.single('file'),
  async (req, res) => {
    const coversPath = path.join(imagesDir, 'covers');
    const { id } = req.body;
    const cover = req.file;
    const coverDir = path.join(coversPath, id);
    if (cover) {
      const coverPath = path.join(coversPath, id, 'original.jpg');
      try {
        if (!fs.existsSync(coverDir)) {
          fs.mkdirSync(coverDir);
        }
        if (!fs.existsSync(coverPath)) {
          await sharp(cover.path).toFile(coverPath);
        }
        await coverResize(coverPath);
      } catch (err) {
        console.error(err);
      }
    }

    res.send('success');
  }
);
