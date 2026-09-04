import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { CriticalWorkflowPage } from '../CriticalWorkflowPage';
import { GitPullRequest, Clock } from 'lucide-react';

export const PatientReferralsCare = () => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('referrals');

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      <div
        className="gov-card"
        style={{
          marginBottom: '1rem',
          padding: '0.5rem',
          display: 'flex',
          gap: '0.5rem',
          backgroundColor: '#F8FAFC',
          border: '1px solid #E2E8F0'
        }}
      >
        <button
          onClick={() => setActiveTab('referrals')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.625rem 1rem',
            borderRadius: '6px',
            border: 'none',
            backgroundColor: activeTab === 'referrals' ? '#0F2C59' : 'transparent',
            color: activeTab === 'referrals' ? '#ffffff' : '#475569',
            fontWeight: activeTab === 'referrals' ? 700 : 500,
            fontSize: '0.875rem',
            cursor: 'pointer'
          }}
        >
          <GitPullRequest size={18} />
          <span>{t('referralStatus')}</span>
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
            cursor: 'pointer'
          }}
        >
          <Clock size={18} />
          <span>{t('followups')}</span>
        </button>
      </div>

      <div>
        {activeTab === 'referrals' && <CriticalWorkflowPage overrideKey="referrals" />}
        {activeTab === 'followups' && <CriticalWorkflowPage overrideKey="followups" />}
      </div>
    </div>
  );
};
