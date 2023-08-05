import { create } from 'zustand'

const useDBStore = create((set)=>({
  DB_time : 'VALUE',
  DB_setTime : (val) => set( (state) => ({ DB_time : state.DB_time }) )
}))

export default useDBStore;