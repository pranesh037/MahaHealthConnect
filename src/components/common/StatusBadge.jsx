import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import {
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Clock,
  Wifi,
  WifiOff,
  RefreshCw,
  XCircle,
  Activity,
  ShieldCheck
} from 'lucide-react';

export const StatusBadge = ({ status, customLabel }) => {
  const { t, translateStatus } = useLanguage();
  const normalized = (status || '').toUpperCase().replace(/\s+/g, '_');

  const getBadgeConfig = () => {
    switch (normalized) {
      case 'AVAILABLE':
      case 'COMPLETED':
      case 'SYNCED':
      case 'ACCEPTED':
      case 'ONLINE':
        return {
          className: 'badge-available',
          icon: <CheckCircle2 size={13} />,
          label: customLabel || translateStatus(normalized)
        };
      case 'LOW':
      case 'LOW_STOCK':
      case 'PENDING':
      case 'NEEDS_RESPONSE':
      case 'PENDING_SYNC':
        return {
          className: 'badge-low',
          icon: <Clock size={13} />,
          label: customLabel || (normalized === 'PENDING_SYNC' ? t('pending_sync') : translateStatus(normalized))
        };
      case 'CRITICAL':
      case 'OUT_OF_STOCK':
      case 'OVERDUE':
      case 'REJECTED':
      case 'CRITICAL_CAPACITY':
      case 'CRITICAL_SHORTAGE':
        return {
          className: 'badge-critical',
          icon: <AlertOctagon size={13} />,
          label: customLabel || translateStatus(normalized)
        };
      case 'EMERGENCY':
        return {
          className: 'badge-emergency',
          icon: <AlertOctagon size={13} />,
          label: customLabel || translateStatus('EMERGENCY')
        };
      case 'HIGH':
        return {
          className: 'badge-low',
          icon: <AlertTriangle size={13} />,
          label: customLabel || translateStatus('HIGH')
        };
      case 'NORMAL':
        return {
          className: 'badge-available',
          icon: <Activity size={13} />,
          label: customLabel || translateStatus('NORMAL')
        };
      case 'OFFLINE':
        return {
          className: 'badge-offline',
          icon: <WifiOff size={13} />,
          label: customLabel || translateStatus('OFFLINE')
        };
      default:
        return {
          className: 'badge-offline',
          icon: <ShieldCheck size={13} />,
          label: customLabel || translateStatus(normalized)
        };
    }
  };

  const config = getBadgeConfig();

  return (
    <span className={`gov-badge ${config.className}`}>
      {config.icon}
      <span>{config.label}</span>
    </span>
  );
};
