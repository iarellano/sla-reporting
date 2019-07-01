'use strict';

module.exports.init = function(config, logger, stats) {

    var SplunkLogger = require("splunk-logging").Logger;

    var Logger = new SplunkLogger(config.splunk.config);

    return {

        onrequest: function(req, res, next) {
            req.connectivityTest = false;
            var proxyName = res.proxy.name;
            next();
        },

        ondata_request: function(req, res, data, next) {
            next(null, data);
        },

        onend_request: function(req, res, data, next) {
            next(null, data);
        },

        onend_response: function(req, res, data, next) {

            var payload = {
                // Message can be anything; doesn't have to be an object
                metadata: config.splunk.metadata,
                message: {
                    temperature: "70F",
                    chickenCount: 502
                }
            };

            console.log("Sending payload", payload);
            Logger.send(payload, function(err, resp, body) {
                // If successful, body will be { text: 'Success', code: 0 }
                console.log("Response from Splunk", body);
            });

            next(null, data);

        }
    };
};