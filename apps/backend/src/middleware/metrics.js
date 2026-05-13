import promClient from 'prom-client';
import { logger } from '../utils/logger.js';


promClient.collectDefaultMetrics({
    // How often to collect metrics (in milliseconds)
    timeout: 5000,
    // Prefix for all default metrics
    prefix: 'nodejs_',
});

// ── Create custom metrics ─────────────────────────────────────────────────────

// HTTP request counter — tracks total requests by method, route, status
const httpRequestsTotal = new promClient.Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status_code'],
});

// HTTP request duration histogram — tracks response times
const httpRequestDuration = new promClient.Histogram({
    name: 'http_request_duration_ms',
    help: 'Duration of HTTP requests in milliseconds',
    labelNames: ['method', 'route', 'status_code'],
    // Buckets for response time distribution (in milliseconds)
    buckets: [1, 5, 15, 50, 100, 200, 300, 400, 500, 1000, 2000, 5000],
});

// Active connections gauge — current number of active connections
const activeConnections = new promClient.Gauge({
    name: 'http_active_connections',
    help: 'Number of active HTTP connections',
});

// Database query metrics
const dbQueryDuration = new promClient.Histogram({
    name: 'db_query_duration_ms',
    help: 'Duration of database queries in milliseconds',
    labelNames: ['operation', 'table'],
    buckets: [1, 5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000],
});

const dbQueryTotal = new promClient.Counter({
    name: 'db_queries_total',
    help: 'Total number of database queries',
    labelNames: ['operation', 'table', 'status'],
});

// Business metrics
const ordersTotal = new promClient.Counter({
    name: 'orders_total',
    help: 'Total number of orders',
    labelNames: ['status'],
});

const revenueTotal = new promClient.Counter({
    name: 'revenue_total',
    help: 'Total revenue in cents',
    labelNames: ['currency'],
});

const usersTotal = new promClient.Gauge({
    name: 'users_total',
    help: 'Total number of registered users',
});

const cartItemsTotal = new promClient.Gauge({
    name: 'cart_items_total',
    help: 'Total number of items in all carts',
});

// Redis metrics
const redisOperations = new promClient.Counter({
    name: 'redis_operations_total',
    help: 'Total number of Redis operations',
    labelNames: ['operation', 'status'],
});

const redisConnectionsActive = new promClient.Gauge({
    name: 'redis_connections_active',
    help: 'Number of active Redis connections',
});

// ── BullMQ Worker Metrics ─────────────────────────────────────────────────────
export const workerMetrics = {
    jobsProcessed: new promClient.Counter({
        name: 'bullmq_jobs_processed_total',
        help: 'Total number of jobs processed',
        labelNames: ['queue', 'job_type', 'status']
    }),
    
    jobDuration: new promClient.Histogram({
        name: 'bullmq_job_duration_ms',
        help: 'Job processing duration in milliseconds',
        labelNames: ['queue', 'job_type'],
        buckets: [10, 50, 100, 500, 1000, 5000, 10000, 30000]
    }),
    
    queueDepth: new promClient.Gauge({
        name: 'bullmq_queue_depth',
        help: 'Number of jobs waiting in queue',
        labelNames: ['queue', 'status']
    }),
    
    workerActive: new promClient.Gauge({
        name: 'bullmq_worker_active',
        help: 'Number of active workers',
        labelNames: ['queue']
    })
};

// ── Middleware function ───────────────────────────────────────────────────────
export const metricsMiddleware = (req, res, next) => {
    // Skip metrics collection for the /metrics endpoint itself
    if (req.path === '/metrics') {
        return next();
    }

    const startTime = Date.now();
    
    // Increment active connections
    activeConnections.inc();

    // Override res.end to capture metrics when response finishes
    const originalEnd = res.end;
    res.end = function(...args) {
        // Calculate response time
        const duration = Date.now() - startTime;
        
        // Get route pattern (e.g., /api/users/:id instead of /api/users/123)
        const route = req.route ? req.route.path : req.path;
        
        // Record metrics
        httpRequestsTotal
            .labels(req.method, route, res.statusCode.toString())
            .inc();
            
        httpRequestDuration
            .labels(req.method, route, res.statusCode.toString())
            .observe(duration);
        
        // Decrement active connections
        activeConnections.dec();
        
        // Call original res.end
        originalEnd.apply(this, args);
    };

    next();
};

// ── Metrics endpoint ──────────────────────────────────────────────────────────
export const metricsEndpoint = async (req, res) => {
    try {
        // Set content type for Prometheus
        res.set('Content-Type', promClient.register.contentType);
        
        // Get all metrics in Prometheus format
        const metrics = await promClient.register.metrics();
        
        res.end(metrics);
    } catch (error) {
        logger.error('Error generating metrics', { error: error.message });
        res.status(500).end('Error generating metrics');
    }
};

// ── Helper functions for business metrics ─────────────────────────────────────

export const recordOrder = (status, amount, currency = 'USD') => {
    ordersTotal.labels(status).inc();
    if (status === 'completed' && amount) {
        revenueTotal.labels(currency).inc(amount);
    }
};

export const updateUserCount = (count) => {
    usersTotal.set(count);
};

export const updateCartItemsCount = (count) => {
    cartItemsTotal.set(count);
};

export const recordDbQuery = (operation, table, duration, success = true) => {
    dbQueryDuration.labels(operation, table).observe(duration);
    dbQueryTotal.labels(operation, table, success ? 'success' : 'error').inc();
};

export const recordRedisOperation = (operation, success = true) => {
    redisOperations.labels(operation, success ? 'success' : 'error').inc();
};

export const updateRedisConnections = (count) => {
    redisConnectionsActive.set(count);
};

// ── Export metrics for external use ───────────────────────────────────────────
export const metrics = {
    httpRequestsTotal,
    httpRequestDuration,
    activeConnections,
    dbQueryDuration,
    dbQueryTotal,
    ordersTotal,
    revenueTotal,
    usersTotal,
    cartItemsTotal,
    redisOperations,
    redisConnectionsActive,
};

// ── Health check metrics ──────────────────────────────────────────────────────
export const healthCheck = new promClient.Gauge({
    name: 'app_health',
    help: 'Application health status (1 = healthy, 0 = unhealthy)',
    labelNames: ['component'],
});

// Set initial health status
healthCheck.labels('app').set(1);
healthCheck.labels('database').set(1);
healthCheck.labels('redis').set(1);