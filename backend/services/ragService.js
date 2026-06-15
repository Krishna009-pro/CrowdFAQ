const Question = require("../models/Question");
const Answer = require("../models/Answer");
const embeddingService = require("./embeddingService");
const geminiService = require("./geminiService");

/**
 * Executes the RAG pipeline to answer user questions using existing knowledge.
 * @param {string} query - The search query.
 * @returns {Promise<string>} The generated answer from Gemini grounded in context.
 */
const generateRAGAnswer = async (query) => {
  const normalizedQuery = String(query || "").trim();
  if (!normalizedQuery) {
    return "No relevant information found.";
  }

  let queryVector;
  try {
    queryVector = await embeddingService.generateEmbedding(normalizedQuery);
  } catch (err) {
    console.error("Failed to generate embedding for RAG query:", err.message);
    return "No relevant information found.";
  }

  let matchedQuestions = [];
  try {
    matchedQuestions = await Question.aggregate([
      {
        $vectorSearch: {
          index: "vector_index_384",
          path: "embedding",
          queryVector: queryVector,
          numCandidates: 30,
          limit: 3,
        },
      },
      {
        $project: {
          title: 1,
          body: 1,
          score: { $meta: "vectorSearchScore" },
        },
      },
    ]);
  } catch (err) {
    console.warn("Atlas Vector Search failed for RAG, using text search fallback:", err.message);
    
    // Text search fallback
    const words = normalizedQuery.split(/\s+/).filter(w => w.length > 2);
    const regexPattern = words.length > 0 ? words.join("|") : normalizedQuery;
    
    matchedQuestions = await Question.find({
      $or: [
        { title: { $regex: regexPattern, $options: "i" } },
        { body: { $regex: regexPattern, $options: "i" } },
      ],
      isHidden: { $ne: true },
    })
      .limit(3)
      .select("title body")
      .lean();
  }

  if (matchedQuestions.length === 0) {
    return "No relevant information found.";
  }

  // STEP 3: Collect top answers for each matching question
  const contextQuestions = await Promise.all(
    matchedQuestions.map(async (q) => {
      const answers = await Answer.find({ question: q._id, isHidden: { $ne: true } })
        .sort({ isOfficial: -1, isAccepted: -1, upvoteCount: -1 })
        .limit(3)
        .lean();
      return {
        title: q.title,
        body: q.body,
        answers: answers,
      };
    })
  );

  // Filter out questions with no context/answers if we want strictly answered questions,
  // but even questions alone can sometimes provide context. We will let the prompt handle it.
  const hasAnswers = contextQuestions.some(q => q.answers && q.answers.length > 0);
  if (!hasAnswers) {
    return "No relevant information found.";
  }

  // STEP 4, 5, 6: Construct context prompt, query Gemini, and return the answer
  try {
    const answer = await geminiService.generateRAGResponse(normalizedQuery, contextQuestions);
    return answer;
  } catch (err) {
    console.error("Gemini RAG response generation failed:", err.message);
    return "No relevant information found.";
  }
};

module.exports = {
  generateRAGAnswer,
};
