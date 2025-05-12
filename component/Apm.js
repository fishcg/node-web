const config = require('../app/config.js');

let Apm = null;

if (!config.apm || !config.apm.host) {
  class ApmClass {
    captureError(error, options) {
      console.error(error)
    }
  }
  Apm = new ApmClass()
} else {
  Apm = require('elastic-apm-node').start({
    // Override service name from package.json
    // Allowed characters: a-z, A-Z, 0-9, -, _, and space
    serviceName: 'node-web',
    // Use if APM Server requires a token
    secretToken: '',
    // Use if APM Server uses API keys for authentication
    apiKey: '',
    // Set custom APM Server URL (default: http://127.0.0.1:8200)
    serverUrl: config.apm.host,
  })
}

module.exports = {
  Apm
};
