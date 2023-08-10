import { create } from 'zustand'
import { auth, db } from '../firebaseConfig'
import { ref as dbRef, get, child } from "firebase/database";

const useAuthStore = create((set)=>({
  AUTH_uid : null,
  AUTH_setUid : (val) => {
    set( (prev) => ({ AUTH_uid : val }) )
    return Promise.resolve(val);
  },
  AUTH_userName : null,
  AUTH_setUserName : (val) => set( (prev) => ({ AUTH_userName : val }) ),
}))

auth.onAuthStateChanged((user) => {
  if (user) {
    useAuthStore.getState().AUTH_setUid(user.uid);
    get(child(dbRef(db), 'users/' + user.uid + '/id'))  
    .then((snapshot) => {
      if (snapshot.val()) {
        useAuthStore.getState().AUTH_setUserName(snapshot.val());
      }
    })
  } else {
    useAuthStore.getState().AUTH_setUid(null);
  }
});

export default useAuthStore;