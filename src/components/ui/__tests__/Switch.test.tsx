import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Switch } from "../Switch";

describe("Switch", () => {
  it("exposes its state to assistive technology", () => {
    render(<Switch checked onChange={() => {}} label="Analytics" />);
    expect(screen.getByRole("switch", { name: "Analytics" })).toHaveAttribute("aria-checked", "true");
  });

  it("reports the new state when toggled", async () => {
    const onChange = vi.fn();
    render(<Switch checked={false} onChange={onChange} label="Analytics" />);

    await userEvent.click(screen.getByRole("switch", { name: "Analytics" }));

    expect(onChange).toHaveBeenCalledWith(true);
  });

  it("does nothing when disabled", async () => {
    const onChange = vi.fn();
    render(<Switch checked={false} onChange={onChange} label="Analytics" disabled />);

    await userEvent.click(screen.getByRole("switch", { name: "Analytics" }));

    expect(onChange).not.toHaveBeenCalled();
  });
});
