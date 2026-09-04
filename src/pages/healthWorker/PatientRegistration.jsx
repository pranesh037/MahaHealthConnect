import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { usePatients } from '../../context/PatientContext';
import { useLanguage } from '../../context/LanguageContext';
import { StatusBadge } from '../../components/common/StatusBadge';
import {
  User,
  Phone,
  MapPin,
  Stethoscope,
  Building2,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  Search,
  Eye,
  FileText,
  Lock,
  AlertTriangle,
  RefreshCw,
  Info
} from 'lucide-react';

const VILLAGE_OPTIONS = [
  'Mulshi Gaon',
  'Bhukum',
  'Pirangut',
  'Paud',
  'Hinjewadi',
  'Lavasa',
  'Male',
  'Other / Custom'
];

export const PatientRegistration = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addPatient, generatePatientId, findDuplicatePatient } = usePatients();
  const { t, translateGender } = useLanguage();

  // Facility defaults from logged-in user context
  const facilityName = user?.facility_name || 'PHC Mulshi';
  const facilityDistrict = user?.district || 'Pune';
  const facilityTaluka = user?.taluka || 'Mulshi';
  const facilityId = user?.facility_id || 'FAC-101';

  // System generated ID preview
  const [patientId, setPatientId] = useState('');

  useEffect(() => {
    setPatientId(generatePatientId());
  }, [generatePatientId]);

  // Form State
  const [formData, setFormData] = useState({
    fullName: '',
    dob: '',
    calculatedAge: '',
    gender: '',
    phone: '',
    address: '',
    villageSelect: 'Mulshi Gaon',
    customVillage: '',
    taluka: facilityTaluka,
    district: facilityDistrict,
    existingConditions: '',
    allergies: '',
    currentMedications: '',
    bloodGroup: 'O+',
    emergencyContactName: '',
    emergencyContactPhone: '',
    privacyConfirmed: false
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState(null);
  const [bypassedDuplicate, setBypassedDuplicate] = useState(false);
  const [registeredPatient, setRegisteredPatient] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [viewingDuplicatePatient, setViewingDuplicatePatient] = useState(null);

  // AUTOMATIC AGE CALCULATION FROM DATE OF BIRTH
  const handleDobChange = (e) => {
    const dobValue = e.target.value;
    let ageStr = '';
    let dobError = null;

    if (dobValue) {
      const birthDate = new Date(dobValue);
      const today = new Date();
      
      if (birthDate > today) {
        dobError = t('dobFutureError');
      } else {
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }

        if (age > 120) {
          dobError = t('dobAgeMaxError');
        } else {
          ageStr = age >= 0 ? age.toString() : '0';
        }
      }
    }

    setFormData(prev => ({
      ...prev,
      dob: dobValue,
      calculatedAge: ageStr
    }));

    setErrors(prev => ({ ...prev, dob: dobError }));
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const val = type === 'checkbox' ? checked : value;

    setFormData(prev => ({ ...prev, [name]: val }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  // FORM VALIDATION
  const validateForm = () => {
    const newErrors = {};

    // 1. Basic details
    if (!formData.fullName.trim()) {
      newErrors.fullName = t('fullNameRequired');
    } else if (formData.fullName.trim().length < 3) {
      newErrors.fullName = t('fullNameLengthError');
    }

    if (!formData.dob) {
      newErrors.dob = t('dobRequired');
    } else {
      const birthDate = new Date(formData.dob);
      const today = new Date();
      if (birthDate > today) {
        newErrors.dob = t('dobFutureError');
      }
    }

    if (!formData.gender) {
      newErrors.gender = t('genderRequired');
    }

    // 2. Contact Information
    const cleanPhone = formData.phone.trim().replace(/\D/g, '');
    if (!formData.phone.trim()) {
      newErrors.phone = t('mobileRequired');
    } else if (cleanPhone.length !== 10 || !/^[6-9]\d{9}$/.test(cleanPhone)) {
      newErrors.phone = t('mobileValidError');
    }

    if (!formData.address.trim()) {
      newErrors.address = t('addressRequired');
    }

    const finalVillage = formData.villageSelect === 'Other / Custom' ? formData.customVillage.trim() : formData.villageSelect;
    if (!finalVillage) {
      newErrors.village = t('villageRequired');
    }

    if (!formData.taluka.trim()) {
      newErrors.taluka = t('talukaRequired');
    }

    if (!formData.district.trim()) {
      newErrors.district = t('districtRequired');
    }

    // Emergency Phone optional check
    if (formData.emergencyContactPhone.trim()) {
      const cleanEmg = formData.emergencyContactPhone.trim().replace(/\D/g, '');
      if (cleanEmg.length !== 10 || !/^\d{10}$/.test(cleanEmg)) {
        newErrors.emergencyContactPhone = t('emergencyPhoneValidError');
      }
    }

    // 5. Privacy Confirmation Checkbox
    if (!formData.privacyConfirmed) {
      newErrors.privacyConfirmed = t('privacyConfirmedRequired');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // SUBMIT HANDLER
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const finalVillage = formData.villageSelect === 'Other / Custom' ? formData.customVillage.trim() : formData.villageSelect;

    // Check for duplicate patient if not already bypassed
    if (!bypassedDuplicate) {
      const duplicate = findDuplicatePatient({
        phone: formData.phone,
        name: formData.fullName,
        dob: formData.dob
      });

      if (duplicate) {
        setDuplicateWarning(duplicate);
        return;
      }
    }

    processRegistration(finalVillage);
  };

  const processRegistration = async (villageName) => {
    setIsSubmitting(true);

    setTimeout(async () => {
      const now = new Date();
      const formattedDate = now.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }) + ' ' + now.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });

      const newPatientRecord = {
        patient_id: patientId,
        name: formData.fullName.trim(),
        dob: formData.dob,
        age: parseInt(formData.calculatedAge || '0', 10),
        gender: formData.gender,
        phone: `+91 ${formData.phone.trim().replace(/\D/g, '')}`,
        address: formData.address.trim(),
        village: villageName,
        taluka: formData.taluka.trim(),
        district: formData.district.trim(),
        registered_facility_id: facilityId,
        registered_facility_name: facilityName,
        medical_info: {
          existing_conditions: formData.existingConditions.trim() || 'None reported',
          allergies: formData.allergies.trim() || 'No known allergies',
          current_medications: formData.currentMedications.trim() || 'None',
          blood_group: formData.bloodGroup,
          emergency_contact: formData.emergencyContactName ? `${formData.emergencyContactName} (${formData.emergencyContactPhone})` : 'Not provided'
        },
        vitals: { bp: '120/80', pulse: 72, temp: '98.6 °F', spo2: '99%', weight: '--' },
        triage_status: 'NORMAL',
        triage_reason: 'Routine Patient Registration',
        registered_by: `${user?.name || 'Sunita Shinde'} (Field Health Worker)`,
        registered_at: formattedDate
      };

      try {
        const savedPatient = await addPatient(newPatientRecord);
        setRegisteredPatient(savedPatient);
        setDuplicateWarning(null);
      } catch (error) {
        setErrors({ submit: error.message || t('duplicateMatchNote') });
      } finally {
        setIsSubmitting(false);
      }
    }, 600);
  };

  const handleBypassDuplicateAndRegister = () => {
    setBypassedDuplicate(true);
    const finalVillage = formData.villageSelect === 'Other / Custom' ? formData.customVillage.trim() : formData.villageSelect;
    setDuplicateWarning(null);
    processRegistration(finalVillage);
  };

  const handleResetForm = () => {
    setRegisteredPatient(null);
    setShowProfileModal(false);
    setDuplicateWarning(null);
    setBypassedDuplicate(false);
    const newId = generatePatientId();
    setPatientId(newId);
    setFormData({
      fullName: '',
      dob: '',
      calculatedAge: '',
      gender: '',
      phone: '',
      address: '',
      villageSelect: 'Mulshi Gaon',
      customVillage: '',
      taluka: facilityTaluka,
      district: facilityDistrict,
      existingConditions: '',
      allergies: '',
      currentMedications: '',
      bloodGroup: 'O+',
      emergencyContactName: '',
      emergencyContactPhone: '',
      privacyConfirmed: false
    });
    setErrors({});
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // SUCCESS SCREEN
  if (registeredPatient) {
    return (
      <div style={{ maxWidth: '850px', margin: '0 auto' }}>
        {/* Top Success Banner */}
        <div
          className="gov-card"
          style={{
            backgroundColor: '#ECFDF5',
            borderColor: '#A7F3D0',
            textAlign: 'center',
            padding: '2rem 1.5rem',
            marginBottom: '1.5rem'
          }}
        >
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#D1FAE5', color: '#059669', marginBottom: '1rem' }}>
            <CheckCircle2 size={38} />
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: '#065F46', marginBottom: '0.5rem' }}>
            {t('patientRegisteredSuccessfully')}
          </h1>
          <p style={{ fontSize: '0.9375rem', color: '#047857' }}>
            {t('digitalRecordCreatedUnder')} <strong>{registeredPatient.registered_facility_name}</strong>.
          </p>
        </div>

        {/* Confirmation Card */}
        <div className="gov-card" style={{ marginBottom: '1.5rem' }}>
          <div className="gov-card-header">
            <div className="gov-card-title">
              <FileText size={20} style={{ color: '#0F2C59' }} />
              <span>{t('officialSlipSummary')}</span>
            </div>
            <StatusBadge status="AVAILABLE" customLabel="ACTIVE PATIENT RECORD" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', padding: '0.5rem 0' }}>
            <div style={{ backgroundColor: '#F8FAFC', padding: '1rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>
                {t('systemPatientId')}
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0F2C59', marginTop: '0.25rem', fontFamily: 'monospace' }}>
                {registeredPatient.patient_id}
              </div>
            </div>

            <div style={{ backgroundColor: '#F8FAFC', padding: '1rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>
                {t('fullName')}
              </div>
              <div style={{ fontSize: '1.125rem', fontWeight: '700', color: '#0F172A', marginTop: '0.25rem' }}>
                {registeredPatient.name}
              </div>
            </div>

            <div style={{ backgroundColor: '#F8FAFC', padding: '1rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>
                {t('dob')} & {t('age')}
              </div>
              <div style={{ fontSize: '1rem', fontWeight: '700', color: '#334155', marginTop: '0.25rem' }}>
                {registeredPatient.dob} ({registeredPatient.age} {t('yearsShort')}, {translateGender(registeredPatient.gender)})
              </div>
            </div>

            <div style={{ backgroundColor: '#F8FAFC', padding: '1rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>
                {t('registeringFacility')}
              </div>
              <div style={{ fontSize: '1rem', fontWeight: '700', color: '#0F2C59', marginTop: '0.25rem' }}>
                {registeredPatient.registered_facility_name} ({registeredPatient.district})
              </div>
            </div>

            <div style={{ backgroundColor: '#F8FAFC', padding: '1rem', borderRadius: '8px', border: '1px solid #E2E8F0', gridColumn: 'span 2' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>
                {t('registrationTimestamp')}
              </div>
              <div style={{ fontSize: '0.9375rem', fontWeight: '600', color: '#334155', marginTop: '0.25rem' }}>
                {registeredPatient.registered_at}
              </div>
            </div>
          </div>

          <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #E2E8F0', display: 'flex', gap: '1.5rem', flexWrap: 'wrap', fontSize: '0.875rem', color: '#475569' }}>
            <div><strong>{t('mobileNumber')}:</strong> {registeredPatient.phone}</div>
            <div><strong>{t('villageSubLocality')}:</strong> {registeredPatient.village}, {registeredPatient.taluka}, {registeredPatient.district}</div>
            <div><strong>{t('bloodGroup')}:</strong> {registeredPatient.medical_info?.blood_group}</div>
          </div>
        </div>

        {/* Action Buttons Section */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <button
            onClick={() => setShowProfileModal(true)}
            className="gov-btn gov-btn-secondary"
            style={{ padding: '0.875rem' }}
          >
            <Eye size={18} />
            <span>{t('viewPatientProfile')}</span>
          </button>

          <button
            onClick={() => navigate('/health-worker/patients')}
            className="gov-btn gov-btn-primary"
            style={{ padding: '0.875rem' }}
          >
            <Search size={18} />
            <span>{t('patientSearchBtn')}</span>
          </button>

          <button
            onClick={handleResetForm}
            className="gov-btn gov-btn-saffron"
            style={{ padding: '0.875rem' }}
          >
            <PlusCircle size={18} />
            <span>{t('registerAnotherPatient')}</span>
          </button>
        </div>

        {/* View Patient Profile Modal */}
        {showProfileModal && (
          <div className="gov-modal-overlay">
            <div className="gov-modal" style={{ maxWidth: '650px', width: '90%' }}>
              <div className="gov-card-header" style={{ padding: '1.25rem', backgroundColor: '#0F2C59', color: '#ffffff', marginBottom: 0 }}>
                <div className="gov-card-title" style={{ color: '#ffffff' }}>
                  <User size={20} />
                  <span>{t('publicHealthcareProfile')}</span>
                </div>
                <button
                  onClick={() => setShowProfileModal(false)}
                  style={{ background: 'none', border: 'none', color: '#ffffff', fontSize: '1.25rem', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  ✕
                </button>
              </div>

              <div style={{ padding: '1.5rem', maxHeight: '75vh', overflowY: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid #E2E8F0' }}>
                  <div>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0F2C59' }}>{registeredPatient.name}</h2>
                    <p style={{ fontSize: '0.875rem', color: '#64748B' }}>
                      ID: <strong style={{ color: '#0F2C59', fontFamily: 'monospace' }}>{registeredPatient.patient_id}</strong> • {t('dob')}: {registeredPatient.dob} ({registeredPatient.age} {t('yearsShort')}, {translateGender(registeredPatient.gender)})
                    </p>
                  </div>
                  <StatusBadge status="AVAILABLE" customLabel="REGISTERED" />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem', fontSize: '0.875rem' }}>
                  <div><strong>{t('mobileNumber')}:</strong> {registeredPatient.phone}</div>
                  <div><strong>{t('bloodGroup')}:</strong> {registeredPatient.medical_info.blood_group}</div>
                  <div><strong>{t('villageSubLocality')}:</strong> {registeredPatient.village}</div>
                  <div><strong>{t('taluka')}:</strong> {registeredPatient.taluka}</div>
                  <div><strong>{t('districtLabel')}:</strong> {registeredPatient.district}</div>
                  <div><strong>{t('registeringFacility')}:</strong> {registeredPatient.registered_facility_name}</div>
                  <div style={{ gridColumn: 'span 2' }}><strong>{t('streetAddress')}:</strong> {registeredPatient.address}</div>
                </div>

                <div style={{ backgroundColor: '#F8FAFC', padding: '1rem', borderRadius: '8px', border: '1px solid #E2E8F0', marginBottom: '1rem' }}>
                  <h4 style={{ fontSize: '0.875rem', fontWeight: '700', color: '#0F2C59', marginBottom: '0.5rem' }}>{t('section3Title')}</h4>
                  <div style={{ fontSize: '0.8125rem', display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                    <div><strong>{t('existingConditions')}:</strong> {registeredPatient.medical_info.existing_conditions}</div>
                    <div><strong>{t('allergies')}:</strong> {registeredPatient.medical_info.allergies}</div>
                    <div><strong>{t('currentMedications')}:</strong> {registeredPatient.medical_info.current_medications}</div>
                    <div><strong>{t('emergencyContactName')}:</strong> {registeredPatient.medical_info.emergency_contact}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: '#059669', backgroundColor: '#ECFDF5', padding: '0.625rem 0.875rem', borderRadius: '6px', border: '1px solid #A7F3D0' }}>
                  <ShieldCheck size={16} />
                  <span>{t('protectedRecordsNotExposed')}</span>
                </div>
              </div>

              <div style={{ padding: '1rem 1.5rem', backgroundColor: '#F8FAFC', borderTop: '1px solid #E2E8F0', textAlign: 'right' }}>
                <button
                  onClick={() => setShowProfileModal(false)}
                  className="gov-btn gov-btn-primary gov-btn-sm"
                >
                  {t('closeProfile')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // MAIN PATIENT REGISTRATION FORM
  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
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
            <div style={{ fontSize: '0.8125rem', color: '#F59E0B', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {t('gov_dept')}
            </div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: '800', marginTop: '0.25rem' }}>
              {t('newPatientRegistration')}
            </h1>
            <p style={{ fontSize: '0.875rem', color: '#CBD5E1', marginTop: '0.25rem' }}>
              {t('registerCitizenUnder')} <strong>{facilityName}</strong> {t('issueUniquePublicHealthId')}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'rgba(255, 255, 255, 0.1)', padding: '0.5rem 0.875rem', borderRadius: '8px' }}>
            <Building2 size={20} style={{ color: '#F59E0B' }} />
            <div style={{ fontSize: '0.8125rem' }}>
              <div><strong>{t('facility')}:</strong> {facilityName}</div>
              <div style={{ color: '#CBD5E1' }}>{t('district')}: {facilityDistrict}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Validation Error Alert Banner */}
      {Object.keys(errors).length > 0 && (
        <div
          className="gov-card"
          style={{
            backgroundColor: '#FEF2F2',
            borderColor: '#FCA5A5',
            color: '#991B1B',
            marginBottom: '1.5rem',
            padding: '1rem 1.25rem'
          }}
          role="alert"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '700', fontSize: '0.9375rem', marginBottom: '0.5rem' }}>
            <AlertCircle size={20} style={{ color: '#DC2626' }} />
            <span>{t('fixFormErrors')}</span>
          </div>
          <ul style={{ paddingLeft: '1.5rem', fontSize: '0.875rem' }}>
            {Object.values(errors).map((err, idx) => (
              <li key={idx}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* DUPLICATE PATIENT WARNING DIALOG */}
      {duplicateWarning && (
        <div className="gov-modal-overlay">
          <div className="gov-modal" style={{ maxWidth: '600px', width: '90%' }}>
            <div className="gov-card-header" style={{ padding: '1.25rem', backgroundColor: '#FEF3C7', borderBottom: '1px solid #FDE047', marginBottom: 0 }}>
              <div className="gov-card-title" style={{ color: '#92400E' }}>
                <AlertTriangle size={22} style={{ color: '#D97706' }} />
                <span>{t('possibleDuplicateFound')}</span>
              </div>
            </div>

            <div style={{ padding: '1.5rem' }}>
              <p style={{ fontSize: '0.875rem', color: '#475569', marginBottom: '1rem' }}>
                {t('duplicateMatchNote')}
              </p>

              <div style={{ backgroundColor: '#F8FAFC', padding: '1rem', borderRadius: '8px', border: '1px solid #CBD5E1', marginBottom: '1.25rem', fontSize: '0.875rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontWeight: '700', color: '#64748B' }}>{t('systemPatientId')}:</span>
                  <strong style={{ fontFamily: 'monospace', color: '#0F2C59' }}>{duplicateWarning.patient_id}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontWeight: '700', color: '#64748B' }}>{t('fullName')}:</span>
                  <strong style={{ color: '#0F172A' }}>{duplicateWarning.name}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontWeight: '700', color: '#64748B' }}>{t('dob')} / {t('age')}:</span>
                  <span>{duplicateWarning.dob || 'N/A'} ({duplicateWarning.age} {t('yearsShort')}, {translateGender(duplicateWarning.gender)})</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: '700', color: '#64748B' }}>{t('facility')}:</span>
                  <span>{duplicateWarning.registered_facility_name || 'PHC Mulshi'}</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => setViewingDuplicatePatient(duplicateWarning)}
                  className="gov-btn gov-btn-secondary"
                >
                  <Eye size={16} />
                  <span>{t('viewExistingPatient')}</span>
                </button>

                <button
                  type="button"
                  onClick={handleBypassDuplicateAndRegister}
                  className="gov-btn gov-btn-saffron"
                >
                  <span>{t('continueRegistration')}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEWING DUPLICATE PATIENT PROFILE MODAL */}
      {viewingDuplicatePatient && (
        <div className="gov-modal-overlay">
          <div className="gov-modal" style={{ maxWidth: '600px', width: '90%' }}>
            <div className="gov-card-header" style={{ padding: '1.25rem', backgroundColor: '#0F2C59', color: '#ffffff', marginBottom: 0 }}>
              <div className="gov-card-title" style={{ color: '#ffffff' }}>
                <User size={20} />
                <span>{t('existingPatientRecord')}</span>
              </div>
              <button
                onClick={() => setViewingDuplicatePatient(null)}
                style={{ background: 'none', border: 'none', color: '#ffffff', fontSize: '1.25rem', cursor: 'pointer', fontWeight: 'bold' }}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: '1.5rem', maxHeight: '70vh', overflowY: 'auto' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '800', color: '#0F2C59', marginBottom: '0.25rem' }}>{viewingDuplicatePatient.name}</h3>
              <p style={{ fontSize: '0.875rem', color: '#64748B', marginBottom: '1rem' }}>
                ID: <strong style={{ color: '#0F2C59', fontFamily: 'monospace' }}>{viewingDuplicatePatient.patient_id}</strong> • {viewingDuplicatePatient.age} {t('yearsShort')} ({translateGender(viewingDuplicatePatient.gender)})
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.875rem', marginBottom: '1rem' }}>
                <div><strong>{t('mobileNumber')}:</strong> {viewingDuplicatePatient.phone}</div>
                <div><strong>{t('villageSubLocality')}:</strong> {viewingDuplicatePatient.village}</div>
                <div><strong>{t('districtLabel')}:</strong> {viewingDuplicatePatient.district || 'Pune'}</div>
                <div><strong>{t('facility')}:</strong> {viewingDuplicatePatient.registered_facility_name || 'PHC Mulshi'}</div>
              </div>
            </div>

            <div style={{ padding: '1rem 1.5rem', backgroundColor: '#F8FAFC', borderTop: '1px solid #E2E8F0', textAlign: 'right' }}>
              <button
                type="button"
                onClick={() => setViewingDuplicatePatient(null)}
                className="gov-btn gov-btn-primary gov-btn-sm"
              >
                {t('closeRecord')}
              </button>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        {/* SECTION 1: BASIC PATIENT DETAILS */}
        <div className="gov-card" style={{ marginBottom: '1.5rem' }}>
          <div className="gov-card-header">
            <div className="gov-card-title">
              <User size={20} style={{ color: '#0F2C59' }} />
              <span>{t('section1Title')}</span>
            </div>
            <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: '600' }}>SECTION 1 OF 5</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
            {/* System Generated Patient ID */}
            <div className="gov-form-group">
              <label htmlFor="patientIdInput" className="gov-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>{t('systemPatientId')}</span>
                <span style={{ fontSize: '0.75rem', color: '#059669', fontWeight: '700' }}>{t('systemGenerated')}</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="patientIdInput"
                  type="text"
                  value={patientId}
                  readOnly
                  disabled
                  className="gov-input"
                  style={{
                    backgroundColor: '#F1F5F9',
                    color: '#0F2C59',
                    fontWeight: '800',
                    fontFamily: 'monospace',
                    letterSpacing: '0.05em',
                    cursor: 'not-allowed',
                    borderColor: '#CBD5E1'
                  }}
                />
                <Lock size={16} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
              </div>
              <span style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.25rem', display: 'block' }}>
                {t('patientIdNote')}
              </span>
            </div>

            {/* Full Name */}
            <div className="gov-form-group">
              <label htmlFor="fullNameInput" className="gov-label">
                {t('fullName')} <span style={{ color: '#DC2626' }}>*</span>
              </label>
              <input
                id="fullNameInput"
                type="text"
                name="fullName"
                placeholder={t('fullNamePlaceholder')}
                value={formData.fullName}
                onChange={handleChange}
                className="gov-input"
                aria-invalid={!!errors.fullName}
                aria-describedby={errors.fullName ? 'fullNameError' : undefined}
                style={{ borderColor: errors.fullName ? '#DC2626' : undefined }}
              />
              {errors.fullName && (
                <span id="fullNameError" style={{ fontSize: '0.75rem', color: '#DC2626', fontWeight: '600' }}>{errors.fullName}</span>
              )}
            </div>

            {/* Date of Birth */}
            <div className="gov-form-group">
              <label htmlFor="dobInput" className="gov-label">
                {t('dob')} <span style={{ color: '#DC2626' }}>*</span>
              </label>
              <input
                id="dobInput"
                type="date"
                name="dob"
                value={formData.dob}
                onChange={handleDobChange}
                className="gov-input"
                max={new Date().toISOString().split('T')[0]}
                aria-invalid={!!errors.dob}
                aria-describedby={errors.dob ? 'dobError' : undefined}
                style={{ borderColor: errors.dob ? '#DC2626' : undefined }}
              />
              {errors.dob && (
                <span id="dobError" style={{ fontSize: '0.75rem', color: '#DC2626', fontWeight: '600' }}>{errors.dob}</span>
              )}
            </div>

            {/* Calculated Age (Read Only) */}
            <div className="gov-form-group">
              <label htmlFor="calculatedAgeInput" className="gov-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>{t('age')}</span>
                <span style={{ fontSize: '0.75rem', color: '#475569', fontWeight: '600' }}>{t('autoCalculated')}</span>
              </label>
              <input
                id="calculatedAgeInput"
                type="text"
                readOnly
                disabled
                value={formData.calculatedAge ? t('autoCalculatedYears', { age: formData.calculatedAge }) : t('selectDobAbove')}
                className="gov-input"
                style={{
                  backgroundColor: '#F8FAFC',
                  color: formData.calculatedAge ? '#0F172A' : '#64748B',
                  fontWeight: '600',
                  cursor: 'not-allowed',
                  borderColor: '#CBD5E1'
                }}
              />
              <span style={{ fontSize: '0.75rem', color: '#64748B' }}>{t('ageDerivedFromDob')}</span>
            </div>

            {/* Gender */}
            <div className="gov-form-group">
              <label htmlFor="genderSelect" className="gov-label">
                {t('gender')} <span style={{ color: '#DC2626' }}>*</span>
              </label>
              <select
                id="genderSelect"
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="gov-select"
                aria-invalid={!!errors.gender}
                style={{ borderColor: errors.gender ? '#DC2626' : undefined }}
              >
                <option value="">{t('selectGender')}</option>
                <option value="Male">{t('male')}</option>
                <option value="Female">{t('female')}</option>
                <option value="Transgender">{t('transgenderOther')}</option>
              </select>
              {errors.gender && (
                <span style={{ fontSize: '0.75rem', color: '#DC2626', fontWeight: '600' }}>{errors.gender}</span>
              )}
            </div>
          </div>
        </div>

        {/* SECTION 2: CONTACT INFORMATION */}
        <div className="gov-card" style={{ marginBottom: '1.5rem' }}>
          <div className="gov-card-header">
            <div className="gov-card-title">
              <Phone size={20} style={{ color: '#0F2C59' }} />
              <span>{t('section2Title')}</span>
            </div>
            <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: '600' }}>SECTION 2 OF 5</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
            {/* Mobile Number */}
            <div className="gov-form-group">
              <label htmlFor="phoneInput" className="gov-label">
                {t('mobileNumber')} <span style={{ color: '#DC2626' }}>*</span>
              </label>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <span style={{ padding: '0.625rem 0.75rem', backgroundColor: '#F1F5F9', border: '1px solid #CBD5E1', borderRadius: '6px', fontWeight: '700', fontSize: '0.875rem', color: '#334155' }}>
                  +91
                </span>
                <input
                  id="phoneInput"
                  type="tel"
                  name="phone"
                  placeholder={t('mobilePlaceholder')}
                  maxLength={10}
                  value={formData.phone}
                  onChange={handleChange}
                  className="gov-input"
                  aria-invalid={!!errors.phone}
                  style={{ borderColor: errors.phone ? '#DC2626' : undefined }}
                />
              </div>
              {errors.phone ? (
                <span style={{ fontSize: '0.75rem', color: '#DC2626', fontWeight: '600' }}>{errors.phone}</span>
              ) : (
                <span style={{ fontSize: '0.75rem', color: '#64748B' }}>{t('mobileHelpText')}</span>
              )}
            </div>

            {/* Address */}
            <div className="gov-form-group" style={{ gridColumn: 'span 2' }}>
              <label htmlFor="addressInput" className="gov-label">
                {t('streetAddress')} <span style={{ color: '#DC2626' }}>*</span>
              </label>
              <input
                id="addressInput"
                type="text"
                name="address"
                placeholder={t('addressPlaceholder')}
                value={formData.address}
                onChange={handleChange}
                className="gov-input"
                aria-invalid={!!errors.address}
                style={{ borderColor: errors.address ? '#DC2626' : undefined }}
              />
              {errors.address && (
                <span style={{ fontSize: '0.75rem', color: '#DC2626', fontWeight: '600' }}>{errors.address}</span>
              )}
            </div>

            {/* Village / Sub-locality */}
            <div className="gov-form-group">
              <label htmlFor="villageSelectInput" className="gov-label">
                {t('villageSubLocality')} <span style={{ color: '#DC2626' }}>*</span>
              </label>
              <select
                id="villageSelectInput"
                name="villageSelect"
                value={formData.villageSelect}
                onChange={handleChange}
                className="gov-select"
              >
                {VILLAGE_OPTIONS.map(v => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
              {formData.villageSelect === 'Other / Custom' && (
                <input
                  type="text"
                  name="customVillage"
                  placeholder="Enter village / area name"
                  value={formData.customVillage}
                  onChange={handleChange}
                  className="gov-input"
                  style={{ marginTop: '0.5rem', borderColor: errors.village ? '#DC2626' : undefined }}
                />
              )}
              {errors.village && (
                <span style={{ fontSize: '0.75rem', color: '#DC2626', fontWeight: '600' }}>{errors.village}</span>
              )}
            </div>

            {/* Taluka */}
            <div className="gov-form-group">
              <label htmlFor="talukaInput" className="gov-label">
                {t('taluka')} <span style={{ color: '#DC2626' }}>*</span>
              </label>
              <input
                id="talukaInput"
                type="text"
                name="taluka"
                placeholder="e.g. Mulshi"
                value={formData.taluka}
                onChange={handleChange}
                className="gov-input"
                aria-invalid={!!errors.taluka}
                style={{ borderColor: errors.taluka ? '#DC2626' : undefined }}
              />
              {errors.taluka && (
                <span style={{ fontSize: '0.75rem', color: '#DC2626', fontWeight: '600' }}>{errors.taluka}</span>
              )}
            </div>

            {/* District */}
            <div className="gov-form-group">
              <label htmlFor="districtInput" className="gov-label">
                {t('districtLabel')} <span style={{ color: '#DC2626' }}>*</span>
              </label>
              <input
                id="districtInput"
                type="text"
                name="district"
                placeholder="e.g. Pune"
                value={formData.district}
                onChange={handleChange}
                className="gov-input"
                aria-invalid={!!errors.district}
                style={{ borderColor: errors.district ? '#DC2626' : undefined }}
              />
              {errors.district && (
                <span style={{ fontSize: '0.75rem', color: '#DC2626', fontWeight: '600' }}>{errors.district}</span>
              )}
            </div>
          </div>
        </div>

        {/* SECTION 3: RELEVANT MEDICAL INFORMATION */}
        <div className="gov-card" style={{ marginBottom: '1.5rem' }}>
          <div className="gov-card-header">
            <div className="gov-card-title">
              <Stethoscope size={20} style={{ color: '#0F2C59' }} />
              <span>{t('section3Title')}</span>
            </div>
            <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: '600' }}>SECTION 3 OF 5 {t('optionalTag')}</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
            {/* Blood Group */}
            <div className="gov-form-group">
              <label htmlFor="bloodGroupSelect" className="gov-label">{t('bloodGroup')}</label>
              <select
                id="bloodGroupSelect"
                name="bloodGroup"
                value={formData.bloodGroup}
                onChange={handleChange}
                className="gov-select"
              >
                <option value="O+">O Rh positive (O+)</option>
                <option value="O-">O Rh negative (O-)</option>
                <option value="A+">A Rh positive (A+)</option>
                <option value="A-">A Rh negative (A-)</option>
                <option value="B+">B Rh positive (B+)</option>
                <option value="B-">B Rh negative (B-)</option>
                <option value="AB+">AB Rh positive (AB+)</option>
                <option value="AB-">AB Rh negative (AB-)</option>
                <option value="Unknown">Unknown / Not Tested</option>
              </select>
            </div>

            {/* Existing Conditions */}
            <div className="gov-form-group" style={{ gridColumn: 'span 2' }}>
              <label htmlFor="existingConditionsInput" className="gov-label">{t('existingConditions')}</label>
              <textarea
                id="existingConditionsInput"
                name="existingConditions"
                rows={2}
                placeholder="e.g. Hypertension, Type 2 Diabetes, Asthma, Heart Condition, None"
                value={formData.existingConditions}
                onChange={handleChange}
                className="gov-textarea"
              />
            </div>

            {/* Allergies */}
            <div className="gov-form-group">
              <label htmlFor="allergiesInput" className="gov-label">{t('allergies')}</label>
              <textarea
                id="allergiesInput"
                name="allergies"
                rows={2}
                placeholder="e.g. Penicillin, Sulfa drugs, Latex, Food, None"
                value={formData.allergies}
                onChange={handleChange}
                className="gov-textarea"
              />
            </div>

            {/* Current Medications */}
            <div className="gov-form-group">
              <label htmlFor="currentMedicationsInput" className="gov-label">{t('currentMedications')}</label>
              <textarea
                id="currentMedicationsInput"
                name="currentMedications"
                rows={2}
                placeholder="e.g. Amlodipine 5mg, Metformin 500mg, None"
                value={formData.currentMedications}
                onChange={handleChange}
                className="gov-textarea"
              />
            </div>

            {/* Emergency Contact Name */}
            <div className="gov-form-group">
              <label htmlFor="emergencyContactNameInput" className="gov-label">{t('emergencyContactName')}</label>
              <input
                id="emergencyContactNameInput"
                type="text"
                name="emergencyContactName"
                placeholder="e.g. Sunita Patil (Wife)"
                value={formData.emergencyContactName}
                onChange={handleChange}
                className="gov-input"
              />
            </div>

            {/* Emergency Contact Phone */}
            <div className="gov-form-group">
              <label htmlFor="emergencyContactPhoneInput" className="gov-label">{t('emergencyContactPhone')}</label>
              <input
                id="emergencyContactPhoneInput"
                type="tel"
                name="emergencyContactPhone"
                placeholder="e.g. 9822054321"
                maxLength={10}
                value={formData.emergencyContactPhone}
                onChange={handleChange}
                className="gov-input"
                style={{ borderColor: errors.emergencyContactPhone ? '#DC2626' : undefined }}
              />
              {errors.emergencyContactPhone && (
                <span style={{ fontSize: '0.75rem', color: '#DC2626', fontWeight: '600' }}>{errors.emergencyContactPhone}</span>
              )}
            </div>
          </div>
        </div>

        {/* SECTION 4: REGISTERING FACILITY INFORMATION */}
        <div className="gov-card" style={{ marginBottom: '1.5rem', backgroundColor: '#F8FAFC', borderLeft: '4px solid #0F2C59' }}>
          <div className="gov-card-header" style={{ marginBottom: '0.75rem', paddingBottom: '0.5rem' }}>
            <div className="gov-card-title">
              <Building2 size={20} style={{ color: '#0F2C59' }} />
              <span>{t('section4Title')}</span>
            </div>
            <StatusBadge status="AVAILABLE" customLabel={t('loggedInFacility')} />
          </div>

          <p style={{ fontSize: '0.875rem', color: '#475569', marginBottom: '0.875rem' }}>
            {t('facilityAutoRegisteredNote')}
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', backgroundColor: '#ffffff', padding: '1rem', borderRadius: '8px', border: '1px solid #CBD5E1' }}>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>{t('facility')}</div>
              <div style={{ fontSize: '1rem', fontWeight: '800', color: '#0F2C59', marginTop: '0.125rem' }}>{facilityName}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>{t('taluka')}</div>
              <div style={{ fontSize: '0.9375rem', fontWeight: '700', color: '#0F172A', marginTop: '0.125rem' }}>{facilityTaluka}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>{t('districtLabel')}</div>
              <div style={{ fontSize: '0.9375rem', fontWeight: '700', color: '#0F172A', marginTop: '0.125rem' }}>{facilityDistrict}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>{t('registeringStaff')}</div>
              <div style={{ fontSize: '0.9375rem', fontWeight: '700', color: '#0F2C59', marginTop: '0.125rem' }}>{user?.name || 'Sunita Shinde'}</div>
            </div>
          </div>
        </div>

        {/* SECTION 5: PRIVACY & DATA AUTHORIZATION */}
        <div className="gov-card" style={{ marginBottom: '1.5rem', backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.875rem', marginBottom: '1rem' }}>
            <ShieldCheck size={24} style={{ color: '#1E40AF', flexShrink: 0, marginTop: '2px' }} />
            <div>
              <h4 style={{ fontSize: '0.9375rem', fontWeight: '700', color: '#1E3A8A', marginBottom: '0.25rem' }}>
                {t('privacyNoticeTitle')}
              </h4>
              <p style={{ fontSize: '0.84375rem', color: '#1E40AF', lineHeight: '1.5' }}>
                {t('privacyNoticeText')}
              </p>
              <div style={{ fontSize: '0.78125rem', color: '#1D4ED8', marginTop: '0.375rem', fontWeight: '600' }}>
                ✓ {t('protectedRecordsNotExposed')}
              </div>
            </div>
          </div>

          <div style={{ paddingTop: '0.875rem', borderTop: '1px solid #BFDBFE' }}>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.625rem', cursor: 'pointer', fontSize: '0.875rem', color: '#0F172A', fontWeight: '500' }}>
              <input
                type="checkbox"
                name="privacyConfirmed"
                checked={formData.privacyConfirmed}
                onChange={handleChange}
                style={{ width: '18px', height: '18px', marginTop: '2px', accentColor: '#0F2C59' }}
              />
              <span>
                {t('privacyCheckboxLabel')} <span style={{ color: '#DC2626' }}>*</span>
              </span>
            </label>
            {errors.privacyConfirmed && (
              <span style={{ fontSize: '0.75rem', color: '#DC2626', fontWeight: '600', display: 'block', marginTop: '0.375rem', marginLeft: '1.75rem' }}>
                {errors.privacyConfirmed}
              </span>
            )}
          </div>
        </div>

        {/* SUBMIT BUTTON */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
          <button
            type="button"
            onClick={() => navigate('/health-worker')}
            className="gov-btn gov-btn-secondary"
            style={{ padding: '0.75rem 1.5rem' }}
          >
            {t('cancel')}
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            className="gov-btn gov-btn-saffron"
            style={{ padding: '0.75rem 2rem', fontSize: '1rem' }}
          >
            {isSubmitting ? (
              <>
                <RefreshCw size={20} className="spin-icon" />
                <span>{t('registeringPatientLoading')}</span>
              </>
            ) : (
              <>
                <PlusCircle size={20} />
                <span>{t('registerPatient')}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
