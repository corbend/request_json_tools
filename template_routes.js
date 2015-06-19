var mongoose = require('mongoose');
var express = require('express');

module.exports = function(app, io) {

    var router = express.Router();

    // router.get('/?:id', function(req, res, next) {
    //     var TemplateModel = mongoose.model('Template');
    //     console.log("GET TEMPLATE->");
        
    // })

    router.get('/', function(req, res, next) {
        var TemplateModel = mongoose.model('Template');
        if (req.query.id) {
            TemplateModel.findById(req.query.id, function(err, template) {
                if (!err) {res.send(template)}
                else {next(err)}
            })
        } else {
            TemplateModel.find(function(err, templates) {
                if (!err) {res.send(templates)}
                else {next(err)}
            })
        }
    })

    router.get('/:id/requests', function(req, res) {
        console.log("GET TEMPLATE REQUEST->");
        var TemplateModel = mongoose.model('Template');
        var RequestModel = mongoose.model('Request');

        TemplateModel.findById(req.params.id, function(err, template) {
            console.log("ERR1=", err);
            console.log(template);
            if (!err && template) {
                RequestModel.find({formTemplate: template._id}, function(err, requests) {
                    console.log("ERR2", err);
                    if (!err) {
                        res.send(requests);
                    } else {
                        res.status(500).send({error: err});
                    }
                })
            } else {
                if (err) {
                    res.status(500).send({error: err});
                } else {
                    res.status(500).send({error: 'no template'});
                }
            }
        })
    })

    router.post('/', function(req, res) {
        var TemplateModel = mongoose.model('Template');

        TemplateModel.create(req.body, function(err, request) {
            if (!err) {
                res.send(request);
            } else {
                res.status(500).send({error: err});
            }
        })
    })

    router.put('/:id', function(req, res) {
        var TemplateModel = mongoose.model('Template');

        TemplateModel.findOneAndUpdate({_id: req.params.id}, req.body, function(err, updated) {
            if (!err) {
                res.send({success: true});
            } else {
                res.status(500).send({error: err});
            }
        })
    })

    router.delete('/:id', function(req, res) {
        var TemplateModel = mongoose.model('Template');

        TemplateModel.remove(req.params.id, function(err, request) {
            if (!err) {
                res.send({error: null, message: 'success'});
            } else {
                res.status(500).send({error: err});
            }
        })
    })

    app.use('/templates', router);
}