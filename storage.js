// storage.js
const API_BASE = "/api";

async function requestJson(path, options) {
  const res = await fetch(`${API_BASE}${path}`, options);
  const text = await res.text();

  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    throw new Error(`Resposta não é JSON em ${path}: ${text}`);
  }

  if (!res.ok) {
    throw new Error(data?.error || `HTTP ${res.status} em ${path}`);
  }

  return data;
}

function readLocal(key, fallback = []) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeLocal(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

async function syncToLocal(endpoint, storageKey) {
  const rows = await requestJson(endpoint);
  writeLocal(storageKey, Array.isArray(rows) ? rows : []);
}

const DB = {
  async init() {
    // tenta sincronizar; se falhar, não derruba a UI
    try { await syncToLocal("/historico", "historico"); } catch {}
    try { await syncToLocal("/previsoes", "previsoesChegada"); } catch {}
    try { await syncToLocal("/nils", "nilsGerados"); } catch {}
  },

  obter(key) {
    return readLocal(key, []);
  },

  removerLocal(key, index) {
    const arr = readLocal(key, []);
    arr.splice(index, 1);
    writeLocal(key, arr);
  },

  async adicionarHistorico(dados) {
    const r = await requestJson("/historico", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dados),
    });

    const historico = readLocal("historico", []);
    historico.unshift({ ...dados, id: r?.id });
    writeLocal("historico", historico);

    return r;
  },

  async adicionarPrevisao(dados) {
    const r = await requestJson("/previsoes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dados),
    });

    const previsoes = readLocal("previsoesChegada", []);
    previsoes.unshift({ ...dados, id: r?.id });
    writeLocal("previsoesChegada", previsoes);

    return r;
  },

  async atualizarPrevisao(id, dados) {
    // Se não tiver ID, não consegue atualizar no servidor corretamente
    if (!id) return;

    const r = await requestJson(`/previsoes/${id}`, {
      method: "PUT", // ou PATCH, dependendo da sua API
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dados),
    });

    // Atualiza localmente
    const previsoes = readLocal("previsoesChegada", []);
    const index = previsoes.findIndex((p) => p.id === id);
    if (index !== -1) {
      previsoes[index] = { ...previsoes[index], ...dados };
      writeLocal("previsoesChegada", previsoes);
    }

    return r;
  },

  async adicionarNil(dados) {
    const r = await requestJson("/nils", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dados),
    });

    const nils = readLocal("nilsGerados", []);
    nils.unshift({ ...dados, id: r?.id });
    writeLocal("nilsGerados", nils);

    return r;
  },
};

window.DB = DB;