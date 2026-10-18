import { useEffect, useMemo, useState } from "react";
import { usePlanner } from "../context";
import { formatDayMonth, formatPhaseDate, weekSunday } from "../model/dates";
import {
  groceryKey,
  planDaysInWeek,
  planYearEnd,
  projectRefills,
  snackLines,
  weekUseNote,
  yearWeeks,
  type ShopLine,
} from "../model/groceries";
import { cabinetPiles, daysOfSupply, isRunningLow } from "../model/schedule";
import { LAB_DATE, type StockPile } from "../model/types";

export function Groceries() {
  const { state, today } = usePlanner();
  const weeks = yearWeeks(state.planStart);
  const [week, setWeek] = useState(() => clampWeek(weeks, weekSunday(today)));
  const selected = clampWeek(weeks, week);
  const days = planDaysInWeek(state.planStart, selected);
  const foods = state.blank ? [] : snackLines(state.planStart, selected);
  const refills = useMemo(() => (state.blank ? [] : projectRefills(state, today)), [state, today]);
  const weekRefills = refills.filter((line) => line.week === selected);
  const refillWeeks = new Set(refills.map((line) => line.week));

  useEffect(() => {
    const current = document.querySelector<HTMLElement>(`[data-testid="week-${selected}"]`);
    current?.scrollIntoView({ inline: "center", block: "nearest" });
  }, [selected]);

  const index = weeks.indexOf(selected);

  return (
    <div data-testid="groceries-view">
      <header className="page-head">
        <p className="eyebrow">Groceries</p>
        <h1>This week's food</h1>
        <p className="lede">
          Snacks for the days in this week, from {formatDayMonth(state.planStart)} through{" "}
          {formatDayMonth(planYearEnd(state.planStart))}. A supplement shows up only in the week its
          bottle runs out.
        </p>
      </header>

      <div className="day-tools">
        <div className="day-arrows">
          <button
            type="button"
            className="button button-quiet"
            disabled={index <= 0}
            onClick={() => setWeek(weeks[index - 1])}
          >
            Previous week
          </button>
          <button
            type="button"
            className="button button-quiet"
            onClick={() => setWeek(clampWeek(weeks, weekSunday(today)))}
          >
            This week
          </button>
          <button
            type="button"
            className="button button-quiet"
            disabled={index < 0 || index >= weeks.length - 1}
            onClick={() => setWeek(weeks[index + 1])}
          >
            Next week
          </button>
        </div>
        <div className="year-strip" aria-label="Weeks this year">
          {weeks.map((iso) => (
            <button
              key={iso}
              type="button"
              className={refillWeeks.has(iso) ? "year-week has-refill" : "year-week"}
              aria-pressed={iso === selected}
              data-testid={`week-${iso}`}
              onClick={() => setWeek(iso)}
            >
              <span className="day-name">Week</span>
              <span className="day-date">{formatDayMonth(iso)}</span>
              {refillWeeks.has(iso) ? <span className="day-note">Refill</span> : null}
            </button>
          ))}
        </div>
      </div>

      <section className="section" aria-labelledby="food-title">
        <h2 id="food-title">
          <span className="mark" aria-hidden="true">
            🍑
          </span>
          Buy for this week
        </h2>
        {foods.length === 0 ? (
          <p className="empty-inline">No plan days in this week.</p>
        ) : (
          <div className="stack">
            {foods.map((line) => (
              <ShopRow key={line.id} week={selected} line={line} />
            ))}
          </div>
        )}
        {days.length > 0 ? <p className="quiet">{weekUseNote(days.length)}</p> : null}
      </section>

      {!state.blank ? (
        <section className="section" aria-labelledby="refill-title">
          <h2 id="refill-title">
            <span className="mark" aria-hidden="true">
              💊
            </span>
            Bottles that run out
          </h2>
          {weekRefills.length === 0 ? (
            <p className="empty-inline">No supplement runs out this week.</p>
          ) : (
            <div className="stack">
              {weekRefills.map((line) => (
                <RefillRow key={line.id} week={selected} line={line} />
              ))}
            </div>
          )}
        </section>
      ) : null}

      <Bottles />

      <section className="section" aria-labelledby="lab-title">
        <h2 id="lab-title">Later</h2>
        <LabRow />
      </section>
    </div>
  );
}

function clampWeek(weeks: string[], iso: string): string {
  if (weeks.length === 0) return iso;
  if (weeks.includes(iso)) return iso;
  if (iso < weeks[0]) return weeks[0];
  return weeks[weeks.length - 1];
}

function ShopRow({ week, line }: { week: string; line: ShopLine }) {
  const { state, dispatch } = usePlanner();
  const key = groceryKey(week, line.id);
  const bought = Boolean(state.groceryChecks[key]);

  return (
    <label className={bought ? "check-row is-done" : "check-row"} data-testid={`shop-${line.id}`}>
      <input
        type="checkbox"
        checked={bought}
        onChange={() => dispatch({ type: "toggle-grocery", week, id: line.id })}
      />
      <span>
        <strong>
          {line.name} · {line.quantity}
        </strong>
        <small>{line.note}</small>
      </span>
    </label>
  );
}

function RefillRow({ week, line }: { week: string; line: ShopLine }) {
  const { state, dispatch } = usePlanner();
  const key = groceryKey(week, line.id);
  const bought = Boolean(state.groceryChecks[key]);

  return (
    <article className="card" data-testid={`refill-${line.stockId}`}>
      <div className="card-top">
        <h3>
          {line.name} · {line.quantity}
        </h3>
        {bought ? <span className="pill">Bought</span> : null}
      </div>
      <p>{line.note}</p>
      <button
        type="button"
        className="button button-primary"
        data-testid={`buy-${line.stockId}`}
        disabled={bought}
        onClick={() => {
          if (line.stockId && line.add) {
            dispatch({ type: "buy-refill", week, stockId: line.stockId, add: line.add });
          }
        }}
      >
        I bought this
      </button>
    </article>
  );
}

function Bottles() {
  const { state } = usePlanner();
  const piles = cabinetPiles(state).filter((pile) => pile.id !== "magnesium300" || (pile.count ?? 0) > 0);

  return (
    <section className="section">
      <details className="card">
        <summary>Bottles on hand</summary>
        <p className="quiet">
          Counts start from what is already at home. Centrum and Jamieson begin as a full box of 30
          until you change them. Minoxidil is not counted, so it has no run-out week.
        </p>
        <div className="stack">
          {piles.map((pile) => (
            <BottleCard key={pile.id} pile={pile} />
          ))}
        </div>
      </details>
    </section>
  );
}

function BottleCard({ pile }: { pile: StockPile }) {
  const { dispatch } = usePlanner();
  const supply = daysOfSupply(pile);
  const low = isRunningLow(pile);
  const [text, setText] = useState(pile.count === null ? "" : String(pile.count));

  useEffect(() => {
    setText(pile.count === null ? "" : String(pile.count));
  }, [pile.count]);

  return (
    <article className="card" data-testid={`pile-${pile.id}`}>
      <div className="card-top">
        <h3>{pile.name}</h3>
        {pile.paused ? <span className="pill">Off the plan</span> : null}
        {low ? <span className="pill">Running low</span> : null}
      </div>
      {pile.id === "minoxidil" ? <p>A bottle, not counted. It is not given a run-out date.</p> : null}
      {pile.paused ? <p>{pile.pauseReason}</p> : null}
      {supply !== null && !pile.paused ? <p className="quiet">About {supply} days at the current pace.</p> : null}
      {pile.tracked ? (
        <label className="count-field">
          {pile.unit}
          <input
            inputMode="numeric"
            aria-label={`${pile.name} count`}
            value={text}
            onChange={(event) => setText(event.target.value)}
            onBlur={() => {
              if (text.trim() === "") return;
              const count = Number(text);
              if (Number.isFinite(count) && count >= 0) {
                dispatch({ type: "set-count", stockId: pile.id, count });
              }
            }}
          />
        </label>
      ) : null}
      {!pile.paused && pile.id !== "minoxidil" ? (
        <button
          type="button"
          className="switch"
          role="switch"
          aria-checked={pile.inStock}
          data-testid={`stock-switch-${pile.id}`}
          onClick={() => dispatch({ type: "set-in-stock", stockId: pile.id, inStock: !pile.inStock })}
        >
          <span className="switch-knob" />
          {pile.inStock ? "In stock" : "Out of stock"}
        </button>
      ) : null}
    </article>
  );
}

function LabRow() {
  const { state, dispatch } = usePlanner();

  return (
    <label className={state.labDone ? "check-row is-done" : "check-row"}>
      <input
        type="checkbox"
        checked={state.labDone}
        onChange={(event) => dispatch({ type: "set-lab-done", done: event.target.checked })}
      />
      <span>
        <strong>Repeat the labs around {formatPhaseDate(LAB_DATE)}</strong>
        <small>Vitamin D and magnesium. Ask about ferritin before any iron or extra zinc.</small>
      </span>
    </label>
  );
}
