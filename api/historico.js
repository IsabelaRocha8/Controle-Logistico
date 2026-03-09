const { sql, garantirTabelas } = require("../lib/db");

function norm(v) {
  return String(v || "").trim().toUpperCase();
}

function obterTipoSJ(sj) {
  const valor = norm(sj);
  if (valor.startsWith("SJ")) return "SJ";
  if (valor.startsWith("ZJ")) return "ZJ";
  return "OUTRO";
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
      const rows = await sql`SELECT * FROM historico ORDER BY id DESC`;
      return res.json(rows);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  if (req.method === "POST") {
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

    const sjNorm = norm(sj);
    const containerNorm = norm(container);
    const cteNorm = norm(cte);

    if (!sjNorm || !containerNorm || !cteNorm || !doca) {
      return res.status(400).json({
        error: "Campos obrigatórios: sj, container, cte, doca",
      });
    }

    try {
      const existentes = await sql`
        SELECT id, sj, container
        FROM historico
        WHERE container = ${containerNorm}
      `;

      const tipoAtual = obterTipoSJ(sjNorm);
      const conflito = existentes.find((row) => {
        const sjExistente = norm(row.sj);
        const tipoExistente = obterTipoSJ(sjExistente);

        const ambosSJZJ =
          (tipoAtual === "SJ" || tipoAtual === "ZJ") &&
          (tipoExistente === "SJ" || tipoExistente === "ZJ");

        if (ambosSJZJ) {
          return sjExistente === sjNorm;
        }

        return true;
      });

      if (conflito) {
        return res.status(409).json({
          error:
            "Container já registrado. Registros duplicados não são permitidos para esta combinação de lote/origem.",
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
          ${sjNorm}, ${containerNorm}, ${cteNorm}, ${doca},
          ${horaInicio ?? null}, ${horaFinal ?? null}, ${norm(responsavel) || null},
          ${norm(transportadora) || null}, ${modalidade ?? null}, ${dataRegistro ?? null},
          ${Number.isFinite(tempoMinutos) ? tempoMinutos : null},
          ${tempoFormatado ?? null}
        )
        RETURNING id
      `;

      return res.json({ id: result[0].id });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  if (req.method === "DELETE") {
    const id =
      Number(req.query?.id) ||
      Number((req.body && req.body.id) || NaN);

    if (!id || Number.isNaN(id)) {
      return res.status(400).json({ error: "Parâmetro id obrigatório para DELETE" });
    }

    try {
      await sql`DELETE FROM historico WHERE id = ${id}`;
      return res.json({ ok: true });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  res.setHeader("Allow", "GET, POST, DELETE");
  return res.status(405).json({ error: "Method not allowed" });
};
