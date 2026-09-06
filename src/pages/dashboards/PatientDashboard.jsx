import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { StatusBadge } from '../../components/common/StatusBadge';
import { api } from '../../services/api';
import { Calendar, GitPullRequest, FileText, MapPin, Clock, Stethoscope, Droplet, CheckCircle2 } from 'lucide-react';

export const PatientDashboard = () => {
  const { user } = useAuth();
  const { t, translateSpecialty, translateFacilityType } = useLanguage();

  const [dashboardData, setDashboardData] = useState(null);
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchPatientData = async () => {
      try {
        setLoading(true);
        const [dashRes, facRes] = await Promise.allSettled([
          api.patientDashboard(),
          api.facilities()
        ]);
        if (!isMounted) return;

        if (dashRes.status === 'fulfilled') setDashboardData(dashRes.value);
        if (facRes.status === 'fulfilled') setFacilities(facRes.value.facilities || []);
      } catch (err) {
        console.error('Error fetching patient dashboard data:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchPatientData();
    return () => { isMounted = false; };
  }, [user]);

  const patient = dashboardData?.patient || {};
  const appointments = dashboardData?.appointments || [];
  const referrals = dashboardData?.referrals || [];
  const prescriptions = dashboardData?.prescriptions || [];
  const followups = dashboardData?.followups || [];
  const encounters = dashboardData?.encounters || [];

  const referral = referrals[0];
  const appointment = appointments[0];
  const prescription = prescriptions[0];
  const followup = followups[0];

  const bloodGroup = patient.blood_group || patient.medical_info?.blood_group || user?.blood_group || t('notRecorded');

  return (
    <div>
      {/* Welcome Banner */}
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
            <div style={{ fontSize: '0.8125rem', color: '#F59E0B', fontWeight: '700', textTransform: 'uppercase' }}>
              {t('citizenHealthcarePortal')}
            </div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: '800', marginTop: '0.25rem' }}>
              {t('greeting_good_morning')}, {patient.name || user?.name || t('valuedCitizen')}
            </h1>
            <p style={{ fontSize: '0.875rem', color: '#CBD5E1', marginTop: '0.25rem' }}>
              {t('identifier')}: <strong>{patient.patient_id || user?.patient_id || user?.user_id || 'PAT-NEW'}</strong> • {t('village')}: {patient.village || user?.village || t('general')}, {patient.district || user?.district || 'Pune'} • {t('bloodGroup')}: <strong style={{ color: '#FCA5A5' }}>{bloodGroup}</strong>
            </p>
          </div>
        </div>
      </div>

      {/* Grid Stats Overview */}
      <div className="grid-stats">
        <div className="stat-card">
          <div>
            <div className="stat-value">{appointments.length}</div>
            <div className="stat-label">{t('appointments')}</div>
          </div>
          <Calendar style={{ color: '#1E40AF' }} />
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-value">{referrals.length}</div>
            <div className="stat-label">{t('referralStatus')}</div>
          </div>
          <GitPullRequest style={{ color: '#D97706' }} />
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-value">{prescriptions.length}</div>
            <div className="stat-label">{t('prescriptions')}</div>
          </div>
          <FileText style={{ color: '#059669' }} />
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-value">{followups.length}</div>
            <div className="stat-label">{t('followups')}</div>
          </div>
          <Clock style={{ color: '#6B21A8' }} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
        {/* Active Referral Status Card */}
        <div className="gov-card">
          <div className="gov-card-header">
            <div className="gov-card-title">
              <GitPullRequest size={20} />
              <span>{t('activeReferralStatus')}</span>
            </div>
            {referral ? <StatusBadge status={referral.status} /> : <span style={{ fontSize: '0.75rem', color: '#64748B' }}>{t('none')}</span>}
          </div>

          <div style={{ fontSize: '0.875rem' }}>
            {referral ? (
              <>
                <div style={{ marginBottom: '0.75rem', padding: '0.75rem', backgroundColor: '#ECFDF5', borderRadius: '8px', border: '1px solid #A7F3D0' }}>
                  <div style={{ fontWeight: '700', color: '#065F46' }}>
                    {t('targetHospital')}: {referral.accepted_facility_name || referral.accepted_hospital || referral.target_hospitals?.[0]?.facility || t('pendingMatch')}
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: '#047857', marginTop: '0.25rem' }}>
                    {t('specialtyLabel')}: {translateSpecialty(referral.specialty_required || referral.specialty)}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', color: '#475569' }}>
                  <div><strong>{t('from')} ({t('referringFacility')}):</strong> {referral.referring_facility_name || referral.source_facility_id || t('primaryHealthCentre')}</div>
                  <div><strong>{t('to')} ({t('destinationFacility')}):</strong> {referral.accepted_facility_name || referral.target_facility_name || referral.target_hospitals?.[0]?.facility || t('districtHospital')}</div>
                  <div><strong>{t('doctor')}:</strong> {referral.accepted_doctor_name || referral.destination_doctor_id || t('facilityLevelReferralDoctorNotAssigned')}</div>
                  <div><strong>{t('healthWorkerNotes')}:</strong> {referral.clinical_notes || referral.reason || t('notAvailable')}</div>
                  <div><strong>{t('referralPriority')}:</strong> <StatusBadge status={referral.priority || 'NORMAL'} /></div>
                </div>
              </>
            ) : (
              <div style={{ padding: '1rem 0', color: '#64748B', fontStyle: 'italic', textAlign: 'center' }}>
                {t('noActiveReferralsOnRecord')}
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Appointment Card */}
        <div className="gov-card">
          <div className="gov-card-header">
            <div className="gov-card-title">
              <Calendar size={20} />
              <span>{t('upcomingAppointment')}</span>
            </div>
            {appointment ? <StatusBadge status={appointment.status} /> : <span style={{ fontSize: '0.75rem', color: '#64748B' }}>{t('none')}</span>}
          </div>

          <div style={{ fontSize: '0.875rem' }}>
            {appointment ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <div>
                    <div style={{ fontSize: '1.125rem', fontWeight: '700', color: '#0F2C59' }}>{appointment.doctor_name || appointment.doctor_id || t('attendingDoctor')}</div>
                    <div style={{ color: '#64748B' }}>{appointment.facility_name || appointment.facility_id || t('primaryHealthCentre')}</div>
                  </div>
                  <div style={{ backgroundColor: '#EFF6FF', color: '#1E40AF', padding: '0.5rem 0.875rem', borderRadius: '8px', fontWeight: '800', textAlign: 'center' }}>
                    {t('token')}<br/>{appointment.token_number || '#1'}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', color: '#334155', fontSize: '0.8125rem', backgroundColor: '#F8FAFC', padding: '0.625rem', borderRadius: '6px' }}>
                  <div><strong>{t('date')}:</strong> {appointment.date || t('scheduled')}</div>
                  <div><strong>{t('time')}:</strong> {appointment.time || '10:00 AM'}</div>
                  <div><strong>{t('typeLabel')}:</strong> {appointment.type || 'OPD'}</div>
                </div>
              </>
            ) : (
              <div style={{ padding: '1rem 0', color: '#64748B', fontStyle: 'italic', textAlign: 'center' }}>
                {t('noUpcomingAppointmentsScheduled')}
              </div>
            )}
          </div>
        </div>

        {/* Digital Prescription Summary */}
        <div className="gov-card">
          <div className="gov-card-header">
            <div className="gov-card-title">
              <FileText size={20} />
              <span>{t('currentPrescriptions')}</span>
            </div>
            {prescription && <span style={{ fontSize: '0.75rem', color: '#64748B' }}>{prescription.doctor_name || prescription.doctor_id || t('attendingPhysician')}</span>}
          </div>

          <div style={{ fontSize: '0.875rem' }}>
            {prescription ? (
              Array.isArray(prescription.items) && prescription.items.length > 0 ? (
                prescription.items.map((item, idx) => (
                  <div key={idx} style={{ padding: '0.625rem 0', borderBottom: idx < prescription.items.length - 1 ? '1px solid #E2E8F0' : 'none' }}>
                    <div style={{ fontWeight: '700', color: '#0F172A' }}>{item.medicine_name || item.name}</div>
                    <div style={{ fontSize: '0.8125rem', color: '#475569' }}>
                      {item.dosage} • {item.frequency} • {item.duration}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748B', fontStyle: 'italic' }}>{item.instructions}</div>
                  </div>
                ))
              ) : (
                <div style={{ padding: '0.5rem 0' }}>
                  <div style={{ fontWeight: '700', color: '#0F172A' }}>{prescription.medicine || t('prescriptionRecorded')}</div>
                  <div style={{ fontSize: '0.8125rem', color: '#475569' }}>{prescription.dosage} • {prescription.duration}</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748B', fontStyle: 'italic' }}>{prescription.instructions}</div>
                </div>
              )
            ) : (
              <div style={{ padding: '1rem 0', color: '#64748B', fontStyle: 'italic', textAlign: 'center' }}>
                {t('noActivePrescriptionsFound')}
              </div>
            )}
          </div>
        </div>

        {/* Follow-Up Care Card */}
        <div className="gov-card">
          <div className="gov-card-header">
            <div className="gov-card-title">
              <Clock size={20} />
              <span>{t('followups')}</span>
            </div>
            {followup ? <StatusBadge status={followup.status || 'SCHEDULED'} /> : <span style={{ fontSize: '0.75rem', color: '#64748B' }}>{t('none')}</span>}
          </div>

          <div style={{ fontSize: '0.875rem' }}>
            {followup ? (
              <div style={{ padding: '0.5rem 0' }}>
                <div style={{ fontWeight: '700', color: '#0F172A' }}>
                  {t('date')}: {followup.followup_date || followup.date || t('upcoming')}
                </div>
                <div style={{ fontSize: '0.8125rem', color: '#475569', marginTop: '0.25rem' }}>
                  {t('reason')}: {followup.reason || t('routineCheckup')}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.25rem' }}>
                  {t('typeLabel')}: {followup.type || followup.category || t('general')}
                </div>
              </div>
            ) : (
              <div style={{ padding: '1rem 0', color: '#64748B', fontStyle: 'italic', textAlign: 'center' }}>
                {t('noFollowupScheduled')}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Healthcare Encounters Table */}
      <div className="gov-card" style={{ marginTop: '1.5rem' }}>
        <div className="gov-card-header">
          <div className="gov-card-title">
            <Stethoscope size={20} />
            <span>{t('recentEncounters')}</span>
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          {encounters.length > 0 ? (
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
                {encounters.map((visit, idx) => (
                  <tr key={visit.id || idx}>
                    <td><strong>{visit.date}</strong></td>
                    <td>{visit.facility}</td>
                    <td>{visit.doctor}</td>
                    <td><span style={{ fontSize: '0.75rem', fontWeight: '700', padding: '2px 8px', borderRadius: '4px', backgroundColor: '#EFF6FF', color: '#1E40AF' }}>{visit.type}</span></td>
                    <td>{visit.reason}</td>
                    <td><StatusBadge status={visit.status || 'COMPLETED'} customLabel={visit.outcome} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ padding: '1.5rem', textAlign: 'center', color: '#64748B', fontStyle: 'italic' }}>
              {t('noRecentEncountersOnRecord')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
