import { z } from "zod"

export const profilePasswordSchema = z.object({
  newPassword: z.string().nonempty(""),
  confirmPassword: z.string().nonempty("Συμπλήρωσε τον νέο κωδικό"),
})

export type ProfilePasswordFormData = z.infer<typeof profilePasswordSchema>
