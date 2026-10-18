import { useState } from "react";
import { usePlanner } from "../context";
import {
  bmi,
  formatDayMonth,
  formatPhaseDate,
  proteinTarget,
  weekdayShort,
  weekDates,
  weekSunday,
} from "../model/dates";
import { phaseIsCurrent, phases, progress, rowsForDate } from "../model/schedule";
import type { SlotId } from "../model/types";

export function Plan() {
  const { state, dispatch, selectedDate, setSelectedDate, today, setAlertsOpen } = usePlanner();
  const [confirm, setConfirm] = useState<null | "blank" | "restore">(null);
  const [draft, setDraft] = useState({ name: "", dose: "", slotId: "breakfast" as SlotId, count: "" });
  const [weightText, setWeightText] = useState("");
  const days = weekDates(today);
  const phaseList = phases(state.planStart);
  const paused = state.piles.filter(
    (pile) => pile.paused && !pile.kitchen && pile.id !== "minoxidil" && pile.id !== "magnesium300",
  );
  const weekWeight = state.weights.find((entry) => weekSunday(entry.date) === weekSunday(today));
  const index = bmi(state.profile.weightKg, state.profile.heightCm);
  const protein = proteinTarget(state.profile.weightKg);
  const showLab = today >= "2026-12-29" && !state.labDone && !state.blank;

  return (
    <div data-testid="plan-view">
      <header className="page-head">
        <p className="eyebrow">Plan</p>
        <h1>The shape of the weeks</h1>
        <p className="lede">Times, phases, and the things left off the daily list on purpose.</p>
      </header>

      {showLab ? (
        <section className="card question">
          <h2>Lab week is close</h2>
          <p>Repeat vitamin D and magnesium around 12 January, and ask about ferritin.</p>
        </section>
      ) : null}

      <section className="section" aria-labelledby="week-title">
        <h2 id="week-title">This week</h2>
        <div className="week">
          {days.map((iso) => {
            const dayRows = rowsForDate(state, iso);
            const hair = dayRows.find((entry) => entry.item.rule === "forcapil" || entry.item.rule === "perfectil");
            const strength = dayRows.some((entry) => entry.item.id === "strength" && entry.status === "due");
            const counts = progress(dayRows, state.checks, iso);
            const done = counts.total > 0 && counts.done === counts.total;
            return (
              <button
                key={iso}
                type="button"
                className="day"
                aria-pressed={iso === selectedDate}
                onClick={() => setSelectedDate(iso)}
              >
                <span className="day-name">{weekdayShort(iso)}</span>
                <span className="day-date">{formatDayMonth(iso)}</span>
                {hair ? <span className="day-note">{hair.item.name}</span> : <span className="day-note">Hair rest</span>}
                {strength ? <span className="day-note">Strength</span> : null}
                {done ? <span className="day-note">Done</span> : null}
              </button>
            );
          })}
        </div>
        <p className="quiet">Choose a day. Today opens that checklist, including tomorrow.</p>
      </section>

      <section className="section" aria-labelledby="times-title">
        <h2 id="times-title">Reminder times</h2>
        <div className="time-list">
          {state.slots.map((slot) => (
            <label key={slot.id} className="time-row">
              <span>
                {slot.label}
                {slot.alert ? <small>Alert</small> : <small>On the list only</small>}
              </span>
              <input
                type="time"
                value={slot.time}
                aria-label={`${slot.label} time`}
                onChange={(event) =>
                  dispatch({ type: "set-slot-time", slotId: slot.id, time: event.target.value })
                }
              />
            </label>
          ))}
        </div>
        <button type="button" className="button button-primary" onClick={() => setAlertsOpen(true)}>
          Add alerts to iPhone
        </button>
        <p className="quiet">
          The six alerts are mint tea, breakfast, lunch, the afternoon snack, dinner, and night.
          Mid-morning and the walk stay on Today.
        </p>
      </section>

      {!state.blank ? (
        <section className="section" aria-labelledby="phase-title">
          <h2 id="phase-title">Phases</h2>
          <div className="stack">
            {phaseList.map((phase) => (
              <article key={phase.id} className={phaseIsCurrent(phase, today) ? "card card-current" : "card"}>
                <h3>{phase.title}</h3>
                <p className="quiet">
                  {formatPhaseDate(phase.start)}
                  {phase.end !== phase.start ? ` – ${formatPhaseDate(phase.end)}` : ""}
                </p>
                <p>{phase.detail}</p>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {paused.length > 0 ? (
        <section className="section" aria-labelledby="paused-title">
          <h2 id="paused-title">Left off the daily list</h2>
          <div className="stack">
            {paused.map((pile) => (
              <article key={pile.id} className="card">
                <h3>{pile.name}</h3>
                <p>{pile.pauseReason}</p>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section className="section" aria-labelledby="weight-title">
        <h2 id="weight-title">Weight this week</h2>
        <p className="quiet">
          {weekWeight ? `${weekWeight.kg} kg recorded this week.` : "No weight yet this week."} The
          starting point on the plan is 54 kg.
        </p>
        <form
          className="inline-form"
          onSubmit={(event) => {
            event.preventDefault();
            const kg = Number(weightText);
            if (kg > 0) {
              dispatch({ type: "add-weight", date: today, kg });
              setWeightText("");
            }
          }}
        >
          <label>
            Kilograms
            <input
              inputMode="decimal"
              value={weightText}
              placeholder={String(state.profile.weightKg)}
              onChange={(event) => setWeightText(event.target.value)}
            />
          </label>
          <button type="submit" className="button button-primary">
            Save weight
          </button>
        </form>
        {state.weights.length > 0 ? (
          <ul className="plain-list">
            {state.weights
              .slice()
              .reverse()
              .slice(0, 6)
              .map((entry) => (
                <li key={entry.date}>
                  {formatPhaseDate(entry.date)} · {entry.kg} kg
                </li>
              ))}
          </ul>
        ) : null}
      </section>

      <section className="section" aria-labelledby="profile-title">
        <h2 id="profile-title">Profile</h2>
        <p className="quiet">
          Stored on this device.
          {index ? ` BMI ${index}.` : ""}
          {protein ? ` About ${protein} g of protein a day.` : ""}
        </p>
        <div className="profile-grid">
          <label>
            Age
            <input
              type="number"
              min={1}
              max={120}
              value={state.profile.age}
              onChange={(event) => {
                const age = Number(event.target.value);
                if (age > 0) dispatch({ type: "set-profile", profile: { age } });
              }}
            />
          </label>
          <label>
            Height, cm
            <input
              type="number"
              min={50}
              max={250}
              value={state.profile.heightCm}
              onChange={(event) => {
                const heightCm = Number(event.target.value);
                if (heightCm > 0) dispatch({ type: "set-profile", profile: { heightCm } });
              }}
            />
          </label>
          <label>
            Weight, kg
            <input
              type="number"
              min={30}
              max={250}
              step={0.1}
              value={state.profile.weightKg}
              onChange={(event) => {
                const weightKg = Number(event.target.value);
                if (weightKg > 0) dispatch({ type: "set-profile", profile: { weightKg } });
              }}
            />
          </label>
        </div>
      </section>

      <section className="section" aria-labelledby="add-title">
        <h2 id="add-title">Add a daily step</h2>
        <form
          className="stack-form"
          onSubmit={(event) => {
            event.preventDefault();
            const count = draft.count.trim() === "" ? null : Number(draft.count);
            dispatch({
              type: "add-item",
              name: draft.name,
              dose: draft.dose,
              slotId: draft.slotId,
              count: count !== null && Number.isFinite(count) ? count : null,
            });
            setDraft({ name: "", dose: "", slotId: draft.slotId, count: "" });
          }}
        >
          <label>
            Name
            <input
              value={draft.name}
              onChange={(event) => setDraft({ ...draft, name: event.target.value })}
              required
            />
          </label>
          <label>
            Dose
            <input
              value={draft.dose}
              onChange={(event) => setDraft({ ...draft, dose: event.target.value })}
            />
          </label>
          <label>
            When
            <select
              value={draft.slotId}
              onChange={(event) => setDraft({ ...draft, slotId: event.target.value as SlotId })}
            >
              {state.slots.map((slot) => (
                <option key={slot.id} value={slot.id}>
                  {slot.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            How many you have, optional
            <input
              inputMode="numeric"
              value={draft.count}
              onChange={(event) => setDraft({ ...draft, count: event.target.value })}
            />
          </label>
          <button type="submit" className="button button-primary">
            Add to the plan
          </button>
        </form>
      </section>

      <section className="section" aria-labelledby="reset-title">
        <h2 id="reset-title">This device</h2>
        <p className="quiet">
          A blank plan keeps your weight log and clears the schedule, so someone else can use the same
          screens. Restore brings this starter plan back.
        </p>
        {confirm === null ? (
          <div className="button-row">
            <button type="button" className="button button-quiet" onClick={() => setConfirm("blank")}>
              Start a blank plan
            </button>
            <button type="button" className="button button-quiet" onClick={() => setConfirm("restore")}>
              Restore the starter plan
            </button>
          </div>
        ) : (
          <div className="card">
            <p>
              {confirm === "blank"
                ? "This clears the schedule on this device."
                : "This replaces the schedule with the starter plan."}
            </p>
            <div className="button-row">
              <button
                type="button"
                className="button button-primary"
                onClick={() => {
                  dispatch({ type: confirm === "blank" ? "start-blank" : "restore-starter" });
                  setConfirm(null);
                }}
              >
                Confirm
              </button>
              <button type="button" className="button button-quiet" onClick={() => setConfirm(null)}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
