// Manipulación del DOM y renderizado de “pantallas”
import {
  state, setCount, setName, allNamed,
  createGame, openReveal, confirmReveal, resetGame
} from "./state.js";

const qs  = (s) => document.querySelector(s);

// Vistas
const viewSetup  = qs('#view-setup');
const viewRoster = qs('#view-roster');
const viewDone   = qs('#view-done');
const namesWrap  = qs('#names');
const listWrap   = qs('#list');
const warnAll    = qs('#warn-all');
const countEl    = qs('#count');
// Modal revelación
const modal      = qs('#modal');
const modalRole  = qs('#modal-role');
const modalName  = qs('#modal-name');
// Modal configuración
const cfgModal   = qs('#config-modal');
const cfgPaises  = qs('#cfg-paises');
const cfgLigas   = qs('#cfg-ligas');

// Datos cargados del JSON
let jugadoresRaw = [];           // [{nombre, pais, liga}, ...]
// Selección de filtros (Sets para multiselección)
let filtros = { paises: new Set(), ligas: new Set() };

// Jugador global de la ronda (todos ven el mismo)
let globalFootballPlayer = null;

/* ============ Pantallas ============ */
export function show(stage) {
  viewSetup.hidden  = stage !== 'setup';
  viewRoster.hidden = stage !== 'roster';
  viewDone.hidden   = stage !== 'done';
}

/* ============ Setup nombres ============ */
export function renderNameInputs() {
  namesWrap.innerHTML = '';
  for (let i = 0; i < state.count; i++) {
    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'Jugador ' + (i + 1);
    input.maxLength = 30;
    input.value = state.names[i] || '';
    input.addEventListener('input', (e) => {
      setName(i, e.target.value);
      updateCreateButton();
    });
    namesWrap.appendChild(input);
  }
  updateCreateButton();
}

export function updateCreateButton() {
  const ok = allNamed();
  qs('#btn-create').disabled = !ok;
  warnAll.style.display = ok ? 'none' : '';
}

export function renderCount() {
  countEl.textContent = state.count;
}

/* ============ Roster ============ */
export function renderRoster() {
  listWrap.innerHTML = '';
  for (let i = 0; i < state.count; i++) {
    const b = document.createElement('button');
    b.className = 'player' + (state.revealed[i] ? ' seen' : '');
    b.disabled = !!state.revealed[i];
    b.innerHTML = `
      <span class="name" style="font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${state.names[i]}</span>
      <span class="hint">${state.revealed[i] ? 'visto' : 'tocar para ver'}</span>
    `;
    b.addEventListener('click', () => {
      openReveal(i);
      openModal(i);
    });
    listWrap.appendChild(b);
  }
}

/* ============ Carga JSON local ============ */
async function loadJugadores() {
  if (jugadoresRaw.length) return jugadoresRaw;
  const res = await fetch('./resources/jugadores.json');
  if (!res.ok) throw new Error('No pude cargar resources/jugadores.json');
  const data = await res.json();
  jugadoresRaw = Array.isArray(data) ? data : [data];
  return jugadoresRaw;
}

/* ============ Configuración (chips multiselección) ============ */
function uniqueSorted(arr) {
  return Array.from(new Set(arr.filter(Boolean))).sort((a,b)=>a.localeCompare(b));
}

function renderChips(container, values, selectedSet, type) {
  container.innerHTML = '';
  values.forEach(val => {
    const chip = document.createElement('button');
    chip.className = 'chip' + (selectedSet.has(val) ? ' active' : '');
    chip.dataset.type = type;   // 'pais' | 'liga'
    chip.dataset.value = val;
    chip.textContent = val;
    container.appendChild(chip);
  });
}

async function prepareConfigUI() {
  await loadJugadores();
  const paises = uniqueSorted(jugadoresRaw.map(j => j.pais));
  const ligas  = uniqueSorted(jugadoresRaw.map(j => j.liga));
  renderChips(cfgPaises, paises, filtros.paises, 'pais');
  renderChips(cfgLigas,  ligas,  filtros.ligas,  'liga');
}

export function openConfig() {
  prepareConfigUI().catch(()=>{});
  cfgModal.hidden = false;
}
export function closeConfig() {
  cfgModal.hidden = true;
}
export function toggleChip(el) {
  const type = el.dataset.type; // 'pais' | 'liga'
  const val  = el.dataset.value;
  const set  = type === 'pais' ? filtros.paises : filtros.ligas;
  if (set.has(val)) { set.delete(val); el.classList.remove('active'); }
  else { set.add(val); el.classList.add('active'); }
}
export function clearConfig() {
  filtros.paises.clear();
  filtros.ligas.clear();
  prepareConfigUI();
}
export function applyConfig() {
  // Opcional: guardar en localStorage
  // localStorage.setItem('impostor.filters', JSON.stringify({
  //   paises: Array.from(filtros.paises),
  //   ligas: Array.from(filtros.ligas)
  // }));
  closeConfig();
  // Reiniciamos jugador global para que la próxima ronda use los filtros
  globalFootballPlayer = null;
}

/* ============ Selección jugador random con filtros ============ */
function getFilteredPlayers() {
  const useAll = filtros.paises.size === 0 && filtros.ligas.size === 0;
  if (useAll) return jugadoresRaw;

  return jugadoresRaw.filter(j => {
    const okPais = filtros.paises.size ? filtros.paises.has(j.pais) : true;
    const okLiga = filtros.ligas.size  ? filtros.ligas.has(j.liga) : true;
    return okPais && okLiga;
  });
}

async function getRandomFootballPlayer() {
  await loadJugadores();
  const pool = getFilteredPlayers();
  if (!pool.length) {
    // Si la combinación filtrada no tiene resultados, usar todos.
    const fallback = jugadoresRaw;
    if (!fallback.length) {
      return { name: 'Jugador invitado', team: '', nationality: '' };
    }
    const p = fallback[Math.floor(Math.random()*fallback.length)];
    return { name: p.nombre || 'Jugador invitado', team: p.liga || '', nationality: p.pais || '' };
  }
  const pick = pool[Math.floor(Math.random()*pool.length)];
  return { name: pick.nombre || 'Jugador', team: pick.liga || '', nationality: pick.pais || '' };
}

/* ============ Modal de revelación ============ */
export async function openModal(idx) {
  const isImp = idx === state.impostorIndex;
  modal.hidden = false;

  if (isImp) {
    modalRole.textContent = 'IMPOSTOR';
    modalRole.className = 'role bad';
    modalName.textContent = state.names[idx];
    return;
  }

  if (!globalFootballPlayer) {
    modalRole.textContent = 'Cargando…';
    modalRole.className = 'role ok';
    modalName.textContent = state.names[idx];
    globalFootballPlayer = await getRandomFootballPlayer();
  }

  const p = globalFootballPlayer;
  modalRole.textContent = p.name;
  modalRole.className = 'role ok';
  modalName.innerHTML = `
    <div style="display:flex;flex-direction:column;align-items:center;gap:8px;margin-top:6px;">
      <span style="font-weight:700">${p.name}</span>
      ${(p.team || p.nationality)
        ? `<span style="font-size:13px;color:#9ca3af">${p.team}${p.team && p.nationality ? ' · ' : ''}${p.nationality}</span>`
        : ''}
    </div>
  `;
}

export function closeModal() {
  modal.hidden = true;
}

export function onConfirmReveal() {
  const done = confirmReveal();
  closeModal();
  if (done) {
    show('done');
  } else {
    renderRoster();
    show('roster');
  }
}

/* ============ Handlers y ciclo de vida ============ */
export function decCount() { setCount(state.count - 1); renderCount(); renderNameInputs(); }
export function incCount() { setCount(state.count + 1); renderCount(); renderNameInputs(); }

export async function startGame() {
  // Reiniciar jugador global para que use filtros aplicados
  globalFootballPlayer = await getRandomFootballPlayer();
  createGame();
  renderRoster();
  show('roster');
}

export function restart() {
  resetGame();
  globalFootballPlayer = null;
  show('setup');
  renderNameInputs();
  renderCount();
}
