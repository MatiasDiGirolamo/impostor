// Estado y operaciones puras del juego (no DOM)
export const state = {
  stage: "setup",        // setup | roster | reveal | done
  count: 6,
  names: Array(12).fill(""),
  impostorIndex: null,
  revealed: [],
  activeIdx: null
};

export const clampPlayers = (n) => Math.max(3, Math.min(12, n));

export function setCount(n) {
  state.count = clampPlayers(n);
}

export function setName(i, value) {
  state.names[i] = value;
}

export function allNamed() {
  return state.names.slice(0, state.count).every(n => (n || "").trim().length > 0);
}

export function createGame() {
  state.impostorIndex = Math.floor(Math.random() * state.count);
  state.revealed = Array(state.count).fill(false);
  state.stage = "roster";
}

export function openReveal(idx) {
  state.activeIdx = idx;
  state.stage = "reveal";
}

export function confirmReveal() {
  const i = state.activeIdx;
  if (i == null) return false;
  state.revealed[i] = true;
  state.activeIdx = null;
  const done = state.revealed.filter(Boolean).length >= state.count;
  state.stage = done ? "done" : "roster";
  return done;
}

export function resetGame() {
  state.impostorIndex = null;
  state.revealed = [];
  state.activeIdx = null;
  state.stage = "setup";
}
