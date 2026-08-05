import React, { useState, useEffect, useMemo } from 'react';
import api from '../services/api';

// Blood demand prediction using heuristic ML model
// Factors: blood group rarity, city population, seasonal patterns
const BLOOD_GROUP_RARITY = { 'O-': 0.07, 'AB-': 0.01, 'B-': 0.02, 'A-': 0.06, 'O+': 0.38, 'A+': 0.34, 'B+': 0.09, 'AB+': 0.03 };
const BLOOD_DEMAND_WEIGHTS = { 'O-': 0.95, 'AB-': 0.88, 'B-': 0.82, 'A-': 0.78, 'O+': 0.72, 'B+': 0.60, 'A+': 0.55, 'AB+': 0.45 };

const METRO_CITIES = ['mumbai', 'delhi', 'bangalore', 'bengaluru', 'hyderabad', 'chennai', 'kolkata', 'pune', 'ahmedabad', 'surat'];
const TIER2_CITIES = ['jaipur', 'lucknow', 'kanpur', 'nagpur', 'patna', 'indore', 'bhopal', 'vadodara', 'ludhiana'];

const getSeasonDemandMultiplier = () => {
  const month = new Date().getMonth(); // 0-11
  if (month >= 3 && month <= 5) return 1.25; // Apr-Jun: summer accidents
  if (month >= 10 && month <= 11) return 1.15; // Nov-Dec: festivals
  if (month >= 6 && month <= 8) return 1.10; // Monsoon
  return 1.0;
};

const getCityMultiplier = (city = '') => {
  const c = city.toLowerCase();
  if (METRO_CITIES.some(m => c.includes(m))) return 1.30;
  if (TIER2_CITIES.some(t => c.includes(t))) return 1.15;
  return 1.0;
};

const predictDemand = (bloodGroup, city) => {
  const rarity = BLOOD_GROUP_RARITY[bloodGroup] || 0.10;
  const demandBase = BLOOD_DEMAND_WEIGHTS[bloodGroup] || 0.50;
  const rarityBoost = (1 - rarity) * 0.3;
  const season = getSeasonDemandMultiplier();
  const cityMult = getCityMultiplier(city);
  const score = Math.min(0.99, (demandBase + rarityBoost) * season * cityMult);
  return Math.round(score * 100);
};

const getDemandLabel = (pct) => {
  if (pct >= 85) return { label: 'CRITICAL', color: '#e53935', bg: 'rgba(229,57,53,0.15)' };
  if (pct >= 70) return { label: 'HIGH', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' };
  if (pct >= 50) return { label: 'MODERATE', color: '#3b82f6', bg: 'rgba(59,130,246,0.15)' };
  return { label: 'LOW', color: '#10b981', bg: 'rgba(16,185,129,0.15)' };
};

const getSeasonName = () => {
  const month = new Date().getMonth();
  if (month >= 3 && month <= 5) return 'Summer';
  if (month >= 6 && month <= 8) return 'Monsoon';
  if (month >= 9 && month <= 10) return 'Autumn';
  return 'Winter';
};

// Show predictions for all 8 blood groups
const ALL_GROUPS = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];

const MLPredictionPanel = ({ donorBloodGroup, donorCity }) => {
  const city = donorCity || 'Unknown';
  const [mlData, setMlData] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const fetchMlData = async () => {
      try {
        const res = await api.get('requests/emergency/predict-demand/', {
          params: { blood_group: donorBloodGroup, city: donorCity }
        });
        if (isMounted && res.data) {
          setMlData(res.data);
        }
      } catch (err) {
        console.warn("Backend ML endpoint unavailable, using local model fallback:", err);
      }
    };
    fetchMlData();
    return () => { isMounted = false; };
  }, [donorBloodGroup, donorCity]);

  const fallbackPct = useMemo(() => predictDemand(donorBloodGroup, city), [donorBloodGroup, city]);
  const myPct = mlData?.demand_percentage ?? fallbackPct;
  const myDemand = getDemandLabel(myPct);
  const season = getSeasonName();

  const fallbackGroupInsights = useMemo(() =>
    ALL_GROUPS
      .map(g => ({ group: g, pct: predictDemand(g, city) }))
      .sort((a, b) => b.pct - a.pct)
      .slice(0, 4),
    [city]
  );

  const groupInsights = mlData?.all_groups_forecast
    ? mlData.all_groups_forecast.map(item => ({ group: item.blood_group, pct: item.demand_pct })).slice(0, 4)
    : fallbackGroupInsights;

  return (
    <div className="ml-panel mb-4">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 20 }}>
        <div>
          <div className="ml-badge">
            🤖 AI Powered
          </div>
          <h5 style={{ color: '#fff', fontWeight: 800, fontSize: '1.1rem', margin: 0 }}>
            Blood Demand Prediction
          </h5>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', margin: '4px 0 0' }}>
            {season} Season · {city}
          </p>
        </div>
        {/* My Blood Group Indicator */}
        {donorBloodGroup && (
          <div style={{
            textAlign: 'center',
            background: 'rgba(255,255,255,0.07)',
            borderRadius: 12,
            padding: '12px 16px',
            border: `1px solid ${myDemand.color}40`,
            minWidth: 90
          }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 900, color: myDemand.color }}>
              {donorBloodGroup}
            </div>
            <div style={{
              fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.08em',
              color: myDemand.color, background: myDemand.bg,
              padding: '2px 8px', borderRadius: 50, marginTop: 6, display: 'inline-block'
            }}>
              {myDemand.label}
            </div>
          </div>
        )}
      </div>

      {/* My blood group demand highlight */}
      {donorBloodGroup && (
        <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 10, padding: '12px 16px', marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.82rem', fontWeight: 600 }}>
              Your Blood Group Demand ({donorBloodGroup})
            </span>
            <span style={{ color: myDemand.color, fontWeight: 800, fontSize: '1rem' }}>{myPct}%</span>
          </div>
          <div className="demand-bar">
            <div className="demand-bar-fill" style={{ width: `${myPct}%`, background: `linear-gradient(90deg, ${myDemand.color}, ${myDemand.color}aa)` }} />
          </div>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.75rem', margin: '8px 0 0' }}>
            {myPct >= 85
              ? `⚠️ Critically needed! Your ${donorBloodGroup} donation can save lives this ${season}.`
              : myPct >= 70
              ? `📈 High demand predicted for ${donorBloodGroup} in ${city} this ${season}.`
              : myPct >= 50
              ? `🔵 Moderate demand for ${donorBloodGroup}. Consider donating soon.`
              : `✅ ${donorBloodGroup} supply is relatively stable in your area.`}
          </p>
        </div>
      )}

      {/* Top demand groups */}
      <div>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', fontWeight: 600, marginBottom: 10, letterSpacing: '0.06em' }}>
          DEMAND FORECAST BY BLOOD GROUP
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {groupInsights.map(({ group, pct }) => {
            const { color } = getDemandLabel(pct);
            return (
              <div key={group}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem', fontWeight: 700 }}>
                    {group} {group === donorBloodGroup && <span style={{ color: color, fontSize: '0.65rem' }}>← You</span>}
                  </span>
                  <span style={{ color, fontSize: '0.8rem', fontWeight: 700 }}>{pct}%</span>
                </div>
                <div className="demand-bar">
                  <div className="demand-bar-fill" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}, ${color}80)` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tip */}
      <div style={{ marginTop: 18, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: '1.2rem' }}>💡</span>
        <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.75rem', margin: 0 }}>
          Predictions are based on blood group rarity, seasonal patterns, and city demand trends.
        </p>
      </div>
    </div>
  );
};

export default MLPredictionPanel;
