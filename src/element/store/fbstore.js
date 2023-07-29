import { create } from 'zustand'

const useFBStore = create((set)=>({
  FB_images : [],
  FB_images_time : null,
  FB_images_nextPageToken : '',
  FB_images_time_set : () => {
    const now = Date.now();
    const time = 2000000000000 - now;
    set( () => ({FB_images_time : time}));
    return time;
    // 더 나중에 저장한 이미지가 앞에 오도록 함
  },
  FB_images_add_unshift: (value) => set( (prev) => ({
    FB_images : [value, ...prev.FB_images]
  }) ),
  FB_images_add_push : (value) => set( (prev) => ({
    FB_images : [...prev.FB_images, value]
  }) ),
  FB_images_set_nextPageToken : (value) => set( () => ({
    FB_images_nextPageToken : value
  }) )
}))

export default useFBStore;