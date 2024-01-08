const pino = require('pino');
const config = require('../../config/config');

const logger = pino({
    level: config.log.level,
    enabled: config.log.enabled
});

module.exports = logger;
