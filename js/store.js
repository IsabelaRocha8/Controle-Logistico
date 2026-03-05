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

  if (!Array.isArray(rows)) {
    writeLocal(storageKey, []);
    return;
  }

  // Normaliza campos vindos do Postgres para o formato esperado pelo frontend
  let normalizados = rows;

  if (storageKey === "historico") {
    normalizados = rows.map((row) => ({
      ...row,
      horaInicio: row.horaInicio ?? row.horainicio ?? "",
      horaFinal: row.horaFinal ?? row.horafinal ?? "",
      dataRegistro: row.dataRegistro ?? row.dataregistro ?? null,
      tempoMinutos: row.tempoMinutos ?? row.tempominutos ?? null,
      tempoFormatado: row.tempoFormatado ?? row.tempoformatado ?? null,
    }));
  }

  if (storageKey === "previsoesChegada") {
    normalizados = rows.map((row) => ({
      ...row,
      dataPrevisao: row.dataPrevisao ?? row.dataprevisao ?? row.data_previsao ?? row.data_previsao,
      dataChegada: row.dataChegada ?? row.datachegada ?? row.data_chegada ?? null,
    }));
  }

  if (storageKey === "nilsGerados") {
    normalizados = rows.map((row) => ({
      ...row,
      data: row.data ?? row.data_nil ?? row.datanil ?? row.data,
      hora: row.hora ?? row.horanil ?? row.hora_nil ?? row.hora,
    }));
  }

  writeLocal(storageKey, normalizados);
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


