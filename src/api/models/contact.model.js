const mongoose = require('mongoose')

const contactSchema = new mongoose.Schema({
    instance_key: {
        type: String,
        default: ''
    },
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
    },
})

contactSchema.index({ instance_key: 1, phone: 1 });

module.exports = contactSchema
