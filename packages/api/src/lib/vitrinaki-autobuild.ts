import { TEMPLATE_FOR_TYPE, type BusinessType } from "./vitrinaki-profile"
import type { StorefrontStyle } from "./vitrinaki-storefront-style"

// «Στήνεται μόνο του»: turns the few answers of the start page (kind of
// business, name, story, photos) into a complete storefront: template, colours,
// style, texts and photo sections. No AI: the looks and the default texts are
// fixed per kind of business, and whatever the owner wrote always wins.

export const MAX_PHOTOS = 8

type Palette = "forest" | "terracotta" | "ocean" | "plum"
export type StylePreset = { palette: Palette; style: StorefrontStyle }

// Three looks per kind of business; «Δοκίμασε άλλο στυλ» moves to the next one.
export const STYLE_PRESETS: Record<BusinessType, StylePreset[]> = {
  retail: [
    { palette: "forest", style: { font: "classic", corners: "round", buttons: "solid", theme: "light" } },
    { palette: "plum", style: { font: "modern", corners: "soft", buttons: "outline", theme: "light" } },
    { palette: "ocean", style: { font: "minimal", corners: "sharp", buttons: "solid", theme: "dark" } },
  ],
  crafts: [
    { palette: "terracotta", style: { font: "classic", corners: "round", buttons: "solid", theme: "light" } },
    { palette: "forest", style: { font: "modern", corners: "soft", buttons: "outline", theme: "light" } },
    { palette: "plum", style: { font: "classic", corners: "sharp", buttons: "solid", theme: "dark" } },
  ],
  food: [
    { palette: "terracotta", style: { font: "classic", corners: "round", buttons: "solid", theme: "light" } },
    { palette: "forest", style: { font: "classic", corners: "soft", buttons: "solid", theme: "light" } },
    { palette: "ocean", style: { font: "modern", corners: "round", buttons: "outline", theme: "light" } },
  ],
  beauty: [
    { palette: "plum", style: { font: "modern", corners: "round", buttons: "solid", theme: "light" } },
    { palette: "terracotta", style: { font: "classic", corners: "soft", buttons: "outline", theme: "light" } },
    { palette: "forest", style: { font: "minimal", corners: "round", buttons: "solid", theme: "dark" } },
  ],
  services: [
    { palette: "ocean", style: { font: "modern", corners: "soft", buttons: "solid", theme: "light" } },
    { palette: "forest", style: { font: "minimal", corners: "sharp", buttons: "solid", theme: "light" } },
    { palette: "plum", style: { font: "modern", corners: "round", buttons: "outline", theme: "dark" } },
  ],
  portfolio: [
    { palette: "ocean", style: { font: "minimal", corners: "sharp", buttons: "outline", theme: "dark" } },
    { palette: "terracotta", style: { font: "modern", corners: "soft", buttons: "solid", theme: "light" } },
    { palette: "forest", style: { font: "classic", corners: "round", buttons: "solid", theme: "light" } },
  ],
  other: [
    { palette: "forest", style: { font: "classic", corners: "round", buttons: "solid", theme: "light" } },
    { palette: "ocean", style: { font: "modern", corners: "soft", buttons: "solid", theme: "light" } },
    { palette: "terracotta", style: { font: "minimal", corners: "round", buttons: "outline", theme: "light" } },
  ],
}

// Default texts, used only where the owner left the field empty.
export const DEFAULT_TEXTS: Record<BusinessType, { tagline: string; description: string; sections: { title: string; body: string }[] }> = {
  retail: {
    tagline: "Το αγαπημένο μαγαζί της γειτονιάς, τώρα και online",
    description: "Διαλεγμένα προϊόντα με φροντίδα, με παραλαβή από το κατάστημα ή αποστολή σε όλη την Ελλάδα.",
    sections: [
      { title: "Το κατάστημά μας", body: "Πέρνα να μας γνωρίσεις από κοντά ή παράγγειλε online και σου τα στέλνουμε." },
      { title: "Διαλεγμένα ένα ένα", body: "Κάθε προϊόν το επιλέγουμε γιατί θα το θέλαμε κι εμείς στο σπίτι μας." },
      { title: "Εδώ για σένα", body: "Ρώτησέ μας ό,τι θέλεις. Απαντάμε γρήγορα, με τηλέφωνο ή μήνυμα." },
    ],
  },
  crafts: {
    tagline: "Χειροποίητα κομμάτια, φτιαγμένα ένα ένα",
    description: "Κάθε κομμάτι φτιάχνεται στο εργαστήρι μας με φυσικά υλικά και πολλή υπομονή.",
    sections: [
      { title: "Στο εργαστήρι", body: "Εδώ γεννιέται κάθε κομμάτι, με τα χέρια και με χρόνο." },
      { title: "Υλικά που αντέχουν", body: "Δουλεύουμε με υλικά που επιλέγουμε προσεκτικά, για να κρατούν χρόνια." },
      { title: "Κατά παραγγελία", body: "Θέλεις κάτι δικό σου; Γράψε μας και το φτιάχνουμε μαζί." },
    ],
  },
  food: {
    tagline: "Από τον τόπο μας, κατευθείαν στο τραπέζι σου",
    description: "Αγνά τοπικά προϊόντα από μικρή οικογενειακή παραγωγή, με σεβασμό στην παράδοση.",
    sections: [
      { title: "Από τον τόπο μας", body: "Ό,τι πουλάμε το παράγουμε ή το διαλέγουμε από ανθρώπους που ξέρουμε." },
      { title: "Με φροντίδα", body: "Μικρές ποσότητες, φρέσκια παραγωγή, χωρίς βιασύνη." },
      { title: "Έλα να μας γνωρίσεις", body: "Πέρνα από τον χώρο μας ή παράγγειλε και σου τα στέλνουμε." },
    ],
  },
  beauty: {
    tagline: "Χρόνος για σένα, με επαγγελματική φροντίδα",
    description: "Υπηρεσίες ομορφιάς και ευεξίας σε έναν ζεστό χώρο, με προϊόντα που εμπιστευόμαστε.",
    sections: [
      { title: "Ο χώρος μας", body: "Ένας ήσυχος, φροντισμένος χώρος για να χαλαρώσεις." },
      { title: "Η δουλειά μας", body: "Κάθε υπηρεσία γίνεται με προσοχή και με προϊόντα που εμπιστευόμαστε." },
      { title: "Κλείσε ραντεβού", body: "Πάρε τηλέφωνο ή στείλε μήνυμα και βρίσκουμε την ώρα που σε βολεύει." },
    ],
  },
  services: {
    tagline: "Αξιόπιστη δουλειά, καθαρές τιμές",
    description: "Επαγγελματικές υπηρεσίες με συνέπεια και άμεση εξυπηρέτηση. Ζήτησε προσφορά χωρίς δέσμευση.",
    sections: [
      { title: "Η δουλειά μας", body: "Δες μερικά από όσα έχουμε κάνει για πελάτες μας." },
      { title: "Με συνέπεια", body: "Λέμε από την αρχή τι θα γίνει, πότε και πόσο κοστίζει." },
      { title: "Ζήτησε προσφορά", body: "Περίγραψέ μας τι χρειάζεσαι και σου απαντάμε γρήγορα." },
    ],
  },
  portfolio: {
    tagline: "Ιδέες που γίνονται έργα",
    description: "Δες επιλεγμένες δουλειές μου και επικοινώνησε για τη δική σου ιδέα.",
    sections: [
      { title: "Επιλεγμένη δουλειά", body: "Μερικά από τα έργα που έχω κάνει πρόσφατα." },
      { title: "Πώς δουλεύω", body: "Ξεκινάμε από αυτό που χρειάζεσαι και το εξελίσσουμε μαζί, βήμα βήμα." },
      { title: "Ας μιλήσουμε", body: "Έχεις μια ιδέα; Στείλε μου μήνυμα." },
    ],
  },
  other: {
    tagline: "Καλώς ήρθες στη βιτρίνα μας",
    description: "Γνώρισε τι κάνουμε και επικοινώνησε μαζί μας για ό,τι χρειαστείς.",
    sections: [
      { title: "Γνώρισέ μας", body: "Λίγα λόγια και εικόνες από όσα κάνουμε." },
      { title: "Τι κάνουμε", body: "Ό,τι κάνουμε, το κάνουμε με φροντίδα για τον κάθε πελάτη." },
      { title: "Επικοινωνία", body: "Είμαστε εδώ για ό,τι χρειαστείς. Γράψε μας ή πάρε τηλέφωνο." },
    ],
  },
}

export type AutoBuildInput = {
  businessType: BusinessType | "" | null | undefined
  photos: string[]
  preset: number
}

const kind = (type: AutoBuildInput["businessType"]): BusinessType => (type && type in TEMPLATE_FOR_TYPE ? type : "other")

export const presetFor = (type: AutoBuildInput["businessType"], preset: number) => {
  const presets = STYLE_PRESETS[kind(type)]
  const index = ((Math.trunc(preset) % presets.length) + presets.length) % presets.length
  return { index, ...presets[index] }
}

// The storefront after an automatic build. `previous` is the saved
// storefront: texts the owner wrote and sections they made by hand stay.
// Sections this function made (autoBuilt) are rebuilt from the photos.
export function autoBuildStorefront(previous: Record<string, any>, input: AutoBuildInput) {
  const type = kind(input.businessType)
  const texts = DEFAULT_TEXTS[type]
  const look = presetFor(type, input.preset)
  const photos = input.photos.filter((url) => typeof url === "string" && url).slice(0, MAX_PHOTOS)
  const ownSections = (Array.isArray(previous.sections) ? previous.sections : []).filter((section: any) => !section?.autoBuilt)

  const photoSections = photos.slice(1, 4).map((imageUrl, index) => ({
    id: `auto-${index + 1}`,
    type: "image" as const,
    title: texts.sections[index].title,
    body: texts.sections[index].body,
    imageUrl,
    autoBuilt: true,
  }))

  return {
    ...previous,
    template: TEMPLATE_FOR_TYPE[type],
    palette: look.palette,
    style: look.style,
    stylePreset: look.index,
    tagline: String(previous.tagline || "").trim() || texts.tagline,
    description: String(previous.description || "").trim() || texts.description,
    bannerUrl: photos[0] || previous.bannerUrl || null,
    sections: ownSections.length ? ownSections : photoSections,
    gallery: photos,
    autoBuiltAt: new Date().toISOString(),
  }
}
