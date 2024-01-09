const instances = require('./instances.cron.js');

exports.startCronJobs = async () => {
    instances();
};
