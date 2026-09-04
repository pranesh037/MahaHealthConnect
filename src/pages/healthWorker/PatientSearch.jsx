import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { usePatients } from '../../context/PatientContext';
import { useLanguage } from '../../context/LanguageContext';
import { useAudit } from '../../context/AuditContext';
import { StatusBadge } from '../../components/common/StatusBadge';
import { evaluateAccess, DATA_TYPES } from '../../utils/authorization';
import {
  Search,
  User,
  PlusCircle,
  Phone,
  MapPin,
  Stethoscope,
  Building2,
  Eye,
  ShieldCheck,
  Filter,
  CheckCircle2,
  Lock,
  Clock,
  AlertTriangle,
  FileText,
  ShieldAlert,
  ClipboardList,
  Activity,
  History,
  AlertCircle
} from 'lucide-react';

export const PatientSearch = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { patients } = usePatients();
  const { t, translateGender } = useLanguage();
  const { logAccessEvent, getPatientAuditHistory } = useAudit();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVillage, setSelectedVillage] = useState('ALL');
  
  // Selected Patient & Security State
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [authEvaluation, setAuthEvaluation] = useState(null);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [emergencyReason, setEmergencyReason] = useState('reasonUnconscious');
  const [emergencyGranted, setEmergencyGranted] = useState(false);
  const [activeTab, setActiveTab] = useState('summary'); // 'summary' | 'history'

  // Filter logic for Patient Search Table
  const filteredPatients = patients.filter(patient => {
    const term = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !term ||
      patient.name?.toLowerCase().includes(term) ||
      patient.patient_id?.toLowerCase().includes(term) ||
      patient.phone?.toLowerCase().includes(term) ||
      patient.village?.toLowerCase().includes(term);

    const matchesVillage = selectedVillage === 'ALL' || patient.village === selectedVillage;

    return matchesSearch && matchesVillage;
  });

  const villages = Array.from(new Set(patients.map(p => p.village).filter(Boolean)));

  // HANDLE PATIENT RECORD ACCESS EVALUATION
  const handleOpenPatientRecord = (patient) => {
    setSelectedPatient(patient);
    setEmergencyGranted(false);
    setShowEmergencyModal(false);
    setActiveTab('summary');

    // Perform Authorization Check
    const evaluation = evaluateAccess({
      user,
      patient,
      requestedDataType: user?.role === 'doctor' ? DATA_TYPES.CLINICAL_FULL : DATA_TYPES.OPERATIONAL
    });

    setAuthEvaluation(evaluation);

    // Audit Log Entry
    logAccessEvent({
      userName: user?.name || 'User',
      userRole: user?.role === 'health_worker' ? 'Health Worker' : user?.role === 'doctor' ? 'Doctor' : user?.role === 'facility_admin' ? 'Facility Admin' : 'District Authority',
      patientId: patient.patient_id,
      action: evaluation.allowed ? `Opened Authorized Record (${evaluation.code})` : `Attempted Record Access (${evaluation.code})`,
      facility: user?.facility_name || 'PHC Mulshi',
      result: evaluation.allowed ? 'AUTHORIZED' : 'DENIED',
      reason: evaluation.reason
    });
  };

  // HANDLE EMERGENCY ACCESS BREAK-GLASS
  const handleGrantEmergencyAccess = () => {
    setEmergencyGranted(true);
    setShowEmergencyModal(false);

    // Log Emergency Access Audit Event
    logAccessEvent({
      userName: user?.name || 'User',
      userRole: user?.role === 'health_worker' ? 'Health Worker' : 'Staff',
      patientId: selectedPatient?.patient_id,
      action: 'GRANTED EMERGENCY BREAK-GLASS ACCESS',
      facility: user?.facility_name || 'PHC Mulshi',
      result: 'AUTHORIZED',
      reason: `Emergency Break-Glass: ${t(emergencyReason)}`
    });
  };

  return (
    <div>
      {/* Header Banner */}
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
            <div style={{ fontSize: '0.8125rem', color: '#F59E0B', fontWeight: '700', textTransform: 'uppercase' }}>
              {t('publicHealthcareDirectory')}
            </div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: '800', marginTop: '0.25rem' }}>
              {t('patientSearchHeaderTitle')}
            </h1>
            <p style={{ fontSize: '0.875rem', color: '#CBD5E1', marginTop: '0.25rem' }}>
              {t('patientSearchSubtitle')}
            </p>
          </div>

          <div>
            <button
              onClick={() => navigate('/health-worker/register')}
              className="gov-btn gov-btn-saffron"
            >
              <PlusCircle size={18} />
              <span>{t('registerNewPatient')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="gov-card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', alignItems: 'center' }}>
          <div style={{ position: 'relative', gridColumn: 'span 2' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
            <input
              type="text"
              placeholder={t('searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="gov-input"
              style={{ paddingLeft: '2.375rem' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Filter size={18} style={{ color: '#64748B' }} />
            <select
              value={selectedVillage}
              onChange={(e) => setSelectedVillage(e.target.value)}
              className="gov-select"
            >
              <option value="ALL">{t('allVillages')} ({villages.length})</option>
              {villages.map(v => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Search Results Table (SHOWING LIMITED IDENTIFICATION INFO ONLY) */}
      <div className="gov-card">
        <div className="gov-card-header">
          <div className="gov-card-title">
            <User size={20} style={{ color: '#0F2C59' }} />
            <span>{t('registeredPatients')} ({filteredPatients.length})</span>
          </div>
          <span style={{ fontSize: '0.8125rem', color: '#64748B' }}>
            {searchTerm ? `${t('showingMatchesFor')} "${searchTerm}"` : t('allActiveRecords')}
          </span>
        </div>

        {filteredPatients.length === 0 ? (
          <div style={{ padding: '3rem 1.5rem', textAlign: 'center', color: '#64748B' }}>
            <User size={48} style={{ margin: '0 auto 1rem', opacity: 0.4 }} />
            <h3 style={{ fontSize: '1.125rem', fontWeight: '700', color: '#0F172A', marginBottom: '0.5rem' }}>
              {t('noPatientsFound')}
            </h3>
            <p style={{ fontSize: '0.875rem', marginBottom: '1.5rem' }}>
              {t('noPatientsSubtitle')}
            </p>
            <button
              onClick={() => navigate('/health-worker/register')}
              className="gov-btn gov-btn-saffron"
            >
              <PlusCircle size={18} />
              <span>{t('registerPatient')}</span>
            </button>
          </div>
        ) : (
          <div className="gov-table-container">
            <table className="gov-table">
              <thead>
                <tr>
                  <th>{t('patientIdHeader')}</th>
                  <th>{t('nameAgeHeader')}</th>
                  <th>{t('genderHeader')}</th>
                  <th>{t('contactPhoneHeader')}</th>
                  <th>{t('villageDistrictHeader')}</th>
                  <th>{t('facilityHeader')}</th>
                  <th>{t('actionsHeader')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredPatients.map((patient) => {
                  const isNewMhId = patient.patient_id?.startsWith('PAT-MH-');
                  return (
                    <tr key={patient.patient_id}>
                      <td style={{ fontWeight: '800', fontFamily: 'monospace', color: '#0F2C59' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                          <span>{patient.patient_id}</span>
                          {isNewMhId && (
                            <span style={{ fontSize: '0.6875rem', backgroundColor: '#FEF3C7', color: '#B45309', padding: '0.125rem 0.375rem', borderRadius: '4px', fontWeight: '700' }}>
                              NEW
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: '700', color: '#0F172A' }}>{patient.name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{patient.age} {t('yearsShort')}</div>
                      </td>
                      <td>{translateGender(patient.gender)}</td>
                      <td>{patient.phone}</td>
                      <td>
                        <div>{patient.village}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{patient.district || 'Pune'}</div>
                      </td>
                      <td style={{ fontSize: '0.8125rem', color: '#475569' }}>
                        {patient.registered_facility_name || 'PHC Mulshi'}
                      </td>
                      <td>
                        <button
                          onClick={() => handleOpenPatientRecord(patient)}
                          className="gov-btn gov-btn-secondary gov-btn-sm"
                          style={{ borderColor: '#CBD5E1' }}
                        >
                          <ShieldCheck size={14} style={{ color: '#0F2C59' }} />
                          <span>{t('viewAuthorizedInformation')}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* AUTHORIZED PATIENT RECORD MODAL */}
      {selectedPatient && authEvaluation && (
        <div className="gov-modal-overlay">
          <div className="gov-modal" style={{ maxWidth: '750px', width: '92%' }}>
            {/* Modal Header */}
            <div className="gov-card-header" style={{ padding: '1.25rem', backgroundColor: '#0F2C59', color: '#ffffff', marginBottom: 0 }}>
              <div className="gov-card-title" style={{ color: '#ffffff' }}>
                <ShieldCheck size={20} style={{ color: '#F59E0B' }} />
                <span>{t('patientHealthRecord')}</span>
              </div>
              <button
                onClick={() => setSelectedPatient(null)}
                style={{ background: 'none', border: 'none', color: '#ffffff', fontSize: '1.25rem', cursor: 'pointer', fontWeight: 'bold' }}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: '1.5rem', maxHeight: '78vh', overflowY: 'auto' }}>
              {/* Patient Basic Identity Banner */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid #E2E8F0' }}>
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0F2C59' }}>{selectedPatient.name}</h2>
                  <p style={{ fontSize: '0.875rem', color: '#64748B' }}>
                    ID: <strong style={{ color: '#0F2C59', fontFamily: 'monospace' }}>{selectedPatient.patient_id}</strong> • {selectedPatient.age} yrs ({selectedPatient.gender})
                  </p>
                </div>
                <StatusBadge status="AVAILABLE" customLabel={t('protectedPatientRecord')} />
              </div>

              {/* SECURITY / AUTHORIZATION STATUS BANNER */}
              {authEvaluation.allowed ? (
                <div style={{ backgroundColor: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: '8px', padding: '1rem', marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <CheckCircle2 size={20} style={{ color: '#059669' }} />
                      <div>
                        <div style={{ fontWeight: '800', color: '#065F46', fontSize: '0.9375rem' }}>
                          ✓ {authEvaluation.code === 'AUTHORIZED_CLINICAL' ? t('clinicalAccessAuthorized') : t('authorizedOperationalAccess')}
                        </div>
                        <div style={{ fontSize: '0.8125rem', color: '#047857', marginTop: '0.125rem' }}>
                          {authEvaluation.reason}
                        </div>
                      </div>
                    </div>

                    {authEvaluation.accessWindow && (
                      <div style={{ backgroundColor: '#ffffff', padding: '0.375rem 0.75rem', borderRadius: '6px', border: '1px solid #6EE7B7', fontSize: '0.75rem', color: '#065F46' }}>
                        <div><strong>{t('accessWindow')}:</strong> {authEvaluation.accessWindow}</div>
                        <div><strong>{t('accessExpires')}:</strong> {authEvaluation.accessExpires}</div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '8px', padding: '1rem', marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Lock size={20} style={{ color: '#DC2626' }} />
                      <div>
                        <div style={{ fontWeight: '800', color: '#991B1B', fontSize: '0.9375rem' }}>
                          🔒 {authEvaluation.code === 'EXPIRED_WINDOW' ? t('accessExpired') : t('accessRestricted')}
                        </div>
                        <div style={{ fontSize: '0.8125rem', color: '#B91C1C', marginTop: '0.125rem' }}>
                          {authEvaluation.reason}
                        </div>
                      </div>
                    </div>

                    {/* Emergency Access Button for Break-Glass Simulation */}
                    {!emergencyGranted && (
                      <button
                        onClick={() => setShowEmergencyModal(true)}
                        className="gov-btn gov-btn-danger gov-btn-sm"
                      >
                        <ShieldAlert size={14} />
                        <span>{t('emergencyAccess')}</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Emergency Access Granted Banner */}
              {emergencyGranted && (
                <div style={{ backgroundColor: '#FEF3C7', border: '1px solid #FDE047', borderRadius: '8px', padding: '0.875rem', marginBottom: '1.25rem', fontSize: '0.8125rem', color: '#78350F' }}>
                  <div style={{ fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.25rem' }}>
                    <AlertTriangle size={16} style={{ color: '#D97706' }} />
                    <span>{t('emergencyAccess')} ACTIVE (SIMULATED BREAK-GLASS)</span>
                  </div>
                  <div>{t('emergencyWarning')}</div>
                </div>
              )}

              {/* Modal Tabs: Summary / Access History */}
              <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid #E2E8F0', marginBottom: '1.25rem' }}>
                <button
                  onClick={() => setActiveTab('summary')}
                  style={{
                    padding: '0.5rem 1rem',
                    border: 'none',
                    borderBottom: activeTab === 'summary' ? '3px solid #0F2C59' : '3px solid transparent',
                    backgroundColor: 'transparent',
                    fontWeight: activeTab === 'summary' ? '700' : '500',
                    color: activeTab === 'summary' ? '#0F2C59' : '#64748B',
                    cursor: 'pointer'
                  }}
                >
                  {t('patientHealthRecord')}
                </button>
                <button
                  onClick={() => setActiveTab('history')}
                  style={{
                    padding: '0.5rem 1rem',
                    border: 'none',
                    borderBottom: activeTab === 'history' ? '3px solid #0F2C59' : '3px solid transparent',
                    backgroundColor: 'transparent',
                    fontWeight: activeTab === 'history' ? '700' : '500',
                    color: activeTab === 'history' ? '#0F2C59' : '#64748B',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.375rem'
                  }}
                >
                  <History size={15} />
                  <span>{t('accessHistory')}</span>
                </button>
              </div>

              {/* TAB 1: SUMMARY / CLINICAL & OPERATIONAL DATA */}
              {activeTab === 'summary' && (
                <div>
                  {/* Basic Contact & Demographics (Operational Information) */}
                  <div style={{ backgroundColor: '#F8FAFC', padding: '1rem', borderRadius: '8px', border: '1px solid #E2E8F0', marginBottom: '1rem' }}>
                    <h4 style={{ fontSize: '0.875rem', fontWeight: '700', color: '#0F2C59', marginBottom: '0.625rem' }}>
                      {t('operationalInformation')}
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.875rem' }}>
                      <div><strong>{t('mobileNumber')}:</strong> {selectedPatient.phone}</div>
                      <div><strong>{t('villageSubLocality')}:</strong> {selectedPatient.village}</div>
                      <div><strong>{t('taluka')}:</strong> {selectedPatient.taluka || 'Mulshi'}</div>
                      <div><strong>{t('districtLabel')}:</strong> {selectedPatient.district || 'Pune'}</div>
                      <div><strong>{t('registeringFacility')}:</strong> {selectedPatient.registered_facility_name || 'PHC Mulshi'}</div>
                      <div><strong>{t('registrationTimestamp')}:</strong> {selectedPatient.registered_at || 'Active Record'}</div>
                    </div>
                  </div>

                  {/* PROTECTED CLINICAL SECTION */}
                  {(authEvaluation.allowed && authEvaluation.code === 'AUTHORIZED_CLINICAL') || emergencyGranted ? (
                    /* AUTHORIZED CLINICAL DATA VIEW */
                    <div style={{ backgroundColor: '#ffffff', padding: '1rem', borderRadius: '8px', border: '1px solid #CBD5E1', marginBottom: '1rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.5rem' }}>
                        <h4 style={{ fontSize: '0.9375rem', fontWeight: '700', color: '#0F2C59', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                          <Stethoscope size={18} style={{ color: '#059669' }} />
                          <span>{t('clinicalInformation')}</span>
                        </h4>
                        <span style={{ fontSize: '0.75rem', backgroundColor: '#DCFCE7', color: '#14532D', padding: '0.125rem 0.5rem', borderRadius: '4px', fontWeight: '700' }}>
                          UNLOCKED
                        </span>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem' }}>
                        <div><strong>{t('bloodGroup')}:</strong> {selectedPatient.medical_info?.blood_group || 'O+'}</div>
                        <div><strong>{t('existingConditions')}:</strong> {selectedPatient.medical_info?.existing_conditions || selectedPatient.triage_reason || 'Hypertension'}</div>
                        <div><strong>{t('allergies')}:</strong> {selectedPatient.medical_info?.allergies || 'No known allergies'}</div>
                        <div><strong>{t('currentMedications')}:</strong> {selectedPatient.medical_info?.current_medications || 'Amlodipine 5mg'}</div>
                        <div><strong>{t('emergencyContactName')}:</strong> {selectedPatient.medical_info?.emergency_contact || 'Sunita Patil'}</div>
                      </div>

                      {/* Mock Diagnostic Reports & Prescriptions */}
                      <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid #E2E8F0' }}>
                        <h5 style={{ fontSize: '0.8125rem', fontWeight: '700', color: '#475569', marginBottom: '0.5rem' }}>
                          {t('documentAccess')} (Mock Diagnostic Reports & Prescriptions)
                        </h5>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem', backgroundColor: '#F8FAFC', borderRadius: '6px', border: '1px solid #E2E8F0', fontSize: '0.8125rem' }}>
                            <div>
                              <strong>Complete Blood Count (CBC) Report</strong>
                              <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Date: 28 Aug 2026 • PHC Mulshi Lab</div>
                            </div>
                            <span style={{ fontSize: '0.75rem', color: '#059669', fontWeight: '700' }}>
                              ✓ {t('authorizedToViewDocument')}
                            </span>
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem', backgroundColor: '#F8FAFC', borderRadius: '6px', border: '1px solid #E2E8F0', fontSize: '0.8125rem' }}>
                            <div>
                              <strong>Digital OPD Prescription (RX-4001)</strong>
                              <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Issued by: Dr. Aniket Deshmukh</div>
                            </div>
                            <span style={{ fontSize: '0.75rem', color: '#059669', fontWeight: '700' }}>
                              ✓ {t('authorizedToViewDocument')}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* RESTRICTED CLINICAL DATA VIEW */
                    <div style={{ backgroundColor: '#F8FAFC', padding: '1.25rem', borderRadius: '8px', border: '1px dashed #CBD5E1', marginBottom: '1rem', textAlign: 'center' }}>
                      <Lock size={32} style={{ color: '#94A3B8', margin: '0 auto 0.5rem' }} />
                      <h4 style={{ fontSize: '0.9375rem', fontWeight: '700', color: '#475569', marginBottom: '0.25rem' }}>
                        🔒 {t('restrictedInformation')}
                      </h4>
                      <p style={{ fontSize: '0.8125rem', color: '#64748B', maxWidth: '400px', margin: '0 auto 0.75rem' }}>
                        {t('clinicalRequiresAuthorization')}
                      </p>

                      {/* Demonstrate Document Upload-Only Concept */}
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#FEF3C7', color: '#78350F', padding: '0.375rem 0.75rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '600' }}>
                        <span>{t('uploadOnly')}:</span>
                        <span>{t('medicalContentViewingRestricted')}</span>
                      </div>
                    </div>
                  )}

                  {/* Security Notice Footer */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: '#059669', backgroundColor: '#ECFDF5', padding: '0.625rem 0.875rem', borderRadius: '6px', border: '1px solid #A7F3D0' }}>
                    <ShieldCheck size={16} />
                    <span>{t('auditLog')}</span>
                  </div>
                </div>
              )}

              {/* TAB 2: ACCESS HISTORY & AUDIT LOG */}
              {activeTab === 'history' && (
                <div>
                  <h4 style={{ fontSize: '0.875rem', fontWeight: '700', color: '#0F2C59', marginBottom: '0.75rem' }}>
                    {t('accessHistory')} ({selectedPatient.patient_id})
                  </h4>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                    {getPatientAuditHistory(selectedPatient.patient_id).map((log) => (
                      <div
                        key={log.id}
                        style={{
                          padding: '0.75rem',
                          borderRadius: '6px',
                          border: '1px solid #E2E8F0',
                          backgroundColor: log.result === 'AUTHORIZED' ? '#F0FDF4' : '#FEF2F2',
                          display: 'flex',
                          justify: 'space-between',
                          alignItems: 'center',
                          fontSize: '0.8125rem'
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: '700', color: '#0F172A' }}>
                            {log.userName} ({log.userRole})
                          </div>
                          <div style={{ color: '#475569', marginTop: '0.125rem' }}>
                            Action: <strong>{log.action}</strong>
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.125rem' }}>
                            {log.timestamp} • Facility: {log.facility}
                          </div>
                        </div>

                        <span
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: '800',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '4px',
                            backgroundColor: log.result === 'AUTHORIZED' ? '#DCFCE7' : '#FEE2E2',
                            color: log.result === 'AUTHORIZED' ? '#14532D' : '#7F1D1D'
                          }}
                        >
                          {log.result}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{ padding: '1rem 1.5rem', backgroundColor: '#F8FAFC', borderTop: '1px solid #E2E8F0', textAlign: 'right' }}>
              <button
                onClick={() => setSelectedPatient(null)}
                className="gov-btn gov-btn-primary gov-btn-sm"
              >
                {t('closeRecord')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BREAK-GLASS EMERGENCY ACCESS REASON SELECTION MODAL */}
      {showEmergencyModal && (
        <div className="gov-modal-overlay">
          <div className="gov-modal" style={{ maxWidth: '520px', width: '90%' }}>
            <div className="gov-card-header" style={{ padding: '1.25rem', backgroundColor: '#991B1B', color: '#ffffff', marginBottom: 0 }}>
              <div className="gov-card-title" style={{ color: '#ffffff' }}>
                <ShieldAlert size={20} />
                <span>{t('emergencyAccess')}</span>
              </div>
              <button
                onClick={() => setShowEmergencyModal(false)}
                style={{ background: 'none', border: 'none', color: '#ffffff', fontSize: '1.25rem', cursor: 'pointer', fontWeight: 'bold' }}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: '1.5rem' }}>
              <div style={{ backgroundColor: '#FEF2F2', padding: '0.875rem', borderRadius: '6px', border: '1px solid #FCA5A5', marginBottom: '1rem', fontSize: '0.8125rem', color: '#991B1B' }}>
                <strong>Warning:</strong> {t('emergencyWarning')}
              </div>

              <label className="gov-label" style={{ marginBottom: '0.5rem', display: 'block' }}>
                {t('selectEmergencyReason')}
              </label>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', marginBottom: '1.5rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="emergencyReason"
                    value="reasonUnconscious"
                    checked={emergencyReason === 'reasonUnconscious'}
                    onChange={(e) => setEmergencyReason(e.target.value)}
                  />
                  <span>{t('reasonUnconscious')}</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="emergencyReason"
                    value="reasonImmediate"
                    checked={emergencyReason === 'reasonImmediate'}
                    onChange={(e) => setEmergencyReason(e.target.value)}
                  />
                  <span>{t('reasonImmediate')}</span>
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setShowEmergencyModal(false)}
                  className="gov-btn gov-btn-secondary"
                >
                  {t('cancel')}
                </button>
                <button
                  type="button"
                  onClick={handleGrantEmergencyAccess}
                  className="gov-btn gov-btn-danger"
                >
                  <span>{t('grantEmergencyAccess')}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
