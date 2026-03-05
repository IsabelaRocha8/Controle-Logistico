const { sql, garantirTabelas } = require("../lib/db");

module.exports = async (req, res) => {
  try {
    await garantirTabelas();
    if (!sql) return res.status(500).json({ error: "Conexão com o banco não configurada." });

    if (req.method === "POST") {
      const {
        status, sj, conteudo, container,
        dataPrevisao, transportadora, usuario,
        modalImportacao, dataChegada,
      } = req.body ?? {};

      if (!status || !sj || !container) {
        return res.status(400).json({ error: "Campos obrigatórios: status, sj, container" });
      }

      const result = await sql`
        INSERT INTO previsoesChegada (
          status, sj, conteudo, container,
          dataPrevisao, transportadora, usuario,
          modalImportacao, dataChegada
        )
        VALUES (
          ${status}, ${sj}, ${conteudo || null}, ${container},
          ${dataPrevisao || null}, ${transportadora || null}, ${usuario || null},
          ${modalImportacao || null}, ${dataChegada || null}
        )
        RETURNING id
      `;

      return res.json({ id: result[0].id });
    }

    if (req.method === "GET") {
      const rows = await sql`SELECT * FROM previsoesChegada ORDER BY id DESC`;
      return res.json(rows);
    }

    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("Erro na API de Previsões:", err);
    return res.status(500).json({ error: err.message });
  }
};