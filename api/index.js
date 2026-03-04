const express = require('express');
const { neon } = require('@neondatabase/serverless');
const cors = require('cors');
require('dotenv').config();

const app = express();

function lerEnv(nome) {
    const valor = process.env[nome];
    if (!valor) return null;

    return valor.trim().replace(/^['\"]|['\"]$/g, '');
}

function construirUrlPeloPgParams() {
    const host = lerEnv('PGHOST') || lerEnv('POSTGRES_HOST');
    const user = lerEnv('PGUSER') || lerEnv('POSTGRES_USER');
    const database = lerEnv('PGDATABASE') || lerEnv('POSTGRES_DATABASE');
    const password = lerEnv('PGPASSWORD') || lerEnv('POSTGRES_PASSWORD');

    if (!host || !user || !database || !password) {
        return null;
    }

    const senha = encodeURIComponent(password);
    return `postgresql://${user}:${senha}@${host}/${database}?sslmode=require`;
}

function obterDatabaseUrl() {
    const candidatos = [
        'DATABASE_URL',
        'DATABASE_URL_UNPOOLED',
        'POSTGRES_URL',
        'POSTGRES_URL_NON_POOLING',
        'POSTGRES_PRISMA_URL',
        'NEON_DATABASE_URL'
    ];

    for (const nome of candidatos) {
        const valor = lerEnv(nome);
        if (valor) {
            return { nome, valor };
        }
    }

    const urlMontada = construirUrlPeloPgParams();
    if (urlMontada) {
        return { nome: 'PG* (montada automaticamente)', valor: urlMontada };
    }

    return null;
}

const dbConfig = obterDatabaseUrl();
const sql = dbConfig ? neon(dbConfig.valor) : null;
let tabelasInicializadas = false;
let inicializacaoEmAndamento = null;

app.use(cors());
app.use(express.json());

// Função para garantir que todas as tabelas existam
async function garantirTabelas() {
    if (!sql) {
        throw new Error('URL do banco não encontrada. Configure DATABASE_URL, DATABASE_URL_UNPOOLED, POSTGRES_URL ou parâmetros PG* na Vercel.');
    }

    if (tabelasInicializadas) {
        return;
    }

    if (inicializacaoEmAndamento) {
        await inicializacaoEmAndamento;
        return;
    }

    inicializacaoEmAndamento = (async () => {
        try {
            await sql`
                CREATE TABLE IF NOT EXISTS historico (
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
                );
            `;
            await sql`
                CREATE TABLE IF NOT EXISTS previsoesChegada (
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
                );
            `;
            await sql`
                CREATE TABLE IF NOT EXISTS nilsGerados (
                    id SERIAL PRIMARY KEY,
                    numeroNIL TEXT NOT NULL,
                    data TEXT NOT NULL,
                    hora TEXT NOT NULL,
                    usuario TEXT NOT NULL,
                    dados TEXT NOT NULL
                );
            `;

            tabelasInicializadas = true;
        } catch (err) {
            console.error('Erro ao inicializar tabelas:', err);
            throw err;
        } finally {
            inicializacaoEmAndamento = null;
        }
    })();

    await inicializacaoEmAndamento;
}

app.get('/api/health', async (req, res) => {
    if (!sql || !dbConfig) {
        return res.status(500).json({
            ok: false,
            error: 'Variável do banco não encontrada no ambiente.',
            expected: ['DATABASE_URL', 'DATABASE_URL_UNPOOLED', 'POSTGRES_URL', 'POSTGRES_URL_NON_POOLING', 'POSTGRES_PRISMA_URL', 'NEON_DATABASE_URL', 'PGHOST/PGUSER/PGDATABASE/PGPASSWORD']
        });
    }

    try {
        await garantirTabelas();
        const resultado = await sql`SELECT NOW() AS agora`;
        return res.json({
            ok: true,
            databaseEnv: dbConfig.nome,
            now: resultado[0]?.agora || null
        });
    } catch (err) {
        return res.status(500).json({
            ok: false,
            databaseEnv: dbConfig.nome,
            error: err.message
        });
    }
});

// ROTAS DE HISTÓRICO
app.get('/api/historico', async (req, res) => {
    try {
        await garantirTabelas();
        const rows = await sql`SELECT * FROM historico ORDER BY id DESC`;
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/historico', async (req, res) => {
    try {
        await garantirTabelas();
        const { sj, container, cte, doca, horaInicio, horaFinal, responsavel, transportadora, modalidade, dataRegistro, tempoMinutos, tempoFormatado } = req.body;
        const result = await sql`
            INSERT INTO historico (sj, container, cte, doca, horaInicio, horaFinal, responsavel, transportadora, modalidade, dataRegistro, tempoMinutos, tempoFormatado)
            VALUES (${sj}, ${container}, ${cte}, ${doca}, ${horaInicio}, ${horaFinal}, ${responsavel}, ${transportadora}, ${modalidade}, ${dataRegistro}, ${tempoMinutos}, ${tempoFormatado})
            RETURNING id`;
        res.json({ id: result[0].id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ROTAS DE PREVISÕES
app.get('/api/previsoes', async (req, res) => {
    try {
        await garantirTabelas();
        const rows = await sql`SELECT * FROM previsoesChegada ORDER BY id DESC`;
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/previsoes', async (req, res) => {
    try {
        await garantirTabelas();
        const { status, sj, conteudo, container, dataPrevisao, transportadora, usuario, modalImportacao } = req.body;
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
