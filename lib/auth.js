const jwt = require("jsonwebtoken");
const { sql } = require("./db");

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
    const rows = await sql`
      SELECT id, username, role, is_active
      FROM users
      WHERE id = ${decoded.sub}
      LIMIT 1
    `;

    if (!rows.length || rows[0].is_active === false) return null;
    return rows[0];
  } catch {
    return null;
  }
}

module.exports = {
  JWT_SECRET,
  getTokenFromReq,
  getCurrentUser,
};
