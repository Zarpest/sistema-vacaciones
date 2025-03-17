// frontend/src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import './App.css';

// Componentes de autenticación
import Login from './pages/auth/Login';
import PrivateRoute from './components/auth/PrivateRoute';

// Páginas de empleado
import EmployeeDashboard from './pages/employee/Dashboard';
import NewRequest from './pages/employee/NewRequest';
import RequestHistory from './pages/employee/RequestHistory';

// Páginas de jefe
import ManagerDashboard from './pages/manager/Dashboard';
import PendingRequests from './pages/manager/PendingRequests';
import TeamCalendar from './pages/manager/TeamCalendar';

// Contexto de autenticación
import { AuthProvider } from './context/AuthContext';

// Componente común
import Layout from './components/layout/Layout';
import Notifications from './components/notifications/Notifications';

// Configurar axios
axios.defaults.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          {/* Rutas de empleado */}
          <Route 
            path="/employee" 
            element={
              <PrivateRoute allowedRoles={['empleado', 'jefe', 'admin']}>
                <Layout />
              </PrivateRoute>
            }
          >
            <Route index element={<EmployeeDashboard />} />
            <Route path="new-request" element={<NewRequest />} />
            <Route path="history" element={<RequestHistory />} />
            <Route path="notifications" element={<Notifications />} />
          </Route>
          
          {/* Rutas de jefe */}
          <Route 
            path="/manager" 
            element={
              <PrivateRoute allowedRoles={['jefe', 'admin']}>
                <Layout />
              </PrivateRoute>
            }
          >
            <Route index element={<ManagerDashboard />} />
            <Route path="pending" element={<PendingRequests />} />
            <Route path="calendar" element={<TeamCalendar />} />
          </Route>
          
          {/* Redirección por defecto */}
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
