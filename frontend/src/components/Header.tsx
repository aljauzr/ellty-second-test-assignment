import React from 'react';
import { useAuth } from '../AuthContext';
import './Header.css';

const Header: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <header className="app-header">
      <div className="header-content">
        <h1>Number Discussions</h1>
        <p className="tagline">A world where people communicate by numbers</p>
      </div>
      
      {user && (
        <div className="user-info">
          <span>Welcome, <strong>{user.username}</strong></span>
          <button onClick={logout} className="logout-btn">
            Logout
          </button>
        </div>
      )}
    </header>
  );
};

export default Header;
