// Simple calculator DOM wiring and keyboard support
// This file is intentionally framework-free and focuses on:
// - Listening for keyboard input
// - Wiring button clicks to an engine
// - Updating the clear button label between C and AC

const display = document.getElementById('display');
const btnClear = document.getElementById('btn-clear');
const btnEquals = document.getElementById('btn-equals');

// Minimal calculation engine state
const state = {
  lhs: null,
  op: null,
  rhsTyping: false,
  display: '0',
  dirty: false, // when true, clear button shows C
};

function setDisplay(text) {
  state.display = text;
  display.textContent = text;
}

export function getClearMode() {
  // AC when not dirty, C when dirty
  return state.dirty ? 'C' : 'AC';
}

function updateClearLabel() {
  btnClear.textContent = getClearMode();
}

function clearAll() {
  state.lhs = null;
  state.op = null;
  state.rhsTyping = false;
  state.dirty = false;
  setDisplay('0');
  updateClearLabel();
}

function clearEntry() {
  setDisplay('0');
  state.rhsTyping = false;
  state.dirty = false; // pressing C clears dirty flag (error-clearing behavior)
  updateClearLabel();
}

function inputDigit(d) {
  if (!state.rhsTyping) {
    setDisplay(String(d));
    state.rhsTyping = true;
  } else {
    setDisplay(display.textContent === '0' ? String(d) : display.textContent + String(d));
  }
  state.dirty = true;
  updateClearLabel();
}

function inputDot() {
  if (!display.textContent.includes('.')) {
    setDisplay(display.textContent + '.');
    state.rhsTyping = true;
    state.dirty = true;
    updateClearLabel();
  }
}

function setOp(op) {
  if (state.op && state.rhsTyping) {
    // chain
    compute();
  }
  state.lhs = parseFloat(display.textContent);
  state.op = op;
  state.rhsTyping = false;
}

function compute() {
  if (state.op == null || state.lhs == null) return;
  const a = state.lhs;
  const b = parseFloat(display.textContent);
  let res = b;
  switch (state.op) {
    case '+': res = a + b; break;
    case '-': res = a - b; break;
    case '*': res = a * b; break;
    case '/': res = b === 0 ? NaN : a / b; break;
    case '%': res = a % b; break;
  }
  setDisplay(Number.isFinite(res) ? String(res) : 'Error');
  state.lhs = null;
  state.op = null;
  state.rhsTyping = false;
  state.dirty = display.textContent !== '0';
  updateClearLabel();
}

// Button wiring

document.addEventListener('click', (e) => {
  const t = e.target;
  if (!(t instanceof HTMLElement)) return;
  if (t.matches('[data-digit]')) {
    inputDigit(t.getAttribute('data-digit'));
  } else if (t.matches('[data-dot]')) {
    inputDot();
  } else if (t.matches('[data-op]')) {
    setOp(t.getAttribute('data-op'));
  } else if (t === btnEquals) {
    compute();
  } else if (t === btnClear) {
    if (state.dirty) {
      clearEntry();
    } else {
      clearAll();
    }
  } else if (t.getAttribute('data-key') === 'Backspace') {
    backspace();
  }
});

function backspace() {
  if (!state.rhsTyping) return;
  const txt = display.textContent;
  const next = txt.length > 1 ? txt.slice(0, -1) : '0';
  setDisplay(next);
  state.dirty = next !== '0';
  updateClearLabel();
}

// Keyboard support
window.addEventListener('keydown', (e) => {
  const { key } = e;
  if (/^[0-9]$/.test(key)) {
    inputDigit(key);
  } else if (key === '.' || key === ',') {
    e.preventDefault();
    inputDot();
  } else if (['+', '-', '*', '/','%'].includes(key)) {
    e.preventDefault();
    setOp(key);
  } else if (key === 'Enter' || key === '=') {
    e.preventDefault();
    compute();
  } else if (key === 'Escape') {
    e.preventDefault();
    if (state.dirty) clearEntry(); else clearAll();
  } else if (key === 'Backspace') {
    e.preventDefault();
    backspace();
  }
});

// Initialize
updateClearLabel();
