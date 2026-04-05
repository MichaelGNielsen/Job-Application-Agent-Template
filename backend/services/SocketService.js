/**
 * SocketService.js
 * Håndterer alle WebSockets-forbindelser (Socket.io).
 * Isoleret for at holde server.js ren og overskuelig.
 */

const { Server } = require('socket.io');

class SocketService {
    constructor(httpServer, logger) {
        this.logger = logger;
        this.io = new Server(httpServer, {
            cors: { origin: true, credentials: true }
        });

        this.io.on('connection', (socket) => {
            // Frontend (og Worker) kan tilmelde sig et specifikt job-rum
            socket.on('join_job', (jobId) => { 
                socket.join(jobId); 
            });

            // Når Worker sender en statusopdatering, broadcaster vi den til alle i job-rummet
            socket.on('job_status_update', (data) => { 
                this.io.to(data.jobId).emit('job_status_update', data); 
            });
        });
        
        this.logger.info("SocketService", "WebSocket server initialiseret");
    }
}

module.exports = SocketService;
