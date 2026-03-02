// ================= ARMAZENAMENTO COMPARTILHADO =================
// Caminho do arquivo JSON compartilhado na rede
const SHARED_PATH = 'M:/Centro de Manufatura制造中心/Estoque e Logistica仓储物流/SITE NIL/database/dados.json';

// Estrutura de dados padrão
const ESTRUTURA_PADRAO = {
    historico: [],
    previsoesChegada: [],
    etiquetasImpressas: [],
    nilsGerados: [],
    historicoImpressaoNIL: [],
    ultimaAtualizacao: new Date().toISOString()
};

// Cache local para melhor performance
let cacheLocal = null;
let ultimaLeitura = 0;
const TEMPO_CACHE = 2000; // 2 segundos

// ================= FUNÇÕES DE LEITURA/ESCRITA =================

function lerArquivoCompartilhado() {
    try {
        const agora = Date.now();
        
        // Usar cache se ainda válido
        if (cacheLocal && (agora - ultimaLeitura) < TEMPO_CACHE) {
            return cacheLocal;
        }
        
        // Tentar ler do arquivo compartilhado via fetch
        const xhr = new XMLHttpRequest();
        xhr.open('GET', SHARED_PATH + '?t=' + agora, false); // Síncrono
        xhr.send();
        
        if (xhr.status === 200) {
            const dados = JSON.parse(xhr.responseText);
            cacheLocal = dados;
            ultimaLeitura = agora;
            return dados;
        } else {
            // Se arquivo não existe, criar estrutura padrão
            return ESTRUTURA_PADRAO;
        }
    } catch (error) {
        console.warn('Erro ao ler arquivo compartilhado, usando localStorage:', error);
        // Fallback para localStorage se houver erro
        return lerDoLocalStorage();
    }
}

function escreverArquivoCompartilhado(dados) {
    try {
        dados.ultimaAtualizacao = new Date().toISOString();
        
        // Atualizar cache
        cacheLocal = dados;
        ultimaLeitura = Date.now();
        
        // Escrever no arquivo via fetch
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', SHARED_PATH, false); // Síncrono
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.send(JSON.stringify(dados, null, 2));
        
        return xhr.status === 200 || xhr.status === 201;
    } catch (error) {
        console.warn('Erro ao escrever arquivo compartilhado, usando localStorage:', error);
        // Fallback para localStorage se houver erro
        escreverNoLocalStorage(dados);
        return false;
    }
}

// ================= FALLBACK LOCALSTORAGE =================

function lerDoLocalStorage() {
    const dados = { ...ESTRUTURA_PADRAO };
    
    try {
        dados.historico = JSON.parse(localStorage.getItem('historico') || '[]');
        dados.previsoesChegada = JSON.parse(localStorage.getItem('previsoesChegada') || '[]');
        dados.etiquetasImpressas = JSON.parse(localStorage.getItem('etiquetasImpressas') || '[]');
        dados.nilsGerados = JSON.parse(localStorage.getItem('nilsGerados') || '[]');
        dados.historicoImpressaoNIL = JSON.parse(localStorage.getItem('historicoImpressaoNIL') || '[]');
    } catch (error) {
        console.error('Erro ao ler localStorage:', error);
    }
    
    return dados;
}

function escreverNoLocalStorage(dados) {
    try {
        localStorage.setItem('historico', JSON.stringify(dados.historico || []));
        localStorage.setItem('previsoesChegada', JSON.stringify(dados.previsoesChegada || []));
        localStorage.setItem('etiquetasImpressas', JSON.stringify(dados.etiquetasImpressas || []));
        localStorage.setItem('nilsGerados', JSON.stringify(dados.nilsGerados || []));
        localStorage.setItem('historicoImpressaoNIL', JSON.stringify(dados.historicoImpressaoNIL || []));
    } catch (error) {
        console.error('Erro ao escrever localStorage:', error);
    }
}

// ================= API PÚBLICA =================

window.DB = {
    // Obter dados
    obter: function(chave) {
        const dados = lerArquivoCompartilhado();
        return dados[chave] || [];
    },
    
    // Salvar dados
    salvar: function(chave, valor) {
        const dados = lerArquivoCompartilhado();
        dados[chave] = valor;
        escreverArquivoCompartilhado(dados);
    },
    
    // Adicionar item
    adicionar: function(chave, item) {
        const dados = lerArquivoCompartilhado();
        if (!dados[chave]) dados[chave] = [];
        dados[chave].push(item);
        escreverArquivoCompartilhado(dados);
    },
    
    // Atualizar item por índice
    atualizar: function(chave, indice, item) {
        const dados = lerArquivoCompartilhado();
        if (dados[chave] && dados[chave][indice]) {
            dados[chave][indice] = item;
            escreverArquivoCompartilhado(dados);
        }
    },
    
    // Remover item por índice
    remover: function(chave, indice) {
        const dados = lerArquivoCompartilhado();
        if (dados[chave]) {
            dados[chave].splice(indice, 1);
            escreverArquivoCompartilhado(dados);
        }
    },
    
    // Limpar cache (forçar releitura)
    atualizarCache: function() {
        cacheLocal = null;
        ultimaLeitura = 0;
    },
    
    // Migrar dados do localStorage para arquivo compartilhado
    migrarLocalStorage: function() {
        const dadosLocal = lerDoLocalStorage();
        escreverArquivoCompartilhado(dadosLocal);
        alert('Dados migrados com sucesso para o arquivo compartilhado!');
    }
};

// Auto-atualizar cache a cada 5 segundos
setInterval(() => {
    if (document.visibilityState === 'visible') {
        DB.atualizarCache();
    }
}, 5000);
