import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { 
  IoWaterOutline, IoSearchOutline, IoNotificationsOutline, 
  IoCalendarOutline, IoHeartCircleOutline, IoShieldCheckmarkOutline,
  IoSparklesOutline, IoPeopleOutline, IoArrowForwardOutline
} from 'react-icons/io5';

// Animated counter hook
const useCountUp = (target, duration = 2000, shouldStart = false) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!shouldStart) return;
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration, shouldStart]);
  return count;
};

const StatCounter = ({ value, suffix = '', label }) => {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  const count = useCountUp(value, 2000, visible);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setVisible(true); observer.disconnect(); }
    }, { threshold: 0.3 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} style={{ textAlign: 'center', padding: '12px' }}>
      <div className="stat-number">{count.toLocaleString()}{suffix}</div>
      <p style={{ color: '#6b7280', fontSize: '0.85rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', margin: '8px 0 0' }}>
        {label}
      </p>
    </div>
  );
};

const LandingPage = () => {
  const [stats, setStats] = useState({
    registered_donors: 1250,
    emergency_requests: 450,
    success_rate: 98,
    active_camps: 15
  });

  useEffect(() => {
    const fetchLiveStats = async () => {
      try {
        const res = await api.get('reports/landing-stats/');
        setStats(res.data);
      } catch (err) {
        console.error("Error loading live landing stats:", err);
      }
    };
    fetchLiveStats();
  }, []);
  return (
    <div>
      {/* ===== HERO ===== */}
      <header className="hero-section">
        {/* Decorative blobs */}
        <div className="hero-blob" style={{ width: 500, height: 500, background: '#e53935', top: -200, right: -100 }} />
        <div className="hero-blob" style={{ width: 300, height: 300, background: '#e53935', bottom: -100, left: 50, animationDelay: '3s' }} />

        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <div className="row align-items-center g-5">
            <div className="col-lg-6">
              <div className="badge-red mb-4" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <span className="pulse-dot" style={{ width: 8, height: 8 }} />
                Emergency Blood Network — Live
              </div>
              <h1 className="hero-title mb-4">
                Connecting <span>Life</span> Savers<br />In Real-Time.
              </h1>
              <p className="hero-subtitle mb-5" style={{ maxWidth: 440 }}>
                LifeFlow instantly matches voluntary blood donors with emergency requests near their location. Every second counts — sign up and save lives today.
              </p>
              <div className="d-flex flex-wrap gap-3">
                <Link to="/signup" className="btn btn-red d-flex align-items-center gap-2 px-4 py-3">
                  <IoHeartCircleOutline size={20} />
                  Become a Donor
                </Link>
                <Link to="/signup" className="btn-glass d-flex align-items-center gap-2 px-4 py-3" style={{ borderRadius: 10, fontSize: '0.9rem', fontWeight: 600 }}>
                  Request Blood
                  <IoArrowForwardOutline size={18} />
                </Link>
              </div>

              {/* Trust indicators */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginTop: 40, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(240,244,255,0.6)', fontSize: '0.82rem', fontWeight: 500 }}>
                  <IoShieldCheckmarkOutline size={18} color="#4ade80" />
                  Verified Donors
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(240,244,255,0.6)', fontSize: '0.82rem', fontWeight: 500 }}>
                  <IoNotificationsOutline size={18} color="#60a5fa" />
                  Real-Time Alerts
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(240,244,255,0.6)', fontSize: '0.82rem', fontWeight: 500 }}>
                  <IoSparklesOutline size={18} color="#f59e0b" />
                  AI-Powered Matching
                </div>
              </div>
            </div>

            {/* Hero Card Preview */}
            <div className="col-lg-6 text-center">
              <div style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 24,
                padding: 24,
                backdropFilter: 'blur(20px)',
                display: 'inline-block',
                maxWidth: 360,
                width: '100%'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                  <h6 style={{ color: '#fff', fontWeight: 700, margin: 0, fontSize: '0.9rem' }}>🔴 Live Emergency Requests</h6>
                  <div style={{ width: 10, height: 10, background: '#4ade80', borderRadius: '50%', animation: 'pulse-dot 1.5s infinite' }} />
                </div>

                {[
                  { group: 'O+', hospital: 'City Hospital, Mumbai', units: 2, urgency: 'Critical', color: '#e53935' },
                  { group: 'B-', hospital: 'Metro Clinic, Pune', units: 4, urgency: 'High', color: '#f59e0b' },
                  { group: 'AB+', hospital: 'Apollo, Bangalore', units: 1, urgency: 'Moderate', color: '#3b82f6' },
                ].map((req, i) => (
                  <div key={i} style={{
                    background: 'rgba(255,255,255,0.06)', borderRadius: 14,
                    padding: '14px 16px', marginBottom: i < 2 ? 12 : 0,
                    border: `1px solid ${req.color}30`,
                    display: 'flex', alignItems: 'center', gap: 14,
                    animation: `slideUp 0.4s ease ${i * 0.15}s both`
                  }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                      background: `linear-gradient(135deg, ${req.color}, ${req.color}aa)`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 900, fontSize: '0.85rem', color: '#fff'
                    }}>
                      {req.group}
                    </div>
                    <div style={{ flex: 1, textAlign: 'left' }}>
                      <div style={{ color: '#fff', fontWeight: 700, fontSize: '0.85rem' }}>{req.hospital}</div>
                      <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.75rem' }}>
                        {req.units} unit(s) needed
                      </div>
                    </div>
                    <span style={{
                      fontSize: '0.7rem', fontWeight: 700, padding: '3px 8px',
                      borderRadius: 20, background: `${req.color}25`, color: req.color,
                      whiteSpace: 'nowrap'
                    }}>
                      {req.urgency}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ===== STATS COUNTER ===== */}
      <section className="stat-counter-section">
        <div className="container">
          <div className="row g-4">
            <div className="col-6 col-md-3"><StatCounter value={stats.registered_donors} suffix={stats.raw_donors > 0 ? '' : '+'} label="Registered Donors" /></div>
            <div className="col-6 col-md-3"><StatCounter value={stats.emergency_requests} suffix={stats.raw_requests > 0 ? '' : '+'} label="Emergency Requests" /></div>
            <div className="col-6 col-md-3"><StatCounter value={stats.success_rate} suffix="%" label="Success Rate" /></div>
            <div className="col-6 col-md-3"><StatCounter value={stats.active_camps} suffix={stats.raw_camps > 0 ? '' : '+'} label="Active Camps" /></div>
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section style={{ padding: '80px 0', background: '#f4f6fb' }}>
        <div className="container">
          <div className="text-center mb-5">
            <span className="section-tag">How It Works</span>
            <h2 className="section-title">Save A Life In 3 Steps</h2>
            <p className="section-subtitle" style={{ maxWidth: 480, margin: '0 auto' }}>
              Our intelligent platform connects donors and receivers instantly.
            </p>
          </div>
          <div className="row g-4">
            {[
              { icon: <IoSearchOutline size={30} />, step: '01', title: 'Submit Request', desc: 'Receivers post blood requirements with blood group, units, location, and urgency level.' },
              { icon: <IoNotificationsOutline size={30} />, step: '02', title: 'Instant AI Match', desc: 'Our AI filters nearby available donors by blood compatibility and location, sending instant alerts.' },
              { icon: <IoHeartCircleOutline size={30} />, step: '03', title: 'Save A Life', desc: 'Donor accepts, travels to the hospital, and completes the donation. Track status in real-time.' },
            ].map((item, i) => (
              <div className="col-md-4" key={i}>
                <div className="feature-card h-100">
                  <div style={{ position: 'relative', display: 'inline-block', marginBottom: 20 }}>
                    <div className="feature-icon">{item.icon}</div>
                    <div style={{
                      position: 'absolute', top: -8, right: -8,
                      width: 24, height: 24, borderRadius: '50%',
                      background: 'linear-gradient(135deg, #e53935, #b71c1c)',
                      color: '#fff', fontSize: '0.6rem', fontWeight: 800,
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      {item.step}
                    </div>
                  </div>
                  <h5 style={{ fontWeight: 800, marginBottom: 10 }}>{item.title}</h5>
                  <p style={{ color: '#6b7280', fontSize: '0.88rem', lineHeight: 1.7, margin: 0 }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FEATURES ===== */}
      <section style={{ padding: '80px 0', background: '#fff' }}>
        <div className="container">
          <div className="text-center mb-5">
            <span className="section-tag">Platform Features</span>
            <h2 className="section-title">Everything You Need</h2>
          </div>
          <div className="row g-4">
            {[
              { icon: '🤖', title: 'AI Demand Prediction', desc: 'ML-powered blood demand forecasting by city and season to help donors plan their donations.' },
              { icon: '⚡', title: 'Real-Time Emergency Alerts', desc: 'Get instant notifications when a critical blood request matches your blood group and location.' },
              { icon: '📊', title: 'Donation Tracking', desc: 'Track your donation status live: Sent → On Way → Arrived → Complete.' },
              { icon: '⭐', title: 'Donor Ratings & Feedback', desc: 'Receivers can rate and thank donors, building a trusted community.' },
              { icon: '🏆', title: 'Achievement Badges', desc: 'Earn Bronze, Silver, and Gold streaks as you complete more life-saving donations.' },
              { icon: '🩸', title: 'Blood Camp Finder', desc: 'Discover nearby blood donation camps and events with all details.' },
            ].map((f, i) => (
              <div className="col-md-4 col-sm-6" key={i}>
                <div style={{ padding: '24px', background: '#f8fafc', borderRadius: 16, border: '1px solid #e8eaf0', height: '100%', transition: 'all 0.28s ease', cursor: 'default' }}
                  className="hover-lift">
                  <div style={{ fontSize: '2rem', marginBottom: 14 }}>{f.icon}</div>
                  <h6 style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 8 }}>{f.title}</h6>
                  <p style={{ color: '#6b7280', fontSize: '0.82rem', lineHeight: 1.6, margin: 0 }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section style={{
        background: 'linear-gradient(135deg, #0f1117 0%, #1a0a0a 100%)',
        padding: '80px 0',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', top: -100, right: -100, width: 400, height: 400, background: 'radial-gradient(circle, rgba(229,57,53,0.15), transparent 70%)', pointerEvents: 'none' }} />
        <div className="container text-center" style={{ position: 'relative', zIndex: 1 }}>
          <IoPeopleOutline size={52} color="#e53935" style={{ marginBottom: 20 }} />
          <h2 style={{ color: '#fff', fontWeight: 800, fontSize: '2.2rem', marginBottom: 16 }}>
            Ready to Save a Life?
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '1rem', maxWidth: 440, margin: '0 auto 36px' }}>
            Join thousands of donors making a difference. One donation can save up to 3 lives.
          </p>
          <div className="d-flex gap-3 justify-content-center flex-wrap">
            <Link to="/signup" className="btn btn-red px-5 py-3 d-flex align-items-center gap-2">
              <IoHeartCircleOutline size={20} />
              Join LifeFlow Today
            </Link>
            <Link to="/camps" className="btn-glass px-5 py-3 d-flex align-items-center gap-2" style={{ borderRadius: 10, fontSize: '0.9rem', fontWeight: 600 }}>
              <IoCalendarOutline size={20} />
              Find Donation Camps
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
