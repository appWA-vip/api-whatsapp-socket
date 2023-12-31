const config = require('../../config/config');
const Contacts = require('../models/contacts.model');
const downloadMessage = require('./downloadMsg');
const uploadFirebase = require('./firebaseUpload');
const uploadDo = require('./doUpload');

module.exports = async function parseMessage(m, type, key, sock) {
    let id = String(m.key.id);
    let remoteJid = String(m.key.remoteJid);
    let phone = String(m.key.remoteJid).replace('@s.whatsapp.net', '');
    let pushName = String(m.pushName);
    let messageTimestamp = Number(m.messageTimestamp);
    let nameContact = '';

    const message = extractDataMessage(m.message);
    if (!message) {
        return null;
    }

    if (!message.type) {
        return null;
    }

    let reppy = {};

    if (message.isRepply) {
        reppy = extractDataMessage(m.message?.extendedTextMessage?.contextInfo?.quotedMessage);
    }

    const data = {
        id,
        remoteJid,
        phone,
        pushName,
        nameContact,
        messageTimestamp,
        ...message,
        reppy
    };

    if (!m.key.fromMe && type === 'notify') {
        data.owner = 'user';
    } else if (m.key.fromMe && type === 'notify') {
        data.pushName = 'unamed';
        data.owner = 'another-device';
    } else {
        return null;
    }

    if (config.webhookSendMedia) {
        if (data.type === 'imageMessage') {
            data.media = await downloadMessage(m, 'image', data.media, sock);
        } else if (data.type === 'videoMessage') {
            data.media = await downloadMessage(m, 'video', data.media, sock);
        } else if (data.type === 'audioMessage') {
            data.media = await downloadMessage(m, 'audio', data.media, sock);
        } else if (data.type === 'documentMessage') {
            data.media = await downloadMessage(m, 'document', data.media, sock);
        }

        if (config.webhookTypeMedia === 'firebase' && data.media !== '') {
            data.media = await uploadFirebase(data.media, data.mimetype);
        }
        if (config.webhookTypeMedia === 'do' && data.media !== '') {
            data.media = await uploadDo(data.media, data.mimetype);
        }
    }

    if (config.mongoose.enabled) {
        const doc = await Contacts.findOne(
            { key, 'contacts.phone': remoteJid },
            { 'contacts.$': 1 }
        );
        if (doc && doc.contacts && doc.contacts.length > 0) {
            const contactFound = doc.contacts[0];
            if (contactFound.name !== null && contactFound.name !== '') {
                data.nameContact = contactFound.name;
            } else if (contactFound.notify !== null && contactFound.notify !== '') {
                data.nameContact = contactFound.notify;
            } else if (contactFound.verifiedName !== null && contactFound.verifiedName !== '') {
                data.nameContact = contactFound.verifiedName;
            }
        }
    }

    // console.log('Data Message parseMessage', data);

    return data;
};

function extractDataMessage(m) {
    let type = '';
    let media = '';
    let title_media = '';
    let message = '';
    let displayName = '';
    let vcard = '';
    let lat = 0;
    let lng = 0;
    let isForwarded = false;
    let isRepply = false;
    const isHistory = false;
    let mimetype = '';

    try {
        if (m?.conversation) {
            type = 'conversation';
            message = m?.conversation;
        } else if (m?.imageMessage) {
            type = 'imageMessage';
            media = String(m?.imageMessage.url);
            message = String(m?.imageMessage.caption);
            isForwarded = Boolean(m?.imageMessage.contextInfo?.isForwarded);
            isRepply = Boolean(m?.imageMessage?.contextInfo?.stanzaId);
            mimetype = String(m?.imageMessage?.mimetype);
        } else if (m?.documentMessage) {
            type = 'documentMessage';
            media = String(m?.documentMessage.url);
            title_media = String(m?.documentMessage.title);
            message = String(m?.documentMessage.caption);
            isForwarded = Boolean(m?.documentMessage.contextInfo?.isForwarded);
            isRepply = Boolean(m?.documentMessage?.contextInfo?.stanzaId);
            mimetype = String(m?.documentMessage?.mimetype);
        } else if (m?.documentWithCaptionMessage) {
            const _m = m?.documentWithCaptionMessage.message;
            type = 'documentMessage';
            media = String(_m?.documentMessage?.url);
            title_media = String(_m?.documentMessage?.title);
            message = String(_m?.documentMessage?.caption);
            mimetype = String(_m?.documentMessage?.mimetype);
        } else if (m?.videoMessage) {
            type = 'videoMessage';
            media = String(m?.videoMessage.url);
            title_media = String('');
            message = String(m?.videoMessage.caption);
            isForwarded = Boolean(m?.videoMessage.contextInfo?.isForwarded);
            isRepply = Boolean(m?.videoMessage?.contextInfo?.stanzaId);
            mimetype = String(m?.videoMessage?.mimetype);
        } else if (m?.contactMessage) {
            type = 'contactMessage';
            displayName = String(m?.contactMessage.displayName);
            vcard = String(m?.contactMessage.vcard);
            isForwarded = Boolean(m?.contactMessage.contextInfo?.isForwarded);
            isRepply = Boolean(m?.contactMessage?.contextInfo?.stanzaId);
        } else if (m?.audioMessage) {
            type = 'audioMessage';
            media = String(m?.audioMessage.url);
            isForwarded = Boolean(m?.audioMessage.contextInfo?.isForwarded);
            isRepply = Boolean(m?.audioMessage?.contextInfo?.stanzaId);
            mimetype = String(m?.audioMessage?.mimetype);
        } else if (m?.locationMessage) {
            type = 'locationMessage';
            lat = Number(m?.locationMessage.degreesLatitude);
            lng = Number(m?.locationMessage.degreesLongitude);
            isForwarded = Boolean(m?.locationMessage.contextInfo?.isForwarded);
            isRepply = Boolean(m?.locationMessage?.contextInfo?.stanzaId);
        } else if (m?.liveLocationMessage) {
            type = 'liveLocationMessage';
            lat = Number(m?.liveLocationMessage.degreesLatitude);
            lng = Number(m?.liveLocationMessage.degreesLongitude);
            message = String(m?.liveLocationMessage.caption);
            isRepply = Boolean(m?.liveLocationMessage?.contextInfo?.stanzaId);
        } else if (m?.extendedTextMessage) {
            type = 'extendedTextMessage';
            message = String(m?.extendedTextMessage.text);
            isForwarded = Boolean(m?.extendedTextMessage.contextInfo?.isForwarded);
            isRepply = Boolean(m?.extendedTextMessage?.contextInfo?.stanzaId);
        }

        const data = {
            type,
            media,
            mimetype,
            title_media,
            message,
            displayName,
            vcard,
            lat,
            lng,
            isForwarded,
            isRepply,
            isHistory,
            autor: 'whatsapp'
        };

        return data;
    } catch (error) {
        return null;
    }
}
