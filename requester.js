var http = require('http');
var https = require('https');
var mongoose = require('mongoose');
var _ = require('lodash');

function makeRequest(options, cb, requestOptions) {

    var parsedTemplate, req, transportModule = http;

    try {
        parsedTemplate = options.template && JSON.parse(options.template);
    } catch (e) {
        cb(e);
        return;
    }

    var requestParams = (options.template && parsedTemplate) || null;

    if (/https/.test(options.host)) {
        transportModule = https;
        options.host = options.host.replace(/https:\/\//g, "");
        console.log("USE HTTPS=", options.host);
    } else if (/http/.test(options.host)) {
        transportModule = http;
        options.host = options.host.replace(/http:\/\//g, "");
        console.log("USE HTTP=>", options.host);
    }   

    console.log("REQ OPTIONS->", requestOptions);

    var baseOpts = {
        host: options.host,
        path: "/" + options.url,
        method: options.method,
    }

    if (options.port) {
        baseOpts.port = String(options.port);
    }

    var baseHeaders = _.extend(
        {
            'Content-Type': 'application/json'
        }, requestOptions.headers || {}
    )

    baseOpts.headers = baseHeaders;
    var otherParams = _.extend({}, requestOptions);
    delete otherParams.headers;

    var requestParams = _.extend(otherParams, baseOpts || {});

    console.log("OPTIONS->", requestParams);

    try {
        req = transportModule.request(requestParams, function(response) {

            try {
                var resp = '';
                var contentType = response.headers['content-type'] || response.headers['Content-Type'];
                console.log(contentType);
                //console.log(response);
                response.on('error', function(err) {
                    console.log("ERR->", err);
                })

                response.on('data', function(chunk) {
                    resp += chunk;
                })

                response.on('end', function() {
                    var alteredResp = resp;
                    if (contentType == "application/json") {
                        alteredResp = JSON.parse(alteredResp);
                    }
                    cb(null, response, alteredResp);
                })
            } catch (err) {
                cb(err);
            }
        });

        if (requestParams) {
            console.log("WRITE PARAMS->", requestParams);
            req.write(JSON.stringify(requestParams));
        } else {
            console.log("NO PARAMS");
        }
        req.end();
    } catch (err) {
        console.log(err);
        cb(err);
    }
}

module.exports = function(app, config, socketIO) {

    var scope = this;

    this.notifier = socketIO;

    var afterSend = function(err, response, data) {
        if (!err) {
            if (scope.notifier) {
                notifier.emit({
                    status: response.status
                });
            }
        }
    }

    this.sendByMethod = function(options, cb, requestOptions) {
        makeRequest(options, function(err, response, responseData) {
            if (err) {
                console.log("REQUEST ERROR->", err);
                return cb(err);
            }
            afterSend(err, response, responseData);
            cb(err, response, responseData);
        }, requestOptions);
    }

    return this;

}