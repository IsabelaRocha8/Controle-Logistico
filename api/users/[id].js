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

  const id = Number(req.query.id);
  if (!id || Number.isNaN(id)) {
    return res.status(400).json({ error: "Parâmetro id inválido." });
  }

  if (req.method === "PUT") {
    const { username, password, role, is_active } = req.body ?? {};

    if (!username && !password && !role && typeof is_active === "undefined") {
      return res.status(400).json({ error: "Nenhum campo para atualizar." });
    }

    const updates = [];
    const values = [];

    if (username) {
      updates.push(sql`username = ${username}`);
    }

    if (typeof is_active !== "undefined") {
      updates.push(sql`is_active = ${is_active}`);
    }

    if (role) {
      const validRoles = ["ADMIN", "OPERADOR", "IMPORTACAO"];
      if (!validRoles.includes(role)) {
        return res.status(400).json({ error: "Role inválida." });
      }
      updates.push(sql`role = ${role}`);
    }

    if (password) {
      const hash = await bcrypt.hash(password, 10);
      updates.push(sql`password_hash = ${hash}`);
    }

    try {
      const setClause = updates.reduce(
        (acc, part, idx) => (idx === 0 ? part : sql`${acc}, ${part}`),
        null
      );

      const result = await sql`
        UPDATE users
        SET ${setClause}, updated_at = NOW()
        WHERE id = ${id}
        RETURNING id, username, role, is_active, created_at, updated_at
      `;

      if (!result.length) {
        return res.status(404).json({ error: "Usuário não encontrado." });
      }

      return res.json(result[0]);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  if (req.method === "DELETE") {
    try {
      await sql`DELETE FROM users WHERE id = ${id}`;
      return res.json({ ok: true });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  res.setHeader("Allow", "PUT, DELETE");
  return res.status(405).json({ error: "Method not allowed" });
};


