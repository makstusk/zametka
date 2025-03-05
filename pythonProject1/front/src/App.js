import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navigation from './Navigation';
import Home from './Home';
import Login from './Login';
import Register from './Register';
import Profile from './Profile';
import WorkspacePage from './WorkspacePage';
import PageDetails from './PageDetails';
import './global.css';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="*"
          element={
            <Navigation>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/workspaces/:id" element={<WorkspacePage />} />
                <Route path="/pages/:pageId" element={<PageDetails />} />
              </Routes>
            </Navigation>
          }
        />
      </Routes>
    </Router>
  );
};

export default App;
