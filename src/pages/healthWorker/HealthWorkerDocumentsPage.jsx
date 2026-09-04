import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { usePatients } from '../../context/PatientContext';
import { StatusBadge } from '../../components/common/StatusBadge';
import {
  Upload,
  CheckCircle2,
  Lock,
  Plus,
  FileCheck
} from 'lucide-react';

export const HealthWorkerDocumentsPage = () => {
  const { user, role } = useAuth();
  const { t } = useLanguage();
  const { patients } = usePatients();

  const [documents, setDocuments] = useState(() => {
    const saved = localStorage.getItem('mhc_documents');
    if (saved) return JSON.parse(saved);
    return [
      { id: 1, type: 'Prescription', patient_id: 'PAT-10245', patient_name: 'Ramesh Patil', file_name: 'Rx_Aundh_Hospital_Aug2026.pdf', date: '2026-08-25', status: 'RECORDED', uploaded_by: 'Sunita Shinde' },
      { id: 2, type: 'Diagnostic Report', patient_id: 'PAT-10247', patient_name: 'Ganpat More', file_name: 'ECG_ST_Elevation_Mulshi.pdf', date: '2026-08-30', status: 'RECORDED', uploaded_by: 'Sunita Shinde' },
      { id: 3, type: 'Maternal Record', patient_id: 'PAT-10246', patient_name: 'Savita Jadhav', file_name: 'USG_Obstetric_Report_24W.pdf', date: '2026-08-05', status: 'RECORDED', uploaded_by: 'Sunita Shinde' }
    ];
  });

  const [form, setForm] = useState({
    type: 'Prescription',
    patient_id: patients[0]?.patient_id || 'PAT-10245',
    file_name: ''
  });

  const [message, setMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);

  if (role === 'patient') {
    return (
      <div className="gov-card" style={{ textAlign: 'center', padding: '3rem', color: '#991B1B', backgroundColor: '#FEF2F2' }}>
        <Lock size={48} style={{ marginBottom: '1rem' }} />
        <h2>{t('accessRestricted')}</h2>
        <p>{t('accessRestrictedSub')}</p>
      </div>
    );
  }

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setForm((prev) => ({ ...prev, file_name: e.target.files[0].name }));
    }
  };

  const handleUpload = (e) => {
    e.preventDefault();
    if (!form.file_name && !selectedFile) {
      setMessage(t('pleaseSelectFile'));
      return;
    }

    const patientObj = patients.find((p) => p.patient_id === form.patient_id);
    const newDoc = {
      id: Date.now(),
      type: form.type,
      patient_id: form.patient_id,
      patient_name: patientObj ? patientObj.name : form.patient_id,
      file_name: form.file_name || selectedFile?.name || 'Medical_Record.pdf',
      date: new Date().toISOString().split('T')[0],
      status: 'RECORDED',
      uploaded_by: user?.name || 'Sunita Shinde'
    };

    const updated = [newDoc, ...documents];
    setDocuments(updated);
    localStorage.setItem('mhc_documents', JSON.stringify(updated));
    setSelectedFile(null);
    setForm({ type: 'Prescription', patient_id: patients[0]?.patient_id || 'PAT-10245', file_name: '' });
    setMessage(t('documentStoredSuccess'));
  };

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
              {t('clinicalDocumentVault')}
            </div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0.25rem 0' }}>
              {t('documentUpload')}
            </h1>
            <p style={{ color: '#CBD5E1', margin: 0, fontSize: '0.875rem' }}>
              {t('publicHealthcareDirectory')}
            </p>
          </div>
          <StatusBadge status="AVAILABLE" customLabel={t('rbac_protected')} />
        </div>
      </div>

      {message && (
        <div className="gov-card" style={{ backgroundColor: '#ECFDF5', border: '1px solid #A7F3D0', color: '#065F46', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle2 size={18} />
          {message}
        </div>
      )}

      {/* Upload Document Form */}
      <div className="gov-card" style={{ marginBottom: '1.5rem' }}>
        <div className="gov-card-header">
          <div className="gov-card-title">
            <Upload size={18} />
            <span>{t('uploadNewPatientDocument')}</span>
          </div>
        </div>

        <form onSubmit={handleUpload}>
          <div className="grid-stats" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', marginBottom: '1rem' }}>
            <label className="gov-form-group">
              <span className="gov-label">{t('documentType')}</span>
              <select className="gov-select" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                <option value="Prescription">{t('prescriptionType')}</option>
                <option value="Diagnostic Report">{t('diagnosticReportType')}</option>
                <option value="Referral Document">{t('referralDocumentType')}</option>
                <option value="Medical Record">{t('medicalRecordType')}</option>
                <option value="Other">{t('other')}</option>
              </select>
            </label>

            <label className="gov-form-group">
              <span className="gov-label">{t('selectPatient')}</span>
              <select className="gov-select" value={form.patient_id} onChange={(e) => setForm({ ...form, patient_id: e.target.value })}>
                {patients.map((p) => (
                  <option key={p.patient_id} value={p.patient_id}>
                    {p.patient_id} - {p.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="gov-form-group">
              <span className="gov-label">{t('fileSelection')}</span>
              <input type="file" className="gov-input" onChange={handleFileChange} />
            </label>
          </div>

          <button type="submit" className="gov-btn gov-btn-primary">
            <Plus size={16} />
            <span>{t('uploadDocumentBtn')}</span>
          </button>
        </form>
      </div>

      {/* Documents Table */}
      <div className="gov-card">
        <div className="gov-card-header">
          <div className="gov-card-title">
            <FileCheck size={18} />
            <span>{t('documentRegisterCount')} ({documents.length})</span>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="gov-table">
            <thead>
              <tr>
                <th>{t('documentType')}</th>
                <th>{t('patientId')} & {t('name')}</th>
                <th>{t('fileName')}</th>
                <th>{t('date')}</th>
                <th>{t('uploadedBy')}</th>
                <th>{t('status')}</th>
              </tr>
            </thead>
            <tbody>
              {documents.length > 0 ? (
                documents.map((doc) => (
                  <tr key={doc.id}>
                    <td><strong>{t(doc.type.toLowerCase().replace(/\s+/g, '') + 'Type') || doc.type}</strong></td>
                    <td>{doc.patient_id} ({doc.patient_name})</td>
                    <td style={{ fontFamily: 'monospace', color: '#1E40AF' }}>{doc.file_name}</td>
                    <td>{doc.date}</td>
                    <td>{doc.uploaded_by}</td>
                    <td><StatusBadge status="RECORDED" /></td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', color: '#64748B' }}>
                    {t('noRecordsAvailable')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
