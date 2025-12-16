import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import './App.css';
import HabitTracker from './components/HabitTracker';
import TaskList from './components/TaskList';
import Login from './components/Login';
import Signup from './components/Signup';
import { PrivateRoute } from './components/PrivateRoute';

function Dashboard() {
  const [activeTab, setActiveTab] = useState('habits');
  const { logout, currentUser } = useAuth();

  return (
    <div className="App">
      <div className="app-header">
        <div className="tab-navigation">
          <button 
            className={activeTab === 'habits' ? 'active' : ''}
            onClick={() => setActiveTab('habits')}
          >
            Habit Tracker
          </button>
          <button 
            className={activeTab === 'tasks' ? 'active' : ''}
            onClick={() => setActiveTab('tasks')}
          >
            Task List
          </button>
        </div>
        <div className="user-info">
          <span className="user-name">{currentUser?.displayName || currentUser?.email}</span>
          <button onClick={logout} className="logout-btn">
            Logout
          </button>
        </div>
      </div>
      <div className="content">
        {activeTab === 'habits' ? <HabitTracker /> : <TaskList />}
      </div>
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        }
      />
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
}

export default App;

