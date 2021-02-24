const path = require('path');
const chalk = require('chalk');
const loglevel = require('loglevel');
const prefix = require('loglevel-plugin-prefix');

/**
 * loglevel levels from `trace`(0) to `silent`(5):
 *  `trace`, `debug`, `info`, `warn`, `error`, and `slient`.
 *  Since default level is `warn`, if no `lvl` given,
 *  disableAll() to make it silent.
 */
const initialize = (lvl) => {
  const colors = {
    TRACE: chalk.magenta,
    DEBUG: chalk.cyan,
    INFO: chalk.blue,
    WARN: chalk.yellow,
    ERROR: chalk.red,
  };
   
  prefix.reg(loglevel);
  
  if (lvl) {
    loglevel.setLevel(lvl);
  } else {
    loglevel.disableAll();
  }
   
  prefix.apply(
    loglevel,
    {
      format(level, name, timestamp) {
        return `${chalk.gray(`[${timestamp}]`)} ${colors[level.toUpperCase()](level)} ${chalk.green(`${name}:`)}`;
      },
    },
  );
  
  // Custom logger name and format
  prefix.apply(
    loglevel.getLogger('critical'),
    {
      format(level, name, timestamp) {
        return chalk.red.bold(`[${timestamp}] ${level} ${name}:`);
      },
    },
  );
  
  prefix.apply(
    loglevel.getLogger('notice'),
    {
      format(level, name, timestamp) {
        return chalk.yellow.bold(`[${timestamp}] ${level} ${name}:`);
      },
    },
  );
};

const getLogger = name => loglevel.getLogger(name);

const getLoggerByPath = (file) => {
  const packagesDir = path.resolve(__dirname, '../../');
  const pkgRelativePath = path.relative(packagesDir, file);
  
  const fields = pkgRelativePath.split(path.sep);
  const pkgName = fields[0];
  
  fields.splice(0, 2);
  const fileRelativePath = fields.reduce((acc, field) => path.join(acc, field), '');
  
  return loglevel.getLogger(`[${pkgName}]..${path.sep}${fileRelativePath}`);
};

module.exports = {
  initialize,
  getLogger,
  getLoggerByPath,
};
  