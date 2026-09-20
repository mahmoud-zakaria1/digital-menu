import { useAppSelector } from "../app/hooks";
import { selectCartTableId } from "../features/cart/cartSelectors";

export const Navbar = () => {
  const tableId = useAppSelector(selectCartTableId);

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-brand-peach">
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-3 flex items-center justify-between">
        <span className="text-lg font-extrabold text-brand-charcoal tracking-tight">
          Digital<span className="text-brand-orange">Menu</span>
        </span>

        {tableId && (
          <span className="text-xs font-semibold text-brand-orange bg-brand-peach px-3 py-1.5 rounded-full">
            Dine-in
          </span>
        )}
      </div>
    </header>
  );
};
