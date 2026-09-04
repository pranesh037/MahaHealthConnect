import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Baby, BarChart3, Bell, CalendarCheck, FileText, IdCard, MapPin, ShieldCheck, UserCheck, Users, Wifi } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { usePatients } from '../context/PatientContext';
import { useOffline } from '../context/OfflineContext';
import { api } from '../services/api';
import { StatusBadge } from '../components/common/StatusBadge';

const pageMeta = {
  profile: ['myHealthProfile', 'clinicalSummary'], maternal: ['maternalHealthcare', 'currentWorkflow'], nfc: ['nfcCardIdentification', 'currentWorkflow'], documents: ['documentUpload', 'currentWorkflow'], attendance: ['todaysAttendance', 'currentWorkflow'], analytics: ['facilityOperationsAnalytics', 'operationalSignals'], staff: ['facilityTeam', 'currentWorkflow'], 'referral-analytics': ['referralAnalytics', 'referralFlowByFacility'], 'medicine-analytics': ['districtMedicineStocks', 'medicineAlerts'], 'diagnostic-analytics': ['districtDiagnosticCapacity', 'diagnosticCapacityMatrix'], specialists: ['specialistDistribution', 'specialistCoverage'], quality: ['qualityMonitoring', 'operationalReviewNote']
};
const staff = [{ name: 'Sunita Laxman Shinde', role: 'Health Worker', status: 'PRESENT' }, { name: 'Dr. Aniket Deshmukh', role: 'Cardiologist', status: 'PRESENT' }, { name: 'Rajesh S. Pawar', role: 'Facility Admin', status: 'PRESENT' }, { name: 'Priyamvada Joshi', role: 'Obstetrics', status: 'ON LEAVE' }];
function Panel({ title, icon, children }) { const { t } = useLanguage(); const titleKeys = { 'Basic Information': 'basicInformation', 'Emergency Contacts and Clinical Summary': 'clinicalSummary', 'ANC Registration': 'ancRegistration', 'Care Timeline': 'careTimeline', 'Demo NFC Scan': 'demoNfcScan', 'Record document': 'recordDocument', 'Document register': 'documentRegister', 'Staff attendance': 'staffAttendance', 'Operational signals': 'operationalSignals', 'Facility team': 'facilityTeam', 'Referral flow by facility': 'referralFlowByFacility', 'District stock register': 'districtMedicineStocks', 'Diagnostic capacity matrix': 'diagnosticCapacityMatrix', 'Quality review notes': 'qualityReviewNotes' }; return <section className="gov-card" style={{ marginBottom: '1rem' }}><div className="gov-card-header"><div className="gov-card-title">{icon}{t(titleKeys[title] || title)}</div></div>{children}</section>; }
function Metric({ label, value, tone = '#1E40AF' }) { const { t } = useLanguage(); return <div className="stat-card"><div><div className="stat-value" style={{ color: tone }}>{value}</div><div className="stat-label">{t(label)}</div></div><BarChart3 style={{ color: tone }} /></div>; }
function Table({ rows, columns }) {
  const { t, translateGender, translateSpecialty, translateFacilityType } = useLanguage();
  const columnLabels = { name: 'name', role: 'role', status: 'status', check_in: 'checkIn', patient_id: 'patientId', facility_id: 'facility', facility_name: 'facilityName', referral_id: 'referralId', specialty_required: 'specialty', current_stock: 'availableQuantity', last_updated: 'lastUpdated', order_id: 'orderId', test_name: 'test', x_ray: 'xRay', ecg: 'ecg', ct: 'ct', specialty: 'specialty', specialists: 'specialists', facilities: 'facilities', availability: 'availability', type: 'type', file_name: 'fileName' };

  const formatValue = (row, column) => {
    const val = row[column];
    if (column === 'status' || column === 'availability') return <StatusBadge status={val} />;
    if (column === 'gender') return translateGender(val);
    if (column === 'specialty' || column === 'specialty_required') return translateSpecialty(val);
    if (column === 'type') return translateFacilityType(val);
    return String(val ?? '—');
  };

  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="gov-table">
        <thead>
          <tr>
            {columns.map((column) => <th key={column}>{t(columnLabels[column] || column.replaceAll('_', ' '))}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.length ? rows.map((row, index) => (
            <tr key={row.id || row.facility_id || row.name || index}>
              {columns.map((column) => <td key={column}>{formatValue(row, column)}</td>)}
            </tr>
          )) : (
            <tr><td colSpan={columns.length}>{t('noRecordsAvailable')}</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export const SupportingWorkflowPage = ({ overrideKey }) => {
  const routeKey = useLocation().pathname.split('/').filter(Boolean).pop();
  const key = overrideKey || routeKey;
  const meta = pageMeta[key] || ['Healthcare Operations', 'Maha Health Connect supporting workflow.'];
  const { user } = useAuth();
  const { t } = useLanguage();
  const { patients } = usePatients();
  const { isOnline } = useOffline();
  const [selectedPatient] = useState(patients.find((patient) => patient.patient_id === user?.patient_id) || patients[0]);
  const [identified, setIdentified] = useState(null);
  const [documents, setDocuments] = useState(() => JSON.parse(localStorage.getItem('mhc_documents') || '[]'));
  const [attendance, setAttendance] = useState(() => JSON.parse(localStorage.getItem('mhc_attendance') || JSON.stringify(staff)));
  const [form, setForm] = useState({});
  const [data, setData] = useState({ facilities: [], referrals: [], medicines: [], diagnostics: [] });
  const [message, setMessage] = useState('');
  useEffect(() => { Promise.all([api.facilities().catch(() => ({ facilities: [] })), api.referrals().catch(() => ({ referrals: [] })), api.medicines().catch(() => ({ medicines: [] })), api.diagnosticOrders().catch(() => ({ orders: [] }))]).then(([facilities, referrals, medicines, diagnostics]) => setData({ facilities: facilities.facilities || [], referrals: referrals.referrals || [], medicines: medicines.medicines || [], diagnostics: diagnostics.orders || [] })); }, []);
  const setValue = (name, value) => setForm((current) => ({ ...current, [name]: value }));
  const saveAttendance = (name) => { const updated = attendance.map((person) => person.name === name ? { ...person, status: 'PRESENT', check_in: new Date().toLocaleTimeString() } : person); setAttendance(updated); localStorage.setItem('mhc_attendance', JSON.stringify(updated)); setMessage('Attendance updated for the current session.'); };
  const addDocument = (event) => { event.preventDefault(); const item = { ...form, id: Date.now(), date: new Date().toLocaleDateString(), status: 'RECORDED', file_name: form.file?.name || t('metadataOnly') }; const updated = [item, ...documents]; setDocuments(updated); localStorage.setItem('mhc_documents', JSON.stringify(updated)); setForm({}); setMessage(t('documentSaved')); };
  const profilePatient = selectedPatient || patients[0] || user;
  return <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
    <div className="gov-card" style={{ backgroundColor: '#0F2C59', color: '#fff', marginBottom: '1rem', backgroundImage: 'linear-gradient(135deg, #0F2C59, #1E3A8A)' }}><div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}><div><div style={{ color: '#F59E0B', fontSize: '0.75rem', fontWeight: 700 }}>{t('app_title')}</div><h1 style={{ fontSize: '1.5rem', margin: '0.25rem 0' }}>{t(meta[0])}</h1><p style={{ color: '#CBD5E1', margin: 0 }}>{t(meta[1])}</p></div><StatusBadge status={isOnline ? 'ONLINE' : 'OFFLINE'} /></div></div>
    {message && <div className="gov-card" role="status" style={{ color: '#065F46', backgroundColor: '#ECFDF5', marginBottom: '1rem' }}><ShieldCheck size={16} /> {message}</div>}
    {key === 'profile' && <><Panel title={t('basicInformation')} icon={<UserCheck size={18} />}><div className="grid-stats"><Metric label={t('patientId')} value={profilePatient?.patient_id || '—'} /><Metric label={t('name')} value={profilePatient?.name || '—'} /><Metric label={`${t('age')} / ${t('gender')}`} value={`${profilePatient?.age || '—'} / ${profilePatient?.gender || '—'}`} /><Metric label={`${t('village')} / ${t('district')}`} value={`${profilePatient?.village || '—'} / ${profilePatient?.district || '—'}`} /></div></Panel><Panel title={`${t('emergencyContacts')} ${t('clinicalSummary')}`} icon={<ShieldCheck size={18} />}><p><strong>{t('contact')}:</strong> {profilePatient?.phone || user?.phone || t('noRecord')}</p><p><strong>{t('emergencyContact')}:</strong> {profilePatient?.medical_info?.emergency_contact || user?.emergency_contact || t('noRecord')}</p><p><strong>{t('allergies')}:</strong> {profilePatient?.medical_info?.allergies || t('noAllergies')}</p><p><strong>{t('medicalHistory')}:</strong> {profilePatient?.medical_info?.existing_conditions || t('noRecord')}</p></Panel></>}
    {key === 'maternal' && <><Panel title={t('ancRegistration')} icon={<Baby size={18} />}><div className="grid-stats"><label className="gov-form-group"><span className="gov-label">{t('patient')}</span><select className="gov-select" value={form.patient_id || profilePatient?.patient_id || ''} onChange={(e) => setValue('patient_id', e.target.value)}>{patients.map((patient) => <option key={patient.patient_id}>{patient.patient_id}</option>)}</select></label><label className="gov-form-group"><span className="gov-label">{t('expectedDeliveryDate')}</span><input type="date" className="gov-input" value={form.edd || ''} onChange={(e) => setValue('edd', e.target.value)} /></label><label className="gov-form-group"><span className="gov-label">{t('riskIndicators')}</span><input className="gov-input" value={form.risk || ''} onChange={(e) => setValue('risk', e.target.value)} placeholder={t('noneRecorded')} /></label></div><button className="gov-btn gov-btn-primary" onClick={() => setMessage(t('ancSaved'))}>{t('saveAncRecord')}</button></Panel><Panel title={t('careTimeline')} icon={<CalendarCheck size={18} />}><div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>{[t('ancRegistration'), t('visit1'), t('visit2'), t('visit3'), t('nextFollowup')].map((step, index) => <div key={step} style={{ padding: '0.75rem', borderLeft: `4px solid ${index < 2 ? '#059669' : '#CBD5E1'}`, backgroundColor: '#F8FAFC' }}><strong>{step}</strong><div style={{ color: '#64748B', fontSize: '0.8125rem' }}>{index < 2 ? t('recordedDemoHistory') : t('awaitingEntry')}</div></div>)}</div></Panel></>}
    {key === 'nfc' && <Panel title={t('demoNfcScan')} icon={<IdCard size={18} />}><p>{t('simulatedNfcNotice')}</p><button className="gov-btn gov-btn-saffron" onClick={() => setTimeout(() => setIdentified(profilePatient), 400)}><Wifi size={16} /> {t('scanNfcCard')}</button>{identified && <div style={{ marginTop: '1rem', padding: '1rem', border: '1px solid #A7F3D0', backgroundColor: '#ECFDF5', borderRadius: '8px' }}><strong>{t('patientIdentified')}</strong><p>{t('patientId')}: {identified.patient_id}<br />{t('name')}: {identified.name}<br />{t('village')}: {identified.village}, {identified.district}</p></div>}</Panel>}
    {key === 'documents' && <><Panel title="Record document" icon={<FileText size={18} />}><form onSubmit={addDocument}><div className="grid-stats"><select className="gov-select" value={form.type || 'Prescription'} onChange={(e) => setValue('type', e.target.value)}><option value="Prescription">{t('prescriptionType')}</option><option value="Diagnostic Report">{t('diagnosticReportType')}</option><option value="Referral Document">{t('referralDocumentType')}</option><option value="Medical Record">{t('medicalRecordType')}</option><option value="Other">{t('other')}</option></select><input className="gov-input" value={form.patient_id || ''} onChange={(e) => setValue('patient_id', e.target.value)} placeholder={t('patientId')} /><input type="file" className="gov-input" onChange={(e) => setValue('file', e.target.files[0])} /></div><button className="gov-btn gov-btn-primary" type="submit"><FileText size={16} /> {t('recordDocumentBtn')}</button></form></Panel><Panel title="Document register" icon={<FileText size={18} />}><Table rows={documents} columns={['type', 'patient_id', 'file_name', 'date', 'status']} /></Panel></>}
    {key === 'attendance' && <Panel title="Staff attendance" icon={<Users size={18} />}><Table rows={attendance} columns={['name', 'role', 'status', 'check_in']} />{attendance.filter((person) => person.status !== 'PRESENT').map((person) => <button key={person.name} className="gov-btn gov-btn-primary gov-btn-sm" style={{ margin: '0.5rem 0.5rem 0 0' }} onClick={() => saveAttendance(person.name)}><UserCheck size={14} /> Mark {person.name} present</button>)}</Panel>}
    {key === 'analytics' && <><div className="grid-stats"><Metric label="facilitiesConnected" value={data.facilities.length} /><Metric label="referralsTracked" value={data.referrals.length} tone="#D97706" /><Metric label="availableBeds" value={data.facilities.reduce((sum, item) => sum + Number(item.active_beds || 0), 0)} tone="#059669" /><Metric label="medicineLines" value={data.medicines.length} tone="#6B21A8" /></div><Panel title="operationalSignals" icon={<BarChart3 size={18} />}><p>{t('patientFlow')}: <strong>{patients.length}</strong> {t('registeredRecordsVisible')}</p><p>{t('referralStatus')}: <strong>{data.referrals.filter((item) => item.status === 'PENDING' || item.status === 'SENT').length}</strong> {t('awaitingResponse')}</p><p>{t('medicineAlerts')}: <strong>{data.medicines.filter((item) => /LOW|CRITICAL|OUT/i.test(item.status)).length}</strong> {t('linesRequireReview')}</p></Panel></>}
    {key === 'staff' && <Panel title="Facility team" icon={<Users size={18} />}><Table rows={staff} columns={['name', 'role', 'status']} /></Panel>}
    {key === 'referral-analytics' && <><div className="grid-stats"><Metric label="totalReferrals" value={data.referrals.length} /><Metric label="pending" value={data.referrals.filter((item) => /PENDING|SENT/.test(item.status)).length} tone="#D97706" /><Metric label="acceptedActive" value={data.referrals.filter((item) => /ACCEPTED|ACTIVE/.test(item.status)).length} tone="#059669" /><Metric label="rejected" value={data.referrals.filter((item) => item.status === 'REJECTED').length} tone="#DC2626" /></div><Panel title="referralFlowByFacility" icon={<MapPin size={18} />}><Table rows={data.referrals} columns={['referral_id', 'referring_facility_name', 'specialty_required', 'status']} /></Panel></>}
    {key === 'medicine-analytics' && <Panel title="District stock register" icon={<Bell size={18} />}><Table rows={data.medicines} columns={['name', 'current_stock', 'status', 'last_updated']} /></Panel>}
    {key === 'diagnostic-analytics' && <Panel title="Diagnostic capacity matrix" icon={<BarChart3 size={18} />}><Table rows={data.facilities.map((facility) => ({ ...facility, x_ray: 'AVAILABLE', ecg: facility.type === 'PHC' ? 'LIMITED' : 'AVAILABLE', ct: facility.type === 'District Hospital' ? 'AVAILABLE' : 'UNAVAILABLE' }))} columns={['name', 'x_ray', 'ecg', 'ct', 'status']} /></Panel>}
    {key === 'specialists' && <Panel title="Specialist coverage" icon={<StethoscopeIcon />}><Table rows={[{ specialty: 'Cardiology', specialists: 3, facilities: 2, availability: 'AVAILABLE' }, { specialty: 'Pediatrics', specialists: 5, facilities: 4, availability: 'AVAILABLE' }, { specialty: 'Gynecology', specialists: 4, facilities: 3, availability: 'LIMITED' }]} columns={['specialty', 'specialists', 'facilities', 'availability']} /></Panel>}
    {key === 'quality' && <><div className="grid-stats"><Metric label="facilityCoverage" value={`${data.facilities.length} sites`} /><Metric label="activeReferralRate" value="86%" tone="#059669" /><Metric label="diagnosticAvailability" value="91%" tone="#1E40AF" /><Metric label="stockAlerts" value={data.medicines.filter((item) => /LOW|CRITICAL/i.test(item.status)).length} tone="#DC2626" /></div><Panel title="qualityReviewNotes" icon={<ShieldCheck size={18} />}><p>{t('operationalReviewNote')}</p><p>{t('investigateExceptions')}</p></Panel></>}
  </div>;
};
const StethoscopeIcon = () => <ShieldCheck size={18} />;
