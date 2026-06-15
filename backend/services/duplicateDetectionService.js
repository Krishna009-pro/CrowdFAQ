const Question = require("../models/Question");
const embeddingService = require("./embeddingService");

/**
 * Checks if a question title matches any existing questions using vector search.
 * @param {string} title - The question title to check.
 * @returns {Promise<object>} Duplicate check result containing matching questions and similarity score.
 */
const checkDuplicates = async (title) => {
  const normalizedTitle = String(title || "").trim();
  if (!normalizedTitle) {
    return { duplicates: [] };
  }

  let queryVector;
  try {
    queryVector = await embeddingService.generateEmbedding(normalizedTitle);
  } catch (err) {
    console.error("Failed to generate embedding for duplicate detection:", err.message);
    return { duplicates: [] };
  }

  let matches = [];
  try {
    matches = await Question.aggregate([
      {
        $vectorSearch: {
          index: "vector_index_384",
          path: "embedding",
          queryVector: queryVector,
          numCandidates: 50,
          limit: 5,
        },
      },
      {
        $project: {
          title: 1,
          body: 1,
          tags: 1,
          status: 1,
          author: 1,
          createdAt: 1,
          score: { $meta: "vectorSearchScore" },
        },
      },
    ]);
  } catch (err) {
    console.warn("Atlas Vector Search failed for duplicate detection, using text search fallback:", err.message);
    
    // Split the title into words to construct a broad regex search
    const words = normalizedTitle.split(/\s+/).filter(w => w.length > 2);
    const regexPattern = words.length > 0 ? words.join("|") : normalizedTitle;
    
    const textMatches = await Question.find({
      title: { $regex: regexPattern, $options: "i" },
    })
      .limit(5)
      .lean();

    matches = textMatches.map((doc) => ({
      ...doc,
      score: 0.9, // Synthetic high score for keyword matches
    }));
  }

  // Filter based on score > 0.85
  const duplicates = matches
    .filter((doc) => doc.score > 0.85)
    .slice(0, 5);

  if (duplicates.length === 0) {
    return { duplicates: [] };
  }

  const similarityScore = duplicates[0].score;

  return {
    duplicates,
    similarityScore,
  };
};

module.exports = {
  checkDuplicates,
};
