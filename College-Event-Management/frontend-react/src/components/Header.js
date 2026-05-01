import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Header = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="header">
      <div className="header-content">
        <div className="logo">CHARUSAT Events</div>
        
        <nav className="nav">
          <Link to="/" className="nav-btn">Home</Link>
          <Link to="/events" className="nav-btn">Events</Link>
          
          {isAuthenticated() && (
            <>
              <Link to="/dashboard" className="nav-btn">Dashboard</Link>
              
              {user?.role === 'organizer' && (
                <Link to="/create-event" className="nav-btn">Create Event</Link>
              )}
              
              <button onClick={handleLogout} className="nav-btn">
                Logout
              </button>
            </>
          )}
        </nav>
        
        {isAuthenticated() && (
          <div className="user-info">
            Welcome, {user?.name} ({user?.role})
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
