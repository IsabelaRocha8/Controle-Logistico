// ================= INICIALIZAR DASHBOARD OPERADOR =================
document.addEventListener('DOMContentLoaded', async function() {
    if (window.DB && window.DB.init) {
        await window.DB.init();
    }

    carregarDashboardOperador();
    adicionarConversaoMaiusculo('responsavelChegada');
    adicionarConversaoMaiusculo('cteChegada');
});

// Armazenar dados do item selecionado no modal (evitar variáveis globais)
let modalChegadaData = null;
let modalEtiquetaData = null;

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

// ================= CARREGAR DASHBOARD OPERADOR =================
function carregarDashboardOperador() {
    const previsoes = JSON.parse(localStorage.getItem('previsoesChegada')) || [];
    
    // Calcular KPIs
    let atrasados = 0;
    let chegados = 0;
    let previstos = 0;
    
    previsoes.forEach(item => {
        if (item.status === 'CHEGOU') {
            chegados++;
        } else {
            previstos++;
            const classificacao = classificarPrevisao(item.dataPrevisao);
            if (classificacao === 'ATRASADO') {
                atrasados++;
            }
        }
    });
    
    document.getElementById('totalAtrasados').textContent = atrasados;
    document.getElementById('totalChegados').textContent = chegados;
    document.getElementById('totalPrevistos').textContent = previstos;
    
    // Exibir containers pendentes com previsão de chegada cadastrada
    const pendentes = obterPendentesComPrevisao(previsoes);
    exibirContainersPendentes(pendentes);
}

// ================= EXIBIR CONTAINERS PENDENTES =================
function exibirContainersPendentes(dados) {
    const container = document.getElementById('containerCards');
    
    if (dados.length === 0) {
        container.innerHTML = '<div class="no-data-card">Nenhum container pendente</div>';
        return;
    }
    
    container.innerHTML = '';
    
    dados.forEach((item) => {
        const classificacao = classificarPrevisao(item.dataPrevisao);
        const badgeClass = classificacao === 'ATRASADO' ? 'badge-atrasado' : 
                          classificacao === 'EM DIA' ? 'badge-em-dia' : 'badge-adiantado';
        
        const dataPrevisaoFormatada = item.dataPrevisao
            ? new Date(item.dataPrevisao + 'T00:00:00').toLocaleDateString('pt-BR')
            : '-';
        
        const card = document.createElement('div');
        card.className = 'container-card';
        
        // Usar identificador único baseado em container + sj
        const itemId = `${item.container}-${item.sj}`.replace(/[^a-zA-Z0-9-_]/g, '_');
        card.id = `card-${itemId}`;
        
        // Armazenar dados do item no dataset do card
        card.dataset.container = item.container;
        card.dataset.sj = item.sj;
        card.dataset.conteudo = item.conteudo || '';
        card.dataset.transportadora = item.transportadora || '';
        card.dataset.dataPrevisao = item.dataPrevisao || '';
        card.dataset.status = item.status || '';
        
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
                <button class="btn-card-action btn-imprimir-etiqueta" style="background: #00469B;" data-card-id="${itemId}">
                    <i class="fas fa-print"></i> Imprimir Etiqueta
                </button>
                <button class="btn-card-action btn-registrar-chegada" data-card-id="${itemId}">
                    <i class="fas fa-truck-loading"></i> Registrar Chegada
                </button>
            </div>
        `;
        
        container.appendChild(card);
    });
    
    // Adicionar event listeners (sem usar onclick inline)
    anexarEventosBotoes();
}

// ================= ANEXAR EVENTOS AOS BOTÕES =================
function anexarEventosBotoes() {
    // Event listener para botões "Registrar Chegada"
    document.querySelectorAll('.btn-registrar-chegada').forEach(botao => {
        botao.addEventListener('click', function(e) {
            e.preventDefault();
            const cardId = this.dataset.cardId;
            const card = document.getElementById(`card-${cardId}`);
            if (card) {
                abrirModalChegada(card);
            }
        });
    });
    
    // Event listener para botões "Imprimir Etiqueta"
    document.querySelectorAll('.btn-imprimir-etiqueta').forEach(botao => {
        botao.addEventListener('click', function(e) {
            e.preventDefault();
            const cardId = this.dataset.cardId;
            const card = document.getElementById(`card-${cardId}`);
            if (card) {
                abrirModalEtiqueta(card);
            }
        });
    });
}

// ================= ABRIR MODAL ETIQUETA =================
function abrirModalEtiqueta(card) {
    // Obter dados do dataset do card (não usar índices)
    const container = card.dataset.container;
    const sj = card.dataset.sj;
    const conteudo = card.dataset.conteudo;
    
    // Armazenar dados no objeto modalEtiquetaData
    modalEtiquetaData = {
        container,
        sj,
        conteudo,
        transportadora: card.dataset.transportadora,
        dataPrevisao: card.dataset.dataPrevisao,
        status: card.dataset.status
    };
    
    document.getElementById('modalEtiquetaSJ').textContent = sj;
    document.getElementById('modalEtiquetaConteudo').textContent = conteudo || '-';
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
    modalEtiquetaData = null;
}

// ================= CONFIRMAR IMPRESSAO ETIQUETA =================
function confirmarImpressaoEtiqueta() {
    if (!modalEtiquetaData) return;
    
    const quantidade = parseInt(document.getElementById('quantidadeEtiquetas').value);
    const mensagemErro = document.getElementById('mensagemErroEtiqueta');
    
    if (!quantidade || quantidade < 1) {
        mensagemErro.textContent = 'Quantidade deve ser maior que zero!';
        mensagemErro.classList.add('show');
        return;
    }
    
    const etiquetas = JSON.parse(localStorage.getItem('etiquetasImpressas')) || [];
    const agora = new Date();
    
    const etiqueta = {
        sj: modalEtiquetaData.sj,
        conteudo: modalEtiquetaData.conteudo,
        container: modalEtiquetaData.container,
        transportadora: modalEtiquetaData.transportadora,
        dataPrevisao: modalEtiquetaData.dataPrevisao,
        quantidade: quantidade,
        dataImpressao: agora.toISOString(),
        usuario: localStorage.getItem('usuarioLogado') || 'OPERADOR',
        status: 'IMPRESSO'
    };
    
    etiquetas.push(etiqueta);
    localStorage.setItem('etiquetasImpressas', JSON.stringify(etiquetas));
    
    imprimirEtiqueta(modalEtiquetaData, quantidade);
    
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
function abrirModalChegada(card) {
    // Obter dados do dataset do card (não usar índices que podem desincronizar)
    const container = card.dataset.container;
    const sj = card.dataset.sj;
    const conteudo = card.dataset.conteudo;
    
    // Armazenar dados completos do item no objeto modalChegadaData
    modalChegadaData = {
        container,
        sj,
        conteudo,
        transportadora: card.dataset.transportadora,
        dataPrevisao: card.dataset.dataPrevisao,
        status: card.dataset.status
    };
    
    document.getElementById('modalContainer').textContent = container;
    document.getElementById('modalSJ').textContent = sj;
    
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
    modalChegadaData = null;
}

let feedbackChegadaSucesso = false;

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
    feedbackChegadaSucesso = isSucesso;
    titulo.textContent = isSucesso ? 'Chegada registrada com sucesso!' : 'Falha ao registrar chegada';
    texto.textContent = mensagem;
    content.classList.toggle('feedback-success', isSucesso);
    content.classList.toggle('feedback-error', !isSucesso);
    modal.style.display = 'flex';
}

function fecharModalFeedbackChegada() {
    const modal = document.getElementById('modalFeedbackChegada');
    if (modal) modal.style.display = 'none';
    
    // Redirecionar para histórico se foi sucesso
    if (feedbackChegadaSucesso) {
        setTimeout(() => {
            window.location.href = 'historico.html';
        }, 300);
    }
}

// ================= CONFIRMAR CHEGADA =================
async function confirmarChegada() {
    if (!modalChegadaData) return;

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
    
    // Usar dados armazenados no modalChegadaData
    const item = modalChegadaData;
    const modalidade = (item.conteudo && item.conteudo.toUpperCase().includes('AIR')) ? 'Aéreo' : 'Marítimo';

    try {
        if (!(window.DB && window.DB.registrarChegada)) {
            throw new Error('Serviço de registro de chegada indisponível.');
        }

        const payload = {
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
        };
        
        console.log('[confirmarChegada] Registrando:', payload.sj, payload.container);
        const apiResponse = await window.DB.registrarChegada(payload);
        console.log('[confirmarChegada] Sucesso na API - Resposta:', apiResponse);
        console.log('[confirmarChegada] Sincronização completa. Atualizando localStorage...');

        fecharModalChegada();

        // Garantir que a previsão foi atualizada para CHEGOU no localStorage
        const previsoesCurrent = JSON.parse(localStorage.getItem('previsoesChegada')) || [];
        console.log('[confirmarChegada] Previsões carregadas do localStorage:', previsoesCurrent.length, 'itens');
        
        const idx = previsoesCurrent.findIndex(p => {
            const pSj = (p.sj || '').toString().trim().toUpperCase();
            const pContainer = (p.container || '').toString().trim().toUpperCase();
            const match = pSj === payload.sj && pContainer === payload.container;
            console.log('[confirmarChegada] Comparando:', {esperado: {sj: payload.sj, container: payload.container}, local: {sj: pSj, container: pContainer}, match});
            return match;
        });
        
        if (idx !== -1) {
            previsoesCurrent[idx].status = 'CHEGOU';
            localStorage.setItem('previsoesChegada', JSON.stringify(previsoesCurrent));
            console.log('[confirmarChegada] Status local atualizado para CHEGOU no índice:', idx);
        } else {
            console.error('[confirmarChegada] ERRO CRÍTICO: Item não encontrado para atualização!', {
                sj: payload.sj, 
                container: payload.container,
                previsõesDisponiveis: previsoesCurrent.map(p => ({sj: p.sj, container: p.container, status: p.status}))
            });
            console.warn('[confirmarChegada] Forçando sincronização novamente do servidor...');
            // Sincronizar novamente se o item não foi encontrado
            try {
                if (window.apiClient && window.apiClient.getPrevisoes) {
                    const previsõesAtualizadas = await window.apiClient.getPrevisoes();
                    if (Array.isArray(previsõesAtualizadas)) {
                        localStorage.setItem('previsoesChegada', JSON.stringify(previsõesAtualizadas));
                        console.log('[confirmarChegada] Previsões sincronizadas novamente. Total:', previsõesAtualizadas.length);
                    }
                }
            } catch (resyncErr) {
                console.error('[confirmarChegada] Erro ao ressincronizar:', resyncErr);
            }
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
