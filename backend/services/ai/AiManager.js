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
            const { prompt, jobId, providerName, aiModel } = job.data;
            let currentProvider = providerName || this.defaultProvider;
            
            const fallbackChain = {
                'gemini': 'opencode',
                'opencode': 'ollama',
                'ollama': null
            };

            let attempts = 0;
            const maxAttempts = 3;

            while (currentProvider && attempts < maxAttempts) {
                try {
                    return await this._executeWithTimeout(currentProvider, prompt, jobId, aiModel);
                } catch (error) {
                    this.logger.warn("AiManager", `Provider (${currentProvider}) fejlede.`, { error: error.message });
                    currentProvider = fallbackChain[currentProvider];
                    attempts++;
                    if (currentProvider) {
                        this.logger.info("AiManager", `Prøver fallback til ${currentProvider}...`, { jobId });
                    }
                }
            }
            
            throw new Error("Alle AI providers fejlede.");
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
    async _executeWithTimeout(providerName, prompt, jobId, aiModel) {
        let actualProviderName = providerName === 'default' ? this.defaultProvider : providerName;
        const provider = this.providers[actualProviderName];
        if (!provider) throw new Error(`Provider ${actualProviderName} ikke fundet`);

        // Hævet timeout til 5 minutter (300.000 ms) for tunge generationer
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error(`AI Timeout efter 5 min (${providerName})`)), 300000)
        );

        const result = await Promise.race([
            provider.call(prompt, jobId, aiModel),
            timeoutPromise
        ]);

        // Vent på cooldown efter hvert succesfuldt kald
        const cooldown = parseInt(process.env.AI_CALL_COOLDOWN_MS) || 5000;
        await new Promise(r => setTimeout(r, cooldown));
        
        return result;
    }

    /**
     * Sender en prompt til AI-køen og venter på resultatet.
     * @param {string} prompt 
     * @param {string} jobId 
     * @param {string|null} provider - Valgfri overstyring af provider.
     * @param {boolean} json - Hvis true, forsøger vi at parse svaret som JSON.
     * @param {string|null} aiModel - Specifik model der skal bruges for provideren.
     * @param {boolean} returnFull - Hvis true, returneres et objekt med både svar og model-info.
     */
    async call(prompt, jobId = "default", provider = null, json = false, aiModel = null, returnFull = false) {
        const providerName = provider || this.defaultProvider;
        
        // Forstærk prompten hvis vi forventer JSON (især for mindre modeller)
        let finalPrompt = prompt;
        if (json) {
            if (providerName === 'ollama' || providerName === 'opencode') {
                finalPrompt += "\n\nVIGTIGT: Svar KUN med rå JSON. Ingen forklaring før eller efter. JSON skal starte med { og slutte med }.";
            } else {
                finalPrompt += "\n\nOutput format: JSON";
            }
        }

        this.logger.info("AiManager", `Lægger AI-job i køen (${providerName})`, { jobId, expectJson: json, aiModel, prompt: finalPrompt });
        
        const job = await this.aiQueue.add('ai_call', { 
            prompt: finalPrompt, 
            jobId, 
            providerName,
            aiModel
        }, {
            removeOnComplete: true,
            removeOnFail: false
        });

        // Vent på at jobbet bliver færdigt via QueueEvents
        const jobResult = await job.waitUntilFinished(this.queueEvents);
        
        // Understøt både rå streng (gamle providers) og objekt (nye providers)
        let result = typeof jobResult === 'object' ? (jobResult.response || "") : (jobResult || "");
        const usedModel = typeof jobResult === 'object' ? jobResult.model : (aiModel || "unknown");

        // Rens resultatet for eventuelle Markdown kode-hegn (ofte set hos mindre modeller)
        if (result.includes('```')) {
            const originalResult = result;
            result = result.replace(/^```[a-z]*\n/im, '').replace(/\n```$/m, '').trim();
            this.logger.info("AiManager", "Renset Markdown kode-hegn fra AI svar", { original: originalResult, cleaned: result });
        }

        // Send det rå svar til loggeren (loggeren håndterer selv trunkering ved -v vs -vv)
        this.logger.info("AiManager", "AI svar modtaget", { response: result, model: usedModel });

        let finalValue = result;

        if (json) {
            let jsonContent = "";
            try {
                // Find JSON blok - Vi leder efter den første { eller [ og den sidste matchende } eller ]
                const startBrace = result.indexOf('{');
                const startBracket = result.indexOf('[');
                let start = -1;
                let end = -1;

                if (startBrace !== -1 && (startBracket === -1 || startBrace < startBracket)) {
                    start = startBrace;
                    end = result.lastIndexOf('}');
                } else if (startBracket !== -1) {
                    start = startBracket;
                    end = result.lastIndexOf(']');
                }

                if (start !== -1 && end !== -1 && end > start) {
                    jsonContent = result.substring(start, end + 1).trim();
                } else {
                    // Fallback til regex
                    const jsonMatch = result.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
                    if (jsonMatch) jsonContent = jsonMatch[0].trim();
                }

                if (jsonContent) {
                    // RESILIENT PARSING: Prøv at fikse småfejl før vi giver op
                    try {
                        finalValue = JSON.parse(jsonContent);
                    } catch (e) {
                        this.logger.warn("AiManager", "Standard JSON.parse fejlede, prøver at rense indholdet...", { error: e.message });
                        const cleaned = this._cleanJson(jsonContent);
                        finalValue = JSON.parse(cleaned);
                    }
                } else {
                    // Fallback: Hvis ingen JSON blok blev fundet, prøv at lave en nød-JSON fra den rå tekst
                    this.logger.warn("AiManager", "Ingen JSON blok fundet, forsøger nød-fallback", { raw: result });
                    finalValue = { 
                        error: "Format fejl", 
                        raw: result,
                        company: "Ukendt",
                        title: "Ukendt",
                        url: "N/A",
                        address: "",
                        keywords: [],
                        reasons: [],
                        score: 0
                    };
                }
            } catch (e) {
                this.logger.error("AiManager", "Kritisk fejl ved parsing af AI svar", { error: e.message, jsonContent });
                finalValue = { error: e.message, raw: result };
            }
        }

        if (returnFull) {
            return {
                answer: finalValue,
                model: usedModel,
                provider: providerName
            };
        }

        return finalValue;
    }

    /**
     * Forsøger at fikse gængse JSON-fejl fra AI-modeller
     */
    _cleanJson(str) {
        return str
            .replace(/,\s*([\]}])/g, '$1') // Fjern trailing commas: [1,2,] -> [1,2]
            .replace(/([^{[,])\s*\n\s*"/g, '$1,\n"') // Tilføj manglende kommaer mellem linjer: "a":1 \n "b":2 -> "a":1, \n "b":2
            .replace(/\n/g, ' ') // Erstat newlines med mellemrum (JSON tillader ikke rå newlines i strenge)
            .replace(/\r/g, '')
            .trim();
    }
}

module.exports = AiManager;
