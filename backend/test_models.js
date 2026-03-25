const { GoogleGenerativeAI } = require('@google/generative-ai');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
    console.error("GEMINI_API_KEY not found in .env");
    process.exit(1);
}

async function listModels() {
    const models = [
        'gemini-1.5-flash-8b', 
        'gemini-1.5-pro',
        'gemini-2.0-flash'
    ];
    
    const genAI = new GoogleGenerativeAI(apiKey);

    for (const modelName of models) {
        process.stdout.write(`Checking ${modelName}... `);
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent("test");
            console.log("WORKING!");
        } catch (e) {
            console.log(`FAILED: ${e.message.split('\n')[0]}`);
        }
    }
}

listModels();
