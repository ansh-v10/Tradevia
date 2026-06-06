import React, { useState, useRef, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function DraggableMarker({ position, onPositionChange }) {
  const markerRef = useRef(null);
  const map = useMap();

  useEffect(() => {
    if (position && map) {
      map.setView(position, map.getZoom());
    }
  }, []);

  const eventHandlers = {
    dragend() {
      const marker = markerRef.current;
      if (marker) {
        const latlng = marker.getLatLng();
        onPositionChange([latlng.lat, latlng.lng]);
      }
    },
  };

  return position ? (
    <Marker
      draggable
      eventHandlers={eventHandlers}
      position={position}
      ref={markerRef}
    />
  ) : null;
}

function ClickHandler({ onMapClick }) {
  useMapEvents({
    click(e) {
      onMapClick([e.latlng.lat, e.latlng.lng]);
    },
  });
  return null;
}

export default function LocationPicker({ lat, lng, onLocationChange, height = '300px' }) {
  const defaultCenter = lat && lng ? [lat, lng] : [20.5937, 78.9629];
  const [position, setPosition] = useState(defaultCenter);

  const handleClick = (newPos) => {
    setPosition(newPos);
    onLocationChange(newPos[0], newPos[1]);
  };

  useEffect(() => {
    if (lat && lng) setPosition([lat, lng]);
  }, [lat, lng]);

  return (
    <div style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--color-border)' }}>
      <MapContainer center={defaultCenter} zoom={lat && lng ? 15 : 5} style={{ height, width: '100%', zIndex: 1 }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClickHandler onMapClick={handleClick} />
        <DraggableMarker position={position} onPositionChange={handleClick} />
      </MapContainer>
      {position && (
        <div style={{ padding: '8px 12px', fontSize: '12px', color: 'var(--color-text-muted)', background: 'var(--color-bg-light)', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>📍 {position[0].toFixed(6)}, {position[1].toFixed(6)}</span>
          <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-primary)' }}>Drag or click to set location</span>
        </div>
      )}
    </div>
  );
}
