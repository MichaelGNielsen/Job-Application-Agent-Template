/**
 * swagger.test.js
 * Automatisk validering af OpenAPI specifikationen.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

describe('Swagger API Specification', () => {
    // Unikt filnavn for at undgå konflikter i Docker delte mapper
    const specPath = path.join(__dirname, `swagger_test_${Date.now()}_${Math.floor(Math.random() * 1000)}.json`);

    beforeAll(() => {
        const swaggerJsdoc = require('swagger-jsdoc');
        const swaggerSpec = swaggerJsdoc({
            definition: {
                openapi: '3.0.0',
                info: { title: 'Test', version: '1.0.0' },
            },
            apis: ['./controllers/*.js', './server.js'],
        });
        fs.writeFileSync(specPath, JSON.stringify(swaggerSpec));
    });

    afterAll(() => {
        if (fs.existsSync(specPath)) fs.unlinkSync(specPath);
    });

    test('OpenAPI specifikationen bør være syntaktisk korrekt', () => {
        try {
            execSync(`npx swagger-cli validate ${specPath}`);
        } catch (error) {
            const output = error.stdout ? error.stdout.toString() : error.message;
            throw new Error(`Swagger validering fejlede: ${output}`);
        }
    });
});
