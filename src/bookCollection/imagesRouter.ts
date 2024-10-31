// Core Modules
import express from 'express';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';
import multer from 'multer';
// Utility Modules
import { coverResize } from '../utility/coverResize';
import config from '../../config';
// Initialize Router
export const imagesRouter = express.Router();
const imagesDir = path.join(__dirname, '..', '..', 'files', 'images');

// Middleware to log request time and set headers
imagesRouter.use((req, res, next) => {
  {
    console.log('Time: ', Date.now());
    res.header(
      'Access-Control-Allow-Origin',
      `https://${config.host}:${config.frontPort}`
    );
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
  }
});
// Get book cover
imagesRouter.get('/covers/:bookId/:size', async (req, res) => {
  const { bookId, size } = req.params;
  const coversPath = path.join(imagesDir, 'covers');
  const bookDir = path.join(coversPath, bookId);
  const bookDirExists = fs.existsSync(bookDir);
  console.log(bookDir);
  if (!bookDirExists) {
    return res.status(404).send('No cover found');
  }

  const filePath = path.join(bookDir, `${size}.jpg`);
  const fileExists = fs.existsSync(filePath);

  // Files' paths
  const originalPath = path.join(coversPath, bookId, 'original.jpg');
  const bigPath = path.join(coversPath, bookId, 'big.jpg');
  const mediumPath = path.join(coversPath, bookId, 'medium.jpg');
  const smallPath = path.join(coversPath, bookId, 'small.jpg');
  // Files' existence
  const originalExists = fs.existsSync(originalPath);
  const bigExists = fs.existsSync(bigPath);
  const mediumExists = fs.existsSync(mediumPath);
  const smallExists = fs.existsSync(smallPath);
  // Files' height
  const originalHeight = originalExists
    ? (await sharp(originalPath).metadata()).height
    : null;
  const mediumHeight =
    mediumExists && (await sharp(mediumPath).metadata()).height;
  const smallHeight = smallExists && (await sharp(smallPath).metadata()).height;

  // const bigHeight = bigExists && (await sharp(bigPath).metadata()).height;

  if (originalExists && (!bigExists || !mediumExists || !smallExists)) {
    await coverResize(originalPath);
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
    return res.status(500).send('Error preparing the cover');
  }
});
// Get uploaded(temp) book cover
imagesRouter.get('/uploaded/covers/:id', async (req, res) => {
  const { id } = req.params;
  const tempDir = path.join(__dirname, '..', '..', 'files', 'images', 'temp');
  const filePath = path.join(tempDir, 'covers', id);
  const fileExists = fs.existsSync(filePath);
  if (!fileExists) {
    console.log('File not found');
    return res.status(404).send('File not found');
  } else {
    res.sendFile(filePath);
  }
});

// Setup multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(imagesDir, 'temp', 'covers'));
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});
const upload = multer({ storage });

// Post new cover
imagesRouter.post(
  '/uploaded/covers',
  upload.single('file'),
  async (req, res) => {
    const { id } = req.body;
    const cover = req.file;
    const coverDir = path.join(imagesDir, 'covers', id);

    if (!cover) {
      return res.status(400).send('No file uploaded');
    }

    try {
      if (!fs.existsSync(coverDir)) {
        fs.mkdirSync(coverDir);
      }

      const coverPath = path.join(coverDir, 'original.jpg');
      await sharp(cover.path).toFile(coverPath);
      await coverResize(coverPath);

      res
        .status(200)
        .send('cover directory created along with different sizes');
    } catch (error) {
      console.error('Error processing the cover:', error);
      res.status(500).send('Internal Server Error');
    }
  }
);
// Transform temp cover into permanent file
imagesRouter.post('/uploaded/covers-epub', async (req, res) => {
  const { bookId, localId } = req.body;
  const coversPath = path.join(imagesDir, 'covers');
  const tempDir = path.join(__dirname, '..', '..', 'files', 'images', 'temp');
  const filePath = path.join(tempDir, 'covers', localId + '.jpg');

  const fileExists = fs.existsSync(filePath);
  const coverDir = path.join(coversPath, bookId);

  // Check if the temporary cover file exists
  if (!fileExists) {
    console.error("Temp cover file doesn't exist");
    return res.status(404).send("Temp cover file doesn't exist");
  }

  const coverPath = path.join(coversPath, bookId, 'original.jpg');

  try {
    // Create directory for book covers if it doesn't exist
    if (!fs.existsSync(coverDir)) {
      fs.mkdirSync(coverDir);
    }

    // Move the cover file to the permanent location
    if (!fs.existsSync(coverPath)) {
      await sharp(filePath).toFile(coverPath);
    }

    // Resize the cover image to various sizes
    await coverResize(coverPath);
    // Delete the temporary file
    fs.unlinkSync(filePath);

    res.status(200).send('cover directory created along with different sizes');
  } catch (error) {
    console.error('Error processing cover', error);
    res.status(500).send('Internal Server Error');
  }
});
