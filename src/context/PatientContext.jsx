import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../services/api';

const PatientContext = createContext();

const STORAGE_KEY = 'maha_health_connect_patients';

export const PatientProvider = ({ children }) => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadPatients = async () => {
    const token = localStorage.getItem('mhc_access_token');

    // If the user is not logged in, use local data only.
    if (!token) {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        setPatients(saved ? JSON.parse(saved) : []);
      } catch (error) {
        console.error('Failed to load local patients:', error);
        setPatients([]);
      }

      setLoading(false);
      return;
    }

    // Logged in: MongoDB is the source of truth.
    try {
      setLoading(true);
      const response = await api.patients();
      const serverPatients = Array.isArray(response?.patients) ? response.patients : [];
      setPatients(serverPatients);

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(serverPatients));
      } catch (storageError) {
        console.error('Failed to cache patients locally:', storageError);
      }
    } catch (error) {
      console.error('Failed to load patients from MongoDB:', error);
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        setPatients(saved ? JSON.parse(saved) : []);
      } catch (localError) {
        console.error('Failed to load cached patients:', localError);
        setPatients([]);
      }
    } finally {
      setLoading(false);
    }
  };


  /*
   * Load MongoDB patients when the provider starts.
   */
  useEffect(() => {
    loadPatients();

    const handleAuthChange = () => {
      loadPatients();
    };

    window.addEventListener(
      'mhc-auth-changed',
      handleAuthChange
    );

    return () => {
      window.removeEventListener(
        'mhc-auth-changed',
        handleAuthChange
      );
    };
  }, []);

  /*
   * Keep local cache updated.
   */
  useEffect(() => {
    if (!patients.length) return;

    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(patients)
      );
    } catch (error) {
      console.error(
        'Failed to save patients locally:',
        error
      );
    }
  }, [patients]);

  /*
   * Generate a new patient ID.
   *
   * Existing synthetic database contains:
   * PAT-MH-000001 ... PAT-MH-000500
   *
   * So the next registration becomes:
   * PAT-MH-000501
   */
  const generatePatientId = () => {
    const mhPatients = patients.filter(
      (patient) =>
        patient.patient_id &&
        patient.patient_id.startsWith('PAT-MH-')
    );

    let maxNum = 0;

    mhPatients.forEach((patient) => {
      const match = patient.patient_id.match(
        /^PAT-MH-(\d+)$/
      );

      if (match) {
        const number = parseInt(match[1], 10);

        if (number > maxNum) {
          maxNum = number;
        }
      }
    });

    const nextNum = maxNum + 1;

    return `PAT-MH-${String(nextNum).padStart(6, '0')}`;
  };

  /*
   * Register a new patient.
   *
   * Logged in:
   *   React → Express → MongoDB
   *
   * Not logged in:
   *   local fallback
   */
  const addPatient = async (patientData) => {
    const newPatient = {
      ...patientData,
      patient_id:
        patientData.patient_id || generatePatientId(),
      registered_at:
        patientData.registered_at ||
        new Date().toISOString()
    };

    const token = localStorage.getItem(
      'mhc_access_token'
    );

    if (token) {
      try {
        const response =
          await api.createPatient(newPatient);

        const savedPatient = response.patient;

        setPatients((previousPatients) => [
          savedPatient,
          ...previousPatients.filter(
            (patient) =>
              patient.patient_id !==
              savedPatient.patient_id
          )
        ]);

        return savedPatient;
      } catch (error) {
        console.error(
          'Failed to register patient in MongoDB:',
          error
        );

        // Do NOT silently pretend the MongoDB save worked.
        throw error;
      }
    }

    /*
     * Local-only fallback.
     */
    setPatients((previousPatients) => [
      newPatient,
      ...previousPatients
    ]);

    return newPatient;
  };

  /*
   * Find a patient already loaded from MongoDB.
   */
  const getPatientById = (id) => {
    return patients.find(
      (patient) => patient.patient_id === id
    );
  };

  /*
   * Search for duplicate patients.
   */
  const findDuplicatePatient = ({
    phone,
    name,
    dob
  }) => {
    const cleanPhone = phone
      ? phone.trim().replace(/\D/g, '')
      : '';

    const cleanName = name
      ? name.trim().toLowerCase()
      : '';

    return patients.find((patient) => {
      const patientPhone = patient.phone
        ? patient.phone.trim().replace(/\D/g, '')
        : '';

      const patientName = patient.name
        ? patient.name.trim().toLowerCase()
        : '';

      /*
       * Match 1:
       * Same 10-digit mobile number.
       */
      if (
        cleanPhone &&
        cleanPhone.length === 10 &&
        patientPhone.endsWith(cleanPhone)
      ) {
        return true;
      }

      /*
       * Match 2:
       * Same name + date of birth.
       */
      if (
        cleanName &&
        patientName === cleanName &&
        dob &&
        patient.dob === dob
      ) {
        return true;
      }

      return false;
    });
  };

  /*
   * Allows other pages to manually refresh
   * the central MongoDB patient list.
   */
  const refreshPatients = async () => {
    await loadPatients();
  };

  return (
    <PatientContext.Provider
      value={{
        patients,
        loading,
        addPatient,
        getPatientById,
        generatePatientId,
        findDuplicatePatient,
        refreshPatients
      }}
    >
      {children}
    </PatientContext.Provider>
  );
};

export const usePatients = () =>
  useContext(PatientContext);