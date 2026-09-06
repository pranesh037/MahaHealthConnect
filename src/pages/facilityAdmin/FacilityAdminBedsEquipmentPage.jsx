import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { api } from '../../services/api';
import { Building2, Activity, ShieldCheck, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';

export const FacilityAdminBedsEquipmentPage = () => {
  const { user } = useAuth();
  const { t, translateStatus } = useLanguage();

  const [facility, setFacility] = useState(null);
  const [equipmentList, setEquipmentList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Form states
  const [totalBeds, setTotalBeds] = useState(0);
  const [occupiedBeds, setOccupiedBeds] = useState(0);
  const [icuBeds, setIcuBeds] = useState(0);
  const [availableIcuBeds, setAvailableIcuBeds] = useState(0);
  const [facilityStatus, setFacilityStatus] = useState('AVAILABLE');
  const [specialtiesStr, setSpecialtiesStr] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [facsRes, eqRes] = await Promise.allSettled([
        api.facilities(),
        api.equipment(user?.facility_id)
      ]);

      if (facsRes.status === 'fulfilled' && Array.isArray(facsRes.value?.facilities)) {
        const myFac = facsRes.value.facilities.find((f) => f.facility_id === user?.facility_id);
        if (myFac) {
          setFacility(myFac);
          const active = myFac.active_beds ?? myFac.bed_capacity ?? 12;
          const occupied = myFac.occupied_beds ?? Math.max(0, active - (myFac.available_beds ?? 0));
          setTotalBeds(active);
          setOccupiedBeds(occupied);
          setIcuBeds(myFac.icu_beds ?? 0);
          setAvailableIcuBeds(myFac.available_icu_beds ?? 0);
          setFacilityStatus(myFac.status || 'AVAILABLE');
          setSpecialtiesStr(Array.isArray(myFac.specialties) ? myFac.specialties.join(', ') : '');
        }
      }

      if (eqRes.status === 'fulfilled') {
        const eqData = eqRes.value?.equipment || (Array.isArray(eqRes.value) ? eqRes.value : []);
        setEquipmentList(eqData);
      }
    } catch (err) {
      setError(err.message || 'Failed to load bed & equipment resources');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.facility_id) {
      loadData();
    }
  }, [user]);

  const handleTotalChange = (val) => {
    const newTotal = Math.max(0, Number(val));
    setTotalBeds(newTotal);
    if (occupiedBeds > newTotal) {
      setOccupiedBeds(newTotal);
    }
  };

  const handleOccupiedChange = (val) => {
    const newOcc = Math.max(0, Number(val));
    setOccupiedBeds(Math.min(totalBeds, newOcc));
  };

  const calculatedAvailableBeds = Math.max(0, totalBeds - occupiedBeds);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');
    try {
      const payload = {
        active_beds: totalBeds,
        occupied_beds: occupiedBeds,
        available_beds: calculatedAvailableBeds,
        icu_beds: icuBeds,
        available_icu_beds: Math.min(icuBeds, availableIcuBeds),
        status: facilityStatus,
        specialties: specialtiesStr.split(',').map((s) => s.trim()).filter(Boolean)
      };

      await api.updateFacilityResources(user?.facility_id, payload);
      setMessage(t('savedSuccessfully') || 'Facility bed & equipment resources updated successfully.');
      setTimeout(() => setMessage(''), 4000);
      await loadData();
    } catch (err) {
      setError(err.message || 'Failed to update facility resources');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="gov-card" style={{ textAlign: 'center', padding: '2rem' }}>
        <RefreshCw size={24} className="spin" style={{ color: '#0F2C59' }} />
        <p style={{ marginTop: '0.5rem', color: '#64748B' }}>{t('loadingRecords') || 'Loading beds & equipment data...'}</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Header Notification */}
      {message && (
        <div className="gov-card" role="status" style={{ color: '#065F46', backgroundColor: '#ECFDF5', borderColor: '#10B981' }}>
          <CheckCircle2 size={18} /> {message}
        </div>
      )}
      {error && (
        <div className="gov-card" role="alert" style={{ color: '#991B1B', backgroundColor: '#FEF2F2', borderColor: '#EF4444' }}>
          <AlertTriangle size={18} /> {error}
        </div>
      )}

      {/* Bed & ICU Stat Cards */}
      <div className="grid-stats">
        <div className="stat-card" style={{ borderLeft: '4px solid #1E40AF' }}>
          <div>
            <div className="stat-value" style={{ color: '#1E40AF' }}>
              {calculatedAvailableBeds} / {totalBeds}
            </div>
            <div className="stat-label">{t('availableBeds') || 'Available Beds / Total'}</div>
          </div>
          <Building2 size={24} style={{ color: '#1E40AF' }} />
        </div>

        <div className="stat-card" style={{ borderLeft: '4px solid #D97706' }}>
          <div>
            <div className="stat-value" style={{ color: '#D97706' }}>
              {occupiedBeds}
            </div>
            <div className="stat-label">{t('occupiedBeds') || 'Occupied Beds'}</div>
          </div>
          <Activity size={24} style={{ color: '#D97706' }} />
        </div>

        <div className="stat-card" style={{ borderLeft: '4px solid #059669' }}>
          <div>
            <div className="stat-value" style={{ color: '#059669' }}>
              {availableIcuBeds} / {icuBeds}
            </div>
            <div className="stat-label">{t('icuBeds') || 'ICU Beds (Avail / Total)'}</div>
          </div>
          <ShieldCheck size={24} style={{ color: '#059669' }} />
        </div>
      </div>

      {/* Bed & Capacity Management Form */}
      <div className="gov-card">
        <div className="gov-card-header">
          <div className="gov-card-title">
            <Building2 size={20} />
            <span>{t('bedsAndEquipmentTab') || 'Beds & Capacity Management'} ({user?.facility_id})</span>
          </div>
        </div>

        <form onSubmit={handleSave}>
          <div className="grid-stats" style={{ marginBottom: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontWeight: '700', fontSize: '0.875rem', marginBottom: '0.375rem', color: '#0F172A' }}>
                {t('totalBeds') || 'Total Beds (Capacity)'}
              </label>
              <input
                type="number"
                min="0"
                className="gov-input"
                value={totalBeds}
                onChange={(e) => handleTotalChange(e.target.value)}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: '700', fontSize: '0.875rem', marginBottom: '0.375rem', color: '#0F172A' }}>
                {t('occupiedBeds') || 'Occupied Beds'}
              </label>
              <input
                type="number"
                min="0"
                max={totalBeds}
                className="gov-input"
                value={occupiedBeds}
                onChange={(e) => handleOccupiedChange(e.target.value)}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: '700', fontSize: '0.875rem', marginBottom: '0.375rem', color: '#0F172A' }}>
                {t('availableBeds') || 'Available Beds (Calculated)'}
              </label>
              <input
                type="number"
                className="gov-input"
                value={calculatedAvailableBeds}
                readOnly
                disabled
                style={{ backgroundColor: '#F1F5F9', fontWeight: '800', color: '#059669' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: '700', fontSize: '0.875rem', marginBottom: '0.375rem', color: '#0F172A' }}>
                {t('totalIcuBeds') || 'Total ICU Beds'}
              </label>
              <input
                type="number"
                min="0"
                className="gov-input"
                value={icuBeds}
                onChange={(e) => setIcuBeds(Math.max(0, Number(e.target.value)))}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: '700', fontSize: '0.875rem', marginBottom: '0.375rem', color: '#0F172A' }}>
                {t('availableIcuBeds') || 'Available ICU Beds'}
              </label>
              <input
                type="number"
                min="0"
                max={icuBeds}
                className="gov-input"
                value={availableIcuBeds}
                onChange={(e) => setAvailableIcuBeds(Math.max(0, Number(e.target.value)))}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: '700', fontSize: '0.875rem', marginBottom: '0.375rem', color: '#0F172A' }}>
                {t('facilityStatus') || 'Facility Operational Status'}
              </label>
              <select
                className="gov-select"
                value={facilityStatus}
                onChange={(e) => setFacilityStatus(e.target.value)}
              >
                <option value="AVAILABLE">{translateStatus('AVAILABLE')}</option>
                <option value="LIMITED">{translateStatus('LIMITED')}</option>
                <option value="CRITICAL_CAPACITY">{translateStatus('CRITICAL_CAPACITY')}</option>
              </select>
            </div>
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontWeight: '700', fontSize: '0.875rem', marginBottom: '0.375rem', color: '#0F172A' }}>
              Specialties & Clinical Services Offered
            </label>
            <input
              type="text"
              className="gov-input"
              value={specialtiesStr}
              onChange={(e) => setSpecialtiesStr(e.target.value)}
              placeholder="General Medicine, Cardiology, Obstetrics, Emergency ICU"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="gov-btn gov-btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Activity size={16} />
            <span>{saving ? (t('saving') || 'Saving...') : (t('saveResourceChanges') || 'Save Bed & Resource Changes')}</span>
          </button>
        </form>
      </div>

      {/* Equipment Inventory Table */}
      <div className="gov-card">
        <div className="gov-card-header">
          <div className="gov-card-title">
            <Activity size={20} />
            <span>{t('equipment') || 'Equipment & Machinery Inventory'} ({equipmentList.length})</span>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="gov-table">
            <thead>
              <tr>
                <th>Equipment ID</th>
                <th>Equipment Name</th>
                <th>Category</th>
                <th>Quantity</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {equipmentList.length > 0 ? (
                equipmentList.map((eq) => (
                  <tr key={eq.equipment_id}>
                    <td style={{ fontFamily: 'monospace', fontWeight: '700', color: '#0F2C59' }}>{eq.equipment_id}</td>
                    <td><strong>{eq.name}</strong></td>
                    <td>{eq.category || 'Diagnostic'}</td>
                    <td>{eq.available_quantity ?? 1}</td>
                    <td>
                      <span
                        style={{
                          padding: '0.25rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: '700',
                          backgroundColor: eq.status === 'AVAILABLE' || eq.status === 'Operational' ? '#DCFCE7' : '#FEF2F2',
                          color: eq.status === 'AVAILABLE' || eq.status === 'Operational' ? '#166534' : '#991B1B'
                        }}
                      >
                        {eq.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '1.25rem', color: '#64748B', fontStyle: 'italic' }}>
                    No equipment records found for this facility.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
