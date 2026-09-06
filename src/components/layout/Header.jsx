import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useOffline } from '../../context/OfflineContext';
import { api } from '../../services/api';
import { StatusBadge } from '../common/StatusBadge';
import {
  Bell,
  Globe,
  Wifi,
  WifiOff,
  User,
  LogOut,
  ChevronDown,
  Menu,
  Shield,
  Building2,
  RefreshCw
} from 'lucide-react';

export const Header = ({ toggleMobileSidebar }) => {
  const { role, user, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const { isOnline, toggleNetworkStatus, pendingSyncCount, triggerSync, isSyncing } = useOffline();

  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    let isMounted = true;
    if (user) {
      api.notifications()
        .then((res) => {
          if (isMounted) setNotifications(res.notifications || []);
        })
        .catch((err) => console.warn('Notification fetch warning:', err));
    }
    return () => { isMounted = false; };
  }, [user, showNotifications]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkRead = async (notifId) => {
    try {
      await api.markNotificationRead(notifId);
      setNotifications((prev) =>
        prev.map((n) => (n.notification_id === notifId ? { ...n, read: true } : n))
      );
    } catch (err) {
      console.warn('Failed to mark notification read:', err);
    }
  };

  const getRoleLabel = () => {
    switch (role) {
      case 'patient': return t('citizenPatient');
      case 'health_worker': return t('healthWorkerRole');
      case 'doctor': return t('doctorSpecialist');
      case 'facility_admin': return t('facilityAdmin');
      case 'district_authority': return t('districtHealthOfficer');
      default: return t('user');
    }
  };

  return (
    <header className="gov-header">
      <div className="gov-header-brand">
        <button
          className="gov-btn gov-btn-secondary gov-btn-sm"
          style={{ display: 'none' }}
          onClick={toggleMobileSidebar}
          aria-label={t('toggleNavigationMenu')}
        >
          <Menu size={20} />
        </button>

        {/* Maharashtra Govt Emblem / Logo Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              backgroundColor: '#D97706',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              fontWeight: 'bold',
              fontSize: '1.2rem',
              border: '2px solid #ffffff',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }}
            title={t('governmentHealthcarePortal')}
          >
            महा
          </div>
          <div>
            <div className="gov-header-title">{t('app_title')}</div>
            <div className="gov-header-subtitle">{t('gov_dept')}</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {/* Active Facility / Jurisdiction Indicator */}
        {(user?.facility_name || user?.district) && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              padding: '0.375rem 0.75rem',
              borderRadius: '6px',
              fontSize: '0.8125rem',
              color: '#E2E8F0'
            }}
          >
            <Building2 size={15} style={{ color: '#F59E0B' }} />
            <span>{user.facility_name || `${user.district} District`}</span>
          </div>
        )}

        {/* Online / Offline Status Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            onClick={toggleNetworkStatus}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center'
            }}
            title={t('networkSimulationTooltip')}
          >
            <StatusBadge status={isOnline ? 'ONLINE' : 'OFFLINE'} />
          </button>

          {pendingSyncCount > 0 && (
            <button
              onClick={triggerSync}
              disabled={isSyncing}
              style={{
                backgroundColor: '#FEF3C7',
                color: '#78350F',
                border: '1px solid #FDE047',
                padding: '0.25rem 0.625rem',
                borderRadius: '9999px',
                fontSize: '0.75rem',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                cursor: 'pointer'
              }}
              title={t('syncSimulationTooltip')}
            >
              <RefreshCw size={12} className={isSyncing ? 'spin' : ''} />
              <span>{pendingSyncCount} {t('pending_sync')}</span>
            </button>
          )}
        </div>

        {/* Global Language Selector */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.12)', padding: '0.375rem 0.75rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.2)' }}>
          <Globe size={16} style={{ color: '#F59E0B', marginRight: '0.375rem' }} />
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            aria-label={t('selectLanguage')}
            style={{
              backgroundColor: 'transparent',
              color: '#ffffff',
              border: 'none',
              fontWeight: '700',
              fontSize: '0.875rem',
              cursor: 'pointer',
              outline: 'none',
              paddingRight: '0.25rem'
            }}
          >
            <option value="en" style={{ color: '#0F172A', fontWeight: language === 'en' ? 'bold' : 'normal' }}>
              English {language === 'en' ? '✓' : ''}
            </option>
            <option value="mr" style={{ color: '#0F172A', fontWeight: language === 'mr' ? 'bold' : 'normal' }}>
              मराठी (Marathi) {language === 'mr' ? '✓' : ''}
            </option>
            <option value="hi" style={{ color: '#0F172A', fontWeight: language === 'hi' ? 'bold' : 'normal' }}>
              हिंदी (Hindi) {language === 'hi' ? '✓' : ''}
            </option>
          </select>
        </div>

        {/* Notification Bell */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              borderRadius: '6px',
              padding: '0.5rem',
              color: '#ffffff',
              cursor: 'pointer',
              position: 'relative'
            }}
            title={t('notifications')}
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '-2px',
                  right: '-2px',
                  backgroundColor: '#EF4444',
                  color: '#ffffff',
                  fontSize: '0.6875rem',
                  fontWeight: '800',
                  borderRadius: '10px',
                  padding: '1px 5px',
                  lineHeight: '1.2'
                }}
              >
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div
              style={{
                position: 'absolute',
                right: 0,
                top: '120%',
                width: '320px',
                backgroundColor: '#ffffff',
                color: '#0F172A',
                borderRadius: '8px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
                padding: '1rem',
                zIndex: 100,
                border: '1px solid #E2E8F0',
                maxHeight: '380px',
                overflowY: 'auto'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: '700', fontSize: '0.875rem', marginBottom: '0.5rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.375rem' }}>
                <span>{t('systemNotifications')}</span>
                <span style={{ fontSize: '0.75rem', color: '#64748B' }}>{notifications.length} {t('totalLabel')}</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.8125rem' }}>
                {notifications.length > 0 ? (
                  notifications.map((n) => (
                    <div
                      key={n.notification_id || n._id}
                      onClick={() => handleMarkRead(n.notification_id)}
                      style={{
                        padding: '0.5rem',
                        backgroundColor: n.read ? '#F8FAFC' : '#EFF6FF',
                        borderRadius: '6px',
                        borderLeft: `4px solid ${n.type === 'EMERGENCY' ? '#DC2626' : n.read ? '#CBD5E1' : '#2563EB'}`,
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '700', color: '#0F172A' }}>
                        <span>{n.title}</span>
                        {!n.read && <span style={{ fontSize: '0.6875rem', color: '#2563EB', fontWeight: '800' }}>{t('newNotif')}</span>}
                      </div>
                      <div style={{ color: '#475569', marginTop: '0.125rem' }}>{n.message}</div>
                      <div style={{ fontSize: '0.6875rem', color: '#94A3B8', marginTop: '0.25rem' }}>
                        {n.created_at ? new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : t('justNow')}
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ padding: '1rem 0', color: '#64748B', fontStyle: 'italic', textAlign: 'center' }}>
                    {t('noNotificationsForAccount')}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>


        {/* User Profile Menu & Role Display */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              padding: '0.375rem 0.75rem',
              borderRadius: '6px',
              color: '#ffffff',
              cursor: 'pointer'
            }}
          >
            <User size={18} />
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '0.8125rem', fontWeight: '600', lineHeight: 1.1 }}>
                {user?.name || t('guestUser')}
              </div>
              <div style={{ fontSize: '0.6875rem', color: '#CBD5E1' }}>
                {getRoleLabel()}
              </div>
            </div>
            <ChevronDown size={14} />
          </button>

          {showProfileMenu && (
            <div
              style={{
                position: 'absolute',
                right: 0,
                top: '120%',
                width: '240px',
                backgroundColor: '#ffffff',
                color: '#0F172A',
                borderRadius: '8px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
                padding: '0.5rem',
                zIndex: 100,
                border: '1px solid #E2E8F0'
              }}
            >
              <div style={{ padding: '0.5rem', borderBottom: '1px solid #E2E8F0', marginBottom: '0.25rem' }}>
                <div style={{ fontWeight: '700', fontSize: '0.875rem' }}>{user?.name || t('user')}</div>
                <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{getRoleLabel()}</div>
              </div>

              <div style={{ paddingTop: '0.25rem' }}>
                <button
                  onClick={logout}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    width: '100%',
                    padding: '0.5rem',
                    border: 'none',
                    background: 'none',
                    color: '#DC2626',
                    fontWeight: '600',
                    fontSize: '0.8125rem',
                    cursor: 'pointer',
                    borderRadius: '4px',
                    transition: 'background-color 0.2s'
                  }}
                  className="sidebar-link"
                >
                  <LogOut size={16} />
                  <span>{t('logout')}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
