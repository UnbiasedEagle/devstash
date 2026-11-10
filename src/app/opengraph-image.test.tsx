import { describe, expect, it } from "vitest";
import Image, { alt, contentType, size } from "@/app/opengraph-image";
import { PAGE_TITLE } from "@/lib/site-copy";

describe("the share image", () => {
  it("is the standard size for a link preview, as a PNG, described by the page's title", () => {
    expect(size).toEqual({ width: 1200, height: 630 });
    expect(contentType).toBe("image/png");
    expect(alt).toBe(PAGE_TITLE);
  });

  // The renderer and its font load on first use, which is slow on a busy machine
  const RENDER_TIMEOUT_MS = 20_000;

  it(
    "renders a real PNG of that size",
    async () => {
      const response = Image();

      expect(response.headers.get("content-type")).toBe("image/png");
      const bytes = new Uint8Array(await response.arrayBuffer());
      // The PNG signature, then the width and height in the first header block
      expect([...bytes.slice(0, 8)]).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
      const view = new DataView(bytes.buffer);
      expect(view.getUint32(16)).toBe(1200);
      expect(view.getUint32(20)).toBe(630);
    },
    RENDER_TIMEOUT_MS,
  );
});
