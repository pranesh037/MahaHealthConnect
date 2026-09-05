import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { usePatients } from '../../context/PatientContext';
import { useOffline } from '../../context/OfflineContext';
import { StatusBadge } from '../../components/common/StatusBadge';
import { MOCK_APPOINTMENTS, MOCK_REFERRALS } from '../../mockData';
import {
  UserCheck,
  ShieldCheck,
  Phone,
  AlertTriangle,
  Calendar,
  GitPullRequest,
  Clock,
  MapPin,
  Heart,
  Lock
} from 'lucide-react';

export const PatientProfilePage = () => {
  const { user } = useAuth();
  const { t, translateGender } = useLanguage();
  const { patients } = usePatients();
  const { isOnline } = useOffline();

  const patient = patients.find((p) => p.patient_id === user?.patient_id) || {
    patient_id: user?.patient_id || user?.user_id || 'PAT-NEW',
    name: user?.name || 'Registered Citizen',
    age: user?.dob ? new Date().getFullYear() - new Date(user.dob).getFullYear() : 30,
    gender: user?.gender || 'Other',
    village: user?.village || 'General',
    district: user?.district || 'Pune',
    phone: user?.phone || '',
    emergency_contact: 'Not provided',
    vitals: { bp: 'Normal', pulse: 72, temp: '98.6 °F', spo2: '98%', weight: 'N/A' },
    medical_info: {
      allergies: 'None reported',
      existing_conditions: 'None',
      blood_group: user?.blood_group || 'O+'
    }
  };

  const patientAppointments = MOCK_APPOINTMENTS.filter((a) => a.patient_id === patient.patient_id);
  const patientReferrals = MOCK_REFERRALS.filter((r) => r.patient_id === patient.patient_id);

  const recentVisits = [
    { date: '2026-08-25', facility: 'PHC Mulshi', doctor: 'Sunita Shinde (ANM)', reason: 'Hypertension Follow-up & Vitals check', outcome: 'Referral requested' },
    { date: '2026-07-12', facility: 'PHC Mulshi', doctor: 'Dr. Kulkarni', reason: 'Routine Health Checkup', outcome: 'Meds prescribed' },
    { date: '2026-05-04', facility: 'District Hospital Aundh', doctor: 'Dr. Aniket Deshmukh', reason: 'Cardiology OPD Screening', outcome: 'Stable' }
  ];

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      {/* Page Header */}
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
              {t('citizenHealthcarePortal')}
            </div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0.25rem 0' }}>
              {patient.name}
            </h1>
            <p style={{ color: '#CBD5E1', margin: 0, fontSize: '0.875rem' }}>
              {t('patientId')}: <strong>{patient.patient_id}</strong> • {t('village')}: {patient.village}, {patient.district}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <StatusBadge status={isOnline ? 'ONLINE' : 'OFFLINE'} />
            <div
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                padding: '0.5rem 0.875rem',
                borderRadius: '6px',
                border: '1px solid rgba(255,255,255,0.2)',
                fontSize: '0.8125rem'
              }}
            >
              <Lock size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
              ABHA Connected
            </div>
          </div>
        </div>
      </div>

      {/* Patient Profile Card Overview */}
      <div className="gov-card" style={{ marginBottom: '1.5rem', borderLeft: '5px solid #1E40AF' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>{t('patientId')}</div>
            <div style={{ fontSize: '1.125rem', fontWeight: 800, color: '#0F2C59', fontFamily: 'monospace' }}>{patient.patient_id}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>{t('name')}</div>
            <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0F172A' }}>{patient.name}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>{t('ageGender')}</div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: '#334155' }}>{patient.age} {t('yearsShort')} • {translateGender(patient.gender)}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>{t('bloodGroup')}</div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: '#DC2626' }}>{patient.medical_info?.blood_group || 'O+'}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>{t('location')}</div>
            <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#334155' }}>{patient.village}, {patient.district}</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
        {/* Section 1: Basic & Contact Information */}
        <div className="gov-card">
          <div className="gov-card-header">
            <div className="gov-card-title">
              <UserCheck size={18} />
              <span>{t('basicInfoAndContacts')}</span>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', fontSize: '0.875rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid #E2E8F0' }}>
              <span style={{ color: '#64748B' }}><Phone size={14} style={{ display: 'inline', marginRight: '6px' }} /> {t('contactPhone')}:</span>
              <strong>{patient.phone || '+91 98220 12345'}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid #E2E8F0' }}>
              <span style={{ color: '#64748B' }}><Phone size={14} style={{ display: 'inline', marginRight: '6px', color: '#DC2626' }} /> {t('emergencyContactPerson')}:</span>
              <strong style={{ color: '#991B1B' }}>{patient.emergency_contact || 'Sunita Patil (Wife) - +91 98220 54321'}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid #E2E8F0' }}>
              <span style={{ color: '#64748B' }}><MapPin size={14} style={{ display: 'inline', marginRight: '6px' }} /> {t('villageTaluka')}:</span>
              <strong>{patient.village}, Mulshi Taluka</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748B' }}>{t('primaryFacility')}:</span>
              <strong>PHC Mulshi (FAC-101)</strong>
            </div>
          </div>
        </div>

        {/* Section 2: Clinical Summary & Allergies */}
        <div className="gov-card">
          <div className="gov-card-header">
            <div className="gov-card-title">
              <ShieldCheck size={18} />
              <span>{t('allergiesAndHistory')}</span>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', fontSize: '0.875rem' }}>
            <div style={{ padding: '0.75rem', backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '8px' }}>
              <div style={{ fontWeight: 700, color: '#991B1B', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                <AlertTriangle size={16} /> {t('knownAllergies')}
              </div>
              <div style={{ fontSize: '0.8125rem', color: '#7F1D1D', marginTop: '0.25rem' }}>
                {patient.medical_info?.allergies || t('noAllergies')}
              </div>
            </div>

            <div style={{ padding: '0.75rem', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px' }}>
              <div style={{ fontWeight: 700, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                <Heart size={16} style={{ color: '#1E40AF' }} /> {t('preExistingConditions')}
              </div>
              <div style={{ fontSize: '0.8125rem', color: '#475569', marginTop: '0.25rem' }}>
                {patient.medical_info?.existing_conditions || t('noRecord')}
              </div>
            </div>

            <div style={{ fontSize: '0.75rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <Lock size={12} /> {t('rbacNotice')}
            </div>
          </div>
        </div>
      </div>

      {/* Section 3: Active Referrals & Upcoming Appointments */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem', marginTop: '1.5rem' }}>
        <div className="gov-card">
          <div className="gov-card-header">
            <div className="gov-card-title">
              <GitPullRequest size={18} />
              <span>{t('currentReferrals')}</span>
            </div>
          </div>
          {patientReferrals.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {patientReferrals.map((ref) => (
                <div key={ref.referral_id} style={{ padding: '0.75rem', border: '1px solid #E2E8F0', borderRadius: '8px', backgroundColor: '#F8FAFC' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
                    <span style={{ fontWeight: 700, color: '#0F2C59', fontSize: '0.875rem' }}>{ref.referral_id} • {ref.specialty_required}</span>
                    <StatusBadge status={ref.status} />
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: '#475569' }}>
                    {t('targetHospital')}: <strong>{ref.accepted_hospital || 'District Hospital Aundh'}</strong>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.25rem' }}>
                    {t('reason')}: {ref.clinical_notes}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '1.5rem', textAlign: 'center', color: '#64748B', fontSize: '0.875rem' }}>
              {t('noRecordsAvailable')}
            </div>
          )}
        </div>

        <div className="gov-card">
          <div className="gov-card-header">
            <div className="gov-card-title">
              <Calendar size={18} />
              <span>{t('upcomingAppointments')}</span>
            </div>
          </div>
          {patientAppointments.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {patientAppointments.map((apt) => (
                <div key={apt.appointment_id} style={{ padding: '0.75rem', border: '1px solid #E2E8F0', borderRadius: '8px', backgroundColor: '#F8FAFC' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
                    <span style={{ fontWeight: 700, color: '#0F2C59', fontSize: '0.875rem' }}>{apt.doctor_name}</span>
                    <StatusBadge status={apt.status} />
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: '#475569' }}>
                    {apt.facility_name} • {t('token')}: <strong>{apt.token_number || 'C-14'}</strong>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#1E40AF', fontWeight: 600, marginTop: '0.25rem' }}>
                    {t('date')}: {apt.date} at {apt.time}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '1.5rem', textAlign: 'center', color: '#64748B', fontSize: '0.875rem' }}>
              {t('noUpcoming')}
            </div>
          )}
        </div>
      </div>

      {/* Section 4: Recent Visits History */}
      <div className="gov-card" style={{ marginTop: '1.5rem' }}>
        <div className="gov-card-header">
          <div className="gov-card-title">
            <Clock size={18} />
            <span>{t('recentEncounters')}</span>
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="gov-table">
            <thead>
              <tr>
                <th>{t('date')}</th>
                <th>{t('facility')}</th>
                <th>{t('doctors')}</th>
                <th>{t('encounterPurpose')}</th>
                <th>{t('outcome')}</th>
              </tr>
            </thead>
            <tbody>
              {recentVisits.map((visit, idx) => (
                <tr key={idx}>
                  <td><strong>{visit.date}</strong></td>
                  <td>{visit.facility}</td>
                  <td>{visit.doctor}</td>
                  <td>{visit.reason}</td>
                  <td><StatusBadge status="COMPLETED" customLabel={visit.outcome} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
