import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { styled } from "styled-components";
import { initializeApp } from 'firebase/app';
import { 
  getStorage,
  ref,
  uploadBytes, 
  listAll, 
  getDownloadURL,
  deleteObject
} from "firebase/storage";
import Pica from "pica";
import useStore from './store'
const pica = Pica();

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
const storage = getStorage(app);
const imageListRef = ref(storage, "images/");
const image0Ref = ref(storage, "images/0");

const ImageUploader = () => {
  const { FB_images, FB_images_add } = useStore();
  const [imageUpload, setImageUpload] = useState(null);
  const [imgSrc, setImgSrc] = useState(null);
  const isMounted = useRef(false);
  const imgRef = useRef();
  const canvasRef = useRef();

  function upload() {
    if (imageUpload === null) return;
    const imageRef = ref(storage, `images/${FB_images.length}`);
    uploadBytes(imageRef, imageUpload).then((snapshot) => {
      getDownloadURL(snapshot.ref)
      .then((url) => setImgSrc(url))
      .catch((error) => console.log(error));
    });
  };
  
  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true;
    } else {if (imageUpload) {
      let img = new Image ();
      img.crossOrigin = 'anonymous';
      img.src = imgSrc;
      img.onload = function () {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const newSize = 630;
        canvas.width = newSize;
        canvas.height = newSize;
        const size = Math.min(img.width, img.height);
        ctx.drawImage(img,
          (img.width - size) / 2,
          (img.height - size) / 2,
          size,
          size,
          0, 0, newSize, newSize);
          pica.resize(canvasRef.current, document.createElement('canvas'))
          .then((res) => {
            res.toBlob(blob => {
              const deleteRef = ref(storage, `images/${FB_images.length}`);
              deleteObject(deleteRef)
              .then(() => {
                FB_images_add(`images/${FB_images.length}`);
                const imageRef = ref(storage, `images/${FB_images.length}`);
                uploadBytes(imageRef, blob)
              });
            }, 'image/jpg', 0.95);
          })
        }
      }
    }
  }, [imgSrc]);

  const imgsrc = useRef();
  // getDownloadURL(ref(storage, "images/1").then((url) => {
  //   imgsrc.current.setAttribute('src', url);
  // }))
  return (
    <div>
      <input type="file" onChange={(e) => setImageUpload(e.target.files[0])}/>
      <button onClick={upload}>업로드</button>  
      <img style={{'display': 'none'}} ref={imgRef} src={imgSrc} alt="Source" />
      <canvas ref={canvasRef} />
      <img ref={imgsrc} />
    </div>
  );
};

function Home() {
  const { FB_images, FB_images_add } = useStore();
  function FB_images_init() {
    listAll(imageListRef).then((response) => {
      response.items.map((item) => {
        FB_images_add(item.name)
      });
    });
  }

  useEffect(() => {
    FB_images_init();
    // .then
  }, []);

  return (
    <>
      <div>
        <ImageUploader />
      </div>
    </>
  )
}

export default Home;