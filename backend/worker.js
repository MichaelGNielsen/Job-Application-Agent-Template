/**
 * Job Application Agent Template
 * 
 */

const { Worker } = require('bullmq');
const IORedis = require('ioredis');
const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { io } = require('socket.io-client');
const cheerio = require('cheerio');
const { mdToHtml, wrap, wrapAll, fetchCompanyContent, logger, printToPdf, parseCandidateInfo, extractSection, saveUrlToPdf, ensureEnvExists } = require('./utils');
const RadarService = require('./services/RadarService');
const ApplicationService = require('./services/ApplicationService');
const AiManager = require('./services/ai/AiManager');

const execPromise = promisify(exec);
const rootDir = '/app/shared';

// SIKRER AT .env FINDES (Self-healing)
ensureEnvExists(rootDir, logger);

// Indlæs .env filen
dotenv.config({ path: path.join(rootDir, '.env') });

// Tving API nøgle til at være tilgængelig for gemini-cli
if (process.env.GEMINI_API_KEY) {
    process.env.GOOGLE_API_KEY = process.env.GEMINI_API_KEY;
}

const redisConnection = new IORedis({
  host: process.env.REDIS_HOST || 'redis',
  port: 6379,
  maxRetriesPerRequest: null
});

const socket = io('http://localhost:3002');

// AI Manager (Samme kø som serveren)
const aiManager = new AiManager({ logger, redisConnection });

// Instantiér services (Dependency Injection)
const radarService = new RadarService({
    logger,
    fs,
    path,
    fetch,
    cheerio,
    aiManager,
    rootDir
});

const applicationService = new ApplicationService({
    logger,
    fs,
    path,
    socket,
    rootDir,
    mdToHtml,
    wrap,
    fetchCompanyContent,
    printToPdf,
    aiManager,
    parseCandidateInfo,
    extractSection,
    saveUrlToPdf
});

const worker = new Worker('job_queue', async (job) => {
  // --- RADAR JOBS ---
  if (job.name === 'radar_auto_sync') {
    return await radarService.autoSync();
  }

  if (job.name === 'radar_job_analyze') {
    try {
        return await radarService.analyzeJob(job.data);
    } catch (e) {
        return { status: 'failed', error: e.message };
    }
  }

  // --- ANSØGNINGS JOBS ---
  try {
      return await applicationService.processJob(job.data);
  } catch (error) {
      return { status: 'failed', error: error.message };
  }
}, { 
  connection: redisConnection,
  lockDuration: 600000 // 10 minutter
});
