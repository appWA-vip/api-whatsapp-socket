const logger = require('../helper/log');
const cron = require('node-cron');
const { Session } = require('../class/session');

const instancesCron = async () => {
    try {
        cron.schedule(`10 * * * *`, async () => {
            await actionInstances();
        });
    } catch (error) {
        logger.error(`[instancesCron]: ${error}`, error);
    }
};

const actionInstances = async () => {
    try {
        logger.debug(`Restoring Sessions in cronjob`);
        const session = new Session();
        let restoreSessions = await session.restoreSessions();
        logger.debug(`${restoreSessions.length} Session(s) Restored`);
    } catch (error) {
        logger.error(`[actionInstances]: ${error}`, error);
    }
};

module.exports = instancesCron;
