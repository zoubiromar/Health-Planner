import { useEffect, useRef, type RefObject } from "react";
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
import type { DayView, DueRow, Period, Slot } from "../model/types";

const PERIODS: Period[] = ["Morning", "Midday", "Evening"];

const DAY_VIEWS: { id: DayView; label: string }[] = [
  { id: "list", label: "List" },
  { id: "timeline", label: "Timeline" },
  { id: "hours", label: "Hours" },
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
  const hoursRef = useRef<HTMLDivElement>(null);
  const currentSlotId = focus.kind === "item" ? focus.slot.id : "";

  useEffect(() => {
    if (state.dayView !== "hours" || !currentSlotId) return;
    const root = hoursRef.current;
    const card = root?.querySelector<HTMLElement>(`#hour-${currentSlotId}`);
    if (!root || !card) return;
    root.scrollTo({ left: Math.max(0, card.offsetLeft - 8), behavior: "auto" });
  }, [state.dayView, selectedDate, currentSlotId]);

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
              if (focus.kind === "item") {
                const element = document.getElementById(`row-${focus.item.id}`);
                element?.scrollIntoView({ behavior: "smooth", block: "center" });
              }
            }}
          />

          <div className="segments view-switch" role="tablist" aria-label="How to see this day">
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

          {state.dayView === "timeline" ? (
            <TimelineView
              grouped={grouped}
              currentSlotId={isToday ? currentSlotId : ""}
              date={selectedDate}
              onGroceries={() => setView("groceries")}
            />
          ) : state.dayView === "hours" ? (
            <HoursView
              scrollerRef={hoursRef}
              grouped={grouped}
              currentSlotId={isToday ? currentSlotId : ""}
              date={selectedDate}
              onGroceries={() => setView("groceries")}
            />
          ) : (
            <ListView
              slots={state.slots}
              rows={rows}
              currentSlotId={isToday ? currentSlotId : ""}
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
              {!before && strength ? <span className="day-note">Strength</span> : null}
              {!before && !hair && !strength ? <span className="day-note">Meals</span> : null}
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

function ListView({
  slots,
  rows,
  currentSlotId,
  date,
  onGroceries,
}: {
  slots: Slot[];
  rows: DueRow[];
  currentSlotId: string;
  date: string;
  onGroceries: () => void;
}) {
  return (
    <div data-testid="day-list">
      {PERIODS.map((period) => (
        <section key={period} className="period" aria-labelledby={`period-${period}`}>
          <h2 id={`period-${period}`}>{period}</h2>
          {slots
            .filter((slot) => slot.period === period)
            .map((slot) => (
              <SlotBlock
                key={slot.id}
                slot={slot}
                rows={visibleItemsForSlot(rows, slot.id)}
                current={slot.id === currentSlotId}
                date={date}
                onGroceries={onGroceries}
              />
            ))}
        </section>
      ))}
    </div>
  );
}

function TimelineView({
  grouped,
  currentSlotId,
  date,
  onGroceries,
}: {
  grouped: { slot: Slot; rows: DueRow[] }[];
  currentSlotId: string;
  date: string;
  onGroceries: () => void;
}) {
  return (
    <div className="timeline" data-testid="day-timeline">
      {grouped.map(({ slot, rows }) => (
        <article
          key={slot.id}
          className={slot.id === currentSlotId ? "timeline-stop is-current" : "timeline-stop"}
        >
          <header className="timeline-kicker">
            <time dateTime={slot.time}>{slot.time}</time>
            <h2>{slot.label}</h2>
          </header>
          <div className="rows">
            {rows.map((entry) => (
              <DoseRow key={entry.item.id} entry={entry} date={date} onGroceries={onGroceries} />
            ))}
          </div>
        </article>
      ))}
    </div>
  );
}

function HoursView({
  scrollerRef,
  grouped,
  currentSlotId,
  date,
  onGroceries,
}: {
  scrollerRef: RefObject<HTMLDivElement | null>;
  grouped: { slot: Slot; rows: DueRow[] }[];
  currentSlotId: string;
  date: string;
  onGroceries: () => void;
}) {
  return (
    <div className="hours" ref={scrollerRef} data-testid="day-hours">
      {grouped.map(({ slot, rows: slotRows }) => (
        <article
          key={slot.id}
          id={`hour-${slot.id}`}
          className={slot.id === currentSlotId ? "hour-card is-current" : "hour-card"}
        >
          <header className="timeline-kicker">
            <time dateTime={slot.time}>{slot.time}</time>
            <h2>{slot.label}</h2>
          </header>
          <div className="rows">
            {slotRows.map((entry) => (
              <DoseRow key={entry.item.id} entry={entry} date={date} onGroceries={onGroceries} />
            ))}
          </div>
        </article>
      ))}
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
        Show on the list
      </button>
    </section>
  );
}

function SlotBlock({
  slot,
  rows,
  current,
  date,
  onGroceries,
}: {
  slot: Slot;
  rows: DueRow[];
  current: boolean;
  date: string;
  onGroceries: () => void;
}) {
  if (rows.length === 0) return null;

  return (
    <div className={current ? "slot slot-current" : "slot"}>
      <header className="slot-head">
        <time dateTime={slot.time}>{slot.time}</time>
        <h3>{slot.label}</h3>
      </header>
      <div className="rows">
        {rows.map((entry) => (
          <DoseRow key={entry.item.id} entry={entry} date={date} onGroceries={onGroceries} />
        ))}
      </div>
    </div>
  );
}

function DoseRow({ entry, date, onGroceries }: { entry: DueRow; date: string; onGroceries: () => void }) {
  const { state, dispatch } = usePlanner();
  const checked = Boolean(state.checks[checkKey(date, entry.item.id)]);
  const owned = pileFor(state, entry.item);
  const warning = entry.status === "due" ? rowWarning(state, entry.item) : null;
  const low = owned && entry.status === "due" ? isRunningLow(owned) : false;
  const supply = owned ? daysOfSupply(owned) : null;
  const disabled = entry.status !== "due";

  return (
    <article
      id={`row-${entry.item.id}`}
      className={disabled ? "row is-muted" : checked ? "row is-done" : "row"}
      data-testid={`row-${entry.item.id}`}
    >
      <label className="check">
        <input
          type="checkbox"
          checked={checked}
          disabled={disabled}
          data-testid={`check-${entry.item.id}`}
          aria-label={`${entry.item.name}, ${entry.item.dose}`}
          onChange={() => dispatch({ type: "toggle-check", date, itemId: entry.item.id })}
        />
        <div className="row-copy">
          <span className="row-title">
            <strong>{entry.item.name}</strong>
            {entry.status === "muted" ? <span className="pill pill-alert">Out of stock</span> : null}
            {low ? <span className="pill">Running low</span> : null}
            <em>{entry.item.dose}</em>
          </span>
          <p>{entry.item.note}</p>
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
          {entry.status === "paused-window" ? (
            <p className="flag">Paused this fortnight. It comes back after the two weeks.</p>
          ) : null}
          {low ? <p className="flag">Running low{supply !== null ? `, about ${supply} days` : ""}.</p> : null}
          {owned && owned.count === 0 && entry.status === "due" ? (
            <p className="flag">Count is at zero. Mark it out of stock if the bottle is empty.</p>
          ) : null}
          {entry.reviewNote ? <p className="flag">{entry.reviewNote}</p> : null}
          {warning ? <p className="flag">{warning}</p> : null}
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
