import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import styled from "styled-components";
import { storage, auth, db } from '../firebaseConfig'
import { ref as storageRef, uploadBytes } from "firebase/storage";
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { ref as dbRef, set, get, child, push, query, orderByChild, equalTo } from "firebase/database";
import Pica from "pica";
import ContentImage from '../components/ContentImage'
import Modal from '../components/Modal'
import useStorageStore from '../store/fbstorage';
import useAuthStore from '../store/fbauth';
import useStore from '../store/store';
import { IMAGE_SIZE_TO } from '../constants';

const pica = Pica();

const CreateNameScrim = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: rgba(0, 0, 0, 0.8);
`
const CreateNameContainer = styled.div`
  width: 70%;
  height: 70%;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  background-color: white;
`
function CreateNameModal() {
  const {AUTH_uid} = useAuthStore();
  const [inputName, setInputName] = useState('');
  const [rejectReason, setRejectReason] = useState('');

  async function handleCreateName(e) {
    e.preventDefault();
    setRejectReason('');
  
    const isValid = await isValidUsername(inputName);
  
    if (isValid) {
      const newUserRef = dbRef(db, `users/${AUTH_uid}`);
      set(newUserRef, {id: inputName});
    }
  }
  
  async function isValidUsername(username) {
    if (!/^[a-z0-9._]+$/.test(username)) {
      setRejectReason('영문 소문자 또는 숫자를 입력해주세요.');
      return false;
    }
  
    const lowercaseUsername = username.toLowerCase();
    if (lowercaseUsername.startsWith('_')) {
      setRejectReason('언더바(_)는 처음에 사용할 수 없습니다.');
      return false;
    }
  
    if (username.length > 20) {
      setRejectReason('20자 이내로 작상해주세요.');
      return false;
    }
  
    const usersRef = dbRef(db, 'users');
    const checkUserNameQuery = query(usersRef, orderByChild('id'), equalTo(username));
  
    try {
      const snapshot = await get(checkUserNameQuery);
      if (snapshot.exists()) {
        setRejectReason('이미 사용중이 아이디입니다.');
        return false;
      } else {
        return true;
      }
    } catch (error) {
      console.error('Error checking username:', error);
      return false;
    }
  }
  

  return (
    <CreateNameScrim>
      <CreateNameContainer>
        <form onSubmit={handleCreateName}>
          <div>사용하실 아이디를 입력해주세요.</div>
          <div style={{'fontSize': '12px'}}>
            영문 소문자 및 숫자 사용 가능<br />
            첫 글자를 제외하고 언더바(_) 사용 가능<br />
            20자 이내
          </div>
          <input value={inputName} onChange={(e) => setInputName(e.target.value)} />
          <div style={{
            'width': '250px',
            'height': '22px',
            'color': 'red',
            'fontSize': '12px',
          }}>{rejectReason}</div>
          <button type="submit">확인</button>
        </form>
      </CreateNameContainer>
    </CreateNameScrim>
  );
}

const ImageInputContainer = styled.div`
  width: 630px;
  height: 630px;
  background-color: white;
  display: flex;
  flex-direction: column;
  align-items: center;
`
const Album = styled.div`
  width: 600px;
  display: flex;
  flex-direction: row;
  justify-content: start;
  flex-wrap: wrap;
`
const AlbumImage = styled.img`
  width: 200px;
  height: 200px;

`
function Uploader() {
  const {
    STORAGE_imagesTimeSet,
  } = useStorageStore();
  const {
    AUTH_uid,
    AUTH_userName,
  } = useAuthStore();
  const [album, setAlbum] = useState([]);
  const [blobAlbum, setBlobAlbum] = useState([]);
  const canvasRef = useRef();

  function resizeImage(url) {
    // 이미지 앨범에 추가
    return new Promise((resolve, reject) => {
      let img = new Image ();
      img.crossOrigin = 'anonymous';
      img.src = url;
      img.onload = function () {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        canvas.width = IMAGE_SIZE_TO;
        canvas.height = IMAGE_SIZE_TO;
        const size = Math.min(img.width, img.height);
        ctx.drawImage(img,
          (img.width - size) / 2,
          (img.height - size) / 2,
          size,
          size,
          0, 0, IMAGE_SIZE_TO, IMAGE_SIZE_TO);

        let resizedCanvas = document.createElement('canvas');
        resizedCanvas.width = IMAGE_SIZE_TO;
        resizedCanvas.height = IMAGE_SIZE_TO;
        pica.resize(canvasRef.current, resizedCanvas)
        .then((res) => {
          res.toBlob(blob => {
            setBlobAlbum((prev) => [...prev, blob])
            const url = URL.createObjectURL(blob);
            resolve(url);
          });
        })
        .catch((err) => reject(err));
      }
      img.onerror = function () {
        reject(new Error('Image failed to load; error in resizeImage.'));
      }
    });
  }

  async function handleImageInputChange(e) {
    const inputUrl = URL.createObjectURL(e.target.files[0]);
    try {
      const resizedImageUrl = await resizeImage(inputUrl);
      setAlbum((prev) => {
        if (prev.length < 8) {
          return [...prev, resizedImageUrl];
        } else {
          alert('최대 8장까지 게시할 수 있습니다.');
          return prev;
        }
    });
    } catch (err) {
      console.log(err);
    }
  }

  async function upload() {
    if (album === null) return;
    console.log('Uploading');
    const name = STORAGE_imagesTimeSet();
    const promise1 = blobAlbum.map((blob, index) => {
      const imageRef = storageRef(storage, `images/${name}/${index}`);
      const uploadTask = uploadBytes(imageRef, blob);
      URL.revokeObjectURL(album[index]);
      return uploadTask;
    });
    
    const promise2 = get(child(dbRef(db, `users/${AUTH_uid}`), 'feeds'))
    .then((snapshot) => {
      set(dbRef(db, `all_feeds/${name}`), {author: AUTH_userName});
      push(dbRef(db, `users/${AUTH_uid}/feeds`), {name: name});
    })
    

    Promise.all(promise1, promise2)// 
    .then(() => {
      window.location.reload();
    })
    .catch((error) => {
      console.log('Error', error)
    });
  }
  
  return (
    <ImageInputContainer>
      <div>
        <input type="file"
                onChange={(e) => handleImageInputChange(e)}/>
        <button onClick={upload}>업로드</button>
        <canvas style={{'display': 'none'}} ref={canvasRef} />
      </div>
      <Album>
        {album.map((url, index) => {
          return <AlbumImage src={url} key={index} onClick={(e) => {
            setAlbum((prev) => {
              return prev.filter((image) => image !== url)
            })
          }} />
        })}
      </Album>
    </ImageInputContainer>
  );
};

const Container = styled.div`
  width: 100%;
  display: flex;
  flex-direction: row;
`
const Navigation = styled.div`
  width: 130px;
  height: 96vh;
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
const UploadButton = styled(UserActionButton)`
color: #8e8e8e;

  &:hover {
    color: #262626;
  }
`
const ProfileButton = styled(UserActionButton)`
  color: #8e8e8e;
  text-decoration: none;

  &:hover {
    color: #262626;
  }
`
const LogoutButton = styled(UserActionButton)`
  color: #ed4956;

  &:hover {
    color: #b23242;
  }
`
const LoginButton = styled(UserActionButton)`
  color: #ed4956;

  &:hover {
    color: #b23242;
  }
`
const StyledLink = styled(Link)`
  color: #8e8e8e;
  text-decoration: none;

  &:hover {
    color: #262626;
  }
`;
function Home() {
  const {
    AUTH_uid,
    AUTH_setUid,
    AUTH_userName,
  } = useAuthStore();
  const {
    openModal,
    setModalContent,
  } = useStore();
  const [userId, setUserId] = useState();

  function handleLogout() {
    signOut(auth);
  }

  const userRef = dbRef(db, 'users/' + AUTH_uid);
  get(child(userRef, 'id')).then((snapshot) => {
    if (snapshot.exists()) {
      setUserId(snapshot.val());
    }
  }).catch((error) => {
    console.error(error);
  });

  function UserActions({ userId }) {
    return (
      <div>
        <UploadButton onClick={() => {
          openModal();
          setModalContent(<Uploader />);
        }}>업로드</UploadButton>

        <StyledLink to={userId}>
          <ProfileButton>프로필</ProfileButton>
        </StyledLink>

        <LogoutButton onClick={handleLogout}>로그아웃</LogoutButton>

        {AUTH_userName ? null : <CreateNameModal />}
      </div>
    );
  }

  function GuestActions() {
    return (
      <div>
        <Link to="login">
          <LoginButton>로그인</LoginButton>
        </Link>
      </div>
    );
  }

  return (
    <Container>
      <Navigation>
        {AUTH_uid ? <UserActions userId={userId} /> : <GuestActions />}
      </Navigation>

      <ContentImage />
      <Modal /> {/* <Feed />, <Uploader /> */}
      
    </Container>
  );  
}

export default Home;