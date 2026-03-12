// ================= INICIALIZAR PAINEL OPERADOR =================
document.addEventListener('DOMContentLoaded', function() {
    carregarChegadasHoje();
    carregarTodasPrevisoes();
    
    // Adicionar conversão automática para maiúsculo
    const responsavel = document.getElementById('responsavelChegada');
    if (responsavel) {
        responsavel.addEventListener('input', function(e) {
            const start = e.target.selectionStart;
            const end = e.target.selectionEnd;
            e.target.value = e.target.value.toUpperCase();
            e.target.setSelectionRange(start, end);
        });
    }
});

// ================= CARREGAR CHEGADAS HOJE =================
function carregarChegadasHoje() {
    const previsoes = JSON.parse(localStorage.getItem('previsoesChegada')) || [];
    const hoje = new Date().toISOString().split('T')[0];
    
    const chegadasHoje = previsoes.filter(item => item.dataPrevisao === hoje);
    
    const tbody = document.getElementById('tabelaChegadasHoje');
    
    if (chegadasHoje.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="no-data">Nenhuma chegada prevista para hoje.</td></tr>';
        return;
    }
    
    // Ordenar: Atrasados, Em Dia, Adiantados
    const ordenado = chegadasHoje.sort((a, b) => {
        const classA = classificarPrevisao(a.dataPrevisao);
        const classB = classificarPrevisao(b.dataPrevisao);
        const ordem = { 'ATRASADO': 1, 'EM DIA': 2, 'ADIANTADO': 3 };
        return ordem[classA] - ordem[classB];
    });
    
    tbody.innerHTML = '';
    
    ordenado.forEach(item => {
        const tr = document.createElement('tr');
        const classificacao = classificarPrevisao(item.dataPrevisao);
        
        // Aplicar classe de linha
        if (classificacao === 'ATRASADO') {
            tr.className = 'linha-atrasado';
        }
        
        let badgeClass = '';
        let badgeIcon = '';
        
        if (item.status === 'CHEGOU') {
            badgeClass = 'badge-chegou';
        } else {
            if (classificacao === 'ATRASADO') {
                badgeClass = 'badge-atrasado';
                badgeIcon = '<i class="fas fa-exclamation-triangle"></i> ';
            } else if (classificacao === 'EM DIA') {
                badgeClass = 'badge-emdia';
            } else {
                badgeClass = 'badge-adiantado';
            }
        }
        
        tr.innerHTML = `
            <td>${item.sj}</td>
            <td>${item.container}</td>
            <td><span class="badge ${badgeClass}">${badgeIcon}${item.status === 'CHEGOU' ? 'CHEGOU' : classificacao}</span></td>
            <td>
                ${item.status !== 'CHEGOU' ? 
                    `<button class="btn btn-sm btn-primary" onclick="abrirModalChegada('${item.sj}', '${item.container}')">
                        <i class="fas fa-check"></i> Registrar Chegada
                    </button>` : 
                    '<span style="color: #28a745; font-weight: 600;"><i class="fas fa-check-circle"></i> Registrado</span>'
                }
            </td>
        `;
        
        tbody.appendChild(tr);
    });
}

// ================= CARREGAR TODAS PREVISÕES =================
function carregarTodasPrevisoes() {
    const previsoes = JSON.parse(localStorage.getItem('previsoesChegada')) || [];
    
    // Ordenar por data mais próxima
    const previsoesOrdenadas = previsoes.sort((a, b) => 
        new Date(a.dataPrevisao) - new Date(b.dataPrevisao)
    );
    
    const tbody = document.getElementById('tabelaTodasPrevisoes');
    
    if (previsoesOrdenadas.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="no-data">Nenhuma previsão cadastrada</td></tr>';
        return;
    }
    
    tbody.innerHTML = '';
    
    previsoesOrdenadas.forEach(item => {
        const tr = document.createElement('tr');
        const classificacao = item.status === 'CHEGOU' ? 'CHEGOU' : classificarPrevisao(item.dataPrevisao);
        
        let badgeClass = '';
        if (item.status === 'CHEGOU') {
            badgeClass = 'badge-chegou';
        } else {
            if (classificacao === 'ATRASADO') badgeClass = 'badge-atrasado';
            else if (classificacao === 'EM DIA') badgeClass = 'badge-emdia';
            else badgeClass = 'badge-adiantado';
        }
        
        tr.innerHTML = `
            <td>${item.sj}</td>
            <td>${item.container}</td>
            <td><span class="badge ${badgeClass}">${classificacao}</span></td>
            <td>${new Date(item.dataPrevisao).toLocaleDateString('pt-BR')}</td>
            <td>${item.usuario}</td>
        `;
        
        tbody.appendChild(tr);
    });
}

// ================= ABRIR MODAL CHEGADA =================
function abrirModalChegada(sj, container) {
    document.getElementById('sjChegada').value = sj;
    document.getElementById('containerChegada').value = container;
    
    // Definir hora atual
    const agora = new Date();
    const horaAtual = `${String(agora.getHours()).padStart(2, '0')}:${String(agora.getMinutes()).padStart(2, '0')}`;
    document.getElementById('horaChegada').value = horaAtual;
    
    // Limpar campos
    document.getElementById('docaChegada').value = '';
    document.getElementById('responsavelChegada').value = '';
    
    const mensagemErro = document.getElementById('mensagemErroModal');
    mensagemErro.textContent = '';
    mensagemErro.classList.remove('show');
    
    document.getElementById('modalChegada').style.display = 'flex';
}

// ================= FECHAR MODAL =================
function fecharModal() {
    document.getElementById('modalChegada').style.display = 'none';
}

// ================= SALVAR CHEGADA =================
async function salvarChegada() {
    const sj = document.getElementById('sjChegada').value;
    const container = document.getElementById('containerChegada').value;
    const doca = document.getElementById('docaChegada').value;
    const responsavel = formatarMaiusculo(document.getElementById('responsavelChegada').value);
    const hora = document.getElementById('horaChegada').value;
    
    const mensagemErro = document.getElementById('mensagemErroModal');
    mensagemErro.textContent = '';
    mensagemErro.classList.remove('show');
    
    if (!doca || !responsavel || !hora) {
        mensagemErro.textContent = 'Todos os campos são obrigatórios!';
        mensagemErro.classList.add('show');
        return;
    }
    
    await registrarChegada({
        sj: sj,
        container: container,
        doca: doca,
        responsavel: responsavel,
        hora: hora
    });
    
    fecharModal();
}

// ================= REGISTRAR CHEGADA =================
async function registrarChegada(dados) {
    const previsoes = JSON.parse(localStorage.getItem('previsoesChegada')) || [];
    const usuarioLogado = localStorage.getItem('usuarioLogado') || 'OPERADOR';
    const agora = new Date();
    const hoje = agora.toISOString().split('T')[0];
    
    const index = previsoes.findIndex(item => 
        item.sj === dados.sj && item.container === dados.container
    );
    
    if (index !== -1) {
        const item = previsoes[index];
        
        // 1. Criar registro no HISTÓRICO (Fundamental para o Admin ver)
        const registroHistorico = {
            sj: item.sj,
            container: item.container,
            cte: item.cte || 'N/A', // CTE pode não estar no modal simples, usa o da previsão ou N/A
            doca: dados.doca,
            horaInicio: dados.hora,
            horaFinal: dados.hora, // Painel simplificado assume hora única ou precisa de ajuste posterior
            responsavel: dados.responsavel,
            transportadora: item.transportadora || '-',
            modalidade: (item.conteudo && item.conteudo.toUpperCase().includes('AIR')) ? 'Aéreo' : 'Marítimo',
            dataRegistro: agora.toISOString(),
            tempoMinutos: 0,
            tempoFormatado: '00:00'
        };

        // 2. Dados para atualizar a PREVISÃO
        const dadosAtualizacao = {
            status: 'CHEGOU',
            dataChegada: hoje,
            horaChegada: dados.hora,
            doca: dados.doca,
            responsavel: dados.responsavel,
            usuarioRegistro: usuarioLogado.toUpperCase()
        };

        try {
            if (window.DB) {
                // Envia para o histórico
                await window.DB.adicionarHistorico(registroHistorico);
                
                // Atualiza status da previsão
                if (item.id) {
                    await window.DB.atualizarPrevisao(item.id, dadosAtualizacao);
                } else {
                    atualizarStatusPrevisao(index, dadosAtualizacao);
                }
                
                // Sincroniza
                if (window.DB.init) await window.DB.init();
            }
            
            carregarChegadasHoje();
            carregarTodasPrevisoes();
        } catch (err) {
            alert('Erro ao registrar chegada no servidor.');
            console.error(err);
        }
    }
}

// ================= ATUALIZAR STATUS PREVISÃO =================
function atualizarStatusPrevisao(index, dadosChegada) {
    const previsoes = JSON.parse(localStorage.getItem('previsoesChegada')) || [];
    
    previsoes[index] = {
        ...previsoes[index],
        ...dadosChegada
    };
    
    localStorage.setItem('previsoesChegada', JSON.stringify(previsoes));
}

// Fechar modal ao clicar fora
window.onclick = function(event) {
    const modal = document.getElementById('modalChegada');
    if (event.target === modal) {
        fecharModal();
    }
}
