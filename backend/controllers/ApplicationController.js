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
            printToPdf: deps.printToPdf
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
            await this.jobQueue.add('generate_job', { jobId, ...req.body, type: 'full_generation' });
            res.json({ jobId });
        } catch (err) {
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
            const { folder, type, markdown, useAi, hint } = req.body;
            if (useAi) {
                const jobId = Date.now().toString();
                await this.jobQueue.add('generate_job', { 
                    jobId, folder, type, markdown, useAi: true, hint, type: 'refine_with_ai' 
                });
                res.json({ jobId });
            } else {
                const result = await this._handleManualEdit(folder, type, markdown);
                res.json({ success: true, html: result.html });
            }
        } catch (err) {
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
            
            const results = { folder, markdown: {}, html: {}, links: {}, aiNotes: "" };
            
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
        const mdPath = this.path.join(folderPath, mdFile);
        
        this.fs.writeFileSync(mdPath, markdown);
        const html = await this.utils.mdToHtml(markdown, mdPath, mdFile.replace('.md', '_body.html'));
        const htmlFile = mdFile.replace('.md', '.html');
        this.fs.writeFileSync(this.path.join(folderPath, htmlFile), html);
        
        const pdfFile = mdFile.replace('.md', '.pdf');
        await this.utils.printToPdf(html, this.path.join(folderPath, pdfFile));
        
        return { html };
    }
}

module.exports = ApplicationController;
