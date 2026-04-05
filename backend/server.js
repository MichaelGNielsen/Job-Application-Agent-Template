/**
 * @file server.js
 * @description Central Server: Orkestrerer API, Sockets og Services.
 */

const express = require('express');
const http = require('http');
const { Queue } = require('bullmq');
const IORedis = require('ioredis');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const cheerio = require('cheerio');
const dotenv = require('dotenv');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

// Utils og Services
const { mdToHtml, wrap, logger, printToPdf, parseCandidateInfo, extractSection, getInitials } = require('./utils');
const { runAiSyreTest } = require('./ai_syre_test');
const RadarService = require('./services/RadarService');
const AiManager = require('./services/ai/AiManager');
const SocketService = require('./services/SocketService');

// Controllere
const RadarController = require('./controllers/RadarController');
const ApplicationController = require('./controllers/ApplicationController');
const ConfigController = require('./controllers/ConfigController');

const rootDir = '/app/shared';
dotenv.config({ path: path.join(rootDir, '.env') });

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '50mb' }));

// --- DI & SERVICE INSTANSIERING ---
const redisConnection = new IORedis({
  host: process.env.REDIS_HOST || 'redis',
  port: 6379,
  maxRetriesPerRequest: null
});

const jobQueue = new Queue('job_queue', { connection: redisConnection });

// AI Manager (Global kø og Multi-provider)
const aiManager = new AiManager({ logger, redisConnection });

const radarService = new RadarService({
    logger, fs, path, fetch, cheerio, aiManager, rootDir
});

const radarController = new RadarController({ radarService, jobQueue });

const applicationController = new ApplicationController({
    jobQueue, aiManager, rootDir, fs, path, logger, mdToHtml, wrap, printToPdf
});

const configController = new ConfigController({
    rootDir, fs, path, aiManager, parseCandidateInfo, getInitials, mdToHtml, wrap, printToPdf
});

// --- SWAGGER SETUP ---
// !!! VIGTIG LÆRESTREG (SWAGGER):
// Alle @openapi dokumentations-blokke SKAL ligge her i server.js lige over deres routes.
// Hvis de placeres ude i controller-filerne, bliver linket/knappen i Swagger UI ofte 'dødt' 
// eller fejler ved eksekvering, selvom scanning af './controllers/*.js' er aktiveret.
// KONKLUSION: Hold dokumentation og rute-definition samlet her for at sikre at 'Try it out' virker!
const swaggerSpec = swaggerJsdoc({
    definition: {
        openapi: '3.0.0',
        info: { 
            title: 'Job Application Agent API', 
            version: '5.6.0',
            description: 'API til automatisering af jobansøgninger og CV-skræddersyning.'
        },
        servers: [{ url: 'http://localhost:3002' }],
    },
    apis: ['./server.js'], // VI SCANNER KUN DENNE FIL FOR AT UNDGÅ DØDE LINKS
});

// Servér JSON specifikationen
app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// --- API RUTER ---

/**
 * @openapi
 * /api/version:
 *   get:
 *     summary: Hent systemversion
 *     tags: [Config]
 *     responses:
 *       200:
 *         description: Succes
 */
app.get('/api/version', (req, res) => configController.getVersion(req, res));

/**
 * @openapi
 * /api/config/instructions:
 *   get:
 *     summary: Hent AI instruktioner
 *     tags: [Config]
 *     responses:
 *       200:
 *         description: Succes
 *   post:
 *     summary: Gem AI instruktioner
 *     tags: [Config]
 *     responses:
 *       200:
 *         description: Succes
 */
app.get('/api/config/instructions', (req, res) => configController.getInstructions(req, res));
app.post('/api/config/instructions', (req, res) => configController.saveInstructions(req, res));

/**
 * @openapi
 * /api/config/layout:
 *   get:
 *     summary: Hent Master Layout
 *     tags: [Config]
 *     responses:
 *       200:
 *         description: Succes
 *   post:
 *     summary: Gem Master Layout
 *     tags: [Config]
 *     responses:
 *       200:
 *         description: Succes
 */
app.get('/api/config/layout', (req, res) => configController.getLayout(req, res));
app.post('/api/config/layout', (req, res) => configController.saveLayout(req, res));

/**
 * @openapi
 * /api/brutto:
 *   get:
 *     summary: Hent Master CV
 *     tags: [Config]
 *     responses:
 *       200:
 *         description: Succes
 *   post:
 *     summary: Gem Master CV
 *     tags: [Config]
 *     responses:
 *       200:
 *         description: Succes
 */
app.get('/api/brutto', (req, res) => configController.getBrutto(req, res));
app.post('/api/brutto', (req, res) => configController.saveBrutto(req, res));

/**
 * @openapi
 * /api/brutto/refine:
 *   post:
 *     summary: AI Optimering af Master CV
 *     tags: [Config]
 *     responses:
 *       200:
 *         description: Succes
 */
app.post('/api/brutto/refine', (req, res) => configController.refineBrutto(req, res));

/**
 * @openapi
 * /api/radar:
 *   get:
 *     summary: Hent alle radar data
 *     tags: [Radar]
 *     responses:
 *       200:
 *         description: Succes
 */
app.get('/api/radar', (req, res) => radarController.getRadar(req, res));

/**
 * @openapi
 * /api/radar/refresh:
 *   post:
 *     summary: Start proaktiv søgning
 *     tags: [Radar]
 *     responses:
 *       200:
 *         description: Succes
 */
app.post('/api/radar/refresh', (req, res) => radarController.refresh(req, res));

/**
 * @openapi
 * /api/radar/job:
 *   post:
 *     summary: Tilføj job manuelt
 *     tags: [Radar]
 *     responses:
 *       200:
 *         description: Succes
 */
app.post('/api/radar/job', (req, res) => radarController.addJob(req, res));

/**
 * @openapi
 * /api/radar/status:
 *   post:
 *     summary: Opdater job status
 *     tags: [Radar]
 *     responses:
 *       200:
 *         description: Succes
 */
app.post('/api/radar/status', (req, res) => radarController.updateStatus(req, res));

/**
 * @openapi
 * /api/radar/config:
 *   post:
 *     summary: Opdater konfiguration
 *     tags: [Radar]
 *     responses:
 *       200:
 *         description: Succes
 */
app.post('/api/radar/config', (req, res) => radarController.updateConfig(req, res));

/**
 * @openapi
 * /api/radar/maintenance:
 *   post:
 *     summary: Rens radaren
 *     tags: [Radar]
 *     responses:
 *       200:
 *         description: Succes
 */
app.post('/api/radar/maintenance', (req, res) => radarController.maintenance(req, res));

/**
 * @openapi
 * /api/radar/{id}:
 *   delete:
 *     summary: Slet et job
 *     tags: [Radar]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Succes
 */
app.delete('/api/radar/:id', (req, res) => radarController.deleteJob(req, res));

/**
 * @openapi
 * /api/ai/test:
 *   get:
 *     summary: Test AI forbindelse (2+2)
 *     description: Sender et simpelt regnestykke til den valgte AI provider for at tjekke om den er "levende".
 *     tags: [Applications]
 *     parameters:
 *       - in: query
 *         name: provider
 *         schema:
 *           type: string
 *           enum: [gemini, ollama, opencode]
 *         description: Den AI motor der skal testes (valgfri, bruger default hvis udeladt).
 *     responses:
 *       200:
 *         description: AI svar modtaget.
 */
app.get('/api/ai/test', (req, res) => applicationController.testAi(req, res));

/**
 * @openapi
 * /api/generate:
 *   post:
 *     summary: Start job-generering
 *     tags: [Applications]
 *     responses:
 *       200:
 *         description: Succes
 */
app.post('/api/generate', (req, res) => applicationController.generate(req, res));

/**
 * @openapi
 * /api/refine:
 *   post:
 *     summary: Forfin dokument
 *     tags: [Applications]
 *     responses:
 *       200:
 *         description: Succes
 */
app.post('/api/refine', (req, res) => applicationController.refine(req, res));

/**
 * @openapi
 * /api/results/{folder}:
 *   get:
 *     summary: Hent resultater
 *     tags: [Applications]
 *     parameters:
 *       - in: path
 *         name: folder
 *         required: true
 *         schema:
 *           type: string
 *           example: "2026-04-04-05-45-58_skywatch_software_developer"
 *     responses:
 *       200:
 *         description: Succes
 */
app.get('/api/results/:folder', (req, res) => applicationController.getResults(req, res));

// Statiske filer fra output
app.use('/api/applications', (req, res, next) => {
    req.url = decodeURIComponent(req.url);
    express.static(path.join(rootDir, 'output'))(req, res, next);
});

// --- SERVER START & CRON ---
const PORT = process.env.PORT || 3002;
const server = http.createServer(app);
const socketService = new SocketService(server, logger);

// Radar Cron Setup
const setupRadarCron = async () => {
    const jobs = await jobQueue.getRepeatableJobs();
    for (const job of jobs) {
        if (job.name === 'radar_auto_sync') await jobQueue.removeRepeatableByKey(job.key);
    }
    await jobQueue.add('radar_auto_sync', {}, { repeat: { pattern: '0 */6 * * *' } });
    logger.info("Server", "Radar Auto-Sync planlagt (hver 6. time)");
};

server.listen(PORT, () => {
    logger.info("Server", "Systemet kører", { port: PORT });
    setupRadarCron();
    if (process.env.ENABLE_STARTUP_SELF_TEST !== 'false') {
        runAiSyreTest(aiManager); // Vi sender aiManager med til syre-testen
    } else {
        logger.info("Server", "AI Selv-test deaktiveret via konfiguration");
    }
});

