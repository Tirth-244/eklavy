import { GoogleGenerativeAI } from '@google/generative-ai';
import asyncHandler from '../utils/asyncHandler.js';

export const handleChat = asyncHandler(async (req, res) => {
  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ success: false, message: 'Message is required' });
  }

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ success: false, message: 'GEMINI_API_KEY is not configured in the backend .env file.' });
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({
    model: 'gemini-flash-lite-latest',
    systemInstruction: `You are an AI assistant for Eklavya, an educational platform for 11th and 12th Science students preparing for CBSE, JEE Mains, and NEET. 
Your purpose is to answer questions related to the website, courses (Physics, Chemistry, Mathematics, Biology), education, studying, and exams.
CRITICAL RULE: If the user asks a question that is NOT related to the website, these subjects, education, or studying, you MUST politely decline to answer and steer them back to educational topics.
RESPONSE FORMAT: Provide highly professional, structured, and beautifully formatted answers using Markdown. 
LENGTH CONSTRAINT: Your answers MUST be medium length. Do not write extremely long essays, but do not give one-sentence answers either. Aim for 2-3 short, concise paragraphs (around 3 to 5 sentences total). Use bullet points if listing information, and **bold** key terms.`
  });

  try {
    const result = await model.generateContentStream(message);
    
    // Explicitly disable buffering in Nginx and Express
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Critical for Nginx in Docker

    for await (const chunk of result.stream) {
      res.write(chunk.text());
    }
    res.end();
  } catch (error) {
    console.error('Gemini API Error:', error);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: 'Failed to get response from AI Chatbot.' });
    } else {
      res.end();
    }
  }
});
