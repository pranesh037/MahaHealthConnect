import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { StatusBadge } from '../../components/common/StatusBadge';
import {
  Stethoscope,
  AlertTriangle,
  MapPin
} from 'lucide-react';

export const DistrictSpecialistDistributionPage = () => {
  const { user } = useAuth();
  const { t, translateSpecialty } = useLanguage();

  const specialties = [
    { specialty: 'Cardiology', specialists: 3, facilities: 2, availability: 'AVAILABLE', coverage: 'District Hospital Aundh, Sassoon Hospital' },
    { specialty: 'Pediatrics', specialists: 5, facilities: 4, availability: 'AVAILABLE', coverage: 'Aundh, Baramati, BHC Haveli, Sassoon' },
    { specialty: 'Gynecology & Obstetrics', specialists: 4, facilities: 3, availability: 'LIMITED', coverage: 'BHC Haveli, District Hospital Aundh, Sassoon' },
    { specialty: 'Neurosurgery & Trauma', specialists: 2, facilities: 1, availability: 'UNDERSERVED', coverage: 'Sassoon Hospital (Critical Shortage)' },
    { specialty: 'Orthopedics & Surgery', specialists: 4, facilities: 2, availability: 'AVAILABLE', coverage: 'Baramati, Sassoon Hospital' }
  ];

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      {/* Banner */}
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
              {t('specialistCoverageHeader')}
            </div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0.25rem 0' }}>
              {t('specialistDistributionTitle')}
            </h1>
            <p style={{ color: '#CBD5E1', margin: 0, fontSize: '0.875rem' }}>
              {t('mappingSpecialistAvailability')}
            </p>
          </div>
          <StatusBadge status="AVAILABLE" customLabel={t('specialist_map')} />
        </div>
      </div>

      {/* Underserved Specialty Highlight Alert */}
      <div
        style={{
          padding: '1rem 1.25rem',
          backgroundColor: '#FEF2F2',
          border: '1px solid #FCA5A5',
          borderRadius: '8px',
          marginBottom: '1.5rem',
          color: '#991B1B',
          fontSize: '0.875rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}
      >
        <AlertTriangle size={22} style={{ color: '#DC2626', flexShrink: 0 }} />
        <div>
          <strong>{t('underservedSpecialtyAlert')}:</strong> {t('underservedSpecialtySub')}
        </div>
      </div>

      {/* Specialist Cards Grid */}
      <div className="grid-stats" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {specialties.map((item, idx) => (
          <div key={idx} className="gov-card" style={{ borderLeft: `5px solid ${item.availability === 'UNDERSERVED' ? '#DC2626' : item.availability === 'LIMITED' ? '#D97706' : '#059669'}` }}>
            <div className="gov-card-header">
              <div className="gov-card-title">
                <Stethoscope size={18} />
                <span>{translateSpecialty(item.specialty)}</span>
              </div>
              <StatusBadge status={item.availability} />
            </div>

            <div style={{ fontSize: '0.875rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div>
                <strong>{t('activeSpecialistsCount')}:</strong> <span style={{ fontSize: '1.125rem', fontWeight: 800, color: '#0F2C59' }}>{item.specialists} {t('doctors')}</span>
              </div>
              <div>
                <strong>{t('coveredFacilitiesCount')}:</strong> {item.facilities} {t('facilities')}
              </div>
              <div style={{ fontSize: '0.8125rem', color: '#475569', backgroundColor: '#F8FAFC', padding: '0.5rem', borderRadius: '6px', marginTop: '0.25rem' }}>
                <MapPin size={14} style={{ display: 'inline', marginRight: '4px' }} />
                {item.coverage}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
