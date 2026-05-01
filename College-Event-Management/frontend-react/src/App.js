import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { AuthProvider, useAuth } from './context/AuthContext';
import Header from './components/Header';
import Loading from './components/Loading';

// Pages
import Home from './pages/Home';
import Events from './pages/Events';
import Dashboard from './pages/Dashboard';
import CreateEvent from './pages/CreateEvent';
import EditEvent from './pages/EditEvent';
import EventRegistrations from './pages/EventRegistrations';
import EventFeedback from './pages/EventFeedback';
import SubmitFeedback from './pages/SubmitFeedback';

// Styles
import './styles/App.css';

// Protected Route Component
const ProtectedRoute = ({ children, requireAuth = true, allowedRoles = [] }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return <Loading />;
  }

  // If authentication is required but user is not authenticated
  if (requireAuth && !isAuthenticated()) {
    return <Navigate to="/" replace />;
  }

  // If user is authenticated but trying to access public routes
  if (!requireAuth && isAuthenticated()) {
    return <Navigate to="/events" replace />;
  }

  // If specific roles are required
  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/events" replace />;
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Header />
          
          <Routes>
            {/* Public Routes */}
            <Route 
              path="/" 
              element={
                <ProtectedRoute requireAuth={false}>
                  <Home />
                </ProtectedRoute>
              } 
            />
            
            {/* Protected Routes */}
            <Route 
              path="/events" 
              element={
                <ProtectedRoute>
                  <Events />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/create-event" 
              element={
                <ProtectedRoute allowedRoles={['organizer']}>
                  <CreateEvent />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/edit-event/:eventId" 
              element={
                <ProtectedRoute allowedRoles={['organizer']}>
                  <EditEvent />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/event-registrations/:eventId" 
              element={
                <ProtectedRoute allowedRoles={['organizer']}>
                  <EventRegistrations />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/event-feedback/:eventId" 
              element={
                <ProtectedRoute allowedRoles={['organizer']}>
                  <EventFeedback />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/submit-feedback/:eventId" 
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <SubmitFeedback />
                </ProtectedRoute>
              } 
            />
            
            {/* Redirect unknown routes */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          
          {/* Toast Notifications */}
          <ToastContainer
            position="top-right"
            autoClose={5000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
          />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
