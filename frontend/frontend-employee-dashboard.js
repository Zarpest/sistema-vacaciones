// frontend/src/pages/employee/Dashboard.js
import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';

const Dashboard = () => {
  const { userInfo } = useContext(AuthContext);
  
  if (!userInfo) {
    return <div>Cargando información...</div>;
  }
  
  const { vacaciones, permisos } = userInfo;
  const diasDisponibles = vacaciones.dias_asignados + vacaciones.dias_adicionales - vacaciones.dias_usados;
  const horasDisponibles = permisos.horas_disponibles - permisos.horas_usadas;
  
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Dashboard de Empleado</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
          <h3 className="text-lg font-semibold mb-2">Vacaciones</h3>
          <div className="flex justify-between items-center">
            <div>
              <p className="text-gray-600">Días disponibles:</p>
              <p className="text-3xl font-bold text-blue-600">{diasDisponibles}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Asignados: {vacaciones.dias_asignados}</p>
              <p className="text-sm text-gray-500">Adicionales: {vacaciones.dias_adicionales}</p>
              <p className="text-sm text-gray-500">Usados: {vacaciones.dias_usados}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
          <h3 className="text-lg font-semibold mb-2">Permisos Especiales</h3>
          <div className="flex justify-between items-center">
            <div>
              <p className="text-gray-600">Horas disponibles:</p>
              <p className="text-3xl font-bold text-green-600">{horasDisponibles}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Total: {permisos.horas_disponibles} horas</p>
              <p className="text-sm text-gray-500">Usadas: {permisos.horas_usadas} horas</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex justify-center">
        <Link 
          to="/employee/new-request"
          className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold"
        >
          Solicitar vacaciones o permiso
        </Link>
      </div>
    </div>
  );
};

export default Dashboard;
