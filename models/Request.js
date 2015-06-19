
var mongoose = require('mongoose');

var schema = new mongoose.Schema({
    name: String,
    host: String,
    port: Number,
    url: String,
    batchNumber: Number,
    template: Object,
    formTemplate: {type: mongoose.Schema.ObjectId, ref: 'Template'},
    funcParams: Array, //описание функций-заполнителей для POST-параметров, созданных в рамках
    iterParams: Array, //описание функций-итераторов для формирования серии связанных запросов (при каждом вызове запроса в итератор передается предыдущее значение и получается новое)
    method: String,
    afterTimeout: Number,
    group: Number
})

module.exports = mongoose.model('Request', schema);