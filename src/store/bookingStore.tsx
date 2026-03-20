/**
 * Booking Store — React Context + useReducer
 *
 * Single source of truth for all booking data.
 * Both admin and patient pages read from and write to this store,
 * so any status change (drag & drop on admin, patient self-update)
 * is immediately reflected everywhere in the app.
 *
 * ─── Real-time in production ────────────────────────────────────────
 * To propagate changes across browser sessions / devices:
 *
 * Option A — WebSocket (recommended)
 *   const ws = new WebSocket("wss://api.healthbridge.com/bookings");
 *   ws.onmessage = (e) => {
 *     const { type, payload } = JSON.parse(e.data);
 *     if (type === "STATUS_CHANGED") dispatch({ type: "UPDATE_STATUS", ...payload });
 *     if (type === "BOOKING_ADDED")  dispatch({ type: "ADD_BOOKING", booking: payload });
 *   };
 *
 * Option B — Server-Sent Events (SSE, read-only push)
 *   const es = new EventSource("/api/bookings/stream");
 *   es.onmessage = (e) => dispatch({ type: "ADD_BOOKING", booking: JSON.parse(e.data) });
 *
 * Option C — HTTP polling (simplest, less ideal)
 *   useEffect(() => {
 *     const interval = setInterval(async () => {
 *       const data = await fetch("/api/bookings").then(r => r.json());
 *       dispatch({ type: "SET_BOOKINGS", bookings: data });
 *     }, 5000);
 *     return () => clearInterval(interval);
 *   }, []);
 * ────────────────────────────────────────────────────────────────────
 */

import { createContext, useContext, useReducer, useCallback, useEffect, ReactNode } from "react";
import { BookingRequest, BookingStatus, mockBookings } from "@/data/mockData";

// ─── State ────────────────────────────────────────────────────────────

interface BookingState {
  bookings: BookingRequest[];
}

// ─── Actions ──────────────────────────────────────────────────────────

type BookingAction =
  | { type: "UPDATE_STATUS"; id: string; status: BookingStatus }
  | { type: "UPDATE_BOOKING"; id: string; patch: Partial<BookingRequest> }
  | { type: "ADD_BOOKING"; booking: BookingRequest }
  | { type: "DELETE_BOOKING"; id: string }
  | { type: "SET_BOOKINGS"; bookings: BookingRequest[] }
  | { type: "ASSIGN_BOOKING"; id: string; partnerId: string };

function bookingReducer(state: BookingState, action: BookingAction): BookingState {
  switch (action.type) {
    case "UPDATE_STATUS":
      return {
        ...state,
        bookings: state.bookings.map((b) =>
          b.id === action.id ? { ...b, status: action.status } : b
        ),
      };
    case "UPDATE_BOOKING":
      return {
        ...state,
        bookings: state.bookings.map((b) =>
          b.id === action.id ? { ...b, ...action.patch } : b
        ),
      };
    case "ADD_BOOKING":
      return { ...state, bookings: [action.booking, ...state.bookings] };
    case "DELETE_BOOKING":
      return { ...state, bookings: state.bookings.filter((b) => b.id !== action.id) };
    case "ASSIGN_BOOKING":
      return {
        ...state,
        bookings: state.bookings.map((b) =>
          b.id === action.id ? { ...b, assignedPartnerId: action.partnerId } : b
        ),
      };
    case "SET_BOOKINGS":
      return { ...state, bookings: action.bookings };
    default:
      return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────────

interface BookingContextValue {
  bookings: BookingRequest[];
  updateStatus: (id: string, status: BookingStatus) => void;
  updateBooking: (id: string, patch: Partial<BookingRequest>) => void;
  addBooking: (booking: BookingRequest) => void;
  deleteBooking: (id: string) => void;
  assignBooking: (id: string, partnerId: string) => void;
}

const BookingContext = createContext<BookingContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────

const STORAGE_KEY = "healthbridge_bookings";
const STORAGE_VERSION_KEY = "healthbridge_bookings_version";
const CURRENT_VERSION = "v3"; // bump when mock data is wiped

function loadBookings(): BookingRequest[] {
  try {
    // If stored version differs, clear old data (wipes mock bookings cache)
    const storedVersion = localStorage.getItem(STORAGE_VERSION_KEY);
    if (storedVersion !== CURRENT_VERSION) {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.setItem(STORAGE_VERSION_KEY, CURRENT_VERSION);
      return mockBookings; // empty array now
    }
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved) as BookingRequest[];
  } catch {}
  return mockBookings;
}

function saveBookings(bookings: BookingRequest[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
  } catch {}
}

export function BookingProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(bookingReducer, { bookings: loadBookings() });

  useEffect(() => { saveBookings(state.bookings); }, [state.bookings]);

  const updateStatus = useCallback((id: string, status: BookingStatus) => {
    dispatch({ type: "UPDATE_STATUS", id, status });
  }, []);

  const updateBooking = useCallback((id: string, patch: Partial<BookingRequest>) => {
    dispatch({ type: "UPDATE_BOOKING", id, patch });
  }, []);

  const addBooking = useCallback((booking: BookingRequest) => {
    dispatch({ type: "ADD_BOOKING", booking });
  }, []);

  const deleteBooking = useCallback((id: string) => {
    dispatch({ type: "DELETE_BOOKING", id });
  }, []);

  const assignBooking = useCallback((id: string, partnerId: string) => {
    dispatch({ type: "ASSIGN_BOOKING", id, partnerId });
  }, []);

  return (
    <BookingContext.Provider value={{ bookings: state.bookings, updateStatus, updateBooking, addBooking, deleteBooking, assignBooking }}>
      {children}
    </BookingContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────

export function useBookings() {
  const ctx = useContext(BookingContext);
  if (!ctx) throw new Error("useBookings must be used inside <BookingProvider>");
  return ctx;
}
