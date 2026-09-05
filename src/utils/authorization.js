// MahaHealthConnect Privacy & Access-Control Authorization Utility
// Frontend simulation of Role + Facility + Patient-Care Relationship Access Control

export const DATA_TYPES = {
  IDENTIFICATION: 'IDENTIFICATION',
  OPERATIONAL: 'OPERATIONAL',
  CLINICAL_FULL: 'CLINICAL_FULL',
  DIAGNOSTICS: 'DIAGNOSTICS',
  PRESCRIPTIONS: 'PRESCRIPTIONS',
  RESTRICTED_DOCUMENT: 'RESTRICTED_DOCUMENT'
};

// Mock Patient-Care Relationships
export const MOCK_RELATIONSHIPS = [
  {
    patient_id: "PAT-MH-000128",
    doctor_id: "USR-DOC-003",
    doctor_name: "Dr. Aniket Deshmukh",
    facility_id: "FAC-103",
    facility_name: "District Hospital Aundh",
    relationship_type: "Active Cardiac Referral (REF-9901)",
    status: "ACTIVE",
    access_window_start: "10:00 AM",
    access_window_end: "11:30 AM",
    is_window_active: true
  },
  {
    patient_id: "PAT-10245",
    doctor_id: "USR-DOC-003",
    doctor_name: "Dr. Aniket Deshmukh",
    facility_id: "FAC-103",
    facility_name: "District Hospital Aundh",
    relationship_type: "OPD Appointment (APT-8801)",
    status: "ACTIVE",
    access_window_start: "09:00 AM",
    access_window_end: "01:00 PM",
    is_window_active: true
  },
  {
    patient_id: "PAT-10246",
    doctor_id: "USR-DOC-Gyne",
    doctor_name: "Dr. Priyamvada Joshi",
    facility_id: "FAC-102",
    facility_name: "BHC Haveli",
    relationship_type: "ANC Maternal Follow-up",
    status: "EXPIRED",
    access_window_start: "08:00 AM",
    access_window_end: "10:00 AM",
    is_window_active: false
  }
];

export function evaluateAccess({ user, patient, requestedDataType }) {
  const role = user?.role || null;
  if (!role) {
    return {
      allowed: false,
      code: 'UNAUTHENTICATED',
      reason: 'Authentication required.'
    };
  }
  const userFacilityId = user?.facility_id || 'FAC-101';
  const patientFacilityId = patient?.registered_facility_id || patient?.facility_id || 'FAC-101';
  const patientId = patient?.patient_id;

  // 1. Identification data is accessible for search identification results across roles
  if (requestedDataType === DATA_TYPES.IDENTIFICATION) {
    return {
      allowed: true,
      code: 'AUTHORIZED_IDENTIFICATION',
      reason: 'Basic identification information for directory search.'
    };
  }

  // 2. Patient Role -> Can view own record
  if (role === 'patient') {
    if (patientId && (patientId === user?.patient_id || patientId === user?.user_id)) {
      return {
        allowed: true,
        code: 'AUTHORIZED_PATIENT_OWN',
        reason: 'Citizen viewing own personal health record.'
      };
    }
  }

  // 3. Health Worker Role
  if (role === 'health_worker') {
    if (requestedDataType === DATA_TYPES.OPERATIONAL) {
      if (userFacilityId === patientFacilityId || userFacilityId === 'FAC-101') {
        return {
          allowed: true,
          code: 'AUTHORIZED_OPERATIONAL',
          reason: 'Authorized operational access for registered facility Health Worker.'
        };
      }
    }

    // Health Worker attempting protected clinical / diagnostic data
    if ([DATA_TYPES.CLINICAL_FULL, DATA_TYPES.DIAGNOSTICS, DATA_TYPES.PRESCRIPTIONS, DATA_TYPES.RESTRICTED_DOCUMENT].includes(requestedDataType)) {
      return {
        allowed: false,
        code: 'RESTRICTED_ROLE_CLINICAL',
        reason: 'Clinical information and protected diagnostic documents require authorized doctor relationship.'
      };
    }
  }

  // 4. Doctor / Specialist Role
  if (role === 'doctor') {
    // Check if an active patient-care relationship exists
    const rel = MOCK_RELATIONSHIPS.find(r => r.patient_id === patientId && (r.doctor_id === user?.user_id || user?.role === 'doctor'));

    if (!rel) {
      return {
        allowed: false,
        code: 'NO_RELATIONSHIP',
        reason: 'You do not currently have an authorized patient-care relationship for this record.'
      };
    }

    if (!rel.is_window_active || rel.status === 'EXPIRED') {
      return {
        allowed: false,
        code: 'EXPIRED_WINDOW',
        accessWindow: `${rel.access_window_start} – ${rel.access_window_end}`,
        reason: 'This clinical access window has expired.'
      };
    }

    return {
      allowed: true,
      code: 'AUTHORIZED_CLINICAL',
      relationship: rel.relationship_type,
      facilityName: rel.facility_name,
      accessWindow: `${rel.access_window_start} – ${rel.access_window_end}`,
      accessExpires: rel.access_window_end,
      reason: 'Active patient-care relationship verified for clinical access.'
    };
  }

  // 5. Facility Admin Role
  if (role === 'facility_admin') {
    if (requestedDataType === DATA_TYPES.OPERATIONAL) {
      return {
        allowed: true,
        code: 'AUTHORIZED_OPERATIONAL',
        reason: 'Facility operational and administrative access.'
      };
    }
    return {
      allowed: false,
      code: 'RESTRICTED_ADMIN_CLINICAL',
      reason: 'Facility Administrator role is restricted from viewing individual clinical records.'
    };
  }

  // 6. District Authority Role
  if (role === 'district_authority') {
    return {
      allowed: false,
      code: 'DISTRICT_RESTRICTED',
      reason: 'District-level access is intended for authorized aggregate and operational information.'
    };
  }

  return {
    allowed: false,
    code: 'ACCESS_DENIED',
    reason: 'Access restricted for current authorization state.'
  };
}
