const mockGenerateContent = jest.fn().mockImplementation((prompt) => {
  if (prompt.includes("category") || prompt.includes("tags")) {
    return {
      response: {
        text: () => JSON.stringify({
          category: "Internships",
          tags: ["iit-ropar", "internship", "application", "students"],
        }),
      },
    };
  }

  if (prompt.includes("summary") || prompt.includes("Summarize")) {
    return {
      response: {
        text: () => "This is a mock 3-sentence summary of the answer thread. It is completely neutral and factual. Duplications have been removed.",
      },
    };
  }

  // RAG response or chat Completion
  return {
    response: {
      text: () => "This is a mock response from Gemini grounded in the provided context questions.",
    },
  };
});

const mockGetGenerativeModel = jest.fn().mockReturnValue({
  generateContent: mockGenerateContent,
});

class MockGoogleGenerativeAI {
  constructor(apiKey) {
    this.apiKey = apiKey;
  }
  getGenerativeModel(options) {
    return mockGetGenerativeModel(options);
  }
}

module.exports = {
  GoogleGenerativeAI: MockGoogleGenerativeAI,
  mockGenerateContent,
  mockGetGenerativeModel,
};
