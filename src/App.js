import React from "react";
import {
  BrowserRouter,
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
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />}></Route>
            <Route path="/login" element={<Login />}></Route>
            <Route path="/:id" element={<Profile />}></Route>
          </Routes>
        </BrowserRouter>
      </div>
  );
}

export default App;
