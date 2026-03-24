/**
 * Job Application Agent Template
 * 
 * Designer: MGN (mgn@mgnielsen.dk)
 * Copyright (c) 2026 MGN. All rights reserved.
 * 
 * BEMÆRK: Denne kode anvender AI til generering og behandling.
 * Brugeren skal selv verificere, at resultatet er som forventet.
 * Softwaren leveres "som den er", uden nogen form for garanti.
 * Brug af softwaren sker på eget ansvar.
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
const { exec } = require('child_process');
const { promisify } = require('util');
const { mdToHtml, wrap, logger, printToPdf } = require('./utils');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

const execPromise = promisify(exec);

// Konfigurer stier
const rootDir = '/app/shared';
// Indlæs .env_ai filen
dotenv.config({ path: path.join(rootDir, '.env_ai') });

// Tving API nøgle til at være tilgængelig for gemini-cli
if (process.env.GEMINI_API_KEY) {
    process.env.GOOGLE_API_KEY = process.env.GEMINI_API_KEY;
}

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const versionFilePath = path.join(rootDir, 'VERSION');

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '50mb' }));

// Swagger konfiguration
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Job Application Agent API',
            version: '3.2.0',
            description: 'API til automatisering af jobansøgninger og CV-skræddersyning.',
        },
        servers: [{ url: 'http://localhost:3000' }],
    },
    apis: ['./server.js'], 
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

/**
 * @openapi
 * /api/version:
 *   get:
 *     summary: Hent den aktuelle systemversion
 *     responses:
 *       200:
 *         description: Returnerer versionsnummeret.
 */
app.get('/api/version', (req, res) => {
    try {
        let instanceName = "";
        
        // 1. Prioritet: Læs Master Identity direkte fra toppen af .env_ai
        const envPath = path.join(rootDir, '.env_ai');
        if (fs.existsSync(envPath)) {
            const envContent = fs.readFileSync(envPath, 'utf8');
            const lines = envContent.split('\n');
            // Tjek de første 5 linjer for en identitet (for at være fleksibel)
            for (let i = 0; i < Math.min(5, lines.length); i++) {
                const identityMatch = lines[i].match(/#\s*(IDENTITY_[A-Z0-9_]+)/i);
                if (identityMatch) {
                    instanceName = identityMatch[1];
                    break;
                }
            }
        }

        // 2. Prioritet: Brug miljøvariabel hvis ingen identitet blev fundet
        if (!instanceName || instanceName === 'TAG_DINE_INITIALER' || instanceName === 'IDENTITY_DINE_INITIALER') {
            instanceName = process.env.APP_INSTANCE_NAME || 'Default';
        }

        if (fs.existsSync(versionFilePath)) {
            const content = fs.readFileSync(versionFilePath, 'utf8').trim();
            const currentVersion = content.split('\n')[0].trim();
            res.json({ version: currentVersion, instance: instanceName });
        } else {
            res.json({ version: "2.6.x-dev", instance: instanceName });
        }
    } catch (e) {
        res.status(500).json({ version: "error", instance: "error" });
    }
});

const redisConnection = new IORedis({
  host: process.env.REDIS_HOST || 'redis',
  port: 6379,
  maxRetriesPerRequest: null
});

const jobQueue = new Queue('job_queue', { connection: redisConnection });

function parseCandidateInfo(bruttoCv) {
    const info = { name: "", address: "", email: "", phone: "" };
    if (!bruttoCv) return info;

    const cleanValue = (val) => val ? val.replace(/^[\s\*\-#]+|[\s\*\-#]+$/g, '').trim() : "";

    const getName = bruttoCv.match(/(?:\*\*|\*|#|-)?\s*(?:Navn|Name)[:\s]+(.*?)(?:\n|$)/i);
    const getAddr = bruttoCv.match(/(?:\*\*|\*|#|-)?\s*(?:Adresse|Address)[:\s]+(.*?)(?:\n|$)/i);
    const getEmail = bruttoCv.match(/(?:\*\*|\*|#|-)?\s*(?:Email|E-mail)[:\s]+(.*?)(?:\n|$)/i);
    const getPhone = bruttoCv.match(/(?:\*\*|\*|#|-)?\s*(?:Telefon|Phone|Mobil|Mobile)[:\s]+(.*?)(?:\n|$)/i);

    if (getName) info.name = cleanValue(getName[1]);
    if (getAddr) info.address = cleanValue(getAddr[1]);
    if (getEmail) info.email = cleanValue(getEmail[1]);
    if (getPhone) info.phone = cleanValue(getPhone[1]);
    
    return info;
}

app.use('/api/applications', (req, res, next) => {
    try {
        const originalUrl = req.url;
        req.url = decodeURIComponent(req.url);
        logger.info("Server", "Fil anmodet fra /api/applications", { original: originalUrl, decoded: req.url });
    } catch (e) {
        logger.warn("Server", "Kunne ikke decode URL", { url: req.url, error: e.message });
    }
    next();
}, express.static(path.join(rootDir, 'output'), {
    index: false,
    fallthrough: false, // Tving fejl hvis fil ikke findes i stedet for at gå videre
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('.pdf')) {
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'inline');
        }
    }
}));

async function callLocalGemini(prompt) {
    try {
        const tempFile = path.join('/tmp', `prompt_${Date.now()}.txt`);
        fs.writeFileSync(tempFile, prompt);
        const { stdout } = await execPromise(`gemini < "${tempFile}"`);
        if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
        return stdout;
    } catch (error) {
        logger.error("callLocalGemini", "Fejl ved kald til Gemini CLI", { error: error.message });
        throw error;
    }
}

/**
 * @openapi
 * /api/brutto:
 *   get:
 *     summary: Hent det nuværende Brutto-CV (Markdown)
 *     responses:
 *       200:
 *         description: Returnerer CV-indholdet.
 *   post:
 *     summary: Gem opdateret Brutto-CV
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *     responses:
 *       200:
 *         description: CV gemt succesfuldt.
 */
app.get('/api/brutto', async (req, res) => {
  try {
    const bruttoPath = path.join(rootDir, 'data', 'brutto_cv.md');
    const content = fs.existsSync(bruttoPath) ? fs.readFileSync(bruttoPath, 'utf8') : "";
    res.json({ content });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/brutto', async (req, res) => {
  try {
    const { content } = req.body;
    const bruttoPath = path.join(rootDir, 'data', 'brutto_cv.md');
    fs.writeFileSync(bruttoPath, content);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// NYE ENDPOINTS TIL KARTOTEK-SYSTEMET (v3.0)

/**
 * @openapi
 * /api/config/instructions:
 *   get:
 *     summary: Hent AI-instruktioner
 *     responses:
 *       200:
 *         description: AI-instruktionerne i Markdown.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 content:
 *                   type: string
 *   post:
 *     summary: Gem AI-instruktioner
 */
app.get('/api/config/instructions', (req, res) => {
    try {
        const p = path.join(rootDir, 'templates', 'ai_instructions.md');
        res.json({ content: fs.readFileSync(p, 'utf8') });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/config/instructions', (req, res) => {
    try {
        const p = path.join(rootDir, 'templates', 'ai_instructions.md');
        fs.writeFileSync(p, req.body.content);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

/**
 * @openapi
 * /api/config/layout:
 *   get:
 *     summary: Hent Master Layout (HTML)
 *     responses:
 *       200:
 *         description: Master Layoutet i HTML.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 content:
 *                   type: string
 *   post:
 *     summary: Gem Master Layout (HTML)
 */
app.get('/api/config/layout', (req, res) => {
    try {
        const p = path.join(rootDir, 'templates', 'master_layout.html');
        res.json({ content: fs.readFileSync(p, 'utf8') });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/config/layout', (req, res) => {
    try {
        const p = path.join(rootDir, 'templates', 'master_layout.html');
        fs.writeFileSync(p, req.body.content);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// LIVE PREVIEW LOOPBACK (v3.0)
app.post('/api/preview', async (req, res) => {
    try {
        const { markdown, type, lang, candidate, meta } = req.body;
        
        // Lav en midlertidig fil til pandoc
        const tempMdPath = path.join('/tmp', `preview_${Date.now()}.md`);
        const htmlBody = await mdToHtml(markdown, tempMdPath, `preview_${Date.now()}.html`);
        if (fs.existsSync(tempMdPath)) fs.unlinkSync(tempMdPath);

        // Hent de nyeste metadata hvis de findes i requesten
        const layoutMeta = req.body.layoutMeta || {};

        const fullHtml = wrap(type, htmlBody, type.toLowerCase(), meta, candidate, lang || 'dk', layoutMeta);
        res.json({ html: fullHtml });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/brutto/translate', async (req, res) => {
  try {
    const { content } = req.body;
    const prompt = `Oversæt dette CV til professionelt engelsk. Behold Markdown-formateringen:\n\n${content}`;
    const translated = await callLocalGemini(prompt);
    res.json({ translated });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

/**
 * @openapi
 * /api/generate:
 *   post:
 *     summary: Start generering af en ny ansøgningspakke
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               jobText:
 *                 type: string
 *               companyUrl:
 *                 type: string
 *               hint:
 *                 type: string
 *     responses:
 *       202:
 *         description: Job er tilføjet til køen.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 jobId:
 *                   type: string
 */
app.post('/api/generate', async (req, res) => {
  try {
    const { jobText, companyUrl, hint } = req.body;
    const jobId = "job_" + Date.now().toString();
    logger.info("Server", "Ny generering anmodet", { jobId, companyUrl });
    await jobQueue.add('generate_application', { jobId, jobText, companyUrl, hint, type: 'initial' }, { jobId });
    res.status(202).json({ jobId });
  } catch (err) { 
    logger.error("Server", "Fejl ved /api/generate", { error: err.message });
    res.status(500).json({ error: err.message }); 
  }
});

app.post('/api/refine', async (req, res) => {
  try {
    const { folder, type, markdown, useAi, hint } = req.body; 

    if (useAi) {
        const jobId = "refine_" + Date.now().toString();
        // Saml alle nuværende MD filer i mappen for at give AI'en kontekst
        const folderPath = path.join(rootDir, 'output', folder);
        const files = fs.readdirSync(folderPath).filter(f => f.endsWith('.md') && !f.includes('job.md'));
        let combinedMarkdown = "";
        files.forEach(f => {
            const content = fs.readFileSync(path.join(folderPath, f), 'utf8');
            combinedMarkdown += `\n---${f}---\n${content}\n`;
        });

        await jobQueue.add('generate_application', { 
            jobId, 
            folder, 
            hint, 
            markdown: combinedMarkdown, 
            type: 'refine_with_ai' 
        }, { jobId });
        
        return res.status(202).json({ jobId });
    }

    // Manuel refinement (eksisterende logik)
    const folderPath = path.join(rootDir, 'output', folder);
    const files = fs.readdirSync(folderPath);
    const typeLabel = type === 'ansøgning' ? 'Ansøgning' : type === 'cv' ? 'CV' : type === 'match' ? 'Match_Analyse' : 'ICAN+_Pitch';
    const existingFile = files.find(f => f.startsWith(typeLabel) && f.endsWith('.md'));
    const baseName = existingFile ? existingFile.replace('.md', '') : type;
    const mdPath = path.join(folderPath, `${baseName}.md`);
    const htmlPath = path.join(folderPath, `${baseName}.html`);
    const pdfPath = path.join(folderPath, `${baseName}.pdf`);
    
    fs.writeFileSync(mdPath, markdown);

    const bruttoPath = path.join(rootDir, 'data', 'brutto_cv.md');
    const bruttoCv = fs.existsSync(bruttoPath) ? fs.readFileSync(bruttoPath, 'utf8') : "";
    const candidate = parseCandidateInfo(bruttoCv);

    // Metadata parsing (v3.6.5)
    const extractSection = (text, tag) => {
        const cleanTag = tag.replace(/^-+|-+$/g, '').toUpperCase();
        const regex = new RegExp(`-+\\s*${cleanTag}\\s*-+[\\s\\S]*?\\n?([\\s\\S]*?)(?=\\n\\s*-+[A-ZÆØÅ_]+\\s*-+|$|\\n=)`, 'i');
        const match = text.match(regex);
        return match ? match[1].trim() : "";
    };

    const metadataRaw = extractSection(markdown, 'LAYOUT_METADATA');
    const layoutMeta = {
        signOff: metadataRaw.match(/^Sign-off:\s*(.*)$/im)?.[1]?.trim(),
        location: metadataRaw.match(/^Location:\s*(.*)$/im)?.[1]?.trim(),
        datePrefix: metadataRaw.match(/^Date-Prefix:\s*(.*)$/im)?.[1]?.trim(),
        address: metadataRaw.match(/^Address:\s*(.*)$/im)?.[1]?.trim(),
        senderName: metadataRaw.match(/^Sender-Name:\s*(.*)$/im)?.[1]?.trim(),
        senderAddress: metadataRaw.match(/^Sender-Address:\s*(.*)$/im)?.[1]?.trim(),
        senderPhone: metadataRaw.match(/^Sender-Phone:\s*(.*)$/im)?.[1]?.trim(),
        senderEmail: metadataRaw.match(/^Sender-Email:\s*(.*)$/im)?.[1]?.trim()
    };

    // Detekter sprog fra det indsendte markdown
    const lang = markdown.toLowerCase().includes('dear') || markdown.toLowerCase().includes('sincerely') ? 'en' : 'da';

    const htmlBody = await mdToHtml(markdown, mdPath, `${baseName}_body.html`);
    const companyName = folder.split('_')[2] || 'firma';
    const jobTitle = folder.split('_').slice(3).join(' ') || 'stilling';
    const fullHtml = wrap(typeLabel.replace('_', ' '), htmlBody, type, { company: companyName, position: jobTitle }, candidate, lang, layoutMeta);
    
    fs.writeFileSync(htmlPath, fullHtml);
    
    // Brug utils.js version af printToPdf (håndterer selv file://)
    await printToPdf(htmlPath, pdfPath);
    
    res.json({ success: true, html: fullHtml });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

io.on('connection', (socket) => {
  socket.on('join_job', (jobId) => { socket.join(jobId); });
  socket.on('job_status_update', (data) => { io.to(data.jobId).emit('job_status_update', data); });
});

const PORT = 3002;
server.listen(PORT, '0.0.0.0', () => {
  let startVersion = "2.6.x-dev";
  if (fs.existsSync(versionFilePath)) {
      const content = fs.readFileSync(versionFilePath, 'utf8').trim();
      startVersion = content.split('\n')[0].trim();
  }
  logger.info("Server", "Systemet kører", { version: startVersion, port: PORT });
});
