// ================= INICIALIZAR ETIQUETAS =================
document.addEventListener('DOMContentLoaded', function() {
    carregarEtiquetas();
    adicionarConversaoMaiusculo('filtroSJEtiqueta');
});

// ================= CARREGAR ETIQUETAS =================
function carregarEtiquetas() {
    const etiquetas = JSON.parse(localStorage.getItem('etiquetasImpressas')) || [];
    exibirEtiquetas(etiquetas);
}

// ================= EXIBIR ETIQUETAS =================
function exibirEtiquetas(dados) {
    const container = document.getElementById('etiquetasCards');
    
    if (dados.length === 0) {
        container.innerHTML = '<div class="no-data-card">Nenhuma etiqueta impressa</div>';
        return;
    }
    
    container.innerHTML = '';
    
    dados.reverse().forEach((item, index) => {
        const dataImpressao = new Date(item.dataImpressao);
        const dataFormatada = dataImpressao.toLocaleDateString('pt-BR');
        const horaFormatada = dataImpressao.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        
        const card = document.createElement('div');
        card.className = 'container-card';
        
        card.innerHTML = `
            <div class="container-card-header">
                <div class="container-card-badges">
                    <span class="badge" style="background: #28a745;">${item.status}</span>
                    <span class="badge" style="background: #00469B;">Qtd: ${item.quantidade}</span>
                </div>
            </div>
            <div class="container-card-body">
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
                    <i class="fas fa-box"></i>
                    <div>
                        <span class="info-label">Container</span>
                        <span class="info-value">${item.container}</span>
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
                        <span class="info-value">${new Date(item.dataPrevisao + 'T00:00:00').toLocaleDateString('pt-BR')}</span>
                    </div>
                </div>
                <div class="container-card-info">
                    <i class="fas fa-print"></i>
                    <div>
                        <span class="info-label">Impressão</span>
                        <span class="info-value">${dataFormatada} ${horaFormatada}</span>
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
            <div class="container-card-footer">
                <button class="btn-card-action" onclick="reimprimirEtiqueta(${dados.length - 1 - index})" style="background: #00469B;">
                    <i class="fas fa-redo"></i> Reimprimir
                </button>
            </div>
        `;
        
        container.appendChild(card);
    });
}

// ================= APLICAR FILTROS =================
function aplicarFiltrosEtiquetas() {
    const etiquetas = JSON.parse(localStorage.getItem('etiquetasImpressas')) || [];
    
    const dataInicio = document.getElementById('filtroDataInicioEtiqueta').value;
    const dataFim = document.getElementById('filtroDataFimEtiqueta').value;
    const sj = document.getElementById('filtroSJEtiqueta').value.toUpperCase().trim();
    
    let dadosFiltrados = etiquetas.filter(item => {
        let passa = true;
        
        const dataImpressao = new Date(item.dataImpressao).toISOString().split('T')[0];
        
        if (dataInicio && dataImpressao < dataInicio) passa = false;
        if (dataFim && dataImpressao > dataFim) passa = false;
        if (sj && item.sj !== sj) passa = false;
        
        return passa;
    });
    
    exibirEtiquetas(dadosFiltrados);
}

// ================= LIMPAR FILTROS =================
function limparFiltrosEtiquetas() {
    document.getElementById('filtroDataInicioEtiqueta').value = '';
    document.getElementById('filtroDataFimEtiqueta').value = '';
    document.getElementById('filtroSJEtiqueta').value = '';
    carregarEtiquetas();
}

// ================= REIMPRIMIR ETIQUETA =================
function reimprimirEtiqueta(index) {
    const etiquetas = JSON.parse(localStorage.getItem('etiquetasImpressas')) || [];
    const etiqueta = etiquetas[index];
    
    const previsao = {
        sj: etiqueta.sj,
        conteudo: etiqueta.conteudo
    };
    
    imprimirEtiqueta(previsao, etiqueta.quantidade);
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
                        <span class="value">${previsao.sj}</span>\n                        <span class="barcode">*${previsao.sj}*</span>
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
                @page { size: 100mm 150mm; margin: 2mm; }
                body { font-family: Arial, sans-serif; margin: 0; padding: 0; }
                .etiqueta { 
                    border: 1px solid #000; 
                    padding: 4mm; 
                    margin: 0; 
                    page-break-after: always;
                    width: 92mm;
                    height: 142mm;
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                }
                .etiqueta:last-child { page-break-after: auto; }
                .etiqueta-header { text-align: center; border-bottom: 1px solid #000; padding-bottom: 6px; }
                .etiqueta-header h1 { margin: 0; color: #000; font-size: 28px; }
                .etiqueta-header p { margin: 5px 0 0 0; color: #00336F; font-size: 14px; }
                .etiqueta-body { flex: 1; padding: 15px 0; }
                .etiqueta-field { margin: 10px 0; }
                .etiqueta-field .label { font-weight: bold; color: #000; font-size: 14px; }
                .etiqueta-field .value { font-size: 18px; font-weight: bold; display: block; margin-top: 5px; }
                .etiqueta-footer { text-align: center; border-top: 1px solid #000; padding-top: 6px; font-size: 11px; color: #000; }
                .barcode { font-family: "Libre Barcode 39", "Courier New", monospace; font-size: 48px; line-height: 1.1; }
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
