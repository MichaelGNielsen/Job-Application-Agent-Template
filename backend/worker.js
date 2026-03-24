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

const { Worker } = require('bullmq');
const IORedis = require('ioredis');
const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { io } = require('socket.io-client');
const { mdToHtml, wrap, wrapAll, fetchCompanyContent, logger, printToPdf } = require('./utils');

const execPromise = promisify(exec);
const rootDir = '/app/shared';
// Indlæs .env_ai filen
dotenv.config({ path: path.join(rootDir, '.env_ai') });

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

function parseCandidateInfo(bruttoCv) {
    const info = { name: "", address: "", email: "", phone: "" };
    if (!bruttoCv) return info;

    logger.info("parseCandidateInfo", "Parser kandidat-info fra Brutto-CV");
    const cleanValue = (val) => val ? val.replace(/^[\s\*\-#]+|[\s\*\-#]+$/g, '').trim() : "";

    const getName = bruttoCv.match(/(?:\*\*|\*|#|-)?\s*(?:Navn|Name)[:\s]+(.*?)(?:\n|$)/i);
    const getAddr = bruttoCv.match(/(?:\*\*|\*|#|-)?\s*(?:Adresse|Address)[:\s]+(.*?)(?:\n|$)/i);
    const getEmail = bruttoCv.match(/(?:\*\*|\*|#|-)?\s*(?:Email|E-mail)[:\s]+(.*?)(?:\n|$)/i);
    const getPhone = bruttoCv.match(/(?:\*\*|\*|#|-)?\s*(?:Telefon|Phone|Mobil|Mobile)[:\s]+(.*?)(?:\n|$)/i);

    if (getName) info.name = cleanValue(getName[1]);
    if (getAddr) info.address = cleanValue(getAddr[1]);
    if (getEmail) info.email = cleanValue(getEmail[1]);
    if (getPhone) info.phone = cleanValue(getPhone[1]);
    
    logger.info("parseCandidateInfo", "Kandidat-data udtrukket", info);
    return info;
}

async function callLocalGemini(prompt, jobId = "default") {
    const startTime = Date.now();
    try {
        const tempFile = path.join('/tmp', `prompt_${jobId}_${Date.now()}.txt`);
        fs.writeFileSync(tempFile, prompt);
        
        logger.info("callLocalGemini", `Sender prompt til Gemini CLI (Job: ${jobId})`, { tegn: prompt.length });

        const { stdout } = await execPromise(`gemini < "${tempFile}"`);
        
        if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
        
        const duration = ((Date.now() - startTime) / 1000).toFixed(1);
        logger.info("callLocalGemini", `AI Respons modtaget på ${duration} sekunder`, { svarLængde: stdout.length });
        
        return stdout;
    } catch (error) {
        const duration = ((Date.now() - startTime) / 1000).toFixed(1);
        logger.error("callLocalGemini", `Fejl ved kald efter ${duration} sekunder`, { error: error.message });
        throw error;
    }
}

const worker = new Worker('job_queue', async (job) => {
  let { jobId, jobText, companyUrl: initialUrl, hint, type: jobType, folder: existingFolder, markdown: existingMarkdown } = job.data;
  let companyUrl = initialUrl;
  let foundCompanyAddress = "";
  
  const updateStatus = (status, data = {}) => {
    socket.emit('job_status_update', { jobId, status, ...data });
    logger.info("Worker", `Status: ${status}`, { jobId });
  };

  try {
    logger.info("Worker", "--- STARTER NYT JOB ---", { jobId, jobType });
    // Indlæs Brutto-CV og ICAN+ definition
    let bruttoCv = "";
    const bruttoPath = path.join(rootDir, 'data', 'brutto_cv.md');
    logger.assert(fs.existsSync(bruttoPath), "Worker", "Brutto-CV mangler!", { bruttoPath });
    if (fs.existsSync(bruttoPath)) bruttoCv = fs.readFileSync(bruttoPath, 'utf8');

    const candidate = parseCandidateInfo(bruttoCv);

    let icanDef = "";
    const icanDefPath = path.join(rootDir, 'resources', 'ICAN+_DEF.md');
    logger.assert(fs.existsSync(icanDefPath), "Worker", "ICAN+ definition mangler!", { icanDefPath });
    if (fs.existsSync(icanDefPath)) icanDef = fs.readFileSync(icanDefPath, 'utf8');

    let folderName, folderPath, companyName, jobTitleRaw, jobTitleSafe, companyContext = "";
    let docsPart = "";

    let lang = 'da'; // Standard ISO

    if (jobType === 'refine_with_ai') {
        updateStatus('Forfiner dokumenter med AI...');
        folderName = existingFolder;
        folderPath = path.join(rootDir, 'output', folderName);
        
        // Indlæs eksisterende data for at bevare dem i session.md
        if (fs.existsSync(path.join(folderPath, 'job.md'))) {
            jobText = fs.readFileSync(path.join(folderPath, 'job.md'), 'utf8');
        }
        
        // Prøv at finde URL og SPROG i eksisterende session.md hvis muligt
        if (fs.existsSync(path.join(folderPath, 'session.md'))) {
            const oldSession = fs.readFileSync(path.join(folderPath, 'session.md'), 'utf8');
            const urlMatch = oldSession.match(/## FIRMA URL\n(.*?)\n/);
            if (urlMatch && !companyUrl) companyUrl = urlMatch[1].trim();
            
            const langMatch = oldSession.match(/## SPROG\n(.*?)\n/);
            if (langMatch) lang = langMatch[1].trim();
            else lang = existingMarkdown.toLowerCase().includes('dear') || existingMarkdown.toLowerCase().includes('sincerely') ? 'en' : 'da';
        } else {
            lang = existingMarkdown.toLowerCase().includes('dear') || existingMarkdown.toLowerCase().includes('sincerely') ? 'en' : 'da';
        }

        companyName = folderName.split('_')[2] || 'firma';
        jobTitleSafe = folderName.split('_').slice(3).join('_') || 'stilling';
        jobTitleRaw = jobTitleSafe.replace(/_/g, ' ');
        
        const refinePrompt = `Du er en præcis redaktør. Her er de nuværende dokumenter for ansøgeren, deres oprindelige BRUTTO_CV (kilde til sandhed) og en ny instruks fra brugeren.
        
        VIGTIGT: Dokumenterne skal skrives på ${lang === 'en' ? 'ENGELSK' : 'DANSK'}.
        
        REGLER FOR OPDATERING:
        1. Opdater din logbog i ---REDAKTØRENS_LOGBOG--- på DANSK. Vær detaljeret omkring hvad du har ændret.
        2. Bevar ---LAYOUT_METADATA--- og opdater dem hvis instruksen kræver det (f.eks. nyt sprog).
        3. Lav KUN ændringer der er direkte forespurgt i instruksen.
        4. Bevar ordlyd, struktur og indhold i alle andre sektioner 100% uændret, medmindre brugeren har bedt om andet.
        5. VIGTIGT: Ansøgeren har IKKE fået jobbet endnu. Den ansøgte stilling ("${jobTitleRaw}") må ALDRIG stå som arbejdserfaring i CV'et.
        6. Brug altid BRUTTO_CV som din ultimative kilde til erfaring og personlig info.
        7. Returner ALLE sektioner med de korrekte mærkater.
        
        INSTRUKSER: "${hint}"
        
        KILDE (BRUTTO_CV):
        """${bruttoCv}"""
        
        NUVÆRENDE DOKUMENTER (SKAL OPDATERES):
        ${existingMarkdown}
        
        Returner dokumenterne med mærkater: ---REDAKTØRENS_LOGBOG---, ---LAYOUT_METADATA---, ---ANSØGNING---, ---CV---, ---ICAN--- og ---MATCH---. Sørg for at MATCH altid har linjen: [SCORE] XX% [/SCORE].`;
        
        docsPart = await callLocalGemini(refinePrompt, jobId);
    } else {
        updateStatus('Analyserer jobopslag...');
        // Kig på en bid af teksten lidt længere nede for at undgå at blive narret af kontaktinfo i toppen
        const sampleText = jobText.length > 500 ? jobText.substring(200, 1200) : jobText;
        const langPrompt = `Hvilket sprog er dette jobopslag primært skrevet på? Svar KUN med ISO-kode på to bogstaver (f.eks. 'da', 'en'): """${sampleText}"""`;
        lang = (await callLocalGemini(langPrompt, jobId)).trim().toLowerCase().substring(0, 2);
        if (!/^[a-z]{2}$/.test(lang)) lang = 'da';
        if (lang === 'dk') lang = 'da';
        logger.info("Worker", `Detekteret sprog: ${lang}`);

        // --- AUTONOM RESEARCH FASE ---
        updateStatus('Laver autonom research på firmaet...');
        
        // Find firmanavn, jobtitel og LOKATION
        const infoPrompt = `Udtræk firmanavn, jobtitel og arbejdssted (by) fra dette opslag: """${jobText.substring(0, 1500)}"""
        Svar KUN med JSON: {"company": "Navn", "title": "Job", "location": "By"}`;
        const infoRaw = await callLocalGemini(infoPrompt, jobId);
        const info = infoRaw.match(/\{[\s\S]*\}/) ? JSON.parse(infoRaw.match(/\{[\s\S]*\}/)[0]) : { company: "firma", title: "stilling", location: "" };
        companyName = info.company;
        jobTitleRaw = info.title;
        const jobLocation = info.location;

        // Hvis URL mangler, bed Gemini foreslå en adresse og URL (målrettet lokationen)
        if (!companyUrl) {
            const researchPrompt = `Du skal finde den officielle hjemmeside for virksomheden "${companyName}". 
            Find derefter den FULDE fysiske postadresse (Vejnavn, Husnummer, Postnummer og By) for deres afdeling i "${jobLocation || 'Danmark'}". 
            Hvis jobopslaget nævner et specifikt sted som "NOVI", "Forskningsparken" eller lignende, skal du finde den nøjagtige adresse på den pågældende lokation.
            VIGTIGT: Du må ALDRIG kun svare med et bynavn. Jeg skal bruge den fulde adresse til et professionelt brevhoved.
            Svar KUN med JSON: {"url": "https://...", "address": "Vejnavn Nummer, Postnr By"}`;
            
            const researchRaw = await callLocalGemini(researchPrompt, jobId);
            const research = researchRaw.match(/\{[\s\S]*\}/) ? JSON.parse(researchRaw.match(/\{[\s\S]*\}/)[0]) : { url: "", address: "" };
            if (research.url && research.url.startsWith('http')) companyUrl = research.url;
            if (research.address) {
                foundCompanyAddress = research.address;
                companyContext += `RELEVANT ADRESSE FUNDET: ${foundCompanyAddress}\n`;
                logger.info("Worker", "Firma adresse fundet", { address: foundCompanyAddress });
            }
        }

        // Scrape indhold fra hjemmesiden
        if (companyUrl && companyUrl.startsWith('http')) {
            const webContent = await fetchCompanyContent(companyUrl);
            if (webContent) companyContext += `\nBAGGRUNDSVIDEN FRA HJEMMESIDE:\n${webContent}`;
        }

        const now = new Date();
        const timestamp = now.getFullYear() + '-' + 
                          String(now.getMonth() + 1).padStart(2, '0') + '-' + 
                          String(now.getDate()).padStart(2, '0') + '-' + 
                          String(now.getHours()).padStart(2, '0') + '-' + 
                          String(now.getMinutes()).padStart(2, '0') + '-' + 
                          String(now.getSeconds()).padStart(2, '0');

        const companySafe = companyName.toLowerCase().split('.')[0].replace(/[^a-z0-9]/g, '');
        jobTitleSafe = jobTitleRaw.substring(0, 30).replace(/[^a-zæøå0-9]/gi, '_');

        folderName = `${timestamp}_${companySafe}_${jobTitleSafe}`;
        const outputDir = path.join(rootDir, 'output');
        if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

        folderPath = path.join(outputDir, folderName);
        if (!fs.existsSync(folderPath)) fs.mkdirSync(folderPath, { recursive: true });

        fs.writeFileSync(path.join(folderPath, 'job.md'), jobText);
        if (companyContext) fs.writeFileSync(path.join(folderPath, 'research.md'), companyContext);

        updateStatus('Genererer udkast med firma-kontekst...');
        const aiInstructionsPath = path.join(rootDir, 'templates', 'ai_instructions.md');
        const masterLayoutPath = path.join(rootDir, 'templates', 'master_layout.md');
        const cvLayoutPath = path.join(rootDir, 'templates', 'cv_layout.md');
        
        let aiInstructions = fs.readFileSync(aiInstructionsPath, 'utf8');
        let masterLayout = fs.readFileSync(masterLayoutPath, 'utf8');
        let cvLayout = fs.readFileSync(cvLayoutPath, 'utf8');
        
        const generatePrompt = `
${aiInstructions}

### MÅLSPROG FOR ANSØGNING OG CV
Det detekterede sprog for jobopslaget er: **${lang === 'en' ? 'ENGELSK (English)' : 'DANSK (Danish)'}**.
Du SKAL skrive ---ANSØGNING--- og ---CV--- på dette sprog.
Du SKAL skrive ---REDAKTØRENS_LOGBOG---, ---ICAN--- og ---MATCH--- på DANSK.

### DIN STRUKTUR-SKABELON (MASTER LAYOUT)
Du SKAL udfylde denne skabelon med dit genererede indhold. Bevar alle mærkater (tags) præcis som de står:

${masterLayout}

### CV STRUKTUR (CV_LAYOUT)
Når du genererer sektionen ---CV---, SKAL du følge denne struktur:

${cvLayout}

### DATA TIL UDFYLDELSE:
- BRUTTO_CV: """${bruttoCv}"""
- JOB_TEXT: """${jobText}"""
- COMPANY_CONTEXT: """${companyContext || "Ingen yderligere firma-info fundet."}"""
- HINT: """${hint || "Ingen specielle hints."}"""
- MIT_NAVN: "${process.env.MIT_NAVN || candidate.name || "Michael Guldbæk Nielsen"}"
- ICAN_DEF: """${icanDef}"""
`;

        docsPart = await callLocalGemini(generatePrompt, jobId);
    }
    
    logger.info("Worker", "Rå AI-output modtaget", { length: docsPart.length });
    
    const extractSection = (text, tag) => {
        const cleanTag = tag.replace(/^-+|-+$/g, '').toUpperCase();
        const regex = new RegExp(`-+\\s*${cleanTag}\\s*-+[\\s\\S]*?\\n?([\\s\\S]*?)(?=\\n\\s*-+[A-ZÆØÅ_]+\\s*-+|$|\\n=)`, 'i');
        const match = text.match(regex);
        if (!match) {
            const fallbackRegex = new RegExp(`(?:^|\\n)${cleanTag}:?\\s*\\n?([\\s\\S]*?)(?=\\n[A-ZÆØÅ_]+:|$)`, 'i');
            const fallbackMatch = text.match(fallbackRegex);
            return fallbackMatch ? fallbackMatch[1].trim() : "";
        }
        return match[1].trim();
    };

    let aiNotes = extractSection(docsPart, 'REDAKTØRENS_LOGBOG') || "AI'en har optimeret dokumenterne baseret på din profil og jobopslaget.";

    const metadataRaw = extractSection(docsPart, 'LAYOUT_METADATA');
    
    const layoutMeta = {
        signOff: metadataRaw.match(/^Sign-off:\s*(.*?)(?=\s*(?:Location:|Date-Prefix:|Address:|Folder-Name:)|$)/im)?.[1]?.trim() || (lang === 'en' ? "Sincerely," : "Med venlig hilsen,"),
        location: metadataRaw.match(/^Location:\s*(.*?)(?=\s*(?:Sign-off:|Date-Prefix:|Address:|Folder-Name:)|$)/im)?.[1]?.trim() || "",
        datePrefix: metadataRaw.match(/^Date-Prefix:\s*(.*?)(?=\s*(?:Sign-off:|Location:|Address:|Folder-Name:)|$)/im)?.[1]?.trim() || (lang === 'da' ? "den" : ""),
        address: metadataRaw.match(/^Address:\s*(.*?)(?=\s*(?:Sign-off:|Location:|Date-Prefix:|Folder-Name:)|$)/im)?.[1]?.trim() || "",
        folderName: metadataRaw.match(/^Folder-Name:\s*(.*?)(?=\s*(?:Sign-off:|Location:|Date-Prefix:|Address:)|$)/im)?.[1]?.trim() || ""
    };

    // Tilføj research-info til AI noter hvis det blev fundet (v3.1.2)
    if (companyUrl || foundCompanyAddress) {
        let researchInfo = "\n\n--- RESEARCH RESULTAT (FIRMA) ---\n";
        if (companyUrl && companyUrl.startsWith('http')) researchInfo += `Hjemmeside: ${companyUrl}\n`;
        if (foundCompanyAddress) researchInfo += `Fundet firma adresse: ${foundCompanyAddress}\n`;
        aiNotes += researchInfo;
    }

    // OPRET SESSION.MD FIL (v3.1.1)
    try {
        const sessionContent = `
# SESSION DATA

## FIRMA URL
${companyUrl || 'Ingen URL angivet'}

## PERSONLIGT HINT
${hint || 'Intet hint angivet'}

---

## AI RÆSONNEMENT (REDAKTØRENS NOTER)
${aiNotes}

---

## JOBBESKRIVELSE
${jobText}
`;
        fs.writeFileSync(path.join(folderPath, 'session.md'), sessionContent.trim());
        logger.info("Worker", "session.md oprettet", { folderName });
    } catch (e) {
        logger.error("Worker", "Kunne ikke oprette session.md", { error: e.message });
    }

    let ansMd = "", cvMd = "", icanMd = "", matchMd = "";
    if (typeof extractSection === 'function' && docsPart) {
        ansMd = extractSection(docsPart, '---ANSØGNING---');
        cvMd = extractSection(docsPart, '---CV---');
        icanMd = extractSection(docsPart, '---ICAN---');
        matchMd = extractSection(docsPart, '---MATCH---');
    }

    // Omdøb mappen hvis AI'en foreslog et bedre navn
    if (layoutMeta.folderName && jobType !== 'refine_with_ai') {
        const parts = folderName.split('_');
        const timestampPart = parts[0];
        const newFolderName = `${timestampPart}_${layoutMeta.folderName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}`;
        const newFolderPath = path.join(rootDir, 'output', newFolderName);
        
        if (newFolderName !== folderName) {
            try {
                if (!fs.existsSync(newFolderPath)) {
                    fs.renameSync(folderPath, newFolderPath);
                    logger.info("Worker", "Mappe omdøbt", { old: folderName, new: newFolderName });
                    folderName = newFolderName;
                    folderPath = newFolderPath;
                }
            } catch (e) { 
                logger.error("Worker", "Omdøbning fejlede", { error: e.message }); 
            }
        }
    }

    const results = { markdown: {}, html: {}, links: {}, aiNotes: aiNotes };
    const fileBaseId = folderName.includes('_') ? folderName.split('_').slice(1).join('_') : folderName;
    const candidateName = candidate.name.replace(/\s+/g, '_') || 'Bruger';

    const sections = [
        { id: 'ansøgning', md: ansMd, title: 'Ansøgning' },
        { id: 'cv', md: cvMd, title: 'CV' },
        { id: 'match', md: matchMd, title: 'Match_Analyse' },
        { id: 'ican', md: icanMd, title: 'ICAN+_Pitch' }
    ];

    for (const s of sections) {
        if (!s.md) continue;
        const fileName = `${s.title}_${candidateName}_${fileBaseId}`;
        const mdPath = path.join(folderPath, `${fileName}.md`);
        const htmlPath = path.join(folderPath, `${fileName}.html`);
        const pdfPath = path.join(folderPath, `${fileName}.pdf`);
        fs.writeFileSync(mdPath, s.md);
        const htmlBody = await mdToHtml(s.md, mdPath, `${fileName}_body.html`);
        const fullHtml = wrap(s.title.replace(/_/g, ' '), htmlBody, s.id, { company: companyName, position: jobTitleRaw }, candidate, lang, layoutMeta);
        fs.writeFileSync(htmlPath, fullHtml);
        updateStatus(`Genererer PDF for ${s.title.replace(/_/g, ' ')}...`);
        await printToPdf(htmlPath, pdfPath);
        results.markdown[s.id] = s.md;
        results.html[s.id] = fullHtml;
        results.links[s.id] = {
            md: `/api/applications/${folderName}/${fileName}.md`,
            html: `/api/applications/${folderName}/${fileName}.html`,
            pdf: `/api/applications/${folderName}/${fileName}.pdf`
        };
    }

    try {
        const newDir = path.join(rootDir, 'output', 'new');
        if (!fs.existsSync(newDir)) fs.mkdirSync(newDir, { recursive: true });
        for (const s of sections) {
            if (!s.md) continue;
            const fileName = `${s.title.replace(/\s+/g, '_')}_${candidateName}_${fileBaseId}.pdf`;
            const srcPath = path.join(folderPath, fileName);
            if (fs.existsSync(srcPath)) fs.copyFileSync(srcPath, path.join(newDir, fileName));
        }
    } catch (e) { 
        logger.error("Worker", "Kunne ikke kopiere til new/ mappen", { error: e.message }); 
    }

    updateStatus('Færdig!', { folder: folderName, lang: jobType === 'refine_with_ai' ? 'refine' : 'initial', ...results });

  } catch (error) {
    logger.error("Worker", "KRITISK FEJL på job", { jobId }, error);
    updateStatus('Fejl', { error: error.message });
  }
}, { 
  connection: redisConnection,
  lockDuration: 300000 // 5 minutter
});
