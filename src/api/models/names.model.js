const mongoose = require('mongoose');

const namesSchema = new mongoose.Schema({
    key: {
        type: String,
        required: [true, 'key is missing'],
        unique: true
    },
    name: {
        type: String,
        default: 'Whatsapp MD'
    }
});

namesSchema.index({ key: 1 });

const Names = mongoose.model('Names', namesSchema);

module.exports = Names;
