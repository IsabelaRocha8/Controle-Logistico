// =============================================================================
// CONTROLE LOGÍSTICO - PREVISÃO DE CHEGADA (VERSÃO FINAL CORRIGIDA)
// =============================================================================

let containersAdicionados = [];
let filtroAtivo = false;
let previsaoSelecionada = null;
let previsaoParaExcluir = null;

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('formPrevisao');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            salvarPrevisao();
        });
        
        // Conversão automática para maiúsculas
        const campos = [
            'sjPrevisao', 'conteudoPrevisao', 'containerPrevisao', 
            'transportadoraPrevisao', 'filtroSJ', 'filtroContainer', 
            'responsavelChegada', 'cteChegada'
        ];
        
        campos.forEach(id => {
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
        
        carregarKPIsPrevisao();
        carregarContainerCards();
        verificarPermissoesCadastro();
        configurarCampoModal();
    }
});

// ================= REGRAS DE MODAL (AÉREO / MARÍTIMO) =================
function configurarCampoModal() {
    const perfil = localStorage.getItem('perfilUsuario');
    const selectModal = document.getElementById('modalPrevisao');
    const inputContainer = document.getElementById('containerPrevisao');
    const hintContainer = document.getElementById('hintContainer');
    const inputConteudo = document.getElementById('conteudoPrevisao');
    const inputTransp = document.getElementById('transportadoraPrevisao');
    const labelConteudo = document.querySelector('label[for="conteudoPrevisao"]');
    const labelTransp = document.querySelector('label[for="transportadoraPrevisao"]');

    if (perfil !== 'ADMIN' && perfil !== 'IMPORTACAO') {
        return;
    }

    const aplicarRegrasModal = (modal) => {
        const isAereo = (modal === 'Aereo');

        if (isAereo) {
            inputContainer.removeAttribute('maxlength');
            if (hintContainer) hintContainer.textContent = 'Identificação livre (Aéreo)';
            inputConteudo.required = false;
            inputTransp.required = false;
            if (labelConteudo) labelConteudo.textContent = 'CONTEÚDO';
            if (labelTransp) labelTransp.textContent = 'TRANSPORTADORA';
        } else {
            inputContainer.setAttribute('maxlength', '11');
            if (hintContainer) hintContainer.textContent = 'Formato ISO 6346: AAAA9999999';
            inputConteudo.required = true;
            inputTransp.required = true;
            if (labelConteudo) labelConteudo.textContent = 'CONTEÚDO *';
            if (labelTransp) labelTransp.textContent = 'TRANSPORTADORA *';
        }
    };

    if (selectModal) {
        selectModal.addEventListener('change', function() {
            aplicarRegrasModal(this.value);
        });

        aplicarRegrasModal(selectModal.value);
    }
}

function configurarObrigatoriedade() {
    const selectModal = document.getElementById('modalPrevisao');
    if (!selectModal) return;
    selectModal.dispatchEvent(new Event('change'));
}

// ================= GESTÃO DE LISTA =================
function adicionarContainer() {
    const input = document.getElementById('containerPrevisao');
    const container = input.value.toUpperCase().trim();
    const modal = document.getElementById('modalPrevisao')?.value;

    if (!container) return;

    if (modal === 'Maritimo' || !modal) {
        if (container.length !== 11) {
            alert("Contentor marítimo deve ter 11 caracteres.");
            return;
        }
    }

    if (containersAdicionados.includes(container)) {
        alert("Este container já está na lista.");
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
    lista.innerHTML = containersAdicionados.map((c, i) => `
        <span style="background:#E6F0FA; padding:5px 10px; border-radius:4px; border:1px solid #00469B; display:inline-flex; align-items:center; gap:8px; margin:4px;">
            ${c} <i class="fas fa-times" style="cursor:pointer; color:red;" onclick="removerContainer(${i})"></i>
        </span>
    `).join('');
}

function removerContainer(index) {
    containersAdicionados.splice(index, 1);
    atualizarListaContainers();
}

// ================= SALVAMENTO (CORREÇÃO DE DATA E HORA) =================
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
    const dataHoje = agora.toISOString().split('T')[0];
    const horaAgora = agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    const payload = containersAdicionados.map(cont => ({
        status: 'PREVISTO',
        sj: sj,
        conteudo: conteudo || (modal === 'Aereo' ? 'CARGA AÉREA' : ''),
        container: cont,
        dataPrevisao: dataPrev,
        transportadora: transportadora || (modal === 'Aereo' ? 'N/A' : ''),
        usuario: (localStorage.getItem('usuarioLogado') || 'ADMIN').toUpperCase(),
        modalImportacao: modal,
        dataRegistro: dataHoje,
        horaRegistro: horaAgora
    }));

    try {
        for (const reg of payload) {
            await window.apiClient.createPrevisao(reg);
        }

        const previsoesLocais = JSON.parse(localStorage.getItem('previsoesChegada')) || [];
        localStorage.setItem('previsoesChegada', JSON.stringify([...previsoesLocais, ...payload]));

        msgSucesso.textContent = "Salvo com sucesso!";
        msgSucesso.classList.add('show');
        setTimeout(() => location.reload(), 1500);
    } catch (err) {
        msgErro.textContent = "Erro: " + err.message;
        msgErro.classList.add('show');
    }
}

// ================= DASHBOARD =================
function carregarKPIsPrevisao() {
    const dados = JSON.parse(localStorage.getItem('previsoesChegada')) || [];
    const hoje = new Date().toISOString().split('T')[0];
    const atrasados = dados.filter(i => i.status !== 'CHEGOU' && i.dataPrevisao < hoje).length;
    const hojeCount = dados.filter(i => i.status !== 'CHEGOU' && i.dataPrevisao === hoje).length;

    if(document.getElementById('kpiAtrasados')) document.getElementById('kpiAtrasados').textContent = atrasados;
    if(document.getElementById('kpiHoje')) document.getElementById('kpiHoje').textContent = hojeCount;
}

function carregarContainerCards() {
    const dados = JSON.parse(localStorage.getItem('previsoesChegada')) || [];
    const containerUI = document.getElementById('containerCards');
    if (!containerUI) return;

    if (dados.length === 0) {
        containerUI.innerHTML = '<div class="no-data-card">Nenhuma previsão encontrada</div>';
        return;
    }

    containerUI.innerHTML = dados.map((item, index) => `
        <div class="container-card">
            <div class="container-card-header">
                <span class="badge badge-${item.status.toLowerCase()}">${item.status}</span>
                <span class="badge modal-tag">${item.modalImportacao || 'Marítimo'}</span>
            </div>
            <div class="container-card-body">
                <p><strong>Container:</strong> ${item.container}</p>
                <p><strong>SJ:</strong> ${item.sj}</p>
                <p><strong>Previsão:</strong> ${new Date(item.dataPrevisao + 'T00:00:00').toLocaleDateString('pt-BR')}</p>
            </div>
            ${item.status !== 'CHEGOU' ? `
            <div class="container-card-footer">
                <button class="btn-card-action" onclick="abrirModalChegada(${index})">Registrar Chegada</button>
            </div>` : ''}
        </div>
    `).join('');
}

function verificarPermissoesCadastro() {
    const perfil = localStorage.getItem('perfilUsuario');
    const form = document.getElementById('formPrevisao');
    if (form) form.style.display = (perfil === 'ADMIN' || perfil === 'IMPORTACAO') ? 'block' : 'none';
}

// ================= REGISTRAR CHEGADA =================
function abrirModalChegada(index) {
    const previsoes = JSON.parse(localStorage.getItem('previsoesChegada')) || [];
    const pendentes = previsoes.filter(item => item.status !== 'CHEGOU');

    previsaoSelecionada = previsoes.indexOf(pendentes[index]);
    const previsao = pendentes[index];
    if (!previsao) return;

    document.getElementById('modalContainer').textContent = previsao.container;
    document.getElementById('modalSJ').textContent = previsao.sj;

    document.getElementById('responsavelChegada').value = '';
    document.getElementById('cteChegada').value = '';
    document.getElementById('docaChegada').value = '';
    document.getElementById('horaInicioChegada').value = '';
    document.getElementById('horaFinalChegada').value = '';

    const mensagemErro = document.getElementById('mensagemErroChegada');
    if (mensagemErro) {
        mensagemErro.textContent = '';
        mensagemErro.classList.remove('show');
    }

    document.getElementById('modalRegistrarChegada').style.display = 'flex';
}

function fecharModalChegada() {
    document.getElementById('modalRegistrarChegada').style.display = 'none';
    previsaoSelecionada = null;
}

async function confirmarChegada() {
    if (previsaoSelecionada === null) return;

    const responsavel = formatarMaiusculo(document.getElementById('responsavelChegada').value);
    const cte = formatarMaiusculo(document.getElementById('cteChegada').value);
    const doca = document.getElementById('docaChegada').value;
    const horaInicio = document.getElementById('horaInicioChegada').value;
    const horaFinal = document.getElementById('horaFinalChegada').value;
    const mensagemErro = document.getElementById('mensagemErroChegada');

    if (!responsavel || !cte || !doca || !horaInicio || !horaFinal) {
        mensagemErro.textContent = 'Todos os campos são obrigatórios!';
        mensagemErro.classList.add('show');
        return;
    }

    const [horaIni, minIni] = horaInicio.split(':').map(Number);
    const [horaFim, minFim] = horaFinal.split(':').map(Number);
    const minutosInicio = horaIni * 60 + minIni;
    const minutosFinal = horaFim * 60 + minFim;

    if (minutosFinal <= minutosInicio) {
        mensagemErro.textContent = 'Hora Final deve ser maior que Hora Início!';
        mensagemErro.classList.add('show');
        return;
    }

    const previsoes = JSON.parse(localStorage.getItem('previsoesChegada')) || [];
    const historico = JSON.parse(localStorage.getItem('historico')) || [];
    const agora = new Date();
    const hoje = agora.toISOString().split('T')[0];

    previsoes[previsaoSelecionada].status = 'CHEGOU';
    previsoes[previsaoSelecionada].dataChegada = hoje;
    previsoes[previsaoSelecionada].horaInicio = horaInicio;
    previsoes[previsaoSelecionada].horaFinal = horaFinal;
    previsoes[previsaoSelecionada].responsavel = responsavel;
    previsoes[previsaoSelecionada].cte = cte;
    previsoes[previsaoSelecionada].doca = doca;
    previsoes[previsaoSelecionada].timestampChegada = agora.toISOString();

    const item = previsoes[previsaoSelecionada];
    const modalidade = (item.modalImportacao === 'Aereo') ? 'Aéreo' : 'Marítimo';

    const registroHistorico = {
        sj: item.sj,
        container: item.container,
        cte,
        doca,
        horaInicio,
        horaFinal,
        responsavel,
        transportadora: item.transportadora || '-',
        modalidade,
        dataRegistro: agora.toISOString(),
        tempoMinutos: calcularTempoMinutos(horaInicio, horaFinal),
        tempoFormatado: calcularTempoFormatado(horaInicio, horaFinal)
    };

    try {
        if (window.DB?.adicionarHistorico) {
            await window.DB.adicionarHistorico(registroHistorico);
        } else {
            historico.push(registroHistorico);
            localStorage.setItem('historico', JSON.stringify(historico));
        }
    } catch (err) {
        console.error('Erro ao salvar histórico na API, mantendo local:', err);
        historico.push(registroHistorico);
        localStorage.setItem('historico', JSON.stringify(historico));
    }

    localStorage.setItem('previsoesChegada', JSON.stringify(previsoes));

    fecharModalChegada();
    carregarKPIsPrevisao();
    carregarContainerCards();
}

function calcularTempoMinutos(horaInicio, horaFinal) {
    if (!horaInicio || !horaFinal) return 0;
    const [horaIni, minIni] = horaInicio.split(':').map(Number);
    const [horaFim, minFim] = horaFinal.split(':').map(Number);
    const minutosInicio = horaIni * 60 + minIni;
    const minutosFinal = horaFim * 60 + minFim;
    return Math.max(0, minutosFinal - minutosInicio);
}

function calcularTempoFormatado(horaInicio, horaFinal) {
    const minutos = calcularTempoMinutos(horaInicio, horaFinal);
    const horas = Math.floor(minutos / 60);
    const mins = minutos % 60;
    return `${String(horas).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}
