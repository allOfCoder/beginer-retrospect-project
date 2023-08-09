import React, { useState, useEffect, useRef } from "react";
import styled from "styled-components";
import { storage, db } from '../firebaseConfig'
import { 
  getStorage,
  ref as storageRef,
  list,
  getDownloadURL,
} from "firebase/storage";
import { ref as dbRef, set, get, child } from "firebase/database";
import Feed from './Feed'
import useStorageStore from '../store/fbstorage';
import useAuthStore from '../store/fbauth';
import useStore from '../store/store';
import {
  RENDER_INITIAL,
  RENDER_ADDITIONAL,
} from '../constants';

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
function ProfileImage() {
  const {
    STORAGE_images,
    STORAGE_imagesAddPush,
    STORAGE_imagesNextPageToken,
    STORAGE_imagesSetNextPageToken
  } = useStorageStore();
  const {
    openModal,
    setModalImgSrc,
    setModalImgRef,
    setModalContent,
  } = useStore();
  const {
    AUTH_uid
  } = useAuthStore();
  const [imageUrls, setImageUrls] = useState([]);
  const loader = useRef(null);
  const [renderCount, setRenderCount] = useState(0);
  const [feedNames, setFeedNames] = useState([]);
  const [imagesArrays, setImagesArrays] = useState([]);
  
  useEffect(() => {
    // 첫 이미지 ref들 저장
    async function initialRender() {
      const userRef = dbRef(db, 'users/' + AUTH_uid);
      let snapshotFeedNames = [];
      await get(child(userRef, 'feeds')).then((snapshot) => {
        snapshotFeedNames = snapshot.val();
      });
      const refs = await Promise.all(
        snapshotFeedNames.map((feedName) => {
          const imageRef = storageRef(storage, 'images/' + feedName + '/0');
          return imageRef
        })
      )

      const newImagesArrays = [];
      for (let i = 0; i < 1 + Math.floor(feedNames.length / 12); i++) {
        const start = i * 12;
        const end = (i + 1) * 12;
        const imagesArraySection = [...refs].reverse().slice(start, end);
        newImagesArrays.push(imagesArraySection)
      }
      setImagesArrays((prev) => [...prev, ...newImagesArrays]); 
    }
    initialRender()
  }, []);
  
  useEffect(() => {
    if(imagesArrays.length > 0) {
      loadMore();
    }
  }, [imagesArrays]);
  
  async function loadMore() {
    if (!imagesArrays[renderCount]) return;
    const urls = await Promise.all(
      imagesArrays[renderCount].map((ref) => {
        return getDownloadURL(ref)
      })
    );
    setRenderCount((prev) => prev + 1);
    setImageUrls(urls);
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

  function handleFeedClick(e, index) {
    e.preventDefault();
    setModalImgSrc(e.target.src);
    setModalImgRef(STORAGE_images[index].parent);
    openModal();
    setModalContent(<Feed />);
  }
  
  return (
    <Container>
      <Contents>
        {imageUrls.map((url, index, arr) => {
          return <Content ref={loader} 
                          onClick={(e) => handleFeedClick(e, index)} 
                          key={index} 
                          src={url} 
                          loading="lazy" />
        })}
      </Contents>
    </Container>
  )
}

export default ProfileImage;