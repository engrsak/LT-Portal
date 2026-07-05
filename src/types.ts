export interface Subject {
  id: number;
  subject_code: string;
  description: string;
}

export interface User {
  id: number;
  username: string;
  password?: string;
  subject_id: number;
  subject_code?: string;
  subject_description?: string;
}

export interface LetterAction {
  id: number;
  letter_id: number;
  action_text: string;
  added_at: string;
}

export interface Letter {
  id: number;
  title: string;
  letter_date: string; // YYYY-MM-DD
  reference_no: string;
  subject_id: number;
  subject_code?: string;
  subject_description?: string;
  letter_type: 'Common' | 'Subject';
  priority: 'සාමාන්ය' | 'හදිසි' | 'රැස්වීම්';
  file_no: string;
  created_at: string;
  last_updated_at: string | null;
  actions?: LetterAction[];
}

export interface Session {
  id: number;
  username: string;
  subject_id: number;
  subject_code: string;
  subject_description: string;
  isAdmin: boolean;
}

export interface DashboardStats {
  totalLetters: number;
  commonLetters: number;
  subjectLetters: number;
  subjects: number;
  users: number;
}
