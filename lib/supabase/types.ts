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
          trade_name: string | null;
          display_brand_name: string | null;
          constitution: string | null;
          gstin: string | null;
          registration_type: string | null;
          gst_registration_valid_from: string | null;
          pan: string | null;
          email: string | null;
          phone: string | null;
          website: string | null;
          address: Json | null;
          bank_details: Json | null;
          logo_url: string | null;
          signature_url: string | null;
          default_signatory_name: string | null;
          default_terms: string | null;
          default_declaration: string | null;
          default_invoice_prefix: string | null;
          default_po_prefix: string | null;
          logo_base64: string | null;
          signature_base64: string | null;
          default_notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          company_name?: string | null;
          legal_name?: string | null;
          trade_name?: string | null;
          display_brand_name?: string | null;
          constitution?: string | null;
          gstin?: string | null;
          registration_type?: string | null;
          gst_registration_valid_from?: string | null;
          pan?: string | null;
          email?: string | null;
          phone?: string | null;
          website?: string | null;
          address?: Json | null;
          bank_details?: Json | null;
          logo_url?: string | null;
          signature_url?: string | null;
          default_signatory_name?: string | null;
          default_terms?: string | null;
          default_declaration?: string | null;
          default_invoice_prefix?: string | null;
          default_po_prefix?: string | null;
          logo_base64?: string | null;
          signature_base64?: string | null;
          default_notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company_name?: string | null;
          legal_name?: string | null;
          trade_name?: string | null;
          display_brand_name?: string | null;
          constitution?: string | null;
          gstin?: string | null;
          registration_type?: string | null;
          gst_registration_valid_from?: string | null;
          pan?: string | null;
          email?: string | null;
          phone?: string | null;
          website?: string | null;
          address?: Json | null;
          bank_details?: Json | null;
          logo_url?: string | null;
          signature_url?: string | null;
          default_signatory_name?: string | null;
          default_terms?: string | null;
          default_declaration?: string | null;
          default_invoice_prefix?: string | null;
          default_po_prefix?: string | null;
          logo_base64?: string | null;
          signature_base64?: string | null;
          default_notes?: string | null;
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
          share_token: string | null;
          logo_image_base64: string | null;
          irn_qr_image_base64: string | null;
          signature_image_base64: string | null;
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
          share_token?: string | null;
          logo_image_base64?: string | null;
          irn_qr_image_base64?: string | null;
          signature_image_base64?: string | null;
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
          share_token?: string | null;
          logo_image_base64?: string | null;
          irn_qr_image_base64?: string | null;
          signature_image_base64?: string | null;
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
          share_token: string | null;
          signature_image_base64: string | null;
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
          share_token?: string | null;
          signature_image_base64?: string | null;
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
          share_token?: string | null;
          signature_image_base64?: string | null;
          full_data?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      services: {
        Row: {
          id: string;
          user_id: string;
          description: string;
          sac_code: string | null;
          unit: string | null;
          default_rate: number;
          default_gst_percent: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          description: string;
          sac_code?: string | null;
          unit?: string | null;
          default_rate?: number;
          default_gst_percent?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          description?: string;
          sac_code?: string | null;
          unit?: string | null;
          default_rate?: number;
          default_gst_percent?: number;
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
      email_settings: {
        Row: {
          id: string;
          user_id: string;
          from_name: string | null;
          from_email: string | null;
          email_signature: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          from_name?: string | null;
          from_email?: string | null;
          email_signature?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          from_name?: string | null;
          from_email?: string | null;
          email_signature?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
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
    Functions: {
      get_invoice_by_share_token: {
        Args: {
          p_token: string;
        };
        Returns: Json;
      };
      get_po_by_share_token: {
        Args: {
          p_token: string;
        };
        Returns: Json;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
