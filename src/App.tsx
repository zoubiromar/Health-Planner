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
  const { view, setView } = usePlanner();

  return (
    <div className="app">
      <aside className="rail">
        <div className="brand">
          <p className="brand-mark">Health Planner</p>
          <p className="brand-note">Appetite, then strength.</p>
        </div>
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
