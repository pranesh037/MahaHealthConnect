import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { usePatients } from '../../context/PatientContext';
import { StatusBadge } from '../../components/common/StatusBadge';
import {
  Radio,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  CreditCard,
  Lock
} from 'lucide-react';

export const PatientNfcPage = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { patients } = usePatients();

  const [scanning, setScanning] = useState(false);
  const [scannedPatient, setScannedPatient] = useState(null);
  const [scanMessage, setScanMessage] = useState('');

  const targetPatient = patients.find((p) => p.patient_id === user?.patient_id) || patients[0] || {
    patient_id: 'PAT-10245',
    name: 'Ramesh Tukaram Patil',
    age: 48,
    gender: 'Male',
    village: 'Mulshi Gaon',
    district: 'Pune',
    nfc_token: 'NFC-PAT-10245-MH',
    blood_group: 'O+',
    registered_at: '2026-08-29'
  };

  const handleScan = () => {
    setScanning(true);
    setScannedPatient(null);
    setScanMessage(t('simulatingNfc'));

    setTimeout(() => {
      setScanning(false);
      setScannedPatient(targetPatient);
      setScanMessage(t('scanMessageSuccess'));
    }, 1200);
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      {/* Banner */}
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
              {t('nfcHeaderTitle')}
            </div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0.25rem 0' }}>
              {t('nfcCardIdentification')}
            </h1>
            <p style={{ color: '#CBD5E1', margin: 0, fontSize: '0.875rem' }}>
              {t('simulatedNfcSub')}
            </p>
          </div>
          <StatusBadge status="AVAILABLE" customLabel={t('demo_nfc_scanner')} />
        </div>
      </div>

      {/* Notice Banner */}
      <div
        style={{
          padding: '0.875rem 1.25rem',
          backgroundColor: '#FEF3C7',
          border: '1px solid #F59E0B',
          borderRadius: '8px',
          marginBottom: '1.5rem',
          color: '#92400E',
          fontSize: '0.875rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}
      >
        <AlertCircle size={20} style={{ color: '#D97706', flexShrink: 0 }} />
        <div>
          <strong>{t('demoNfcNotice')}:</strong> {t('demoNfcNoticeSub')}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
        {/* Simulated NFC Physical Card Render */}
        <div className="gov-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div className="gov-card-header" style={{ width: '100%' }}>
            <div className="gov-card-title">
              <CreditCard size={18} />
              <span>{t('smartHealthCard')}</span>
            </div>
            <Lock size={16} style={{ color: '#059669' }} />
          </div>

          {/* Realistic Card Graphic */}
          <div
            style={{
              width: '100%',
              maxWidth: '360px',
              height: '210px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #0F2C59 0%, #1E3A8A 50%, #3B82F6 100%)',
              color: '#ffffff',
              padding: '1.25rem',
              boxShadow: '0 10px 25px rgba(15, 44, 89, 0.3)',
              position: 'relative',
              margin: '1rem 0',
              display: 'flex',
              flexDirection: 'column',
              justify: 'space-between',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: '0.6875rem', color: '#F59E0B', fontWeight: 800, letterSpacing: '0.05em' }}>
                  GOVT OF MAHARASHTRA • MHC HEALTH CARD
                </div>
                <div style={{ fontSize: '1rem', fontWeight: 800, marginTop: '0.25rem' }}>
                  {targetPatient.name}
                </div>
              </div>
              <Radio size={28} style={{ color: '#F59E0B' }} />
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', color: '#93C5FD' }}>{t('nfcTokenLabel')}</div>
              <div style={{ fontSize: '1.125rem', fontWeight: 800, fontFamily: 'monospace', letterSpacing: '0.08em' }}>
                {targetPatient.nfc_token || 'NFC-PAT-10245-MH'}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', fontSize: '0.75rem', color: '#CBD5E1' }}>
              <div>{t('patientId')}: <strong style={{ color: '#fff' }}>{targetPatient.patient_id}</strong></div>
              <div>{t('district')}: <strong style={{ color: '#fff' }}>PUNE</strong></div>
            </div>
          </div>

          <button
            className="gov-btn gov-btn-saffron"
            style={{ width: '100%', marginTop: '1rem', padding: '0.875rem', fontSize: '1rem', justifyContent: 'center' }}
            onClick={handleScan}
            disabled={scanning}
          >
            {scanning ? (
              <>
                <RefreshCw size={18} className="animate-spin" />
                <span>{t('simulatingNfc')}</span>
              </>
            ) : (
              <>
                <Radio size={18} />
                <span>{t('scanNfcBtn')}</span>
              </>
            )}
          </button>
        </div>

        {/* Scan Results & Patient Details */}
        <div className="gov-card">
          <div className="gov-card-header">
            <div className="gov-card-title">
              <UserCheck size={18} />
              <span>{t('scannedIdentityOutput')}</span>
            </div>
            {scannedPatient && <StatusBadge status="VERIFIED" customLabel={t('identified')} />}
          </div>

          {scanning && (
            <div style={{ padding: '2.5rem', textAlign: 'center' }}>
              <RefreshCw size={36} style={{ color: '#1E40AF', animation: 'spin 1s linear infinite' }} />
              <p style={{ marginTop: '1rem', color: '#1E40AF', fontWeight: 700 }}>{t('simulatingNfc')}</p>
            </div>
          )}

          {scanMessage && !scanning && (
            <div
              style={{
                padding: '0.75rem 1rem',
                backgroundColor: scannedPatient ? '#ECFDF5' : '#F8FAFC',
                border: `1px solid ${scannedPatient ? '#A7F3D0' : '#E2E8F0'}`,
                borderRadius: '8px',
                marginBottom: '1rem',
                color: scannedPatient ? '#065F46' : '#475569',
                fontSize: '0.875rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <CheckCircle2 size={18} style={{ color: '#059669' }} />
              {scanMessage}
            </div>
          )}

          {scannedPatient ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', fontSize: '0.875rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid #E2E8F0' }}>
                <span style={{ color: '#64748B' }}>{t('patientId')}:</span>
                <strong style={{ fontFamily: 'monospace', fontSize: '1rem', color: '#0F2C59' }}>{scannedPatient.patient_id}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid #E2E8F0' }}>
                <span style={{ color: '#64748B' }}>{t('name')}:</span>
                <strong>{scannedPatient.name}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid #E2E8F0' }}>
                <span style={{ color: '#64748B' }}>{t('ageGender')}:</span>
                <strong>{scannedPatient.age} {t('yearsShort')} / {scannedPatient.gender}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid #E2E8F0' }}>
                <span style={{ color: '#64748B' }}>{t('location')}:</span>
                <strong>{scannedPatient.village}, {scannedPatient.district}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748B' }}>{t('status')}:</span>
                <strong style={{ color: '#059669' }}>Encrypted NFC Token</strong>
              </div>
            </div>
          ) : (
            !scanning && (
              <div style={{ padding: '3rem 1.5rem', textAlign: 'center', color: '#64748B' }}>
                <Radio size={48} style={{ color: '#CBD5E1', marginBottom: '0.75rem' }} />
                <p style={{ fontWeight: 600, margin: 0 }}>{t('noNfcScannedYet')}</p>
                <p style={{ fontSize: '0.8125rem', marginTop: '0.25rem' }}>{t('scanInstruction')}</p>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};
