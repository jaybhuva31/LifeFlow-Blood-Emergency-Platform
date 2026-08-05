import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import Toast from '../components/Toast';
import MapComponent from '../components/MapComponent';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  IoMapOutline, 
  IoLocationOutline, 
  IoSearchOutline, 
  IoCallOutline, 
  IoPinOutline 
} from 'react-icons/io5';

const MapPage = () => {
  const { user } = useAuth();

  // States
  const [donors, setDonors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [centerCoord, setCenterCoord] = useState({ lat: 18.9750, lng: 72.8258 }); // default Mumbai
  const [userLocation, setUserLocation] = useState(null);

  // Search parameters
  const [searchParams, setSearchParams] = useState({
    blood_group: 'O+',
    city: '',
    radius: 15 // radius filter in km
  });

  // Feedback states
  const [toastMessage, setToastMessage] = useState(null);
  const [toastType, setToastType] = useState('success');

  // Haversine formula to compute distance in km (viva winner feature!)
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return null;
    const R = 6371; // earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return parseFloat((R * c).toFixed(2));
  };

  // Get current location from browser Geolocation API
  const detectUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = { lat: position.coords.latitude, lng: position.coords.longitude };
          setUserLocation(loc);
          setCenterCoord(loc);
          setToastType('success');
          setToastMessage("Your GPS location detected successfully!");
        },
        (error) => {
          console.log("Geolocation error:", error);
          setToastType('warning');
          setToastMessage("Location permission denied. Using default map center.");
        }
      );
    }
  };

  const fetchNearbyDonors = async () => {
    setSearching(true);
    try {
      const params = {};
      if (searchParams.blood_group) params.blood_group = searchParams.blood_group;
      if (searchParams.city) params.city = searchParams.city;

      const response = await api.get('donor/nearby/', { params });
      
      // Calculate distance for each donor if userLocation is available
      const donorsWithDistance = response.data.map(d => {
        let distance = null;
        if (userLocation && d.latitude && d.longitude) {
          distance = calculateDistance(userLocation.lat, userLocation.lng, d.latitude, d.longitude);
        }
        return { ...d, distance };
      });

      // Filter by radius if userLocation & distance are available
      let filtered = donorsWithDistance;
      if (userLocation && searchParams.radius) {
        filtered = donorsWithDistance.filter(d => d.distance === null || d.distance <= searchParams.radius);
      }

      // Sort by distance (nearest first)
      filtered.sort((a, b) => {
        if (a.distance === null) return 1;
        if (b.distance === null) return -1;
        return a.distance - b.distance;
      });

      setDonors(filtered);
    } catch (err) {
      setToastType('danger');
      setToastMessage("Failed to query nearby compatible donors.");
    } finally {
      setSearching(false);
      setLoading(false);
    }
  };

  // Trigger search on mount and coordinates load
  useEffect(() => {
    detectUserLocation();
  }, []);

  useEffect(() => {
    fetchNearbyDonors();
  }, [userLocation]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchNearbyDonors();
  };

  // Map markers mapping
  const mapMarkers = donors.map(d => ({
    latitude: d.latitude,
    longitude: d.longitude,
    name: `${d.user?.first_name} ${d.user?.last_name}`,
    blood_group: d.blood_group,
    city: d.city,
    phone: d.phone || d.user?.phone
  }));

  return (
    <div className="container py-4">
      {toastMessage && (
        <div className="toast-container-custom">
          <Toast message={toastMessage} type={toastType} onClose={() => setToastMessage(null)} />
        </div>
      )}

      {loading ? (
        <Loader fullPage={true} message="Initializing Leaflet Maps module..." />
      ) : (
        <div className="row g-4">
          {/* Sidebar */}
          <div className="col-lg-3">
            <Sidebar />
          </div>

          {/* Main content */}
          <div className="col-lg-9">
            <div className="custom-card p-4 mb-4">
              <div className="d-flex align-items-center gap-3 border-bottom pb-3 mb-4">
                <div className="text-danger">
                  <IoMapOutline size={36} />
                </div>
                <div>
                  <h4 className="fw-bold mb-0">Nearby Donors Map</h4>
                  <p className="text-secondary small mb-0">Locate active blood savers and trace route distances</p>
                </div>
              </div>

              {/* Search Form */}
              <form onSubmit={handleSearchSubmit} className="row g-2 mb-4">
                <div className="col-md-3 col-6">
                  <label className="form-label small fw-semibold text-muted">Blood Group</label>
                  <select 
                    className="form-select form-select-sm"
                    value={searchParams.blood_group}
                    onChange={(e) => setSearchParams(prev => ({ ...prev, blood_group: e.target.value }))}
                  >
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>

                <div className="col-md-3 col-6">
                  <label className="form-label small fw-semibold text-muted">Filter City</label>
                  <input 
                    type="text" 
                    className="form-control form-control-sm"
                    placeholder="e.g. Mumbai"
                    value={searchParams.city}
                    onChange={(e) => setSearchParams(prev => ({ ...prev, city: e.target.value }))}
                  />
                </div>

                <div className="col-md-3 col-6">
                  <label className="form-label small fw-semibold text-muted">Search Radius (km)</label>
                  <select 
                    className="form-select form-select-sm"
                    value={searchParams.radius}
                    onChange={(e) => setSearchParams(prev => ({ ...prev, radius: Number(e.target.value) }))}
                  >
                    <option value={5}>5 km</option>
                    <option value={10}>10 km</option>
                    <option value={15}>15 km</option>
                    <option value={25}>25 km</option>
                    <option value={50}>50 km</option>
                  </select>
                </div>

                <div className="col-md-3 col-6 d-flex align-items-end">
                  <button type="submit" disabled={searching} className="btn btn-red btn-sm w-100 py-2 d-flex align-items-center justify-content-center gap-2 fw-medium">
                    <IoSearchOutline size={16} />
                    Search Map
                  </button>
                </div>
              </form>

              {/* Leaflet Map component */}
              <div className="mb-4">
                <MapComponent 
                  centerLat={centerCoord.lat} 
                  centerLng={centerCoord.lng} 
                  markers={mapMarkers}
                  detectedLocation={userLocation}
                />
              </div>

              {/* Nearby Donors listing */}
              <h5 className="fw-bold mb-3 border-bottom pb-2">Matching Donors By Distance</h5>
              
              {searching ? (
                <Loader message="Recalculating routing metrics..." />
              ) : donors.length > 0 ? (
                <div className="row g-3">
                  {donors.map((d) => (
                    <div className="col-md-6" key={d.id}>
                      <div className="p-3 border rounded-3 bg-white d-flex align-items-center gap-3">
                        <div className="bg-danger text-white rounded-circle d-flex align-items-center justify-content-center fw-bold fs-5 shadow-sm" style={{ width: '50px', height: '50px', flexShrink: 0 }}>
                          {d.blood_group}
                        </div>
                        <div className="flex-grow-1 overflow-hidden">
                          <h6 className="fw-bold mb-0 text-dark text-truncate">
                            {d.user?.first_name} {d.user?.last_name}
                          </h6>
                          <div className="small text-muted mb-1 d-flex align-items-center gap-1">
                            <IoLocationOutline className="text-danger" size={13} />
                            {d.city}
                            {d.distance !== null && (
                              <span className="badge bg-secondary ms-1 fw-normal">{d.distance} km away</span>
                            )}
                          </div>
                          <a href={`tel:${d.phone || d.user?.phone}`} className="small text-danger fw-semibold text-decoration-none d-flex align-items-center gap-1">
                            <IoCallOutline size={13} />
                            {d.phone || d.user?.phone}
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState 
                  message="No available matching donors." 
                  subMessage="Try expanding your search radius or clearing the city filter."
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapPage;
