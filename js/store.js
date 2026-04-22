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
      status: (row.status ?? '').toString().trim().toUpperCase(),
      dataPrevisao: row.dataPrevisao ?? row.dataprevisao ?? row.data_previsao ?? row.data_previsao,
      dataChegada: row.dataChegada ?? row.datachegada ?? row.data_chegada ?? null,
      sj: (row.sj ?? '').toString().trim().toUpperCase(),
      container: (row.container ?? '').toString().trim().toUpperCase(),
      conteudo: (row.conteudo ?? '').toString().trim().toUpperCase(),
      transportadora: (row.transportadora ?? '').toString().trim().toUpperCase(),
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
    if (!window.apiClient) {
      console.error('[DB.init] apiClient não disponível');
      return;
    }

    try {
      await syncToLocal(window.apiClient.getHistorico, "historico");
      console.log('[DB.init] Histórico sincronizado com sucesso');
    } catch (err) {
      console.error('[DB.init] Erro ao sincronizar histórico:', err.message);
    }

    try {
      await syncToLocal(window.apiClient.getPrevisoes, "previsoesChegada");
      console.log('[DB.init] Previsões sincronizadas com sucesso');
    } catch (err) {
      console.error('[DB.init] Erro ao sincronizar previsões:', err.message);
    }

    try {
      await syncToLocal(window.apiClient.getNils, "nilsGerados");
      console.log('[DB.init] NILs sincronizados com sucesso');
    } catch (err) {
      console.error('[DB.init] Erro ao sincronizar NILs:', err.message);
    }
  },

  obter(key) {
    return readLocal(key, []);
  },

  removerLocal(key, index) {
    const arr = readLocal(key, []);
    arr.splice(index, 1);
    writeLocal(key, arr);
  },

  async removerHistorico(id) {
    if (!window.apiClient) {
      throw new Error("API client não disponível");
    }

    await window.apiClient.deleteHistorico(id);

    const historico = readLocal("historico", []);
    const atualizado = historico.filter((item) => item.id !== id);
    writeLocal("historico", atualizado);
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


  async registrarChegada(dados) {
    if (!window.apiClient) {
      throw new Error("API client não disponível");
    }

    console.log('[DB.registrarChegada] Iniciando...');
    const response = await window.apiClient.registrarChegada(dados);
    console.log('[DB.registrarChegada] Resposta da API:', response);
    
    console.log('[DB.registrarChegada] Sincronizando previsões...');
    try {
      await syncToLocal(window.apiClient.getPrevisoes, "previsoesChegada");
      const previsoesAtualizadas = readLocal("previsoesChegada", []);
      console.log('[DB.registrarChegada] Previsões após sincronização:', previsoesAtualizadas.length, 'itens');
      
      // Log dos itens para verificação
      const itemEncontrado = previsoesAtualizadas.find(p => 
        (p.sj || '').toString().trim().toUpperCase() === dados.sj && 
        (p.container || '').toString().trim().toUpperCase() === dados.container
      );
      if (itemEncontrado) {
        console.log('[DB.registrarChegada] Item encontrado no servidor:', {sj: itemEncontrado.sj, container: itemEncontrado.container, status: itemEncontrado.status});
      } else {
        console.warn('[DB.registrarChegada] AVISO: Item não encontrado nas previsões após sincronização!', {sj: dados.sj, container: dados.container});
      }
    } catch (syncErr) {
      console.error('[DB.registrarChegada] Erro ao sincronizar previsões:', syncErr);
      throw new Error('Erro ao sincronizar previsões: ' + syncErr.message);
    }
    
    console.log('[DB.registrarChegada] Sincronizando histórico...');
    try {
      await syncToLocal(window.apiClient.getHistorico, "historico");
      const historicoAtualizado = readLocal("historico", []);
      console.log('[DB.registrarChegada] Histórico após sincronização:', historicoAtualizado.length, 'itens');
      
      // Log do novo item no histórico
      const novoItem = historicoAtualizado.find(h => 
        (h.sj || '').toString().trim().toUpperCase() === dados.sj && 
        (h.container || '').toString().trim().toUpperCase() === dados.container
      );
      if (novoItem) {
        console.log('[DB.registrarChegada] Novo item no histórico encontrado:', {sj: novoItem.sj, container: novoItem.container});
      } else {
        console.warn('[DB.registrarChegada] AVISO: Novo item não encontrado no histórico após sincronização!', {sj: dados.sj, container: dados.container});
      }
    } catch (syncErr) {
      console.error('[DB.registrarChegada] Erro ao sincronizar histórico:', syncErr);
      throw new Error('Erro ao sincronizar histórico: ' + syncErr.message);
    }
    
    return response;
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


