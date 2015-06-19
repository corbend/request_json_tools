
var mongoose = require('mongoose');

var schema = new mongoose.Schema({
    name: String,
    description: String,
    block: {type: mongoose.Schema.ObjectId, ref: 'TestBlock'},
    expression: String,
    timeout: Number,
    request: Object
})

module.exports = mongoose.model('Test', schema);