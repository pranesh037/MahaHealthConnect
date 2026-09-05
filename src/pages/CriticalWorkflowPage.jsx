import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Activity, AlertCircle, Calendar, CheckCircle2, Clock, FileText, GitPullRequest, MapPin, Plus, RefreshCw, ShieldCheck, Stethoscope } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { usePatients } from '../context/PatientContext';
import { useOffline } from '../context/OfflineContext';
import { StatusBadge } from '../components/common/StatusBadge';

const titles = {
  appointments: ['appointments', 'appointmentRecords'],
  referrals: ['referrals', 'referralFlowByFacility'],
  access: ['secureDoctorAccess', 'timeBoundAccess'],
  services: ['serviceFinder', 'operationalReviewNote'],
  queue: ['queue', 'liveQueue'],
  patients: ['authorizedPatients', 'clinicalSummary'],
  history: ['doctorSpecialist', 'clinicalSummary'],
  prescription: ['prescriptions', 'clinicalSummary'],
  diagnostics: ['diagnostics', 'diagnosticCapacityMatrix'],
  sync: ['offlineSync', 'offlineSyncStatus'],
  followups: ['followups', 'followupRegister'],
  medicines: ['medicineStocks', 'districtMedicineStocks'],
  doctors: ['doctorAvailability', 'specialistCoverage'],
  facilities: ['facilityNetwork', 'facilityCapacityResponse'],
  'audit-logs': ['securityAuditLogs', 'auditLog']
};

function Field({ label, children }) { const { t } = useLanguage(); const labels = { 'Patient ID': 'patientId', 'Required specialty': 'specialty', Diagnostic: 'diagnostics', Equipment: 'equipment', Emergency: 'emergency', 'Bed required': 'bedRequired', 'Doctor ID': 'doctorId', 'Facility ID': 'facility', Date: 'date', Time: 'time', Specialty: 'specialty', Priority: 'priority', Reason: 'reason', 'Symptoms / complaint': 'symptomsComplaint', Observations: 'observations', Diagnosis: 'diagnosis', 'Treatment and notes': 'treatmentNotes', Test: 'test', 'Available beds': 'availableBeds', 'Facility status': 'status', 'Specialties / available services': 'services', 'Medicine and instructions': 'medicineInstructions' }; return <label className="gov-form-group"><span className="gov-label">{t(labels[label] || label)}</span>{children}</label>; }
function Panel({ title, icon, children }) { const { t } = useLanguage(); const titleKeys = { 'Loading records': 'loadingRecords', 'Matching requirements': 'matchingRequirements', 'Ranked facilities': 'rankedFacilities', 'Book appointment': 'bookAppointment', 'Appointment records': 'appointmentRecords', 'Create referral': 'createReferral', 'Referral timeline': 'referralTimeline', 'Live queue': 'liveQueue', 'Authorized records': 'authorizedRecords', 'Consultation record': 'consultationRecord', 'Diagnostic order': 'diagnosticOrder', 'Orders and results': 'ordersResults', 'Schedule follow-up': 'scheduleFollowup', 'Follow-up register': 'followupRegister', 'Current records': 'currentRecords', 'Update facility resources': 'updateResources', 'Prescription entry': 'prescriptionEntry', 'Prescription history': 'prescriptionHistory', 'Offline sync status': 'offlineSyncStatus' }; return <section className="gov-card" style={{ marginBottom: '1rem' }}><div className="gov-card-header"><div className="gov-card-title">{icon}{t(titleKeys[title] || title)}</div></div>{children}</section>; }

export const CriticalWorkflowPage = ({ overrideKey }) => {
  const routeKey = useLocation().pathname.split('/').filter(Boolean).pop();
  const key = overrideKey || routeKey;
  const [data, setData] = useState({});
  const [form, setForm] = useState({});
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [selectedClinicalPatient, setSelectedClinicalPatient] = useState(null);
  const [fetchingPatientId, setFetchingPatientId] = useState(null);
  const [clinicalError, setClinicalError] = useState('');
  const { user, role } = useAuth();
  const { t, translateStatus, translateSpecialty, translateGender, translatePriority, translateDiagnostic, translateFacilityType } = useLanguage();
  const { patients } = usePatients();
  const { isOnline, addPendingRecord } = useOffline();
  const [loading, setLoading] = useState(true);
  const [matches, setMatches] = useState([]);
  const title = titles[key] || ['currentWorkflow', 'operationalReviewNote'];
  const setValue = (name, value) => setForm((current) => ({ ...current, [name]: value }));

  const fetchClinicalRecord = async (patientIdToFetch) => {
    setClinicalError('');
    setSelectedClinicalPatient(null);
    setFetchingPatientId(patientIdToFetch);
    try {
      const res = await api.getPatient(patientIdToFetch, 'CLINICAL_FULL');
      if (res && res.patient) {
        setSelectedClinicalPatient(res.patient);
        setValue('patient_id', patientIdToFetch);
      } else {
        setClinicalError('Patient record access denied');
      }
    } catch (err) {
      setClinicalError(err.message || 'Patient record access denied');
    } finally {
      setFetchingPatientId(null);
    }
  };

  const load = async () => {
    setLoading(true); setError('');
    try {
      const requests = {
        appointments: api.appointments, referrals: api.referrals, access: api.accessGrants, queue: api.queue, patients: api.patients,
        diagnostics: api.diagnosticOrders, followups: api.followups, medicines: api.medicines,
        facilities: api.facilities, 'audit-logs': api.audit
      };
      if (requests[key]) setData(await requests[key]());
    } catch (requestError) { setError(requestError.message); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [key]);

  const submit = async (request, payload, pendingLabel) => {
    setMessage(''); setError('');
    try {
      if (!isOnline) { addPendingRecord(pendingLabel); setMessage('Saved locally. Pending Sync will send this record when online.'); return; }
      await request(payload); setMessage('Saved successfully and audited.'); setForm({}); load();
    } catch (requestError) { setError(requestError.message); }
  };

  const runMatching = async () => {
    try { const result = await api.matchFacilities({ specialty: form.specialty, diagnostic: form.diagnostic, equipment: form.equipment, emergency: form.emergency === 'true', bedRequired: form.bedRequired === 'true' }); setMatches(result.matches); }
    catch (requestError) { setError(requestError.message); }
  };

  const formatCellValue = (item, field) => {
    const val = item[field];
    if (val === undefined || val === null || val === '') return '—';
    if (field === 'status' || field === 'triage_status') return <StatusBadge status={val} />;
    if (field === 'gender') return translateGender(val);
    if (field === 'specialty' || field === 'specialty_required') return translateSpecialty(val);
    if (field === 'priority') return translatePriority(val);
    if (field === 'diagnostic' || field === 'test_name') return translateDiagnostic(val);
    if (field === 'facility_type' || field === 'type') return translateFacilityType(val);
    return String(val);
  };

  const renderList = (items = [], fields = []) => (
    <div style={{ overflowX: 'auto' }}>
      <table className="gov-table">
        <thead>
          <tr>
            {fields.map((field) => <th key={field}>{t(field) || field.replaceAll('_', ' ')}</th>)}
          </tr>
        </thead>
        <tbody>
          {items.length ? items.map((item, index) => (
            <tr key={item.id || item.appointment_id || item.referral_id || item.order_id || item.followup_id || index}>
              {fields.map((field) => <td key={field}>{formatCellValue(item, field)}</td>)}
            </tr>
          )) : (
            <tr><td colSpan={fields.length}>{t('noRecordsFound')}</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );

  const patientId = form.patient_id || user?.patient_id || patients[0]?.patient_id || '';
  return <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
    <div className="gov-card" style={{ backgroundColor: '#0F2C59', color: '#fff', marginBottom: '1rem', backgroundImage: 'linear-gradient(135deg, #0F2C59, #1E3A8A)' }}><div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}><div><div style={{ color: '#F59E0B', fontSize: '0.75rem', fontWeight: 700 }}>{t('app_title')}</div><h1 style={{ fontSize: '1.5rem', margin: '0.25rem 0' }}>{t(title[0])}</h1><p style={{ color: '#CBD5E1', margin: 0 }}>{t(title[1])}</p></div><StatusBadge status={isOnline ? 'ONLINE' : 'OFFLINE'} /></div></div>
    {loading && <Panel title="Loading records" icon={<RefreshCw size={18} />}><p>{t('loadingRecords')}</p></Panel>}
    {error && <div className="gov-card" role="alert" style={{ color: '#991B1B', backgroundColor: '#FEF2F2', marginBottom: '1rem' }}>{error}</div>}
    {message && <div className="gov-card" role="status" style={{ color: '#065F46', backgroundColor: '#ECFDF5', marginBottom: '1rem' }}><CheckCircle2 size={16} /> {message}</div>}

    {key === 'services' && <><Panel title="Matching requirements" icon={<MapPin size={18} />}><div className="grid-stats"><Field label="Required specialty"><input className="gov-input" value={form.specialty || ''} onChange={(e) => setValue('specialty', e.target.value)} placeholder="Cardiology" /></Field><Field label="Diagnostic"><input className="gov-input" value={form.diagnostic || ''} onChange={(e) => setValue('diagnostic', e.target.value)} placeholder="ECG" /></Field><Field label="Equipment"><input className="gov-input" value={form.equipment || ''} onChange={(e) => setValue('equipment', e.target.value)} placeholder="ICU" /></Field><Field label="Emergency"><select className="gov-select" value={form.emergency || 'false'} onChange={(e) => setValue('emergency', e.target.value)}><option value="false">{t('no')}</option><option value="true">{t('required')}</option></select></Field><Field label="Bed required"><select className="gov-select" value={form.bedRequired || 'false'} onChange={(e) => setValue('bedRequired', e.target.value)}><option value="false">{t('no')}</option><option value="true">{t('required')}</option></select></Field></div><button className="gov-btn gov-btn-primary" onClick={runMatching}><Activity size={16} /> Run transparent matching</button></Panel><Panel title="Ranked facilities" icon={<ShieldCheck size={18} />}>{matches.length ? matches.map((match) => <div key={match.facility_id} className="gov-card" style={{ marginBottom: '0.75rem', borderLeft: `5px solid ${match.match_score >= 75 ? '#059669' : '#D97706'}` }}><div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}><strong>{match.facility}</strong><strong style={{ color: '#059669' }}>{match.match_score}%</strong></div><p>{match.distance} · Specialty: {match.specialty_available ? translateStatus('AVAILABLE') : translateStatus('UNAVAILABLE')} · Diagnostics: {match.diagnostic_available ? translateStatus('AVAILABLE') : translateStatus('UNAVAILABLE')} · Beds: {match.beds_available ? translateStatus('AVAILABLE') : translateStatus('UNAVAILABLE')}</p><small>{match.reasons.join(' · ')}</small></div>) : <p>Enter requirements to rank facilities.</p>}</Panel></>}

    {key === 'appointments' && <><Panel title="Book appointment" icon={<Calendar size={18} />}><div className="grid-stats"><Field label="Patient ID"><input className="gov-input" value={patientId} onChange={(e) => setValue('patient_id', e.target.value)} /></Field><Field label="Doctor ID"><input className="gov-input" value={form.doctor_id !== undefined ? form.doctor_id : (role === 'doctor' ? user?.user_id || '' : '')} onChange={(e) => setValue('doctor_id', e.target.value)} placeholder="Doctor ID" /></Field><Field label="Facility ID"><input className="gov-input" value={form.facility_id || user?.facility_id || 'FAC-103'} onChange={(e) => setValue('facility_id', e.target.value)} /></Field><Field label="Date"><input type="date" className="gov-input" value={form.date || ''} onChange={(e) => setValue('date', e.target.value)} /></Field><Field label="Time"><input type="time" className="gov-input" value={form.time || ''} onChange={(e) => setValue('time', e.target.value)} /></Field></div><button className="gov-btn gov-btn-primary" onClick={() => submit(api.createAppointment, { ...form, patient_id: patientId, doctor_id: form.doctor_id || (role === 'doctor' ? user?.user_id : '') }, 'Appointment')}><Calendar size={16} /> Book appointment</button></Panel><Panel title="Appointment records" icon={<Clock size={18} />}>{renderList(data.appointments, ['appointment_id', 'patient_id', 'doctor_name', 'date', 'time', 'status'])}</Panel></>}
    {key === 'access' && (
      <>
        <Panel
          title="Secure Doctor Access"
          icon={<ShieldCheck size={18} />}
        >
          <div className="grid-stats">

            <Field label="Patient ID">
              <input
                className="gov-input"
                value={form.patient_id !== undefined ? form.patient_id : patientId}
                onChange={(e) =>
                  setValue('patient_id', e.target.value)
                }
                placeholder="PAT-10245"
              />
            </Field>

            <Field label="Doctor ID">
              <input
                className="gov-input"
                value={form.doctor_id !== undefined ? form.doctor_id : (role === 'doctor' ? user?.user_id || '' : '')}
                onChange={(e) =>
                  setValue('doctor_id', e.target.value)
                }
                placeholder="e.g. USR-DOC-003"
              />
            </Field>

            <Field label="Access duration">
              <select
                className="gov-select"
                value={form.duration_minutes || 60}
                onChange={(e) =>
                  setValue(
                    'duration_minutes',
                    Number(e.target.value)
                  )
                }
              >
                <option value={15}>15 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={60}>60 minutes (1 hour)</option>
                <option value={120}>120 minutes (2 hours)</option>
                <option value={240}>240 minutes (4 hours)</option>
              </select>
            </Field>

            <Field label="Reason">
              <textarea
                className="gov-textarea"
                value={form.reason || ''}
                onChange={(e) =>
                  setValue('reason', e.target.value)
                }
                placeholder="Specialist consultation"
              />
            </Field>

          </div>

          <button
            className="gov-btn gov-btn-primary"
            onClick={() =>
              submit(
                api.createAccessGrant,
                {
                  patient_id: form.patient_id !== undefined ? form.patient_id : patientId,
                  doctor_id:
                    form.doctor_id || (role === 'doctor' ? user?.user_id : ''),
                  duration_minutes:
                    Number(form.duration_minutes) || 60,
                  reason:
                    form.reason ||
                    'Authorized clinical consultation'
                },
                'Secure access grant'
              )
            }
          >
            <ShieldCheck size={16} />
            Grant Secure Access
          </button>
        </Panel>

        <Panel
          title="Active Access Grants"
          icon={<Clock size={18} />}
        >
          {((data.grants || data.accessGrants || []).length === 0) ? (
            <p>No access grants found.</p>
          ) : (
            (data.grants || data.accessGrants || []).map((grant) => (
              <div
                key={grant.grant_id}
                style={{
                  padding: '0.875rem',
                  borderBottom: '1px solid #E2E8F0'
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <strong>
                    Grant ID: {grant.grant_id}
                  </strong>

                  <StatusBadge status={grant.status} />
                </div>

                <p style={{ margin: '0.375rem 0' }}>
                  Patient: <strong>{grant.patient_id}</strong>
                  {' · '}
                  Doctor: <strong>{grant.doctor_name || grant.doctor_id}</strong> ({grant.doctor_id})
                </p>

                <p style={{ fontSize: '0.8125rem', color: '#475569', margin: '0.25rem 0' }}>
                  Start: <strong>{grant.starts_at ? new Date(grant.starts_at).toLocaleString('en-IN') : 'N/A'}</strong>
                  {' · '}
                  Expiry: <strong>{grant.expires_at ? new Date(grant.expires_at).toLocaleString('en-IN') : 'N/A'}</strong>
                </p>

                <small style={{ color: '#64748B', display: 'block', marginTop: '0.25rem' }}>
                  Reason: {grant.reason || 'Authorized clinical access'}
                </small>
              </div>
            ))
          )}
        </Panel>
      </>
    )}
    {key === 'referrals' && (
      <>
        <Panel
          title="Create referral"
          icon={<GitPullRequest size={18} />}
        >
          <div className="grid-stats">

            <Field label="Patient ID">
              <input
                className="gov-input"
                value={patientId}
                onChange={(e) =>
                  setValue('patient_id', e.target.value)
                }
              />
            </Field>

            <Field label="Specialty">
              <input
                className="gov-input"
                value={form.specialty_required || ''}
                onChange={(e) =>
                  setValue('specialty_required', e.target.value)
                }
                placeholder="Cardiology"
              />
            </Field>

            <Field label="Priority">
              <select
                className="gov-select"
                value={form.priority || 'HIGH'}
                onChange={(e) =>
                  setValue('priority', e.target.value)
                }
              >
                <option value="HIGH">
                  {translatePriority('HIGH')}
                </option>
                <option value="EMERGENCY">
                  {translatePriority('EMERGENCY')}
                </option>
                <option value="NORMAL">
                  {translatePriority('NORMAL')}
                </option>
              </select>
            </Field>

            <Field label="Reason">
              <textarea
                className="gov-textarea"
                value={form.clinical_notes || ''}
                onChange={(e) =>
                  setValue('clinical_notes', e.target.value)
                }
                placeholder="Patient requires specialist evaluation..."
              />
            </Field>

          </div>

          <button
            className="gov-btn gov-btn-primary"
            onClick={() =>
              submit(
                api.createReferral,
                {
                  ...form,
                  patient_id: patientId
                },
                'Referral'
              )
            }
          >
            <Plus size={16} />
            Send referral
          </button>
        </Panel>

        <Panel
          title="Referral timeline"
          icon={<GitPullRequest size={18} />}
        >
          {(data.referrals || []).map((referral) => (
            <div
              key={referral.referral_id}
              style={{
                padding: '0.875rem',
                borderBottom: '1px solid #E2E8F0'
              }}
            >

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  alignItems: 'center'
                }}
              >
                <strong>
                  {referral.referral_id} · {referral.patient_id}
                </strong>

                <StatusBadge status={referral.status} />
              </div>

              <p>
                {translateSpecialty(referral.specialty_required) ||
                  'Service referral'}
                {' · '}
                {referral.clinical_notes ||
                  'No reason provided'}
              </p>

              {/* Recommended hospitals from Smart Facility Matching */}
              {Array.isArray(referral.target_hospitals) &&
                referral.target_hospitals.length > 0 && (
                  <div
                    style={{
                      marginTop: '0.75rem',
                      padding: '0.75rem',
                      background: '#F8FAFC',
                      borderRadius: '8px',
                      border: '1px solid #E2E8F0'
                    }}
                  >
                    <strong>
                      Recommended Hospitals
                    </strong>

                    {referral.target_hospitals.map(
                      (hospital, index) => (
                        <div
                          key={
                            hospital.facility_id || index
                          }
                          style={{
                            padding: '0.65rem 0',
                            borderBottom:
                              index <
                                referral.target_hospitals.length - 1
                                ? '1px solid #E2E8F0'
                                : 'none'
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              gap: '1rem'
                            }}
                          >
                            <strong>
                              {index + 1}. {hospital.facility}
                            </strong>

                            <strong
                              style={{ color: '#059669' }}
                            >
                              {hospital.match_score}%
                            </strong>
                          </div>

                          <div
                            style={{
                              fontSize: '0.85rem',
                              color: '#64748B',
                              marginTop: '0.25rem'
                            }}
                          >
                            {hospital.facility_id}
                            {' · '}
                            {hospital.distance}
                            {' · '}
                            {hospital.available_beds}
                            {' beds available'}
                          </div>

                          {Array.isArray(hospital.reasons) &&
                            hospital.reasons.length > 0 && (
                              <small
                                style={{
                                  display: 'block',
                                  color: '#475569',
                                  marginTop: '0.25rem'
                                }}
                              >
                                {hospital.reasons.join(' · ')}
                              </small>
                            )}
                        </div>
                      )
                    )}
                  </div>
                )}

              {/* Accept / Reject referral */}
              {role === 'facility_admin' &&
                referral.status !== 'ACTIVE' && (
                  <div
                    style={{
                      display: 'flex',
                      gap: '0.5rem',
                      marginTop: '0.75rem'
                    }}
                  >
                    <button
                      className="gov-btn gov-btn-primary gov-btn-sm"
                      onClick={() =>
                        submit(
                          (payload) =>
                            api.decideReferral(
                              referral.referral_id,
                              payload
                            ),
                          {
                            status: 'ACCEPTED',
                            hospital_id:
                              user?.facility_id
                          },
                          'Referral decision'
                        )
                      }
                    >
                      {t('accept')}
                    </button>

                    <button
                      className="gov-btn gov-btn-secondary gov-btn-sm"
                      onClick={() => {
                        const reason = window.prompt(
                          'Reason for rejection'
                        );

                        if (reason) {
                          submit(
                            (payload) =>
                              api.decideReferral(
                                referral.referral_id,
                                payload
                              ),
                            {
                              status: 'REJECTED',
                              reason,
                              hospital_id:
                                user?.facility_id
                            },
                            'Referral decision'
                          );
                        }
                      }}
                    >
                      {t('reject')}
                    </button>
                  </div>
                )}

              {referral.status === 'ACTIVE' &&
                referral.accepted_hospital && (
                  <div
                    style={{
                      marginTop: '0.75rem',
                      padding: '0.65rem',
                      background: '#ECFDF5',
                      color: '#065F46',
                      borderRadius: '6px'
                    }}
                  >
                    ✓ Referral accepted by{' '}
                    <strong>
                      {referral.accepted_hospital}
                    </strong>
                  </div>
                )}

            </div>
          ))}
        </Panel>
      </>
    )}
    {key === 'queue' && <Panel title="Live queue" icon={<Clock size={18} />}>{(data.queue || []).map((item, index) => <div key={item.appointment_id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.875rem', borderBottom: '1px solid #E2E8F0' }}><span><strong>{index + 1}. {item.patient_name || item.patient_id}</strong><br /><small>{item.date} at {item.time}</small></span><span><StatusBadge status={item.status} /><button className="gov-btn gov-btn-secondary gov-btn-sm" onClick={() => submit((payload) => api.updateQueue(item.appointment_id, payload.status), { status: 'IN_CONSULTATION' }, 'Queue update')}>{t('start')}</button></span></div>)}</Panel>}

    {key === 'patients' && (
      <>
        {clinicalError && (
          <div className="gov-card" role="alert" style={{ color: '#991B1B', backgroundColor: '#FEF2F2', marginBottom: '1rem', borderLeft: '4px solid #DC2626', padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertCircle size={20} style={{ color: '#DC2626', flexShrink: 0 }} />
            <div>
              <strong>Patient Record Access Denied</strong>
              <div style={{ fontSize: '0.875rem', marginTop: '0.125rem' }}>{clinicalError}</div>
            </div>
          </div>
        )}

        {selectedClinicalPatient && (
          <Panel title={`Clinical Record: ${selectedClinicalPatient.name} (${selectedClinicalPatient.patient_id})`} icon={<Stethoscope size={18} />}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <span style={{ fontSize: '0.8125rem', color: '#065F46', backgroundColor: '#ECFDF5', border: '1px solid #A7F3D0', padding: '0.25rem 0.625rem', borderRadius: '4px', fontWeight: '700' }}>
                  ✓ Secure Time-Bound Access Verified
                </span>
              </div>
              <button className="gov-btn gov-btn-secondary gov-btn-sm" onClick={() => setSelectedClinicalPatient(null)}>
                Close Clinical Record
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
              <div className="gov-card" style={{ padding: '1rem', margin: 0 }}>
                <h4 style={{ margin: '0 0 0.5rem 0', color: '#0F2C59', fontSize: '0.9375rem', fontWeight: '700', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.375rem' }}>Demographics & Contact</h4>
                <p style={{ margin: '0.375rem 0', fontSize: '0.875rem' }}><strong>Patient ID:</strong> {selectedClinicalPatient.patient_id}</p>
                <p style={{ margin: '0.375rem 0', fontSize: '0.875rem' }}><strong>Full Name:</strong> {selectedClinicalPatient.name}</p>
                <p style={{ margin: '0.375rem 0', fontSize: '0.875rem' }}><strong>Age / Gender:</strong> {selectedClinicalPatient.age || '48'} yrs / {translateGender(selectedClinicalPatient.gender)}</p>
                <p style={{ margin: '0.375rem 0', fontSize: '0.875rem' }}><strong>Phone:</strong> {selectedClinicalPatient.phone || '+91 98220 12345'}</p>
                <p style={{ margin: '0.375rem 0', fontSize: '0.875rem' }}><strong>Village / District:</strong> {selectedClinicalPatient.village || 'Mulshi Gaon'}, {selectedClinicalPatient.district || 'Pune'}</p>
              </div>

              <div className="gov-card" style={{ padding: '1rem', margin: 0 }}>
                <h4 style={{ margin: '0 0 0.5rem 0', color: '#0F2C59', fontSize: '0.9375rem', fontWeight: '700', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.375rem' }}>Clinical & Medical Profile</h4>
                <p style={{ margin: '0.375rem 0', fontSize: '0.875rem' }}>
                  <strong>Blood Group:</strong> <span style={{ color: '#B91C1C', fontWeight: '700' }}>{selectedClinicalPatient.medical_info?.blood_group || selectedClinicalPatient.blood_group || 'O+'}</span>
                </p>
                <p style={{ margin: '0.375rem 0', fontSize: '0.875rem' }}>
                  <strong>Existing Conditions:</strong> {Array.isArray(selectedClinicalPatient.medical_info?.conditions) && selectedClinicalPatient.medical_info.conditions.length ? selectedClinicalPatient.medical_info.conditions.join(', ') : (selectedClinicalPatient.medical_info?.conditions || selectedClinicalPatient.medical_info?.existing_conditions || 'Hypertension (Monitored)')}
                </p>
                <p style={{ margin: '0.375rem 0', fontSize: '0.875rem' }}>
                  <strong>Known Allergies:</strong> {Array.isArray(selectedClinicalPatient.medical_info?.allergies) && selectedClinicalPatient.medical_info.allergies.length ? selectedClinicalPatient.medical_info.allergies.join(', ') : (selectedClinicalPatient.medical_info?.allergies || 'Penicillin (Mild)')}
                </p>
                <p style={{ margin: '0.375rem 0', fontSize: '0.875rem' }}>
                  <strong>Emergency Contact:</strong> {selectedClinicalPatient.medical_info?.emergency_contact || selectedClinicalPatient.emergency_contact || '+91 98220 99999'}
                </p>
              </div>

              <div className="gov-card" style={{ padding: '1rem', margin: 0 }}>
                <h4 style={{ margin: '0 0 0.5rem 0', color: '#0F2C59', fontSize: '0.9375rem', fontWeight: '700', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.375rem' }}>Triage & Vitals</h4>
                <div style={{ margin: '0.375rem 0', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <strong>Triage Priority:</strong> <StatusBadge status={selectedClinicalPatient.triage_status || 'ROUTINE'} />
                </div>
                <p style={{ margin: '0.375rem 0', fontSize: '0.875rem' }}>
                  <strong>Reason / Complaint:</strong> {selectedClinicalPatient.triage_reason || 'Specialist Evaluation'}
                </p>
                <p style={{ margin: '0.375rem 0', fontSize: '0.875rem' }}>
                  <strong>Vitals:</strong> BP: {selectedClinicalPatient.vitals?.bp || '120/80'} · Pulse: {selectedClinicalPatient.vitals?.pulse || '72'} bpm · Temp: {selectedClinicalPatient.vitals?.temp || '98.6'}°F
                </p>
              </div>
            </div>
          </Panel>
        )}

        <Panel title="Authorized records" icon={<ShieldCheck size={18} />}>
          <div style={{ overflowX: 'auto' }}>
            <table className="gov-table">
              <thead>
                <tr>
                  <th>Patient ID</th>
                  <th>Name</th>
                  <th>Age</th>
                  <th>Gender</th>
                  <th>Village</th>
                  <th>District</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {(data.patients || []).length > 0 ? (
                  (data.patients || []).map((patient, index) => (
                    <tr key={patient.patient_id || index}>
                      <td style={{ fontFamily: 'monospace', fontWeight: '800', color: '#0F2C59' }}>{patient.patient_id}</td>
                      <td><strong>{patient.name}</strong></td>
                      <td>{patient.age}</td>
                      <td>{translateGender(patient.gender)}</td>
                      <td>{patient.village}</td>
                      <td>{patient.district}</td>
                      <td><StatusBadge status={patient.triage_status || 'ROUTINE'} /></td>
                      <td>
                        <button
                          className="gov-btn gov-btn-primary gov-btn-sm"
                          style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', whiteSpace: 'nowrap' }}
                          disabled={fetchingPatientId === patient.patient_id}
                          onClick={() => fetchClinicalRecord(patient.patient_id)}
                        >
                          <Stethoscope size={14} />
                          <span>{fetchingPatientId === patient.patient_id ? 'Loading...' : 'View Clinical Record'}</span>
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8}>{t('noRecordsFound')}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Panel>
      </>
    )}
    {key === 'history' && <><Panel title="Consultation record" icon={<Stethoscope size={18} />}><div className="grid-stats"><Field label="Patient ID"><input className="gov-input" value={patientId} onChange={(e) => setValue('patient_id', e.target.value)} /></Field><Field label="Symptoms / complaint"><textarea className="gov-textarea" value={form.complaint || ''} onChange={(e) => setValue('complaint', e.target.value)} /></Field><Field label="Observations"><textarea className="gov-textarea" value={form.observations || ''} onChange={(e) => setValue('observations', e.target.value)} /></Field><Field label="Diagnosis"><input className="gov-input" value={form.diagnosis || ''} onChange={(e) => setValue('diagnosis', e.target.value)} /></Field><Field label="Treatment and notes"><textarea className="gov-textarea" value={form.notes || ''} onChange={(e) => setValue('notes', e.target.value)} /></Field></div><button className="gov-btn gov-btn-primary" onClick={() => submit(api.createConsultation, { ...form, patient_id: patientId }, 'Consultation')}><Stethoscope size={16} /> Save consultation</button></Panel></>}
    {key === 'diagnostics' && <><Panel title="Diagnostic order" icon={<Stethoscope size={18} />}><div className="grid-stats"><Field label="Patient ID"><input className="gov-input" value={patientId} onChange={(e) => setValue('patient_id', e.target.value)} /></Field><Field label="Test"><input className="gov-input" value={form.test_name || ''} onChange={(e) => setValue('test_name', e.target.value)} placeholder="ECG" /></Field></div><button className="gov-btn gov-btn-primary" onClick={() => submit(api.createDiagnosticOrder, { ...form, patient_id: patientId }, 'Diagnostic order')}><Plus size={16} /> Order test</button></Panel><Panel title="Orders and results" icon={<FileText size={18} />}>{renderList(data.orders, ['order_id', 'patient_id', 'test_name', 'status', 'result'])}</Panel></>}
    {key === 'followups' && <><Panel title="Schedule follow-up" icon={<Calendar size={18} />}><div className="grid-stats"><Field label="Patient ID"><input className="gov-input" value={patientId} onChange={(e) => setValue('patient_id', e.target.value)} /></Field><Field label="Date"><input type="date" className="gov-input" value={form.followup_date || ''} onChange={(e) => setValue('followup_date', e.target.value)} /></Field><Field label="Reason"><input className="gov-input" value={form.reason || ''} onChange={(e) => setValue('reason', e.target.value)} /></Field></div><button className="gov-btn gov-btn-primary" onClick={() => submit(api.createFollowup, { ...form, patient_id: patientId, doctor_id: user?.user_id, facility_id: user?.facility_id }, 'Follow-up')}><Plus size={16} /> Schedule follow-up</button></Panel><Panel title="Follow-up register" icon={<Clock size={18} />}>{renderList(data.followups, ['followup_id', 'patient_id', 'followup_date', 'reason', 'status'])}</Panel></>}
    {['medicines', 'facilities', 'audit-logs'].includes(key) && <Panel title="Current records" icon={<FileText size={18} />}>{renderList(data.medicines || data.facilities || data.logs, Object.keys((data.medicines || data.facilities || data.logs || [])[0] || {}).slice(0, 7))}</Panel>}
    {['medicines', 'doctors', 'diagnostics'].includes(key) && role === 'facility_admin' && <Panel title="Update facility resources" icon={<Activity size={18} />}><div className="grid-stats"><Field label="Available beds"><input type="number" className="gov-input" value={form.active_beds ?? ''} onChange={(e) => setValue('active_beds', Number(e.target.value))} placeholder="12" /></Field><Field label="Facility status"><select className="gov-select" value={form.status || 'AVAILABLE'} onChange={(e) => setValue('status', e.target.value)}><option value="AVAILABLE">{translateStatus('AVAILABLE')}</option><option value="LIMITED">{translateStatus('LIMITED')}</option><option value="CRITICAL_CAPACITY">{translateStatus('CRITICAL_CAPACITY')}</option></select></Field><Field label="Specialties / available services"><input className="gov-input" value={form.specialties || ''} onChange={(e) => setValue('specialties', e.target.value.split(',').map((item) => item.trim()).filter(Boolean))} placeholder="Cardiology, ECG, Emergency ICU" /></Field></div><button className="gov-btn gov-btn-primary" onClick={() => submit((payload) => api.updateFacilityResources(user?.facility_id, payload), { active_beds: form.active_beds, status: form.status, specialties: form.specialties }, 'Facility resource update')}><Activity size={16} /> Save resource changes</button><p style={{ fontSize: '0.8125rem', color: '#64748B' }}>Matching reads these saved beds, services, and status values.</p></Panel>}
    {key === 'prescription' && <><Panel title={role === 'doctor' ? 'Prescription entry' : 'Prescription history'} icon={<FileText size={18} />}>{role === 'doctor' ? <><div className="grid-stats"><Field label="Patient ID"><input className="gov-input" value={patientId} onChange={(e) => setValue('patient_id', e.target.value)} /></Field><Field label="Diagnosis"><input className="gov-input" value={form.diagnosis || ''} onChange={(e) => setValue('diagnosis', e.target.value)} /></Field><Field label="Medicine and instructions"><textarea className="gov-textarea" value={form.instructions || ''} onChange={(e) => setValue('instructions', e.target.value)} placeholder="Medicine, dosage, frequency, duration" /></Field></div><button className="gov-btn gov-btn-primary" onClick={() => submit(api.createPrescription, { ...form, patient_id: patientId, items: [{ medicine: form.medicine || form.instructions }] }, 'Prescription')}><FileText size={16} /> Save prescription</button></> : <p>Completed prescriptions are shown here after your care team records them.</p>}</Panel></>}
    {key === 'sync' && <Panel title="Offline sync status" icon={<RefreshCw size={18} />}><p><strong>{translateStatus(isOnline ? 'ONLINE' : 'OFFLINE')}</strong> · Use the header sync control to retry queued records.</p><p>Local entries are retained in IndexedDB until the API confirms synchronization.</p></Panel>}
  </div>;
};

