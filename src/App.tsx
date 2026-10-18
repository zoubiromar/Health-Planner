import { AlertsDialog } from "./components/AlertsDialog";
import { Disclaimer } from "./components/Disclaimer";
import { IconGroceries, IconPlan, IconToday } from "./components/Icons";
import { usePlanner, type View } from "./context";
import { Groceries } from "./views/Groceries";
import { Plan } from "./views/Plan";
import { Today } from "./views/Today";

const NAV: { id: View; label: string; icon: typeof IconToday }[] = [
  { id: "today", label: "Today", icon: IconToday },
  { id: "plan", label: "Plan", icon: IconPlan },
  { id: "groceries", label: "Groceries", icon: IconGroceries },
];

export function App() {
  const { state, dispatch, view, setView } = usePlanner();

  return (
    <div className="app">
      <header className="topbar">
        <p className="brand-mark">
          <span className="mark" aria-hidden="true">
            🍵
          </span>
          Health Planner
        </p>
        <div className="theme-switch" role="group" aria-label="Theme">
          <button
            type="button"
            aria-pressed={state.theme === "daylight"}
            onClick={() => dispatch({ type: "set-theme", theme: "daylight" })}
          >
            ☀️ Daylight
          </button>
          <button
            type="button"
            aria-pressed={state.theme === "lamp"}
            onClick={() => dispatch({ type: "set-theme", theme: "lamp" })}
          >
            🌙 Lamp
          </button>
        </div>
      </header>
      <aside className="rail">
        <nav className="rail-nav" aria-label="Sections">
          {NAV.map((item) => (
            <button
              key={item.id}
              type="button"
              className="rail-link"
              aria-current={view === item.id ? "page" : undefined}
              onClick={() => setView(item.id)}
            >
              <item.icon />
              {item.label}
            </button>
          ))}
        </nav>
      </aside>
      <main className="main">
        {view === "today" ? <Today /> : null}
        {view === "plan" ? <Plan /> : null}
        {view === "groceries" ? <Groceries /> : null}
      </main>
      <nav className="tabs" aria-label="Sections">
        {NAV.map((item) => (
          <button
            key={item.id}
            type="button"
            className="tab"
            data-testid={`nav-${item.id}`}
            aria-current={view === item.id ? "page" : undefined}
            onClick={() => setView(item.id)}
          >
            <item.icon />
            {item.label}
          </button>
        ))}
      </nav>
      <Disclaimer />
      <AlertsDialog />
    </div>
  );
}
