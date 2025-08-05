import express from "express";
import { callGeminiAPI } from "../utils/gemini.js"; // your Gemini helper

const router = express.Router();

router.post("/", async (req, res) => {
  const { code, prompt, title, description, hintType, progressStage, previousHints } = req.body;
  try {
    let hint;
    switch (hintType) {
      case "stepwise":
        hint = await callGeminiAPI({ code, title, description, prompt, style: "stepwise" });
        break;
      case "keypoints":
        hint = await callGeminiAPI({ code, title, description, prompt, style: "keypoints" });
        break;
      case "why":
        hint = await callGeminiAPI({ code, title, description, prompt, style: "why" });
        break;
      case "takeaways":
        hint = await callGeminiAPI({ code, title, description, prompt, style: "takeaways" });
        break;
      case "live":
        hint = await callGeminiAPI({ code, title, description, prompt, style: "live" });
        break;
      case "stuck":
        hint = await callGeminiAPI({ code, title, description, prompt, style: "stuck" });
        break;
      default:
        hint = await callGeminiAPI({ code, title, description, prompt });
    }
    res.json({ hint });
  } catch (err) {
    console.error("Error generating hint:", err);
    res.status(500).json({ error: "Failed to generate hint." });
  }
});

export default router;