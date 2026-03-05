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
      const rows = await sql`SELECT * FROM nilsGerados ORDER BY id DESC`;
      return res.json(rows);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  if (req.method === "POST") {
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

    try {
      const result = await sql`
        INSERT INTO nilsGerados (numeroNIL, data, hora, usuario, dados)
        VALUES (${numeroNIL}, ${data}, ${hora}, ${usuario}, ${dados})
        RETURNING id
      `;

      return res.json({ id: result[0].id, numeroNIL });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  res.setHeader("Allow", "GET, POST");
  return res.status(405).json({ error: "Method not allowed" });
};


