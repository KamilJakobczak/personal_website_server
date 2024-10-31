// Core Modules
import express, { Request, Response } from 'express';
// Initialize Router
export const collectionRouter = express.Router();

// Middleware for All Routes
collectionRouter.all('/', async (req, res, next) => {
  console.log('Time: ', Date.now());
  {
    const session = req.session;
    if (session) {
      console.log(session);
    }
    console.log('Session ID from collection router: ', req.sessionID);
    next();
  }
});

// Adding new records
collectionRouter.post('/add/:item', async (req, res) => {
  const { item } = req.params;
  try {
    res.send(`New ${item}`);
  } catch (error) {
    console.error(`Error adding new ${item}`, error);
    res.status(500).send('Internal Server Error');
  }
});
// Logging out
collectionRouter.get('/logout', async (req, res) => {
  req.session.destroy(error => {
    if (error) {
      console.error('Error during logout:', error);
      return res.status(500).send('Internal Server Error');
    }
    res.redirect('/');
  });
});
