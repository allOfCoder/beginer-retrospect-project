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
import useFBStore from './store/fbstore'
import useStore from './store/store'
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

const RENDER_INITIAL = 12;
const RENDER_ADDITIONAL = 6;

const app = initializeApp(firebaseConfig);
const storage = getStorage(app);
const imageListRef = ref(storage, "images/");

const ImageInputContainer = styled.div`
  width: 630px;
  height: 630px;
  background-color: white;
`
function Uploader() {
  const {
    FB_images,
    FB_images_add_unshift,
    FB_images_time,
    FB_images_time_set
  } = useFBStore();
  const [imageUpload, setImageUpload] = useState(null);
  const [imgSrc, setImgSrc] = useState(null);
  const [album, setAlbum] = useState([]);
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
    } else {
      if (imageUpload) {
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
                  window.location.reload();
                })
              });
            }, 'image/jpg', 0.85);
          })
        }
      }
    }
  }, [imgSrc]);

  const [a, setA] = useState('');
  return (
    <ImageInputContainer>
      <div>
        <input type="file" 
                multiple 
                onChange={(e) => {
                  setImageUpload(e.target.files[0]);
                  const url = URL.createObjectURL(e.target.files[0]);
                  console.log(url);
                  setA(url)
                }}/>
        <button onClick={upload}>업로드</button>
        <canvas style={{'display': 'none'}} ref={canvasRef} />
        <img src={a} />
      </div>
      <div>

      </div>
    </ImageInputContainer>
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
  } = useFBStore();
  const [imageUrls, setImageUrls] = useState([]);
  const loader = useRef(null);
  const {
    openModal,
    setModalImgSrc,
    setModalContent,
  } = useStore();

  useEffect(() => {
    // init 함수, 첫 이미지들 렌더링
    function FB_images_init() {
      const firstPage = list(imageListRef, { maxResults: RENDER_INITIAL })
      firstPage.then((res) => {
        res.items.map((item) => {
          FB_images_add_push(item);
        });
        FB_images_set_nextPageToken(res.nextPageToken);
      })
    }
    FB_images_init()
    // .then
  }, []);

  useEffect(() => {
    // imageUrls에 따라 fetch
    async function fetchUrls() {
      const urls = await Promise.all(
        FB_images.map((ref) => getDownloadURL(ref))
      );
      setImageUrls(urls);
    }
    fetchUrls();
  }, [FB_images]);

  function loadMore() {
    // observ 감지해서 추가 렌더링
    console.log('Loading more...');
    const nextPage = list(imageListRef, { 
      maxResults: RENDER_ADDITIONAL,
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
    // observer 부여, observe, unobserve
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

  function handleFeedClick(e) {
    e.preventDefault();
    setModalImgSrc(e.target.src);
    openModal();
    setModalContent(<Feed />);
  }

  return (
    <Container>
      <Contents>
        {imageUrls.map((url, index, arr) => {
          if (url === arr[arr.length - 1]) {
            return <Content ref={loader} 
                            onClick={handleFeedClick} 
                            key={index} 
                            src={url} 
                            loading="lazy" />
          }
          return <Content onClick={handleFeedClick} 
                          key={index} 
                          src={url} 
                          loading="lazy" />
        })}
      </Contents>
    </Container>
  )
}

const Scrim = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`
function Modal({ content }) {
  const {
    modalOpen,
    closeModal,
  } = useStore();

  if (modalOpen) {
    return (
      <Scrim onClick={(e) => {
        if (e.target === e.currentTarget) {
          closeModal();
        }}}>
        {content}
      </Scrim>
    )
  }
}

const FeedContents = styled.div`
  display: flex;
  flex-direction: row;
  z-index: 1001;
`
const FeedImg = styled.img`
  width: 630px;
  height: 630px;
  z-index: 1002;
  `
const FeedComment = styled.div`
  width: 350px;
  height: 630px;
  background-color: white;
  z-index: 1002;
`
function Feed() {
  const {modalImgSrc} = useStore();
  return (
    <FeedContents>
      <FeedImg src={modalImgSrc} />
      <FeedComment />
    </FeedContents>
  )
}

function Home() {
  const {
    openModal,
    modalContent,
    setModalContent,
  } = useStore();
  return (
    <React.Fragment>
      <button onClick={() => {
        openModal();
        setModalContent(<Uploader />);
      }}>만들기</button>
      <ContentImage />
      <Modal content={modalContent} />  {/* <Feed />, <Uploader /> */}
    </React.Fragment>
  )
}

export default Home;