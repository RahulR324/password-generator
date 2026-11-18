const CHAR_SETS = {
  uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  lowercase: "abcdefghijklmnopqrstuvwxyz",
  numbers: "0123456789",
  symbols: "!@#$%^&*()_+-=[]{}|;:,.<>?/~"
};

const AMBIGUOUS_CHARS = new Set(["I", "l", "1", "O", "0", "o", "|"]);
const MIN_LENGTH = 4;
const MAX_LENGTH = 20;

const els = {
  result: document.getElementById("result"),
  field: document.getElementById("password-field"),
  length: document.getElementById("length"),
  lengthValue: document.getElementById("length-value"),
  uppercase: document.getElementById("uppercase"),
  lowercase: document.getElementById("lowercase"),
  numbers: document.getElementById("numbers"),
  symbols: document.getElementById("symbols"),
  excludeAmbiguous: document.getElementById("exclude-ambiguous"),
  generate: document.getElementById("generate"),
  quickGenerate: document.getElementById("quick-generate"),
  clipboard: document.getElementById("clipboard"),
  toggleVisibility: document.getElementById("toggle-visibility"),
  strength: document.getElementById("strength"),
  strengthLabel: document.getElementById("strength-label"),
  strengthDetail: document.getElementById("strength-detail"),
  notice: document.getElementById("notice"),
  toast: document.getElementById("toast")
};

const state = {
  password: "",
  revealed: true
};

const hasSecureRandom =
  typeof window.crypto !== "undefined" && typeof window.crypto.getRandomValues === "function";

let toastTimer = null;
let copyTimer = null;

function secureRandomInt(max) {
  const range = 4294967296;
  const limit = range - (range % max);
  const buffer = new Uint32Array(1);
  let value = 0;

  do {
    window.crypto.getRandomValues(buffer);
    value = buffer[0];
  } while (value >= limit);

  return value % max;
}

function shuffle(items) {
  for (let i = items.length - 1; i > 0; i -= 1) {
    const j = secureRandomInt(i + 1);
    const tmp = items[i];
    items[i] = items[j];
    items[j] = tmp;
  }
  return items;
}

function clampLength(value) {
  if (!Number.isFinite(value)) return MAX_LENGTH;
  return Math.min(MAX_LENGTH, Math.max(MIN_LENGTH, Math.round(value)));
}

function buildPools(types, excludeAmbiguous) {
  return types
    .map((type) => {
      const chars = CHAR_SETS[type];
      if (!excludeAmbiguous) return [...chars];
      return [...chars].filter((char) => !AMBIGUOUS_CHARS.has(char));
    })
    .filter((pool) => pool.length > 0);
}

function createPassword(length, types, excludeAmbiguous) {
  const pools = buildPools(types, excludeAmbiguous);
  if (pools.length === 0) return null;

  const combined = pools.flat();
  const characters = [];

  pools.forEach((pool) => {
    if (characters.length < length) {
      characters.push(pool[secureRandomInt(pool.length)]);
    }
  });

  while (characters.length < length) {
    characters.push(combined[secureRandomInt(combined.length)]);
  }

  shuffle(characters);

  return {
    password: characters.join(""),
    poolSize: combined.length
  };
}

function evaluateStrength(password, poolSize) {
  if (!password || !poolSize) {
    return { level: "none", label: "—", detail: "No password yet" };
  }

  const bits = Math.round(password.length * Math.log2(poolSize));
  let level;
  let label;

  if (bits < 40) {
    level = "weak";
    label = "Weak";
  } else if (bits < 60) {
    level = "fair";
    label = "Fair";
  } else if (bits < 80) {
    level = "strong";
    label = "Strong";
  } else {
    level = "very-strong";
    label = "Very Strong";
  }

  return {
    level,
    label,
    detail: `≈ ${bits} bits of entropy`
  };
}

function updateStrength(password, poolSize) {
  const strength = evaluateStrength(password, poolSize);
  els.strength.className = `strength is-${strength.level}`;
  els.strengthLabel.textContent = strength.label;
  els.strengthDetail.textContent = strength.detail;
}

function render() {
  const masked = !state.revealed;
  const hasPassword = Boolean(state.password);

  if (!hasPassword) {
    els.result.textContent = "";
    els.result.classList.remove("is-masked");
  } else {
    els.result.textContent = masked ? "\u2022".repeat(state.password.length) : state.password;
    els.result.classList.toggle("is-masked", masked);
  }

  els.toggleVisibility.classList.toggle("is-revealed", hasPassword && state.revealed);
  els.toggleVisibility.setAttribute("aria-pressed", String(hasPassword && masked));
  els.toggleVisibility.setAttribute("aria-label", masked ? "Show password" : "Hide password");
}

function syncLengthUI() {
  const value = clampLength(Number(els.length.value));
  const percent = ((value - MIN_LENGTH) / (MAX_LENGTH - MIN_LENGTH)) * 100;
  els.length.style.setProperty("--fill", `${percent}%`);
  els.lengthValue.textContent = String(value);
}

function pulseField() {
  els.field.classList.remove("is-fresh");
  requestAnimationFrame(() => els.field.classList.add("is-fresh"));
}

function showNotice(message) {
  els.notice.textContent = message;
  els.notice.hidden = false;
}

function clearNotice() {
  els.notice.textContent = "";
  els.notice.hidden = true;
}

function showToast(message, isError = false) {
  window.clearTimeout(toastTimer);
  els.toast.textContent = message;
  els.toast.classList.toggle("is-error", isError);
  els.toast.classList.add("is-visible");
  toastTimer = window.setTimeout(() => els.toast.classList.remove("is-visible"), 2400);
}

function collectTypes() {
  const types = [];
  if (els.uppercase.checked) types.push("uppercase");
  if (els.lowercase.checked) types.push("lowercase");
  if (els.numbers.checked) types.push("numbers");
  if (els.symbols.checked) types.push("symbols");
  return types;
}

function generate() {
  if (!hasSecureRandom) return;

  clearNotice();
  const types = collectTypes();

  if (types.length === 0) {
    state.password = "";
    state.revealed = true;
    render();
    updateStrength("", 0);
    showNotice("Select at least one character type to generate a password.");
    return;
  }

  const length = clampLength(Number(els.length.value));
  const result = createPassword(length, types, els.excludeAmbiguous.checked);

  if (!result) {
    state.password = "";
    state.revealed = true;
    render();
    updateStrength("", 0);
    showNotice("These settings leave no usable characters. Choose a different character set.");
    return;
  }

  state.password = result.password;
  state.revealed = true;
  render();
  updateStrength(result.password, result.poolSize);
  pulseField();
}

function toggleReveal() {
  if (!state.password) return;
  state.revealed = !state.revealed;
  render();
}

function legacyCopy(text) {
  const area = document.createElement("textarea");
  area.value = text;
  area.setAttribute("readonly", "");
  area.style.position = "fixed";
  area.style.top = "-1000px";
  area.style.opacity = "0";
  document.body.appendChild(area);
  area.select();

  let succeeded = false;
  try {
    succeeded = document.execCommand("copy");
  } finally {
    document.body.removeChild(area);
  }

  if (!succeeded) throw new Error("Copy command was rejected");
}

function markCopied() {
  els.clipboard.classList.add("is-copied");
  els.clipboard.setAttribute("aria-label", "Password copied");
  showToast("Password copied to clipboard");
  window.clearTimeout(copyTimer);
  copyTimer = window.setTimeout(() => {
    els.clipboard.classList.remove("is-copied");
    els.clipboard.setAttribute("aria-label", "Copy password");
  }, 1600);
}

function handleCopy() {
  if (!state.password) {
    showToast("Generate a password first", true);
    return;
  }

  const fallback = () => {
    try {
      legacyCopy(state.password);
      markCopied();
    } catch (error) {
      showToast("Copy is not available in this browser", true);
    }
  };

  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(state.password).then(markCopied).catch(fallback);
  } else {
    fallback();
  }
}

function init() {
  if (!hasSecureRandom) {
    els.generate.disabled = true;
    updateStrength("", 0);
    showNotice(
      "This browser does not expose crypto.getRandomValues, so secure passwords cannot be generated here. Please use a modern browser."
    );
    return;
  }

  syncLengthUI();
  generate();

  els.generate.addEventListener("click", generate);
  if (els.quickGenerate) {
    els.quickGenerate.addEventListener("click", generate);
  }
  els.clipboard.addEventListener("click", handleCopy);
  els.toggleVisibility.addEventListener("click", toggleReveal);
  els.length.addEventListener("input", () => {
    syncLengthUI();
    generate();
  });

  [els.uppercase, els.lowercase, els.numbers, els.symbols, els.excludeAmbiguous].forEach(
    (checkbox) => checkbox.addEventListener("change", generate)
  );
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
