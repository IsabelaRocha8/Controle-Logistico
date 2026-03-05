const { sql, garantirTabelas } = require("../lib/db");

module.exports = async (req, res) => {
  try {
    await garantirTabelas();
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }

  if (!sql) {
    return res
      .status(500)
      .json({ error: "Conexão com o banco não configurada (sql indefinido)." });
  }

  if (req.method === "GET") {
    try {
      const rows = await sql`SELECT * FROM previsoesChegada ORDER BY id DESC`;
      return res.json(rows);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  if (req.method === "POST") {
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
      dataRegistro,
      horaRegistro
    } = req.body ?? {};

    if (!status || !sj || !container) {
      return res.status(400).json({
        error: "Campos obrigatórios ausentes: status, sj e container.",
      });
    }

    try {
      const result = await sql`
        INSERT INTO previsoesChegada (
          status, 
          sj, 
          conteudo, 
          container,
          dataPrevisao, 
          transportadora, 
          usuario,
          modalImportacao, 
          dataChegada,
          dataRegistro,
          horaRegistro
        )
        VALUES (
          ${status}, 
          ${sj}, 
          ${conteudo || null}, 
          ${container},
          ${dataPrevisao || null}, 
          ${transportadora || null}, 
          ${usuario || null},
          ${modalImportacao || null}, 
          ${dataChegada || null},
          ${dataRegistro || new Date().toISOString().split('T')[0]},
          ${horaRegistro || new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
        )
        RETURNING id
      `;

      return res.json({ id: result[0].id });
    } catch (err) {
      console.error("Erro ao inserir previsão:", err);
      return res.status(500).json({ error: "Erro no banco de dados: " + err.message });
    }
  }

  res.setHeader("Allow", "GET, POST");
  return res.status(405).json({ error: "Method not allowed" });
};