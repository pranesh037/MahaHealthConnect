import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { api } from '../../services/api';
import { Video, Mic, MicOff, VideoOff, PhoneOff, Clock, FileText, User, ShieldCheck, CheckCircle } from 'lucide-react';

export const TeleconsultationRoom = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();

  const [tele, setTele] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [callActive, setCallActive] = useState(true);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const loadTele = async () => {
      try {
        const res = await api.teleconsultations();
        const found = (res.teleconsultations || []).find(t => t.teleconsultation_id === id || t._id === id);
        if (found) {
          if (isMounted) {
            setTele(found);
            setNotes(found.notes || '');
          }
        } else {
          if (isMounted) setError('Teleconsultation session not found');
        }
      } catch (err) {
        if (isMounted) setError(err.message || 'Failed to load teleconsultation session');
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadTele();
    return () => { isMounted = false; };
  }, [id]);

  useEffect(() => {
    let interval = null;
    if (callActive) {
      interval = setInterval(() => {
        setTimerSeconds(s => s + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [callActive]);

  const formatTimer = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleEndCall = async () => {
    setCallActive(false);
    setSaving(true);
    try {
      if (tele) {
        await api.updateTeleconsultationStatus(tele.teleconsultation_id, 'COMPLETED', notes);
        if (user.role === 'doctor' && tele.patient_id) {
          await api.createConsultation({
            patient_id: tele.patient_id,
            doctor_id: user.user_id,
            facility_id: user.facility_id,
            complaint: tele.reason || 'Teleconsultation Session',
            observations: `Completed teleconsultation. Duration: ${formatTimer(timerSeconds)}`,
            diagnosis: 'Teleconsultation Completed',
            notes: notes || 'Clinical notes recorded during video consultation.'
          }).catch(e => console.warn('Auto consultation log warning:', e));
        }
      }
    } catch (err) {
      console.error('Failed to end teleconsultation:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="gov-card" style={{ textAlign: 'center', padding: '2rem' }}>
        <p>Connecting to secure teleconsultation room...</p>
      </div>
    );
  }

  if (error || !tele) {
    return (
      <div className="gov-card" style={{ color: '#991B1B', backgroundColor: '#FEF2F2', padding: '1.5rem', textAlign: 'center' }}>
        <h3>Teleconsultation Error</h3>
        <p>{error || 'Session not found'}</p>
        <button className="gov-btn gov-btn-secondary" onClick={() => navigate(-1)} style={{ marginTop: '1rem' }}>
          Return to Portal
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      {/* Top Session Header */}
      <div
        className="gov-card"
        style={{
          backgroundColor: '#0F2C59',
          color: '#ffffff',
          marginBottom: '1rem',
          backgroundImage: 'linear-gradient(135deg, #0F2C59 0%, #1E3A8A 100%)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#F59E0B', fontWeight: '700', textTransform: 'uppercase' }}>
              Tele-Medicine Consultation Room
            </div>
            <h2 style={{ fontSize: '1.375rem', fontWeight: '800', margin: '0.25rem 0' }}>
              Session #{tele.teleconsultation_id}
            </h2>
            <div style={{ fontSize: '0.875rem', color: '#CBD5E1' }}>
              Patient: <strong>{tele.patient_name || tele.patient_id}</strong> • Doctor: <strong>{tele.doctor_name || tele.doctor_id}</strong>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'rgba(255,255,255,0.15)', padding: '0.5rem 0.875rem', borderRadius: '8px' }}>
              <Clock size={16} style={{ color: '#F59E0B' }} />
              <span style={{ fontWeight: '800', fontFamily: 'monospace', fontSize: '1rem' }}>{formatTimer(timerSeconds)}</span>
            </div>
            <div style={{ backgroundColor: callActive ? '#059669' : '#DC2626', color: '#ffffff', padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '800' }}>
              {callActive ? 'LIVE' : 'COMPLETED'}
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
        {/* Left: Video Interface Area */}
        <div className="gov-card" style={{ padding: '1rem', backgroundColor: '#090D16', color: '#ffffff', borderRadius: '12px' }}>
          <div style={{ position: 'relative', width: '100%', height: '360px', backgroundColor: '#1E293B', borderRadius: '8px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {camOn && callActive ? (
              <div style={{ textAlign: 'center', width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(circle, #1E3A8A 0%, #0F172A 100%)' }}>
                <Video size={64} style={{ color: '#60A5FA', marginBottom: '1rem' }} />
                <div style={{ fontWeight: '700', fontSize: '1.125rem' }}>Encrypted Tele-Video Feed Active</div>
                <div style={{ fontSize: '0.8125rem', color: '#94A3B8', marginTop: '0.25rem' }}>
                  Participant: {user?.name} ({user?.role?.toUpperCase()})
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: '#64748B' }}>
                <VideoOff size={48} style={{ marginBottom: '0.5rem' }} />
                <div>Camera Turned Off</div>
              </div>
            )}

            {/* PIP Thumbnail */}
            <div style={{ position: 'absolute', bottom: '12px', right: '12px', width: '110px', height: '80px', backgroundColor: '#0F172A', border: '2px solid #3B82F6', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', fontSize: '0.75rem' }}>
              <User size={20} />
            </div>
          </div>

          {/* Action Bar / Controls */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '1rem' }}>
            <button
              onClick={() => setMicOn(!micOn)}
              style={{
                width: '48px', height: '48px', borderRadius: '50%', border: 'none',
                backgroundColor: micOn ? '#334155' : '#DC2626', color: '#ffffff',
                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
              }}
              title={micOn ? 'Mute Mic' : 'Unmute Mic'}
            >
              {micOn ? <Mic size={20} /> : <MicOff size={20} />}
            </button>

            <button
              onClick={() => setCamOn(!camOn)}
              style={{
                width: '48px', height: '48px', borderRadius: '50%', border: 'none',
                backgroundColor: camOn ? '#334155' : '#DC2626', color: '#ffffff',
                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
              }}
              title={camOn ? 'Turn Off Camera' : 'Turn On Camera'}
            >
              {camOn ? <Video size={20} /> : <VideoOff size={20} />}
            </button>

            {callActive ? (
              <button
                onClick={handleEndCall}
                style={{
                  padding: '0.625rem 1.25rem', borderRadius: '24px', border: 'none',
                  backgroundColor: '#DC2626', color: '#ffffff', fontWeight: '700',
                  display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer'
                }}
              >
                <PhoneOff size={18} />
                <span>End Call</span>
              </button>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#34D399', fontWeight: '700' }}>
                <CheckCircle size={20} />
                <span>Consultation Ended</span>
              </div>
            )}
          </div>
        </div>

        {/* Right: Clinical Notes & Details */}
        <div className="gov-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="gov-card-header">
            <div className="gov-card-title">
              <FileText size={20} />
              <span>Consultation Notes & Findings</span>
            </div>
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ padding: '0.75rem', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '0.875rem' }}>
              <div><strong>Reason for Call:</strong> {tele.reason || 'Specialist Consult'}</div>
              <div><strong>Facility Scope:</strong> {tele.facility_id || 'FAC-101'}</div>
              <div><strong>Status:</strong> {tele.status}</div>
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <label className="gov-label" style={{ fontWeight: '700' }}>Doctor Clinical Assessment Notes</label>
              <textarea
                className="gov-textarea"
                style={{ flex: 1, minHeight: '160px', marginTop: '0.375rem' }}
                placeholder="Enter clinical observations, advice, diagnosis or prescribed regimen during this teleconsultation..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={!callActive && saving}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: 'auto' }}>
              <button
                className="gov-btn gov-btn-primary"
                style={{ flex: 1 }}
                onClick={handleEndCall}
                disabled={saving}
              >
                {saving ? 'Saving to Records...' : callActive ? 'Complete Consultation & Save Notes' : 'Update Clinical Record'}
              </button>

              <button
                className="gov-btn gov-btn-secondary"
                onClick={() => navigate(-1)}
              >
                Back
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
