const stringify = require('fast-json-stable-stringify');
const mqtt = require('mqtt');
const config = require('../bottender.config');
const loglevelLogger = require('../logger');

const name = 'Josh.Chang';

// Object destructuring
const { ntutApp } = config;

loglevelLogger.initialize(ntutApp.logger.level);
const logger = loglevelLogger.getLoggerByPath(__filename);

// Log config variables
logger.debug('ntutApp.mqtt.servers.defaultUrl =', ntutApp.mqtt.servers.defaultUrl);
logger.debug('ntutApp.logger.level =', ntutApp.logger.level);
logger.debug('ntutApp.mqtt.topics.arduino.to =', ntutApp.mqtt.topics.arduino.to);
logger.debug('ntutApp.mqtt.topics.arduino.from =', ntutApp.mqtt.topics.arduino.from);

// Connect to MQTT server
const client = mqtt.connect(ntutApp.mqtt.servers.defaultUrl);
client.on('connect', function () {
  logger.info(`MQTT server "${ntutApp.mqtt.servers.defaultUrl}" connected.`);
  
  client.subscribe('presence', function (err) {
    if (!err) {
      // This is an echo
      client.publish('presence', 'Hello mqtt~');
    } else {
      logger.error(`Subscribe to topic "presence" failed!`);
    }
  })
  
  const responseTopic = `${ntutApp.mqtt.topics.arduino.from}-${name}`;
  client.subscribe(responseTopic, function (err) {
    if (!err) {
      const obj = {
        // shorthand properties
        responseTopic,
        method: 'getGPIOStatus',
      };
    
      client.publish(ntutApp.mqtt.topics.arduino.to, stringify(obj));
    } else {
      logger.error(`Subscribe to topic "${responseTopic}" failed.`);
    }
  })
})

client.on('message', function (topic, message) {
  // message is Buffer
  logger.info(`topic: "${topic}", message:"${message}" got.`);
  
  // client.end();
})

module.exports = async function App(context) {
  logger.debug('App entered...');
  
  await context.sendText('Welcome to Bottender');
};
