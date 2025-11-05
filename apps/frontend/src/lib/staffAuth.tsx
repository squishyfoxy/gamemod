import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";

type StaffAuthState = {
  isAuthenticated: boolean;
  username: string | null;
  adminKey: string | null;
};

type StaffAuthContextValue = StaffAuthState & {
  login: (input: { username: string; adminKey: string }) => void;
  logout: () => void;
};

const STORAGE_KEY = "gamemod.staff-auth";

const defaultState: StaffAuthState = {
  isAuthenticated: false,
  username: null,
  adminKey: null
};

const StaffAuthContext = createContext<StaffAuthContextValue | undefined>(
  undefined
);

function loadInitialState(): StaffAuthState {
  if (typeof window === "undefined") {
    return defaultState;
  }

  try {
    const stored = window.sessionStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return defaultState;
    }
    const parsed = JSON.parse(stored) as StaffAuthState;
    if (!parsed.adminKey || !parsed.username) {
      return defaultState;
    }
    return {
      ...parsed,
      isAuthenticated: true
    };
  } catch {
    return defaultState;
  }
}

export function StaffAuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<StaffAuthState>(() => loadInitialState());

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    if (!state.isAuthenticated || !state.adminKey || !state.username) {
      window.sessionStorage.removeItem(STORAGE_KEY);
      return;
    }
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const login = useCallback((input: { username: string; adminKey: string }) => {
    setState({
      isAuthenticated: true,
      username: input.username,
      adminKey: input.adminKey
    });
  }, []);

  const logout = useCallback(() => {
    setState(defaultState);
  }, []);

  const value = useMemo(
    () => ({
      ...state,
      login,
      logout
    }),
    [state, login, logout]
  );

  return (
    <StaffAuthContext.Provider value={value}>
      {children}
    </StaffAuthContext.Provider>
  );
}

export function useStaffAuth(): StaffAuthContextValue {
  const value = useContext(StaffAuthContext);
  if (!value) {
    throw new Error("useStaffAuth must be used within StaffAuthProvider");
  }
  return value;
}
