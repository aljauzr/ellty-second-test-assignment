import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './AuthContext';
import { calculationsApi } from './api';
import { CalculationNode } from './types';
import Header from './components/Header';
import AuthForm from './components/AuthForm';
import StartNumberForm from './components/StartNumberForm';
import CalculationTree from './components/CalculationTree';
import './App.css';

const AppContent: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [calculations, setCalculations] = useState<CalculationNode[]>([]);
  const [loadingCalcs, setLoadingCalcs] = useState(true);
  const [error, setError] = useState('');

  const fetchCalculations = useCallback(async () => {
    try {
      setError('');
      const data = await calculationsApi.getAll();
      setCalculations(data);
    } catch (err) {
      setError('Failed to load calculations');
      console.error('Error fetching calculations:', err);
    } finally {
      setLoadingCalcs(false);
    }
  }, []);

  useEffect(() => {
    fetchCalculations();
  }, [fetchCalculations]);

  if (isLoading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="app">
      <Header />
      
      <main className="main-content">
        <div className="content-wrapper">
          {!user ? (
            <div className="guest-section">
              <div className="info-box">
                <h2>Welcome to Number Discussions!</h2>
                <p>
                  In this world, people communicate through numbers. Start a discussion 
                  by choosing a number, and others can respond with mathematical operations.
                </p>
                <p>
                  <strong>Login or register</strong> to start your own number chain or respond to others!
                </p>
              </div>
              <AuthForm />
            </div>
          ) : (
            <StartNumberForm onSuccess={fetchCalculations} />
          )}

          <section className="calculations-section">
            <h2>All Discussions</h2>
            {error && <div className="error-box">{error}</div>}
            {loadingCalcs ? (
              <div className="loading">Loading calculations...</div>
            ) : (
              <CalculationTree 
                calculations={calculations} 
                onRefresh={fetchCalculations} 
              />
            )}
          </section>
        </div>
      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
