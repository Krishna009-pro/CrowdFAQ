import React, { createContext, useState, useContext } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  // Pre-login a mock Admin user to ensure no pages crash on loading user.name / user.role
  const [user, setUser] = useState({
    id: '647f2b90df4a3233e08f51a1',
    name: 'Alex Mercer (Mock Admin)',
    email: 'admin@iit.edu',
    role: { name: 'Admin', description: 'System Administrator' },
    reputation: 9999,
    profilePictureUrl: 'https://cdn.crowdfaq.edu/avatars/admin.png'
  });
  const [token, setToken] = useState('mock-jwt-token-bypass');
  const [loading, setLoading] = useState(false);

  const login = async (email, password) => {
    setUser({
      id: '647f2b90df4a3233e08f51a1',
      name: 'Alex Mercer (Mock Admin)',
      email: email || 'admin@iit.edu',
      role: { name: 'Admin', description: 'System Administrator' },
      reputation: 9999,
      profilePictureUrl: 'https://cdn.crowdfaq.edu/avatars/admin.png'
    });
    setToken('mock-jwt-token-bypass');
    return { success: true };
  };

  const register = async (name, email, password) => {
    return { success: true, message: 'Offline Mock Mode: Registration simulated successfully!' };
  };

  const logout = () => {
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
