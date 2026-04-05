/**
 * ai_multi_test.js
 * Manuel test af alle AI providers ved brug af direkte kald udenom køen.
 */

const { logger } = require('./utils');
const GeminiProvider = require('./services/ai/GeminiProvider');
const OllamaProvider = require('./services/ai/OllamaProvider');
const OpenCodeProvider = require('./services/ai/OpenCodeProvider');
const dotenv = require('dotenv');
const path = require('path');

async function test() {
    // Vi ved fra docker inspect at mgn mappen er mountet til /app/shared
    const envPath = '/app/shared/.env';
    dotenv.config({ path: envPath });

    console.log("Config loaded from:", envPath);
    console.log("Values:", {
        OLLAMA_URL: process.env.OLLAMA_URL,
        OPENCODE_URL: process.env.OPENCODE_URL,
        AI_PROVIDER: process.env.AI_PROVIDER
    });

    const providers = {
        gemini: new GeminiProvider({ logger }),
        ollama: new OllamaProvider({ logger }),
        opencode: new OpenCodeProvider({ logger })
    };

    const prompt = "Svar kun med ordet TEST.";

    console.log("🚀 Starter Direkte Multi-Provider AI Test (Udenom kø)...");

    for (const [name, provider] of Object.entries(providers)) {
        console.log(`\n--- Tester Provider: ${name} (URL: ${provider.baseUrl || 'Gemini-CLI'}) ---`);
        try {
            const resultPromise = provider.call(prompt, `test_${name}`);
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error("Timeout efter 30s")), 30000)
            );

            const result = await Promise.race([resultPromise, timeoutPromise]);
            console.log(`✅ Svar fra ${name}: "${result.toString().trim()}"`);
        } catch (error) {
            console.error(`❌ Fejl hos ${name}:`, error.message);
        }
    }

    console.log("\n--- Test Slut ---");
    process.exit(0);
}

test();
