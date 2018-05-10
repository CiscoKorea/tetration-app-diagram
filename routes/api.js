var express = require('express');
var url = require('url')
var fs = require('fs');
var moment = require('moment');
var RestClient = require('./tetration.js');
var credentials = require('./credentials.js')
var prototab = require('./protocol_table.js')
var excl_ports = require('./exclude_ports.js')

var alertLog = require('./log.js');


var kafka = require('kafka-node'),
    Consumer = kafka.Consumer,
    client = new kafka.KafkaClient({kafkaHost: '172.26.34.181:9092'}),
    consumer = new Consumer(client, [{topic: 'default-kafka-defaultdatatap', partition: 0 }],{ autoCommit: true });

consumer.on('message', function (message) {
    console.log("\n### Message from Kafka: ");
    console.log(message.value);
    try {
        var alert = JSON.parse(message.value);
        console.log("\nAlert message:");
        console.log(alert);
        try {
            var details = JSON.parse(alert.alert_details);
            console.log("\nAlert details message: ");
            console.log(details);  
            alertLog.addToLog(message.value);    
            io.sockets.emit('log-event',message.value)
        }
         catch (e) {
            console.log("Not alert JSON, which doesn't have details JSON");
        }
                       
        //console.log("\nCascased alert message with JSON: " + alert);
        //console.log("\nCascased alert message with JSON.stringfy: " + JSON.stringify(alert));
        //console.log("\nCascased details message with JSON: " + details);
        //console.log("\nCascased details message with JSON.stringfy: " + JSON.stringify(details));
    }
    catch (e) {
        console.log("Not JSON format !!!");
    }
});

consumer.on('error', function (err) {
    console.log('error', err);
  });
  
  /*
  * If consumer get `offsetOutOfRange` event, fetch data from the smallest(oldest) offset
  consumer.on('offsetOutOfRange', function (topic) {
    topic.maxNum = 2;
    offset.fetch([topic], function (err, offsets) {
      if (err) {
        return console.error(err);
      }
      var min = Math.min.apply(null, offsets[topic.topic][topic.partition]);
      consumer.setOffset(topic.topic, topic.partition, min);
    });
  });
  */


process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"
const tetclient = new RestClient(credentials.API_ENDPOINT, credentials.API_KEY, credentials.API_SECRET)
var router = express.Router();
var show_port = true;
var edge_with_box = false;
var port_summary = true;

/* GET users listing. */
router.get('/apps', (req, res, next) => {
  tetclient.get('/applications', (error, response, body) => {
    var retval = []
    body.forEach( function( item) {
        d = { name: item.name, author: item.author, id: item.id}
        retval.push(d)
        //console.log( JSON.stringify(d))
    });
    //res.send( JSON.stringify(retval));
    res.send(body);
  });
});

function parseData(body) {
    var appVisData = { nodes: [], edges: [], options: {}, detail: {}}

    appVisData.detail.name = body.name
    appVisData.detail.description = body.description
    appVisData.detail.author = body.author
    appVisData.detail.primary = body.primary
    appVisData.detail.version = body.version
    appVisData.detail.creation = body.created_at
    appVisData.detail.version_list = []

    //console.log( body);
    // cluster handling 
    if ( body.hasOwnProperty('clusters') ) {
        for ( cluster of body.clusters) {
            var cur_node = {}
            var cur_ep_names = []
            for ( node of cluster.nodes) {
                cur_ep_names.push( node.name)
            }
            cur_node.id = cluster.id;
            title = '<ul>'
            cur_ep_names.forEach( function(s) {
                title += '<li>' + s + '</li>';
            });
            title += '</ul>'
            cur_node.title = title;
            cur_node.shape ='ellipse';
            cur_node.size = 10 + 5 * cur_ep_names.length;
            cur_node.margin = {top: -100};
            cur_node.label = cluster.name 
            appVisData.nodes.push( cur_node)
        }
    }
    // inventory filter handling 
    if( body.hasOwnProperty( 'inventory_filters')) {
        for( inv_filter of body.inventory_filters) {
            var cur_node = {}
            cur_node.id = inv_filter.id;
            cur_node.label = inv_filter.name;
            cur_node.style = "filled";
            cur_node.shape = 'box';
            cur_node.color = { background: "lightblue", hover: 'rgb(58, 133, 255)'}
            appVisData.nodes.push( cur_node);
        }
    }
    // policies 
    if( body.hasOwnProperty('default_policies')) {
        for ( policy of body.default_policies) {
            if (show_port) {
                var policies = {}
                var port = "0", proto = "TCP", ports = [];
                for ( port_range of policy.l4_params) {
                    if (port_range.port[0] == port_range.port[1]) { 
                        port = String(port_range.port[0]);
                    } else {
                        port = String(port_range.port[0]) + "-" + String(port_range.port[1]);
                    }
                    //simple tcp or upd
                    proto = prototab[ port_range.proto]
                    if ( !Array.isArray(policies[proto]) ) 
                        policies[proto] = []
                    // do not add port if port in exclude_ports 
                    if( excl_ports[proto] ) {
                        var _exclude_found = false;
                        if ( port.indexOf("_") > 0) {
                            var port_range = port.split('_');
                            excl_ports.forEach( function (s) {
                                if( ! _exclude_found) { 
                                    if( int(s) >= int(port_range[0]) && int(port_range[1]) <= int(s)) {
                                        _exclude_found = true;
                                    }
                                }
                            });
                        } else {
                            excl_ports[proto].forEach( function(s) {
                                if( ! _exclude_found) {
                                    if ( s == port)
                                    _exclude_found = true;
                                }
                            });
                        }
                        if( _exclude_found == false)
                            policies[proto].push( port);
                    }
                }

                if ( edge_with_box ) {
                    var title = '<ul>';
                    //console.log( JSON.stringify( policies));
                    var cur_node = { color: { background: 'lightgray'}, style: 'filled', shape: 'box', font: { size: 8}}
                    for ( cur_policy in policies) {
                        if (port_summary && policies[cur_policy].length > 3) {
                            ports.push( cur_policy + ":[" + policies[cur_policy].slice(0,3)+"+ ]")
                            title += '<li>' + cur_policy +':</li>'
                            policies[cur_policy].forEach( function (s) {
                                title += '<li>' + s + '<li>'
                            });
                        } else {
                            ports.push( cur_policy + ":[" + policies[cur_policy]+"]")
                        }
                    }
                    title += '</ul>'
                    //cur_node.label = policy.consumer_filter_name + '-->' + policy.provider_filter_name + ':\n' + ports.join('\n');
                    cur_node.label = ports.join('\n');
                    if( title.length > 10)
                        cur_node.title = title;
                    cur_node.id = policy.consumer_filter_id + policy.provider_filter_id
                    appVisData.nodes.push( cur_node)
                    //console.log( JSON.stringify( cur_node))

                    var cur_edge = { arrows: "to", font: {size: 12}, from: policy.consumer_filter_id, to: policy.consumer_filter_id + policy.provider_filter_id }
                    appVisData.edges.push( cur_edge)
                    var cur_edge2 = { arrows: "to", font: {size: 12}, from: policy.consumer_filter_id + policy.provider_filter_id, to: policy.provider_filter_id}
                    appVisData.edges.push( cur_edge2)
                } else {
                    var title = '<ul>'
                    for ( cur_policy in policies) {
                        if (port_summary && policies[cur_policy].length > 3) {
                            ports.push( cur_policy + ":[" + policies[cur_policy].slice(0,3)+"+ ]")
                            title += '<li>' + cur_policy +':</li>'
                            policies[cur_policy].forEach( function (s) {
                                title += '<li>' + s + '<li>'
                            });
                        } else {
                            ports.push( cur_policy + ":[" + policies[cur_policy]+"]")
                        }
                    }
                    title += '</ul>'
                    var cur_edge = { arrows: "to", label: ports.join('\n'), font: {align: 'top', size: 8}}
                    if( title.length > 10)
                        cur_edge.title = title;
                    cur_edge.from = policy.consumer_filter_id;
                    cur_edge.to = policy.provider_filter_id;
                    appVisData.edges.push( cur_edge);
                }
            } else {
                var cur_edge = { arrows: "to" }
                cur_edge.from = policy.consumer_filter_id;
                cur_edge.to = policy.provider_filter_id;
                appVisData.edges.push( cur_edge);
            }
        }
    }
    return appVisData;
}

router.get('/fapps/:appid', (req, res, next) => {
    var appid = req.params.appid;
    var ver = req.query.version 
    try {
        var body;
        if ( ver && ver != 'null' )
            body = JSON.parse(fs.readFileSync('public/data/'+appid +'/'+ver+'.json', 'utf8'));
        else
            body = JSON.parse(fs.readFileSync('public/data/'+appid +'.json', 'utf8'));
        var appVisData = parseData ( body);
        var versions = []
        fs.readdirSync( 'public/data/'+appid).forEach( file => {
            versions.push( file.substring(0, file.length-5))
            //console.log(file.substring(0, file.length-5));
        });
        appVisData.detail.version_list = versions
        res.send( appVisData ); 
    } catch ( exception) {
        console.log( exception)
        res.sendStatus(404)
    }
});

router.get('/apps/pos/:appid', (req, res, next) => {
    var appid = req.params.appid;
    var ver = req.query.version 
    try {
        var body;
        if ( ver && ver != 'null' )
            body = JSON.parse( fs.readFileSync('public/data/' + appid + '/' + ver + '.pos', 'utf8'));
        else
            body = JSON.parse( fs.readFileSync('public/data/' + appid + '.pos', 'utf8'));
        res.send( body)
    } catch ( exception ) {
        console.log( exception)
        res.sendStatus(404)
    }
});

router.post('/apps/pos/:appid', (req, res, next) => {
    var appid = req.params.appid
    var ver = req.query.version
    if ( ver && ver != 'null' )
        fs.writeFileSync( 'public/data/' + appid + '/' + ver + '.pos', JSON.stringify(req.body), 'utf8');
    else
        fs.writeFileSync( 'public/data/' + appid + '.pos', JSON.stringify(req.body), 'utf8');
    res.sendStatus(200);
});

router.get('/apps/:appid', (req, res, next) => {
    var appid = req.params.appid;
    tetclient.get('/applications/' + appid + '/details', (error, response, body) => {
        var appVisData = parseData ( body);
        res.send( appVisData ); 
    });
});

module.exports = router;
