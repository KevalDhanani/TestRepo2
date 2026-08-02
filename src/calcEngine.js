// Pure calculator engine ES module
// Implements immediate execution, repeated equals, C/AC modes, and error handling.

function asOperator(op) {
  if (op === '×') return '*';
  if (op === '÷') return '/';
  return op;
}

function applyOp(op, a, b) {
  switch (op) {
    case '+':
      return a + b;
    case '-':
      return a - b;
    case '*':
      return a * b;
    case '/':
      if (b === 0) return Infinity; // will be treated as error
      return a / b;
    default:
      return b;
  }
}

function formatNumber(n) {
  if (!Number.isFinite(n)) return 'Error';
  // Avoid floating noise; show up to 12 significant digits
  const abs = Math.abs(n);
  if (abs === 0) return '0';
  // Use toPrecision for very big/small numbers
  if (abs >= 1e12 || abs < 1e-6) {
    return n.toExponential(6).replace(/\.?0+e/, 'e');
  }
  // Round to 12 decimal places then trim
  const s = n.toFixed(12);
  return s.replace(/\.0+$/, '').replace(/\.(.*?)(0+)$/, (m, a) => (a ? `.${a}` : ''));
}

export function createCalculator() {
  // Internal state
  let entry = '0'; // current entry as string
  let entryDirty = false; // whether entry has been modified since last commit
  let entering = true; // whether we are editing entry (true) or showing accumulator (false)
  let accumulator = null; // number | null
  let pendingOp = null; // '+', '-', '*', '/' | null
  let lastOp = null; // for repeated equals
  let lastOperand = null; // number | null
  let error = false;

  function resetAll() {
    entry = '0';
    entryDirty = false;
    entering = true;
    accumulator = null;
    pendingOp = null;
    lastOp = null;
    lastOperand = null;
    error = false;
  }

  function currentValue() {
    // parse entry to number safely
    const n = Number(entry);
    return Number.isFinite(n) ? n : 0;
  }

  function commitEntryToAccumulatorIfNeeded() {
    if (entering) {
      const val = currentValue();
      if (accumulator == null) {
        accumulator = val;
      } else if (pendingOp) {
        const res = applyOp(pendingOp, accumulator, val);
        if (!Number.isFinite(res)) {
          error = true;
          accumulator = null;
          pendingOp = null;
          return;
        }
        accumulator = res;
        lastOp = pendingOp;
        lastOperand = val;
      } else {
        // No pending op: replace accumulator with current entry
        accumulator = val;
      }
      entering = false;
      entry = '0';
      entryDirty = false;
    }
  }

  function getDisplay() {
    if (error) return 'Error';
    if (entering) return entry;
    if (accumulator == null) return '0';
    return formatNumber(accumulator);
  }

  function pressDigit(d) {
    if (error) resetAll();
    if (d === undefined || d === null) return;
    const ch = String(d);
    if (!/^[0-9.]$/.test(ch)) return;
    if (!entering) {
      // start a new entry
      entry = '0';
      entering = true;
      entryDirty = false;
    }
    if (ch === '.') {
      if (entry.includes('.')) return; // ignore extra dots
      entry += '.';
    } else {
      if (entry === '0') entry = ch; else entry += ch;
    }
    entryDirty = true;
  }

  function pressOperator(op) {
    if (error) return;
    const o = asOperator(op);
    if (!['+', '-', '*', '/'].includes(o)) return;

    // If user was entering a value, commit it with previous pending op
    commitEntryToAccumulatorIfNeeded();

    // If no accumulator yet (e.g., pressing operator first), treat as 0
    if (accumulator == null) accumulator = 0;

    // Set/replace pending operator with the new one
    pendingOp = o;

    // After choosing operator, we are not entering a new number yet
    entering = false;
    entry = '0';
    entryDirty = false;
  }

  function pressEquals() {
    if (error) return;

    if (pendingOp) {
      let right;
      if (entering) {
        right = currentValue();
        lastOp = pendingOp;
        lastOperand = right;
      } else {
        // No new right operand entered; repeat using accumulator as right (e.g., 3 + = gives 6)
        right = accumulator == null ? 0 : accumulator;
        lastOp = pendingOp;
        lastOperand = right;
      }
      const left = accumulator == null ? 0 : accumulator;
      const res = applyOp(pendingOp, left, right);
      if (!Number.isFinite(res)) {
        error = true;
        accumulator = null;
        pendingOp = null;
        entering = false;
        entryDirty = false;
        return;
      }
      accumulator = res;
      pendingOp = null;
      entering = false;
      entry = '0';
      entryDirty = false;
      return;
    }

    // No pending operator, but maybe we have a last operation to repeat
    if (lastOp && lastOperand != null) {
      const left = entering ? currentValue() : (accumulator == null ? 0 : accumulator);
      const res = applyOp(lastOp, left, lastOperand);
      if (!Number.isFinite(res)) {
        error = true;
        accumulator = null;
        entering = false;
        entryDirty = false;
        return;
      }
      accumulator = res;
      entering = false;
      entry = '0';
      entryDirty = false;
      return;
    }

    // If still entering without ops, just finalize entry to accumulator for display consistency
    if (entering) {
      accumulator = currentValue();
      entering = false;
      entry = '0';
      entryDirty = false;
    }
  }

  function pressBackspace() {
    if (error) return;
    if (!entering) {
      // Start editing current display value
      entry = getDisplay();
      entering = true;
      entryDirty = true;
    }
    if (entry.length <= 1 || (entry.length === 2 && entry.startsWith('-'))) {
      entry = '0';
      entryDirty = false; // back to pristine entry
      return;
    }
    entry = entry.slice(0, -1);
    // Clean trailing dot state (avoid ending with '-')
    if (entry === '-' || entry === '-0') {
      entry = '0';
      entryDirty = false;
    }
  }

  function pressToggleSign() {
    if (error) return;
    if (entering) {
      if (entry === '0' || entry === '0.') {
        // Toggle sign of zero: keep as '-0' to show intent
        entry = entry.startsWith('-') ? entry.slice(1) : '-' + entry;
      } else if (entry.startsWith('-')) {
        entry = entry.slice(1);
      } else {
        entry = '-' + entry;
      }
      entryDirty = true;
    } else {
      if (accumulator == null) accumulator = 0;
      accumulator = -accumulator;
    }
  }

  function pressClear() {
    if (error) {
      resetAll();
      return;
    }
    // Clear only current entry
    entry = '0';
    entering = true;
    entryDirty = false;
  }

  function pressAllClear() {
    resetAll();
  }

  function getClearMode() {
    return entryDirty ? 'C' : 'AC';
  }

  function isError() {
    return error;
  }

  return {
    pressDigit,
    pressOperator,
    pressEquals,
    pressBackspace,
    pressToggleSign,
    pressClear,
    pressAllClear,
    getDisplay,
    getClearMode,
    isError,
  };
}
