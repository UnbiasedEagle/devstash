import { bundledLanguages, codeToHtml } from "shiki";

interface CodeBlockProps {
  code: string;
  language: string | null;
}

const MAX_HIGHLIGHT_LENGTH = 50_000;

const preClass =
  "[&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:p-4 [&_pre]:font-mono [&_pre]:text-sm [&_pre]:leading-relaxed";

function resolveLanguage(language: string | null) {
  const lower = language?.toLowerCase();
  return lower && Object.hasOwn(bundledLanguages, lower) ? lower : "text";
}

async function highlight(code: string, language: string | null) {
  if (code.length > MAX_HIGHLIGHT_LENGTH) return null;
  try {
    return await codeToHtml(code, {
      lang: resolveLanguage(language),
      theme: "github-dark",
    });
  } catch {
    return null;
  }
}

export default async function CodeBlock({ code, language }: CodeBlockProps) {
  const html = await highlight(code, language);

  if (html === null) {
    return (
      <div className={preClass}>
        <pre className="bg-muted text-foreground">{code}</pre>
      </div>
    );
  }

  return (
    <div
      className={preClass}
      // Shiki escapes the code it highlights, and this is the only HTML injected into the drawer
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
