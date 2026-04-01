/**
 * Job Application Agent MGN - Worker (v4.8.0)
 * Håndterer AI-behandling med JSON-arkitektur og Atomic Content Management.
 * Nu fuldt modulær med Dependency Injection af logger.
 */
const { Worker } = require('bullmq');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
const { io } = require('socket.io-client');

// Import services
const logger = require('./logger');
const { callLocalGemini } = require('./ai_service');
const { mdToHtml, printToPdf } = require('./pdf_service');
const { parseCandidateInfo, extractSection, wrap } = require('./document_service');
const { fetchCompanyContent } = require('./company_service');

const rootDir = '/app/shared';
dotenv.config({ path: path.join(rootDir, '.env') });

if (process.env.GEMINI_API_KEY) {
    process.env.GOOGLE_API_KEY = process.env.GEMINI_API_KEY;
}

const redisConnection = { host: 'jaa-redis', port: 6379 };
const socket = io('http://localhost:3002');

const worker = new Worker('generate_application', async (job) => {
  const { jobId, jobText: jobTextRaw, companyUrl: companyUrlRaw, hint, existingMarkdown, folder: existingFolder, type: jobType } = job.data;
  logger.info("Worker", "--- STARTER NYT JOB ---", { jobId, jobType });
  
  const updateStatus = (status, data = {}) => {
    logger.info("Worker", `Status: ${status}`, { jobId });
    socket.emit('job_status_update', { jobId, status, ...data });
  };

  try {
    let jobText = jobTextRaw || "";
    let companyUrl = companyUrlRaw || "";
    let lang = 'da';
    let companyName = "Firma";
    let jobTitleRaw = "Stilling";
    let foundCompanyAddress = "";
    let companyContext = "";
    let docsPart = "";
    let folderName = "";
    let folderPath = "";

    const bruttoPath = path.join(rootDir, 'data', 'brutto_cv.md');
    const icanPath = path.join(rootDir, 'resources', 'ICAN+_DEF.md');
    const bruttoCv = fs.existsSync(bruttoPath) ? fs.readFileSync(bruttoPath, 'utf8') : "";
    const icanDef = fs.existsSync(icanPath) ? fs.readFileSync(icanPath, 'utf8') : "";
    const candidate = parseCandidateInfo(bruttoCv, logger);

    const aiInstructionsPath = path.join(rootDir, 'templates', 'ai_instructions.md');
    const cvLayoutPath = path.join(rootDir, 'templates', 'cv_layout.md');
    const aiInstructions = fs.readFileSync(aiInstructionsPath, 'utf8');
    const cvLayout = fs.readFileSync(cvLayoutPath, 'utf8');

    if (jobType === 'refine_with_ai') {
        updateStatus('Forfiner dokumenter med AI (JSON mode)...');
        folderName = existingFolder;
        folderPath = path.join(rootDir, 'output', folderName);
        if (fs.existsSync(path.join(folderPath, 'job.md'))) jobText = fs.readFileSync(path.join(folderPath, 'job.md'), 'utf8');
        
        lang = existingMarkdown.toLowerCase().includes('dear') || existingMarkdown.toLowerCase().includes('sincerely') ? 'en' : 'da';
        companyName = folderName.split('_')[2] || 'firma';
        jobTitleRaw = (folderName.split('_').slice(3).join(' ') || 'stilling').replace(/_/g, ' ');

        const refinePrompt = `Du er en præcis redaktør. Opdater ansøgningsmaterialet.
        
        VIGTIGT: Svar KUN med et validt JSON-objekt. Returner det FULDE indhold for hver sektion.
        
        JSON FORMAT:
        {
          "logbog": "Dansk beskrivelse",
          "metadata": "Layout metadata streng",
          "ansøgning": "Fuld tekst",
          "cv": "Fuld tekst",
          "ican": "Fuld tekst",
          "match": "Fuld tekst med [SCORE]"
        }
        
        SPROG: ${lang === 'en' ? 'ENGELSK' : 'DANSK'}.
        INSTRUKS: "${hint}"
        KILDE (BRUTTO_CV): """${bruttoCv}"""
        CV STRUKTUR SKAL FØLGE: """${cvLayout}"""
        
        NUVÆRENDE DOKUMENTER (SKAL OPDATERES):
        ${existingMarkdown}`;
        
        docsPart = await callLocalGemini(refinePrompt, jobId, logger);
    } else {
        updateStatus('Analyserer jobopslag...');
        const sampleText = jobText.length > 500 ? jobText.substring(200, 1200) : jobText;
        const langPrompt = `Sprog? Svar 'da' eller 'en': """${sampleText}"""`;
        lang = (await callLocalGemini(langPrompt, jobId, logger)).trim().toLowerCase().substring(0, 2);
        if (lang !== 'en') lang = 'da';

        updateStatus('Research & Analyse...');
        const infoPrompt = `Udtræk {"company": "Navn", "title": "Job"} fra: """${jobText.substring(0, 1500)}"""`;
        const infoRaw = await callLocalGemini(infoPrompt, jobId, logger);
        const info = JSON.parse(infoRaw.match(/\{[\s\S]*\}/)[0]);
        companyName = info.company; jobTitleRaw = info.title;

        if (companyUrl && companyUrl.startsWith('http')) companyContext = await fetchCompanyContent(companyUrl, logger);

        const now = new Date();
        const timestamp = now.toISOString().replace(/T/, '-').replace(/\..+/, '').replace(/:/g, '-');
        folderName = `${timestamp}_${companyName.toLowerCase().replace(/[^a-z0-9]/g, '')}_${jobTitleRaw.substring(0, 20).replace(/[^a-z0-9]/gi, '_')}`;
        folderPath = path.join(rootDir, 'output', folderName);
        fs.mkdirSync(folderPath, { recursive: true });
        fs.writeFileSync(path.join(folderPath, 'job.md'), jobText);

        updateStatus('Genererer fuld pakke...');
        const generatePrompt = `
${aiInstructions}

VIGTIGT: Svar KUN med JSON objekt.

### STRUKTUR REGLER:
- CV SKAL følge denne struktur: """${cvLayout}"""
- Dokumenter skal pakkes i dette JSON format:
{
  "logbog": "Beskrivelse",
  "metadata": "Layout metadata",
  "ansøgning": "Fuld tekst",
  "cv": "Fuld tekst",
  "ican": "Fuld tekst",
  "match": "Fuld tekst med [SCORE]"
}

DATA:
- BRUTTO_CV: """${bruttoCv}"""
- JOB: """${jobText}"""
- FIRMA_INFO: """${companyContext}"""
- MIT_NAVN: "${process.env.MIT_NAVN || candidate.name}"
`;
        docsPart = await callLocalGemini(generatePrompt, jobId, logger);
    }
    
    // --- PARSING & CLEANUP ---
    let aiData;
    try {
        const jsonMatch = docsPart.match(/\{[\s\S]*\}/);
        aiData = JSON.parse(jsonMatch[0]);
    } catch (e) {
        logger.error("Worker", "Fallback til tags", { error: e.message });
        aiData = {
            logbog: extractSection(docsPart, 'REDAKTØRENS_LOGBOG'),
            metadata: extractSection(docsPart, 'LAYOUT_METADATA'),
            ansøgning: extractSection(docsPart, 'ANSØGNING'),
            cv: extractSection(docsPart, 'CV'),
            ican: extractSection(docsPart, 'ICAN'),
            match: extractSection(docsPart, 'MATCH')
        };
    }

    const cleanBody = (text) => text ? text.replace(/<!--[\s\S]*?-->/g, '').trim() : "";

    const results = { 
        bodies: {
            ansøgning: cleanBody(aiData.ansøgning),
            cv: cleanBody(aiData.cv),
            match: cleanBody(aiData.match),
            ican: cleanBody(aiData.ican)
        },
        metadata: (aiData.metadata || "").trim(),
        html: {}, links: {}, aiNotes: aiData.logbog || "" 
    };

    const layoutMeta = {
        signOff: results.metadata.match(/^Sign-off:\s*(.*)$/im)?.[1]?.trim() || (lang === 'en' ? "Sincerely," : "Med venlig hilsen,"),
        senderName: candidate.name, senderAddress: candidate.address, senderPhone: candidate.phone, senderEmail: candidate.email
    };

    const candidateName = candidate.name.replace(/\s+/g, '_');
    const fileBaseId = folderName.includes('_') ? folderName.split('_').slice(1).join('_') : folderName;
    const sections = [
        { id: 'ansøgning', title: 'Ansøgning' },
        { id: 'cv', title: 'CV' },
        { id: 'match', title: 'Match_Analyse' },
        { id: 'ican', title: 'ICAN+_Pitch' }
    ];

    for (const s of sections) {
        const body = results.bodies[s.id];
        if (!body || body.length < 10) continue;
        
        const fileName = `${s.title}_${candidateName}_${fileBaseId}`;
        const mdPath = path.join(folderPath, `${fileName}.md`);
        const htmlPath = path.join(folderPath, `${fileName}.html`);
        
        // Gem MASTER MD med YAML Front Matter (v4.7.0)
        const cleanMeta = results.metadata.replace(/^---+|---$/g, '').trim();
        const fullMd = `---\n${cleanMeta}\n---\n${body}`;
        fs.writeFileSync(mdPath, fullMd);
        
        const htmlBody = await mdToHtml(body, mdPath, `${fileName}_body.html`, logger);
        const fullHtml = wrap(s.title.replace(/_/g, ' '), htmlBody, s.id, { company: companyName, position: jobTitleRaw }, candidate, lang, layoutMeta, logger);
        fs.writeFileSync(htmlPath, fullHtml);
        await printToPdf(htmlPath, path.join(folderPath, `${fileName}.pdf`), logger);
        
        results.html[s.id] = fullHtml;
        results.links[s.id] = {
            md: `/api/applications/${folderName}/${fileName}.md`,
            html: `/api/applications/${folderName}/${fileName}.html`,
            pdf: `/api/applications/${folderName}/${fileName}.pdf`
        };
    }

    updateStatus('Færdig!', { folder: folderName, ...results });
  } catch (error) {
    logger.error("Worker", "FEJL", { error: error.message });
    updateStatus('Fejl', { error: error.message });
  }
}, { connection: redisConnection });
