/**
 * ApplicationController.js
 * Håndterer alle API requests vedrørende ansøgningsgenerering og resultater.
 */

class ApplicationController {
    constructor(deps) {
        this.jobQueue = deps.jobQueue;
        this.aiManager = deps.aiManager;
        this.rootDir = deps.rootDir;
        this.fs = deps.fs;
        this.path = deps.path;
        this.logger = deps.logger;
        this.utils = {
            mdToHtml: deps.mdToHtml,
            wrap: deps.wrap,
            printToPdf: deps.printToPdf,
            parseCandidateInfo: deps.parseCandidateInfo,
            extractSection: deps.extractSection
        };
    }

    _parseMetadata(raw, lang) {
        const get = (key) => raw.match(new RegExp(`^${key}:\\s*(.*?)(?=\\s*(?:Sign-off:|Location:|Date-Prefix:|Address:|Sender-Name:|Sender-Address:|Sender-Phone:|Sender-Email:|Folder-Name:)|$)`, 'im'))?.[1]?.trim() || "";
        return { 
            signOff: get('Sign-off') || (lang === 'en' ? "Sincerely," : "Med venlig hilsen,"), 
            location: get('Location'), 
            datePrefix: get('Date-Prefix') || (lang === 'da' ? "den" : ""), 
            address: get('Address'), 
            senderName: get('Sender-Name'), 
            senderAddress: get('Sender-Address'), 
            senderPhone: get('Sender-Phone'), 
            senderEmail: get('Sender-Email'), 
            folderName: get('Folder-Name') 
        };
    }

    /**
     * @openapi
     * /api/generate:
     *   post:
     *     summary: Start job-generering
     *     description: Sender et nyt job til AI-genereringskøen.
     *     tags: [Applications]
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
     *       200:
     *         description: JobId returneres.
     */
    async generate(req, res) {
        try {
            const jobId = Date.now().toString();
            const { jobText, companyUrl, hint, aiProvider, aiModel } = req.body;
            this.logger.info("ApplicationController", `Start fuld generering for job: ${jobId}`, { aiProvider, aiModel, companyUrl });
            await this.jobQueue.add('generate_job', { 
                jobId, 
                jobText, 
                companyUrl, 
                hint, 
                aiProvider, 
                aiModel,
                type: 'full_generation' 
            });
            res.json({ jobId });
        } catch (err) {
            this.logger.error("ApplicationController", "Fejl ved start af generering", { error: err.message });
            res.status(500).json({ error: err.message });
        }
    }

    /**
     * @openapi
     * /api/refine:
     *   post:
     *     summary: Forfin dokument
     *     description: Opdaterer eller forfiner et specifikt dokument (ansøgning/cv) via AI eller manuelt.
     *     tags: [Applications]
     */
    async refine(req, res) {
        try {
            const { folder, type, markdown, useAi, hint, aiProvider, aiModel } = req.body;
            if (useAi) {
                const jobId = Date.now().toString();
                this.logger.info("ApplicationController", `Start AI forfinelse for ${type} i ${folder}`, { aiProvider, aiModel });
                await this.jobQueue.add('generate_job', { 
                    jobId, 
                    folder, 
                    docType: type, // Omdøbt fra 'type' for at undgå overwrite
                    markdown, 
                    useAi: true, 
                    hint, 
                    aiProvider,
                    aiModel,
                    type: 'refine_with_ai' 
                });
                res.json({ jobId });
            } else {
                this.logger.info("ApplicationController", `Gemmer manuel rettelse for ${type} i ${folder}`);
                const result = await this._handleManualEdit(folder, type, markdown);
                res.json({ success: true, html: result.html });
            }
        } catch (err) {
            this.logger.error("ApplicationController", "Fejl ved forfinelse/gemning", { error: err.message });
            res.status(500).json({ error: err.message });
        }
    }

    /**
     * @openapi
     * /api/results/{folder}:
     *   get:
     *     summary: Hent resultater
     *     description: Henter alle genererede filer (MD, HTML, Links) for en given mappe.
     *     tags: [Applications]
     *     parameters:
     *       - in: path
     *         name: folder
     *         required: true
     *         schema:
     *           type: string
     */
    async getResults(req, res) {
        try {
            const { folder } = req.params;
            const folderPath = this.path.join(this.rootDir, 'output', folder);
            if (!this.fs.existsSync(folderPath)) return res.status(404).json({ error: "Mappe ikke fundet" });
            
            const results = { folder, markdown: {}, html: {}, links: {}, aiNotes: "", jobText: "" };
            
            const jobMdPath = this.path.join(folderPath, 'job.md');
            if (this.fs.existsSync(jobMdPath)) {
                results.jobText = this.fs.readFileSync(jobMdPath, 'utf8');
            }

            const sessionPath = this.path.join(folderPath, 'session.md');
            if (this.fs.existsSync(sessionPath)) {
                const content = this.fs.readFileSync(sessionPath, 'utf8');
                const match = content.match(/## AI RÆSONNEMENT \(REDAKTØRENS NOTER\)\n([\s\S]*?)(?=\n---|\n##|$)/);
                if (match) results.aiNotes = match[1].trim();
            }

            const files = this.fs.readdirSync(folderPath);
            const sections = [
                { id: 'ansøgning', title: 'Ansøgning' }, 
                { id: 'cv', title: 'CV' }, 
                { id: 'match', title: 'Match_Analyse' }, 
                { id: 'ican', title: 'ICAN+_Pitch' }
            ];

            sections.forEach(s => {
                const mdFile = files.find(f => f.startsWith(s.title) && f.endsWith('.md'));
                const htmlFile = files.find(f => f.startsWith(s.title) && f.endsWith('.html'));
                const pdfFile = files.find(f => f.startsWith(s.title) && f.endsWith('.pdf'));
                
                if (mdFile) {
                    results.markdown[s.id] = this.fs.readFileSync(this.path.join(folderPath, mdFile), 'utf8');
                    results.html[s.id] = this.fs.readFileSync(this.path.join(folderPath, htmlFile), 'utf8');
                    results.links[s.id] = { 
                        md: `/api/applications/${folder}/${mdFile}`, 
                        html: `/api/applications/${folder}/${htmlFile}`, 
                        pdf: `/api/applications/${folder}/${pdfFile}` 
                    };
                }
            });
            res.json(results);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    async testAi(req, res) {
        try {
            const provider = req.query.provider;
            const prompt = "Hvad er 2+2? Svar kun med tallet.";
            this.logger.info("ApplicationController", "Manuel AI test-kald startet", { provider: provider || 'default' });
            
            const result = await this.aiManager.call(prompt, "health_check", provider);
            
            // NYT: Log selve svaret så det kan ses i terminalen
            this.logger.info("ApplicationController", "AI test-kald færdiggjort", { 
                provider: provider || 'default', 
                answer: result.trim() 
            });

            res.json({ 
                success: true, 
                provider: provider || process.env.AI_PROVIDER || 'gemini',
                prompt: prompt,
                answer: result.trim() 
            });
        } catch (err) {
            this.logger.error("ApplicationController", "AI test-kald fejlede", { error: err.message });
            res.status(500).json({ success: false, error: err.message });
        }
    }

    async _handleManualEdit(folder, type, markdown) {
        const folderPath = this.path.join(this.rootDir, 'output', folder);
        const title = type === 'ansøgning' ? 'Ansøgning' : type === 'cv' ? 'CV' : type === 'match' ? 'Match_Analyse' : 'ICAN+_Pitch';
        const mdFile = this.fs.readdirSync(folderPath).find(f => f.startsWith(title) && f.endsWith('.md'));
        if (!mdFile) throw new Error(`Markdown fil for ${title} ikke fundet i mappen ${folder}`);
        const mdPath = this.path.join(folderPath, mdFile);
        
        // Sørg for at rense teksten for gamle/stray mærkater inden vi gemmer (hvis brugeren f.eks. redigerer en fil fra før v6.0)
        let cleanMarkdown = markdown;
        cleanMarkdown = cleanMarkdown.replace(/-{3,}\s*LAYOUT_METADATA\s*-*[\s\S]*?(?=-{3,}\s*[A-ZÆØÅ_]+\s*-*|$)/gi, '');
        cleanMarkdown = cleanMarkdown.replace(/-{3,}\s*[A-ZÆØÅ_]+\s*-*/gi, '');
        cleanMarkdown = cleanMarkdown.trim();

        // 1. Gem den rene markdown brødtekst
        this.fs.writeFileSync(mdPath, cleanMarkdown);

        // 2. Læs data fra job_data.json
        const jobDataPath = this.path.join(folderPath, 'job_data.json');
        let layoutMeta = {};
        let candidate = {};
        let lang = 'da';
        let companyName = "";
        let jobTitleRaw = "";
        
        if (this.fs.existsSync(jobDataPath)) {
            const savedData = JSON.parse(this.fs.readFileSync(jobDataPath, 'utf8'));
            layoutMeta = savedData.layoutMeta || {};
            candidate = savedData.candidate || {};
            lang = savedData.lang || 'da';
            companyName = savedData.companyName || "";
            jobTitleRaw = savedData.jobTitleRaw || "";
        } else {
            // Fallback for gamle mapper
            const bruttoPath = this.path.join(this.rootDir, 'data', 'brutto_cv.md');
            if (this.fs.existsSync(bruttoPath)) {
                const bruttoCv = this.fs.readFileSync(bruttoPath, 'utf8');
                candidate = this.utils.parseCandidateInfo(bruttoCv);
            }
            lang = cleanMarkdown.toLowerCase().includes('dear') || cleanMarkdown.toLowerCase().includes('sincerely') ? 'en' : 'da';
        }

        // 4. Konverter body til HTML
        const htmlBody = await this.utils.mdToHtml(cleanMarkdown, mdPath, mdFile.replace('.md', '_body.html'));
        
        // 5. Wrap i layout
        const fullHtml = this.utils.wrap(title.replace(/_/g, ' '), htmlBody, type, { company: companyName, position: jobTitleRaw }, candidate, lang, layoutMeta);
        
        const htmlFile = mdFile.replace('.md', '.html');
        const fullHtmlPath = this.path.join(folderPath, htmlFile);
        this.fs.writeFileSync(fullHtmlPath, fullHtml);
        
        const pdfFile = mdFile.replace('.md', '.pdf');
        const fullPdfPath = this.path.join(folderPath, pdfFile);
        
        // VIGTIGT: Vi sender stien til HTML filen, ikke selve HTML indholdet
        await this.utils.printToPdf(fullHtmlPath, fullPdfPath);
        
        return { html: fullHtml };
    }
}

module.exports = ApplicationController;
