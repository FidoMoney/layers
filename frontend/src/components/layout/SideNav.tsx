import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './SideNav.css';

const SideNav: React.FC = () => {
  const location = useLocation();

  return (
    <nav className="side-nav">
      <div className="nav-header">
        <h2>Layers</h2>
      </div>
      
      <ul className="nav-links">
        <li>
          <Link to="/" className={location.pathname === '/' ? 'active' : ''}>
            <span className="icon">📊</span>
            Dashboard
          </Link>
        </li>
        <li>
          <Link to="/events" className={location.pathname === '/events' ? 'active' : ''}>
            <span className="icon">📈</span>
            Events
          </Link>
        </li>
      </ul>
    </nav>
  );
};

export default SideNav; 