import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { StatusBadge } from '../../components/common/StatusBadge';
import { api } from '../../services/api';
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle
} from 'lucide-react';

export const DistrictDiagnosticCapacityPage = () => {
  const { user } = useAuth();
  const { t, translateDiagnostic } = useLanguage();

  const [facilities, setFacilities] = React.useState([]);

  React.useEffect(() => {
    let mounted = true;
    api.facilities().then((res) => {
      if (mounted && Array.isArray(res?.facilities)) setFacilities(res.facilities);
    }).catch(console.error);
    return () => { mounted = false; };
  }, []);

  const diagnosticMatrix = facilities.map((fac) => {
    const diag = fac.diagnostics || {};
    return {
      facility: fac.name,
      x_ray: diag.x_ray || 'AVAILABLE',
      ecg: diag.ecg || 'AVAILABLE',
      ct: diag.ct_scan || (fac.type === 'District Hospital' ? 'AVAILABLE' : 'UNAVAILABLE'),
      blood_test: diag.blood_test || 'AVAILABLE',
      ultrasound: diag.ultrasound || (fac.type === 'PHC' ? 'UNAVAILABLE' : 'AVAILABLE')
    };
  });

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
              {t('districtDiagnosticsHeader')}
            </div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0.25rem 0' }}>
              {t('diagnosticCapacityTitle')}
            </h1>
            <p style={{ color: '#CBD5E1', margin: 0, fontSize: '0.875rem' }}>
              {t('districtDiagnosticsSub')}
            </p>
          </div>
          <StatusBadge status="AVAILABLE" customLabel={t('diagnostic_matrix')} />
        </div>
      </div>

      {/* Capacity Summary Cards */}
      <div className="grid-stats" style={{ marginBottom: '1.5rem' }}>
        <div className="stat-card">
          <div>
            <div className="stat-value" style={{ color: '#059669' }}>2 {t('facilities')}</div>
            <div className="stat-label">{t('fullDiagnosticCapacity')}</div>
          </div>
          <CheckCircle2 style={{ color: '#059669' }} />
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-value" style={{ color: '#D97706' }}>2 {t('facilities')}</div>
            <div className="stat-label">{t('limitedServiceCapacity')}</div>
          </div>
          <AlertTriangle style={{ color: '#D97706' }} />
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-value" style={{ color: '#DC2626' }}>1 PHC</div>
            <div className="stat-label">{t('unavailableAdvancedScans')}</div>
          </div>
          <XCircle style={{ color: '#DC2626' }} />
        </div>
      </div>

      {/* Diagnostic Service Matrix Table */}
      <div className="gov-card">
        <div className="gov-card-header">
          <div className="gov-card-title">
            <Activity size={18} />
            <span>{t('serviceAvailabilityMatrix')}</span>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="gov-table">
            <thead>
              <tr>
                <th>{t('facilityName')}</th>
                <th>{translateDiagnostic('X-Ray')}</th>
                <th>{translateDiagnostic('ECG')}</th>
                <th>{translateDiagnostic('CT Scan')}</th>
                <th>{translateDiagnostic('Blood Test')}</th>
                <th>{translateDiagnostic('Ultrasound')}</th>
              </tr>
            </thead>
            <tbody>
              {diagnosticMatrix.map((row, idx) => (
                <tr key={idx}>
                  <td><strong>{row.facility}</strong></td>
                  <td><StatusBadge status={row.x_ray} /></td>
                  <td><StatusBadge status={row.ecg} /></td>
                  <td><StatusBadge status={row.ct} /></td>
                  <td><StatusBadge status={row.blood_test} /></td>
                  <td><StatusBadge status={row.ultrasound} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
