import { Search } from "lucide-react";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchInput({ value, onChange, placeholder = "Rechercher…", className = "" }: SearchInputProps) {
  return (
    <div className={`relative ${className}`}>
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full pl-12 pr-4 py-3 rounded-xl border border-glass-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent-blue/40 transition-all backdrop-blur-xl"
        style={{ background: "var(--glass-bg)" }}
      />
    </div>
  );
}