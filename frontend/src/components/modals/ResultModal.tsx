import React from 'react';
import './ResultModal.css';

interface ResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  result: string;
  title: string;
}

const ResultModal: React.FC<ResultModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  result,
  title
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content result-modal">
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        <div className="result-content">
          <pre className="result-text">{result}</pre>
        </div>
        <div className="modal-footer">
          <button 
            type="button" 
            className="cancel-button" 
            onClick={onClose}
          >
            Cancel
          </button>
          <button 
            type="button" 
            className="submit-button"
            onClick={onConfirm}
          >
            Use This Result
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResultModal; 