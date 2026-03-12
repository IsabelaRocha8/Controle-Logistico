// ================= INICIALIZAR DASHBOARD OPERADOR =================
document.addEventListener('DOMContentLoaded', function() {
    carregarDashboardOperador();
    adicionarConversaoMaiusculo('responsavelChegada');
    adicionarConversaoMaiusculo('cteChegada');
});

let previsaoSelecionada = null;
let previsaoParaEtiqueta = null;

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
    
    // Exibir apenas containers pendentes (não chegados)
    const pendentes = previsoes.filter(item => item.status !== 'CHEGOU');
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
    
    dados.forEach((item, index) => {
        const classificacao = classificarPrevisao(item.dataPrevisao);
        const badgeClass = classificacao === 'ATRASADO' ? 'badge-atrasado' : 
                          classificacao === 'EM DIA' ? 'badge-em-dia' : 'badge-adiantado';
        
        const dataPrevisaoFormatada = new Date(item.dataPrevisao + 'T00:00:00').toLocaleDateString('pt-BR');
        
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
    const pendentes = previsoes.filter(item => item.status !== 'CHEGOU');
    
    previsaoParaEtiqueta = previsoes.indexOf(pendentes[index]);
    
    const previsao = pendentes[index];
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
    if (previsaoParaEtiqueta === null) return;
    
    const quantidade = parseInt(document.getElementById('quantidadeEtiquetas').value);
    const mensagemErro = document.getElementById('mensagemErroEtiqueta');
    
    if (!quantidade || quantidade < 1) {
        mensagemErro.textContent = 'Quantidade deve ser maior que zero!';
        mensagemErro.classList.add('show');
        return;
    }
    
    const previsoes = JSON.parse(localStorage.getItem('previsoesChegada')) || [];
    const etiquetas = JSON.parse(localStorage.getItem('etiquetasImpressas')) || [];
    const agora = new Date();
    
    const previsao = previsoes[previsaoParaEtiqueta];
    
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
    const pendentes = previsoes.filter(item => item.status !== 'CHEGOU');
    
    previsaoSelecionada = previsoes.indexOf(pendentes[index]);
    
    const previsao = pendentes[index];
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
    previsaoSelecionada = null;
}

// ================= CONFIRMAR CHEGADA =================
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
    
    // Obter o item selecionado
    const item = previsoes[previsaoSelecionada];
    if (!item) return;

    const agora = new Date();
    const modalidade = (item.conteudo && item.conteudo.toUpperCase().includes('AIR')) ? 'Aéreo' : 'Marítimo';
    
    // 1. Preparar dados para o HISTÓRICO (Para o Admin ver)
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
    
    // 2. Preparar dados para atualizar a PREVISÃO (Para mudar status e sair da lista)
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
        // Executar operações no Servidor (DB)
        if (window.DB) {
            // Salva no histórico global
            await window.DB.adicionarHistorico(registroHistorico);
            
            // Atualiza o status da previsão se tiver ID (vindo do banco)
            if (item.id) {
                await window.DB.atualizarPrevisao(item.id, atualizacaoPrevisao);
            } else {
                // Fallback para local se não tiver ID (legado)
                previsoes[previsaoSelecionada] = { ...item, ...atualizacaoPrevisao };
                localStorage.setItem('previsoesChegada', JSON.stringify(previsoes));
            }
        }

        fecharModalChegada();
        
        // Recarregar dados para garantir sincronia
        if (window.DB && window.DB.init) {
            await window.DB.init();
        }
        carregarDashboardOperador();

    } catch (error) {
        console.error("Erro ao registrar chegada:", error);
        mensagemErro.textContent = 'Erro ao salvar no sistema. Tente novamente.';
        mensagemErro.classList.add('show');
    }
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
