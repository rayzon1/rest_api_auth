"use strict";

const express = require("express");
const { check, validationResult } = require("express-validator");
const bcryptjs = require("bcryptjs");
const auth = require("basic-auth");

// This array is used to keep track of user records
// as they are created.
const users = [];

// Construct a router instance.
const router = express.Router();

const authenticateUser = (req, res, next) => {
  let message = null;
  // Parse the user's credentials from the Authorization header.
  const credentials = auth(req);

  // If the user's credentials are available...
  if (credentials) {

    // Attempt to retrieve the user from the data store
    // by their username (i.e. the user's "key"
    // from the Authorization header).
    const user = users.find(u => u.username === credentials.name);
    // If a user was successfully retrieved from the data store...
    if (user) {
      // Use the bcryptjs npm package to compare the user's password
      // (from the Authorization header) to the user's password
      // that was retrieved from the data store.
      const authenticated = bcryptjs.compareSync(
        credentials.pass,
        user.password
      );
      // If the passwords match...
      if (authenticated) {
        // Then store the retrieved user object on the request object
        // so any middleware functions that follow this middleware function
        // will have access to the user's information.
        req.currentUser = user;
      } else {
        message = `Authentication failure for username: ${user.username}`;
      }
    } else {
        message = `Authentication failure for username: ${user.username}`;
    }
  } else {
      message = 'Auth header not found';
  }

  // If user authentication failed...
  if(message) {
    console.warn(message);
    // Return a response with a 401 Unauthorized HTTP status code.
    res.status(401).json({ message: 'Access Denied' });
  } else {
    // Or if user authentication succeeded...
    // Call the next() method.
    next();
  }
  
};

// Route to get list of users.
router.get("/users", authenticateUser, (req, res) => {
  const user = req.currentUser;

  res.json({
    name: user.name,
    username: user.username,
  })

  res.status(200).json(users);
});



// Route that creates a new user.
router.post(
  "/users",
  [
    check("name")
      .exists({ checkNull: true, checkFalsy: true })
      .withMessage('Please provide a value for "name"'),
    check("username")
      .exists()
      .withMessage('Please provide a value for "username"'),
    check("password")
      .exists()
      .withMessage('Please provide a value for "password"')
  ],
  (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map(error => error.msg);
      return res.status(400).json({ error: errorMessages });
    }

    // Get the user from the request body.
    const user = req.body;

    user.password = bcryptjs.hashSync(user.password);

    // Add the user to the `users` array.
    users.push(user);

    // Set the status to 201 Created and end the response.
    res.status(201).end();
  }
);

module.exports = router;
