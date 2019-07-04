'use strict';

var SplunkLogger = require("splunk-logging").Logger;
var Bunyan = require("bunyan");
var RotatingFileStream = require('bunyan-rotating-file-stream');
var debug = require('debug')('plugin:sla-reporting');


module.exports.init = function(config, logger, stats) {

    var splunk;
    var bunyan;
    if (config.splunk && config.splunk.config) {
        splunk = new SplunkLogger(config.splunk.config);
    }
    if (config.bunyan && config.bunyan.stream) {
        var bunyanConfig = {
            name: config.bunyan.name,
            streams: [{
                type: 'raw',
                stream: new RotatingFileStream(config.bunyan.stream)
            }]
        }
        bunyan = Bunyan.createLogger(bunyanConfig)
    }

    return {

        onrequest: function(req, res, next) {
            var now = Date.now();

            var record = {
                apiproxy: res.proxy.name,
                request_uri: (req.protocol || 'http') + '://' + req.headers.host + req.url,
                request_path: req.url.split('?')[0],
                request_verb: req.method,

                client_ip: req.connection.remoteAddress,
                forwarded_ip: req.headers['x-forwarded-for'],
                useragent: req.headers['user-agent'],
                apiproxy_revision: res.proxy.revision,
                client_received_start_timestamp: Date.now()
            };

            if (req.headers['soapaction']) {
                record.soapaction = req.headers['soapaction'];
            }

            req.sla_reporting = record;
            next();
        },

        onend_request: function(req, res, data, next) {
            var record = req.sla_reporting;
            var now = Date.now();
            record.client_received_end_timestamp = now;
            record.target_sent_start_timestamp = now + 1;
            record.target_sent_end_timestamp = now + 2;
            next(null, data);
        },

        onresponse: function(req, res, next) {
            var record = req.sla_reporting;
            record.target_received_start_timestamp = Date.now();
            next(null);
        },

        onend_response: function(req, res, data, next) {

            var record = req.sla_reporting;
            var now = Date.now();

            record.response_status_code      = res.statusCode;
            var token = req.token;
            if (token) {
                record.developer_email = token.developer_email;
                record.developer_app   = token.application_name;
                record.client_id       = token.client_id;
                record.custom_demo_att = token.custom_demo_att;

                var prodList = token.api_product_list;
                if (prodList && prodList.length) {
                    if (typeof prodList === 'string') { prodList = prodList.slice(1, -1).split(','); }
                    record.api_product = prodList[0];
                }
                record.bcbsa_client_id = token.bcbsa_client_id;
                record.env = token.env;
                record.client_cn = token.client_cn;

            }
            record.target_received_end_timestamp = now;
            record.client_sent_start_timestamp = now;
            next(null, data);
            record.client_sent_end_timestamp = Date.now();

            var payload = {
                metadata: config.splunk.metadata,
                message: record
            };

            if (bunyan) {
                bunyan.info(record, "sla-reporting");
            }
            if (splunk) {
                splunk.send(payload, function (err, resp, body) {
                    debug("Response from Splunk", body);
                });
            }
        }
    };
};
