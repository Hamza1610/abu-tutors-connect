import { Request, Response } from 'express';
import logger from '../utils/logger';
import { GoogleGenAI } from '@google/genai';

const MOCK_TUTORS = [
    {
        id: "tutor-001",
        name: "Abubakar S.",
        faculty: "Engineering",
        level: "500L",
        courses: ["COEN453", "CCSN", "Software Engineering"],
        rating: 4.8
    },
    {
        id: "tutor-002",
        name: "Fatima B.",
        faculty: "Science",
        level: "400L",
        courses: ["Math 101", "Data Structures", "Vector Calculus"],
        rating: 4.5
    },
    {
        id: "tutor-003",
        name: "David O.",
        faculty: "Engineering",
        level: "300L",
        courses: ["Physics", "Circuit Theory", "Engineering Math"],
        rating: 4.9
    }
];

export const requestMatch = async (req: Request, res: Response): Promise<void> => {
    try {
        const { course, topic, prompt } = req.body;

        // Basic validation
        if (!course || !topic || !prompt) {
            res.status(400).json({ message: "Course, topic, and prompt are required." });
            return;
        }

        logger.info(`AI Match requested for course: ${course}, topic: ${topic}`);

        let matchData;

        // Ensure the API key exists before attempting live inference
        if (!process.env.GEMINI_API_KEY) {
            logger.warn('GEMINI_API_KEY is missing in backend/.env. Falling back to simulated AI Match.');
            await new Promise(resolve => setTimeout(resolve, 1500));
            matchData = {
                message: "[Simulated Fallback] Our agentic AI found the perfect tutor for your needs!",
                tutor: MOCK_TUTORS[0]
            };
        } else {
            const ai = new GoogleGenAI({});

            const aiPrompt = `
You are an intelligent tutor-matching agent for ABUTutorsConnect. 
A student is looking for help with the following problem:
Course: ${course}
Topic: ${topic}
Problem Description: ${prompt}

Here is a list of available tutors in our system:
${JSON.stringify(MOCK_TUTORS, null, 2)}

Your task is to analyze the student's problem and select the most appropriate tutor from the list above. 
Provide a brief, encouraging message explaining why this tutor is a good fit.

You MUST respond ONLY with a valid JSON object matching this exact schema:
{
  "message": "Why this tutor is a good fit",
  "tutor": {
    "id": "tutor ID",
    "name": "tutor name",
    "faculty": "tutor faculty",
    "level": "tutor level",
    "courses": ["course1", "course2"],
    "rating": 4.8
  }
}
`;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: aiPrompt,
                config: {
                    responseMimeType: "application/json",
                }
            });

            matchData = JSON.parse(response.text || "{}");
        }

        logger.info(`Live AI Match response sent for ${course}`);

        res.status(200).json(matchData);
    } catch (error: any) {
        logger.error(`AI Match Error: ${error.message}`, { error });
        res.status(500).json({ message: "Server error during matching", error: error.message });
    }
};
