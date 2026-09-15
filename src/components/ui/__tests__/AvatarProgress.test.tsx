import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { AvatarProgress } from "../AvatarProgress";

describe("AvatarProgress", () => {
  it("is just the avatar when nothing is uploading", () => {
    const { container } = render(<AvatarProgress username="maya" progress={0} state="idle" />);
    expect(container.querySelector("svg")).toBeNull();
    expect(screen.getByAltText("maya")).toBeInTheDocument();
  });

  it("draws the ring to the upload percentage", () => {
    render(<AvatarProgress username="maya" progress={40} state="active" />);
    const ring = screen.getByRole("img", { name: "Uploading 40%" });
    const arc = ring.querySelector("[data-testid=avatar-progress-arc]")!;
    const dash = Number(arc.getAttribute("stroke-dasharray"));
    const offset = Number(arc.getAttribute("stroke-dashoffset"));
    expect(offset / dash).toBeCloseTo(0.6, 5);
  });

  it("says the upload is paused while waiting for the network", () => {
    render(<AvatarProgress username="maya" progress={72.4} state="waiting" />);
    expect(screen.getByRole("img", { name: "Upload paused at 72%" })).toBeInTheDocument();
  });

  it("shows a full ring when the upload completes", () => {
    render(<AvatarProgress username="maya" progress={10} state="done" />);
    const arc = screen.getByRole("img", { name: "Upload complete" }).querySelector("[data-testid=avatar-progress-arc]")!;
    expect(Number(arc.getAttribute("stroke-dashoffset"))).toBeCloseTo(0, 5);
  });
});
