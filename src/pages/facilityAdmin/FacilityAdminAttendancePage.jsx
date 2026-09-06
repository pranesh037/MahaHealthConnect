import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { StatusBadge } from '../../components/common/StatusBadge';
import { api } from '../../services/api';
import { UserCheck, Clock, CheckCircle2, Users, UserX, LogIn, LogOut } from 'lucide-react';

export const FacilityAdminAttendancePage = () => {
  const { user } = useAuth();
  const { t } = useLanguage();

  const [staff, setStaff] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [myAttendance, setMyAttendance] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [staffRes, attRes] = await Promise.allSettled([
        api.staff(user?.facility_id),
        api.attendance()
      ]);

      let docList = staffRes.status === 'fulfilled' && Array.isArray(staffRes.value?.staff) ? staffRes.value.staff : [];
      let attList = attRes.status === 'fulfilled' && Array.isArray(attRes.value?.attendance) ? attRes.value.attendance : [];

      // Include admin in staff list if not present
      const adminInList = docList.some((d) => d.user_id === user?.user_id);
      if (!adminInList && user) {
        docList = [
          {
            user_id: user.user_id,
            name: user.name,
            role: 'facility_admin',
            designation: 'Facility Administrator',
            facility_id: user.facility_id
          },
          ...docList
        ];
      }

      const today = new Date().toISOString().split('T')[0];
      const todayAtt = attList.filter((a) => a.date === today);

      const staffWithAtt = docList.map((person) => {
        const att = todayAtt.find((a) => a.user_id === person.user_id);
        return {
          ...person,
          check_in: att ? att.check_in : '—',
          check_out: att ? att.check_out : '—',
          status: att ? att.status : 'ABSENT',
          attendance_id: att?.attendance_id
        };
      });

      setStaff(staffWithAtt);
      setAttendanceRecords(attList);

      const mine = todayAtt.find((a) => a.user_id === user?.user_id);
      setMyAttendance(mine || null);
    } catch (err) {
      console.warn('Failed to load attendance data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.facility_id) {
      loadData();
    }
  }, [user]);

  const handleSelfCheckIn = async () => {
    try {
      await api.checkInAttendance();
      setMessage('Successfully checked in for today!');
      setTimeout(() => setMessage(''), 4000);
      loadData();
    } catch (err) {
      alert(err.message || 'Check-in failed');
    }
  };

  const handleSelfCheckOut = async () => {
    try {
      await api.checkOutAttendance();
      setMessage('Successfully checked out for today!');
      setTimeout(() => setMessage(''), 4000);
      loadData();
    } catch (err) {
      alert(err.message || 'Check-out failed');
    }
  };

  const presentCount = staff.filter((s) => s.status === 'PRESENT' || s.status === 'COMPLETED' || s.status === 'LATE').length;
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
              {t('facility')}: <strong>{user?.facility_name || 'District Hospital'}</strong> ({user?.facility_id || 'FAC-103'})
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            {!myAttendance ? (
              <button className="gov-btn gov-btn-saffron" onClick={handleSelfCheckIn}>
                <LogIn size={16} /> Admin Check In
              </button>
            ) : myAttendance.status === 'PRESENT' ? (
              <button className="gov-btn gov-btn-secondary" onClick={handleSelfCheckOut}>
                <LogOut size={16} /> Admin Check Out ({myAttendance.check_in})
              </button>
            ) : (
              <StatusBadge status="COMPLETED" customLabel={`Checked Out (${myAttendance.check_out})`} />
            )}
          </div>
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
            <span>{t('todaysAttendanceRoster')} ({user?.facility_id})</span>
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
              </tr>
            </thead>
            <tbody>
              {staff.map((person) => (
                <tr key={person.user_id}>
                  <td>
                    <strong>{person.name}</strong> {person.user_id === user?.user_id ? '(You)' : ''}
                  </td>
                  <td style={{ color: '#475569' }}>{person.designation || person.role || person.specialty || 'Staff'}</td>
                  <td>{person.check_in}</td>
                  <td>{person.check_out}</td>
                  <td>
                    {person.status === 'PRESENT' ? (
                      <StatusBadge status="PRESENT" customLabel={`✓ Checked In (${person.check_in})`} />
                    ) : person.status === 'COMPLETED' ? (
                      <StatusBadge status="COMPLETED" customLabel={`✓ Checked Out (${person.check_out})`} />
                    ) : (
                      <StatusBadge status="ABSENT" customLabel="Not Checked In" />
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
