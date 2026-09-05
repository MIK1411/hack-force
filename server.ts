import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_coal_key';

// Mock DB
const db = {
  users: [
    { id: 1, email: 'admin@coal.gov.in', password: bcrypt.hashSync('admin123', 10), role: 'admin', name: 'Ministry Admin', status: 'approved' },
    { id: 2, email: 'manager1@mine.com', password: bcrypt.hashSync('manager123', 10), role: 'manager', name: 'Ramesh Singh', status: 'approved', mineId: 101 },
    { id: 3, email: 'worker1@mine.com', password: bcrypt.hashSync('worker123', 10), role: 'worker', name: 'Suresh Kumar', status: 'approved', mineId: 101, designation: 'Miner' },
    { id: 4, email: 'worker2@mine.com', password: bcrypt.hashSync('worker123', 10), role: 'worker', name: 'Aman Patel', status: 'pending', mineId: 101, designation: 'Helper' }
  ],
  mines: [
    { id: 101, name: 'Korba Coal Mine', location: 'Chhattisgarh', type: 'Open Cast', status: 'Operational', workerCount: 450 }
  ],
  incidents: [
    { id: 1, mineId: 101, title: 'Minor Roof Fall', severity: 'Medium', status: 'Open', date: '2026-09-01T10:00:00Z', reportedBy: 3 }
  ],
  production: [
    { id: 1, mineId: 101, date: '2026-09-04', targetMT: 5000, actualMT: 4800 }
  ]
};

// Middleware
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token == null) return res.sendStatus(401);
  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

const authorizeRole = (roles: string[]) => (req: any, res: any, next: any) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
};

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json());

  // API Routes
  
  // Auth
  app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    const user = db.users.find(u => u.email === email);
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    if (user.status !== 'approved') {
      return res.status(403).json({ error: 'Account pending verification' });
    }
    const token = jwt.sign({ id: user.id, role: user.role, name: user.name, mineId: user.mineId }, JWT_SECRET, { expiresIn: '8h' });
    res.json({ token, user: { id: user.id, role: user.role, name: user.name, status: user.status } });
  });

  app.post('/api/auth/register', (req, res) => {
    const { email, password, role, name, designation, mineId } = req.body;
    if (db.users.find(u => u.email === email)) {
      return res.status(400).json({ error: 'Email already exists' });
    }
    const newUser = {
      id: db.users.length + 1,
      email,
      password: bcrypt.hashSync(password, 10),
      role,
      name,
      status: 'pending',
      mineId: parseInt(mineId) || null,
      designation: designation || null
    };
    db.users.push(newUser);
    res.status(201).json({ message: 'Registration successful. Pending admin approval.' });
  });

  // Admin Routes
  app.get('/api/admin/users', authenticateToken, authorizeRole(['admin']), (req, res) => {
    const users = db.users.filter(u => u.role !== 'admin').map(({ password, ...u }) => u);
    res.json(users);
  });

  app.put('/api/admin/users/:id/status', authenticateToken, authorizeRole(['admin']), (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const user = db.users.find(u => u.id === parseInt(id));
    if (!user) return res.status(404).json({ error: 'User not found' });
    user.status = status;
    res.json({ message: 'User status updated' });
  });

  app.get('/api/admin/dashboard', authenticateToken, authorizeRole(['admin']), (req, res) => {
    res.json({
      totalMines: db.mines.length,
      totalIncidents: db.incidents.length,
      totalWorkers: db.users.filter(u => u.role === 'worker').length,
      totalManagers: db.users.filter(u => u.role === 'manager').length,
      productionTrend: db.production,
      incidents: db.incidents
    });
  });

  // Manager Routes
  app.get('/api/manager/dashboard', authenticateToken, authorizeRole(['manager']), (req: any, res: any) => {
    const mineId = req.user.mineId;
    res.json({
      mineInfo: db.mines.find(m => m.id === mineId),
      workersUnderSupervision: db.users.filter(u => u.role === 'worker' && u.mineId === mineId).length,
      incidents: db.incidents.filter(i => i.mineId === mineId),
      production: db.production.filter(p => p.mineId === mineId)
    });
  });

  // Worker Routes
  app.get('/api/worker/dashboard', authenticateToken, authorizeRole(['worker']), (req: any, res: any) => {
    const mineId = req.user.mineId;
    res.json({
      mineInfo: db.mines.find(m => m.id === mineId),
      attendance: 24, // mock days
      incidentsReportedByMe: db.incidents.filter(i => i.reportedBy === req.user.id)
    });
  });

  app.post('/api/worker/sos', authenticateToken, authorizeRole(['worker']), (req: any, res: any) => {
    const { lat, lng } = req.body;
    // Mock triggering an alert
    db.incidents.push({
      id: db.incidents.length + 1,
      mineId: req.user.mineId,
      title: 'SOS ALERT TRIGGERED',
      severity: 'Critical',
      status: 'Open',
      date: new Date().toISOString(),
      reportedBy: req.user.id
    });
    res.json({ message: 'SOS Alert triggered successfully' });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
