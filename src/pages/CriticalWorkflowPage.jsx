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

  const [facilitiesList, setFacilitiesList] = useState([]);
  const [doctorsList, setDoctorsList] = useState([]);

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

      if (key === 'appointments') {
        const [facsRes, docsRes] = await Promise.allSettled([
          api.facilities(),
          api.doctors()
        ]);
        if (facsRes.status === 'fulfilled' && Array.isArray(facsRes.value?.facilities)) {
          setFacilitiesList(facsRes.value.facilities);
        }
        if (docsRes.status === 'fulfilled' && Array.isArray(docsRes.value?.doctors)) {
          setDoctorsList(docsRes.value.doctors);
        }
      }
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

  const getHeaderLabel = (field) => {
    const translationMap = {
      appointment_id: 'appointment_id',
      patient_id: 'patient_id',
      doctor_name: 'doctor_name',
      doctor_id: 'doctor_id',
      facility_name: 'healthCentre',
      facility_id: 'healthCentre',
      date: 'date',
      time: 'time',
      status: 'status',
      order_id: 'order_id',
      test_name: 'test_name',
      followup_id: 'followup_id',
      followup_date: 'followup_date',
      reason: 'reason'
    };
    const keyToUse = translationMap[field] || field;
    const translated = t(keyToUse);
    if (translated && translated !== keyToUse) return translated;
    return field.replaceAll('_', ' ');
  };

  const renderList = (items = [], fields = [], emptyMessageKey = 'noRecordsFound') => (
    <div style={{ overflowX: 'auto' }}>
      <table className="gov-table">
        <thead>
          <tr>
            {fields.map((field) => <th key={field}>{getHeaderLabel(field)}</th>)}
          </tr>
        </thead>
        <tbody>
          {items.length ? items.map((item, index) => (
            <tr key={item.id || item.appointment_id || item.referral_id || item.order_id || item.followup_id || index}>
              {fields.map((field) => <td key={field}>{formatCellValue(item, field)}</td>)}
            </tr>
          )) : (
            <tr><td colSpan={fields.length} style={{ textAlign: 'center', padding: '1.25rem', color: '#64748B', fontStyle: 'italic' }}>{t(emptyMessageKey) || t('noRecordsFound')}</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );

  const patientId = form.patient_id || user?.patient_id || patients[0]?.patient_id || '';
  const patientPrimaryFacility = user?.registered_facility_id || user?.facility_id || 'FAC-101';
  const currentSelectedFacility = form.facility_id || patientPrimaryFacility;
  const filteredDoctors = doctorsList.filter((d) => d.facility_id === currentSelectedFacility);

  return <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
    <div className="gov-card" style={{ backgroundColor: '#0F2C59', color: '#fff', marginBottom: '1rem', backgroundImage: 'linear-gradient(135deg, #0F2C59, #1E3A8A)' }}><div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}><div><div style={{ color: '#F59E0B', fontSize: '0.75rem', fontWeight: 700 }}>{t('app_title')}</div><h1 style={{ fontSize: '1.5rem', margin: '0.25rem 0' }}>{t(title[0])}</h1><p style={{ color: '#CBD5E1', margin: 0 }}>{t(title[1])}</p></div><StatusBadge status={isOnline ? 'ONLINE' : 'OFFLINE'} /></div></div>
    {loading && <Panel title="Loading records" icon={<RefreshCw size={18} />}><p>{t('loadingRecords')}</p></Panel>}
    {error && <div className="gov-card" role="alert" style={{ color: '#991B1B', backgroundColor: '#FEF2F2', marginBottom: '1rem' }}>{error}</div>}
    {message && <div className="gov-card" role="status" style={{ color: '#065F46', backgroundColor: '#ECFDF5', marginBottom: '1rem' }}><CheckCircle2 size={16} /> {message}</div>}
    {key === 'services' && <><Panel title="Matching requirements" icon={<MapPin size={18} />}><div className="grid-stats"><Field label="Required specialty"><input className="gov-input" value={form.specialty || ''} onChange={(e) => setValue('specialty', e.target.value)} placeholder="Cardiology" /></Field><Field label="Diagnostic"><input className="gov-input" value={form.diagnostic || ''} onChange={(e) => setValue('diagnostic', e.target.value)} placeholder="ECG" /></Field><Field label="Equipment"><input className="gov-input" value={form.equipment || ''} onChange={(e) => setValue('equipment', e.target.value)} placeholder="ICU" /></Field><Field label="Emergency"><select className="gov-select" value={form.emergency || 'false'} onChange={(e) => setValue('emergency', e.target.value)}><option value="false">{t('no')}</option><option value="true">{t('required')}</option></select></Field><Field label="Bed required"><select className="gov-select" value={form.bedRequired || 'false'} onChange={(e) => setValue('bedRequired', e.target.value)}><option value="false">{t('no')}</option><option value="true">{t('required')}</option></select></Field></div><button className="gov-btn gov-btn-primary" onClick={runMatching}><Activity size={16} /> {t('runMatching')}</button></Panel><Panel title="Ranked facilities" icon={<ShieldCheck size={18} />}>{matches.length ? matches.map((match) => <div key={match.facility_id} className="gov-card" style={{ marginBottom: '0.75rem', borderLeft: `5px solid ${match.match_score >= 75 ? '#059669' : '#D97706'}` }}><div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}><strong>{match.facility}</strong><strong style={{ color: '#059669' }}>{match.match_score}%</strong></div><p>{match.distance} · {t('specialty')}: {match.specialty_available ? translateStatus('AVAILABLE') : translateStatus('UNAVAILABLE')} · {t('diagnostics')}: {match.diagnostic_available ? translateStatus('AVAILABLE') : translateStatus('UNAVAILABLE')} · {t('beds')}: {match.beds_available ? translateStatus('AVAILABLE') : translateStatus('UNAVAILABLE')}</p><small>{match.reasons.join(' · ')}</small></div>) : <p>{t('enterRequirements')}</p>}</Panel></>}

    {key === 'appointments' && (
      <>
        <Panel title={t('bookAppointment')} icon={<Calendar size={18} />}>
          <div className="grid-stats">
            <Field label={t('patient_id')}>
              <input
                className="gov-input"
                value={patientId}
                readOnly={role === 'patient'}
                onChange={(e) => setValue('patient_id', e.target.value)}
              />
            </Field>

            <Field label={t('healthCentre')}>
              <select
                className="gov-select"
                value={currentSelectedFacility}
                onChange={(e) => {
                  setValue('facility_id', e.target.value);
                  setValue('doctor_id', '');
                }}
              >
                {facilitiesList.length > 0 ? (
                  facilitiesList.map((fac) => (
                    <option key={fac.facility_id} value={fac.facility_id}>
                      {fac.name} ({fac.facility_id})
                    </option>
                  ))
                ) : (
                  <option value={patientPrimaryFacility}>
                    {user?.facility_name || user?.registered_facility_name || 'PHC Mulshi'} ({patientPrimaryFacility})
                  </option>
                )}
              </select>
            </Field>

            <Field label={t('doctor_name')}>
              <select
                className="gov-select"
                value={form.doctor_id || ''}
                onChange={(e) => setValue('doctor_id', e.target.value)}
              >
                <option value="">-- {t('selectDoctor')} --</option>
                {filteredDoctors.length > 0 ? (
                  filteredDoctors.map((doc) => (
                    <option key={doc.user_id} value={doc.user_id}>
                      {doc.name} ({translateSpecialty(doc.specialty || 'General Physician')})
                    </option>
                  ))
                ) : (
                  <option value="" disabled>No doctors assigned to this facility</option>
                )}
              </select>
            </Field>

            <Field label={t('date')}>
              <input
                type="date"
                className="gov-input"
                value={form.date || ''}
                onChange={(e) => setValue('date', e.target.value)}
              />
            </Field>

            <Field label={t('time')}>
              <input
                type="time"
                className="gov-input"
                value={form.time || ''}
                onChange={(e) => setValue('time', e.target.value)}
              />
            </Field>
          </div>

          <button
            className="gov-btn gov-btn-primary"
            onClick={() =>
              submit(
                api.createAppointment,
                {
                  ...form,
                  patient_id: patientId,
                  facility_id: currentSelectedFacility,
                  doctor_id: form.doctor_id || (filteredDoctors[0]?.user_id || 'USR-DOC-001')
                },
                'Appointment'
              )
            }
          >
            <Calendar size={16} /> {t('bookAppointment')}
          </button>
        </Panel>

        <Panel title={t('appointmentRecords')} icon={<Clock size={18} />}>
          {renderList(data.appointments, ['appointment_id', 'patient_id', 'doctor_name', 'date', 'time', 'status'], 'noAppointmentsFound')}
        </Panel>
      </>
    )}
    {key === 'access' && (
      <>
        <Panel
          title={t('secureDoctorAccess')}
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
                <option value={15}>15 {t('minutes')}</option>
                <option value={30}>30 {t('minutes')}</option>
                <option value={60}>60 {t('minutes')} (1 {t('hour')})</option>
                <option value={120}>120 {t('minutes')} (2 {t('hours')})</option>
                <option value={240}>240 {t('minutes')} (4 {t('hours')})</option>
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
            {t('grantSecureAccess')}
          </button>
        </Panel>

        <Panel
          title={t('activeAccessGrants')}
          icon={<Clock size={18} />}
        >
          {((data.grants || data.accessGrants || []).length === 0) ? (
            <p>{t('noAccessGrantsFound')}</p>
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
                    {t('grantId')}: {grant.grant_id}
                  </strong>

                  <StatusBadge status={grant.status} />
                </div>

                <p style={{ margin: '0.375rem 0' }}>
                  {t('patient')}: <strong>{grant.patient_id}</strong>
                  {' · '}
                  {t('doctor')}: <strong>{grant.doctor_name || grant.doctor_id}</strong> ({grant.doctor_id})
                </p>

                <p style={{ fontSize: '0.8125rem', color: '#475569', margin: '0.25rem 0' }}>
                  {t('start')}: <strong>{grant.starts_at ? new Date(grant.starts_at).toLocaleString('en-IN') : t('notAvailable')}</strong>
                  {' · '}
                  {t('expiry')}: <strong>{grant.expires_at ? new Date(grant.expires_at).toLocaleString('en-IN') : t('notAvailable')}</strong>
                </p>

                <small style={{ color: '#64748B', display: 'block', marginTop: '0.25rem' }}>
                  {t('reason')}: {grant.reason || 'Authorized clinical access'}
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
            {t('sendReferral')}
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
                  t('noReasonProvided')}
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
                      {t('recommendedHospitals')}
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
                            {' '}
                            {t('bedsAvailable')}
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
                referral.status !== 'ACCEPTED' && referral.status !== 'REJECTED' && (
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

                        if (reason !== null) {
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

              {(referral.status === 'ACCEPTED' || referral.status === 'ACTIVE') &&
                (referral.accepted_facility_name || referral.accepted_hospital) && (
                  <div
                    style={{
                      marginTop: '0.75rem',
                      padding: '0.65rem',
                      background: '#ECFDF5',
                      color: '#065F46',
                      borderRadius: '6px'
                    }}
                  >
                    ✓ {t('referralAcceptedBy')}{' '}
                    <strong>
                      {referral.accepted_facility_name || referral.accepted_hospital}
                    </strong>
                  </div>
                )}

              {referral.status === 'REJECTED' && (
                <div
                  style={{
                    marginTop: '0.75rem',
                    padding: '0.65rem',
                    background: '#FEF2F2',
                    color: '#991B1B',
                    borderRadius: '6px'
                  }}
                >
                  ✗ Referral Rejected. Reason: {referral.decision_reason || 'N/A'}
                </div>
              )}

            </div>
          ))}
        </Panel>
      </>
    )}
    {key === 'queue' && <Panel title={t('liveQueue')} icon={<Clock size={18} />}>{(data.queue || []).map((item, index) => <div key={item.appointment_id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.875rem', borderBottom: '1px solid #E2E8F0' }}><span><strong>{index + 1}. {item.patient_name || item.patient_id}</strong><br /><small>{item.date} {t('at')} {item.time}</small></span><span><StatusBadge status={item.status} /><button className="gov-btn gov-btn-secondary gov-btn-sm" onClick={() => submit((payload) => api.updateQueue(item.appointment_id, payload.status), { status: 'IN_CONSULTATION' }, 'Queue update')}>{t('start')}</button></span></div>)}</Panel>}

    {key === 'patients' && (
      <>
        {clinicalError && (
          <div className="gov-card" role="alert" style={{ color: '#991B1B', backgroundColor: '#FEF2F2', marginBottom: '1rem', borderLeft: '4px solid #DC2626', padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertCircle size={20} style={{ color: '#DC2626', flexShrink: 0 }} />
            <div>
              <strong>{t('patientAccessDenied')}</strong>
              <div style={{ fontSize: '0.875rem', marginTop: '0.125rem' }}>{clinicalError}</div>
            </div>
          </div>
        )}

        {selectedClinicalPatient && (
          <Panel title={`${t('clinicalSummary')}: ${selectedClinicalPatient.name} (${selectedClinicalPatient.patient_id})`} icon={<Stethoscope size={18} />}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <span style={{ fontSize: '0.8125rem', color: '#065F46', backgroundColor: '#ECFDF5', border: '1px solid #A7F3D0', padding: '0.25rem 0.625rem', borderRadius: '4px', fontWeight: '700' }}>
                  ✓ {t('rbacNotice')}
                </span>
              </div>
              <button className="gov-btn gov-btn-secondary gov-btn-sm" onClick={() => setSelectedClinicalPatient(null)}>
                {t('closeClinicalRecord')}
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
              <div className="gov-card" style={{ padding: '1rem', margin: 0 }}>
                <h4 style={{ margin: '0 0 0.5rem 0', color: '#0F2C59', fontSize: '0.9375rem', fontWeight: '700', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.375rem' }}>{t('basicInfoAndContacts')}</h4>
                <p style={{ margin: '0.375rem 0', fontSize: '0.875rem' }}><strong>{t('patientId')}:</strong> {selectedClinicalPatient.patient_id}</p>
                <p style={{ margin: '0.375rem 0', fontSize: '0.875rem' }}><strong>{t('name')}:</strong> {selectedClinicalPatient.name}</p>
                <p style={{ margin: '0.375rem 0', fontSize: '0.875rem' }}><strong>{t('ageGender')}:</strong> {selectedClinicalPatient.age || '48'} {t('yearsShort')} / {translateGender(selectedClinicalPatient.gender)}</p>
                <p style={{ margin: '0.375rem 0', fontSize: '0.875rem' }}><strong>{t('contactPhone')}:</strong> {selectedClinicalPatient.phone || t('notProvided')}</p>
                <p style={{ margin: '0.375rem 0', fontSize: '0.875rem' }}><strong>{t('villageTaluka')}:</strong> {selectedClinicalPatient.village || t('general')}, {selectedClinicalPatient.district || 'Pune'}</p>
              </div>

              <div className="gov-card" style={{ padding: '1rem', margin: 0 }}>
                <h4 style={{ margin: '0 0 0.5rem 0', color: '#0F2C59', fontSize: '0.9375rem', fontWeight: '700', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.375rem' }}>{t('allergiesAndHistory')}</h4>
                <p style={{ margin: '0.375rem 0', fontSize: '0.875rem' }}>
                  <strong>{t('bloodGroup')}:</strong> <span style={{ color: '#B91C1C', fontWeight: '700' }}>{selectedClinicalPatient.medical_info?.blood_group || selectedClinicalPatient.blood_group || 'O+'}</span>
                </p>
                <p style={{ margin: '0.375rem 0', fontSize: '0.875rem' }}>
                  <strong>{t('preExistingConditions')}:</strong> {Array.isArray(selectedClinicalPatient.medical_info?.conditions) && selectedClinicalPatient.medical_info.conditions.length ? selectedClinicalPatient.medical_info.conditions.join(', ') : (selectedClinicalPatient.medical_info?.conditions || selectedClinicalPatient.medical_info?.existing_conditions || t('none'))}
                </p>
                <p style={{ margin: '0.375rem 0', fontSize: '0.875rem' }}>
                  <strong>{t('knownAllergies')}:</strong> {Array.isArray(selectedClinicalPatient.medical_info?.allergies) && selectedClinicalPatient.medical_info.allergies.length ? selectedClinicalPatient.medical_info.allergies.join(', ') : (selectedClinicalPatient.medical_info?.allergies || t('noAllergies'))}
                </p>
                <p style={{ margin: '0.375rem 0', fontSize: '0.875rem' }}>
                  <strong>{t('emergencyContactPerson')}:</strong> {selectedClinicalPatient.medical_info?.emergency_contact || selectedClinicalPatient.emergency_contact || t('notProvided')}
                </p>
              </div>

              <div className="gov-card" style={{ padding: '1rem', margin: 0 }}>
                <h4 style={{ margin: '0 0 0.5rem 0', color: '#0F2C59', fontSize: '0.9375rem', fontWeight: '700', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.375rem' }}>{t('triageAndCare')}</h4>
                <div style={{ margin: '0.375rem 0', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <strong>{t('priority')}:</strong> <StatusBadge status={selectedClinicalPatient.triage_status || 'ROUTINE'} />
                </div>
                <p style={{ margin: '0.375rem 0', fontSize: '0.875rem' }}>
                  <strong>{t('reason')}:</strong> {selectedClinicalPatient.triage_reason || t('routineCheckup')}
                </p>
                <p style={{ margin: '0.375rem 0', fontSize: '0.875rem' }}>
                  <strong>{t('basicVitalsAndRisk')}:</strong> BP: {selectedClinicalPatient.vitals?.bp || '120/80'} · Pulse: {selectedClinicalPatient.vitals?.pulse || '72'} bpm · Temp: {selectedClinicalPatient.vitals?.temp || '98.6'}°F
                </p>
              </div>
            </div>
          </Panel>
        )}

        <Panel title={t('authorizedPatients')} icon={<ShieldCheck size={18} />}>
          <div style={{ overflowX: 'auto' }}>
            <table className="gov-table">
              <thead>
                <tr>
                  <th>{t('patientId')}</th>
                  <th>{t('name')}</th>
                  <th>{t('age')}</th>
                  <th>{t('gender')}</th>
                  <th>{t('village')}</th>
                  <th>{t('district')}</th>
                  <th>{t('status')}</th>
                  <th>{t('actionsHeader')}</th>
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
                          <span>{fetchingPatientId === patient.patient_id ? t('loading') : t('viewClinicalRecord')}</span>
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
    {key === 'history' && <><Panel title="Consultation record" icon={<Stethoscope size={18} />}><div className="grid-stats"><Field label="Patient ID"><input className="gov-input" value={patientId} onChange={(e) => setValue('patient_id', e.target.value)} /></Field><Field label="Symptoms / complaint"><textarea className="gov-textarea" value={form.complaint || ''} onChange={(e) => setValue('complaint', e.target.value)} /></Field><Field label="Observations"><textarea className="gov-textarea" value={form.observations || ''} onChange={(e) => setValue('observations', e.target.value)} /></Field><Field label="Diagnosis"><input className="gov-input" value={form.diagnosis || ''} onChange={(e) => setValue('diagnosis', e.target.value)} /></Field><Field label="Treatment and notes"><textarea className="gov-textarea" value={form.notes || ''} onChange={(e) => setValue('notes', e.target.value)} /></Field></div><button className="gov-btn gov-btn-primary" onClick={() => submit(api.createConsultation, { ...form, patient_id: patientId }, 'Consultation')}><Stethoscope size={16} /> {t('saveConsultation')}</button></Panel></>}
    {key === 'diagnostics' && <><Panel title="Diagnostic order" icon={<Stethoscope size={18} />}><div className="grid-stats"><Field label="Patient ID"><input className="gov-input" value={patientId} onChange={(e) => setValue('patient_id', e.target.value)} /></Field><Field label="Test"><input className="gov-input" value={form.test_name || ''} onChange={(e) => setValue('test_name', e.target.value)} placeholder="ECG" /></Field></div><button className="gov-btn gov-btn-primary" onClick={() => submit(api.createDiagnosticOrder, { ...form, patient_id: patientId }, 'Diagnostic order')}><Plus size={16} /> {t('orderTest')}</button></Panel><Panel title="Orders and results" icon={<FileText size={18} />}>{renderList(data.orders, ['order_id', 'patient_id', 'test_name', 'status', 'result'], 'noDiagnosticOrdersFound')}</Panel></>}
    {key === 'followups' && <><Panel title="Schedule follow-up" icon={<Calendar size={18} />}><div className="grid-stats"><Field label="Patient ID"><input className="gov-input" value={patientId} onChange={(e) => setValue('patient_id', e.target.value)} /></Field><Field label="Date"><input type="date" className="gov-input" value={form.followup_date || ''} onChange={(e) => setValue('followup_date', e.target.value)} /></Field><Field label="Reason"><input className="gov-input" value={form.reason || ''} onChange={(e) => setValue('reason', e.target.value)} /></Field></div><button className="gov-btn gov-btn-primary" onClick={() => submit(api.createFollowup, { ...form, patient_id: patientId, doctor_id: user?.user_id, facility_id: user?.facility_id }, 'Follow-up')}><Plus size={16} /> {t('scheduleFollowup')}</button></Panel><Panel title="Follow-up register" icon={<Clock size={18} />}>{renderList(data.followups, ['followup_id', 'patient_id', 'followup_date', 'reason', 'status'], 'noFollowupsFound')}</Panel></>}
    {['medicines', 'facilities', 'audit-logs'].includes(key) && <Panel title="Current records" icon={<FileText size={18} />}>{renderList(data.medicines || data.facilities || data.logs, Object.keys((data.medicines || data.facilities || data.logs || [])[0] || {}).slice(0, 7), key === 'medicines' ? 'noMedicinesFound' : 'noRecordsFound')}</Panel>}
    {key === 'prescription' && <><Panel title={role === 'doctor' ? 'Prescription entry' : 'Prescription history'} icon={<FileText size={18} />}>{role === 'doctor' ? <><div className="grid-stats"><Field label="Patient ID"><input className="gov-input" value={patientId} onChange={(e) => setValue('patient_id', e.target.value)} /></Field><Field label="Diagnosis"><input className="gov-input" value={form.diagnosis || ''} onChange={(e) => setValue('diagnosis', e.target.value)} /></Field><Field label="Medicine and instructions"><textarea className="gov-textarea" value={form.instructions || ''} onChange={(e) => setValue('instructions', e.target.value)} placeholder="Medicine, dosage, frequency, duration" /></Field></div><button className="gov-btn gov-btn-primary" onClick={() => submit(api.createPrescription, { ...form, patient_id: patientId, items: [{ medicine: form.medicine || form.instructions }] }, 'Prescription')}><FileText size={16} /> {t('savePrescription')}</button></> : <p>{t('patientPrescriptionsNotice')}</p>}</Panel></>}
    {key === 'sync' && <Panel title="Offline sync status" icon={<RefreshCw size={18} />}><p><strong>{translateStatus(isOnline ? 'ONLINE' : 'OFFLINE')}</strong> · {t('syncHeaderInstruction')}</p><p>{t('localEntriesIndexedDbNotice')}</p></Panel>}
  </div>;
};

