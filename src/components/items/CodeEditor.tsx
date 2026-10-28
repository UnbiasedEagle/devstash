"use client";

import { githubDark } from "@uiw/codemirror-theme-github";
import CodeMirror from "@uiw/react-codemirror";
import { EditorView } from "@codemirror/view";
import { EditorState, type Extension } from "@codemirror/state";
import { Wand2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { canFormat, formatCode } from "@/lib/format-code";
import { MAX_CONTENT_LENGTH } from "@/lib/item-schemas";

interface CodeEditorProps {
  id: string;
  label: string;
  value: string;
  language: string;
  onChange: (value: string) => void;
  invalid?: boolean;
  describedBy?: string;
}

// Module-level so the editor doesn't see a new options object (and reconfigure) on every keystroke
const BASIC_SETUP = {
  autocompletion: true,
  closeBrackets: true,
  indentOnInput: true,
  bracketMatching: true,
  foldGutter: false,
  highlightActiveLine: false,
};

// Slack above the schema limit so going over it shows the validation message instead of silently refusing the edit
const MAX_EDITOR_LENGTH = MAX_CONTENT_LENGTH + 1000;

export const contentLengthLimit = EditorState.changeFilter.of(
  (transaction) => transaction.newDoc.length <= MAX_EDITOR_LENGTH,
);

async function loadLanguage(language: string): Promise<Extension | null> {
  switch (language) {
    case "typescript":
      return (await import("@codemirror/lang-javascript")).javascript({
        typescript: true,
      });
    case "javascript":
      return (await import("@codemirror/lang-javascript")).javascript();
    case "python":
      return (await import("@codemirror/lang-python")).python();
    case "json":
      return (await import("@codemirror/lang-json")).json();
    case "markdown":
      return (await import("@codemirror/lang-markdown")).markdown();
    case "html":
      return (await import("@codemirror/lang-html")).html();
    case "css":
      return (await import("@codemirror/lang-css")).css();
    case "sql":
      return (await import("@codemirror/lang-sql")).sql();
    case "go":
      return (await import("@codemirror/lang-go")).go();
    case "rust":
      return (await import("@codemirror/lang-rust")).rust();
    case "java":
      return (await import("@codemirror/lang-java")).java();
    case "bash": {
      const [{ StreamLanguage }, { shell }] = await Promise.all([
        import("@codemirror/language"),
        import("@codemirror/legacy-modes/mode/shell"),
      ]);
      return StreamLanguage.define(shell);
    }
    default:
      return null;
  }
}

export default function CodeEditor({
  id,
  label,
  value,
  language,
  onChange,
  invalid,
  describedBy,
}: CodeEditorProps) {
  const [languageExtension, setLanguageExtension] = useState<Extension | null>(
    null,
  );
  const [formatting, setFormatting] = useState(false);

  const latestValue = useRef(value);

  useEffect(() => {
    latestValue.current = value;
  }, [value]);

  useEffect(() => {
    let cancelled = false;
    loadLanguage(language)
      .catch(() => null)
      .then((extension) => {
        if (!cancelled) setLanguageExtension(extension);
      });
    return () => {
      cancelled = true;
    };
  }, [language]);

  const extensions = useMemo(() => {
    const attributes = EditorView.contentAttributes.of({
      id,
      "aria-label": label,
      ...(invalid && { "aria-invalid": "true" }),
      ...(describedBy && { "aria-describedby": describedBy }),
    });
    return [attributes, EditorView.lineWrapping, contentLengthLimit].concat(
      languageExtension ?? [],
    );
  }, [id, label, invalid, describedBy, languageExtension]);

  async function handleFormat() {
    setFormatting(true);
    try {
      const formatted = await formatCode(value, language);
      // Typing while Prettier runs wins over the formatted copy of the older text
      if (latestValue.current === value) onChange(formatted);
    } catch {
      toast.error("Could not format. Fix the syntax errors and try again.");
    } finally {
      setFormatting(false);
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      {canFormat(language) && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="self-end"
          disabled={formatting || value.trim() === ""}
          onClick={handleFormat}
        >
          <Wand2 aria-hidden />
          {formatting ? "Formatting..." : "Format"}
        </Button>
      )}
      <div
        aria-invalid={invalid || undefined}
        className="overflow-hidden rounded-lg border border-input text-sm transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 aria-invalid:border-destructive"
      >
        <CodeMirror
          value={value}
          theme={githubDark}
          extensions={extensions}
          height="14rem"
          onChange={onChange}
          basicSetup={BASIC_SETUP}
        />
      </div>
    </div>
  );
}
