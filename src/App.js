import React from "react";
import {
  BrowserRouter,
  Route,
  Routes,
} from "react-router-dom";
import './App.css';
import Home from './element/Home'
import Feed from './element/Feed'
import Login from './element/Login';

function App() {
  return (
    <div>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />}></Route>
            <Route path="/login" element={<Login />}></Route>
            <Route path="/feed/:id" element={<Feed />}></Route>
          </Routes>
        </BrowserRouter>
      </div>
  );
}

export default App;
