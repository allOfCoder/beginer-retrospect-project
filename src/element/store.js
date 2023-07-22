import { create } from 'zustand'

const useStore = create((set)=>({
  FB_images : [],
  FB_images_add : (value) => set( (prev) => ({
    FB_images : [...prev.FB_images, value]
  }) )
}))

export default useStore;