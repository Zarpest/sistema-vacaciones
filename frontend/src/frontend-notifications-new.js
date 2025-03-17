// frontend/src/components/notifications/Notifications.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await axios.get('/notificaciones');
        setNotifications(response.data);
      } catch (error) {
        console.error('Error al obtener notificaciones:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchNotifications();
  }, []);
  
  const markAsRead = async (id) => {
    try {
      await axios.put(`/notificaciones/${id}`);
      setNotifications(notifications.filter(notif => notif.id !== id));
    } catch (error) {
      console.error('Error al marcar como leída:', error);
    }
  };
  
  if (loading) {
    return <div className="text-center py-8">Cargando notificaciones...</div>;
  }
  
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Notificaciones</h2>
      
      {notifications.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No hay notificaciones pendientes.
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.map(notif => (
            <div 
              key={notif.id}
              className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-lg mb-1">{notif.titulo}</h3>
                  <p className="text-gray-600">{notif.mensaje}</p>
                  <p className="text-xs text-gray-400 mt-2">
                    {new Date(notif.created_at).toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => markAsRead(notif.id)}
                  className="text-sm bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded"
                >
                  Marcar como leída
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Notifications;
