let pipeline;
let extractorInstance = null;

/**
 * Initializes and returns the Xenova pipeline extractor instance (Singleton).
 */
const getExtractor = async () => {
  if (!extractorInstance) {
    // Dynamic import/require of @xenova/transformers since it might load native modules
    if (!pipeline) {
      const transformers = require("@xenova/transformers");
      pipeline = transformers.pipeline;
    }
    // We use the feature-extraction pipeline with the all-MiniLM-L6-v2 model.
    extractorInstance = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
  }
  return extractorInstance;
};

/**
 * Generates a normalized 384-dimensional vector embedding for the input text.
 * @param {string} text - The input text to embed.
 * @returns {Promise<number[]>} A promise resolving to the vector embedding array.
 */
const generateEmbedding = async (text) => {
  const normalizedText = String(text || "").trim();
  if (!normalizedText) {
    throw new Error("Embedding text input cannot be empty.");
  }

  const extractor = await getExtractor();
  // Perform feature extraction with mean pooling and normalization
  const output = await extractor(normalizedText, {
    pooling: "mean",
    normalize: true,
  });

  // Convert tensor output data to standard JavaScript array
  return Array.from(output.data);
};

module.exports = {
  generateEmbedding,
};
