/**
 * RadarService.js
 * Håndterer alt vedrørende den autonome radar, job-analyse og radar-data management.
 */

class RadarService {
    constructor(deps) {
        this.logger = deps.logger;
        this.fs = deps.fs;
        this.path = deps.path;
        this.fetch = deps.fetch;
        this.cheerio = deps.cheerio;
        this.aiManager = deps.aiManager; // Bruger central AI Manager
        this.rootDir = deps.rootDir;
    }

    async getRadarData() {
        const radarPath = this.path.join(this.rootDir, 'data', 'radar.json');
        let radarData = { config: { radius: 30, baseCity: 'Aalborg' }, jobs: [] };
        if (this.fs.existsSync(radarPath)) {
            radarData = JSON.parse(this.fs.readFileSync(radarPath, 'utf8'));
        }
        return radarData;
    }

    async saveRadarData(data) {
        const radarPath = this.path.join(this.rootDir, 'data', 'radar.json');
        this.fs.writeFileSync(radarPath, JSON.stringify(data, null, 2));
    }

    async updateConfig(newConfig) {
        const data = await this.getRadarData();
        data.config = { ...data.config, ...newConfig };
        await this.saveRadarData(data);
        return data.config;
    }

    async updateJobStatus(id, status) {
        const data = await this.getRadarData();
        const job = data.jobs.find(j => j.id === id);
        if (job) {
            job.status = status;
            await this.saveRadarData(data);
            return true;
        }
        return false;
    }

    async deleteJob(id) {
        const data = await this.getRadarData();
        const initialCount = data.jobs.length;
        data.jobs = data.jobs.filter(j => j.id !== id);
        if (data.jobs.length !== initialCount) {
            await this.saveRadarData(data);
            return true;
        }
        return false;
    }

    async maintenance() {
        const data = await this.getRadarData();
        const now = new Date();
        const activeJobs = [];
        const seenUrls = new Set();
        let removedCount = 0;

        for (const job of data.jobs) {
            // 1. Fjern udløbne jobs
            if (new Date(job.expiryDate) < now) { removedCount++; continue; }
            
            // 2. Fjern dubletter (sikkerhedsnet)
            if (seenUrls.has(job.url)) { removedCount++; continue; }
            seenUrls.add(job.url);

            try {
                // 3. Tjek om URL stadig findes
                const check = await this.fetch(job.url, { method: 'HEAD', headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 5000 });
                if (check.status === 404) { removedCount++; continue; }
            } catch (e) {}
            
            activeJobs.push(job);
        }

        data.jobs = activeJobs;
        await this.saveRadarData(data);
        return { removed: removedCount, remaining: activeJobs.length };
    }

    async addManualJob(jobInfo) {
        const { url, title, company, location } = jobInfo;
        const data = await this.getRadarData();
        // Robust dublet-tjek: Kun URL er nok
        if (data.jobs.find(ej => ej.url === url)) throw new Error("Jobbet findes allerede");

        const newJob = {
            id: 'job_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
            title: title || "Analyserer...",
            company: company || "Venter på AI...",
            url: url,
            location: location || data.config.baseCity,
            source: 'Manual/Bookmarklet',
            matchScore: null,
            reasons: ["Lagt i AI-køen..."],
            distance: 0,
            expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'analyzing'
        };

        data.jobs = [newJob, ...data.jobs];
        await this.saveRadarData(data);
        return newJob;
    }

    async _getAiPrefs() {
        try {
            const prefsPath = this.path.join(this.rootDir, 'data', 'ai_preferences.json');
            if (this.fs.existsSync(prefsPath)) {
                return JSON.parse(this.fs.readFileSync(prefsPath, 'utf8'));
            }
        } catch (e) { this.logger.warn("RadarService", "Kunne ikke læse AI præferencer", e.message); }
        return { activeProvider: 'gemini', providers: { gemini: { model: 'gemini-1.5-flash' } } };
    }

    async refresh() {
        const radarData = await this.getRadarData();
        const prefs = await this._getAiPrefs();
        const activeProvider = prefs.activeProvider;
        const activeModel = prefs.providers[activeProvider]?.model;

        const bruttoPath = this.path.join(this.rootDir, 'data', 'brutto_cv.md');
        const bruttoCv = this.fs.readFileSync(bruttoPath, 'utf8');

        const kwPrompt = `Baseret på dette CV og disse tekniske søgeord (inkluder både danske og engelske synonymer/variationer): ${radarData.config.searchKeywords.join(', ')}. Giv de 3 vigtigste tekniske søgeord og jobtitel. Svar kun JSON: {"keywords": ["ord1", "ord2"], "title": "titel"}\n\nCV: ${bruttoCv}`;
        const aiContext = await this.aiManager.call(kwPrompt, "radar_context", activeProvider, true, activeModel);
        
        this.logger.info("RadarService", `AI foreslår søgeord: ${aiContext.keywords.join(', ')}`);

        // Vi samler alle unikke jobs fra flere søgninger for at undgå "for specifikke" queries
        const allFoundJobs = [];
        const seenUrls = new Set();

        const addJobs = (jobs) => {
            for (const job of jobs) {
                if (!seenUrls.has(job.url)) {
                    seenUrls.add(job.url);
                    allFoundJobs.push(job);
                }
            }
        };

        // 1. Søg på de AI-genererede keywords (individuelt for bredde)
        for (const kw of aiContext.keywords) {
            const jobs = await this._searchJobindex(kw, radarData.config.baseCity, radarData.config.radius);
            addJobs(jobs);
        }

        // 2. Søg specifikt på Target Companies
        for (const company of radarData.targetCompanies) {
            const jobs = await this._searchJobindex(company.name, radarData.config.baseCity, radarData.config.radius);
            addJobs(jobs);
        }

        this.logger.info("RadarService", `Samlet antal unikke jobs fundet før scoring: ${allFoundJobs.length}`);

        const minScore = radarData.config.minScore || 80;

        for (const job of allFoundJobs) {
            const existingJobIndex = radarData.jobs.findIndex(ej => ej.url === job.url);

            const score = await this._scoreJob(job, bruttoCv);
            if (score && score.score >= minScore) {
                const newJobEntry = { 
                    id: 'job_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5), // Ny ID ved ny oprettelse, ellers bevares gammel
                    ...job, 
                    matchScore: score.score, 
                    reasons: score.reasons, 
                    distance: Math.floor(Math.random() * radarData.config.radius), 
                    expiryDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), 
                    status: 'new' 
                };

                if (existingJobIndex !== -1) {
                    // Opdater eksisterende job (bevar original ID)
                    this.logger.info("RadarService", `Opdaterer eksisterende job (score >= ${minScore}): ${job.title}`, { url: job.url, oldStatus: radarData.jobs[existingJobIndex].status, newStatus: 'new', newScore: score.score });
                    radarData.jobs[existingJobIndex] = { ...radarData.jobs[existingJobIndex], ...newJobEntry, id: radarData.jobs[existingJobIndex].id }; 
                } else {
                    // Tilføj nyt job
                    this.logger.info("RadarService", `Tilføjer nyt job (score >= ${minScore}): ${job.title}`, { url: job.url, score: score.score });
                    radarData.jobs.unshift(newJobEntry); // Tilføj til starten af listen
                }
            } else if (score && score.score < minScore && existingJobIndex !== -1 && radarData.jobs[existingJobIndex].status === 'new') {
                // Hvis et job, der tidligere var 'new', nu scorer under minScore, markeres det som 'ignored'
                this.logger.info("RadarService", `Job scorer nu under ${minScore}, skifter status fra 'new' til 'ignored': ${job.title}`, { url: job.url, newScore: score.score });
                radarData.jobs[existingJobIndex].status = 'ignored';
            }
        }
        
        // Sortér jobs så 'new' jobs vises først, derefter 'analyzing', og til sidst de andre
        radarData.jobs.sort((a, b) => {
            const statusOrder = { 'new': 1, 'analyzing': 2, 'applied': 3, 'ignored': 4, 'expired': 5 };
            return statusOrder[a.status] - statusOrder[b.status];
        });

        radarData.jobs = radarData.jobs.slice(0, 100); // Hold listen på max 100 jobs
        await this.saveRadarData(radarData);
        return radarData.jobs.filter(j => j.status === 'new').length; // Returner antal nye jobs
    }

    async _searchJobindex(query, baseCity, radius) {
        const foundJobs = [];
        try {
            const jiUrl = `https://www.jobindex.dk/jobsoegning?q=${encodeURIComponent(query)}&address=${encodeURIComponent(baseCity)}&radius=${radius || 30}`;
            this.logger.info("RadarService", `Søger på Jobindex (Chromium): ${jiUrl}`);
            
            // Vi bruger Chromium --dump-dom for at omgå cookie-mure og få indlæst JS
            const { exec } = require('child_process');
            const { promisify } = require('util');
            const execPromise = promisify(exec);
            
            // Vi giver den 5 sekunder til at indlæse siden
            const cmd = `chromium-browser --headless --disable-gpu --no-sandbox --dump-dom --virtual-time-budget=5000 "${jiUrl}"`;
            const { stdout } = await execPromise(cmd, { maxBuffer: 10 * 1024 * 1024 });
            
            const $ = this.cheerio.load(stdout);
            
            $('.PaidJob, .JobSearchResult, .jix_robotJob').each((i, el) => {
                let link = $(el).find('a[href*="/job/"]').first().attr('href');
                if (!link) return;
                const title = $(el).find('h4, b, .jix_robot_job_title').first().text().trim();
                const company = $(el).find('.p, .jix_robot_job_company').first().text().trim() || "Ukendt Firma";
                const location = $(el).find('.location, .jix_robot_job_location').text().trim() || baseCity;
                foundJobs.push({ title, company, url: link.startsWith('http') ? link : 'https://www.jobindex.dk' + link, location, source: 'Jobindex' });
            });

            this.logger.info("RadarService", `Fandt ${foundJobs.length} potentielle jobs på Jobindex for søgning: ${query}`);
        } catch (e) { this.logger.error("RadarService", "Jobindex crawl (Chromium) fejlede", e.message); }
        return foundJobs;
    }

    async _scoreJob(job, bruttoCv) {
        try {
            const prefs = await this._getAiPrefs();
            const activeProvider = prefs.activeProvider;
            const activeModel = prefs.providers[activeProvider]?.model;
            const scorePrompt = `Vurdér matchet (0-100) og giv 2 korte grunde. Job: ${job.title} (${job.company}) ved ${job.location}. CV: ${bruttoCv}. Svar kun JSON: {"score": 85, "reasons": ["...", "..."]}`;
            const result = await this.aiManager.call(scorePrompt, "radar_score", activeProvider, true, activeModel);
            this.logger.info("RadarService", `Scorer job: ${job.title} (${job.company}) | Score: ${result.score}`, { reasons: result.reasons });
            return result;
        } catch (e) { 
            this.logger.error("RadarService", "Fejl ved scoring af job", { error: e.message, job: job.title });
            return null; 
        }
    }

    async autoSync() {
        this.logger.info("RadarService", "--- STARTER AUTONOM RADAR SCAN ---");
        try {
            await this.maintenance();
            await this.refresh();
            return { status: 'success' };
        } catch (e) { throw e; }
    }

    async analyzeJob(data) {
        const { radarJobId, url, jobText } = data;
        try {
            const bruttoCv = this.fs.readFileSync(this.path.join(this.rootDir, 'data', 'brutto_cv.md'), 'utf8');
            const radarData = await this.getRadarData();
            const jobIdx = radarData.jobs.findIndex(j => j.id === radarJobId);
            if (jobIdx === -1) return { status: 'not_found' };

            let finalTitle = radarData.jobs[jobIdx].title;
            let finalCompany = radarData.jobs[jobIdx].company;
            let finalJobText = jobText || "";

            if (finalTitle === "Analyserer..." || !finalJobText) {
                try {
                    const prefs = await this._getAiPrefs();
                    const activeProvider = prefs.activeProvider;
                    const activeModel = prefs.providers[activeProvider]?.model;

                    const response = await this.fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
                    const html = await response.text();
                    const metaPrompt = `Udtræk jobtitel og firmanavn. URL: ${url}. Tekst: ${html}. Svar JSON: {"title": "...", "company": "..."}`;
                    const metaData = await this.aiManager.call(metaPrompt, radarJobId, activeProvider, true, activeModel);
                    this.logger.info("RadarService", `Udtrukket metadata for job: ${metaData.title} (${metaData.company})`, { radarJobId });
                    finalTitle = metaData.title || finalTitle;
                    finalCompany = metaData.company || finalCompany;
                } catch (e) {
                    this.logger.error("RadarService", `Fejl ved udtrækning af metadata for job ${radarJobId}`, { error: e.message });
                }
            }

            const score = await this._scoreJob({ title: finalTitle, company: finalCompany, location: radarData.jobs[jobIdx].location }, bruttoCv);
            if (score) {
                radarData.jobs[jobIdx] = { ...radarData.jobs[jobIdx], title: finalTitle, company: finalCompany, matchScore: score.score, reasons: score.reasons, status: 'new' };
                await this.saveRadarData(radarData);
            }
            return { status: 'success' };
        } catch (e) { throw e; }
    }
}

module.exports = RadarService;
