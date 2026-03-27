const express = require("express");
const fetch = require("node-fetch");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4.1";
const CLAUDE_MODEL = process.env.CLAUDE_MODEL || "claude-3-5-sonnet-20241022";
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-1.5-pro";

const OPENAI_KEY = process.env.OPENAI_API_KEY;
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
const GEMINI_KEY = process.env.GEMINI_API_KEY;

app.post("/ask", async (req, res) => {
  const { prompt } = req.body;

  try {
    const gptRes = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        input: `You are a strategic thinker. Answer: ${prompt}`
      })
    });
    const gptData = await gptRes.json();
    const gptOutput = gptData.output_text;

    const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_KEY,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: 1000,
        messages: [
          { role: "user", content: `Critique this:\n${gptOutput}` }
        ]
      })
    });
    const claudeData = await claudeRes.json();
    const claudeOutput = claudeData.content?.[0]?.text || "";

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: `Add research insights:\n${prompt}` }]
            }
          ]
        })
      }
    );
    const geminiData = await geminiRes.json();
    const geminiOutput =
      geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "";

    const finalRes = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        input: `
Combine these into one high-quality answer:

Strategy:
${gptOutput}

Critique:
${claudeOutput}

Research:
${geminiOutput}
        `
      })
    });
    const finalData = await finalRes.json();

    res.json({
      strategy: gptOutput,
      critique: claudeOutput,
      research: geminiOutput,
      final: finalData.output_text
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/", (req, res) => {
  res.send("AI Council running");
});

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
