import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useOffline } from '../../context/OfflineContext';
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
  const { role, user, logout, switchRole } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const { isOnline, toggleNetworkStatus, pendingSyncCount, triggerSync, isSyncing } = useOffline();
  
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

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
        {/* Active Facility Indicator */}
        {user?.facility_name && (
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
            <span>{user.facility_name}</span>
          </div>
        )}

        {/* Online / Offline Status Indicator (With simulation button) */}
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
            <span
              style={{
                position: 'absolute',
                top: '2px',
                right: '2px',
                width: '8px',
                height: '8px',
                backgroundColor: '#EF4444',
                borderRadius: '50%'
              }}
            />
          </button>

          {showNotifications && (
            <div
              style={{
                position: 'absolute',
                right: 0,
                top: '120%',
                width: '300px',
                backgroundColor: '#ffffff',
                color: '#0F172A',
                borderRadius: '8px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
                padding: '1rem',
                zIndex: 100,
                border: '1px solid #E2E8F0'
              }}
            >
              <div style={{ fontWeight: '700', fontSize: '0.875rem', marginBottom: '0.5rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.375rem' }}>
                {t('systemNotifications')}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.8125rem' }}>
                <div style={{ padding: '0.375rem', backgroundColor: '#EFF6FF', borderRadius: '4px' }}>
                  <strong>{t('notificationReferralAccepted')}:</strong> {t('notificationReferralAcceptedDetail', { hospital: 'District Hospital Aundh', refId: 'REF-9901', name: 'Ramesh Patil' })}
                </div>
                <div style={{ padding: '0.375rem', backgroundColor: '#FEF3C7', borderRadius: '4px' }}>
                  <strong>{t('notificationMedicineAlert')}:</strong> {t('notificationMedicineAlertDetail', { med: 'IFA Red', facility: 'PHC Mulshi' })}
                </div>
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
                {user?.name || 'Guest User'}
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
              <div style={{ padding: '0.5rem', borderBottom: '1px solid #E2E8F0', marginBottom: '0.5rem' }}>
                <div style={{ fontWeight: '700', fontSize: '0.875rem' }}>{user?.name}</div>
                <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{getRoleLabel()}</div>
              </div>

              <div style={{ padding: '0.375rem 0.5rem', fontSize: '0.75rem', fontWeight: '700', color: '#475569' }}>
                SWITCH DEMO ROLE (SIH JUDGE DEMO):
              </div>
              <button
                className="sidebar-link"
                onClick={() => { switchRole('health_worker'); setShowProfileMenu(false); }}
                style={{ width: '100%', fontSize: '0.8125rem' }}
              >
                Health Worker (ASHA)
              </button>
              <button
                className="sidebar-link"
                onClick={() => { switchRole('doctor'); setShowProfileMenu(false); }}
                style={{ width: '100%', fontSize: '0.8125rem' }}
              >
                Doctor / Specialist
              </button>
              <button
                className="sidebar-link"
                onClick={() => { switchRole('facility_admin'); setShowProfileMenu(false); }}
                style={{ width: '100%', fontSize: '0.8125rem' }}
              >
                Facility Administrator
              </button>
              <button
                className="sidebar-link"
                onClick={() => { switchRole('patient'); setShowProfileMenu(false); }}
                style={{ width: '100%', fontSize: '0.8125rem' }}
              >
                Citizen / Patient
              </button>
              <button
                className="sidebar-link"
                onClick={() => { switchRole('district_authority'); setShowProfileMenu(false); }}
                style={{ width: '100%', fontSize: '0.8125rem' }}
              >
                District Authority (DHO)
              </button>

              <div style={{ borderTop: '1px solid #E2E8F0', marginTop: '0.5rem', paddingTop: '0.375rem' }}>
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
                    cursor: 'pointer'
                  }}
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
