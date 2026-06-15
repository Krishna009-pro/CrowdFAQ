// This file is the entry point for the application.
// We use a dynamic import for the bootstrap file to allow Webpack Module Federation
// to initialize shared modules (like React) before the application code runs.
// This prevents the "Shared module is not available for eager consumption" error.

import("./bootstrap").catch((err) => {
  console.error("Failed to load bootstrap:", err);
  const rootElement = document.getElementById("root");
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="max-width: 800px; margin: 50px auto; border: 1px solid #ef4444; background: #450a0a; color: white; padding: 20px; border-radius: 8px; font-family: sans-serif;">
        <h1 style="font-size: 20px; margin: 0 0 10px;">Frontend initialization error</h1>
        <p>The application failed to initialize Module Federation modules.</p>
        <pre style="white-space: pre-wrap; font-size: 13px; background: #000; padding: 10px; border-radius: 4px;">${err.message}</pre>
      </div>
    `;
  }
});

