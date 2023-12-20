const mongoose = require('mongoose');
const contactSchema = require('./contact.model');

const contactsSchema = new mongoose.Schema({
    key: {
        type: String,
        required: [true, 'key is missing'],
        unique: true
    },
    contacts: [contactSchema]
});

contactsSchema.index({ key: 1 });

const Contacts = mongoose.model('Contacts', contactsSchema);

module.exports = Contacts;
