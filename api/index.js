const express = require('express');
const { neon } = require('@neondatabase/serverless');
const cors = require('cors');
require('dotenv').config();

const app = express();
const sql = neon(process.env.DATABASE_URL);

app.use(cors());
app.use(express.json());

// Inicialização automática das tabelas no Neon
async function initDb() {
    try {
        await sql`CREATE TABLE IF NOT EXISTS historico (
            id SERIAL PRIMARY KEY,
            sj TEXT NOT NULL,
            container TEXT NOT NULL,
            cte TEXT NOT NULL,
            doca TEXT NOT NULL,
            horaInicio TEXT,
            horaFinal TEXT,
            responsavel TEXT,
            transportadora TEXT,
            modalidade TEXT,
            dataRegistro TEXT,
            tempoMinutos INTEGER,
            tempoFormatado TEXT
        )`;

        await sql`CREATE TABLE IF NOT EXISTS previsoesChegada (
            id SERIAL PRIMARY KEY,
            status TEXT NOT NULL,
            sj TEXT NOT NULL,
            conteudo TEXT,
            container TEXT NOT NULL,
            dataPrevisao TEXT,
            transportadora TEXT,
            usuario TEXT,
            modalImportacao TEXT,
            dataChegada TEXT
        )`;

        await sql`CREATE TABLE IF NOT EXISTS nilsGerados (
            id SERIAL PRIMARY KEY,
            numeroNIL TEXT NOT NULL,
            data TEXT NOT NULL,
            hora TEXT NOT NULL,
            usuario TEXT NOT NULL,
            dados TEXT NOT NULL
        )`;
        console.log("Banco de dados Neon conectado e tabelas verificadas.");
    } catch (err) {
        console.error("Erro ao inicializar banco Neon:", err);
    }
}
initDb();

// --- ROTAS DE API ---

app.get('/api/historico', async (req, res) => {
    try {
        const rows = await sql`SELECT * FROM historico ORDER BY id DESC`;
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/historico', async (req, res) => {
    const { sj, container, cte, doca, horaInicio, horaFinal, responsavel, transportadora, modalidade, dataRegistro, tempoMinutos, tempoFormatado } = req.body;
    try {
        const result = await sql`
            INSERT INTO historico (sj, container, cte, doca, horaInicio, horaFinal, responsavel, transportadora, modalidade, dataRegistro, tempoMinutos, tempoFormatado)
            VALUES (${sj}, ${container}, ${cte}, ${doca}, ${horaInicio}, ${horaFinal}, ${responsavel}, ${transportadora}, ${modalidade}, ${dataRegistro}, ${tempoMinutos}, ${tempoFormatado})
            RETURNING id`;
        res.json({ id: result[0].id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/previsoes', async (req, res) => {
    try {
        const rows = await sql`SELECT * FROM previsoesChegada ORDER BY id DESC`;
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/previsoes', async (req, res) => {
    const { status, sj, conteudo, container, dataPrevisao, transportadora, usuario, modalImportacao } = req.body;
    try {
        const result = await sql`
            INSERT INTO previsoesChegada (status, sj, conteudo, container, dataPrevisao, transportadora, usuario, modalImportacao)
            VALUES (${status}, ${sj}, ${conteudo}, ${container}, ${dataPrevisao}, ${transportadora}, ${usuario}, ${modalImportacao})
            RETURNING id`;
        res.json({ id: result[0].id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = app;