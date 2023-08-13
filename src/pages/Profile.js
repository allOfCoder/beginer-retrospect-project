import React, { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import styled from "styled-components";
import { auth, db } from '../firebaseConfig'
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { ref, set, get, push } from "firebase/database";
import Modal from '../components/Modal'
import useAuthStore from '../store/fbauth';
import ProfileImage from '../components/ProfileImage'

const Container = styled.div`
  width: 100%;
  display: flex;
  flex-direction: row;
`
const Navigation = styled.div`
  width: 130px;
  height: 100vh;
  padding-top: 30px;
  & * button {
    width: 100px;
    margin: 0 auto;
    margin: 10px;
    display: flex;
    align-items: center;
    flex-direction: column;
  }
  border-right: 1px solid rgba(0, 0, 0, 0.2);
  position: fixed;
`
const Button = styled.button`
  background-color: transparent;
  border: none;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #262626;

  &:hover {
    color: #3897f0;
  }
`
const UserActionButton = styled(Button)`
  margin: 10px;
  padding: 10px 15px;
`
const HomeButton = styled(UserActionButton)`
color: #8e8e8e;

  &:hover {
    color: #262626;
  }
`
const StyledLink = styled(Link)`
  color: #8e8e8e;
  text-decoration: none;

  &:hover {
    color: #262626;
  }
`;
function Profile() {
  const {
    AUTH_setUid,
    AUTH_userName
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
    <Container>
      <Navigation>
        <StyledLink to={'/'}>
          <HomeButton onClick={handleClick}>홈</HomeButton>
        </StyledLink>
      </Navigation>
      {AUTH_userName 
      ? <ProfileImage />
      : null}
      <Modal />  {/* <Feed />, <Uploader /> */}
    </Container>
  )
}

export default Profile;