const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8080;
const BASE_PATH = __dirname;
const DB_FILE = path.join(BASE_PATH, 'database', 'dados.json');

// Criar pasta database se não existir
if (!fs.existsSync(path.join(BASE_PATH, 'database'))) {
    fs.mkdirSync(path.join(BASE_PATH, 'database'));
}

// Criar arquivo dados.json se não existir
if (!fs.existsSync(DB_FILE)) {
    const estruturaPadrao = {
        historico: [],
        previsoesChegada: [],
        etiquetasImpressas: [],
        nilsGerados: [],
        historicoImpressaoNIL: [],
        ultimaAtualizacao: new Date().toISOString()
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(estruturaPadrao, null, 2));
}

const server = http.createServer((req, res) => {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }
    
    // Servir arquivo dados.json
    if (req.url.startsWith('/database/dados.json')) {
        if (req.method === 'GET') {
            fs.readFile(DB_FILE, 'utf8', (err, data) => {
                if (err) {
                    res.writeHead(500);
                    res.end('Erro ao ler arquivo');
                    return;
                }
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(data);
            });
        } else if (req.method === 'PUT') {
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', () => {
                fs.writeFile(DB_FILE, body, err => {
                    if (err) {
                        res.writeHead(500);
                        res.end('Erro ao salvar arquivo');
                        return;
                    }
                    res.writeHead(200);
                    res.end('OK');
                });
            });
        }
        return;
    }
    
    // Servir arquivos estáticos
    let filePath = path.join(BASE_PATH, req.url === '/' ? 'login.html' : req.url);
    
    const extname = path.extname(filePath);
    const contentTypes = {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
        '.ico': 'image/x-icon'
    };
    
    const contentType = contentTypes[extname] || 'text/plain';
    
    fs.readFile(filePath, (err, content) => {
        if (err) {
            if (err.code === 'ENOENT') {
                res.writeHead(404);
                res.end('Arquivo não encontrado');
            } else {
                res.writeHead(500);
                res.end('Erro no servidor');
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
    console.log(`Banco de dados: ${DB_FILE}`);
    console.log('\nPara acessar de outros computadores:');
    console.log('1. Descubra o IP deste computador (ipconfig)');
    console.log('2. Acesse http://IP_DO_SERVIDOR:8080');
});
