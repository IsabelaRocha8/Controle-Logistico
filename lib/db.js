const { neon } = require("@neondatabase/serverless");

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

module.exports = {
  sql,
  dbConfig,
  garantirTabelas,
};


