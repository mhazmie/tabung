const fs = require('fs');
const path = require('path');

const logFile = path.join(__dirname, '..', 'logs', 'system.log');

function logToFile(message) {
    const timestamp = new Date().toISOString();
    const logEntry = `${timestamp} ${message}\n`;
    fs.appendFile(logFile, logEntry, (err) => {
        if (err) {
            console.error('[LOGGER] Failed to write to log file:', err);
            logToFile('[LOGGER] Failed to write to log file:', err);
        }
    });
}

module.exports = { logToFile };
