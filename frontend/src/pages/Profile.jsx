import React from 'react';

const Profile = () => {
  return (
    <div className="profile-container">
      <div className="profile-header">
        <div className="avatar-placeholder">U</div>
        <div className="profile-info">
          <h2>Alex Mercer</h2>
          <p className="profile-meta">Reputation: 120 • Standard Member</p>
        </div>
      </div>

      <div className="profile-details-grid">
        <div className="badge-case-card">
          <h3>Badges Cabinet</h3>
          <div className="badges-list">
            <div className="badge-item">
              <span className="badge-icon">🏆</span>
              <span className="badge-name">First Answer</span>
            </div>
          </div>
        </div>

        <div className="activity-summary-card">
          <h3>Activity Summary</h3>
          <ul>
            <li>Questions Asked: 8</li>
            <li>Answers Posted: 15</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Profile;
