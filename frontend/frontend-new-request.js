// frontend/src/pages/employee/NewRequest.js
import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';

const NewRequest = () => {
  const [tipo, setTipo] = useState('vacaciones');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [dias, setDias] = useState('');
  const [horas, setHoras] = useState('');
  const [motivo, setMotivo] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const { refreshUserInfo } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      await axios.post('/solicitudes', {
        tipo,
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
        dias: tipo === 'vacaciones' ? parseFloat(dias) : null,
        horas: tipo === 'permiso_especial' ? parseFloat(horas) : null,
        motivo
      });
      
      // Actualizar información del usuario
      await refreshUserInfo();
      
      // Redireccionar al historial
      navigate('/employee/history');
    } catch (err) {
      setError(err.response?.data?.error || 'Error al crear la solicitud');
    } finally {
      setLoading(false);
    }
  };
  
  // Calcular días automáticamente al cambiar fechas
  const calcularDias = () => {
    if (fechaInicio && fechaFin) {
      const inicio = new Date(fechaInicio);
      const fin = new Date(fechaFin);
      
      // Calcular diferencia en días
      const diffTime = Math.abs(fin - inicio);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 para incluir el día final
      
      // Ajustar para fines de semana (simplificado)
      let diasLaborables = 0;
      const currentDate = new Date(inicio);
      
      while (currentDate <= fin) {
        const dayOfWeek = currentDate.getDay();
        
        // Si no es fin de semana (0 = domingo, 6 = sábado)
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
          diasLaborables++;
        }
        
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      setDias(diasLaborables);
    }
  };
  
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Nueva Solicitud</h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md">
        <div className="mb-4">
          <label className="block text-gray-700 font-semibold mb-2">
            Tipo de solicitud
          </label>
          <div className="flex">
            <label className="inline-flex items-center mr-6">
              <input
                type="radio"
                value="vacaciones"
                checked={tipo === 'vacaciones'}
                onChange={() => setTipo('vacaciones')}
                className="form-radio h-5 w-5 text-blue-600"
              />
              <span className="ml-2">Vacaciones</span>
            </label>
            <label className="inline-flex items-center">
              <input
                type="radio"
                value="permiso_especial"
                checked={tipo === 'permiso_especial'}
                onChange={() => setTipo('permiso_especial')}
                className="form-radio h-5 w-5 text-green-600"
              />
              <span className="ml-2">Permiso especial</span>
            </label>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-gray-700 font-semibold mb-2" htmlFor="fechaInicio">
              Fecha de inicio
            </label>
            <input
              type="date"
              id="fechaInicio"
              value={fechaInicio}
              onChange={e => {
                setFechaInicio(e.target.value);
                if (fechaFin) calcularDias();
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-gray-700 font-semibold mb-2" htmlFor="fechaFin">
              Fecha de fin
            </label>
            <input
              type="date"
              id="fechaFin"
              value={fechaFin}
              onChange={e => {
                setFechaFin(e.target.value);
                if (fechaInicio) calcularDias();
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
              required
              min={fechaInicio}
            />
          </div>
        </div>
        
        {tipo === 'vacaciones' && (
          <div className="mb-4">
            <label className="block text-gray-700 font-semibold mb-2" htmlFor="dias">
              Días laborables
            </label>
            <input
              type="number"
              id="dias"
              value={dias}
              onChange={e => setDias(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
              min="0.5"
              step="0.5"
              required
            />
            <p className="text-sm text-gray-500 mt-1">
              Días calculados automáticamente. Ajuste si hay festivos u otros días no laborables.
            </p>
          </div>
        )}
        
        {tipo === 'permiso_especial' && (
          <div className="mb-4">
            <label className="block text-gray-700 font-semibold mb-2" htmlFor="horas">
              Horas solicitadas
            </label>
            <input
              type="number"
              id="horas"
              value={horas}
              onChange={e => setHoras(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
              min="1"
              max="8"
              required
            />
          </div>
        )}
        
        <div className="mb-6">
          <label className="block text-gray-700 font-semibold mb-2" htmlFor="motivo">
            Motivo (opcional)
          </label>
          <textarea
            id="motivo"
            value={motivo}
            onChange={e => setMotivo(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
            rows="4"
          ></textarea>
        </div>
        
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => navigate('/employee')}
            className="mr-2 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Cancelar
          </button>
          
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50"
          >
            {loading ? 'Enviando...' : 'Enviar solicitud'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default NewRequest;
