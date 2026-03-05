const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { sql, garantirTabelas } = require("../../lib/db");

const JWT_SECRET = process.env.AUTH_SECRET || process.env.JWT_SECRET || "dev-secret-change-me";
const JWT_EXPIRES_IN = "8h";

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

  const { username, password } = req.body ?? {};

  if (!username || !password) {
    return res
      .status(400)
      .json({ error: "Informe username e password." });
  }

  try {
    const rows =
      await sql`SELECT id, username, password_hash, role, is_active FROM users WHERE username = ${username} LIMIT 1`;

    if (!rows.length) {
      return res.status(401).json({ error: "Credenciais inválidas." });
    }

    const user = rows[0];

    if (user.is_active === false) {
      return res.status(403).json({ error: "Usuário inativo." });
    }

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      return res.status(401).json({ error: "Credenciais inválidas." });
    }

    const payload = {
      sub: user.id,
      username: user.username,
      role: user.role,
    };

    const token = jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });

    return res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};


