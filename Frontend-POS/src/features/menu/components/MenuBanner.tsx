export const MenuBanner = () => {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-brand-charcoal text-white px-6 py-8 md:px-10 md:py-10 mb-6">
      <div className="absolute -right-10 -bottom-12 w-48 h-48 rounded-full bg-brand-orange/20" />
      <div className="absolute right-8 -top-10 w-24 h-24 rounded-full bg-brand-orange/10" />

      <div className="relative">
        <p className="text-brand-orange font-semibold text-sm tracking-wide uppercase">
          Fresh Today
        </p>
        <h2 className="text-2xl md:text-3xl font-extrabold mt-1">
          What are you craving?
        </h2>
        <p className="text-white/70 text-sm mt-2 max-w-md">
          Browse the menu, build your order, and we'll get it right to you.
        </p>
      </div>
    </div>
  );
};
