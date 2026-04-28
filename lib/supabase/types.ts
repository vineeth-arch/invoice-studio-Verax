export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          company_name: string | null;
          legal_name: string | null;
          gstin: string | null;
          pan: string | null;
          email: string | null;
          phone: string | null;
          website: string | null;
          address: Json | null;
          bank_details: Json | null;
          logo_url: string | null;
          signature_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          company_name?: string | null;
          legal_name?: string | null;
          gstin?: string | null;
          pan?: string | null;
          email?: string | null;
          phone?: string | null;
          website?: string | null;
          address?: Json | null;
          bank_details?: Json | null;
          logo_url?: string | null;
          signature_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company_name?: string | null;
          legal_name?: string | null;
          gstin?: string | null;
          pan?: string | null;
          email?: string | null;
          phone?: string | null;
          website?: string | null;
          address?: Json | null;
          bank_details?: Json | null;
          logo_url?: string | null;
          signature_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      clients: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          gstin: string | null;
          email: string | null;
          phone: string | null;
          address: Json | null;
          place_of_supply: string | null;
          state_code: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          gstin?: string | null;
          email?: string | null;
          phone?: string | null;
          address?: Json | null;
          place_of_supply?: string | null;
          state_code?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          gstin?: string | null;
          email?: string | null;
          phone?: string | null;
          address?: Json | null;
          place_of_supply?: string | null;
          state_code?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      invoices: {
        Row: {
          id: string;
          user_id: string;
          invoice_number: string;
          status: string;
          issue_date: string | null;
          due_date: string | null;
          buyer: Json | null;
          seller: Json | null;
          line_items: Json;
          totals: Json | null;
          notes: string | null;
          terms: string | null;
          full_data: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          invoice_number: string;
          status: string;
          issue_date?: string | null;
          due_date?: string | null;
          buyer?: Json | null;
          seller?: Json | null;
          line_items?: Json;
          totals?: Json | null;
          notes?: string | null;
          terms?: string | null;
          full_data: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          invoice_number?: string;
          status?: string;
          issue_date?: string | null;
          due_date?: string | null;
          buyer?: Json | null;
          seller?: Json | null;
          line_items?: Json;
          totals?: Json | null;
          notes?: string | null;
          terms?: string | null;
          full_data?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      purchase_orders: {
        Row: {
          id: string;
          user_id: string;
          po_number: string;
          status: string;
          issue_date: string | null;
          vendor: Json | null;
          buyer: Json | null;
          line_items: Json;
          totals: Json | null;
          notes: string | null;
          terms: string | null;
          full_data: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          po_number: string;
          status: string;
          issue_date?: string | null;
          vendor?: Json | null;
          buyer?: Json | null;
          line_items?: Json;
          totals?: Json | null;
          notes?: string | null;
          terms?: string | null;
          full_data: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          po_number?: string;
          status?: string;
          issue_date?: string | null;
          vendor?: Json | null;
          buyer?: Json | null;
          line_items?: Json;
          totals?: Json | null;
          notes?: string | null;
          terms?: string | null;
          full_data?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      settings: {
        Row: {
          user_id: string;
          data: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          data: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          data?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      document_numbering: {
        Row: {
          user_id: string;
          data: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          data: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          data?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
