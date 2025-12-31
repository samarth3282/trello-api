const winston = require('winston');
const path = require('path');

const logger = winston.createLogger({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.errors({ stack: true }),
        winston.format.splat(),
        winston.format.json()
    ),
    defaultMeta: { service: 'task-management-api' },
    transports: [
        // Always log to console (needed for cloud platforms like Render)
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.printf(({ level, message, timestamp, stack }) => {
                    if (stack) {
                        return `${timestamp} [${level}]: ${message}\n${stack}`;
                    }
                    return `${timestamp} [${level}]: ${message}`;
                })
            ),
        }),
        // Write all logs with importance level of 'error' or less to 'error.log'
        new winston.transports.File({
            filename: path.join('logs', 'error.log'),
            level: 'error',
        }),
        // Write all logs to 'combined.log'
        new winston.transports.File({
            filename: path.join('logs', 'combined.log'),
        }),
    ],
});

module.exports = logger;
