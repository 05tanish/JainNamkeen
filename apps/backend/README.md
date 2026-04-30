# Jain Namkeen E-commerce Backend API

Production-ready Node.js/Express backend with MongoDB, featuring comprehensive logging, audit trails, email verification, and security best practices.

## Features

- ✅ RESTful API with Express 5
- ✅ MongoDB with Mongoose ODM
- ✅ JWT Authentication with httpOnly cookies
- ✅ Email verification with Resend
- ✅ Disposable email blocking
- ✅ Comprehensive audit logging
- ✅ Winston logging system
- ✅ Request/response logging
- ✅ Security middleware (Helmet, CORS, Rate Limiting)
- ✅ Input validation with Zod
- ✅ File uploads with Cloudinary
- ✅ Role-based access control
- ✅ Error handling middleware
- ✅ Production-ready configuration

## Prerequisites

- Node.js >= 18.x
- MongoDB >= 6.x
- npm or yarn

## Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Copy `.env.example` to `.env` and configure:
```bash
cp .env.example .env
```

4. Update `.env` with your credentials:
   - MongoDB connection string
   - JWT secret (min 64 characters)
   - Resend API key
   - Cloudinary credentials
   - Frontend URL

## Running the Application

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

## Project Structure

```
src/
├── config/           # Configuration files
│   ├── db.js        # MongoDB connection
│   └── cloudinary.js # Cloudinary setup
├── middleware/       # Express middleware
│   ├── auth.js      # Authentication middleware
│   ├── role.js      # Role-based access control
│   ├── validate.js  # Zod validation middleware
│   ├── auditMiddleware.js # Audit logging
│   ├── requestLogger.js   # HTTP request logging
│   ├── errorMiddleware.js # Error handling
│   └── upload.js    # File upload handling
├── modules/          # Feature modules
│   ├── auth/        # Authentication
│   ├── users/       # User management
│   ├── products/    # Product catalog
│   ├── orders/      # Order processing
│   ├── cart/        # Shopping cart
│   ├── categories/  # Product categories
│   ├── coupons/     # Discount coupons
│   ├── reviews/     # Product reviews
│   ├── banners/     # Homepage banners
│   ├── notifications/ # User notifications
│   ├── attendance/  # Staff attendance
│   ├── pages/       # CMS pages
│   └── admin/       # Admin analytics
├── utils/            # Utility functions
│   ├── logger.js    # Winston logger
│   ├── auditLogger.js # Audit log system
│   ├── emailService.js # Email sending
│   └── asyncHandler.js # Async error wrapper
├── logs/             # Log files (gitignored)
└── server.js         # Application entry point
```

## API Documentation

### Authentication Endpoints

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile
- `PUT /api/auth/password` - Change password
- `POST /api/auth/verify-email` - Verify email
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password

### Product Endpoints

- `GET /api/products` - List products (with filters)
- `GET /api/products/:id` - Get product details
- `POST /api/products` - Create product (admin/staff)
- `PUT /api/products/:id` - Update product (admin/staff)
- `DELETE /api/products/:id` - Delete product (admin)
- `GET /api/products/trending` - Get trending products
- `GET /api/products/suggest` - Auto-suggest search

### Order Endpoints

- `POST /api/orders` - Create order
- `GET /api/orders` - List orders
- `GET /api/orders/:id` - Get order details
- `PUT /api/orders/:id/status` - Update order status (admin/staff)
- `PUT /api/orders/:id/tracking` - Update tracking info (admin/staff)
- `PUT /api/orders/:id/request-return` - Request return
- `PUT /api/orders/:id/refund` - Process refund (admin)

### Cart Endpoints

- `GET /api/cart` - Get user cart
- `POST /api/cart` - Add item to cart
- `PUT /api/cart/:productId` - Update cart item
- `DELETE /api/cart/:productId` - Remove cart item
- `DELETE /api/cart/clear` - Clear cart

### User Management (Admin)

- `GET /api/users` - List users
- `GET /api/users/:id` - Get user details
- `PUT /api/users/:id/role` - Update user role
- `PUT /api/users/:id/status` - Toggle user status
- `PUT /api/users/:id/suspend` - Suspend user
- `PUT /api/users/:id/unsuspend` - Unsuspend user

## Logging System

### Log Files

- `logs/combined.log` - All logs
- `logs/error.log` - Error logs only
- `logs/http.log` - HTTP request logs
- `logs/audit.log` - Audit trail logs

### Log Levels

- `error` - Error messages
- `warn` - Warning messages
- `info` - Informational messages
- `http` - HTTP requests
- `debug` - Debug messages (development only)

### Cleaning Old Logs

```bash
npm run logs:clean
```

## Audit Logging

All sensitive operations are automatically logged to the audit trail:

- User authentication (login, logout, failed attempts)
- User management (create, update, delete, role changes)
- Product management (create, update, delete)
- Order operations (create, status changes, refunds)
- Security events (unauthorized access, rate limiting)

### Querying Audit Logs

```javascript
import { getAuditLogs, getSecurityAuditLogs } from './utils/auditLogger.js';

// Get all audit logs
const logs = await getAuditLogs({
    userId: 'user_id',
    action: 'USER_LOGIN',
    startDate: '2024-01-01',
    endDate: '2024-12-31'
}, {
    page: 1,
    limit: 50
});

// Get security-related logs
const securityLogs = await getSecurityAuditLogs({
    startDate: '2024-01-01'
});
```

## Email System

### Supported Email Types

1. **Email Verification** - Sent on registration
2. **Password Reset** - Sent on forgot password
3. **Order Confirmation** - Sent on order creation
4. **Order Status Updates** - Sent on status changes

### Blocked Email Domains

The system automatically blocks 100+ disposable/temporary email domains including:
- tempmail.com
- guerrillamail.com
- mailinator.com
- 10minutemail.com
- And many more...

### Sending Emails

```javascript
import { sendVerificationEmail } from './utils/emailService.js';

await sendVerificationEmail(email, name, verificationToken);
```

## Security Features

### Implemented Security Measures

- ✅ Helmet.js for HTTP headers
- ✅ CORS with whitelist
- ✅ Rate limiting (100 requests per 15 minutes)
- ✅ MongoDB injection prevention
- ✅ HTTP Parameter Pollution prevention
- ✅ JWT with httpOnly cookies
- ✅ Password hashing with bcrypt
- ✅ Input validation with Zod
- ✅ Disposable email blocking
- ✅ Failed login attempt tracking
- ✅ Audit logging for security events

### Rate Limiting

Default: 100 requests per 15 minutes per IP

Configure in `.env`:
```
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## Environment Variables

See `.env.example` for all available configuration options.

### Required Variables

- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - JWT signing secret (min 64 chars)
- `RESEND_API_KEY` - Resend API key for emails
- `CLOUDINARY_*` - Cloudinary credentials
- `FRONTEND_URL` - Frontend application URL

## Error Handling

All errors are handled by the centralized error middleware:

```javascript
// Automatic error handling with try-catch
export const getProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.json(product);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
```

## Testing

```bash
# Run tests (when implemented)
npm test

# Run linter
npm run lint
```

## Deployment

### Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Generate strong JWT_SECRET (64+ characters)
- [ ] Configure production MongoDB URI
- [ ] Set up Resend with verified domain
- [ ] Configure Cloudinary production account
- [ ] Enable file logging
- [ ] Set up log rotation
- [ ] Configure CORS whitelist
- [ ] Set up SSL/TLS certificates
- [ ] Configure reverse proxy (nginx)
- [ ] Set up monitoring (PM2, New Relic, etc.)
- [ ] Configure backup strategy
- [ ] Set up error tracking (Sentry)

### Recommended Hosting

- **Backend**: Railway, Render, DigitalOcean, AWS
- **Database**: MongoDB Atlas
- **File Storage**: Cloudinary
- **Email**: Resend

## Maintenance

### Log Cleanup

Run periodically to clean old logs:
```bash
npm run logs:clean
```

### Database Cleanup

Clean old audit logs (older than 90 days):
```javascript
import { deleteOldAuditLogs } from './utils/auditLogger.js';
await deleteOldAuditLogs(90);
```

## Support

For issues and questions, please open an issue on GitHub.

## License

ISC
