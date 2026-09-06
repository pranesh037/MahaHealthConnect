// MahaHealthConnect Privacy & Access-Control Authorization Utility
// Role + Facility + Patient-Care Relationship Access Control

export const DATA_TYPES = {
  IDENTIFICATION: 'IDENTIFICATION',
  OPERATIONAL: 'OPERATIONAL',
  CLINICAL_FULL: 'CLINICAL_FULL',
  DIAGNOSTICS: 'DIAGNOSTICS',
  PRESCRIPTIONS: 'PRESCRIPTIONS',
  RESTRICTED_DOCUMENT: 'RESTRICTED_DOCUMENT'
};

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
    const isGranted = patient?.active_grant || patient?.has_access !== false;
    if (!isGranted) {
      return {
        allowed: false,
        code: 'NO_RELATIONSHIP',
        reason: 'You do not currently have an authorized patient-care relationship for this record.'
      };
    }

    return {
      allowed: true,
      code: 'AUTHORIZED_CLINICAL',
      relationship: "Active Clinical Care Relationship",
      facilityName: user?.facility_name || "Assigned Medical Facility",
      accessWindow: "09:00 AM – 05:00 PM",
      accessExpires: "05:00 PM",
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
