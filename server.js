const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname));

// Database setup
const db = new sqlite3.Database('./badgehero.db', (err) => {
    if (err) {
        console.error('Erro ao conectar ao banco de dados:', err.message);
    } else {
        console.log('Conectado ao banco de dados SQLite.');
        initializeDatabase();
    }
});

// Initialize Database Tables
function initializeDatabase() {
    db.serialize(() => {
        // Users table
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            avatar TEXT NOT NULL
        )`);

        // Badges table
        db.run(`CREATE TABLE IF NOT EXISTS badges (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            description TEXT NOT NULL,
            icon TEXT NOT NULL,
            date TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )`);

        // Admin credentials table
        db.run(`CREATE TABLE IF NOT EXISTS admin (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            password TEXT NOT NULL
        )`);

        // Insert default admin password if not exists
        db.get("SELECT * FROM admin WHERE id = 1", (err, row) => {
            if (!row) {
                db.run("INSERT INTO admin (password) VALUES (?)", ['admin123']);
            }
        });

        // Insert sample data if users table is empty
        db.get("SELECT COUNT(*) as count FROM users", (err, row) => {
            if (row.count === 0) {
                insertSampleData();
            }
        });
    });
}

// Insert sample data
function insertSampleData() {
    const sampleUsers = [
        { name: "João Silva", avatar: "https://i.pravatar.cc/150?img=12" },
        { name: "Maria Santos", avatar: "https://i.pravatar.cc/150?img=45" },
        { name: "Pedro Costa", avatar: "https://i.pravatar.cc/150?img=33" },
        { name: "Ana Oliveira", avatar: "https://i.pravatar.cc/150?img=26" }
    ];

    const sampleBadges = [
        { user_id: 1, name: "Primeiro Login", description: "Realizou o primeiro acesso ao sistema", icon: "🎯", date: "2025-01-15" },
        { user_id: 1, name: "Colaborador", description: "Contribuiu com 10 projetos", icon: "🤝", date: "2025-02-20" },
        { user_id: 1, name: "Inovador", description: "Propôs uma ideia inovadora", icon: "💡", date: "2025-03-10" },
        { user_id: 2, name: "Líder de Equipe", description: "Liderou com sucesso 3 projetos", icon: "👑", date: "2025-01-20" },
        { user_id: 2, name: "Mentor", description: "Ajudou 5 novos membros da equipe", icon: "🎓", date: "2025-02-15" },
        { user_id: 3, name: "Campeão de Vendas", description: "Atingiu a meta de vendas do trimestre", icon: "🏆", date: "2025-03-01" },
        { user_id: 3, name: "Cliente Satisfeito", description: "Recebeu 5 avaliações positivas", icon: "⭐", date: "2025-03-15" },
        { user_id: 3, name: "Networking", description: "Conectou-se com 50 profissionais", icon: "🌐", date: "2025-04-01" }
    ];

    sampleUsers.forEach(user => {
        db.run("INSERT INTO users (name, avatar) VALUES (?, ?)", [user.name, user.avatar]);
    });

    sampleBadges.forEach(badge => {
        db.run("INSERT INTO badges (user_id, name, description, icon, date) VALUES (?, ?, ?, ?, ?)",
            [badge.user_id, badge.name, badge.description, badge.icon, badge.date]);
    });

    console.log('Dados de exemplo inseridos no banco de dados.');
}

// API Routes

// Get all users with badge count
app.get('/api/users', (req, res) => {
    const query = `
        SELECT users.id, users.name, users.avatar, COUNT(badges.id) as badge_count
        FROM users
        LEFT JOIN badges ON users.id = badges.user_id
        GROUP BY users.id
        ORDER BY users.id
    `;
    
    db.all(query, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// Get single user with all badges
app.get('/api/users/:id', (req, res) => {
    const userId = req.params.id;
    
    db.get("SELECT * FROM users WHERE id = ?", [userId], (err, user) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (!user) {
            res.status(404).json({ error: "Usuário não encontrado" });
            return;
        }
        
        db.all("SELECT * FROM badges WHERE user_id = ? ORDER BY date DESC", [userId], (err, badges) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            user.badges = badges;
            res.json(user);
        });
    });
});

// Add new user (admin only)
app.post('/api/users', (req, res) => {
    const { name, avatar } = req.body;
    
    if (!name) {
        res.status(400).json({ error: "Nome é obrigatório" });
        return;
    }
    
    const avatarUrl = avatar || `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 70)}`;
    
    db.run("INSERT INTO users (name, avatar) VALUES (?, ?)", [name, avatarUrl], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ id: this.lastID, name, avatar: avatarUrl, message: "Usuário criado com sucesso" });
    });
});

// Add new badge (admin only)
app.post('/api/badges', (req, res) => {
    const { user_id, name, description, icon, date } = req.body;
    
    if (!user_id || !name || !description || !icon || !date) {
        res.status(400).json({ error: "Todos os campos são obrigatórios" });
        return;
    }
    
    db.run("INSERT INTO badges (user_id, name, description, icon, date) VALUES (?, ?, ?, ?, ?)",
        [user_id, name, description, icon, date], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ id: this.lastID, message: "Badge criada com sucesso" });
    });
});

// Verify admin password
app.post('/api/admin/verify', (req, res) => {
    const { password } = req.body;
    
    db.get("SELECT password FROM admin WHERE id = 1", [], (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (row && row.password === password) {
            res.json({ success: true, message: "Autenticação bem-sucedida" });
        } else {
            res.json({ success: false, message: "Senha incorreta" });
        }
    });
});

// Delete user (admin only)
app.delete('/api/users/:id', (req, res) => {
    const userId = req.params.id;
    
    db.run("DELETE FROM users WHERE id = ?", [userId], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (this.changes === 0) {
            res.status(404).json({ error: "Usuário não encontrado" });
            return;
        }
        res.json({ message: "Usuário deletado com sucesso" });
    });
});

// Delete badge (admin only)
app.delete('/api/badges/:id', (req, res) => {
    const badgeId = req.params.id;
    
    db.run("DELETE FROM badges WHERE id = ?", [badgeId], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (this.changes === 0) {
            res.status(404).json({ error: "Badge não encontrada" });
            return;
        }
        res.json({ message: "Badge deletada com sucesso" });
    });
});

// Serve index.html for root path
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    db.close((err) => {
        if (err) {
            console.error(err.message);
        }
        console.log('Conexão com o banco de dados fechada.');
        process.exit(0);
    });
});
