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
        let { jobId, jobText, companyUrl, hint, type: jobType, folder: existingFolder, markdown: existingMarkdown } = jobData;
        let foundCompanyAddress = "";
        
        try {
            this.logger.info("ApplicationService", "--- STARTER NYT JOB ---", { jobId, jobType });
            const bruttoPath = this.path.join(this.rootDir, 'data', 'brutto_cv.md');
            if (!this.fs.existsSync(bruttoPath)) throw new Error("Brutto-CV mangler!");
            const bruttoCv = this.fs.readFileSync(bruttoPath, 'utf8');
            const candidate = this.utils.parseCandidateInfo(bruttoCv);

            const icanDefPath = this.path.join(this.rootDir, 'resources', 'ICAN+_DEF.md');
            const icanDef = this.fs.existsSync(icanDefPath) ? this.fs.readFileSync(icanDefPath, 'utf8') : "";

            let folderName, folderPath, companyName, jobTitleRaw, jobTitleSafe, docsPart, lang = 'da';

            if (jobType === 'refine_with_ai') {
                const result = await this._handleRefineFlow({ jobId, jobData, bruttoCv, existingFolder, existingMarkdown, hint });
                folderName = result.folderName; folderPath = result.folderPath; companyName = result.companyName;
                jobTitleRaw = result.jobTitleRaw; jobTitleSafe = result.jobTitleSafe; docsPart = result.docsPart; lang = result.lang;
            } else {
                const result = await this._handleInitialFlow({ jobId, jobText, companyUrl, hint, bruttoCv, icanDef, candidate });
                folderName = result.folderName; folderPath = result.folderPath; companyName = result.companyName;
                jobTitleRaw = result.jobTitleRaw; jobTitleSafe = result.jobTitleSafe; docsPart = result.docsPart; lang = result.lang;
                foundCompanyAddress = result.foundCompanyAddress; companyUrl = result.companyUrl;
            }

            let aiNotes = this.utils.extractSection(docsPart, 'REDAKTØRENS_LOGBOG') || "AI'en har optimeret dokumenterne.";
            const metadataRaw = this.utils.extractSection(docsPart, 'LAYOUT_METADATA');
            const layoutMeta = this._parseMetadata(metadataRaw, lang);

            if (companyUrl || foundCompanyAddress) {
                aiNotes += `\n\n--- RESEARCH RESULTAT (FIRMA) ---\n`;
                if (companyUrl) aiNotes += `Hjemmeside: ${companyUrl}\n`;
                if (foundCompanyAddress) aiNotes += `Fundet firma adresse: ${foundCompanyAddress}\n`;
            }

            this._saveSessionData(folderPath, companyUrl, hint, aiNotes, jobText);
            const sections = this._extractSections(docsPart);
            
            if (layoutMeta.folderName && jobType !== 'refine_with_ai') {
                const renamed = this._renameFolder(folderName, folderPath, layoutMeta.folderName);
                folderName = renamed.name; folderPath = renamed.path;
            }

            const results = await this._generateOutputFiles({ folderName, folderPath, sections, metadataRaw, layoutMeta, companyName, jobTitleRaw, candidate, lang, jobId });
            this._updateStatus(jobId, 'Færdig!', { folder: folderName, lang: jobType === 'refine_with_ai' ? 'refine' : 'initial', ...results, aiNotes });
            return { status: 'success', folderName };
        } catch (error) {
            this.logger.error("ApplicationService", "KRITISK FEJL", { jobId }, error);
            this._updateStatus(jobId, 'Fejl', { error: error.message });
            throw error;
        }
    }

    async _handleRefineFlow({ jobId, jobData, bruttoCv, existingFolder, existingMarkdown, hint }) {
        const docType = jobData.type || "alle sektioner";
        this._updateStatus(jobId, `Forfiner ${docType} med AI...`);
        const folderName = existingFolder;
        const folderPath = this.path.join(this.rootDir, 'output', folderName);
        let lang = 'da';

        if (this.fs.existsSync(this.path.join(folderPath, 'session.md'))) {
            const oldSession = this.fs.readFileSync(this.path.join(folderPath, 'session.md'), 'utf8');
            const langMatch = oldSession.match(/## SPROG\n(.*?)\n/);
            if (langMatch) lang = langMatch[1].trim();
            else lang = existingMarkdown.toLowerCase().includes('dear') || existingMarkdown.toLowerCase().includes('sincerely') ? 'en' : 'da';
        } else lang = existingMarkdown.toLowerCase().includes('dear') || existingMarkdown.toLowerCase().includes('sincerely') ? 'en' : 'da';

        const companyName = folderName.split('_')[2] || 'firma';
        const jobTitleSafe = folderName.split('_').slice(3).join('_') || 'stilling';
        const jobTitleRaw = jobTitleSafe.replace(/_/g, ' ');

        const refinePrompt = `Du er en præcis redaktør. Her er dokumenterne, BRUTTO_CV og instruks.\nSPROG: ${lang === 'en' ? 'ENGELSK' : 'DANSK'}.\nINSTRUKSER: "${hint}"\nKILDE (BRUTTO_CV): """${bruttoCv}"""\nNUVÆRENDE DOKUMENTER: ${existingMarkdown}\nReturner med mærkater.`;
        const docsPart = await this.aiManager.call(refinePrompt, jobId);
        return { folderName, folderPath, companyName, jobTitleRaw, jobTitleSafe, docsPart, lang };
    }

    async _handleInitialFlow({ jobId, jobText, companyUrl, hint, bruttoCv, icanDef, candidate }) {
        this._updateStatus(jobId, 'Analyserer jobopslag...');
        const langPrompt = `Hvilket sprog er dette jobopslag? Svar KUN ISO-kode (da/en): """${jobText.substring(0, 1000)}"""`;
        let lang = (await this.aiManager.call(langPrompt, jobId)).trim().toLowerCase().substring(0, 2);
        if (!/^[a-z]{2}$/.test(lang)) lang = 'da';

        this._updateStatus(jobId, 'Laver autonom research på firmaet...');
        const infoPrompt = `Udtræk firmanavn, jobtitel og by fra dette opslag: """${jobText.substring(0, 1500)}"""\nSvar KUN JSON: {"company": "Navn", "title": "Job", "location": "By"}`;
        const infoRaw = await this.aiManager.call(infoPrompt, jobId);
        const info = JSON.parse(infoRaw.match(/\{[\s\S]*\}/)[0]);
        
        let foundCompanyAddress = "";
        let companyContext = "";
        if (!companyUrl) {
            const resPrompt = `Find officiel URL og adresse for "${info.company}" i "${info.location || 'Danmark'}". Svar JSON: {"url": "...", "address": "..."}`;
            const resRaw = await this.aiManager.call(resPrompt, jobId);
            const res = JSON.parse(resRaw.match(/\{[\s\S]*\}/)[0]);
            companyUrl = res.url; foundCompanyAddress = res.address;
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
        
        this.fs.mkdirSync(folderPath, { recursive: true });
        this.fs.writeFileSync(this.path.join(folderPath, 'job.md'), jobText);
        if (companyContext) this.fs.writeFileSync(this.path.join(folderPath, 'research.md'), companyContext);

        if (companyUrl && companyUrl.startsWith('http')) {
            await this.utils.saveUrlToPdf(companyUrl, this.path.join(folderPath, 'jobopslag_original.pdf'));
        }

        this._updateStatus(jobId, 'Genererer udkast med AI...');
        const aiInstructions = this.fs.readFileSync(this.path.join(this.rootDir, 'templates', 'ai_instructions.md'), 'utf8');
        const masterLayout = this.fs.readFileSync(this.path.join(this.rootDir, 'templates', 'master_layout.md'), 'utf8');
        const cvLayout = this.fs.readFileSync(this.path.join(this.rootDir, 'templates', 'cv_layout.md'), 'utf8');

        const generatePrompt = `${aiInstructions}\nSPROG: ${lang === 'en' ? 'ENGELSK' : 'DANSK'}.\nMASTER_LAYOUT: ${masterLayout}\nCV_LAYOUT: ${cvLayout}\nDATA: Brutto-CV: ${bruttoCv}, Job: ${jobText}, Firma-info: ${companyContext}, Navn: ${process.env.MIT_NAVN || candidate.name}, ICAN: ${icanDef}`;
        const docsPart = await this.aiManager.call(generatePrompt, jobId);
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
        return [ { id: 'ansøgning', md: this.utils.extractSection(docsPart, '---ANSØGNING---'), title: 'Ansøgning' }, { id: 'cv', md: this.utils.extractSection(docsPart, '---CV---'), title: 'CV' }, { id: 'match', md: this.utils.extractSection(docsPart, '---MATCH---'), title: 'Match_Analyse' }, { id: 'ican', md: this.utils.extractSection(docsPart, '---ICAN---'), title: 'ICAN+_Pitch' } ].filter(s => s.md);
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

    async _generateOutputFiles({ folderName, folderPath, sections, metadataRaw, layoutMeta, companyName, jobTitleRaw, candidate, lang, jobId }) {
        const results = { markdown: {}, html: {}, links: {} };
        const fileBaseId = folderName.split('_').slice(1).join('_');
        const candidateName = candidate.name.replace(/\s+/g, '_');
        for (const s of sections) {
            const fileName = `${s.title}_${candidateName}_${fileBaseId}`;
            const mdPath = this.path.join(folderPath, `${fileName}.md`);
            const htmlPath = this.path.join(folderPath, `${fileName}.html`);
            const pdfPath = this.path.join(folderPath, `${fileName}.pdf`);
            const fullMarkdown = `---LAYOUT_METADATA---\n${metadataRaw}\n\n---${s.title.toUpperCase()}---\n${s.md}`;
            this.fs.writeFileSync(mdPath, fullMarkdown);
            const htmlBody = await this.utils.mdToHtml(s.md, mdPath, `${fileName}_body.html`);
            const fullHtml = this.utils.wrap(s.title.replace(/_/g, ' '), htmlBody, s.id, { company: companyName, position: jobTitleRaw }, candidate, lang, layoutMeta);
            this.fs.writeFileSync(htmlPath, fullHtml);
            this._updateStatus(jobId, `Genererer PDF for ${s.title}...`);
            await this.utils.printToPdf(htmlPath, pdfPath);
            results.markdown[s.id] = fullMarkdown; results.html[s.id] = fullHtml;
            results.links[s.id] = { md: `/api/applications/${folderName}/${fileName}.md`, html: `/api/applications/${folderName}/${fileName}.html`, pdf: `/api/applications/${folderName}/${fileName}.pdf` };
        }
        return results;
    }
}

module.exports = ApplicationService;
