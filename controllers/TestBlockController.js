var express = require('express');

module.exports = function(app, model) {

    var router = express.Router();
    console.log("SET TEST BLOCK App");

    router.get('/', function(req, res) {
        model.find(function(err, tests) {
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
        model.findAndModify({id: req.params.id}, req.body, function(err, updated) {
            if (!err) {
                res.send(req.body);
            } else {
                next(err);
            }
        })
    })

    app.use('/test_blocks', router);
}