import React from 'react';
import { useParams } from 'react-router-dom';

const QuestionDetail = () => {
  const { slug } = useParams();

  return (
    <div className="question-detail-container">
      <div className="detail-header">
        <h2>Question Details</h2>
        <a href="/" className="back-link">← Back to Dashboard</a>
      </div>

      <div className="main-question-card">
        <h1 className="question-title">How does the grading curve work in CS401?</h1>
        <p className="question-meta">Asked by Alex Mercer • Category: Academics • Views: 155</p>
        <div className="question-body">
          I wanted to find out what percentage of students receive an A. Can anyone share past grade distributions?
        </div>
      </div>

      <div className="answers-section">
        <h3>1 Answer</h3>
        <div className="answer-card verified best">
          <div className="answer-header">
            <span className="author-name">Prof. Alan Turing</span>
            <span className="badge badge-verified">Faculty Verified</span>
            <span className="badge badge-best">Best Answer</span>
          </div>
          <div className="answer-body">
            Typically, the top 15% get an A. CS401 limits the curve...
          </div>
          <div className="verification-notes">
            <strong>Verification Note:</strong> This aligns with the syllabus guidelines set for the Spring semester.
          </div>
        </div>
      </div>

      <div className="comment-box">
        <h4>Post an Answer</h4>
        <textarea placeholder="Write your answer using markdown..." rows="5"></textarea>
        <button className="btn btn-primary">Post Answer</button>
      </div>
    </div>
  );
};

export default QuestionDetail;
