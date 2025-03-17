// frontend/src/pages/employee/RequestHistory.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const RequestHistory = () => {
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchSolicitudes = async () => {
      try {
        const response = await axios.get('/solicitudes/me');
        setSolicitudes(response.data);
      } catch (err) {
        setError('Error al cargar el historial de solicitudes');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchSolicitudes();
  }, []);
  
  if (loading) {
    return <div className="text-center py-8">Cargando historial...</div>;
  }
  
  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        {error}
      </div>
    );
  }
  
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Historial de Solicitudes</h2>
      
      {solicitudes.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No hay solicitudes en su historial.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-3 px-4 border-b text-left">Tipo</th>
                <th className="py-3 px-4 border-b text-left">Fecha Inicio</th>
                <th className="py-3 px-4 border-b text-left">Fecha Fin</th>
                <th className="py-3 px-4 border-b text-left">Duración</th>
                <th className="py-3 px-4 border-b text-left">Estado</th>
                <th className="py-3 px-4 border-b text-left">Fecha Solicitud</th>
                <th className="py-3 px-4 border-b text-left">Comentario</th>
              </tr>
            </thead>
            <tbody>
              {solicitudes.map(solicitud => (
                <tr key={solicitud.id} className="hover:bg-gray-50 border-b">
                  <td className="py-3 px-4">
                    {solicitud.tipo === 'vacaciones' ? 'Vacaciones' : 'Permiso especial'}
                  </td>
                  <td className="py-3 px-4">
                    {new Date(solicitud.fecha_inicio).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4">
                    {new Date(solicitud.fecha_fin).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4">
                    {solicitud.tipo === 'vacaciones' 
                      ? `${solicitud.dias} días` 
                      : `${solicitud.horas} horas`}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      solicitud.estado === 'pendiente' ? 'bg-yellow-100 text-yellow-800' :
                      solicitud.estado === 'aprobado' ? 'bg-green-100 text-green-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {solicitud.estado.charAt(0).toUpperCase() + solicitud.estado.slice(1)}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {new Date(solicitud.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4 max-w-md truncate">
                    {solicitud.comentario_respuesta || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default RequestHistory;
