const functions = require("firebase-functions");
const admin = require("firebase-admin");

//const express = require("express");
//const app = express();
//above code(line 4-5) in one line__
const app = require("express")();
admin.initializeApp();

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions

const firebaseConfig = {
  apiKey: "AIzaSyBoUmXSmIMLotYUm-E8f8wf6fchwIWp6sI",
  authDomain: "flame855.firebaseapp.com",
  databaseURL: "https://flame855.firebaseio.com",
  projectId: "flame855",
  storageBucket: "flame855.appspot.com",
  messagingSenderId: "99636361571",
  appId: "1:99636361571:web:6e6201d8c86307397afb56",
  measurementId: "G-LPEQX5T02H"
};
//using express

const firebase = require("firebase");
firebase.initializeApp(firebaseConfig);

const db = admin.firestore(); //replace admin.firestore with db

app.get("/shouts", (req, res) => {
  db.collection("shouts")
    .orderBy("createdAt", "desc")
    .get()
    .then(data => {
      let shouts = [];
      data.forEach(doc => {
        shouts.push(
          {
            shoutId: doc.id,
            body: doc.data().body,
            userHandle: doc.data().userHandle,
            createdAt: doc.data().createdAt,
            commentCount: doc.data().commentCount,
            likeCount: doc.data().likeCount
          }
          /* //spread operator = ...
          ...doc.id,
          ...doc.data().body,
          ...doc.data().userHandle,
          ...doc.data().createdAt*/
        );
      });
      return res.json(shouts);
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({ error: err.code });
    });
});

//post one new shout
app.post("/shout", (req, res) => {
  if (req.body.body.trim() === "") {
    return res.status(400).json({ body: `Body must not be empty!` });
  }

  const newShout = {
    body: req.body.body,
    userHandle: req.body.userHandle,
    createdAt: new Date().toISOString() //admin.firestore.Timestamp.fromDate(new Date())
  };

  db.collection("shouts")
    .add(newShout)
    .then(doc => {
      res.json({
        message: `document ${doc.id} user ${
          doc.data().userHandle
        } created successfully`
      });
    })
    .catch(err => {
      res.status(500).json({ error: "something is wrong" });
      console.error(err);
    });
});

/*
using node:-


exports.helloWorld = functions.https.onRequest((request, response) => {
  response.send("Hello from lol!");
});



exports.getShouts = functions.https.onRequest((req, res) => {
  admin
    .firestore()
    .collection("shouts")
    .get()
    .then(data => {
      let shouts = [];
      data.forEach(doc => {
        shouts.push(doc.data());
      });
      return res.json(shouts);
    })
    .catch(err => console.error(err));
});

exports.createShouts = functions.https.onRequest((req, res) => {
  if (req.method !== "POST") {
    return res.status(400).json({ error: "Method not allowed" });
  }

  const newShout = {
    body: req.body.body,
    userHandle: req.body.userHandle,
    createdAt: admin.firestore.Timestamp.fromDate(new Date())
  };

  admin
    .firestore()
    .collection("shouts")
    .add(newShout)
    .then(doc => {
      res.json({ message: `document ${doc.id} created successfully` });
    })
    .catch(err => {
      res.status(500).json({ error: "something is wrong" });
      console.error(err);
    });
});
*/

//Signup route
app.post("/signup", (req, res) => {
  const newUser = {
    email: req.body.email,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword,
    handle: req.body.handle
  };

  //TODO:validate data entered

  db.doc(`/users/${newUser.handle}`)
    .get()
    .then(doc => {
      if (doc.exists) {
        return res.status(400).json({ handle: "this handle is already taken" });
      } else {
        return firebase
          .auth()
          .createUserWithEmailAndPassword(newUser.email, newUser.password);
      }
    })
    .then(data => {
      data.user.getIdToken();
    })
    .then(token => {
      return res.status(201).json({ token });
    })
    .catch(err => {
      console.error(err);
      if (err.code === "auth/email-already-in-use") {
        return res.status(400).json({ email: "Email already in use" });
      } else {
        return res.status(500).json({ error: err.code });
      }
    });
  /*
    .firebase.auth()
    .createUserWithEmailAndPassword(newUser.email, newUser.password)
    .then(data => {
      return res
        .status(201)
        .json({ message: `user ${data.user.uid} signed up successfully!` });
    })
    .catch(err => {
      console.error(err);
      return res.status(500).json({ error: err.code });
    });
    */
});

//https://baseurl.com/api/

exports.api = functions.https.onRequest(app);
