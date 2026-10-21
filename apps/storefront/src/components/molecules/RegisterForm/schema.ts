import { z } from 'zod';

export const registerFormSchema = z.object({
  firstName: z
    .string()
    .nonempty('Συμπλήρωσε το όνομά σου')
    .max(50, 'Το όνομα μπορεί να έχει έως 50 χαρακτήρες'),
  lastName: z
    .string()
    .nonempty('Συμπλήρωσε το επώνυμό σου')
    .max(50, 'Το επώνυμο μπορεί να έχει έως 50 χαρακτήρες'),
  email: z
    .string()
    .nonempty('Συμπλήρωσε το email σου')
    .email('Μη έγκυρο email')
    .max(60, 'Το email μπορεί να έχει έως 60 χαρακτήρες'),
  password: z
    .string()
    .nonempty('Συμπλήρωσε τον κωδικό σου')
    .min(8, 'Ο κωδικός πρέπει να έχει τουλάχιστον 8 χαρακτήρες')
    .regex(/^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])/, {
      message:
        'Ο κωδικός πρέπει να έχει τουλάχιστον ένα κεφαλαίο γράμμα, έναν αριθμό και ένα σύμβολο'
    })
    .max(64, 'Ο κωδικός μπορεί να έχει έως 64 χαρακτήρες'),
  phone: z
    .string()
    .min(6, 'Συμπλήρωσε το τηλέφωνό σου')
    .regex(/^\+?\d+$/, { message: 'Το κινητό πρέπει να περιέχει μόνο αριθμούς' })
    .max(20, 'Το τηλέφωνο μπορεί να έχει έως 20 χαρακτήρες')
});

export type RegisterFormData = z.infer<typeof registerFormSchema>;
