var mongoose = require('mongoose');
var express = require('express');

module.exports = function(app, io) {
    
    console.log("APP SETUP");
    var router = express.Router();

    router.get('/', function(req, res) {
        console.log("RENDER MAIN->");
        res.render('main.jade');
    })

    router.get('/partials/:templateName', function(req, res) {
        if (!req.query) {
            res.render("partials/" + req.params.templateName);
        } else {
            res.render("partials/" + req.params.templateName, req.query);
        }
    })

    router.get('/partials/lib/:templateName', function(req, res) {
        console.log("LIB PARTIALS=", req.query);
        if (!req.query) {
            res.render("partials/lib/" + req.params.templateName);
        } else {
            res.render("partials/lib/" + req.params.templateName, req.query);
        }
    })

    app.use("/", router);

}