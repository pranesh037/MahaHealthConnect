import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import {
  LayoutDashboard,
  Users,
  Calendar,
  Activity,
  GitPullRequest,
  FileText,
  Stethoscope,
  Pill,
  Clock,
  ClipboardList,
  BarChart3,
  Search,
  Upload,
  Wifi,
  Radio,
  UserCheck,
  ShieldCheck,
  Building,
  Baby
} from 'lucide-react';

export const Sidebar = ({ mobileOpen, closeMobileSidebar }) => {
  const { role } = useAuth();
  const { t } = useLanguage();

  const getNavItems = () => {
    switch (role) {
      case 'patient':
        return [
          { to: '/patient', label: t('dashboard'), icon: <LayoutDashboard size={18} /> },
          { to: '/patient/health-record', label: t('healthRecord'), icon: <UserCheck size={18} /> },
          { to: '/patient/appointments', label: t('appointmentsAndServices'), icon: <Calendar size={18} /> },
          { to: '/patient/referrals', label: t('referralsAndCare'), icon: <GitPullRequest size={18} /> }
        ];

      case 'health_worker':
        return [
          { to: '/health-worker', label: t('dashboard'), icon: <LayoutDashboard size={18} /> },
          { to: '/health-worker/patients', label: t('patientManagement'), icon: <Users size={18} /> },
          { to: '/health-worker/triage', label: t('triageAndCare'), icon: <Activity size={18} /> },
          { to: '/health-worker/referrals', label: t('referrals'), icon: <GitPullRequest size={18} /> },
          { to: '/health-worker/access', label: 'Secure Doctor Access', icon: <ShieldCheck size={18} /> },
          { to: '/health-worker/sync', label: t('offlineSync'), icon: <Wifi size={18} /> }
        ];

      case 'doctor':
        return [
          { to: '/doctor', label: t('dashboard'), icon: <LayoutDashboard size={18} /> },
          { to: '/doctor/queue', label: `${t('queue')} & ${t('appointments')}`, icon: <ClipboardList size={18} /> },
          { to: '/doctor/patient-care', label: t('patientCareWorkstation'), icon: <Stethoscope size={18} /> },
          { to: '/doctor/referrals', label: t('referrals'), icon: <GitPullRequest size={18} /> },
          { to: '/doctor/access', label: 'Secure Doctor Access', icon: <ShieldCheck size={18} /> }
        ];

      case 'facility_admin':
        return [
          { to: '/facility-admin', label: t('dashboard'), icon: <LayoutDashboard size={18} /> },
          { to: '/facility-admin/resources', label: t('facilityResources'), icon: <Building size={18} /> },
          { to: '/facility-admin/referrals', label: t('hospitalReferralsInbox'), icon: <GitPullRequest size={18} /> },
          { to: '/facility-admin/analytics', label: t('reports'), icon: <BarChart3 size={18} /> }
        ];

      case 'district_authority':
        return [
          { to: '/district-authority', label: t('districtOverview'), icon: <LayoutDashboard size={18} /> },
          { to: '/district-authority/network', label: t('healthcareNetwork'), icon: <Building size={18} /> },
          { to: '/district-authority/reports', label: t('reportsAndAudit'), icon: <ShieldCheck size={18} /> }
        ];

      default:
        return [];
    }
  };

  const navItems = getNavItems();

  return (
    <aside className={`gov-sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
      <div className="sidebar-nav">
        <div style={{ padding: '0.5rem 0.875rem', fontSize: '0.75rem', fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {t('navigationModule')}
        </div>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to.split('/').length <= 2}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            onClick={closeMobileSidebar}
          >
            {item.icon}
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>
    </aside>
  );
};
