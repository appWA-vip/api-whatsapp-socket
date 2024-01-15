const logger = require('../helper/log');
const cron = require('node-cron');
const config = require('../../config/config');
const axios = require('axios');

const livedCron = async () => {
    try {
        await actionInstances();
        cron.schedule(`1 * * * *`, async () => {
            await actionInstances();
        });
    } catch (error) {
        logger.error(`[livedCron]: ${error}`, error);
    }
};

const actionInstances = async () => {
    try {
        logger.debug(`lived Session in cronjob`);

        const allowWebhook = config.webhookEnabled;
        const webhookUrl = config.webhookLiveAtUrl;

        if (!allowWebhook) return;

        const axiosInstance = axios.create({
            baseURL: webhookUrl
        });

        axiosInstance
            .post('', {
                type: 'server:liveAt',
                server: config.idServer
            })
            .catch(() => {});

        logger.debug(`call server liveAt`);
    } catch (error) {
        logger.error(`[actionInstances]: ${error}`, error);
    }
};

module.exports = livedCron;
