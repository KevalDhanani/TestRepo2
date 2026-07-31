// DOM wiring for the accessible calculator, powered by a pure engine
import { createCalculator } from './src/calcEngine.js';

const calc = createCalculator();

const display = document.getElementById('display');
const keys = document.querySelector('.keys');

function render() {
  display.textContent = calc.getDisplay();
  // Update AC/C label based on engine mode
  const clearBtn = document.querySelector('[data-action="clear"]');
  if (clearBtn) clearBtn.textContent = calc.getClearMode();
}

function handleAction(action) {
  switch (action) {
    case 'clear':
      if (calc.getClearMode() === 'C') calc.pressClear(); else calc.pressAllClear();
      break;
    case 'backspace':
      calc.pressBackspace();
      break;
    case 'toggle-sign':
      calc.pressToggleSign();
      break;
    case 'divide':
      calc.pressOperator('÷');
      break;
    case 'multiply':
      calc.pressOperator('×');
      break;
    case 'subtract':
      calc.pressOperator('-');
      break;
    case 'add':
      calc.pressOperator('+');
      break;
    case 'dot':
      calc.pressDigit('.');
      break;
    case 'equals':
      calc.pressEquals();
      break;
  }
}

// Click handling
if (keys) {
  keys.addEventListener('click', (e) => {
    const t = e.target;
    if (!(t instanceof HTMLElement)) return;

    const digit = t.getAttribute('data-digit');
    const action = t.getAttribute('data-action');

    if (digit != null) {
      calc.pressDigit(digit);
    } else if (action) {
      handleAction(action);
    }
    render();
  });
}

// Keyboard support
window.addEventListener('keydown', (e) => {
  const { key } = e;
  if (/^[0-9]$/.test(key)) {
    calc.pressDigit(key);
  } else if (key === '.' || key === ',') {
    e.preventDefault();
    calc.pressDigit('.');
  } else if (['+', '-', '*', '/'].includes(key)) {
    e.preventDefault();
    const map = { '*': '×', '/': '÷' };
    calc.pressOperator(map[key] || key);
  } else if (key === 'Enter' || key === '=') {
    e.preventDefault();
    calc.pressEquals();
  } else if (key === 'Escape') {
    e.preventDefault();
    if (calc.getClearMode() === 'C') calc.pressClear(); else calc.pressAllClear();
  } else if (key === 'Backspace') {
    e.preventDefault();
    calc.pressBackspace();
  }
  render();
});

// Initial render
render();
