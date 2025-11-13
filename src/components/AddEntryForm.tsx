import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { calculateAmounts } from "@/lib/supabase";

interface AddEntryFormProps {
  userId: string;
  onSuccess: () => void;
}

export const AddEntryForm = ({ userId, onSuccess }: AddEntryFormProps) => {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    project_name: "",
    type: "income" as "income" | "expense",
    currency: "SAR",
    amount_net: "",
    status: "مدفوع",
    location: "Saudi Arabia" as "Saudi Arabia" | "Jordan",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const originalAmount = parseFloat(formData.amount_net);
    if (isNaN(originalAmount) || originalAmount <= 0) {
      toast.error("المبلغ غير صحيح");
      setLoading(false);
      return;
    }

    const { sar_net, vat, gross } = calculateAmounts(originalAmount, formData.currency);

    const { error } = await supabase.from("finance_entries").insert({
      user_id: userId,
      date: formData.date,
      project_name: formData.project_name,
      type: formData.type,
      currency: formData.currency,
      amount_net: sar_net,
      vat_amount: vat,
      amount_gross: gross,
      status: formData.status,
      location: formData.location,
    });

    if (error) {
      toast.error("فشل في إضافة العملية: " + error.message);
    } else {
      toast.success("تمت إضافة العملية بنجاح");
      setFormData({
        date: new Date().toISOString().split("T")[0],
        project_name: "",
        type: "income",
        currency: "SAR",
        amount_net: "",
        status: "مدفوع",
        location: "Saudi Arabia",
      });
      onSuccess();
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-8 gap-4 p-4 bg-card rounded-lg border shadow-sm" dir="rtl">
      <Input
        type="date"
        value={formData.date}
        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
        required
      />
      <Input
        type="text"
        placeholder="اسم المشروع"
        value={formData.project_name}
        onChange={(e) => setFormData({ ...formData, project_name: e.target.value })}
        required
      />
      <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value as "income" | "expense" })}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="income">إيراد</SelectItem>
          <SelectItem value="expense">مصروف</SelectItem>
        </SelectContent>
      </Select>
      <Select value={formData.currency} onValueChange={(value) => setFormData({ ...formData, currency: value })}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="SAR">ريال</SelectItem>
          <SelectItem value="SAR_NO_VAT">ريال بدون ضريبة</SelectItem>
          <SelectItem value="JOD">دينار</SelectItem>
          <SelectItem value="USD">دولار</SelectItem>
          <SelectItem value="EUR">يورو</SelectItem>
        </SelectContent>
      </Select>
      <Select value={formData.location} onValueChange={(value) => setFormData({ ...formData, location: value as "Saudi Arabia" | "Jordan" })}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="Saudi Arabia">السعودية</SelectItem>
          <SelectItem value="Jordan">الأردن</SelectItem>
        </SelectContent>
      </Select>
      <Input
        type="number"
        step="0.01"
        placeholder="المبلغ (بدون ضريبة)"
        value={formData.amount_net}
        onChange={(e) => setFormData({ ...formData, amount_net: e.target.value })}
        required
      />
      <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="مدفوع">مدفوع</SelectItem>
          <SelectItem value="معلق">معلق</SelectItem>
          <SelectItem value="غير مدفوع">غير مدفوع</SelectItem>
        </SelectContent>
      </Select>
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "جاري الإضافة..." : "إضافة عملية"}
      </Button>
    </form>
  );
};
