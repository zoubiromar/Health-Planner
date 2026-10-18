import { useState } from "react";
import { usePlanner } from "../context";
import { formatPhaseDate } from "../model/dates";
import { isRunningLow, refillPiles } from "../model/schedule";
import { LAB_DATE, type StockPile } from "../model/types";

export function Groceries() {
  const { state, dispatch } = usePlanner();
  const refills = refillPiles(state);
  const perfectil = state.piles.find((pile) => pile.id === "perfectil");
  const perfectilNeedsAttention = Boolean(
    perfectil && !perfectil.paused && (!perfectil.inStock || isRunningLow(perfectil) || perfectil.count === 0),
  );

  return (
    <div data-testid="groceries-view">
      <header className="page-head">
        <p className="eyebrow">Groceries</p>
        <h1>Nothing has to be bought first</h1>
        <p className="lede">Food resets each week. A supplement comes back onto Today when you mark it bought.</p>
      </header>

      <section className="section" aria-labelledby="food-title">
        <h2 id="food-title">This week</h2>
        {state.foods.length === 0 ? (
          <p className="empty-inline">No grocery list on this plan.</p>
        ) : (
          <div className="stack">
            {state.foods.map((food) => (
              <label key={food.id} className={food.bought ? "check-row is-done" : "check-row"}>
                <input
                  type="checkbox"
                  checked={food.bought}
                  data-testid={`food-${food.id}`}
                  onChange={() => dispatch({ type: "toggle-food", id: food.id })}
                />
                <span>
                  <strong>{food.name}</strong>
                  <small>{food.note}</small>
                </span>
              </label>
            ))}
          </div>
        )}
      </section>

      {!state.blank ? (
        <section className="section" aria-labelledby="refill-title">
          <h2 id="refill-title">Refills</h2>
          {refills.length === 0 ? (
            <p className="empty-inline">Nothing is running low.</p>
          ) : (
            <div className="stack">
              {refills.map((pile) => (
                <RefillCard key={pile.id} pile={pile} />
              ))}
            </div>
          )}
        </section>
      ) : null}

      {state.optionalBuys.length > 0 ? (
        <section className="section" aria-labelledby="optional-title">
          <h2 id="optional-title">Optional</h2>
          <div className="stack">
            {state.optionalBuys.map((buy) => (
              <OptionalCard
                key={buy.id}
                id={buy.id}
                name={buy.name}
                reason={buy.reason}
                addCount={buy.addCount}
                extra={
                  buy.kind === "perfectil" && perfectilNeedsAttention
                    ? "Perfectil is low or out of stock, so its lunch row will stay quiet until you refill."
                    : undefined
                }
              />
            ))}
          </div>
        </section>
      ) : null}

      {state.foods.length > 0 ? (
        <section className="section" aria-labelledby="lab-title">
          <h2 id="lab-title">Later</h2>
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
        </section>
      ) : null}
    </div>
  );
}

function RefillCard({ pile }: { pile: StockPile }) {
  const { dispatch } = usePlanner();
  const [add, setAdd] = useState(String(pile.bottleSize || 1));
  const out = !pile.inStock;

  return (
    <article className="card">
      <h3>{pile.name}</h3>
      <p>
        {out
          ? "Marked out of stock. Today keeps the row, quietly, until you refill."
          : "About a week left at the current pace."}
      </p>
      <label className="count-field">
        How many are you adding?
        <input
          inputMode="numeric"
          value={add}
          aria-label={`Add ${pile.name}`}
          onChange={(event) => setAdd(event.target.value)}
        />
      </label>
      <button
        type="button"
        className="button button-primary"
        data-testid={`buy-${pile.id}`}
        onClick={() => {
          const amount = Number(add);
          if (amount > 0) dispatch({ type: "restock", stockId: pile.id, add: amount });
        }}
      >
        I bought this
      </button>
    </article>
  );
}

function OptionalCard({
  id,
  name,
  reason,
  addCount,
  extra,
}: {
  id: string;
  name: string;
  reason: string;
  addCount: number;
  extra?: string;
}) {
  const { dispatch } = usePlanner();
  const [add, setAdd] = useState(String(addCount));

  return (
    <article className="card">
      <h3>{name}</h3>
      <p>{reason}</p>
      {extra ? <p className="flag">{extra}</p> : null}
      <label className="count-field">
        How many are you adding?
        <input
          inputMode="numeric"
          value={add}
          aria-label={`Add ${name}`}
          onChange={(event) => setAdd(event.target.value)}
        />
      </label>
      <button
        type="button"
        className="button button-primary"
        data-testid={`optional-${id}`}
        onClick={() => {
          const amount = Number(add);
          if (amount > 0) dispatch({ type: "buy-optional", id, add: amount });
        }}
      >
        I bought this
      </button>
    </article>
  );
}
