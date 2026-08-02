// Simple calculator engine with immediate execution, repeated equals,
// decimals, sign toggle, backspace, clear, and divide-by-zero handling.
// Public API: createCalculator() -> calculator with the methods referenced below.

export function createCalculator() {
  // Internal state
  let accumulator = 0; // last committed value
  let entry = ''; // current entry buffer when entering digits/decimal/sign
  let entering = false; // whether user is typing a number
  let pendingOp = null; // '+', '-', '*', '/'
  let lastOperator = null; // last executed operator for repeated equals
  let lastOperand = null; // right operand used in last execution
  let error = false;

  function resetAll() {
    accumulator = 0;
    entry = '';
    entering = false;
    pendingOp = null;
    lastOperator = null;
    lastOperand = null;
    error = false;
  }

  function toNumber(str) {
    if (str === '' || str === '-' || str === '.') return 0;
    return Number(str);
  }

  function currentDisplay() {
    if (error) return 'Error';
    if (entering) return normalizeEntry(entry);
    return formatNumber(accumulator);
  }

  function normalizeEntry(s) {
    // Avoid showing just '-' or empty
    if (s === '' || s === '-') return '0';
    // Remove leading zeros unless immediately before decimal
    if (s.startsWith('-')) {
      const neg = s[0];
      const rest = s.slice(1);
      return neg + normalizePositive(rest);
    }
    return normalizePositive(s);
  }

  function normalizePositive(s) {
    if (s === '' || s === '.') return '0' + (s === '.' ? '.' : '');
    if (s.startsWith('0') && !s.startsWith('0.')) {
      // trim leading zeros but keep single 0 if the entire number is 0
      const trimmed = s.replace(/^0+(?=\d)/, '');
      return trimmed === '' ? '0' : trimmed;
    }
    return s;
  }

  function formatNumber(n) {
    // show up to 12 significant digits, but avoid scientific for typical ranges
    if (!Number.isFinite(n)) return 'Error';
    const abs = Math.abs(n);
    if (abs !== 0 && (abs < 1e-10 || abs >= 1e12)) {
      return n.toExponential(6);
    }
    // Round to 12 significant digits then strip trailing zeros
    const rounded = Number.parseFloat(n.toPrecision(12));
    let s = String(rounded);
    if (s.includes('e') || s.includes('E')) return s;
    if (s.includes('.')) s = s.replace(/\.0+$/, '').replace(/(\.[0-9]*?)0+$/, '$1');
    return s;
  }

  function apply(op, left, right) {
    switch (op) {
      case '+':
        return left + right;
      case '-':
        return left - right;
      case '*':
        return left * right;
      case '/':
        if (right === 0) return Infinity; // will be treated as error
        return left / right;
      default:
        return right;
    }
  }

  function commitEntryIfAny() {
    if (entering) {
      const n = toNumber(entry);
      accumulator = n;
      entering = false;
      entry = '';
    }
  }

  function ensureNotError() {
    if (error) {
      resetAll();
    }
  }

  function pressDigit(d) {
    ensureNotError();
    if (typeof d !== 'string') d = String(d);
    if (!/^[0-9]$/.test(d)) return;

    if (!entering) {
      entering = true;
      entry = d === '0' ? '0' : d;
    } else {
      // Append digit with simple length guard
      if (entry === '0') {
        entry = d; // replace leading zero
      } else if (entry === '-0') {
        entry = '-' + d;
      } else if (entry.replace('-', '').replace('.', '').length < 16) {
        entry += d;
      }
    }
  }

  function pressDecimal() {
    ensureNotError();
    if (!entering) {
      entering = true;
      entry = '0.';
      return;
    }
    if (!entry.includes('.')) {
      entry += '.';
    }
  }

  function pressToggleSign() {
    ensureNotError();
    if (!entering) {
      // toggle accumulator
      accumulator = -accumulator;
      return;
    }
    if (entry.startsWith('-')) entry = entry.slice(1);
    else if (entry !== '0') entry = '-' + entry; // don't show -0
  }

  function executePendingIfReady() {
    if (pendingOp != null && entering) {
      const right = toNumber(entry);
      const result = apply(pendingOp, accumulator, right);
      if (!Number.isFinite(result)) {
        // divide by zero or overflow
        error = true;
        pendingOp = null;
        entering = false;
        entry = '';
        lastOperator = null;
        lastOperand = null;
        accumulator = NaN;
        return;
      }
      accumulator = result;
      lastOperator = pendingOp;
      lastOperand = right;
      entering = false;
      entry = '';
    }
  }

  function pressOperator(op) {
    ensureNotError();
    if (!['+', '-', '*', '/'].includes(op)) return;

    if (pendingOp == null && !entering) {
      // nothing to do, just set up pending operator on current accumulator
      pendingOp = op;
      return;
    }

    if (pendingOp == null && entering) {
      // first operator after typing a number: move entry to accumulator
      accumulator = toNumber(entry);
      entering = false;
      entry = '';
      // do not set lastOperand here yet; only after an execution happens
    } else if (pendingOp != null) {
      // there is a pending operation; if user typed a number, execute it
      executePendingIfReady();
      if (error) return;
    }

    // Update operator (immediate execution pattern)
    pendingOp = op;
  }

  function pressEquals() {
    ensureNotError();
    if (pendingOp != null) {
      if (entering) {
        // execute with typed right operand
        const right = toNumber(entry);
        const result = apply(pendingOp, accumulator, right);
        if (!Number.isFinite(result)) {
          error = true;
          pendingOp = null;
          entering = false;
          entry = '';
          lastOperator = null;
          lastOperand = null;
          accumulator = NaN;
          return;
        }
        accumulator = result;
        lastOperator = pendingOp;
        lastOperand = right;
        pendingOp = null;
        entering = false;
        entry = '';
      } else {
        // No new entry; repeat last typed operand with the current pending op
        const right = lastOperand != null ? lastOperand : accumulator;
        const result = apply(pendingOp, accumulator, right);
        if (!Number.isFinite(result)) {
          error = true;
          pendingOp = null;
          lastOperator = null;
          lastOperand = null;
          return;
        }
        accumulator = result;
        lastOperator = pendingOp;
        lastOperand = right;
        pendingOp = null;
      }
      return;
    }

    // No pending op: repeated equals uses lastOperator and lastOperand
    if (lastOperator != null && lastOperand != null) {
      const result = apply(lastOperator, accumulator, lastOperand);
      if (!Number.isFinite(result)) {
        error = true;
        lastOperator = null;
        lastOperand = null;
        return;
      }
      accumulator = result;
    }
  }

  function pressBackspace() {
    ensureNotError();
    if (!entering) return; // nothing to backspace
    if (entry.length <= 1 || (entry.length === 2 && entry.startsWith('-'))) {
      entry = '';
      entering = false;
    } else {
      entry = entry.slice(0, -1);
    }
  }

  function pressClear() {
    // If currently typing, clear entry; otherwise, clear all
    if (error) {
      resetAll();
      return;
    }
    if (entering) {
      entry = '';
      entering = false;
      return;
    }
    resetAll();
  }

  function getDisplay() {
    return currentDisplay();
  }

  // Additional helpers for the UI (not required by acceptance checks)
  function isEntering() {
    return entering;
  }
  function getPendingOp() {
    return pendingOp;
  }
  function getClearMode() {
    // C when we have an entry to clear or after entering a number; otherwise AC
    if (error) return 'AC';
    return entering ? 'C' : 'AC';
  }

  return {
    // Required API surface (checked by tests)
    pressDigit,
    pressOperator,
    pressEquals,
    pressBackspace,
    pressToggleSign,
    pressDecimal,
    pressClear,
    getDisplay,
    // Optional helpers
    isEntering,
    getPendingOp,
    getClearMode,
  };
}
