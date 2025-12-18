import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import Home from './pages/Home';
import BooksPage from './pages/BooksPage';
import AuthorsPage from './pages/AuthorsPage';
import GenresPage from './pages/GenresPage';
import PublishersPage from './pages/PublishersPage';
import StatusesPage from './pages/StatusesPage';
import UsersPage from './pages/UsersPage';
import ReportsPage from './pages/ReportsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import Profile from './pages/Profile';
import { useAuth } from './context/AuthContext';

function App() {
  const { isAuthenticated, isAdmin } = useAuth();

  const ProtectedRoute = ({ children, requireAdmin = false }) => {
    if (!isAuthenticated) {
      return <Navigate to="/login" />;
    }
    if (requireAdmin && !isAdmin()) {
      return <Navigate to="/" />;
    }
    return children;
  };

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      <Route path="/" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={<Home />} />
        <Route path="books" element={<BooksPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="profile" element={<Profile />} />
        
        {/* Админские маршруты */}
        <Route path="authors" element={
          <ProtectedRoute requireAdmin={true}>
            <AuthorsPage />
          </ProtectedRoute>
        } />
        <Route path="genres" element={
          <ProtectedRoute requireAdmin={true}>
            <GenresPage />
          </ProtectedRoute>
        } />
        <Route path="publishers" element={
          <ProtectedRoute requireAdmin={true}>
            <PublishersPage />
          </ProtectedRoute>
        } />
        <Route path="statuses" element={
          <ProtectedRoute requireAdmin={true}>
            <StatusesPage />
          </ProtectedRoute>
        } />
        <Route path="users" element={
          <ProtectedRoute requireAdmin={true}>
            <UsersPage />
          </ProtectedRoute>
        } />
      </Route>
    </Routes>
  );
}

export default App;