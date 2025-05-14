import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Plus, LayoutDashboard, BarChart2, Settings, User, Search, Map } from 'lucide-react';
import PromptModal from '../modals/PromptModal';
import ResultModal from '../modals/ResultModal';
import { analyticsService } from '../../services/analyticsService';
import './SideNav.css';
import ServerStatus from './ServerStatus';

const LogoIcon: React.FC = () => (
  <div className="logo-circle">
    {/* Placeholder SVG logo, replace with your own if needed */}
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g>
        <path d="M8 10c4-2.5 12-2.5 16 0" stroke="#B71C3B" strokeWidth="2.5" strokeLinecap="round"/>
        <path d="M8 16c4-2.5 12-2.5 16 0" stroke="#E65100" strokeWidth="2.5" strokeLinecap="round"/>
        <path d="M8 22c4-2.5 12-2.5 16 0" stroke="#F9A825" strokeWidth="2.5" strokeLinecap="round"/>
      </g>
    </svg>
  </div>
);

const CreateButtonTop: React.FC<{ onClick: () => void; isActive?: boolean }> = ({ onClick, isActive }) => (
  <button className={`create-button-top${isActive ? ' active' : ''}`} onClick={onClick} aria-label="Create New">
    <Plus size={22} />
  </button>
);

const CreateDropdownTop: React.FC<{
  isOpen: boolean;
  onSelect: (main: string, sub: string) => void;
  onClose: () => void;
}> = ({ isOpen, onSelect, onClose }) => {
  if (!isOpen) return null;
  return (
    <div className="dropdown-menu-top" onMouseLeave={onClose}>
      <div className="dropdown-item-top">
        <button onClick={() => onSelect('funnel', 'manually')}>Funnel - Manually</button>
        <button onClick={() => onSelect('funnel', 'prompt')}>Funnel - Prompt</button>
      </div>
      <div className="dropdown-item-top">
        <button onClick={() => onSelect('segment', 'manually')}>Segment - Manually</button>
        <button onClick={() => onSelect('segment', 'prompt')}>Segment - Prompt</button>
      </div>
    </div>
  );
};

const SearchBar: React.FC = () => (
  <div className="search-bar-light">
    <Search size={18} className="search-icon-light" />
    <input 
      type="text" 
      placeholder="Find a user" 
      aria-label="Find a user"
      className="search-input-light"
    />
  </div>
);

const IconBgCircle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="icon-bg-circle">{children}</div>
);

const SideNav: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [promptType, setPromptType] = useState<'funnel' | 'segment'>('funnel');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiResult, setAiResult] = useState<string>('');

  const handleCreateClick = () => {
    setIsCreateOpen((open) => !open);
  };

  const handleSubOptionSelect = (mainOption: string, subOption: string) => {
    setIsCreateOpen(false);
    if (mainOption === 'funnel' && subOption === 'manually') {
      navigate('/create/funnel');
    } else if (mainOption === 'funnel' && subOption === 'prompt') {
      setPromptType('funnel');
      setIsPromptModalOpen(true);
    } else if (mainOption === 'segment' && subOption === 'manually') {
      navigate('/create/segment');
    } else if (mainOption === 'segment' && subOption === 'prompt') {
      setPromptType('segment');
      setIsPromptModalOpen(true);
    }
  };

  const handlePromptSubmit = async (text: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      let response;
      if (promptType === 'funnel') {
        response = await analyticsService.createFunnel(text);
      } else {
        response = await analyticsService.createSegment(text);
      }
      
      setAiResult(response.result);
      setIsPromptModalOpen(false);
      setIsResultModalOpen(true);
    } catch (err) {
      setError('Failed to process prompt. Please try again.');
      console.error('Error processing prompt:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResultConfirm = () => {
    setIsResultModalOpen(false);
    if (promptType === 'funnel') {
      navigate('/create/funnel', { state: { promptResult: aiResult } });
    } else {
      navigate('/create/segment', { state: { promptResult: aiResult } });
    }
  };

  return (
    <nav className="side-nav">
      <div className="top-strip-light">
        <div className="top-strip-left-group">
          <LogoIcon />
          <div style={{ position: 'relative' }}>
            <CreateButtonTop onClick={handleCreateClick} isActive={isCreateOpen} />
            <CreateDropdownTop isOpen={isCreateOpen} onSelect={handleSubOptionSelect} onClose={() => setIsCreateOpen(false)} />
          </div>
          <SearchBar />
        </div>
        <div className="top-strip-right-light">
          <ServerStatus />
          <Link to="/settings" className={`settings-button-light ${location.pathname === '/settings' ? 'active' : ''}`}>
            <Settings size={22} />
          </Link>
          <Link to="/profile" className={`profile-button-light ${location.pathname === '/profile' ? 'active' : ''}`}>
            <User size={22} />
          </Link>
        </div>
      </div>
      
      <ul className="nav-links">
        <li>
          <Link to="/" className={location.pathname === '/' ? 'active' : ''} data-tooltip="Dashboard">
            <LayoutDashboard size={20} />
            {/* Dashboard */}
          </Link>
        </li>
        <li>
          <Link to="/events" className={location.pathname === '/events' ? 'active' : ''} data-tooltip="Events">
            <BarChart2 size={20} />
            {/* Events */}
          </Link>
        </li>
        <li>
          <Link to="/map" className={location.pathname === '/map' ? 'active' : ''} data-tooltip="Map">
            <Map size={20} />
            {/* Map */}
          </Link>
        </li>
      </ul>

      <PromptModal
        isOpen={isPromptModalOpen}
        onClose={() => setIsPromptModalOpen(false)}
        onSubmit={handlePromptSubmit}
        title={`Create ${promptType === 'funnel' ? 'Funnel' : 'Segment'} with Prompt`}
        isLoading={isLoading}
        error={error}
      />

      <ResultModal
        isOpen={isResultModalOpen}
        onClose={() => setIsResultModalOpen(false)}
        onConfirm={handleResultConfirm}
        result={aiResult}
        title={`AI Generated ${promptType === 'funnel' ? 'Funnel' : 'Segment'}`}
      />
    </nav>
  );
};

export default SideNav; 