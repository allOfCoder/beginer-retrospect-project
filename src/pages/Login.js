import React, { useState } from "react";
import { Link } from "react-router-dom";
import { styled } from "styled-components";
import { storage, auth } from '../firebaseConfig'
import {
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
} from 'firebase/auth';
import useAuthStore from '../store/fbauth';

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