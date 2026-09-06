import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { StatusBadge } from '../../components/common/StatusBadge';
import { api } from '../../services/api';
import { Pill, AlertTriangle, Building2 } from 'lucide-react';

export const DistrictMedicineStocksPage = () => {
  const { user, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const [facilities, setFacilities] = React.useState([]);
  const [medicines, setMedicines] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    if (authLoading || !user?.user_id) return undefined;
    let cancelled = false;
    const loadMedicineInventory = async () => {
      setLoading(true);
      setError(null);
      try {
        const [facilitiesResult, medicinesResult] = await Promise.all([api.facilities(), api.medicines()]);
        if (!cancelled) {
          setFacilities(Array.isArray(facilitiesResult?.facilities) ? facilitiesResult.facilities : []);
          setMedicines(Array.isArray(medicinesResult?.medicines) ? medicinesResult.medicines : []);
        }
      } catch (requestError) {
        if (!cancelled) {
          setFacilities([]);
          setMedicines([]);
          setError(requestError);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    loadMedicineInventory();
    return () => { cancelled = true; };
  }, [authLoading, user?.user_id, user?.district, user?.jurisdiction]);

  const facilityNames = new Map(facilities.map((facility) => [facility.facility_id, facility.name]));
  const normalizeStatus = (status) => String(status || 'AVAILABLE').replace(/_/g, ' ');
  const districtStockList = medicines.map((medicine) => ({
    facility: medicine.facility_name || facilityNames.get(medicine.facility_id) || medicine.facility_id,
    medicine: medicine.name,
    category: medicine.category || 'Essential Medicine',
    quantity: `${medicine.current_stock ?? 0} ${medicine.unit || 'units'}`,
    status: normalizeStatus(medicine.status),
    lastUpdated: medicine.updated_at ? new Date(medicine.updated_at).toLocaleString() : (medicine.last_updated || 'Not recorded')
  }));
  const lowStockFacilities = new Set(districtStockList.filter((item) => ['LOW', 'LOW STOCK', 'CRITICAL', 'OUT OF STOCK'].includes(item.status)).map((item) => item.facility)).size;
  const outOfStockMeds = districtStockList.filter((item) => item.status === 'OUT OF STOCK').length;
  const criticalAlerts = districtStockList.filter((item) => item.status === 'CRITICAL').length;
  const displayCount = (count) => (loading || error ? '—' : count);

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      <div className="gov-card" style={{ backgroundColor: '#0F2C59', color: '#ffffff', marginBottom: '1.5rem', backgroundImage: 'linear-gradient(135deg, #0F2C59 0%, #1E3A8A 100%)' }}><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}><div><div style={{ color: '#F59E0B', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>{t('districtInventoryHeader')}</div><h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0.25rem 0' }}>{t('districtMedicineTitle')}</h1><p style={{ color: '#CBD5E1', margin: 0, fontSize: '0.875rem' }}>{t('district')}: <strong>{user?.district || user?.jurisdiction || '—'}</strong> • {t('monitoringEssentialStock')}</p></div><StatusBadge status="AVAILABLE" customLabel={t('live_inventory')} /></div></div>

      <div className="grid-stats" style={{ marginBottom: '1.5rem' }}>
        {[[displayCount(lowStockFacilities), t('lowStockFacilities'), '#DC2626', Building2], [displayCount(outOfStockMeds), t('outOfStockMedicines'), '#D97706', Pill], [displayCount(criticalAlerts), t('criticalShortageAlerts'), '#B91C1C', AlertTriangle]].map(([value, label, color, Icon]) => <div className="stat-card" key={label}><div><div className="stat-value" style={{ color }}>{value}</div><div className="stat-label">{label}</div></div><Icon style={{ color }} /></div>)}
      </div>

      <div className="gov-card"><div className="gov-card-header"><div className="gov-card-title"><Pill size={18} /><span>{t('facilityMedicineStatus')}</span></div></div><div style={{ overflowX: 'auto' }}><table className="gov-table"><thead><tr><th>{t('facilityName')}</th><th>{t('medicineCategory')}</th><th>{t('availableQuantity')}</th><th>{t('status')}</th><th>{t('lastUpdated')}</th></tr></thead><tbody>
        {loading && <tr><td colSpan="5" style={{ textAlign: 'center', padding: '1.5rem' }}>Loading medicine inventory...</td></tr>}
        {!loading && error && <tr><td colSpan="5" style={{ textAlign: 'center', padding: '1.5rem', color: '#B91C1C' }}>Unable to load medicine inventory</td></tr>}
        {!loading && !error && districtStockList.length === 0 && <tr><td colSpan="5" style={{ textAlign: 'center', padding: '1.5rem', color: '#64748B' }}>No medicine inventory available</td></tr>}
        {!loading && !error && districtStockList.map((item, index) => <tr key={`${item.facility}-${item.medicine}-${index}`}><td><strong>{item.facility}</strong></td><td><strong>{item.medicine}</strong><br /><small style={{ color: '#64748B' }}>{item.category}</small></td><td><strong>{item.quantity}</strong></td><td><StatusBadge status={item.status} /></td><td style={{ color: '#64748B', fontSize: '0.8125rem' }}>{item.lastUpdated}</td></tr>)}
      </tbody></table></div></div>
    </div>
  );
};
