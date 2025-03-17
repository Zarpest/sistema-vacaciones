// frontend/src/pages/manager/PendingRequests.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const PendingRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processingId, setProcessingId] = useState(null);
  
  useEffect(() => {
    fetchRequests();
  }, []);
  
  const fetchRequests = async () => {
    try {
      const response = await axios.get('/solicitudes/pendientes');
      setRequests(response.data);
    } catch (err) {
      setError('Error al cargar las solicitudes pendientes');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleAction = async (id, action, comentario = '') => {
    setProcessingId(id);
    
    try {
      await axios.put(`/solicitudes/${id}`, {
        estado: action,
        comentario
      });
      
      // Actualizar la lista sin recargar
      setRequests(requests.filter(req => req.id !== id));
    } catch (err) {
      console.error('Error al procesar la solicitud:', err);
      alert('Error al procesar la solicitud. Intente nuevamente.');
    } finally {
      setProcessingId(null);
    }
  };
  
  if (loading) {
    return <div className="text-center py-8">Cargando solicitudes...</div>;
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
      <h2 className="text-2xl font-bold mb-6">Solicitudes Pendientes</h2>
      
      {requests.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No hay solicitudes pendientes.
        </div>
      ) : (
        <div className="space-y-6">
          {requests.map(request => (
            <div 
              key={request.id}
              className="bg-white p-6 rounded-lg shadow-md"
            >
              <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4">
                <div>
                  <h3 className="text-lg font-semibold">
                    {request.empleado_nombre} {request.empleado_apellido}
                  </h3>
                  <p className="text-gray-600">{request.empleado_email}</p>
                </div>
                
                <div className="mt-2 md:mt-0">
                  <span className="inline-block px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-semibold">
                    Pendiente
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-500">Tipo</p>
                  <p className="font-medium">
                    {request.tipo === 'vacaciones' ? 'Vacaciones' : 'Permiso especial'}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500">Periodo</p>
                  <p className="font-medium">
                    {new Date(request.fecha_inicio).toLocaleDateString()} - {new Date(request.fecha_fin).toLocaleDateString()}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500">Duración</p>
                  <p className="font-medium">
                    {request.tipo === 'vacaciones' 
                      ? `${request.dias} días` 
                      : `${request.horas} horas`}
                  </p>
                </div>
              </div>
              
              {request.motivo && (
                <div className="mb-4">
                  <p className="text-sm text-gray-500">Motivo</p>
                  <p className="italic">{request.motivo}</p>
                </div>
              )}
              
              <div className="mt-4 pt-4 border-t">
                <div className="mb-3">
                  <label className="block text-sm text-gray-600 mb-1">
                    Comentario (opcional)
                  </label>
                  <textarea
                    id={`comentario-${request.id}`}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                    rows="2"
                  ></textarea>
                </div>
                
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => {
                      const comentario = document.getElementById(`comentario-${request.id}`).value;
                      handleAction(request.id, 'rechazado', comentario);
                    }}
                    disabled={processingId === request.id}
                    className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded disabled:opacity-50"
                  >
                    {processingId === request.id ? 'Procesando...' : 'Rechazar'}
                  </button>
                  
                  <button
                    onClick={() => {
                      const comentario = document.getElementById(`comentario-${request.id}`).value;
                      handleAction(request.id, 'aprobado', comentario);
                    }}
                    disabled={processingId === request.id}
                    className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded disabled:opacity-50"
                  >
                    {processingId === request.id ? 'Procesando...' : 'Aprobar'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PendingRequests;
