import fs from 'fs';
import path from 'path';

// Database store path
const DB_FILE = path.join(process.cwd(), 'db_store.json');

// Interface structures matching the SQL tables
export interface Subject {
  id: number;
  subject_code: string;
  description: string;
}

export interface User {
  id: number;
  username: string;
  password: string; // Stored as plain text or simple hash as requested for a simple system
  subject_id: number;
}

export interface Letter {
  id: number;
  title: string;
  letter_date: string; // YYYY-MM-DD
  reference_no: string;
  subject_id: number;
  letter_type: 'Common' | 'Subject';
  priority: 'සාමාන්ය' | 'හදිසි' | 'රැස්වීම්';
  file_no: string;
  created_at: string; // Asia/Colombo time
  last_updated_at: string | null; // Asia/Colombo time
}

export interface LetterAction {
  id: number;
  letter_id: number;
  action_text: string;
  added_at: string; // Asia/Colombo time
}

interface DatabaseSchema {
  subjects: Subject[];
  users: User[];
  letters: Letter[];
  letter_actions: LetterAction[];
}

// Time helper for Asia/Colombo timezone
export function getColomboDateTime(): string {
  const options: Intl.DateTimeFormatOptions = {
    timeZone: 'Asia/Colombo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  };
  
  const formatter = new Intl.DateTimeFormat('en-US', options);
  const parts = formatter.formatToParts(new Date());
  
  const getValue = (type: string) => parts.find(p => p.type === type)?.value || '';
  
  // Format: YYYY-MM-DD HH:mm:ss
  return `${getValue('year')}-${getValue('month')}-${getValue('day')} ${getValue('hour')}:${getValue('minute')}:${getValue('second')}`;
}

// Read database
export function readDb(): DatabaseSchema {
  try {
    if (!fs.existsSync(DB_FILE)) {
      const initialDb: DatabaseSchema = {
        subjects: [],
        users: [],
        letters: [],
        letter_actions: []
      };
      
      // Seed initial 'CC' subject
      const ccSubject: Subject = {
        id: 1,
        subject_code: 'CC',
        description: 'Chief Administrator'
      };
      initialDb.subjects.push(ccSubject);
      
      // Seed initial admin user
      const adminUser: User = {
        id: 1,
        username: 'admin',
        password: 'admin', // default credentials
        subject_id: 1
      };
      initialDb.users.push(adminUser);
      
      fs.writeFileSync(DB_FILE, JSON.stringify(initialDb, null, 2), 'utf-8');
      return initialDb;
    }
    
    const data = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading DB file, returning empty schema:', error);
    return { subjects: [], users: [], letters: [], letter_actions: [] };
  }
}

// Write database
export function writeDb(db: DatabaseSchema): void {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error writing DB file:', error);
  }
}

// Subjects operations
export const subjectsDb = {
  getAll: (): Subject[] => {
    return readDb().subjects;
  },
  
  getById: (id: number): Subject | undefined => {
    return readDb().subjects.find(s => s.id === id);
  },
  
  getByCode: (code: string): Subject | undefined => {
    return readDb().subjects.find(s => s.subject_code.toLowerCase() === code.toLowerCase());
  },
  
  create: (subject_code: string, description: string): Subject => {
    const db = readDb();
    const existing = db.subjects.find(s => s.subject_code.toLowerCase() === subject_code.toLowerCase());
    if (existing) {
      throw new Error(`Subject code '${subject_code}' already exists.`);
    }
    
    const maxId = db.subjects.reduce((max, s) => s.id > max ? s.id : max, 0);
    const newSubject: Subject = {
      id: maxId + 1,
      subject_code: subject_code.toUpperCase(),
      description
    };
    
    db.subjects.push(newSubject);
    writeDb(db);
    return newSubject;
  },
  
  update: (id: number, subject_code: string, description: string): Subject => {
    const db = readDb();
    const index = db.subjects.findIndex(s => s.id === id);
    if (index === -1) {
      throw new Error(`Subject with ID ${id} not found.`);
    }
    
    // Check code uniqueness excluding self
    const duplicate = db.subjects.find(s => s.id !== id && s.subject_code.toLowerCase() === subject_code.toLowerCase());
    if (duplicate) {
      throw new Error(`Subject code '${subject_code}' already exists.`);
    }
    
    // Prevent changing Admin's 'CC' code
    if (db.subjects[index].subject_code === 'CC' && subject_code.toUpperCase() !== 'CC') {
      throw new Error(`The subject code 'CC' is reserved for Admin and cannot be modified.`);
    }
    
    db.subjects[index] = {
      id,
      subject_code: subject_code.toUpperCase(),
      description
    };
    
    writeDb(db);
    return db.subjects[index];
  },
  
  delete: (id: number): void => {
    const db = readDb();
    const index = db.subjects.findIndex(s => s.id === id);
    if (index === -1) {
      throw new Error(`Subject with ID ${id} not found.`);
    }
    
    const subject = db.subjects[index];
    if (subject.subject_code === 'CC') {
      throw new Error(`The subject 'CC' is reserved and cannot be deleted.`);
    }
    
    // Check if letters or users are associated with this subject
    const hasLetters = db.letters.some(l => l.subject_id === id);
    const hasUsers = db.users.some(u => u.subject_id === id);
    
    if (hasLetters || hasUsers) {
      throw new Error(`Cannot delete subject '${subject.subject_code}' because it is linked to active letters or users.`);
    }
    
    db.subjects.splice(index, 1);
    writeDb(db);
  }
};

// Users operations
export const usersDb = {
  getAll: (): (User & { subject_code?: string; subject_description?: string })[] => {
    const db = readDb();
    return db.users.map(u => {
      const sub = db.subjects.find(s => s.id === u.subject_id);
      return {
        ...u,
        subject_code: sub?.subject_code,
        subject_description: sub?.description
      };
    });
  },
  
  getById: (id: number): User | undefined => {
    return readDb().users.find(u => u.id === id);
  },
  
  getByUsername: (username: string): User | undefined => {
    return readDb().users.find(u => u.username.toLowerCase() === username.toLowerCase());
  },
  
  create: (username: string, password: string, subject_id: number): User => {
    const db = readDb();
    const existing = db.users.find(u => u.username.toLowerCase() === username.toLowerCase());
    if (existing) {
      throw new Error(`Username '${username}' already exists.`);
    }
    
    const subject = db.subjects.find(s => s.id === subject_id);
    if (!subject) {
      throw new Error(`Selected subject with ID ${subject_id} does not exist.`);
    }
    
    const maxId = db.users.reduce((max, u) => u.id > max ? u.id : max, 0);
    const newUser: User = {
      id: maxId + 1,
      username,
      password,
      subject_id
    };
    
    db.users.push(newUser);
    writeDb(db);
    return newUser;
  },
  
  update: (id: number, username: string, password: string | undefined | null, subject_id: number): User => {
    const db = readDb();
    const index = db.users.findIndex(u => u.id === id);
    if (index === -1) {
      throw new Error(`User with ID ${id} not found.`);
    }
    
    const user = db.users[index];
    const finalPassword = password && password.trim() !== '' ? password.trim() : user.password;
    
    // Check uniqueness excluding self
    const duplicate = db.users.find(u => u.id !== id && u.username.toLowerCase() === username.toLowerCase());
    if (duplicate) {
      throw new Error(`Username '${username}' already exists.`);
    }
    
    const subject = db.subjects.find(s => s.id === subject_id);
    if (!subject) {
      throw new Error(`Selected subject with ID ${subject_id} does not exist.`);
    }
    
    // Admin checks: if user was the seeded admin, preserve 'CC' subject
    if (user.username === 'admin' && subject.subject_code !== 'CC') {
      throw new Error(`Admin user must retain the 'CC' subject.`);
    }
    
    db.users[index] = {
      id,
      username,
      password: finalPassword,
      subject_id
    };
    
    writeDb(db);
    return db.users[index];
  },
  
  delete: (id: number): void => {
    const db = readDb();
    const index = db.users.findIndex(u => u.id === id);
    if (index === -1) {
      throw new Error(`User with ID ${id} not found.`);
    }
    
    const user = db.users[index];
    if (user.username === 'admin') {
      throw new Error(`Admin user 'admin' is system-critical and cannot be deleted.`);
    }
    
    db.users.splice(index, 1);
    writeDb(db);
  }
};

// Letters operations
export const lettersDb = {
  getAll: (): (Letter & { subject_code?: string; subject_description?: string; actions?: LetterAction[] })[] => {
    const db = readDb();
    return db.letters.map(l => {
      const sub = db.subjects.find(s => s.id === l.subject_id);
      const actions = db.letter_actions.filter(a => a.letter_id === l.id);
      return {
        ...l,
        subject_code: sub?.subject_code,
        subject_description: sub?.description,
        actions: actions.sort((a, b) => new Date(a.added_at).getTime() - new Date(b.added_at).getTime())
      };
    });
  },
  
  getById: (id: number) => {
    const db = readDb();
    const l = db.letters.find(l => l.id === id);
    if (!l) return undefined;
    const sub = db.subjects.find(s => s.id === l.subject_id);
    const actions = db.letter_actions.filter(a => a.letter_id === l.id);
    return {
      ...l,
      subject_code: sub?.subject_code,
      subject_description: sub?.description,
      actions: actions.sort((a, b) => new Date(a.added_at).getTime() - new Date(b.added_at).getTime())
    };
  },
  
  create: (
    title: string,
    letter_date: string,
    reference_no: string,
    subject_id: number,
    letter_type: 'Common' | 'Subject',
    priority: 'සාමාන්ය' | 'හදිසි' | 'රැස්වීම්',
    file_no: string = ''
  ): Letter => {
    const db = readDb();
    const subject = db.subjects.find(s => s.id === subject_id);
    if (!subject) {
      throw new Error(`Selected subject with ID ${subject_id} does not exist.`);
    }
    
    const maxId = db.letters.reduce((max, l) => l.id > max ? l.id : max, 0);
    const colomboNow = getColomboDateTime();
    
    const newLetter: Letter = {
      id: maxId + 1,
      title,
      letter_date,
      reference_no,
      subject_id,
      letter_type,
      priority,
      file_no,
      created_at: colomboNow,
      last_updated_at: null
    };
    
    db.letters.push(newLetter);
    writeDb(db);
    return newLetter;
  },
  
  update: (
    id: number,
    title: string,
    letter_date: string,
    reference_no: string,
    subject_id: number,
    letter_type: 'Common' | 'Subject',
    priority: 'සාමාන්ය' | 'හදිසි' | 'රැස්වීම්',
    file_no?: string
  ): Letter => {
    const db = readDb();
    const index = db.letters.findIndex(l => l.id === id);
    if (index === -1) {
      throw new Error(`Letter with ID ${id} not found.`);
    }
    
    const subject = db.subjects.find(s => s.id === subject_id);
    if (!subject) {
      throw new Error(`Selected subject with ID ${subject_id} does not exist.`);
    }
    
    const existing = db.letters[index];
    const colomboNow = getColomboDateTime();
    
    db.letters[index] = {
      ...existing,
      title,
      letter_date,
      reference_no,
      subject_id,
      letter_type,
      priority,
      file_no: file_no !== undefined ? file_no : existing.file_no,
      last_updated_at: colomboNow
    };
    
    writeDb(db);
    return db.letters[index];
  },
  
  updateFileAndActions: (
    id: number,
    file_no: string,
    newActionText?: string
  ): Letter => {
    const db = readDb();
    const index = db.letters.findIndex(l => l.id === id);
    if (index === -1) {
      throw new Error(`Letter with ID ${id} not found.`);
    }
    
    const colomboNow = getColomboDateTime();
    const existing = db.letters[index];
    
    db.letters[index] = {
      ...existing,
      file_no,
      last_updated_at: colomboNow
    };
    
    if (newActionText && newActionText.trim() !== '') {
      const maxActionId = db.letter_actions.reduce((max, a) => a.id > max ? a.id : max, 0);
      const newAction: LetterAction = {
        id: maxActionId + 1,
        letter_id: id,
        action_text: newActionText.trim(),
        added_at: colomboNow
      };
      db.letter_actions.push(newAction);
    }
    
    writeDb(db);
    return db.letters[index];
  },
  
  delete: (id: number): void => {
    const db = readDb();
    const index = db.letters.findIndex(l => l.id === id);
    if (index === -1) {
      throw new Error(`Letter with ID ${id} not found.`);
    }
    
    // Remove linked actions
    db.letter_actions = db.letter_actions.filter(a => a.letter_id !== id);
    
    // Remove letter
    db.letters.splice(index, 1);
    writeDb(db);
  }
};
