// ================= INICIALIZAÇÃO =================
document.addEventListener('DOMContentLoaded', function() {
    verificarLogin();
    inicializarPagina();
});
document.addEventListener("DOMContentLoaded", async function () {
  verificarLogin();

  const paginaAtual = window.location.pathname.split("/").pop();
  const usuarioLogado = localStorage.getItem("usuarioLogado");

  if (!usuarioLogado && paginaAtual !== "login.html") return;

  if (window.DB?.init) {
    await window.DB.init();
  }

  inicializarPagina();
});
// ================= VERIFICAR LOGIN =================
function verificarLogin() {
    const usuarioLogado = localStorage.getItem('usuarioLogado');
    const paginaAtual = window.location.pathname.split('/').pop();
    
    // Se não está logado e não está na página de login, redireciona
    if (!usuarioLogado && paginaAtual !== 'login.html') {
        window.location.href = 'login.html';
        return;
    }
    
    // Se está logado e está na página de login, redireciona para dashboard
    if (usuarioLogado && paginaAtual === 'login.html') {
        const perfil = localStorage.getItem('perfilUsuario');
        if (perfil === 'OPERADOR') {
            window.location.href = 'dashboard-operador.html';
        } else {
            window.location.href = 'index.html';
        }
        return;
    }
    
    // Verificar permissão de acesso à página
    if (usuarioLogado && paginaAtual !== 'login.html') {
        verificarPerfil(paginaAtual);
        renderizarMenuLateral();
    }
    
    // Exibir nome do usuário nas páginas internas
    if (usuarioLogado && paginaAtual !== 'login.html') {
        const nomeUsuarioElement = document.getElementById('nomeUsuario');
        if (nomeUsuarioElement) {
            nomeUsuarioElement.textContent = usuarioLogado;
        }
    }
}

// ================= VERIFICAR PERFIL =================
function verificarPerfil(paginaAtual) {
    const perfil = localStorage.getItem('perfilUsuario');
    
    // Páginas permitidas por perfil
    const paginasOperador = ['dashboard-operador.html', 'cadastro.html', 'cadastro-aereo.html', 'etiquetas.html'];
    const paginasImportacao = ['previsao.html', 'historico.html'];
    const paginasAdmin = ['index.html', 'cadastro.html', 'cadastro-aereo.html', 'historico.html', 'nil.html', 'previsao.html', 'historicoNIL.html'];
    
    if (perfil === 'OPERADOR') {
        if (!paginasOperador.includes(paginaAtual)) {
            window.location.href = 'dashboard-operador.html';
        }
    } else if (perfil === 'IMPORTACAO') {
        if (!paginasImportacao.includes(paginaAtual)) {
            window.location.href = 'previsao.html';
        }
    } else if (perfil === 'ADMIN') {
        if (paginaAtual === 'dashboard-operador.html' || paginaAtual === 'etiquetas.html') {
            window.location.href = 'index.html';
        }
    }
}

// ================= RENDERIZAR MENU LATERAL =================
function renderizarMenuLateral() {
    const perfil = localStorage.getItem('perfilUsuario');
    const sidebarMenu = document.querySelector('.sidebar-menu');
    
    if (!sidebarMenu) return;
    
    const paginaAtual = window.location.pathname.split('/').pop();
    
    if (perfil === 'OPERADOR') {
        sidebarMenu.innerHTML = `
            <a href="dashboard-operador.html" class="menu-link ${paginaAtual === 'dashboard-operador.html' ? 'active' : ''}">
                <i class="fas fa-chart-pie"></i>
                <span>Dashboard</span>
            </a>
            <a href="cadastro.html" class="menu-link ${paginaAtual === 'cadastro.html' ? 'active' : ''}">
                <i class="fas fa-ship"></i>
                <span>Cadastro Marítimo</span>
            </a>
            <a href="cadastro-aereo.html" class="menu-link ${paginaAtual === 'cadastro-aereo.html' ? 'active' : ''}">
                <i class="fas fa-plane"></i>
                <span>Cadastro Aéreo</span>
            </a>
            <a href="etiquetas.html" class="menu-link ${paginaAtual === 'etiquetas.html' ? 'active' : ''}">
                <i class="fas fa-tags"></i>
                <span>Etiquetas</span>
            </a>
        `;
    } else if (perfil === 'IMPORTACAO') {
        sidebarMenu.innerHTML = `
            <a href="previsao.html" class="menu-link ${paginaAtual === 'previsao.html' ? 'active' : ''}">
                <i class="fas fa-calendar-alt"></i>
                <span>Previsão de Chegada</span>
            </a>
            <a href="historico.html" class="menu-link ${paginaAtual === 'historico.html' ? 'active' : ''}">
                <i class="fas fa-history"></i>
                <span>Histórico</span>
            </a>
        `;
    } else if (perfil === 'ADMIN') {
        sidebarMenu.innerHTML = `
            <a href="index.html" class="menu-link ${paginaAtual === 'index.html' || paginaAtual === '' ? 'active' : ''}">
                <i class="fas fa-chart-pie"></i>
                <span>Dashboard</span>
            </a>
            <a href="cadastro.html" class="menu-link ${paginaAtual === 'cadastro.html' ? 'active' : ''}">
                <i class="fas fa-ship"></i>
                <span>Cadastro Marítimo</span>
            </a>
            <a href="cadastro-aereo.html" class="menu-link ${paginaAtual === 'cadastro-aereo.html' ? 'active' : ''}">
                <i class="fas fa-plane"></i>
                <span>Cadastro Aéreo</span>
            </a>
            <a href="historico.html" class="menu-link ${paginaAtual === 'historico.html' ? 'active' : ''}">
                <i class="fas fa-history"></i>
                <span>Histórico</span>
            </a>
            <a href="previsao.html" class="menu-link ${paginaAtual === 'previsao.html' ? 'active' : ''}">
                <i class="fas fa-calendar-alt"></i>
                <span>Previsão de Chegada</span>
            </a>
            <a href="nil.html" class="menu-link ${paginaAtual === 'nil.html' ? 'active' : ''}">
                <i class="fas fa-file-alt"></i>
                <span>Emitir NIL</span>
            </a>
            <a href="historicoNIL.html" class="menu-link ${paginaAtual === 'historicoNIL.html' ? 'active' : ''}">
                <i class="fas fa-print"></i>
                <span>Histórico NIL</span>
            </a>
        `;
    }
}

// ================= LOGIN =================
function inicializarLogin() {
    const form = document.getElementById('formLogin');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            realizarLogin();
        });
    }
}

function realizarLogin() {
    const usuario = document.getElementById('usuario').value.toUpperCase();
    const senha = document.getElementById('senha').value;
    const mensagemErro = document.getElementById('mensagemErro');
    
    // Usuários fixos do sistema
    const usuarios = {
        'ADMIN': { senha: '1234', perfil: 'ADMIN' },
        'OPERADOR': { senha: '1234', perfil: 'OPERADOR' },
        'IMPORTACAO': { senha: '1234', perfil: 'IMPORTACAO' }
    };
    
    const usuarioData = usuarios[usuario];
    
    if (usuarioData && usuarioData.senha === senha) {
        localStorage.setItem('usuarioLogado', usuario);
        localStorage.setItem('perfilUsuario', usuarioData.perfil);
        
        // Redirecionar conforme perfil
        if (usuarioData.perfil === 'OPERADOR') {
            window.location.href = 'dashboard-operador.html';
        } else if (usuarioData.perfil === 'IMPORTACAO') {
            window.location.href = 'previsao.html';
        } else {
            window.location.href = 'index.html';
        }
    } else {
        mensagemErro.textContent = 'Usuário ou senha inválidos!';
        mensagemErro.classList.add('show');
        setTimeout(() => {
            mensagemErro.textContent = '';
            mensagemErro.classList.remove('show');
        }, 3000);
    }
}

// ================= SAIR =================
function sair() {
    if (confirm('Deseja realmente sair do sistema?')) {
        localStorage.removeItem('usuarioLogado');
        localStorage.removeItem('perfilUsuario');
        window.location.href = 'login.html';
    }
}

// ================= VALIDAR PERMISSÃO ADMIN =================
function validarPermissaoAdmin() {
    const perfil = localStorage.getItem('perfilUsuario');
    return perfil === 'ADMIN';
}

// ================= INICIALIZAR PÁGINA =================
function inicializarPagina() {
    const pagina = window.location.pathname.split('/').pop();
    
    if (pagina === 'login.html') {
        inicializarLogin();
    } else if (pagina === 'index.html' || pagina === '') {
        carregarDashboard();
    } else if (pagina === 'cadastro.html') {
        inicializarCadastroMaritimo();
    } else if (pagina === 'cadastro-aereo.html') {
        inicializarCadastroAereo();
    } else if (pagina === 'historico.html') {
        carregarHistorico();
    } else if (pagina === 'previsao.html') {
        // Previsão é inicializada pelo previsao.js
    }
}

// ================= CADASTRO MARÍTIMO =================
function inicializarCadastroMaritimo() {
    const form = document.getElementById('formCadastroMaritimo');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            salvarContainer('maritimo');
        });
        
        // Adicionar conversão automática para maiúsculo
        adicionarConversaoMaiusculo('sj');
        adicionarConversaoMaiusculo('container');
        adicionarConversaoMaiusculo('cte');
        adicionarConversaoMaiusculo('responsavel');
    }
}

// ================= CADASTRO AÉREO =================
function inicializarCadastroAereo() {
    const form = document.getElementById('formCadastroAereo');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            salvarContainer('aereo');
        });
        
        // Adicionar conversão automática para maiúsculo
        adicionarConversaoMaiusculo('sjAereo');
        adicionarConversaoMaiusculo('containerAereo');
        adicionarConversaoMaiusculo('cteAereo');
        adicionarConversaoMaiusculo('responsavelAereo');
    }
}

// ================= ADICIONAR CONVERSÃO MAIÚSCULO =================
// Converte automaticamente para maiúsculo ao digitar
function adicionarConversaoMaiusculo(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.addEventListener('input', function(e) {
            const start = e.target.selectionStart;
            const end = e.target.selectionEnd;
            e.target.value = e.target.value.toUpperCase();
            e.target.setSelectionRange(start, end);
        });
    }
}

// ================= FORMATAR MAIÚSCULO =================
// Remove espaços duplicados e converte para maiúsculo
function formatarMaiusculo(valor) {
    if (!valor) return '';
    return valor.toUpperCase().trim().replace(/\s+/g, ' ');
}

// ================= VALIDAR ISO CONTAINER =================
// Valida formato ISO 6346: 4 letras + 7 números
function validarISOContainer(container) {
    const regex = /^[A-Z]{4}[0-9]{7}$/;
    return regex.test(container);
}

// ================= VALIDAR CONTAINER =================
function validarContainer(container) {
    return container.length === 11;
}

// ================= VALIDAR CAMPOS =================
function validarCampos(dados) {
    // Verificar se todos os campos estão preenchidos
    for (let campo in dados) {
        if (!dados[campo] || dados[campo].trim() === '') {
            return { valido: false, mensagem: 'Todos os campos são obrigatórios!' };
        }
    }
    
    // Validar container (11 caracteres)
    if (!validarContainer(dados.container)) {
        return { valido: false, mensagem: 'Container inválido! Deve conter exatamente 11 caracteres.' };
    }
    
    // Validar formato ISO 6346
    if (!validarISOContainer(dados.container)) {
        return { valido: false, mensagem: 'Container fora do padrão ISO (AAAA9999999).' };
    }
    
    return { valido: true };
}

// ================= VALIDAR CONTAINER DUPLICADO =================
function validarContainerDuplicado(container) {
    const historico = JSON.parse(localStorage.getItem('historico')) || [];
    return historico.some(item => item.container === container);
}

// ================= VALIDAR CONTAINER NA MESMA SJ =================
function validarContainerNaMesmaSJ(sj, container) {
    const historico = JSON.parse(localStorage.getItem('historico')) || [];
    return historico.some(item => item.sj === sj && item.container === container);
}

// ================= CALCULAR TEMPO =================
function calcularTempo(horaInicio, horaFinal) {
    const [horaIni, minIni] = horaInicio.split(':').map(Number);
    const [horaFim, minFim] = horaFinal.split(':').map(Number);
    
    const minutosInicio = horaIni * 60 + minIni;
    const minutosFinal = horaFim * 60 + minFim;
    
    const diferencaMinutos = minutosFinal - minutosInicio;
    
    if (diferencaMinutos < 0) {
        return { valido: false, minutos: 0, formatado: '00:00' };
    }
    
    const horas = Math.floor(diferencaMinutos / 60);
    const minutos = diferencaMinutos % 60;
    const formatado = `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}`;
    
    return { valido: true, minutos: diferencaMinutos, formatado: formatado };
}

// ================= PESQUISAR SJ =================
function pesquisarSJ() {
    const sj = document.getElementById('sj').value.trim();
    const mensagemErro = document.getElementById('mensagemErro');
    const mensagemSucesso = document.getElementById('mensagemSucesso');
    
    // Limpar mensagens
    mensagemErro.textContent = '';
    mensagemErro.classList.remove('show');
    mensagemSucesso.textContent = '';
    mensagemSucesso.classList.remove('show');
    
    if (!sj) {
        mensagemErro.textContent = 'Digite o SJ para pesquisar!';
        mensagemErro.classList.add('show');
        return;
    }
    
    const historico = JSON.parse(localStorage.getItem('historico')) || [];
    const sjExiste = historico.some(item => item.sj === sj);
    
    if (sjExiste) {
        mensagemSucesso.textContent = 'SJ encontrada no sistema!';
        mensagemSucesso.classList.add('show');
    } else {
        mensagemSucesso.textContent = 'SJ disponível para cadastro!';
        mensagemSucesso.classList.add('show');
    }
}

function pesquisarSJAereo() {
    const sj = document.getElementById('sjAereo').value.trim();
    const mensagemErro = document.getElementById('mensagemErroAereo');
    const mensagemSucesso = document.getElementById('mensagemSucessoAereo');
    
    // Limpar mensagens
    mensagemErro.textContent = '';
    mensagemErro.classList.remove('show');
    mensagemSucesso.textContent = '';
    mensagemSucesso.classList.remove('show');
    
    if (!sj) {
        mensagemErro.textContent = 'Digite o SJ para pesquisar!';
        mensagemErro.classList.add('show');
        return;
    }
    
    const historico = JSON.parse(localStorage.getItem('historico')) || [];
    const sjExiste = historico.some(item => item.sj === sj);
    
    if (sjExiste) {
        mensagemSucesso.textContent = 'SJ encontrada no sistema!';
        mensagemSucesso.classList.add('show');
    } else {
        mensagemSucesso.textContent = 'SJ disponível para cadastro!';
        mensagemSucesso.classList.add('show');
    }
}

// ================= SALVAR CONTAINER =================
function salvarContainer(tipo) {
    let dados;
    let mensagemErro, mensagemSucesso;
    
    if (tipo === 'maritimo') {
        dados = {
            sj: formatarMaiusculo(document.getElementById('sj').value),
            container: formatarMaiusculo(document.getElementById('container').value),
            cte: formatarMaiusculo(document.getElementById('cte').value),
            doca: document.getElementById('doca').value,
            horaInicio: document.getElementById('horaInicio').value,
            horaFinal: document.getElementById('horaFinal').value,
            responsavel: formatarMaiusculo(document.getElementById('responsavel').value),
            modalidade: 'Marítimo',
            dataRegistro: new Date().toISOString()
        };
        mensagemErro = document.getElementById('mensagemErro');
        mensagemSucesso = document.getElementById('mensagemSucesso');
    } else {
        dados = {
            sj: formatarMaiusculo(document.getElementById('sjAereo').value),
            container: formatarMaiusculo(document.getElementById('containerAereo').value),
            cte: formatarMaiusculo(document.getElementById('cteAereo').value),
            doca: document.getElementById('docaAereo').value,
            horaInicio: document.getElementById('horaInicioAereo').value,
            horaFinal: document.getElementById('horaFinalAereo').value,
            responsavel: formatarMaiusculo(document.getElementById('responsavelAereo').value),
            modalidade: 'Aéreo',
            dataRegistro: new Date().toISOString()
        };
        mensagemErro = document.getElementById('mensagemErroAereo');
        mensagemSucesso = document.getElementById('mensagemSucessoAereo');
    }
    
    // Limpar mensagens
    mensagemErro.textContent = '';
    mensagemErro.classList.remove('show');
    mensagemSucesso.textContent = '';
    mensagemSucesso.classList.remove('show');
    
    // Validar campos
    const validacao = validarCampos(dados);
    if (!validacao.valido) {
        mensagemErro.textContent = validacao.mensagem;
        mensagemErro.classList.add('show');
        return;
    }
    
    // Calcular tempo de descarregamento
    const tempo = calcularTempo(dados.horaInicio, dados.horaFinal);
    if (!tempo.valido) {
        mensagemErro.textContent = 'Hora final deve ser maior que hora início!';
        mensagemErro.classList.add('show');
        return;
    }
    
    // Adicionar tempo aos dados
    dados.tempoMinutos = tempo.minutos;
    dados.tempoFormatado = tempo.formatado;
    
    // Verificar se container já existe na mesma SJ
    if (validarContainerNaMesmaSJ(dados.sj, dados.container)) {
        mensagemErro.textContent = 'Este container já foi registrado nesta SJ.';
        mensagemErro.classList.add('show');
        return;
    }
    
    // Salvar via API / banco e sincronizar cache local
    if (window.DB && typeof DB.adicionarHistorico === "function") {
        DB.adicionarHistorico(dados)
            .then(() => {
                mensagemSucesso.textContent = 'Container cadastrado com sucesso!';
                mensagemSucesso.classList.add('show');
                
                setTimeout(() => {
                    if (tipo === 'maritimo') {
                        document.getElementById('formCadastroMaritimo').reset();
                    } else {
                        document.getElementById('formCadastroAereo').reset();
                    }
                    mensagemSucesso.classList.remove('show');
                }, 2000);
            })
            .catch(() => {
                mensagemErro.textContent = 'Erro ao salvar no servidor. Tente novamente.';
                mensagemErro.classList.add('show');
            });
    } else {
        mensagemErro.textContent = 'Camada de armazenamento indisponível (DB).';
        mensagemErro.classList.add('show');
    }
}

// ================= LIMPAR FORMULÁRIO =================
function limparFormulario(formId) {
    document.getElementById(formId).reset();
    
    // Limpar mensagens
    const mensagensErro = document.querySelectorAll('.error-message');
    const mensagensSucesso = document.querySelectorAll('.success-message');
    
    mensagensErro.forEach(msg => {
        msg.textContent = '';
        msg.classList.remove('show');
    });
    
    mensagensSucesso.forEach(msg => {
        msg.textContent = '';
        msg.classList.remove('show');
    });
}

// ================= HISTÓRICO =================
function carregarHistorico() {
    const historico = DB.obter('historico');
    exibirHistorico(historico);
}

function exibirHistorico(dados) {
    const tbody = document.getElementById('tabelaHistorico');
    const isAdmin = validarPermissaoAdmin();
    
    if (dados.length === 0) {
        tbody.innerHTML = `<tr><td colspan="${isAdmin ? '11' : '10'}" class="no-data">Nenhum registro encontrado</td></tr>`;
        return;
    }
    
    tbody.innerHTML = '';
    
    dados.forEach((item, index) => {
        const tr = document.createElement('tr');
        
        const dataRegistro = new Date(item.dataRegistro);
        const dataFormatada = dataRegistro.toLocaleDateString('pt-BR');
        
        tr.innerHTML = `
            <td>${item.sj}</td>
            <td>${item.container}</td>
            <td>${item.cte}</td>
            <td>${item.doca}</td>
            <td>${item.horaInicio}</td>
            <td>${item.horaFinal}</td>
            <td>${item.responsavel}</td>
            <td>${item.transportadora || '-'}</td>
            <td>${dataFormatada}</td>
            <td>${item.modalidade}</td>
            ${isAdmin ? `<td><button class="btn btn-sm" style="background: #dc3545; color: white; padding: 6px 12px;" onclick="confirmarExclusao(${index})"><i class="fas fa-trash"></i></button></td>` : ''}
        `;
        
        tbody.appendChild(tr);
    });
}

// ================= FILTROS =================
function aplicarFiltros() {
    const historico = DB.obter('historico');
    
    const dataInicio = document.getElementById('filtroDataInicio').value;
    const dataFim = document.getElementById('filtroDataFim').value;
    const doca = document.getElementById('filtroDoca').value;
    const cliente = document.getElementById('filtroCliente').value.toLowerCase();
    const container = document.getElementById('filtroContainerHistorico').value.toUpperCase().trim();
    
    let dadosFiltrados = historico.filter(item => {
        let passa = true;
        
        const dataRegistro = new Date(item.dataRegistro).toISOString().split('T')[0];
        
        if (dataInicio && dataRegistro < dataInicio) passa = false;
        if (dataFim && dataRegistro > dataFim) passa = false;
        if (doca && item.doca !== doca) passa = false;
        if (cliente && !item.responsavel.toLowerCase().includes(cliente)) passa = false;
        if (container && !item.container.includes(container)) passa = false;
        
        return passa;
    });
    
    exibirHistorico(dadosFiltrados);
}

function limparFiltros() {
    document.getElementById('filtroDataInicio').value = '';
    document.getElementById('filtroDataFim').value = '';
    document.getElementById('filtroDoca').value = '';
    document.getElementById('filtroCliente').value = '';
    document.getElementById('filtroContainerHistorico').value = '';
    carregarHistorico();
}

// ================= DASHBOARD =================
function carregarDashboard() {
    const historico = DB.obter('historico');
    
    // Criar filtro de mês se não existir
    criarFiltroMes();
    
    // Atualizar cards
    atualizarCards(historico);
    
    // Criar gráficos
    criarGraficoDia(historico);
    criarGraficoSemana(historico);
    criarGraficoMes(historico);
    criarGraficoDoca(historico);
    criarGraficoResponsaveis(historico);
    criarGraficoTransportadoras(historico);
}

// ================= CRIAR FILTRO MÊS =================
function criarFiltroMes() {
    const filtroExiste = document.getElementById('filtroMes');
    if (filtroExiste) return;
    
    const kpiRow = document.querySelector('.kpi-row');
    if (!kpiRow) return;
    
    const filtroDiv = document.createElement('div');
    filtroDiv.style.marginBottom = '28px';
    filtroDiv.innerHTML = `
        <label for="filtroMes" style="color: #00469B; font-weight: 600; margin-right: 12px;">Filtrar por Mês:</label>
        <select id="filtroMes" onchange="filtrarPorMes()" style="padding: 10px 16px; border: 2px solid #E6F0FA; border-radius: 8px; font-weight: 500;">
            <option value="">Mês Atual</option>
            <option value="0">Janeiro</option>
            <option value="1">Fevereiro</option>
            <option value="2">Março</option>
            <option value="3">Abril</option>
            <option value="4">Maio</option>
            <option value="5">Junho</option>
            <option value="6">Julho</option>
            <option value="7">Agosto</option>
            <option value="8">Setembro</option>
            <option value="9">Outubro</option>
            <option value="10">Novembro</option>
            <option value="11">Dezembro</option>
        </select>
    `;
    
    kpiRow.parentNode.insertBefore(filtroDiv, kpiRow);
}

// ================= FILTRAR POR MÊS =================
function filtrarPorMes() {
    const mesSelecionado = document.getElementById('filtroMes').value;
    const historico = DB.obter('historico');
    
    let historicoFiltrado;
    
    if (mesSelecionado === '') {
        // Mês atual
        const mesAtual = new Date().getMonth();
        const anoAtual = new Date().getFullYear();
        historicoFiltrado = historico.filter(item => {
            const data = new Date(item.dataRegistro);
            return data.getMonth() === mesAtual && data.getFullYear() === anoAtual;
        });
    } else {
        // Mês selecionado
        const mes = parseInt(mesSelecionado);
        const anoAtual = new Date().getFullYear();
        historicoFiltrado = historico.filter(item => {
            const data = new Date(item.dataRegistro);
            return data.getMonth() === mes && data.getFullYear() === anoAtual;
        });
    }
    
    atualizarCards(historicoFiltrado);
}

// ================= CALCULAR MÉDIA DIÁRIA =================
function calcularMediaDiaria(historico) {
    if (historico.length === 0) return 0;
    
    const diasComRegistro = new Set();
    historico.forEach(item => {
        const data = new Date(item.dataRegistro);
        const dataStr = data.toISOString().split('T')[0];
        diasComRegistro.add(dataStr);
    });
    
    const totalDias = diasComRegistro.size;
    return totalDias > 0 ? (historico.length / totalDias).toFixed(1) : 0;
}

// ================= CALCULAR CONTAINER MAIS DEMORADO =================
function calcularContainerMaisDemorado(historico) {
    if (historico.length === 0) return { container: '-', tempo: '00:00' };
    
    let maisDemorado = historico[0];
    historico.forEach(item => {
        if (item.tempoMinutos && item.tempoMinutos > (maisDemorado.tempoMinutos || 0)) {
            maisDemorado = item;
        }
    });
    
    return {
        container: maisDemorado.container || '-',
        tempo: maisDemorado.tempoFormatado || '00:00'
    };
}

// ================= CALCULAR SJ MAIS DEMORADA =================
function calcularSJMaisDemorada(historico) {
    if (historico.length === 0) return { sj: '-', tempo: '00:00' };
    
    const temposPorSJ = {};
    
    historico.forEach(item => {
        if (item.tempoMinutos) {
            if (!temposPorSJ[item.sj]) {
                temposPorSJ[item.sj] = 0;
            }
            temposPorSJ[item.sj] += item.tempoMinutos;
        }
    });
    
    let sjMaisDemorada = '-';
    let maiorTempo = 0;
    
    for (let sj in temposPorSJ) {
        if (temposPorSJ[sj] > maiorTempo) {
            maiorTempo = temposPorSJ[sj];
            sjMaisDemorada = sj;
        }
    }
    
    const horas = Math.floor(maiorTempo / 60);
    const minutos = maiorTempo % 60;
    const tempoFormatado = `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}`;
    
    return { sj: sjMaisDemorada, tempo: tempoFormatado };
}

// ================= CLASSIFICAR PREVISÃO =================
function classificarPrevisao(dataPrevisao) {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    const dataPrev = new Date(dataPrevisao);
    dataPrev.setHours(0, 0, 0, 0);
    
    if (dataPrev < hoje) return 'ATRASADO';
    if (dataPrev.getTime() === hoje.getTime()) return 'EM DIA';
    return 'ADIANTADO';
}

// ================= CARREGAR PREVISÕES HOJE =================
function carregarPrevisoesHoje() {
    const previsoes = DB.obter('previsoesChegada');
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
function atualizarCards(historico) {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    const inicioSemana = new Date(hoje);
    inicioSemana.setDate(inicioSemana.getDate() - 7);
    
    const inicioMes = new Date(hoje);
    inicioMes.setMonth(inicioMes.getMonth() - 1);
    
    // Total de containers que chegaram (histórico completo)
    const totalChegados = historico.length;
    const elemTotalChegados = document.getElementById('totalChegados');
    if (elemTotalChegados) elemTotalChegados.textContent = totalChegados;
    
    // Containers na semana
    const containersSemana = historico.filter(item => {
        const dataRegistro = new Date(item.dataRegistro);
        return dataRegistro >= inicioSemana;
    }).length;
    
    const elemSemana = document.getElementById('containersSemana');
    if (elemSemana) elemSemana.textContent = containersSemana;
    
    // Containers no mês
    const containersMes = historico.filter(item => {
        const dataRegistro = new Date(item.dataRegistro);
        return dataRegistro >= inicioMes;
    }).length;
    
    const elemMes = document.getElementById('containersMes');
    if (elemMes) elemMes.textContent = containersMes;
    
    // Doca mais movimentada (hoje)
    const docas = {};
    historico.filter(item => {
        const dataRegistro = new Date(item.dataRegistro);
        dataRegistro.setHours(0, 0, 0, 0);
        return dataRegistro.getTime() === hoje.getTime();
    }).forEach(item => {
        docas[item.doca] = (docas[item.doca] || 0) + 1;
    });
    
    let docaMaisMovimentada = '-';
    let maxMovimentacao = 0;
    
    for (let doca in docas) {
        if (docas[doca] > maxMovimentacao) {
            maxMovimentacao = docas[doca];
            docaMaisMovimentada = `Doca ${doca}`;
        }
    }
    
    const elemDoca = document.getElementById('docaMaisMovimentada');
    if (elemDoca) elemDoca.textContent = docaMaisMovimentada;
    
    // Média diária
    const mediaDiaria = calcularMediaDiaria(historico);
    const elemMedia = document.getElementById('mediaDiaria');
    if (elemMedia) elemMedia.textContent = mediaDiaria;
    
    // Container mais demorado
    const containerMaisDemorado = calcularContainerMaisDemorado(historico);
    const elemContainerDemorado = document.getElementById('containerMaisDemorado');
    if (elemContainerDemorado) {
        elemContainerDemorado.textContent = `${containerMaisDemorado.container} (${containerMaisDemorado.tempo})`;
    }
    
    // SJ mais demorada
    const sjMaisDemorada = calcularSJMaisDemorada(historico);
    const elemSJDemorada = document.getElementById('sjMaisDemorada');
    if (elemSJDemorada) {
        elemSJDemorada.textContent = `${sjMaisDemorada.sj} (${sjMaisDemorada.tempo})`;
    }
    
    // Previsões para hoje
    const previsoesHoje = carregarPrevisoesHoje();
    const elemPrevisoes = document.getElementById('previsoesHoje');
    if (elemPrevisoes) {
        elemPrevisoes.textContent = previsoesHoje.total;
    }
    
    // Containers que chegaram hoje
    const chegadasHoje = contarChegadasHoje();
    const elemChegadas = document.getElementById('chegadasHoje');
    if (elemChegadas) {
        elemChegadas.textContent = chegadasHoje;
    }
    
    // Previsões por classificação
    const classificacao = contarPorClassificacao();
    const elemAtrasados = document.getElementById('totalAtrasados');
    const elemEmDia = document.getElementById('totalEmDia');
    const elemAdiantados = document.getElementById('totalAdiantados');
    
    if (elemAtrasados) elemAtrasados.textContent = classificacao.atrasados;
    if (elemEmDia) elemEmDia.textContent = classificacao.emDia;
    if (elemAdiantados) elemAdiantados.textContent = classificacao.adiantados;
}

// ================= CONTAR POR CLASSIFICAÇÃO =================
function contarPorClassificacao() {
    const previsoes = DB.obter('previsoesChegada');
    
    let atrasados = 0;
    let emDia = 0;
    let adiantados = 0;
    
    previsoes.forEach(item => {
        if (item.status !== 'CHEGOU') {
            const classificacao = classificarPrevisao(item.dataPrevisao);
            if (classificacao === 'ATRASADO') atrasados++;
            else if (classificacao === 'EM DIA') emDia++;
            else if (classificacao === 'ADIANTADO') adiantados++;
        }
    });
    
    return { atrasados, emDia, adiantados };
}

// ================= CONFIRMAR EXCLUSÃO =================
function confirmarExclusao(index) {
    if (!validarPermissaoAdmin()) {
        alert('Apenas ADMIN pode excluir registros.');
        return;
    }
    
    const modal = document.getElementById('modalConfirmacao');
    if (modal) {
        modal.style.display = 'flex';
        modal.dataset.index = index;
    }
}

// ================= EXCLUIR REGISTRO =================
function excluirRegistro() {
    if (!validarPermissaoAdmin()) {
        alert('Apenas ADMIN pode excluir registros.');
        return;
    }
    
    const modal = document.getElementById('modalConfirmacao');
    const index = parseInt(modal.dataset.index);
    
    try {
        DB.removerLocal('historico', index);
        fecharModalConfirmacao();
        carregarHistorico();
    } catch (error) {
        alert('Erro ao excluir registro. Tente novamente.');
    }
}

// ================= FECHAR MODAL CONFIRMAÇÃO =================
function fecharModalConfirmacao() {
    const modal = document.getElementById('modalConfirmacao');
    if (modal) {
        modal.style.display = 'none';
    }
}

// ================= CONTAR CHEGADAS HOJE =================
function contarChegadasHoje() {
    const previsoes = DB.obter('previsoesChegada');
    const hoje = new Date().toISOString().split('T')[0];
    
    return previsoes.filter(item => 
        item.status === 'CHEGOU' && 
        item.dataChegada === hoje
    ).length;
}

// ================= GRÁFICO POR DIA =================
function criarGraficoDia(historico) {
    const ctx = document.getElementById('chartDia');
    if (!ctx) return;
    
    const labels = [];
    const dados = [];
    
    for (let i = 6; i >= 0; i--) {
        const data = new Date();
        data.setDate(data.getDate() - i);
        data.setHours(0, 0, 0, 0);
        
        labels.push(data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }));
        
        const count = historico.filter(item => {
            const dataRegistro = new Date(item.dataRegistro);
            dataRegistro.setHours(0, 0, 0, 0);
            return dataRegistro.getTime() === data.getTime();
        }).length;
        
        dados.push(count);
    }
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Containers',
                data: dados,
                backgroundColor: 'rgba(44, 82, 130, 0.8)',
                borderColor: 'rgba(44, 82, 130, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

// ================= GRÁFICO POR SEMANA =================
function criarGraficoSemana(historico) {
    const ctx = document.getElementById('chartSemana');
    if (!ctx) return;
    
    const labels = [];
    const dados = [];
    
    for (let i = 3; i >= 0; i--) {
        const dataFim = new Date();
        dataFim.setDate(dataFim.getDate() - (i * 7));
        dataFim.setHours(23, 59, 59, 999);
        
        const dataInicio = new Date(dataFim);
        dataInicio.setDate(dataInicio.getDate() - 6);
        dataInicio.setHours(0, 0, 0, 0);
        
        labels.push(`Semana ${4-i}`);
        
        const count = historico.filter(item => {
            const dataRegistro = new Date(item.dataRegistro);
            return dataRegistro >= dataInicio && dataRegistro <= dataFim;
        }).length;
        
        dados.push(count);
    }
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Containers',
                data: dados,
                backgroundColor: 'rgba(79, 195, 247, 0.2)',
                borderColor: 'rgba(79, 195, 247, 1)',
                borderWidth: 2,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

// ================= GRÁFICO POR MÊS =================
function criarGraficoMes(historico) {
    const ctx = document.getElementById('chartMes');
    if (!ctx) return;
    
    const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const labels = [];
    const dados = [];
    
    for (let i = 5; i >= 0; i--) {
        const data = new Date();
        data.setMonth(data.getMonth() - i);
        const mes = data.getMonth();
        const ano = data.getFullYear();
        
        labels.push(meses[mes]);
        
        const count = historico.filter(item => {
            const dataRegistro = new Date(item.dataRegistro);
            return dataRegistro.getMonth() === mes && dataRegistro.getFullYear() === ano;
        }).length;
        
        dados.push(count);
    }
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Containers',
                data: dados,
                backgroundColor: 'rgba(102, 126, 234, 0.8)',
                borderColor: 'rgba(102, 126, 234, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

// ================= GRÁFICO POR DOCA =================
function criarGraficoDoca(historico) {
    const ctx = document.getElementById('chartDoca');
    if (!ctx) return;
    
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    const docas = ['1', '2', '3'];
    const dados = [];
    
    docas.forEach(doca => {
        const count = historico.filter(item => {
            const dataRegistro = new Date(item.dataRegistro);
            dataRegistro.setHours(0, 0, 0, 0);
            return item.doca === doca && dataRegistro.getTime() === hoje.getTime();
        }).length;
        dados.push(count);
    });
    
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Doca 1', 'Doca 2', 'Doca 3'],
            datasets: [{
                label: 'Containers',
                data: dados,
                backgroundColor: [
                    'rgba(102, 126, 234, 0.8)',
                    'rgba(17, 153, 142, 0.8)',
                    'rgba(240, 147, 251, 0.8)'
                ],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true
        }
    });
}

// ================= GRÁFICO TOP RESPONSÁVEIS =================
function criarGraficoResponsaveis(historico) {
    const ctx = document.getElementById('chartResponsaveis');
    if (!ctx) return;
    
    const mesAtual = new Date().getMonth();
    const anoAtual = new Date().getFullYear();
    
    const historicoMes = historico.filter(item => {
        const data = new Date(item.dataRegistro);
        return data.getMonth() === mesAtual && data.getFullYear() === anoAtual;
    });
    
    const ranking = {};
    historicoMes.forEach(item => {
        const resp = item.responsavel || 'N/A';
        ranking[resp] = (ranking[resp] || 0) + 1;
    });
    
    const ordenado = Object.entries(ranking)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
    
    const labels = ordenado.map(item => item[0]);
    const dados = ordenado.map(item => item[1]);
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Containers',
                data: dados,
                backgroundColor: 'rgba(0, 70, 155, 0.8)',
                borderColor: 'rgba(0, 70, 155, 1)',
                borderWidth: 1
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                x: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

// ================= GRÁFICO TOP TRANSPORTADORAS =================
function criarGraficoTransportadoras(historico) {
    const ctx = document.getElementById('chartTransportadoras');
    if (!ctx) return;
    
    const mesAtual = new Date().getMonth();
    const anoAtual = new Date().getFullYear();
    
    const historicoMes = historico.filter(item => {
        const data = new Date(item.dataRegistro);
        return data.getMonth() === mesAtual && data.getFullYear() === anoAtual;
    });
    
    const ranking = {};
    historicoMes.forEach(item => {
        const transp = item.transportadora || 'N/A';
        if (transp !== '-') {
            ranking[transp] = (ranking[transp] || 0) + 1;
        }
    });
    
    const ordenado = Object.entries(ranking)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
    
    const labels = ordenado.map(item => item[0]);
    const dados = ordenado.map(item => item[1]);
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Containers',
                data: dados,
                backgroundColor: 'rgba(17, 153, 142, 0.8)',
                borderColor: 'rgba(17, 153, 142, 1)',
                borderWidth: 1
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                x: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}
