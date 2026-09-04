import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { DistrictReferralAnalyticsPage } from './DistrictReferralAnalyticsPage';
import { DistrictMedicineStocksPage } from './DistrictMedicineStocksPage';
import { DistrictDiagnosticCapacityPage } from './DistrictDiagnosticCapacityPage';
import { DistrictSpecialistDistributionPage } from './DistrictSpecialistDistributionPage';
import { CriticalWorkflowPage } from '../CriticalWorkflowPage';
import { Building2, GitPullRequest, Pill, Activity, Stethoscope } from 'lucide-react';

export const DistrictNetwork = () => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('facilities');

  const tabs = [
    { id: 'facilities', label: t('facilitiesLabel'), icon: <Building2 size={18} /> },
    { id: 'referrals', label: t('referralAnalytics'), icon: <GitPullRequest size={18} /> },
    { id: 'medicines', label: t('medicineStocks'), icon: <Pill size={18} /> },
    { id: 'diagnostics', label: t('diagnosticCapacities'), icon: <Activity size={18} /> },
    { id: 'specialists', label: t('specialistDistribution'), icon: <Stethoscope size={18} /> }
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
        {activeTab === 'facilities' && <CriticalWorkflowPage overrideKey="facilities" />}
        {activeTab === 'referrals' && <DistrictReferralAnalyticsPage />}
        {activeTab === 'medicines' && <DistrictMedicineStocksPage />}
        {activeTab === 'diagnostics' && <DistrictDiagnosticCapacityPage />}
        {activeTab === 'specialists' && <DistrictSpecialistDistributionPage />}
      </div>
    </div>
  );
};
