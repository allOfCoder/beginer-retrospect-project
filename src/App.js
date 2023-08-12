import React from "react";
import {
  HashRouter,
  Route,
  Routes,
} from "react-router-dom";
import './App.css';
import Home from './pages/Home'
import Profile from './pages/Profile'
import Login from './pages/Login';

function App() {
  return (
    <div>
      <HashRouter>
        <Routes>
          <Route path="/" element={<Home />}></Route>
          <Route path="/login" element={<Login />}></Route>
          <Route path="/:id" element={<Profile />}></Route>
        </Routes>
      </HashRouter>
    </div>
  );
}

export default App;
