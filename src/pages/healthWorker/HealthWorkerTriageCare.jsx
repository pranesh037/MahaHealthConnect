import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { DigitalTriage } from './DigitalTriage';
import { HealthWorkerMaternalPage } from './HealthWorkerMaternalPage';
import { CriticalWorkflowPage } from '../CriticalWorkflowPage';
import { Activity, Baby, Clock } from 'lucide-react';

export const HealthWorkerTriageCare = () => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('triage');

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
          onClick={() => setActiveTab('triage')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.625rem 1rem',
            borderRadius: '6px',
            border: 'none',
            backgroundColor: activeTab === 'triage' ? '#0F2C59' : 'transparent',
            color: activeTab === 'triage' ? '#ffffff' : '#475569',
            fontWeight: activeTab === 'triage' ? 700 : 500,
            fontSize: '0.875rem',
            cursor: 'pointer',
            whiteSpace: 'nowrap'
          }}
        >
          <Activity size={18} />
          <span>{t('digitalTriageEngineTab')}</span>
        </button>

        <button
          onClick={() => setActiveTab('maternal')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.625rem 1rem',
            borderRadius: '6px',
            border: 'none',
            backgroundColor: activeTab === 'maternal' ? '#0F2C59' : 'transparent',
            color: activeTab === 'maternal' ? '#ffffff' : '#475569',
            fontWeight: activeTab === 'maternal' ? 700 : 500,
            fontSize: '0.875rem',
            cursor: 'pointer',
            whiteSpace: 'nowrap'
          }}
        >
          <Baby size={18} />
          <span>{t('maternalAncCareTab')}</span>
        </button>

        <button
          onClick={() => setActiveTab('followups')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.625rem 1rem',
            borderRadius: '6px',
            border: 'none',
            backgroundColor: activeTab === 'followups' ? '#0F2C59' : 'transparent',
            color: activeTab === 'followups' ? '#ffffff' : '#475569',
            fontWeight: activeTab === 'followups' ? 700 : 500,
            fontSize: '0.875rem',
            cursor: 'pointer',
            whiteSpace: 'nowrap'
          }}
        >
          <Clock size={18} />
          <span>{t('followupRegisterTab')}</span>
        </button>
      </div>

      <div>
        {activeTab === 'triage' && <DigitalTriage />}
        {activeTab === 'maternal' && <HealthWorkerMaternalPage />}
        {activeTab === 'followups' && <CriticalWorkflowPage overrideKey="followups" />}
      </div>
    </div>
  );
};
