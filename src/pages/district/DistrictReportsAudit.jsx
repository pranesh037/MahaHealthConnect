import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { SupportingWorkflowPage } from '../SupportingWorkflowPage';
import { CriticalWorkflowPage } from '../CriticalWorkflowPage';
import { BarChart3, ShieldCheck } from 'lucide-react';

export const DistrictReportsAudit = () => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('quality');

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
          onClick={() => setActiveTab('quality')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.625rem 1rem',
            borderRadius: '6px',
            border: 'none',
            backgroundColor: activeTab === 'quality' ? '#0F2C59' : 'transparent',
            color: activeTab === 'quality' ? '#ffffff' : '#475569',
            fontWeight: activeTab === 'quality' ? 700 : 500,
            fontSize: '0.875rem',
            cursor: 'pointer'
          }}
        >
          <BarChart3 size={18} />
          <span>{t('qualityMonitoringTab')}</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.625rem 1rem',
            borderRadius: '6px',
            border: 'none',
            backgroundColor: activeTab === 'audit' ? '#0F2C59' : 'transparent',
            color: activeTab === 'audit' ? '#ffffff' : '#475569',
            fontWeight: activeTab === 'audit' ? 700 : 500,
            fontSize: '0.875rem',
            cursor: 'pointer'
          }}
        >
          <ShieldCheck size={18} />
          <span>{t('securityAuditLogs')}</span>
        </button>
      </div>

      <div>
        {activeTab === 'quality' && <SupportingWorkflowPage overrideKey="quality" />}
        {activeTab === 'audit' && <CriticalWorkflowPage overrideKey="audit-logs" />}
      </div>
    </div>
  );
};
