# Import From Files Spec

## Overview

A user can bring text and code files they already have into DevStash. Each file becomes one item: Markdown and text files become Notes, code files become Snippets with the language taken from the file extension. Importing is free, because it stores text only, and the free item limit still applies.

## Requirements

- An "Import" button in the top bar next to New Item (icon and label, label hidden on small screens like New Item's) opens an Import dialog. The dialog uses the app's Base UI `Dialog`
- The dialog has a file field that accepts several files at once, by choosing or by drag and drop, built on the same pattern as the existing file field (labelled group, focus handling, announced changes). It lists each chosen file with the item it will become ("Note" or "Snippet · typescript") and a Remove button; files that can't be imported are listed with the reason and are left out. Importing starts from an "Import N files" button that is disabled until at least one file can be imported
- What is accepted, decided by the extension in lower case:
  - Note: `.md`, `.markdown`, `.txt`
  - Snippet: `.ts` and `.tsx` (typescript), `.js`, `.jsx`, `.mjs` and `.cjs` (javascript), `.py` (python), `.sh` and `.bash` (bash), `.json` (json), `.html` and `.htm` (html), `.css` (css), `.sql` (sql), `.go` (go), `.rs` (rust), `.java` (java). Languages come from `ITEM_LANGUAGES`, so no new language is added
  - Anything else is refused as "Not a supported file type"
- The mapping lives in one pure file, `src/lib/import-rules.ts`, used by the dialog for its list and by the Server Action, so the preview and the result can't differ
- Limits, checked in the browser for a quick answer and again on the server:
  - At most 20 files per import
  - Each file's text is 1 to `MAX_CONTENT_LENGTH` (50,000) characters after trimming; an empty file is refused as "The file is empty" and a longer one as "The file is longer than 50,000 characters"
  - A file whose text contains a null character is treated as binary and refused as "Not a text file"
  - The file name is at most 255 characters
- The browser reads each file as UTF-8 text (`File.text()`) and sends only the file name and the text, never the file, so nothing touches storage
- Title: the file name without its extension, trimmed, at most `MAX_TITLE_LENGTH` (200) characters; if that leaves nothing, the full file name. No description, no tags, no collection
- A Server Action `importItems` in `src/actions/import.ts`, returning `{ success, data, error }`, validated with Zod, on the shared mutation rate limit, for the signed-in user only. It re-checks every rule, ignoring the client's list
- All files are saved in one Serializable transaction, with the write-conflict retry helper the item actions share. The free limit counts the items inside that transaction: if the user is not Pro and the import would pass `FREE_ITEM_LIMIT`, nothing is imported and the error says how many more items fit ("You can add 3 more items on the free plan"), with the `free_limit` code that gives the Upgrade toast the other limit errors use. A Pro user has no limit
- The result reports how many items were imported, and a success toast says it ("Imported 5 items"). The dialog closes on success; on an error it stays open with the files still listed, so the user can remove some and try again
- The dashboard, `/items/note`, `/items/snippet`, `/search`, `/profile` usage and the sidebar counts are revalidated after an import, as after creating an item
- Importing never overwrites or merges: a file with the same name as an existing item becomes a second item

## Tests

- `import-rules`: each extension maps to the right type and language in any letter case, the title drops only the last extension (`notes.v2.md` becomes `notes.v2`), an unknown extension, an empty file, a null character, a text over the limit and a name over 255 characters are refused with the right reason
- `importItems`: signed-out user refused; saves Notes and Snippets with the right content, language and `contentType` TEXT; refuses 21 files, an unsupported file and an empty file without saving anything; a free user who would pass the limit gets `free_limit` with the number that fit and nothing is saved; a Pro user can pass 50; retries on a write conflict; rejects a request without touching the database when validation fails
- The Import dialog: lists the chosen files with their resulting type, leaves unsupported files out with a reason, removes a file, disables the button with nothing importable, and keeps the files listed when the server answers with an error

## Notes

- No schema change and no new environment variable are expected
- Out of scope: restoring a DevStash JSON or ZIP export, folders and archives, binary files, choosing a collection or tags on import, and Pro gating

## References

- `src/actions/items.ts` (`createItem`, `withWriteConflictRetry`, the free limit transaction), `src/lib/item-schemas.ts` (`ITEM_LANGUAGES`, `MAX_CONTENT_LENGTH`, `MAX_TITLE_LENGTH`), `src/components/items/FileField.tsx`, `src/components/items/NewItemButton.tsx`, `src/components/dashboard/TopBar.tsx`
