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

module.exports = async (req, res) => {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    await garantirTabelas();
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }

  const token = getTokenFromReq(req);

  if (!token) {
    return res.status(401).json({ error: "Token não informado." });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    const rows =
      await sql`SELECT id, username, role, is_active FROM users WHERE id = ${decoded.sub} LIMIT 1`;

    if (!rows.length) {
      return res.status(404).json({ error: "Usuário não encontrado." });
    }

    const user = rows[0];

    if (user.is_active === false) {
      return res.status(403).json({ error: "Usuário inativo." });
    }

    return res.json({
      id: user.id,
      username: user.username,
      role: user.role,
    });
  } catch (err) {
    return res.status(401).json({ error: "Token inválido ou expirado." });
  }
};


