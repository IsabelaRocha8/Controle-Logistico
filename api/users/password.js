const bcrypt = require("bcryptjs");
const { sql, garantirTabelas } = require("../../lib/db");
const { getCurrentUser } = require("../../lib/auth");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    await garantirTabelas();
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }

  const me = await getCurrentUser(req);
  if (!me) {
    return res.status(401).json({ error: "Usuário não autenticado." });
  }

  const { targetUserId, currentPassword, newPassword } = req.body ?? {};
  const alvoId = targetUserId ? Number(targetUserId) : me.id;

  if (!newPassword || String(newPassword).length < 6) {
    return res.status(400).json({ error: "A nova senha deve conter ao menos 6 caracteres." });
  }

  if (me.role !== "ADMIN" && alvoId !== me.id) {
    return res.status(403).json({ error: "Sem permissão para alterar senha de outro usuário." });
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
};
