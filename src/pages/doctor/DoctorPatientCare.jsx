import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { CriticalWorkflowPage } from '../CriticalWorkflowPage';
import { ShieldCheck, Stethoscope, FileText, Activity, Clock } from 'lucide-react';

export const DoctorPatientCare = () => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('patients');

  const tabs = [
    { id: 'patients', label: t('authorizedPatients'), icon: <ShieldCheck size={18} /> },
    { id: 'history', label: t('consultationMedHistoryTab'), icon: <Stethoscope size={18} /> },
    { id: 'prescription', label: t('prescriptions'), icon: <FileText size={18} /> },
    { id: 'diagnostics', label: t('diagnostics'), icon: <Activity size={18} /> },
    { id: 'followups', label: t('followups'), icon: <Clock size={18} /> }
  ];

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
                whiteSpace: 'nowrap'
              }}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      <div>
        {activeTab === 'patients' && <CriticalWorkflowPage overrideKey="patients" />}
        {activeTab === 'history' && <CriticalWorkflowPage overrideKey="history" />}
        {activeTab === 'prescription' && <CriticalWorkflowPage overrideKey="prescription" />}
        {activeTab === 'diagnostics' && <CriticalWorkflowPage overrideKey="diagnostics" />}
        {activeTab === 'followups' && <CriticalWorkflowPage overrideKey="followups" />}
      </div>
    </div>
  );
};
