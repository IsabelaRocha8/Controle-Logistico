// ================= VARIÁVEL GLOBAL PARA ARMAZENAR REGISTROS =================
let registrosDescarregamento = [];

// ================= BUSCAR SJ =================
// ================= BUSCAR SJ =================
function buscarSJ() {
    const sj = formatarMaiusculo(document.getElementById('inputSJ').value);
    const mensagem = document.getElementById('mensagemBusca');
    
    mensagem.textContent = '';
    mensagem.className = 'search-message';
    
    if (!sj) {
        mensagem.textContent = 'Digite o número da SJ para buscar!';
        mensagem.classList.add('error');
        return;
    }
    
    // Buscar no histórico
    const historico = JSON.parse(localStorage.getItem('historico')) || [];
    
    // ALTERAÇÃO: Usar .filter() para pegar TODOS os registros com essa SJ
    const registros = historico.filter(item => item.sj === sj);
    
    if (registros.length === 0) {
        mensagem.textContent = 'SJ não encontrada no sistema!';
        mensagem.classList.add('error');
        document.getElementById('nilFormulario').style.display = 'none';
        return;
    }
    
    mensagem.textContent = 'SJ encontrada! Preencha os dados adicionais e gere a NIL.';
    mensagem.classList.add('success');
    
    // Armazenar registros para uso posterior
    registrosDescarregamento = registros;
    
    // Utilizar o primeiro registro como base para dados gerais
    const registroBase = registros[0];
    
    // Preencher formulário com os dados base
    preencherFormulario(registroBase);
    
    // Preencher a tabela de descarregamento com todos os registros
    preencherTabelaDescarregamento(registros);
    
    document.getElementById('nilFormulario').style.display = 'block';
    
    // Verificar permissão e controlar botão imprimir
    controlarBotaoImprimir();
    
    // Renderizar histórico de impressões
    renderizarHistoricoImpressao();
}
// ================= PREENCHER FORMULÁRIO =================
function preencherFormulario(registro) {
    document.getElementById('processoSJ').value = registro.sj;
    // Mantém os dados gerais apenas
    document.getElementById('responsaveisDescarregamento').value = registro.responsavel;
    
    // Data do primeiro lançamento
    const dataRegistro = new Date(registro.dataRegistro);
    const dataFormatada = dataRegistro.toLocaleDateString('pt-BR');
    const horaInicio = registro.horaInicio;
    const horaFinal = registro.horaFinal;
    document.getElementById('dataPrimeiroLancamento').value = `${dataFormatada} (${horaInicio} - ${horaFinal})`;
    
    // Data de conferência (hoje)
    const hoje = new Date().toISOString().split('T')[0];
    document.getElementById('dataConferencia').value = hoje;
    
    // Adicionar conversão automática para maiúsculo nos campos editáveis
    adicionarConversaoMaiusculoNIL();
}

// ================= PREENCHER TABELA DESCARREGAMENTO =================
function preencherTabelaDescarregamento(registros) {
    // Encontrar todos os inputs da tabela de descarregamento
    const todosTabelasNIL = document.querySelectorAll('table.nil-table');
    let tabelaDescarregamento = null;
    
    // Procurar pela tabela que contém o cabeçalho "INFORMAÇÕES DESCARREGAMENTO"
    for (let i = 0; i < todosTabelasNIL.length; i++) {
        const textoTabela = todosTabelasNIL[i].textContent;
        if (textoTabela.includes('INFORMAÇÕES DESCARREGAMENTO') && textoTabela.includes('Nº CONTAINER')) {
            tabelaDescarregamento = todosTabelasNIL[i];
            break;
        }
    }
    
    if (!tabelaDescarregamento) {
        console.error('Tabela de descarregamento não encontrada');
        return;
    }
    
    // Obter todas as linhas da tabela
    const todasAsLinhas = tabelaDescarregamento.querySelectorAll('tbody tr, tr:not(:first-child):not(:nth-child(2))');
    const linhas = Array.from(tabelaDescarregamento.querySelectorAll('tr'));
    
    // Encontrar o índice da linha de cabeçalho (contém "Nº CONTAINER")
    let indiceLinhaHeader = -1;
    for (let i = 0; i < linhas.length; i++) {
        if (linhas[i].textContent.includes('Nº CONTAINER')) {
            indiceLinhaHeader = i;
            break;
        }
    }
    
    if (indiceLinhaHeader === -1) {
        console.error('Linha de cabeçalho não encontrada');
        return;
    }
    
    // Limpar os campos de entrada existentes (mantendo a estrutura)
    for (let i = indiceLinhaHeader + 1; i < linhas.length; i++) {
        const inputs = linhas[i].querySelectorAll('input:not([readonly])');
        inputs.forEach(input => {
            input.value = '';
        });
    }
    
    // Preencher com os dados dos registros
    registros.forEach((registro, index) => {
        const linhaIndex = indiceLinhaHeader + 1 + index;
        if (linhaIndex < linhas.length) {
            const linha = linhas[linhaIndex];
            const inputs = linha.querySelectorAll('input');
            
            // Estrutura esperada: container, cte, qtdeCaixa, horaInicio, horaFinal, conferencia
            // Os campos readonly (container, cte, horaInicio, horaFinal) estão desabilitados
            if (inputs.length >= 6) {
                inputs[0].value = registro.container || ''; // Nº CONTAINER (readonly)
                inputs[1].value = registro.cte || '';         // Nº CT-E (readonly)
                inputs[2].value = '';                         // QTDE. CAIXA (editável)
                inputs[3].value = registro.horaInicio || '';  // HORA INÍCIO (readonly)
                inputs[4].value = registro.horaFinal || '';   // HORA FINAL (readonly)
                // inputs[5] - CONFERÊNCIA (editável) - deixar em branco
            }
        }
    });
}

// ================= CONTROLAR BOTÃO IMPRIMIR =================
function controlarBotaoImprimir() {
    const btnImprimir = document.querySelector('.btn-primary[onclick="imprimirNIL()"]');
    const perfil = localStorage.getItem('perfilUsuario');
    const podeImprimir = ['ADMIN', 'VISUALIZADOR', 'IMPORTACAO'].includes(perfil);
    
    if (!btnImprimir) return;
    
    if (!podeImprimir) {
        btnImprimir.disabled = true;
        btnImprimir.style.opacity = '0.5';
        btnImprimir.style.cursor = 'not-allowed';
        btnImprimir.title = 'Perfil sem permissão para imprimir NIL.';
        
        let avisoDiv = document.getElementById('avisoPermissao');
        if (!avisoDiv) {
            avisoDiv = document.createElement('div');
            avisoDiv.id = 'avisoPermissao';
            avisoDiv.className = 'search-message info';
            avisoDiv.style.marginTop = '20px';
            avisoDiv.textContent = 'Seu perfil não possui permissão para imprimir NIL.';
            btnImprimir.parentElement.insertBefore(avisoDiv, btnImprimir.parentElement.firstChild);
        }
    } else {
        btnImprimir.disabled = false;
        btnImprimir.style.opacity = '1';
        btnImprimir.style.cursor = 'pointer';
        btnImprimir.title = '';
        
        const avisoDiv = document.getElementById('avisoPermissao');
        if (avisoDiv) avisoDiv.remove();
    }
}

// ================= ADICIONAR CONVERSÃO MAIÚSCULO NIL =================
function adicionarConversaoMaiusculoNIL() {
    const camposTexto = [
        'liderAnalista',
        'transportadora',
        'produto',
        'conferencia',
        'codigoOcorrencia',
        'descricaoOcorrencia',
        'observacoes'
    ];
    
    camposTexto.forEach(campoId => {
        const element = document.getElementById(campoId);
        if (element && !element.dataset.maiusculoAdicionado) {
            element.addEventListener('input', function(e) {
                const start = e.target.selectionStart;
                const end = e.target.selectionEnd;
                e.target.value = e.target.value.toUpperCase();
                e.target.setSelectionRange(start, end);
            });
            element.dataset.maiusculoAdicionado = 'true';
        }
    });
}

// ================= GERAR NIL =================
function gerarNIL() {
    const sj = document.getElementById('processoSJ').value;
    
    if (!sj) {
        alert('Busque uma SJ primeiro!');
        return;
    }
    
    // Validar campos obrigatórios
    const liderAnalista = formatarMaiusculo(document.getElementById('liderAnalista').value);
    const dataConferencia = document.getElementById('dataConferencia').value;
    
    if (!liderAnalista || !dataConferencia) {
        alert('Preencha todos os campos obrigatórios!');
        return;
    }
    
    const nilsGerados = JSON.parse(localStorage.getItem('nilsGerados')) || [];
    const usuarioLogado = localStorage.getItem('usuarioLogado') || 'ADMIN';

    const nilData = {
        sj: sj,
        dataGeracao: new Date().toISOString(),
        status: 'Gerado',
        liderAnalista: liderAnalista,
        dataConferencia: dataConferencia,
        transportadora: formatarMaiusculo(document.getElementById('transportadora').value),
        produto: formatarMaiusculo(document.getElementById('produto').value),
        qtdeCaixa: document.getElementById('qtdeCaixa').value,
        conferencia: formatarMaiusculo(document.getElementById('conferencia').value),
        codigoOcorrencia: formatarMaiusculo(document.getElementById('codigoOcorrencia').value),
        qtdFaturada: document.getElementById('qtdFaturada').value,
        qtdFisica: document.getElementById('qtdFisica').value,
        descricaoOcorrencia: formatarMaiusculo(document.getElementById('descricaoOcorrencia').value),
        registroFoto: document.getElementById('registroFoto').value,
        divulgacao: document.getElementById('divulgacao').value,
        observacoes: formatarMaiusculo(document.getElementById('observacoes').value),
        usuario: usuarioLogado.toUpperCase()
    };
    
    // Verificar se já existe
    const indiceExistente = nilsGerados.findIndex(item => item.sj === sj);
    
    if (indiceExistente !== -1) {
        nilsGerados[indiceExistente] = nilData;
    } else {
        nilsGerados.push(nilData);
    }
    
    localStorage.setItem('nilsGerados', JSON.stringify(nilsGerados));

    if (window.DB && typeof DB.adicionarNil === "function") {
        DB.adicionarNil(nilData).catch(() => {
            console.error("Falha ao registrar NIL no banco (API /nils).");
        });
    }
    
    alert('NIL gerado com sucesso!');
}

// ================= IMPRIMIR NIL =================
function imprimirNIL() {
    const sj = document.getElementById('processoSJ').value;
    
    if (!sj) {
        alert('Busque uma SJ primeiro!');
        return;
    }
    
    // Coletar containers dos registros armazenados
    const container = registrosDescarregamento.length > 0 
        ? registrosDescarregamento.map(r => r.container).join(', ')
        : '';
    
    const perfil = localStorage.getItem('perfilUsuario');
    if (!['ADMIN', 'VISUALIZADOR', 'IMPORTACAO'].includes(perfil)) {
        alert('Seu perfil não possui permissão para imprimir NIL.');
        return;
    }
    
    const usuarioLogado = localStorage.getItem('usuarioLogado') || 'ADMIN';
    const agora = new Date();
    const dataFormatada = agora.toLocaleDateString('pt-BR');
    const horaFormatada = agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    
    // Preencher data de impressão no cabeçalho
    const dataImpressao = document.getElementById('dataImpressaoNIL');
    if (dataImpressao) {
        dataImpressao.textContent = `IMPRESSÃO: ${dataFormatada} ${horaFormatada}`;
    }
    
    const rodape = document.getElementById('rodapeImpressaoNIL');
    const textoRodape = document.getElementById('textoRodapeImpressaoNIL');
    
    if (rodape && textoRodape) {
        textoRodape.innerHTML = `Impresso por: ${usuarioLogado.toUpperCase()}<br>Data: ${dataFormatada}<br>Hora: ${horaFormatada}`;
        rodape.style.display = 'block';
    }
    
    registrarImpressaoNIL({ sj, container });
    
    setTimeout(() => {
        window.print();
        setTimeout(() => {
            if (rodape) rodape.style.display = 'none';
            renderizarHistoricoImpressao();
        }, 500);
    }, 100);
}

// ================= REGISTRAR IMPRESSÃO NIL =================
function registrarImpressaoNIL(dados) {
    const usuarioLogado = localStorage.getItem('usuarioLogado') || 'ADMIN';
    const agora = new Date();
    
    const impressao = {
        sj: dados.sj,
        container: dados.container,
        usuario: usuarioLogado.toUpperCase(),
        data: agora.toLocaleDateString('pt-BR'),
        hora: agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        timestamp: agora.toISOString()
    };
    
    const historicoImpressao = JSON.parse(localStorage.getItem('historicoImpressaoNIL')) || [];
    historicoImpressao.push(impressao);
    localStorage.setItem('historicoImpressaoNIL', JSON.stringify(historicoImpressao));

    if (window.apiClient && typeof window.apiClient.createNilPrintHistory === 'function') {
        window.apiClient.createNilPrintHistory({
            numeroNIL: `NIL-${dados.sj}`,
            sj: dados.sj,
            container: dados.container,
            usuario: impressao.usuario,
            data: impressao.data,
            hora: impressao.hora,
        }).catch(() => {});
    }
}

// ================= RENDERIZAR HISTÓRICO IMPRESSÃO =================
function renderizarHistoricoImpressao() {
    const historicoImpressao = JSON.parse(localStorage.getItem('historicoImpressaoNIL')) || [];
    const historicoOrdenado = historicoImpressao.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    let historicoDiv = document.getElementById('historicoImpressaoDiv');
    
    if (!historicoDiv) {
        historicoDiv = document.createElement('div');
        historicoDiv.id = 'historicoImpressaoDiv';
        historicoDiv.className = 'historico-impressao-section';
        
        const nilForm = document.getElementById('nilFormulario');
        const nilActions = nilForm.querySelector('.nil-actions');
        nilForm.insertBefore(historicoDiv, nilActions);
    }
    
    if (historicoOrdenado.length === 0) {
        historicoDiv.innerHTML = '';
        return;
    }
    
    let html = '<h3>Histórico de Impressões</h3>';
    html += '<table class="historico-impressao-table">';
    html += '<thead><tr><th>SJ</th><th>Container</th><th>Usuário</th><th>Data</th><th>Hora</th></tr></thead>';
    html += '<tbody>';
    
    historicoOrdenado.forEach(item => {
        html += `<tr>`;
        html += `<td>${item.sj}</td>`;
        html += `<td>${item.container}</td>`;
        html += `<td>${item.usuario}</td>`;
        html += `<td>${item.data}</td>`;
        html += `<td>${item.hora}</td>`;
        html += `</tr>`;
    });
    
    html += '</tbody></table>';
    historicoDiv.innerHTML = html;
}
