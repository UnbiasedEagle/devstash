// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  titleFromFileName,
  UploadAbortedError,
  UploadFailedError,
  uploadFile,
  validateChosenFile,
} from "@/lib/upload-client";

interface ProgressEvent {
  lengthComputable: boolean;
  loaded: number;
  total: number;
}

class FakeXhr {
  static last: FakeXhr | undefined;
  method = "";
  url = "";
  headers: Record<string, string> = {};
  body: unknown;
  status = 0;
  upload: { onprogress: ((event: ProgressEvent) => void) | null } = {
    onprogress: null,
  };
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  onabort: (() => void) | null = null;

  open(method: string, url: string) {
    this.method = method;
    this.url = url;
  }
  setRequestHeader(name: string, value: string) {
    this.headers[name] = value;
  }
  send(body: unknown) {
    this.body = body;
    FakeXhr.last = this;
  }
  abort() {
    this.onabort?.();
  }
}

function fileOf(name: string, type: string, size?: number) {
  const file = new File(["data"], name, { type });
  if (size !== undefined) Object.defineProperty(file, "size", { value: size });
  return file;
}

describe("validateChosenFile", () => {
  it("accepts a file the rules allow", () => {
    expect(
      validateChosenFile("image", fileOf("shot.png", "image/png")),
    ).toBeUndefined();
  });

  it("accepts a Markdown file the browser reported without a type", () => {
    expect(validateChosenFile("file", fileOf("notes.md", ""))).toBeUndefined();
  });

  it.each([
    ["image", "logo.svg", "image/svg+xml"],
    ["image", "doc.pdf", "application/pdf"],
    ["file", "setup.exe", "application/x-msdownload"],
    ["file", "page.html", "text/html"],
  ] as const)(
    "refuses a disallowed %s %s before anything is uploaded",
    (kind, name, type) => {
      expect(validateChosenFile(kind, fileOf(name, type))).toEqual(
        expect.any(String),
      );
    },
  );

  it("refuses an oversize image with the limit in the message", () => {
    const big = fileOf("big.png", "image/png", 6 * 1024 * 1024);

    expect(validateChosenFile("image", big)).toBe("Images can be at most 5 MB");
  });

  it("refuses an oversize file with the limit in the message", () => {
    const big = fileOf("big.pdf", "application/pdf", 11 * 1024 * 1024);

    expect(validateChosenFile("file", big)).toBe("Files can be at most 10 MB");
  });

  it("refuses an empty file", () => {
    const empty = fileOf("empty.txt", "text/plain", 0);

    expect(validateChosenFile("file", empty)).toBe("This file is empty");
  });
});

describe("titleFromFileName", () => {
  it.each([
    ["screenshot.png", "screenshot"],
    ["my report v2.final.pdf", "my report v2.final"],
    ["README", "README"],
    ["  spaced name .txt", "spaced name"],
  ])("turns %s into %s", (name, title) => {
    expect(titleFromFileName(name)).toBe(title);
  });
});

describe("uploadFile", () => {
  const file = fileOf("shot.png", "image/png");

  beforeEach(() => {
    FakeXhr.last = undefined;
    vi.stubGlobal("XMLHttpRequest", FakeXhr);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function start(signal = new AbortController().signal) {
    const onProgress = vi.fn();
    const promise = uploadFile({
      url: "https://r2.test/upload",
      contentType: "image/png",
      file,
      onProgress,
      signal,
    });
    return { promise, onProgress, xhr: FakeXhr.last! };
  }

  it("PUTs the file to the link with exactly the approved content type", () => {
    const { xhr } = start();

    expect(xhr.method).toBe("PUT");
    expect(xhr.url).toBe("https://r2.test/upload");
    expect(xhr.headers).toEqual({ "Content-Type": "image/png" });
    expect(xhr.body).toBe(file);
  });

  it("resolves when storage accepts the upload", async () => {
    const { promise, xhr } = start();
    xhr.status = 200;
    xhr.onload?.();

    await expect(promise).resolves.toBeUndefined();
  });

  it("reports progress as a whole percentage", () => {
    const { xhr, onProgress } = start();

    xhr.upload.onprogress?.({ lengthComputable: true, loaded: 1, total: 3 });
    xhr.upload.onprogress?.({ lengthComputable: true, loaded: 3, total: 3 });

    expect(onProgress.mock.calls).toEqual([[33], [100]]);
  });

  it("ignores progress events with no known total", () => {
    const { xhr, onProgress } = start();

    xhr.upload.onprogress?.({ lengthComputable: false, loaded: 5, total: 0 });

    expect(onProgress).not.toHaveBeenCalled();
  });

  it.each([403, 500])("fails when storage answers %d", async (status) => {
    const { promise, xhr } = start();
    xhr.status = status;
    xhr.onload?.();

    await expect(promise).rejects.toBeInstanceOf(UploadFailedError);
  });

  it("fails on a network error, which is how the browser reports a refusal it can't read", async () => {
    const { promise, xhr } = start();
    xhr.onerror?.();

    await expect(promise).rejects.toBeInstanceOf(UploadFailedError);
  });

  it("stops the request and says it was cancelled when the signal aborts", async () => {
    const controller = new AbortController();
    const { promise } = start(controller.signal);

    controller.abort();

    await expect(promise).rejects.toBeInstanceOf(UploadAbortedError);
  });

  it("doesn't send anything when it was cancelled before it started", async () => {
    const controller = new AbortController();
    controller.abort();

    const promise = uploadFile({
      url: "https://r2.test/upload",
      contentType: "image/png",
      file,
      onProgress: vi.fn(),
      signal: controller.signal,
    });

    await expect(promise).rejects.toBeInstanceOf(UploadAbortedError);
    expect(FakeXhr.last).toBeUndefined();
  });
});
