// Configuração da URL da API - Aponta para a Vercel
const API_URL = '/api';

// Função genérica para buscar dados
async function obterDados(chave) {
    try {
        const response = await fetch(`${API_URL}/${chave}`);
        if (!response.ok) throw new Error('Erro na requisição ao servidor');
        return await response.json();
    } catch (error) {
        console.error(`Erro ao obter ${chave}:`, error);
        return [];
    }
}

// Função genérica para salvar dados
async function adicionarDado(chave, dado) {
    try {
        const response = await fetch(`${API_URL}/${chave}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dado)
        });
        if (!response.ok) throw new Error('Erro ao salvar no servidor');
        return await response.json();
    } catch (error) {
        console.error(`Erro ao adicionar em ${chave}:`, error);
        throw error;
    }
}

// Funções específicas utilizadas pelo restante do sistema
async function obterHistorico() { return await obterDados('historico'); }
async function salvarHistorico(registro) { return await adicionarDado('historico', registro); }

async function obterPrevisoes() { return await obterDados('previsoes'); }
async function salvarPrevisao(previsao) { return await adicionarDado('previsoes', previsao); }

// Mantemos o localStorage APENAS para a sessão do usuário logado (opcional)
function obterUsuarioLogado() { return localStorage.getItem('usuarioLogado'); }
function definirUsuarioLogado(u) { localStorage.setItem('usuarioLogado', u); }