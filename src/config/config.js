// Port number
const PORT = process.env.PORT || '3333';
const TOKEN = process.env.TOKEN || '';
const PROTECT_ROUTES = !!(process.env.PROTECT_ROUTES && process.env.PROTECT_ROUTES === 'true');

const RESTORE_SESSIONS_ON_START_UP = !!(
    process.env.RESTORE_SESSIONS_ON_START_UP && process.env.RESTORE_SESSIONS_ON_START_UP === 'true'
);

const APP_URL = process.env.APP_URL || false;

const LOG_LEVEL = process.env.LOG_LEVEL;

const INSTANCE_MAX_RETRY_QR = process.env.INSTANCE_MAX_RETRY_QR || 2;

const CLIENT_PLATFORM = process.env.CLIENT_PLATFORM || 'Whatsapp MD';
const CLIENT_BROWSER = process.env.CLIENT_BROWSER || 'Chrome';
const CLIENT_VERSION = process.env.CLIENT_VERSION || '4.0.0';

// Enable or disable mongodb
const MONGODB_ENABLED = !!(process.env.MONGODB_ENABLED && process.env.MONGODB_ENABLED === 'true');
// URL of the Mongo DB
const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://127.0.0.1:27017/whatsapp_api';

// Database sessions of the Mongo DB
const MONGODB_SESSIONS = process.env.MONGODB_SESSIONS || 'whatsapp_sessions';

// Enable or disable webhook globally on project
const WEBHOOK_ENABLED = !!(process.env.WEBHOOK_ENABLED && process.env.WEBHOOK_ENABLED === 'true');
// Webhook URL
const WEBHOOK_URL = process.env.WEBHOOK_URL;

// Receive message MEDIA IN WEBHOOK
const WEBHOOK_SEND_MEDIA = !!(
    process.env.WEBHOOK_SEND_MEDIA && process.env.WEBHOOK_SEND_MEDIA === 'true'
);

// Type message MEDIA IN WEBHOOK
const WEBHOOK_TYPE_MEDIA = process.env.WEBHOOK_TYPE_MEDIA || 'base';

// allowed events which should be sent to webhook
const WEBHOOK_ALLOWED_EVENTS = process.env.WEBHOOK_ALLOWED_EVENTS?.split(',') || ['all'];
// Mark messages as seen
const MARK_MESSAGES_READ = !!(
    process.env.MARK_MESSAGES_READ && process.env.MARK_MESSAGES_READ === 'true'
);

// Enable or disable presence
const HIDDEN_PRESENCE = !!(process.env.HIDDEN_PRESENCE && process.env.HIDDEN_PRESENCE === 'true');

module.exports = {
    port: PORT,
    token: TOKEN,
    restoreSessionsOnStartup: RESTORE_SESSIONS_ON_START_UP,
    appUrl: APP_URL,
    log: {
        level: LOG_LEVEL
    },
    instance: {
        maxRetryQr: INSTANCE_MAX_RETRY_QR
    },
    mongoose: {
        enabled: MONGODB_ENABLED,
        url: MONGODB_URL,
        sessions: MONGODB_SESSIONS,
        options: {
            // useCreateIndex: true,
            // useNewUrlParser: true,
            // useUnifiedTopology: true,
        }
    },
    browser: {
        platform: CLIENT_PLATFORM,
        browser: CLIENT_BROWSER,
        version: CLIENT_VERSION
    },
    webhookEnabled: WEBHOOK_ENABLED,
    webhookUrl: WEBHOOK_URL,
    webhookSendMedia: WEBHOOK_SEND_MEDIA,
    webhookTypeMedia: WEBHOOK_TYPE_MEDIA,
    protectRoutes: PROTECT_ROUTES,
    markMessagesRead: MARK_MESSAGES_READ,
    webhookAllowedEvents: WEBHOOK_ALLOWED_EVENTS,
    firebaseConfig: {
        apiKey: process.env.FIREBASE_API_KEY || '',
        authDomain: process.env.FIREBASE_AUTH_DOMAIN || '',
        projectId: process.env.FIREBASE_PROJECT_ID || '',
        databaseURL: process.env.FIREBASE_FIRESTORE_DB_URL || '',
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET || '',
        messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || '',
        appId: process.env.FIREBASE_APP_ID || '',
        measurementId: process.env.FIREBASE_MEASUREMENT_ID || ''
    },
    hiddenPresence: HIDDEN_PRESENCE
};
