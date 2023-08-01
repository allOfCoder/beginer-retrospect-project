import React, { useState } from "react";
import { Link } from "react-router-dom";
import { styled } from "styled-components";
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
} from 'firebase/auth';
import useAuthStore from './store/fbauth';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.REACT_APP_FIREBASE_DATABASE_URL,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  // storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  storageBucket: 'beginer-retrospect-project.appspot.com',
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

function signInWithGoogle() {
  return signInWithPopup(auth, provider)
    .then((result) => {
      console.log(result);
      var user = result.user;
      // ...
    }).catch((error) => {
      console.log(error);
    });
}

function Login() {
  const {AUTH_uid, AUTH_setUid} = useAuthStore();

  function handleLogin() {
    signInWithGoogle()
    .then((result) => {
      onAuthStateChanged(auth, (user) => {
        AUTH_setUid(user.uid)
        .then((result) => {
          window.location.href = '/';
        });
      });
    })
    .catch((error) => {
      console.log(error);
    });
}


  

  return (
    <React.Fragment>
      <button onClick={(e) => handleLogin()}>로그인하기</button>
      <Link to={'/'}>
          <button>
            뒤로가기
          </button>
        </Link>
    </React.Fragment>
  )
}

export default Login;