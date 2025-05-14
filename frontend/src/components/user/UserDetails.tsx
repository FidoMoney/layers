import React from 'react';
import type { User } from '../../types/user';
import './UserDetails.css';

interface UserDetailsProps {
    user: User | null;
    onClose: () => void;
}

const UserDetails: React.FC<UserDetailsProps> = ({ user, onClose }) => {
    if (!user) return null;

    return (
        <div className="user-details-modal">
            <div className="user-details-content">
                <div className="user-details-header">
                    <h2>User Details</h2>
                    <button className="close-button" onClick={onClose}>×</button>
                </div>
                <div className="user-details-body">
                    <div className="user-detail-item">
                        <label>User ID:</label>
                        <span>{user.user_id}</span>
                    </div>
                    <div className="user-detail-item">
                        <label>Name:</label>
                        <span>{user.name}</span>
                    </div>
                    <div className="user-detail-item">
                        <label>Phone Number:</label>
                        <span>{user.phone_number}</span>
                    </div>
                    <div className="user-detail-item">
                        <label>Country:</label>
                        <span>{user.country}</span>
                    </div>
                    <div className="user-detail-item">
                        <label>Created At:</label>
                        <span>{new Date(user.timestamp).toLocaleString()}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserDetails; 