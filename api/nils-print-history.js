const { sql, garantirTabelas } = require("../lib/db");

module.exports = async (req, res) => {
  try {
    await garantirTabelas();
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }

  if (req.method === "GET") {
    try {
      const rows = await sql`
        SELECT id, numero_nil, referencia_sj, referencia_container, usuario, data, hora, created_at
        FROM nil_print_history
        ORDER BY id DESC
      `;
      return res.json(rows);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  if (req.method === "POST") {
    const { numeroNIL, sj, container, usuario, data, hora } = req.body ?? {};

    if (!usuario || !data || !hora) {
      return res.status(400).json({ error: "Campos obrigatórios: usuario, data, hora." });
    }

    try {
      const result = await sql`
        INSERT INTO nil_print_history (numero_nil, referencia_sj, referencia_container, usuario, data, hora)
        VALUES (${numeroNIL || "N/A"}, ${sj || null}, ${container || null}, ${usuario}, ${data}, ${hora})
        RETURNING id
      `;
      return res.status(201).json({ id: result[0].id });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  res.setHeader("Allow", "GET, POST");
  return res.status(405).json({ error: "Method not allowed" });
};
