import { create } from 'zustand'

const useAuthStore = create((set)=>({
  AUTH_uid : null,
  AUTH_setUid : (val) => {
    set( (prev) => ({ AUTH_uid : val }) )
    return Promise.resolve(val);
  }
}))

export default useAuthStore;