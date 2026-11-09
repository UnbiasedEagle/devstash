// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import {
  cleanup,
  createEvent,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import FileField from "@/components/items/FileField";

afterEach(cleanup);

function setup(props: Partial<Parameters<typeof FileField>[0]> = {}) {
  const onChange = vi.fn();
  const view = render(
    <FileField
      id="file"
      kind="image"
      file={null}
      progress={null}
      onChange={onChange}
      {...props}
    />,
  );
  const input =
    view.container.querySelector<HTMLInputElement>('input[type="file"]')!;
  const zone = view.container.querySelector<HTMLElement>(".border-dashed")!;
  return { onChange, input, zone };
}

const png = new File(["x"], "shot.png", { type: "image/png" });

describe("FileField", () => {
  it("offers an image and states what is allowed", () => {
    setup({ kind: "image" });

    expect(
      screen.getByRole("button", { name: "Choose image" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/PNG, JPEG, GIF or WebP, up to 5 MB/),
    ).toBeVisible();
  });

  it("offers a file and states what is allowed", () => {
    setup({ kind: "file" });

    expect(
      screen.getByRole("button", { name: "Choose file" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/PDF, text, Markdown.*up to 10 MB/)).toBeVisible();
  });

  it("only lets the picker offer what the rules allow", () => {
    const { input } = setup({ kind: "image" });

    expect(input).toHaveAttribute("accept", ".png,.jpg,.jpeg,.gif,.webp");
  });

  it("reports the file chosen through the picker", async () => {
    const { input, onChange } = setup();

    await userEvent.upload(input, png);

    expect(onChange).toHaveBeenCalledWith(png);
  });

  it("reports the first file dropped on it", () => {
    const { zone, onChange } = setup();
    const second = new File(["y"], "other.png", { type: "image/png" });

    fireEvent.drop(zone, { dataTransfer: { files: [png, second] } });

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(png);
  });

  it("ignores a drop while it is disabled", () => {
    const { zone, onChange } = setup({ disabled: true });

    fireEvent.drop(zone, { dataTransfer: { files: [png] } });

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Choose image" })).toBeDisabled();
  });

  it("shows the chosen file's name and size and lets it be removed", async () => {
    const { onChange } = setup({
      file: new File(["x".repeat(2048)], "shot.png", { type: "image/png" }),
    });

    expect(screen.getByText("shot.png")).toBeVisible();
    expect(screen.getByText("2.0 KB")).toBeVisible();
    expect(
      screen.queryByRole("button", { name: "Choose image" }),
    ).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Remove file" }));

    expect(onChange).toHaveBeenCalledWith(null);
  });

  it("can't remove the file while it is uploading", () => {
    setup({ file: png, disabled: true, progress: 40 });

    expect(screen.getByRole("button", { name: "Remove file" })).toBeDisabled();
  });

  it("shows how far the upload has got", () => {
    setup({ file: png, progress: 40 });

    const bar = screen.getByRole("progressbar", { name: "Upload progress" });
    expect(bar).toHaveAttribute("value", "40");
  });

  it("shows no progress bar when nothing is uploading", () => {
    setup({ file: png, progress: null });

    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
  });

  it("shows an error", () => {
    setup({ error: "Images can be at most 5 MB" });

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Images can be at most 5 MB",
    );
  });

  describe("as a labelled group", () => {
    it("is named after what it takes", () => {
      setup({ kind: "image" });
      expect(screen.getByRole("group", { name: "Image" })).toBeInTheDocument();
      cleanup();

      setup({ kind: "file" });
      expect(screen.getByRole("group", { name: "File" })).toBeInTheDocument();
    });

    it("describes itself with the hint, and the error when there is one", () => {
      setup();
      expect(screen.getByRole("group")).toHaveAttribute(
        "aria-describedby",
        "file-hint",
      );
      cleanup();

      setup({ error: "Images can be at most 5 MB" });
      expect(screen.getByRole("group")).toHaveAttribute(
        "aria-describedby",
        "file-hint file-error",
      );
    });

    it("keeps the description while a file is shown and the choose button is gone", () => {
      setup({ file: png, error: "Images can be at most 5 MB" });

      expect(screen.getByRole("group")).toHaveAttribute(
        "aria-describedby",
        "file-hint file-error",
      );
    });

    it("can be focused by id, which is what the form does for a field with an error", () => {
      setup({ file: png });

      const group = document.getElementById("file")!;
      group.focus();

      expect(group).toHaveFocus();
    });
  });

  describe("announcing progress", () => {
    it("says nothing when nothing is uploading", () => {
      setup({ file: png, progress: null });

      expect(screen.getByRole("status")).toBeEmptyDOMElement();
    });

    it.each([
      [0, "Uploading 0%"],
      [24, "Uploading 0%"],
      [25, "Uploading 25%"],
      [72, "Uploading 50%"],
      [100, "Uploading 100%"],
    ])("reads %d%% out as %s, in quarters", (progress, announced) => {
      setup({ file: png, progress });

      expect(screen.getByRole("status")).toHaveTextContent(announced);
    });
  });

  describe("drag highlight", () => {
    it("lights up while a file is dragged over and goes off when it leaves", () => {
      const { zone } = setup();

      fireEvent.dragOver(zone);
      expect(zone).toHaveClass("border-ring");

      fireEvent.dragLeave(zone, { relatedTarget: document.body });
      expect(zone).not.toHaveClass("border-ring");
    });

    it("stays lit when the pointer only moves onto something inside the zone", () => {
      const { zone } = setup();
      const inside = screen.getByRole("button", { name: "Choose image" });
      // jsdom drops relatedTarget from the init of a drag event, so it is set on the event itself
      const leave = createEvent.dragLeave(zone);
      Object.defineProperty(leave, "relatedTarget", { value: inside });

      fireEvent.dragOver(zone);
      fireEvent(zone, leave);

      expect(zone).toHaveClass("border-ring");
    });

    it("doesn't light up while disabled", () => {
      const { zone } = setup({ disabled: true });

      fireEvent.dragOver(zone);

      expect(zone).not.toHaveClass("border-ring");
    });
  });

  describe("keyboard focus", () => {
    function Harness() {
      const [file, setFile] = useState<File | null>(null);
      return (
        <FileField
          id="file"
          kind="image"
          file={file}
          progress={null}
          onChange={setFile}
        />
      );
    }

    // userEvent.upload moves focus onto the hidden input itself after the change, which a real browser doesn't, so the change event is sent directly
    function pick(container: HTMLElement, file: File) {
      const input =
        container.querySelector<HTMLInputElement>('input[type="file"]')!;
      fireEvent.change(input, { target: { files: [file] } });
    }

    it("moves to the Remove button after a file is chosen, instead of falling to the page", () => {
      const { container } = render(<Harness />);
      screen.getByRole("button", { name: "Choose image" }).focus();

      pick(container, png);

      expect(screen.getByRole("button", { name: "Remove file" })).toHaveFocus();
    });

    it("moves back to the Choose button after the file is removed", async () => {
      const { container } = render(<Harness />);
      pick(container, png);

      await userEvent.click(
        screen.getByRole("button", { name: "Remove file" }),
      );

      expect(
        screen.getByRole("button", { name: "Choose image" }),
      ).toHaveFocus();
    });

    it("doesn't take focus when the file is cleared from outside", () => {
      const { rerender } = render(
        <>
          <button>Elsewhere</button>
          <FileField
            id="file"
            kind="image"
            file={png}
            progress={null}
            onChange={vi.fn()}
          />
        </>,
      );
      screen.getByRole("button", { name: "Elsewhere" }).focus();

      rerender(
        <>
          <button>Elsewhere</button>
          <FileField
            id="file"
            kind="image"
            file={null}
            progress={null}
            onChange={vi.fn()}
          />
        </>,
      );

      expect(screen.getByRole("button", { name: "Elsewhere" })).toHaveFocus();
    });
  });
});
