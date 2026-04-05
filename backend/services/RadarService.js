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
        let expiredCount = 0;

        for (const job of data.jobs) {
            if (new Date(job.expiryDate) < now) { expiredCount++; continue; }
            try {
                const check = await this.fetch(job.url, { method: 'HEAD', headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 5000 });
                if (check.status === 404) { expiredCount++; continue; }
            } catch (e) {}
            activeJobs.push(job);
        }

        data.jobs = activeJobs;
        await this.saveRadarData(data);
        return { removed: expiredCount, remaining: activeJobs.length };
    }

    async addManualJob(jobInfo) {
        const { url, title, company, location } = jobInfo;
        const data = await this.getRadarData();
        if (data.jobs.find(ej => ej.url === url && ej.title === title)) throw new Error("Jobbet findes allerede");

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

    async refresh() {
        const radarData = await this.getRadarData();
        const bruttoPath = this.path.join(this.rootDir, 'data', 'brutto_cv.md');
        const bruttoCv = this.fs.readFileSync(bruttoPath, 'utf8');

        const kwPrompt = `Baseret på dette CV, giv de 3 vigtigste tekniske søgeord og jobtitel. Svar kun JSON: {"keywords": ["ord1", "ord2"], "title": "titel"}\n\nCV: ${bruttoCv.substring(0, 800)}`;
        const aiRes = await this.aiManager.call(kwPrompt, "radar_context");
        const aiContext = JSON.parse(aiRes.match(/\{[\s\S]*\}/)[0]);
        const query = aiContext.keywords.join(' ');

        const foundJobs = await this._searchJobindex(query, radarData.config.baseCity);
        const scoredJobs = [];
        
        for (const job of foundJobs.slice(0, 15)) {
            if (radarData.jobs.find(ej => ej.url === job.url && ej.title === job.title)) continue;
            const score = await this._scoreJob(job, bruttoCv);
            if (score && score.score >= 80) {
                scoredJobs.push({ 
                    id: 'job_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5), 
                    ...job, 
                    matchScore: score.score, 
                    reasons: score.reasons, 
                    distance: Math.floor(Math.random() * radarData.config.radius), 
                    expiryDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), 
                    status: 'new' 
                });
            }
        }

        radarData.jobs = [...scoredJobs, ...radarData.jobs].slice(0, 100);
        await this.saveRadarData(radarData);
        return scoredJobs.length;
    }

    async _searchJobindex(query, baseCity) {
        const foundJobs = [];
        try {
            const jiUrl = `https://www.jobindex.dk/jobsoegning?q=${encodeURIComponent(query)}&location=${encodeURIComponent(baseCity)}`;
            const jiRes = await this.fetch(jiUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
            const $ = this.cheerio.load(await jiRes.text());
            
            $('.PaidJob, .JobSearchResult').each((i, el) => {
                let link = $(el).find('a[href*="/job/"]').first().attr('href');
                if (!link) return;
                const title = $(el).find('h4, b, .jix_robot_job_title').first().text().trim();
                const company = $(el).find('.p, .jix_robot_job_company').first().text().trim() || "Ukendt Firma";
                const location = $(el).find('.location, .jix_robot_job_location').text().trim() || baseCity;
                foundJobs.push({ title, company, url: link.startsWith('http') ? link : 'https://www.jobindex.dk' + link, location, source: 'Jobindex' });
            });
        } catch (e) { this.logger.error("RadarService", "Jobindex crawl fejlede", e.message); }
        return foundJobs;
    }

    async _scoreJob(job, bruttoCv) {
        try {
            const scorePrompt = `Vurdér matchet (0-100) og giv 2 korte grunde. Job: ${job.title} (${job.company}) ved ${job.location}. CV: ${bruttoCv.substring(0, 800)}. Svar kun JSON: {"score": 85, "reasons": ["...", "..."]}`;
            const aiRes = await this.aiManager.call(scorePrompt, "radar_score");
            return JSON.parse(aiRes.match(/\{[\s\S]*\}/)[0]);
        } catch (e) { return null; }
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
                    const response = await this.fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
                    const html = await response.text();
                    const metaPrompt = `Udtræk jobtitel og firmanavn. URL: ${url}. Tekst: ${html.substring(0, 2000)}. Svar JSON: {"title": "...", "company": "..."}`;
                    const metaRes = await this.aiManager.call(metaPrompt, radarJobId);
                    const metaData = JSON.parse(metaRes.match(/\{[\s\S]*\}/)[0]);
                    finalTitle = metaData.title || finalTitle;
                    finalCompany = metaData.company || finalCompany;
                } catch (e) {}
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
