const config = require('./bottender.config');
const loglevelLogger = require('./src/logger');

const { ntutApp } = config;

// Init logger
loglevelLogger.initialize(ntutApp.logger.level);

module.exports = require('./src');
