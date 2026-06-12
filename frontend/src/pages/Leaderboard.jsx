import React, { useState } from 'react';

const Leaderboard = () => {
  const [filter, setFilter] = useState('weekly');

  return (
    <div className="leaderboard-container">
      <div className="leaderboard-header">
        <h2>Reputation Leaderboard</h2>
        <div className="tab-filters">
          <button className={filter === 'daily' ? 'active' : ''} onClick={() => setFilter('daily')}>Daily</button>
          <button className={filter === 'weekly' ? 'active' : ''} onClick={() => setFilter('weekly')}>Weekly</button>
          <button className={filter === 'monthly' ? 'active' : ''} onClick={() => setFilter('monthly')}>Monthly</button>
          <button className={filter === 'all-time' ? 'active' : ''} onClick={() => setFilter('all-time')}>All Time</button>
        </div>
      </div>

      <table className="leaderboard-table">
        <thead>
          <tr>
            <th>Rank</th>
            <th>Name</th>
            <th>Reputation</th>
            <th>Verified Expert</th>
            <th>Badges</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>1</td>
            <td>Prof. Alan Turing</td>
            <td>2,450</td>
            <td>Yes</td>
            <td>🏅 🏅 🏅</td>
          </tr>
          <tr>
            <td>2</td>
            <td>Alex Mercer</td>
            <td>120</td>
            <td>No</td>
            <td>🏅</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default Leaderboard;
