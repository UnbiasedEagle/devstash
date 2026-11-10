// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import {
  cleanup,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  importItems: vi.fn(),
  showActionError: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
  toastInfo: vi.fn(),
}));

vi.mock("@/actions/import", () => ({ importItems: mocks.importItems }));
vi.mock("@/lib/show-action-error", () => ({
  showActionError: mocks.showActionError,
}));
vi.mock("sonner", () => ({
  toast: {
    success: mocks.toastSuccess,
    error: mocks.toastError,
    info: mocks.toastInfo,
  },
}));

import ImportDialog from "@/components/items/ImportDialog";
import { MAX_IMPORT_FILES } from "@/lib/import-rules";

// The picker would hide files it doesn't accept, so this lets tests choose anything, as a drag and drop can
const user = userEvent.setup({ applyAccept: false });

function textFile(name: string, text: string) {
  return new File([text], name, { type: "text/plain" });
}

async function openDialog() {
  render(<ImportDialog />);
  await user.click(screen.getByRole("button", { name: "Import" }));
  return screen.getByRole("dialog");
}

async function choose(...files: File[]) {
  const input = document.querySelector<HTMLInputElement>("input[type=file]");
  await user.upload(input as HTMLInputElement, files);
}

function importButton() {
  return screen.getByRole("button", { name: /^Import \d+ files?$/ });
}

describe("ImportDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.importItems.mockResolvedValue({
      success: true,
      data: { imported: 2 },
    });
  });

  afterEach(cleanup);

  it("starts with nothing to import", async () => {
    await openDialog();

    expect(importButton()).toBeDisabled();
    expect(importButton()).toHaveTextContent("Import 0 files");
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });

  it("lists each chosen file with the item it will become", async () => {
    await openDialog();

    await choose(
      textFile("ideas.md", "# Ideas"),
      textFile("deploy.sh", "npm run build"),
    );

    const rows = within(
      await screen.findByRole("list", { name: "Chosen files" }),
    ).getAllByRole("listitem");
    expect(rows[0]).toHaveTextContent("ideas.md");
    expect(rows[0]).toHaveTextContent("Note");
    expect(rows[1]).toHaveTextContent("deploy.sh");
    expect(rows[1]).toHaveTextContent("Snippet · bash");
    expect(importButton()).toHaveTextContent("Import 2 files");
  });

  it("lists a file that can't be imported with its reason and leaves it out of the count", async () => {
    await openDialog();

    await choose(
      textFile("ideas.md", "# Ideas"),
      textFile("photo.png", "x"),
      textFile("empty.txt", "   "),
    );

    expect(await screen.findByText("Not a supported file type")).toBeVisible();
    expect(screen.getByText("The file is empty")).toBeVisible();
    expect(importButton()).toHaveTextContent("Import 1 file");
  });

  it("removes a file and disables the button when none are left", async () => {
    await openDialog();
    await choose(textFile("ideas.md", "# Ideas"));

    await user.click(
      await screen.findByRole("button", { name: "Remove ideas.md" }),
    );

    expect(screen.queryByText("ideas.md")).not.toBeInTheDocument();
    expect(importButton()).toBeDisabled();
  });

  it("leaves out the files beyond the limit with a reason", async () => {
    await openDialog();

    await choose(
      ...Array.from({ length: MAX_IMPORT_FILES + 2 }, (_, index) =>
        textFile(`note-${index}.md`, `text ${index}`),
      ),
    );

    await waitFor(() =>
      expect(importButton()).toHaveTextContent(
        `Import ${MAX_IMPORT_FILES} files`,
      ),
    );
    expect(
      screen.getAllByText(
        `Only ${MAX_IMPORT_FILES} files can be imported at once`,
      ),
    ).toHaveLength(2);
  });

  it("sends only the importable files and closes with a success message", async () => {
    await openDialog();
    await choose(
      textFile("ideas.md", "# Ideas"),
      textFile("photo.png", "x"),
      textFile("deploy.sh", "npm run build"),
    );
    await screen.findByText("Not a supported file type");

    await user.click(importButton());

    await waitFor(() =>
      expect(mocks.toastSuccess).toHaveBeenCalledWith("Imported 2 items"),
    );
    expect(mocks.importItems).toHaveBeenCalledWith({
      files: [
        { fileName: "ideas.md", content: "# Ideas" },
        { fileName: "deploy.sh", content: "npm run build" },
      ],
    });
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
  });

  it("keeps the dialog open with the files listed when the server answers with an error", async () => {
    const failed = {
      success: false,
      error:
        "You can add 1 more item on the free plan. Upgrade to Pro to add more.",
      code: "free_limit",
    };
    mocks.importItems.mockResolvedValue(failed);
    await openDialog();
    await choose(textFile("ideas.md", "# Ideas"));

    await user.click(await screen.findByRole("button", { name: /^Import 1/ }));

    await waitFor(() =>
      expect(mocks.showActionError).toHaveBeenCalledWith(failed),
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("ideas.md")).toBeInTheDocument();
    expect(importButton()).toBeEnabled();
    expect(mocks.toastSuccess).not.toHaveBeenCalled();
  });

  it("shows a general error when the request itself fails", async () => {
    mocks.importItems.mockRejectedValue(new Error("offline"));
    await openDialog();
    await choose(textFile("ideas.md", "# Ideas"));

    await user.click(await screen.findByRole("button", { name: /^Import 1/ }));

    await waitFor(() =>
      expect(mocks.toastError).toHaveBeenCalledWith(
        "Something went wrong. Try again.",
      ),
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("announces how many files can be imported and how many were left out", async () => {
    await openDialog();
    expect(screen.getByRole("status")).toBeEmptyDOMElement();

    await choose(textFile("ideas.md", "# Ideas"), textFile("photo.png", "x"));

    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(
        "1 file can be imported, 1 left out",
      ),
    );
  });

  it("reads no more than twice the import limit and says so", async () => {
    await openDialog();
    const many = MAX_IMPORT_FILES * 2 + 5;

    await choose(
      ...Array.from({ length: many }, (_, index) =>
        textFile(`note-${index}.md`, `text ${index}`),
      ),
    );

    await waitFor(() =>
      expect(
        within(screen.getByRole("list", { name: "Chosen files" })).getAllByRole(
          "listitem",
        ),
      ).toHaveLength(MAX_IMPORT_FILES * 2),
    );
    expect(mocks.toastInfo).toHaveBeenCalledWith(
      `Only ${MAX_IMPORT_FILES * 2} files can be listed at a time`,
    );
  });

  it("drops files that were still being read when the dialog was closed", async () => {
    await openDialog();
    let finishReading: (text: string) => void = () => {};
    const slow = textFile("slow.md", "# Slow");
    slow.text = () =>
      new Promise<string>((resolve) => {
        finishReading = resolve;
      });
    await choose(slow);

    await user.click(screen.getByRole("button", { name: "Cancel" }));
    finishReading("# Slow");
    await user.click(screen.getByRole("button", { name: "Import" }));

    await waitFor(() => expect(screen.getByRole("dialog")).toBeVisible());
    expect(screen.queryByText("slow.md")).not.toBeInTheDocument();
  });

  it("forgets the chosen files when it is closed", async () => {
    await openDialog();
    await choose(textFile("ideas.md", "# Ideas"));
    await screen.findByText("ideas.md");

    await user.click(screen.getByRole("button", { name: "Cancel" }));
    await user.click(screen.getByRole("button", { name: "Import" }));

    expect(screen.queryByText("ideas.md")).not.toBeInTheDocument();
  });
});
