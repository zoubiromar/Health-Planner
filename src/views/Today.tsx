import { useEffect, useState } from "react";
import { usePlanner } from "../context";
import {
  addDays,
  checkKey,
  formatDayMonth,
  formatLongDate,
  proteinTarget,
  weekdayName,
  weekdayShort,
  weekDates,
} from "../model/dates";
import {
  daysOfSupply,
  focusItem,
  isRunningLow,
  pileFor,
  progress,
  rowsForDate,
  rowWarning,
  visibleItemsForSlot,
} from "../model/schedule";
import type { DayView, DueRow, Slot } from "../model/types";

const DAY_VIEWS: { id: DayView; label: string }[] = [
  { id: "timeline", label: "Timeline" },
  { id: "week", label: "Week" },
];

export function Today() {
  const { state, dispatch, selectedDate, setSelectedDate, today, minutes, setView, setAlertsOpen } =
    usePlanner();
  const rows = rowsForDate(state, selectedDate);
  const isToday = selectedDate === today;
  const beforeStart = selectedDate < state.planStart;
  const focus = focusItem(rows, state.checks, state.slots, selectedDate, isToday ? minutes : 0);
  const counts = progress(rows, state.checks, selectedDate);
  const protein = proteinTarget(state.profile.weightKg);
  const empty = state.blank && state.items.length === 0;
  const grouped = slotsWithRows(state.slots, rows);
  const currentSlotId = focus.kind === "item" ? focus.slot.id : "";
  const [openSlots, setOpenSlots] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setOpenSlots({});
  }, [selectedDate]);

  function reveal(slotId: string, itemId: string) {
    setOpenSlots((current) => ({ ...current, [slotId]: true }));
    window.setTimeout(() => {
      document.getElementById(`row-${itemId}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 40);
  }

  return (
    <div data-testid="today-view">
      <header className="page-head">
        <p className="eyebrow">{isToday ? "Today" : weekdayName(selectedDate)}</p>
        <h1>{formatLongDate(selectedDate)}</h1>
        <p className="lede">Four small meals. Pills only with food.</p>
        {protein ? <p className="quiet">About {protein} g of protein, across the meals.</p> : null}
        {counts.total > 0 ? (
          <p className="quiet">
            {counts.done} of {counts.total} done. Out-of-stock rows stay off this count.
          </p>
        ) : null}
      </header>

      <DayBrowser
        selectedDate={selectedDate}
        today={today}
        planStart={state.planStart}
        onSelect={setSelectedDate}
      />

      {beforeStart ? (
        <section className="empty">
          <h2>Nothing before the start</h2>
          <p>
            The plan begins {formatLongDate(state.planStart)}. Earlier days stay empty, and tomorrow
            is already filled in.
          </p>
          <button
            type="button"
            className="button button-primary"
            onClick={() => setSelectedDate(state.planStart)}
          >
            Open the first day
          </button>
        </section>
      ) : empty ? (
        <section className="empty">
          <h2>This plan is empty</h2>
          <p>The starter schedule can come back, or you can add a daily step from Plan.</p>
          <button
            type="button"
            className="button button-primary"
            onClick={() => dispatch({ type: "restore-starter" })}
          >
            Restore the starter plan
          </button>
        </section>
      ) : (
        <>
          <NowCard
            isToday={isToday}
            focus={focus}
            onOpen={() => {
              if (focus.kind !== "item") return;
              if (state.dayView !== "timeline") {
                dispatch({ type: "set-day-view", view: "timeline" });
              }
              reveal(focus.slot.id, focus.item.id);
            }}
          />

          <div className="segments segments-two view-switch" role="tablist" aria-label="How to see this day">
            {DAY_VIEWS.map((option) => (
              <button
                key={option.id}
                type="button"
                role="tab"
                className="segment"
                aria-selected={state.dayView === option.id}
                onClick={() => dispatch({ type: "set-day-view", view: option.id })}
              >
                {option.label}
              </button>
            ))}
          </div>

          <div className="button-row">
            <button type="button" className="button button-primary" onClick={() => setAlertsOpen(true)}>
              Add alerts to iPhone
            </button>
          </div>

          {state.dayView === "week" ? (
            <WeekBoard
              selectedDate={selectedDate}
              today={today}
              planStart={state.planStart}
              onSelect={setSelectedDate}
              onGroceries={() => setView("groceries")}
            />
          ) : (
            <TimelineView
              grouped={grouped}
              currentSlotId={isToday ? currentSlotId : ""}
              openSlots={openSlots}
              onToggle={(slotId, open) => setOpenSlots((current) => ({ ...current, [slotId]: open }))}
              date={selectedDate}
              onGroceries={() => setView("groceries")}
            />
          )}

          <p className="footnote">A missed dose stays missed. Nothing gets piled onto the night.</p>
        </>
      )}

      {state.piles.some((pile) => pile.id === "minoxidil") && state.minoxidil === "unanswered" ? (
        <MinoxidilQuestion />
      ) : null}
    </div>
  );
}

function DayBrowser({
  selectedDate,
  today,
  planStart,
  onSelect,
}: {
  selectedDate: string;
  today: string;
  planStart: string;
  onSelect: (iso: string) => void;
}) {
  const { state } = usePlanner();
  const days = weekDates(selectedDate);

  return (
    <div className="day-tools">
      <div className="day-arrows">
        <button type="button" className="button button-quiet" onClick={() => onSelect(addDays(selectedDate, -1))}>
          Previous day
        </button>
        {selectedDate !== today ? (
          <button type="button" className="button button-quiet" onClick={() => onSelect(today)}>
            Today
          </button>
        ) : null}
        <button type="button" className="button button-quiet" onClick={() => onSelect(addDays(selectedDate, 1))}>
          Next day
        </button>
      </div>
      <div className="week" aria-label="Days this week">
        {days.map((iso) => {
          const before = iso < planStart;
          const dayRows = rowsForDate(state, iso);
          const hair = dayRows.find(
            (entry) => entry.item.rule === "forcapil" || entry.item.rule === "perfectil",
          );
          const strength = dayRows.some((entry) => entry.item.id === "strength" && entry.status === "due");
          const jamieson = dayRows.some((entry) => entry.item.id === "jamieson");
          return (
            <button
              key={iso}
              type="button"
              className={iso === today ? "day day-today" : "day"}
              aria-pressed={iso === selectedDate}
              onClick={() => onSelect(iso)}
            >
              <span className="day-name">{weekdayShort(iso)}</span>
              <span className="day-date">{formatDayMonth(iso)}</span>
              {before ? <span className="day-note">Earlier</span> : null}
              {!before && hair ? <span className="day-note">{hair.item.name}</span> : null}
              {!before && jamieson ? <span className="day-note">Jamieson</span> : null}
              {!before && strength ? <span className="day-note">Strength</span> : null}
              {!before && !hair && !strength && !jamieson ? <span className="day-note">Meals</span> : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function slotsWithRows(slots: Slot[], rows: DueRow[]): { slot: Slot; rows: DueRow[] }[] {
  return slots
    .map((slot) => ({ slot, rows: visibleItemsForSlot(rows, slot.id) }))
    .filter((entry) => entry.rows.length > 0);
}

function slotStartsOpen(rows: DueRow[], current: boolean): boolean {
  if (current) return true;
  return rows.some((entry) => entry.item.consume > 0 || entry.item.rule === "minoxidil");
}

function TimelineView({
  grouped,
  currentSlotId,
  openSlots,
  onToggle,
  date,
  onGroceries,
}: {
  grouped: { slot: Slot; rows: DueRow[] }[];
  currentSlotId: string;
  openSlots: Record<string, boolean>;
  onToggle: (slotId: string, open: boolean) => void;
  date: string;
  onGroceries: () => void;
}) {
  return (
    <div className="timeline" data-testid="day-timeline">
      {grouped.map(({ slot, rows }) => {
        const current = slot.id === currentSlotId;
        const open = slot.id in openSlots ? openSlots[slot.id] : slotStartsOpen(rows, current);
        const names = [...new Set(rows.map((entry) => entry.item.name))];
        return (
          <article
            key={slot.id}
            className={current ? "timeline-stop is-current" : "timeline-stop"}
          >
            <button
              type="button"
              className="timeline-toggle"
              aria-expanded={open}
              data-testid={`slot-toggle-${slot.id}`}
              onClick={() => onToggle(slot.id, !open)}
            >
              <time dateTime={slot.time}>{slot.time}</time>
              <h2>{slot.label}</h2>
              <span className="quiet">{open ? "Hide" : names.join(" · ")}</span>
            </button>
            {open ? (
              <div className="rows rows-wrap">
                {rows.map((entry) => (
                  <DoseRow key={entry.item.id} entry={entry} date={date} onGroceries={onGroceries} />
                ))}
              </div>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}

function WeekBoard({
  selectedDate,
  today,
  planStart,
  onSelect,
  onGroceries,
}: {
  selectedDate: string;
  today: string;
  planStart: string;
  onSelect: (iso: string) => void;
  onGroceries: () => void;
}) {
  const { state } = usePlanner();
  const days = weekDates(selectedDate);

  return (
    <div className="week-board" data-testid="day-week">
      {days.map((iso) => {
        const before = iso < planStart;
        const dayRows = before ? [] : rowsForDate(state, iso);
        return (
          <section
            key={iso}
            className={iso === selectedDate ? "week-col is-selected" : "week-col"}
            aria-current={iso === today ? "date" : undefined}
          >
            <button type="button" className="week-col-head" onClick={() => onSelect(iso)}>
              <span className="day-name">{weekdayShort(iso)}</span>
              <strong>{formatDayMonth(iso)}</strong>
            </button>
            {before ? (
              <p className="quiet">Earlier</p>
            ) : (
              <div className="rows">
                {state.slots.map((slot) => {
                  const slotRows = visibleItemsForSlot(dayRows, slot.id);
                  if (slotRows.length === 0) return null;
                  return (
                    <div key={slot.id} className="week-slot">
                      <p className="quiet">
                        {slot.time} {slot.label}
                      </p>
                      {slotRows.map((entry) => (
                        <DoseRow
                          key={entry.item.id}
                          entry={entry}
                          date={iso}
                          compact
                          onGroceries={onGroceries}
                        />
                      ))}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}

function NowCard({
  isToday,
  focus,
  onOpen,
}: {
  isToday: boolean;
  focus: ReturnType<typeof focusItem>;
  onOpen: () => void;
}) {
  if (focus.kind === "done") {
    return (
      <section className="now" data-testid="now-card">
        <p className="eyebrow">Done</p>
        <h2>That's the day</h2>
        <p>Nothing else on the list.</p>
      </section>
    );
  }

  const kicker = !isToday
    ? `${focus.slot.label} · ${focus.slot.time}`
    : focus.waiting
      ? `Next · ${focus.slot.time}`
      : `Now · ${focus.slot.label}`;

  return (
    <section className="now" data-testid="now-card">
      <p className="eyebrow">{kicker}</p>
      <h2>{focus.item.name}</h2>
      <p>{focus.item.dose}</p>
      <button type="button" className="text-button" onClick={onOpen}>
        Show on the timeline
      </button>
    </section>
  );
}

function DoseRow({
  entry,
  date,
  onGroceries,
  compact = false,
}: {
  entry: DueRow;
  date: string;
  onGroceries: () => void;
  compact?: boolean;
}) {
  const { state, dispatch } = usePlanner();
  const checked = Boolean(state.checks[checkKey(date, entry.item.id)]);
  const owned = pileFor(state, entry.item);
  const warning = entry.status === "due" ? rowWarning(state, entry.item) : null;
  const low = owned && entry.status === "due" ? isRunningLow(owned) : false;
  const supply = owned ? daysOfSupply(owned) : null;
  const disabled = entry.status !== "due";
  const rowId = compact ? `week-row-${date}-${entry.item.id}` : `row-${entry.item.id}`;

  return (
    <article
      id={rowId}
      className={disabled ? "row is-muted" : checked ? "row is-done" : "row"}
          data-testid={compact ? `week-row-${date}-${entry.item.id}` : `row-${entry.item.id}`}
    >
      <label className="check">
        <input
          type="checkbox"
          checked={checked}
          disabled={disabled}
          data-testid={compact ? `week-check-${date}-${entry.item.id}` : `check-${entry.item.id}`}
          aria-label={compact ? `${date}, ${entry.item.name}, ${entry.item.dose}` : `${entry.item.name}, ${entry.item.dose}`}
          onChange={() => dispatch({ type: "toggle-check", date, itemId: entry.item.id })}
        />
        <div className="row-copy">
          <span className="row-title">
            <strong>{entry.item.name}</strong>
            {entry.status === "muted" ? <span className="pill pill-alert">Out of stock</span> : null}
            {low && !compact ? <span className="pill">Running low</span> : null}
            <em>{entry.item.dose}</em>
          </span>
          {compact ? null : <p>{entry.item.note}</p>}
          {entry.status === "muted" ? (
            <p className="flag">
              <button
                type="button"
                className="text-button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={onGroceries}
              >
                See groceries
              </button>
            </p>
          ) : null}
          {!compact && entry.status === "paused-window" ? (
            <p className="flag">Paused this fortnight. It comes back after the two weeks.</p>
          ) : null}
          {!compact && low ? (
            <p className="flag">Running low{supply !== null ? `, about ${supply} days` : ""}.</p>
          ) : null}
          {!compact && owned && owned.count === 0 && entry.status === "due" ? (
            <p className="flag">Count is at zero. Mark it out of stock if the bottle is empty.</p>
          ) : null}
          {!compact && entry.reviewNote ? <p className="flag">{entry.reviewNote}</p> : null}
          {!compact && warning ? <p className="flag">{warning}</p> : null}
        </div>
      </label>
    </article>
  );
}

function MinoxidilQuestion() {
  const { dispatch } = usePlanner();

  return (
    <section className="card question" aria-labelledby="minoxidil-q">
      <h2 id="minoxidil-q">Are you still using minoxidil?</h2>
      <p>
        Apply it to a dry scalp in the morning and at night, the way you were shown. Leave it off if
        it is not in the house.
      </p>
      <div className="button-row">
        <button
          type="button"
          className="button button-primary"
          onClick={() => dispatch({ type: "answer-minoxidil", answer: "yes" })}
        >
          Yes, it's here
        </button>
        <button
          type="button"
          className="button button-quiet"
          onClick={() => dispatch({ type: "answer-minoxidil", answer: "no" })}
        >
          Leave it off
        </button>
      </div>
    </section>
  );
}
