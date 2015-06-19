var express = require('express');
var lodash = require('lodash');
var Requester = require('../requester');

module.exports = function(app, RequestModel, io) {

    var router = new express.Router();

    router.get('/:id?', function(req, res) {
        console.log("GET QUERY->", req.query);
        if (!req.query.id) {
            RequestModel.find(function(err, requests) {
                if (!err) {
                    res.send(requests);
                }
            });
        } else {
            console.log("GET ONE->");
            RequestModel.findById(req.query.id, function(err, request) {
                if (!err) {
                    console.log(request);
                    res.send(request);
                }
            })
        }
    })

    router.post('/:id/send', function(req, res) {

        var RequestModel = mongoose.model('Request');
        var requester = Requester(app, {}, io);

        if (req.params.id) {
            RequestModel.findById(req.params.id, function(err, request) {
                console.log("SEND REQUEST->", req.body);
                if (!err) {
                    var r = request.toObject();
                    console.log(typeof(req.body.template));
                    r.template = JSON.stringify(req.body.template);

                    requester.sendByMethod(r, function(err, rawResponse, data) {
                        if (!err) {
                            
                            r.status = Number(rawResponse.statusCode);
                            r.contentType = rawResponse.headers['content-type'] || rawResponse.headers['Content-Type'];
                            r.data = data;

                            console.log("RESPONSE FROM REQUEST->", data);
                            res.send(r);
                        } else {
                            res.status(500).send({error: err});
                        }
                    }, req.body);
                }
            });
        } else {
            next(new Error("no id is provided"));
        }
        
    })

    router.post('/send', function(req, res) {

        var requester = Requester(app, {}, io);
        var r = lodash.clone(req.body || {});

        requester.sendByMethod(r, function(err, rawResponse, data) {
            if (!err) {
                
                r.status = Number(rawResponse.statusCode);
                r.contentType = rawResponse.headers['content-type'] || rawResponse.headers['Content-Type'];
                r.data = data;

                console.log("RESPONSE FROM REQUEST->", data);
                res.send(r);
            } else {
                res.status(500).send({error: err});
            }
        }, req.body);
    })

    router.post('/', function(req, res) {
        var RequestModel = mongoose.model('Request');

        RequestModel.create(req.body, function(err, request) {
            if (!err) {
                res.send(request);
            }
        });
    })

    router.put('/:id', function(req, res) {
        var RequestModel = mongoose.model('Request');

        RequestModel.findOneAndUpdate({_id: req.params.id}, req.body, function(err, updated) {
            if (!err) {
                res.send({success: true});
            }
        })
    })

    router.delete('/:id', function(req, res) {
        var RequestModel = mongoose.model('Request');

        RequestModel.findOneAndRemove({_id: req.params.id}, function(err, deleted) {
            if (!err) {
                res.send({success: true});
            }
        });
    })

    app.use('/requests', router);

}