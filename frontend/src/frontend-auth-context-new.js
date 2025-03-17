// frontend/src/context/AuthContext.js
import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const checkLoggedIn = async () => {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setLoading(false);
        return;
      }
      
      try {
        // Configurar token para todas las peticiones
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        // Obtener información del usuario
        const response = await axios.get('/me');
        setCurrentUser(response.data.usuario);
        setUserInfo({
          vacaciones: response.data.vacaciones,
          permisos: response.data.permisos
        });
      } catch (err) {
        console.error('Error al verificar sesión:', err);
        localStorage.removeItem('token');
        delete axios.defaults.headers.common['Authorization'];
      } finally {
        setLoading(false);
      }
    };
    
    checkLoggedIn();
  }, []);
  
  const login = async (email, password) => {
    try {
      setError(null);
      const response = await axios.post('/auth/login', { email, password });
      
      localStorage.setItem('token', response.data.token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
      
      // Obtener información completa del usuario
      const userResponse = await axios.get('/me');
      setCurrentUser(userResponse.data.usuario);
      setUserInfo({
        vacaciones: userResponse.data.vacaciones,
        permisos: userResponse.data.permisos
      });
      
      return true;
    } catch (err) {
      setError(err.response?.data?.error || 'Error al iniciar sesión');
      return false;
    }
  };
  
  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setCurrentUser(null);
    setUserInfo(null);
  };
  
  const refreshUserInfo = async () => {
    try {
      const response = await axios.get('/me');
      setUserInfo({
        vacaciones: response.data.vacaciones,
        permisos: response.data.permisos
      });
    } catch (err) {
      console.error('Error al actualizar información del usuario:', err);
    }
  };
  
  return (
    <AuthContext.Provider value={{ 
      currentUser, 
      userInfo, 
      loading, 
      error,
      login,
      logout,
      refreshUserInfo
    }}>
      {children}
    </AuthContext.Provider>
  );
};
