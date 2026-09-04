import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { usePatients } from '../../context/PatientContext';
import { StatusBadge } from '../../components/common/StatusBadge';
import { MOCK_MATERNAL_PROFILES } from '../../mockData';
import {
  Baby,
  CalendarCheck,
  Activity,
  ShieldCheck,
  Clock,
  CheckCircle2
} from 'lucide-react';

export const PatientMaternalPage = () => {
  const { t } = useLanguage();
  const { patients } = usePatients();

  const maternalPatient = patients.find((p) => p.is_maternal) || MOCK_MATERNAL_PROFILES[0] || {
    patient_id: 'PAT-10246',
    name: 'Savita Dnyaneshwar Jadhav',
    age: 26,
    lmp_date: '2026-03-12',
    edd_date: '2026-12-17',
    gestational_age_weeks: 24,
    trimester: 2,
    risk_category: 'NORMAL',
    high_risk_factors: [],
    anc_visits_completed: 2,
    anc_visits_required: 4,
    last_visit: '2026-08-05',
    next_due_visit: '2026-09-02',
    vitals: { bp: '110/70', weight: '54 kg', hemoglobin: '11.8 g/dL', blood_sugar: '92 mg/dL' },
    assigned_asha: 'Sunita Shinde (PHC Mulshi)'
  };

  const timelineSteps = [
    { title: t('ancRegistration'), status: 'COMPLETED', date: '2026-04-10', note: 'Registered at PHC Mulshi • LMP: 12 Mar 2026' },
    { title: t('visit1'), status: 'COMPLETED', date: '2026-05-15', note: 'Vitals normal • IFA Red tablets issued • TT-1 administered' },
    { title: t('visit2'), status: 'COMPLETED', date: '2026-08-05', note: 'Weight: 54kg, BP: 110/70 • Hb: 11.8 g/dL • Normal fetal heart rate' },
    { title: t('visit3'), status: 'UPCOMING', date: '2026-09-02', note: 'Scheduled at BHC Haveli • Obstetric Ultrasound' },
    { title: t('nextFollowup'), status: 'PENDING', date: '2026-11-10', note: 'Institutional Delivery Plan & Emergency Helpline verification' }
  ];

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      {/* Banner */}
      <div
        className="gov-card"
        style={{
          backgroundColor: '#0F2C59',
          color: '#ffffff',
          marginBottom: '1.5rem',
          backgroundImage: 'linear-gradient(135deg, #0F2C59 0%, #1E40AF 100%)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ color: '#F59E0B', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>
              {t('maternalChildHeader')}
            </div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0.25rem 0' }}>
              {t('ancTrackerTitle')}
            </h1>
            <p style={{ color: '#CBD5E1', margin: 0, fontSize: '0.875rem' }}>
              {t('patient')}: <strong>{maternalPatient.name}</strong> ({maternalPatient.patient_id}) • ASHA: {maternalPatient.assigned_asha || 'Sunita Shinde'}
            </p>
          </div>
          <StatusBadge status={maternalPatient.risk_category || 'NORMAL'} customLabel={t('normal_risk')} />
        </div>
      </div>

      {/* Maternal KPI Overview Grid */}
      <div className="grid-stats" style={{ marginBottom: '1.5rem' }}>
        <div className="stat-card">
          <div>
            <div className="stat-value" style={{ color: '#059669' }}>2nd Trimester</div>
            <div className="stat-label">{t('currentTrimester')} ({maternalPatient.gestational_age_weeks || 24} Wks)</div>
          </div>
          <Baby style={{ color: '#059669' }} />
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-value" style={{ color: '#1E40AF' }}>{maternalPatient.edd_date || '17 Dec 2026'}</div>
            <div className="stat-label">{t('edd')}</div>
          </div>
          <CalendarCheck style={{ color: '#1E40AF' }} />
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-value" style={{ color: '#D97706' }}>2 of 4</div>
            <div className="stat-label">{t('ancVisitsCompleted')}</div>
          </div>
          <CheckCircle2 style={{ color: '#D97706' }} />
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-value" style={{ color: '#6B21A8' }}>02 Sep 2026</div>
            <div className="stat-label">{t('nextScheduledAnc')}</div>
          </div>
          <Clock style={{ color: '#6B21A8' }} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
        {/* Vitals & Risk Indicators Panel */}
        <div className="gov-card">
          <div className="gov-card-header">
            <div className="gov-card-title">
              <Activity size={18} />
              <span>{t('basicVitalsAndRisk')}</span>
            </div>
            <StatusBadge status="AVAILABLE" customLabel={t('stable')} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', fontSize: '0.875rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid #E2E8F0' }}>
              <span style={{ color: '#64748B' }}>{t('bloodPressure')}:</span>
              <strong>{maternalPatient.vitals?.bp || '110/70 mmHg'}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid #E2E8F0' }}>
              <span style={{ color: '#64748B' }}>{t('maternalWeight')}:</span>
              <strong>{maternalPatient.vitals?.weight || '54 kg'}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid #E2E8F0' }}>
              <span style={{ color: '#64748B' }}>{t('hemoglobinLevel')}:</span>
              <strong style={{ color: '#059669' }}>{maternalPatient.vitals?.hemoglobin || '11.8 g/dL'}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid #E2E8F0' }}>
              <span style={{ color: '#64748B' }}>{t('bloodGlucose')}:</span>
              <strong>{maternalPatient.vitals?.blood_sugar || '92 mg/dL'}</strong>
            </div>
            <div style={{ padding: '0.75rem', backgroundColor: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: '8px' }}>
              <div style={{ fontWeight: 700, color: '#065F46', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                <ShieldCheck size={16} /> {t('riskIndicatorsSummary')}
              </div>
              <div style={{ fontSize: '0.8125rem', color: '#047857', marginTop: '0.25rem' }}>
                {t('noHighRiskFactors')}
              </div>
            </div>
          </div>
        </div>

        {/* ANC Care Journey Timeline */}
        <div className="gov-card">
          <div className="gov-card-header">
            <div className="gov-card-title">
              <CalendarCheck size={18} />
              <span>{t('ancCareTimeline')}</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            {timelineSteps.map((step, index) => {
              const isCompleted = step.status === 'COMPLETED';
              const isUpcoming = step.status === 'UPCOMING';
              return (
                <div
                  key={index}
                  style={{
                    padding: '0.75rem 1rem',
                    borderRadius: '8px',
                    backgroundColor: isCompleted ? '#F0FDF4' : isUpcoming ? '#EFF6FF' : '#F8FAFC',
                    border: `1px solid ${isCompleted ? '#BBF7D0' : isUpcoming ? '#BFDBFE' : '#E2E8F0'}`,
                    borderLeft: `5px solid ${isCompleted ? '#059669' : isUpcoming ? '#1E40AF' : '#94A3B8'}`
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ fontSize: '0.9375rem', color: isCompleted ? '#065F46' : isUpcoming ? '#1E3A8A' : '#475569' }}>
                      {index + 1}. {step.title}
                    </strong>
                    <StatusBadge status={step.status} />
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.25rem' }}>
                    {t('date')}: <strong>{step.date}</strong>
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: '#334155', marginTop: '0.25rem' }}>
                    {step.note}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
