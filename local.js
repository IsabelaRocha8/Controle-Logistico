const app = require("./api/index");

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`API rodando em http://localhost:${port}`);
});