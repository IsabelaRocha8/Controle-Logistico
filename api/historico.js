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

    if (!sj || !container || !cte || !doca) {
      return res.status(400).json({
        error: "Campos obrigatórios: sj, container, cte, doca",
      });
    }

    try {
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

      return res.json({ id: result[0].id });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  res.setHeader("Allow", "GET, POST");
  return res.status(405).json({ error: "Method not allowed" });
};


