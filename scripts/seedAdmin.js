const bcrypt = require("bcryptjs");
require("dotenv").config({ path: "../.env" });

const { sql, garantirTabelas } = require("../lib/db");

async function seedAdmin() {
  try {
    console.log("Inicializando banco de dados...");
    await garantirTabelas();

    // Usuário admin padrão
    const username = "admin";
    const password = "admin123";
    const role = "ADMIN";

    console.log(`Verificando se usuário '${username}' já existe...`);
    const existing = await sql`SELECT id FROM users WHERE username = ${username} LIMIT 1`;

    if (existing.length > 0) {
      console.log(`✓ Usuário '${username}' já existe.`);
      return;
    }

    const hash = await bcrypt.hash(password, 10);
    const result = await sql`
      INSERT INTO users (username, password_hash, role, is_active)
      VALUES (${username}, ${hash}, ${role}, true)
      RETURNING id, username, role
    `;

    console.log(`✓ Usuário admin criado com sucesso!`);
    console.log(`  ID: ${result[0].id}`);
    console.log(`  Username: ${result[0].username}`);
    console.log(`  Role: ${result[0].role}`);
    console.log(`\n  Credenciais:`);
    console.log(`  Usuário: ${username}`);
    console.log(`  Senha: ${password}`);
  } catch (err) {
    console.error("Erro ao criar usuário admin:", err.message);
    process.exit(1);
  }
}

seedAdmin();
