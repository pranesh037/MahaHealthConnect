import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { PatientProfilePage } from './PatientProfilePage';
import { PatientMaternalPage } from './PatientMaternalPage';
import { PatientNfcPage } from './PatientNfcPage';
import { CriticalWorkflowPage } from '../CriticalWorkflowPage';
import { UserCheck, FileText, Stethoscope, Baby, Radio } from 'lucide-react';

export const PatientHealthRecord = () => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('profile');

  const tabs = [
    { id: 'profile', label: t('myProfile'), icon: <UserCheck size={18} /> },
    { id: 'prescriptions', label: t('prescriptions'), icon: <FileText size={18} /> },
    { id: 'diagnostics', label: t('diagnostics'), icon: <Stethoscope size={18} /> },
    { id: 'maternal', label: t('maternalHealthcare'), icon: <Baby size={18} /> },
    { id: 'nfc', label: t('nfcCardIdentification'), icon: <Radio size={18} /> }
  ];

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      {/* Sub-Tab Bar */}
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
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.625rem 1rem',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: isActive ? '#0F2C59' : 'transparent',
                color: isActive ? '#ffffff' : '#475569',
                fontWeight: isActive ? 700 : 500,
                fontSize: '0.875rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease-in-out'
              }}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content Rendering */}
      <div>
        {activeTab === 'profile' && <PatientProfilePage />}
        {activeTab === 'prescriptions' && <CriticalWorkflowPage overrideKey="prescription" />}
        {activeTab === 'diagnostics' && <CriticalWorkflowPage overrideKey="diagnostics" />}
        {activeTab === 'maternal' && <PatientMaternalPage />}
        {activeTab === 'nfc' && <PatientNfcPage />}
      </div>
    </div>
  );
};
