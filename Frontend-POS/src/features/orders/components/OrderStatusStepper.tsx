import type { OrderStatus } from "../types/order.types";

const STEPS = [
  { key: "pending", label: "Received" },
  { key: "preparing", label: "Preparing" },
  { key: "completed", label: "Completed" },
] as const;

interface OrderStatusStepperProps {
  // "cancelled" has no place on a progress track - the page shows a
  // dedicated banner for it instead.
  status: Exclude<OrderStatus, "cancelled">;
}

export const OrderStatusStepper = ({ status }: OrderStatusStepperProps) => {
  const currentIndex = STEPS.findIndex((step) => step.key === status);

  return (
    <ol className="flex items-start" aria-label="Order progress">
      {STEPS.map((step, idx) => {
        const isReached = idx <= currentIndex;
        const isCurrent = idx === currentIndex;
        const showCheck = idx < currentIndex || status === "completed";

        return (
          <li
            key={step.key}
            aria-current={isCurrent ? "step" : undefined}
            className="relative flex-1 flex flex-col items-center"
          >
            {/* Connector: runs from the previous step's centre to this one's */}
            {idx > 0 && (
              <span
                aria-hidden="true"
                className={`absolute top-4 right-1/2 w-full h-0.5 -translate-y-1/2 transition-colors ${
                  isReached ? "bg-brand-orange" : "bg-brand-peach"
                }`}
              />
            )}

            <span
              className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                isReached
                  ? "bg-brand-orange text-white"
                  : "bg-brand-peach text-brand-charcoal/40"
              } ${isCurrent && status !== "completed" ? "ring-4 ring-brand-orange/20" : ""}`}
            >
              {showCheck && isReached ? "✓" : idx + 1}
            </span>

            <span
              className={`mt-2 text-xs font-medium ${
                isReached ? "text-brand-charcoal" : "text-brand-charcoal/40"
              }`}
            >
              {step.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
};
