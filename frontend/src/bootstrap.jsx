import React from "react";
import { createRoot } from "react-dom/client";

import App from "./App";
import "./styles.css";

const rootElement = document.getElementById("root");
const root = createRoot(rootElement);

try {
  root.render(<App />);
} catch (error) {
  rootElement.innerHTML = `
    <div style="max-width: 900px; margin: 0 auto; border: 1px solid #ef4444; background: #450a0a; color: white; padding: 16px; border-radius: 8px;">
      <h1 style="font-size: 20px; margin: 0 0 8px;">React render error</h1>
      <pre style="white-space: pre-wrap; font-size: 13px;">${error.message}</pre>
    </div>
  `;
}
