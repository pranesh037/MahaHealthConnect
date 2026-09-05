import mongoose from 'mongoose';

const accessGrantSchema = new mongoose.Schema({
    grant_id: {
        type: String,
        required: true,
        unique: true
    },

    patient_id: {
        type: String,
        required: true
    },

    doctor_id: {
        type: String,
        required: true
    },

    doctor_name: {
        type: String
    },

    facility_id: {
        type: String
    },

    facility_name: {
        type: String
    },

    granted_by: {
        type: String,
        required: true
    },

    granted_by_name: {
        type: String
    },

    reason: {
        type: String
    },

    access_type: {
        type: String,
        default: 'CLINICAL_FULL'
    },

    starts_at: {
        type: Date,
        required: true
    },

    expires_at: {
        type: Date,
        required: true
    },

    status: {
        type: String,
        enum: ['ACTIVE', 'EXPIRED', 'REVOKED'],
        default: 'ACTIVE'
    },

    created_at: {
        type: Date,
        default: Date.now
    }
}, { timestamps: false });

export const AccessGrant =
    mongoose.models.AccessGrant ||
    mongoose.model('AccessGrant', accessGrantSchema);