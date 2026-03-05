// ================= INICIALIZAR PREVISÃO =================
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('formPrevisao');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            salvarPrevisao();
        });
        
        adicionarConversaoMaiusculo('sjPrevisao');
        adicionarConversaoMaiusculo('conteudoPrevisao');
        adicionarConversaoMaiusculo('containerPrevisao');
        adicionarConversaoMaiusculo('transportadoraPrevisao');
        
        // Listener para mudar obrigatoriedade baseado no modal
        const selectModal = document.getElementById('modalPrevisao');
        if (selectModal) {
            selectModal.addEventListener('change', configurarObrigatoriedade);
        }

        carregarKPIsPrevisao();
        carregarContainerCards();
        verificarPermissoesCadastro();
    }
});

let containersAdicionados = [];

function configurarObrigatoriedade() {
    const modal = document.getElementById('modalPrevisao').value;
    const inputConteudo = document.getElementById('conteudoPrevisao');
    const inputTransp = document.getElementById('transportadoraPrevisao');
    const labelConteudo = document.querySelector('label[for="conteudoPrevisao"]');
    const labelTransp = document.querySelector('label[for="transportadoraPrevisao"]');

    if (modal === 'Aereo') {
        inputConteudo.required = false;
        inputTransp.required = false;
        labelConteudo.textContent = "CONTEÚDO";
        labelTransp.textContent = "TRANSPORTADORA";
    } else {
        inputConteudo.required = true;
        inputTransp.required = true;
        labelConteudo.textContent = "CONTEÚDO *";
        labelTransp.textContent = "TRANSPORTADORA *";
    }
}

// ================= SALVAR PREVISÃO =================
async function salvarPrevisao() {
    const modal = document.getElementById('modalPrevisao').value;
    const sj = document.getElementById('sjPrevisao').value.toUpperCase().trim();
    const conteudo = document.getElementById('conteudoPrevisao').value.toUpperCase().trim();
    const transportadora = document.getElementById('transportadoraPrevisao').value.toUpperCase().trim();
    const dataPrevisao = document.getElementById('dataPrevisao').value;
    
    const mensagemErro = document.getElementById('mensagemErroPrevisao');
    const mensagemSucesso = document.getElementById('mensagemSucessoPrevisao');

    if (!modal || !sj || !dataPrevisao || containersAdicionados.length === 0) {
        mensagemErro.textContent = "Preencha os campos obrigatórios e adicione containers!";
        mensagemErro.classList.add('show');
        return;
    }

    const usuarioLogado = localStorage.getItem('usuarioLogado') || 'ADMIN';
    const agora = new Date();

    const registros = containersAdicionados.map(container => ({
        status: 'PREVISTO',
        sj: sj,
        conteudo: modal === 'Aereo' ? (conteudo || 'CARGA AÉREA') : conteudo,
        container: container,
        dataPrevisao: dataPrevisao,
        transportadora: modal === 'Aereo' ? (transportadora || 'N/A') : transportadora,
        usuario: usuarioLogado,
        modalImportacao: modal,
        dataRegistro: agora.toLocaleDateString('pt-BR'),
        timestamp: agora.toISOString()
    }));

    try {
        // 1. Salvar na API
        for (const reg of registros) {
            await apiClient.fetch('/api/previsoes', {
                method: 'POST',
                body: JSON.stringify(reg)
            });
        }

        // 2. Atualizar LocalStorage para refletir na tela imediatamente
        const previsoesLocais = JSON.parse(localStorage.getItem('previsoesChegada')) || [];
        localStorage.setItem('previsoesChegada', JSON.stringify([...previsoesLocais, ...registros]));

        mensagemSucesso.textContent = "Previsão salva com sucesso!";
        mensagemSucesso.classList.add('show');
        
        limparFormularioPrevisao();
        carregarKPIsPrevisao();
        carregarContainerCards();
    } catch (error) {
        mensagemErro.textContent = "Erro ao conectar com o servidor.";
        mensagemErro.classList.add('show');
    }
}

function adicionarContainer() {
    const input = document.getElementById('containerPrevisao');
    const container = input.value.toUpperCase().trim();
    if (container.length === 11) {
        containersAdicionados.push(container);
        input.value = '';
        atualizarListaContainers();
    } else {
        alert("Container deve ter 11 caracteres.");
    }
}

function atualizarListaContainers() {
    const lista = document.getElementById('listaContainers');
    lista.innerHTML = containersAdicionados.map((c, i) => `
        <span class="badge-container">${c} <i class="fas fa-times" onclick="removerContainer(${i})"></i></span>
    `).join('');
}

function removerContainer(index) {
    containersAdicionados.splice(index, 1);
    atualizarListaContainers();
}

function limparFormularioPrevisao() {
    document.getElementById('formPrevisao').reset();
    containersAdicionados = [];
    atualizarListaContainers();
}