import { Request, Response } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import User from '../models/User';
import logger from '../utils/logger';

interface AuthRequest extends Request {
    user?: any;
}

const getTutorsForMatch = async (course: string, budget?: number) => {
    // Build query object
    const query: any = {
        role: { $in: ['tutor', 'verified_tutor'] },
        $or: [
            { courses: { $regex: course, $options: 'i' } },
            { department: { $regex: course, $options: 'i' } }
        ]
    };

    // If a budget is provided, filter by hourly rate (allowing strictly lower or equal to budget)
    if (budget) {
        query.hourlyRate = { $lte: budget };
    }

    // Standard backend search to find candidates, sorted by rating and experience metrics
    return await User.find(query)
        .sort({ averageRating: -1, sessionsCompleted: -1 })
        .limit(15)
        .select('name faculty level courses matchingBio averageRating sessionsCompleted hourlyRate areaOfStrength _id');
};

export const requestMatch = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { course, prompt, budget } = req.body;
        if (!course || !prompt) {
            res.status(400).json({ message: "Missing course code or problem description." });
            return;
        }

        logger.info(`[HYBRID AI] Matching request received for course: ${course}, Budget: ${budget || 'flexible'}`);

        // 1. Pre-fetch candidates (Database Search - Fast & Free)
        const candidates = await getTutorsForMatch(course, Number(budget) || undefined);

        if (candidates.length === 0) {
            logger.info(`[HYBRID AI] No candidates found in database for ${course} within budget.`);
            res.status(200).json({
                message: "We couldn't find tutors specifically matching this course and budget right now, but our platform is growing!",
                recommendations: []
            });
            return;
        }

        // 2. Single-Pass AI Decision (Agentic & Analytical)
        if (!process.env.GEMINI_API_KEY) {
            logger.warn(`[HYBRID AI] GEMINI_API_KEY is missing from environment.`);
            res.status(200).json({
                message: "AI service is currently offline, but here are some highly-rated tutors we found!",
                recommendations: candidates.slice(0, 3).map(c => ({
                    tutor: c,
                    matchScore: 75,
                    reasoning: "Highly rated match from our platform database."
                }))
            });
            return;
        }

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        // Using gemini-1.5-flash for speed and cost efficiency
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const promptTemplate = `
        You are the ABUTutorsConnect AI Matchmaker and Research Analyst.
        Evaluate the following tutors to find the top 3 best matches for this student based on their difficulty description, budget, and the tutor's metrics.
        
        STUDENT NEEDS:
        - Topic/Course: ${course}
        - Problem Description: ${prompt}
        - Budget: ${budget ? '₦' + budget : 'Flexible'}

        CANDIDATES:
        ${candidates.map((t, i) => 
            `${i+1}. [ID: ${t._id?.toString()}]
             Name: ${t.name}
             Academics: ${t.faculty} | Level: ${t.level}
             Courses Taught: ${t.courses?.join(', ') || 'N/A'}
             Metrics: Rate: ₦${t.hourlyRate || 0}/hr | Rating: ${t.averageRating || 0}/5 | Sessions Completed: ${t.sessionsCompleted || 0}
             Strength: "${t.areaOfStrength || 'N/A'}"
             Bio: "${t.matchingBio || 'N/A'}"`
        ).join('\n\n')}

        RULES:
        1. Act as an analytical human advisor. Compute a mental Match Score (0-100) weighing:
           - Subject/topic relevance (highest weight)
           - Tutor rating & sessions completed (reliability)
           - Cost efficiency against the student's budget
        2. Select the top 1 to 3 tutors that BEST fit the student's problem.
        3. Write a dynamic, highly analytical, human-like "reasoning" paragraph for EACH recommendation explaining EXACTLY why they are a great fit based on their metrics and the student's prompt. Do NOT be generic (e.g., instead of "Good fit", say "With a perfect 5.0 rating and a rate well within your budget, their specific focus on calculus makes them an ideal match for your derivatives problem.")
        4. Return ONLY a valid JSON object matching the format below. No other text.

        OUTPUT FORMAT:
        {
           "message": "A warm, analytical opening message from the AI explaining the search results comprehensively.",
           "recommendations": [
             {
               "tutor_id": "The _id of the tutor",
               "matchScore": 0-100,
               "reasoning": "Detailed, analytical reasoning (2-3 sentences) on why their metrics and skills fit."
             }
           ]
        }
        `;

        const result = await model.generateContent(promptTemplate);
        const rawResponse = result.response.text();
        
        // Robust JSON extraction
        let aiDecision;
        try {
            const jsonPart = rawResponse.substring(rawResponse.indexOf('{'), rawResponse.lastIndexOf('}') + 1);
            aiDecision = JSON.parse(jsonPart);
            logger.info(`[HYBRID AI] Match decision generated successfully for ${course}`);
        } catch (parseErr) {
            logger.error(`[HYBRID AI] Failed to parse AI JSON: ${rawResponse}`);
            throw new Error("AI output was malformed");
        }
        
        // Map the full tutor objects based on the recommendations
        const topRecommendations = (aiDecision?.recommendations || []).map((rec: any) => {
            const aiId = String(rec.tutor_id).trim();
            const t = candidates.find(cand => cand._id?.toString().trim() === aiId);
            if (!t) return null;
            return {
                tutor: t,
                matchScore: rec.matchScore || 80,
                reasoning: rec.reasoning || "Tutor expertise matches your request."
            };
        }).filter((r: any) => r !== null);

        res.status(200).json({
            message: aiDecision?.message || "I've analyzed the profiles and found some highly qualified tutors for you!",
            recommendations: topRecommendations.length > 0 ? topRecommendations : [{
                tutor: candidates[0],
                matchScore: 85,
                reasoning: "Matched based on our top database records and overall tutor performance metrics."
            }]
        });

    } catch (err: any) {
        logger.error(`[HYBRID AI] Critical Failure: ${err.message}`);
        // Panic Fallback: Return database matches so service doesn't "break" for user
        try {
            const candidates = await getTutorsForMatch(req.body.course || "", Number(req.body.budget) || undefined);
            res.status(200).json({
                message: "I found some highly qualified tutors who can help you with your course!",
                recommendations: candidates.slice(0, 3).map(c => ({
                    tutor: c,
                    reasoning: "Matched based on robust database records and tutor performance metrics.",
                    matchScore: 70
                })),
                error: true // Hint to frontend if needed
            });
        } catch (fallbackErr) {
            res.status(500).json({ message: "Engine failure. Please try again later." });
        }
    }
};
