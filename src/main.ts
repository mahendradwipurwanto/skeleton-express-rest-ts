import 'tsconfig-paths/register';
import express from 'express';
import * as dotenv from 'dotenv';
import morgan from 'morgan';
import logger from './lib/helper/logger'; // Custom Winston logger
import {App} from './app';
import {AppDataSource} from './config/mysql/datasource';

if (process.env.NODE_ENV !== 'production') {
    dotenv.config();
}

const StartServer = async () => {
    try {
        const server = express();
        const app = new App();
        const PORT = process.env.PORT || 3000;

        // Redirect Morgan logs to Winston
        server.use(morgan('combined', {
            stream: {
                write: (message: string) => logger.info(message.trim()), // Send Morgan logs to Winston
            },
        }));

        app.SetupMiddleware(server);
        app.SetupRoutes(server);
        app.SetupErrorHandling(server);

        AppDataSource.initialize().then(async () => {
            server.listen(PORT, () => {
                logger.info(`Server is running on port ${PORT}...`);
            });
            logger.info('Successfully connected to the database...');
        }).catch((dbError) => {
            logger.error('Database connection failed:', dbError);
        });
    } catch (error) {
        logger.error('Error starting the server:', error);
    }
}

StartServer();