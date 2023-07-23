import { create } from 'zustand'

const useStore = create((set)=>({
  FB_images : [],
  FB_images_time : null,
  FB_images_time_set : () => {
    const now = Date.now()
    set( () => ({FB_images_time : now}))
    return now;
  },
  FB_images_add : (value) => set( (prev) => ({
    FB_images : [...prev.FB_images, value]
  }) )
}))

export default useStore;