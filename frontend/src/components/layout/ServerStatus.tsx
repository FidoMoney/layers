import React, { useState, useEffect } from 'react';
import { checkServerStatus } from '../../services/api';
import './ServerStatus.css';

const ServerStatus: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        await checkServerStatus();
        setIsConnected(true);
        setError(null);
      } catch (err) {
        setIsConnected(false);
        setError(err instanceof Error ? err.message : 'Connection error');
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="server-status">
      <span className={`status-dot ${isConnected ? 'connected' : 'disconnected'}`} />
      <span className="status-text">{isConnected ? 'Connected' : 'Disconnected'}</span>
    </div>
  );
};

export default ServerStatus; 