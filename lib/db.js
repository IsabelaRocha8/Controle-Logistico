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

  await sql`CREATE INDEX IF NOT EXISTS idx_historico_container ON historico (container);`;
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS ux_historico_sj_container ON historico (sj, container);`;

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
      dataChegada TEXT,
      dataRegistro TEXT,
      horaRegistro TEXT
    );
  `;

  await sql`CREATE INDEX IF NOT EXISTS idx_previsoes_container ON previsoesChegada (container);`;

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

  await sql`
    CREATE TABLE IF NOT EXISTS nil_print_history (
      id SERIAL PRIMARY KEY,
      numero_nil TEXT NOT NULL,
      referencia_sj TEXT,
      referencia_container TEXT,
      usuario TEXT NOT NULL,
      data TEXT NOT NULL,
      hora TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `;

  tabelasInicializadas = true;
}

module.exports = {
  sql,
  dbConfig,
  garantirTabelas,
};
