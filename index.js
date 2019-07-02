'use strict';

module.exports.init = function(config, logger, stats) {

    var SplunkLogger = require("splunk-logging").Logger;

    var Logger = new SplunkLogger(config.splunk.config);

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

                client_received_start_timestamp: now,
                client_received_end_timestamp: now + 1
            };

            req.sla_reporting = record;
            next();
        },

        onend_response: function(req, res, data, next) {

            var record = req.sla_reporting;
            var now = Date.now();
            record.response_status_code      = res.statusCode;
            record.client_sent_start_timestamp = now;
            record.client_sent_end_timestamp = now+1;

            var token = req.token;
            if (token) {
                record.developer_email = token.developer_email;
                record.developer_app   = token.application_name;
                record.client_id       = token.client_id;
                var prodList = token.api_product_list;
                if (prodList && prodList.length) {
                    if (typeof prodList === 'string') { prodList = prodList.slice(1, -1).split(','); }
                    // hack: analytics server only accepts a single product
                    record.api_product = prodList[0];
                }
                record.bcbsa_client_id = token.bcbsa_client_id;
                record.env = token.env;
                record.client_cn = token.client_cn;

            }

            record.target_sent_start_timestamp = req.headers['target_sent_start_timestamp'];
            record.target_sent_end_timestamp = req.headers['target_sent_start_timestamp'] + 1;
            record.target_received_start_timestamp = req.headers['target_received_start_timestamp'];
            record.target_received_end_timestamp = req.headers['target_received_start_timestamp'] + 1;

            var payload = {
                metadata: config.splunk.metadata,
                message: record
            };

            logger.info(record, "sla-reporting")
            Logger.send(payload, function(err, resp, body) {
                console.log("Response from Splunk", body);
            });
            next(null, data);
        }
    };
};