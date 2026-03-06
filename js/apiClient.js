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
  deleteHistorico(id) {
    return apiRequest(`/historico?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
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

  getNilPrintHistory() {
    return apiRequest("/nils-print-history");
  },
  createNilPrintHistory(payload) {
    return apiRequest("/nils-print-history", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
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
  // Auth
  login(credentials) {
    return apiRequest("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });
  },
  me(token) {
    return apiRequest("/auth/me", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },
  logout() {
    return apiRequest("/auth/logout", {
      method: "POST",
    });
  },
  // Users (admin)
  listUsers(token) {
    return apiRequest("/users", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },
  createUser(token, payload) {
    return apiRequest("/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
  },
  updateUser(token, id, payload) {
    return apiRequest(`/users/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
  },
  deleteUser(token, id) {
    return apiRequest(`/users/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },
  changePassword(token, payload) {
    return apiRequest("/users/password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
  },
};

window.apiClient = apiClient;


