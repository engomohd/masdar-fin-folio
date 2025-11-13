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
}

export interface FinanceFilters {
  date_from?: string;
  date_to?: string;
  type?: "income" | "expense";
  currency?: string;
  location?: "Saudi Arabia" | "Jordan";
}

export const calculateAmounts = (
  originalAmount: number,
  currency: string
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

  // VAT calculation (15% only for SAR)
  const vat = currency === "SAR" ? sar_net * 0.15 : 0;
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
