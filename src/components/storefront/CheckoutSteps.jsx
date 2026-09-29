const STEPS = ["Cart", "Your details", "Confirmed"];

// current: 1 = cart, 2 = details, 4 = everything done
export default function CheckoutSteps({ current }) {
  return (
    <ol className="steps" aria-label="Checkout progress">
      {STEPS.map((label, i) => {
        const n = i + 1;
        const state = n < current ? "done" : n === current ? "now" : "";
        return (
          <li key={label} className={state} aria-current={state === "now" ? "step" : undefined}>
            <span>{state === "done" ? "✓" : n}</span>{label}
          </li>
        );
      })}
    </ol>
  );
}
