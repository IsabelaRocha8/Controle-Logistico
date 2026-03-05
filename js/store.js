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

async function syncToLocal(fetchFn, storageKey) {
  const rows = await fetchFn();
  writeLocal(storageKey, Array.isArray(rows) ? rows : []);
}

const DB = {
  async init() {
    if (!window.apiClient) return;

    try {
      await syncToLocal(window.apiClient.getHistorico, "historico");
    } catch {}

    try {
      await syncToLocal(window.apiClient.getPrevisoes, "previsoesChegada");
    } catch {}

    try {
      await syncToLocal(window.apiClient.getNils, "nilsGerados");
    } catch {}
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
    if (!window.apiClient) {
      throw new Error("API client não disponível");
    }

    const r = await window.apiClient.createHistorico(dados);

    const historico = readLocal("historico", []);
    historico.unshift({ ...dados, id: r?.id });
    writeLocal("historico", historico);

    return r;
  },

  async adicionarPrevisao(dados) {
    if (!window.apiClient) {
      throw new Error("API client não disponível");
    }

    const r = await window.apiClient.createPrevisao(dados);

    const previsoes = readLocal("previsoesChegada", []);
    previsoes.unshift({ ...dados, id: r?.id });
    writeLocal("previsoesChegada", previsoes);

    return r;
  },

  async adicionarNil(dados) {
    if (!window.apiClient) {
      throw new Error("API client não disponível");
    }

    const r = await window.apiClient.createNil(dados);

    const nils = readLocal("nilsGerados", []);
    nils.unshift({ ...dados, id: r?.id });
    writeLocal("nilsGerados", nils);

    return r;
  },
};

window.DB = DB;


