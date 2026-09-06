import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useOffline } from '../../context/OfflineContext';
import { StatusBadge } from '../../components/common/StatusBadge';
import { api } from '../../services/api';
import { calculateAge } from '../../utils/dateUtils';
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
  Lock,
  Stethoscope
} from 'lucide-react';

export const PatientProfilePage = () => {
  const { user } = useAuth();
  const { t, translateGender } = useLanguage();
  const { isOnline } = useOffline();

  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    api.patientDashboard().then((res) => {
      if (!mounted) return;
      setDashboardData(res);
      setLoading(false);
    }).catch((err) => {
      console.error('Failed to load patient dashboard data in profile:', err);
      if (mounted) setLoading(false);
    });
    return () => { mounted = false; };
  }, [user]);

  const patient = dashboardData?.patient || {
    patient_id: user?.patient_id || user?.user_id || 'PAT-NEW',
    name: user?.name || t('registeredCitizen'),
    dob: user?.dob || null,
    age: user?.age || null,
    gender: user?.gender || 'Other',
    village: user?.village || t('general'),
    district: user?.district || 'Pune',
    phone: user?.phone || '',
    emergency_contact: t('notProvided'),
    vitals: { bp: 'Normal', pulse: 72, temp: '98.6 °F', spo2: '98%', weight: 'N/A' },
    medical_info: {
      allergies: t('noAllergies'),
      existing_conditions: t('none'),
      blood_group: user?.blood_group || null
    }
  };

  const patientAppointments = dashboardData?.appointments || [];
  const patientReferrals = dashboardData?.referrals || [];
  const recentVisits = dashboardData?.encounters || [];

  const bloodGroup = patient.blood_group || patient.medical_info?.blood_group || user?.blood_group || t('notRecorded');
  const allergies = patient.medical_info?.allergies || patient.allergies || t('noAllergies');
  const existingConditions = patient.medical_info?.existing_conditions || patient.conditions || t('none');

  const effectiveAge = calculateAge(patient.dob || user?.dob, patient.age || user?.age);

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
              {t('abhaConnected')}
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
            <div style={{ fontSize: '1rem', fontWeight: 700, color: '#334155' }}>
              {effectiveAge !== null ? `${effectiveAge} ${t('yearsShort')}` : '—'} • {translateGender(patient.gender || user?.gender || 'Other')}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>{t('bloodGroup')}</div>
            <div style={{ fontSize: '1rem', fontWeight: 800, color: '#DC2626' }}>{bloodGroup}</div>
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
              <strong>{patient.phone || t('notProvided')}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid #E2E8F0' }}>
              <span style={{ color: '#64748B' }}><Phone size={14} style={{ display: 'inline', marginRight: '6px', color: '#DC2626' }} /> {t('emergencyContactPerson')}:</span>
              <strong style={{ color: '#991B1B' }}>{patient.emergency_contact || t('notProvided')}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid #E2E8F0' }}>
              <span style={{ color: '#64748B' }}><MapPin size={14} style={{ display: 'inline', marginRight: '6px' }} /> {t('villageTaluka')}:</span>
              <strong>{patient.village}, {patient.district}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748B' }}>{t('primaryFacility')}:</span>
              <strong>{patient.registered_facility_name || user?.facility_name || t('primaryHealthCentre')} ({patient.registered_facility_id || user?.facility_id || 'FAC-101'})</strong>
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
                {Array.isArray(allergies) ? (allergies.length ? allergies.join(', ') : t('noAllergies')) : allergies}
              </div>
            </div>

            <div style={{ padding: '0.75rem', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px' }}>
              <div style={{ fontWeight: 700, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                <Heart size={16} style={{ color: '#1E40AF' }} /> {t('preExistingConditions')}
              </div>
              <div style={{ fontSize: '0.8125rem', color: '#475569', marginTop: '0.25rem' }}>
                {Array.isArray(existingConditions) ? (existingConditions.length ? existingConditions.join(', ') : t('noRecord')) : existingConditions}
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
                    <span style={{ fontWeight: 700, color: '#0F2C59', fontSize: '0.875rem' }}>{ref.referral_id} • {ref.specialty_required || ref.specialty}</span>
                    <StatusBadge status={ref.status} />
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: '#475569' }}>
                    {t('from')}: <strong>{ref.referring_facility_name || ref.source_facility_id || t('primaryHealthCentre')}</strong> → {t('to')}: <strong>{ref.accepted_facility_name || ref.target_facility_name || t('districtHospital')}</strong>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.25rem' }}>
                    {t('reason')}: {ref.clinical_notes || ref.reason || t('notAvailable')}
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
                    <span style={{ fontWeight: 700, color: '#0F2C59', fontSize: '0.875rem' }}>{apt.doctor_name || apt.doctor_id || t('attendingDoctor')}</span>
                    <StatusBadge status={apt.status} />
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: '#475569' }}>
                    {apt.facility_name || apt.facility_id} • {t('token')}: <strong>{apt.token_number || '#1'}</strong>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#1E40AF', fontWeight: 600, marginTop: '0.25rem' }}>
                    {t('date')}: {apt.date} {t('at')} {apt.time}
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

      {/* Section 4: Recent Encounters History */}
      <div className="gov-card" style={{ marginTop: '1.5rem' }}>
        <div className="gov-card-header">
          <div className="gov-card-title">
            <Stethoscope size={18} />
            <span>{t('recentEncounters')}</span>
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          {recentVisits.length > 0 ? (
            <table className="gov-table">
              <thead>
                <tr>
                  <th>{t('date')}</th>
                  <th>{t('facility')}</th>
                  <th>{t('doctors')}</th>
                  <th>{t('typeLabel')}</th>
                  <th>{t('encounterPurpose')}</th>
                  <th>{t('outcome')}</th>
                </tr>
              </thead>
              <tbody>
                {recentVisits.map((visit, idx) => (
                  <tr key={visit.id || idx}>
                    <td><strong>{visit.date}</strong></td>
                    <td>{visit.facility}</td>
                    <td>{visit.doctor}</td>
                    <td><span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', backgroundColor: '#EFF6FF', color: '#1E40AF' }}>{visit.type}</span></td>
                    <td>{visit.reason}</td>
                    <td><StatusBadge status={visit.status || 'COMPLETED'} customLabel={visit.outcome} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ padding: '1.5rem', textAlign: 'center', color: '#64748B', fontStyle: 'italic', fontSize: '0.875rem' }}>
              {t('noRecentEncountersOnRecord')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
