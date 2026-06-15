const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const User = require("./models/User");
const Question = require("./models/Question");
const Answer = require("./models/Answer");

const faqData = [
  {
    title: "How do I reset my password?",
    body: "I forgot my password and need to reset it. What are the steps?",
    answer: "To reset your password, click on 'Forgot Password' on the login page, enter your email, and follow the instructions sent to your inbox."
  },
  {
    title: "What are the system requirements?",
    body: "What are the minimum system requirements to use this platform?",
    answer: "The platform works on any modern browser (Chrome, Firefox, Safari, Edge) and devices with an internet connection."
  },
  {
    title: "How do I create an account?",
    body: "How can I sign up for a new account?",
    answer: "Click the 'Sign Up' button on the homepage, fill in your details, and verify your email address."
  },
  {
    title: "Is my data secure?",
    body: "How secure is my personal information on this platform?",
    answer: "We use industry-standard encryption (SSL/TLS) and follow GDPR compliance standards to protect your data."
  },
  {
    title: "Can I delete my account?",
    body: "How do I permanently delete my account?",
    answer: "Go to Settings > Account > Delete Account. Your data will be permanently removed after 30 days."
  },
  {
    title: "How do I post a question?",
    body: "What's the process for asking a question on the platform?",
    answer: "Use the search bar to check for similar questions first, then click 'Ask a Question' if your question is unique."
  },
  {
    title: "Can I edit my question after posting?",
    body: "Is it possible to edit a question I've already posted?",
    answer: "Yes, you can edit your question for 24 hours after posting. Click the edit icon on your question."
  },
  {
    title: "How does the reputation system work?",
    body: "How can I earn reputation points?",
    answer: "You earn reputation by answering questions, getting upvotes, and having answers marked as accepted."
  },
  {
    title: "What does the verified badge mean?",
    body: "What indicates that an answer is verified or official?",
    answer: "The verified badge means the answer was reviewed and approved by a moderator or official system representative."
  },
  {
    title: "How do I report inappropriate content?",
    body: "How can I report questions or answers that violate community guidelines?",
    answer: "Click the three-dot menu on any question or answer and select 'Report'. Our team will review it within 24 hours."
  }
];

async function seedDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/faq-vled");
    console.log("Connected to MongoDB");

    // Clear existing data
    await Question.deleteMany({});
    await Answer.deleteMany({});
    await User.deleteMany({});
    console.log("Cleared existing data");

    // Create admin user
    const adminUser = await User.create({
      displayName: "System Admin",
      email: "admin@faq-vled.local",
      role: "admin",
      reputationScore: 1000,
      badges: ["verified", "founder"]
    });
    console.log(`Created admin user: ${adminUser._id}`);

    // Seed FAQ questions with answers
    let questionCount = 0;
    for (const faq of faqData) {
      const question = await Question.create({
        title: faq.title,
        body: faq.body,
        author: adminUser._id,
        tags: ["faq", "common"],
        status: "verified"
      });

      const answer = await Answer.create({
        question: question._id,
        author: adminUser._id,
        body: faq.answer,
        aiGenerated: false,
        isAccepted: true,
        upvoteCount: 5
      });

      question.acceptedAnswerId = answer._id;
      await question.save();
      questionCount++;
    }

    console.log(`✅ Seeded ${questionCount} FAQ questions with verified answers`);
    console.log("✅ Database initialization complete!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding database:", error.message);
    process.exit(1);
  }
}

seedDatabase();
