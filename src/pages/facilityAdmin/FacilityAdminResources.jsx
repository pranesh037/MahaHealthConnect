import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { FacilityAdminAttendancePage } from './FacilityAdminAttendancePage';
import { FacilityAdminBedsEquipmentPage } from './FacilityAdminBedsEquipmentPage';
import { CriticalWorkflowPage } from '../CriticalWorkflowPage';
import { UserCheck, Pill, Building2, Activity } from 'lucide-react';

export const FacilityAdminResources = () => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('attendance');

  const tabs = [
    { id: 'attendance', label: t('attendance'), icon: <UserCheck size={18} /> },
    { id: 'medicines', label: t('medicines'), icon: <Pill size={18} /> },
    { id: 'beds', label: t('bedsAndEquipmentTab'), icon: <Building2 size={18} /> },
    { id: 'diagnostics', label: t('diagnosticCapacity'), icon: <Activity size={18} /> }
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
        {activeTab === 'attendance' && <FacilityAdminAttendancePage />}
        {activeTab === 'medicines' && <CriticalWorkflowPage overrideKey="medicines" />}
        {activeTab === 'beds' && <FacilityAdminBedsEquipmentPage />}
        {activeTab === 'diagnostics' && <CriticalWorkflowPage overrideKey="diagnostics" />}
      </div>
    </div>
  );
};
