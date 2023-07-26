import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { styled } from "styled-components";
import { initializeApp } from 'firebase/app';
import { 
  getStorage,
  ref,
  uploadBytes, 
  list, 
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

function ImageUploader() {
  const { FB_images, FB_images_add_unshift, FB_images_time, FB_images_time_set } = useStore();
  const [imageUpload, setImageUpload] = useState(null);
  const [imgSrc, setImgSrc] = useState(null);
  const isMounted = useRef(false);
  const canvasRef = useRef();

  function upload() {
    if (imageUpload === null) return;
    const imageRef = ref(storage, `images/${FB_images_time_set()}`);
    uploadBytes(imageRef, imageUpload).then((snapshot) => {
      getDownloadURL(snapshot.ref)
      .then((url) => setImgSrc(url))
      .catch((error) => console.log(error));
    });
    imageUpload.value = '';
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
          let resizedCanvas = document.createElement('canvas');
          resizedCanvas.width = newSize;
          resizedCanvas.height = newSize;
          pica.resize(canvasRef.current, resizedCanvas)
          .then((res) => {
            res.toBlob(blob => {
              const deleteRef = ref(storage, `images/${FB_images_time}`);
              deleteObject(deleteRef)
              .then(() => {
                const imageRef = ref(storage, `images/${FB_images_time}`);
                uploadBytes(imageRef, blob).then(() => {
                  console.log('Uploaded')
                  FB_images_add_unshift(imageRef);
                })
              });
            }, 'image/jpg', 0.85);
          })
        }
      }
    }
  }, [imgSrc]);

  return (
    <div>
      <input type="file" onChange={(e) => setImageUpload(e.target.files[0])}/>
      <button onClick={upload}>업로드</button>  
      <canvas style={{'display': 'none'}} ref={canvasRef} />
    </div>
  );
};

const Container = styled.div`
  width: 100%;
  height: 100%;
`
const Contents = styled.div`
  width: 810px;
  height: 100%;
  margin : 30px auto;
  display : flex;
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: start;
`
const Content = styled.img`
  width: 260px;
  height: 260px;
  margin: 0 10px 10px 0;
`
function ContentImage() {
  const {
    FB_images,
    FB_images_add_push,
    FB_images_nextPageToken,
    FB_images_set_nextPageToken
  } = useStore();
  const [imageUrls, setImageUrls] = useState([]);
  const loader = useRef(null);

  useEffect(() => {
    async function fetchUrls() {
      const urls = await Promise.all(
        FB_images.map((ref) => getDownloadURL(ref))
      );
      setImageUrls(urls);
    }
    fetchUrls();
  }, [FB_images]);
  
  function loadMore() {
    console.log('Loading more...');
    const nextPage = list(imageListRef, { 
      maxResults: 3,
      pageToken: FB_images_nextPageToken,
    })
    nextPage.then((res) => {
      if (FB_images_nextPageToken) {
        res.items.map((item) => {
          FB_images_add_push(item);
        });
        FB_images_set_nextPageToken(res.nextPageToken);
      }
    }
    )
  }

  useEffect(() => {
    const options = {
      root: null,
      rootMargin: '0px',
      threshold: 0
    }
    const observer = new IntersectionObserver((entries) => {
      const target = entries[0];
      if (target.isIntersecting) {
        loadMore();
        observer.unobserve(loader.current)
      }
    }, options);
    if (loader.current) {
      observer.observe(loader.current)
    }
  }, [imageUrls]);

  return (
    <Container>
      <Contents>
        {imageUrls.map((url, index, arr) => {
          if (url === arr[arr.length - 1]) {
            return <Content ref={loader} key={index} src={url} loading="lazy" />
          }
          return <Content key={index} src={url} loading="lazy" />
        })}
      </Contents>
    </Container>
  )
}

function Home() {
  const {
    FB_images,
    FB_images_add_push,
    FB_images_nextPageToken,
    FB_images_set_nextPageToken
  } = useStore();
  function FB_images_init() {
    const firstPage = list(imageListRef, { maxResults: 12 })
    firstPage.then((res) => {
      res.items.map((item) => {
        FB_images_add_push(item);
      });
      FB_images_set_nextPageToken(res.nextPageToken);
    })
  }

  function handleRendering() {
    const nextPage = list(imageListRef, { 
      maxResults: 6,
      pageToken: FB_images_nextPageToken,
    })
    nextPage.then((res) => {
      res.items.map((item) => {
        FB_images_add_push(item);
      });
      FB_images_set_nextPageToken(res.nextPageToken);
    })
  }
  
  useEffect(() => {
    FB_images_init()
    // .then
  }, []);

  return (
    <div>
      <ImageUploader />
      <button onClick={handleRendering}>렌더링</button>
      <ContentImage />
    </div>
  )
}

export default Home;