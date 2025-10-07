// Orquesta eventos y conecta UI + State + Config
import { state } from "./state.js";
import {
  show, renderNameInputs, renderCount, renderRoster,
  onConfirmReveal, decCount, incCount, startGame, restart,
  openConfig, closeConfig, toggleChip, applyConfig, clearConfig
} from "./ui.js";

const $ = (s) => document.querySelector(s);

function bindEvents() {
  $('#btn-minus').addEventListener('click', decCount);
  $('#btn-plus').addEventListener('click', incCount);
  $('#btn-create').addEventListener('click', startGame);
  $('#btn-reset-1').addEventListener('click', restart);
  $('#btn-reset-2').addEventListener('click', restart);
  $('#btn-ok').addEventListener('click', onConfirmReveal);

  // Permitir ENTER dentro del modal para confirmar
  document.addEventListener('keydown', (e) => {
  const modal = document.getElementById('modal');
  if (!modal.hidden && e.key === 'Enter') {
    e.preventDefault();
    document.getElementById('btn-ok').click();
  }
    });

  
  // Modal revelación → cerrar tocando fuera
  $('#modal').addEventListener('click', (e) => {
    if (e.target.id === 'modal') onConfirmReveal();
  });

  // Configuración
  $('#btn-config').addEventListener('click', openConfig);
  $('#cfg-cancel').addEventListener('click', closeConfig);
  $('#cfg-apply').addEventListener('click', applyConfig);
  $('#cfg-clear').addEventListener('click', clearConfig);
  // chips (delegación dentro del modal)
  document.getElementById('config-modal').addEventListener('click', (e) => {
    const el = e.target.closest('.chip');
    if (!el) return;
    toggleChip(el);
  });
}

function init() {
  show('setup');
  renderCount();
  renderNameInputs();
  bindEvents();
}

init();
