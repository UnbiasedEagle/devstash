import { describe, expect, it } from "vitest";
import {
  createItemSchema,
  isCreatableItemType,
  ITEM_LANGUAGES,
  MAX_CONTENT_LENGTH,
  MAX_DESCRIPTION_LENGTH,
  MAX_TAG_LENGTH,
  MAX_TAGS,
  MAX_TITLE_LENGTH,
  MAX_URL_LENGTH,
} from "@/lib/item-schemas";

const snippet = {
  type: "Snippet",
  title: "Hook",
  content: "const a = 1;",
  tags: [],
};
const url = {
  type: "URL",
  title: "Docs",
  url: "https://example.com",
  tags: [],
};

function errorsFor(input: unknown, path: string) {
  const result = createItemSchema.safeParse(input);
  if (result.success) return [];
  return result.error.issues
    .filter((issue) => issue.path.join(".") === path)
    .map((issue) => issue.message);
}

describe("createItemSchema common fields", () => {
  it("accepts a minimal valid item", () => {
    expect(createItemSchema.safeParse(snippet).success).toBe(true);
  });

  it("trims the title and rejects an empty one", () => {
    const parsed = createItemSchema.parse({ ...snippet, title: "  Hook  " });
    expect(parsed.title).toBe("Hook");
    expect(errorsFor({ ...snippet, title: "   " }, "title")).toEqual([
      "Enter a title",
    ]);
  });

  it("limits the title length", () => {
    const longTitle = "a".repeat(MAX_TITLE_LENGTH + 1);
    expect(errorsFor({ ...snippet, title: longTitle }, "title")).toHaveLength(
      1,
    );
    expect(
      createItemSchema.safeParse({
        ...snippet,
        title: "a".repeat(MAX_TITLE_LENGTH),
      }).success,
    ).toBe(true);
  });

  it("limits the description length and allows omitting it", () => {
    expect(
      errorsFor(
        { ...snippet, description: "a".repeat(MAX_DESCRIPTION_LENGTH + 1) },
        "description",
      ),
    ).toHaveLength(1);
    expect(createItemSchema.safeParse(snippet).success).toBe(true);
  });

  it("strips fields the client should never control", () => {
    const parsed = createItemSchema.parse({
      ...snippet,
      userId: "someone-else",
      isPro: true,
      itemTypeId: "x",
    });
    expect(parsed).not.toHaveProperty("userId");
    expect(parsed).not.toHaveProperty("isPro");
    expect(parsed).not.toHaveProperty("itemTypeId");
  });

  it("rejects an unknown type", () => {
    expect(
      createItemSchema.safeParse({ ...snippet, type: "File" }).success,
    ).toBe(false);
  });
});

describe("createItemSchema tags", () => {
  it("trims and lowercases tags", () => {
    const parsed = createItemSchema.parse({
      ...snippet,
      tags: ["  React ", "TypeScript"],
    });
    expect(parsed.tags).toEqual(["react", "typescript"]);
  });

  it("rejects duplicates after normalizing", () => {
    expect(
      errorsFor({ ...snippet, tags: ["react", " React "] }, "tags"),
    ).toEqual(["Remove duplicate tags"]);
  });

  it("rejects empty tags and tags over the length limit", () => {
    expect(errorsFor({ ...snippet, tags: ["  "] }, "tags.0")).toHaveLength(1);
    expect(
      errorsFor(
        { ...snippet, tags: ["a".repeat(MAX_TAG_LENGTH + 1)] },
        "tags.0",
      ),
    ).toHaveLength(1);
  });

  it("allows exactly the maximum number of tags and no more", () => {
    const tags = Array.from({ length: MAX_TAGS }, (_, index) => `tag${index}`);
    expect(createItemSchema.safeParse({ ...snippet, tags }).success).toBe(true);
    expect(
      errorsFor({ ...snippet, tags: [...tags, "extra"] }, "tags"),
    ).toHaveLength(1);
  });
});

describe("createItemSchema content types", () => {
  it.each(["Snippet", "Command", "Prompt", "Note"])(
    "%s requires non-blank content",
    (type) => {
      expect(errorsFor({ type, title: "T", tags: [] }, "content")).toHaveLength(
        1,
      );
      expect(
        errorsFor({ type, title: "T", tags: [], content: "   \n " }, "content"),
      ).toEqual(["Enter some content"]);
    },
  );

  it("limits content length", () => {
    const content = "a".repeat(MAX_CONTENT_LENGTH + 1);
    expect(errorsFor({ ...snippet, content }, "content")).toHaveLength(1);
  });

  it("accepts every listed language for snippets and rejects others", () => {
    for (const language of ITEM_LANGUAGES) {
      expect(createItemSchema.safeParse({ ...snippet, language }).success).toBe(
        true,
      );
    }
    expect(
      errorsFor({ ...snippet, language: "cobol" }, "language"),
    ).toHaveLength(1);
  });

  it("drops language on types that do not take one", () => {
    const parsed = createItemSchema.parse({
      type: "Note",
      title: "N",
      content: "text",
      language: "python",
      tags: [],
    });
    expect(parsed).not.toHaveProperty("language");
  });
});

describe("createItemSchema URL items", () => {
  it("accepts http and https URLs", () => {
    expect(createItemSchema.safeParse(url).success).toBe(true);
    expect(
      createItemSchema.safeParse({ ...url, url: "http://example.com/a?b=1" })
        .success,
    ).toBe(true);
  });

  it.each([
    "javascript:alert(1)",
    "data:text/html,<b>x</b>",
    "ftp://example.com",
    "not a url",
    "example.com",
  ])("rejects %s", (value) => {
    expect(errorsFor({ ...url, url: value }, "url")).toHaveLength(1);
  });

  it("rejects URLs with embedded credentials", () => {
    expect(
      errorsFor({ ...url, url: "https://user:pw@example.com" }, "url"),
    ).toEqual(["Remove the username and password from the URL"]);
  });

  it("requires a URL and limits its length", () => {
    expect(
      errorsFor({ type: "URL", title: "T", tags: [] }, "url"),
    ).toHaveLength(1);
    const long = `https://example.com/${"a".repeat(MAX_URL_LENGTH)}`;
    expect(errorsFor({ ...url, url: long }, "url")).toHaveLength(1);
  });
});

describe("isCreatableItemType", () => {
  it("allows the five text and link types and blocks Pro types", () => {
    for (const name of ["Snippet", "Prompt", "Command", "Note", "URL"]) {
      expect(isCreatableItemType(name)).toBe(true);
    }
    expect(isCreatableItemType("File")).toBe(false);
    expect(isCreatableItemType("Image")).toBe(false);
  });
});
