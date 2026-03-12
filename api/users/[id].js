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

  const routeId = String(req.query.id || "").trim();

  if (routeId === "password") {
    if (req.method !== "POST") {
      res.setHeader("Allow", "POST");
      return res.status(405).json({ error: "Method not allowed" });
    }

    const { targetUserId, currentPassword, newPassword } = req.body ?? {};
    const alvoId = targetUserId ? Number(targetUserId) : me.id;

    if (!newPassword || String(newPassword).length < 6) {
      return res
        .status(400)
        .json({ error: "A nova senha deve conter ao menos 6 caracteres." });
    }

    if (me.role !== "ADMIN" && alvoId !== me.id) {
      return res
        .status(403)
        .json({ error: "Sem permissão para alterar senha de outro usuário." });
    }

    try {
      const rows = await sql`SELECT id, password_hash FROM users WHERE id = ${alvoId} LIMIT 1`;
      if (!rows.length) {
        return res.status(404).json({ error: "Usuário não encontrado." });
      }

      if (me.role !== "ADMIN" || alvoId === me.id) {
        if (!currentPassword) {
          return res.status(400).json({ error: "Informe sua senha atual." });
        }
        const ok = await bcrypt.compare(currentPassword, rows[0].password_hash);
        if (!ok) {
          return res.status(401).json({ error: "Senha atual inválida." });
        }
      }

      const hash = await bcrypt.hash(newPassword, 10);
      await sql`UPDATE users SET password_hash = ${hash}, updated_at = NOW() WHERE id = ${alvoId}`;

      return res.json({ ok: true });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  const id = Number(routeId);
  if (!id || Number.isNaN(id)) {
    return res.status(400).json({ error: "Parâmetro id inválido." });
  }

  if (req.method === "PUT") {
    const { username, password, role, is_active } = req.body ?? {};

    if (!username && !password && !role && typeof is_active === "undefined") {
      return res.status(400).json({ error: "Nenhum campo para atualizar." });
    }

    const updates = [];

    if (username) updates.push(sql`username = ${String(username).trim()}`);
    if (typeof is_active !== "undefined") updates.push(sql`is_active = ${is_active}`);

    if (role) {
      const validRoles = ["ADMIN", "OPERADOR", "IMPORTACAO", "VISUALIZADOR"];
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
