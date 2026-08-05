import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Vite/Leaflet marker icon issue by manually re-mapping images
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const MapComponent = ({ centerLat = 18.9750, centerLng = 72.8258, markers = [], detectedLocation }) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Destory existing instance
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    // Set center coordinate prioritizing user location if available
    const center = detectedLocation ? [detectedLocation.lat, detectedLocation.lng] : [centerLat, centerLng];

    // Initialize Map
    mapInstanceRef.current = L.map(mapContainerRef.current).setView(center, 13);

    // OpenStreetMap Tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(mapInstanceRef.current);

    // Red pin marker for User Location
    if (detectedLocation) {
      const redIcon = L.icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
        shadowUrl: markerShadow,
        iconSize: [25, 41],
        iconAnchor: [12, 41]
      });

      L.marker([detectedLocation.lat, detectedLocation.lng], { icon: redIcon })
        .addTo(mapInstanceRef.current)
        .bindPopup("<b>Your Current Location</b><br/>Detected via GPS coordinates.")
        .openPopup();
    }

    // Blue pin markers for Donors / Clinics
    markers.forEach(item => {
      if (item.latitude && item.longitude) {
        const popupText = `
          <div style="font-family: Poppins, sans-serif;">
            <h6 style="margin: 0 0 5px 0; font-weight: bold; color: #d32f2f;">${item.name}</h6>
            <p style="margin: 0 0 3px 0; font-size: 11px;"><b>Blood:</b> ${item.blood_group}</p>
            <p style="margin: 0 0 3px 0; font-size: 11px;"><b>City:</b> ${item.city}</p>
            <p style="margin: 0 0 3px 0; font-size: 11px;"><b>Contact:</b> ${item.phone}</p>
          </div>
        `;
        L.marker([item.latitude, item.longitude])
          .addTo(mapInstanceRef.current)
          .bindPopup(popupText);
      }
    });

    // Clean up
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [centerLat, centerLng, markers, detectedLocation]);

  return (
    <div 
      ref={mapContainerRef} 
      className="shadow-sm border" 
      style={{ height: '400px', width: '100%', borderRadius: '12px', zIndex: 1 }} 
    />
  );
};

export default MapComponent;
