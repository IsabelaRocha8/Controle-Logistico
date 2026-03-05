// =============================================================================
// CONTROLE LOGÍSTICO - PREVISÃO DE CHEGADA (CORREÇÃO DE DATAREGISTRO)
// =============================================================================

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

function configurarObrigatoriedade() {
    const modal = document.getElementById('modalPrevisao').value;
    const isAereo = (modal === 'Aereo');
    
    document.getElementById('conteudoPrevisao').required = !isAereo;
    document.getElementById('transportadoraPrevisao').required = !isAereo;
    
    const inputCont = document.getElementById('containerPrevisao');
    if (isAereo) {
        inputCont.removeAttribute('maxlength');
    } else {
        inputCont.setAttribute('maxlength', '11');
    }
}

function adicionarContainer() {
    const input = document.getElementById('containerPrevisao');
    const cont = input.value.toUpperCase().trim();
    if (!cont) return;

    if (!containersAdicionados.includes(cont)) {
        containersAdicionados.push(cont);
        atualizarListaContainers();
        input.value = '';
    }
}

function atualizarListaContainers() {
    const lista = document.getElementById('listaContainers');
    lista.innerHTML = containersAdicionados.map((c, i) => `
        <span style="background: #E6F0FA; padding: 5px 10px; border-radius: 4px; border: 1px solid #00469B; margin-right: 5px; display: inline-block;">
            ${c} <i class="fas fa-times" style="color:red; cursor:pointer;" onclick="removerContainer(${i})"></i>
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
    const dataPrev = document.getElementById('dataPrevisao').value;
    
    const msgErro = document.getElementById('mensagemErroPrevisao');
    const msgSucesso = document.getElementById('mensagemSucessoPrevisao');

    if (containersAdicionados.length === 0) {
        msgErro.textContent = "Adicione pelo menos um container.";
        msgErro.classList.add('show');
        return;
    }

    const agora = new Date();
    // Formata a data para YYYY-MM-DD que é o padrão aceito pelo Postgres
    const dataHoje = agora.toISOString().split('T')[0];

    const payload = containersAdicionados.map(cont => ({
        status: 'PREVISTO',
        sj: sj,
        conteudo: conteudo || (modal === 'Aereo' ? 'CARGA AÉREA' : ''),
        container: cont,
        dataPrevisao: dataPrev,
        transportadora: transportadora || (modal === 'Aereo' ? 'N/A' : ''),
        usuario: (localStorage.getItem('usuarioLogado') || 'ADMIN').toUpperCase(),
        modalImportacao: modal,
        dataRegistro: dataHoje // <--- CAMPO CORRIGIDO
    }));

    try {
        for (const reg of payload) {
            await window.apiClient.createPrevisao(reg);
        }
        msgSucesso.textContent = "Salvo com sucesso!";
        msgSucesso.classList.add('show');
        setTimeout(() => location.reload(), 1500);
    } catch (err) {
        msgErro.textContent = "Erro: " + err.message;
        msgErro.classList.add('show');
    }
}