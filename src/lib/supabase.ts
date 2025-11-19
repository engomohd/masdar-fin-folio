import { supabase } from "@/integrations/supabase/client";
import { Session, User } from "@supabase/supabase-js";

export interface FinanceEntry {
  id: string;
  user_id: string;
  date: string;
  project_name: string;
  type: "income" | "expense";
  currency: "SAR" | "SAR_NO_VAT" | "JOD" | "USD" | "EUR";
  amount_net: number;
  vat_amount: number;
  amount_gross: number;
  status: "مدفوع" | "معلق" | "غير مدفوع";
  location: "Saudi Arabia" | "Jordan";
  created_at: string;
  disable_vat: boolean;
}

export interface FinanceFilters {
  date_from?: string;
  date_to?: string;
  type?: "income" | "expense";
  currency?: string;
  location?: "Saudi Arabia" | "Jordan";
  search?: string;
}

export const calculateAmounts = (
  originalAmount: number,
  currency: string,
  disableVat: boolean = false
): { sar_net: number; vat: number; gross: number } => {
  let sar_net = originalAmount;

  // Currency conversion to SAR
  switch (currency) {
    case "JOD":
      sar_net = originalAmount * 5.4;
      break;
    case "USD":
      sar_net = originalAmount * 3.75;
      break;
    case "EUR":
      sar_net = originalAmount * 4.21;
      break;
    case "SAR_NO_VAT":
    case "SAR":
      sar_net = originalAmount;
      break;
  }

  // VAT calculation (15% only for SAR, unless disabled)
  const vat = (currency === "SAR" && !disableVat) ? sar_net * 0.15 : 0;
  const gross = sar_net + vat;

  return { sar_net, vat, gross };
};

export const signIn = async (email: string, password: string) => {
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { error };
};

export const deleteEntry = async (entryId: string, entry: FinanceEntry) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: { message: 'Not authenticated' } as any };

  // Insert into deleted_entries
  const { error: insertError } = await supabase
    .from('deleted_entries')
    .insert({
      original_entry_id: entryId,
      user_id: entry.user_id,
      date: entry.date,
      project_name: entry.project_name,
      type: entry.type,
      currency: entry.currency,
      amount_net: entry.amount_net,
      vat_amount: entry.vat_amount,
      amount_gross: entry.amount_gross,
      status: entry.status,
      location: entry.location,
      deleted_by: user.id,
      disable_vat: entry.disable_vat,
    });

  if (insertError) return { error: insertError };

  // Delete from finance_entries
  const { error: deleteError } = await supabase
    .from('finance_entries')
    .delete()
    .eq('id', entryId);

  return { error: deleteError };
};

export const signUp = async (email: string, password: string) => {
  const redirectUrl = `${window.location.origin}/`;
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: redirectUrl,
    },
  });
  return { error };
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

export const getAuthState = (): {
  getSession: () => Promise<{ session: Session | null; user: User | null }>;
  onAuthChange: (callback: (session: Session | null, user: User | null) => void) => () => void;
} => {
  return {
    getSession: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      return { session, user: session?.user ?? null };
    },
    onAuthChange: (callback) => {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        callback(session, session?.user ?? null);
      });
      return () => subscription.unsubscribe();
    },
  };
};
