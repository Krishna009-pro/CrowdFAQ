const { GoogleGenerativeAI } = require("@google/generative-ai");

const GEMINI_MODEL = "gemini-1.5-flash";
const AVAILABLE_CATEGORIES = [
  "Admissions",
  "Placements",
  "Internships",
  "Scholarships",
  "Academics",
  "Examinations",
  "Hostel",
  "General"
];

let genAI = null;

const getGenAI = () => {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not defined in the environment variables.");
    }
    genAI = new GoogleGenerativeAI(apiKey);
  }
  return genAI;
};

/**
 * Robust execution wrapper with timeout, retry logic, and rate limit handling.
 */
const executeWithRetry = async (apiCall, retries = 3, initialDelay = 1000) => {
  let delay = initialDelay;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      // 15 seconds timeout
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Gemini API request timed out")), 15000)
      );
      const result = await Promise.race([apiCall(), timeoutPromise]);
      return result;
    } catch (error) {
      console.error(`Gemini Service Attempt ${attempt} failed: ${error.message}`);
      
      const isRateLimit = error.status === 429 || error.message.includes("429") || error.message.includes("Quota");
      
      if (attempt === retries) {
        throw error;
      }
      
      // Exponential backoff
      const waitTime = isRateLimit ? delay * 3 : delay;
      await new Promise((resolve) => setTimeout(resolve, waitTime));
      delay *= 2;
    }
  }
};

/**
 * Task 2: Auto Category and Tag Suggestion.
 * Input: title, description (body)
 * Output: { category: string, tags: string[] }
 */
const generateAutoTagsAndCategory = async (title, description) => {
  const model = getGenAI().getGenerativeModel({ model: GEMINI_MODEL });
  
  const prompt = `
  You are an AI tagging assistant for an academic and community Q&A FAQ portal.
  Given the following question title and description, select the most relevant category from the available categories list, and suggest between 3 to 5 appropriate, clean tags (lowercase, hyphenated if multi-word, no special characters).

  Available Categories:
  ${JSON.stringify(AVAILABLE_CATEGORIES)}

  Question Title: "${title}"
  Question Description: "${description}"

  Respond strictly with a JSON object in the following format, with no markdown formatting, no backticks:
  {
    "category": "Selected Category",
    "tags": ["tag1", "tag2", "tag3"]
  }
  `;

  const responseText = await executeWithRetry(async () => {
    const result = await model.generateContent(prompt);
    return result.response.text();
  });

  try {
    const cleanedText = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(cleanedText);
    
    // Validate the category. If invalid, fall back to "General"
    let category = parsed.category || "General";
    if (!AVAILABLE_CATEGORIES.includes(category)) {
      category = "General";
    }

    const tags = Array.isArray(parsed.tags) 
      ? parsed.tags.map(t => String(t).toLowerCase().replace(/[^a-z0-9-]/g, "").trim()).filter(Boolean)
      : [];

    return { category, tags };
  } catch (err) {
    console.error("Failed to parse Gemini tags/category JSON response:", responseText, err);
    return { category: "General", tags: ["general"] };
  }
};

/**
 * Task 1 wrappers for specific fields as requested by Task 1 / 2 interface
 */
const generateCategory = async (title, description) => {
  const result = await generateAutoTagsAndCategory(title, description);
  return result.category;
};

const generateTags = async (title, description) => {
  const result = await generateAutoTagsAndCategory(title, description);
  return result.tags;
};

/**
 * Task 3: Answer Thread Summarization
 * Compiles a question and its answers into a 3-sentence summary.
 */
const generateThreadSummary = async (questionTitle, questionBody, answers) => {
  if (!answers || answers.length === 0) {
    return "No answers have been posted for this question yet.";
  }

  const model = getGenAI().getGenerativeModel({ model: GEMINI_MODEL });

  const answersList = answers.map((ans, idx) => `Answer ${idx + 1}: ${ans.body}`).join("\n\n");

  const prompt = `
  You are an AI summary assistant.
  Summarize the discussion thread below into exactly 3 sentences.
  The summary must be concise, neutral, strictly factual, and remove any duplicate statements or greetings.
  Do not include links, emails, names, or make up details that are not in the text.

  Question Title: "${questionTitle}"
  Question Body: "${questionBody}"

  Community Answers:
  ${answersList}

  Respond with the 3-sentence summary text only.
  `;

  const responseText = await executeWithRetry(async () => {
    const result = await model.generateContent(prompt);
    return result.response.text();
  });

  return responseText.trim();
};

// Task 1 wrapper naming alias
const generateSummary = async (questionTitle, questionBody, answers) => {
  return generateThreadSummary(questionTitle, questionBody, answers);
};

/**
 * Task 8 & 9: RAG Response generation.
 * Constructs response strictly using retrieved context QA and user query.
 */
const generateRAGResponse = async (query, contextQuestions) => {
  const model = getGenAI().getGenerativeModel({ model: GEMINI_MODEL });

  let contextText = "";
  if (contextQuestions && contextQuestions.length > 0) {
    contextText = contextQuestions.map((q, idx) => {
      const qAnswers = q.answers && q.answers.length > 0 
        ? q.answers.map(a => `- ${a.body}`).join("\n")
        : "- No answers available.";
      return `[Context Document ${idx + 1}]
Question: ${q.title}
Details: ${q.body}
Answers:
${qAnswers}`;
    }).join("\n\n");
  }

  const prompt = `
  You are a helpful student support chatbot assistant for the CrowdFAQ portal.
  Answer the user's query strictly using the provided Context Documents below.

  Rules:
  1. Ground all statements in the context. Do not make up facts, URLs, dates, or contact details.
  2. If the context does not contain enough information to answer the question, respond exactly with "No relevant information found."
  3. Keep the answer professional, concise, clear, and action-oriented.

  Provided Context Documents:
  ${contextText || "No context documents found."}

  User Query: "${query}"

  Answer:
  `;

  const responseText = await executeWithRetry(async () => {
    const result = await model.generateContent(prompt);
    return result.response.text();
  });

  return responseText.trim();
};

/**
 * Task 1 wrapper for generic completions
 */
const chatCompletion = async (prompt) => {
  const model = getGenAI().getGenerativeModel({ model: GEMINI_MODEL });
  const responseText = await executeWithRetry(async () => {
    const result = await model.generateContent(prompt);
    return result.response.text();
  });
  return responseText.trim();
};

module.exports = {
  generateAutoTagsAndCategory,
  generateCategory,
  generateTags,
  generateThreadSummary,
  generateSummary,
  generateRAGResponse,
  chatCompletion,
};
