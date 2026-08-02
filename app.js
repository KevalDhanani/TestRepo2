import { createCalculator } from './src/calcEngine.js';

const calc = createCalculator();

const displayEl = document.getElementById('display');
const keysEl = document.querySelector('.keys');
const clearBtn = document.getElementById('clear');

function render() {
  displayEl.textContent = calc.getDisplay();
  clearBtn.textContent = getClearMode(calc);
}

function getOperatorFromAction(action) {
  switch (action) {
    case 'add':
      return '+';
    case 'subtract':
      return '-';
    case 'multiply':
      return '*';
    case 'divide':
      return '/';
    default:
      return null;
  }
}

export function getClearMode(c) {
  // Mirror engine helper when available
  if (c && typeof c.getClearMode === 'function') return c.getClearMode();
  // Fallback: if display not zero assume C when typing
  return 'AC';
}

keysEl.addEventListener('click', (e) => {
  const btn = e.target.closest('button');
  if (!btn) return;

  const digit = btn.getAttribute('data-digit');
  const action = btn.getAttribute('data-action');

  if (digit != null) {
    calc.pressDigit(digit);
  } else if (action) {
    switch (action) {
      case 'decimal':
        calc.pressDecimal();
        break;
      case 'toggle-sign':
        calc.pressToggleSign();
        break;
      case 'backspace':
        calc.pressBackspace();
        break;
      case 'clear':
        calc.pressClear();
        break;
      case 'equals':
        calc.pressEquals();
        break;
      default: {
        const op = getOperatorFromAction(action);
        if (op) calc.pressOperator(op);
      }
    }
  }

  render();
  // Announce update via aria-live region; also briefly focus then blur for SRs that need it
  displayEl.setAttribute('aria-live', 'polite');
});

function handleKeydown(ev) {
  const { key } = ev;
  if (/^[0-9]$/.test(key)) {
    calc.pressDigit(key);
  } else if (key === '.') {
    calc.pressDecimal();
  } else if (key === 'Backspace') {
    calc.pressBackspace();
  } else if (key === 'Escape') {
    calc.pressClear();
  } else if (key === 'Enter' || key === '=') {
    // allow Shift+= which produces '+' to be handled below as operator
    if (key === 'Enter') ev.preventDefault();
    calc.pressEquals();
  } else if (key === '+' || key === '-' || key === '*' || key === '/') {
    // Support negative-entry with '-' when no pending operator and not entering
    if (key === '-' && typeof calc.isEntering === 'function' && typeof calc.getPendingOp === 'function') {
      const entering = calc.isEntering();
      const pending = calc.getPendingOp();
      if (!entering && !pending) {
        calc.pressToggleSign();
      } else {
        calc.pressOperator('-');
      }
    } else {
      calc.pressOperator(key);
    }
  } else if (key === 'n') {
    // Optional keyboard: 'n' toggles sign
    calc.pressToggleSign();
  }
  render();
}

window.addEventListener('keydown', handleKeydown);

// Initial render
render();
