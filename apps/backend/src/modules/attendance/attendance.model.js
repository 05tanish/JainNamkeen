import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema({
    user: {
        type: String, // Prisma CUID — users live in PostgreSQL, not MongoDB
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: ['present', 'absent', 'late', 'half-day'],
        default: 'present'
    },
    markedBy: {
        type: String, // Prisma CUID — same reason as above
        required: true
    },
    note: {
        type: String,
        default: ''
    }
}, { timestamps: true, toJSON: { versionKey: false }, toObject: { versionKey: false } });

// Prevent duplicate attendance for same user on same day
attendanceSchema.index({ user: 1, date: 1 }, { unique: true });

export default mongoose.model('Attendance', attendanceSchema);
