const API_URL = "/api";

async function requestJson(path, options) {
  const res = await fetch(`${API_URL}/${path}`, options);
  const text = await res.text();

  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    throw new Error(`Resposta não é JSON: ${text}`);
  }

  if (!res.ok) {
    const msg = data?.error || `HTTP ${res.status}`;
    throw new Error(msg);
  }

  return data;
}

async function obterDados(chave) {
  try {
    return await requestJson(chave);
  } catch (e) {
    console.error(`Erro ao obter ${chave}:`, e);
    return [];
  }
}

async function adicionarDado(chave, dado) {
  return await requestJson(chave, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dado),
  });
}

// API pública
const obterHistorico = () => obterDados("historico");
const salvarHistorico = (registro) => adicionarDado("historico", registro);

const obterPrevisoes = () => obterDados("previsoes");
const salvarPrevisao = (previsao) => adicionarDado("previsoes", previsao);

const obterNILs = () => obterDados("nils");
const salvarNIL = (nil) => adicionarDado("nils", nil);

// Sessão
const obterUsuarioLogado = () => localStorage.getItem("usuarioLogado");
const definirUsuarioLogado = (u) => localStorage.setItem("usuarioLogado", u);