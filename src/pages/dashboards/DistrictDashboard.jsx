import React from 'react';
import { Building2, Stethoscope, BedDouble, GitPullRequest, Pill, Activity, ClipboardCheck, Wrench, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { StatusBadge } from '../../components/common/StatusBadge';

const withTimeout = (promise, label) => Promise.race([promise, new Promise((_, reject) => setTimeout(() => reject(new Error(`${label} timed out`)), 15000))]);
const statusOf = (value) => String(value || '').toUpperCase();

export const DistrictDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const [districtData, setDistrictData] = React.useState(null);
  const [selectedFacilityId, setSelectedFacilityId] = React.useState('');
  const [equipment, setEquipment] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    if (authLoading || !user?.user_id) return undefined;
    let cancelled = false;
    const loadDistrict = async () => {
      setLoading(true); setError(null);
      try {
        const [facilitiesResult, referralsResult, medicinesResult, doctorsResult, diagnosticsResult, attendanceResult] = await withTimeout(Promise.all([
          api.facilities(), api.referrals(), api.medicines(), api.doctors(), api.diagnostics(), api.attendance()
        ]), 'District dashboard request');
        if (cancelled) return;
        const facilities = Array.isArray(facilitiesResult?.facilities) ? facilitiesResult.facilities : [];
        const facilityIds = new Set(facilities.map((facility) => facility.facility_id));
        setDistrictData({
          district: `${String(user.district || user.jurisdiction || '').replace(/\s+District$/i, '')} District`,
          facilities,
          referrals: (referralsResult?.referrals || []).filter((referral) => facilityIds.has(referral.referring_facility_id) || facilityIds.has(referral.target_facility_id) || facilityIds.has(referral.destination_facility_id) || facilityIds.has(referral.accepted_facility_id) || (referral.target_hospitals || []).some((target) => facilityIds.has(target?.facility_id))),
          medicines: (medicinesResult?.medicines || []).filter((medicine) => facilityIds.has(medicine.facility_id)),
          doctors: (doctorsResult?.doctors || []).filter((doctor) => facilityIds.has(doctor.facility_id)),
          diagnostics: (diagnosticsResult?.diagnostics || []).filter((diagnostic) => facilityIds.has(diagnostic.facility_id)),
          attendance: (attendanceResult?.attendance || []).filter((record) => facilityIds.has(record.facility_id))
        });
        setSelectedFacilityId((current) => facilities.some((facility) => facility.facility_id === current) ? current : (facilities[0]?.facility_id || ''));
      } catch (requestError) {
        if (!cancelled) { setDistrictData(null); setError(requestError); }
      } finally { if (!cancelled) setLoading(false); }
    };
    loadDistrict();
    return () => { cancelled = true; };
  }, [authLoading, user?.user_id, user?.district, user?.jurisdiction]);

  React.useEffect(() => {
    if (!selectedFacilityId) { setEquipment([]); return undefined; }
    let cancelled = false;
    withTimeout(api.equipment(selectedFacilityId), 'Facility equipment request')
      .then((result) => { if (!cancelled) setEquipment(Array.isArray(result?.equipment) ? result.equipment : []); })
      .catch(() => { if (!cancelled) setEquipment([]); });
    return () => { cancelled = true; };
  }, [selectedFacilityId]);

  const facilities = districtData?.facilities || [];
  const selected = facilities.find((facility) => facility.facility_id === selectedFacilityId) || null;
  const selectedData = selected ? {
    doctors: districtData.doctors.filter((doctor) => doctor.facility_id === selectedFacilityId), medicines: districtData.medicines.filter((medicine) => medicine.facility_id === selectedFacilityId),
    diagnostics: districtData.diagnostics.filter((diagnostic) => diagnostic.facility_id === selectedFacilityId), referrals: districtData.referrals.filter((referral) => [referral.referring_facility_id, referral.target_facility_id, referral.destination_facility_id, referral.accepted_facility_id].includes(selectedFacilityId) || (referral.target_hospitals || []).some((target) => target?.facility_id === selectedFacilityId)),
    attendance: districtData.attendance.filter((record) => record.facility_id === selectedFacilityId)
  } : null;
  const summary = districtData && { facility_count: facilities.length, doctor_count: districtData.doctors.length, available_beds: facilities.reduce((sum, facility) => sum + Number(facility.available_beds || 0), 0), available_icu_beds: facilities.reduce((sum, facility) => sum + Number(facility.available_icu_beds || 0), 0), pending_referrals: districtData.referrals.filter((referral) => ['PENDING', 'SENT'].includes(statusOf(referral.status))).length, medicine_alerts: districtData.medicines.filter((medicine) => ['LOW', 'LOW_STOCK', 'CRITICAL', 'OUT_OF_STOCK'].includes(statusOf(medicine.status))).length, diagnostic_capacity: districtData.diagnostics.reduce((sum, diagnostic) => sum + Number(diagnostic.remaining_capacity || 0), 0), attendance_records: districtData.attendance.length };
  const cards = summary ? [[summary.facility_count, 'Total Healthcare Facilities', Building2], [summary.doctor_count, 'Total Doctors', Stethoscope], [summary.available_beds, 'Available Beds', BedDouble], [summary.available_icu_beds, 'Available ICU Beds', BedDouble], [summary.pending_referrals, 'Pending Referrals', GitPullRequest], [summary.medicine_alerts, 'Medicine Alerts', Pill], [summary.diagnostic_capacity, 'Diagnostic Capacity', Activity], [summary.attendance_records, 'Attendance Records', ClipboardCheck]] : [];

  return <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
    <div className="gov-card" style={{ background: 'linear-gradient(135deg, #0F2C59, #1E3A8A)', color: '#fff', marginBottom: '1.5rem' }}><div style={{ color: '#F59E0B', fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase' }}>District Health Officer Portal</div><h1 style={{ margin: '0.3rem 0', fontSize: '1.5rem' }}>{districtData?.district || 'District Dashboard'}</h1><p style={{ margin: 0, color: '#CBD5E1' }}>{summary ? `Monitoring ${summary.facility_count} Healthcare Facilities` : loading ? 'Loading district data...' : 'District oversight'}</p></div>
    {loading && <div className="gov-card">Loading district dashboard...</div>}
    {error && <div className="gov-card" role="alert" style={{ color: '#B91C1C' }}><AlertTriangle size={18} /> Unable to load district dashboard</div>}
    {!loading && !error && summary && <><div className="grid-stats" style={{ marginBottom: '1.5rem' }}>{cards.map(([value, label, Icon]) => <div className="stat-card" key={label}><div><div className="stat-value">{value}</div><div className="stat-label">{label}</div></div><Icon /></div>)}</div>{facilities.length === 0 ? <div className="gov-card">No facilities available for this district.</div> : <><div className="gov-card" style={{ marginBottom: '1.5rem' }}><label htmlFor="dho-facility" style={{ display: 'block', fontWeight: 700, marginBottom: '0.5rem' }}>Facility inspection</label><select id="dho-facility" className="gov-select" value={selectedFacilityId} onChange={(event) => setSelectedFacilityId(event.target.value)}>{facilities.map((facility) => <option key={facility.facility_id} value={facility.facility_id}>{facility.name} ({facility.facility_id})</option>)}</select></div>{selected && <div className="gov-card"><div className="gov-card-header"><div className="gov-card-title"><Building2 size={18} /><span>{selected.name} — facility details</span></div><StatusBadge status={selected.status} /></div><div className="grid-stats">{[[selected.available_beds, 'Available Beds', BedDouble], [selected.available_icu_beds, 'Available ICU Beds', BedDouble], [selectedData.doctors.length, 'Doctors', Stethoscope], [selectedData.medicines.length, 'Medicine Lines', Pill], [selectedData.diagnostics.length, 'Diagnostics', Activity], [equipment.length, 'Equipment', Wrench], [selectedData.referrals.length, 'Referrals', GitPullRequest], [selectedData.attendance.length, 'Attendance Records', ClipboardCheck]].map(([value, label, Icon]) => <div className="stat-card" key={label}><div><div className="stat-value">{value}</div><div className="stat-label">{label}</div></div><Icon /></div>)}</div></div>}</>}</>}
  </div>;
};
