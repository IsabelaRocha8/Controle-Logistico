let containersAdicionados = [];

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
        
        carregarKPIsPrevisao();
        carregarContainerCards();
    }
});

// Ajusta campos obrigatórios conforme o modal selecionado
function configurarObrigatoriedade() {
    const modal = document.getElementById('modalPrevisao').value;
    const inputConteudo = document.getElementById('conteudoPrevisao');
    const inputTransp = document.getElementById('transportadoraPrevisao');
    const labelConteudo = document.getElementById('labelConteudo');
    const labelTransp = document.getElementById('labelTransportadora');
    const hintContainer = document.getElementById('hintContainer');
    const inputContainer = document.getElementById('containerPrevisao');

    if (modal === 'Aereo') {
        inputConteudo.required = false;
        inputTransp.required = false;
        labelConteudo.textContent = "CONTEÚDO";
        labelTransp.textContent = "TRANSPORTADORA";
        hintContainer.textContent = "Identificação livre para Aéreo";
        inputContainer.removeAttribute('maxlength');
    } else {
        inputConteudo.required = true;
        inputTransp.required = true;
        labelConteudo.textContent = "CONTEÚDO *";
        labelTransp.textContent = "TRANSPORTADORA *";
        hintContainer.textContent = "Formato ISO 6346: AAAA9999999";
        inputContainer.setAttribute('maxlength', '11');
    }
}

function adicionarContainer() {
    const input = document.getElementById('containerPrevisao');
    const container = input.value.toUpperCase().trim();
    const modal = document.getElementById('modalPrevisao').value;

    if (!container) return;

    if (modal === 'Maritimo' && container.length !== 11) {
        alert("Contentor marítimo deve ter 11 caracteres.");
        return;
    }

    if (!containersAdicionados.includes(container)) {
        containersAdicionados.push(container);
        atualizarListaContainers();
        input.value = '';
    }
}

function atualizarListaContainers() {
    const lista = document.getElementById('listaContainers');
    lista.innerHTML = containersAdicionados.map((c, i) => `
        <span style="background: #E6F0FA; padding: 5px 10px; border-radius: 4px; border: 1px solid #00469B; display: inline-flex; align-items: center; gap: 8px;">
            ${c} <i class="fas fa-times" style="cursor:pointer; color:red;" onclick="removerContainer(${i})"></i>
        </span>
    `).join('');
}

function removerContainer(index) {
    containersAdicionados.splice(index, 1);
    atualizarListaContainers();
}

async function salvarPrevisao() {
    const modal = document.getElementById('modalPrevisao').value;
    const sj = document.getElementById('sjPrevisao').value.toUpperCase();
    const conteudo = document.getElementById('conteudoPrevisao').value.toUpperCase();
    const transportadora = document.getElementById('transportadoraPrevisao').value.toUpperCase();
    const dataPrevisao = document.getElementById('dataPrevisao').value;
    
    const msgErro = document.getElementById('mensagemErroPrevisao');
    const msgSucesso = document.getElementById('mensagemSucessoPrevisao');

    if (!modal || !sj || !dataPrevisao || containersAdicionados.length === 0) {
        msgErro.textContent = "Preencha todos os campos obrigatórios.";
        msgErro.classList.add('show');
        return;
    }

    const usuarioLogado = localStorage.getItem('usuarioLogado') || 'ADMIN';
    const agora = new Date();

    const registros = containersAdicionados.map(cont => ({
        status: 'PREVISTO',
        sj: sj,
        conteudo: modal === 'Aereo' ? (conteudo || 'CARGA AÉREA') : conteudo,
        container: cont,
        dataPrevisao: dataPrevisao,
        transportadora: modal === 'Aereo' ? (transportadora || 'N/A') : transportadora,
        usuario: usuarioLogado,
        modalImportacao: modal,
        dataRegistro: agora.toLocaleDateString('pt-BR')
    }));

    try {
        // Envio para a API utilizando o método correto do seu apiClient.js
        for (const reg of registros) {
            await window.apiClient.createPrevisao(reg);
        }

        // Atualização do cache local para persistência offline/imediata
        const previsoesLocais = JSON.parse(localStorage.getItem('previsoesChegada')) || [];
        localStorage.setItem('previsoesChegada', JSON.stringify([...previsoesLocais, ...registros]));

        msgSucesso.textContent = "Previsão guardada com sucesso!";
        msgSucesso.classList.add('show');
        
        setTimeout(() => location.reload(), 1500);
    } catch (err) {
        console.error("Erro no cadastro:", err);
        msgErro.textContent = err.message || "Erro ao ligar ao servidor.";
        msgErro.classList.add('show');
    }
}