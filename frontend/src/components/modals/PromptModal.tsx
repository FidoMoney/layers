import React, { useState } from 'react';
import './PromptModal.css';

interface PromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (text: string) => void;
  title: string;
  isLoading?: boolean;
  error?: string | null;
}

const PromptModal: React.FC<PromptModalProps> = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  title,
  isLoading = false,
  error = null
}) => {
  const [text, setText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(text);
    setText('');
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Enter your prompt here..."
            className="modal-textarea"
            disabled={isLoading}
          />
          {error && <div className="error-message">{error}</div>}
          <div className="modal-footer">
            <button 
              type="button" 
              className="cancel-button" 
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="submit-button"
              disabled={isLoading || !text.trim()}
            >
              {isLoading ? 'Processing...' : 'Submit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PromptModal; 