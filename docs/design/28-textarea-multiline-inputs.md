# Zenith Design Standards: TextAreas & Multi-Line Inputs

This document establishes the architectural, accessibility, data-import hardening, and sizing standards for TextArea controls across Zenith Companion.

## 1. Architectural Scope & Boundary Rules

TextAreas appear in Zenith Companion for multi-line inputs: player custom notes, bug reports, feedback, and raw data import strings (such as JSON or Base64 character profile hashes).

### The Boundary Rule
* If an input is strictly single-line (item search, character name, numerical value), use `<TextInput>` (`<input type="text">`).
* Never use a `<textarea>` for single-line entry. Conversely, never use an `<input>` when content can naturally wrap across lines.

---

## 2. Semantic ARIA & Form Structure (W3C WAI Guidelines)

A standard TextArea requires a permanently visible label, helper instructions, and semantic error binding:

```html
<div class="textarea-field">
  <div class="textarea-field__header">
    <label for="profile-import-data" class="textarea-field__label">
      Profile Export Hash
    </label>
    <span id="char-count" class="textarea-field__counter tabular-nums">
      0 / 5,000
    </span>
  </div>

  <textarea
    id="profile-import-data"
    name="profileData"
    spellcheck="false"
    autocapitalize="off"
    autocorrect="off"
    autocomplete="off"
    wrap="off"
    rows="4"
    aria-describedby="import-instructions char-count"
    class="zenith-textarea font-mono"
    placeholder="Paste your JSON or Base64 export string here..."
  ></textarea>

  <p id="import-instructions" class="textarea-field__helper">
    Exported from IdleMMO account settings or character profile.
  </p>

  <p id="import-error" class="textarea-field__error" role="alert" hidden>
    <!-- Specific error message populated on failure -->
  </p>
</div>
```

### Labeling Discipline
* **Never use placeholders as labels**: Placeholders disappear as soon as typing begins, have insufficient contrast by default, and fail WCAG 2.2 SC 3.3.2. A distinct `<label>` element must always be present.
* **Semantic Error Binding**: When validation fails, set `aria-invalid="true"` and point `aria-describedby` to the error element.

---

## 3. Data Import Hardening & Protection

Profile import strings contain compressed, encoded data that can be corrupted by browser text-assist utilities.

### Data Protection Attributes
For import strings and code snippets, always disable automatic input modifications:
* `spellcheck="false"`: Prevents browser spellcheck from marking hashes with red underlines.
* `autocapitalize="off"`: Prevents mobile devices from capitalizing the first character.
* `autocorrect="off"`: Stops mobile keyboards from replacing encoded characters with dictionary words.
* `autocomplete="off"`: Disables browser autocomplete dropdowns.
* `wrap="off"`: Keeps long continuous strings on a single horizontal line with horizontal scrolling, preventing artificial line breaks.
* `font-mono`: Use a monospace typeface so players can visually verify hex or base64 segments.

### Soft Limits vs. Hard MaxLength
* **Avoid hard `maxlength` on imports**: Setting `maxlength` silently truncates pasted strings that exceed the limit. The user only discovers the truncation when parsing fails with an "unexpected end of data" error.
* **Use Soft Limits with Counters**: Allow pasting the full string, display a visual character counter, and show a clear validation error if the content exceeds allowed limits.

### Non-Blocking Parsing Discipline
* **Never parse on every keystroke**: Validating deep JSON or decompressing hashes on every input event freezes the main thread.
* **Parse on Paste, Blur, or Action**: Trigger parsing only on `onPaste`, `onBlur`, or when the user explicitly clicks an "Import" button.
* **Preserve Input on Error**: If parsing fails, never clear the textarea. Keep the user's text intact and highlight the specific failure reason ("Line 4: Invalid item ID").

---

## 4. Modern Sizing & Auto-Grow (`field-sizing: content`)

Zenith uses the modern web standard for auto-growing multiline inputs:

### CSS Implementation (Baseline 2026)
```css
.zenith-textarea {
  field-sizing: content;
  min-height: 80px;
  max-height: 320px;
  resize: vertical;
}
```

* `field-sizing: content`: Automatically expands the textarea height to fit its contents without requiring JavaScript `scrollHeight` measurements or hidden shadow DOM clones.
* `min-height`: Guarantees a stable initial appearance (typically 3 to 4 lines).
* `max-height`: Prevents the textarea from expanding infinitely down the page. Once content reaches `max-height`, the textarea activates vertical scrolling.
* `resize: vertical`: If manual resizing is permitted, restrict it strictly to the vertical axis. **Horizontal resizing is prohibited** because it breaks container grid boundaries and causes layout overflow.

---

## 5. Mobile Ergonomics & Storage Persistence

### iOS Viewport Zoom Prevention
On mobile devices, focusing an input with a font size smaller than 16px causes iOS Safari to automatically zoom the page, disorienting the user.
* All TextAreas must have a computed `font-size: 1rem` (`16px`) or larger on mobile viewports.

### Draft Auto-Saving Discipline
For user notes and draft comments:
* Persist content to `localStorage` using a **500ms debounce**.
* Never write to storage on every single keystroke, which causes excessive disk I/O.

---

## 6. Design Tokens & Styling Specifications

| Element | Property | Token / Value |
| :--- | :--- | :--- |
| Background | `background-color` | `var(--bg-card)` (`#141b2d`) |
| Border | `border` | `1px solid var(--border-subtle)` (`#222c44`) |
| Border Radius | `border-radius` | `8px` |
| Padding | `padding` | `12px 14px` |
| Text Color | `color` | `var(--text-main)` (`#f8fafc`) |
| Placeholder Color | `color` | `var(--text-subtle)` (`#64748b`) |
| Focus Border | `border-color` | `var(--border-focus)` (`#38bdf8`) |
| Focus Ring | `outline` | `2px solid var(--border-focus)`, offset 2px |
| Error Border | `border-color` | `var(--accent-danger)` (`#f87171`) |
| Error Focus Ring | `outline` | `2px solid var(--accent-danger)`, offset 2px |
| Monospace Font | `font-family` | `ui-monospace, monospace` |
