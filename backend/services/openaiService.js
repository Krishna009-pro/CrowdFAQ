const OpenAI = require("openai");

const EMBEDDING_MODEL = "text-embedding-3-small";
const DRAFT_MODEL = "gpt-4o-mini";

let openai;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

const requireOpenAiApiKey = () => {
  if (!process.env.OPENAI_API_KEY) {
    const error = new Error("OPENAI_API_KEY is required");
    error.statusCode = 503;
    throw error;
  }
};

const generateEmbedding = async (input) => {
  requireOpenAiApiKey();

  const normalizedInput = String(input || "").trim();
  if (!normalizedInput) {
    const error = new Error("Embedding input is required");
    error.statusCode = 400;
    throw error;
  }

  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: normalizedInput,
  });

  return response.data[0].embedding;
};

const generateProvisionalDraft = async ({ title, body, tags = [] }) => {
  requireOpenAiApiKey();

  const response = await openai.chat.completions.create({
    model: DRAFT_MODEL,
    temperature: 0.2,
    messages: [
      {
        role: "system",
        content:
          "You are Samagama AQ Portal's student support drafting assistant. Draft concise, provisional answers for student questions. Use a calm, helpful, institution-neutral tone. Do not invent policies, deadlines, fees, eligibility rules, contact details, links, or personal data. If the answer depends on official policy or missing context, clearly state that a moderator must verify it. Never present the draft as final or verified. Keep the response actionable and under 180 words.",
      },
      {
        role: "user",
        content: JSON.stringify({
          title,
          body,
          tags,
        }),
      },
    ],
  });

  return response.choices[0].message.content.trim();
};

module.exports = {
  generateEmbedding,
  generateProvisionalDraft,
};
