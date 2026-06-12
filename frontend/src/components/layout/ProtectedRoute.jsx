import React from 'react';

const ProtectedRoute = ({ children }) => {
  // Authentication bypass: directly render the target page component
  return children;
};

export default ProtectedRoute;
