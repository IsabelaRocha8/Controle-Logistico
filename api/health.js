const { sql, dbConfig, garantirTabelas } = require("../lib/db");

module.exports = async (req, res) => {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

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
    const r = await sql`SELECT NOW() AS agora`;
    res.json({ ok: true, databaseEnv: dbConfig.nome, now: r[0]?.agora ?? null });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
};


