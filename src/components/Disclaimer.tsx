import { useEffect, useRef } from "react";
import { usePlanner } from "../context";

export function Disclaimer() {
  const { state, dispatch } = usePlanner();
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || state.disclaimerSeen) return;
    if (!dialog.open) dialog.showModal();
  }, [state.disclaimerSeen]);

  if (state.disclaimerSeen) return null;

  return (
    <dialog ref={dialogRef} className="dialog" aria-labelledby="disclaimer-title">
      <p className="eyebrow">Before you start</p>
      <h2 id="disclaimer-title">A planner, not a new prescription</h2>
      <p>
        This organizes the April 2026 dermatology sheet around appetite, strength, and the bottles
        already at home. Vitamin D and magnesium were the low results. The short courses for zinc,
        selenium, and iron stay off the daily list.
      </p>
      <p>Show this schedule to your doctor if you want it confirmed.</p>
      <button
        type="button"
        className="button button-primary"
        onClick={() => {
          dialogRef.current?.close();
          dispatch({ type: "dismiss-disclaimer" });
        }}
      >
        I understand
      </button>
    </dialog>
  );
}
