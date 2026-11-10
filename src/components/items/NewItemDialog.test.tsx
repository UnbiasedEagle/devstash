// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  useParams: vi.fn(),
  createItem: vi.fn(),
  requestUpload: vi.fn(),
  uploadFile: vi.fn(),
  showActionError: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
  toastInfo: vi.fn(),
}));

vi.mock("next/navigation", () => ({ useParams: mocks.useParams }));
vi.mock("@/actions/items", () => ({ createItem: mocks.createItem }));
vi.mock("@/actions/uploads", () => ({ requestUpload: mocks.requestUpload }));
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
vi.mock("@/lib/upload-client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/upload-client")>()),
  uploadFile: mocks.uploadFile,
}));

import NewItemDialog from "@/components/items/NewItemDialog";
import {
  UPLOAD_FAILED_MESSAGE,
  UploadAbortedError,
  UploadFailedError,
} from "@/lib/upload-client";
import type { ItemTypeSummary } from "@/types/dashboard";

const itemTypes: ItemTypeSummary[] = [
  "Snippet",
  "Prompt",
  "Command",
  "Note",
  "File",
  "Image",
  "URL",
].map((name) => ({ id: name, name, icon: "Code", color: "#3b82f6" }));

const png = new File(["png-bytes"], "shot.png", { type: "image/png" });
const pdf = new File(["pdf-bytes"], "report.pdf", {
  type: "application/pdf",
});

// The picker would hide files it doesn't accept, so this lets tests choose anything, as a drag and drop can
const user = userEvent.setup({ applyAccept: false });

async function openDialog(slug: string, isPro = false) {
  mocks.useParams.mockReturnValue({ type: slug });
  render(
    <NewItemDialog itemTypes={itemTypes} collections={[]} isPro={isPro} />,
  );
  await user.click(screen.getByRole("button", { name: "New Item" }));
  return screen.findByRole("dialog");
}

async function chooseFile(dialog: HTMLElement, file: File) {
  const input = dialog.querySelector<HTMLInputElement>('input[type="file"]')!;
  await user.upload(input, file);
}

function submit() {
  return user.click(screen.getByRole("button", { name: "Create item" }));
}

describe("NewItemDialog uploads", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    Element.prototype.scrollIntoView = vi.fn();
    mocks.requestUpload.mockResolvedValue({
      success: true,
      data: {
        uploadUrl: "https://r2.test/upload",
        key: "pending/user-1/3f2b8c1e-9a4d-4e6f-8b1a-2c3d4e5f6a7b",
        contentType: "image/png",
      },
    });
    mocks.uploadFile.mockResolvedValue(undefined);
    mocks.createItem.mockResolvedValue({
      success: true,
      data: { id: "item-1", type: "Image" },
    });
  });

  afterEach(() => {
    cleanup();
    document.body.innerHTML = "";
  });

  describe("choosing a file", () => {
    it("opens on the Image type from the images page and asks for an image", async () => {
      const dialog = await openDialog("image");

      expect(screen.getByRole("radio", { name: /^Image/ })).toHaveAttribute(
        "aria-checked",
        "true",
      );
      expect(dialog.querySelector('input[type="file"]')).toHaveAttribute(
        "accept",
        ".png,.jpg,.jpeg,.gif,.webp",
      );
    });

    it.each([
      [
        "a disallowed type",
        new File(["x"], "logo.svg", { type: "image/svg+xml" }),
        "Choose a PNG, JPEG, GIF or WebP image",
      ],
      ["a file sent as an image", pdf, "Choose a PNG, JPEG, GIF or WebP image"],
    ])(
      "shows an error for %s and keeps no file",
      async (_label, file, message) => {
        const dialog = await openDialog("image");

        await chooseFile(dialog, file);

        expect(await screen.findByRole("alert")).toHaveTextContent(message);
        expect(
          screen.getByRole("button", { name: "Choose image" }),
        ).toBeInTheDocument();
        expect(mocks.requestUpload).not.toHaveBeenCalled();
      },
    );

    it("shows an error for an oversize image before anything is uploaded", async () => {
      const dialog = await openDialog("image");
      const big = new File(["x"], "big.png", { type: "image/png" });
      Object.defineProperty(big, "size", { value: 6 * 1024 * 1024 });

      await chooseFile(dialog, big);

      expect(await screen.findByRole("alert")).toHaveTextContent(
        "Images can be at most 5 MB",
      );
      expect(mocks.requestUpload).not.toHaveBeenCalled();
      expect(mocks.uploadFile).not.toHaveBeenCalled();
    });

    it("shows the chosen file and fills the title from its name", async () => {
      const dialog = await openDialog("image");

      await chooseFile(dialog, png);

      expect(await screen.findByText("shot.png")).toBeInTheDocument();
      expect(screen.getByLabelText("Title")).toHaveValue("shot");
    });

    it("keeps a title the user already typed", async () => {
      const dialog = await openDialog("image");
      await user.type(screen.getByLabelText("Title"), "My title");

      await chooseFile(dialog, png);

      expect(screen.getByLabelText("Title")).toHaveValue("My title");
    });

    it("moves the title to a newly chosen file when it was only filled in from the last one", async () => {
      const dialog = await openDialog("image");
      await chooseFile(dialog, png);
      await screen.findByText("shot.png");
      expect(screen.getByLabelText("Title")).toHaveValue("shot");

      await chooseFile(
        dialog,
        new File(["y"], "second.png", { type: "image/png" }),
      );

      expect(await screen.findByText("second.png")).toBeInTheDocument();
      expect(screen.getByLabelText("Title")).toHaveValue("second");
    });

    it("keeps a title the user changed when another file is chosen", async () => {
      const dialog = await openDialog("image");
      await chooseFile(dialog, png);
      await screen.findByText("shot.png");
      await user.clear(screen.getByLabelText("Title"));
      await user.type(screen.getByLabelText("Title"), "Mine");

      await chooseFile(
        dialog,
        new File(["y"], "second.png", { type: "image/png" }),
      );

      expect(await screen.findByText("second.png")).toBeInTheDocument();
      expect(screen.getByLabelText("Title")).toHaveValue("Mine");
    });

    it("clears the earlier file when a rejected one is chosen, so the error never sits beside a different file", async () => {
      const dialog = await openDialog("image");
      await chooseFile(dialog, png);
      await screen.findByText("shot.png");

      await chooseFile(
        dialog,
        new File(["x"], "logo.svg", { type: "image/svg+xml" }),
      );

      expect(await screen.findByRole("alert")).toHaveTextContent(
        "Choose a PNG, JPEG, GIF or WebP image",
      );
      expect(screen.queryByText("shot.png")).not.toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Choose image" }),
      ).toBeInTheDocument();
    });

    it("drops the file when another type is picked, since it may not be allowed there", async () => {
      const dialog = await openDialog("image");
      await chooseFile(dialog, png);
      await screen.findByText("shot.png");

      await user.click(screen.getByRole("radio", { name: /^File/ }));

      expect(
        screen.getByRole("button", { name: "Choose file" }),
      ).toBeInTheDocument();
      expect(screen.queryByText("shot.png")).not.toBeInTheDocument();
    });

    it("can't be dismissed by Escape once a file is chosen", async () => {
      const dialog = await openDialog("image");
      await chooseFile(dialog, png);
      await screen.findByText("shot.png");

      await user.keyboard("{Escape}");

      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });
  });

  describe("saving", () => {
    it("asks for a file before anything is sent", async () => {
      await openDialog("image");
      await user.type(screen.getByLabelText("Title"), "No file");

      await submit();

      expect(await screen.findByRole("alert")).toHaveTextContent(
        "Choose a file to upload",
      );
      expect(mocks.requestUpload).not.toHaveBeenCalled();
    });

    it("asks for a title even when a file is chosen", async () => {
      const dialog = await openDialog("image");
      await chooseFile(dialog, png);
      await screen.findByText("shot.png");
      await user.clear(screen.getByLabelText("Title"));

      await submit();

      expect(await screen.findByRole("alert")).toHaveTextContent(
        "Enter a title",
      );
      expect(mocks.requestUpload).not.toHaveBeenCalled();
    });

    it("requests a link, uploads the file to it and then saves the item", async () => {
      const dialog = await openDialog("image");
      await chooseFile(dialog, png);
      await screen.findByText("shot.png");

      await submit();

      await waitFor(() => expect(mocks.createItem).toHaveBeenCalledTimes(1));
      expect(mocks.requestUpload).toHaveBeenCalledWith({
        kind: "image",
        fileName: "shot.png",
        mimeType: "image/png",
        size: png.size,
      });
      expect(mocks.uploadFile).toHaveBeenCalledWith(
        expect.objectContaining({
          url: "https://r2.test/upload",
          contentType: "image/png",
          file: png,
        }),
      );
      expect(mocks.createItem).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "Image",
          title: "shot",
          tags: [],
          fileKey: "pending/user-1/3f2b8c1e-9a4d-4e6f-8b1a-2c3d4e5f6a7b",
          fileName: "shot.png",
          fileSize: png.size,
          fileMimeType: "image/png",
        }),
      );
      const order = [
        mocks.requestUpload,
        mocks.uploadFile,
        mocks.createItem,
      ].map((mock) => mock.mock.invocationCallOrder[0]);
      expect(order).toEqual([...order].sort((a, b) => a - b));
      expect(mocks.toastSuccess).toHaveBeenCalledWith("Image created");
      await waitFor(() =>
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
      );
    });

    it("saves the type the link was signed for, not the one the browser reported", async () => {
      mocks.requestUpload.mockResolvedValue({
        success: true,
        data: {
          uploadUrl: "https://r2.test/upload",
          key: "pending/user-1/3f2b8c1e-9a4d-4e6f-8b1a-2c3d4e5f6a7b",
          contentType: "text/markdown",
        },
      });
      const dialog = await openDialog("file", true);
      await chooseFile(dialog, new File(["# hi"], "notes.md", { type: "" }));
      await screen.findByText("notes.md");

      await submit();

      await waitFor(() => expect(mocks.createItem).toHaveBeenCalled());
      expect(mocks.uploadFile).toHaveBeenCalledWith(
        expect.objectContaining({ contentType: "text/markdown" }),
      );
      expect(mocks.createItem).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "File",
          fileMimeType: "text/markdown",
        }),
      );
    });

    it("shows one generic message and keeps the form when the upload fails", async () => {
      mocks.uploadFile.mockRejectedValue(new UploadFailedError("refused"));
      const dialog = await openDialog("image");
      await chooseFile(dialog, png);
      await screen.findByText("shot.png");

      await submit();

      await waitFor(() =>
        expect(mocks.toastError).toHaveBeenCalledWith(UPLOAD_FAILED_MESSAGE),
      );
      expect(mocks.createItem).not.toHaveBeenCalled();
      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(screen.getByText("shot.png")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Create item" })).toBeEnabled();
    });

    it("hands a refused link request to the error toast and sends nothing", async () => {
      const refused = {
        success: false,
        error: "Uploads are part of Pro. Upgrade to upload images and files.",
        code: "pro_required",
      };
      mocks.requestUpload.mockResolvedValue(refused);
      const dialog = await openDialog("file", false);
      await chooseFile(dialog, pdf);
      await screen.findByText("report.pdf");

      await submit();

      await waitFor(() =>
        expect(mocks.showActionError).toHaveBeenCalledWith(refused),
      );
      expect(mocks.uploadFile).not.toHaveBeenCalled();
      expect(mocks.createItem).not.toHaveBeenCalled();
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    it("hands a refused save to the error toast and keeps the form", async () => {
      const refused = {
        success: false,
        error: "The upload wasn't found. Choose the file again.",
      };
      mocks.createItem.mockResolvedValue(refused);
      const dialog = await openDialog("image");
      await chooseFile(dialog, png);
      await screen.findByText("shot.png");

      await submit();

      await waitFor(() =>
        expect(mocks.showActionError).toHaveBeenCalledWith(refused),
      );
      expect(mocks.toastSuccess).not.toHaveBeenCalled();
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });
  });

  describe("cancelling an upload", () => {
    beforeEach(() => {
      mocks.uploadFile.mockImplementation(
        (options: {
          onProgress: (percent: number) => void;
          signal: AbortSignal;
        }) => {
          options.onProgress(10);
          return new Promise((_, reject) => {
            options.signal.addEventListener("abort", () =>
              reject(new UploadAbortedError()),
            );
          });
        },
      );
    });

    it("shows the progress and a Cancel upload button while uploading", async () => {
      const dialog = await openDialog("image");
      await chooseFile(dialog, png);
      await screen.findByText("shot.png");

      await submit();

      expect(
        await screen.findByRole("button", { name: "Cancel upload" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Uploading 10%" }),
      ).toBeDisabled();
      expect(
        screen.getByRole("progressbar", { name: "Upload progress" }),
      ).toHaveAttribute("value", "10");
    });

    it("stops the upload without saving anything and keeps the form", async () => {
      const dialog = await openDialog("image");
      await chooseFile(dialog, png);
      await screen.findByText("shot.png");
      await submit();

      await user.click(
        await screen.findByRole("button", { name: "Cancel upload" }),
      );

      await waitFor(() =>
        expect(mocks.toastInfo).toHaveBeenCalledWith("Upload cancelled"),
      );
      expect(mocks.createItem).not.toHaveBeenCalled();
      expect(mocks.toastError).not.toHaveBeenCalled();
      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(screen.getByText("shot.png")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Create item" })).toBeEnabled();
    });

    it("can't be dismissed by Escape while uploading", async () => {
      const dialog = await openDialog("image");
      await chooseFile(dialog, png);
      await screen.findByText("shot.png");
      await submit();
      await screen.findByRole("button", { name: "Cancel upload" });

      await user.keyboard("{Escape}");

      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });
  });
});
