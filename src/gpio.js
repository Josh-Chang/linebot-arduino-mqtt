const { EventEmitter } = require("events");
const stringify = require('fast-json-stable-stringify');
const mqtt = require('mqtt');
const config = require('../bottender.config');
const loglevelLogger = require('./logger');

const { ntutApp } = config;

const logger = loglevelLogger.getLoggerByPath(__filename);

module.exports = class GpioControl extends EventEmitter {
  constructor(
    opts = {
      mqttServer: ntutApp.mqtt.servers.defaultUrl,
      topics: {
        pub: ntutApp.mqtt.topics.arduino.to,
        sub: ntutApp.mqtt.topics.arduino.from,
      }
    },
  ) {
    super();
    
    this.opts = { ...opts };
    this.mqttClient = mqtt.connect(this.opts.mqttServer);
    
    this.mqttClient.on('connect', () => {
      logger.info(`MQTT server connected.`);
      
      this.mqttClient.subscribe('presence', (err) => {
        if (!err) {
          // An echo from the server
          this.mqttClient.publish('presence', 'Hello mqtt~');
        } else {
          logger.error(`Subscribe to topic "presence" failed!`);
        }
      })
      
      this.mqttClient.subscribe(this.opts.topics.sub, (err) => {
        if (!err) {
          this.getStatus();
        } else {
          logger.error(`Subscribe to topic "${this.opts.topics.sub}" failed.`);
        }
      })
    })
    
    this.mqttClient.on('message', async (topic, message) => {
      logger.info(`topic: "${topic}", message:"${message}" got.`);
    
      if (topic === this.opts.topics.sub) {
        
        // await this.sleep(20000);
        
        this.emit(ntutApp.events.gpioStatusUpdated, JSON.parse(message));
      }
    })
  }
  
  sleep(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  } 
  
  getStatus () {
    const obj = {
      responseTopic: this.opts.topics.sub,
      method: 'getGPIOStatus',
    };
  
    this.mqttClient.publish(
      this.opts.topics.pub, 
      stringify(obj),
    );
  }
    
  setStatus (args = { gpio: 0, status: true }) {
    const obj = {
      ...args,
      method: 'setGPIOStatus',
    };
    
    this.mqttClient.publish(
      this.opts.topics.pub, 
      stringify(obj),
    );
  }
}
