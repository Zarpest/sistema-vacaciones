// frontend/src/pages/manager/TeamCalendar.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const TeamCalendar = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  useEffect(() => {
    const fetchCalendar = async () => {
      try {
        const response = await axios.get('/calendario/equipo');
        setEvents(response.data);
      } catch (err) {
        setError('Error al cargar el calendario del equipo');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCalendar();
  }, []);
  
  if (loading) {
    return <div className="text-center py-8">Cargando calendario...</div>;
  }
  
  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        {error}
      </div>
    );
  }
  
  // Función para generar los días del mes
  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };
  
  // Obtener el primer día de la semana del mes (0 = Domingo, 1 = Lunes, ...)
  const getFirstDayOfMonth = (year, month) => {
    return new Date(year, month, 1).getDay();
  };
  
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  
  const daysInMonth = getDaysInMonth(year, month);
  const firstDayOfMonth = getFirstDayOfMonth(year, month);
  
  // Ajustar para que la semana comience en lunes (0 = Lunes, 6 = Domingo)
  const firstDayAdjusted = (firstDayOfMonth + 6) % 7;
  
  const prevMonth = () => {
    setCurrentMonth(new Date(year, month - 1, 1));
  };
  
  const nextMonth = () => {
    setCurrentMonth(new Date(year, month + 1, 1));
  };
  
  // Comprobar si un día tiene eventos
  const getEventsForDay = (day) => {
    const date = new Date(year, month, day);
    return events.filter(event => {
      const start = new Date(event.fecha_inicio);
      const end = new Date(event.fecha_fin);
      return date >= start && date <= end;
    });
  };
  
  // Nombres de los meses
  const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Calendario del Equipo</h2>
      
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-4">
          <button
            onClick={prevMonth}
            className="p-2 rounded hover:bg-gray-100"
          >
            &lt; Mes Anterior
          </button>
          
          <h3 className="text-xl font-semibold">
            {monthNames[month]} {year}
          </h3>
          
          <button
            onClick={nextMonth}
            className="p-2 rounded hover:bg-gray-100"
          >
            Mes Siguiente &gt;
          </button>
        </div>
        
        <div className="grid grid-cols-7 gap-1">
          {/* Días de la semana (comenzando en lunes) */}
          {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(day => (
            <div key={day} className="text-center font-semibold p-2">
              {day}
            </div>
          ))}
          
          {/* Espacios vacíos antes del primer día */}
          {Array(firstDayAdjusted).fill(null).map((_, index) => (
            <div key={`empty-${index}`} className="p-2"></div>
          ))}
          
          {/* Días del mes */}
          {Array(daysInMonth).fill(null).map((_, index) => {
            const day = index + 1;
            const dayEvents = getEventsForDay(day);
            const isToday = 
              new Date().getDate() === day && 
              new Date().getMonth() === month && 
              new Date().getFullYear() === year;
            
            return (
              <div 
                key={`day-${day}`} 
                className={`p-1 border min-h-24 ${isToday ? 'bg-blue-50 border-blue-300' : ''}`}
              >
                <div className="text-right text-sm font-medium mb-1">
                  {day}
                </div>
                
                <div className="space-y-1">
                  {dayEvents.map(event => (
                    <div 
                      key={`event-${event.id}-${day}`}
                      className={`text-xs p-1 rounded overflow-hidden truncate ${
                        event.tipo === 'vacaciones' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                      title={`${event.nombre} ${event.apellido} - ${event.tipo}`}
                    >
                      {event.nombre}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TeamCalendar;
