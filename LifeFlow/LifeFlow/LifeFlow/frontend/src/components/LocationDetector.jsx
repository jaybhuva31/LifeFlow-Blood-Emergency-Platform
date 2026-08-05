import React, { useState } from 'react';
import { 
  IoNavigateOutline, 
  IoCheckmarkCircleOutline, 
  IoAlertCircleOutline, 
  IoSearchOutline, 
  IoLocationOutline 
} from 'react-icons/io5';

const LocationDetector = ({ 
  city, 
  address, 
  latitude, 
  longitude, 
  onLocationDetected,
  showAddressField = true 
}) => {
  const [detecting, setDetecting] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verifiedStatus, setVerifiedStatus] = useState(null); // { valid: true/false, message: '' }

  // Detect Live GPS Location + Reverse Geocode
  const handleDetectLiveLocation = () => {
    if (!navigator.geolocation) {
      setVerifiedStatus({ valid: false, message: 'Geolocation is not supported by your browser.' });
      return;
    }

    setDetecting(true);
    setVerifiedStatus(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;

        try {
          // Fetch reverse geocoding from OpenStreetMap Nominatim
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`
          );
          const data = await response.json();

          if (data && data.address) {
            const detectedCity = 
              data.address.city || 
              data.address.town || 
              data.address.village || 
              data.address.suburb || 
              data.address.county || 
              data.address.state_district || 
              '';

            const detectedAddress = data.display_name || '';

            onLocationDetected({
              city: detectedCity,
              address: detectedAddress,
              latitude: lat.toFixed(6),
              longitude: lon.toFixed(6)
            });

            setVerifiedStatus({ 
              valid: true, 
              message: `Live location detected! City: ${detectedCity} (${lat.toFixed(4)}, ${lon.toFixed(4)})` 
            });
          } else {
            onLocationDetected({
              latitude: lat.toFixed(6),
              longitude: lon.toFixed(6)
            });
            setVerifiedStatus({ 
              valid: true, 
              message: `Coordinates captured (${lat.toFixed(4)}, ${lon.toFixed(4)})` 
            });
          }
        } catch {
          // Fallback to coordinates only if Nominatim fails
          onLocationDetected({
            latitude: lat.toFixed(6),
            longitude: lon.toFixed(6)
          });
          setVerifiedStatus({ 
            valid: true, 
            message: `Coordinates captured: ${lat.toFixed(4)}, ${lon.toFixed(4)}` 
          });
        } finally {
          setDetecting(false);
        }
      },
      (error) => {
        setDetecting(false);
        let msg = 'Unable to retrieve location.';
        if (error.code === error.PERMISSION_DENIED) msg = 'Location permission denied by user.';
        else if (error.code === error.POSITION_UNAVAILABLE) msg = 'Location position unavailable.';
        else if (error.code === error.TIMEOUT) msg = 'Location request timed out.';
        setVerifiedStatus({ valid: false, message: msg });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Verify entered City / Address against Nominatim Search API
  const handleVerifyLocation = async () => {
    if (!city && !address) {
      setVerifiedStatus({ valid: false, message: 'Please enter a city or address first.' });
      return;
    }

    setVerifying(true);
    setVerifiedStatus(null);

    try {
      const query = [address, city, 'India'].filter(Boolean).join(', ');
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`
      );
      const data = await response.json();

      if (data && data.length > 0) {
        const place = data[0];
        const lat = parseFloat(place.lat).toFixed(6);
        const lon = parseFloat(place.lon).toFixed(6);

        onLocationDetected({
          latitude: lat,
          longitude: lon
        });

        setVerifiedStatus({
          valid: true,
          message: `Location verified! Found "${place.display_name.split(',')[0]}" (Lat: ${lat}, Lon: ${lon})`
        });
      } else {
        setVerifiedStatus({
          valid: false,
          message: 'Location not recognized. Please check spelling of your city or address.'
        });
      }
    } catch {
      setVerifiedStatus({
        valid: false,
        message: 'Network error while verifying location.'
      });
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="location-detector-box p-3 rounded-3 mb-3" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-2">
        <span className="small fw-bold text-secondary d-flex align-items-center gap-1">
          <IoLocationOutline color="#e11d48" size={16} /> Location Verification & Detection
        </span>
        <div className="d-flex gap-2">
          <button
            type="button"
            onClick={handleDetectLiveLocation}
            disabled={detecting}
            className="btn btn-danger btn-sm fw-bold d-flex align-items-center gap-1 px-3"
            style={{ borderRadius: 8 }}
          >
            <IoNavigateOutline className={detecting ? 'spin' : ''} size={15} />
            {detecting ? 'Detecting Live Location...' : '🎯 Detect Live GPS Location'}
          </button>

          <button
            type="button"
            onClick={handleVerifyLocation}
            disabled={verifying || (!city && !address)}
            className="btn btn-outline-secondary btn-sm fw-semibold d-flex align-items-center gap-1 px-3"
            style={{ borderRadius: 8 }}
          >
            <IoSearchOutline size={14} />
            {verifying ? 'Verifying...' : '📍 Verify Location'}
          </button>
        </div>
      </div>

      {/* Verification Status Feedback Badge */}
      {verifiedStatus && (
        <div 
          className={`small p-2 rounded-2 mt-2 d-flex align-items-center gap-2 ${
            verifiedStatus.valid ? 'bg-success-subtle text-success border border-success-subtle' : 'bg-warning-subtle text-danger border border-warning-subtle'
          }`}
          style={{ fontSize: '0.82rem' }}
        >
          {verifiedStatus.valid ? <IoCheckmarkCircleOutline size={18} /> : <IoAlertCircleOutline size={18} />}
          <span>{verifiedStatus.message}</span>
        </div>
      )}
    </div>
  );
};

export default LocationDetector;
