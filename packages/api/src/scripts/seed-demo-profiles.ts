import { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { ProductStatus, type CreateOfferDTO } from "@mercurjs/types"
import {
  approveSellerWorkflow,
  createOffersWorkflow,
  createProductsWorkflow,
  createSellerAccountWorkflow,
  createSellerShippingOptionsWorkflow,
  createSellerStockLocationsWorkflow,
  updateSellersWorkflow,
} from "@mercurjs/core/workflows"
import {
  createLocationFulfillmentSetWorkflow,
  createServiceZonesWorkflow,
  linkSalesChannelsToStockLocationWorkflow,
  updateProductsWorkflow,
} from "@medusajs/medusa/core-flows"

import {
  TEMPLATE_FOR_TYPE,
  emptyPrivateProfile,
  emptyPublicProfile,
  normalizePublicProfile,
  type BusinessType,
  type PublicProfile,
} from "../lib/vitrinaki-profile"
import { VITRINAKI_PRIVATE_MODULE } from "../modules/vitrinaki-private"
import type VitrinakiPrivateModuleService from "../modules/vitrinaki-private/service"

// Sample stores: one clearly labelled DEMO store per business type, filled
// through the same store-profile fields the Studio wizard writes, so every
// page variant can be seen at /<locale>/store/demo-*.
//
// Additive and idempotent: a demo whose handle already exists is skipped,
// nothing is ever deleted.
//
//   Run:        npx medusa exec ./src/scripts/seed-demo-profiles.ts
//   Hide again: DEMO_PROFILES_ACTION=unpublish npx medusa exec ./src/scripts/seed-demo-profiles.ts
//               (sets the demo stores to unpublished; delete them for good
//               from the admin panel if wanted)
//   New photos: DEMO_PROFILES_ACTION=refresh-images npx medusa exec ./src/scripts/seed-demo-profiles.ts
//               (gives demo stores that already exist the banner, product and
//               project photos listed here; nothing else is changed)
//
// Images come from the storefront's own static files (/home/*.webp) via
// VITRINAKI_STOREFRONT_URL, never from backend uploads.

type DemoProduct = { title: string; description: string; price: number; image?: string }
type Demo = {
  handle: string
  name: string
  type: BusinessType
  palette: "forest" | "terracotta" | "ocean"
  tagline: string
  description: string
  banner?: string
  phone: string
  profile: Partial<PublicProfile>
  legalName: string
  legalForm: "individual" | "oe" | "ee" | "ike" | "ae"
  doy: string
  owner: string
  products: DemoProduct[]
}

const hours = (weekday: [string, string], sat: [string, string] | null, split?: [string, string]) => {
  const day = (closed: boolean, range?: [string, string], second?: [string, string]) => ({
    closed,
    open: closed ? "" : range![0],
    close: closed ? "" : range![1],
    open2: second?.[0] || "",
    close2: second?.[1] || "",
  })
  return {
    mon: day(false, weekday, split), tue: day(false, weekday, split), wed: day(false, weekday), thu: day(false, weekday, split),
    fri: day(false, weekday, split), sat: sat ? day(false, sat) : day(true), sun: day(true),
  }
}

const DEMOS: Demo[] = [
  {
    handle: "demo-trofima",
    name: "DEMO · Ελαιώνες Μεσσηνίας",
    type: "food",
    palette: "forest",
    tagline: "Από τον ελαιώνα μας, κατευθείαν στο τραπέζι σου",
    description: "Οικογενειακή παραγωγή εξαιρετικού παρθένου ελαιολάδου, μελιού και ελιών Καλαμών. (Δοκιμαστικό κατάστημα)",
    banner: "/home/kinds/food-field.webp",
    phone: "2721012345",
    profile: {
      story: "Τρεις γενιές φροντίζουμε τα 800 δέντρα κορωνέικης στους λόφους πάνω από την Καλαμάτα. Μαζεύουμε τον καρπό νωρίς, με το χέρι, και τον πάμε στο ελαιοτριβείο την ίδια μέρα.\n\nΔεν αναμειγνύουμε, δεν αγοράζουμε από τρίτους: ό,τι μπουκαλώνουμε είναι δικό μας.",
      whatsapp: "6912345678",
      address: { street: "Επαρχιακή οδός Καλαμάτας-Μεσσήνης 12", area: "Ασπρόχωμα", city: "Καλαμάτα", postalCode: "24100", showMap: true, hideStreet: false },
      hoursEnabled: true,
      hours: hours(["09:00", "15:00"], ["10:00", "14:00"]),
      hoursNote: "Επισκέψεις στον ελαιώνα κατόπιν συνεννόησης.",
      socials: { instagram: "https://instagram.com/demo.elaiones", facebook: "", tiktok: "", website: "" },
      languages: ["el", "en", "de"],
      delivery: { shipping: true, shippingAreas: "Σε όλη την Ελλάδα και την Κύπρο", pickup: true, pickupNote: "Από το κτήμα, Δευτέρα–Σάββατο", localDelivery: false, localDeliveryAreas: "", note: "Δωρεάν αποστολή για παραγγελίες άνω των 60€." },
      returnPolicy: "Τα τρόφιμα δεν επιστρέφονται αν έχουν ανοιχτεί. Αν κάτι φτάσει χαλασμένο, στείλε μας φωτογραφία μέσα σε 3 μέρες και το αντικαθιστούμε.",
      food: { region: "Μεσσηνία", origin: "Ποικιλία κορωνέικη, ψυχρή έκθλιψη κάτω από 27°C, οξύτητα κάτω από 0,3. Μέλι από θυμάρι και ρείκι από τα δικά μας μελίσσια.", certifications: ["pop", "organic"], certificationsOther: "", ingredientsNote: "Φύλαξε το λάδι σε δροσερό, σκοτεινό μέρος. Το μέλι μπορεί να κρυσταλλώσει: είναι φυσικό.", producerSince: "1962" },
    },
    legalName: "DEMO Ελαιώνες Μεσσηνίας Ο.Ε.",
    legalForm: "oe",
    doy: "Καλαμάτας",
    owner: "Demo Παπαδόπουλος",
    products: [
      { title: "Εξαιρετικό παρθένο ελαιόλαδο 1L", description: "Κορωνέικη ΠΟΠ Καλαμάτα, σοδειά 2025.", price: 14, image: "/home/site-oil.webp" },
      { title: "Θυμαρίσιο μέλι 450g", description: "Από τα μελίσσια μας στον Ταΰγετο.", price: 11, image: "/home/kinds/food-honey.webp" },
      { title: "Ελιές Καλαμών 500g", description: "Σε άλμη με ξίδι από κρασί και ρίγανη.", price: 7, image: "/home/site-olives.webp" },
      { title: "Γευσιγνωσία για δύο", description: "Ελαιόλαδο, μέλι και ελιές σε κουτί δώρου.", price: 32, image: "/home/food-dark.webp" },
    ],
  },
  {
    handle: "demo-xeiropoiita",
    name: "DEMO · Πηλός & Φως",
    type: "crafts",
    palette: "terracotta",
    tagline: "Κεραμικά φτιαγμένα στον τροχό, ένα-ένα",
    description: "Βάζα, κηροπήγια και επιτραπέζια σκεύη από ένα μικρό εργαστήρι στη Σύρο. (Δοκιμαστικό κατάστημα)",
    banner: "/home/kinds/crafts-wheel.webp",
    phone: "2281012345",
    profile: {
      story: "Ξεκίνησα με τον πηλό ως χόμπι το 2015. Σήμερα το εργαστήρι μου στην Ερμούπολη βγάζει μικρές σειρές για σπίτια και καταστήματα σε όλη την Ελλάδα. Κάθε κομμάτι είναι λίγο διαφορετικό από το προηγούμενο: αυτή είναι η ομορφιά του.",
      whatsapp: "6923456789",
      viber: "6923456789",
      address: { street: "", area: "Ερμούπολη", city: "Σύρος", postalCode: "84100", showMap: false, hideStreet: true },
      byAppointment: true,
      hoursNote: "Το εργαστήρι δέχεται επισκέψεις κατόπιν ραντεβού.",
      socials: { instagram: "https://instagram.com/demo.pilos", facebook: "https://facebook.com/demo.pilos", tiktok: "", website: "" },
      languages: ["el", "en"],
      delivery: { shipping: true, shippingAreas: "Σε όλη την Ελλάδα, συσκευασία ασφαλείας", pickup: true, pickupNote: "Από το εργαστήριο στην Ερμούπολη", localDelivery: false, localDeliveryAreas: "", note: "" },
      returnPolicy: "Επιστροφές εντός 14 ημερών από την παραλαβή, σε άθικτη κατάσταση. Τα κατά παραγγελία κομμάτια δεν επιστρέφονται.",
      crafts: { materials: "Πηλός πέτρινης άμμου, εφυαλώματα χωρίς μόλυβδο", techniques: "Τροχός, σμάλτο εμβάπτισης, όπτηση στους 1240°C", madeToOrder: true, leadTime: "10-15 εργάσιμες", customOrders: true },
    },
    legalName: "DEMO Πηλός & Φως",
    legalForm: "individual",
    doy: "Σύρου",
    owner: "Demo Αναστασίου",
    products: [
      { title: "Βάζο «Ντόνατ» λευκό", description: "Ύψος 22 εκ., ματ λευκό σμάλτο.", price: 48, image: "/home/p-vase.webp" },
      { title: "Κηροπήγιο πέτρας", description: "Σετ δύο τεμαχίων.", price: 26, image: "/home/p-candle.webp" },
      { title: "Γλάστρα τερακότα", description: "Χειροποίητη, με οπή αποστράγγισης.", price: 22, image: "/home/kinds/demo-terracotta.webp" },
    ],
  },
  {
    handle: "demo-katastima",
    name: "DEMO · Το Ανθοπωλείο της Γειτονιάς",
    type: "retail",
    palette: "ocean",
    tagline: "Φρέσκα λουλούδια και φυτά, με παράδοση την ίδια μέρα",
    description: "Ανθοδέσμες, φυτά εσωτερικού χώρου και γλάστρες. Παράγγειλε online, παράλαβε από το μαγαζί ή στείλ' τα σε κάποιον που αγαπάς. (Δοκιμαστικό κατάστημα)",
    banner: "/home/kinds/demo-florist.webp",
    phone: "2310123456",
    profile: {
      story: "Από το 1998 στην ίδια γωνία της Καλαμαριάς. Διαλέγουμε κάθε πρωί λουλούδια από Έλληνες παραγωγούς και φτιάχνουμε ανθοδέσμες με το χέρι.",
      whatsapp: "6934567890",
      address: { street: "Κομνηνών 45", area: "Καλαμαριά", city: "Θεσσαλονίκη", postalCode: "55131", showMap: true, hideStreet: false },
      hoursEnabled: true,
      hours: hours(["09:00", "14:30"], ["09:00", "15:00"], ["17:30", "21:00"]),
      socials: { instagram: "https://instagram.com/demo.anthopoleio", facebook: "https://facebook.com/demo.anthopoleio", tiktok: "https://tiktok.com/@demo.anthopoleio", website: "" },
      languages: ["el", "en"],
      delivery: { shipping: false, shippingAreas: "", pickup: true, pickupNote: "Έτοιμο σε 1 ώρα από την παραγγελία", localDelivery: true, localDeliveryAreas: "Καλαμαριά, Πυλαία, Κέντρο Θεσσαλονίκης", note: "Παράδοση αυθημερόν για παραγγελίες έως τις 14:00." },
      returnPolicy: "Αν τα λουλούδια δεν φτάσουν όπως τα περίμενες, πες μας την ίδια μέρα και τα αντικαθιστούμε.",
      retail: { categories: "Ανθοδέσμες, φυτά εσωτερικού χώρου, παχύφυτα, γλάστρες", brands: "" },
    },
    legalName: "DEMO Ανθοπωλείο Ι.Κ.Ε.",
    legalForm: "ike",
    doy: "Καλαμαριάς",
    owner: "Demo Γεωργίου",
    products: [
      { title: "Παιώνιες σε βάζο", description: "Εποχική ανθοδέσμη με παιώνιες.", price: 38, image: "/home/p-peony.webp" },
      { title: "Τουλίπες σε κεραμική γλάστρα", description: "10 τουλίπες σε κίτρινη γλάστρα.", price: 29, image: "/home/kinds/demo-tulips.webp" },
      { title: "Αλόη σε λευκή γλάστρα", description: "Εύκολο φυτό για φωτεινό σημείο.", price: 18, image: "/home/kinds/demo-aloe.webp" },
      { title: "Σετ παχύφυτων", description: "Έξι μικρά παχύφυτα σε πήλινα γλαστράκια.", price: 24, image: "/home/kinds/demo-succulents.webp" },
      { title: "Χλωρόφυτο γραφείου", description: "Καθαρίζει τον αέρα, θέλει λίγο πότισμα.", price: 15, image: "/home/kinds/demo-spider-plant.webp" },
    ],
  },
  {
    handle: "demo-omorfia",
    name: "DEMO · Αύρα Wellness Studio",
    type: "beauty",
    palette: "terracotta",
    tagline: "Χρόνος για σένα: μασάζ, γιόγκα και περιποίηση",
    description: "Ένα ήσυχο studio ευεξίας στο Χαλάνδρι με θεραπευτικό μασάζ, μαθήματα γιόγκα και φυσικά καλλυντικά. (Δοκιμαστικό κατάστημα)",
    banner: "/home/kinds/demo-spa.webp",
    phone: "2106123456",
    profile: {
      story: "Η Αύρα ξεκίνησε το 2019 από δύο φυσικοθεραπεύτριες που ήθελαν έναν χώρο όπου η περιποίηση δεν βιάζεται. Δουλεύουμε με μικρές ομάδες και πολύ προσοχή στη λεπτομέρεια.",
      whatsapp: "6945678901",
      address: { street: "Αγίας Παρασκευής 80", area: "Χαλάνδρι", city: "Αθήνα", postalCode: "15234", showMap: true, hideStreet: false },
      hoursEnabled: true,
      hours: hours(["10:00", "21:00"], ["10:00", "16:00"]),
      byAppointment: true,
      socials: { instagram: "https://instagram.com/demo.avra", facebook: "", tiktok: "", website: "" },
      languages: ["el", "en"],
      delivery: { shipping: true, shippingAreas: "Τα καλλυντικά μας σε όλη την Ελλάδα", pickup: true, pickupNote: "Από το studio", localDelivery: false, localDeliveryAreas: "", note: "" },
      returnPolicy: "Τα καλλυντικά επιστρέφονται κλειστά εντός 14 ημερών.",
      services: {
        items: [
          { name: "Θεραπευτικό μασάζ", duration: "50′", price: "45€", description: "Για αυχένα, πλάτη και μέση." },
          { name: "Μασάζ με ζεστές πέτρες", duration: "75′", price: "65€", description: "Βαθιά χαλάρωση." },
          { name: "Περιποίηση προσώπου", duration: "60′", price: "40€", description: "Καθαρισμός και ενυδάτωση με φυσικά έλαια." },
          { name: "Ομαδικό μάθημα γιόγκα", duration: "60′", price: "12€", description: "Μέχρι 8 άτομα." },
        ],
        serviceArea: "",
        online: false,
        atClient: false,
      },
      beauty: { specialties: "Θεραπευτικό μασάζ, Hatha γιόγκα, φυσική περιποίηση προσώπου", brands: "Φυσικά έλαια από Έλληνες παραγωγούς" },
      credentials: "Πιστοποιημένες φυσικοθεραπεύτριες, εκπαίδευση γιόγκα 200 ωρών (RYT-200).",
    },
    legalName: "DEMO Αύρα Ευεξία Ε.Ε.",
    legalForm: "ee",
    doy: "Χαλανδρίου",
    owner: "Demo Κωνσταντίνου",
    products: [
      { title: "Έλαιο τριαντάφυλλου 30ml", description: "Για πρόσωπο και σώμα.", price: 24, image: "/home/kinds/demo-oil-dropper.webp" },
      { title: "Σετ ορών προσώπου", description: "Ενυδάτωση και λάμψη.", price: 36, image: "/home/kinds/demo-spa-bottle.webp" },
    ],
  },
  {
    handle: "demo-ypiresies",
    name: "DEMO · Ηλεκτρολογικές Λύσεις Νικολάου",
    type: "services",
    palette: "ocean",
    tagline: "Αξιόπιστος ηλεκτρολόγος, καθαρές τιμές",
    description: "Ηλεκτρολογικές εγκαταστάσεις, βλάβες και πιστοποιητικά για σπίτια και καταστήματα στα νότια προάστια. (Δοκιμαστικό κατάστημα)",
    banner: "/home/kinds/demo-tools.webp",
    phone: "6956789012",
    profile: {
      story: "Είμαι αδειούχος ηλεκτρολόγος με 18 χρόνια στη δουλειά. Έρχομαι στην ώρα μου, εξηγώ τι θα κάνω πριν το κάνω και αφήνω τον χώρο καθαρό.",
      whatsapp: "6956789012",
      viber: "6956789012",
      address: { street: "", area: "Γλυφάδα", city: "Αθήνα", postalCode: "", showMap: false, hideStreet: true },
      hoursEnabled: true,
      hours: hours(["08:00", "18:00"], ["09:00", "13:00"]),
      hoursNote: "Για επείγουσες βλάβες τηλεφώνησε και εκτός ωραρίου.",
      socials: { instagram: "", facebook: "https://facebook.com/demo.ilektrologos", tiktok: "", website: "" },
      languages: ["el", "en"],
      services: {
        items: [
          { name: "Αποκατάσταση βλάβης", duration: "1-2 ώρες", price: "από 40€", description: "Διακόπτες, πρίζες, ασφάλειες, ρελέ." },
          { name: "Πιστοποιητικό ηλεκτρολογικής εγκατάστασης", duration: "1 ημέρα", price: "από 90€", description: "Για μεταβίβαση ή ΔΕΔΔΗΕ." },
          { name: "Εγκατάσταση φωτιστικών", duration: "ανά τεμάχιο", price: "από 20€", description: "" },
          { name: "Πλήρης ηλεκτρολογική ανακαίνιση", duration: "κατά περίπτωση", price: "με προσφορά", description: "Δωρεάν αυτοψία και γραπτή προσφορά." },
        ],
        serviceArea: "Γλυφάδα, Βούλα, Βάρη, Άλιμος, Ελληνικό, Αργυρούπολη",
        online: false,
        atClient: true,
      },
      credentials: "Άδεια ηλεκτρολόγου Α' τάξης, μέλος του τοπικού επαγγελματικού σωματείου.",
    },
    legalName: "DEMO Νικολάου Ηλεκτρολογικές Λύσεις",
    legalForm: "individual",
    doy: "Γλυφάδας",
    owner: "Demo Νικολάου",
    products: [],
  },
  {
    handle: "demo-portfolio",
    name: "DEMO · Studio Λευκό · Interior Design",
    type: "portfolio",
    palette: "forest",
    tagline: "Χώροι που σου μοιάζουν",
    description: "Σχεδιασμός εσωτερικών χώρων για κατοικίες, μικρά καταστήματα και καταλύματα. (Δοκιμαστικό κατάστημα)",
    banner: "/home/kinds/demo-interior.webp",
    phone: "2109123456",
    profile: {
      story: "Είμαι εσωτερική αρχιτέκτονας με σπουδές στην Αθήνα και το Μιλάνο. Μου αρέσουν οι φωτεινοί, απλοί χώροι με φυσικά υλικά και λίγα, καλά επιλεγμένα αντικείμενα. Δουλεύω από την πρώτη ιδέα μέχρι το τελευταίο μαξιλάρι.",
      address: { street: "", area: "Παγκράτι", city: "Αθήνα", postalCode: "", showMap: false, hideStreet: true },
      socials: { instagram: "https://instagram.com/demo.studiolefko", facebook: "", tiktok: "", website: "https://example.com" },
      languages: ["el", "en", "it"],
      portfolio: {
        skills: ["Σχεδιασμός κατοικιών", "Ανακαίνιση airbnb", "3D απεικονίσεις", "Επιλογή επίπλων & φωτισμού", "Styling για φωτογράφιση"],
        projects: [
          { title: "Διαμέρισμα στο Παγκράτι", description: "Ανακαίνιση 75 τ.μ. με φυσικό φως και λευκές επιφάνειες.", imageUrl: "/home/kinds/demo-room.webp", link: "", year: "2025" },
          { title: "Σαλόνι στη Γλυφάδα", description: "Ζεστά υφάσματα, κεραμικά και ήπιοι τόνοι.", imageUrl: "/home/kinds/demo-living.webp", link: "", year: "2024" },
          { title: "Γωνιά εργασίας", description: "Μικρό γραφείο σε 4 τ.μ. για δουλειά από το σπίτι.", imageUrl: "/home/kinds/demo-desk.webp", link: "", year: "2024" },
        ],
        clients: "Ιδιώτες, 6 καταλύματα βραχυχρόνιας μίσθωσης, 2 καφέ στην Αθήνα",
        availability: "Διαθέσιμη για νέα έργα από Δεκέμβριο",
      },
      services: {
        items: [
          { name: "Συμβουλευτική επίσκεψη", duration: "90′", price: "80€", description: "Ιδέες και κατεύθυνση για τον χώρο σου." },
          { name: "Πλήρης μελέτη χώρου", duration: "3-6 εβδομάδες", price: "με προσφορά", description: "Κατόψεις, 3D, λίστα αγορών." },
        ],
        serviceArea: "",
        online: true,
        atClient: true,
      },
      credentials: "Μεταπτυχιακό Interior Design, Politecnico di Milano.",
    },
    legalName: "DEMO Studio Λευκό",
    legalForm: "individual",
    doy: "ΙΓ' Αθηνών",
    owner: "Demo Λευκοπούλου",
    products: [],
  },
]

export default async function seedDemoProfiles({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const link = container.resolve(ContainerRegistrationKeys.LINK)
  const storefrontUrl = (process.env.VITRINAKI_STOREFRONT_URL || "http://localhost:3100").replace(/\/+$/, "")
  const locale = process.env.VITRINAKI_DEFAULT_LOCALE || "gr"
  const password = process.env.DEMO_SELLER_PASSWORD || "supersecret"
  const asset = (path?: string) => (path ? `${storefrontUrl}${path}` : "")

  if (process.env.DEMO_PROFILES_ACTION === "unpublish") {
    const { data } = await query.graph({ entity: "seller", fields: ["id", "handle", "metadata"], filters: { handle: DEMOS.map((d) => d.handle) } })
    for (const seller of data as any[]) {
      await updateSellersWorkflow(container).run({
        input: {
          selector: { id: seller.id },
          update: { metadata: { ...(seller.metadata || {}), vitrinaki_storefront: { ...(seller.metadata?.vitrinaki_storefront || {}), isPublished: false, publishedAt: null } } },
        },
      })
      logger.info(`Unpublished demo store ${seller.handle}.`)
    }
    return
  }

  if (process.env.DEMO_PROFILES_ACTION === "refresh-images") {
    const { data } = await query.graph({ entity: "seller", fields: ["id", "handle", "metadata"], filters: { handle: DEMOS.map((d) => d.handle) } })
    for (const seller of data as any[]) {
      const demo = DEMOS.find((d) => d.handle === seller.handle)!
      const banner = asset(demo.banner) || null
      const storefront = seller.metadata?.vitrinaki_storefront || {}
      const profile = seller.metadata?.vitrinaki_profile
      const projects = demo.profile.portfolio?.projects || []
      if (profile?.portfolio?.projects?.length && projects.length) {
        profile.portfolio.projects = profile.portfolio.projects.map((p: any, i: number) => (projects[i] ? { ...p, imageUrl: asset(projects[i].imageUrl) } : p))
      }
      await updateSellersWorkflow(container).run({
        input: {
          selector: { id: seller.id },
          update: { banner, metadata: { ...(seller.metadata || {}), vitrinaki_storefront: { ...storefront, bannerUrl: banner }, ...(profile ? { vitrinaki_profile: profile } : {}) } },
        } as any,
      })
      for (const [index, item] of demo.products.entries()) {
        if (!item.image) continue
        const url = asset(item.image)
        await updateProductsWorkflow(container).run({ input: { selector: { handle: `${demo.handle}-${index + 1}` }, update: { thumbnail: url, images: [{ url }] } } })
      }
      logger.info(`New photos for demo store ${seller.handle}.`)
    }
    return
  }

  const auth = container.resolve(Modules.AUTH)
  const salesChannels = await container.resolve(Modules.SALES_CHANNEL).listSalesChannels({ name: "Default Sales Channel" })
  const [region] = await container.resolve(Modules.REGION).listRegions({}, { relations: ["countries"] })
  const { data: profiles } = await query.graph({ entity: "shipping_profile", fields: ["id"], filters: { name: "Marketplace Shipping" } })
  const privateService = container.resolve<VitrinakiPrivateModuleService>(VITRINAKI_PRIVATE_MODULE)

  for (const demo of DEMOS) {
    const { data: existing } = await query.graph({ entity: "seller", fields: ["id"], filters: { handle: demo.handle } })
    if (existing[0]) {
      logger.info(`Demo store ${demo.handle} exists, skipping.`)
      continue
    }
    logger.info(`Creating demo store ${demo.handle}...`)
    const email = `${demo.handle}@vitrinaki.gr`

    const registered = await auth.register("emailpass", { body: { email, password } })
    let authIdentityId = registered.authIdentity?.id
    if (!registered.success || !authIdentityId) {
      const [identity] = await auth.listProviderIdentities({ entity_id: email, provider: "emailpass" })
      authIdentityId = identity.auth_identity_id!
    }

    const now = new Date().toISOString()
    const profile = normalizePublicProfile({
      ...emptyPublicProfile(),
      ...demo.profile,
      businessType: demo.type,
      completedSteps: ["type", "basics", "look", "contact", "location", demo.type, "delivery", "legal", "owner"],
    })
    if (profile.portfolio.projects.length) {
      profile.portfolio.projects = profile.portfolio.projects.map((p) => ({ ...p, imageUrl: p.imageUrl.startsWith("/") ? asset(p.imageUrl) : p.imageUrl }))
    }
    const banner = asset(demo.banner) || null

    const { result: seller } = await createSellerAccountWorkflow(container).run({
      input: {
        auth_identity_id: authIdentityId,
        member_email: email,
        first_name: "Demo",
        last_name: demo.owner.replace(/^Demo\s*/, "") || "Seller",
        seller: {
          name: demo.name,
          handle: demo.handle,
          email,
          phone: demo.phone,
          currency_code: "eur",
          description: demo.description,
          banner,
          website_url: profile.socials.website || null,
          metadata: {
            vitrinaki_demo: true,
            storefront_url: `${storefrontUrl}/${locale}/store/${demo.handle}`,
            vitrinaki_subscription: {
              status: "active", source: "promo", promoCode: "DEMO", planId: "growth", interval: null,
              currentPeriodEnd: null, cancelAtPeriodEnd: false, updatedAt: now,
            },
            vitrinaki_storefront: {
              storeName: demo.name, tagline: demo.tagline, description: demo.description,
              template: TEMPLATE_FOR_TYPE[demo.type], palette: demo.palette,
              contactEmail: email, contactPhone: demo.phone, logoUrl: null, bannerUrl: banner,
              sections: [], customDomain: "", domainStatus: "not_configured", domainVerificationToken: "", domainVerifiedAt: null,
              isPublished: true, publishedAt: now, updatedAt: now,
            },
            vitrinaki_profile: { ...profile, updatedAt: now },
          },
        } as any,
      },
    })
    await approveSellerWorkflow(container).run({ input: { seller_id: seller.id } })

    const priv = emptyPrivateProfile()
    priv.legal = { ...priv.legal, legalName: demo.legalName, legalForm: demo.legalForm, doy: demo.doy, invoiceEmail: email }
    priv.owner = { ...priv.owner, fullName: demo.owner, email, mobile: "6900000000" }
    await privateService.createSellerPrivates({ seller_id: seller.id, legal: priv.legal as any, owner: priv.owner as any })

    if (demo.products.length && salesChannels[0] && region && profiles[0]) {
      await seedProducts(container, { demo, sellerId: seller.id, salesChannelId: salesChannels[0].id, regionId: region.id, shippingProfileId: profiles[0].id as string, asset, link })
    }
    logger.info(`Demo store ready: ${storefrontUrl}/${locale}/store/${demo.handle}`)
  }
}

async function seedProducts(
  container: ExecArgs["container"],
  args: { demo: Demo; sellerId: string; salesChannelId: string; regionId: string; shippingProfileId: string; asset: (p?: string) => string; link: any },
) {
  const { demo, sellerId, salesChannelId, regionId, shippingProfileId, asset, link } = args
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data: members } = await query.graph({ entity: "member", fields: ["id"], filters: { email: `${demo.handle}@vitrinaki.gr` } })
  const memberId = members[0].id as string

  const { result: [location] } = await createSellerStockLocationsWorkflow(container).run({
    input: { seller_id: sellerId, locations: [{ name: `${demo.name} αποθήκη`, address: { city: String(demo.profile.address?.city || "Αθήνα"), country_code: "GR", address_1: String(demo.profile.address?.street || "—") } }] },
  })
  await link.create({ [Modules.STOCK_LOCATION]: { stock_location_id: location.id }, [Modules.FULFILLMENT]: { fulfillment_provider_id: "manual_manual" } })
  await linkSalesChannelsToStockLocationWorkflow(container).run({ input: { id: location.id, add: [salesChannelId] } })
  await createLocationFulfillmentSetWorkflow(container).run({ input: { location_id: location.id, fulfillment_set_data: { name: `${demo.handle} delivery`, type: "shipping" } } })
  const { data: [withSet] } = await query.graph({ entity: "stock_location", fields: ["fulfillment_sets.id"], filters: { id: location.id } })
  const { result: [zone] } = await createServiceZonesWorkflow(container).run({
    input: { data: [{ fulfillment_set_id: (withSet as any).fulfillment_sets[0].id, name: `${demo.handle} Ελλάδα`, geo_zones: [{ country_code: "gr", type: "country" as const }] }] },
  })
  await createSellerShippingOptionsWorkflow(container).run({
    input: {
      seller_id: sellerId,
      shipping_options: [{
        name: "Κανονική αποστολή", price_type: "flat", provider_id: "manual_manual", service_zone_id: zone.id, shipping_profile_id: shippingProfileId,
        type: { label: "Κανονική", description: "Παράδοση σε 2-3 εργάσιμες.", code: "standard" },
        prices: [{ currency_code: "eur", amount: 4 }, { region_id: regionId, amount: 4 }],
        rules: [{ attribute: "enabled_in_store", value: "true", operator: "eq" }, { attribute: "is_return", value: "false", operator: "eq" }],
      }],
    } as any,
  })

  const products = demo.products.map((item, index) => {
    const handle = `${demo.handle}-${index + 1}`
    const images = item.image ? [{ url: asset(item.image) }] : []
    return {
      title: item.title,
      description: item.description,
      handle,
      status: ProductStatus.PUBLISHED,
      thumbnail: images[0]?.url,
      images,
      variants: [{ title: "Default", sku: handle.toUpperCase() }],
    }
  })
  await createProductsWorkflow(container).run({ input: { created_by: memberId, products } as any })

  const { data: created } = await query.graph({ entity: "product", fields: ["id", "handle", "variants.id", "variants.sku"], filters: { handle: products.map((p) => p.handle) } })
  const offers: CreateOfferDTO[] = (created as any[]).map((product) => {
    const item = demo.products[Number(String(product.handle).split("-").pop()) - 1]
    const variant = product.variants[0]
    const sku = `OFFER-${variant.sku}`
    return {
      seller_id: sellerId,
      created_by: memberId,
      sku,
      variant_id: variant.id,
      shipping_profile_id: shippingProfileId,
      inventory_items: [{ sku, stock_levels: [{ location_id: location.id, stocked_quantity: 1000 }] }],
      prices: [{ amount: item.price, currency_code: "eur" }],
    } as CreateOfferDTO
  })
  await createOffersWorkflow(container).run({ input: { offers } })
}
