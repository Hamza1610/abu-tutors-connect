"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestMatch = void 0;
const logger_1 = __importDefault(require("../utils/logger"));
const generative_ai_1 = require("@google/generative-ai");
const User_1 = __importDefault(require("../models/User"));
// 1. Tool Definitions for the Agentic AI
const tools = [
    {
        functionDeclarations: [
            {
                name: "search_tutors",
                description: "Search for tutors based on course name or specific academic topic.",
                parameters: {
                    type: "object",
                    properties: {
                        query: {
                            type: "string",
                            description: "The course name or topic (e.g., 'Math 101', 'Thermodynamics')."
                        }
                    },
                    required: ["query"]
                }
            },
            {
                name: "get_tutor_details",
                description: "Get full profile, reviews, and availability for a specific tutor.",
                parameters: {
                    type: "object",
                    properties: {
                        tutorId: {
                            type: "string",
                            description: "The unique ID of the tutor."
                        }
                    },
                    required: ["tutorId"]
                }
            }
        ]
    }
];
// 2. Mocking or Implementing the tool logic
const toolLogic = {
    search_tutors: async (args) => {
        const { query } = args;
        // Search in User model for tutors who have the query in their courses or department
        const tutors = await User_1.default.find({
            role: { $in: ['tutor', 'verified_tutor'] },
            $or: [
                { courses: { $regex: query, $options: 'i' } },
                { department: { $regex: query, $options: 'i' } }
            ]
        }).limit(5).select('name faculty level courses rating _id');
        return tutors;
    },
    get_tutor_details: async (args) => {
        const tutor = await User_1.default.findById(args.tutorId).select('-password');
        return tutor;
    }
};
const requestMatch = async (req, res) => {
    try {
        const { course, topic, prompt } = req.body;
        if (!course || !topic || !prompt) {
            res.status(400).json({ message: "Course, topic, and prompt are required." });
            return;
        }
        logger_1.default.info(`Agentic AI Match requested for: ${course} - ${topic}`);
        if (!process.env.GEMINI_API_KEY) {
            logger_1.default.warn('GEMINI_API_KEY missing. Falling back to simple DB search.');
            const tutors = await toolLogic.search_tutors({ query: course });
            if (tutors.length > 0) {
                res.status(200).json({
                    message: "I found a few tutors who might be a good fit for you!",
                    tutor: tutors[0]
                });
            }
            else {
                res.status(404).json({ message: "No tutors found for this course yet." });
            }
            return;
        }
        // Initialize Gemini with Tools
        let model;
        try {
            const genAI = new generative_ai_1.GoogleGenerativeAI(process.env.GEMINI_API_KEY);
            model = genAI.getGenerativeModel({
                model: "gemini-2.0-flash",
                tools: tools,
            });
            const chat = model.startChat();
            const initialPrompt = `
You are ABUTutorsConnect's Agentic AI Matcher. Your goal is to find the BEST tutor for a student.
A student needs help with:
Course: ${course}
Topic: ${topic}
Problem: ${prompt}

Use the 'search_tutors' tool to find candidates. If you find candidates, use 'get_tutor_details' for the most promising one to check their full profile.
Then, provide a helpful recommendation.

Response Format (JSON):
{
  "message": "Enthusiastic explanation of why this tutor is the best fit.",
  "tutor": { ...tutor object from DB, MUST include _id and all other fields... }
}
`;
            const result = await chat.sendMessage(initialPrompt);
            let responseText = result.response.text();
            // Handle Function Calling Loop
            const candidate = result.response.candidates?.[0];
            const parts = candidate?.content?.parts;
            const call = parts?.find(p => p.functionCall);
            if (call && call.functionCall) {
                const { name, args } = call.functionCall;
                logger_1.default.info(`AI calling tool: ${name}`);
                const toolResult = await toolLogic[name](args);
                const nextResult = await chat.sendMessage([
                    {
                        functionResponse: {
                            name,
                            response: { content: toolResult }
                        }
                    }
                ]);
                responseText = nextResult.response.text();
            }
            // Clean up response if it's wrapped in markdown
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            const matchData = jsonMatch ? JSON.parse(jsonMatch[0]) : { message: responseText };
            logger_1.default.info(`Agentic AI Match successful for ${course}`);
            res.status(200).json(matchData);
            return;
        }
        catch (aiError) {
            logger_1.default.error(`AI Match Error (Falling back to search): ${aiError.message}`);
            // FALLBACK LOGIC
            const tutors = await toolLogic.search_tutors({ query: course });
            if (tutors.length > 0) {
                res.status(200).json({
                    message: "The AI matcher is currently unavailable, but I found these tutors who match your course!",
                    tutor: tutors[0]
                });
            }
            else {
                res.status(404).json({ message: "No tutors found for this course. Please try a different search term." });
            }
        }
    }
    catch (error) {
        logger_1.default.error(`General Match Controller Error: ${error.message}`, { error });
        res.status(500).json({ message: "Server error during matching", error: error.message });
    }
};
exports.requestMatch = requestMatch;
//# sourceMappingURL=matchController.js.map