/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
/* eslint-disable no-undefined */
/* eslint-disable no-unsafe-optional-chaining */
const QRCode = require('qrcode');
const pino = require('pino');
const events = require('events');
const {
    default: makeWASocket,
    DisconnectReason,
    fetchLatestBaileysVersion
} = require('@whiskeysockets/baileys');
const { unlinkSync } = require('fs');
const { v4: uuidv4 } = require('uuid');
const processButton = require('../helper/processbtn');
const generateVC = require('../helper/genVc');
const Chat = require('../models/chat.model');
const axios = require('axios');
const config = require('../../config/config');
require('pino')();
const logger = require('../helper/log');
const Contacts = require('../models/contacts.model');
const Names = require('../models/names.model');
const useMongoDBAuthState = require('../helper/mongoAuthState');
const sleep = require('../helper/sleep');
const parseMessage = require('../helper/parseMessage');
const NodeCache = require('node-cache');

class WhatsAppInstance {
    socketConfig = {
        keepAliveIntervalMs: 60_000,
        defaultQueryTimeoutMs: undefined,
        printQRInTerminal: false,
        logger: pino({
            level: config.log.level,
            enabled: config.log.instances
        }),
        syncFullHistory: false,
        markOnlineOnConnect: false,
        fireInitQueries: false,
        generateHighQualityLinkPreview: true
    };
    key = '';
    name = '';
    authState;
    allowWebhook = undefined;
    webhook = undefined;

    instance = {
        name: '',
        key: this.key,
        chats: [],
        qr: '',
        messages: [],
        qrRetry: 0,
        customWebhook: '',
        em: new events.EventEmitter(),
        presence: false
    };

    axiosInstance = axios.create({
        baseURL: config.webhookUrl
    });

    hooks = [
        'all',
        'connection',
        'connection:close',
        'connection.update',
        'connection:open',
        'connection:qr',
        'connection:live',
        'messages',
        'messages.upsert',
        'call:offer',
        'call:terminate'
    ];

    constructor(key, allowWebhook, webhook, name) {
        this.key = key ? key : uuidv4();
        this.name = name ? name : config.browser.platform;
        this.instance.name = this.name;
        this.instance.customWebhook = this.webhook ? this.webhook : webhook;
        this.allowWebhook = config.webhookEnabled ? config.webhookEnabled : allowWebhook;
        if (this.allowWebhook && this.instance.customWebhook !== null) {
            this.allowWebhook = true;
            this.instance.customWebhook = webhook;
            this.axiosInstance = axios.create({
                baseURL: webhook
            });
        }
    }

    async SendWebhook(type, body, key) {
        if (!this.allowWebhook) return;
        this.axiosInstance
            .post('', {
                type,
                body,
                instanceKey: key,
                server: config.mongoose.sessions
            })
            .catch(() => {});
    }

    async ensureCollectionExists() {
        const collections = await mongoClient
            .db(config.mongoose.sessions)
            .listCollections({ name: this.key })
            .toArray();
        if (collections.length === 0)
            await mongoClient.db(config.mongoose.sessions).createCollection(this.key);
    }

    async delay(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    async init() {
        await this.ensureCollectionExists();

        await this.initNameAgent(Names);

        const _timeStart = 1;
        const _timeEnd = 3;
        const _random = Math.floor(Math.random() * (_timeEnd - _timeStart + 1)) + _timeStart;
        await this.delay(_random);

        this.collection = mongoClient.db(config.mongoose.sessions).collection(this.key);
        const { state, saveCreds } = await useMongoDBAuthState({ collection: this.collection });
        this.authState = { state: state, saveCreds: saveCreds };
        this.socketConfig.auth = this.authState.state;

        const browser = config.browser;
        browser.platform = this.name;

        this.socketConfig.browser = Object.values(browser);
        this.socketConfig.msgRetryCounterCache = new NodeCache();

        if (config.version.auto) {
            const { version, isLatest } = await fetchLatestBaileysVersion();
            this.socketConfig.version = version;
            logger.info(`using WA v${version.join('.')}, isLatest: ${isLatest}`);
        } else {
            const versionUser = [
                config.version.path_1,
                config.version.path_2,
                config.version.path_3
            ];
            this.socketConfig.version = versionUser;
            logger.info(`using WA v${versionUser.join('.')}, isLatest: for user`);
        }

        this.instance.sock = makeWASocket(this.socketConfig);
        this.setHandler();
        return this;
    }

    async remove(type) {
        try {
            if (type === 'close') {
                this.instance.sock.ws.close();
            } else if (type === 'removeAllListeners') {
                this.instance.sock.ev.removeAllListeners();
                this.instance.em.removeAllListeners();
            } else if (type === 'logout') {
                await this.instance.sock.logout();
            } else if (type === 'delete') {
                delete WhatsAppInstances[this.key];
            } else if (type === 'session') {
                await this.collection.drop();
            } else if (type === 'chats') {
                await Chat.deleteMany({ key: this.key });
            } else if (type === 'contacts') {
                await Contacts.deleteMany({ key: this.key });
            } else if (type === 'names') {
                await Names.deleteMany({ key: this.key });
            }
        } catch (error) {
            logger.error('ERROR: Removed ' + type);
        }
    }

    async destroy() {
        const _this = this;
        await this.remove('close');
        await this.remove('removeAllListeners');
        await this.remove('logout');
        await this.remove('session');
        await this.remove('chats');
        await this.remove('contacts');
        await this.remove('names');
        await this.remove('delete');
        logger.info('Destroy: ' + _this.key);
    }

    async callWebhook(type, body) {
        if (this.hooks.some((e) => config.webhookAllowedEvents.includes(e))) {
            await this.SendWebhook(type, body, this.key);
        }
    }

    async initContactsChats(Table) {
        if (config.mongoose.enabled) {
            let alreadyThere = await Table.findOne({
                key: this.key
            }).exec();
            if (!alreadyThere) {
                const save = new Table({ key: this.key });
                await save.save();
            }
        }
    }

    async initNameAgent(Table) {
        if (config.mongoose.enabled) {
            let alreadyThere = await Table.findOne({
                key: this.key
            }).exec();
            if (!alreadyThere) {
                const save = new Table({ key: this.key, name: this.name });
                await save.save();
            }
        }
    }

    parseContacts(contacts = []) {
        try {
            const data = [];
            for (const c of contacts) {
                const d = { phone: c.id, updatedAt: new Date(), createdAt: new Date() };
                if (c.name !== undefined) d.name = c.name;
                if (c.notify !== undefined) d.notify = c.notify;
                if (c.verifiedName !== undefined) d.verifiedName = c.verifiedName;
                if (d.name === undefined && d.notify === undefined && d.verifiedName === undefined)
                    continue;
                data.push(d);
            }
            return data;
        } catch (error) {
            return contacts;
        }
    }

    setHandler() {
        const sock = this.instance.sock;
        this;
        // on credentials update save state
        sock?.ev.on('creds.update', this.authState.saveCreds);

        // on send live conection
        this.instance.em.on('connection:live', async () => {
            if (this.instance.online) {
                await this.callWebhook('connection:live', { live: true });
                setTimeout(() => {
                    this.instance.em.emit('connection:live');
                }, 30000);
            }
        });

        // hidden presence
        this.instance.em.on('send:presence', async () => {
            if (!config.hiddenPresence) return;
            if (this.instance.online && !this.instance.presence) {
                await this.instance.sock.sendPresenceUpdate('unavailable');
            }
            if (this.instance.online) {
                setTimeout(() => {
                    this.instance.em.emit('send:presence');
                }, 8000);
            }
        });

        // on socket closed, opened, connecting
        sock?.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;
            const statusCode = lastDisconnect?.error?.output?.statusCode;

            if (connection === 'connecting') return;

            if (connection === 'close') {
                if (statusCode !== DisconnectReason.loggedOut) {
                    await this.init();
                } else {
                    this.instance.online = false;
                    await this.destroy();
                    await this.callWebhook('connection:close', { connection: connection });
                }
            } else if (connection === 'open') {
                await this.initContactsChats(Chat);
                await this.initContactsChats(Contacts);
                this.instance.online = true;
                await this.callWebhook('connection:open', { connection: connection });
                setTimeout(() => {
                    this.instance.em.emit('connection:live');
                }, 8000);
                this.instance.em.emit('send:presence');
            }

            if (qr) {
                QRCode.toDataURL(qr).then(async (url) => {
                    await this.callWebhook('connection:qr', { qr: url });
                    this.instance.qr = url;
                    this.instance.qrRetry++;
                    if (this.instance.qrRetry >= config.instance.maxRetryQr) {
                        await this.destroy();
                        logger.info('socket connection terminated');
                    }
                });
            }
        });

        // sending presence
        sock?.ev.on('presence.update', async (json) => {});

        sock?.ev.on('contacts.upsert', async (m) => {
            const contacts = this.parseContacts(m);
            this.upsertContactInContacts(contacts);
        });

        sock?.ev.on('contacts.update', async (m) => {
            const contacts = this.parseContacts(m);
            this.upsertContactInContacts(contacts);
        });

        // on new mssage
        sock?.ev.on('messages.upsert', async (m) => {
            // https://adiwajshing.github.io/Baileys/#reading-messages
            if (config.markMessagesRead) {
                const unreadMessages = m.messages.map((msg) => {
                    return {
                        remoteJid: msg.key.remoteJid,
                        id: msg.key.id,
                        participant: msg.key?.participant
                    };
                });
                await sock.readMessages(unreadMessages);
            }

            m.messages.map(async (msg) => {
                if (!msg.message) return;
                if (msg.key.participant !== undefined) return;
                if (JSON.stringify(msg).includes('Invalid PreKey ID')) return;

                const message = await parseMessage(msg, m.type, this.key, sock);
                if (!message) return;

                const webhookData = {
                    key: this.key,
                    ...message
                };

                logger.debug({ UPSERT: 'webhookData', ...webhookData });

                await this.callWebhook('messages.upsert', webhookData);
            });
        });

        sock?.ws.on('CB:call', async (data) => {
            if (data.content) {
                if (data.content.find((e) => e.tag === 'offer')) {
                    const content = data.content.find((e) => e.tag === 'offer');

                    const dataCall = {
                        key: this.key,
                        id: content.attrs['call-id'],
                        timestamp: parseInt(data.attrs.t),
                        user: {
                            id: data.attrs.from,
                            phone: data.attrs.from.replace('@s.whatsapp.net', ''),
                            platform: data.attrs.platform,
                            platform_version: data.attrs.version
                        }
                    };

                    logger.debug({ CALL: 'offer', ...dataCall });

                    await this.callWebhook('call:offer', dataCall);
                } else if (data.content.find((e) => e.tag === 'terminate')) {
                    const content = data.content.find((e) => e.tag === 'terminate');

                    const dataCall = {
                        key: this.key,
                        id: content.attrs['call-id'],
                        user: {
                            id: data.attrs.from,
                            phone: data.attrs.from.replace('@s.whatsapp.net', '')
                        },
                        timestamp: parseInt(data.attrs.t),
                        reason: data.content[0].attrs.reason
                    };

                    logger.debug({ CALL: 'terminate', ...dataCall });

                    await this.callWebhook('call:terminate', dataCall);
                }
            }
        });
    }

    async sendMessageWTyping(jid, value, presence, subscribe, update) {
        if (!presence) return;

        this.instance.presence = true;

        await this.instance.sock.presenceSubscribe(jid);
        await sleep(subscribe);

        await this.instance.sock.sendPresenceUpdate(value, jid);
        await sleep(update);

        await this.instance.sock.sendPresenceUpdate('paused', jid);

        this.instance.presence = false;
    }

    async deleteInstance(key) {
        try {
            await Chat.findOneAndDelete({ key: key });
        } catch (e) {
            logger.error('Error updating document failed');
        }
    }

    async getInstanceDetail(key) {
        return {
            name: this.instance?.name,
            instance_key: key,
            phone_connected: this.instance?.online,
            webhookUrl: this.instance.customWebhook,
            user: this.instance?.online ? this.instance.sock?.user : {}
        };
    }

    getWhatsAppId(id) {
        if (id.includes('@g.us') || id.includes('@s.whatsapp.net')) return id;
        return id.includes('-') ? `${id}@g.us` : `${id}@s.whatsapp.net`;
    }

    async verifyId(id) {
        if (id.includes('@g.us')) return true;
        const [result] = await this.instance.sock?.onWhatsApp(id);
        if (result?.exists) return result['jid'];
        throw new Error('no account exists');
    }

    async sendTextMessage(to, message, req) {
        const jid = await this.verifyId(this.getWhatsAppId(to));
        await this.sendMessageWTyping(
            jid,
            'composing',
            req.body.presence,
            req.body.subscribe,
            req.body.update
        );
        const data = await this.instance.sock?.sendMessage(jid, { text: message });
        return data;
    }

    async sendMediaFile(req, to, file, type, caption = '', filename) {
        const jid = await this.verifyId(this.getWhatsAppId(to));
        await this.sendMessageWTyping(
            jid,
            'composing',
            req.body.presence,
            req.body.subscribe,
            req.body.update
        );
        const data = await this.instance.sock?.sendMessage(jid, {
            mimetype: file.mimetype,
            [type]: file.buffer,
            caption: caption,
            ptt: type === 'audio' ? true : false,
            fileName: filename ? filename : file.originalname
        });
        return data;
    }

    async sendUrlMediaFile(req, to, url, type, mimeType, caption = '') {
        const jid = await this.verifyId(this.getWhatsAppId(to));
        await this.sendMessageWTyping(
            jid,
            'composing',
            req.body.presence,
            req.body.subscribe,
            req.body.update
        );

        const data = await this.instance.sock?.sendMessage(jid, {
            [type]: {
                url: url
            },
            caption: caption,
            mimetype: mimeType
        });
        return data;
    }

    async DownloadProfile(of) {
        const jid = await this.verifyId(this.getWhatsAppId(of));
        const ppUrl = await this.instance.sock?.profilePictureUrl(jid, 'image');
        return ppUrl;
    }

    async getUserStatus(of) {
        const jid = await this.verifyId(this.getWhatsAppId(of));
        const status = await this.instance.sock?.fetchStatus(jid);
        return status;
    }

    async blockUnblock(to, data) {
        await this.verifyId(this.getWhatsAppId(to));
        const status = await this.instance.sock?.updateBlockStatus(this.getWhatsAppId(to), data);
        return status;
    }

    async sendButtonMessage(req, to, data) {
        const jid = await this.verifyId(this.getWhatsAppId(to));
        await this.sendMessageWTyping(
            jid,
            'composing',
            req.body.presence,
            req.body.subscribe,
            req.body.update
        );

        const result = await this.instance.sock?.sendMessage(jid, {
            templateButtons: processButton(data.buttons),
            text: data.text ?? '',
            footer: data.footerText ?? '',
            viewOnce: true
        });
        return result;
    }

    async sendContactMessage(req, to, data) {
        const jid = await this.verifyId(this.getWhatsAppId(to));
        await this.sendMessageWTyping(
            jid,
            'composing',
            req.body.presence,
            req.body.subscribe,
            req.body.update
        );

        const vcard = generateVC(data);
        const result = await this.instance.sock?.sendMessage(jid, {
            contacts: {
                displayName: data.fullName,
                contacts: [{ displayName: data.fullName, vcard }]
            }
        });
        return result;
    }

    async sendLocationMessage(req, to, data) {
        const jid = await this.verifyId(this.getWhatsAppId(to));
        await this.sendMessageWTyping(
            jid,
            'composing',
            req.body.presence,
            req.body.subscribe,
            req.body.update
        );

        const result = await this.instance.sock?.sendMessage(jid, {
            location: {
                degreesLatitude: data.lat,
                degreesLongitude: data.lng,
                name: data.name ?? '',
                address: data.address ?? ''
            }
        });
        return result;
    }

    async sendListMessage(req, to, data) {
        const jid = await this.verifyId(this.getWhatsAppId(to));
        await this.sendMessageWTyping(
            jid,
            'composing',
            req.body.presence,
            req.body.subscribe,
            req.body.update
        );

        const result = await this.instance.sock?.sendMessage(jid, {
            text: data.text,
            sections: data.sections,
            buttonText: data.buttonText,
            footer: data.description,
            title: data.title,
            viewOnce: true
        });
        return result;
    }

    async sendMediaButtonMessage(req, to, data) {
        const jid = await this.verifyId(this.getWhatsAppId(to));
        await this.sendMessageWTyping(
            jid,
            'composing',
            req.body.presence,
            req.body.subscribe,
            req.body.update
        );

        const result = await this.instance.sock?.sendMessage(jid, {
            [data.mediaType]: {
                url: data.image
            },
            footer: data.footerText ?? '',
            caption: data.text,
            templateButtons: processButton(data.buttons),
            mimetype: data.mimeType,
            viewOnce: true
        });
        return result;
    }

    async setStatus(status, to) {
        const jid = await this.verifyId(this.getWhatsAppId(to));

        const result = await this.instance.sock?.sendPresenceUpdate(status, jid);
        return result;
    }

    // change your display picture or a group's
    async updateProfilePicture(id, url) {
        try {
            const img = await axios.get(url, { responseType: 'arraybuffer' });
            const res = await this.instance.sock?.updateProfilePicture(id, img.data);
            return res;
        } catch (e) {
            //console.log(e)
            return {
                error: true,
                message: 'Unable to update profile picture'
            };
        }
    }

    // get user or group object from db by id
    async getUserOrGroupById(id) {
        try {
            let Chats = await this.getChat();
            const group = Chats.find((c) => c.id === this.getWhatsAppId(id));
            if (!group) throw new Error('unable to get group, check if the group exists');
            return group;
        } catch (e) {
            logger.error(e);
            logger.error('Error get group failed');
        }
    }

    // get Chat object from db
    async getChat(key = this.key) {
        let dbResult = await Chat.findOne({ key: key }).exec();
        let ChatObj = dbResult.chat;
        return ChatObj;
    }

    // update db document -> chat
    async updateDb(object) {
        try {
            await Chat.updateOne({ key: this.key }, { chat: object });
        } catch (e) {
            logger.error('Error updating document failed');
        }
    }

    async readMessage(msgObj) {
        try {
            const key = {
                remoteJid: msgObj.remoteJid,
                id: msgObj.id,
                participant: msgObj?.participant // required when reading a msg from group
            };
            const res = await this.instance.sock?.readMessages([key]);
            return res;
        } catch (e) {
            logger.error('Error read message failed');
        }
    }

    async reactMessage(id, key, emoji) {
        try {
            const reactionMessage = {
                react: {
                    text: emoji, // use an empty string to remove the reaction
                    key: key
                }
            };
            const res = await this.instance.sock?.sendMessage(
                this.getWhatsAppId(id),
                reactionMessage
            );
            return res;
        } catch (e) {
            logger.error('Error react message failed');
        }
    }

    async upsertContactInContacts(newContacts) {
        try {
            if (config.mongoose.enabled) {
                await this.initContactsChats(Contacts);
                const contactsDocument = await Contacts.findOne({ key: this.key });
                for (const contact of newContacts) {
                    const existingContactIndex = contactsDocument.contacts.findIndex(
                        (c) => c.phone === contact.phone
                    );
                    if (existingContactIndex > -1) {
                        const d = contactsDocument.contacts[existingContactIndex];
                        if (contact.name !== undefined) d.name = contact.name;
                        if (contact.notify !== undefined) d.notify = contact.notify;
                        if (contact.verifiedName !== undefined)
                            d.verifiedName = contact.verifiedName;
                        d.updatedAt = new Date();
                        contactsDocument.contacts[existingContactIndex] = d;
                    } else {
                        contactsDocument.contacts.push(contact);
                    }
                }
                await contactsDocument.save();
            }
        } catch (error) {
            return null;
        }
    }
}

exports.WhatsAppInstance = WhatsAppInstance;
