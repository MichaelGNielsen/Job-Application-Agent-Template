/**
 * ai_syre_test.js
 * Verificerer forbindelsen til AI (2+2 test).
 */

const { logger } = require('./utils');

async function runAiSyreTest(aiManager) {
    logger.info("AiSyreTest", "🧪 STARTER AI SYRE-TEST (2+2 TEST)...");
    
    const prompt = "Hvad er 2+2? Svar kun med tallet.";
    
    try {
        // Vi bruger aiManager her for at overholde kø-systemet selv ved startup
        const result = await aiManager.call(prompt, "syre_test");
        const cleanResult = result.trim();
        
        if (cleanResult === "4" || cleanResult.includes("4")) {
            logger.info("AiSyreTest", `✅ SUCCESS! AI svarede korrekt: "${cleanResult}"`);
            logger.info("AiSyreTest", "🚀 AI-motoren er 100% kampklar og har adgang til Google API.");
        } else {
            logger.warn("AiSyreTest", `⚠️ AI svarede forkert eller uventet: "${cleanResult}"`);
        }
    } catch (error) {
        logger.error("AiSyreTest", "❌ FEJL! AI-kaldet fejlede", undefined, error);
    }
}

module.exports = { runAiSyreTest };
