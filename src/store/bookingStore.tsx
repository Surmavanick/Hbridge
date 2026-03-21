import { createContext, useContext, useReducer, useCallback, useEffect, ReactNode } from "react";
import { BookingRequest, BookingStatus } from "@/data/mockData";
import { supabase } from "@/lib/supabase";

// ─── Helpers: convert between camelCase (app) and snake_case (DB) ──────

function toRow(b: BookingRequest): Record<string, unknown> {
  return {
    id: b.id,
    patient_name: b.patientName,
    patient_email: b.patientEmail,
    patient_phone: b.patientPhone,
    country: b.country,
    country_flag: b.countryFlag ?? "",
    procedure_id: b.procedureId,
    hospital_id: b.hospitalId ?? null,
    preferred_date_start: b.preferredDateStart,
    preferred_date_end: b.preferredDateEnd,
    status: b.status,
    uploaded_files: b.uploadedFiles ?? [],
    notes: b.notes ?? "",
    created_at: b.createdAt,
    hospital_response: b.hospitalResponse ?? null,
    doctor_id: b.doctorId ?? null,
    sessions: b.sessions ?? [],
    referral_code: b.referralCode ?? null,
    assigned_partner_id: b.assignedPartnerId ?? null,
    budget: b.budget ?? null,
    consultation_link: b.consultationLink ?? null,
    consultation_scheduled_at: b.consultationScheduledAt ?? null,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fromRow(r: any): BookingRequest {
  return {
    id: r.id,
    patientName: r.patient_name,
    patientEmail: r.patient_email,
    patientPhone: r.patient_phone ?? "",
    country: r.country ?? "",
    countryFlag: r.country_flag ?? "",
    procedureId: r.procedure_id,
    hospitalId: r.hospital_id ?? undefined,
    preferredDateStart: r.preferred_date_start ?? "",
    preferredDateEnd: r.preferred_date_end ?? "",
    status: r.status as BookingStatus,
    uploadedFiles: r.uploaded_files ?? [],
    notes: r.notes ?? "",
    createdAt: r.created_at,
    hospitalResponse: r.hospital_response ?? undefined,
    doctorId: r.doctor_id ?? undefined,
    sessions: r.sessions ?? [],
    referralCode: r.referral_code ?? undefined,
    assignedPartnerId: r.assigned_partner_id ?? null,
    budget: r.budget ?? undefined,
    consultationLink: r.consultation_link ?? undefined,
    consultationScheduledAt: r.consultation_scheduled_at ?? undefined,
  };
}

// ─── State ────────────────────────────────────────────────────────────

interface BookingState {
  bookings: BookingRequest[];
  loading: boolean;
}

type BookingAction =
  | { type: "UPDATE_STATUS"; id: string; status: BookingStatus }
  | { type: "UPDATE_BOOKING"; id: string; patch: Partial<BookingRequest> }
  | { type: "ADD_BOOKING"; booking: BookingRequest }
  | { type: "DELETE_BOOKING"; id: string }
  | { type: "SET_BOOKINGS"; bookings: BookingRequest[] }
  | { type: "ASSIGN_BOOKING"; id: string; partnerId: string }
  | { type: "SET_LOADING"; loading: boolean };

function bookingReducer(state: BookingState, action: BookingAction): BookingState {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, loading: action.loading };
    case "SET_BOOKINGS":
      return { ...state, bookings: action.bookings, loading: false };
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
    default:
      return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────────

interface BookingContextValue {
  bookings: BookingRequest[];
  loading: boolean;
  updateStatus: (id: string, status: BookingStatus) => void;
  updateBooking: (id: string, patch: Partial<BookingRequest>) => void;
  addBooking: (booking: BookingRequest) => void;
  deleteBooking: (id: string) => void;
  assignBooking: (id: string, partnerId: string) => void;
}

const BookingContext = createContext<BookingContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────

export function BookingProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(bookingReducer, { bookings: [], loading: true });

  // Load all bookings from Supabase on mount
  useEffect(() => {
    supabase
      .from("bookings")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) { console.error("Supabase load error:", error); dispatch({ type: "SET_LOADING", loading: false }); return; }
        dispatch({ type: "SET_BOOKINGS", bookings: (data ?? []).map(fromRow) });
      });

    // Real-time: listen for changes from other sessions
    const channel = supabase
      .channel("bookings-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "bookings" }, () => {
        supabase
          .from("bookings")
          .select("*")
          .order("created_at", { ascending: false })
          .then(({ data }) => {
            if (data) dispatch({ type: "SET_BOOKINGS", bookings: data.map(fromRow) });
          });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const updateStatus = useCallback((id: string, status: BookingStatus) => {
    dispatch({ type: "UPDATE_STATUS", id, status });
    supabase.from("bookings").update({ status }).eq("id", id).then(({ error }) => {
      if (error) console.error("updateStatus error:", error);
    });
  }, []);

  const updateBooking = useCallback((id: string, patch: Partial<BookingRequest>) => {
    dispatch({ type: "UPDATE_BOOKING", id, patch });
    const booking = patch as BookingRequest;
    const row = toRow({ ...booking, id } as BookingRequest);
    // Only send fields that are in the patch
    const patchRow: Record<string, unknown> = {};
    if (patch.status !== undefined) patchRow.status = patch.status;
    if (patch.hospitalId !== undefined) patchRow.hospital_id = patch.hospitalId;
    if (patch.hospitalResponse !== undefined) patchRow.hospital_response = patch.hospitalResponse;
    if (patch.doctorId !== undefined) patchRow.doctor_id = patch.doctorId;
    if (patch.sessions !== undefined) patchRow.sessions = patch.sessions;
    if (patch.uploadedFiles !== undefined) patchRow.uploaded_files = patch.uploadedFiles;
    if (patch.notes !== undefined) patchRow.notes = patch.notes;
    if (patch.assignedPartnerId !== undefined) patchRow.assigned_partner_id = patch.assignedPartnerId;
    if (patch.budget !== undefined) patchRow.budget = patch.budget;
    if (patch.consultationLink !== undefined) patchRow.consultation_link = patch.consultationLink;
    if (patch.consultationScheduledAt !== undefined) patchRow.consultation_scheduled_at = patch.consultationScheduledAt;
    if (patch.referralCode !== undefined) patchRow.referral_code = patch.referralCode;
    void row;
    supabase.from("bookings").update(patchRow).eq("id", id).then(({ error }) => {
      if (error) console.error("updateBooking error:", error);
    });
  }, []);

  const addBooking = useCallback((booking: BookingRequest) => {
    dispatch({ type: "ADD_BOOKING", booking });
    supabase.from("bookings").insert(toRow(booking)).then(({ error }) => {
      if (error) console.error("addBooking error:", error);
    });
  }, []);

  const deleteBooking = useCallback((id: string) => {
    dispatch({ type: "DELETE_BOOKING", id });
    supabase.from("bookings").delete().eq("id", id).then(({ error }) => {
      if (error) console.error("deleteBooking error:", error);
    });
  }, []);

  const assignBooking = useCallback((id: string, partnerId: string) => {
    dispatch({ type: "ASSIGN_BOOKING", id, partnerId });
    supabase.from("bookings").update({ assigned_partner_id: partnerId }).eq("id", id).then(({ error }) => {
      if (error) console.error("assignBooking error:", error);
    });
  }, []);

  return (
    <BookingContext.Provider value={{
      bookings: state.bookings,
      loading: state.loading,
      updateStatus,
      updateBooking,
      addBooking,
      deleteBooking,
      assignBooking,
    }}>
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
