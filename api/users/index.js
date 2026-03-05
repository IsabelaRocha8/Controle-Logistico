const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { sql, garantirTabelas } = require("../../lib/db");

const JWT_SECRET = process.env.AUTH_SECRET || process.env.JWT_SECRET || "dev-secret-change-me";

function getTokenFromReq(req) {
  const auth = req.headers.authorization || "";
  const parts = auth.split(" ");
  if (parts.length === 2 && parts[0] === "Bearer") {
    return parts[1];
  }
  return null;
}

async function getCurrentUser(req) {
  const token = getTokenFromReq(req);
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const rows =
      await sql`SELECT id, username, role, is_active FROM users WHERE id = ${decoded.sub} LIMIT 1`;
    if (!rows.length || rows[0].is_active === false) return null;
    return rows[0];
  } catch {
    return null;
  }
}

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

    const validRoles = ["ADMIN", "OPERADOR", "IMPORTACAO"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: "Role inválida." });
    }

    try {
      const hash = await bcrypt.hash(password, 10);

      const result = await sql`
        INSERT INTO users (username, password_hash, role, is_active)
        VALUES (${username}, ${hash}, ${role}, ${is_active ?? true})
        RETURNING id, username, role, is_active, created_at, updated_at
      `;

      return res.status(201).json(result[0]);
    } catch (err) {
      // Violação de unique, etc.
      return res.status(500).json({ error: err.message });
    }
  }

  res.setHeader("Allow", "GET, POST");
  return res.status(405).json({ error: "Method not allowed" });
};


