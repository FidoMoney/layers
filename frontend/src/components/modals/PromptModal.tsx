import React, { useState } from 'react';
import './PromptModal.css';

interface PromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (text: string) => Promise<string>;
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
  const [result, setResult] = useState<string>('');

  const handleClose = () => {
    setText('');  // Reset the prompt text
    setResult('');  // Reset the result
    onClose();  // Call the original onClose
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      console.log('Submitting prompt:', text);
      const analysisResult = await onSubmit(text);
      console.log('Got analysis result in modal:', analysisResult);
      setResult(analysisResult);
    } catch (err) {
      console.error('Error submitting prompt:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="close-button" onClick={handleClose}>×</button>
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
          {result && (
            <div className="result-section">
              <h3>Insights</h3>
              <div className="result-content">
                <pre className="result-text">{result}</pre>
              </div>
            </div>
          )}
          <div className="modal-footer">
            <button 
              type="button" 
              className="cancel-button" 
              onClick={handleClose}
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