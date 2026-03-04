const express = require("express");
const cors = require("cors");
const { neon } = require("@neondatabase/serverless");

require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

function obterDatabaseUrl() {
  const candidatos = [
    "DATABASE_URL",
    "POSTGRES_URL",
    "POSTGRES_URL_NON_POOLING",
    "POSTGRES_PRISMA_URL",
    "NEON_DATABASE_URL",
  ];

  for (const nome of candidatos) {
    if (process.env[nome]) {
      return { nome, valor: process.env[nome] };
    }
  }

  return null;
}

const dbConfig = obterDatabaseUrl();
const sql = dbConfig ? neon(dbConfig.valor) : null;

let tabelasInicializadas = false;

async function garantirTabelas() {
  if (!sql) {
    throw new Error(
      "URL do banco não encontrada. Configure DATABASE_URL ou POSTGRES_URL."
    );
  }

  if (tabelasInicializadas) return;

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
}

// Healthcheck
app.get("/health", async (req, res) => {
  if (!sql || !dbConfig) {
    return res.status(500).json({
      ok: false,
      error: "Variável do banco não encontrada no ambiente.",
      expected: [
        "DATABASE_URL",
        "POSTGRES_URL",
        "POSTGRES_URL_NON_POOLING",
        "POSTGRES_PRISMA_URL",
        "NEON_DATABASE_URL",
      ],
    });
  }

  try {
    await garantirTabelas();
    const resultado = await sql`SELECT NOW() AS agora`;

    res.json({
      ok: true,
      databaseEnv: dbConfig.nome,
      now: resultado[0]?.agora || null,
    });
  } catch (err) {
    res.status(500).json({
      ok: false,
      databaseEnv: dbConfig.nome,
      error: err.message,
    });
  }
});

// HISTÓRICO
app.get("/historico", async (req, res) => {
  try {
    await garantirTabelas();
    const rows = await sql`SELECT * FROM historico ORDER BY id DESC`;
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/historico", async (req, res) => {
  try {
    await garantirTabelas();

    const {
      sj,
      container,
      cte,
      doca,
      horaInicio,
      horaFinal,
      responsavel,
      transportadora,
      modalidade,
      dataRegistro,
      tempoMinutos,
      tempoFormatado,
    } = req.body ?? {};

    if (!sj || !container || !cte || !doca) {
      return res.status(400).json({
        error: "Campos obrigatórios: sj, container, cte, doca",
      });
    }

    const result = await sql`
      INSERT INTO historico (
        sj, container, cte, doca,
        horaInicio, horaFinal, responsavel,
        transportadora, modalidade, dataRegistro,
        tempoMinutos, tempoFormatado
      )
      VALUES (
        ${sj}, ${container}, ${cte}, ${doca},
        ${horaInicio ?? null}, ${horaFinal ?? null}, ${responsavel ?? null},
        ${transportadora ?? null}, ${modalidade ?? null}, ${dataRegistro ?? null},
        ${Number.isFinite(tempoMinutos) ? tempoMinutos : null},
        ${tempoFormatado ?? null}
      )
      RETURNING id
    `;

    res.json({ id: result[0].id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PREVISÕES
app.get("/previsoes", async (req, res) => {
  try {
    await garantirTabelas();
    const rows = await sql`SELECT * FROM previsoesChegada ORDER BY id DESC`;
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/previsoes", async (req, res) => {
  try {
    await garantirTabelas();

    const {
      status,
      sj,
      conteudo,
      container,
      dataPrevisao,
      transportadora,
      usuario,
      modalImportacao,
      dataChegada,
    } = req.body ?? {};

    if (!status || !sj || !container) {
      return res.status(400).json({
        error: "Campos obrigatórios: status, sj, container",
      });
    }

    const result = await sql`
      INSERT INTO previsoesChegada (
        status, sj, conteudo, container,
        dataPrevisao, transportadora, usuario,
        modalImportacao, dataChegada
      )
      VALUES (
        ${status}, ${sj}, ${conteudo ?? null}, ${container},
        ${dataPrevisao ?? null}, ${transportadora ?? null}, ${usuario ?? null},
        ${modalImportacao ?? null}, ${dataChegada ?? null}
      )
      RETURNING id
    `;

    res.json({ id: result[0].id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// NILS
app.get("/nils", async (req, res) => {
  try {
    await garantirTabelas();
    const rows = await sql`SELECT * FROM nilsGerados ORDER BY id DESC`;
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/nils", async (req, res) => {
  try {
    await garantirTabelas();

    const { numeroNIL, data, hora, usuario, dados } = req.body ?? {};

    if (!numeroNIL || !data || !hora || !usuario || !dados) {
      return res.status(400).json({
        error: "Campos obrigatórios: numeroNIL, data, hora, usuario, dados",
      });
    }

    const result = await sql`
      INSERT INTO nilsGerados (numeroNIL, data, hora, usuario, dados)
      VALUES (${numeroNIL}, ${data}, ${hora}, ${usuario}, ${dados})
      RETURNING id
    `;

    res.json({ id: result[0].id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = app;