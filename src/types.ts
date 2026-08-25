import { UserRole } from './types';

export interface User {
  uid: string;
  email: string | null;
  role: UserRole;
}
