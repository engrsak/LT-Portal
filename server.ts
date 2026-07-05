import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { 
  subjectsDb, 
  usersDb, 
  lettersDb, 
  getColomboDateTime 
} from './src/server/db.ts';

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT || 3000);

  // Body parsers
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // CORS headers for security and standard cross-origin issues
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, X-User-Id');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // Helper middleware to check if user is admin
  const isAdmin = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const userIdHeader = req.headers['x-user-id'];
    if (!userIdHeader) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const userId = parseInt(userIdHeader as string, 10);
    const user = usersDb.getById(userId);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    // Admin is username 'admin' and has subject 'CC'
    const sub = subjectsDb.getById(user.subject_id);
    if (user.username === 'admin' || (sub && sub.subject_code === 'CC')) {
      next();
    } else {
      res.status(403).json({ error: 'Unauthorized. Admin access required.' });
    }
  };

  // Helper middleware to check if user is authenticated
  const isAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const userIdHeader = req.headers['x-user-id'];
    if (!userIdHeader) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const userId = parseInt(userIdHeader as string, 10);
    const user = usersDb.getById(userId);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    (req as any).user = user;
    next();
  };

  // ==================== AUTH API ====================
  app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const user = usersDb.getByUsername(username);
    if (!user || user.password !== password) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const sub = subjectsDb.getById(user.subject_id);
    const isAdminUser = user.username === 'admin' || (sub && sub.subject_code === 'CC');

    res.json({
      id: user.id,
      username: user.username,
      subject_id: user.subject_id,
      subject_code: sub?.subject_code || '',
      subject_description: sub?.description || '',
      isAdmin: !!isAdminUser
    });
  });

  // ==================== STATS API ====================
  app.get('/api/stats', isAuth, (req, res) => {
    const user = (req as any).user;
    const sub = subjectsDb.getById(user.subject_id);
    const isAdminUser = user.username === 'admin' || (sub && sub.subject_code === 'CC');

    const allLetters = lettersDb.getAll();
    const allSubjects = subjectsDb.getAll();
    const allUsers = usersDb.getAll();

    if (isAdminUser) {
      const commonCount = allLetters.filter(l => l.letter_type === 'Common').length;
      const subjectCount = allLetters.filter(l => l.letter_type === 'Subject').length;
      res.json({
        totalLetters: allLetters.length,
        commonLetters: commonCount,
        subjectLetters: subjectCount,
        subjects: allSubjects.length,
        users: allUsers.length
      });
    } else {
      // Regular user sees only their subject letters
      const userLetters = allLetters.filter(l => l.subject_id === user.subject_id);
      res.json({
        totalLetters: userLetters.length,
        commonLetters: 0,
        subjectLetters: userLetters.length,
        subjects: 1, // Only their subject
        users: 1 // Only themselves
      });
    }
  });

  // ==================== SUBJECTS API ====================
  app.get('/api/subjects', isAuth, (req, res) => {
    res.json(subjectsDb.getAll());
  });

  app.post('/api/subjects', isAdmin, (req, res) => {
    const { subject_code, description } = req.body;
    if (!subject_code || !description) {
      return res.status(400).json({ error: 'Subject code and description are required' });
    }
    try {
      const newSub = subjectsDb.create(subject_code, description);
      res.status(201).json(newSub);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.put('/api/subjects/:id', isAdmin, (req, res) => {
    const id = parseInt(req.params.id, 10);
    const { subject_code, description } = req.body;
    if (!subject_code || !description) {
      return res.status(400).json({ error: 'Subject code and description are required' });
    }
    try {
      const updated = subjectsDb.update(id, subject_code, description);
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.delete('/api/subjects/:id', isAdmin, (req, res) => {
    const id = parseInt(req.params.id, 10);
    try {
      subjectsDb.delete(id);
      res.json({ success: true, message: 'Subject deleted successfully' });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // ==================== USERS API ====================
  app.get('/api/users', isAdmin, (req, res) => {
    res.json(usersDb.getAll());
  });

  app.post('/api/users', isAdmin, (req, res) => {
    const { username, password, subject_id } = req.body;
    if (!username || !password || subject_id === undefined) {
      return res.status(400).json({ error: 'Username, password, and subject are required' });
    }
    try {
      const newUser = usersDb.create(username, password, parseInt(subject_id, 10));
      res.status(201).json(newUser);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.put('/api/users/:id', isAdmin, (req, res) => {
    const id = parseInt(req.params.id, 10);
    const { username, password, subject_id } = req.body;
    if (!username || subject_id === undefined) {
      return res.status(400).json({ error: 'Username and subject are required' });
    }
    try {
      const updated = usersDb.update(id, username, password, parseInt(subject_id, 10));
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.delete('/api/users/:id', isAdmin, (req, res) => {
    const id = parseInt(req.params.id, 10);
    try {
      usersDb.delete(id);
      res.json({ success: true, message: 'User deleted successfully' });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // ==================== LETTERS API ====================
  app.get('/api/letters', isAuth, (req, res) => {
    const user = (req as any).user;
    const sub = subjectsDb.getById(user.subject_id);
    const isAdminUser = user.username === 'admin' || (sub && sub.subject_code === 'CC');

    const allLetters = lettersDb.getAll();

    if (isAdminUser) {
      res.json(allLetters);
    } else {
      // Regular user sees only letters belonging to their assigned subject
      const userLetters = allLetters.filter(l => l.subject_id === user.subject_id);
      res.json(userLetters);
    }
  });

  app.post('/api/letters', isAdmin, (req, res) => {
    const { title, letter_date, reference_no, subject_id, letter_type, priority, file_no } = req.body;
    if (!title || !letter_date || !reference_no || subject_id === undefined) {
      return res.status(400).json({ error: 'Title, date, reference, and subject are required' });
    }
    try {
      const newLetter = lettersDb.create(
        title,
        letter_date,
        reference_no,
        parseInt(subject_id, 10),
        letter_type || 'Common',
        priority || 'සාමාන්ය',
        file_no || ''
      );
      res.status(201).json(newLetter);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.put('/api/letters/:id', isAdmin, (req, res) => {
    const id = parseInt(req.params.id, 10);
    const { title, letter_date, reference_no, subject_id, letter_type, priority, file_no } = req.body;
    if (!title || !letter_date || !reference_no || subject_id === undefined) {
      return res.status(400).json({ error: 'Title, date, reference, and subject are required' });
    }
    try {
      const updated = lettersDb.update(
        id,
        title,
        letter_date,
        reference_no,
        parseInt(subject_id, 10),
        letter_type || 'Common',
        priority || 'සාමාන්ය',
        file_no
      );
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Action update for a letter (accessible to both Admin & Authorized User)
  app.put('/api/letters/:id/actions', isAuth, (req, res) => {
    const id = parseInt(req.params.id, 10);
    const { file_no, action_text } = req.body;
    
    const user = (req as any).user;
    const sub = subjectsDb.getById(user.subject_id);
    const isAdminUser = user.username === 'admin' || (sub && sub.subject_code === 'CC');

    try {
      const letter = lettersDb.getById(id);
      if (!letter) {
        return res.status(404).json({ error: 'Letter not found' });
      }

      // Check if user has permission (is admin OR the letter's subject matches user's subject)
      if (!isAdminUser && letter.subject_id !== user.subject_id) {
        return res.status(403).json({ error: 'Unauthorized. This letter does not belong to your allocated subject.' });
      }

      const updated = lettersDb.updateFileAndActions(id, file_no || '', action_text);
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.delete('/api/letters/:id', isAdmin, (req, res) => {
    const id = parseInt(req.params.id, 10);
    try {
      lettersDb.delete(id);
      res.json({ success: true, message: 'Letter deleted successfully' });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // ==================== BACKUP DATA API ====================
  app.get('/api/backup/csv', isAuth, (req, res) => {
    const user = (req as any).user;
    const sub = subjectsDb.getById(user.subject_id);
    const isAdminUser = user.username === 'admin' || (sub && sub.subject_code === 'CC');

    if (!isAdminUser) {
      return res.status(403).json({ error: 'Unauthorized. Admin access required for backups.' });
    }

    try {
      const allLetters = lettersDb.getAll();
      
      const headers = [
        'Letter ID',
        'Title',
        'Letter Date',
        'Reference No',
        'Subject Code',
        'Subject Description',
        'Letter Type',
        'Priority',
        'File No',
        'Created At',
        'Last Updated At',
        'Action History'
      ];

      const escapeCSV = (val: any): string => {
        if (val === null || val === undefined) return '';
        let str = String(val);
        str = str.replace(/"/g, '""');
        if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
          return `"${str}"`;
        }
        return str;
      };

      const rows = allLetters.map(l => {
        const actionHistoryStr = l.actions && l.actions.length > 0
          ? l.actions.map(a => `[${a.added_at}] ${a.action_text}`).join(' | ')
          : 'No actions recorded';

        return [
          l.id,
          l.title,
          l.letter_date,
          l.reference_no,
          l.subject_code || '',
          l.subject_description || '',
          l.letter_type,
          l.priority,
          l.file_no || '',
          l.created_at,
          l.last_updated_at || '',
          actionHistoryStr
        ].map(escapeCSV).join(',');
      });

      const csvContent = [headers.join(','), ...rows].join('\n');
      
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename=lt_portal_backup_${new Date().toISOString().split('T')[0]}.csv`);
      return res.status(200).send(csvContent);
    } catch (err: any) {
      return res.status(500).json({ error: `Failed to generate backup: ${err.message}` });
    }
  });

  // ==================== VITE DEVELOPMENT MIDDLEWARE ====================
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production asset serving
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[LT Portal Server] Running on http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('[LT Portal Server] Failed to start:', err);
});
