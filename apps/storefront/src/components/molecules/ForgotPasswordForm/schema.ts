import { z } from "zod"

export const forgotPasswordSchema = z.object({
  email: z.string().nonempty("Συμπλήρωσε το email σου").email("Συμπλήρωσε ένα έγκυρο email"),
})

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>
