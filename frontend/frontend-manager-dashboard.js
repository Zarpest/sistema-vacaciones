// frontend/src/pages/manager/Dashboard.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const ManagerDashboard = () => {
  const [pendingRequests, setPendingRequests] = useState([]);
  const [teamAbsences, setTeamAbsences] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Obtener solicitudes pendientes
        const pendingRes = await axios.get('/solicitudes/pendientes');
        setPendingRequests(pendingRes.data);
        
        // Obtener ausencias del equipo (aprobadas)
        const calendarRes = await axios.get('/calendario/equipo');
        setTeamAbsences(calendarRes.data);
      } catch (error) {
        console.error('Error al cargar datos del dashboard:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  if (loading) {
    return <div className="text-center py-8">Cargando información...</div>;
  }
  
  // Filtrar ausencias actuales
  const today = new Date();
  const currentAbsences = teamAbsences.filter(absence => {
    const endDate = new Date(absence.fecha_fin);
    return endDate >= today;
  });
  
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Dashboard de Jefe</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Solicitudes Pendientes</h3>
            <Link 
              to="/manager/pending"
              className="text-blue-500 hover:text-blue-700 text-sm"
            >
              Ver todas
            </Link>
          </div>
          
          {pendingRequests.length === 0 ? (
            <p className="text-gray-500">No hay solicitudes pendientes.</p>
          ) : (
            <div className="space-y-3">
              {pendingRequests.slice(0, 3).map(request => (
                <div 
                  key={request.id}
                  className="p-3 border rounded-md hover:bg-gray-50"
                >
                  <div className="flex justify-between">
                    <div>
                      <span className="font-semibold">
                        {request.empleado_nombre} {request.empleado_apellido}
                      </span>
                      <p className="text-sm text-gray-600">
                        {request.tipo === 'vacaciones' 
                          ? `Vacaciones: ${request.dias} días` 
                          : `Permiso: ${request.horas} horas`}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(request.fecha_inicio).toLocaleDateString()} - {new Date(request.fecha_fin).toLocaleDateString()}
                      </p>
                    </div>
                    <Link 
                      to="/manager/pending"
                      className="self-center text-sm bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded"
                    >
                      Revisar
                    </Link>
                  </div>
                </div>
              ))}
              
              {pendingRequests.length > 3 && (
                <p className="text-center text-sm text-gray-500">
                  {pendingRequests.length - 3} solicitudes más pendientes
                </p>
              )}
            </div>
          )}
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Ausencias Actuales</h3>
            <Link 
              to="/manager/calendar"
              className="text-blue-500 hover:text-blue-700 text-sm"
            >
              Ver calendario
            </Link>
          </div>
          
          {currentAbsences.length === 0 ? (
            <p className="text-gray-500">No hay ausencias actuales en el equipo.</p>
          ) : (
            <div className="space-y-3">
              {currentAbsences.slice(0, 5).map(absence => (
                <div 
                  key={absence.id}
                  className="p-3 border rounded-md hover:bg-gray-50"
                >
                  <span className="font-semibold">
                    {absence.nombre} {absence.apellido}
                  </span>
                  <p className="text-sm text-gray-600">
                    {absence.tipo === 'vacaciones' ? 'Vacaciones' : 'Permiso especial'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(absence.fecha_inicio).toLocaleDateString()} - {new Date(absence.fecha_fin).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;
