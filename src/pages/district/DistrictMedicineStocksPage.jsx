import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { StatusBadge } from '../../components/common/StatusBadge';
import { MOCK_MEDICINES, MOCK_FACILITIES } from '../../mockData';
import {
  Pill,
  AlertTriangle,
  Building2
} from 'lucide-react';

export const DistrictMedicineStocksPage = () => {
  const { user } = useAuth();
  const { t } = useLanguage();

  const districtStockList = [
    { facility: 'PHC Mulshi', medicine: 'Iron Folic Acid (IFA) Red', category: 'Maternal Supplement', quantity: '120 tablets', status: 'CRITICAL', last_updated: 'Today, 08:00 AM' },
    { facility: 'PHC Mulshi', medicine: 'Amlodipine 5mg', category: 'Antihypertensive', quantity: '420 tablets', status: 'LOW', last_updated: 'Today, 08:00 AM' },
    { facility: 'BHC Haveli', medicine: 'Metformin 500mg SR', category: 'Antidiabetic', quantity: '1,800 tablets', status: 'AVAILABLE', last_updated: 'Today, 08:00 AM' },
    { facility: 'District Hospital Aundh', medicine: 'Paracetamol 500mg', category: 'Analgesic', quantity: '3,500 tablets', status: 'AVAILABLE', last_updated: 'Today, 08:00 AM' },
    { facility: 'Sub-District Hospital Baramati', medicine: 'Oral Rehydration Salts (ORS)', category: 'Electrolyte', quantity: '640 sachets', status: 'AVAILABLE', last_updated: 'Today, 08:00 AM' },
    { facility: 'PHC Paud', medicine: 'Oxytocin 5 IU Injections', category: 'Maternal Emergency', quantity: '0 ampoules', status: 'OUT OF STOCK', last_updated: 'Yesterday, 06:00 PM' }
  ];

  const lowStockFacilities = 2;
  const outOfStockMeds = 1;
  const criticalAlerts = 2;

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
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
              {t('districtInventoryHeader')}
            </div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0.25rem 0' }}>
              {t('districtMedicineTitle')}
            </h1>
            <p style={{ color: '#CBD5E1', margin: 0, fontSize: '0.875rem' }}>
              {t('district')}: <strong>Pune District</strong> • {t('monitoringEssentialStock')}
            </p>
          </div>
          <StatusBadge status="AVAILABLE" customLabel={t('live_inventory')} />
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid-stats" style={{ marginBottom: '1.5rem' }}>
        <div className="stat-card">
          <div>
            <div className="stat-value" style={{ color: '#DC2626' }}>{lowStockFacilities}</div>
            <div className="stat-label">{t('lowStockFacilities')}</div>
          </div>
          <Building2 style={{ color: '#DC2626' }} />
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-value" style={{ color: '#D97706' }}>{outOfStockMeds}</div>
            <div className="stat-label">{t('outOfStockMedicines')}</div>
          </div>
          <Pill style={{ color: '#D97706' }} />
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-value" style={{ color: '#B91C1C' }}>{criticalAlerts}</div>
            <div className="stat-label">{t('criticalShortageAlerts')}</div>
          </div>
          <AlertTriangle style={{ color: '#B91C1C' }} />
        </div>
      </div>

      {/* District Medicine Availability Dashboard Table */}
      <div className="gov-card">
        <div className="gov-card-header">
          <div className="gov-card-title">
            <Pill size={18} />
            <span>{t('facilityMedicineStatus')}</span>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="gov-table">
            <thead>
              <tr>
                <th>{t('facilityName')}</th>
                <th>{t('medicineCategory')}</th>
                <th>{t('availableQuantity')}</th>
                <th>{t('status')}</th>
                <th>{t('lastUpdated')}</th>
              </tr>
            </thead>
            <tbody>
              {districtStockList.map((item, idx) => (
                <tr key={idx}>
                  <td><strong>{item.facility}</strong></td>
                  <td>
                    <strong>{item.medicine}</strong><br />
                    <small style={{ color: '#64748B' }}>{item.category}</small>
                  </td>
                  <td><strong>{item.quantity}</strong></td>
                  <td><StatusBadge status={item.status} /></td>
                  <td style={{ color: '#64748B', fontSize: '0.8125rem' }}>{item.last_updated}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
