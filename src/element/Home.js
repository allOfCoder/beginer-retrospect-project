import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { styled } from "styled-components";
import { axios } from "axios";
import { initializeApp } from 'firebase/app';
import { 
  getStorage,
  ref, 
  uploadBytes, 
  listAll, 
  getDownloadURL 
} from "firebase/storage";
import Pica from "pica";
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
const storageRef = ref(storage);
const imageListRef = ref(storage, "images/");

const ImageUploader = () => {
  const [imageUpload, setImageUpload] = useState(null);
  const [imgSrc, setImgSrc] = useState(null);
  const imgRef = useRef();
  const canvasRef = useRef();

  function upload() {
    if (imageUpload === null) return;
    const imageRef = ref(storage, `images/${imageUpload.name}`);
    uploadBytes(imageRef, imageUpload).then((snapshot) => {
      getDownloadURL(snapshot.ref).then((url) => {
        setImgSrc(url);
      });
    });
  };

  listAll(imageListRef).then((response) => {
    getDownloadURL(response.items[1]).then((url) => {
      setImgSrc(url);
    });
  });

  useEffect(() => {
    // if (imgRef.current) {
    //   imgRef.current.onload = function() {
    //     console.log('a')
    //     if (canvasRef.current) {
    //       const ctx = canvasRef.current.getContext('2d');
    //       const targetWidth = '630px';
    //       const targetHeight = '630px';
    //       canvasRef.current.width = targetWidth;
    //       canvasRef.current.height = targetHeight;

    //       ctx.drawImage(imgRef.current, 0, 0, targetWidth, targetHeight);

    //       pica.resize(canvasRef.current, document.createElement('canvas'), {}, (err, result) => {
    //         if (err) throw err;
    //         console.log(result);
    //       });
    //     }
    //   };
    // }

    
    if (imgRef.current) {
      if (canvasRef.current) {
        var img = new Image ();
        img.crossOrigin = 'anonymous';
        img.src = imgSrc;
        img.onload = function () {
          const ctx = canvasRef.current.getContext('2d');
          const targetWidth = '630';
          const targetHeight = '630';
          canvasRef.current.width = targetWidth;
          canvasRef.current.height = targetHeight;
          ctx.drawImage(imgRef.current, 0, 0, targetWidth, targetHeight);
          
          // pica.resize(canvasRef.current, document.createElement('canvas'), {}
          // ).then((res) => {
          //   console.log(res);
          // }).catch((err) => {
          //   console.log(err);
          // });
        }
      };
    }
  }, [imgSrc]);

  return (
    <div>
      <input type="file" onChange={(e) => setImageUpload(e.target.files[0])}/>
      <button onClick={upload}>업로드</button>  
      <img ref={imgRef} src={imgSrc} alt="Source" />
      <canvas ref={canvasRef} />
      {/* Render resized image here, for instance: */}
      {/* <img src={resizedImageObjectURL} alt="Resized" /> */}
    </div>
  );
};

function Home(props) {
    
  return (
    <>
      <div>
        <ImageUploader />
      </div>
    </>
  )
}

export default Home;