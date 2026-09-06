import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { usePatients } from '../../context/PatientContext';
import { StatusBadge } from '../../components/common/StatusBadge';
import {
  Baby,
  Calendar,
  CheckCircle2,
  PlusCircle,
  AlertTriangle,
  Users
} from 'lucide-react';

export const HealthWorkerMaternalPage = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { patients } = usePatients();

  const [maternalList, setMaternalList] = useState(() => patients.filter((p) => p.is_maternal));

  const [form, setForm] = useState({
    patient_id: patients[1]?.patient_id || 'PAT-10246',
    edd: '',
    vitals_bp: '120/80',
    weight: '55',
    risk: 'NORMAL',
    next_visit: ''
  });

  const [message, setMessage] = useState('');

  const handleRegister = (e) => {
    e.preventDefault();
    const pt = patients.find((p) => p.patient_id === form.patient_id);
    const newEntry = {
      patient_id: form.patient_id,
      name: pt ? pt.name : form.patient_id,
      age: pt ? pt.age : 25,
      edd_date: form.edd || '2026-12-25',
      gestational_age_weeks: 16,
      trimester: 2,
      risk_category: form.risk,
      high_risk_factors: form.risk === 'HIGH' ? ['Recorded High Risk Indicator'] : [],
      anc_visits_completed: 1,
      anc_visits_required: 4,
      next_due_visit: form.next_visit || '2026-09-15',
      vitals: { bp: form.vitals_bp, weight: `${form.weight} kg` },
      assigned_asha: user?.name || 'Sunita Shinde'
    };

    setMaternalList([newEntry, ...maternalList]);
    setMessage(t('ancSaved'));
    setForm({ patient_id: patients[1]?.patient_id || 'PAT-10246', edd: '', vitals_bp: '120/80', weight: '55', risk: 'NORMAL', next_visit: '' });
  };

  const highRiskPatients = maternalList.filter((p) => p.risk_category === 'HIGH' || p.high_risk_factors?.length > 0);
  const upcomingVisits = maternalList.filter((p) => p.next_due_visit);

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      {/* Banner */}
      <div
        className="gov-card"
        style={{
          backgroundColor: '#0F2C59',
          color: '#ffffff',
          marginBottom: '1.5rem',
          backgroundImage: 'linear-gradient(135deg, #0F2C59 0%, #1E3A8A 100%)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ color: '#F59E0B', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>
              {t('fieldMaternalModule')}
            </div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0.25rem 0' }}>
              {t('ancMonitoringTitle')}
            </h1>
            <p style={{ color: '#CBD5E1', margin: 0, fontSize: '0.875rem' }}>
              {t('facility')}: <strong>{user?.facility_name || 'PHC Mulshi'}</strong>
            </p>
          </div>
          <StatusBadge status="AVAILABLE" customLabel={t('active_workflow')} />
        </div>
      </div>

      {message && (
        <div className="gov-card" style={{ backgroundColor: '#ECFDF5', border: '1px solid #A7F3D0', color: '#065F46', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle2 size={18} />
          {message}
        </div>
      )}

      {/* Overview Stats */}
      <div className="grid-stats" style={{ marginBottom: '1.5rem' }}>
        <div className="stat-card">
          <div>
            <div className="stat-value">{maternalList.length}</div>
            <div className="stat-label">{t('activeAncPatients')}</div>
          </div>
          <Baby style={{ color: '#1E40AF' }} />
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-value">{upcomingVisits.length}</div>
            <div className="stat-label">{t('upcomingAncVisits')}</div>
          </div>
          <Calendar style={{ color: '#059669' }} />
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-value" style={{ color: '#DC2626' }}>{highRiskPatients.length}</div>
            <div className="stat-label">{t('highRiskFollowups')}</div>
          </div>
          <AlertTriangle style={{ color: '#DC2626' }} />
        </div>
      </div>

      {/* Workflow Form: Register ANC & Record Visit */}
      <div className="gov-card" style={{ marginBottom: '1.5rem' }}>
        <div className="gov-card-header">
          <div className="gov-card-title">
            <PlusCircle size={18} />
            <span>{t('registerAncAndVisit')}</span>
          </div>
        </div>

        <form onSubmit={handleRegister}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
            <label className="gov-form-group">
              <span className="gov-label">{t('selectPatient')}</span>
              <select className="gov-select" value={form.patient_id} onChange={(e) => setForm({ ...form, patient_id: e.target.value })}>
                {patients.map((p) => (
                  <option key={p.patient_id} value={p.patient_id}>
                    {p.patient_id} - {p.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="gov-form-group">
              <span className="gov-label">{t('expectedDeliveryDate')}</span>
              <input type="date" className="gov-input" value={form.edd} onChange={(e) => setForm({ ...form, edd: e.target.value })} required />
            </label>

            <label className="gov-form-group">
              <span className="gov-label">{t('bloodPressureLabel')}</span>
              <input type="text" className="gov-input" value={form.vitals_bp} onChange={(e) => setForm({ ...form, vitals_bp: e.target.value })} placeholder="120/80" />
            </label>

            <label className="gov-form-group">
              <span className="gov-label">{t('weightKg')}</span>
              <input type="number" className="gov-input" value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} placeholder="55" />
            </label>

            <label className="gov-form-group">
              <span className="gov-label">{t('riskCategory')}</span>
              <select className="gov-select" value={form.risk} onChange={(e) => setForm({ ...form, risk: e.target.value })}>
                <option value="NORMAL">{t('normal_risk')}</option>
                <option value="HIGH">{t('high_risk')}</option>
              </select>
            </label>

            <label className="gov-form-group">
              <span className="gov-label">{t('nextVisitDate')}</span>
              <input type="date" className="gov-input" value={form.next_visit} onChange={(e) => setForm({ ...form, next_visit: e.target.value })} required />
            </label>
          </div>

          <button type="submit" className="gov-btn gov-btn-primary">
            <Baby size={16} />
            <span>{t('saveAncRecord')}</span>
          </button>
        </form>
      </div>

      {/* Active ANC Patients List */}
      <div className="gov-card" style={{ marginBottom: '1.5rem' }}>
        <div className="gov-card-header">
          <div className="gov-card-title">
            <Users size={18} />
            <span>{t('activeAncRegistry')}</span>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="gov-table">
            <thead>
              <tr>
                <th>{t('patientId')} & {t('name')}</th>
                <th>{t('expectedDeliveryDate')}</th>
                <th>{t('ancVisitsCompleted')}</th>
                <th>{t('nextVisitDate')}</th>
                <th>{t('riskCategory')}</th>
              </tr>
            </thead>
            <tbody>
              {maternalList.map((m, idx) => (
                <tr key={idx}>
                  <td>
                    <strong>{m.name}</strong><br />
                    <small style={{ color: '#64748B' }}>{m.patient_id} • {t('ageGender')}: {m.age}</small>
                  </td>
                  <td>{m.edd_date}</td>
                  <td>{m.anc_visits_completed} of {m.anc_visits_required}</td>
                  <td><strong style={{ color: '#1E40AF' }}>{m.next_due_visit}</strong></td>
                  <td><StatusBadge status={m.risk_category || 'NORMAL'} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
