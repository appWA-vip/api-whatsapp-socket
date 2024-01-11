// Port number
const PORT = process.env.PORT || '3333';
const TOKEN = process.env.TOKEN || '';
const PROTECT_ROUTES = !!(process.env.PROTECT_ROUTES && process.env.PROTECT_ROUTES === 'true');

const RESTORE_SESSIONS_ON_START_UP = !!(
    process.env.RESTORE_SESSIONS_ON_START_UP && process.env.RESTORE_SESSIONS_ON_START_UP === 'true'
);

const APP_URL = process.env.APP_URL || false;

const LOG_LEVEL = process.env.LOG_LEVEL;
const ENABLE_LOGGING = !!(process.env.ENABLE_LOGGING && process.env.ENABLE_LOGGING === 'true');
const ENABLE_LOGGING_INSTANCES = !!(
    process.env.ENABLE_LOGGING_INSTANCES && process.env.ENABLE_LOGGING_INSTANCES === 'true'
);

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

// rounds for presence
const ROUNDS_SESSION_PRESENCE = parseInt(process.env.ROUNDS_SESSION_PRESENCE) || 100;

// Version whatsapp
const VERSION_AUTO_FETCH = !!(
    process.env.VERSION_AUTO_FETCH && process.env.VERSION_AUTO_FETCH === 'true'
);
const VERSION_WHATSAPP_1 = process.env.VERSION_WHATSAPP_1 || '2';
const VERSION_WHATSAPP_2 = process.env.VERSION_WHATSAPP_2 || '2329';
const VERSION_WHATSAPP_3 = process.env.VERSION_WHATSAPP_3 || '9';

module.exports = {
    port: PORT,
    token: TOKEN,
    restoreSessionsOnStartup: RESTORE_SESSIONS_ON_START_UP,
    appUrl: APP_URL,
    log: {
        level: LOG_LEVEL,
        enabled: ENABLE_LOGGING,
        instances: ENABLE_LOGGING_INSTANCES
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
    version: {
        auto: VERSION_AUTO_FETCH,
        path_1: VERSION_WHATSAPP_1,
        path_2: VERSION_WHATSAPP_2,
        path_3: VERSION_WHATSAPP_3
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
    do: {
        access_key: process.env.DIGITAL_OCEAN_ACCESS_KEY_ID || '',
        secret_access_key: process.env.DIGITAL_OCEAN_SECRET_ACCESS_KEY || '',
        endpoint: process.env.DIGITAL_OCEAN_END_POINT || '',
        bucket: process.env.DIGITAL_OCEAN_BUCKET_NAME || '',
        folder: process.env.DIGITAL_OCEAN_PATH_FOLDER || ''
    },
    hiddenPresence: HIDDEN_PRESENCE,
    roundsPresence: ROUNDS_SESSION_PRESENCE
};
