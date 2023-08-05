import { create } from 'zustand'
import { auth } from '../firebaseConfig'

const useAuthStore = create((set)=>({
  AUTH_uid : null,
  AUTH_setUid : (val) => {
    set( (prev) => ({ AUTH_uid : val }) )
    return Promise.resolve(val);
  }
}))

auth.onAuthStateChanged((user) => {
  if (user) {
    useAuthStore.getState().AUTH_setUid(user.uid);
  } else {
    useAuthStore.getState().AUTH_setUid(null);
  }
});

export default useAuthStore;