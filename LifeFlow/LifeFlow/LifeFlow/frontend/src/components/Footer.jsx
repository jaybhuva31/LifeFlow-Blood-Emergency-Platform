import React from 'react';
import { Link } from 'react-router-dom';
import { IoWater, IoCallOutline, IoMailOutline, IoLocationOutline, IoHeartCircleOutline } from 'react-icons/io5';

const Footer = () => {
  return (
    <footer style={{ background: '#0a0a0a', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '60px', paddingBottom: '30px', marginTop: 'auto' }}>
      <div className="container">
        <div className="row g-5 mb-5">
          <div className="col-lg-4 col-md-6">
            <Link className="d-flex align-items-center gap-2 text-decoration-none mb-3" to="/">
              <div style={{
                background: 'linear-gradient(135deg, #e53935, #b71c1c)',
                width: 40, height: 40, borderRadius: 12,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 16px rgba(229,57,53,0.3)'
              }}>
                <IoWater size={22} color="#fff" />
              </div>
              <span style={{ color: '#fff', fontSize: '1.4rem', fontWeight: 800 }}>
                Life<span style={{ color: '#ff6b6b' }}>Flow</span>
              </span>
            </Link>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', lineHeight: 1.7, marginBottom: 20, maxWidth: 300 }}>
              An AI-powered emergency blood network connecting voluntary donors with patients instantly to save lives in critical situations.
            </p>
            <div style={{ background: 'rgba(229,57,53,0.1)', border: '1px solid rgba(229,57,53,0.2)', color: '#ff6b6b', padding: '8px 16px', borderRadius: 8, display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', fontWeight: 700 }}>
              <IoHeartCircleOutline size={18} />
              Emergency Helpline: 108
            </div>
          </div>

          <div className="col-lg-2 col-md-6">
            <h6 style={{ color: '#fff', fontWeight: 700, marginBottom: 20 }}>Quick Links</h6>
            <ul className="list-unstyled mb-0" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <li><Link to="/" className="footer-link">Home</Link></li>
              <li><Link to="/about" className="footer-link">About Us</Link></li>
              <li><Link to="/camps" className="footer-link">Donation Camps</Link></li>
              <li><Link to="/login" className="footer-link">Login Portal</Link></li>
            </ul>
          </div>

          <div className="col-lg-3 col-md-6">
            <h6 style={{ color: '#fff', fontWeight: 700, marginBottom: 20 }}>How It Helps</h6>
            <ul className="list-unstyled mb-0" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <li style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>Find Nearby Emergency Requests</li>
              <li style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>Smart ML Demand Prediction</li>
              <li style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>Track Donation Status Real-Time</li>
              <li style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>Earn Donor Streak Badges</li>
            </ul>
          </div>

          <div className="col-lg-3 col-md-6">
            <h6 style={{ color: '#fff', fontWeight: 700, marginBottom: 20 }}>Contact Us</h6>
            <ul className="list-unstyled mb-0" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <li className="d-flex align-items-center gap-3">
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <IoCallOutline color="#e53935" size={16} />
                </div>
                <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}>+91 98765 43210</span>
              </li>
              <li className="d-flex align-items-center gap-3">
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <IoMailOutline color="#e53935" size={16} />
                </div>
                <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}>support@lifeflow.com</span>
              </li>
              <li className="d-flex align-items-center gap-3">
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <IoLocationOutline color="#e53935" size={16} />
                </div>
                <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}>Ahmedabad, Gujarat</span>
              </li>
            </ul>
          </div>
        </div>
        
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', margin: 0 }}>
            &copy; {new Date().getFullYear()} LifeFlow - Blood Donor Emergency System. All Rights Reserved.
          </p>
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem', margin: 0, fontWeight: 600 }}>
            DEVELOPED AS COLLEGE SEMESTER 4 PROJECT
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
