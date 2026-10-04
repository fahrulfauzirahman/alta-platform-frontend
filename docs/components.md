# Components

All shared UI lives in `@alta/ui`; web and desktop consume the same package plus the shared demo feature `@alta/reference-items`.

## Primitives (`@alta/ui`)
- `Button`: primary/secondary, disabled, busy (`aria-busy`), focus-visible ring, 44px touch target.
- `Input`: real `<input>` with `<label>`, `aria-invalid` + `aria-describedby` for errors, disabled state.
- `Dialog`: native `<dialog>` with `showModal`, Escape to close, focus return, viewport-fit, backdrop.
- `Dropdown`: native `<select>` with label, keyed options.
- `Skeleton`: `role=status` + `aria-busy`, layout-preserving.
- `Toast`: `role=status` + `aria-live=polite`, info/success/danger tones (never color-only).
- `Badge`: neutral/success/warning/danger/info tones with text labels.

## Shell (`@alta/app-shell`)
- Skip link, `nav[aria-label=Primary]`, `header`, `main#main`, responsive single-column under 900px.

## Demo feature (`@alta/reference-items`)
- Neutral reference/demo only. States: loading (Skeleton), empty, list, validation (inline + `role=alert`), server error (`role=alert` + Retry + requestId, input preserved), session-expired (reauth hint), offline (`Toast` + `online/offline` listeners), SSE badge (`connecting/open/reconnecting/closed` + cursor short-id), idempotent create (`crypto.randomUUID`), dedup by `id`, tenant-guarded remote inserts, abort on teardown, SSE close on destroy.

## Explorer (`apps/storybook`)
- Vite production build of the same components in every state above. No demo-only implementations; no secret env; no console errors expected.
