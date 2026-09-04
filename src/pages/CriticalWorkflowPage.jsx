import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Activity, Calendar, CheckCircle2, Clock, FileText, GitPullRequest, MapPin, Plus, RefreshCw, ShieldCheck, Stethoscope } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { usePatients } from '../context/PatientContext';
import { useOffline } from '../context/OfflineContext';
import { StatusBadge } from '../components/common/StatusBadge';

const titles = {
  appointments: ['appointments', 'appointmentRecords'],
  referrals: ['referrals', 'referralFlowByFacility'],
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
  const { user, role } = useAuth();
  const { t, translateStatus, translateSpecialty, translateGender, translatePriority, translateDiagnostic, translateFacilityType } = useLanguage();
  const { patients } = usePatients();
  const { isOnline, addPendingRecord } = useOffline();
  const [loading, setLoading] = useState(true);
  const [matches, setMatches] = useState([]);
  const title = titles[key] || ['currentWorkflow', 'operationalReviewNote'];
  const setValue = (name, value) => setForm((current) => ({ ...current, [name]: value }));

  const load = async () => {
    setLoading(true); setError('');
    try {
      const requests = {
        appointments: api.appointments, referrals: api.referrals, queue: api.queue, patients: api.patients,
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

    {key === 'appointments' && <><Panel title="Book appointment" icon={<Calendar size={18} />}><div className="grid-stats"><Field label="Patient ID"><input className="gov-input" value={patientId} onChange={(e) => setValue('patient_id', e.target.value)} /></Field><Field label="Doctor ID"><input className="gov-input" value={form.doctor_id || 'USR-DOC-003'} onChange={(e) => setValue('doctor_id', e.target.value)} /></Field><Field label="Facility ID"><input className="gov-input" value={form.facility_id || 'FAC-103'} onChange={(e) => setValue('facility_id', e.target.value)} /></Field><Field label="Date"><input type="date" className="gov-input" value={form.date || ''} onChange={(e) => setValue('date', e.target.value)} /></Field><Field label="Time"><input type="time" className="gov-input" value={form.time || ''} onChange={(e) => setValue('time', e.target.value)} /></Field></div><button className="gov-btn gov-btn-primary" onClick={() => submit(api.createAppointment, { ...form, patient_id: patientId }, 'Appointment')}><Calendar size={16} /> Book appointment</button></Panel><Panel title="Appointment records" icon={<Clock size={18} />}>{renderList(data.appointments, ['appointment_id', 'patient_id', 'doctor_name', 'date', 'time', 'status'])}</Panel></>}

    {key === 'referrals' && <><Panel title="Create referral" icon={<GitPullRequest size={18} />}><div className="grid-stats"><Field label="Patient ID"><input className="gov-input" value={patientId} onChange={(e) => setValue('patient_id', e.target.value)} /></Field><Field label="Specialty"><input className="gov-input" value={form.specialty_required || ''} onChange={(e) => setValue('specialty_required', e.target.value)} placeholder="Cardiology" /></Field><Field label="Priority"><select className="gov-select" value={form.priority || 'HIGH'} onChange={(e) => setValue('priority', e.target.value)}><option value="HIGH">{translatePriority('HIGH')}</option><option value="EMERGENCY">{translatePriority('EMERGENCY')}</option><option value="NORMAL">{translatePriority('NORMAL')}</option></select></Field><Field label="Reason"><textarea className="gov-textarea" value={form.clinical_notes || ''} onChange={(e) => setValue('clinical_notes', e.target.value)} /></Field></div><button className="gov-btn gov-btn-primary" onClick={() => submit(api.createReferral, { ...form, patient_id: patientId }, 'Referral')}><Plus size={16} /> Send referral</button></Panel><Panel title="Referral timeline" icon={<GitPullRequest size={18} />}>{(data.referrals || []).map((referral) => <div key={referral.referral_id} style={{ padding: '0.875rem', borderBottom: '1px solid #E2E8F0' }}><div style={{ display: 'flex', justifyContent: 'space-between' }}><strong>{referral.referral_id} · {referral.patient_id}</strong><StatusBadge status={referral.status} /></div><p>{translateSpecialty(referral.specialty_required) || 'Service referral'} · {referral.clinical_notes || 'No reason provided'}</p>{role === 'facility_admin' && referral.status !== 'ACTIVE' && <div style={{ display: 'flex', gap: '0.5rem' }}><button className="gov-btn gov-btn-primary gov-btn-sm" onClick={() => submit((payload) => api.decideReferral(referral.referral_id, payload), { status: 'ACCEPTED' }, 'Referral decision')}>{t('accept')}</button><button className="gov-btn gov-btn-secondary gov-btn-sm" onClick={() => { const reason = window.prompt('Reason for rejection'); if (reason) submit((payload) => api.decideReferral(referral.referral_id, payload), { status: 'REJECTED', reason }, 'Referral decision'); }}>{t('reject')}</button></div>}</div>)}</Panel></>}

    {key === 'queue' && <Panel title="Live queue" icon={<Clock size={18} />}>{(data.queue || []).map((item, index) => <div key={item.appointment_id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.875rem', borderBottom: '1px solid #E2E8F0' }}><span><strong>{index + 1}. {item.patient_name || item.patient_id}</strong><br /><small>{item.date} at {item.time}</small></span><span><StatusBadge status={item.status} /><button className="gov-btn gov-btn-secondary gov-btn-sm" onClick={() => submit((payload) => api.updateQueue(item.appointment_id, payload.status), { status: 'IN_CONSULTATION' }, 'Queue update')}>{t('start')}</button></span></div>)}</Panel>}

    {key === 'patients' && <Panel title="Authorized records" icon={<ShieldCheck size={18} />}>{renderList(data.patients, ['patient_id', 'name', 'age', 'gender', 'village', 'district', 'triage_status'])}</Panel>}
    {key === 'history' && <><Panel title="Consultation record" icon={<Stethoscope size={18} />}><div className="grid-stats"><Field label="Patient ID"><input className="gov-input" value={patientId} onChange={(e) => setValue('patient_id', e.target.value)} /></Field><Field label="Symptoms / complaint"><textarea className="gov-textarea" value={form.complaint || ''} onChange={(e) => setValue('complaint', e.target.value)} /></Field><Field label="Observations"><textarea className="gov-textarea" value={form.observations || ''} onChange={(e) => setValue('observations', e.target.value)} /></Field><Field label="Diagnosis"><input className="gov-input" value={form.diagnosis || ''} onChange={(e) => setValue('diagnosis', e.target.value)} /></Field><Field label="Treatment and notes"><textarea className="gov-textarea" value={form.notes || ''} onChange={(e) => setValue('notes', e.target.value)} /></Field></div><button className="gov-btn gov-btn-primary" onClick={() => submit(api.createConsultation, { ...form, patient_id: patientId }, 'Consultation')}><Stethoscope size={16} /> Save consultation</button></Panel></>}
    {key === 'diagnostics' && <><Panel title="Diagnostic order" icon={<Stethoscope size={18} />}><div className="grid-stats"><Field label="Patient ID"><input className="gov-input" value={patientId} onChange={(e) => setValue('patient_id', e.target.value)} /></Field><Field label="Test"><input className="gov-input" value={form.test_name || ''} onChange={(e) => setValue('test_name', e.target.value)} placeholder="ECG" /></Field></div><button className="gov-btn gov-btn-primary" onClick={() => submit(api.createDiagnosticOrder, { ...form, patient_id: patientId }, 'Diagnostic order')}><Plus size={16} /> Order test</button></Panel><Panel title="Orders and results" icon={<FileText size={18} />}>{renderList(data.orders, ['order_id', 'patient_id', 'test_name', 'status', 'result'])}</Panel></>}
    {key === 'followups' && <><Panel title="Schedule follow-up" icon={<Calendar size={18} />}><div className="grid-stats"><Field label="Patient ID"><input className="gov-input" value={patientId} onChange={(e) => setValue('patient_id', e.target.value)} /></Field><Field label="Date"><input type="date" className="gov-input" value={form.followup_date || ''} onChange={(e) => setValue('followup_date', e.target.value)} /></Field><Field label="Reason"><input className="gov-input" value={form.reason || ''} onChange={(e) => setValue('reason', e.target.value)} /></Field></div><button className="gov-btn gov-btn-primary" onClick={() => submit(api.createFollowup, { ...form, patient_id: patientId, doctor_id: user?.user_id, facility_id: user?.facility_id }, 'Follow-up')}><Plus size={16} /> Schedule follow-up</button></Panel><Panel title="Follow-up register" icon={<Clock size={18} />}>{renderList(data.followups, ['followup_id', 'patient_id', 'followup_date', 'reason', 'status'])}</Panel></>}
    {['medicines', 'facilities', 'audit-logs'].includes(key) && <Panel title="Current records" icon={<FileText size={18} />}>{renderList(data.medicines || data.facilities || data.logs, Object.keys((data.medicines || data.facilities || data.logs || [])[0] || {}).slice(0, 7))}</Panel>}
    {['medicines', 'doctors', 'diagnostics'].includes(key) && role === 'facility_admin' && <Panel title="Update facility resources" icon={<Activity size={18} />}><div className="grid-stats"><Field label="Available beds"><input type="number" className="gov-input" value={form.active_beds ?? ''} onChange={(e) => setValue('active_beds', Number(e.target.value))} placeholder="12" /></Field><Field label="Facility status"><select className="gov-select" value={form.status || 'AVAILABLE'} onChange={(e) => setValue('status', e.target.value)}><option value="AVAILABLE">{translateStatus('AVAILABLE')}</option><option value="LIMITED">{translateStatus('LIMITED')}</option><option value="CRITICAL_CAPACITY">{translateStatus('CRITICAL_CAPACITY')}</option></select></Field><Field label="Specialties / available services"><input className="gov-input" value={form.specialties || ''} onChange={(e) => setValue('specialties', e.target.value.split(',').map((item) => item.trim()).filter(Boolean))} placeholder="Cardiology, ECG, Emergency ICU" /></Field></div><button className="gov-btn gov-btn-primary" onClick={() => submit((payload) => api.updateFacilityResources(user?.facility_id, payload), { active_beds: form.active_beds, status: form.status, specialties: form.specialties }, 'Facility resource update')}><Activity size={16} /> Save resource changes</button><p style={{ fontSize: '0.8125rem', color: '#64748B' }}>Matching reads these saved beds, services, and status values.</p></Panel>}
    {key === 'prescription' && <><Panel title={role === 'doctor' ? 'Prescription entry' : 'Prescription history'} icon={<FileText size={18} />}>{role === 'doctor' ? <><div className="grid-stats"><Field label="Patient ID"><input className="gov-input" value={patientId} onChange={(e) => setValue('patient_id', e.target.value)} /></Field><Field label="Diagnosis"><input className="gov-input" value={form.diagnosis || ''} onChange={(e) => setValue('diagnosis', e.target.value)} /></Field><Field label="Medicine and instructions"><textarea className="gov-textarea" value={form.instructions || ''} onChange={(e) => setValue('instructions', e.target.value)} placeholder="Medicine, dosage, frequency, duration" /></Field></div><button className="gov-btn gov-btn-primary" onClick={() => submit(api.createPrescription, { ...form, patient_id: patientId, items: [{ medicine: form.medicine || form.instructions }] }, 'Prescription')}><FileText size={16} /> Save prescription</button></> : <p>Completed prescriptions are shown here after your care team records them.</p>}</Panel></>}
    {key === 'sync' && <Panel title="Offline sync status" icon={<RefreshCw size={18} />}><p><strong>{translateStatus(isOnline ? 'ONLINE' : 'OFFLINE')}</strong> · Use the header sync control to retry queued records.</p><p>Local entries are retained in IndexedDB until the API confirms synchronization.</p></Panel>}
  </div>;
};

