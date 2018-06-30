
var kafka = require('kafka-node')
var fs = require('fs')
var mongo_client = require('mongodb').MongoClient
var dbo;

var args = process.argv.slice(2);

const options = {
    // Necessary only if using the client certificate authentication
    key: fs.readFileSync( args[0]+'/KafkaConsumerPrivateKey.key'),
    cert: fs.readFileSync( args[0]+'/KafkaConsumerCA.cert'),
    requestCert: true,
    //secureProtocol: 'SSL_method',
    rejectUnauthorized: false,
    // Necessary only if the server uses the self-signed certificate
    ca: [ fs.readFileSync( args[0]+'/KafkaCA.cert'), fs.readFileSync('/etc/ssl/cert.pem') ]
  };
  var url = "mongodb://localhost:27017";

   mongo_client.connect(url, function(err, db) {
        if (err) throw err;
        dbo = db.db("notification");
        dbo.createCollection("alert", function(err, res) {
            if (err) throw err;
            console.log("Collection created!");
        });
   });

  var client = new kafka.KafkaClient({kafkaHost: fs.readFileSync( args[0]+'/kafkaBrokerIps.txt').toString(), sslOptions: options});

  console.log('Kafka SSL connected to ' + fs.readFileSync( args[0]+'/kafkaBrokerIps.txt').toString())
  Consumer = kafka.Consumer,
    consumer = new Consumer(
        client,
        [
            { topic: fs.readFileSync( args[0]+'/topic.txt').toString(), partition: 0 }
        ],
        {
            autoCommit: false
        }
    );
    //console.log( consumer)

    consumer.on('message', function (message) {
        var alert = JSON.parse( message['value'])
        alert.alert_details = JSON.parse( alert.alert_details)
        //console.log( alert)
        dbo.collection('alert').insertOne( alert, function(err, result) {
            if (err) throw err;
            console.log( alert.key_id + ' is added...' );
        });
    });

    consumer.on('error', function (err) {
        console.log(err)
    })

    consumer.on('ready', function(err) {
        console.log(err);
    });

