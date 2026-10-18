import { ExecArgs } from "@medusajs/framework/types";
import {
  ContainerRegistrationKeys,
  Modules,
  toHandle,
} from "@medusajs/framework/utils";
import {
  AttributeType,
  ProductStatus,
  type CreateOfferDTO,
  type CreateProductDTO,
} from "@mercurjs/types";
import {
  approveSellerWorkflow,
  createOffersWorkflow,
  createProductAttributesWorkflow,
  createProductAttributeValuesWorkflow,
  createProductsWorkflow,
  createSellerAccountWorkflow,
  createSellerShippingOptionsWorkflow,
  createSellerStockLocationsWorkflow,
  updateSellersWorkflow,
} from "@mercurjs/core/workflows";
import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import {
  createApiKeysWorkflow,
  createLocationFulfillmentSetWorkflow,
  createProductCategoriesWorkflow,
  createRegionsWorkflow,
  createSalesChannelsWorkflow,
  createServiceZonesWorkflow,
  createShippingProfilesWorkflow,
  createTaxRegionsWorkflow,
  linkSalesChannelsToApiKeyWorkflow,
  linkSalesChannelsToStockLocationWorkflow,
  updateStoresStep,
  updateStoresWorkflow,
} from "@medusajs/medusa/core-flows";

// Demo catalog for "High Society", a fictional elegant menswear brand. Names,
// colorways and descriptions are invented; images are text placeholders, not
// photos of any real brand's products.
type SeedCategory = "Polo" | "Κοντομάνικα" | "Μακρυμάνικα" | "Πουκάμισα" | "Ζακέτες" | "Παντελόνια" | "Παπούτσια" | "Αξεσουάρ";
type SeedCatalogItem = {
  title: string;
  brand: string;
  colorway: string;
  category: SeedCategory;
  price: number;
  sizing: "apparel" | "shoes" | "one";
  description: string;
  images: string[];
};

const seedCatalog: SeedCatalogItem[] = [
  {
    title: "Signature Piqué Polo",
    brand: "High Society",
    colorway: "Navy",
    price: 89,
    images: ["https://placehold.co/800x1000/1c2b3a/f5efe6/png?text=HIGH+SOCIETY%0ASignature+Piqué+Polo"],
    category: "Polo",
    sizing: "apparel",
    description: "Signature Piqué Polo από τη High Society σε χρώμα Navy. Κομψή, διαχρονική γραμμή.",
  },
  {
    title: "Signature Piqué Polo",
    brand: "High Society",
    colorway: "White",
    price: 89,
    images: ["https://placehold.co/800x1000/e9e6df/1c2b3a/png?text=HIGH+SOCIETY%0ASignature+Piqué+Polo"],
    category: "Polo",
    sizing: "apparel",
    description: "Signature Piqué Polo από τη High Society σε χρώμα White. Κομψή, διαχρονική γραμμή.",
  },
  {
    title: "Twin Tipped Polo",
    brand: "High Society",
    colorway: "Black",
    price: 95,
    images: ["https://placehold.co/800x1000/151515/f5efe6/png?text=HIGH+SOCIETY%0ATwin+Tipped+Polo"],
    category: "Polo",
    sizing: "apparel",
    description: "Twin Tipped Polo από τη High Society σε χρώμα Black. Κομψή, διαχρονική γραμμή.",
  },
  {
    title: "Essential Crew T-Shirt",
    brand: "High Society",
    colorway: "Off White Cream",
    price: 49,
    images: ["https://placehold.co/800x1000/ece6d6/1c2b3a/png?text=HIGH+SOCIETY%0AEssential+Crew+T-Shirt"],
    category: "Κοντομάνικα",
    sizing: "apparel",
    description: "Essential Crew T-Shirt από τη High Society σε χρώμα Off White Cream. Κομψή, διαχρονική γραμμή.",
  },
  {
    title: "Heavyweight Logo T-Shirt",
    brand: "High Society",
    colorway: "Black",
    price: 59,
    images: ["https://placehold.co/800x1000/151515/f5efe6/png?text=HIGH+SOCIETY%0AHeavyweight+Logo+T-Shirt"],
    category: "Κοντομάνικα",
    sizing: "apparel",
    description: "Heavyweight Logo T-Shirt από τη High Society σε χρώμα Black. Κομψή, διαχρονική γραμμή.",
  },
  {
    title: "Compass Patch T-Shirt",
    brand: "High Society",
    colorway: "Olive",
    price: 65,
    images: ["https://placehold.co/800x1000/4a5233/f5efe6/png?text=HIGH+SOCIETY%0ACompass+Patch+T-Shirt"],
    category: "Κοντομάνικα",
    sizing: "apparel",
    description: "Compass Patch T-Shirt από τη High Society σε χρώμα Olive. Κομψή, διαχρονική γραμμή.",
  },
  {
    title: "Ribbed Long Sleeve Tee",
    brand: "High Society",
    colorway: "Grey",
    price: 69,
    images: ["https://placehold.co/800x1000/6b6e70/f5efe6/png?text=HIGH+SOCIETY%0ARibbed+Long+Sleeve+Tee"],
    category: "Μακρυμάνικα",
    sizing: "apparel",
    description: "Ribbed Long Sleeve Tee από τη High Society σε χρώμα Grey. Κομψή, διαχρονική γραμμή.",
  },
  {
    title: "Garment-Dyed Long Sleeve",
    brand: "High Society",
    colorway: "Navy Blue",
    price: 75,
    images: ["https://placehold.co/800x1000/1c2b3a/f5efe6/png?text=HIGH+SOCIETY%0AGarment-Dyed+Long+Sleeve"],
    category: "Μακρυμάνικα",
    sizing: "apparel",
    description: "Garment-Dyed Long Sleeve από τη High Society σε χρώμα Navy Blue. Κομψή, διαχρονική γραμμή.",
  },
  {
    title: "Oxford Button-Down Shirt",
    brand: "High Society",
    colorway: "Light Blue",
    price: 110,
    images: ["https://placehold.co/800x1000/9db8cf/1c2b3a/png?text=HIGH+SOCIETY%0AOxford+Button-Down+Shirt"],
    category: "Πουκάμισα",
    sizing: "apparel",
    description: "Oxford Button-Down Shirt από τη High Society σε χρώμα Light Blue. Κομψή, διαχρονική γραμμή.",
  },
  {
    title: "Linen Resort Shirt",
    brand: "High Society",
    colorway: "Sand",
    price: 125,
    images: ["https://placehold.co/800x1000/cdb894/1c2b3a/png?text=HIGH+SOCIETY%0ALinen+Resort+Shirt"],
    category: "Πουκάμισα",
    sizing: "apparel",
    description: "Linen Resort Shirt από τη High Society σε χρώμα Sand. Κομψή, διαχρονική γραμμή.",
  },
  {
    title: "Overshirt in Brushed Cotton",
    brand: "High Society",
    colorway: "Brown",
    price: 145,
    images: ["https://placehold.co/800x1000/5b4030/f5efe6/png?text=HIGH+SOCIETY%0AOvershirt+in+Brushed+Cotton"],
    category: "Πουκάμισα",
    sizing: "apparel",
    description: "Overshirt in Brushed Cotton από τη High Society σε χρώμα Brown. Κομψή, διαχρονική γραμμή.",
  },
  {
    title: "Harrington Jacket",
    brand: "High Society",
    colorway: "Black",
    price: 229,
    images: ["https://placehold.co/800x1000/151515/f5efe6/png?text=HIGH+SOCIETY%0AHarrington+Jacket"],
    category: "Ζακέτες",
    sizing: "apparel",
    description: "Harrington Jacket από τη High Society σε χρώμα Black. Κομψή, διαχρονική γραμμή.",
  },
  {
    title: "Garment-Dyed Field Jacket",
    brand: "High Society",
    colorway: "Olive",
    price: 289,
    images: ["https://placehold.co/800x1000/4a5233/f5efe6/png?text=HIGH+SOCIETY%0AGarment-Dyed+Field+Jacket"],
    category: "Ζακέτες",
    sizing: "apparel",
    description: "Garment-Dyed Field Jacket από τη High Society σε χρώμα Olive. Κομψή, διαχρονική γραμμή.",
  },
  {
    title: "Merino Zip Cardigan",
    brand: "High Society",
    colorway: "Grey",
    price: 179,
    images: ["https://placehold.co/800x1000/6b6e70/f5efe6/png?text=HIGH+SOCIETY%0AMerino+Zip+Cardigan"],
    category: "Ζακέτες",
    sizing: "apparel",
    description: "Merino Zip Cardigan από τη High Society σε χρώμα Grey. Κομψή, διαχρονική γραμμή.",
  },
  {
    title: "Tapered Chino",
    brand: "High Society",
    colorway: "Beige",
    price: 119,
    images: ["https://placehold.co/800x1000/cbb79a/1c2b3a/png?text=HIGH+SOCIETY%0ATapered+Chino"],
    category: "Παντελόνια",
    sizing: "apparel",
    description: "Tapered Chino από τη High Society σε χρώμα Beige. Κομψή, διαχρονική γραμμή.",
  },
  {
    title: "Cargo Trouser",
    brand: "High Society",
    colorway: "Black",
    price: 149,
    images: ["https://placehold.co/800x1000/151515/f5efe6/png?text=HIGH+SOCIETY%0ACargo+Trouser"],
    category: "Παντελόνια",
    sizing: "apparel",
    description: "Cargo Trouser από τη High Society σε χρώμα Black. Κομψή, διαχρονική γραμμή.",
  },
  {
    title: "Leather Court Sneaker",
    brand: "High Society",
    colorway: "White",
    price: 159,
    images: ["https://placehold.co/800x1000/e9e6df/1c2b3a/png?text=HIGH+SOCIETY%0ALeather+Court+Sneaker"],
    category: "Παπούτσια",
    sizing: "shoes",
    description: "Leather Court Sneaker από τη High Society σε χρώμα White. Κομψή, διαχρονική γραμμή.",
  },
  {
    title: "Suede Desert Boot",
    brand: "High Society",
    colorway: "Brown",
    price: 189,
    images: ["https://placehold.co/800x1000/5b4030/f5efe6/png?text=HIGH+SOCIETY%0ASuede+Desert+Boot"],
    category: "Παπούτσια",
    sizing: "shoes",
    description: "Suede Desert Boot από τη High Society σε χρώμα Brown. Κομψή, διαχρονική γραμμή.",
  },
  {
    title: "Wool Beanie",
    brand: "High Society",
    colorway: "Navy",
    price: 39,
    images: ["https://placehold.co/800x1000/1c2b3a/f5efe6/png?text=HIGH+SOCIETY%0AWool+Beanie"],
    category: "Αξεσουάρ",
    sizing: "one",
    description: "Wool Beanie από τη High Society σε χρώμα Navy. Κομψή, διαχρονική γραμμή.",
  },
  {
    title: "Canvas Weekender Bag",
    brand: "High Society",
    colorway: "Olive",
    price: 165,
    images: ["https://placehold.co/800x1000/4a5233/f5efe6/png?text=HIGH+SOCIETY%0ACanvas+Weekender+Bag"],
    category: "Αξεσουάρ",
    sizing: "one",
    description: "Canvas Weekender Bag από τη High Society σε χρώμα Olive. Κομψή, διαχρονική γραμμή.",
  },
  {
    title: "Leather Card Holder",
    brand: "High Society",
    colorway: "Black",
    price: 55,
    images: ["https://placehold.co/800x1000/151515/f5efe6/png?text=HIGH+SOCIETY%0ALeather+Card+Holder"],
    category: "Αξεσουάρ",
    sizing: "one",
    description: "Leather Card Holder από τη High Society σε χρώμα Black. Κομψή, διαχρονική γραμμή.",
  },
];

const updateStoreCurrencies = createWorkflow(
  "update-store-currencies",
  (input: {
    supported_currencies: { currency_code: string; is_default?: boolean }[];
    store_id: string;
  }) => {
    const normalizedInput = transform({ input }, (data) => {
      return {
        selector: { id: data.input.store_id },
        update: {
          supported_currencies: data.input.supported_currencies.map(
            (currency) => {
              return {
                currency_code: currency.currency_code,
                is_default: currency.is_default ?? false,
              };
            }
          ),
        },
      };
    });

    const stores = updateStoresStep(normalizedInput);

    return new WorkflowResponse(stores);
  }
);

export default async function seedDemoData({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const link = container.resolve(ContainerRegistrationKeys.LINK);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const salesChannelModuleService = container.resolve(Modules.SALES_CHANNEL);
  const storeModuleService = container.resolve(Modules.STORE);

  const countries = ["gr"];

  logger.info("Seeding store data...");
  const [store] = await storeModuleService.listStores();
  let defaultSalesChannel = await salesChannelModuleService.listSalesChannels({
    name: "Default Sales Channel",
  });

  if (!defaultSalesChannel.length) {
    const { result: salesChannelResult } = await createSalesChannelsWorkflow(
      container
    ).run({
      input: {
        salesChannelsData: [
          {
            name: "Default Sales Channel",
          },
        ],
      },
    });
    defaultSalesChannel = salesChannelResult;
  }

  await updateStoreCurrencies(container).run({
    input: {
      store_id: store.id,
      supported_currencies: [
        {
          currency_code: "eur",
          is_default: true,
        },
      ],
    },
  });

  await updateStoresWorkflow(container).run({
    input: {
      selector: { id: store.id },
      update: {
        name: "Vitrinaki",
        default_sales_channel_id: defaultSalesChannel[0].id,
      },
    },
  });
  logger.info("Seeding region data...");
  const regionModuleService = container.resolve(Modules.REGION);

  const existingRegions = await regionModuleService.listRegions({}, {
    relations: ["countries"],
  });

  const assignedCountries = new Set<string>();
  for (const r of existingRegions) {
    for (const c of r.countries || []) {
      assignedCountries.add(c.iso_2);
    }
  }

  const unassignedCountries = countries.filter(c => !assignedCountries.has(c));

  let region;
  if (unassignedCountries.length === 0) {
    region = existingRegions.find(r =>
      r.countries?.some(c => countries.includes(c.iso_2))
    ) || existingRegions[0];
    logger.info("Countries already assigned to a region, skipping region creation.");
  } else if (unassignedCountries.length < countries.length) {
    logger.info(`Some countries already assigned, creating region with: ${unassignedCountries.join(", ")}`);
    const { result: regionResult } = await createRegionsWorkflow(container).run({
      input: {
        regions: [
          {
            name: "Ελλάδα",
            currency_code: "eur",
            countries: unassignedCountries,
            payment_providers: ["pp_system_default"],
          },
        ],
      },
    });
    region = regionResult[0];
  } else {
    const { result: regionResult } = await createRegionsWorkflow(container).run({
      input: {
        regions: [
          {
            name: "Ελλάδα",
            currency_code: "eur",
            countries,
            payment_providers: ["pp_system_default"],
          },
        ],
      },
    });
    region = regionResult[0];
  }
  logger.info("Finished seeding regions.");

  logger.info("Seeding tax regions...");
  const taxModuleService = container.resolve(Modules.TAX);
  const existingTaxRegions = await taxModuleService.listTaxRegions();
  const existingCountryCodes = new Set(existingTaxRegions.map((tr) => tr.country_code));
  const countriesToCreate = countries.filter((c) => !existingCountryCodes.has(c));

  if (countriesToCreate.length > 0) {
    await createTaxRegionsWorkflow(container).run({
      input: countriesToCreate.map((country_code) => ({
        country_code,
        provider_id: "tp_system",
        default_tax_rate: { rate: 24, code: "GR-VAT", name: "ΦΠΑ 24%" },
      })),
    });
  } else {
    logger.info("Tax regions already exist, skipping.");
  }
  logger.info("Finished seeding tax regions.");

  logger.info("Seeding publishable API key data...");
  let publishableApiKey;
  const { data } = await query.graph({
    entity: "api_key",
    fields: ["id"],
    filters: {
      type: "publishable",
    },
  });

  publishableApiKey = data?.[0];

  if (!publishableApiKey) {
    const {
      result: [publishableApiKeyResult],
    } = await createApiKeysWorkflow(container).run({
      input: {
        api_keys: [
          {
            title: "Webshop",
            type: "publishable",
            created_by: "",
          },
        ],
      },
    });

    publishableApiKey = publishableApiKeyResult
  }

  try {
    await linkSalesChannelsToApiKeyWorkflow(container).run({
      input: {
        id: publishableApiKey.id,
        add: [defaultSalesChannel[0].id],
      },
    });
  } catch (error: unknown) {
    // Ignore if link already exists
    if (!(error instanceof Error && error.message.includes("already"))) {
      throw error;
    }
    logger.info("Sales channel already linked to API key, skipping.");
  }
  logger.info("Finished seeding publishable API key data.");

  logger.info("Seeding product categories...");
  const productModule = container.resolve(Modules.PRODUCT);

  // Departments (roots) and their sub-categories; array order sets nav `rank`.
  const CATEGORY_TREE: Record<string, string[]> = {
    "Μπλούζες": ["Polo", "Κοντομάνικα", "Μακρυμάνικα"],
    "Πουκάμισα & Ζακέτες": ["Πουκάμισα", "Ζακέτες"],
    "Κάτω μέρος": ["Παντελόνια"],
    "Παπούτσια & Αξεσουάρ": ["Παπούτσια", "Αξεσουάρ"],
  };
  const parentNames = Object.keys(CATEGORY_TREE);
  const childNames = Object.values(CATEGORY_TREE).flat();

  const existingCats = await productModule.listProductCategories({
    name: [...parentNames, ...childNames],
  });
  const catByName = new Map(existingCats.map((c) => [c.name, c]));

  const missingParents = parentNames.filter((name) => !catByName.has(name));
  if (missingParents.length) {
    const { result } = await createProductCategoriesWorkflow(container).run({
      input: {
        product_categories: missingParents.map((name) => ({
          name,
          is_active: true,
          rank: parentNames.indexOf(name),
        })),
      },
    });
    result.forEach((c) => catByName.set(c.name, c));
  }

  const childInputs: {
    name: string;
    is_active: boolean;
    rank: number;
    parent_category_id: string;
  }[] = [];
  for (const parent of parentNames) {
    CATEGORY_TREE[parent].forEach((childName, rank) => {
      if (!catByName.has(childName)) {
        childInputs.push({
          name: childName,
          is_active: true,
          rank,
          parent_category_id: catByName.get(parent)!.id,
        });
      }
    });
  }
  if (childInputs.length) {
    const { result } = await createProductCategoriesWorkflow(container).run({
      input: { product_categories: childInputs },
    });
    result.forEach((c) => catByName.set(c.name, c));
  }
  logger.info("Finished seeding product categories.");

  // Global product attributes (Mercur product-attribute module). Each is a
  // multi_select variant axis so it maps to a native Medusa product option and
  // powers `/store/products` filtering via `variants.options`. Products restrict
  // Color/Condition to a single value each, so variant count stays size-driven.
  logger.info("Seeding global product attributes...");

  const FOOTWEAR_SIZES = ["40", "41", "42", "43", "44", "45"];
  const APPAREL_SIZES = ["XS", "S", "M", "L", "XL", "XXL"];
  const COLOR_VALUES = [
    "Black",
    "White",
    "Grey",
    "Brown",
    "Beige",
    "Green",
    "Blue",
    "Red",
    "Yellow",
    "Orange",
    "Purple",
    "Pink",
    "Multicolor",
  ];
  const CONDITION_VALUES = ["New", "Like New", "Used"];

  const ATTRIBUTE_DEFS = [
    { name: "Size", handle: "size", values: [...APPAREL_SIZES, ...FOOTWEAR_SIZES] },
    { name: "Color", handle: "color", values: COLOR_VALUES },
    { name: "Condition", handle: "condition", values: CONDITION_VALUES },
  ];

  type SeededAttribute = {
    id: string;
    handle: string;
    values: { id: string; name: string }[];
  };

  const loadAttributes = async () => {
    const { data } = await query.graph({
      entity: "product_attribute",
      fields: ["id", "handle", "values.id", "values.name"],
      filters: {
        handle: ATTRIBUTE_DEFS.map((a) => a.handle),
        product_id: null,
      },
    });
    return new Map(
      (data as SeededAttribute[]).map((a) => [a.handle, a])
    );
  };

  let attrByHandle = await loadAttributes();
  const missingAttrs = ATTRIBUTE_DEFS.filter((a) => !attrByHandle.has(a.handle));

  if (missingAttrs.length) {
    await createProductAttributesWorkflow(container).run({
      input: {
        attributes: missingAttrs.map((attr, index) => ({
          name: attr.name,
          handle: attr.handle,
          type: AttributeType.MULTI_SELECT,
          is_variant_axis: true,
          is_filterable: true,
          rank: index,
          values: attr.values.map((name, rank) => ({ name, rank })),
        })),
      },
    });
    attrByHandle = await loadAttributes();
  }

  // Older databases (seeded before the High Society catalog) lack some values,
  // e.g. apparel sizes on Size. Add only what is missing.
  let addedValues = false;
  for (const def of ATTRIBUTE_DEFS) {
    const attr = attrByHandle.get(def.handle);
    if (!attr) continue;
    const have = new Set(attr.values.map((v) => v.name));
    const missing = def.values.filter((name) => !have.has(name));
    if (!missing.length) continue;
    await createProductAttributeValuesWorkflow(container).run({
      input: {
        attribute_id: attr.id,
        values: missing.map((name) => ({ name, rank: def.values.indexOf(name) })),
      },
    });
    addedValues = true;
  }
  if (addedValues) attrByHandle = await loadAttributes();

  const sizeAttr = attrByHandle.get("size")!;
  const colorAttr = attrByHandle.get("color")!;
  const conditionAttr = attrByHandle.get("condition")!;

  const valueId = (attr: SeededAttribute, name: string) =>
    attr.values.find((v) => v.name === name)?.id;

  const COLOR_KEYWORDS: [string, string][] = [
    ["black", "Black"],
    ["white", "White"],
    ["pearl", "White"],
    ["cream", "Beige"],
    ["sand", "Beige"],
    ["beige", "Beige"],
    ["wheat", "Beige"],
    ["tan", "Beige"],
    ["nubuck", "Beige"],
    ["grey", "Grey"],
    ["gray", "Grey"],
    ["anthracite", "Grey"],
    ["quarry", "Grey"],
    ["graphite", "Grey"],
    ["platinum", "Grey"],
    ["brown", "Brown"],
    ["chocolate", "Brown"],
    ["cocoa", "Brown"],
    ["wood", "Brown"],
    ["hickory", "Brown"],
    ["chestnut", "Brown"],
    ["roast", "Brown"],
    ["truffle", "Brown"],
    ["olive", "Green"],
    ["camo", "Green"],
    ["neon", "Green"],
    ["green", "Green"],
    ["navy", "Blue"],
    ["sapphire", "Blue"],
    ["cobalt", "Blue"],
    ["turquoise", "Blue"],
    ["aurora", "Blue"],
    ["blue", "Blue"],
    ["maroon", "Red"],
    ["red", "Red"],
    ["yellow", "Yellow"],
    ["orange", "Orange"],
    ["purple", "Purple"],
    ["pink", "Pink"],
    ["multi", "Multicolor"],
  ];
  const mapColor = (colorway: string) => {
    const c = colorway.toLowerCase();
    for (const [keyword, color] of COLOR_KEYWORDS) {
      if (c.includes(keyword)) {
        return color;
      }
    }
    return "Multicolor";
  };
  const conditionForIndex = (index: number) =>
    ["New", "New", "New", "Like New", "Used"][index % 5];

  logger.info("Finished seeding global product attributes.");

  const SELLER_PASSWORD = "supersecret";
  const SELLER_CONFIGS = [
    { name: "High Society", email: "highsociety@vitrinaki.gr", first_name: "Demo", last_name: "Seller", city: "Αθήνα", country_code: "GR", address_1: "Ερμού 10" },
    { name: "Aegean Atelier", email: "aegean@vitrinaki.gr", first_name: "Kai", last_name: "Corner", city: "Θεσσαλονίκη", country_code: "GR", address_1: "Τσιμισκή 25" },
    { name: "Urban Thread", email: "urban@vitrinaki.gr", first_name: "Tara", last_name: "Head", city: "Πάτρα", country_code: "GR", address_1: "Μαιζώνος 40" },
  ];
  const PRIMARY_SELLER_EMAIL = SELLER_CONFIGS[0].email;

  // DiceBear renders a crisp initials avatar per seller name; Picsum returns a
  // deterministic photo for the same seed, so re-seeding is stable.
  const sellerLogo = (name: string) =>
    `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(name)}`;
  const sellerBanner = (name: string) =>
    `https://picsum.photos/seed/${toHandle(name)}/1200/320`;

  // Every demo seller gets a published sample website with a promo
  // subscription, each in a different template, so the shop pages work right
  // after seeding without Stripe. Safe to re-run: existing metadata is kept.
  const SAMPLE_SHOPS: Record<string, { tagline: string; description: string; template: string; palette: string }> = {
    "High Society": {
      tagline: "Κομψό ανδρικό ντύσιμο, διαχρονικές γραμμές",
      description: "Polo, πουκάμισα, ζακέτες και αξεσουάρ με καθαρές γραμμές και ποιοτικά υφάσματα. Σχεδιασμένα για να φοριούνται κάθε μέρα, για χρόνια.",
      template: "atelier",
      palette: "ocean",
    },
    "Aegean Atelier": {
      tagline: "Ρούχα με το φως του Αιγαίου",
      description: "Λινά, βαμβακερά και ανάλαφρα κομμάτια για την πόλη και το νησί, από ένα μικρό ατελιέ στη Θεσσαλονίκη.",
      template: "local",
      palette: "terracotta",
    },
    "Urban Thread": {
      tagline: "Καθημερινό στυλ για την πόλη",
      description: "Βασικά κομμάτια, παντελόνια και παπούτσια για κάθε μέρα. Παραγγελία online, παραλαβή ή αποστολή σε όλη την Ελλάδα.",
      template: "services",
      palette: "plum",
    },
  };
  const publishSampleShops = async () => {
    const storefrontBaseUrl = (process.env.VITRINAKI_STOREFRONT_URL || "http://localhost:3100").replace(/\/+$/, "");
    const locale = process.env.VITRINAKI_DEFAULT_LOCALE || "gr";
    const { data: demoSellers } = await query.graph({
      entity: "seller",
      fields: ["id", "name", "handle", "email", "metadata"],
      filters: { email: SELLER_CONFIGS.map((c) => c.email) },
    });
    for (const seller of demoSellers as any[]) {
      const sample = SAMPLE_SHOPS[seller.name];
      if (!sample) continue;
      const now = new Date().toISOString();
      await updateSellersWorkflow(container).run({
        input: {
          selector: { id: seller.id },
          update: {
            metadata: {
              ...(seller.metadata || {}),
              storefront_url: `${storefrontBaseUrl}/${locale}/store/${seller.handle}`,
              vitrinaki_subscription: seller.metadata?.vitrinaki_subscription || {
                status: "active",
                source: "promo",
                promoCode: "SEED",
                planId: "growth",
                interval: null,
                currentPeriodEnd: null,
                cancelAtPeriodEnd: false,
                updatedAt: now,
              },
              vitrinaki_storefront: seller.metadata?.vitrinaki_storefront || {
                storeName: seller.name,
                tagline: sample.tagline,
                description: sample.description,
                template: sample.template,
                palette: sample.palette,
                contactEmail: seller.email,
                contactPhone: "",
                logoUrl: "",
                bannerUrl: "",
                sections: [],
                customDomain: "",
                domainStatus: "not_configured",
                domainVerificationToken: "",
                domainVerifiedAt: null,
                isPublished: true,
                publishedAt: now,
                updatedAt: now,
              },
            },
          },
        },
      });
    }
  };

  const { data: existingSellers } = await query.graph({
    entity: "seller",
    fields: ["id"],
    filters: { email: PRIMARY_SELLER_EMAIL },
  });

  if (existingSellers[0]) {
    logger.info(
      "Demo sellers already exist, skipping seller, product and offer seeding."
    );
    await publishSampleShops();
    logger.info("Finished seeding.");
    return;
  }

  const authModuleService = container.resolve(Modules.AUTH);

  // One marketplace-wide shipping profile shared by every seller's shipping
  // options and every offer. createOffersWorkflow links each offer's product to
  // this profile, so the cart-refresh orphan-cleanup keeps per-seller shipping
  // methods (it matches option profile against the product's profile).
  let sharedShippingProfileId: string;
  const { data: existingProfiles } = await query.graph({
    entity: "shipping_profile",
    fields: ["id"],
    filters: { name: "Marketplace Shipping" },
  });
  if (existingProfiles[0]) {
    sharedShippingProfileId = existingProfiles[0].id as string;
  } else {
    const {
      result: [createdProfile],
    } = await createShippingProfilesWorkflow(container).run({
      input: { data: [{ name: "Marketplace Shipping", type: "default" }] },
    });
    sharedShippingProfileId = createdProfile.id;
  }

  type SeededSeller = {
    id: string;
    name: string;
    memberId: string;
    stockLocationId: string;
    shippingProfileId: string;
  };
  const sellers: SeededSeller[] = [];

  for (const [index, sellerConfig] of SELLER_CONFIGS.entries()) {
    logger.info(`Seeding seller "${sellerConfig.name}"...`);

    let authIdentityId: string;
    const registerResponse = await authModuleService.register("emailpass", {
      body: { email: sellerConfig.email, password: SELLER_PASSWORD },
    });

    if (registerResponse.success && registerResponse.authIdentity) {
      authIdentityId = registerResponse.authIdentity.id;
    } else {
      const [providerIdentity] =
        await authModuleService.listProviderIdentities({
          entity_id: sellerConfig.email,
          provider: "emailpass",
        });
      authIdentityId = providerIdentity.auth_identity_id!;
    }

    const { result: seller } = await createSellerAccountWorkflow(
      container
    ).run({
      input: {
        auth_identity_id: authIdentityId,
        member_email: sellerConfig.email,
        first_name: sellerConfig.first_name,
        last_name: sellerConfig.last_name,
        seller: {
          name: sellerConfig.name,
          email: sellerConfig.email,
          currency_code: "eur",
          description: `${sellerConfig.name} — δοκιμαστικό κατάστημα κομψού ρουχισμού.`,
          logo: sellerLogo(sellerConfig.name),
          banner: sellerBanner(sellerConfig.name),
        },
      },
    });

    await approveSellerWorkflow(container).run({
      input: { seller_id: seller.id },
    });

  const { data: members } = await query.graph({
      entity: "member",
      fields: ["id"],
      filters: { email: sellerConfig.email },
    });
    const memberId = members[0].id;

    const { result: stockLocations } =
      await createSellerStockLocationsWorkflow(container).run({
        input: {
          seller_id: seller.id,
          locations: [
            {
              name: `${sellerConfig.name} Warehouse`,
              address: {
                city: sellerConfig.city,
                country_code: sellerConfig.country_code,
                address_1: sellerConfig.address_1,
              },
            },
          ],
        },
      });
    const stockLocation = stockLocations[0];

    await link.create({
      [Modules.STOCK_LOCATION]: { stock_location_id: stockLocation.id },
      [Modules.FULFILLMENT]: { fulfillment_provider_id: "manual_manual" },
    });

    await linkSalesChannelsToStockLocationWorkflow(container).run({
      input: {
        id: stockLocation.id,
        add: [defaultSalesChannel[0].id],
      },
    });

    if (index === 0) {
      await updateStoresWorkflow(container).run({
        input: {
          selector: { id: store.id },
          update: {
            default_location_id: stockLocation.id,
          },
        },
      });
    }

    await createLocationFulfillmentSetWorkflow(container).run({
      input: {
        location_id: stockLocation.id,
        fulfillment_set_data: {
          name: `${sellerConfig.name} delivery`,
          type: "shipping",
        },
      },
    });

    const {
      data: [locationWithSet],
    } = await query.graph({
      entity: "stock_location",
      fields: ["id", "fulfillment_sets.id"],
      filters: { id: stockLocation.id },
    });
    const fulfillmentSetId = locationWithSet?.fulfillment_sets?.[0]?.id;
    if (!fulfillmentSetId) {
      throw new Error(
        `Fulfillment set was not created for seller "${sellerConfig.name}"`
      );
    }

    const { result: serviceZones } = await createServiceZonesWorkflow(
      container
    ).run({
      input: {
        data: [
          {
            fulfillment_set_id: fulfillmentSetId,
            name: `${sellerConfig.name} Europe`,
            geo_zones: countries.map((country_code) => ({
              country_code,
              type: "country" as const,
            })),
          },
        ],
      },
    });
    const serviceZoneId = serviceZones[0].id;

    const shippingProfileId = sharedShippingProfileId;

    await createSellerShippingOptionsWorkflow(container).run({
      input: {
        seller_id: seller.id,
        shipping_options: [
          {
            name: "Κανονική αποστολή",
            price_type: "flat",
            provider_id: "manual_manual",
            service_zone_id: serviceZoneId,
            shipping_profile_id: shippingProfileId,
            type: {
              label: "Κανονική",
              description: "Παράδοση σε 2-3 εργάσιμες.",
              code: "standard",
            },
            prices: [
              { currency_code: "eur", amount: 3.5 },
              { region_id: region.id, amount: 3.5 },
            ],
            rules: [
              { attribute: "enabled_in_store", value: "true", operator: "eq" },
              { attribute: "is_return", value: "false", operator: "eq" },
            ],
          },
          {
            name: "Express αποστολή",
            price_type: "flat",
            provider_id: "manual_manual",
            service_zone_id: serviceZoneId,
            shipping_profile_id: shippingProfileId,
            type: {
              label: "Express",
              description: "Παράδοση την επόμενη εργάσιμη.",
              code: "express",
            },
            prices: [
              { currency_code: "eur", amount: 6 },
              { region_id: region.id, amount: 6 },
            ],
            rules: [
              { attribute: "enabled_in_store", value: "true", operator: "eq" },
              { attribute: "is_return", value: "false", operator: "eq" },
            ],
          },
        ],
      },
    });

    sellers.push({
      id: seller.id,
      name: sellerConfig.name,
      memberId,
      stockLocationId: stockLocation.id,
      shippingProfileId,
    });
    logger.info(`Finished seeding seller "${sellerConfig.name}".`);
  }

  const primarySeller = sellers[0];

  await publishSampleShops();
  logger.info(`Finished seeding ${sellers.length} sellers.`);

  logger.info("Seeding product data...");

  const catalog = seedCatalog;

  const slugify = (value: string) =>
    value
      .toLowerCase()
      .replace(/'/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

  const usedHandles = new Set<string>();
  const uniqueHandle = (title: string) => {
    const base = slugify(title);
    let handle = base;
    let n = 2;
    while (usedHandles.has(handle)) {
      handle = `${base}-${n++}`;
    }
    usedHandles.add(handle);
    return handle;
  };

  const products: CreateProductDTO[] = catalog.map((item, index) => {
    const handle = uniqueHandle(item.title);
    const skuBase = handle.toUpperCase().replace(/-/g, "");
    const images = item.images.map((url) => ({ url }));

    const color = mapColor(item.colorway);
    const condition = conditionForIndex(index);
    const sizes =
      item.sizing === "apparel" ? APPAREL_SIZES : item.sizing === "shoes" ? FOOTWEAR_SIZES : [];

    const attributes = [
      ...(sizes.length
        ? [
            {
              id: sizeAttr.id,
              value_ids: sizes.map((size) =>
                valueId(sizeAttr, size)
              ).filter((id): id is string => Boolean(id)),
            },
          ]
        : []),
      {
        id: colorAttr.id,
        value_ids: [valueId(colorAttr, color)].filter(
          (id): id is string => Boolean(id)
        ),
      },
      {
        id: conditionAttr.id,
        value_ids: [valueId(conditionAttr, condition)].filter(
          (id): id is string => Boolean(id)
        ),
      },
    ];

    const variants = sizes.length
      ? sizes.map((size) => ({
          title: item.sizing === "shoes" ? `EU ${size}` : size,
          sku: `${skuBase}-${size}`,
          options: { Size: size, Color: color, Condition: condition },
        }))
      : [
          {
            title: "One Size",
            sku: `${skuBase}-OS`,
            options: { Color: color, Condition: condition },
          },
        ];

    return {
      title: item.title,
      category_ids: [catByName.get(item.category)!.id],
      description: item.description,
      handle,
      weight: item.sizing === "shoes" ? 1200 : 400,
      status: ProductStatus.PUBLISHED,
      thumbnail: images[0].url,
      images,
      attributes,
      variants,
    };
  });

  await createProductsWorkflow(container).run({
    input: {
      created_by: primarySeller.memberId,
      products,
    },
  });
  logger.info(`Finished seeding ${products.length} products.`);

  logger.info("Creating randomized offers across sellers...");

  // Deterministic PRNG (mulberry32) so re-seeding produces the same spread.
  let rngState = 0x9e3779b9;
  const rand = () => {
    rngState = (rngState + 0x6d2b79f5) | 0;
    let t = rngState;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const randInt = (min: number, max: number) =>
    min + Math.floor(rand() * (max - min + 1));

  const priceByHandle = new Map(
    products.map((product, index) => [product.handle, catalog[index].price])
  );
  const { data: seededProducts } = await query.graph({
    entity: "product",
    fields: ["id", "handle", "variants.id", "variants.sku"],
    filters: {
      handle: products
        .map((product) => product.handle)
        .filter((handle): handle is string => Boolean(handle)),
    },
  });

  const offers: CreateOfferDTO[] = [];

  for (const product of seededProducts) {
    const basePrice = priceByHandle.get(product.handle) ?? 50;

    // At least one seller always carries the product; the rest are random.
    const shuffledSellers = [...sellers].sort(() => rand() - 0.5);
    const participantCount = randInt(1, sellers.length);
    const participants = shuffledSellers.slice(0, participantCount);

    for (const seller of participants) {
      for (const variant of product.variants as {
        id: string;
        sku: string | null;
      }[]) {
        const offerCount = randInt(1, 2);
        for (let o = 0; o < offerCount; o++) {
          const jitter = 1 + (rand() * 0.3 - 0.15); // ±15%
          const eur = Math.max(1, Math.round(basePrice * jitter));
          const usd = Math.round(eur * 1.08);
          const sku = `OFFER-${seller.id.slice(-4)}-${variant.sku}-${o + 1}`;
          offers.push({
            seller_id: seller.id,
            created_by: seller.memberId,
            sku,
            variant_id: variant.id,
            shipping_profile_id: seller.shippingProfileId,
            inventory_items: [
              {
                sku,
                stock_levels: [
                  {
                    location_id: seller.stockLocationId,
                    stocked_quantity: 1000000,
                  },
                ],
              },
            ],
            prices: [
              { amount: eur, currency_code: "eur" },
              { amount: usd, currency_code: "usd" },
            ],
          });
        }
      }
    }
  }

  await createOffersWorkflow(container).run({ input: { offers } });
  logger.info(
    `Finished creating ${offers.length} offers across ${sellers.length} sellers.`
  );

  logger.info("Finished seeding.");
}
