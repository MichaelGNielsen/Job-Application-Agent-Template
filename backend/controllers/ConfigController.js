/**
 * ConfigController.js
 * Håndterer versionering, Master CV og AI-konfiguration.
 */

class ConfigController {
    constructor(deps) {
        this.rootDir = deps.rootDir;
        this.fs = deps.fs;
        this.path = deps.path;
        this.aiManager = deps.aiManager; // Bruger central AI Manager
        this.utils = {
            parseCandidateInfo: deps.parseCandidateInfo,
            getInitials: deps.getInitials,
            mdToHtml: deps.mdToHtml,
            wrap: deps.wrap,
            printToPdf: deps.printToPdf
        };
    }

    /**
     * @openapi
     * /api/version:
     *   get:
     *     summary: Hent systemversion
     *     tags: [Config]
     */
    async getVersion(req, res) {
        try {
            const versionFilePath = this.path.join(this.rootDir, 'VERSION');
            let instanceName = '';
            
            // 1. Primær kilde: Brutto-CV (Gør systemet template-venligt og data-drevet)
            const bruttoPath = this.path.join(this.rootDir, 'data', 'brutto_cv.md');
            if (this.fs.existsSync(bruttoPath)) {
                const brutto = this.fs.readFileSync(bruttoPath, 'utf8');
                const info = this.utils.parseCandidateInfo(brutto);
                if (info.name) instanceName = info.name;
            }

            // 2. Sekundær kilde: .env (Kun hvis man eksplicit vil have et andet navn end CV'et)
            if (!instanceName) {
                const envPath = this.path.join(this.rootDir, '.env');
                if (this.fs.existsSync(envPath)) {
                    const env = this.fs.readFileSync(envPath, 'utf8');
                    const match = env.match(/APP_INSTANCE_NAME=(.*)/);
                    if (match) instanceName = match[1].trim();
                }
            }

            if (!instanceName) instanceName = 'JAA'; // Ultimativ fallback

            const provider = process.env.AI_PROVIDER || 'gemini';
            let model = '';
            
            if (provider === 'ollama') {
                model = `ollama:${process.env.OLLAMA_MODEL || "llama3.2"}`;
            } else if (provider === 'opencode') {
                model = 'opencode:agent';
            } else {
                model = `gemini:${process.env.GEMINI_MODEL || "flash-preview"}`;
            }

            if (this.fs.existsSync(versionFilePath)) {
                const content = this.fs.readFileSync(versionFilePath, 'utf8').trim();
                const currentVersion = content.split('\n')[0].trim();
                res.json({ 
                    version: currentVersion, 
                    instance: instanceName, 
                    initials: this.utils.getInitials(instanceName),
                    provider: provider,
                    model: model 
                });
            } else {
                res.json({ 
                    version: "2.6.x-dev", 
                    instance: instanceName, 
                    initials: this.utils.getInitials(instanceName),
                    provider, 
                    model 
                });
            }
        } catch (e) { res.status(500).json({ version: "error" }); }
    }

    getBrutto(req, res) {
        const p = this.path.join(this.rootDir, 'data', 'brutto_cv.md');
        res.json({ content: this.fs.readFileSync(p, 'utf8') });
    }

    saveBrutto(req, res) {
        const p = this.path.join(this.rootDir, 'data', 'brutto_cv.md');
        this.fs.writeFileSync(p, req.body.content);
        res.json({ success: true });
    }

    async refineBrutto(req, res) {
        try {
            const { content, hint } = req.body;
            const prompt = `Du er en ekspert i CV-optimering. Optimér mit Brutto-CV baseret på: "${hint}". Svar kun Markdown.\n\nCV:\n${content}`;
            
            // Brug den centrale kø til optimering
            const refined = await this.aiManager.call(prompt, "brutto_refine");
            res.json({ refined, log: "AI har optimeret dit Master CV." });
        } catch (err) { res.status(500).json({ error: err.message }); }
    }

    getInstructions(req, res) {
        res.json({ content: this.fs.readFileSync(this.path.join(this.rootDir, 'templates', 'ai_instructions.md'), 'utf8') });
    }

    saveInstructions(req, res) {
        this.fs.writeFileSync(this.path.join(this.rootDir, 'templates', 'ai_instructions.md'), req.body.content);
        res.json({ success: true });
    }

    getLayout(req, res) {
        res.json({ content: this.fs.readFileSync(this.path.join(this.rootDir, 'templates', 'master_layout.md'), 'utf8') });
    }

    saveLayout(req, res) {
        this.fs.writeFileSync(this.path.join(this.rootDir, 'templates', 'master_layout.md'), req.body.content);
        res.json({ success: true });
    }
}

module.exports = ConfigController;
