interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export const SearchBar = ({ value, onChange }: SearchBarProps) => {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Search meals..."
      className="w-full px-4 py-2.5 rounded-lg border border-brand-peach bg-white focus:ring-2 focus:ring-brand-orange/40 focus:border-brand-orange outline-none transition text-sm text-brand-charcoal placeholder:text-brand-charcoal/40"
    />
  );
};
