const instances = require('./instances.cron.js');
const lived = require('./lived.cron.js');

exports.startCronJobs = async () => {
    instances();
    lived();
};
