const { Client } = require('@line/bot-sdk');
const stringify = require('fast-json-stable-stringify');
const mqtt = require('mqtt');
const config = require('../bottender.config');
const Gpio = require('./gpio');
const loglevelLogger = require('./logger');

// Object destructuring
const { ntutApp } = config;

// Please give your name for uniqueness
// const name = 'Josh.Chang';
// const responseTopic = `${ntutApp.mqtt.topics.arduino.from}-${name}`;

const gpio = new Gpio();

const logger = loglevelLogger.getLoggerByPath(__filename);

const lineClient = new Client({
  channelAccessToken: process.env.LINE_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
});

// mqttClient.on('connect', function () {
//   logger.info(`MQTT server "${mqttServer}" connected.`);
  
//   mqttClient.subscribe('presence', function (err) {
//     if (!err) {
//       // An echo from the server
//       mqttClient.publish('presence', 'Hello mqtt~');
//     } else {
//       logger.error(`Subscribe to topic "presence" failed!`);
//     }
//   })
  
//   mqttClient.subscribe(responseTopic, function (err) {
//     if (!err) {
//       getGPIOStatus();
//     } else {
//       logger.error(`Subscribe to topic "${responseTopic}" failed.`);
//     }
//   })
// })

// mqttClient.on('message', async function (topic, message) {
//   // message is Buffer
//   logger.info(`topic: "${topic}", message:"${message}" got.`);
  
//   if (topic === responseTopic) {
//     const { status } = JSON.parse(message);
//     const text = status? '亮的' : '暗的';
//     pushTextMessage(`燈泡是${text}`);
//   }
// })


const pushTextMessage = function (text) {
  // Line max character limit: 1000
  if (text.length > 1000) {
    logger.warn('Text length exceeds character limit: 1000');
    
    text = text.slice(0, 1000);
  }
  
  try {
    lineClient.pushMessage(
      ntutApp.line.userId,
      {
        text,
        type: 'text',
      },
    );
  } catch (e) {
    logger.error(String(e));
  }
};

module.exports = async function App(context) {
  logger.debug('App entered...');
  
  if (context.event.isText) {
    const cmd = context.event.message.text.toUpperCase();
    
    if (cmd === '燈泡狀態') {
      gpio.once(ntutApp.events.gpioStatusUpdated, async (obj) => {
        const { status } = obj;
        const text = status ? '亮的' : '暗的';
      
        await context.sendText(`燈泡是${text}`);
      });
      
      gpio.getStatus();
    } else if (cmd === '要有光') {
      gpio.setStatus({ 
        gpio: 0, 
        status: true,
      });
    } else if (cmd === '黑夜來臨') {
      gpio.setStatus({ 
        gpio: 0, 
        status: false, 
      });
    }
  }
};
