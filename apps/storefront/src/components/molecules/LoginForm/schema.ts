import { z } from "zod"

export const loginFormSchema = z.object({
  email: z.string().nonempty("Συμπλήρωσε το email σου").email("Συμπλήρωσε ένα έγκυρο email"),
  password: z.string().nonempty("Συμπλήρωσε τον κωδικό σου"),
})

export type LoginFormData = z.infer<typeof loginFormSchema>
