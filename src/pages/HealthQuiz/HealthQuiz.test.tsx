import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import React from "react";
import HealthQuiz from "./index";
import AllProviders from "@/test/AllProviders";

describe("HealthQuiz Component", () => {
  it("renders first question in the quiz flow", () => {
    render(
      <AllProviders>
        <HealthQuiz />
      </AllProviders>
    );

    expect(screen.getByText(/Assessment Quiz/i)).toBeInTheDocument();
    expect(screen.getByText("Question 1 of 3")).toBeInTheDocument();
    expect(screen.getByText("What is your weekly physical activity level?")).toBeInTheDocument();
  });

  it("advances quiz on clicking option", async () => {
    render(
      <AllProviders>
        <HealthQuiz />
      </AllProviders>
    );

    const btnOption = screen.getByText(/Highly active/i);
    fireEvent.click(btnOption);

    // Should move to question 2
    expect(screen.getByText("Question 2 of 3")).toBeInTheDocument();
  });
});