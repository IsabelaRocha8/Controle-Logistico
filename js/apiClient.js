const API_BASE = "/api";

async function apiRequest(path, options) {
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

const apiClient = {
  getHistorico() {
    return apiRequest("/historico");
  },
  createHistorico(payload) {
    return apiRequest("/historico", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  },
  getPrevisoes() {
    return apiRequest("/previsoes");
  },
  createPrevisao(payload) {
    return apiRequest("/previsoes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  },
  getNils() {
    return apiRequest("/nils");
  },
  createNil(payload) {
    return apiRequest("/nils", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  },
  health() {
    return apiRequest("/health");
  },
};

window.apiClient = apiClient;


