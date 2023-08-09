import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import styled from "styled-components";
import { storage, auth, db } from '../firebaseConfig'
import { ref as storageRef, uploadBytes } from "firebase/storage";
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { ref as dbRef, set, get, child, push } from "firebase/database";
import Pica from "pica";
import ContentImage from '../components/ContentImage'
import Modal from '../components/Modal'
import useStorageStore from '../store/fbstorage';
import useAuthStore from '../store/fbauth';
import useStore from '../store/store';
import { IMAGE_SIZE_TO } from '../constants';

const pica = Pica();

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

function Home() {
  const {
    AUTH_uid,
    AUTH_setUid
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
        <button onClick={() => {
          openModal();
          setModalContent(<Uploader />);
        }}>업로드</button>

        <button onClick={handleLogout}>로그아웃</button>

        <Link to={userId}>
          <button>프로필</button>
        </Link>
      </div>
    );
  }

  function GuestActions() {
    return (
      <div>
        <Link to="login">
          <button>로그인</button>
        </Link>
      </div>
    );
  }

  return (
    <React.Fragment>
      {AUTH_uid ? <UserActions userId={userId} /> : <GuestActions />}

      <ContentImage />
      <Modal /> {/* <Feed />, <Uploader /> */}
    </React.Fragment>
  );  
}

export default Home;