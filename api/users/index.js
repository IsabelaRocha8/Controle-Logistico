const bcrypt = require("bcryptjs");
const { sql, garantirTabelas } = require("../../lib/db");
const { getCurrentUser } = require("../../lib/auth");

module.exports = async (req, res) => {
  try {
    await garantirTabelas();
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }

  const me = await getCurrentUser(req);
  if (!me || me.role !== "ADMIN") {
    return res.status(403).json({ error: "Acesso restrito a administradores." });
  }

  if (req.method === "GET") {
    try {
      const rows =
        await sql`SELECT id, username, role, is_active, created_at, updated_at FROM users ORDER BY id ASC`;
      return res.json(rows);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  if (req.method === "POST") {
    const { username, password, role, is_active } = req.body ?? {};

    if (!username || !password || !role) {
      return res
        .status(400)
        .json({ error: "Campos obrigatórios: username, password, role." });
    }

    const validRoles = ["ADMIN", "OPERADOR", "IMPORTACAO", "VISUALIZADOR"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: "Role inválida." });
    }

    try {
      const hash = await bcrypt.hash(password, 10);

      const result = await sql`
        INSERT INTO users (username, password_hash, role, is_active)
        VALUES (${String(username).trim()}, ${hash}, ${role}, ${is_active ?? true})
        RETURNING id, username, role, is_active, created_at, updated_at
      `;

      return res.status(201).json(result[0]);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  res.setHeader("Allow", "GET, POST");
  return res.status(405).json({ error: "Method not allowed" });
};
