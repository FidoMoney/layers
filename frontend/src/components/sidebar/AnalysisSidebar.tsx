import React, { useState, useEffect } from 'react';
import './AnalysisSidebar.css';

interface AnalysisSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (prompt: string) => Promise<string>;
  isLoading: boolean;
  error: string | null;
  initialPrompt?: string;
  userName?: string;
}

const AnalysisSidebar: React.FC<AnalysisSidebarProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
  error,
  initialPrompt,
  userName
}) => {
  const [result, setResult] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && initialPrompt) {
      handleSubmit(initialPrompt);
    }
  }, [isOpen, initialPrompt]);

  const handleSubmit = async (promptText: string) => {
    try {
      const analysisResult = await onSubmit(promptText);
      setResult(analysisResult);
    } catch (err) {
      // Error is handled by the parent component
    }
  };

  return (
    <div className={`analysis-sidebar ${isOpen ? 'open' : ''}`}>
      <div className="analysis-sidebar-header">
        <h2>User Insight for {userName || 'User'}</h2>
        <button className="close-button" onClick={onClose}>&times;</button>
      </div>
      <div className="analysis-sidebar-content">
        {isLoading && (
          <div className="loading-message">
            Analyzing user behavior...
          </div>
        )}
        {error && <div className="error-message">{error}</div>}
        {result && (
          <div className="result-section">
            <div className="result-content">
              <p className="result-text">{result}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalysisSidebar; 