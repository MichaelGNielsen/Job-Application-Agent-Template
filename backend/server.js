/**
 * Job Application Agent MGN - Server (v4.8.0)
 * Stabiliseret API arkitektur med modulær service-struktur.
 * Nu fuldt modulær med Dependency Injection af logger.
 */
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { Queue } = require('bullmq');
const IORedis = require('ioredis');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

// Import services
const logger = require('./logger');
const { mdToHtml, printToPdf } = require('./pdf_service');
const { parseCandidateInfo, parseFrontMatter, wrap } = require('./document_service');
const { callLocalGemini } = require('./ai_service');
const { generateMasterDocs } = require('./master_cv_service');

const rootDir = '/app/shared';
dotenv.config({ path: path.join(rootDir, '.env') });

if (process.env.GEMINI_API_KEY) {
    process.env.GOOGLE_API_KEY = process.env.GEMINI_API_KEY;
}

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });
const versionFilePath = path.join(rootDir, 'VERSION');

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '50mb' }));

const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: { title: 'Job Application Agent API', version: '4.8.0' },
        servers: [{ url: 'http://localhost:3002' }],
    },
    apis: ['./server.js'], 
};
const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// --- API VERSION ENDPOINT ---
app.get('/api/version', (req, res) => {
    try {
        let instanceName = "Default";
        const envPath = path.join(rootDir, '.env');
        if (fs.existsSync(envPath)) {
            const envContent = fs.readFileSync(envPath, 'utf8');
            const identityMatch = envContent.match(/#\s*(IDENTITY_[A-Z0-9_]+)/i);
            if (identityMatch) instanceName = identityMatch[1];
        }
        
        const model = process.env.GEMINI_MODEL || "gemini-2.0-flash";
        let currentVersion = "2.6.x-dev";
        if (fs.existsSync(versionFilePath)) {
            currentVersion = fs.readFileSync(versionFilePath, 'utf8').trim().split('\n')[0];
        }
        res.json({ version: currentVersion, instance: instanceName, model: model });
    } catch (e) {
        res.status(500).json({ version: "error", error: e.message });
    }
});

const redisConnection = new IORedis({
  host: process.env.REDIS_HOST || 'redis',
  port: 6379,
  maxRetriesPerRequest: null
});
const jobQueue = new Queue('job_queue', { connection: redisConnection });

app.use('/api/applications', express.static(path.join(rootDir, 'output'), {
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('.pdf')) {
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'inline');
        }
    }
}));

app.get('/api/brutto', async (req, res) => {
  try {
    const bruttoPath = path.join(rootDir, 'data', 'brutto_cv.md');
    const content = fs.existsSync(bruttoPath) ? fs.readFileSync(bruttoPath, 'utf8') : "";
    res.json({ content });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/brutto/render', async (req, res) => {
    try {
        const result = await generateMasterDocs(null, logger);
        res.json({ success: true, html: result.html });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/brutto', async (req, res) => {
  try {
    const { content } = req.body;
    const bruttoPath = path.join(rootDir, 'data', 'brutto_cv.md');
    fs.writeFileSync(bruttoPath, content);
    await generateMasterDocs(content, logger);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/generate', async (req, res) => {
  try {
    const { jobText, companyUrl, hint } = req.body;
    const jobId = "job_" + Date.now().toString();
    logger.info("Server", "Ny generering anmodet", { jobId });
    await jobQueue.add('generate_application', { jobId, jobText, companyUrl, hint, type: 'initial' }, { jobId });
    res.status(202).json({ jobId });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/refine', async (req, res) => {
  try {
    const { folder, type, body: rawBody, meta: rawMeta, useAi, hint, markdown } = req.body;

    if (useAi) {
        const jobId = "refine_" + Date.now().toString();
        const folderPath = path.join(rootDir, 'output', folder);
        const files = fs.readdirSync(folderPath).filter(f => f.endsWith('.md') && !f.includes('job.md'));
        let combinedMarkdown = "";
        files.forEach(f => {
            const content = fs.readFileSync(path.join(folderPath, f), 'utf8');
            combinedMarkdown += `\n### FIL: ${f}\n${content}\n`;
        });
        await jobQueue.add('generate_application', { jobId, folder, hint, markdown: combinedMarkdown, type: 'refine_with_ai' }, { jobId });
        return res.status(202).json({ jobId });
    }

    const folderPath = path.join(rootDir, 'output', folder);
    const files = fs.readdirSync(folderPath);
    const typeLabel = type === 'ansøgning' ? 'Ansøgning' : type === 'cv' ? 'CV' : type === 'match' ? 'Match_Analyse' : 'ICAN+_Pitch';
    let existingFile = files.find(f => f.startsWith(typeLabel + '_') && f.endsWith('.md') && !f.includes('copy'));
    if (!existingFile) existingFile = files.find(f => f.startsWith(typeLabel) && f.endsWith('.md'));
    
    const baseName = existingFile ? existingFile.replace('.md', '') : typeLabel;
    const mdPath = path.join(folderPath, `${baseName}.md`);
    const htmlPath = path.join(folderPath, `${baseName}.html`);
    const pdfPath = path.join(folderPath, `${baseName}.pdf`);

    let finalizedMarkdown = "";
    let bodyToConvert = rawBody || "";
    let currentMetadata = rawMeta || "";

    if (rawBody !== undefined || rawMeta !== undefined) {
        const cleanMeta = currentMetadata.replace(/^---+|---$/g, '').trim();
        finalizedMarkdown = `---\n${cleanMeta}\n---\n${bodyToConvert}`;
    } else {
        finalizedMarkdown = markdown || "";
        const parsed = parseFrontMatter(finalizedMarkdown);
        bodyToConvert = parsed.body;
    }

    fs.writeFileSync(mdPath, finalizedMarkdown);
    const bruttoPath = path.join(rootDir, 'data', 'brutto_cv.md');
    const bruttoCv = fs.existsSync(bruttoPath) ? fs.readFileSync(bruttoPath, 'utf8') : "";
    const candidate = parseCandidateInfo(bruttoCv, logger);
    const fm = parseFrontMatter(finalizedMarkdown);
    
    const lang = finalizedMarkdown.toLowerCase().includes('dear') || finalizedMarkdown.toLowerCase().includes('sincerely') ? 'en' : 'da';
    const htmlBody = await mdToHtml(bodyToConvert, mdPath, `${baseName}_body.html`, logger);
    const companyName = folder.split('_')[2] || 'firma';
    const jobTitle = folder.split('_').slice(3).join(' ') || 'stilling';
    
    const fullHtml = wrap(typeLabel.replace('_', ' '), htmlBody, type, { company: companyName, position: jobTitle }, candidate, lang, fm.attributes, logger);
    fs.writeFileSync(htmlPath, fullHtml);
    await printToPdf(htmlPath, pdfPath, logger);
    
    res.json({ success: true, html: fullHtml, markdown: finalizedMarkdown });
  } catch (err) { 
      logger.error("Server", "Fejl ved refine", { error: err.message });
      res.status(500).json({ error: err.message }); 
  }
});

io.on('connection', (socket) => {
  socket.on('join_job', (jobId) => { socket.join(jobId); });
  socket.on('job_status_update', (data) => { io.to(data.jobId).emit('job_status_update', data); });
});

const PORT = 3002;
server.listen(PORT, '0.0.0.0', () => {
  logger.info("Server", "Systemet kører", { port: PORT });
});
