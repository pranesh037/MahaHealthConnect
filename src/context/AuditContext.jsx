import React, { createContext, useContext, useState, useEffect } from 'react';

const AuditContext = createContext();

const STORAGE_KEY = 'maha_health_connect_audit_logs';

const DEFAULT_AUDIT_LOGS = [
  {
    id: "LOG-1001",
    timestamp: "28 Aug 2026, 10:24 AM",
    userName: "Dr. Aniket Deshmukh",
    userRole: "Doctor",
    patientId: "PAT-MH-000128",
    action: "Viewed Clinical Diagnostic Report",
    facility: "District Hospital Aundh",
    result: "AUTHORIZED",
    reason: "Active Cardiac Referral (REF-9901)"
  },
  {
    id: "LOG-1002",
    timestamp: "28 Aug 2026, 09:42 AM",
    userName: "Sunita Shinde",
    userRole: "Health Worker",
    patientId: "PAT-MH-000128",
    action: "Viewed Operational Triage Record",
    facility: "PHC Mulshi",
    result: "AUTHORIZED",
    reason: "Registered Facility Health Worker"
  },
  {
    id: "LOG-1003",
    timestamp: "27 Aug 2026, 04:10 PM",
    userName: "Sunita Shinde",
    userRole: "Health Worker",
    patientId: "PAT-MH-000128",
    action: "Attempted to view restricted diagnostic report",
    facility: "PHC Mulshi",
    result: "DENIED",
    reason: "Clinical documents restricted for Health Worker role"
  },
  {
    id: "LOG-1004",
    timestamp: "27 Aug 2026, 02:15 PM",
    userName: "Dr. Meena Kulkarni",
    userRole: "District Authority",
    patientId: "PAT-10245",
    action: "Attempted to view individual clinical history",
    facility: "Pune District",
    result: "DENIED",
    reason: "District role limited to aggregate reporting"
  }
];

export const AuditProvider = ({ children }) => {
  const [auditLogs, setAuditLogs] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load audit logs:', e);
    }
    return DEFAULT_AUDIT_LOGS;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(auditLogs));
    } catch (e) {
      console.error('Failed to save audit logs:', e);
    }
  }, [auditLogs]);

  const logAccessEvent = ({ userName, userRole, patientId, action, facility, result, reason }) => {
    const now = new Date();
    const formattedTime = now.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }) + ', ' + now.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    const newLog = {
      id: `LOG-${Date.now().toString().slice(-5)}`,
      timestamp: formattedTime,
      userName: userName || 'Current User',
      userRole: userRole || 'Staff',
      patientId: patientId || 'N/A',
      action: action || 'Record Access',
      facility: facility || 'Primary Health Centre',
      result: result || 'AUTHORIZED',
      reason: reason || 'Verified authorization check'
    };

    setAuditLogs(prev => [newLog, ...prev]);
    return newLog;
  };

  const getPatientAuditHistory = (patientId) => {
    return auditLogs.filter(log => log.patientId === patientId);
  };

  return (
    <AuditContext.Provider value={{ auditLogs, logAccessEvent, getPatientAuditHistory }}>
      {children}
    </AuditContext.Provider>
  );
};

export const useAudit = () => useContext(AuditContext);
