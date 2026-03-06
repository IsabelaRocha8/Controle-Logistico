const { sql, garantirTabelas } = require("../lib/db");

function norm(v) {
  return String(v || "").trim().toUpperCase();
}

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
      horaRegistro,
    } = req.body ?? {};

    const statusNorm = norm(status);
    const sjNorm = norm(sj);
    const containerNorm = norm(container);

    if (!statusNorm || !sjNorm || !containerNorm) {
      return res.status(400).json({
        error: "Campos obrigatórios ausentes: status, sj e container.",
      });
    }

    try {
      const existentes = await sql`
        SELECT id, status, sj, container, modalImportacao
        FROM previsoesChegada
        WHERE container = ${containerNorm}
      `;

      const duplicadoNoMesmoLote = existentes.find(
        (row) => norm(row.sj) === sjNorm && norm(row.container) === containerNorm
      );

      if (duplicadoNoMesmoLote) {
        return res.status(409).json({
          error: "Container já registrado neste lote/SJ.",
        });
      }

      const jaChegou = existentes.find((row) => norm(row.status) === "CHEGOU");
      if (jaChegou && statusNorm === "CHEGOU") {
        return res.status(409).json({
          error: "A chegada deste container já foi registrada anteriormente.",
        });
      }

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
          ${statusNorm},
          ${sjNorm},
          ${conteudo || null},
          ${containerNorm},
          ${dataPrevisao || null},
          ${transportadora || null},
          ${norm(usuario) || null},
          ${modalImportacao || null},
          ${dataChegada || null},
          ${dataRegistro || new Date().toISOString().split("T")[0]},
          ${
            horaRegistro ||
            new Date().toLocaleTimeString("pt-BR", {
              hour: "2-digit",
              minute: "2-digit",
            })
          }
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
