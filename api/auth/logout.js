module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Como o token é mantido no cliente (localStorage), o logout no backend
  // é basicamente informativo. O frontend deve apenas descartar o token.
  return res.json({ ok: true });
};


