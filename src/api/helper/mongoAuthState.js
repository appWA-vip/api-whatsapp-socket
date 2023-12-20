/* eslint-disable no-undef */
const { proto, initAuthCreds, BufferJSON } = require('@whiskeysockets/baileys');

module.exports = useMongoDBAuthState = async (config) => {
    const collection = config.collection;

    const writeData = async (data, key) => {
        try {
            return await collection.replaceOne(
                { _id: key },
                JSON.parse(JSON.stringify(data, BufferJSON.replacer)),
                { upsert: true }
            );
        } catch (error) {
            return null;
        }
    };

    const readData = async (key) => {
        try {
            const data = await collection.findOne({ _id: key });
            const creds = JSON.stringify(data);
            return JSON.parse(creds, BufferJSON.reviver);
        } catch (error) {
            return null;
        }
    };

    const removeData = async (key) => {
        try {
            await collection.deleteOne({ _id: key });
        } catch (error) {
            return null;
        }
    };

    const creds = (await readData(`creds`)) || initAuthCreds();

    return {
        state: {
            creds,
            keys: {
                get: async (type, ids) => {
                    const data = {};
                    await Promise.all(
                        ids.map(async (id) => {
                            let value = await readData(`${type}-${id}`);
                            if (type === 'app-state-sync-key' && value) {
                                value = proto.Message.AppStateSyncKeyData.fromObject(value);
                            }
                            data[id] = value;
                        })
                    );
                    return data;
                },
                set: async (data) => {
                    const tasks = [];
                    for (const category in data) {
                        for (const id in data[category]) {
                            const value = data[category][id];
                            const sId = `${category}-${id}`;
                            tasks.push(value ? writeData(value, sId) : removeData(sId));
                        }
                    }
                    await Promise.all(tasks);
                }
            }
        },
        saveCreds: () => {
            return writeData(creds, `creds`);
        }
    };
};
