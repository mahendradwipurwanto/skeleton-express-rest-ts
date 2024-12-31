import { createLogger, format, transports } from 'winston';
import 'winston-daily-rotate-file';

const logger = createLogger({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    format: format.combine(
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        format.printf(({ level, message, timestamp }) => {
            return `${timestamp} [${level.toUpperCase()}]: ${message}`;
        })
    ),
    transports: [
        new transports.Console(),
        new transports.DailyRotateFile({
            dirname: 'logs',
            filename: 'application-%DATE%.log',
            datePattern: 'YYYY-MM-DD',
            maxFiles: '14d',
        }),
    ],
});

export default logger;