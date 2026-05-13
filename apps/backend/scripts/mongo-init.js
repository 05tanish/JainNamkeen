// =============================================================================
// MongoDB Initialization Script
// =============================================================================
// This script runs when the MongoDB container first starts
// It creates the database, collections, indexes, and initial configuration

// Switch to the ecommerce database
db = db.getSiblingDB('ecommerce');

// Create collections with validation schemas
db.createCollection('auditlogs', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['userId', 'action', 'timestamp', 'ipAddress'],
      properties: {
        userId: {
          bsonType: 'string',
          description: 'User ID who performed the action'
        },
        action: {
          bsonType: 'string',
          description: 'Action performed (e.g., LOGIN, CREATE_ORDER, UPDATE_PRODUCT)'
        },
        resource: {
          bsonType: 'string',
          description: 'Resource affected (e.g., users, orders, products)'
        },
        resourceId: {
          bsonType: 'string',
          description: 'ID of the affected resource'
        },
        method: {
          bsonType: 'string',
          enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
          description: 'HTTP method used'
        },
        endpoint: {
          bsonType: 'string',
          description: 'API endpoint called'
        },
        statusCode: {
          bsonType: 'int',
          description: 'HTTP status code'
        },
        ipAddress: {
          bsonType: 'string',
          description: 'IP address of the client'
        },
        userAgent: {
          bsonType: 'string',
          description: 'User agent string'
        },
        requestBody: {
          bsonType: 'object',
          description: 'Request body (sanitized)'
        },
        responseBody: {
          bsonType: 'object',
          description: 'Response body (sanitized)'
        },
        duration: {
          bsonType: 'int',
          description: 'Request duration in milliseconds'
        },
        timestamp: {
          bsonType: 'date',
          description: 'Timestamp of the action'
        },
        metadata: {
          bsonType: 'object',
          description: 'Additional metadata'
        }
      }
    }
  }
});

db.createCollection('notifications', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['userId', 'type', 'title', 'message', 'createdAt'],
      properties: {
        userId: {
          bsonType: 'string',
          description: 'User ID who will receive the notification'
        },
        type: {
          bsonType: 'string',
          enum: ['ORDER', 'PAYMENT', 'PRODUCT', 'SYSTEM', 'PROMOTION'],
          description: 'Type of notification'
        },
        title: {
          bsonType: 'string',
          description: 'Notification title'
        },
        message: {
          bsonType: 'string',
          description: 'Notification message'
        },
        link: {
          bsonType: 'string',
          description: 'Link to related resource'
        },
        isRead: {
          bsonType: 'bool',
          description: 'Whether the notification has been read'
        },
        readAt: {
          bsonType: 'date',
          description: 'Timestamp when notification was read'
        },
        createdAt: {
          bsonType: 'date',
          description: 'Timestamp when notification was created'
        },
        expiresAt: {
          bsonType: 'date',
          description: 'Timestamp when notification expires'
        },
        metadata: {
          bsonType: 'object',
          description: 'Additional metadata'
        }
      }
    }
  }
});

// Create indexes for auditlogs collection
db.auditlogs.createIndex({ userId: 1, timestamp: -1 });
db.auditlogs.createIndex({ action: 1, timestamp: -1 });
db.auditlogs.createIndex({ resource: 1, resourceId: 1 });
db.auditlogs.createIndex({ timestamp: -1 });
db.auditlogs.createIndex({ ipAddress: 1, timestamp: -1 });
db.auditlogs.createIndex({ statusCode: 1, timestamp: -1 });

// Create TTL index to automatically delete old audit logs after 90 days
db.auditlogs.createIndex(
  { timestamp: 1 },
  { expireAfterSeconds: 7776000 } // 90 days
);

// Create indexes for notifications collection
db.notifications.createIndex({ userId: 1, createdAt: -1 });
db.notifications.createIndex({ userId: 1, isRead: 1 });
db.notifications.createIndex({ type: 1, createdAt: -1 });
db.notifications.createIndex({ createdAt: -1 });

// Create TTL index to automatically delete old notifications after 30 days
db.notifications.createIndex(
  { expiresAt: 1 },
  { expireAfterSeconds: 0 }
);

// Create a capped collection for real-time events (optional)
db.createCollection('events', {
  capped: true,
  size: 10485760, // 10MB
  max: 10000 // Maximum 10,000 documents
});

// Create indexes for events collection
db.events.createIndex({ type: 1, timestamp: -1 });
db.events.createIndex({ timestamp: -1 });

// Insert sample audit log (for testing)
db.auditlogs.insertOne({
  userId: 'system',
  action: 'DATABASE_INITIALIZED',
  resource: 'database',
  resourceId: 'ecommerce',
  method: 'POST',
  endpoint: '/init',
  statusCode: 200,
  ipAddress: '127.0.0.1',
  userAgent: 'MongoDB Init Script',
  timestamp: new Date(),
  metadata: {
    message: 'MongoDB database initialized successfully',
    version: '7.0'
  }
});

// Create database user with specific permissions (optional)
// db.createUser({
//   user: 'ecommerce_app',
//   pwd: 'change_this_password',
//   roles: [
//     { role: 'readWrite', db: 'ecommerce' }
//   ]
// });

// Create read-only user for analytics (optional)
// db.createUser({
//   user: 'ecommerce_readonly',
//   pwd: 'change_this_password',
//   roles: [
//     { role: 'read', db: 'ecommerce' }
//   ]
// });

// Enable profiling for slow queries (queries taking more than 100ms)
db.setProfilingLevel(1, { slowms: 100 });

// Print success message
print('=============================================================================');
print('MongoDB Initialization Complete!');
print('=============================================================================');
print('Database: ecommerce');
print('Collections created:');
print('  - auditlogs (with validation schema and indexes)');
print('  - notifications (with validation schema and indexes)');
print('  - events (capped collection for real-time events)');
print('');
print('Indexes created:');
print('  - auditlogs: userId, action, resource, timestamp, ipAddress, statusCode');
print('  - notifications: userId, type, isRead, createdAt');
print('  - events: type, timestamp');
print('');
print('TTL indexes:');
print('  - auditlogs: 90 days retention');
print('  - notifications: 30 days retention (via expiresAt field)');
print('');
print('Profiling enabled: Slow queries > 100ms will be logged');
print('=============================================================================');
