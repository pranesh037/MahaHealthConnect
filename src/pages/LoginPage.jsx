import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import {
  User,
  Lock,
  Phone,
  UserPlus,
  UserCheck,
  Eye,
  EyeOff,
  Activity,
  Mail,
  Globe
} from 'lucide-react';

export const LoginPage = () => {
  const { loginAsUser, registerUser } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('login'); // 'login' | 'register'

  // Login Form State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState('health_worker');
  const [loginError, setLoginError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Registration Form State
  const [regRole, setRegRole] = useState('patient');
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regError, setRegError] = useState('');
  const [isRegSubmitting, setIsRegSubmitting] = useState(false);

  // Role-Specific Registration State
  const [regDob, setRegDob] = useState('1995-06-15');
  const [regGender, setRegGender] = useState('Male');
  const [regAddress, setRegAddress] = useState('');
  const [regVillage, setRegVillage] = useState('Mulshi');
  const [regDistrict, setRegDistrict] = useState('Pune');
  const [regBloodGroup, setRegBloodGroup] = useState('B+');
  const [regEmpId, setRegEmpId] = useState('');
  const [regWorkerType, setRegWorkerType] = useState('ASHA Worker');
  const [regLicenseNo, setRegLicenseNo] = useState('');
  const [regSpecialty, setRegSpecialty] = useState('General Medicine');
  const [regFacilityName, setRegFacilityName] = useState('PHC Mulshi');

  const navigateToRoleDashboard = (roleKey) => {
    switch (roleKey) {
      case 'patient': navigate('/patient'); break;
      case 'health_worker': navigate('/health-worker'); break;
      case 'doctor': navigate('/doctor'); break;
      case 'facility_admin': navigate('/facility-admin'); break;
      case 'district_authority': navigate('/district-authority'); break;
      default: navigate('/health-worker'); break;
    }
  };

  const handleManualLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setIsSubmitting(true);
    const result = await loginAsUser(username, password, selectedRole);
    setIsSubmitting(false);
    if (!result.success) {
      setLoginError(result.error || t('invalidLogin'));
      return;
    }
    navigateToRoleDashboard(result.role);
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setRegError('');

    if (regPassword !== regConfirmPassword) {
      setRegError('Passwords do not match. Please verify your entries.');
      return;
    }

    if (regPassword.length < 4) {
      setRegError('Password must be at least 4 characters long.');
      return;
    }

    setIsRegSubmitting(true);

    const payload = {
      role: regRole,
      name: regName,
      phone: regPhone,
      email: regEmail,
      password: regPassword,
      dob: regDob,
      gender: regGender,
      address: regAddress,
      village: regVillage,
      district: regDistrict,
      blood_group: regBloodGroup,
      employee_id: regEmpId,
      worker_type: regWorkerType,
      specialty: regSpecialty,
      license_no: regLicenseNo,
      facility_name: regFacilityName
    };

    const result = await registerUser(payload);
    setIsRegSubmitting(false);

    if (!result.success) {
      setRegError(result.error || 'Registration failed');
      return;
    }

    navigateToRoleDashboard(result.role);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#0F2C59',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        backgroundImage: 'radial-gradient(circle at 50% 20%, #1E40AF 0%, #0F2C59 70%)'
      }}
    >
      {/* Top Banner Header */}
      <div style={{ textAlign: 'center', marginBottom: '1.5rem', color: '#ffffff' }}>
        <div
          style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            backgroundColor: '#D97706',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            fontWeight: 'bold',
            fontSize: '1.75rem',
            margin: '0 auto 0.75rem',
            border: '3px solid #ffffff',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
          }}
        >
          महा
        </div>
        <h1 style={{ fontSize: '1.875rem', fontWeight: '800', letterSpacing: '-0.02em' }}>
          {t('app_title')}
        </h1>
        <p style={{ color: '#CBD5E1', fontSize: '0.875rem', marginTop: '0.25rem' }}>
          {t('gov_dept')}
        </p>
      </div>

      {/* Main Authentication Card */}
      <div
        style={{
          maxWidth: '520px',
          width: '100%',
          backgroundColor: '#ffffff',
          borderRadius: '14px',
          padding: '2rem',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
          borderTop: '5px solid #D97706'
        }}
      >
        {/* Global Language Selector Header */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', backgroundColor: '#F8FAFC', padding: '0.375rem 0.75rem', borderRadius: '6px', border: '1px solid #CBD5E1' }}>
            <Globe size={16} style={{ color: '#D97706' }} />
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              aria-label={t('selectLanguage')}
              style={{ border: 'none', background: 'transparent', fontWeight: '700', fontSize: '0.875rem', color: '#0F2C59', cursor: 'pointer', outline: 'none' }}
            >
              <option value="en">English</option>
              <option value="mr">मराठी (Marathi)</option>
              <option value="hi">हिंदी (Hindi)</option>
            </select>
          </div>
        </div>

        {/* Navigation Tabs (Sign In / Create Account) */}
        <div
          style={{
            display: 'flex',
            borderBottom: '2px solid #E2E8F0',
            marginBottom: '1.5rem'
          }}
        >
          <button
            type="button"
            onClick={() => { setActiveTab('login'); setLoginError(''); setRegError(''); }}
            style={{
              flex: 1,
              padding: '0.75rem 0.5rem',
              border: 'none',
              background: 'none',
              fontWeight: '700',
              fontSize: '0.9375rem',
              color: activeTab === 'login' ? '#0F2C59' : '#64748B',
              borderBottom: activeTab === 'login' ? '3px solid #D97706' : '3px solid transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s'
            }}
          >
            <UserCheck size={18} />
            {t('signIn')}
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('register'); setLoginError(''); setRegError(''); }}
            style={{
              flex: 1,
              padding: '0.75rem 0.5rem',
              border: 'none',
              background: 'none',
              fontWeight: '700',
              fontSize: '0.9375rem',
              color: activeTab === 'register' ? '#0F2C59' : '#64748B',
              borderBottom: activeTab === 'register' ? '3px solid #D97706' : '3px solid transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s'
            }}
          >
            <UserPlus size={18} />
            {t('createAccount')}
          </button>
        </div>

        {/* SIGN IN FORM */}
        {activeTab === 'login' && (
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#0F2C59', marginBottom: '0.25rem' }}>
              {t('signInPortal')}
            </h2>
            <p style={{ fontSize: '0.8125rem', color: '#64748B', marginBottom: '1.25rem' }}>
              {t('signInSubtitle')}
            </p>

            <form onSubmit={handleManualLogin}>
              {loginError && (
                <div role="alert" style={{ marginBottom: '1rem', padding: '0.75rem', color: '#991B1B', backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '6px', fontSize: '0.8125rem' }}>
                  {loginError}
                </div>
              )}

              <div className="gov-form-group">
                <label className="gov-label">{t('selectStakeholderRole')}</label>
                <select
                  className="gov-select"
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                >
                  <option value="health_worker">{t('healthWorkerRole')}</option>
                  <option value="doctor">{t('doctorSpecialist')}</option>
                  <option value="facility_admin">{t('facilityAdmin')}</option>
                  <option value="patient">{t('citizenPatient')}</option>
                  <option value="district_authority">{t('districtHealthOfficer')}</option>
                </select>
              </div>

              <div className="gov-form-group">
                <label className="gov-label">{t('userIdentifier')}</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    className="gov-input"
                    placeholder={t('generic_login_placeholder')}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    style={{ paddingLeft: '2.5rem' }}
                    required
                  />
                  <Phone size={16} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                </div>
              </div>

              <div className="gov-form-group">
                <label className="gov-label">{t('passwordOtp')}</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="gov-input"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem' }}
                    required
                  />
                  <Lock size={16} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '0.75rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: '#64748B',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={isSubmitting} className="gov-btn gov-btn-saffron" style={{ width: '100%', marginTop: '1rem', padding: '0.75rem' }}>
                {isSubmitting ? t('signingIn') : t('signIn')}
              </button>

              <div
                style={{
                  marginTop: '1.5rem',
                  padding: '0.875rem',
                  backgroundColor: '#F8FAFC',
                  borderRadius: '8px',
                  border: '1px solid #E2E8F0',
                  fontSize: '0.75rem',
                  color: '#64748B',
                  lineHeight: 1.5,
                  textAlign: 'center'
                }}
              >
                {t('dontHaveAccount')}{' '}
                <button
                  type="button"
                  onClick={() => { setActiveTab('register'); setLoginError(''); setRegError(''); }}
                  style={{ background: 'none', border: 'none', color: '#D97706', fontWeight: '700', cursor: 'pointer', textDecoration: 'underline' }}
                >
                  {t('createAccountTitle')}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* REGISTER FORM */}
        {activeTab === 'register' && (
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#0F2C59', marginBottom: '0.25rem' }}>
              {t('createAccountTitle')}
            </h2>
            <p style={{ fontSize: '0.8125rem', color: '#64748B', marginBottom: '1.25rem' }}>
              {t('rbacNotice')}
            </p>

            <form onSubmit={handleRegisterSubmit}>
              {regError && (
                <div role="alert" style={{ marginBottom: '1rem', padding: '0.75rem', color: '#991B1B', backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '6px', fontSize: '0.8125rem' }}>
                  {regError}
                </div>
              )}

              {/* Role Selector */}
              <div className="gov-form-group">
                <label className="gov-label">{t('selectStakeholderRole')} *</label>
                <select
                  className="gov-select"
                  value={regRole}
                  onChange={(e) => setRegRole(e.target.value)}
                  style={{ fontWeight: '600', borderColor: '#D97706' }}
                >
                  <option value="patient">{t('citizenPatient')}</option>
                  <option value="health_worker">{t('healthWorkerRole')}</option>
                  <option value="doctor">{t('doctorSpecialist')}</option>
                  <option value="facility_admin">{t('facilityAdmin')}</option>
                  <option value="district_authority">{t('districtHealthOfficer')}</option>
                </select>
              </div>

              {/* Common Fields */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="gov-form-group">
                  <label className="gov-label">{t('name')} *</label>
                  <input
                    type="text"
                    className="gov-input"
                    placeholder="e.g. Ramesh Patil"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    required
                  />
                </div>

                <div className="gov-form-group">
                  <label className="gov-label">{t('contactPhone')} *</label>
                  <input
                    type="tel"
                    className="gov-input"
                    placeholder="e.g. 9822012345"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="gov-form-group">
                <label className="gov-label">{t('emailAddress') || 'Email Address'}</label>
                <input
                  type="email"
                  className="gov-input"
                  placeholder="e.g. user@example.gov.in"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="gov-form-group">
                  <label className="gov-label">{t('passwordLabel') || 'Password'} *</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showRegPassword ? 'text' : 'password'}
                      className="gov-input"
                      placeholder="••••••••"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="gov-form-group">
                  <label className="gov-label">{t('confirmPassword') || 'Confirm Password'} *</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showRegPassword ? 'text' : 'password'}
                      className="gov-input"
                      placeholder="••••••••"
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Show password checkbox for registration */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', fontSize: '0.75rem', color: '#64748B' }}>
                <input
                  type="checkbox"
                  id="showRegPass"
                  checked={showRegPassword}
                  onChange={(e) => setShowRegPassword(e.target.checked)}
                />
                <label htmlFor="showRegPass" style={{ cursor: 'pointer' }}>Show passwords</label>
              </div>

              {/* Role Specific Dynamic Fields */}
              <div style={{ backgroundColor: '#F8FAFC', padding: '0.875rem', borderRadius: '8px', border: '1px solid #E2E8F0', marginBottom: '1.25rem' }}>
                <div style={{ fontWeight: '700', fontSize: '0.8125rem', color: '#0F2C59', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                  <Activity size={14} style={{ color: '#D97706' }} />
                  {t('profile')}
                </div>

                {regRole === 'patient' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                      <div>
                        <label className="gov-label" style={{ fontSize: '0.75rem' }}>Date of Birth</label>
                        <input type="date" className="gov-input" value={regDob} onChange={(e) => setRegDob(e.target.value)} />
                      </div>
                      <div>
                        <label className="gov-label" style={{ fontSize: '0.75rem' }}>Gender</label>
                        <select className="gov-select" value={regGender} onChange={(e) => setRegGender(e.target.value)}>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
                      <div>
                        <label className="gov-label" style={{ fontSize: '0.75rem' }}>{t('village')}</label>
                        <input type="text" className="gov-input" value={regVillage} onChange={(e) => setRegVillage(e.target.value)} />
                      </div>
                      <div>
                        <label className="gov-label" style={{ fontSize: '0.75rem' }}>{t('district')}</label>
                        <input type="text" className="gov-input" value={regDistrict} onChange={(e) => setRegDistrict(e.target.value)} />
                      </div>
                      <div>
                        <label className="gov-label" style={{ fontSize: '0.75rem' }}>{t('bloodGroup') || 'Blood Group'}</label>
                        <select className="gov-select" value={regBloodGroup} onChange={(e) => setRegBloodGroup(e.target.value)}>
                          <option value="A+">A+</option>
                          <option value="B+">B+</option>
                          <option value="O+">O+</option>
                          <option value="AB+">AB+</option>
                          <option value="A-">A-</option>
                          <option value="B-">B-</option>
                          <option value="O-">O-</option>
                          <option value="AB-">AB-</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {regRole === 'health_worker' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                    <div>
                      <label className="gov-label" style={{ fontSize: '0.75rem' }}>Worker Type</label>
                      <select className="gov-select" value={regWorkerType} onChange={(e) => setRegWorkerType(e.target.value)}>
                        <option value="ASHA Worker">ASHA Worker</option>
                        <option value="ANM Nurse">ANM Nurse</option>
                        <option value="Community Health Officer">Community Health Officer</option>
                      </select>
                    </div>
                    <div>
                      <label className="gov-label" style={{ fontSize: '0.75rem' }}>{t('facility')}</label>
                      <input type="text" className="gov-input" placeholder="e.g. Primary Health Centre" value={regFacilityName} onChange={(e) => setRegFacilityName(e.target.value)} />
                    </div>
                  </div>
                )}

                {regRole === 'doctor' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                    <div>
                      <label className="gov-label" style={{ fontSize: '0.75rem' }}>{t('specialty')}</label>
                      <select className="gov-select" value={regSpecialty} onChange={(e) => setRegSpecialty(e.target.value)}>
                        <option value="General Medicine">General Medicine</option>
                        <option value="Cardiology">Cardiology</option>
                        <option value="Pediatrics">Pediatrics</option>
                        <option value="Gynecology">Gynecology</option>
                        <option value="Orthopedics">Orthopedics</option>
                      </select>
                    </div>
                    <div>
                      <label className="gov-label" style={{ fontSize: '0.75rem' }}>{t('facility')}</label>
                      <input type="text" className="gov-input" placeholder="e.g. District Hospital Aundh" value={regFacilityName} onChange={(e) => setRegFacilityName(e.target.value)} />
                    </div>
                  </div>
                )}

                {(regRole === 'facility_admin' || regRole === 'district_authority') && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                    <div>
                      <label className="gov-label" style={{ fontSize: '0.75rem' }}>Employee ID</label>
                      <input type="text" className="gov-input" placeholder="e.g. EMP-99882" value={regEmpId} onChange={(e) => setRegEmpId(e.target.value)} />
                    </div>
                    <div>
                      <label className="gov-label" style={{ fontSize: '0.75rem' }}>{regRole === 'facility_admin' ? t('facility') : t('district')}</label>
                      <input type="text" className="gov-input" placeholder={regRole === 'facility_admin' ? 'e.g. Primary Health Centre' : 'e.g. Pune'} value={regFacilityName} onChange={(e) => setRegFacilityName(e.target.value)} />
                    </div>
                  </div>
                )}
              </div>

              <button type="submit" disabled={isRegSubmitting} className="gov-btn gov-btn-saffron" style={{ width: '100%', padding: '0.75rem' }}>
                {isRegSubmitting ? t('registering') : t('createAccount')}
              </button>

              <div
                style={{
                  marginTop: '1.25rem',
                  padding: '0.75rem',
                  backgroundColor: '#F8FAFC',
                  borderRadius: '8px',
                  border: '1px solid #E2E8F0',
                  fontSize: '0.75rem',
                  color: '#64748B',
                  textAlign: 'center'
                }}
              >
                {t('alreadyHaveAccount')}{' '}
                <button
                  type="button"
                  onClick={() => { setActiveTab('login'); setLoginError(''); setRegError(''); }}
                  style={{ background: 'none', border: 'none', color: '#D97706', fontWeight: '700', cursor: 'pointer', textDecoration: 'underline' }}
                >
                  {t('signIn')}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

