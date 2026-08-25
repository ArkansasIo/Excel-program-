import { User } from '../context/AuthContext';

const ADMIN_EMAILS = ['s.sstargate@gmail.com'];

export const isAdmin = (user: User | null): boolean => {
  if (!user || !user.email) return false;
  return ADMIN_EMAILS.includes(user.email);
};
