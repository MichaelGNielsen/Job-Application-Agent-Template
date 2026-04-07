/**
 * RadarController.js
 * Håndterer alle API requests vedrørende job-radaren.
 * Overholder Modularitet (SRP) og Dependency Injection (DI).
 * @category Backend
 */

class RadarController {
    /**
     * @param {Object} deps - Afhængigheder
     * @param {Object} deps.radarService - RadarService instans
     * @param {Object} deps.jobQueue - BullMQ kø
     */
    constructor(deps) {
        this.radarService = deps.radarService;
        this.jobQueue = deps.jobQueue;
    }

    /**
     * @openapi
     * /api/radar:
     *   get:
     *     summary: Hent alle radar data
     *     description: Returnerer konfiguration og alle fundne/analyserede jobs i radaren.
     *     tags: [Radar]
     *     responses:
     *       200:
     *         description: En liste over jobs og konfiguration.
     */
    async getRadar(req, res) {
        try {
            const data = await this.radarService.getRadarData();
            res.json(data);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    /**
     * @openapi
     * /api/radar/refresh:
     *   post:
     *     summary: Start proaktiv søgning
     *     description: Trigger en ny søgning efter jobs på Jobindex baseret på Master CV.
     *     tags: [Radar]
     *     responses:
     *       200:
     *         description: Antal nye jobs fundet.
     */
    async refresh(req, res) {
        try {
            this.radarService.logger.info("RadarController", "Modtaget anmodning om manuel radar refresh");
            const count = await this.radarService.refresh();
            res.json({ success: true, count });
            this.radarService.logger.info("RadarController", `Manuel radar refresh færdig. Fandt ${count} nye jobs.`);
        } catch (err) {
            this.radarService.logger.error("RadarController", "Fejl ved manuel radar refresh", { error: err.message });
            res.status(500).json({ error: err.message });
        }
    }

    /**
     * @openapi
     * /api/radar/job:
     *   post:
     *     summary: Tilføj job manuelt
     *     description: Tilføjer en URL til radaren og starter en baggrunds-analyse via AI.
     *     tags: [Radar]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               url:
     *                 type: string
     *               jobText:
     *                 type: string
     *     responses:
     *       200:
     *         description: Jobbet er tilføjet og sat i kø til analyse.
     */
    async addJob(req, res) {
        try {
            const newJob = await this.radarService.addManualJob(req.body);
            await this.jobQueue.add('radar_job_analyze', { 
                radarJobId: newJob.id, 
                url: req.body.url, 
                jobText: req.body.jobText, 
                location: newJob.location 
            });
            res.json({ success: true, job: newJob });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    /**
     * @openapi
     * /api/radar/status:
     *   post:
     *     summary: Opdater job status
     *     description: Markerer et job som f.eks. 'applied' eller 'ignored'.
     *     tags: [Radar]
     *     responses:
     *       200:
     *         description: Status opdateret.
     */
    async updateStatus(req, res) {
        try {
            const { id, status } = req.body;
            const success = await this.radarService.updateJobStatus(id, status);
            if (success) return res.json({ success: true });
            res.status(404).json({ error: "Job ikke fundet" });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    /**
     * @openapi
     * /api/radar/{id}:
     *   delete:
     *     summary: Slet et job
     *     tags: [Radar]
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Job slettet.
     */
    async deleteJob(req, res) {
        try {
            const success = await this.radarService.deleteJob(req.params.id);
            if (success) return res.json({ success: true });
            res.status(404).json({ error: "Job ikke fundet" });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    /**
     * @openapi
     * /api/radar/maintenance:
     *   post:
     *     summary: Rens radaren
     *     description: Fjerner døde links og forældede jobs.
     *     tags: [Radar]
     */
    async maintenance(req, res) {
        try {
            const result = await this.radarService.maintenance();
            res.json({ 
                success: true, 
                removed: result.removed, 
                remaining: result.remaining, 
                message: `Vedligeholdelse færdig. Fjernede ${result.removed} links.` 
            });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    /**
     * @openapi
     * /api/radar/config:
     *   post:
     *     summary: Opdater konfiguration
     *     tags: [Radar]
     */
    async updateConfig(req, res) {
        try {
            const config = await this.radarService.updateConfig(req.body);
            res.json({ success: true, config });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }
}

module.exports = RadarController;
