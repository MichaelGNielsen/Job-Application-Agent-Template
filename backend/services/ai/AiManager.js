/**
 * AiManager.js
 * Central Gateway til alle AI-kald.
 * Implementerer en global Redis-kø (BullMQ) for at sikre seriel afvikling.
 */

const { Queue, Worker, QueueEvents } = require('bullmq');
const GeminiProvider = require('./GeminiProvider');
const OllamaProvider = require('./OllamaProvider');
const OpenCodeProvider = require('./OpenCodeProvider');

class AiManager {
    constructor(deps) {
        this.logger = deps.logger;
        this.redisConnection = deps.redisConnection;
        
        // Setup Providers
        this.providers = {
            gemini: new GeminiProvider({ logger: this.logger }),
            ollama: new OllamaProvider({ logger: this.logger }),
            opencode: new OpenCodeProvider({ logger: this.logger })
        };

        // Standard provider (kan ændres i .env)
        this.defaultProvider = process.env.AI_PROVIDER || 'gemini';

        // Opret Kø og Events
        this.aiQueue = new Queue('ai_call_queue', { connection: this.redisConnection });
        this.queueEvents = new QueueEvents('ai_call_queue', { connection: this.redisConnection });

        // Opret Worker (Concurrency = 1 sikrer at vi aldrig kalder to gange samtidigt)
        this.worker = new Worker('ai_call_queue', async (job) => {
            const { prompt, jobId, providerName } = job.data;
            let primaryProviderName = providerName || this.defaultProvider;
            
            try {
                // 1. Forsøg med primær provider
                return await this._executeWithTimeout(primaryProviderName, prompt, jobId);
            } catch (error) {
                this.logger.warn("AiManager", `Primær AI (${primaryProviderName}) fejlede. Tjekker for fallback...`, { error: error.message });

                // 2. Hvis Gemini fejler, forsøg automatisk fallback til Ollama
                if (primaryProviderName === 'gemini') {
                    this.logger.info("AiManager", "Starter automatisk fallback til lokal Ollama...", { jobId });
                    try {
                        return await this._executeWithTimeout('ollama', prompt, jobId);
                    } catch (fallbackError) {
                        this.logger.error("AiManager", "Både Gemini og Ollama (fallback) fejlede.", undefined, fallbackError);
                        throw fallbackError;
                    }
                }
                
                // Hvis det ikke var Gemini der fejlede, kaster vi fejlen videre
                throw error;
            }
        }, { 
            connection: this.redisConnection,
            concurrency: 1, // VIGTIGST: Kun ét kald ad gangen i hele systemet!
            lockDuration: 300000, // 5 minutter (giver AI tid til at svare)
            lockRenewTime: 60000  // Forny lock hvert minut
        });
    }

    /**
     * Hjælpefunktion til at udføre selve kaldet med timeout og cooldown
     */
    async _executeWithTimeout(providerName, prompt, jobId) {
        const provider = this.providers[providerName];
        if (!provider) throw new Error(`Provider ${providerName} ikke fundet`);

        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error(`AI Timeout efter 90s (${providerName})`)), 90000)
        );

        const result = await Promise.race([
            provider.call(prompt, jobId),
            timeoutPromise
        ]);

        // Vent på cooldown efter hvert succesfuldt kald
        const cooldown = parseInt(process.env.AI_CALL_COOLDOWN_MS) || 5000;
        await new Promise(r => setTimeout(r, cooldown));
        
        return result;
    }

    /**
     * Sender en prompt til AI-køen og venter på resultatet
     */
    async call(prompt, jobId = "default", provider = null) {
        const providerName = provider || this.defaultProvider;
        this.logger.info("AiManager", `Lægger AI-job i køen (${providerName})`, { jobId });
        
        const job = await this.aiQueue.add('ai_call', { 
            prompt, 
            jobId, 
            providerName 
        }, {
            removeOnComplete: true,
            removeOnFail: false
        });

        // Vent på at jobbet bliver færdigt via QueueEvents
        return await job.waitUntilFinished(this.queueEvents);
    }
}

module.exports = AiManager;
