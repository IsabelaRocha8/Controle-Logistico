const express = require("express");
const cors = require("cors");
require("dotenv").config();

const { sql, dbConfig, garantirTabelas } = require("../lib/db");

const app = express();
app.use(cors());
app.use(express.json());

// Healthcheck (usado em dev local; na Vercel use /api/health.js)
app.get("/api/health", async (req, res) => {
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
});

// HISTÓRICO
app.get("/api/historico", async (req, res) => {
  try {
    await garantirTabelas();
    const rows = await sql`SELECT * FROM historico ORDER BY id DESC`;
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/historico", async (req, res) => {
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

app.delete("/api/historico/:id", async (req, res) => {
  try {
    await garantirTabelas();

    const id = Number(req.params.id);
    if (!id || Number.isNaN(id)) {
      return res
        .status(400)
        .json({ error: "Parâmetro id obrigatório para DELETE" });
    }

    await sql`DELETE FROM historico WHERE id = ${id}`;
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PREVISÕES
app.get("/api/previsoes", async (req, res) => {
  try {
    await garantirTabelas();
    const rows = await sql`SELECT * FROM previsoesChegada ORDER BY id DESC`;
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/previsoes", async (req, res) => {
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


app.post("/api/registrar-chegada", async (req, res) => {
  try {
    await garantirTabelas();

    const norm = (v) => String(v || "").trim().toUpperCase();

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
      SET status = 'CHEGOU', dataChegada = ${hoje}
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

    res.status(201).json({
      ok: true,
      historicoId: historico[0].id,
      previsaoId: previsao[0].id,
      status: "CHEGOU",
      dataChegada: hoje,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// NILS
app.get("/api/nils", async (req, res) => {
  try {
    await garantirTabelas();
    const rows = await sql`SELECT * FROM nilsGerados ORDER BY id DESC`;
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/nils", async (req, res) => {
  try {
    await garantirTabelas();

    const body = req.body ?? {};

    const agora = new Date();
    const numeroNIL =
      body.numeroNIL ||
      `NIL-${(body.sj || "PROC").toString()}-${agora.getTime()}`;
    const data =
      body.data ||
      agora.toISOString().slice(0, 10); // YYYY-MM-DD
    const hora =
      body.hora ||
      agora.toTimeString().slice(0, 5); // HH:MM
    const usuario = body.usuario || "SISTEMA";
    const dados = JSON.stringify(body);

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