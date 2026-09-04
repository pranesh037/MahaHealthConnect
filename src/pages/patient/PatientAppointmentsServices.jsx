import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { CriticalWorkflowPage } from '../CriticalWorkflowPage';
import { Calendar, Search } from 'lucide-react';

export const PatientAppointmentsServices = () => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('appointments');

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
          onClick={() => setActiveTab('appointments')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.625rem 1rem',
            borderRadius: '6px',
            border: 'none',
            backgroundColor: activeTab === 'appointments' ? '#0F2C59' : 'transparent',
            color: activeTab === 'appointments' ? '#ffffff' : '#475569',
            fontWeight: activeTab === 'appointments' ? 700 : 500,
            fontSize: '0.875rem',
            cursor: 'pointer'
          }}
        >
          <Calendar size={18} />
          <span>{t('appointments')}</span>
        </button>

        <button
          onClick={() => setActiveTab('services')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.625rem 1rem',
            borderRadius: '6px',
            border: 'none',
            backgroundColor: activeTab === 'services' ? '#0F2C59' : 'transparent',
            color: activeTab === 'services' ? '#ffffff' : '#475569',
            fontWeight: activeTab === 'services' ? 700 : 500,
            fontSize: '0.875rem',
            cursor: 'pointer'
          }}
        >
          <Search size={18} />
          <span>{t('smartFacilityFinderTab')}</span>
        </button>
      </div>

      <div>
        {activeTab === 'appointments' && <CriticalWorkflowPage overrideKey="appointments" />}
        {activeTab === 'services' && <CriticalWorkflowPage overrideKey="services" />}
      </div>
    </div>
  );
};
