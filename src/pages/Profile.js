import React, { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { styled } from "styled-components";
import { auth, db } from '../firebaseConfig'
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { ref, set, get, push } from "firebase/database";
import Modal from '../components/Modal'
import useAuthStore from '../store/fbauth';
import ProfileImage from '../components/ProfileImage'

function Profile() {
  const {
    AUTH_setUid,
  } = useAuthStore();
  const params = useParams();
  // const id = params.id;

  function handleClick() {
    const feedName = 309059774215
    const usersRef = ref(db, 'all_feeds/' + feedName);
    const newFeedRef = push(usersRef);
    set(newFeedRef, {
      author: 'every_life_2',
      comment: []
    });
  }

  useEffect(() => {
    const user = auth.currentUser;
    if (user != null) {
      AUTH_setUid(user.uid);
    } else {}
  }, []);

  return (
    <React.Fragment>
      <div>
        설정 영역
        <button onClick={handleClick}>버튼</button>
      </div>
      <ProfileImage />
      <Modal />  {/* <Feed />, <Uploader /> */}
    </React.Fragment>
  )
}

export default Profile;