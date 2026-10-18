import { usePlanner } from "../context";
import { checkKey, formatLongDate, proteinTarget, weekdayName } from "../model/dates";
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
import type { DueRow, Period, Slot } from "../model/types";

const PERIODS: Period[] = ["Morning", "Midday", "Evening"];

export function Today() {
  const { state, dispatch, selectedDate, setSelectedDate, today, minutes, setView, setAlertsOpen } =
    usePlanner();
  const rows = rowsForDate(state, selectedDate);
  const isToday = selectedDate === today;
  const focus = focusItem(rows, state.checks, state.slots, selectedDate, isToday ? minutes : 0);
  const counts = progress(rows, state.checks, selectedDate);
  const protein = proteinTarget(state.profile.weightKg);
  const empty = state.blank && state.items.length === 0;

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
        {!isToday ? (
          <button type="button" className="text-button" onClick={() => setSelectedDate(today)}>
            Back to today
          </button>
        ) : null}
      </header>

      {empty ? (
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

          <div className="button-row">
            <button type="button" className="button button-primary" onClick={() => setAlertsOpen(true)}>
              Add alerts to iPhone
            </button>
          </div>

          {PERIODS.map((period) => (
            <section key={period} className="period" aria-labelledby={`period-${period}`}>
              <h2 id={`period-${period}`}>{period}</h2>
              {state.slots
                .filter((slot) => slot.period === period)
                .map((slot) => (
                  <SlotBlock
                    key={slot.id}
                    slot={slot}
                    rows={visibleItemsForSlot(rows, slot.id)}
                    current={focus.kind === "item" && focus.slot.id === slot.id}
                    date={selectedDate}
                    onGroceries={() => setView("groceries")}
                  />
                ))}
            </section>
          ))}

          <p className="footnote">A missed dose stays missed. Nothing gets piled onto the night.</p>
        </>
      )}

      {state.piles.some((pile) => pile.id === "minoxidil") && state.minoxidil === "unanswered" ? (
        <MinoxidilQuestion />
      ) : null}
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
        It was on the dermatology sheet, and it was not in the cabinet list. If it is in the house, a
        night reminder can say to apply it the way you were shown.
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
