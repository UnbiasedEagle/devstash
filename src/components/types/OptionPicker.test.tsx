// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it } from "vitest";
import OptionPicker from "@/components/types/OptionPicker";

afterEach(cleanup);

const OPTIONS = ["red", "green", "blue"].map((value) => ({
  value,
  label: value,
  content: value,
}));

function Harness({ initial = "red" }: { initial?: string }) {
  const [value, setValue] = useState(initial);
  return (
    <OptionPicker
      label="Color"
      options={OPTIONS}
      value={value}
      onChange={setValue}
    />
  );
}

describe("OptionPicker", () => {
  it("is a labelled radio group with the current choice checked", () => {
    render(<Harness initial="green" />);

    const group = screen.getByRole("radiogroup", { name: "Color" });
    expect(group).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "green" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "red" })).not.toBeChecked();
  });

  it("is one tab stop, on the checked choice", () => {
    render(<Harness initial="green" />);

    expect(screen.getByRole("radio", { name: "green" })).toHaveAttribute(
      "tabindex",
      "0",
    );
    expect(screen.getByRole("radio", { name: "red" })).toHaveAttribute(
      "tabindex",
      "-1",
    );
  });

  it("moves the choice with the arrow keys and wraps around", () => {
    render(<Harness initial="blue" />);

    const blue = screen.getByRole("radio", { name: "blue" });
    blue.focus();
    fireEvent.keyDown(blue, { key: "ArrowRight" });

    expect(screen.getByRole("radio", { name: "red" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "red" })).toHaveFocus();

    fireEvent.keyDown(screen.getByRole("radio", { name: "red" }), {
      key: "ArrowLeft",
    });
    expect(screen.getByRole("radio", { name: "blue" })).toBeChecked();
  });
});
