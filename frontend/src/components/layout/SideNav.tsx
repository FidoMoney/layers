import { NavLink } from 'react-router-dom';
import './SideNav.css';

const SideNav = () => {
  return (
    <nav className="side-nav">
      <div className="nav-header">
        <h2>Layers</h2>
      </div>
      <ul className="nav-links">
        <li>
          <NavLink to="/" end>
            <span className="icon">🏠</span>
            Home
          </NavLink>
        </li>
        <li>
          <NavLink to="/settings">
            <span className="icon">⚙️</span>
            Settings
          </NavLink>
        </li>
      </ul>
    </nav>
  );
};

export default SideNav; 