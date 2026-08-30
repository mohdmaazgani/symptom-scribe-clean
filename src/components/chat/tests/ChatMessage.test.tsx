import { describe, it, expect } from "vitest";
import { render, screen } from "@/test/utils";
import ChatMessage from "../ChatMessage";

describe("ChatMessage Component XSS Prevention", () => {
  it("renders assistant message with HTML payload as escaped text and does not render <img> element", () => {
    const payload = '<img src="x" onerror="alert(1)">';
    const { container } = render(<ChatMessage role="assistant" content={payload} />);

    // Assert that the text is present
    expect(screen.getByText((content) => content.includes(payload))).toBeInTheDocument();

    // Assert that no <img> element with src="x" exists
    expect(container.querySelector('img[src="x"]')).toBeNull();
  });

  it("renders user message with script tag as escaped text and does not render <script> element", () => {
    const payload = '<script>alert("xss")</script>';
    const { container } = render(<ChatMessage role="user" content={payload} />);

    expect(screen.getByText((content) => content.includes(payload))).toBeInTheDocument();
    expect(container.querySelector("script")).toBeNull();
  });

  it("renders dangerous iframe and svg tags as plain escaped text", () => {
    const payload = '<iframe src="javascript:alert(1)"></iframe><svg onload="alert(1)"></svg>';
    const { container } = render(<ChatMessage role="assistant" content={payload} />);

    expect(container.querySelector("iframe")).toBeNull();
    expect(container.querySelector("svg.lucide-bot")).not.toBeNull(); // Only avatar icon SVG
    expect(container.querySelector("svg[onload]")).toBeNull();
    expect(container.textContent).toContain('<iframe src="javascript:alert(1)"></iframe>');
  });

  it("renders standard markdown formatted elements safely", () => {
    const content = "### Recommendations\n**Bold text**\n- Bullet 1\n- Bullet 2";
    const { container } = render(<ChatMessage role="assistant" content={content} />);

    expect(screen.getByText("Bold text")).toBeInTheDocument();
    expect(screen.getByText("Bullet 1")).toBeInTheDocument();
    expect(screen.getByText("Bullet 2")).toBeInTheDocument();
    expect(container.querySelectorAll("li")).toHaveLength(2);
  });
});
