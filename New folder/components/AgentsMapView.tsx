import React, { useEffect, useRef, useState } from 'react';
import { AgentConfig } from '../types';

declare const L: any; // Declare Leaflet global

interface AgentsMapViewProps {
  agents: AgentConfig[];
}

const AgentsMapView: React.FC<AgentsMapViewProps> = ({ agents }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const [error, setError] = useState<string | null>(null);

  const agentsWithCoords = agents.filter(agent =>
    agent.latitude != null && agent.longitude != null &&
    !isNaN(agent.latitude) && !isNaN(agent.longitude)
  );

  useEffect(() => {
    if (typeof L === 'undefined') {
      setError('مكتبة الخرائط (Leaflet) غير متاحة.');
      return;
    }
    if (!mapContainer.current) return;

    if (agentsWithCoords.length === 0) {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
      return;
    }

    if (!mapInstance.current) {
      mapInstance.current = L.map(mapContainer.current).setView([33.3152, 44.3661], 6); // Default: Baghdad, Iraq
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(mapInstance.current);
    }
    
    // Clear existing markers
    mapInstance.current.eachLayer((layer: any) => {
        if (layer instanceof L.Marker) {
            mapInstance.current.removeLayer(layer);
        }
    });

    // Add new markers
    const markers = agentsWithCoords.map(agent =>
      L.marker([agent.latitude!, agent.longitude!]).bindPopup(`<b>${agent.name}</b>`)
    );

    if (markers.length > 0) {
      const featureGroup = L.featureGroup(markers).addTo(mapInstance.current);
      mapInstance.current.fitBounds(featureGroup.getBounds().pad(0.2));
    }
    
  }, [agentsWithCoords]);

  if (error) {
    return <div className="text-red-400 p-4 bg-red-900/50 rounded-lg">{error}</div>;
  }

  return (
    <div className="space-y-6 h-full flex flex-col">
      <header>
        <h1 className="text-3xl font-bold text-white">خريطة مواقع الوكلاء</h1>
        <p className="text-gray-400 mt-1">
          عرض تفاعلي لمكاتب الوكلاء. حاليًا، {agentsWithCoords.length} من {agents.length} وكلاء لديهم إحداثيات مسجلة.
        </p>
      </header>
      {agents.length === 0 ? (
        <div className="flex-grow flex items-center justify-center bg-gray-800 rounded-lg border-2 border-dashed border-gray-700">
            <div className="text-center text-gray-500">
                <p className="mt-4 text-lg">ابدأ بإضافة وكلائك من صفحة "إدارة الوكلاء".</p>
            </div>
        </div>
      ) : agentsWithCoords.length === 0 ? (
         <div className="flex-grow flex items-center justify-center bg-gray-800 rounded-lg border-2 border-dashed border-gray-700">
             <div className="text-center text-gray-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-16 w-16 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                <p className="mt-4 text-lg">لا توجد بيانات مواقع لعرضها.</p>
                <p>الرجاء إضافة إحداثيات (Latitude/Longitude) للوكلاء في صفحة "إدارة الوكلاء".</p>
            </div>
         </div>
      ) : (
        <div ref={mapContainer} className="w-full flex-grow rounded-lg shadow-lg" style={{ minHeight: '600px', backgroundColor: '#374151' }} />
      )}
    </div>
  );
};
export default AgentsMapView;
