import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="dashboard-container">
      <header className="navbar">
        <div className="navbar-logo">CrowdFAQ</div>
        <div className="navbar-actions">
          <button onClick={toggleTheme} className="btn btn-secondary">
            {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
          </button>
          <span className="user-badge">{user?.name} ({user?.role?.name || user?.role})</span>
          <button onClick={logout} className="btn btn-danger">Log Out</button>
        </div>
      </header>

      <main className="dashboard-main">
        <aside className="sidebar">
          <h3>Categories</h3>
          <ul className="sidebar-list">
            <li className="active">All Categories</li>
            <li>Academics</li>
            <li>Admissions</li>
            <li>Campus Life</li>
          </ul>
        </aside>

        <section className="feed-container">
          <div className="feed-header">
            <h2>Community Question Feed</h2>
            <button className="btn btn-primary">Ask Question</button>
          </div>

          <div className="search-bar-container">
            <input type="text" placeholder="Search questions or search semantically..." className="search-input" />
          </div>

          <div className="feed-list">
            {/* Example Card */}
            <div className="question-card">
              <h3 className="question-card-title">How does the grading curve work in CS401?</h3>
              <p className="question-card-excerpt">I wanted to find out what percentage of students receive an A. Can anyone share past grade distributions?</p>
              <div className="question-card-footer">
                <span>By Alex Mercer</span>
                <span>• 14 Upvotes</span>
                <span>• 3 Answers</span>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Dashboard;
