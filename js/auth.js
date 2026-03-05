const AUTH_STORAGE_KEY = "authToken";

function salvarSessao(authResponse) {
  const { token, user } = authResponse;

  if (!token || !user) return;

  // Guarda o token para chamadas autenticadas
  localStorage.setItem(AUTH_STORAGE_KEY, token);

  // Mantém o mesmo formato que o sistema já usa hoje:
  // usuarioLogado = username
  // perfilUsuario = role (ADMIN | OPERADOR | IMPORTACAO)
  localStorage.setItem("usuarioLogado", user.username);
  localStorage.setItem("perfilUsuario", user.role || "OPERADOR");
}

function limparSessao() {
  localStorage.removeItem(AUTH_STORAGE_KEY);
  localStorage.removeItem("usuarioLogado");
  localStorage.removeItem("perfilUsuario");
}

function obterToken() {
  return localStorage.getItem(AUTH_STORAGE_KEY);
}

async function login(username, password) {
  const resp = await window.apiClient.login({ username, password });
  salvarSessao(resp);
  return resp.user;
}

async function logoutBackend() {
  try {
    await window.apiClient.logout();
  } catch {
    // se der erro, apenas ignoramos
  }
  limparSessao();
}

window.Auth = {
  login,
  logout: logoutBackend,
  obterToken,
};


