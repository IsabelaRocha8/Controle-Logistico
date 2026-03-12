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

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

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

  if (!sjNorm || !containerNorm || !cteNorm || !doca || !horaInicio || !horaFinal || !norm(responsavel)) {
    return res.status(400).json({
      error:
        "Campos obrigatórios: sj, container, cte, doca, horaInicio, horaFinal, responsavel",
    });
  }

  try {
    const previsao = await sql`
      SELECT id, status
      FROM previsoesChegada
      WHERE sj = ${sjNorm} AND container = ${containerNorm}
      ORDER BY id DESC
      LIMIT 1
    `;

    if (!previsao.length) {
      return res.status(404).json({ error: "Previsão não encontrada para este SJ/container." });
    }

    if (norm(previsao[0].status) === "CHEGOU") {
      return res.status(409).json({ error: "A chegada deste container já foi registrada." });
    }

    const historicoExistente = await sql`
      SELECT id
      FROM historico
      WHERE sj = ${sjNorm} AND container = ${containerNorm}
      LIMIT 1
    `;

    if (historicoExistente.length) {
      return res.status(409).json({ error: "Container já registrado no histórico para este lote." });
    }

    const hoje = new Date().toISOString().split("T")[0];

    await sql`
      UPDATE previsoesChegada
      SET
        status = 'CHEGOU',
        dataChegada = ${hoje}
      WHERE id = ${previsao[0].id}
    `;

    const historico = await sql`
      INSERT INTO historico (
        sj, container, cte, doca,
        horaInicio, horaFinal, responsavel,
        transportadora, modalidade, dataRegistro,
        tempoMinutos, tempoFormatado
      )
      VALUES (
        ${sjNorm}, ${containerNorm}, ${cteNorm}, ${String(doca)},
        ${horaInicio}, ${horaFinal}, ${norm(responsavel)},
        ${norm(transportadora) || null}, ${modalidade ?? null}, ${dataRegistro ?? new Date().toISOString()},
        ${Number.isFinite(tempoMinutos) ? tempoMinutos : null},
        ${tempoFormatado ?? null}
      )
      RETURNING id
    `;

    return res.status(201).json({
      ok: true,
      historicoId: historico[0].id,
      previsaoId: previsao[0].id,
      status: "CHEGOU",
      dataChegada: hoje,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
