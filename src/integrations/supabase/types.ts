import { AdminNote } from './admin'
import { Collector } from './collector'
import { Member, FamilyMember } from './member'
import { Payment } from './payment'
import { Profile } from './profile'
import { Registration } from './registration'
import { SupportTicket, TicketResponse } from './support'

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      admin_notes: AdminNote
      collectors: Collector
      family_members: FamilyMember
      members: Member
      payments: Payment
      profiles: Profile
      registrations: Registration
      support_tickets: SupportTicket
      ticket_responses: TicketResponse
    }
    Views: Record<string, never>
    Functions: {
      authenticate_member: {
        Args: {
          p_member_number: string
        }
        Returns: {
          id: string
          member_number: string
          auth_user_id: string
          full_name: string
          email: string
        }[]
      }
      delete_collector: {
        Args: {
          collector_id: string
        }
        Returns: undefined
      }
      merge_duplicate_collectors: {
        Args: Record<PropertyKey, never>
        Returns: {
          merged_count: number
          details: string
        }[]
      }
      normalize_collector_name: {
        Args: {
          name: string
        }
        Returns: string
      }
      reset_member_passwords: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      sync_collector_ids: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T]
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']
