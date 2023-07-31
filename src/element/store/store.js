import { create } from 'zustand'

const useStore = create((set)=>({
  modalImgSrc : '',
  setModalImgSrc : (val) => set( (state) => ({ modalImgSrc : val }) ),
  modalImgRef : '',
  setModalImgRef : (val) => set( (state) => ({ modalImgRef : val }) ),
  modalOpen : false,
  openModal : () => set( () => ({ modalOpen : true }) ),
  closeModal : () => set( () => ({ modalOpen : false }) ),
  modalContent : <></>,
  setModalContent : (val) => set( () => ({ modalContent : val }) ),
}))

export default useStore;