const { downloadContentFromMessage } = require('@whiskeysockets/baileys')

module.exports = async function downloadMessage(msg, msgType, media) {
    if (media === '' || media === undefined || media === null) {
        return '';
    }
    let buffer = Buffer.from([])
    try {
        const stream = await downloadContentFromMessage(msg, msgType)
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk])
        }
    } catch (e) {
        return "";
    }
    return buffer.toString('base64')
}
