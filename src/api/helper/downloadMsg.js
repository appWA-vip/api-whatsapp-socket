/* eslint-disable no-undefined */
const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const logger = require('pino')();

module.exports = async function downloadMessage(message, msgType, media, sock) {
    if (media === '' || media === undefined || media === null) {
        return '';
    }

    const buffer = await downloadMediaMessage(
        message,
        'buffer',
        {},
        {
            logger: logger,

            reuploadRequest: sock.updateMediaMessage
        }
    );

    return buffer;
};
