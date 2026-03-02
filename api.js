// ================= CONFIGURAÇÃO DA API =================
const API_URL = 'http://localhost:3000/api';

// ================= FUNÇÕES DE ARMAZENAMENTO =================

// Substitui localStorage.getItem
async function obterDados(chave) {
    try {
        const response = await fetch(`${API_URL}/${chave}`);
        if (!response.ok) throw new Error('Erro ao buscar dados');
        const dados = await response.json();
        return dados;
    } catch (error) {
        console.error(`Erro ao obter ${chave}:`, error);
        return [];
    }
}

// Substitui localStorage.setItem para adicionar
async function adicionarDado(chave, dado) {
    try {
        const response = await fetch(`${API_URL}/${chave}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dado)
        });
        if (!response.ok) throw new Error('Erro ao adicionar dado');
        return await response.json();
    } catch (error) {
        console.error(`Erro ao adicionar em ${chave}:`, error);
        throw error;
    }
}

// Atualizar dado existente
async function atualizarDado(chave, id, dado) {
    try {
        const response = await fetch(`${API_URL}/${chave}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dado)
        });
        if (!response.ok) throw new Error('Erro ao atualizar dado');
        return await response.json();
    } catch (error) {
        console.error(`Erro ao atualizar ${chave}:`, error);
        throw error;
    }
}

// Excluir dado
async function excluirDado(chave, id) {
    try {
        const response = await fetch(`${API_URL}/${chave}/${id}`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error('Erro ao excluir dado');
        return await response.json();
    } catch (error) {
        console.error(`Erro ao excluir de ${chave}:`, error);
        throw error;
    }
}

// ================= FUNÇÕES ESPECÍFICAS =================

// Histórico
async function obterHistorico() {
    return await obterDados('historico');
}

async function salvarHistorico(registro) {
    return await adicionarDado('historico', registro);
}

async function excluirHistorico(id) {
    return await excluirDado('historico', id);
}

// Previsões
async function obterPrevisoes() {
    return await obterDados('previsoes');
}

async function salvarPrevisao(previsao) {
    return await adicionarDado('previsoes', previsao);
}

async function atualizarPrevisao(id, dados) {
    return await atualizarDado('previsoes', id, dados);
}

async function excluirPrevisao(id) {
    return await excluirDado('previsoes', id);
}

// Etiquetas
async function obterEtiquetas() {
    return await obterDados('etiquetas');
}

async function salvarEtiqueta(etiqueta) {
    return await adicionarDado('etiquetas', etiqueta);
}

// NILs
async function obterNILs() {
    return await obterDados('nils');
}

async function salvarNIL(nil) {
    return await adicionarDado('nils', nil);
}

async function obterHistoricoNIL() {
    return await obterDados('historico-nil');
}

async function salvarHistoricoNIL(registro) {
    return await adicionarDado('historico-nil', registro);
}

// ================= MANTER SESSÃO NO LOCALSTORAGE =================
// Apenas dados de sessão permanecem no localStorage
function obterUsuarioLogado() {
    return localStorage.getItem('usuarioLogado');
}

function definirUsuarioLogado(usuario) {
    localStorage.setItem('usuarioLogado', usuario);
}

function obterPerfilUsuario() {
    return localStorage.getItem('perfilUsuario');
}

function definirPerfilUsuario(perfil) {
    localStorage.setItem('perfilUsuario', perfil);
}

function limparSessao() {
    localStorage.removeItem('usuarioLogado');
    localStorage.removeItem('perfilUsuario');
}
