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
        adicionarConversaoMaiusculo('filtroSJ');
        adicionarConversaoMaiusculo('filtroContainer');
        adicionarConversaoMaiusculo('responsavelChegada');
        adicionarConversaoMaiusculo('cteChegada');
        
        carregarKPIsPrevisao();
        carregarContainerCards();
        verificarPermissoesCadastro();
        configurarCampoModal();
    }
});

let previsaoSelecionada = null;
let previsaoParaExcluir = null;
let containersAdicionados = [];
let filtroAtivo = false;

// ================= CONFIGURAR CAMPO MODAL =================
function configurarCampoModal() {
    const perfil = localStorage.getItem('perfilUsuario');
    const campoModal = document.getElementById('campoModalImportacao');
    const selectModal = document.getElementById('modalPrevisao');
    const inputContainer = document.getElementById('containerPrevisao');
    const hintContainer = document.getElementById('hintContainer');
    
    if (perfil === 'IMPORTACAO' && campoModal) {
        campoModal.style.display = 'block';
        
        // Listener para mudança de modal
        if (selectModal) {
            selectModal.addEventListener('change', function() {
                const modalSelecionado = this.value;
                
                if (modalSelecionado === 'Aereo') {
                    inputContainer.removeAttribute('maxlength');
                    hintContainer.textContent = 'Identificação livre (sem validação ISO)';
                } else if (modalSelecionado === 'Maritimo') {
                    inputContainer.setAttribute('maxlength', '11');
                    hintContainer.textContent = 'Formato ISO 6346: AAAA9999999';
                } else {
                    inputContainer.setAttribute('maxlength', '11');
                    hintContainer.textContent = 'Formato ISO 6346: AAAA9999999';
                }
            });
        }
    }
}

// ================= VERIFICAR PERMISSÕES CADASTRO =================
function verificarPermissoesCadastro() {
    const perfil = localStorage.getItem('perfilUsuario');
    const formContainer = document.getElementById('formCadastroContainer');
    
    if ((perfil === 'ADMIN' || perfil === 'IMPORTACAO') && formContainer) {
        formContainer.style.display = 'block';
    }
}

// ================= CARREGAR KPIs =================
function carregarKPIsPrevisao() {
    const previsoes = JSON.parse(localStorage.getItem('previsoesChegada')) || [];
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    const fimSemana = new Date(hoje);
    fimSemana.setDate(fimSemana.getDate() + 7);
    
    let atrasados = 0;
    let previstoHoje = 0;
    let previstoSemana = 0;
    let emDia = 0;
    
    previsoes.forEach(item => {
        if (item.status === 'CHEGOU') return;
        
        const dataPrev = new Date(item.dataPrevisao);
        dataPrev.setHours(0, 0, 0, 0);
        
        const classificacao = classificarPrevisao(item.dataPrevisao);
        
        if (classificacao === 'ATRASADO') atrasados++;
        if (classificacao === 'EM DIA') emDia++;
        if (dataPrev.getTime() === hoje.getTime()) previstoHoje++;
        if (dataPrev >= hoje && dataPrev <= fimSemana) previstoSemana++;
    });
    
    document.getElementById('kpiAtrasados').textContent = atrasados;
    document.getElementById('kpiHoje').textContent = previstoHoje;
    document.getElementById('kpiSemana').textContent = previstoSemana;
    document.getElementById('kpiEmDia').textContent = emDia;
}

// ================= CARREGAR CONTAINER CARDS =================
function carregarContainerCards() {
    limparPrevisoesAntigas();
    const previsoes = JSON.parse(localStorage.getItem('previsoesChegada')) || [];
    exibirContainerCards(previsoes);
}

// ================= LIMPAR PREVISÕES ANTIGAS =================
function limparPrevisoesAntigas() {
    const previsoes = JSON.parse(localStorage.getItem('previsoesChegada')) || [];
    const historico = JSON.parse(localStorage.getItem('historico')) || [];
    const agora = new Date();
    agora.setHours(0, 0, 0, 0);
    
    const previsoesAtualizadas = [];
    
    previsoes.forEach(item => {
        if (item.status === 'CHEGOU' && item.timestampChegada) {
            const dataChegada = new Date(item.timestampChegada);
            dataChegada.setHours(0, 0, 0, 0);
            
            // Se chegou em dia anterior, move para histórico
            if (dataChegada < agora) {
                const modalidade = (item.conteudo && item.conteudo.toUpperCase().includes('AIR')) ? 'Aéreo' : 'Marítimo';
                
                // Adicionar ao histórico
                const registroHistorico = {
                    sj: item.sj,
                    container: item.container,
                    cte: item.cte,
                    doca: item.doca,
                    horaInicio: item.horaInicio,
                    horaFinal: item.horaFinal,
                    responsavel: item.responsavel,
                    transportadora: item.transportadora || '-',
                    modalidade: modalidade,
                    dataRegistro: item.timestampChegada,
                    tempoMinutos: calcularTempoMinutos(item.horaInicio, item.horaFinal),
                    tempoFormatado: calcularTempoFormatado(item.horaInicio, item.horaFinal)
                };
                historico.push(registroHistorico);
            } else {
                // Mantém na previsão (chegou hoje)
                previsoesAtualizadas.push(item);
            }
        } else {
            // Mantém previsões não chegadas
            previsoesAtualizadas.push(item);
        }
    });
    
    localStorage.setItem('previsoesChegada', JSON.stringify(previsoesAtualizadas));
    localStorage.setItem('historico', JSON.stringify(historico));
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

// ================= EXIBIR CONTAINER CARDS =================
function exibirContainerCards(dados) {
    const container = document.getElementById('containerCards');
    const perfil = localStorage.getItem('perfilUsuario');
    const podeRegistrar = (perfil === 'ADMIN' || perfil === 'OPERADOR') && !filtroAtivo;
    const podeExcluir = perfil === 'ADMIN';
    
    if (dados.length === 0) {
        container.innerHTML = '<div class="no-data-card">Nenhuma previsão cadastrada</div>';
        return;
    }
    
    container.innerHTML = '';
    
    dados.forEach((item, index) => {
        const classificacao = item.status === 'CHEGOU' ? 'CHEGOU' : classificarPrevisao(item.dataPrevisao);
        const badgeClass = classificacao === 'ATRASADO' ? 'badge-atrasado' : 
                          classificacao === 'EM DIA' ? 'badge-em-dia' : 
                          classificacao === 'ADIANTADO' ? 'badge-adiantado' : 'badge-chegou';
        
        const dataPrevisaoFormatada = new Date(item.dataPrevisao + 'T00:00:00').toLocaleDateString('pt-BR');
        
        const card = document.createElement('div');
        card.className = 'container-card';
        
        card.innerHTML = `
            <div class="container-card-header">
                <div class="container-card-badges">
                    <span class="badge badge-${item.status.toLowerCase()}">${item.status}</span>
                    <span class="badge ${badgeClass}">${classificacao}</span>
                </div>
                ${podeExcluir ? `
                <button class="btn-card-delete" onclick="abrirModalExclusao(${index})" title="Excluir">
                    <i class="fas fa-trash"></i>
                </button>` : ''}
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
                <div class="container-card-info">
                    <i class="fas fa-user"></i>
                    <div>
                        <span class="info-label">Usuário</span>
                        <span class="info-value">${item.usuario}</span>
                    </div>
                </div>
            </div>
            ${podeRegistrar && item.status !== 'CHEGOU' ? `
            <div class="container-card-footer">
                <button class="btn-card-action" onclick="abrirModalChegada(${index})">
                    <i class="fas fa-truck-loading"></i> Registrar Chegada
                </button>
            </div>` : ''}
        `;
        
        container.appendChild(card);
    });
}

// ================= APLICAR FILTROS =================
function aplicarFiltrosPrevisao() {
    const previsoes = JSON.parse(localStorage.getItem('previsoesChegada')) || [];
    
    const status = document.getElementById('filtroStatus').value;
    const dataInicio = document.getElementById('filtroDataInicio').value;
    const dataFim = document.getElementById('filtroDataFim').value;
    const sj = document.getElementById('filtroSJ').value.toUpperCase().trim();
    const container = document.getElementById('filtroContainer').value.toUpperCase().trim();
    
    // Verificar se algum filtro está ativo
    filtroAtivo = !!(status || dataInicio || dataFim || sj || container);
    
    let dadosFiltrados = previsoes.filter(item => {
        let passa = true;
        
        if (status && item.status !== status) passa = false;
        if (dataInicio && item.dataPrevisao < dataInicio) passa = false;
        if (dataFim && item.dataPrevisao > dataFim) passa = false;
        if (sj && item.sj !== sj) passa = false;
        if (container && !item.container.includes(container)) passa = false;
        
        return passa;
    });
    
    exibirContainerCards(dadosFiltrados);
}

// ================= LIMPAR FILTROS =================
function limparFiltrosPrevisao() {
    document.getElementById('filtroStatus').value = '';
    document.getElementById('filtroDataInicio').value = '';
    document.getElementById('filtroDataFim').value = '';
    document.getElementById('filtroSJ').value = '';
    document.getElementById('filtroContainer').value = '';
    filtroAtivo = false;
    carregarContainerCards();
}

// ================= ABRIR MODAL CHEGADA =================
function abrirModalChegada(index) {
    const previsoes = JSON.parse(localStorage.getItem('previsoesChegada')) || [];
    previsaoSelecionada = index;
    
    const previsao = previsoes[index];
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
function confirmarChegada() {
    if (previsaoSelecionada === null) return;
    
    const responsavel = formatarMaiusculo(document.getElementById('responsavelChegada').value);
    const cte = formatarMaiusculo(document.getElementById('cteChegada').value);
    const doca = document.getElementById('docaChegada').value;
    const horaInicio = document.getElementById('horaInicioChegada').value;
    const horaFinal = document.getElementById('horaFinalChegada').value;
    const mensagemErro = document.getElementById('mensagemErroChegada');
    
    // Validar campos obrigatórios
    if (!responsavel || !cte || !doca || !horaInicio || !horaFinal) {
        mensagemErro.textContent = 'Todos os campos são obrigatórios!';
        mensagemErro.classList.add('show');
        return;
    }
    
    // Validar hora final maior que hora início
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
    
    // Atualizar previsão com dados de chegada
    previsoes[previsaoSelecionada].status = 'CHEGOU';
    previsoes[previsaoSelecionada].dataChegada = hoje;
    previsoes[previsaoSelecionada].horaInicio = horaInicio;
    previsoes[previsaoSelecionada].horaFinal = horaFinal;
    previsoes[previsaoSelecionada].responsavel = responsavel;
    previsoes[previsaoSelecionada].cte = cte;
    previsoes[previsaoSelecionada].doca = doca;
    previsoes[previsaoSelecionada].timestampChegada = agora.toISOString();
    
    // Adicionar ao histórico imediatamente
    const item = previsoes[previsaoSelecionada];
    const modalidade = (item.conteudo && item.conteudo.toUpperCase().includes('AIR')) ? 'Aéreo' : 'Marítimo';
    
    const registroHistorico = {
        sj: item.sj,
        container: item.container,
        cte: cte,
        doca: doca,
        horaInicio: horaInicio,
        horaFinal: horaFinal,
        responsavel: responsavel,
        transportadora: item.transportadora || '-',
        modalidade: modalidade,
        dataRegistro: agora.toISOString(),
        tempoMinutos: calcularTempoMinutos(horaInicio, horaFinal),
        tempoFormatado: calcularTempoFormatado(horaInicio, horaFinal)
    };
    historico.push(registroHistorico);
    
    localStorage.setItem('previsoesChegada', JSON.stringify(previsoes));
    localStorage.setItem('historico', JSON.stringify(historico));
    
    fecharModalChegada();
    carregarKPIsPrevisao();
    carregarContainerCards();
}

// ================= ADICIONAR CONTAINER =================
function adicionarContainer() {
    const inputContainer = document.getElementById('containerPrevisao');
    const container = formatarMaiusculo(inputContainer.value);
    const mensagemErro = document.getElementById('mensagemErroPrevisao');
    const perfil = localStorage.getItem('perfilUsuario');
    const modalSelecionado = document.getElementById('modalPrevisao') ? document.getElementById('modalPrevisao').value : '';
    
    mensagemErro.textContent = '';
    mensagemErro.classList.remove('show');
    
    if (!container) {
        mensagemErro.textContent = 'Digite o número do container!';
        mensagemErro.classList.add('show');
        return;
    }
    
    // Validação condicional para IMPORTACAO
    if (perfil === 'IMPORTACAO') {
        if (!modalSelecionado) {
            mensagemErro.textContent = 'Selecione o Modal antes de adicionar o container!';
            mensagemErro.classList.add('show');
            return;
        }
        
        if (modalSelecionado === 'Maritimo') {
            if (container.length !== 11) {
                mensagemErro.textContent = 'Container inválido! Deve conter exatamente 11 caracteres.';
                mensagemErro.classList.add('show');
                return;
            }
            
            if (!validarISOContainer(container)) {
                mensagemErro.textContent = 'Container fora do padrão ISO 6346 (AAAA9999999).';
                mensagemErro.classList.add('show');
                return;
            }
        }
        // Para Aéreo, não valida formato
    } else {
        // Validação padrão para outros perfis
        if (container.length !== 11) {
            mensagemErro.textContent = 'Container inválido! Deve conter exatamente 11 caracteres.';
            mensagemErro.classList.add('show');
            return;
        }
        
        if (!validarISOContainer(container)) {
            mensagemErro.textContent = 'Container fora do padrão ISO 6346 (AAAA9999999).';
            mensagemErro.classList.add('show');
            return;
        }
    }
    
    if (containersAdicionados.includes(container)) {
        mensagemErro.textContent = 'Este container já foi adicionado à lista!';
        mensagemErro.classList.add('show');
        return;
    }
    
    const previsoes = JSON.parse(localStorage.getItem('previsoesChegada')) || [];
    const existeNoSistema = previsoes.some(item => item.container === container);
    
    if (existeNoSistema) {
        mensagemErro.textContent = 'Este container já está cadastrado no sistema!';
        mensagemErro.classList.add('show');
        return;
    }
    
    containersAdicionados.push(container);
    inputContainer.value = '';
    inputContainer.focus();
    atualizarListaContainers();
}

// ================= ATUALIZAR LISTA CONTAINERS =================
function atualizarListaContainers() {
    const lista = document.getElementById('listaContainers');
    
    if (!lista) return;
    
    if (containersAdicionados.length === 0) {
        lista.innerHTML = '';
        return;
    }
    
    let html = '<div style="background: #E6F0FA; padding: 16px; border-radius: 8px; margin-top: 12px;">';
    html += '<strong style="color: #00469B;">Containers Adicionados (' + containersAdicionados.length + '):</strong>';
    html += '<div style="margin-top: 12px; display: flex; flex-wrap: wrap; gap: 8px;">';
    
    containersAdicionados.forEach((cont, index) => {
        html += '<span style="background: #FFFFFF; padding: 8px 12px; border-radius: 6px; display: flex; align-items: center; gap: 8px; border: 2px solid #00469B;">';
        html += '<strong>' + cont + '</strong>';
        html += '<button type="button" onclick="removerContainer(' + index + ')" style="background: #dc3545; color: white; border: none; border-radius: 4px; padding: 4px 8px; cursor: pointer; font-size: 12px;">';
        html += '<i class="fas fa-times"></i>';
        html += '</button>';
        html += '</span>';
    });
    
    html += '</div></div>';
    lista.innerHTML = html;
}

// ================= REMOVER CONTAINER =================
function removerContainer(index) {
    containersAdicionados.splice(index, 1);
    atualizarListaContainers();
}

// ================= SALVAR PREVISÃO =================
function salvarPrevisao() {
    const sj = formatarMaiusculo(document.getElementById('sjPrevisao').value);
    const conteudo = formatarMaiusculo(document.getElementById('conteudoPrevisao').value);
    const dataPrevisao = document.getElementById('dataPrevisao').value;
    const transportadora = formatarMaiusculo(document.getElementById('transportadoraPrevisao').value);
    const perfil = localStorage.getItem('perfilUsuario');
    const modalSelecionado = document.getElementById('modalPrevisao') ? document.getElementById('modalPrevisao').value : '';
    
    const mensagemErro = document.getElementById('mensagemErroPrevisao');
    const mensagemSucesso = document.getElementById('mensagemSucessoPrevisao');
    
    mensagemErro.textContent = '';
    mensagemErro.classList.remove('show');
    mensagemSucesso.textContent = '';
    mensagemSucesso.classList.remove('show');
    
    // Validar array de containers primeiro
    if (!Array.isArray(containersAdicionados) || containersAdicionados.length === 0) {
        mensagemErro.textContent = 'Adicione pelo menos um container!';
        mensagemErro.classList.add('show');
        return;
    }
    
    if (!sj || !conteudo || !dataPrevisao || !transportadora) {
        mensagemErro.textContent = 'Todos os campos são obrigatórios!';
        mensagemErro.classList.add('show');
        return;
    }
    
    // Validação de modal para IMPORTACAO
    if (perfil === 'IMPORTACAO' && !modalSelecionado) {
        mensagemErro.textContent = 'Selecione o Modal!';
        mensagemErro.classList.add('show');
        return;
    }
    
    const usuarioLogado = localStorage.getItem('usuarioLogado') || 'ADMIN';
    const agora = new Date();
    const previsoes = JSON.parse(localStorage.getItem('previsoesChegada')) || [];
    
    // Criar um registro individual para cada container
    containersAdicionados.forEach(container => {
        const previsao = {
            status: 'PREVISTO',
            sj: sj,
            conteudo: conteudo,
            container: container,
            dataPrevisao: dataPrevisao,
            transportadora: transportadora,
            dataRegistro: agora.toLocaleDateString('pt-BR'),
            horaRegistro: agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            usuario: usuarioLogado.toUpperCase(),
            timestamp: agora.toISOString(),
            modalImportacao: perfil === 'IMPORTACAO' ? modalSelecionado : null
        };
        previsoes.push(previsao);
    });
    
    localStorage.setItem('previsoesChegada', JSON.stringify(previsoes));
    
    mensagemSucesso.textContent = `${containersAdicionados.length} container(s) cadastrado(s) com sucesso!`;
    mensagemSucesso.classList.add('show');
    
    carregarKPIsPrevisao();
    carregarContainerCards();
    
    setTimeout(() => {
        limparFormularioPrevisao();
        mensagemSucesso.classList.remove('show');
    }, 2000);
}

// ================= LIMPAR FORMULÁRIO =================
function limparFormularioPrevisao() {
    document.getElementById('formPrevisao').reset();
    containersAdicionados = [];
    atualizarListaContainers();
    
    const mensagemErro = document.getElementById('mensagemErroPrevisao');
    const mensagemSucesso = document.getElementById('mensagemSucessoPrevisao');
    
    mensagemErro.textContent = '';
    mensagemErro.classList.remove('show');
    mensagemSucesso.textContent = '';
    mensagemSucesso.classList.remove('show');
    
    // Resetar hint do container
    const hintContainer = document.getElementById('hintContainer');
    const inputContainer = document.getElementById('containerPrevisao');
    if (hintContainer && inputContainer) {
        inputContainer.setAttribute('maxlength', '11');
        hintContainer.textContent = 'Formato ISO 6346: AAAA9999999';
    }
}

// ================= CARREGAR PREVISÕES HOJE =================
function carregarPrevisoesHoje() {
    const previsoes = JSON.parse(localStorage.getItem('previsoesChegada')) || [];
    const hoje = new Date().toISOString().split('T')[0];
    
    const previsoesHoje = previsoes.filter(item => item.dataPrevisao === hoje);
    
    const statusCount = {
        PREVISTO: 0,
        CONFIRMADO: 0,
        ATRASADO: 0,
        CANCELADO: 0
    };
    
    previsoesHoje.forEach(item => {
        if (statusCount[item.status] !== undefined) {
            statusCount[item.status]++;
        }
    });
    
    return {
        total: previsoesHoje.length,
        statusCount: statusCount
    };
}

// ================= ABRIR MODAL EXCLUSÃO =================
function abrirModalExclusao(index) {
    if (!validarPermissaoAdmin()) {
        alert('Apenas ADMIN pode excluir previsões.');
        return;
    }
    
    const previsoes = JSON.parse(localStorage.getItem('previsoesChegada')) || [];
    previsaoParaExcluir = index;
    
    const previsao = previsoes[index];
    document.getElementById('modalExcluirContainer').textContent = previsao.container;
    document.getElementById('modalExcluirSJ').textContent = previsao.sj;
    
    document.getElementById('modalConfirmarExclusao').style.display = 'flex';
}

// ================= FECHAR MODAL EXCLUSÃO =================
function fecharModalExclusao() {
    document.getElementById('modalConfirmarExclusao').style.display = 'none';
    previsaoParaExcluir = null;
}

// ================= CONFIRMAR EXCLUSÃO =================
function confirmarExclusao() {
    if (previsaoParaExcluir === null) return;
    
    if (!validarPermissaoAdmin()) {
        alert('Apenas ADMIN pode excluir previsões.');
        return;
    }
    
    const previsoes = JSON.parse(localStorage.getItem('previsoesChegada')) || [];
    previsoes.splice(previsaoParaExcluir, 1);
    localStorage.setItem('previsoesChegada', JSON.stringify(previsoes));
    
    fecharModalExclusao();
    carregarKPIsPrevisao();
    carregarContainerCards();
}
