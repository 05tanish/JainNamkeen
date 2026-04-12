import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '12', 10);

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Name is required'],
            trim: true,
            maxlength: [50, 'Name cannot exceed 50 characters'],
        },
        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            lowercase: true,
            trim: true,
            match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
            index: true,
        },
        password: {
            type: String,
            required: [true, 'Password is required'],
            minlength: [6, 'Password must be at least 6 characters'],
            select: false,
        },
        role: {
            type: String,
            enum: { values: ['user', 'staff', 'admin'], message: 'Role must be user, staff, or admin' },
            default: 'user',
            index: true,
        },
        phone: {
            type: String,
            default: '',
            trim: true,
        },
        address: {
            street: { type: String, default: '', trim: true },
            city:   { type: String, default: '', trim: true },
            state:  { type: String, default: '', trim: true },
            pincode: { type: String, default: '', trim: true },
        },
        isActive: {
            type: Boolean,
            default: true,
            index: true,
        },
        isSuspended: {
            type: Boolean,
            default: false,
            select: false,
        },
        suspendReason: {
            type: String,
            default: '',
            select: false,
        },
        suspendedAt: {
            type: Date,
            default: null,
            select: false,
        },
        readNotifications: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Notification',
            },
        ],
    },
    {
        timestamps: true,
        // Strip __v and password from JSON output automatically
        toJSON: {
            versionKey: false,
            transform: (_doc, ret) => {
                delete ret.password;
                delete ret.isSuspended;
                delete ret.suspendReason;
                delete ret.suspendedAt;
                return ret;
            },
        },
        toObject: { versionKey: false },
    }
);

// ── Pre-save: hash password only when modified ────────────────────────────────
userSchema.pre('save', async function () {
    if (!this.isModified('password')) return;
    this.password = await bcrypt.hash(this.password, BCRYPT_ROUNDS);
});

// ── Instance method: verify password ─────────────────────────────────────────
userSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

// ── Compound index: active users by role (common admin queries) ───────────────
userSchema.index({ role: 1, isActive: 1 });
userSchema.index({ createdAt: -1 });

export default mongoose.model('User', userSchema);
