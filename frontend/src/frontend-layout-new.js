// frontend/src/components/layout/Layout.js
import React, { useContext, useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import axios from 'axios';

const Layout = () => {
  const { currentUser, logout } = useContext(AuthContext);
  const [notifications, setNotifications] = useState([]);
  const navigate = useNavigate();
  
  // Verificar notificaciones no leídas
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await axios.get('/notificaciones');
        setNotifications(response.data);
      } catch (err) {
        console.error('Error al obtener notificaciones:', err);
      }
    };
    
    fetchNotifications();
    
    // Actualizar cada 2 minutos
    const interval = setInterval(fetchNotifications, 120000);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-blue-600 text-white p-4">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold">Sistema de Gestión de Vacaciones</h1>
          
          <div className="flex items-center space-x-4">
            {currentUser && (
              <>
                <div className="relative">
                  <button 
                    className="relative"
                    onClick={() => navigate('/employee/notifications')}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    
                    {notifications.length > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                        {notifications.length}
                      </span>
                    )}
                  </button>
                </div>
                
                <span>{currentUser.nombre} {currentUser.apellido}</span>
                
                <button 
                  onClick={logout}
                  className="ml-2 bg-red-500 hover:bg-red-600 px-3 py-1 rounded text-sm"
                >
                  Cerrar sesión
                </button>
              </>
            )}
          </div>
        </div>
      </header>
      
      <div className="flex flex-1">
        <nav className="w-64 bg-gray-100 p-4">
          <ul className="space-y-2">
            {/* Menú para empleados */}
            <li className="font-bold text-gray-600 mb-2">Empleado</li>
            <li>
              <NavLink 
                to="/employee" 
                className={({isActive}) => 
                  isActive 
                    ? "block py-2 px-4 bg-blue-500 text-white rounded" 
                    : "block py-2 px-4 hover:bg-gray-200 rounded"
                }
                end
              >
                Dashboard
              </NavLink>
            </li>
            <li>
              <NavLink 
                to="/employee/new-request" 
                className={({isActive}) => 
                  isActive 
                    ? "block py-2 px-4 bg-blue-500 text-white rounded" 
                    : "block py-2 px-4 hover:bg-gray-200 rounded"
                }
              >
                Nueva solicitud
              </NavLink>
            </li>
            <li>
              <NavLink 
                to="/employee/history" 
                className={({isActive}) => 
                  isActive 
                    ? "block py-2 px-4 bg-blue-500 text-white rounded" 
                    : "block py-2 px-4 hover:bg-gray-200 rounded"
                }
              >
                Historial de solicitudes
              </NavLink>
            </li>
            
            {/* Menú para jefes */}
            {currentUser && ['jefe', 'admin'].includes(currentUser.rol) && (
              <>
                <li className="font-bold text-gray-600 mt-6 mb-2">Jefe</li>
                <li>
                  <NavLink 
                    to="/manager" 
                    className={({isActive}) => 
                      isActive 
                        ? "block py-2 px-4 bg-blue-500 text-white rounded" 
                        : "block py-2 px-4 hover:bg-gray-200 rounded"
                    }
                    end
                  >
                    Dashboard Equipo
                  </NavLink>
                </li>
                <li>
                  <NavLink 
                    to="/manager/pending" 
                    className={({isActive}) => 
                      isActive 
                        ? "block py-2 px-4 bg-blue-500 text-white rounded" 
                        : "block py-2 px-4 hover:bg-gray-200 rounded"
                    }
                  >
                    Solicitudes pendientes
                  </NavLink>
                </li>
                <li>
                  <NavLink 
                    to="/manager/calendar" 
                    className={({isActive}) => 
                      isActive 
                        ? "block py-2 px-4 bg-blue-500 text-white rounded" 
                        : "block py-2 px-4 hover:bg-gray-200 rounded"
                    }
                  >
                    Calendario del equipo
                  </NavLink>
                </li>
              </>
            )}
          </ul>
        </nav>
        
        <main className="flex-1 p-6 bg-white">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
