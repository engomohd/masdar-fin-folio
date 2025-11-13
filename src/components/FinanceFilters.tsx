import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FinanceFilters as Filters } from "@/lib/supabase";

interface FinanceFiltersProps {
  filters: Filters;
  onFilterChange: (filters: Filters) => void;
  onClear: () => void;
}

export const FinanceFilters = ({ filters, onFilterChange, onClear }: FinanceFiltersProps) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-card rounded-lg border shadow-sm" dir="rtl">
        <Input
          type="text"
          placeholder="بحث في المشروع، المبلغ، أو أي حقل..."
          value={filters.search || ""}
          onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
          className="w-full col-span-full"
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 p-4 bg-card rounded-lg border shadow-sm" dir="rtl">
        <Input
          type="date"
          value={filters.date_from || ""}
          onChange={(e) => onFilterChange({ ...filters, date_from: e.target.value })}
          className="w-full"
        />
        <Input
          type="date"
          value={filters.date_to || ""}
          onChange={(e) => onFilterChange({ ...filters, date_to: e.target.value })}
          className="w-full"
        />
        <Select
          value={filters.type || "all"}
          onValueChange={(value) => onFilterChange({ ...filters, type: value === "all" ? undefined : value as "income" | "expense" })}
        >
          <SelectTrigger>
            <SelectValue placeholder="النوع: الكل" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">النوع: الكل</SelectItem>
            <SelectItem value="income">إيراد</SelectItem>
            <SelectItem value="expense">مصروف</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={filters.currency || "all"}
          onValueChange={(value) => onFilterChange({ ...filters, currency: value === "all" ? undefined : value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="العملة: الكل" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">العملة: الكل</SelectItem>
            <SelectItem value="SAR">ريال</SelectItem>
            <SelectItem value="SAR_NO_VAT">ريال بدون ضريبة</SelectItem>
            <SelectItem value="JOD">دينار</SelectItem>
            <SelectItem value="USD">دولار</SelectItem>
            <SelectItem value="EUR">يورو</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={filters.location || "all"}
          onValueChange={(value) => onFilterChange({ ...filters, location: value === "all" ? undefined : value as "Saudi Arabia" | "Jordan" })}
        >
          <SelectTrigger>
            <SelectValue placeholder="الموقع: الكل" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">الموقع: الكل</SelectItem>
            <SelectItem value="Saudi Arabia">السعودية</SelectItem>
            <SelectItem value="Jordan">الأردن</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex gap-2">
          <Button type="button" onClick={() => onFilterChange(filters)} className="flex-1">
            تصفية
          </Button>
          <Button type="button" variant="outline" onClick={onClear} className="flex-1">
            مسح
          </Button>
        </div>
      </div>
    </div>
  );
};
