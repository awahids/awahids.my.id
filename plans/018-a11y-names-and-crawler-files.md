# 018 — Name the icon-only buttons, and stop serving HTML as robots.txt

- **Status**: DONE
- **Commit**: fee5aa5
- **Severity**: —
- **Category**: Accessibility, crawlability
- **Estimated scope**: 1 component + 2 new static files

## Problem A — four buttons with no accessible name

An external audit flagged `button.ff-notification-close`. It is one of four.
All live in `src/components/FloatingFAQ.jsx` and contain only an SVG, so
assistive technology announces them as an unnamed "button".

```jsx
/* 518 — notification dismiss */
            <button
              className="ff-notification-close"
              onClick={(e) => { e.stopPropagation(); setShowNotification(false); }}
            >
              <svg width="14" height="14" ...>

/* 566 — panel close */
              <button className="ffh-close" onClick={closeChat}>
                <svg width="14" height="14" ...>

/* 634 — send */
              <button type="submit" disabled={!input.trim() || loading}>
                <svg width="16" height="16" ...>
```

The fourth is worse than unnamed. `.floating-faq-toggle` at 645 contains the
unread badge, so its only text content is a number:

```jsx
      <button className={\`floating-faq-toggle \${isOpen ? 'is-active' : ''}\`} onClick={toggleChat}>
        <AnimatePresence>
          {unreadCount > 0 && !isOpen && (
            <motion.div className="ff-unread-badge" ...>
              {unreadCount}
```

A screen reader announces that as "1, button" — actively misleading rather than
merely missing.

## Problem B — robots.txt and llms.txt return the site's HTML

`public/` contains only `img/`. Neither file exists.

```json
/* vercel.json — current */
  "routes": [
    { "handle": "filesystem" },
    { "src": "/(.*)", "dest": "/" }
  ]
```

So `/robots.txt` misses the filesystem handler, falls through the catch-all and
serves `index.html`. The audit's "129 syntax errors" are the lines of that HTML.

The same explains the `llms.txt` result. That audit parses the response as
Markdown, and an HTML `<h1>` is not a Markdown `# H1`, nor is `<a href>` a
`[text](url)` — hence "missing H1" and "no links" even though the HTML has both.

## Target

### A. Explicit labels, hidden icons

Every icon-only button gets an `aria-label`, and its decorative SVG gets
`aria-hidden="true"` so the icon is not announced alongside the label.

```jsx
/* 518 */  aria-label="Dismiss notification"
/* 566 */  aria-label="Close AI assistant"
/* 634 */  aria-label="Send message"
```

The toggle's label reflects state, and folds the unread count into words:

```jsx
        aria-label={
          isOpen
            ? 'Close AI assistant'
            : unreadCount > 0
              ? \`Open AI assistant, \${unreadCount} unread\`
              : 'Open AI assistant'
        }
        aria-expanded={isOpen}
```

and the badge becomes `aria-hidden="true"`, since the count is now in the label
and announcing the bare number twice is noise.

### B. Two real static files

Vite copies everything in `public/` to the build output root, and vercel.json's
`{ "handle": "filesystem" }` runs before the catch-all, so a real file at
`public/robots.txt` is served instead of the SPA fallback. No routing change is
needed — **do not touch `vercel.json`.**

`public/robots.txt`:

```
# https://awahids.my.id
User-agent: *
Allow: /
```

No `Sitemap:` line: there is no sitemap.xml in this repo, and pointing at a file
that does not exist trades one broken reference for another.

`public/llms.txt`, following the llmstxt.org shape — an H1, a blockquote
summary, then link sections:

```markdown
# A Wahid Saphadi

> Backend-first fullstack developer based in Cikarang, Bekasi, Indonesia.
> Builds web applications, admin dashboards, REST APIs, automation and
> deployment for systems that run in production.

## Pages

- [Portfolio](https://awahids.my.id/): Work, experience, selected projects and contact.
- [AI Lab](https://awahids.my.id/ai-lab): Experiments in AI-assisted delivery and documentation.
- [README Generator](https://awahids.my.id/readme-generator): Builds a styled GitHub profile README.
- [PRD Generator](https://awahids.my.id/prd-generator): Turns a rough idea into a product requirements document.

## Elsewhere

- [GitHub](https://github.com/awahids)
- [LinkedIn](https://www.linkedin.com/in/awahids)
- [Blog](https://blog.awahids.my.id)
```

The four routes come from `src/lib/routes.js` (`/`, `/ai-lab`,
`/readme-generator`, `/prd-generator`). `/prd/:slug` is deliberately omitted —
those permalinks were retired in `2393f12` and now return 404.

## Repo conventions to follow

- `public/` currently holds only `img/`; static assets belong there and Vite
  copies them verbatim.
- Other icon buttons in the repo already carry labels — see
  `src/components/ProjectCoverflow.jsx`:
  `aria-label="Previous project"` / `aria-label="Next project"`. Match that style.

## Steps

1. `src/components/FloatingFAQ.jsx`: add `aria-label` to the buttons at ~518,
   ~566 and ~634, and `aria-hidden="true"` to each of their SVGs.
2. Same file, the toggle at ~645: add the state-dependent `aria-label` and
   `aria-expanded={isOpen}`, and `aria-hidden="true"` on `.ff-unread-badge`.
   The two `motion.svg` icons inside it also get `aria-hidden="true"`.
3. Create `public/robots.txt` with the content above.
4. Create `public/llms.txt` with the content above.

## Boundaries

- Do NOT touch `vercel.json`. The filesystem handler already precedes the
  catch-all; adding a route would risk breaking SPA deep links.
- Do NOT create `sitemap.xml` or reference one.
- Do NOT change any button's behaviour, class, styling or `onClick`.
- Do NOT add `role` attributes — these are already `<button>` elements.
- Do NOT rename `.ff-unread-badge` or change how `unreadCount` is computed.
- Do NOT touch the commented-out block around line 551.
- Do NOT add dependencies.

## Verification

- **Mechanical**:
  - `npm run lint`, `npm run build`, `npm test` — clean, 77 pass.
  - `ls dist/robots.txt dist/llms.txt` after the build — both must exist, proving
    Vite copies them to the output root.
  - `head -1 dist/llms.txt` — must be `# A Wahid Saphadi`.
  - `grep -c "aria-label" src/components/FloatingFAQ.jsx` — expect **4**.
- **Feel check**: run `npm run dev`, then:
  - Fetch `http://localhost:<port>/robots.txt` and confirm the response is the
    three-line text file, not HTML. This is the headline check — it is what the
    audit actually failed on.
  - Fetch `/llms.txt` and confirm Markdown starting with `# A Wahid Saphadi`.
  - Open the FAQ widget. In DevTools → Elements → Accessibility pane, select each
    of the four buttons and confirm the computed name is the label, not empty and
    not the bare unread number.
  - Tab to the toggle with the keyboard and confirm a screen reader or the
    accessibility pane reports the open/close state.
  - Confirm every button still works: dismiss the notification, close the panel,
    send a message, toggle the widget.
- **Done when**: all four buttons expose a meaningful name, the toggle reports
  its state, and `/robots.txt` and `/llms.txt` return their own content.
