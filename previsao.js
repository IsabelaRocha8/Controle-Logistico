// =============================================================================
// CONTROLE LOGÍSTICO - PREVISÃO DE CHEGADA (VERSÃO INTEGRAL)
// =============================================================================

let containersAdicionados = [];
let filtroAtivo = false;
let previsaoSelecionada = null;
let previsaoParaExcluir = null;

// ================= 1. INICIALIZAÇÃO E EVENTOS =================
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('formPrevisao');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            salvarPrevisao();
        });
        
        // Configura campos de texto para maiúsculas automaticamente
        const camposParaMaiusculo = [
            'sjPrevisao', 'conteudoPrevisao', 'containerPrevisao', 
            'transportadoraPrevisao', 'filtroSJ', 'filtroContainer', 
            'responsavelChegada', 'cteChegada'
        ];
        
        camposParaMaiusculo.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener('input', function(e) {
                    const start = e.target.selectionStart;
                    const end = e.target.selectionEnd;
                    e.target.value = e.target.value.toUpperCase();
                    e.target.setSelectionRange(start, end);
                });
            }
        });
        
        // Inicializa dados e permissões
        carregarKPIsPrevisao();
        carregarContainerCards();
        verificarPermissoesCadastro();
        configurarCampoModal();
    }
});

// ================= 2. REGRAS DE NEGÓCIO DO FORMULÁRIO =================
function configurarCampoModal() {
    const perfil = localStorage.getItem('perfilUsuario');
    const campoModal = document.getElementById('campoModalImportacao');
    const selectModal = document.getElementById('modalPrevisao');
    const inputContainer = document.getElementById('containerPrevisao');
    const hintContainer = document.getElementById('hintContainer');
    const inputConteudo = document.getElementById('conteudoPrevisao');
    const inputTransp = document.getElementById('transportadoraPrevisao');
    const labelConteudo = document.querySelector('label[for="conteudoPrevisao"]');
    const labelTransp = document.querySelector('label[for="transportadoraPrevisao"]');

    // Mostra o seletor de Modal para Admin e Importação
    if ((perfil === 'ADMIN' || perfil === 'IMPORTACAO') && campoModal) {
        campoModal.style.display = 'block';
        
        if (selectModal) {
            selectModal.addEventListener('change', function() {
                const modal = this.value;
                const isAereo = (modal === 'Aereo');
                
                if (isAereo) {
                    // Regras para Aéreo: Identificação livre e campos opcionais
                    inputContainer.removeAttribute('maxlength');
                    if (hintContainer) hintContainer.textContent = 'Identificação livre (sem validação ISO)';
                    inputConteudo.required = false;
                    inputTransp.required = false;
                    if (labelConteudo) labelConteudo.textContent = "CONTEÚDO";
                    if (labelTransp) labelTransp.textContent = "TRANSPORTADORA";
                } else {
                    // Regras para Marítimo: ISO 6346 e campos obrigatórios
                    inputContainer.setAttribute('maxlength', '11');
                    if (hintContainer) hintContainer.textContent = 'Formato ISO 6346: AAAA9999999';
                    inputConteudo.required = true;
                    inputTransp.required = true;
                    if (labelConteudo) labelConteudo.textContent = "CONTEÚDO *";
                    if (labelTransp) labelTransp.textContent = "TRANSPORTADORA *";
                }
            });
        }
    }
}

// ================= 3. GESTÃO DA LISTA DE CONTENTORES =================
function adicionarContainer() {
    const input = document.getElementById('containerPrevisao');
    const container = input.value.toUpperCase().trim();
    const modal = document.getElementById('modalPrevisao')?.value;

    if (!container) return;

    // Validação de formato para Marítimo
    if (modal === 'Maritimo' || !modal) {
        const isoRegex = /^[A-Z]{4}[0-9]{7}$/;
        if (container.length !== 11 || !isoRegex.test(container)) {
            alert("Contentor marítimo inválido! Use o padrão ISO (4 letras + 7 números).");
            return;
        }
    }

    if (containersAdicionados.includes(container)) {
        alert("Este contentor já foi adicionado à lista.");
        return;
    }

    containersAdicionados.push(container);
    input.value = '';
    input.focus();
    atualizarListaContainers();
}

function atualizarListaContainers() {
    const lista = document.getElementById('listaContainers');
    if (!lista) return;

    if (containersAdicionados.length === 0) {
        lista.innerHTML = '';
        return;
    }

    let html = `<div style="background:#E6F0FA; padding:15px; border-radius:8px; border:1px solid #00469B; margin-top:10px;">
                <p style="margin-bottom:10px; font-weight:bold; color:#00469B;">Contentores Adicionados (${containersAdicionados.length}):</p>
                <div style="display:flex; flex-wrap:wrap; gap:8px;">`;
    
    containersAdicionados.forEach((c, i) => {
        html += `<span style="background:white; border:2px solid #00469B; padding:5px 12px; border-radius:6px; display:flex; align-items:center; gap:10px; font-weight:bold;">
                    ${c} <i class="fas fa-times-circle" style="color:#dc3545; cursor:pointer;" onclick="removerContainer(${i})"></i>
                 </span>`;
    });
    
    html += `</div></div>`;
    lista.innerHTML = html;
}

function removerContainer(index) {
    containersAdicionados.splice(index, 1);
    atualizarListaContainers();
}

// ================= 4. SALVAR E COMUNICAÇÃO COM API =================
async function salvarPrevisao() {
    const modal = document.getElementById('modalPrevisao').value;
    const sj = document.getElementById('sjPrevisao').value.toUpperCase().trim();
    const conteudo = document.getElementById('conteudoPrevisao').value.toUpperCase().trim();
    const transportadora = document.getElementById('transportadoraPrevisao').value.toUpperCase().trim();
    const dataPrevisao = document.getElementById('dataPrevisao').value;
    
    const msgErro = document.getElementById('mensagemErroPrevisao');
    const msgSucesso = document.getElementById('mensagemSucessoPrevisao');

    if (containersAdicionados.length === 0) {
        msgErro.textContent = "Adicione pelo menos um contentor à lista!";
        msgErro.classList.add('show');
        return;
    }

    // Prepara os dados para cada contentor da lista
    const payload = containersAdicionados.map(cont => ({
        status: 'PREVISTO',
        sj: sj,
        conteudo: conteudo || (modal === 'Aereo' ? 'CARGA AÉREA' : ''),
        container: cont,
        dataPrevisao: dataPrevisao,
        transportadora: transportadora || (modal === 'Aereo' ? 'N/A' : ''),
        usuario: (localStorage.getItem('usuarioLogado') || 'ADMIN').toUpperCase(),
        modalImportacao: modal,
        dataRegistro: new Date().toLocaleDateString('pt-BR'),
        timestamp: new Date().toISOString()
    }));

    try {
        // Envio para a API (Garante persistência no banco de dados)
        for (const registro of payload) {
            await window.apiClient.createPrevisao(registro);
        }

        // Atualiza cache local para refletir no Dashboard imediatamente
        const previsoesAtuais = JSON.parse(localStorage.getItem('previsoesChegada')) || [];
        localStorage.setItem('previsoesChegada', JSON.stringify([...previsoesAtuais, ...payload]));

        msgSucesso.textContent = "Previsão registada com sucesso!";
        msgSucesso.classList.add('show');
        msgErro.classList.remove('show');

        setTimeout(() => {
            location.reload(); // Recarrega para limpar tudo e atualizar cards
        }, 1500);

    } catch (err) {
        console.error("Erro no salvamento:", err);
        msgErro.textContent = "Erro ao ligar ao servidor: " + (err.message || "Tente novamente.");
        msgErro.classList.add('show');
    }
}

// ================= 5. DASHBOARD E INTERFACE =================
function carregarKPIsPrevisao() {
    const dados = JSON.parse(localStorage.getItem('previsoesChegada')) || [];
    const hoje = new Date().toISOString().split('T')[0];
    
    const atrasados = dados.filter(i => i.status !== 'CHEGOU' && i.dataPrevisao < hoje).length;
    const paraHoje = dados.filter(i => i.status !== 'CHEGOU' && i.dataPrevisao === hoje).length;

    if(document.getElementById('kpiAtrasados')) document.getElementById('kpiAtrasados').textContent = atrasados;
    if(document.getElementById('kpiHoje')) document.getElementById('kpiHoje').textContent = paraHoje;
}

function carregarContainerCards() {
    const dados = JSON.parse(localStorage.getItem('previsoesChegada')) || [];
    const containerUI = document.getElementById('containerCards');
    if (!containerUI) return;

    if (dados.length === 0) {
        containerUI.innerHTML = '<div class="no-data-card">Nenhuma previsão registada</div>';
        return;
    }

    // Ordenar por data (mais recentes primeiro)
    dados.sort((a, b) => new Date(b.dataPrevisao) - new Date(a.dataPrevisao));

    containerUI.innerHTML = dados.map((item, index) => `
        <div class="container-card">
            <div class="container-card-header">
                <div class="container-card-badges">
                    <span class="badge badge-${item.status.toLowerCase()}">${item.status}</span>
                    <span class="badge modal-tag">${item.modalImportacao || 'Marítimo'}</span>
                </div>
            </div>
            <div class="container-card-body">
                <div class="container-card-info">
                    <i class="fas fa-box"></i>
                    <div><span class="info-label">Container</span><span class="info-value">${item.container}</span></div>
                </div>
                <div class="container-card-info">
                    <i class="fas fa-file-alt"></i>
                    <div><span class="info-label">SJ</span><span class="info-value">${item.sj}</span></div>
                </div>
                <div class="container-card-info">
                    <i class="fas fa-calendar-alt"></i>
                    <div><span class="info-label">Data Prevista</span><span class="info-value">${new Date(item.dataPrevisao + 'T00:00:00').toLocaleDateString('pt-BR')}</span></div>
                </div>
            </div>
            ${item.status !== 'CHEGOU' ? `
            <div class="container-card-footer">
                <button class="btn-card-action" onclick="abrirModalChegada(${index})">
                    <i class="fas fa-truck-loading"></i> Chegou
                </button>
            </div>` : ''}
        </div>
    `).join('');
}

function verificarPermissoesCadastro() {
    const perfil = localStorage.getItem('perfilUsuario');
    const formContainer = document.getElementById('formCadastroContainer');
    if (formContainer) {
        formContainer.style.display = (perfil === 'ADMIN' || perfil === 'IMPORTACAO') ? 'block' : 'none';
    }
}