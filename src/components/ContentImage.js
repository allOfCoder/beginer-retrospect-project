import React, { useState, useEffect, useRef } from "react";
import styled from "styled-components";
import { storage, db } from '../firebaseConfig'
import {
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
function ContentImage() {
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
  const imageListRef = storageRef(storage, "images/");
  const addedImagesSet = useRef(new Set()).current;
  
  useEffect(() => {
    // 첫 이미지들 렌더링
    function initialRender() {
      const firstPage = list(imageListRef, { maxResults: RENDER_INITIAL })
      firstPage.then((res) => {
        res.prefixes.map((folder) => {
          const imageRef = storageRef(storage, `${folder.fullPath}/0`);
          if (!addedImagesSet.has(imageRef.fullPath)) {
            addedImagesSet.add(imageRef.fullPath);
            STORAGE_imagesAddPush(imageRef);
          }
        });
        STORAGE_imagesSetNextPageToken(res.nextPageToken);
      })
    }
    initialRender()
  }, []);
  
  useEffect(() => {
    // imageUrls에 따라 fetch
    async function fetchUrls() {
      const urls = await Promise.all(
        STORAGE_images.map((ref) => getDownloadURL(ref))
      );
      setImageUrls(urls);
    }
    fetchUrls();
  }, [STORAGE_images]);
  
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
    const nextPage = list(imageListRef, { 
      maxResults: RENDER_ADDITIONAL,
      pageToken: STORAGE_imagesNextPageToken,
    })
    nextPage.then((res) => {
      if (STORAGE_imagesNextPageToken) {
        res.items.map((item) => {
          if (!addedImagesSet.has(item.fullPath)) {
            addedImagesSet.add(item.fullPath);
            STORAGE_imagesAddPush(item);
          }
        });
        STORAGE_imagesSetNextPageToken(res.nextPageToken);
      }
    })
  }
  
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

export default ContentImage;