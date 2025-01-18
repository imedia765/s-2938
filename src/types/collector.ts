export interface Collector {
  id: string;
  name: string | null;
  prefix: string | null;
  number: string | null;
  email: string | null;
  phone: string | null;
  active: boolean | null;
  created_at: string;
  updated_at: string;
  member_number: string | null;
  auth_user_id?: string | null;
  memberCount?: number;
}