// backend/syntheticDataGenerator.js
// Generates a large, connected synthetic healthcare network for Maha Health Connect.
// All data is fictional and intended only for development/demo purposes.

const FIRST_NAMES = [
    'Aarav', 'Aditya', 'Akash', 'Amit', 'Aniket', 'Arjun', 'Ashok',
    'Deepak', 'Dhruv', 'Gaurav', 'Harish', 'Karan', 'Mahesh', 'Manish',
    'Nikhil', 'Omkar', 'Pranav', 'Rahul', 'Rakesh', 'Rohan', 'Sachin',
    'Sahil', 'Sameer', 'Sanjay', 'Siddharth', 'Tejas', 'Vikas', 'Vijay',
    'Yash', 'Abhishek', 'Anjali', 'Asha', 'Bhavana', 'Divya', 'Isha',
    'Kavita', 'Meena', 'Neha', 'Pallavi', 'Pooja', 'Priya', 'Radhika',
    'Riya', 'Sneha', 'Sonali', 'Swati', 'Vaishnavi', 'Vidya'
];

const LAST_NAMES = [
    'Patil', 'Shinde', 'Jadhav', 'Deshmukh', 'Kulkarni', 'Joshi',
    'Pawar', 'Gaikwad', 'Chavan', 'More', 'Kadam', 'Bhosale',
    'Thorat', 'Mane', 'Salunkhe', 'Sawant', 'Naik', 'Wagh',
    'Dixit', 'Desai', 'Inamdar', 'Kale', 'Gore', 'Lokhande'
];

const DISTRICTS = [
    'Pune', 'Satara', 'Nashik', 'Ahmednagar', 'Solapur',
    'Kolhapur', 'Sangli', 'Nanded', 'Aurangabad', 'Nagpur'
];

const TALUKAS = [
    'Mulshi', 'Haveli', 'Baramati', 'Maval', 'Bhor',
    'Shirur', 'Daund', 'Junnar', 'Khed', 'Purandar'
];

const VILLAGES = [
    'Paud', 'Pirangut', 'Lavale', 'Wakad', 'Panshet',
    'Kasarwadi', 'Manchar', 'Narayangaon', 'Saswad', 'Loni',
    'Uruli', 'Shirwal', 'Khed', 'Rajgurunagar', 'Alandi'
];

const SPECIALTIES = [
    'General Medicine',
    'Cardiology',
    'Pediatrics',
    'Gynecology',
    'Obstetrics',
    'Orthopedics',
    'Dermatology',
    'ENT',
    'Ophthalmology',
    'General Surgery',
    'Neurology',
    'Pulmonology',
    'Emergency Medicine',
    'Psychiatry',
    'Radiology'
];

const FACILITY_TYPES = [
    'PHC',
    'BHC',
    'Sub-District Hospital',
    'District Hospital',
    'General Hospital'
];

const EQUIPMENT = [
    ['ECG Machine', 'Cardiology'],
    ['Oxygen Concentrator', 'Critical Care'],
    ['Defibrillator', 'Emergency'],
    ['Ventilator', 'Critical Care'],
    ['Patient Monitor', 'Critical Care'],
    ['X-Ray Machine', 'Radiology'],
    ['Ultrasound Machine', 'Radiology'],
    ['CT Scanner', 'Radiology'],
    ['Nebulizer', 'Respiratory'],
    ['Autoclave', 'Sterilization'],
    ['Infusion Pump', 'Critical Care'],
    ['Suction Machine', 'Emergency']
];

const MEDICINES = [
    ['Paracetamol 500mg', 'Analgesic'],
    ['Amoxicillin 500mg', 'Antibiotic'],
    ['Azithromycin 500mg', 'Antibiotic'],
    ['Metformin 500mg', 'Diabetes'],
    ['Amlodipine 5mg', 'Hypertension'],
    ['Losartan 50mg', 'Hypertension'],
    ['Atorvastatin 10mg', 'Cardiology'],
    ['Pantoprazole 40mg', 'Gastro'],
    ['Cetirizine 10mg', 'Allergy'],
    ['Salbutamol Inhaler', 'Respiratory'],
    ['ORS Sachet', 'Rehydration'],
    ['Iron Folic Acid', 'Maternal'],
    ['Calcium Tablets', 'Maternal'],
    ['Cefixime 200mg', 'Antibiotic'],
    ['Insulin', 'Diabetes']
];

const DIAGNOSTICS = [
    ['CBC', 'Pathology'],
    ['Blood Sugar', 'Pathology'],
    ['Lipid Profile', 'Pathology'],
    ['Liver Function Test', 'Pathology'],
    ['Kidney Function Test', 'Pathology'],
    ['Urine Routine', 'Pathology'],
    ['ECG', 'Cardiology'],
    ['Chest X-Ray', 'Radiology'],
    ['Ultrasound', 'Radiology'],
    ['CT Scan', 'Radiology'],
    ['HbA1c', 'Pathology'],
    ['Thyroid Profile', 'Pathology']
];

const pick = (array, index) => array[index % array.length];

const pad = (number, size = 3) =>
    String(number).padStart(size, '0');

const makeName = (index) =>
    `${pick(FIRST_NAMES, index * 7)} ${pick(LAST_NAMES, index * 11)}`;

const dateAgo = (days) => {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString();
};

const dateAhead = (days) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString();
};

export function generateFacilities(count = 50) {
    const facilities = [];

    for (let i = 0; i < count; i += 1) {
        const number = 101 + i;
        const type = pick(FACILITY_TYPES, i);

        let name;

        // Preserve the important existing demo facilities.
        if (number === 101) name = 'PHC Mulshi';
        else if (number === 102) name = 'BHC Haveli';
        else if (number === 103) name = 'District Hospital Aundh';
        else if (number === 104) name = 'Sub-District Hospital Baramati';
        else if (number === 105) name = 'Sassoon General Hospital';
        else name = `${type} ${pick(TALUKAS, i)} ${i + 1}`;

        const district = pick(DISTRICTS, i);
        const specialties = [
            pick(SPECIALTIES, i),
            pick(SPECIALTIES, i + 3),
            pick(SPECIALTIES, i + 6)
        ];

        if (type === 'District Hospital' || type === 'General Hospital') {
            specialties.push('Emergency Medicine');
        }

        const totalBeds =
            type === 'PHC' ? 20 + (i % 15) :
                type === 'BHC' ? 40 + (i % 30) :
                    type === 'Sub-District Hospital' ? 100 + (i % 60) :
                        type === 'District Hospital' ? 300 + (i % 150) :
                            700 + (i % 300);

        const occupied = Math.floor(totalBeds * (0.45 + ((i % 25) / 100)));

        facilities.push({
            facility_id: `FAC-${number}`,
            name,
            type,
            district,
            taluka: pick(TALUKAS, i),
            address: `${pick(VILLAGES, i)}, ${district}`,
            contact: `020-${4000000 + i}`,
            doctor_count: 2 + (i % 15),
            active_beds: Math.max(totalBeds - occupied, 1),
            distance_km: `${(2 + ((i * 3.7) % 48)).toFixed(1)} km`,
            last_verified: dateAgo(i % 15),
            status: i % 13 === 0 ? 'LIMITED' : 'AVAILABLE',
            latitude: 18.45 + ((i % 10) * 0.04),
            longitude: 73.75 + ((i % 10) * 0.05),
            specialties: [...new Set(specialties)]
        });
    }

    return facilities;
}

export function generateDoctors(count = 150, facilities) {
    const doctors = [];

    for (let i = 0; i < count; i += 1) {
        const doctorNumber = i + 1;

        // Preserve the existing demo doctor.
        if (doctorNumber === 3) {
            doctors.push({
                user_id: 'USR-DOC-003',
                role: 'doctor',
                name: 'Dr. Aniket Deshmukh',
                name_mr: 'डॉ. अनिकेत देशमुख',
                designation: 'Senior Medical Officer',
                facility_id: 'FAC-103',
                facility_name: 'District Hospital Aundh',
                qualification: 'MBBS, MD',
                specialty: 'General Medicine',
                license_no: 'MCI-MH-100003',
                experience_years: 11,
                rating: 4.8,
                availability_status: 'AVAILABLE',
                availability: [
                    { day: 'MON', start: '09:00', end: '14:00' },
                    { day: 'WED', start: '09:00', end: '14:00' },
                    { day: 'FRI', start: '09:00', end: '14:00' }
                ],
                languages: ['English', 'Marathi', 'Hindi'],
                consultation_mode: 'IN_PERSON',
                created_at: dateAgo(300)
            });
            continue;
        }

        const facility = facilities[i % facilities.length];
        const specialty = pick(SPECIALTIES, i + 2);

        doctors.push({
            user_id: `USR-DOC-${pad(doctorNumber)}`,
            role: 'doctor',
            name: `Dr. ${makeName(i)}`,
            name_mr: `डॉ. ${pick(FIRST_NAMES, i)}`,
            designation: i % 5 === 0 ? 'Senior Medical Officer' : 'Medical Officer',
            facility_id: facility.facility_id,
            facility_name: facility.name,
            qualification: i % 3 === 0 ? 'MBBS, MD' : 'MBBS',
            specialty,
            license_no: `MCI-MH-${pad(100000 + doctorNumber, 6)}`,
            experience_years: 2 + (i % 24),
            rating: Number((3.7 + ((i * 7) % 14) / 10).toFixed(1)),
            availability_status: i % 9 === 0 ? 'ON_LEAVE' : 'AVAILABLE',
            availability: [
                { day: 'MON', start: '09:00', end: '13:00' },
                { day: 'WED', start: '10:00', end: '16:00' },
                { day: 'FRI', start: '09:00', end: '14:00' }
            ],
            languages: ['English', 'Marathi', i % 3 === 0 ? 'Hindi' : 'Marathi'],
            consultation_mode: i % 4 === 0 ? 'IN_PERSON,TELECONSULT' : 'IN_PERSON',
            created_at: dateAgo(30 + (i % 300))
        });
    }

    return doctors;
}

export function generatePatients(count = 500, facilities) {
    const patients = [];

    // Preserve patients used by existing workflows.
    const legacyPatients = [
        {
            patient_id: 'PAT-10245',
            name: 'Rajesh Patil',
            age: 52,
            gender: 'Male',
            dob: '1974-02-14',
            phone: '90000010245',
            address: 'Mulshi',
            village: 'Paud',
            taluka: 'Mulshi',
            district: 'Pune',
            triage_status: 'ROUTINE',
            is_maternal: false,
            registered_facility_id: 'FAC-101'
        },
        {
            patient_id: 'PAT-10246',
            name: 'Sunita Shinde',
            age: 39,
            gender: 'Female',
            dob: '1987-06-22',
            phone: '90000010246',
            address: 'Haveli',
            village: 'Loni',
            taluka: 'Haveli',
            district: 'Pune',
            triage_status: 'STABLE',
            is_maternal: true,
            registered_facility_id: 'FAC-102'
        },
        {
            patient_id: 'PAT-10247',
            name: 'Vijay Jadhav',
            age: 67,
            gender: 'Male',
            dob: '1959-01-11',
            phone: '90000010247',
            address: 'Aundh',
            village: 'Aundh',
            taluka: 'Haveli',
            district: 'Pune',
            triage_status: 'URGENT',
            is_maternal: false,
            registered_facility_id: 'FAC-103'
        }
    ];

    legacyPatients.forEach((patient, index) => {
        patients.push({
            ...patient,
            vitals: {
                temperature: 98 + (index * 0.4),
                pulse: 72 + (index * 5),
                systolic: 120 + (index * 10),
                diastolic: 78 + (index * 4),
                spo2: 96 - index
            },
            medical_info: {
                allergies: index === 1 ? ['Penicillin'] : [],
                conditions: index === 0 ? ['Hypertension'] : [],
                blood_group: ['A+', 'B+', 'O+'][index]
            },
            registered_by: 'USR-WRK-001',
            registered_at: dateAgo(60 + index),
            record_version: 1,
            updated_at: dateAgo(index)
        });
    });

    for (let i = 0; i < count; i += 1) {
        const facility = facilities[i % facilities.length];
        const gender = i % 2 === 0 ? 'Male' : 'Female';
        const age = 5 + (i % 76);

        patients.push({
            patient_id: `PAT-MH-${pad(i + 1, 6)}`,
            name: makeName(i + 20),
            age,
            gender,
            dob: `${new Date().getFullYear() - age}-${pad((i % 12) + 1, 2)}-${pad((i % 27) + 1, 2)}`,
            phone: `91${9000000000 + i}`,
            address: `${pick(VILLAGES, i)}, ${facility.district}`,
            village: pick(VILLAGES, i),
            taluka: pick(TALUKAS, i),
            district: facility.district,
            nfc_token: i % 5 === 0 ? `NFC-MHC-${pad(i + 1, 6)}` : null,
            vitals: {
                temperature: Number((97.8 + ((i % 30) / 10)).toFixed(1)),
                pulse: 65 + (i % 35),
                systolic: 105 + (i % 55),
                diastolic: 65 + (i % 25),
                spo2: 94 + (i % 7)
            },
            triage_status: ['ROUTINE', 'STABLE', 'URGENT'][i % 3],
            triage_reason: ['General check-up', 'Fever', 'Follow-up', 'Respiratory symptoms'][i % 4],
            is_maternal: gender === 'Female' && age >= 18 && age <= 45 && i % 7 === 0,
            registered_facility_id: facility.facility_id,
            registered_by: 'USR-WRK-001',
            registered_at: dateAgo(i % 180),
            record_version: 1,
            updated_at: dateAgo(i % 30),
            medical_info: {
                blood_group: ['A+', 'B+', 'O+', 'AB+'][i % 4],
                allergies: i % 11 === 0 ? ['Penicillin'] : [],
                conditions: i % 8 === 0 ? ['Hypertension'] : []
            }
        });
    }

    return patients;
}

export function generateBeds(facilities) {
    return facilities.map((facility, index) => {
        const total =
            facility.type === 'PHC' ? 20 + (index % 15) :
                facility.type === 'BHC' ? 40 + (index % 30) :
                    facility.type === 'Sub-District Hospital' ? 100 + (index % 60) :
                        facility.type === 'District Hospital' ? 300 + (index % 150) :
                            700 + (index % 300);

        const occupied = Math.floor(total * (0.45 + ((index % 20) / 100)));
        const available = Math.max(total - occupied, 0);
        const icu = facility.type === 'PHC' ? 0 : Math.max(Math.floor(total * 0.1), 2);

        return {
            facility_id: facility.facility_id,
            total_beds: total,
            occupied_beds: occupied,
            available_beds: available,
            icu_beds: icu,
            available_icu_beds: Math.max(icu - Math.floor(icu * 0.55), 0),
            updated_at: new Date().toISOString()
        };
    });
}

export function generateEquipment(facilities) {
    const records = [];
    let id = 1;

    facilities.forEach((facility, facilityIndex) => {
        const equipmentCount =
            facility.type === 'PHC' ? 5 :
                facility.type === 'BHC' ? 7 :
                    facility.type === 'Sub-District Hospital' ? 10 :
                        14;

        for (let i = 0; i < equipmentCount; i += 1) {
            const [name, category] = pick(EQUIPMENT, facilityIndex + i);

            records.push({
                equipment_id: `EQP-${pad(id, 5)}`,
                facility_id: facility.facility_id,
                name,
                category,
                available_quantity: 1 + ((facilityIndex + i) % 12),
                status: (facilityIndex + i) % 17 === 0 ? 'MAINTENANCE' : 'AVAILABLE',
                updated_at: new Date().toISOString()
            });

            id += 1;
        }
    });

    return records;
}

export function generateMedicines(facilities) {
    const records = [];
    let id = 1;

    facilities.forEach((facility, facilityIndex) => {
        MEDICINES.forEach((medicine, medicineIndex) => {
            const [name, category] = medicine;

            records.push({
                medicine_id: `MED-${pad(id, 5)}`,
                facility_id: facility.facility_id,
                name,
                category,
                current_stock: 50 + ((facilityIndex * 37 + medicineIndex * 19) % 950),
                min_safety_stock: 50 + (medicineIndex * 5),
                daily_consumption: 5 + ((facilityIndex + medicineIndex) % 30),
                status: (facilityIndex + medicineIndex) % 13 === 0 ? 'LOW_STOCK' : 'AVAILABLE',
                last_updated: new Date().toISOString(),
                dispensed_today: (facilityIndex + medicineIndex) % 25,
                unit: 'units',
                updated_at: new Date().toISOString()
            });

            id += 1;
        });
    });

    return records;
}

export function generateDiagnostics(facilities) {
    const records = [];
    let id = 1;

    facilities.forEach((facility, facilityIndex) => {
        const allowedCount =
            facility.type === 'PHC' ? 3 :
                facility.type === 'BHC' ? 5 :
                    facility.type === 'Sub-District Hospital' ? 7 :
                        10;

        for (let i = 0; i < allowedCount; i += 1) {
            const [name, category] = pick(DIAGNOSTICS, facilityIndex + i);

            const capacity = 10 + ((facilityIndex + i) % 40);
            const completed = Math.floor(capacity * ((facilityIndex + i) % 7) / 10);

            records.push({
                test_id: `DGN-${pad(id, 5)}`,
                facility_id: facility.facility_id,
                name,
                category,
                status: 'AVAILABLE',
                daily_capacity: capacity,
                completed_today: completed,
                remaining_capacity: Math.max(capacity - completed, 0),
                turnaround_hours:
                    category === 'Radiology' ? 8 + (i % 12) : 2 + (i % 8)
            });

            id += 1;
        }
    });

    return records;
}

export function generateAppointments(patients, doctors, facilities, count = 150) {
    const records = [];

    for (let i = 0; i < count; i += 1) {
        const patient = patients[i % patients.length];
        const doctor = doctors[i % doctors.length];
        const facility = facilities.find(
            (item) => item.facility_id === doctor.facility_id
        ) || facilities[0];

        records.push({
            appointment_id: `APT-${pad(i + 1, 5)}`,
            patient_id: patient.patient_id,
            patient_name: patient.name,
            doctor_id: doctor.user_id,
            doctor_name: doctor.name,
            facility_id: facility.facility_id,
            facility_name: facility.name,
            date: dateAhead(i % 30),
            time: `${pad(9 + (i % 8), 2)}:${i % 2 === 0 ? '00' : '30'}`,
            type: i % 4 === 0 ? 'TELECONSULTATION' : 'IN_PERSON',
            status: ['SCHEDULED', 'COMPLETED', 'WAITING'][i % 3],
            token_number: (i % 40) + 1,
            triage_priority: patient.triage_status,
            created_at: dateAgo(i % 30)
        });
    }

    return records;
}

export function generateTriages(patients, doctors, facilities, count = 120) {
    const workers = ['USR-WRK-001', 'USR-WRK-002', 'USR-WRK-003'];

    return Array.from({ length: count }, (_, i) => {
        const patient = patients[i % patients.length];
        const facility = facilities[i % facilities.length];

        return {
            triage_id: `TRG-${pad(i + 1, 5)}`,
            patient_id: patient.patient_id,
            health_worker_id: workers[i % workers.length],
            facility_id: facility.facility_id,
            priority: ['ROUTINE', 'STABLE', 'URGENT', 'EMERGENCY'][i % 4],
            indicators: [
                'Temperature recorded',
                'Blood pressure recorded',
                i % 3 === 0 ? 'Respiratory symptoms' : 'No respiratory distress'
            ],
            vitals: patient.vitals,
            reason: patient.triage_reason || 'General assessment',
            sync_status: i % 8 === 0 ? 'PENDING' : 'SYNCED',
            created_at: dateAgo(i % 60)
        };
    });
}

export function generateReferrals(patients, facilities, count = 80) {
    return Array.from({ length: count }, (_, i) => {
        const patient = patients[(i + 5) % patients.length];
        const source = facilities[i % facilities.length];
        const targets = facilities
            .filter((facility) => facility.facility_id !== source.facility_id)
            .slice(i % 5, (i % 5) + 3);

        return {
            referral_id: `REF-${pad(i + 1, 5)}`,
            patient_id: patient.patient_id,
            patient_name: patient.name,
            age: patient.age,
            referring_facility_id: source.facility_id,
            referring_facility_name: source.name,
            referring_worker: 'USR-WRK-001',
            specialty_required: pick(SPECIALTIES, i),
            clinical_notes: 'Synthetic referral for demonstration workflow.',
            priority: ['ROUTINE', 'URGENT', 'EMERGENCY'][i % 3],
            status: ['SENT', 'ACCEPTED', 'PENDING'][i % 3],
            accepted_hospital: targets[0]?.name || '',
            decision_reason: i % 3 === 1 ? 'Specialist and bed available' : '',
            target_hospitals: targets.map((facility) => ({
                facility_id: facility.facility_id,
                name: facility.name,
                score: 70 + ((i * 3) % 29)
            })),
            created_at: dateAgo(i % 90)
        };
    });
}

export function generateConsultations(patients, doctors, count = 100) {
    return Array.from({ length: count }, (_, i) => {
        const patient = patients[(i + 2) % patients.length];
        const doctor = doctors[i % doctors.length];

        return {
            consultation_id: `CON-${pad(i + 1, 5)}`,
            patient_id: patient.patient_id,
            doctor_id: doctor.user_id,
            facility_id: doctor.facility_id,
            complaint: ['Fever', 'Chest pain', 'Cough', 'Routine check-up', 'Joint pain'][i % 5],
            observations: 'Vitals reviewed and patient examined.',
            diagnosis: ['Viral fever', 'Hypertension', 'URTI', 'Routine follow-up', 'Arthralgia'][i % 5],
            notes: 'Synthetic consultation record for demonstration.',
            created_at: dateAgo(i % 90)
        };
    });
}

export function generatePrescriptions(patients, doctors, count = 100) {
    return Array.from({ length: count }, (_, i) => {
        const patient = patients[(i + 2) % patients.length];
        const doctor = doctors[i % doctors.length];

        const medicine = pick(MEDICINES, i);

        return {
            prescription_id: `RX-${pad(i + 1, 5)}`,
            patient_id: patient.patient_id,
            patient_name: patient.name,
            doctor_id: doctor.user_id,
            doctor_name: doctor.name,
            facility_name: doctor.facility_name,
            diagnosis: ['Fever', 'Hypertension', 'Diabetes', 'Respiratory infection'][i % 4],
            items: [
                {
                    medicine: medicine[0],
                    dosage: '1 tablet',
                    frequency: 'Twice daily',
                    duration: '5 days'
                }
            ],
            instructions: 'Take medicines as prescribed and return for follow-up.',
            status: i % 5 === 0 ? 'COMPLETED' : 'ACTIVE',
            adherence_summary: 'Synthetic adherence information.',
            date: dateAgo(i % 60),
            created_at: dateAgo(i % 60)
        };
    });
}

export function generateDiagnosticOrders(patients, doctors, diagnostics, count = 100) {
    return Array.from({ length: count }, (_, i) => {
        const patient = patients[(i + 4) % patients.length];
        const doctor = doctors[i % doctors.length];
        const diagnostic = diagnostics[i % diagnostics.length];

        return {
            order_id: `DOR-${pad(i + 1, 5)}`,
            patient_id: patient.patient_id,
            doctor_id: doctor.user_id,
            test_name: diagnostic.name,
            status: ['ORDERED', 'COMPLETED', 'IN_PROGRESS'][i % 3],
            result: i % 3 === 1 ? 'Within expected range' : '',
            created_at: dateAgo(i % 45)
        };
    });
}

export function generateFollowups(patients, doctors, count = 100) {
    return Array.from({ length: count }, (_, i) => {
        const patient = patients[(i + 1) % patients.length];
        const doctor = doctors[i % doctors.length];

        return {
            followup_id: `FUP-${pad(i + 1, 5)}`,
            patient_id: patient.patient_id,
            doctor_id: doctor.user_id,
            facility_id: doctor.facility_id,
            followup_date: dateAhead(7 + (i % 30)),
            reason: ['Medication review', 'Diagnostic review', 'Chronic disease follow-up', 'Post-referral review'][i % 4],
            status: ['SCHEDULED', 'COMPLETED', 'SCHEDULED'][i % 3],
            created_at: dateAgo(i % 30)
        };
    });
}

export function generateHealthWorkers(facilities, count = 50) {
    return Array.from({ length: count }, (_, i) => ({
        user_id: `USR-WRK-${pad(i + 1)}`,
        role: 'health_worker',
        name: `Health Worker ${makeName(i + 50)}`,
        name_mr: `आरोग्य कर्मचारी ${pick(FIRST_NAMES, i)}`,
        designation: i % 2 === 0 ? 'ASHA Worker' : 'Community Health Officer',
        facility_id: facilities[i % facilities.length].facility_id,
        facility_name: facilities[i % facilities.length].name,
        qualification: i % 2 === 0 ? 'ANM' : 'BSc Nursing',
        assigned_villages: [
            pick(VILLAGES, i),
            pick(VILLAGES, i + 4)
        ],
        created_at: dateAgo(i % 365)
    }));
}

export function generateFacilityAdmins(facilities) {
    return facilities.map((facility, i) => ({
        user_id: `USR-ADM-${pad(i + 1)}`,
        role: 'facility_admin',
        name: `Admin ${facility.name}`,
        designation: 'Facility Administrator',
        facility_id: facility.facility_id,
        facility_name: facility.name,
        created_at: dateAgo(i % 365)
    }));
}

export function generateAuditLogs(users, patients, facilities, count = 250) {
    return Array.from({ length: count }, (_, i) => {
        const user = users[i % users.length];
        const patient = patients[i % patients.length];
        const facility = facilities[i % facilities.length];

        return {
            id: `AUD-${pad(i + 1, 6)}`,
            user_id: user.user_id,
            user_name: user.name,
            role: user.role,
            action: [
                'PATIENT_SEARCH',
                'PATIENT_VIEW',
                'TRIAGE_CREATED',
                'FACILITY_MATCH_REQUESTED',
                'REFERRAL_CREATION',
                'CONSULTATION_CREATED',
                'PRESCRIPTION_CREATED',
                'DIAGNOSTIC_ORDER_CREATED',
                'FOLLOWUP_CREATED',
                'SYNC'
            ][i % 10],
            patient_id: patient.patient_id,
            facility_id: facility.facility_id,
            result: 'AUTHORIZED',
            reason: 'Synthetic demonstration activity',
            access_grant: i % 4 === 0 ? 'TIME_BOUND' : 'ROLE_BASED',
            timestamp: dateAgo(i % 90)
        };
    });
}

export function generateSyntheticNetwork() {
    const facilities = generateFacilities(50);
    const doctors = generateDoctors(150, facilities);
    const patients = generatePatients(500, facilities);
    const beds = generateBeds(facilities);
    const equipment = generateEquipment(facilities);
    const medicines = generateMedicines(facilities);
    const diagnostics = generateDiagnostics(facilities);

    const healthWorkers = generateHealthWorkers(facilities);
    const facilityAdmins = generateFacilityAdmins(facilities);

    const appointments = generateAppointments(
        patients,
        doctors,
        facilities,
        150
    );

    const triages = generateTriages(
        patients,
        doctors,
        facilities,
        120
    );

    const referrals = generateReferrals(
        patients,
        facilities,
        80
    );

    const consultations = generateConsultations(
        patients,
        doctors,
        100
    );

    const prescriptions = generatePrescriptions(
        patients,
        doctors,
        100
    );

    const diagnosticOrders = generateDiagnosticOrders(
        patients,
        doctors,
        diagnostics,
        100
    );

    const followups = generateFollowups(
        patients,
        doctors,
        100
    );

    const users = [
        ...doctors,
        ...healthWorkers,
        ...facilityAdmins
    ];

    const auditLogs = generateAuditLogs(
        users,
        patients,
        facilities,
        250
    );

    return {
        facilities,
        doctors,
        patients,
        beds,
        equipment,
        medicines,
        diagnostics,
        healthWorkers,
        facilityAdmins,
        appointments,
        triages,
        referrals,
        consultations,
        prescriptions,
        diagnosticOrders,
        followups,
        auditLogs
    };
}