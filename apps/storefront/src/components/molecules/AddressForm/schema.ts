import { z } from "zod"

export const addressSchema = z.object({
  addressId: z.string().optional(),
  addressName: z.string().nonempty("Το όνομα διεύθυνσης είναι υποχρεωτικό"),
  firstName: z.string().nonempty("Το όνομα είναι υποχρεωτικό"),
  lastName: z.string().nonempty("Το επώνυμο είναι υποχρεωτικό"),
  address: z.string().nonempty("Η διεύθυνση είναι υποχρεωτική"),
  city: z.string().nonempty("Η πόλη είναι υποχρεωτική"),
  countryCode: z.string().nonempty("Η χώρα είναι υποχρεωτική"),
  postalCode: z.string().nonempty("Ο ταχυδρομικός κώδικας είναι υποχρεωτικός"),
  company: z.string().optional(),
  province: z.string().optional(),
  phone: z
    .string()
    .nonempty("Το τηλέφωνο είναι υποχρεωτικό")
    .regex(/^\+?[0-9\s\-()]+$/, "Μη έγκυρος αριθμός τηλεφώνου"),
  metadata: z.record(z.string(), z.any()).optional(),
})

export type AddressFormData = z.infer<typeof addressSchema>
