import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { usePatients } from '../../context/PatientContext';
import { useLanguage } from '../../context/LanguageContext';
import { useOffline } from '../../context/OfflineContext';
import { useAudit } from '../../context/AuditContext';
import { StatusBadge } from '../../components/common/StatusBadge';
import { evaluateAccess, DATA_TYPES } from '../../utils/authorization';
import { evaluateTriageRules, IMMEDIATE_DANGER_KEYS } from '../../utils/triageRules';
import { api } from '../../services/api';
import {
  Activity,
  Search,
  User,
  ShieldCheck,
  Lock,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ChevronDown,
  ChevronUp,
  FileText,
  Building2,
  Heart,
  Thermometer,
  Wifi,
  RefreshCw,
  PlusCircle,
  ArrowRight,
  Info,
  Check
} from 'lucide-react';

const STORAGE_KEY = 'maha_health_connect_triage_history';

const INITIAL_TRIAGE_HISTORY = [
  {
    triage_id: "TRG-9001",
    patient_id: "PAT-MH-000128",
    patient_name: "Ramesh Tukaram Patil",
    date: "28 Aug 2026, 10:42 AM",
    priority: "EMERGENCY",
    indicators: ["Severe breathing difficulty"],
    health_worker: "Sunita Shinde (HW)",
    facility: "PHC Mulshi",
    status: "COMPLETED",
    syncStatus: "SYNCED"
  },
  {
    triage_id: "TRG-9002",
    patient_id: "PAT-10245",
    patient_name: "Ramesh Tukaram Patil",
    date: "27 Aug 2026, 02:15 PM",
    priority: "HIGH",
    indicators: ["Fever + Uncontrolled Blood Pressure (145/92)"],
    health_worker: "Sunita Shinde (HW)",
    facility: "PHC Mulshi",
    status: "COMPLETED",
    syncStatus: "SYNCED"
  }
];

export const DigitalTriage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { patients } = usePatients();
  const { t } = useLanguage();
  const { isOnline, pendingSyncCount, triggerSync, isSyncing, addPendingRecord } = useOffline();
  const { logAccessEvent } = useAudit();

  // Patient Selection
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(patients[0] || null);
  const [authResult, setAuthResult] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    immediateDanger: {
      severeBreathingDifficulty: false,
      severeChestDiscomfort: false,
      lossOfConsciousness: false,
      severeBleeding: false,
      seriousInjury: false,
      seizure: false,
      otherImmediateDanger: false
    },
    symptoms: {
      fever: false,
      cough: false,
      breathingDifficulty: false,
      pain: false,
      vomiting: false,
      diarrhea: false,
      weakness: false,
      dizziness: false,
      otherSymptomsText: ''
    },
    vitals: {
      temp: '',
      pulse: '',
      bp: '',
      respRate: '',
      spo2: ''
    },
    context: {
      pregnancyConcern: false,
      recentInjury: false,
      chronicCondition: false,
      medicationConcern: false,
      recentHospitalization: false,
      otherNotes: ''
    }
  });

  // Triage Results & UI State
  const [evaluationResult, setEvaluationResult] = useState(null);
  const [showReasonDetails, setShowReasonDetails] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [savedResultCard, setSavedResultCard] = useState(null);

  // History State
  const [triageHistory, setTriageHistory] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load triage history:', e);
    }
    return INITIAL_TRIAGE_HISTORY;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(triageHistory));
    } catch (e) {
      console.error('Failed to save triage history:', e);
    }
  }, [triageHistory]);

  // Evaluate Authorization on Patient Select
  useEffect(() => {
    if (selectedPatient) {
      const auth = evaluateAccess({
        user,
        patient: selectedPatient,
        requestedDataType: DATA_TYPES.OPERATIONAL
      });
      setAuthResult(auth);
    } else {
      setAuthResult(null);
    }
  }, [selectedPatient, user]);

  // Recalculate Triage Rules on Form Change
  useEffect(() => {
    const result = evaluateTriageRules(formData);
    setEvaluationResult(result);
  }, [formData]);

  // Form Handlers
  const handleImmediateChange = (key) => {
    setFormData(prev => ({
      ...prev,
      immediateDanger: {
        ...prev.immediateDanger,
        [key]: !prev.immediateDanger[key]
      }
    }));
  };

  const handleSymptomChange = (key) => {
    setFormData(prev => ({
      ...prev,
      symptoms: {
        ...prev.symptoms,
        [key]: !prev.symptoms[key]
      }
    }));
  };

  const handleVitalsChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      vitals: {
        ...prev.vitals,
        [name]: value
      }
    }));
  };

  const handleContextChange = (key) => {
    setFormData(prev => ({
      ...prev,
      context: {
        ...prev.context,
        [key]: !prev.context[key]
      }
    }));
  };

  // Submit & Save Triage
  const handleConfirmAndSaveTriage = async () => {
    if (!selectedPatient) return;

    const now = new Date();
    const formattedDate = now.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }) + ', ' + now.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    const newRecord = {
      triage_id: `TRG-${Date.now().toString().slice(-5)}`,
      patient_id: selectedPatient.patient_id,
      patient_name: selectedPatient.name,
      date: formattedDate,
      priority: evaluationResult.priority,
      statusLabel: evaluationResult.statusLabel,
      color: evaluationResult.color,
      reasonSummary: evaluationResult.reasonSummary,
      indicators: evaluationResult.triggeredIndicators,
      health_worker: `${user?.name || 'Sunita Shinde'} (HW)`,
      facility: user?.facility_name || 'PHC Mulshi',
      status: 'COMPLETED',
      syncStatus: isOnline ? 'SYNCED' : 'PENDING SYNC'
    };

    if (isOnline && localStorage.getItem('mhc_access_token')) {
      try {
        await api.saveTriage({
          patient_id: selectedPatient.patient_id,
          priority: evaluationResult.priority,
          indicators: evaluationResult.triggeredIndicators,
          vitals: formData.vitals,
          reason: evaluationResult.reasonSummary
        });
      } catch {
        newRecord.syncStatus = 'PENDING SYNC';
        addPendingRecord(`Triage Record (${selectedPatient.patient_id})`);
      }
    } else if (!isOnline) {
      addPendingRecord(`Triage Record (${selectedPatient.patient_id})`);
    }

    setTriageHistory(prev => [newRecord, ...prev]);
    setSavedResultCard(newRecord);
    setShowReviewModal(false);

    // Audit Log Entry
    logAccessEvent({
      userName: user?.name || 'Sunita Shinde',
      userRole: 'Health Worker',
      patientId: selectedPatient.patient_id,
      action: `Completed Digital Triage (${evaluationResult.priority})`,
      facility: user?.facility_name || 'PHC Mulshi',
      result: 'COMPLETED',
      reason: evaluationResult.reasonSummary
    });
  };

  // Filtered patients for dropdown search
  const searchedPatients = patients.filter(p => {
    const term = searchTerm.toLowerCase().trim();
    return (
      !term ||
      p.name?.toLowerCase().includes(term) ||
      p.patient_id?.toLowerCase().includes(term) ||
      p.phone?.includes(term)
    );
  });

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
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
              {t('gov_dept')}
            </div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: '800', marginTop: '0.25rem' }}>
              {t('digitalTriageTitle')}
            </h1>
            <p style={{ fontSize: '0.875rem', color: '#CBD5E1', marginTop: '0.25rem' }}>
              {t('digitalTriageSubtitle')}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <StatusBadge status={isOnline ? 'ONLINE' : 'OFFLINE'} />
            {!isOnline && (
              <span style={{ fontSize: '0.75rem', backgroundColor: '#FEF3C7', color: '#78350F', padding: '0.25rem 0.5rem', borderRadius: '4px', fontWeight: '700' }}>
                {t('offlineMode')}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* CLINICAL DISCLAIMER NOTICE */}
      <div
        className="gov-card"
        style={{
          backgroundColor: '#FFFBEB',
          borderColor: '#FDE047',
          marginBottom: '1.5rem',
          padding: '0.875rem 1.25rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <Info size={20} style={{ color: '#D97706', flexShrink: 0 }} />
          <div style={{ fontSize: '0.84375rem', color: '#92400E', fontWeight: '500' }}>
            {t('clinicalDisclaimer')}
          </div>
        </div>
      </div>

      {/* 1. SELECT PATIENT FOR TRIAGE */}
      <div className="gov-card" style={{ marginBottom: '1.5rem' }}>
        <div className="gov-card-header">
          <div className="gov-card-title">
            <User size={20} style={{ color: '#0F2C59' }} />
            <span>{t('selectPatientForTriage')}</span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', alignItems: 'center' }}>
          {/* Patient Dropdown Search */}
          <div style={{ position: 'relative' }}>
            <label className="gov-label">{t('patientSearchBtn')}</label>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
              <select
                value={selectedPatient?.patient_id || ''}
                onChange={(e) => {
                  const pt = patients.find(p => p.patient_id === e.target.value);
                  if (pt) setSelectedPatient(pt);
                }}
                className="gov-select"
                style={{ paddingLeft: '2.25rem' }}
              >
                {patients.map(p => (
                  <option key={p.patient_id} value={p.patient_id}>
                    {p.name} ({p.patient_id}) - {p.village}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Selected Patient Identity Card */}
          {selectedPatient && (
            <div style={{ backgroundColor: '#F8FAFC', padding: '0.875rem 1rem', borderRadius: '8px', border: '1px solid #CBD5E1' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>Selected Patient</div>
              <div style={{ fontSize: '1rem', fontWeight: '800', color: '#0F2C59' }}>{selectedPatient.name}</div>
              <div style={{ fontSize: '0.8125rem', color: '#475569' }}>
                ID: <strong style={{ fontFamily: 'monospace' }}>{selectedPatient.patient_id}</strong> • {selectedPatient.age} yrs ({selectedPatient.gender}) • {selectedPatient.village}
              </div>
            </div>
          )}

          {/* Authorization Check Indicator */}
          {authResult && (
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>Authorization Status</div>
              {authResult.allowed ? (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', color: '#059669', fontWeight: '700', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                  <CheckCircle2 size={18} />
                  <span>✓ {t('authorizedForTriage')}</span>
                </div>
              ) : (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', color: '#DC2626', fontWeight: '700', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                  <Lock size={18} />
                  <span>🔒 {t('triageAccessRestricted')}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* IF ACCESS RESTRICTED */}
      {authResult && !authResult.allowed ? (
        <div className="gov-card" style={{ backgroundColor: '#FEF2F2', borderColor: '#FCA5A5', padding: '2rem', textAlign: 'center', color: '#991B1B' }}>
          <Lock size={48} style={{ margin: '0 auto 1rem', color: '#DC2626' }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '0.5rem' }}>
            🔒 {t('triageAccessRestricted')}
          </h3>
          <p style={{ fontSize: '0.9375rem', color: '#B91C1C', maxWidth: '500px', margin: '0 auto' }}>
            {t('triageRestrictedMessage')}
          </p>
        </div>
      ) : (
        /* AUTHORIZED TRIAGE WORKFLOW */
        <div>
          {/* TRIAGE FORM */}
          <form onSubmit={(e) => { e.preventDefault(); setShowReviewModal(true); }}>
            {/* SECTION A: IMMEDIATE PRIORITY INDICATORS */}
            <div className="gov-card" style={{ marginBottom: '1.5rem', borderLeft: '4px solid #DC2626' }}>
              <div className="gov-card-header">
                <div className="gov-card-title" style={{ color: '#991B1B' }}>
                  <AlertTriangle size={20} style={{ color: '#DC2626' }} />
                  <span>{t('sectionAImmediateTitle')}</span>
                </div>
                <span style={{ fontSize: '0.75rem', fontWeight: '700', backgroundColor: '#FEE2E2', color: '#991B1B', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
                  EMERGENCY RED FLAGS
                </span>
              </div>

              <p style={{ fontSize: '0.84375rem', color: '#475569', marginBottom: '1rem' }}>
                Select any immediate danger indicator observed during initial patient intake:
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.875rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.75rem', backgroundColor: formData.immediateDanger.severeBreathingDifficulty ? '#FEE2E2' : '#F8FAFC', borderRadius: '6px', border: '1px solid #CBD5E1', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.immediateDanger.severeBreathingDifficulty}
                    onChange={() => handleImmediateChange('severeBreathingDifficulty')}
                    style={{ width: '18px', height: '18px', accentColor: '#DC2626' }}
                  />
                  <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#0F172A' }}>{t('severeBreathingDifficulty')}</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.75rem', backgroundColor: formData.immediateDanger.severeChestDiscomfort ? '#FEE2E2' : '#F8FAFC', borderRadius: '6px', border: '1px solid #CBD5E1', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.immediateDanger.severeChestDiscomfort}
                    onChange={() => handleImmediateChange('severeChestDiscomfort')}
                    style={{ width: '18px', height: '18px', accentColor: '#DC2626' }}
                  />
                  <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#0F172A' }}>{t('severeChestDiscomfort')}</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.75rem', backgroundColor: formData.immediateDanger.lossOfConsciousness ? '#FEE2E2' : '#F8FAFC', borderRadius: '6px', border: '1px solid #CBD5E1', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.immediateDanger.lossOfConsciousness}
                    onChange={() => handleImmediateChange('lossOfConsciousness')}
                    style={{ width: '18px', height: '18px', accentColor: '#DC2626' }}
                  />
                  <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#0F172A' }}>{t('lossOfConsciousness')}</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.75rem', backgroundColor: formData.immediateDanger.severeBleeding ? '#FEE2E2' : '#F8FAFC', borderRadius: '6px', border: '1px solid #CBD5E1', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.immediateDanger.severeBleeding}
                    onChange={() => handleImmediateChange('severeBleeding')}
                    style={{ width: '18px', height: '18px', accentColor: '#DC2626' }}
                  />
                  <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#0F172A' }}>{t('severeBleeding')}</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.75rem', backgroundColor: formData.immediateDanger.seriousInjury ? '#FEE2E2' : '#F8FAFC', borderRadius: '6px', border: '1px solid #CBD5E1', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.immediateDanger.seriousInjury}
                    onChange={() => handleImmediateChange('seriousInjury')}
                    style={{ width: '18px', height: '18px', accentColor: '#DC2626' }}
                  />
                  <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#0F172A' }}>{t('seriousInjury')}</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.75rem', backgroundColor: formData.immediateDanger.seizure ? '#FEE2E2' : '#F8FAFC', borderRadius: '6px', border: '1px solid #CBD5E1', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.immediateDanger.seizure}
                    onChange={() => handleImmediateChange('seizure')}
                    style={{ width: '18px', height: '18px', accentColor: '#DC2626' }}
                  />
                  <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#0F172A' }}>{t('seizure')}</span>
                </label>
              </div>
            </div>

            {/* SECTION B: GENERAL SYMPTOMS */}
            <div className="gov-card" style={{ marginBottom: '1.5rem' }}>
              <div className="gov-card-header">
                <div className="gov-card-title">
                  <Activity size={20} style={{ color: '#0F2C59' }} />
                  <span>{t('sectionBGeneralTitle')}</span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
                {['fever', 'cough', 'breathingDifficulty', 'pain', 'vomiting', 'diarrhea', 'weakness', 'dizziness'].map((symKey) => (
                  <label key={symKey} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formData.symptoms[symKey]}
                      onChange={() => handleSymptomChange(symKey)}
                      style={{ width: '16px', height: '16px', accentColor: '#0F2C59' }}
                    />
                    <span>{t(symKey)}</span>
                  </label>
                ))}
              </div>

              <div className="gov-form-group">
                <label className="gov-label">{t('otherSymptoms')}</label>
                <textarea
                  rows={2}
                  placeholder="Describe any additional reported symptoms..."
                  value={formData.symptoms.otherSymptomsText}
                  onChange={(e) => setFormData(prev => ({ ...prev, symptoms: { ...prev.symptoms, otherSymptomsText: e.target.value } }))}
                  className="gov-textarea"
                />
              </div>
            </div>

            {/* SECTION C: BASIC OBSERVATIONS (RECORDED VITALS) */}
            <div className="gov-card" style={{ marginBottom: '1.5rem' }}>
              <div className="gov-card-header">
                <div className="gov-card-title">
                  <Thermometer size={20} style={{ color: '#0F2C59' }} />
                  <span>{t('sectionCObservationsTitle')}</span>
                </div>
                <span style={{ fontSize: '0.75rem', color: '#64748B' }}>OPTIONAL RECORDED VALUES</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                <div className="gov-form-group">
                  <label className="gov-label">{t('temperature')}</label>
                  <input
                    type="text"
                    name="temp"
                    placeholder="e.g. 98.6"
                    value={formData.vitals.temp}
                    onChange={handleVitalsChange}
                    className="gov-input"
                  />
                </div>

                <div className="gov-form-group">
                  <label className="gov-label">{t('pulse')}</label>
                  <input
                    type="text"
                    name="pulse"
                    placeholder="e.g. 78"
                    value={formData.vitals.pulse}
                    onChange={handleVitalsChange}
                    className="gov-input"
                  />
                </div>

                <div className="gov-form-group">
                  <label className="gov-label">{t('bloodPressure')}</label>
                  <input
                    type="text"
                    name="bp"
                    placeholder="e.g. 120/80"
                    value={formData.vitals.bp}
                    onChange={handleVitalsChange}
                    className="gov-input"
                  />
                </div>

                <div className="gov-form-group">
                  <label className="gov-label">{t('oxygenSaturation')}</label>
                  <input
                    type="text"
                    name="spo2"
                    placeholder="e.g. 98"
                    value={formData.vitals.spo2}
                    onChange={handleVitalsChange}
                    className="gov-input"
                  />
                </div>
              </div>
            </div>

            {/* SECTION D: ADDITIONAL CONTEXT */}
            <div className="gov-card" style={{ marginBottom: '1.5rem' }}>
              <div className="gov-card-header">
                <div className="gov-card-title">
                  <FileText size={20} style={{ color: '#0F2C59' }} />
                  <span>{t('sectionDContextTitle')}</span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
                {['pregnancyConcern', 'recentInjury', 'chronicCondition', 'medicationConcern', 'recentHospitalization'].map((ctxKey) => (
                  <label key={ctxKey} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formData.context[ctxKey]}
                      onChange={() => handleContextChange(ctxKey)}
                      style={{ width: '16px', height: '16px', accentColor: '#0F2C59' }}
                    />
                    <span>{t(ctxKey)}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* LIVE REAL-TIME RULE-BASED TRIAGE PREVIEW CARD */}
            {evaluationResult && (
              <div
                className="gov-card"
                style={{
                  backgroundColor: evaluationResult.bgColor,
                  borderColor: evaluationResult.borderColor,
                  marginBottom: '1.5rem',
                  padding: '1.25rem'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {t('ruleBasedAssessment')}
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: '900', color: evaluationResult.color, marginTop: '0.125rem' }}>
                      {evaluationResult.priority === 'EMERGENCY' ? '🔴 ' : evaluationResult.priority === 'HIGH' ? '🟠 ' : '🟢 '}
                      {evaluationResult.statusLabel}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowReasonDetails(!showReasonDetails)}
                    className="gov-btn gov-btn-secondary gov-btn-sm"
                  >
                    <span>{t('viewTriageReason')}</span>
                    {showReasonDetails ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                </div>

                {showReasonDetails && (
                  <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(0,0,0,0.1)', fontSize: '0.84375rem', color: '#334155' }}>
                    <strong>Rule Reason:</strong> {evaluationResult.reasonSummary}
                    <div style={{ marginTop: '0.375rem' }}>
                      <strong>Recommended Pathway:</strong> {evaluationResult.guidance}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* FORM SUBMISSION ACTIONS */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginBottom: '2rem' }}>
              <button
                type="button"
                onClick={() => navigate('/health-worker')}
                className="gov-btn gov-btn-secondary"
              >
                {t('cancel')}
              </button>

              <button
                type="submit"
                className="gov-btn gov-btn-saffron"
                style={{ padding: '0.75rem 2rem', fontSize: '1rem' }}
              >
                <Activity size={20} />
                <span>{t('reviewAssessment')}</span>
              </button>
            </div>
          </form>

          {/* REVIEW ASSESSMENT MODAL */}
          {showReviewModal && evaluationResult && (
            <div className="gov-modal-overlay">
              <div className="gov-modal" style={{ maxWidth: '650px', width: '92%' }}>
                <div className="gov-card-header" style={{ padding: '1.25rem', backgroundColor: '#0F2C59', color: '#ffffff', marginBottom: 0 }}>
                  <div className="gov-card-title" style={{ color: '#ffffff' }}>
                    <Activity size={20} />
                    <span>{t('reviewAssessment')}</span>
                  </div>
                  <button
                    onClick={() => setShowReviewModal(false)}
                    style={{ background: 'none', border: 'none', color: '#ffffff', fontSize: '1.25rem', cursor: 'pointer', fontWeight: 'bold' }}
                  >
                    ✕
                  </button>
                </div>

                <div style={{ padding: '1.5rem', maxHeight: '75vh', overflowY: 'auto' }}>
                  <div style={{ backgroundColor: evaluationResult.bgColor, border: `1px solid ${evaluationResult.borderColor}`, padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>
                      {t('ruleBasedAssessment')}
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: '900', color: evaluationResult.color, marginTop: '0.125rem' }}>
                      {evaluationResult.priority === 'EMERGENCY' ? '🔴 ' : evaluationResult.priority === 'HIGH' ? '🟠 ' : '🟢 '}
                      {evaluationResult.statusLabel}
                    </div>
                    <div style={{ fontSize: '0.84375rem', color: '#334155', marginTop: '0.375rem' }}>
                      <strong>Reason:</strong> {evaluationResult.reasonSummary}
                    </div>
                  </div>

                  <div style={{ fontSize: '0.875rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div><strong>Patient:</strong> {selectedPatient.name} ({selectedPatient.patient_id})</div>
                    <div><strong>Facility:</strong> {user?.facility_name || 'PHC Mulshi'}</div>
                    <div><strong>Health Worker:</strong> {user?.name || 'Sunita Shinde'}</div>
                    <div>
                      <strong>Triggered Indicators:</strong>
                      <ul style={{ paddingLeft: '1.25rem', marginTop: '0.25rem', color: '#475569' }}>
                        {evaluationResult.triggeredIndicators.map((ind, idx) => (
                          <li key={idx}>{ind}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                <div style={{ padding: '1rem 1.5rem', backgroundColor: '#F8FAFC', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                  <button
                    onClick={() => setShowReviewModal(false)}
                    className="gov-btn gov-btn-secondary"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    onClick={handleConfirmAndSaveTriage}
                    className="gov-btn gov-btn-saffron"
                  >
                    <Check size={18} />
                    <span>{t('confirmAndSave')}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* COMPLETED TRIAGE RESULT CARD */}
          {savedResultCard && (
            <div className="gov-card" style={{ marginBottom: '2rem', border: `2px solid ${savedResultCard.color || '#0F2C59'}` }}>
              <div className="gov-card-header" style={{ backgroundColor: '#F8FAFC' }}>
                <div className="gov-card-title">
                  <CheckCircle2 size={22} style={{ color: '#059669' }} />
                  <span>{t('triageResultTitle')}</span>
                </div>
                <StatusBadge status={savedResultCard.syncStatus === 'SYNCED' ? 'AVAILABLE' : 'PENDING'} customLabel={savedResultCard.syncStatus} />
              </div>

              <div style={{ padding: '1rem 0' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
                  <div style={{ backgroundColor: '#F8FAFC', padding: '0.875rem', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748B' }}>PATIENT</div>
                    <div style={{ fontSize: '1rem', fontWeight: '800', color: '#0F2C59' }}>{savedResultCard.patient_name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748B', fontFamily: 'monospace' }}>{savedResultCard.patient_id}</div>
                  </div>

                  <div style={{ backgroundColor: '#F8FAFC', padding: '0.875rem', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748B' }}>TRIAGE PRIORITY</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: '900', color: savedResultCard.color }}>
                      {savedResultCard.priority === 'EMERGENCY' ? '🔴 ' : savedResultCard.priority === 'HIGH' ? '🟠 ' : '🟢 '}
                      {savedResultCard.statusLabel || savedResultCard.priority}
                    </div>
                  </div>

                  <div style={{ backgroundColor: '#F8FAFC', padding: '0.875rem', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748B' }}>ASSESSMENT TIME</div>
                    <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#334155' }}>{savedResultCard.date}</div>
                  </div>
                </div>

                <div style={{ backgroundColor: '#EFF6FF', padding: '0.875rem', borderRadius: '6px', border: '1px solid #BFDBFE', marginBottom: '1.25rem', fontSize: '0.84375rem', color: '#1E40AF' }}>
                  <strong>{t('recommendedWorkflow')}:</strong> {savedResultCard.reasonSummary}
                </div>

                {/* Workflow Navigation Buttons */}
                <div style={{ display: 'flex', gap: '0.875rem', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => navigate('/health-worker/referrals')}
                    className="gov-btn gov-btn-saffron"
                  >
                    <span>{t('createReferralBtn')}</span>
                    <ArrowRight size={16} />
                  </button>

                  <button
                    onClick={() => setSavedResultCard(null)}
                    className="gov-btn gov-btn-secondary"
                  >
                    <span>Start New Triage</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TRIAGE HISTORY TABLE */}
          <div className="gov-card" style={{ marginTop: '2rem' }}>
            <div className="gov-card-header">
              <div className="gov-card-title">
                <Clock size={20} style={{ color: '#0F2C59' }} />
                <span>{t('triageHistoryTitle')} ({selectedPatient?.patient_id})</span>
              </div>
            </div>

            <div className="gov-table-container">
              <table className="gov-table">
                <thead>
                  <tr>
                    <th>Date & Time</th>
                    <th>Priority</th>
                    <th>Key Indicators</th>
                    <th>Health Worker</th>
                    <th>Facility</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {triageHistory
                    .filter(h => !selectedPatient || h.patient_id === selectedPatient.patient_id || h.patient_id === 'PAT-MH-000128')
                    .map((h) => (
                      <tr key={h.triage_id}>
                        <td style={{ fontSize: '0.8125rem', fontWeight: '600' }}>{h.date}</td>
                        <td style={{ fontWeight: '800' }}>
                          <span style={{ color: h.priority === 'EMERGENCY' ? '#DC2626' : h.priority === 'HIGH' ? '#D97706' : '#059669' }}>
                            {h.priority === 'EMERGENCY' ? '🔴 EMERGENCY' : h.priority === 'HIGH' ? '🟠 HIGH' : '🟢 NORMAL'}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.8125rem', color: '#475569' }}>
                          {Array.isArray(h.indicators) ? h.indicators.join(', ') : h.indicators}
                        </td>
                        <td style={{ fontSize: '0.8125rem' }}>{h.health_worker}</td>
                        <td style={{ fontSize: '0.8125rem' }}>{h.facility}</td>
                        <td>
                          <StatusBadge status={h.syncStatus === 'SYNCED' ? 'AVAILABLE' : 'PENDING'} customLabel={h.syncStatus || 'COMPLETED'} />
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
