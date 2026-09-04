import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { StatusBadge } from '../../components/common/StatusBadge';
import {
  UserCheck,
  Clock,
  CheckCircle2,
  Users,
  UserX
} from 'lucide-react';

export const FacilityAdminAttendancePage = () => {
  const { user } = useAuth();
  const { t } = useLanguage();

  const initialStaff = [
    { id: 1, name: 'Sunita Laxman Shinde', role: 'Senior Health Worker / ANM', check_in: '08:15 AM', check_out: '—', status: 'PRESENT' },
    { id: 2, name: 'Dr. Aniket Deshmukh', role: 'Cardiologist (OPD Head)', check_in: '09:00 AM', check_out: '—', status: 'PRESENT' },
    { id: 3, name: 'Rajesh S. Pawar', role: 'Chief Facility Admin', check_in: '08:30 AM', check_out: '—', status: 'PRESENT' },
    { id: 4, name: 'Dr. Priyamvada Joshi', role: 'Obstetrics & Gynecology', check_in: '—', check_out: '—', status: 'ON LEAVE' },
    { id: 5, name: 'Mahesh K. Patil', role: 'Senior Lab Technician', check_in: '09:45 AM', check_out: '—', status: 'LATE' },
    { id: 6, name: 'Kavita Waghmare', role: 'Staff Nurse (ICU)', check_in: '—', check_out: '—', status: 'ABSENT' }
  ];

  const [staff, setStaff] = useState(() => {
    const saved = localStorage.getItem('mhc_attendance');
    if (saved) return JSON.parse(saved);
    return initialStaff;
  });

  const [message, setMessage] = useState('');

  const markPresent = (id) => {
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const updated = staff.map((person) => {
      if (person.id === id) {
        return { ...person, status: 'PRESENT', check_in: now };
      }
      return person;
    });

    setStaff(updated);
    localStorage.setItem('mhc_attendance', JSON.stringify(updated));
    const target = staff.find((s) => s.id === id);
    setMessage(`${t('attendanceUpdated')} (${target?.name} - ${now})`);
  };

  const presentCount = staff.filter((s) => s.status === 'PRESENT' || s.status === 'LATE').length;
  const absentCount = staff.filter((s) => s.status === 'ABSENT').length;
  const leaveCount = staff.filter((s) => s.status === 'ON LEAVE').length;

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      {/* Page Header */}
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
              {t('facilityOpsHeader')}
            </div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0.25rem 0' }}>
              {t('staffAttendanceTitle')}
            </h1>
            <p style={{ color: '#CBD5E1', margin: 0, fontSize: '0.875rem' }}>
              {t('facility')}: <strong>{user?.facility_name || 'District Hospital Aundh'}</strong>
            </p>
          </div>
          <StatusBadge status="AVAILABLE" customLabel={t('live_record')} />
        </div>
      </div>

      {message && (
        <div className="gov-card" style={{ backgroundColor: '#ECFDF5', border: '1px solid #A7F3D0', color: '#065F46', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle2 size={18} />
          {message}
        </div>
      )}

      {/* Summary KPI Grid */}
      <div className="grid-stats" style={{ marginBottom: '1.5rem' }}>
        <div className="stat-card">
          <div>
            <div className="stat-value">{staff.length}</div>
            <div className="stat-label">{t('totalAssignedStaff')}</div>
          </div>
          <Users style={{ color: '#1E40AF' }} />
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-value" style={{ color: '#059669' }}>{presentCount}</div>
            <div className="stat-label">{t('presentOnDuty')}</div>
          </div>
          <UserCheck style={{ color: '#059669' }} />
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-value" style={{ color: '#DC2626' }}>{absentCount}</div>
            <div className="stat-label">{t('absentUnexcused')}</div>
          </div>
          <UserX style={{ color: '#DC2626' }} />
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-value" style={{ color: '#D97706' }}>{leaveCount}</div>
            <div className="stat-label">{t('onApprovedLeave')}</div>
          </div>
          <Clock style={{ color: '#D97706' }} />
        </div>
      </div>

      {/* Attendance Table */}
      <div className="gov-card">
        <div className="gov-card-header">
          <div className="gov-card-title">
            <UserCheck size={18} />
            <span>{t('todaysAttendanceRoster')}</span>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="gov-table">
            <thead>
              <tr>
                <th>{t('staffName')}</th>
                <th>{t('roleDepartment')}</th>
                <th>{t('checkIn')}</th>
                <th>{t('checkoutLabel') || 'Check-out'}</th>
                <th>{t('status')}</th>
                <th>{t('actionsHeader')}</th>
              </tr>
            </thead>
            <tbody>
              {staff.map((person) => (
                <tr key={person.id}>
                  <td><strong>{person.name}</strong></td>
                  <td style={{ color: '#475569' }}>{person.role}</td>
                  <td>{person.check_in}</td>
                  <td>{person.check_out}</td>
                  <td><StatusBadge status={person.status} /></td>
                  <td>
                    {person.status !== 'PRESENT' ? (
                      <button
                        className="gov-btn gov-btn-primary gov-btn-sm"
                        onClick={() => markPresent(person.id)}
                      >
                        <UserCheck size={14} /> {t('markPresentBtn')}
                      </button>
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 700 }}>✓ {t('verifiedCheck')}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
