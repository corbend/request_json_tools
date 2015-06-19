var express = require('express');
var lodash = require('lodash');

module.exports = function(app, model) {

    var router = express.Router();
    console.log("SET TEST App");

    router.get('/', function(req, res) {
        console.log("prepare to get tests");
        model.find(function(err, tests) {
            console.log("get tests", tests);
            if (!err) {
                res.send(tests);
            } else {
                next(err);
            }
        })
    })

    router.post('/', function(req, res) {
        model.create(req.body, function(err, created) {
            if (!err) {
                res.send(req.body);
            } else {
                next(err);
            }
        })
    })

    router.put('/:id', function(req, res) {
        var cloneBody = lodash.clone(req.body);
        model.update({_id: req.params.id}, cloneBody, function(err, updated) {
            console.log("updated=", updated);
            if (!err) {
                res.send(req.body);
            } else {
                next(err);
            }
        })
    })

    app.use('/tests', router);
}