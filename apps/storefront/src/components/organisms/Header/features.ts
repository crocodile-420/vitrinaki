// What the «Δυνατότητες» menu lists. Only what exists today links to it; what
// is still being built carries `soon` and points to the «Σύντομα» tiles on the
// homepage, never to a page of its own.

export type FeatureIcon =
  | "template"
  | "globe"
  | "questions"
  | "lang"
  | "store"
  | "phone"
  | "megaphone"
  | "box"
  | "orders"
  | "profile"
  | "card"
  | "doc"
  | "calendar"

export type FeatureItem = { label: string; text: string; href: string; icon: FeatureIcon; soon?: true }
export type FeatureGroup = { title: string; items: FeatureItem[] }

// `href` is locale-relative ("/start" becomes "/gr/start").
export const featureGroups: FeatureGroup[] = [
  {
    title: "Φτιάξε τη βιτρίνα σου",
    items: [
      { label: "Πρότυπα & χρώματα", text: "Ξεκινάς από ένα ύφος και το κάνεις δικό σου.", href: "/#examples", icon: "template" },
      { label: "Δικό σου domain", text: "vitrinaki.gr/το-όνομά-σου ή η δική σου διεύθυνση.", href: "/#included", icon: "globe" },
      { label: "Ερωτήσεις που στήνουν τη σελίδα", text: "Απαντάς σε λίγες ερωτήσεις, η σελίδα στήνεται μόνη της.", href: "/start", icon: "questions" },
      { label: "Ελληνικά & Αγγλικά", text: "Το κατάστημά σου μιλά τη γλώσσα των πελατών σου.", href: "/#included", icon: "lang" },
    ],
  },
  {
    title: "Πούλα",
    items: [
      { label: "Online κατάστημα", text: "Καλάθι και παραγγελίες, ανοιχτά όλο το εικοσιτετράωρο.", href: "/#included", icon: "store" },
      { label: "Έτοιμο για κινητά", text: "Ίδιο κατάστημα σε κάθε οθόνη, χωρίς ρυθμίσεις.", href: "/#examples", icon: "phone" },
      { label: "Προβολή στο vitrinaki.gr", text: "Η βιτρίνα σου ανάμεσα στις επιχειρήσεις του Vitrinaki.", href: "/#vitrina", icon: "megaphone" },
    ],
  },
  {
    title: "Διαχειρίσου",
    items: [
      { label: "Προϊόντα & απόθεμα", text: "Βλέπεις τι τελειώνει και ενημερώνεις με ένα κλικ.", href: "/#included", icon: "box" },
      { label: "Παραγγελίες", text: "Κάθε παραγγελία σε ένα σημείο, από τη στιγμή που έρχεται.", href: "/#how-it-works", icon: "orders" },
      { label: "Προφίλ ανά είδος επιχείρησης", text: "Ωράριο, υπηρεσίες ή προέλευση, ανάλογα με το τι κάνεις.", href: "/#for-whom", icon: "profile" },
    ],
  },
  {
    title: "Πληρωμές & τιμολόγια",
    items: [
      { label: "Πληρωμές με κάρτα", text: "Οι πελάτες σου πληρώνουν απευθείας στο κατάστημά σου.", href: "/#included", icon: "card", soon: true },
      { label: "Τιμολόγια myDATA", text: "Παραστατικά με διασύνδεση στο myDATA της ΑΑΔΕ.", href: "/#included", icon: "doc", soon: true },
      { label: "Κρατήσεις online", text: "Ραντεβού και κρατήσεις για όσους προσφέρουν υπηρεσίες.", href: "/#included", icon: "calendar", soon: true },
    ],
  },
]
