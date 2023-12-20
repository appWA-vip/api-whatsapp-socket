const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
    phone: {
        type: String,
        default: ''
    },
    name: {
        type: String,
        default: ''
    },
    notify: {
        type: String,
        default: ''
    },
    verifiedName: {
        type: String,
        default: ''
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

contactSchema.index({ phone: 1 });

module.exports = contactSchema;
