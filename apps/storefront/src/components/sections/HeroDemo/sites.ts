/* Example websites for the homepage: different kinds of business from around Greece, each
   with its own name, address and colours. They are examples, not customers. */

export type SitePalette = { key: string; label: string; page: string; ink: string; accent: string; soft: string }

export const palettes: SitePalette[] = [
  { key: "tile", label: "Κεραμιδί", page: "#FBF6F1", ink: "#5A2A1F", accent: "#C0503C", soft: "#F3DDD3" },
  { key: "cypress", label: "Κυπαρισσί", page: "#F7F2E8", ink: "#1F3628", accent: "#2E4A37", soft: "#E4E8DA" },
  { key: "aegean", label: "Μπλε", page: "#F4F8FB", ink: "#173A57", accent: "#265E8E", soft: "#DBE6F0" },
]

const [tile, cypress, aegean] = palettes
const rose: SitePalette = { key: "rose", label: "Ρόδι", page: "#FBF4F2", ink: "#4A2430", accent: "#A8475A", soft: "#F2DDE0" }
const olive: SitePalette = { key: "olive", label: "Ελιά", page: "#F8F5EC", ink: "#34361F", accent: "#6B6B2E", soft: "#E9E6CF" }
const ink: SitePalette = { key: "ink", label: "Νύχτα", page: "#F5F6F8", ink: "#17212E", accent: "#2F5BD3", soft: "#E1E7F3" }

export type SiteIcon = "leaf" | "bag" | "bed" | "map" | "doc" | "code" | "book" | "home" | "brush"

export type Site = {
  key: string
  industry: string
  place: string
  icon: SiteIcon
  name: string
  slug: string
  palette: SitePalette
  nav: string[]
  cta: string
  hero: { eyebrow: string; title: string; text: string; button: string; img?: string; pos?: string; art?: "booking" | "tech" | "courses" }
  section: string
  cards: { title: string; meta: string; price?: string; img?: string; pos?: string }[]
}

export const sites: Site[] = [
  {
    key: "food",
    industry: "Τοπικά προϊόντα",
    place: "Κρήτη",
    icon: "leaf",
    name: "Λιοστάσι Κρήτης",
    slug: "liostasi",
    palette: olive,
    nav: ["Προϊόντα", "Η ιστορία μας", "Επικοινωνία"],
    cta: "Καλάθι",
    hero: { eyebrow: "Οικογενειακή παραγωγή", title: "Λάδι και μέλι από τον τόπο μας", text: "Παρθένο ελαιόλαδο, θυμαρίσιο μέλι και τυριά, κατευθείαν στην πόρτα σου.", button: "Δες τα προϊόντα", img: "/home/scene-local.webp", pos: "30% center" },
    section: "Δημοφιλή προϊόντα",
    cards: [
      { title: "Ελαιόλαδο 500ml", meta: "Παρθένο, ψυχρής έκθλιψης", price: "12,00 €", img: "/home/site-oil.webp" },
      { title: "Θυμαρίσιο μέλι", meta: "Βάζο 450g", price: "9,50 €", img: "/home/site-honey.webp" },
      { title: "Ελιές Καλαμών", meta: "Σε άλμη, 300g", price: "5,80 €", img: "/home/site-olives.webp" },
    ],
  },
  {
    key: "services",
    industry: "Επαγγελματικές υπηρεσίες",
    place: "Λάρισα",
    icon: "doc",
    name: "Νικολάου Λογιστικό Γραφείο",
    slug: "nikolaou-logistiko",
    palette: aegean,
    nav: ["Υπηρεσίες", "Το γραφείο", "Επικοινωνία"],
    cta: "Κλείσε ραντεβού",
    hero: { eyebrow: "Από το 1998", title: "Τα λογιστικά σου, σε σίγουρα χέρια", text: "Τήρηση βιβλίων, μισθοδοσία και φορολογικά για επαγγελματίες και μικρές επιχειρήσεις.", button: "Κλείσε ραντεβού", art: "booking" },
    section: "Υπηρεσίες",
    cards: [
      { title: "Τήρηση βιβλίων", meta: "Για ατομικές και εταιρείες" },
      { title: "Μισθοδοσία", meta: "Μηνιαία, με όλες τις δηλώσεις" },
      { title: "Έναρξη επιχείρησης", meta: "Από την ιδέα στο ΓΕΜΗ" },
    ],
  },
  {
    key: "stay",
    industry: "Φιλοξενία",
    place: "Ναύπλιο",
    icon: "bed",
    name: "Αρχοντικό Ναυπλίου",
    slug: "archontiko-nafpliou",
    palette: tile,
    nav: ["Δωμάτια", "Πρωινό", "Η πόλη"],
    cta: "Κράτηση",
    hero: { eyebrow: "Ξενώνας στην παλιά πόλη", title: "Μείνε στην καρδιά του Ναυπλίου", text: "Έξι δωμάτια σε αρχοντικό του 19ου αιώνα, δύο βήματα από τη θάλασσα.", button: "Δες τα δωμάτια", img: "/home/kinds/stay-room.webp", pos: "center" },
    section: "Τα δωμάτιά μας",
    cards: [
      { title: "Δίκλινο δωμάτιο", meta: "2 άτομα · θέα στην αυλή", price: "από 85 €", img: "/home/kinds/stay-double.webp" },
      { title: "Σουίτα με σαλόνι", meta: "4 άτομα · 45 τ.μ.", price: "από 140 €", img: "/home/kinds/stay-suite.webp" },
      { title: "Πρωινό", meta: "Με τοπικά προϊόντα", price: "περιλαμβάνεται", img: "/home/kinds/stay-breakfast.webp" },
    ],
  },
  {
    key: "tech",
    industry: "Τεχνολογία",
    place: "Ηράκλειο",
    icon: "code",
    name: "Kymata Labs",
    slug: "kymata-labs",
    palette: ink,
    nav: ["Λύσεις", "Έργα", "Ομάδα"],
    cta: "Μίλα μαζί μας",
    hero: { eyebrow: "Software για μικρές επιχειρήσεις", title: "Εφαρμογές που δουλεύουν για σένα", text: "Σχεδιάζουμε και φτιάχνουμε εφαρμογές, αυτοματισμούς και υποδομές cloud.", button: "Ζήτα προσφορά", art: "tech" },
    section: "Τι κάνουμε",
    cards: [
      { title: "Web & mobile εφαρμογές", meta: "Από το σχέδιο στο App Store" },
      { title: "Αυτοματισμοί", meta: "Λιγότερη χειροκίνητη δουλειά" },
      { title: "Cloud & υποστήριξη", meta: "Παρακολούθηση 24/7" },
    ],
  },
  {
    key: "fashion",
    industry: "Μόδα & αξεσουάρ",
    place: "Αθήνα",
    icon: "bag",
    name: "Lumière",
    slug: "lumiere",
    palette: rose,
    nav: ["Νέα", "Συλλογή", "Αξεσουάρ"],
    cta: "Καλάθι",
    hero: { eyebrow: "Νέα συλλογή", title: "Ρούχα με χαρακτήρα, για κάθε μέρα", text: "Μικρές σειρές από ελληνικά εργαστήρια, σε φυσικά υφάσματα.", button: "Ανακάλυψε", img: "/home/scene-boutique-760.webp", pos: "60% 20%" },
    section: "Νέες αφίξεις",
    cards: [
      { title: "Λινό πουκάμισο", meta: "3 χρώματα", price: "48,00 €", img: "/home/site-look-1.webp" },
      { title: "Πλεκτό πουλόβερ", meta: "Μαλλί merino", price: "62,00 €", img: "/home/t-fashion.webp", pos: "center 70%" },
      { title: "Μεταξωτό μαντήλι", meta: "Χειροποίητο", price: "29,00 €", img: "/home/site-look-3.webp" },
    ],
  },
  {
    key: "tours",
    industry: "Τουρισμός",
    place: "Νάξος",
    icon: "map",
    name: "Naxos Trails",
    slug: "naxos-trails",
    palette: aegean,
    nav: ["Εμπειρίες", "Πρόγραμμα", "Σχετικά"],
    cta: "Κράτηση",
    hero: { eyebrow: "Μικρές ομάδες, τοπικοί οδηγοί", title: "Γνώρισε τη Νάξο με τα πόδια", text: "Πεζοπορίες σε ορεινά χωριά, γευσιγνωσία και ηλιοβασιλέματα στη θάλασσα.", button: "Δες τις εμπειρίες", img: "/home/kinds/tours-island.webp", pos: "center" },
    section: "Εμπειρίες",
    cards: [
      { title: "Τα ορεινά χωριά", meta: "Πεζοπορία · 5 ώρες", price: "45 €", img: "/home/kinds/tours-hike.webp" },
      { title: "Γεύσεις του νησιού", meta: "Γευσιγνωσία · 3 ώρες", price: "55 €", img: "/home/kinds/tours-taste.webp" },
      { title: "Ηλιοβασίλεμα στην ακτή", meta: "Βόλτα · 2 ώρες", price: "30 €", img: "/home/kinds/tours-sunset.webp" },
    ],
  },
  {
    key: "school",
    industry: "Εκπαίδευση",
    place: "Πάτρα",
    icon: "book",
    name: "Φροντιστήριο Γνώση",
    slug: "frontistirio-gnosi",
    palette: cypress,
    nav: ["Μαθήματα", "Πρόγραμμα", "Εγγραφές"],
    cta: "Εγγραφή",
    hero: { eyebrow: "Εγγραφές για τη νέα χρονιά", title: "Μαθήματα που σε πάνε μπροστά", text: "Ολιγομελή τμήματα για Γυμνάσιο και Λύκειο, στην τάξη ή online.", button: "Δες το πρόγραμμα", art: "courses" },
    section: "Τμήματα",
    cards: [
      { title: "Μαθηματικά Λυκείου", meta: "Δευτέρα & Πέμπτη · 6 μαθητές" },
      { title: "Αγγλικά B2 / C2", meta: "Online ή στην τάξη" },
      { title: "Προετοιμασία Πανελλαδικών", meta: "Όλο το χρόνο" },
    ],
  },
  {
    key: "property",
    industry: "Ακίνητα",
    place: "Χαλκιδική",
    icon: "home",
    name: "Κτήματα Χαλκιδικής",
    slug: "ktimata-chalkidikis",
    palette: cypress,
    nav: ["Πώληση", "Ενοικίαση", "Επικοινωνία"],
    cta: "Ζήτα ραντεβού",
    hero: { eyebrow: "Μεσιτικό γραφείο", title: "Το σπίτι σου κοντά στη θάλασσα", text: "Κατοικίες, οικόπεδα και εξοχικά σε Κασσάνδρα και Σιθωνία.", button: "Δες τα ακίνητα", img: "/home/kinds/property-villa.webp", pos: "center" },
    section: "Νέες αγγελίες",
    cards: [
      { title: "Διαμέρισμα 85 τ.μ.", meta: "Κασσάνδρα · 2 υπνοδωμάτια", price: "165.000 €", img: "/home/kinds/property-flat.webp" },
      { title: "Μεζονέτα 120 τ.μ.", meta: "Σιθωνία · θέα θάλασσα", price: "240.000 €", img: "/home/kinds/property-house.webp" },
      { title: "Πέτρινο σπίτι", meta: "Ορεινή Χαλκιδική", price: "98.000 €", img: "/home/site-village.webp" },
    ],
  },
  {
    key: "crafts",
    industry: "Δημιουργοί",
    place: "Βόλος",
    icon: "brush",
    name: "Πηλός Studio",
    slug: "pilos-studio",
    palette: tile,
    nav: ["Κεραμικά", "Εργαστήρια", "Σχετικά"],
    cta: "Καλάθι",
    hero: { eyebrow: "Κεραμικά στο χέρι", title: "Αντικείμενα από πηλό, για το σπίτι σου", text: "Βάζα, κούπες και διακοσμητικά, φτιαγμένα ένα ένα στο εργαστήριό μας.", button: "Ανακάλυψε", img: "/home/kinds/crafts-vases.webp", pos: "center" },
    section: "Από το εργαστήριο",
    cards: [
      { title: "Κεραμικό βάζο", meta: "Ματ λευκό", price: "32,00 €", img: "/home/p-vase.webp" },
      { title: "Πιάτα σερβιρίσματος", meta: "Σετ των 4", price: "26,00 €", img: "/home/kinds/crafts-plates.webp" },
      { title: "Κούπες espresso", meta: "Σετ των 2", price: "18,00 €", img: "/home/kinds/crafts-cups.webp" },
    ],
  },
]
