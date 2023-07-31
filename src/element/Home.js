import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { styled } from "styled-components";
import { initializeApp } from 'firebase/app';
import { 
  getStorage,
  ref,
  uploadBytes, 
  list,
  listAll,
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
const IMAGE_SIZE_TO = 630;

const app = initializeApp(firebaseConfig);
const storage = getStorage(app);
const imageListRef = ref(storage, "images/");

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
    FB_images_time_set,
  } = useFBStore();
  const [album, setAlbum] = useState([]);
  const [blobAlbum, setBlobAlbum] = useState([]);
  const canvasRef = useRef();

  function resizeImage(url) { // url => url
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
    const time = FB_images_time_set();
    const promise = blobAlbum.map((blob, index) => {
        const imageRef = ref(storage, `images/${time}/${index}`);
        const uploadTask = uploadBytes(imageRef, blob);
        URL.revokeObjectURL(album[index]);
        return uploadTask;
      });
    Promise.all(promise)
    .then(() => {
      console.log('Upload completed successfully')
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
                multiple 
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
  const {
    openModal,
    setModalImgSrc,
    setModalImgRef,
    setModalContent,
  } = useStore();
  const [imageUrls, setImageUrls] = useState([]);
  const loader = useRef(null);
  
  useEffect(() => {
    // init 함수, 첫 이미지들 렌더링
    function FB_images_init() {
      const firstPage = list(imageListRef, { maxResults: RENDER_INITIAL })
      firstPage.then((res) => {
        res.prefixes.map((folder) => {
          const imageRef = ref(storage, `${folder.fullPath}/0`);
          FB_images_add_push(imageRef);
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
    })
  }
  
  function handleFeedClick(e, index) {
    e.preventDefault();
    setModalImgSrc(e.target.src);
    setModalImgRef(FB_images[index].parent);
    openModal();
    setModalContent(<Feed />);
  }
  
  return (
    <Container>
      <Contents>
        {imageUrls.map((url, index, arr) => {
          if (url === arr[arr.length - 1]) {
            return <Content ref={loader} 
                            onClick={(e) => handleFeedClick(e, index)} 
                            key={index} 
                            src={url} 
                            loading="lazy" />
          }
          return <Content onClick={(e) => handleFeedClick(e, index)} 
                          key={index} 
                          src={url} 
                          loading="lazy" /> // if 없앨 수 있는 지 테스트 하기
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

const CarouselContainer = styled.div`
  width: 630px;
  height: 630px;
  overflow: hidden;
  position: relative; 
`
const CarouselFrame = styled.div`
  width: calc(8 * 630px);
  height: 630px;
  display: flex;
  flex-direction: row;
  align-items: center;
  margin: 0;
`
const FeedImg = styled.img`
  width: 630px;
  height: 630px;
  margin: 0;
`
const CarouselNavigate = styled.button`
  width: 30px;
  height: 30px;
  border: 1px solid black;
  position: absolute;
  right: ${(props) => (props.direction === 'right' ? '0' : null)};
  left: ${(props) => (props.direction === 'left' ? '0' : null)};
  top: 50%;
  z-index: 1010;
`
const CarouselPagination = styled.div`
  display: flex;
  justify-content: center;
  position: absolute;
  left: 50%;
  transform: translate(-50%);
  bottom: 3%;
  > * {
    margin: 2px;
  }
`
const Circle = styled.div`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: ${(props) => (props.selected ? 
  'rgba(255, 255, 255, 1)' : 'rgba(255, 255, 255, 0.5)')};
  bottom: 30px;
  z-index: 1010;
`
function Carousel() {
  const {modalImgRef, modalImgSrc} = useStore();
  const [feedUrls, setFeedUrls] = useState([]);
  const [carouselPage, setCarouselPage] = useState(0);
  const frame = useRef();

  useEffect(() => {
    async function getFeedUrls() {
      const res = await listAll(modalImgRef);
      const urls = [];
      for (const item of res.items) {
        const url = await getDownloadURL(item);
        urls.push(url);
      }
      setFeedUrls(prev => [...prev, ...urls]);
    }
    getFeedUrls();
  }, [])

  function previousPage() {
    setCarouselPage((prev) => {
      const next = prev - 1;
      frame.current.style.transform = `translate(-${next * 630}px)`
      return next
    })
  }
  function nextPage() {
    setCarouselPage((prev) => {
      const next = prev + 1
      frame.current.style.transform = `translate(-${next * 630}px)`
      return next
    })
  }
  return (
    <CarouselContainer>
      {carouselPage > 0 ? 
      <CarouselNavigate direction={'left'} onClick={() => previousPage()} /> : null}
      {carouselPage < feedUrls.length - 1 ? 
      <CarouselNavigate direction={'right'} onClick={() => nextPage()} /> : null}
      
      <CarouselPagination>
      {feedUrls.map((a, index) => {
        return <Circle selected={carouselPage === index} key={index} />
      })}
      </CarouselPagination>
      
      <CarouselFrame ref={frame}>
        {feedUrls[0] ? null : <FeedImg src={modalImgSrc} />}
        {feedUrls.map((url, index) => {
          return <FeedImg src={url} key={index} />;
        })}
      </CarouselFrame>
    </CarouselContainer>
  )
}

const FeedContents = styled.div`
  display: flex;
  flex-direction: row;
  z-index: 1001;
`
const FeedComment = styled.div`
  width: 350px;
  height: 630px;
  background-color: white;
  z-index: 1002;
`
function Feed() {
  return (
    <FeedContents>
      <Carousel />
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