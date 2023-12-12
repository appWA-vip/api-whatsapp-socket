const { getDownloadURL, getStorage, ref, uploadString } = require('firebase/storage')

module.exports = async function uploadFirebase(buffer, mimetype) {
    try {
        const storageFirebase = getStorage();
        const storageRef = ref(storageFirebase, randomText(20));

        const snapshot = await uploadString(storageRef, buffer, 'base64', {
            contentType: mimetype
        });
        const downloadURL = await getDownloadURL(snapshot.ref);
        return downloadURL;
    } catch (e) {
        return "";
    }
}

function randomText(length) {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < length) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
        counter += 1;
    }
    return result;
}