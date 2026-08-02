# Vanilla Calculator

A simple, accessible, static web calculator with immediate execution, repeated equals, decimal/negative handling, error states (divide-by-zero), mouse and keyboard input.

Files in this slice:
- index.html — Static HTML scaffold with buttons and aria-live display
- styles.css — Minimal styling with visible focus and grid layout
- app.js — UI controller wiring the DOM to the calculator engine; keyboard support
- src/calcEngine.js — Pure calculator engine exposing an imperative API

How to run
- Open index.html directly in a browser, or serve the folder with any static server:
  - Python 3: `python -m http.server 8080` then open http://localhost:8080/
  - Node: `npx http-server -p 8080` then open http://localhost:8080/

Keyboard shortcuts
- Digits 0–9 enter numbers
- . inserts decimal point
- + − * / are operators
- Enter or = computes equals
- Backspace deletes last digit while typing
- Escape clears (C/AC behavior)
- n toggles sign (optional convenience)

Accessibility
- Display is an aria-live polite region and updates after every action
- Buttons have logical tab order and focus ring

Notes on behavior
- Immediate execution: entering `3 + 4 × 2 =` results in 14 (left-to-right)
- Repeated equals uses last operator and operand: `5 + 2 = =` yields 9 then 11
- Divide by zero shows "Error"; press clear to reset
