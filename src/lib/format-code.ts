const PRETTIER_PARSERS: Record<string, string> = {
  typescript: "typescript",
  javascript: "babel",
  json: "json",
  html: "html",
  css: "css",
};

export function canFormat(language: string) {
  return Object.hasOwn(PRETTIER_PARSERS, language);
}

async function loadPlugins(parser: string) {
  switch (parser) {
    case "typescript":
      return Promise.all([
        import("prettier/plugins/typescript"),
        import("prettier/plugins/estree"),
      ]);
    case "babel":
    case "json":
      return Promise.all([
        import("prettier/plugins/babel"),
        import("prettier/plugins/estree"),
      ]);
    case "html":
      return Promise.all([import("prettier/plugins/html")]);
    default:
      return Promise.all([import("prettier/plugins/postcss")]);
  }
}

// Prettier is loaded on demand because it is large and only needed when the user presses Format
export async function formatCode(code: string, language: string) {
  const parser = PRETTIER_PARSERS[language];
  const [{ format }, plugins] = await Promise.all([
    import("prettier/standalone"),
    loadPlugins(parser),
  ]);
  return format(code, {
    parser,
    plugins: plugins.map((plugin) => plugin.default ?? plugin),
  });
}
