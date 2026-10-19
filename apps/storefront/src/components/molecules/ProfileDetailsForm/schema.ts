import { z } from "zod"

export const profileDetailsSchema = z.object({
  firstName: z.string().nonempty("Το όνομα είναι υποχρεωτικό"),
  lastName: z.string().nonempty("Το επώνυμο είναι υποχρεωτικό"),
  phone: z.string().nonempty("Το τηλέφωνο είναι υποχρεωτικό"),
  email: z.string().nonempty("Το email είναι υποχρεωτικό"),
})

export type ProfileDetailsFormData = z.infer<typeof profileDetailsSchema>
