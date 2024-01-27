const express = require('express');
const path = require('path');
const PORT = 3000;
const app = express();
const cookieParser = require('cookie-parser');
// adding JWT 
const jwt = require('jsonwebtoken');
require('dotenv').config();
const googleMapsKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
const tokenSecret = process.env.TOKEN_SECRET;


// parses JSON from incoming request
app.use(express.json());  
app.use(cookieParser());

const libraryRouter = require('./routes/library');

const userController = require('./controllers/userController');
const cookieController = require('./controllers/cookieController');
const sessionController = require('./controllers/sessionController');
const jwtController = require('./controllers/jwtController');
const authentificationController = require('./controllers/authentificationController');

// authentificationController.authenticateToken

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/index.html'));
});

//Signup
app.post(
  '/action/signup',
  userController.createUser,
  // commented out cookie controller to try to switch to jwt VVV
  // cookieController.setSSIDCookie,
  jwtController.generateToken,
  sessionController.startSession,
  (req, res) => {
    res.status(200).json(true);
    // res.status(200).redirect('/home')
  }
);

app.get('/action/getMapsKey', (req, res) => {
  res.status(200).json(googleMapsKey);
});

//Checks user availability
app.get('/action/check/:username', userController.checkUser, (req, res) => {
  console.log('availability is ', res.locals.userAvailability);
  res.json(res.locals.userAvailability);
});

//Login
app.post(
  '/action/login',
  userController.verifyUser,
  // adding this to try to create working jwt middleware
  cookieController.setSSIDCookie,
  jwtController.generateToken,
  authentificationController.authenticateToken,
    // commented out session controller to try to get authentificationController.authenticateToken to work
  // sessionController.startSession,
  (req, res) => {
    console.log(
      'authentication completed, correctUser is ',
      res.locals.correctUser
    );
    console.log('redirecting to home');
    res.json(res.locals.correctUser);
    // res.status(200).redirect('/home')
    // }
    // else {
    //     res.json(res.locals.correctUser)
    // }
  }
);

app.post(
  '/action/oAuth',  //commented out this one
  // authentificationController.authenticateToken,
    userController.verifyOAuth, //commented out this one
  // userController.verifyUser,
  // cookieController.setSSIDCookie,
  // sessionController.startSession,
  (req, res) => {
    console.log(
      'Google OAuth token verified. userData: ', res.locals.userData
    );
    res.status(200).json(res.locals.userData);
  }
);

//Protect server side requests to protected pages
app.get('/home', sessionController.isLoggedIn, (req, res) => {
  res.status(200).json(res.locals.user);
});

app.get('/myLibrary', sessionController.isLoggedIn, (req, res) => {
  res.status(200).json(res.locals.user);
});

app.get('/action/getUser', sessionController.isLoggedIn, (req, res) => {
  res.status(200).json(res.locals.user);
})

app.post('/action/updateUser', sessionController.isLoggedIn, userController.updateUserProfile, (req, res) => {
  res.status(200).json(res.locals.user);
})

app.get('/action/getLibrary', sessionController.isLoggedIn, (req, res) => {
  console.log('get library running');
  res.status(200).json(res.locals.user.books);
});

app.get('/action/getNotifications', sessionController.isLoggedIn, (req, res) => {
  console.log('get notifications running');
  res.status(200).json(res.locals.user.notifications);
})

app.get('/action/markAsRead/:id', sessionController.isLoggedIn, userController.markReadNotification, (req, res) => {
  res.status(200).json(res.locals.user.notifications);
})

app.get('/action/clearNotifications', sessionController.isLoggedIn, userController.clearNotifications, (req, res) => {
  res.status(200).json(res.locals.user.notifications);
})

//Verify active session for client side requests to protected pages
app.get('/action/auth', sessionController.isLoggedIn, (req, res) => {
  res.status(200).json(true);
});

//Logout
app.get('/action/logout', sessionController.endSession, (req, res) => {
  res.clearCookie('ssid');
  res.redirect('/');
});

// Library
app.use('/library', libraryRouter);

//Handler for 404
app.use('*', (req, res) => {
  res.status(404).send('Page not found.');
});

//Global Error Handler
app.use((err, req, res, next) => {
  console.log(err);
  res.status(500).send({ error: err });
});

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}...`);
});

module.exports = app;
