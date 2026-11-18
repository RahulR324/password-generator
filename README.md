# Shieldword — Password Generator

Shieldword is a premium, light-theme **password generator** built with plain **HTML, CSS and
vanilla JavaScript**. Everything runs locally in the browser; generated passwords are never
stored, logged or transmitted.

## Features

- Cryptographically secure generation with `crypto.getRandomValues()`
- Unbiased character selection using rejection sampling
- Password length slider (4–20 characters)
- Uppercase, lowercase, numbers and symbols toggles
- Option to exclude ambiguous characters (O, 0, I, l, 1)
- Show / hide password
- Copy to clipboard with inline confirmation
- Live strength indicator (Weak, Fair, Strong, Very Strong) with an entropy estimate
- Responsive layout for desktop, tablet and mobile
- Accessible controls, visible focus states and reduced-motion support

## Security notes

- `Math.random()` is never used for generation.
- At least one character from each selected set is guaranteed.
- Password length and character selections are validated, with safe handling of empty sets.
- Passwords live only in page memory. Nothing is written to `localStorage` or `sessionStorage`.
- Passwords are copied only after an explicit user action and are never logged to the console.
- No analytics, no external requests for generation, and no third-party JavaScript.

## Tech stack

- **HTML5** — semantic page structure
- **CSS3** — design system built on CSS custom properties
- **JavaScript** — generation, validation, strength scoring and UI behaviour

## Run locally

Open `index.html` in a modern browser, or serve the folder with any static file server.
