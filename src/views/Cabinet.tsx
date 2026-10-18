import { useEffect, useState } from "react";
import { usePlanner } from "../context";
import { cabinetPiles, daysOfSupply, isRunningLow } from "../model/schedule";
import type { StockPile } from "../model/types";

type Segment = "in" | "out" | "paused";

export function Cabinet() {
  const { state } = usePlanner();
  const [segment, setSegment] = useState<Segment>("in");
  const piles = cabinetPiles(state);
  const visible = piles.filter((pile) => groupOf(pile) === segment);
  const kitchen = state.piles.filter((pile) => pile.kitchen);

  return (
    <div data-testid="cabinet-view">
      <header className="page-head">
        <p className="eyebrow">Cabinet</p>
        <h1>In the house</h1>
        <p className="lede">You decide what is in stock. The count is a helper, and you can correct it.</p>
      </header>

      <div className="segments" role="tablist" aria-label="Cabinet">
        {(
          [
            ["in", "In stock"],
            ["out", "Out of stock"],
            ["paused", "Paused"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={segment === id}
            className="segment"
            onClick={() => setSegment(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="empty-inline">Nothing in this group.</p>
      ) : (
        <div className="stack">
          {visible.map((pile) => (
            <PileCard key={pile.id} pile={pile} />
          ))}
        </div>
      )}

      {kitchen.length > 0 ? (
        <section className="section" aria-labelledby="kitchen-title">
          <h2 id="kitchen-title">In the kitchen</h2>
          <div className="stack">
            {kitchen.map((item) => (
              <article key={item.id} className="card">
                <h3>{item.name}</h3>
                <p>{item.pauseReason}</p>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function groupOf(pile: StockPile): Segment {
  if (pile.paused) return "paused";
  if (!pile.inStock) return "out";
  return "in";
}

function PileCard({ pile }: { pile: StockPile }) {
  const { state, dispatch } = usePlanner();
  const supply = daysOfSupply(pile);
  const low = isRunningLow(pile);
  const scheduled = state.items.some((item) => item.stockId === pile.id);
  const [text, setText] = useState(pile.count === null ? "" : String(pile.count));

  useEffect(() => {
    setText(pile.count === null ? "" : String(pile.count));
  }, [pile.count]);

  return (
    <article className="card" data-testid={`pile-${pile.id}`}>
      <div className="card-top">
        <h3>{pile.name}</h3>
        {low ? <span className="pill">Running low</span> : null}
        {pile.count === 0 ? <span className="pill">Count at zero</span> : null}
      </div>
      {supply !== null ? <p className="quiet">About {supply} days at the current pace.</p> : null}
      {pile.pauseReason ? <p>{pile.pauseReason}</p> : null}
      {pile.tracked ? (
        <label className="count-field">
          {pile.unit}
          <input
            inputMode="numeric"
            aria-label={`${pile.name} count`}
            value={text}
            placeholder="Set the count"
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
      <div className="card-actions">
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
        {scheduled ? (
          <button
            type="button"
            className="button button-quiet"
            onClick={() => dispatch({ type: "set-paused", stockId: pile.id, paused: !pile.paused })}
          >
            {pile.paused ? "Put back on the plan" : "Pause"}
          </button>
        ) : null}
      </div>
    </article>
  );
}
