const stringify = require('fast-json-stable-stringify');
const mqtt = require('mqtt');
const config = require('../bottender.config');
const loglevelLogger = require('../logger');

// Object destructuring
const { ntutApp } = config;

// Please give your name for uniqueness
const name = 'Josh.Chang';
const responseTopic = `${ntutApp.mqtt.topics.arduino.from}-${name}`;

const mqttServer = ntutApp.mqtt.servers.defaultUrl;

// Init logger
loglevelLogger.initialize(ntutApp.logger.level);
const logger = loglevelLogger.getLoggerByPath(__filename);

// Log config variables
logger.debug('ntutApp.mqtt.servers.defaultUrl =', ntutApp.mqtt.servers.defaultUrl);
logger.debug('ntutApp.logger.level =', ntutApp.logger.level);
logger.debug('ntutApp.mqtt.topics.arduino.to =', ntutApp.mqtt.topics.arduino.to);
logger.debug('ntutApp.mqtt.topics.arduino.from =', ntutApp.mqtt.topics.arduino.from);

// Connect to MQTT server
const client = mqtt.connect(mqttServer);

client.on('connect', function () {
  logger.info(`MQTT server "${mqttServer}" connected.`);
  
  client.subscribe('presence', function (err) {
    if (!err) {
      // An echo from the server
      client.publish('presence', 'Hello mqtt~');
    } else {
      logger.error(`Subscribe to topic "presence" failed!`);
    }
  })
  
  client.subscribe(responseTopic, function (err) {
    if (!err) {
      getGPIOStatus();
    } else {
      logger.error(`Subscribe to topic "${responseTopic}" failed.`);
    }
  })
})

client.on('message', function (topic, message) {
  // message is Buffer
  logger.info(`topic: "${topic}", message:"${message}" got.`);
})

const getGPIOStatus = function () {
  const obj = {
    // shorthand properties
    responseTopic,
    method: 'getGPIOStatus',
  };

  client.publish(
    ntutApp.mqtt.topics.arduino.to, 
    stringify(obj),
  );
};

const setGPIOStatus = function (args = { gpio: 2, status: true }) {
  const obj = {
    ...args,
    method: 'setGPIOStatus',
  };

  client.publish(
    ntutApp.mqtt.topics.arduino.to, 
    stringify(obj),
  );
};

module.exports = async function App(context) {
  logger.debug('App entered...');
  
  if (context.event.isText) {
    const cmd = context.event.message.text.toUpperCase();
    if (cmd === 'GETGPIO') {
      getGPIOStatus();
      
      // Wait for GPIO event
    } else if (cmd === 'SETGPIOHIGH') {
      setGPIOStatus({ gpio: 2, status: true });
    } else if (cmd === 'SETGPIOLOW') {
      setGPIOStatus({ gpio: 2, status: false });
    }
  }
  
  // await context.sendText('Welcome to Bottender');
};
