const { sql, garantirTabelas } = require("../lib/db");

module.exports = async (req, res) => {
  try {
    // Garante que as tabelas necessárias existem no banco de dados antes de processar
    await garantirTabelas();
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }

  // Verifica se a conexão com o banco de dados (Postgres) foi estabelecida corretamente
  if (!sql) {
    return res
      .status(500)
      .json({ error: "Conexão com o banco não configurada (sql indefinido)." });
  }

  // ROTA GET: Recupera todas as previsões cadastradas ordenadas pelas mais recentes
  if (req.method === "GET") {
    try {
      const rows = await sql`SELECT * FROM previsoesChegada ORDER BY id DESC`;
      return res.json(rows);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  // ROTA POST: Cria novos registos de previsão de chegada
  if (req.method === "POST") {
    const {
      status,
      sj,
      conteudo,
      container,
      dataPrevisao,
      transportadora,
      usuario,
      modalImportacao,
      dataChegada,
      dataRegistro // Campo obrigatório no seu banco de dados
    } = req.body ?? {};

    // Validação de campos fundamentais para o registo
    if (!status || !sj || !container) {
      return res.status(400).json({
        error: "Campos obrigatórios ausentes: status, sj e container são necessários.",
      });
    }

    try {
      // Inserção no banco de dados utilizando tagged templates para evitar SQL Injection
      // Os campos opcionais utilizam "|| null" para garantir que valores vazios não quebrem a query
      const result = await sql`
        INSERT INTO previsoesChegada (
          status, 
          sj, 
          conteudo, 
          container,
          dataPrevisao, 
          transportadora, 
          usuario,
          modalImportacao, 
          dataChegada,
          dataRegistro
        )
        VALUES (
          ${status}, 
          ${sj}, 
          ${conteudo || null}, 
          ${container},
          ${dataPrevisao || null}, 
          ${transportadora || null}, 
          ${usuario || null},
          ${modalImportacao || null}, 
          ${dataChegada || null},
          ${dataRegistro || new Date().toISOString().split('T')[0]}
        )
        RETURNING id
      `;

      // Retorna o ID do novo registo criado com sucesso
      return res.json({ id: result[0].id });
    } catch (err) {
      // Log do erro no servidor para facilitar a depuração (visível nos logs da Vercel)
      console.error("Erro ao inserir previsão:", err);
      return res.status(500).json({ error: "Erro no banco de dados: " + err.message });
    }
  }

  // Define os métodos permitidos para este endpoint
  res.setHeader("Allow", "GET, POST");
  return res.status(405).json({ error: "Método não permitido" });
};