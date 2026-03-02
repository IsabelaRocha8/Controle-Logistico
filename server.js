const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Caminho do banco compartilhado
const DB_PATH = path.join('M:', 'Centro de Manufatura制造中心', 'Estoque e Logistica仓储物流', 'SITE NIL', 'database', 'logistica.db');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Conectar ao banco
const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        console.error('Erro ao conectar ao banco:', err);
    } else {
        console.log('Conectado ao banco SQLite compartilhado');
        inicializarBanco();
    }
});

// Criar tabelas
function inicializarBanco() {
    db.serialize(() => {
        db.run(`CREATE TABLE IF NOT EXISTS historico (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sj TEXT NOT NULL,
            container TEXT NOT NULL,
            cte TEXT NOT NULL,
            doca TEXT NOT NULL,
            horaInicio TEXT NOT NULL,
            horaFinal TEXT NOT NULL,
            responsavel TEXT NOT NULL,
            transportadora TEXT,
            modalidade TEXT NOT NULL,
            dataRegistro TEXT NOT NULL,
            tempoMinutos INTEGER,
            tempoFormatado TEXT
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS previsoesChegada (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            status TEXT NOT NULL,
            sj TEXT NOT NULL,
            conteudo TEXT NOT NULL,
            container TEXT NOT NULL,
            dataPrevisao TEXT NOT NULL,
            transportadora TEXT NOT NULL,
            dataRegistro TEXT NOT NULL,
            horaRegistro TEXT NOT NULL,
            usuario TEXT NOT NULL,
            timestamp TEXT NOT NULL,
            modalImportacao TEXT,
            dataChegada TEXT,
            horaInicio TEXT,
            horaFinal TEXT,
            responsavel TEXT,
            cte TEXT,
            doca TEXT,
            timestampChegada TEXT
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS etiquetasImpressas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sj TEXT NOT NULL,
            conteudo TEXT,
            container TEXT NOT NULL,
            transportadora TEXT,
            dataPrevisao TEXT,
            quantidade INTEGER NOT NULL,
            dataImpressao TEXT NOT NULL,
            usuario TEXT NOT NULL,
            status TEXT NOT NULL
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS nilsGerados (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            numeroNIL TEXT NOT NULL,
            data TEXT NOT NULL,
            hora TEXT NOT NULL,
            usuario TEXT NOT NULL,
            dados TEXT NOT NULL
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS historicoImpressaoNIL (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            numeroNIL TEXT NOT NULL,
            dataImpressao TEXT NOT NULL,
            horaImpressao TEXT NOT NULL,
            usuario TEXT NOT NULL
        )`);
    });
}

// ===== ROTAS HISTÓRICO =====
app.get('/api/historico', (req, res) => {
    db.all('SELECT * FROM historico ORDER BY id DESC', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/historico', (req, res) => {
    const { sj, container, cte, doca, horaInicio, horaFinal, responsavel, transportadora, modalidade, dataRegistro, tempoMinutos, tempoFormatado } = req.body;
    
    db.run(`INSERT INTO historico (sj, container, cte, doca, horaInicio, horaFinal, responsavel, transportadora, modalidade, dataRegistro, tempoMinutos, tempoFormatado)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [sj, container, cte, doca, horaInicio, horaFinal, responsavel, transportadora, modalidade, dataRegistro, tempoMinutos, tempoFormatado],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID });
        }
    );
});

app.delete('/api/historico/:id', (req, res) => {
    db.run('DELETE FROM historico WHERE id = ?', [req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ deleted: this.changes });
    });
});

// ===== ROTAS PREVISÕES =====
app.get('/api/previsoes', (req, res) => {
    db.all('SELECT * FROM previsoesChegada ORDER BY id DESC', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/previsoes', (req, res) => {
    const { status, sj, conteudo, container, dataPrevisao, transportadora, dataRegistro, horaRegistro, usuario, timestamp, modalImportacao } = req.body;
    
    db.run(`INSERT INTO previsoesChegada (status, sj, conteudo, container, dataPrevisao, transportadora, dataRegistro, horaRegistro, usuario, timestamp, modalImportacao)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [status, sj, conteudo, container, dataPrevisao, transportadora, dataRegistro, horaRegistro, usuario, timestamp, modalImportacao],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID });
        }
    );
});

app.put('/api/previsoes/:id', (req, res) => {
    const { status, dataChegada, horaInicio, horaFinal, responsavel, cte, doca, timestampChegada } = req.body;
    
    db.run(`UPDATE previsoesChegada SET status = ?, dataChegada = ?, horaInicio = ?, horaFinal = ?, responsavel = ?, cte = ?, doca = ?, timestampChegada = ?
            WHERE id = ?`,
        [status, dataChegada, horaInicio, horaFinal, responsavel, cte, doca, timestampChegada, req.params.id],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ updated: this.changes });
        }
    );
});

app.delete('/api/previsoes/:id', (req, res) => {
    db.run('DELETE FROM previsoesChegada WHERE id = ?', [req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ deleted: this.changes });
    });
});

// ===== ROTAS ETIQUETAS =====
app.get('/api/etiquetas', (req, res) => {
    db.all('SELECT * FROM etiquetasImpressas ORDER BY id DESC', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/etiquetas', (req, res) => {
    const { sj, conteudo, container, transportadora, dataPrevisao, quantidade, dataImpressao, usuario, status } = req.body;
    
    db.run(`INSERT INTO etiquetasImpressas (sj, conteudo, container, transportadora, dataPrevisao, quantidade, dataImpressao, usuario, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [sj, conteudo, container, transportadora, dataPrevisao, quantidade, dataImpressao, usuario, status],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID });
        }
    );
});

// ===== ROTAS NIL =====
app.get('/api/nils', (req, res) => {
    db.all('SELECT * FROM nilsGerados ORDER BY id DESC', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/nils', (req, res) => {
    const { numeroNIL, data, hora, usuario, dados } = req.body;
    
    db.run(`INSERT INTO nilsGerados (numeroNIL, data, hora, usuario, dados)
            VALUES (?, ?, ?, ?, ?)`,
        [numeroNIL, data, hora, usuario, dados],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID });
        }
    );
});

app.get('/api/historico-nil', (req, res) => {
    db.all('SELECT * FROM historicoImpressaoNIL ORDER BY id DESC', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/historico-nil', (req, res) => {
    const { numeroNIL, dataImpressao, horaImpressao, usuario } = req.body;
    
    db.run(`INSERT INTO historicoImpressaoNIL (numeroNIL, dataImpressao, horaImpressao, usuario)
            VALUES (?, ?, ?, ?)`,
        [numeroNIL, dataImpressao, horaImpressao, usuario],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID });
        }
    );
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
    console.log(`Banco de dados: ${DB_PATH}`);
});
