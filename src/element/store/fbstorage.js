import { create } from 'zustand'

const useStorageStore = create((set)=>({
  STORAGE_images : [], // 썸네일 이미지들의 reference가 들어있음
  STORAGE_imagesTime : null,
  STORAGE_imagesNextPageToken : '',
  STORAGE_imagesTimeSet : () => {
    const now = Date.now();
    const time = 2000000000000 - now;
    set( () => ({STORAGE_imagesTime : time}));
    return time;
    // 더 나중에 저장한 이미지가 앞에 오도록 함
  },
  STORAGE_imagesAddUnshift: (value) => set( (prev) => ({
    STORAGE_images : [value, ...prev.STORAGE_images]
  }) ),
  STORAGE_imagesAddPush : (value) => set( (prev) => ({
    STORAGE_images : [...prev.STORAGE_images, value]
  }) ),
  STORAGE_imagesSetNextPageToken : (value) => set( () => ({
    STORAGE_imagesNextPageToken : value
  }) )
}))

export default useStorageStore;