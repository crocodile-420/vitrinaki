// Kinds of business that sell their time by appointment (mirrors
// packages/api/src/lib/vitrinaki-profile.ts): their page leads with the price
// list and the booking.
export const APPOINTMENT_TYPES = ["beauty", "fitness", "lessons", "health", "professional", "events", "services"]

export const isAppointmentType = (type: string | null | undefined) => APPOINTMENT_TYPES.includes(type || "")
