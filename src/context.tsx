import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
  type Dispatch,
  type ReactNode,
} from "react";
import { minutesNow, todayISO } from "./model/dates";
import { reducer, type Action } from "./model/reducer";
import { loadState, saveState } from "./model/storage";
import type { PlannerState } from "./model/types";

export type View = "today" | "plan" | "cabinet" | "groceries";

interface PlannerContextValue {
  state: PlannerState;
  dispatch: Dispatch<Action>;
  view: View;
  setView: (view: View) => void;
  selectedDate: string;
  setSelectedDate: (iso: string) => void;
  today: string;
  minutes: number;
  alertsOpen: boolean;
  setAlertsOpen: (open: boolean) => void;
}

const PlannerContext = createContext<PlannerContextValue | null>(null);

export function PlannerProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, () =>
    reducer(loadState(), { type: "sync-food-week", today: todayISO() }),
  );
  const [view, setView] = useState<View>("today");
  const [clock, setClock] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(() => todayISO());
  const [alertsOpen, setAlertsOpen] = useState(false);

  const today = todayISO(clock);
  const minutes = minutesNow(clock);

  useEffect(() => {
    const id = window.setInterval(() => setClock(new Date()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    dispatch({ type: "sync-food-week", today });
  }, [today]);

  useEffect(() => {
    saveState(state);
  }, [state]);

  const value = useMemo(
    () => ({
      state,
      dispatch,
      view,
      setView,
      selectedDate,
      setSelectedDate,
      today,
      minutes,
      alertsOpen,
      setAlertsOpen,
    }),
    [state, view, selectedDate, today, minutes, alertsOpen],
  );

  return <PlannerContext.Provider value={value}>{children}</PlannerContext.Provider>;
}

export function usePlanner(): PlannerContextValue {
  const value = useContext(PlannerContext);
  if (!value) throw new Error("usePlanner must be used inside PlannerProvider");
  return value;
}
