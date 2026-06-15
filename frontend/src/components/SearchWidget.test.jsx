import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import SearchWidget from "./SearchWidget";
import apiClient from "../api/client";
import "@testing-library/jest-dom";

// Mock axios/apiClient
jest.mock("../api/client");

// Mock Lucide icons to avoid rendering complexities in tests
jest.mock("lucide-react", () => ({
  Search: () => <div data-testid="search-icon" />,
  AlertCircle: () => <div data-testid="alert-icon" />,
  CheckCircle: () => <div data-testid="check-icon" />,
}));

const renderWithRouter = (ui) => {
  return render(ui, { wrapper: BrowserRouter });
};

describe("SearchWidget Component", () => {
  it("renders the search input", () => {
    renderWithRouter(<SearchWidget />);
    expect(screen.getByPlaceholderText(/type your question/i)).toBeInTheDocument();
  });

  it("updates input value on change", () => {
    renderWithRouter(<SearchWidget />);
    const input = screen.getByPlaceholderText(/type your question/i);
    fireEvent.change(input, { target: { value: "How to login?" } });
    expect(input.value).toBe("How to login?");
  });

  it("triggers API call on debounced input", async () => {
    apiClient.get.mockResolvedValue({
      data: {
        success: true,
        data: {
          action: "allow_post",
          matches: [],
          topScore: 0
        }
      }
    });

    renderWithRouter(<SearchWidget />);
    const input = screen.getByPlaceholderText(/type your question/i);
    
    fireEvent.change(input, { target: { value: "How to reset password?" } });
    
    // Wait for debounce and API call
    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalledWith("/search", expect.any(Object));
    }, { timeout: 1000 });
  });
});
