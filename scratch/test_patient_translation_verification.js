import { en } from '../src/translations/en.js';
import { mr } from '../src/translations/mr.js';
import { hi } from '../src/translations/hi.js';

console.log("=========================================");
console.log("PATIENT TRANSLATION COVERAGE AUDIT");
console.log("=========================================");

const patientKeys = [
  'citizenHealthcarePortal',
  'greeting_good_morning',
  'identifier',
  'village',
  'bloodGroup',
  'appointments',
  'referralStatus',
  'prescriptions',
  'followups',
  'activeReferralStatus',
  'none',
  'targetHospital',
  'pendingMatch',
  'specialtyLabel',
  'from',
  'to',
  'referringFacility',
  'destinationFacility',
  'doctor',
  'facilityLevelReferralDoctorNotAssigned',
  'healthWorkerNotes',
  'notAvailable',
  'referralPriority',
  'noActiveReferralsOnRecord',
  'upcomingAppointment',
  'attendingDoctor',
  'token',
  'date',
  'time',
  'typeLabel',
  'scheduled',
  'noUpcomingAppointmentsScheduled',
  'currentPrescriptions',
  'attendingPhysician',
  'prescriptionRecorded',
  'noActivePrescriptionsFound',
  'upcoming',
  'routineCheckup',
  'general',
  'noFollowupScheduled',
  'recentEncounters',
  'facility',
  'doctors',
  'encounterPurpose',
  'outcome',
  'noRecentEncountersOnRecord',
  'patientId',
  'name',
  'ageGender',
  'yearsShort',
  'location',
  'basicInfoAndContacts',
  'contactPhone',
  'emergencyContactPerson',
  'villageTaluka',
  'primaryFacility',
  'allergiesAndHistory',
  'knownAllergies',
  'preExistingConditions',
  'rbacNotice',
  'currentReferrals',
  'upcomingAppointments',
  'noRecordsAvailable',
  'noUpcoming',
  'at',
  'myProfile',
  'loadingMaternalRecords',
  'noMaternalHistoryRecorded',
  'noMaternalHistoryDetails',
  'maternalChildHeader',
  'ancTrackerTitle',
  'patient',
  'secondTrimester',
  'currentTrimester',
  'edd',
  'ancVisitsCompleted',
  'nextScheduledAnc',
  'basicVitalsAndRisk',
  'stable',
  'bloodPressure',
  'maternalWeight',
  'hemoglobinLevel',
  'bloodGlucose',
  'riskIndicatorsSummary',
  'noHighRiskFactors',
  'ancCareTimeline',
  'smartFacilityFinderTab',
  'dashboard',
  'healthRecord',
  'appointmentsAndServices',
  'referralsAndCare',
  'registeredCitizen',
  'notProvided',
  'notRecorded',
  'abhaConnected',
  'valuedCitizen',
  'newNotif',
  'justNow',
  'noNotificationsForAccount',
  'guestUser',
  'user',
  'totalLabel'
];

let missingMr = 0;
let missingHi = 0;

patientKeys.forEach((key) => {
  const enVal = en[key];
  const mrVal = mr[key];
  const hiVal = hi[key];

  if (!enVal) {
    console.error(`[FAIL] Key '${key}' missing in English (en.js)`);
  }
  if (!mrVal) {
    console.error(`[FAIL] Key '${key}' missing in Marathi (mr.js)`);
    missingMr++;
  }
  if (!hiVal) {
    console.error(`[FAIL] Key '${key}' missing in Hindi (hi.js)`);
    missingHi++;
  }
});

console.log(`Audited ${patientKeys.length} patient translation keys.`);
console.log(`Marathi missing keys: ${missingMr}`);
console.log(`Hindi missing keys: ${missingHi}`);

if (missingMr === 0 && missingHi === 0) {
  console.log("SUCCESS: 100% Patient Translation Coverage across English, Marathi, and Hindi!");
} else {
  console.error("FAILURE: Some translation keys are missing.");
  process.exit(1);
}
