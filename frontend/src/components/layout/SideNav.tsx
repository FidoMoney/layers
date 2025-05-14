import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import PromptModal from '../modals/PromptModal';
import ResultModal from '../modals/ResultModal';
import { analyticsService } from '../../services/analyticsService';
import './SideNav.css';

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
    setIsCreateOpen(!isCreateOpen);
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
        <li className="create-dropdown">
          <button 
            onClick={handleCreateClick}
            className={`create-button ${isCreateOpen ? 'active' : ''}`}
          >
            <span className="icon">➕</span>
            Create New
          </button>
          {isCreateOpen && (
            <div className="dropdown-menu">
              <div className="dropdown-item">
                <button>Funnel</button>
                <div className="sub-dropdown">
                  <button onClick={() => handleSubOptionSelect('funnel', 'manually')}>Manually</button>
                  <button onClick={() => handleSubOptionSelect('funnel', 'prompt')}>Prompt</button>
                </div>
              </div>
              <div className="dropdown-item">
                <button>Segment</button>
                <div className="sub-dropdown">
                  <button onClick={() => handleSubOptionSelect('segment', 'manually')}>Manually</button>
                  <button onClick={() => handleSubOptionSelect('segment', 'prompt')}>Prompt</button>
                </div>
              </div>
            </div>
          )}
        </li>
        <li>
          <Link to="/settings" className={location.pathname === '/settings' ? 'active' : ''}>
            <span className="icon">⚙️</span>
            Settings
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