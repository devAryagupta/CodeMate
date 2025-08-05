import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();

// ✅ CORRECT - Use gemini-1.5-flash for v1 API
const API_URL = "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent";
const API_KEY = process.env.GEMINI_API_KEY;

export async function callGeminiAPI({
  code,
  title,
  description,
  prompt,
  style = "default",
  previousHints = [],
}) {
  let systemPrompt = "";

  switch (style) {
    case "live":
      systemPrompt = `You are CodeMate, a  senior engineer, mentor, or code reviewer. The user is actively coding. 
      Provide a Guidance & step by step guidance,ANALYZE the user's current code progress and provide.
      Don't give solutions, just gentle guidance or encouragement.
       If their approach seems incorrect or inefficient, gently redirect them. to correct path.`;
      break;
    case "stepwise":
      systemPrompt = `You are CodeMate, an AI tutor. Provide a step-by-step approach without giving the full solution. 
      Break down the problem into logical steps the user should think about.`;
      break;
    case "keypoints":
      systemPrompt = `You are CodeMate, an AI tutor. Focus on key points, edge cases, and potential pitfalls 
      for this problem without revealing the solution.What learnings i need to take from it for the future.`;
      break;
    case "why":
      systemPrompt = `You are CodeMate, an AI tutor. Explain WHY certain data structures or algorithms 
      are recommended for this type of problem. Focus on the reasoning.
      what's your intutuion and though process behind this problem.how this approch comes in my mind.`;
      break;
    case "takeaways":
      systemPrompt = `You are CodeMate, an AI tutor. Provide takeaways about optimization, 
      alternative approaches, and time/space complexity analysis.`;
      break;
    case "stuck":
      systemPrompt = `You are CodeMate, an AI tutor. The user is stuck. Provide focused, specific hints 
      to help them move forward without giving away the solution.`;
      break;
    default:
      systemPrompt = `You are CodeMate, an AI tutor. Provide helpful hints without spoiling the solution.`;
  }

  const fullPrompt = `${systemPrompt}

Problem: ${title}
Description: ${description}

Current Code:
\`\`\`
${code}
\`\`\`

User Prompt: ${prompt}
${previousHints.length ? `\nPrevious Hints:\n${previousHints.join("\n---\n")}` : ""}
`.trim();

  const res = await fetch(`${API_URL}?key=${API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: fullPrompt }]
      }],
      generationConfig: {
        maxOutputTokens: style === "live" ? 100 : 512,
        temperature: style === "live" ? 0.3 : 0.7,
        candidateCount: 1
      }
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini API error: ${res.status} – ${err}`);
  }

  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "No hint generated.";
}