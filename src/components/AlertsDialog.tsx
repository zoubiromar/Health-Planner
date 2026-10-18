import { useEffect, useRef, useState } from "react";
import { usePlanner } from "../context";
import { buildCalendar, shareCalendar } from "../model/ics";

export function AlertsDialog() {
  const { state, today, minutes, alertsOpen, setAlertsOpen } = usePlanner();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [result, setResult] = useState<"shared" | "downloaded" | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (alertsOpen && !dialog.open) dialog.showModal();
    if (!alertsOpen && dialog.open) dialog.close();
  }, [alertsOpen]);

  if (!alertsOpen) return null;

  return (
    <dialog
      ref={dialogRef}
      className="dialog"
      aria-labelledby="alerts-title"
      onClose={() => setAlertsOpen(false)}
    >
      <p className="eyebrow">iPhone</p>
      <h2 id="alerts-title">Add alerts to iPhone</h2>
      <ol className="steps">
        <li>Tap the button below. On an iPhone, share the file into Calendar.</li>
        <li>If the file downloads instead, open it and choose Calendar.</li>
        <li>
          Allow the alerts. Six repeat each day: mint tea, breakfast, lunch, the afternoon snack,
          dinner, and the night capsules.
        </li>
        <li>
          Check doses off in this app. When something is out of stock, Today says so. Calendar does
          not know which week you shopped.
        </li>
      </ol>
      <p className="quiet">
        Add this page to your Home Screen from the browser share menu if you want it to open like an
        app. Calendar is the reminder, because browser notifications are unreliable on iPhone.
      </p>
      <div className="button-row">
        <button
          type="button"
          className="button button-primary"
          data-testid="export-calendar"
          onClick={() => {
            const ics = buildCalendar(state, today, minutes);
            void shareCalendar(ics).then(setResult);
          }}
        >
          Add the six alerts
        </button>
        <button type="button" className="button button-quiet" onClick={() => setAlertsOpen(false)}>
          Close
        </button>
      </div>
      {result === "downloaded" ? <p className="quiet">Downloaded health-planner.ics.</p> : null}
      {result === "shared" ? <p className="quiet">Shared. Choose Calendar on your iPhone.</p> : null}
    </dialog>
  );
}
