import express from 'express';

export const collectionRouter = express.Router();

collectionRouter.use((req, res, next) => {
  {
    console.log('Time: ', Date.now());

    next();
  }
});

collectionRouter.post('/add/book', async (req, res) => {
  console.log(req.body);
  res.send('new book');
});

collectionRouter.post('/add/author', async (req, res) => {
  console.log(req.body);
  res.send('new author');
});
collectionRouter.post('/add/genre', async (req, res) => {
  console.log(req.body);
  res.send('new genre');
});
collectionRouter.post('/add/translator', async (req, res) => {
  console.log(req.body);
  res.send('new translator');
});
collectionRouter.post('/add/publisher', async (req, res) => {
  console.log(req.body);
  res.send('new publisher');
});
collectionRouter.post('/add/collection', async (req, res) => {
  console.log(req.body);
  res.send('new collection');
});
