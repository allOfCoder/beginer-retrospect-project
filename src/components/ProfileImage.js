import React, { useState, useEffect, useRef } from "react";
import styled from "styled-components";
import { storage, db } from '../firebaseConfig'
import { 
  getStorage,
  ref as storageRef,
  list,
  getDownloadURL,
} from "firebase/storage";
import { ref as dbRef, set, get, child, query, orderByChild } from "firebase/database";
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
  } = useStorageStore();
  const {
    openModal,
    setModalImgSrc,
    setModalImgRef,
    setModalContent,
  } = useStore();
  const {
    AUTH_uid,
    AUTH_userName
  } = useAuthStore();
  const [imageUrls, setImageUrls] = useState([]);
  const loader = useRef(null);
  const [renderCount, setRenderCount] = useState(0);
  const [imagesArrays, setImagesArrays] = useState([]);
  
  useEffect(() => {
    // 첫 이미지 ref들 저장
    async function initialRender() {
      let snapshotFeedNamesArray = [];
      const userRef = dbRef(db, `users/${ AUTH_uid}`);
      await get(child(userRef, 'feeds')).then((snapshot) => {
        const snapshotFeedNamesObject = snapshot.val();
        snapshotFeedNamesArray = Object.values(snapshotFeedNamesObject);
      });
      const refs = await Promise.all(
        snapshotFeedNamesArray.map((feedName) => {
          const imageRef = storageRef(storage, `images/${feedName.name}/0`);
          return imageRef
        })
      )

      const newImagesArrays = [];
      for (let i = 0; i < 1 + Math.floor(snapshotFeedNamesArray.length / 12); i++) {
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
    const integratedImagesArray = imagesArrays.flatMap(innerArray => innerArray);
    setModalImgRef(integratedImagesArray[index].parent);
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