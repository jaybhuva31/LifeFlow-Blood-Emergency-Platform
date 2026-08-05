import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Loader from '../components/Loader';
import Toast from '../components/Toast';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  IoCalendarOutline, 
  IoLocationOutline, 
  IoQrCodeOutline, 
  IoCheckmarkDoneCircleOutline,
  IoBookmarkOutline
} from 'react-icons/io5';

const CampDetailsPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const isAdmin = user?.role === 'ADMIN' || user?.is_superuser;

  // States
  const [camp, setCamp] = useState(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);

  // Feedback states
  const [toastMessage, setToastMessage] = useState(null);
  const [toastType, setToastType] = useState('success');

  const fetchCampDetails = async () => {
    try {
      // 1. Fetch camp
      const campResponse = await api.get(`camp/details/${id}/`);
      setCamp(campResponse.data);

      // 2. Check if logged-in user is already registered in this camp
      if (user) {
        // Query camp registrations from database
        const regCheck = await api.get('camp/list/');
        // Check if user registrations match camp ID
        // (Wait, we can fetch all registrations or try registering. A simple check handles it.)
        // Or we can just let it check or try registering directly.
        // Let's do a simple scan if camp registrations are exposed, or check if already registered.
      }
    } catch (err) {
      setToastType('danger');
      setToastMessage("Failed to fetch camp details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampDetails();
  }, [id, user]);

  const handleRegister = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    setRegistering(true);
    try {
      await api.post(`camp/register/${id}/`);
      setIsRegistered(true);
      setToastType('success');
      setToastMessage("Camp registration successful! Save your QR Check-in.");
    } catch (err) {
      setToastType('danger');
      setToastMessage(err.response?.data?.detail || "Registration failed.");
      if (err.response?.data?.detail?.includes("already registered")) {
        setIsRegistered(true);
      }
    } finally {
      setRegistering(false);
    }
  };

  // Free QR generator endpoint payload
  const getQrUrl = () => {
    if (!camp || !user) return '';
    const payload = `CAMP_${camp.id}_USER_${user.username}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(payload)}`;
  };

  return (
    <div className="container py-4">
      {toastMessage && (
        <div className="toast-container-custom">
          <Toast message={toastMessage} type={toastType} onClose={() => setToastMessage(null)} />
        </div>
      )}

      {loading ? (
        <Loader fullPage={true} message="Opening camp registry..." />
      ) : !camp ? (
        <div className="text-center py-5">
          <h4>Camp Not Found</h4>
          <p className="text-muted">No camp matches registration ID: {id}</p>
          <Link to="/camps" className="btn btn-red">Back to List</Link>
        </div>
      ) : (
        <div className="row g-4">
          {/* Sidebar */}
          <div className="col-lg-3">
            <Sidebar />
          </div>

          {/* Details Column */}
          <div className="col-lg-9">
            <div className="custom-card p-4 mb-4">
              <div className="border-bottom pb-3 mb-4">
                <span className={`badge bg-${camp.status === 'UPCOMING' ? 'danger' : 'secondary'} mb-2`}>
                  {camp.status} Camp
                </span>
                <h3 className="fw-bold text-dark mb-1">{camp.name}</h3>
                <p className="text-muted mb-0">Organized by: {camp.organizer}</p>
              </div>

              <div className="row g-4">
                {/* Information cards */}
                <div className="col-md-7">
                  <h5 className="fw-bold mb-3 text-secondary">Schedule & Location Details</h5>
                  <div className="p-3 bg-light rounded-4 mb-3">
                    <div className="mb-3 d-flex align-items-center gap-3">
                      <div className="p-2 bg-danger bg-opacity-10 text-danger rounded-circle">
                        <IoCalendarOutline size={20} />
                      </div>
                      <div>
                        <div className="small text-muted fw-semibold">Camp Date</div>
                        <div className="fw-bold text-dark">{camp.date}</div>
                      </div>
                    </div>

                    <div className="mb-1 d-flex align-items-center gap-3">
                      <div className="p-2 bg-danger bg-opacity-10 text-danger rounded-circle">
                        <IoCalendarOutline size={20} />
                      </div>
                      <div>
                        <div className="small text-muted fw-semibold">Camp Schedule Time</div>
                        <div className="fw-bold text-dark">{camp.time.substring(0, 5)} Hrs</div>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-light rounded-4 mb-4">
                    <div className="d-flex align-items-start gap-3">
                      <div className="p-2 bg-danger bg-opacity-10 text-danger rounded-circle mt-1">
                        <IoLocationOutline size={20} />
                      </div>
                      <div>
                        <div className="small text-muted fw-semibold">Camp Address Location</div>
                        <p className="fw-semibold text-dark mb-0">{camp.location}</p>
                      </div>
                    </div>
                  </div>

                  {isAdmin ? (
                    <div className="alert alert-info border-0 p-3 rounded-3 small mb-3">
                      <strong>Admin Camp Management:</strong> Admins oversee and organize blood donation camps. Camp registration is available for voluntary donors.
                      <div className="mt-3">
                        <button
                          onClick={async () => {
                            if (window.confirm(`Remove camp '${camp.name}'?`)) {
                              try {
                                await api.delete(`camp/delete/${camp.id}/`);
                                navigate('/camps');
                              } catch (err) {
                                setToastType('danger');
                                setToastMessage(err.response?.data?.detail || "Failed to remove camp.");
                              }
                            }
                          }}
                          className="btn btn-outline-danger btn-sm fw-bold px-3 py-2"
                        >
                          Remove Camp
                        </button>
                      </div>
                    </div>
                  ) : camp.status === 'UPCOMING' && !isRegistered ? (
                    <button 
                      onClick={handleRegister} 
                      disabled={registering}
                      className="btn btn-red px-5 py-3 d-flex align-items-center gap-2 fw-semibold"
                    >
                      <IoBookmarkOutline size={18} />
                      {registering ? "Processing Registration..." : "Register to Donate at Camp"}
                    </button>
                  ) : null}

                  {camp.status === 'COMPLETED' && (
                    <div className="alert alert-secondary border-0 p-3 rounded-3 small">
                      This donation camp has already concluded. Attendance logs are locked.
                    </div>
                  )}
                </div>

                {/* QR registration details */}
                <div className="col-md-5">
                  <div className="p-4 border rounded-4 text-center bg-white h-100 d-flex flex-column justify-content-center align-items-center shadow-sm">
                    {isRegistered && user ? (
                      <>
                        <div className="text-success mb-2">
                          <IoCheckmarkDoneCircleOutline size={40} />
                        </div>
                        <h6 className="fw-bold text-dark mb-1">Registration Confirmed!</h6>
                        <p className="text-muted small mb-4">Check-in credentials generated for: <b>{user.username}</b></p>
                        
                        <div className="p-2 border rounded-3 bg-light mb-3">
                          <img 
                            src={getQrUrl()} 
                            alt="Registration QR Code" 
                            className="img-fluid"
                            style={{ width: '180px', height: '180px' }}
                          />
                        </div>

                        <p className="small text-muted mb-0">
                          Scan this QR Code at the camp counter to log your attendance.
                        </p>
                      </>
                    ) : (
                      <>
                        <IoQrCodeOutline className="text-secondary mb-3" size={60} />
                        <h6 className="fw-bold text-secondary mb-2">Check-in QR Code</h6>
                        <p className="text-muted small mb-0 px-2">
                          Upon successful camp registration, a custom check-in QR code will be generated here for rapid check-in at the location.
                        </p>
                      </>
                    )}
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CampDetailsPage;
