import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Notification title is required'],
        trim: true
    },
    body: {
        type: String,
        required: [true, 'Notification body is required']
    },
    type: {
        type: String,
        enum: ['broadcast', 'promo', 'system', 'email_campaign'],
        default: 'broadcast'
    },
    recipients: {
        type: String,
        enum: ['all', 'users', 'staff', 'admin'],
        default: 'all'
    },
    subject: {
        type: String,
        default: ''
    },
    isSent: {
        type: Boolean,
        default: false
    },
    sentAt: {
        type: Date,
        default: null
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, { timestamps: true });

export default mongoose.model('Notification', notificationSchema);
