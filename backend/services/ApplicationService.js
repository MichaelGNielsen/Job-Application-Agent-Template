/**
 * ApplicationService.js
 * Hovedansvar: Orkestrering af ansøgningsgenerering (Initial & Refine).
 * Overholder Modularitet (SRP) og Dependency Injection (DI).
 */

class ApplicationService {
    constructor(deps) {
        this.logger = deps.logger;
        this.fs = deps.fs;
        this.path = deps.path;
        this.socket = deps.socket;
        this.rootDir = deps.rootDir;
        this.aiManager = deps.aiManager; // Bruger central AI Manager
        
        this.utils = {
            mdToHtml: deps.mdToHtml,
            wrap: deps.wrap,
            fetchCompanyContent: deps.fetchCompanyContent,
            printToPdf: deps.printToPdf,
            parseCandidateInfo: deps.parseCandidateInfo,
            extractSection: deps.extractSection,
            saveUrlToPdf: deps.saveUrlToPdf
        };
    }

    _updateStatus(jobId, status, data = {}) {
        if (this.socket) this.socket.emit('job_status_update', { jobId, status, ...data });
        this.logger.info("ApplicationService", `Status: ${status}`, { jobId });
    }

    async processJob(jobData) {
        let { jobId, jobText, companyUrl, hint, type: jobType, folder: existingFolder, markdown: existingMarkdown, aiProvider } = jobData;
        let foundCompanyAddress = "";
        
        try {
            this.logger.info("ApplicationService", "--- STARTER NYT JOB ---", { jobId, jobType, aiProvider });
            const bruttoPath = this.path.join(this.rootDir, 'data', 'brutto_cv.md');
            if (!this.fs.existsSync(bruttoPath)) throw new Error("Brutto-CV mangler!");
            const bruttoCv = this.fs.readFileSync(bruttoPath, 'utf8');
            const candidate = this.utils.parseCandidateInfo(bruttoCv);

            const icanDefPath = this.path.join(this.rootDir, 'resources', 'ICAN+_DEF.md');
            const icanDef = this.fs.existsSync(icanDefPath) ? this.fs.readFileSync(icanDefPath, 'utf8') : "";

            let folderName, folderPath, companyName, jobTitleRaw, jobTitleSafe, docsPart, lang = 'da';
            let layoutMeta = {};
            let aiNotes = "AI'en har optimeret dokumenterne.";

            if (jobType === 'refine_with_ai') {
                const result = await this._handleRefineFlow({ jobId, jobData, bruttoCv, existingFolder, existingMarkdown, hint, aiProvider });
                folderName = result.folderName; folderPath = result.folderPath; companyName = result.companyName;
                jobTitleRaw = result.jobTitleRaw; jobTitleSafe = result.jobTitleSafe; docsPart = result.docsPart; lang = result.lang;
                layoutMeta = result.layoutMeta || {};
            } else {
                const result = await this._handleInitialFlow({ jobId, jobText, companyUrl, hint, bruttoCv, icanDef, candidate, aiProvider });
                folderName = result.folderName; folderPath = result.folderPath; companyName = result.companyName;
                jobTitleRaw = result.jobTitleRaw; jobTitleSafe = result.jobTitleSafe; docsPart = result.docsPart; lang = result.lang;
                let foundCompanyAddress = result.foundCompanyAddress; companyUrl = result.companyUrl;
                
                // Ekstraher layout metadata ved initial flow (da AI'en genererer det her)
                const metadataRaw = this.utils.extractSection(docsPart, '---LAYOUT_METADATA---') ||
                                   this.utils.extractSection(docsPart, 'LAYOUT_METADATA:');
                layoutMeta = this._parseMetadata(metadataRaw || "", lang);
                
                aiNotes = this.utils.extractSection(docsPart, '---REDAKTØRENS_LOGBOG---') || 
                          this.utils.extractSection(docsPart, 'REDAKTØRENS_LOGBOG:') ||
                          "AI'en har oprettet dokumenterne.";

                if (companyUrl || foundCompanyAddress) {
                    aiNotes += `\n\n--- RESEARCH RESULTAT (FIRMA) ---\n`;
                    if (companyUrl) aiNotes += `Hjemmeside: ${companyUrl}\n`;
                    if (foundCompanyAddress) aiNotes += `Fundet firma adresse: ${foundCompanyAddress}\n`;
                }

                this._saveSessionData(folderPath, companyUrl, hint, aiNotes, jobText);
            }

            let sections = [];
            if (jobType === 'refine_with_ai' && jobData.docType !== 'all') {
                // Ved et enkelt dokument er der ingen tags - vi bruger den returnerede tekst direkte
                const title = jobData.docType === 'ansøgning' ? 'Ansøgning' : jobData.docType === 'cv' ? 'CV' : jobData.docType === 'match' ? 'Match_Analyse' : 'ICAN+_Pitch';
                sections = [{ id: jobData.docType, title: title, md: docsPart }];
            } else {
                sections = this._extractSections(docsPart);
            }
            
            if (layoutMeta.folderName && jobType !== 'refine_with_ai') {
                const renamed = this._renameFolder(folderName, folderPath, layoutMeta.folderName);
                folderName = renamed.name; folderPath = renamed.path;
            }

            const results = await this._generateOutputFiles({ folderName, folderPath, sections, layoutMeta, companyName, jobTitleRaw, candidate, lang, jobId });
            this._updateStatus(jobId, 'Færdig!', { folder: folderName, lang: jobType === 'refine_with_ai' ? 'refine' : 'initial', ...results, aiNotes });
            return { status: 'success', folderName };
        } catch (error) {
            this.logger.error("ApplicationService", "KRITISK FEJL", { jobId }, error);
            this._updateStatus(jobId, 'Fejl', { error: error.message });
            throw error;
        }
    }

    async _handleRefineFlow({ jobId, jobData, bruttoCv, existingFolder, existingMarkdown, hint, aiProvider }) {
        const docType = jobData.docType || "alle sektioner";
        const safeMarkdown = existingMarkdown || "";
        this._updateStatus(jobId, `Forfiner ${docType} med AI...`);
        const folderName = existingFolder || "";
        const folderPath = this.path.join(this.rootDir, 'output', folderName);
        let lang = 'da';

        // Genskab sprog og kontekst
        let jobText = "";
        let companyContext = "";
        let jobTitleRaw = "";
        let companyName = "";
        let layoutMeta = {};

        const jobDataPath = this.path.join(folderPath, 'job_data.json');
        if (folderName && this.fs.existsSync(jobDataPath)) {
            const savedData = JSON.parse(this.fs.readFileSync(jobDataPath, 'utf8'));
            lang = savedData.lang || 'da';
            jobTitleRaw = savedData.jobTitleRaw || "";
            companyName = savedData.companyName || "";
            layoutMeta = savedData.layoutMeta || {};
            
            const jobMdPath = this.path.join(folderPath, 'job.md');
            if (this.fs.existsSync(jobMdPath)) jobText = this.fs.readFileSync(jobMdPath, 'utf8');
            
            const researchMdPath = this.path.join(folderPath, 'research.md');
            if (this.fs.existsSync(researchMdPath)) companyContext = this.fs.readFileSync(researchMdPath, 'utf8');
        } else {
            // Fallback til den gamle logik, hvis job_data.json mangler (bagudkompatibilitet)
            lang = safeMarkdown.toLowerCase().includes('dear') || safeMarkdown.toLowerCase().includes('sincerely') ? 'en' : 'da';
            const folderParts = folderName.split('_');
            companyName = folderParts[2] || 'firma';
            const jobTitleSafe = folderParts.slice(3).join('_') || 'stilling';
            jobTitleRaw = jobTitleSafe.replace(/_/g, ' ');
        }

        const jobTitleSafe = jobTitleRaw.substring(0, 30).replace(/[^a-z0-9]/gi, '_');
        const aiInstructions = this.fs.readFileSync(this.path.join(this.rootDir, 'templates', 'ai_instructions.md'), 'utf8');

        const strictFormatInstruction = "\n\nVIGTIGT: Start dit svar DIREKTE med teksten/mærkaterne. Du må IKKE skrive indledende tekst eller forklaringer. Du må IKKE inkludere LAYOUT_METADATA.";

        const targetInstruction = docType !== 'all' ? `Du skal KUN forfine sektionen for ${docType.toUpperCase()}. Returner KUN den rene markdown brødtekst for denne sektion, UDEN sektions-mærkater (f.eks. ingen ---CV---).` : "Opdater alle sektioner efter behov. Start med ---REDAKTØRENS_LOGBOG--- og adskil de andre sektioner med korrekte mærkater (f.eks. ---CV---).";

        const refinePrompt = `### DIN OPGAVE: FORFIN DOKUMENT
Du er en præcis redaktør. Du skal forfine et specifikt dokument for en kandidat, mens du STRENGT overholder de oprindelige regler, sprog og kontekst.

### KONTEKST DATA
SPROG: ${lang === 'en' ? 'ENGELSK' : 'DANSK'} (Det er KUN tilladt at skrive på dette sprog i selve teksten)
FIRMA INFO: ${companyContext}

### REFERENCE MATERIALE (FOR KONTEKST)
BRUTTO_CV:
"""
${bruttoCv}
"""

JOB_OPSLAG:
"""
${jobText}
"""

GENERELLE REGLER (AI_INSTRUCTIONS):
"""
${aiInstructions}
"""

### DIT FOKUS (NUVÆRENDE DOKUMENT):
Dette er det dokument, du skal forfine baseret på brugerens hint.
"""
${safeMarkdown}
"""

BRUGERENS HINT TIL FORFINELSE:
"${hint}"

${targetInstruction}
${strictFormatInstruction}`;
        
        let docsPart = await this.aiManager.call(refinePrompt, jobId, aiProvider) || "";

        // Fjern eventuelle mærkater (inklusiv uønsket metadata), hvis AI'en alligevel har skrevet dem ved en fejl på et enkelt dokument
        if (docType !== 'all') {
            docsPart = docsPart.replace(/-{3,}\s*LAYOUT_METADATA\s*-*[\s\S]*?(?=-{3,}\s*[A-ZÆØÅ_]+\s*-*|$)/gi, '');
            docsPart = docsPart.replace(/-{3,}\s*[A-ZÆØÅ_]+\s*-*/gi, '');
            docsPart = docsPart.trim();
        }

        // Gem den rå AI-respons til debugging
        if (folderName) {
            this.fs.writeFileSync(this.path.join(folderPath, 'ai_response_raw.md'), docsPart);
        }

        return { folderName, folderPath, companyName, jobTitleRaw, jobTitleSafe, docsPart, lang, layoutMeta };
    }

    async _handleInitialFlow({ jobId, jobText, companyUrl, hint, bruttoCv, icanDef, candidate, aiProvider }) {
        this._updateStatus(jobId, 'Analyserer jobopslag...');
        const langPrompt = `Hvilket sprog er dette jobopslag? Svar KUN ISO-kode (da/en): """${jobText}"""`;
        let lang = (await this.aiManager.call(langPrompt, jobId, aiProvider)).trim().toLowerCase().substring(0, 2);
        if (lang !== 'da' && lang !== 'en') lang = 'da';

        this._updateStatus(jobId, 'Laver autonom research på firmaet...');
        const infoPrompt = `Du er en data-ekstraktor. Udtræk firmanavn, jobtitel, by og eventuel web-adresse (URL) fra dette opslag. Hvis informationen mangler, lad feltet være tomt.\nOpslag: """${jobText}"""\n\nDu SKAL svare i dette JSON format (ingen forklaring, ingen tekst udenom):\n{"company": "Navn", "title": "Job", "location": "By", "url": "..."}`;
        const info = await this.aiManager.call(infoPrompt, jobId, aiProvider, true);
        
        let foundCompanyAddress = "";
        let companyContext = "";
        
        // Brug URL fra opslaget hvis vi ikke allerede har fået en, og opslaget indeholdt en
        if (!companyUrl && info.url && info.url.startsWith('http')) {
            companyUrl = info.url;
        }

        // Kør kun Google søgning (resPrompt) hvis vi faktisk kender firmanavnet, men mangler en URL/Adresse
        if (!companyUrl && info.company) {
            const resPrompt = `Find officiel URL og adresse for "${info.company}" i "${info.location || 'Danmark'}".\n\nDu SKAL svare i dette JSON format (ingen forklaring, ingen tekst udenom):\n{"url": "...", "address": "..."}`;
            try {
                const res = await this.aiManager.call(resPrompt, jobId, aiProvider, true);
                companyUrl = res.url; foundCompanyAddress = res.address;
            } catch (e) {
                this.logger.warn("ApplicationService", "AI kunne ikke finde firma-data via søgning, bruger default.");
                companyUrl = "N/A";
            }
            if (foundCompanyAddress) companyContext += `RELEVANT ADRESSE: ${foundCompanyAddress}\n`;
        }

        if (companyUrl && companyUrl.startsWith('http')) {
            const webContent = await this.utils.fetchCompanyContent(companyUrl);
            if (webContent) companyContext += `\nBAGGRUNDSVIDEN:\n${webContent}`;
        }

        const now = new Date();
        const timestamp = now.toISOString().replace(/T/, '-').replace(/\..+/, '').replace(/:/g, '-');
        const companySafe = info.company.toLowerCase().replace(/[^a-z0-9]/g, '');
        const jobTitleSafe = info.title.substring(0, 30).replace(/[^a-z0-9]/gi, '_');
        const folderName = `${timestamp}_${companySafe}_${jobTitleSafe}`;
        const folderPath = this.path.join(this.rootDir, 'output', folderName);
        
        // Slet eksisterende output mappe hvis den findes (sikrer rent bord)
        if (this.fs.existsSync(folderPath)) {
            this.fs.rmSync(folderPath, { recursive: true, force: true });
        }
        this.fs.mkdirSync(folderPath, { recursive: true });
        this.fs.writeFileSync(this.path.join(folderPath, 'job.md'), jobText);
        if (companyContext) this.fs.writeFileSync(this.path.join(folderPath, 'research.md'), companyContext);

        if (companyUrl && companyUrl.startsWith('http')) {
            await this.utils.saveUrlToPdf(companyUrl, this.path.join(folderPath, 'jobopslag_original.pdf'));
        }

        const aiInstructions = this.fs.readFileSync(this.path.join(this.rootDir, 'templates', 'ai_instructions.md'), 'utf8');
        const masterLayout = this.fs.readFileSync(this.path.join(this.rootDir, 'templates', 'master_layout.md'), 'utf8');
        const cvLayout = this.fs.readFileSync(this.path.join(this.rootDir, 'templates', 'cv_layout.md'), 'utf8');

        const baseContext = `### KONTEKST DATA\nSPROG: ${lang === 'en' ? 'ENGELSK' : 'DANSK'}\nKANDIDAT NAVN: ${process.env.MIT_NAVN || candidate.name}\nFIRMA INFO: ${companyContext}\n\n### JOB_OPSLAG\n"""\n${jobText}\n"""\n\n### GENERELLE REGLER (AI_INSTRUCTIONS)\n"""\n${aiInstructions}\n"""\n`;

        // TRIN 1: Match Analyse (Hjernen) + Metadata
        this._updateStatus(jobId, 'Trin 1/4: Analyserer Match og lægger strategi...');
        const prompt1 = `${baseContext}\n### BRUTTO_CV\n"""\n${bruttoCv}\n"""\n\n### DIN OPGAVE (TRIN 1)\nDu skal analysere jobbet og lægge strategien for ansøgningen.\nStart dit svar DIREKTE med de 3 mærkater: ---REDAKTØRENS_LOGBOG---, ---LAYOUT_METADATA--- og ---MATCH---.\n1. Skriv REDAKTØRENS_LOGBOG med din overordnede salgsstrategi.\n2. Skriv LAYOUT_METADATA (baseret på MASTER_LAYOUT: ${masterLayout}).\n3. Skriv den komplette MATCH_ANALYSE baseret på Brutto-CV'et.`;
        const result1 = await this.aiManager.call(prompt1, jobId, aiProvider) || "";
        const logbog = this.utils.extractSection(result1, '---REDAKTØRENS_LOGBOG---') || this.utils.extractSection(result1, 'REDAKTØRENS_LOGBOG:');
        const metadata = this.utils.extractSection(result1, '---LAYOUT_METADATA---') || this.utils.extractSection(result1, 'LAYOUT_METADATA:');
        const matchMd = this.utils.extractSection(result1, '---MATCH---') || this.utils.extractSection(result1, 'MATCH:');

        // TRIN 2: Målrettet CV (Fundamentet)
        this._updateStatus(jobId, 'Trin 2/4: Genererer Målrettet CV...');
        const prompt2 = `${baseContext}\n### BRUTTO_CV\n"""\n${bruttoCv}\n"""\n\n### MATCH_ANALYSE (DIN STRATEGI)\n"""\n${matchMd}\n"""\n\n### CV_LAYOUT\n${cvLayout}\n\n### DIN OPGAVE (TRIN 2)\nKog Brutto-CV'et ned til et skarpt, målrettet CV. Du SKAL fremhæve præcis de erfaringer, vi identificerede i Match Analysen. Fjern irrelevant støj.\nStart dit svar DIREKTE med mærkaten ---CV--- og skriv KUN CV'et.`;
        let result2 = await this.aiManager.call(prompt2, jobId, aiProvider) || "";
        const cvMd = result2.replace(/-{3,}\s*CV\s*-*/gi, '').trim();

        // TRIN 3: Ansøgningen (Salget)
        this._updateStatus(jobId, 'Trin 3/4: Skriver Ansøgning...');
        const prompt3 = `${baseContext}\n### MATCH_ANALYSE (DIN STRATEGI)\n"""\n${matchMd}\n"""\n\n### DET MÅLRETTEDE CV\n"""\n${cvMd}\n"""\n\n### DIN OPGAVE (TRIN 3)\nSkriv selve ansøgningen med udgangspunkt i vinklen fra Match Analysen. Du må KUN henvise til erfaringer og resultater, der rent faktisk er med i 'Det Målrettede CV'. Digt ikke ny erfaring.\nStart dit svar DIREKTE med mærkaten ---ANSØGNING--- og skriv KUN ansøgningen.`;
        let result3 = await this.aiManager.call(prompt3, jobId, aiProvider) || "";
        const ansogningMd = result3.replace(/-{3,}\s*ANSØGNING\s*-*/gi, '').replace(/-{3,}\s*ANSOGNING\s*-*/gi, '').trim();

        // TRIN 4: ICAN+ Pitch
        this._updateStatus(jobId, 'Trin 4/4: Forbereder ICAN+ Pitch...');
        const prompt4 = `${baseContext}\n### DET MÅLRETTEDE CV\n"""\n${cvMd}\n"""\n\n### ANSØGNING\n"""\n${ansogningMd}\n"""\n\n### ICAN+_DEFINITION\n"""\n${icanDef}\n"""\n\n### DIN OPGAVE (TRIN 4)\nKog hele fortællingen (fra ansøgning og CV) ned til skarpe, mundtlige samtalepointer ud fra ICAN-frameworket.\nStart dit svar DIREKTE med mærkaten ---ICAN--- og skriv KUN pitchen.`;
        let result4 = await this.aiManager.call(prompt4, jobId, aiProvider) || "";
        const icanMd = result4.replace(/-{3,}\s*ICAN\s*-*/gi, '').trim();

        // Saml det hele til det eksisterende docsPart format, så resten af pipelinen forstår det
        const docsPart = `---REDAKTØRENS_LOGBOG---\n${logbog}\n\n---LAYOUT_METADATA---\n${metadata}\n\n---MATCH---\n${matchMd}\n\n---CV---\n${cvMd}\n\n---ANSØGNING---\n${ansogningMd}\n\n---ICAN---\n${icanMd}`;

        // Gem den rå AI-respons til debugging (Samlet)
        this.fs.writeFileSync(this.path.join(folderPath, 'ai_response_raw.md'), docsPart);

        return { folderName, folderPath, companyName: info.company, jobTitleRaw: info.title, jobTitleSafe, docsPart, lang, companyUrl };
    }

    _parseMetadata(raw, lang) {
        const get = (key) => raw.match(new RegExp(`^${key}:\\s*(.*?)(?=\\s*(?:Sign-off:|Location:|Date-Prefix:|Address:|Sender-Name:|Sender-Address:|Sender-Phone:|Sender-Email:|Folder-Name:)|$)`, 'im'))?.[1]?.trim() || "";
        return { signOff: get('Sign-off') || (lang === 'en' ? "Sincerely," : "Med venlig hilsen,"), location: get('Location'), datePrefix: get('Date-Prefix') || (lang === 'da' ? "den" : ""), address: get('Address'), senderName: get('Sender-Name'), senderAddress: get('Sender-Address'), senderPhone: get('Sender-Phone'), senderEmail: get('Sender-Email'), folderName: get('Folder-Name') };
    }

    _saveSessionData(folderPath, url, hint, notes, jobText) {
        const content = `# SESSION DATA\n\n## FIRMA URL\n${url || 'N/A'}\n\n## HINT\n${hint || 'N/A'}\n\n## AI NOTER\n${notes}\n\n## JOB\n${jobText}`;
        this.fs.writeFileSync(this.path.join(folderPath, 'session.md'), content);
    }

    _extractSections(docsPart) {
        const sections = [
            { id: 'ansøgning', title: 'Ansøgning', tags: ['---ANSØGNING---', '---ANSØGNING ---', 'ANSØGNING:', '### ANSØGNING', '---ANSOGNING---', '--- ANSØGNING ---'] },
            { id: 'cv', title: 'CV', tags: ['---CV---', '---CV ---', 'CV:', '### CV', '--- CV ---'] },
            { id: 'match', title: 'Match_Analyse', tags: ['---MATCH---', '---MATCH ---', 'MATCH:', '### MATCH', '--- MATCH ---'] },
            { id: 'ican', title: 'ICAN+_Pitch', tags: ['---ICAN---', '---ICAN ---', 'ICAN:', '### ICAN', '--- ICAN ---'] }
        ];

        return sections.map(s => {
            let content = "";
            for (const tag of s.tags) {
                content = this.utils.extractSection(docsPart, tag);
                if (content) break;
            }
            return { ...s, md: content };
        }).filter(s => s.md);
    }

    _renameFolder(oldName, oldPath, suggestedName) {
        const timestamp = oldName.split('_')[0];
        const newName = `${timestamp}_${suggestedName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}`;
        const newPath = this.path.join(this.rootDir, 'output', newName);
        if (newName !== oldName && !this.fs.existsSync(newPath)) {
            this.fs.renameSync(oldPath, newPath);
            return { name: newName, path: newPath };
        }
        return { name: oldName, path: oldPath };
    }

    async _generateOutputFiles({ folderName, folderPath, sections, layoutMeta, companyName, jobTitleRaw, candidate, lang, jobId }) {
        const results = { markdown: {}, html: {}, links: {} };
        const fileBaseId = folderName.split('_').slice(1).join('_');
        const candidateName = candidate.name.replace(/\s+/g, '_');
        
        // Gem job data til fremtidige refines og manuel edit
        const jobDataToSave = { layoutMeta, companyName, jobTitleRaw, lang, candidate };
        this.fs.writeFileSync(this.path.join(folderPath, 'job_data.json'), JSON.stringify(jobDataToSave, null, 2));

        for (const s of sections) {
            const fileName = `${s.title}_${candidateName}_${fileBaseId}`;
            const mdPath = this.path.join(folderPath, `${fileName}.md`);
            const htmlPath = this.path.join(folderPath, `${fileName}.html`);
            const pdfPath = this.path.join(folderPath, `${fileName}.pdf`);
            
            // Gem KUN den rene markdown (s.md) - INGEN metadata tags
            const pureMarkdown = s.md;
            this.fs.writeFileSync(mdPath, pureMarkdown);
            
            const htmlBody = await this.utils.mdToHtml(pureMarkdown, mdPath, `${fileName}_body.html`);
            const fullHtml = this.utils.wrap(s.title.replace(/_/g, ' '), htmlBody, s.id, { company: companyName, position: jobTitleRaw }, candidate, lang, layoutMeta);
            
            this.fs.writeFileSync(htmlPath, fullHtml);
            this._updateStatus(jobId, `Genererer PDF for ${s.title}...`);
            await this.utils.printToPdf(htmlPath, pdfPath);
            
            results.markdown[s.id] = pureMarkdown; 
            results.html[s.id] = fullHtml;
            results.links[s.id] = { md: `/api/applications/${folderName}/${fileName}.md`, html: `/api/applications/${folderName}/${fileName}.html`, pdf: `/api/applications/${folderName}/${fileName}.pdf` };
        }
        return results;
    }
}

module.exports = ApplicationService;
