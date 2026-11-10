// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import TypeFormDialog from "@/components/types/TypeFormDialog";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

afterEach(cleanup);

function renderDialog(onSubmit = vi.fn().mockResolvedValue({ success: true })) {
  render(
    <TypeFormDialog
      title="New type"
      description="Add your own kind of item."
      initialValues={{ name: "", icon: "BookOpen", color: "#ef4444" }}
      submitLabel="Create type"
      pendingLabel="Creating..."
      successMessage="Type created"
      onSubmit={onSubmit}
      renderTrigger={(open) => <button onClick={open}>Open form</button>}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: "Open form" }));
  return onSubmit;
}

describe("TypeFormDialog", () => {
  it("names the icons and colors in words, not component names or hex codes", () => {
    renderDialog();

    expect(screen.getByRole("radio", { name: "Rocket" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Book" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "Red" })).toBeChecked();
    expect(screen.queryByRole("radio", { name: "#ef4444" })).toBeNull();
  });

  it("shows the typed name and the chosen icon and color in the preview", () => {
    renderDialog();

    fireEvent.change(screen.getByRole("textbox", { name: "Name" }), {
      target: { value: "Recipe" },
    });

    expect(screen.getByText("Recipe")).toBeInTheDocument();
  });

  it("shows the name error and does not submit an invalid name", () => {
    const onSubmit = renderDialog();

    fireEvent.change(screen.getByRole("textbox", { name: "Name" }), {
      target: { value: "two words" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create type" }));

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Use only letters, numbers and hyphens",
    );
    expect(screen.getByRole("textbox", { name: "Name" })).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("submits the chosen values", async () => {
    const onSubmit = renderDialog();

    fireEvent.change(screen.getByRole("textbox", { name: "Name" }), {
      target: { value: "Recipe" },
    });
    fireEvent.click(screen.getByRole("radio", { name: "Rocket" }));
    fireEvent.click(screen.getByRole("radio", { name: "Teal" }));
    fireEvent.click(screen.getByRole("button", { name: "Create type" }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({
        name: "Recipe",
        icon: "Rocket",
        color: "#14b8a6",
      }),
    );
  });
});
