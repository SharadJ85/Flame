const functions = require("firebase-functions");
const admin = require("firebase-admin");

//const express = require("express");
//const app = express();
//above code(line 4-5) in one line__
const app = require("express")();
admin.initializeApp();

//  Create and Deploy Your First Cloud Functions
//  https://firebase.google.com/docs/functions/write-firebase-functions



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

const zb

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

//shouts-user auth
//fireBaseAuth
const FBAuth = (req, res, next) => {
  let idToken;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    idToken = req.headers.authorization.split("Bearer ")[1];
  } else {
    console.error("No token found");
    return res.status(403).json({ error: "Unauthorised--" });
  }

  admin
    .auth()
    .verifyIdToken(idToken)
    .then(decodedToken => {
      req.user = decodedToken;
      console.log(decodedToken);
      return db
        .collection("Users")
        .where("userId", "==", req.user.uid)
        .limit(1)
        .get();
    })
    .then(data => {
      req.user.handle = data.docs[0].data().handle;
      return next();
    })
    .catch(err => {
      console.error("Error while verifying token", err);
      return res.status(403).json(err);
    });
};

//post one new shout
app.post("/shout", FBAuth, (req, res) => {
  if (req.body.body.trim() === "") {
    return res.status(400).json({ body: `Body must not be empty!` });
  }

  const newShout = {
    body: req.body.body,
    userHandle: req.user.handle, //body.userHandle,
    createdAt: new Date().toISOString() //admin.firestore.Timestamp.fromDate(new Date())
  };

  db.collection("shouts")
    .add(newShout)
    .then(doc => {
      res.json({
        message: `document ${doc.id}} created successfully`
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

const isEmail = email => {
  const regEx = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  if (email.match(regEx)) return true;
  else return false;
};

const isEmpty = string => {
  if (string.trim() === "") return true;
  else return false;
};

//Signup route
app.post("/signup", (req, res) => {
  const newUser = {
    email: req.body.email,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword,
    handle: req.body.handle
  };

  let errors = {};

  if (isEmpty(newUser.email)) {
    errors.email = "Email must not be empty";
  } else if (!isEmail(newUser.email)) {
    errors.email = "Must be a valid email address";
  }

  if (isEmpty(newUser.password)) errors.password = "Must not be empty";
  if (newUser.password !== newUser.confirmPassword)
    errors.confirmPassword = "Password doesn't match";
  if (isEmpty(newUser.handle)) errors.handle = "Must not be empty";

  if (Object.keys(errors).length > 0) return res.status(400).json(errors);

  //TODO:validate data entered

  let token, userId;
  db.doc(`/Users/${newUser.handle}`)
    .get()
    .then(doc => {
      if (doc.exists) {
        return res.status(400).json({
          handle: "this handle is already taken/user already exists!"
        });
      } else {
        return firebase
          .auth()
          .createUserWithEmailAndPassword(newUser.email, newUser.password);
      }
    })
    .then(data => {
      userId = data.user.uid;
      return data.user.getIdToken();
    })
    .then(idToken => {
      token = idToken;
      const userCredentials = {
        handle: newUser.handle,
        email: newUser.email,
        createdAt: new Date().toISOString(),
        userId
      };
      return db.doc(`/Users/${newUser.handle}`).set(userCredentials);
      //return res.status(201).json({ token });
    })
    .then(() => {
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

app.post("/login", (req, res) => {
  const user = {
    email: req.body.email,
    password: req.body.password
  };

  let errors = {};

  if (isEmpty(user.email)) errors.email = "Email must not be empty";
  if (isEmpty(user.password)) errors.password = "Password must not be empty";

  if (Object.keys(errors).length > 0) return res.status(400).json(errors);

  firebase
    .auth()
    .signInWithEmailAndPassword(user.email, user.password)
    .then(data => {
      return data.user.getIdToken();
    })
    .then(token => {
      return res.json({ token });
    })
    .catch(err => {
      console.error(err);
      if (err.code === "auth/wrong-password") {
        return res
          .status(403)
          .json({ general: "Wrong credentials(password),pls try again!" });
      } else if (err.code === "auth/user-not-found") {
        return res
          .status(403)
          .json({ general: "Wrong credentials(username),pls try again!" });
      } else return res.status(500).json({ error: err.code });
    });
});

//https://baseurl.com/api/
exports.api = functions.https.onRequest(app);
