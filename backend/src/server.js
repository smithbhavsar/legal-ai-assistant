const http = require('http');
const app = require('./app');
const logger = require('./utils/logger');
const { pool } = require('./config/database');

const PORT = process.env.PORT || 3001;
const server = http.createServer(app);

// Graceful shutdown handling
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

function gracefulShutdown(signal) {
  logger.info(`Received ${signal}. Shutting down gracefully...`);
  
  server.close(() => {
    logger.info('HTTP server closed.');
    
    pool.end(() => {
      logger.info('Database pool has ended.');
      process.exit(0);
    });
  });
  
  // Force close server after 10secs
  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
}

server.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = server;
