// ================= INICIALIZAR DASHBOARD OPERADOR =================
document.addEventListener('DOMContentLoaded', async function() {
    if (window.DB && window.DB.init) {
        await window.DB.init();
    }

    carregarDashboardOperador();
    adicionarConversaoMaiusculo('responsavelChegada');
    adicionarConversaoMaiusculo('cteChegada');
});

let previsaoSelecionada = null;
let previsaoParaEtiqueta = null;

function obterPendentesComPrevisao(previsoes) {
    const historico = JSON.parse(localStorage.getItem('historico')) || [];
    const containersNoHistorico = new Set(
        historico
            .map(item => (item?.container || '').toString().trim().toUpperCase())
            .filter(Boolean)
    );

    return previsoes
        .filter(item => {
            const status = (item?.status || '').toString().trim().toUpperCase();
            const container = (item?.container || '').toString().trim().toUpperCase();
            return status !== 'CHEGOU' && !containersNoHistorico.has(container);
        })
        .sort((a, b) => {
            const dataA = a?.dataPrevisao ? new Date(a.dataPrevisao).getTime() : Number.MAX_SAFE_INTEGER;
            const dataB = b?.dataPrevisao ? new Date(b.dataPrevisao).getTime() : Number.MAX_SAFE_INTEGER;
            return dataA - dataB;
        });
}

// ================= FILTRAR CONTAINER MAIS DEMORADO =================
function filtrarContainerMaisDemorado(pendentes) {
    if (pendentes.length === 0) return pendentes;
    
    // Encontrar o container mais atrasado (com a data de previsão mais antiga)
    let maisDemorado = null;
    let maiorAtraso = -Infinity;
    let indiceMaisDemorado = -1;
    
    pendentes.forEach((item, index) => {
        const dataPrevisao = item?.dataPrevisao ? new Date(item.dataPrevisao) : new Date();
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        
        const diasAtraso = Math.floor((hoje - dataPrevisao) / (1000 * 60 * 60 * 24));
        
        if (diasAtraso > maiorAtraso) {
            maiorAtraso = diasAtraso;
            maisDemorado = item;
            indiceMaisDemorado = index;
        }
    });
    
    // Remover o container mais demorado da lista
    if (indiceMaisDemorado !== -1) {
        return pendentes.filter((_, index) => index !== indiceMaisDemorado);
    }
    
    return pendentes;
}

// ================= CARREGAR DASHBOARD OPERADOR =================
function carregarDashboardOperador() {
    const previsoes = JSON.parse(localStorage.getItem('previsoesChegada')) || [];
    const historico = JSON.parse(localStorage.getItem('historico')) || [];
    
    // Calcular KPIs
    let atrasados = 0;
    let chegadosHoje = 0;
    let previstos = 0;
    
    // Obter data de hoje sem hora
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    // Contar containers que chegaram HOJE
    historico.forEach(item => {
        if (item.dataRegistro) {
            const dataRegistro = new Date(item.dataRegistro);
            dataRegistro.setHours(0, 0, 0, 0);
            if (dataRegistro.getTime() === hoje.getTime()) {
                chegadosHoje++;
            }
        }
    });
    
    previsoes.forEach(item => {
        if (item.status !== 'CHEGOU') {
            previstos++;
            const classificacao = classificarPrevisao(item.dataPrevisao);
            if (classificacao === 'ATRASADO') {
                atrasados++;
            }
        }
    });
    
    document.getElementById('totalAtrasados').textContent = atrasados;
    document.getElementById('totalChegados').textContent = chegadosHoje;
    document.getElementById('totalPrevistos').textContent = previstos;
    
    // Exibir containers pendentes com previsão de chegada cadastrada (excluindo o mais demorado)
    const pendentes = obterPendentesComPrevisao(previsoes);
    const pendentesSemMaisDemorado = filtrarContainerMaisDemorado(pendentes);
    exibirContainersPendentes(pendentesSemMaisDemorado);
}

// ================= EXIBIR CONTAINERS PENDENTES =================
function exibirContainersPendentes(dados) {
    const container = document.getElementById('containerCards');
    
    if (dados.length === 0) {
        container.innerHTML = '<div class="no-data-card">Nenhum container pendente</div>';
        return;
    }
    
    container.innerHTML = '';
    
    dados.forEach((item, index) => {
        const classificacao = classificarPrevisao(item.dataPrevisao);
        const badgeClass = classificacao === 'ATRASADO' ? 'badge-atrasado' : 
                          classificacao === 'EM DIA' ? 'badge-em-dia' : 'badge-adiantado';
        
        const dataPrevisaoFormatada = item.dataPrevisao
            ? new Date(item.dataPrevisao + 'T00:00:00').toLocaleDateString('pt-BR')
            : '-';
        
        const card = document.createElement('div');
        card.className = 'container-card';
        
        card.innerHTML = `
            <div class="container-card-header">
                <div class="container-card-badges">
                    <span class="badge badge-${item.status.toLowerCase()}">${item.status}</span>
                    <span class="badge ${badgeClass}">${classificacao}</span>
                </div>
            </div>
            <div class="container-card-body">
                <div class="container-card-info">
                    <i class="fas fa-box"></i>
                    <div>
                        <span class="info-label">Container</span>
                        <span class="info-value">${item.container}</span>
                    </div>
                </div>
                <div class="container-card-info">
                    <i class="fas fa-file-alt"></i>
                    <div>
                        <span class="info-label">SJ</span>
                        <span class="info-value">${item.sj}</span>
                    </div>
                </div>
                <div class="container-card-info">
                    <i class="fas fa-cube"></i>
                    <div>
                        <span class="info-label">Conteúdo</span>
                        <span class="info-value">${item.conteudo || '-'}</span>
                    </div>
                </div>
                <div class="container-card-info">
                    <i class="fas fa-truck"></i>
                    <div>
                        <span class="info-label">Transportadora</span>
                        <span class="info-value">${item.transportadora || '-'}</span>
                    </div>
                </div>
                <div class="container-card-info">
                    <i class="fas fa-calendar-alt"></i>
                    <div>
                        <span class="info-label">Data Previsão</span>
                        <span class="info-value">${dataPrevisaoFormatada}</span>
                    </div>
                </div>
            </div>
            <div class="container-card-footer">
                <button class="btn-card-action" onclick="abrirModalEtiqueta(${index})" style="background: #00469B;">
                    <i class="fas fa-print"></i> Imprimir Etiqueta
                </button>
                <button class="btn-card-action" onclick="abrirModalChegada(${index})">
                    <i class="fas fa-truck-loading"></i> Registrar Chegada
                </button>
            </div>
        `;
        
        container.appendChild(card);
    });
}

// ================= ABRIR MODAL ETIQUETA =================
function abrirModalEtiqueta(index) {
    const previsoes = JSON.parse(localStorage.getItem('previsoesChegada')) || [];
    const pendentes = obterPendentesComPrevisao(previsoes);
    
    // Armazenar o OBJETO COMPLETO da previsão, não apenas o índice
    const previsao = pendentes[index];
    if (!previsao) return;
    
    previsaoParaEtiqueta = {
        sj: previsao.sj,
        conteudo: previsao.conteudo,
        container: previsao.container,
        transportadora: previsao.transportadora,
        dataPrevisao: previsao.dataPrevisao,
        status: previsao.status
    };
    
    document.getElementById('modalEtiquetaSJ').textContent = previsao.sj;
    document.getElementById('modalEtiquetaConteudo').textContent = previsao.conteudo || '-';
    document.getElementById('quantidadeEtiquetas').value = 1;
    
    const mensagemErro = document.getElementById('mensagemErroEtiqueta');
    if (mensagemErro) {
        mensagemErro.textContent = '';
        mensagemErro.classList.remove('show');
    }
    
    document.getElementById('modalImprimirEtiqueta').style.display = 'flex';
}

// ================= FECHAR MODAL ETIQUETA =================
function fecharModalEtiqueta() {
    document.getElementById('modalImprimirEtiqueta').style.display = 'none';
    previsaoParaEtiqueta = null;
}

// ================= CONFIRMAR IMPRESSAO ETIQUETA =================
function confirmarImpressaoEtiqueta() {
    // Validar que temos um objeto de previsão armazenado (não apenas um índice)
    if (!previsaoParaEtiqueta || typeof previsaoParaEtiqueta !== 'object') return;
    
    const quantidade = parseInt(document.getElementById('quantidadeEtiquetas').value);
    const mensagemErro = document.getElementById('mensagemErroEtiqueta');
    
    if (!quantidade || quantidade < 1) {
        mensagemErro.textContent = 'Quantidade deve ser maior que zero!';
        mensagemErro.classList.add('show');
        return;
    }
    
    const etiquetas = JSON.parse(localStorage.getItem('etiquetasImpressas')) || [];
    const agora = new Date();
    
    // Usar o objeto de previsão armazenado (dados garantidos do item clicado)
    const previsao = previsaoParaEtiqueta;
    
    const etiqueta = {
        sj: previsao.sj,
        conteudo: previsao.conteudo,
        container: previsao.container,
        transportadora: previsao.transportadora,
        dataPrevisao: previsao.dataPrevisao,
        quantidade: quantidade,
        dataImpressao: agora.toISOString(),
        usuario: localStorage.getItem('usuarioLogado') || 'OPERADOR',
        status: 'IMPRESSO'
    };
    
    etiquetas.push(etiqueta);
    localStorage.setItem('etiquetasImpressas', JSON.stringify(etiquetas));
    
    imprimirEtiqueta(previsao, quantidade);
    
    fecharModalEtiqueta();
    carregarDashboardOperador();
}

// ================= IMPRIMIR ETIQUETA =================
function imprimirEtiqueta(previsao, quantidade) {
    const printWindow = window.open('', '_blank');
    
    let etiquetasHTML = '';
    for (let i = 0; i < quantidade; i++) {
        etiquetasHTML += `
            <div class="etiqueta">
                <div class="etiqueta-header">
                    <h1>XCMG</h1>
                    <p>Logística</p>
                </div>
                <div class="etiqueta-body">
                    <div class="etiqueta-field">
                        <span class="label">SJ:</span>
                        <span class="value">${previsao.sj}</span>
                    </div>
                    <div class="etiqueta-field">
                        <span class="label">CONTEÚDO:</span>
                        <span class="value">${previsao.conteudo || '-'}</span>
                    </div>
                </div>
                <div class="etiqueta-footer">
                    <p>${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
            </div>
        `;
    }
    
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Impressão de Etiquetas</title>
            <style>
                @page { margin: 10mm; }
                body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
                .etiqueta { 
                    border: 3px solid #00469B; 
                    padding: 20px; 
                    margin-bottom: 20px; 
                    page-break-after: always;
                    width: 100mm;
                    height: 60mm;
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                }
                .etiqueta:last-child { page-break-after: auto; }
                .etiqueta-header { text-align: center; border-bottom: 2px solid #00469B; padding-bottom: 10px; }
                .etiqueta-header h1 { margin: 0; color: #00469B; font-size: 32px; }
                .etiqueta-header p { margin: 5px 0 0 0; color: #00336F; font-size: 14px; }
                .etiqueta-body { flex: 1; padding: 15px 0; }
                .etiqueta-field { margin: 10px 0; }
                .etiqueta-field .label { font-weight: bold; color: #00469B; font-size: 14px; }
                .etiqueta-field .value { font-size: 18px; font-weight: bold; display: block; margin-top: 5px; }
                .etiqueta-footer { text-align: center; border-top: 2px solid #00469B; padding-top: 10px; font-size: 12px; color: #666; }
            </style>
        </head>
        <body>
            ${etiquetasHTML}
        </body>
        </html>
    `);
    
    printWindow.document.close();
    setTimeout(() => {
        printWindow.print();
    }, 250);
}

// ================= ABRIR MODAL CHEGADA =================
function abrirModalChegada(index) {
    const previsoes = JSON.parse(localStorage.getItem('previsoesChegada')) || [];
    const pendentes = obterPendentesComPrevisao(previsoes);
    
    // Armazenar o OBJETO COMPLETO da previsão, não apenas o índice
    const previsao = pendentes[index];
    if (!previsao) return;
    
    previsaoSelecionada = {
        sj: previsao.sj,
        container: previsao.container,
        conteudo: previsao.conteudo,
        transportadora: previsao.transportadora,
        dataPrevisao: previsao.dataPrevisao,
        status: previsao.status
    };
    
    document.getElementById('modalContainer').textContent = previsao.container;
    document.getElementById('modalSJ').textContent = previsao.sj;
    
    // Limpar campos
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

// ================= FECHAR MODAL =================
function fecharModalChegada() {
    document.getElementById('modalRegistrarChegada').style.display = 'none';
    // Limpar o objeto armazenado (não apenas null)
    previsaoSelecionada = null;
}

function exibirModalFeedbackChegada(tipo, mensagem) {
    const modal = document.getElementById('modalFeedbackChegada');
    const titulo = document.getElementById('feedbackChegadaTitulo');
    const texto = document.getElementById('feedbackChegadaMensagem');
    const content = modal?.querySelector('.modal-feedback-content');

    if (!modal || !titulo || !texto || !content) {
        alert(mensagem);
        return;
    }

    const isSucesso = tipo === 'sucesso';
    titulo.textContent = isSucesso ? 'Chegada registrada com sucesso!' : 'Falha ao registrar chegada';
    texto.textContent = mensagem;
    content.classList.toggle('feedback-success', isSucesso);
    content.classList.toggle('feedback-error', !isSucesso);
    modal.style.display = 'flex';
}

function fecharModalFeedbackChegada() {
    const modal = document.getElementById('modalFeedbackChegada');
    if (modal) modal.style.display = 'none';
}

// ================= CONFIRMAR CHEGADA =================
async function confirmarChegada() {
    // Validar que temos um objeto de previsão armazenado (não apenas um índice)
    if (!previsaoSelecionada || typeof previsaoSelecionada !== 'object') return;

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

    const agora = new Date();
    
    // Usar o objeto de previsão armazenado (dados garantidos do container clicado)
    const item = previsaoSelecionada;

    const modalidade = (item.conteudo && item.conteudo.toUpperCase().includes('AIR')) ? 'Aéreo' : 'Marítimo';

    try {
        if (!(window.DB && window.DB.registrarChegada)) {
            throw new Error('Serviço de registro de chegada indisponível.');
        }

        await window.DB.registrarChegada({
            sj: (item.sj || '').toString().trim().toUpperCase(),
            container: (item.container || '').toString().trim().toUpperCase(),
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
        });

        fecharModalChegada();

        // Recarregar dados para garantir sincronia com banco/histórico
        if (window.DB && window.DB.init) {
            await window.DB.init();
        }
        carregarDashboardOperador();

    } catch (error) {
        console.error("Erro ao registrar chegada:", error);
        const mensagemFalha = error?.message || 'Erro ao salvar no sistema. Tente novamente.';
        mensagemErro.textContent = mensagemFalha;
        mensagemErro.classList.add('show');
        exibirModalFeedbackChegada('erro', mensagemFalha);
        return;
    }

    exibirModalFeedbackChegada('sucesso', 'A chegada do container foi registrada no sistema.');
}

// ================= CALCULAR TEMPO MINUTOS =================
function calcularTempoMinutos(horaInicio, horaFinal) {
    if (!horaInicio || !horaFinal) return 0;
    const [horaIni, minIni] = horaInicio.split(':').map(Number);
    const [horaFim, minFim] = horaFinal.split(':').map(Number);
    const minutosInicio = horaIni * 60 + minIni;
    const minutosFinal = horaFim * 60 + minFim;
    return Math.max(0, minutosFinal - minutosInicio);
}

// ================= CALCULAR TEMPO FORMATADO =================
function calcularTempoFormatado(horaInicio, horaFinal) {
    const minutos = calcularTempoMinutos(horaInicio, horaFinal);
    const horas = Math.floor(minutos / 60);
    const mins = minutos % 60;
    return `${String(horas).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}
