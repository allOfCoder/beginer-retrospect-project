import React, { useState, useEffect, useRef } from "react";
import { styled } from "styled-components";
import { listAll, getDownloadURL } from "firebase/storage";
import useStore from '../store/store';

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
  right: ${(props) => (props.$direction === 'right' ? '0' : null)};
  left: ${(props) => (props.$direction === 'left' ? '0' : null)};
  top: 50%;
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
      <CarouselFrame ref={frame}>
        {feedUrls[0] ? null : <FeedImg src={modalImgSrc} />}
        {feedUrls.map((url, index) => {
          return <FeedImg src={url} key={index} />;
        })}
      </CarouselFrame>
      
      {carouselPage > 0 ? 
      <CarouselNavigate $direction={'left'} onClick={() => previousPage()} /> : null}
      {carouselPage < feedUrls.length - 1 ? 
      <CarouselNavigate $direction={'right'} onClick={() => nextPage()} /> : null}
      
      <CarouselPagination>
      {feedUrls.map((a, index) => {
        return <Circle selected={carouselPage === index} key={index} />
      })}
      </CarouselPagination>
    </CarouselContainer>
  )
}

const MenuScrim = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
`
const MenuContainer = styled.div`
  width: 440px;
  height: auto;
  background-color: white;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
`
const MenuButton = styled.div`
  width: 100%;
  height: 40px;
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  border-width: ${(props) => (props.$noline ? '0 0 0 0' : '0 0 1px 0')};
  border-style: solid;
  border-color: #c8c8c8;
  user-select: none;
  cursor: pointer;
`
function FeedMenu() {
  const {
    feedMenuOpen,
    openFeedMenu,
    closeFeedMenu,
  } = useStore();

  function handleDeleteButton() {
    console.log('삭제')
  }

  if (feedMenuOpen) {
    return (
      <MenuScrim onClick={(e) => {
        if (e.target === e.currentTarget) {
          closeFeedMenu();
        }}}>
        <MenuContainer>
          <MenuButton onClick={handleDeleteButton}>삭제</MenuButton>
          <MenuButton>1</MenuButton>
          <MenuButton>2</MenuButton>
          <MenuButton>3</MenuButton>
          <MenuButton>4</MenuButton>
          <MenuButton $noline={true}>5</MenuButton>
        </MenuContainer>
      </MenuScrim>
    )
  }
}

const FeedContents = styled.div`
  display: flex;
  flex-direction: row;
`
const FeedInformation = styled.div`
  width: 350px;
  height: 630px;
  background-color: white;
  display: flex;
  justify-content: space-between;
`
const FeedMenuButton = styled.div`
  width: 24px;
  height: 24px;
  border: 1px solid black;
`
function Feed() {
  const {feedMenuOpen, openFeedMenu} = useStore();

  function handleFeedMenuOpen() {
    console.log('feed menu open');
    console.log(feedMenuOpen);
    openFeedMenu();
  }

  return (
    <FeedContents>
      <Carousel />
      <FeedInformation>
        <span>프로필</span>
        <FeedMenuButton onClick={(e) => handleFeedMenuOpen()} />
        <FeedMenu />
      </FeedInformation>
    </FeedContents>
  )
}

export default Feed;