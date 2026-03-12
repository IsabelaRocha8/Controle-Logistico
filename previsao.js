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
    const item = previsoes[previsaoSelecionada];
    if (!item) return;

    const agora = new Date();
    const modalidade = (item.modalImportacao === 'Aereo') ? 'Aéreo' : 'Marítimo';

    const payloadChegada = {
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
        if (window.DB?.registrarChegada) {
            await window.DB.registrarChegada(payloadChegada);
        } else if (window.DB?.adicionarHistorico) {
            await window.DB.adicionarHistorico(payloadChegada);
            const hoje = agora.toISOString().split('T')[0];
            previsoes[previsaoSelecionada] = { ...item, status: 'CHEGOU', dataChegada: hoje, horaInicio, horaFinal, responsavel, cte, doca };
            localStorage.setItem('previsoesChegada', JSON.stringify(previsoes));
        } else {
            throw new Error('Integração de API indisponível.');
        }
    } catch (err) {
        mensagemErro.textContent = err?.message || 'Erro ao registrar chegada.';
        mensagemErro.classList.add('show');
        return;
    }

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

function verificarPermissoesCadastro() {
    const perfil = localStorage.getItem('perfilUsuario');
    const form = document.getElementById('formCadastroContainer');
    if (form) form.style.display = (perfil === 'ADMIN' || perfil === 'IMPORTACAO') ? 'block' : 'none';
}

// ================= FUNÇÕES DE CHEGADA (ADMIN) =================
function abrirModalChegada(index) {
    const previsoes = JSON.parse(localStorage.getItem('previsoesChegada')) || [];
    previsaoSelecionada = index;
    const item = previsoes[index];
    
    if (!item) return;

    const modal = document.getElementById('modalRegistrarChegada');
    if (modal) {
        if(document.getElementById('modalContainer')) document.getElementById('modalContainer').textContent = item.container;
        if(document.getElementById('modalSJ')) document.getElementById('modalSJ').textContent = item.sj;
        
        // Limpar campos
        const campos = ['responsavelChegada', 'cteChegada', 'docaChegada', 'horaInicioChegada', 'horaFinalChegada'];
        campos.forEach(id => {
            const el = document.getElementById(id);
            if(el) el.value = '';
        });
        
        modal.style.display = 'flex';
    } else {
        console.error('Modal modalRegistrarChegada não encontrado.');
    }
}

function fecharModalChegada() {
    const modal = document.getElementById('modalRegistrarChegada');
    if (modal) modal.style.display = 'none';
    previsaoSelecionada = null;
}

async function confirmarChegada() {
    if (previsaoSelecionada === null) return;
    
    const responsavel = document.getElementById('responsavelChegada').value.toUpperCase();
    const cte = document.getElementById('cteChegada').value.toUpperCase();
    const doca = document.getElementById('docaChegada').value;
    const horaInicio = document.getElementById('horaInicioChegada').value;
    const horaFinal = document.getElementById('horaFinalChegada').value;
    
    if (!responsavel || !cte || !doca || !horaInicio || !horaFinal) {
        alert('Todos os campos são obrigatórios!');
        return;
    }
    
    const previsoes = JSON.parse(localStorage.getItem('previsoesChegada')) || [];
    const item = previsoes[previsaoSelecionada];
    const agora = new Date();
    const hoje = agora.toISOString().split('T')[0];
    
    // Calcular tempo
    let tempoMinutos = 0;
    let tempoFormatado = '00:00';
    if (horaInicio && horaFinal) {
        const [hI, mI] = horaInicio.split(':').map(Number);
        const [hF, mF] = horaFinal.split(':').map(Number);
        tempoMinutos = (hF * 60 + mF) - (hI * 60 + mI);
        if (tempoMinutos < 0) tempoMinutos = 0;
        const h = Math.floor(tempoMinutos / 60);
        const m = tempoMinutos % 60;
        tempoFormatado = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
    }

    const registroHistorico = {
        sj: item.sj,
        container: item.container,
        cte: cte,
        doca: doca,
        horaInicio: horaInicio,
        horaFinal: horaFinal,
        responsavel: responsavel,
        transportadora: item.transportadora || '-',
        modalidade: item.modalImportacao || 'Marítimo',
        dataRegistro: agora.toISOString(),
        tempoMinutos: tempoMinutos,
        tempoFormatado: tempoFormatado
    };
    
    const atualizacaoPrevisao = {
        status: 'CHEGOU',
        dataChegada: hoje,
        horaInicio: horaInicio,
        horaFinal: horaFinal,
        responsavel: responsavel,
        cte: cte,
        doca: doca,
        timestampChegada: agora.toISOString()
    };

    try {
        if (window.DB) {
            await window.DB.adicionarHistorico(registroHistorico);
            
            if (item.id) {
                await window.DB.atualizarPrevisao(item.id, atualizacaoPrevisao);
            } else {
                previsoes[previsaoSelecionada] = { ...item, ...atualizacaoPrevisao };
                localStorage.setItem('previsoesChegada', JSON.stringify(previsoes));
            }
            
            if (window.DB.init) await window.DB.init();
        }
        
        fecharModalChegada();
        carregarContainerCards();
        carregarKPIsPrevisao();
        
    } catch (error) {
        console.error("Erro ao salvar:", error);
        alert('Erro ao salvar no sistema.');
    }
}