import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { PatientSearch } from './PatientSearch';
import { PatientRegistration } from './PatientRegistration';
import { HealthWorkerDocumentsPage } from './HealthWorkerDocumentsPage';
import { Search, PlusCircle, FileText } from 'lucide-react';

export const HealthWorkerPatients = () => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('search');

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      <div
        className="gov-card"
        style={{
          marginBottom: '1rem',
          padding: '0.5rem',
          display: 'flex',
          gap: '0.5rem',
          overflowX: 'auto',
          backgroundColor: '#F8FAFC',
          border: '1px solid #E2E8F0'
        }}
      >
        <button
          onClick={() => setActiveTab('search')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.625rem 1rem',
            borderRadius: '6px',
            border: 'none',
            backgroundColor: activeTab === 'search' ? '#0F2C59' : 'transparent',
            color: activeTab === 'search' ? '#ffffff' : '#475569',
            fontWeight: activeTab === 'search' ? 700 : 500,
            fontSize: '0.875rem',
            cursor: 'pointer',
            whiteSpace: 'nowrap'
          }}
        >
          <Search size={18} />
          <span>{t('patientSearchAndDir')}</span>
        </button>

        <button
          onClick={() => setActiveTab('register')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.625rem 1rem',
            borderRadius: '6px',
            border: 'none',
            backgroundColor: activeTab === 'register' ? '#0F2C59' : 'transparent',
            color: activeTab === 'register' ? '#ffffff' : '#475569',
            fontWeight: activeTab === 'register' ? 700 : 500,
            fontSize: '0.875rem',
            cursor: 'pointer',
            whiteSpace: 'nowrap'
          }}
        >
          <PlusCircle size={18} />
          <span>{t('registerNewPatientTab')}</span>
        </button>

        <button
          onClick={() => setActiveTab('documents')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.625rem 1rem',
            borderRadius: '6px',
            border: 'none',
            backgroundColor: activeTab === 'documents' ? '#0F2C59' : 'transparent',
            color: activeTab === 'documents' ? '#ffffff' : '#475569',
            fontWeight: activeTab === 'documents' ? 700 : 500,
            fontSize: '0.875rem',
            cursor: 'pointer',
            whiteSpace: 'nowrap'
          }}
        >
          <FileText size={18} />
          <span>{t('documentVaultTab')}</span>
        </button>
      </div>

      <div>
        {activeTab === 'search' && <PatientSearch />}
        {activeTab === 'register' && <PatientRegistration />}
        {activeTab === 'documents' && <HealthWorkerDocumentsPage />}
      </div>
    </div>
  );
};
