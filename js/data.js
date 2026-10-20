/**
 * SMVDU Green Atlas: Core Data Engine & IndexedDB Storage Architecture
 * 175 catalogued taxa: 116 mapped field records + 59 verified datasheet additions.
 * The IndexedDB name is intentionally unchanged so existing field observations survive upgrades.
 */

const DB_NAME = 'SMVDU_BIO_INDEXED_DB';
const DB_VERSION = 4;
const STORE_NAME = 'specimens';

let _cachedFloraRecords = [];
let _dbInstance = null;
let _lastMigrationRelocatedCount = 0;

const INITIAL_FLORA_RECORDS = [
    {
        "id": "SMVDU-FL-001",
        "botanicalName": "Pinus roxburghii",
        "commonName": "Chir Pine",
        "dogriName": "Cheel",
        "family": "Pinaceae",
        "habit": "Tree",
        "zone": "Pine Ridge Belt",
        "coords": [
            32.9431,
            74.9542
        ],
        "elevation": "840m MSL",
        "toxicity": "Safe",
        "toxicAgent": "Non-toxic resiniferous tissue",
        "firstAid": "Wash skin with soap and warm water if resin adheres.",
        "phenology": "Cone maturation: Oct - Dec; Seed shedding: Mar - Apr",
        "iucn": "LC",
        "notes": "Dominant canopy conifer along northern ridges. Natural fire-resistant thick bark.",
        "photo": null,
        "verified": true
    },
    {
        "id": "SMVDU-FL-002",
        "botanicalName": "Mallotus philippensis",
        "commonName": "Kamala Tree",
        "dogriName": "Kamila / Rohini",
        "family": "Euphorbiaceae",
        "habit": "Tree",
        "zone": "Pine Ridge Belt",
        "coords": [
            32.9436,
            74.9538
        ],
        "elevation": "835m MSL",
        "toxicity": "Mild Irritant",
        "toxicAgent": "Rottlerin in fruit glandular hairs",
        "firstAid": "Rinse skin; avoid touching eyes after handling red fruit dust.",
        "phenology": "Flowering: Sep - Nov; Fruiting: Feb - May",
        "iucn": "LC",
        "notes": "Glandular hair on capsules yields commercial red Kamala dye; prominent understory tree.",
        "photo": null,
        "verified": false
    },
    {
        "id": "SMVDU-FL-003",
        "botanicalName": "Myrsine africana",
        "commonName": "Cape Myrtle",
        "dogriName": "Bebrang",
        "family": "Primulaceae",
        "habit": "Shrub",
        "zone": "Pine Ridge Belt",
        "coords": [
            32.9441,
            74.9546
        ],
        "elevation": "850m MSL",
        "toxicity": "Safe",
        "toxicAgent": "Non-hazardous under field contact",
        "firstAid": "Standard field hygiene.",
        "phenology": "Flowering: Mar - May; Fruiting: Jun - Aug",
        "iucn": "LC",
        "notes": "Evergreen hill shrub; fruits traditionally collected for anthelmintic preparations.",
        "photo": null,
        "verified": false
    },
    {
        "id": "SMVDU-FL-004",
        "botanicalName": "Quercus leucotrichophora",
        "commonName": "Banj Oak",
        "dogriName": "Rianj",
        "family": "Fagaceae",
        "habit": "Tree",
        "zone": "Pine Ridge Belt",
        "coords": [
            32.9448,
            74.9551
        ],
        "elevation": "875m MSL",
        "toxicity": "Safe",
        "toxicAgent": "Tannins in acorns (astringent, non-contact hazard)",
        "firstAid": "Wash hands post collection.",
        "phenology": "Flowering: Apr - May; Acorns mature: Nov - Dec",
        "iucn": "LC",
        "notes": "High ridge indicator tree; significant water catchment retention properties.",
        "photo": null,
        "verified": false
    },
    {
        "id": "SMVDU-FL-005",
        "botanicalName": "Rubus ellipticus",
        "commonName": "Golden Himalayan Raspberry",
        "dogriName": "Aakhi",
        "family": "Rosaceae",
        "habit": "Shrub",
        "zone": "Pine Ridge Belt",
        "coords": [
            32.9439,
            74.9532
        ],
        "elevation": "845m MSL",
        "toxicity": "Safe",
        "toxicAgent": "Non-toxic (mechanical prickles only)",
        "firstAid": "Clean surface punctures with antiseptic.",
        "phenology": "Flowering: Feb - Apr; Fruiting: Apr - Jun",
        "iucn": "LC",
        "notes": "Thorny shrub yielding edible golden drupelets relished across Jammu foothills.",
        "photo": null,
        "verified": false
    },
    {
        "id": "SMVDU-FL-006",
        "botanicalName": "Berberis lycium",
        "commonName": "Indian Barberry",
        "dogriName": "Kashmal / Darhald",
        "family": "Berberidaceae",
        "habit": "Shrub",
        "zone": "Pine Ridge Belt",
        "coords": [
            32.9444,
            74.9548
        ],
        "elevation": "860m MSL",
        "toxicity": "Safe",
        "toxicAgent": "Isoquinoline alkaloid Berberine (bitter medicinal)",
        "firstAid": "Rinse hands post root/bark collection.",
        "phenology": "Flowering: Mar - May; Fruiting: Jun - Jul",
        "iucn": "LC",
        "notes": "Wood extracts used in traditional 'Rasaunt' preparation for ocular and hepatic wellness.",
        "photo": null,
        "verified": false
    },
    {
        "id": "SMVDU-FL-007",
        "botanicalName": "Pyrus pashia",
        "commonName": "Wild Himalayan Pear",
        "dogriName": "Batangi",
        "family": "Rosaceae",
        "habit": "Tree",
        "zone": "Pine Ridge Belt",
        "coords": [
            32.9434,
            74.9555
        ],
        "elevation": "855m MSL",
        "toxicity": "Safe",
        "toxicAgent": "Non-toxic",
        "firstAid": "Standard field hygiene.",
        "phenology": "Flowering: Feb - Mar; Fruiting: Jul - Sep",
        "iucn": "LC",
        "notes": "White spring blooms along upper slopes; bletted overripe fruits consumed locally.",
        "photo": null,
        "verified": false
    },
    {
        "id": "SMVDU-FL-008",
        "botanicalName": "Woodfordia fruticosa",
        "commonName": "Fire Flame Bush",
        "dogriName": "Dhaura / Dhai",
        "family": "Lythraceae",
        "habit": "Shrub",
        "zone": "Pine Ridge Belt",
        "coords": [
            32.9427,
            74.9549
        ],
        "elevation": "830m MSL",
        "toxicity": "Safe",
        "toxicAgent": "Non-hazardous; rich in polyphenols",
        "firstAid": "Standard field hygiene.",
        "phenology": "Flowering: Feb - Apr; Fruiting: Apr - Jun",
        "iucn": "LC",
        "notes": "Brilliant scarlet flowers essential as Ayurvedic fermentation catalysts (Asava/Arishta).",
        "photo": null,
        "verified": false
    },
    {
        "id": "SMVDU-FL-009",
        "botanicalName": "Asparagus adscendens",
        "commonName": "Himalayan Asparagus",
        "dogriName": "Safed Musli / Sansar",
        "family": "Asparagaceae",
        "habit": "Climber",
        "zone": "Pine Ridge Belt",
        "coords": [
            32.9442,
            74.9536
        ],
        "elevation": "840m MSL",
        "toxicity": "Safe",
        "toxicAgent": "Non-toxic (spiny cladodes)",
        "firstAid": "Treat minor scrapes if handled without gloves.",
        "phenology": "Flowering: Sep - Oct; Fruiting: Nov - Dec",
        "iucn": "LC",
        "notes": "Spiny climbing undergrowth; tuberous root fascicles used in traditional tonic formulations.",
        "photo": null,
        "verified": false
    },
    {
        "id": "SMVDU-FL-010",
        "botanicalName": "Desmodium gangeticum",
        "commonName": "Salparni",
        "dogriName": "Salwan",
        "family": "Fabaceae",
        "habit": "Herb",
        "zone": "Pine Ridge Belt",
        "coords": [
            32.9432,
            74.9539
        ],
        "elevation": "825m MSL",
        "toxicity": "Safe",
        "toxicAgent": "Non-toxic",
        "firstAid": "Standard hygiene.",
        "phenology": "Flowering: Jun - Aug; Fruiting: Sep - Nov",
        "iucn": "LC",
        "notes": "Subshrub component of the classical Dashmula Ayurvedic pharmacopoeia.",
        "photo": null,
        "verified": false
    },
    {
        "id": "SMVDU-FL-011",
        "botanicalName": "Cymbopogon distans",
        "commonName": "Himalayan Lemon Grass",
        "dogriName": "Khori Ghas",
        "family": "Poaceae",
        "habit": "Herb",
        "zone": "Pine Ridge Belt",
        "coords": [
            32.9446,
            74.9541
        ],
        "elevation": "865m MSL",
        "toxicity": "Safe",
        "toxicAgent": "Aromatic essential oils (citral/geraniol)",
        "firstAid": "Non-hazardous; aromatic.",
        "phenology": "Flowering: Jul - Oct",
        "iucn": "LC",
        "notes": "Densely tufted perennial grass binding fragile gravel slopes along the upper ridge trail.",
        "photo": null,
        "verified": false
    },
    {
        "id": "SMVDU-FL-012",
        "botanicalName": "Pteridium aquilinum",
        "commonName": "Bracken Fern",
        "dogriName": "Kakrhand",
        "family": "Dennstaedtiaceae",
        "habit": "Herb",
        "zone": "Pine Ridge Belt",
        "coords": [
            32.9449,
            74.9534
        ],
        "elevation": "870m MSL",
        "toxicity": "Mild Irritant",
        "toxicAgent": "Ptaquiloside (toxic on livestock ingestion)",
        "firstAid": "Wash skin; do not consume raw shoots.",
        "phenology": "Spore sporulation: Jul - Oct",
        "iucn": "LC",
        "notes": "Rhizomatous fern colonizing pine forest understory floor where needle mulch accumulates.",
        "photo": null,
        "verified": false
    },
    {
        "id": "SMVDU-FL-013",
        "botanicalName": "Indigofera cassioides",
        "commonName": "Wild Indigo",
        "dogriName": "Kathi",
        "family": "Fabaceae",
        "habit": "Shrub",
        "zone": "Pine Ridge Belt",
        "coords": [
            32.9438,
            74.9558
        ],
        "elevation": "845m MSL",
        "toxicity": "Safe",
        "toxicAgent": "Non-toxic",
        "firstAid": "Standard hygiene.",
        "phenology": "Flowering: Feb - Apr; Fruiting: May - Jun",
        "iucn": "LC",
        "notes": "Showy rose-pink racemes; nitrogen-fixing woody legume stabilizing upper slope soil.",
        "photo": null,
        "verified": false
    },
    {
        "id": "SMVDU-FL-014",
        "botanicalName": "Flemingia chappar",
        "commonName": "Winged Bract Bush",
        "dogriName": "Chhanchhan",
        "family": "Fabaceae",
        "habit": "Shrub",
        "zone": "Pine Ridge Belt",
        "coords": [
            32.9443,
            74.9554
        ],
        "elevation": "855m MSL",
        "toxicity": "Safe",
        "toxicAgent": "Non-toxic",
        "firstAid": "Standard hygiene.",
        "phenology": "Flowering: Aug - Oct; Fruiting: Nov - Dec",
        "iucn": "LC",
        "notes": "Distinctive papery folding bracts enveloping small flowers in dry pine understory.",
        "photo": null,
        "verified": false
    },
    {
        "id": "SMVDU-FL-015",
        "botanicalName": "Reinwardtia indica",
        "commonName": "Yellow Flax",
        "dogriName": "Basant / Pyali",
        "family": "Linaceae",
        "habit": "Herb",
        "zone": "Pine Ridge Belt",
        "coords": [
            32.943,
            74.9552
        ],
        "elevation": "835m MSL",
        "toxicity": "Safe",
        "toxicAgent": "Non-hazardous",
        "firstAid": "Standard hygiene.",
        "phenology": "Flowering: Nov - Mar; Fruiting: Apr - May",
        "iucn": "LC",
        "notes": "Vibrant yellow pentamerous flowers blooming through winter on shaded pine banks.",
        "photo": null,
        "verified": false
    },
    {
        "id": "SMVDU-FL-016",
        "botanicalName": "Cotinus coggygria",
        "commonName": "Smoke Bush",
        "dogriName": "Tung",
        "family": "Anacardiaceae",
        "habit": "Shrub",
        "zone": "Pine Ridge Belt",
        "coords": [
            32.9447,
            74.9549
        ],
        "elevation": "868m MSL",
        "toxicity": "Mild Irritant",
        "toxicAgent": "Resinous sap can irritate sensitive skin",
        "firstAid": "Wash skin with soap.",
        "phenology": "Flowering: Apr - Jun; Fruiting: Jul - Aug",
        "iucn": "LC",
        "notes": "Wispy plumose inflorescences giving smoke-like halo on rocky south-facing ridges.",
        "photo": null,
        "verified": false
    },
    {
        "id": "SMVDU-FL-017",
        "botanicalName": "Dioscorea belophylla",
        "commonName": "Wild Yam",
        "dogriName": "Tarad",
        "family": "Dioscoreaceae",
        "habit": "Climber",
        "zone": "Pine Ridge Belt",
        "coords": [
            32.9437,
            74.9535
        ],
        "elevation": "840m MSL",
        "toxicity": "Safe",
        "toxicAgent": "Raw tubers contain saponins (edible after boiling)",
        "firstAid": "Do not consume raw tubers.",
        "phenology": "Flowering: Aug - Oct; Fruiting: Nov - Jan",
        "iucn": "LC",
        "notes": "Twinning herbaceous climber; tubers collected traditionally during lean famine periods.",
        "photo": null,
        "verified": false
    },
    {
        "id": "SMVDU-FL-018",
        "botanicalName": "Micromeria biflora",
        "commonName": "Lemon Thyme Bush",
        "dogriName": "Ban Tulsi",
        "family": "Lamiaceae",
        "habit": "Herb",
        "zone": "Pine Ridge Belt",
        "coords": [
            32.9445,
            74.9539
        ],
        "elevation": "860m MSL",
        "toxicity": "Safe",
        "toxicAgent": "Volatile monoterpenes",
        "firstAid": "Safe aromatic herb.",
        "phenology": "Flowering: Mar - May & Aug - Oct",
        "iucn": "LC",
        "notes": "Strongly lemon-aromatic dwarf suffruticose herb growing out of rocky crevices.",
        "photo": null,
        "verified": false
    },
    {
        "id": "SMVDU-FL-019",
        "botanicalName": "Campanula latifolia",
        "commonName": "Broad-leaved Bellflower",
        "dogriName": "Khor Ghas",
        "family": "Campanulaceae",
        "habit": "Herb",
        "zone": "Pine Ridge Belt",
        "coords": [
            32.9442,
            74.9544
        ],
        "elevation": "858m MSL",
        "toxicity": "Safe",
        "toxicAgent": "Non-toxic",
        "firstAid": "Standard hygiene.",
        "phenology": "Flowering: Jul - Sep",
        "iucn": "LC",
        "notes": "Erect perennial herb with large violet bell-shaped flowers on moist shaded slopes.",
        "photo": null,
        "verified": false
    },
    {
        "id": "SMVDU-FL-020",
        "botanicalName": "Rhus chinensis",
        "commonName": "Chinese Sumac",
        "dogriName": "Tetar",
        "family": "Anacardiaceae",
        "habit": "Tree",
        "zone": "Pine Ridge Belt",
        "coords": [
            32.9433,
            74.9547
        ],
        "elevation": "838m MSL",
        "toxicity": "Mild Irritant",
        "toxicAgent": "Allergenic urushiol-like phenols in sap",
        "firstAid": "Wash skin immediately if milky sap touches dermis.",
        "phenology": "Flowering: Aug - Sep; Fruiting: Oct - Nov",
        "iucn": "LC",
        "notes": "Winged leaf rachis; galls are rich in astringent tannic acid used in leather tanning.",
        "photo": null,
        "verified": false
    },
    {
        "id": "SMVDU-FL-021",
        "botanicalName": "Smilax aspera",
        "commonName": "Prickly Ivy",
        "dogriName": "Kukardaran",
        "family": "Smilacaceae",
        "habit": "Climber",
        "zone": "Pine Ridge Belt",
        "coords": [
            32.944,
            74.9553
        ],
        "elevation": "852m MSL",
        "toxicity": "Safe",
        "toxicAgent": "Mechanical spine hazard",
        "firstAid": "Standard scrape treatment.",
        "phenology": "Flowering: Aug - Oct; Fruiting: Dec - Feb",
        "iucn": "LC",
        "notes": "Tough evergreen climber with paired tendrils scrambling over pine base scrub.",
        "photo": null,
        "verified": false
    },
    {
        "id": "SMVDU-FL-022",
        "botanicalName": "Geranium mascatense",
        "commonName": "Foothill Crane's Bill",
        "dogriName": "Bhanda",
        "family": "Geraniaceae",
        "habit": "Herb",
        "zone": "Pine Ridge Belt",
        "coords": [
            32.9435,
            74.954
        ],
        "elevation": "842m MSL",
        "toxicity": "Safe",
        "toxicAgent": "Non-toxic",
        "firstAid": "Standard hygiene.",
        "phenology": "Flowering: Feb - Apr",
        "iucn": "LC",
        "notes": "Small pink flowers; colonizes rock ledges under light conifer canopy.",
        "photo": null,
        "verified": false
    },
    {
        "id": "SMVDU-FL-023",
        "botanicalName": "Heteropogon contortus",
        "commonName": "Spear Grass",
        "dogriName": "Suryala",
        "family": "Poaceae",
        "habit": "Herb",
        "zone": "Pine Ridge Belt",
        "coords": [
            32.9447,
            74.9537
        ],
        "elevation": "865m MSL",
        "toxicity": "Safe",
        "toxicAgent": "Sharp awns penetrate socks/skin (mechanical)",
        "firstAid": "Carefully extract twisted awns.",
        "phenology": "Flowering: Aug - Nov",
        "iucn": "LC",
        "notes": "Tufted tussock grass with hygroscopic twisting awns adapted to dry slopes.",
        "photo": null,
        "verified": false
    },
    {
        "id": "SMVDU-FL-024",
        "botanicalName": "Inula cappa",
        "commonName": "Woolly Inula",
        "dogriName": "Bhangru",
        "family": "Asteraceae",
        "habit": "Shrub",
        "zone": "Pine Ridge Belt",
        "coords": [
            32.9432,
            74.9556
        ],
        "elevation": "835m MSL",
        "toxicity": "Safe",
        "toxicAgent": "Sesquiterpene lactones",
        "firstAid": "Standard hygiene.",
        "phenology": "Flowering: Sep - Nov; Fruiting: Dec - Jan",
        "iucn": "LC",
        "notes": "Densely silky undersides of leaves; conspicuous yellow composite flowerheads.",
        "photo": null,
        "verified": false
    },
    {
        "id": "SMVDU-FL-025",
        "botanicalName": "Cheilanthes farinosa",
        "commonName": "Silver Fern",
        "dogriName": "Rupakhand",
        "family": "Pteridaceae",
        "habit": "Herb",
        "zone": "Pine Ridge Belt",
        "coords": [
            32.9443,
            74.9533
        ],
        "elevation": "856m MSL",
        "toxicity": "Safe",
        "toxicAgent": "White farinose ceraceous powder (non-toxic)",
        "firstAid": "Standard field hygiene.",
        "phenology": "Sporulation: Jul - Oct",
        "iucn": "LC",
        "notes": "Distinctive white waxy meal coating lower surface of fronds for drought reduction.",
        "photo": null,
        "verified": false
    },
    {
        "id": "SMVDU-FL-026",
        "botanicalName": "Bauhinia variegata",
        "commonName": "Orchid Tree / Mountain Ebony",
        "dogriName": "Kalyar / Kachnar",
        "family": "Fabaceae",
        "habit": "Tree",
        "zone": "Academic Avenue",
        "coords": [
            32.9419,
            74.9538
        ],
        "elevation": "820m MSL",
        "toxicity": "Safe",
        "toxicAgent": "Edible floral tissue",
        "firstAid": "None required.",
        "phenology": "Flowering: Feb - Apr; Fruiting: May - Aug",
        "iucn": "LC",
        "notes": "Cultivated avenue tree; unexpanded flower buds prized in Dogra cuisine for 'Kachnar Koshur' curry.",
        "photo": null,
        "verified": false
    },
    {
        "id": "SMVDU-FL-027",
        "botanicalName": "Dalbergia sissoo",
        "commonName": "Indian Rosewood",
        "dogriName": "Tali / Shisham",
        "family": "Fabaceae",
        "habit": "Tree",
        "zone": "Academic Avenue",
        "coords": [
            32.9414,
            74.9532
        ],
        "elevation": "818m MSL",
        "toxicity": "Safe",
        "toxicAgent": "Non-hazardous timber taxon",
        "firstAid": "None required.",
        "phenology": "Flowering: Mar - May; Pods persist: Oct - Jan",
        "iucn": "LC",
        "notes": "Major hardwood avenue shade tree. High carbon sequestration density.",
        "photo": null,
        "verified": true
    },
    {
        "id": "SMVDU-FL-028",
        "botanicalName": "Cassia fistula",
        "commonName": "Golden Shower Tree",
        "dogriName": "Amaltas / Kariyal",
        "family": "Fabaceae",
        "habit": "Tree",
        "zone": "Academic Avenue",
        "coords": [
            32.9422,
            74.9544
        ],
        "elevation": "822m MSL",
        "toxicity": "Mild Irritant",
        "toxicAgent": "Anthraquinone laxative glycosides in seed pulp",
        "firstAid": "Do not ingest long black pods without clinical direction.",
        "phenology": "Flowering: May - Jul; Fruiting: Dec - Mar",
        "iucn": "LC",
        "notes": "Spectacular pendulous yellow racemes along central admin walkway during summer heat.",
        "photo": null,
        "verified": false
    },
    {
        "id": "SMVDU-FL-029",
        "botanicalName": "Delonix regia",
        "commonName": "Gulmohar",
        "dogriName": "Gulmohar",
        "family": "Fabaceae",
        "habit": "Tree",
        "zone": "Academic Avenue",
        "coords": [
            32.9411,
            74.9529
        ],
        "elevation": "816m MSL",
        "toxicity": "Safe",
        "toxicAgent": "Non-toxic ornamental",
        "firstAid": "Standard hygiene.",
        "phenology": "Flowering: Apr - Jun; Fruiting: Aug - Dec",
        "iucn": "LC",
        "notes": "Umbrella canopy ornamental tree with fiery red-orange petals planted outside lecture theatres.",
        "photo": null,
        "verified": true
    },
    {
        "id": "SMVDU-FL-030",
        "botanicalName": "Jacaranda mimosifolia",
        "commonName": "Blue Jacaranda",
        "dogriName": "Nila Gulmohar",
        "family": "Bignoniaceae",
        "habit": "Tree",
        "zone": "Academic Avenue",
        "coords": [
            32.9425,
            74.9548
        ],
        "elevation": "824m MSL",
        "toxicity": "Safe",
        "toxicAgent": "Non-toxic",
        "firstAid": "Standard hygiene.",
        "phenology": "Flowering: Apr - May; Fruiting: Aug - Nov",
        "iucn": "LC",
        "notes": "Striking violet-blue tubular blooms lining residential faculty quarters.",
        "photo": null,
        "verified": true
    },
    {
        "id": "SMVDU-FL-031",
        "botanicalName": "Toona ciliata",
        "commonName": "Indian Mahogany",
        "dogriName": "Toon",
        "family": "Meliaceae",
        "habit": "Tree",
        "zone": "Academic Avenue",
        "coords": [
            32.9417,
            74.9535
        ],
        "elevation": "819m MSL",
        "toxicity": "Safe",
        "toxicAgent": "Non-toxic timber species",
        "firstAid": "Standard hygiene.",
        "phenology": "Flowering: Mar - Apr; Fruiting: May - Jul",
        "iucn": "LC",
        "notes": "Valuable lightweight timber tree; pinnate leaves flush reddish copper in early spring.",
        "photo": null,
        "verified": false
    },
    {
        "id": "SMVDU-FL-032",
        "botanicalName": "Ficus benghalensis",
        "commonName": "Banyan Tree",
        "dogriName": "Barh / Bor",
        "family": "Moraceae",
        "habit": "Tree",
        "zone": "Academic Avenue",
        "coords": [
            32.9408,
            74.9525
        ],
        "elevation": "812m MSL",
        "toxicity": "Safe",
        "toxicAgent": "Ficin in white latex (mild skin irritation if rubbed in eye)",
        "firstAid": "Wash eyes with water if milky sap makes contact.",
        "phenology": "Syconia fruiting: Apr - Jun & Oct - Dec",
        "iucn": "LC",
        "notes": "Massive keystone tree near central grounds; prominent aerial prop roots host diverse avifauna.",
        "photo": null,
        "verified": false
    },
    {
        "id": "SMVDU-FL-033",
        "botanicalName": "Ficus religiosa",
        "commonName": "Sacred Fig",
        "dogriName": "Peepal",
        "family": "Moraceae",
        "habit": "Tree",
        "zone": "Academic Avenue",
        "coords": [
            32.9416,
            74.9527
        ],
        "elevation": "815m MSL",
        "toxicity": "Safe",
        "toxicAgent": "Latex contains ficin enzymes",
        "firstAid": "Rinse hands with water.",
        "phenology": "Figs ripen: May - Jul",
        "iucn": "LC",
        "notes": "Long caudate-acuminate leaf apex; high oxygen release efficiency and cultural reverence.",
        "photo": null,
        "verified": true
    },
    {
        "id": "SMVDU-FL-034",
        "botanicalName": "Alstonia scholaris",
        "commonName": "Scholar Tree / Blackboard Tree",
        "dogriName": "Chhatim",
        "family": "Apocynaceae",
        "habit": "Tree",
        "zone": "Academic Avenue",
        "coords": [
            32.9421,
            74.9536
        ],
        "elevation": "820m MSL",
        "toxicity": "Mild Irritant",
        "toxicAgent": "Ditamine and echitamine alkaloids in milky bark sap",
        "firstAid": "Wash hands post sampling; avoid ingesting bitter sap.",
        "phenology": "Flowering: Oct - Dec; Fruiting: Apr - Jun",
        "iucn": "LC",
        "notes": "Whorled verticillate leaves; strongly fragrant autumnal blooms around library complex.",
        "photo": null,
        "verified": true
    },
    {
        "id": "SMVDU-FL-035",
        "botanicalName": "Melia azedarach",
        "commonName": "Persian Lilac / Chinaberry",
        "dogriName": "Drek",
        "family": "Meliaceae",
        "habit": "Tree",
        "zone": "Academic Avenue",
        "coords": [
            32.9412,
            74.9541
        ],
        "elevation": "817m MSL",
        "toxicity": "Toxic",
        "toxicAgent": "Meliatoxins & tetranortriterpenes in yellow drupes",
        "firstAid": "Seek Health Centre immediately if seeds/drupes ingested.",
        "phenology": "Flowering: Mar - May; Drupes persist through winter",
        "iucn": "LC",
        "notes": "Profuse lilac flowers; yellow drupes are poisonous to humans yet foraged by birds.",
        "photo": null,
        "verified": false
    },
    {
        "id": "SMVDU-FL-036",
        "botanicalName": "Pongamia pinnata",
        "commonName": "Indian Beech",
        "dogriName": "Karanj",
        "family": "Fabaceae",
        "habit": "Tree",
        "zone": "Academic Avenue",
        "coords": [
            32.9424,
            74.9541
        ],
        "elevation": "821m MSL",
        "toxicity": "Mild Irritant",
        "toxicAgent": "Karanjin furanoflavonol in seeds (toxic if ingested)",
        "firstAid": "External seed oil is therapeutic; avoid ocular contact.",
        "phenology": "Flowering: Apr - Jun; Fruiting: Dec - Feb",
        "iucn": "LC",
        "notes": "Deep shade evergreen canopy; seed oil evaluated for sustainable bio-diesel feedstock.",
        "photo": null,
        "verified": false
    },
    {
        "id": "SMVDU-FL-037",
        "botanicalName": "Azadirachta indica",
        "commonName": "Neem",
        "dogriName": "Neem",
        "family": "Meliaceae",
        "habit": "Tree",
        "zone": "Academic Avenue",
        "coords": [
            32.9409,
            74.9531
        ],
        "elevation": "814m MSL",
        "toxicity": "Safe",
        "toxicAgent": "Azadirachtin (bitter biopesticide)",
        "firstAid": "Safe therapeutic species.",
        "phenology": "Flowering: Mar - May; Fruiting: Jun - Aug",
        "iucn": "LC",
        "notes": "Ubiquitous medicinal shade tree; bitter leaves possess natural antibacterial properties.",
        "photo": null,
        "verified": false
    },
    {
        "id": "SMVDU-FL-038",
        "botanicalName": "Syzygium cumini",
        "commonName": "Black Plum",
        "dogriName": "Jamun",
        "family": "Myrtaceae",
        "habit": "Tree",
        "zone": "Academic Avenue",
        "coords": [
            32.9418,
            74.9529
        ],
        "elevation": "818m MSL",
        "toxicity": "Safe",
        "toxicAgent": "Anthocyanins & jamboline",
        "firstAid": "Edible fruit; standard hygiene.",
        "phenology": "Flowering: Mar - May; Fruiting: Jun - Jul",
        "iucn": "LC",
        "notes": "Major campus fruit tree; seed powders traditionally utilized in glycemic modulation.",
        "photo": null,
        "verified": true
    },
    {
        "id": "SMVDU-FL-039",
        "botanicalName": "Callistemon citrinus",
        "commonName": "Crimson Bottlebrush",
        "dogriName": "Lal Bottlebrush",
        "family": "Myrtaceae",
        "habit": "Tree",
        "zone": "Academic Avenue",
        "coords": [
            32.9426,
            74.9533
        ],
        "elevation": "823m MSL",
        "toxicity": "Safe",
        "toxicAgent": "Volatile cineole oils in leaves",
        "firstAid": "Non-hazardous ornamental.",
        "phenology": "Flowering: Mar - May & Sep - Nov",
        "iucn": "LC",
        "notes": "Australian introduction; cylindrical red stamen spikes attract sunbirds and honeybees.",
        "photo": null,
        "verified": false
    },
    {
        "id": "SMVDU-FL-040",
        "botanicalName": "Terminalia arjuna",
        "commonName": "Arjun Tree",
        "dogriName": "Arjun",
        "family": "Combretaceae",
        "habit": "Tree",
        "zone": "Academic Avenue",
        "coords": [
            32.9415,
            74.9546
        ],
        "elevation": "820m MSL",
        "toxicity": "Safe",
        "toxicAgent": "Arjunic acid & tannins in bark",
        "firstAid": "Standard hygiene.",
        "phenology": "Flowering: Apr - Jun; Fruiting: Oct - Feb",
        "iucn": "LC",
        "notes": "Smooth grey peeling bark; standard Ayurvedic cardiac tonic harvested non-destructively.",
        "photo": null,
        "verified": false
    },
    {
        "id": "SMVDU-FL-041",
        "botanicalName": "Saraca asoca",
        "commonName": "Sita Asoka",
        "dogriName": "Ashok",
        "family": "Fabaceae",
        "habit": "Tree",
        "zone": "Academic Avenue",
        "coords": [
            32.942,
            74.9545
        ],
        "elevation": "821m MSL",
        "toxicity": "Safe",
        "toxicAgent": "Non-toxic",
        "firstAid": "Standard hygiene.",
        "phenology": "Flowering: Feb - Apr; Fruiting: Jul - Sep",
        "iucn": "VU",
        "notes": "Fragrant orange-yellow corymbose clusters turning scarlet; IUCN vulnerable conservation priority.",
        "photo": null,
        "verified": false
    },
    {
        "id": "SMVDU-FL-042",
        "botanicalName": "Grevillea robusta",
        "commonName": "Silver Oak",
        "dogriName": "Silver Oak",
        "family": "Proteaceae",
        "habit": "Tree",
        "zone": "Academic Avenue",
        "coords": [
            32.9428,
            74.9538
        ],
        "elevation": "826m MSL",
        "toxicity": "Mild Irritant",
        "toxicAgent": "Contact dermatitis from resorcinols in wood sawdust",
        "firstAid": "Wash skin with soap after pruning cuts.",
        "phenology": "Flowering: Mar - May; Fruiting: Jun - Aug",
        "iucn": "LC",
        "notes": "Fern-like bipinnatifid foliage with silky silvery undersides and comb-like orange blooms.",
        "photo": null,
        "verified": false
    },
    {
        "id": "SMVDU-FL-043",
        "botanicalName": "Moringa oleifera",
        "commonName": "Drumstick Tree",
        "dogriName": "Sohanjana",
        "family": "Moringaceae",
        "habit": "Tree",
        "zone": "Academic Avenue",
        "coords": [
            32.9413,
            74.9537
        ],
        "elevation": "818m MSL",
        "toxicity": "Safe",
        "toxicAgent": "Edible nutrient-dense tissues",
        "firstAid": "None required.",
        "phenology": "Flowering: Feb - Apr; Fruiting: May - Jul",
        "iucn": "LC",
        "notes": "High nutritional density; tender drumsticks and leaves used in staple regional cooking.",
        "photo": null,
        "verified": false
    },
    {
        "id": "SMVDU-FL-044",
        "botanicalName": "Nyctanthes arbor-tristis",
        "commonName": "Night-flowering Jasmine",
        "dogriName": "Harshringar / Kuri",
        "family": "Oleaceae",
        "habit": "Shrub",
        "zone": "Academic Avenue",
        "coords": [
            32.9423,
            74.9535
        ],
        "elevation": "822m MSL",
        "toxicity": "Safe",
        "toxicAgent": "Non-toxic",
        "firstAid": "Standard hygiene.",
        "phenology": "Flowering: Sep - Nov; Fruiting: Dec - Feb",
        "iucn": "LC",
        "notes": "Fragrant nocturnal blooms with bright orange corolla tubes carpet ground in morning.",
        "photo": null,
        "verified": false
    },
    {
        "id": "SMVDU-FL-045",
        "botanicalName": "Murraya paniculata",
        "commonName": "Orange Jasmine",
        "dogriName": "Kamini",
        "family": "Rutaceae",
        "habit": "Shrub",
        "zone": "Academic Avenue",
        "coords": [
            32.9419,
            74.9542
        ],
        "elevation": "820m MSL",
        "toxicity": "Safe",
        "toxicAgent": "Aromatic volatile terpenes in leaves",
        "firstAid": "Standard hygiene.",
        "phenology": "Flowering: Jun - Oct; Fruiting: Nov - Jan",
        "iucn": "LC",
        "notes": "Densely foliated hedge shrub with strongly citrus-scented white star flowers.",
        "photo": null,
        "verified": true
    },
    {
        "id": "SMVDU-FL-046",
        "botanicalName": "Thevetia peruviana",
        "commonName": "Yellow Oleander",
        "dogriName": "Pila Kaner",
        "family": "Apocynaceae",
        "habit": "Shrub",
        "zone": "Academic Avenue",
        "coords": [
            32.9427,
            74.954
        ],
        "elevation": "824m MSL",
        "toxicity": "Toxic",
        "toxicAgent": "Thevetin & thevetoxin cardiac glycosides",
        "firstAid": "Emergency Medical Centre triage if sap or seed ingested.",
        "phenology": "Flowering: Year-round (peak Apr - Oct)",
        "iucn": "LC",
        "notes": "Severe clinical risk. All tissues contain cardiotoxic cardiac glycosides. Never consume.",
        "photo": null,
        "verified": false
    },
    {
        "id": "SMVDU-FL-047",
        "botanicalName": "Bougainvillea spectabilis",
        "commonName": "Great Bougainvillea",
        "dogriName": "Booganbel",
        "family": "Nyctaginaceae",
        "habit": "Climber",
        "zone": "Academic Avenue",
        "coords": [
            32.9416,
            74.954
        ],
        "elevation": "819m MSL",
        "toxicity": "Safe",
        "toxicAgent": "Mechanical thorns",
        "firstAid": "Clean thorn punctures.",
        "phenology": "Flowering: Oct - May",
        "iucn": "LC",
        "notes": "Hardy ornamental thorny climber covering boundary fences in magenta papery bracts.",
        "photo": null,
        "verified": true
    },
    {
        "id": "SMVDU-FL-048",
        "botanicalName": "Catharanthus roseus",
        "commonName": "Madagascar Periwinkle",
        "dogriName": "Sadabahar",
        "family": "Apocynaceae",
        "habit": "Herb",
        "zone": "Academic Avenue",
        "coords": [
            32.941,
            74.9533
        ],
        "elevation": "815m MSL",
        "toxicity": "Mild Irritant",
        "toxicAgent": "Vincristine & vinblastine antitumor alkaloids",
        "firstAid": "Do not ingest raw plant tissue.",
        "phenology": "Flowering: Year-round",
        "iucn": "LC",
        "notes": "Continuous pink or white blooms; source of chemotherapy drugs vincristine and vinblastine.",
        "photo": null,
        "verified": true
    },
    {
        "id": "SMVDU-FL-049",
        "botanicalName": "Pithecellobium dulce",
        "commonName": "Manila Tamarind",
        "dogriName": "Jungle Jalebi",
        "family": "Fabaceae",
        "habit": "Tree",
        "zone": "Academic Avenue",
        "coords": [
            32.9407,
            74.9538
        ],
        "elevation": "813m MSL",
        "toxicity": "Safe",
        "toxicAgent": "Edible aril",
        "firstAid": "None required.",
        "phenology": "Flowering: Jan - Mar; Fruiting: Apr - Jun",
        "iucn": "LC",
        "notes": "Coiled pods with spongy sweet-acidic white/pink arils relished by students.",
        "photo": null,
        "verified": false
    },
    {
        "id": "SMVDU-FL-050",
        "botanicalName": "Celtis australis",
        "commonName": "European Nettle Tree",
        "dogriName": "Kharik",
        "family": "Cannabaceae",
        "habit": "Tree",
        "zone": "Academic Avenue",
        "coords": [
            32.9429,
            74.9536
        ],
        "elevation": "827m MSL",
        "toxicity": "Safe",
        "toxicAgent": "Non-toxic",
        "firstAid": "Standard hygiene.",
        "phenology": "Flowering: Mar - Apr; Fruiting: Sep - Nov",
        "iucn": "LC",
        "notes": "Valuable hill fodder tree; serrated leaves with unequal oblique basis and sweet drupes.",
        "photo": null,
        "verified": false
    },
    {
        "id": "SMVDU-FL-051",
        "botanicalName": "Tabernaemontana divaricata",
        "commonName": "Pinwheel Flower / Crape Jasmine",
        "dogriName": "Chandni",
        "family": "Apocynaceae",
        "habit": "Shrub",
        "zone": "Academic Avenue",
        "coords": [
            32.9422,
            74.953
        ],
        "elevation": "821m MSL",
        "toxicity": "Mild Irritant",
        "toxicAgent": "Coronaridine indole alkaloids in milky latex",
        "firstAid": "Rinse eyes if latex splashes during hedge pruning.",
        "phenology": "Flowering: May - Oct",
        "iucn": "LC",
        "notes": "Common ornamental hedge bush with pristine white waxy pinwheel petals.",
        "photo": null,
        "verified": true
    },
    {
        "id": "SMVDU-FL-052",
        "botanicalName": "Hamelia patens",
        "commonName": "Firebush",
        "dogriName": "Agni Jhari",
        "family": "Rubiaceae",
        "habit": "Shrub",
        "zone": "Academic Avenue",
        "coords": [
            32.9418,
            74.9543
        ],
        "elevation": "820m MSL",
        "toxicity": "Safe",
        "toxicAgent": "Non-toxic ornamental",
        "firstAid": "Standard hygiene.",
        "phenology": "Flowering: Apr - Nov",
        "iucn": "LC",
        "notes": "Bright orange-red whorled tubular flowers attracting nectivorous butterflies.",
        "photo": null,
        "verified": false
    },
    {
        "id": "SMVDU-FL-053",
        "botanicalName": "Phyllanthus emblica",
        "commonName": "Indian Gooseberry",
        "dogriName": "Amla",
        "family": "Phyllanthaceae",
        "habit": "Tree",
        "zone": "Academic Avenue",
        "coords": [
            32.9413,
            74.9544
        ],
        "elevation": "818m MSL",
        "toxicity": "Safe",
        "toxicAgent": "High ascorbic acid & emblicanin tannins",
        "firstAid": "Edible fruit; standard hygiene.",
        "phenology": "Flowering: Mar - May; Fruiting: Nov - Feb",
        "iucn": "LC",
        "notes": "Cornerstone rasayana of Ayurvedic Triphala formulation; exceptional vitamin C content.",
        "photo": null,
        "verified": true
    },
    {
        "id": "SMVDU-FL-054",
        "botanicalName": "Plumeria rubra",
        "commonName": "Frangipani / Temple Tree",
        "dogriName": "Champa",
        "family": "Apocynaceae",
        "habit": "Tree",
        "zone": "Academic Avenue",
        "coords": [
            32.9425,
            74.9539
        ],
        "elevation": "823m MSL",
        "toxicity": "Mild Irritant",
        "toxicAgent": "Acrid milky sap causing skin erythema",
        "firstAid": "Wash skin with soap after plucking blooms.",
        "phenology": "Flowering: Mar - Oct",
        "iucn": "LC",
        "notes": "Deciduous thick-stemmed ornamental tree with intensely sweet-scented floral whorls.",
        "photo": null,
        "verified": true
    },
    {
        "id": "SMVDU-FL-055",
        "botanicalName": "Albizia lebbeck",
        "commonName": "Siris Tree / Woman's Tongue",
        "dogriName": "Sareenh",
        "family": "Fabaceae",
        "habit": "Tree",
        "zone": "Academic Avenue",
        "coords": [
            32.9409,
            74.9542
        ],
        "elevation": "815m MSL",
        "toxicity": "Safe",
        "toxicAgent": "Non-toxic",
        "firstAid": "Standard hygiene.",
        "phenology": "Flowering: Apr - Jun; Dry pods rattle in winter",
        "iucn": "LC",
        "notes": "Creamy pompom flower heads; dry straw pods rattle audibly in seasonal foothill breezes.",
        "photo": null,
        "verified": false
    },
    {
        "id": "SMVDU-FL-056",
        "botanicalName": "Calotropis procera",
        "commonName": "Apple of Sodom",
        "dogriName": "Aak / Akka",
        "family": "Apocynaceae",
        "habit": "Shrub",
        "zone": "Lower Scrublands",
        "coords": [
            32.9392,
            74.9515
        ],
        "elevation": "795m MSL",
        "toxicity": "Toxic",
        "toxicAgent": "Calotropin & uscharin cardiotoxic glycosides",
        "firstAid": "Severe keratoconjunctivitis risk. Irrigate eyes with saline for 15m; immediate medical attention.",
        "phenology": "Flowering: Apr - Aug; Fruiting: Nov - Jan",
        "iucn": "LC",
        "notes": "High toxicity alert. Milky latex causes severe corneal trauma upon accidental contact.",
        "photo": null,
        "verified": false
    },
    {
        "id": "SMVDU-FL-057",
        "botanicalName": "Acacia modesta",
        "commonName": "Phulai",
        "dogriName": "Phulai",
        "family": "Fabaceae",
        "habit": "Tree",
        "zone": "Lower Scrublands",
        "coords": [
            32.9388,
            74.9518
        ],
        "elevation": "788m MSL",
        "toxicity": "Safe",
        "toxicAgent": "Non-toxic (mechanical stipular prickles)",
        "firstAid": "Clean skin punctures with antiseptic.",
        "phenology": "Flowering: Mar - May; Fruiting: Jul - Nov",
        "iucn": "LC",
        "notes": "Keystone dry foothill legume with paired hooked prickles; gum harvested as nutrient tonic.",
        "photo": null,
        "verified": false
    },
    {
        "id": "SMVDU-FL-058",
        "botanicalName": "Ziziphus mauritiana",
        "commonName": "Indian Jujube",
        "dogriName": "Beri",
        "family": "Rhamnaceae",
        "habit": "Tree",
        "zone": "Lower Scrublands",
        "coords": [
            32.9395,
            74.9522
        ],
        "elevation": "798m MSL",
        "toxicity": "Safe",
        "toxicAgent": "Mechanical thorns",
        "firstAid": "Treat scratches.",
        "phenology": "Flowering: Aug - Oct; Fruiting: Dec - Feb",
        "iucn": "LC",
        "notes": "Spiny tree with asymmetric leaf bases; tart globose drupes collected extensively in winter.",
        "photo": null,
        "verified": false
    },
    {
        "id": "SMVDU-FL-059",
        "botanicalName": "Ziziphus nummularia",
        "commonName": "Wild Jujube",
        "dogriName": "Malla / Jhad-beri",
        "family": "Rhamnaceae",
        "habit": "Shrub",
        "zone": "Lower Scrublands",
        "coords": [
            32.9382,
            74.9509
        ],
        "elevation": "782m MSL",
        "toxicity": "Safe",
        "toxicAgent": "Paired sharp stipular spines",
        "firstAid": "Treat thorn punctures.",
        "phenology": "Flowering: Mar - Jun; Fruiting: Nov - Dec",
        "iucn": "LC",
        "notes": "Zigzag thorny shrub; dense thickets prevent soil wash during brief torrential rains.",
        "photo": null,
        "verified": false
    },
    {
        "id": "SMVDU-FL-060",
        "botanicalName": "Carissa spinarum",
        "commonName": "Wild Karanda / Bush Plum",
        "dogriName": "Garna",
        "family": "Apocynaceae",
        "habit": "Shrub",
        "zone": "Lower Scrublands",
        "coords": [
            32.9398,
            74.9526
        ],
        "elevation": "805m MSL",
        "toxicity": "Safe",
        "toxicAgent": "Forked spines only (fruit is edible)",
        "firstAid": "Clean thorn punctures.",
        "phenology": "Flowering: Apr - Jun; Fruiting: Aug - Nov",
        "iucn": "LC",
        "notes": "Forked spines; purple-black ripe berries are a beloved foraged wild fruit across Dogra hills.",
        "photo": null,
        "verified": false
    },
    {
        "id": "SMVDU-FL-061",
        "botanicalName": "Adhatoda vasica",
        "commonName": "Malabar Nut",
        "dogriName": "Basuti / Bansa",
        "family": "Acanthaceae",
        "habit": "Shrub",
        "zone": "Lower Scrublands",
        "coords": [
            32.9402,
            74.9521
        ],
        "elevation": "810m MSL",
        "toxicity": "Safe",
        "toxicAgent": "Vasicine quinazoline alkaloid (bronchodilator)",
        "firstAid": "Wash hands post leaf processing.",
        "phenology": "Flowering: Dec - Apr; Fruiting: May - Jun",
        "iucn": "LC",
        "notes": "Widely known Dogra respiratory remedy; leaves boiled with ginger for cough and bronchitis.",
        "photo": null,
        "verified": false
    },
    {
        "id": "SMVDU-FL-062",
        "botanicalName": "Euphorbia royleana",
        "commonName": "Royle's Spurge",
        "dogriName": "Sullu / Thohar",
        "family": "Euphorbiaceae",
        "habit": "Shrub",
        "zone": "Lower Scrublands",
        "coords": [
            32.9385,
            74.9511
        ],
        "elevation": "785m MSL",
        "toxicity": "Toxic",
        "toxicAgent": "Euphorbol diterpene esters in corrosive white latex",
        "firstAid": "Severe blistering and blindness risk. Wash eyes/skin with water immediately.",
        "phenology": "Flowering: Mar - May; Leafless stems in summer",
        "iucn": "LC",
        "notes": "Cactus-like 5-angled succulent shrub dominating arid sandstone ridges. Copious caustic latex.",
        "photo": null,
        "verified": false
    },
    {
        "id": "SMVDU-FL-063",
        "botanicalName": "Dodonaea viscosa",
        "commonName": "Hopbush",
        "dogriName": "Santha / Aliya",
        "family": "Sapindaceae",
        "habit": "Shrub",
        "zone": "Lower Scrublands",
        "coords": [
            32.9391,
            74.9524
        ],
        "elevation": "794m MSL",
        "toxicity": "Safe",
        "toxicAgent": "Resinous diterpenes on leaves",
        "firstAid": "Standard hygiene.",
        "phenology": "Flowering: Nov - Feb; Papery winged fruits in spring",
        "iucn": "LC",
        "notes": "Viscid evergreen shrub; aggressively colonizes eroded degraded hillslopes.",
        "photo": null,
        "verified": false
    },
    {
        "id": "SMVDU-FL-064",
        "botanicalName": "Lantana camara",
        "commonName": "Wild Sage",
        "dogriName": "Panchphuli / Kuri",
        "family": "Verbenaceae",
        "habit": "Shrub",
        "zone": "Lower Scrublands",
        "coords": [
            32.9384,
            74.952
        ],
        "elevation": "786m MSL",
        "toxicity": "Toxic",
        "toxicAgent": "Lantadene A & B triterpenoids in green drupes",
        "firstAid": "Keep livestock away; seek clinic if green berries eaten.",
        "phenology": "Flowering: Year-round",
        "iucn": "LC",
        "notes": "High invasive threat. Suppresses native regeneration across campus scrub margins.",
        "photo": null,
        "verified": true
    },
    {
        "id": "SMVDU-FL-065",
        "botanicalName": "Parthenium hysterophorus",
        "commonName": "Carrot Grass / Congress Grass",
        "dogriName": "Gajar Ghas",
        "family": "Asteraceae",
        "habit": "Herb",
        "zone": "Lower Scrublands",
        "coords": [
            32.938,
            74.9514
        ],
        "elevation": "780m MSL",
        "toxicity": "Mild Irritant",
        "toxicAgent": "Parthenin sesquiterpene lactone allergen",
        "firstAid": "Wash skin with cold water; wear gloves to pull weed.",
        "phenology": "Flowering: Year-round",
        "iucn": "LC",
        "notes": "Invasive allergen causing severe contact dermatitis and allergic rhinitis in sensitive personnel.",
        "photo": null,
        "verified": false
    },
    {
        "id": "SMVDU-FL-066",
        "botanicalName": "Cannabis sativa",
        "commonName": "Wild Hemp",
        "dogriName": "Bhang",
        "family": "Cannabaceae",
        "habit": "Herb",
        "zone": "Lower Scrublands",
        "coords": [
            32.9399,
            74.9517
        ],
        "elevation": "802m MSL",
        "toxicity": "Mild Irritant",
        "toxicAgent": "Cannabinoids (THC/CBD) in glandular hairs",
        "firstAid": "Wash hands post handling.",
        "phenology": "Flowering: Jul - Oct",
        "iucn": "LC",
        "notes": "Aggressive ruderal weed growing in waste areas; fibrous stems and aromatic resin.",
        "photo": null,
        "verified": false
    },
    {
        "id": "SMVDU-FL-067",
        "botanicalName": "Datura stramonium",
        "commonName": "Jimsonweed / Thorn Apple",
        "dogriName": "Dhatura",
        "family": "Solanaceae",
        "habit": "Herb",
        "zone": "Lower Scrublands",
        "coords": [
            32.9394,
            74.9511
        ],
        "elevation": "792m MSL",
        "toxicity": "Toxic",
        "toxicAgent": "Scopolamine, hyoscyamine & atropine tropane alkaloids",
        "firstAid": "Severe poisoning hazard. Immediate transfer to hospital for anticholinergic syndrome.",
        "phenology": "Flowering: Jul - Oct; Spiny capsules in winter",
        "iucn": "LC",
        "notes": "Severe clinical neurotoxin. Trumpet white-purple flowers with spiny capsule fruits.",
        "photo": null,
        "verified": false
    },
    {
        "id": "SMVDU-FL-068",
        "botanicalName": "Solanum surattense",
        "commonName": "Yellow-berried Nightshade",
        "dogriName": "Kandiari / Mokhari",
        "family": "Solanaceae",
        "habit": "Herb",
        "zone": "Lower Scrublands",
        "coords": [
            32.9386,
            74.9516
        ],
        "elevation": "788m MSL",
        "toxicity": "Mild Irritant",
        "toxicAgent": "Solasodine glycoalkaloids; dense yellow prickles",
        "firstAid": "Handle with gloves to prevent thorn injury.",
        "phenology": "Flowering: Year-round (peak Dec - May)",
        "iucn": "LC",
        "notes": "Prostrate prickly herb with violet blooms and yellow globose berries; classical Dashmula herb.",
        "photo": null,
        "verified": false
    },
    {
        "id": "SMVDU-FL-069",
        "botanicalName": "Solanum nigrum",
        "commonName": "Black Nightshade",
        "dogriName": "Mako / Kambei",
        "family": "Solanaceae",
        "habit": "Herb",
        "zone": "Lower Scrublands",
        "coords": [
            32.9397,
            74.9519
        ],
        "elevation": "800m MSL",
        "toxicity": "Mild Irritant",
        "toxicAgent": "Solanine in unripe green berries",
        "firstAid": "Do not consume green berries; ripe black berries have low toxicity.",
        "phenology": "Flowering: Year-round",
        "iucn": "LC",
        "notes": "Weedy herb in scrub edges; black ripe berries used in traditional hepatic formulations.",
        "photo": null,
        "verified": false
    },
    {
        "id": "SMVDU-FL-070",
        "botanicalName": "Achyranthes aspera",
        "commonName": "Prickly Chaff Flower",
        "dogriName": "Puthkanda / Kutri",
        "family": "Amaranthaceae",
        "habit": "Herb",
        "zone": "Lower Scrublands",
        "coords": [
            32.9393,
            74.9523
        ],
        "elevation": "796m MSL",
        "toxicity": "Safe",
        "toxicAgent": "Deflexed prickly bracteoles hook on clothes",
        "firstAid": "Pluck hooked burrs from garments.",
        "phenology": "Flowering: Aug - Dec",
        "iucn": "LC",
        "notes": "Inverted floral spikes hook onto clothing and animal fur for zoochorous seed dispersal.",
        "photo": null,
        "verified": false
    },
    {
        "id": "SMVDU-FL-071",
        "botanicalName": "Boerhavia diffusa",
        "commonName": "Spreading Hogweed",
        "dogriName": "Punarnava / Itsit",
        "family": "Nyctaginaceae",
        "habit": "Herb",
        "zone": "Lower Scrublands",
        "coords": [
            32.9389,
            74.9513
        ],
        "elevation": "790m MSL",
        "toxicity": "Safe",
        "toxicAgent": "Punarnavine alkaloid",
        "firstAid": "Standard hygiene.",
        "phenology": "Flowering: Year-round (peak monsoon)",
        "iucn": "LC",
        "notes": "Prostrate diffuse herb; roots are prized in Ayurvedic medicine for renal and diuretic therapy.",
        "photo": null,
        "verified": false
    },
    {
        "id": "SMVDU-FL-072",
        "botanicalName": "Tribulus terrestris",
        "commonName": "Puncture Vine / Land Caltrops",
        "dogriName": "Bhakhra / Gokhru",
        "family": "Zygophyllaceae",
        "habit": "Herb",
        "zone": "Lower Scrublands",
        "coords": [
            32.9381,
            74.951
        ],
        "elevation": "781m MSL",
        "toxicity": "Safe",
        "toxicAgent": "Rigid sharp fruit spines puncture footwear/tires",
        "firstAid": "Extract spine and clean wound.",
        "phenology": "Flowering: Apr - Sep; Spiny mericarps in winter",
        "iucn": "LC",
        "notes": "Hard 5-spined fruit can puncture bicycle tyres; celebrated tonic herb in Ayurvedic medicine.",
        "photo": null,
        "verified": false
    },
    {
        "id": "SMVDU-FL-073",
        "botanicalName": "Sida cordifolia",
        "commonName": "Flannel Weed",
        "dogriName": "Bariara / Kharenti",
        "family": "Malvaceae",
        "habit": "Herb",
        "zone": "Lower Scrublands",
        "coords": [
            32.9396,
            74.9514
        ],
        "elevation": "797m MSL",
        "toxicity": "Safe",
        "toxicAgent": "Trace ephedrine alkaloids",
        "firstAid": "Standard hygiene.",
        "phenology": "Flowering: Aug - Dec",
        "iucn": "LC",
        "notes": "Velvety heart-shaped leaves; strong bast fibre extracted from dried stems.",
        "photo": null,
        "verified": false
    },
    {
        "id": "SMVDU-FL-074",
        "botanicalName": "Abutilon indicum",
        "commonName": "Indian Mallow",
        "dogriName": "Kanghi",
        "family": "Malvaceae",
        "habit": "Shrub",
        "zone": "Lower Scrublands",
        "coords": [
            32.939,
            74.9525
        ],
        "elevation": "793m MSL",
        "toxicity": "Safe",
        "toxicAgent": "Mucilage-rich tissue",
        "firstAid": "Standard hygiene.",
        "phenology": "Flowering: Sep - Apr",
        "iucn": "LC",
        "notes": "Circular comb-shaped schizocarps like an Indian hair-comb; demulcent and diuretic.",
        "photo": null,
        "verified": false
    },
    {
        "id": "SMVDU-FL-075",
        "botanicalName": "Cassia tora",
        "commonName": "Sickle Senna",
        "dogriName": "Panwar",
        "family": "Fabaceae",
        "habit": "Herb",
        "zone": "Lower Scrublands",
        "coords": [
            32.9383,
            74.9518
        ],
        "elevation": "784m MSL",
        "toxicity": "Mild Irritant",
        "toxicAgent": "Anthraquinone derivatives in raw seeds",
        "firstAid": "Wash skin; avoid consuming unroasted seed.",
        "phenology": "Flowering: Aug - Nov",
        "iucn": "LC",
        "notes": "Abundant monsoon annual weed; curved sickle-shaped pods; roasted seeds used as coffee substitute.",
        "photo": null,
        "verified": false
    },
    {
        "id": "SMVDU-FL-076",
        "botanicalName": "Xanthium strumarium",
        "commonName": "Cocklebur",
        "dogriName": "Lelaru / Gokhru-chhota",
        "family": "Asteraceae",
        "habit": "Herb",
        "zone": "Lower Scrublands",
        "coords": [
            32.9387,
            74.9512
        ],
        "elevation": "787m MSL",
        "toxicity": "Toxic",
        "toxicAgent": "Carboxyatractyloside in cotyledons and burrs",
        "firstAid": "Toxic to cattle and humans if ingested. Wash skin after pulling burrs.",
        "phenology": "Flowering: Aug - Sep; Burrs persist: Nov - Jan",
        "iucn": "LC",
        "notes": "Hooked burs latch stubbornly onto field researcher trousers; toxic to grazing stock.",
        "photo": null,
        "verified": false
    },
    {
        "id": "SMVDU-FL-077",
        "botanicalName": "Cynodon dactylon",
        "commonName": "Bermuda Grass",
        "dogriName": "Khabbal / Doob",
        "family": "Poaceae",
        "habit": "Herb",
        "zone": "Lower Scrublands",
        "coords": [
            32.9392,
            74.951
        ],
        "elevation": "792m MSL",
        "toxicity": "Safe",
        "toxicAgent": "Non-toxic grass",
        "firstAid": "Standard hygiene.",
        "phenology": "Flowering: Year-round",
        "iucn": "LC",
        "notes": "Stoloniferous lawn and pasture grass forming dense mats that halt surface soil erosion.",
        "photo": null,
        "verified": false
    },
    {
        "id": "SMVDU-FL-078",
        "botanicalName": "Chenopodium album",
        "commonName": "Lamb's Quarters",
        "dogriName": "Bathua",
        "family": "Amaranthaceae",
        "habit": "Herb",
        "zone": "Lower Scrublands",
        "coords": [
            32.9395,
            74.9517
        ],
        "elevation": "796m MSL",
        "toxicity": "Safe",
        "toxicAgent": "Oxalates (safe when cooked)",
        "firstAid": "Edible pot-herb.",
        "phenology": "Flowering: Nov - Feb",
        "iucn": "LC",
        "notes": "Mealy powdery undersides on leaves; highly prized winter foraged leafy vegetable.",
        "photo": null,
        "verified": false
    },
    {
        "id": "SMVDU-FL-079",
        "botanicalName": "Oxalis corniculata",
        "commonName": "Creeping Woodsorrel",
        "dogriName": "Khatti-Meethi",
        "family": "Oxalidaceae",
        "habit": "Herb",
        "zone": "Lower Scrublands",
        "coords": [
            32.94,
            74.952
        ],
        "elevation": "804m MSL",
        "toxicity": "Safe",
        "toxicAgent": "Potassium oxalate gives sour taste",
        "firstAid": "Safe in culinary moderation.",
        "phenology": "Flowering: Year-round",
        "iucn": "LC",
        "notes": "Trifoliate clover-like leaves with tart pleasant taste used in rural chutneys.",
        "photo": null,
        "verified": false
    },
    {
        "id": "SMVDU-FL-080",
        "botanicalName": "Euphorbia hirta",
        "commonName": "Asthma Plant",
        "dogriName": "Dudhi",
        "family": "Euphorbiaceae",
        "habit": "Herb",
        "zone": "Lower Scrublands",
        "coords": [
            32.9388,
            74.9515
        ],
        "elevation": "789m MSL",
        "toxicity": "Mild Irritant",
        "toxicAgent": "Milky latex can irritate sensitive skin",
        "firstAid": "Wash skin with soap.",
        "phenology": "Flowering: Year-round",
        "iucn": "LC",
        "notes": "Small hairy annual herb with milky juice; historically used in amoebic dysentery remedies.",
        "photo": null,
        "verified": false
    },
    {
        "id": "SMVDU-FL-081",
        "botanicalName": "Argemone mexicana",
        "commonName": "Mexican Prickly Poppy",
        "dogriName": "Satyanashi / Kandiari",
        "family": "Papaveraceae",
        "habit": "Herb",
        "zone": "Lower Scrublands",
        "coords": [
            32.9382,
            74.9515
        ],
        "elevation": "783m MSL",
        "toxicity": "Toxic",
        "toxicAgent": "Sanguinarine & dihydrosanguinarine toxic alkaloids",
        "firstAid": "Severe dropsy risk if seed oil contaminates mustard oil. Wash hands.",
        "phenology": "Flowering: Feb - May",
        "iucn": "LC",
        "notes": "Yellow poppy blooms with thistle-like foliage; yellow latex and toxic seeds resembling mustard.",
        "photo": null,
        "verified": false
    },
    {
        "id": "SMVDU-FL-082",
        "botanicalName": "Pupalia lappacea",
        "commonName": "Forest Burr",
        "dogriName": "Chirchitta",
        "family": "Amaranthaceae",
        "habit": "Herb",
        "zone": "Lower Scrublands",
        "coords": [
            32.9391,
            74.9519
        ],
        "elevation": "792m MSL",
        "toxicity": "Safe",
        "toxicAgent": "Glochidiate hooked bristles",
        "firstAid": "Extract burrs from socks.",
        "phenology": "Flowering: Sep - Nov",
        "iucn": "LC",
        "notes": "Dense woolly clusters of yellowish hooked bristles attaching tenaciously to animal fur.",
        "photo": null,
        "verified": false
    },
    {
        "id": "SMVDU-FL-083",
        "botanicalName": "Butea monosperma",
        "commonName": "Flame of the Forest",
        "dogriName": "Palash / Dhak",
        "family": "Fabaceae",
        "habit": "Tree",
        "zone": "Lower Scrublands",
        "coords": [
            32.9403,
            74.9525
        ],
        "elevation": "808m MSL",
        "toxicity": "Safe",
        "toxicAgent": "Butein dye flavonoids",
        "firstAid": "Non-toxic.",
        "phenology": "Flowering: Feb - Apr; Fruiting: May - Jul",
        "iucn": "LC",
        "notes": "Blazing vermillion flower clusters light up dry foothills in early spring before leaf flush.",
        "photo": null,
        "verified": false
    },
    {
        "id": "SMVDU-FL-084",
        "botanicalName": "Capparis sepiaria",
        "commonName": "Wild Caper Bush",
        "dogriName": "Hins / Heens",
        "family": "Capparaceae",
        "habit": "Climber",
        "zone": "Lower Scrublands",
        "coords": [
            32.9389,
            74.9522
        ],
        "elevation": "791m MSL",
        "toxicity": "Safe",
        "toxicAgent": "Recurved thorny stipules",
        "firstAid": "Carefully disengage hooks.",
        "phenology": "Flowering: Apr - Jun; Fruiting: Jul - Sep",
        "iucn": "LC",
        "notes": "Scrambling thorny thicket former with white stamen-filled flowers and edible dark berries.",
        "photo": null,
        "verified": false
    },
    {
        "id": "SMVDU-FL-085",
        "botanicalName": "Flacourtia indica",
        "commonName": "Governor's Plum",
        "dogriName": "Kakai / Kakoa",
        "family": "Salicaceae",
        "habit": "Tree",
        "zone": "Lower Scrublands",
        "coords": [
            32.9397,
            74.9528
        ],
        "elevation": "802m MSL",
        "toxicity": "Safe",
        "toxicAgent": "Spiny trunk branches",
        "firstAid": "Treat scratches.",
        "phenology": "Flowering: Feb - Apr; Fruiting: May - Jul",
        "iucn": "LC",
        "notes": "Trunk armed with branched woody spines; sweet-astringent dark purple berries eaten locally.",
        "photo": null,
        "verified": false
    },
    {
        "id": "SMVDU-FL-086",
        "botanicalName": "Equisetum ramosissimum",
        "commonName": "Branched Horsetail",
        "dogriName": "Nari Ghas",
        "family": "Equisetaceae",
        "habit": "Herb",
        "zone": "Ravine Corridors",
        "coords": [
            32.9421,
            74.9568
        ],
        "elevation": "835m MSL",
        "toxicity": "Mild Irritant",
        "toxicAgent": "High abrasive silica crystals in jointed stems",
        "firstAid": "Wash skin; abrasive on gums if chewed.",
        "phenology": "Strobili spore-bearing: Apr - Sep",
        "iucn": "LC",
        "notes": "Ancient living fossil pteridophyte lining perennial seepages along the campus ravine bed.",
        "photo": null,
        "verified": false
    },
    {
        "id": "SMVDU-FL-087",
        "botanicalName": "Adiantum capillus-veneris",
        "commonName": "Maidenhair Fern",
        "dogriName": "Hansraj",
        "family": "Pteridaceae",
        "habit": "Herb",
        "zone": "Ravine Corridors",
        "coords": [
            32.9416,
            74.9572
        ],
        "elevation": "830m MSL",
        "toxicity": "Safe",
        "toxicAgent": "Non-toxic delicate fern",
        "firstAid": "Standard field hygiene.",
        "phenology": "Sori sporulation: Mar - Oct",
        "iucn": "LC",
        "notes": "Delicate fan-shaped pinnules on wiry ebony stipes carpeting moist dripping sandstone rock faces.",
        "photo": null,
        "verified": false
    },
    {
        "id": "SMVDU-FL-088",
        "botanicalName": "Nerium oleander",
        "commonName": "Oleander",
        "dogriName": "Kaner / Ganderi",
        "family": "Apocynaceae",
        "habit": "Shrub",
        "zone": "Ravine Corridors",
        "coords": [
            32.9428,
            74.9562
        ],
        "elevation": "840m MSL",
        "toxicity": "Toxic",
        "toxicAgent": "Oleandrin & neriine cardiac glycosides",
        "firstAid": "Emergency Medical Centre immediate admission. Do not touch eyes or mouth after handling.",
        "phenology": "Flowering: Apr - Oct",
        "iucn": "LC",
        "notes": "Severe clinical toxicity. All vegetative parts are deadly poisonous. Found in stony stream courses.",
        "photo": null,
        "verified": false
    },
    {
        "id": "SMVDU-FL-089",
        "botanicalName": "Mallotus repandus",
        "commonName": "Climbing Kamala",
        "dogriName": "Tukla",
        "family": "Euphorbiaceae",
        "habit": "Climber",
        "zone": "Ravine Corridors",
        "coords": [
            32.9419,
            74.9565
        ],
        "elevation": "832m MSL",
        "toxicity": "Safe",
        "toxicAgent": "Non-hazardous",
        "firstAid": "Standard hygiene.",
        "phenology": "Flowering: Feb - Apr; Fruiting: May - Jun",
        "iucn": "LC",
        "notes": "Woody climbing vine ascending high into stream-bank canopy trees.",
        "photo": null,
        "verified": false
    },
    {
        "id": "SMVDU-FL-090",
        "botanicalName": "Ficus palmata",
        "commonName": "Wild Himalayan Fig",
        "dogriName": "Phagwara / Phagura",
        "family": "Moraceae",
        "habit": "Tree",
        "zone": "Ravine Corridors",
        "coords": [
            32.9424,
            74.9561
        ],
        "elevation": "838m MSL",
        "toxicity": "Safe",
        "toxicAgent": "Latex with mild ficin enzymes",
        "firstAid": "Rinse hands post foraging.",
        "phenology": "Fruiting: Jun - Aug & Oct - Nov",
        "iucn": "LC",
        "notes": "Wild fig growing abundantly in moist depressions; delicious sweet fruits eaten fresh or dried.",
        "photo": null,
        "verified": false
    },
    {
        "id": "SMVDU-FL-091",
        "botanicalName": "Salix tetrasperma",
        "commonName": "Indian Willow",
        "dogriName": "Veer / Bed",
        "family": "Salicaceae",
        "habit": "Tree",
        "zone": "Ravine Corridors",
        "coords": [
            32.9413,
            74.9575
        ],
        "elevation": "828m MSL",
        "toxicity": "Safe",
        "toxicAgent": "Salicin precursor in bark",
        "firstAid": "Standard hygiene.",
        "phenology": "Flowering: Feb - Mar; Fruiting: Apr - May",
        "iucn": "LC",
        "notes": "Riparian stream-bank anchor tree; pendulous twigs traditionally woven into baskets and crates.",
        "photo": null,
        "verified": false
    },
    {
        "id": "SMVDU-FL-092",
        "botanicalName": "Terminalia bellirica",
        "commonName": "Baheda / Beach Almond",
        "dogriName": "Baheda",
        "family": "Combretaceae",
        "habit": "Tree",
        "zone": "Ravine Corridors",
        "coords": [
            32.9429,
            74.9558
        ],
        "elevation": "844m MSL",
        "toxicity": "Safe",
        "toxicAgent": "High tannin astringency",
        "firstAid": "Standard hygiene.",
        "phenology": "Flowering: Apr - Jun; Fruiting: Nov - Feb",
        "iucn": "LC",
        "notes": "Majestic buttressed tree in deep ravines; second constituent of classical Triphala medicine.",
        "photo": null,
        "verified": false
    },
    {
        "id": "SMVDU-FL-093",
        "botanicalName": "Stephania japonica",
        "commonName": "Tape Vine",
        "dogriName": "Parh",
        "family": "Menispermaceae",
        "habit": "Climber",
        "zone": "Ravine Corridors",
        "coords": [
            32.9418,
            74.957
        ],
        "elevation": "831m MSL",
        "toxicity": "Mild Irritant",
        "toxicAgent": "Hasubanan & aporphine alkaloids in rootstock",
        "firstAid": "Wash skin; do not ingest roots.",
        "phenology": "Flowering: Jun - Aug; Fruiting: Sep - Nov",
        "iucn": "LC",
        "notes": "Slender twining vine with peltate leaves; prominent in shady microclimates of boulder ravines.",
        "photo": null,
        "verified": false
    },
    {
        "id": "SMVDU-FL-094",
        "botanicalName": "Cannabis indica",
        "commonName": "Stream Hemp",
        "dogriName": "Jungle Bhang",
        "family": "Cannabaceae",
        "habit": "Herb",
        "zone": "Ravine Corridors",
        "coords": [
            32.9415,
            74.9567
        ],
        "elevation": "829m MSL",
        "toxicity": "Mild Irritant",
        "toxicAgent": "Phytocannabinoids",
        "firstAid": "Wash hands post handling.",
        "phenology": "Flowering: Aug - Oct",
        "iucn": "LC",
        "notes": "Luxuriant damp ravine stands reaching heights exceeding 3 meters during late monsoon.",
        "photo": null,
        "verified": false
    },
    {
        "id": "SMVDU-FL-095",
        "botanicalName": "Mentha longifolia",
        "commonName": "Wild Mint",
        "dogriName": "Jangli Pudina",
        "family": "Lamiaceae",
        "habit": "Herb",
        "zone": "Ravine Corridors",
        "coords": [
            32.9412,
            74.9578
        ],
        "elevation": "826m MSL",
        "toxicity": "Safe",
        "toxicAgent": "Menthol essential oils",
        "firstAid": "Safe aromatic culinary herb.",
        "phenology": "Flowering: Jun - Sep",
        "iucn": "LC",
        "notes": "Intensely minty stoloniferous perennial herb growing right in slow-moving watercourse margins.",
        "photo": null,
        "verified": false
    },
    {
        "id": "SMVDU-FL-096",
        "botanicalName": "Debregeasia saeneb",
        "commonName": "Wild Rhea",
        "dogriName": "Sihar / Sansaru",
        "family": "Urticaceae",
        "habit": "Shrub",
        "zone": "Ravine Corridors",
        "coords": [
            32.9422,
            74.9564
        ],
        "elevation": "836m MSL",
        "toxicity": "Safe",
        "toxicAgent": "Non-stinging foliage; edible berries",
        "firstAid": "Standard hygiene.",
        "phenology": "Flowering: Mar - May; Fruiting: Jun - Aug",
        "iucn": "LC",
        "notes": "Bicolored leaves with snow-white felt underneath; sweet yellow-orange edible aggregate fruit.",
        "photo": null,
        "verified": false
    },
    {
        "id": "SMVDU-FL-097",
        "botanicalName": "Boehmeria rugulosa",
        "commonName": "Gentle Fibre Tree",
        "dogriName": "Dar / Gainti",
        "family": "Urticaceae",
        "habit": "Tree",
        "zone": "Ravine Corridors",
        "coords": [
            32.9427,
            74.9559
        ],
        "elevation": "842m MSL",
        "toxicity": "Safe",
        "toxicAgent": "Non-toxic",
        "firstAid": "Standard hygiene.",
        "phenology": "Flowering: Jul - Sep; Fruiting: Oct - Nov",
        "iucn": "LC",
        "notes": "Ravine wall tree; finely grained light reddish timber traditionally carved into milk vessels.",
        "photo": null,
        "verified": false
    },
    {
        "id": "SMVDU-FL-098",
        "botanicalName": "Urtica dioica",
        "commonName": "Stinging Nettle",
        "dogriName": "Bichhu Booti / Sain",
        "family": "Urticaceae",
        "habit": "Herb",
        "zone": "Ravine Corridors",
        "coords": [
            32.9417,
            74.9574
        ],
        "elevation": "830m MSL",
        "toxicity": "Mild Irritant",
        "toxicAgent": "Histamine, acetylcholine & formic acid in silica stinging hairs",
        "firstAid": "Apply alkaline paste (baking soda) or crush wild dock leaves onto stung dermis.",
        "phenology": "Flowering: May - Sep",
        "iucn": "LC",
        "notes": "Intense immediate contact burning sensation from hypodermic stinging hairs; young leaves boiled for tea.",
        "photo": null,
        "verified": false
    },
    {
        "id": "SMVDU-FL-099",
        "botanicalName": "Persicaria hydropiper",
        "commonName": "Water Pepper",
        "dogriName": "Mirch Ghas",
        "family": "Polygonaceae",
        "habit": "Herb",
        "zone": "Ravine Corridors",
        "coords": [
            32.9411,
            74.9576
        ],
        "elevation": "825m MSL",
        "toxicity": "Mild Irritant",
        "toxicAgent": "Polygodial pungent sesquiterpene",
        "firstAid": "Wash skin; sharp peppery taste causes burning if chewed raw.",
        "phenology": "Flowering: Jun - Oct",
        "iucn": "LC",
        "notes": "Grows in shallow stream currents; pungent acrid leaves protect plant from grazing fish and insects.",
        "photo": null,
        "verified": false
    },
    {
        "id": "SMVDU-FL-100",
        "botanicalName": "Arundo donax",
        "commonName": "Giant Reed",
        "dogriName": "Nal / Nar",
        "family": "Poaceae",
        "habit": "Herb",
        "zone": "Ravine Corridors",
        "coords": [
            32.9414,
            74.9579
        ],
        "elevation": "827m MSL",
        "toxicity": "Safe",
        "toxicAgent": "Non-toxic stout reed",
        "firstAid": "Standard hygiene.",
        "phenology": "Flowering: Sep - Nov",
        "iucn": "LC",
        "notes": "Giant perennial rhizomatous grass reaching 4m height; robust stems utilized for pens and pipes.",
        "photo": null,
        "verified": false
    },
    {
        "id": "SMVDU-FL-101",
        "botanicalName": "Ricinus communis",
        "commonName": "Castor Bean",
        "dogriName": "Arand / Harnauli",
        "family": "Euphorbiaceae",
        "habit": "Shrub",
        "zone": "Ravine Corridors",
        "coords": [
            32.9426,
            74.9566
        ],
        "elevation": "839m MSL",
        "toxicity": "Toxic",
        "toxicAgent": "Ricin ribosome-inactivating protein in seeds",
        "firstAid": "Extreme fatal toxicity risk if chewed. Immediate emergency hospitalization.",
        "phenology": "Flowering: Year-round",
        "iucn": "LC",
        "notes": "Lethal cellular toxin (Ricin) concentrated in mottled seeds. Large palmate leaves along stream banks.",
        "photo": null,
        "verified": false
    },
    {
        "id": "SMVDU-FL-102",
        "botanicalName": "Coriaria nepalensis",
        "commonName": "Mussoorie Berry",
        "dogriName": "Masuri",
        "family": "Coriariaceae",
        "habit": "Shrub",
        "zone": "Ravine Corridors",
        "coords": [
            32.9431,
            74.9555
        ],
        "elevation": "848m MSL",
        "toxicity": "Toxic",
        "toxicAgent": "Coriamyrtin convulsant sesquiterpene",
        "firstAid": "Do not eat tempting shiny black fruits. Seek emergency medical care if swallowed.",
        "phenology": "Flowering: Mar - May; Fruiting: Jun - Aug",
        "iucn": "LC",
        "notes": "Grows on shaded moist ravine cliffs; attractive purple-black fleshy petals contain coriamyrtin.",
        "photo": null,
        "verified": false
    },
    {
        "id": "SMVDU-FL-103",
        "botanicalName": "Colocasia esculenta",
        "commonName": "Wild Taro",
        "dogriName": "Kachalu / Ghuian",
        "family": "Araceae",
        "habit": "Herb",
        "zone": "Ravine Corridors",
        "coords": [
            32.9416,
            74.9569
        ],
        "elevation": "830m MSL",
        "toxicity": "Mild Irritant",
        "toxicAgent": "Needle-like calcium oxalate raphides",
        "firstAid": "Do not chew raw leaf/corm; causes severe mouth stinging and edema.",
        "phenology": "Flowering: Jul - Sep",
        "iucn": "LC",
        "notes": "Massive peltate elephant-ear leaves lining perennial mud seeps; edible only after thorough cooking.",
        "photo": null,
        "verified": false
    },
    {
        "id": "SMVDU-FL-104",
        "botanicalName": "Nasturtium officinale",
        "commonName": "Watercress",
        "dogriName": "Tirphool",
        "family": "Brassicaceae",
        "habit": "Herb",
        "zone": "Ravine Corridors",
        "coords": [
            32.941,
            74.958
        ],
        "elevation": "824m MSL",
        "toxicity": "Safe",
        "toxicAgent": "Glucosinolates (peppery edible)",
        "firstAid": "Wash thoroughly if gathered from natural watercourse.",
        "phenology": "Flowering: Mar - Jun",
        "iucn": "LC",
        "notes": "Floating aquatic herb in cold clear spring seepages; pungent nutritious salad green.",
        "photo": null,
        "verified": false
    },
    {
        "id": "SMVDU-FL-105",
        "botanicalName": "Dryopteris cochleata",
        "commonName": "Shield Fern",
        "dogriName": "Kandur",
        "family": "Dryopteridaceae",
        "habit": "Herb",
        "zone": "Ravine Corridors",
        "coords": [
            32.9423,
            74.9567
        ],
        "elevation": "837m MSL",
        "toxicity": "Safe",
        "toxicAgent": "Non-toxic fern",
        "firstAid": "Standard hygiene.",
        "phenology": "Sporulation: Aug - Nov",
        "iucn": "LC",
        "notes": "Dimorphic fronds; sterile broad green fronds form rosette while fertile contracted fronds stand erect.",
        "photo": null,
        "verified": false
    },
    {
        "id": "SMVDU-FL-106",
        "botanicalName": "Polygonum plebeium",
        "commonName": "Common Knotweed",
        "dogriName": "Chimti",
        "family": "Polygonaceae",
        "habit": "Herb",
        "zone": "Ravine Corridors",
        "coords": [
            32.9413,
            74.9571
        ],
        "elevation": "828m MSL",
        "toxicity": "Safe",
        "toxicAgent": "Non-toxic",
        "firstAid": "Standard hygiene.",
        "phenology": "Flowering: Year-round (drying mud)",
        "iucn": "LC",
        "notes": "Prostrate diffuse herb covering drying gravel shores of seasonal nullahs with minute pink flowers.",
        "photo": null,
        "verified": false
    },
    {
        "id": "SMVDU-FL-107",
        "botanicalName": "Rorippa indica",
        "commonName": "Indian Field Cress",
        "dogriName": "Khobkalan",
        "family": "Brassicaceae",
        "habit": "Herb",
        "zone": "Ravine Corridors",
        "coords": [
            32.9415,
            74.9577
        ],
        "elevation": "829m MSL",
        "toxicity": "Safe",
        "toxicAgent": "Mustard oil glucosides",
        "firstAid": "Standard hygiene.",
        "phenology": "Flowering: Feb - Jun",
        "iucn": "LC",
        "notes": "Small yellow cruciferous flowers followed by slender cylindrical siliques in moist silty gravel.",
        "photo": null,
        "verified": false
    },
    {
        "id": "SMVDU-FL-108",
        "botanicalName": "Drymaria cordata",
        "commonName": "Tropical Chickweed",
        "dogriName": "Pithpapra",
        "family": "Caryophyllaceae",
        "habit": "Herb",
        "zone": "Ravine Corridors",
        "coords": [
            32.9419,
            74.9573
        ],
        "elevation": "833m MSL",
        "toxicity": "Safe",
        "toxicAgent": "Non-toxic",
        "firstAid": "Standard hygiene.",
        "phenology": "Flowering: Year-round in humid shade",
        "iucn": "LC",
        "notes": "Creeping delicate herb with cordate leaves forming soft mats across damp mossy boulders.",
        "photo": null,
        "verified": false
    },
    {
        "id": "SMVDU-FL-109",
        "botanicalName": "Hydrocotyle sibthorpioides",
        "commonName": "Lawn Marshpennywort",
        "dogriName": "Brahmi-Booti",
        "family": "Araliaceae",
        "habit": "Herb",
        "zone": "Ravine Corridors",
        "coords": [
            32.9418,
            74.9576
        ],
        "elevation": "831m MSL",
        "toxicity": "Safe",
        "toxicAgent": "Saponin triterpenoids",
        "firstAid": "Standard hygiene.",
        "phenology": "Flowering: Apr - Jul",
        "iucn": "LC",
        "notes": "Minute circular crenate leaves rooting at nodes in damp loam of wet stream shoulders.",
        "photo": null,
        "verified": false
    },
    {
        "id": "SMVDU-FL-110",
        "botanicalName": "Ageratina adenophora",
        "commonName": "Crofton Weed",
        "dogriName": "Kala Ban",
        "family": "Asteraceae",
        "habit": "Shrub",
        "zone": "Ravine Corridors",
        "coords": [
            32.9425,
            74.956
        ],
        "elevation": "838m MSL",
        "toxicity": "Toxic",
        "toxicAgent": "9,10-dihydro-tremetone hepatotoxin in horses",
        "firstAid": "Wash skin with soap post handling.",
        "phenology": "Flowering: Feb - May",
        "iucn": "LC",
        "notes": "High invasive colonization along wet nullah edges; causes pulmonary edema and hepatotoxicity in horses.",
        "photo": null,
        "verified": false
    },
    {
        "id": "SMVDU-FL-111",
        "botanicalName": "Centella asiatica",
        "commonName": "Asiatic Pennywort / Gotu Kola",
        "dogriName": "Brahmi / Khulakhuri",
        "family": "Apiaceae",
        "habit": "Herb",
        "zone": "Ravine Corridors",
        "coords": [
            32.9417,
            74.9571
        ],
        "elevation": "830m MSL",
        "toxicity": "Safe",
        "toxicAgent": "Asiaticoside triterpenoids",
        "firstAid": "Standard field hygiene.",
        "phenology": "Flowering: May - Sep",
        "iucn": "LC",
        "notes": "Renowned cognitive and memory enhancer; kidney-shaped leaves carpet wet shady stream margins.",
        "photo": null,
        "verified": false
    },
    {
        "id": "SMVDU-FL-112",
        "botanicalName": "Bacopa monnieri",
        "commonName": "Water Hyssop",
        "dogriName": "Jal-Brahmi",
        "family": "Plantaginaceae",
        "habit": "Herb",
        "zone": "Ravine Corridors",
        "coords": [
            32.9412,
            74.9577
        ],
        "elevation": "826m MSL",
        "toxicity": "Safe",
        "toxicAgent": "Bacoside A & B",
        "firstAid": "Non-toxic nootropic herb.",
        "phenology": "Flowering: Apr - Oct",
        "iucn": "LC",
        "notes": "Succulent oblong leaves and light purple-blue flowers rooted directly in clear slow-moving spring beds.",
        "photo": null,
        "verified": false
    },
    {
        "id": "SMVDU-FL-113",
        "botanicalName": "Marsilea quadrifolia",
        "commonName": "Four-leaf Water Clover",
        "dogriName": "Chaupatia",
        "family": "Marsileaceae",
        "habit": "Herb",
        "zone": "Ravine Corridors",
        "coords": [
            32.9414,
            74.9573
        ],
        "elevation": "827m MSL",
        "toxicity": "Safe",
        "toxicAgent": "Contains thiaminase (neutralized by cooking)",
        "firstAid": "Standard hygiene.",
        "phenology": "Sporocarps mature: Oct - Dec",
        "iucn": "LC",
        "notes": "Aquatic fern mimicking a four-leaf clover; floating fronds in seasonal standing water depressions.",
        "photo": null,
        "verified": false
    },
    {
        "id": "SMVDU-FL-114",
        "botanicalName": "Spilanthes acmella",
        "commonName": "Toothache Plant",
        "dogriName": "Akarkara",
        "family": "Asteraceae",
        "habit": "Herb",
        "zone": "Ravine Corridors",
        "coords": [
            32.942,
            74.9567
        ],
        "elevation": "834m MSL",
        "toxicity": "Safe",
        "toxicAgent": "Spilanthol alkylamide gives electric tingling numbness",
        "firstAid": "Temporary salivary stimulation and tongue tingling.",
        "phenology": "Flowering: Jul - Nov",
        "iucn": "LC",
        "notes": "Yellow conical composite heads; chewing flower bud delivers remarkable electric local oral anaesthesia.",
        "photo": null,
        "verified": false
    },
    {
        "id": "SMVDU-FL-115",
        "botanicalName": "Typha angustifolia",
        "commonName": "Narrowleaf Cattail",
        "dogriName": "Dill / Gondi",
        "family": "Typhaceae",
        "habit": "Herb",
        "zone": "Ravine Corridors",
        "coords": [
            32.9408,
            74.9582
        ],
        "elevation": "822m MSL",
        "toxicity": "Safe",
        "toxicAgent": "Non-toxic marsh reed",
        "firstAid": "Standard hygiene.",
        "phenology": "Flowering: Jun - Sep",
        "iucn": "LC",
        "notes": "Cylindrical brown velvet spikes; emergent macrophyte filtering sediments at campus nullah discharge point.",
        "photo": null,
        "verified": false
    },
    {
        "id": "SMVDU-FL-116",
        "botanicalName": "Polygonum barbatum",
        "commonName": "Bearded Knotweed",
        "dogriName": "Kutta-Ghas",
        "family": "Polygonaceae",
        "habit": "Herb",
        "zone": "Ravine Corridors",
        "coords": [
            32.9415,
            74.957
        ],
        "elevation": "829m MSL",
        "toxicity": "Safe",
        "toxicAgent": "Non-toxic",
        "firstAid": "Standard hygiene.",
        "phenology": "Flowering: Sep - Feb",
        "iucn": "LC",
        "notes": "Robust wetland perennial with long ciliate ochrea hairs and white spiked racemes; stabilizes silty banks.",
        "photo": null,
        "verified": false
    },
    {
        "id": "SMVDU-FL-117",
        "verified": true,
        "botanicalName": "Ageratum conyzoides / Ageratum houstonianum",
        "commonName": "Billygoat Weed / Flossflower",
        "dogriName": "Neelam Phool",
        "family": "Asteraceae",
        "habit": "Herb",
        "zone": "",
        "latitude": null,
        "longitude": null,
        "coords": null,
        "elevation": "",
        "toxicity": "Safe",
        "toxicAgent": "Non-toxic",
        "firstAid": "Standard hygiene.",
        "phenology": "Standard foothill phenological schedule.",
        "iucn": "LC",
        "notes": "Nectar source for butterflies and insect pollinators",
        "photo": null
    },
    {
        "id": "SMVDU-FL-118",
        "verified": true,
        "botanicalName": "Araucaria heterophylla",
        "commonName": "Norfolk Island Pine",
        "dogriName": "Christmas Tree",
        "family": "Araucariaceae",
        "habit": "Tree",
        "zone": "",
        "latitude": null,
        "longitude": null,
        "coords": null,
        "elevation": "",
        "toxicity": "Safe",
        "toxicAgent": "Non-toxic",
        "firstAid": "Standard hygiene.",
        "phenology": "Standard foothill phenological schedule.",
        "iucn": "LC",
        "notes": "Year-round evergreen structure and avian perching",
        "photo": null
    },
    {
        "id": "SMVDU-FL-119",
        "verified": true,
        "botanicalName": "Syngonium podophyllum",
        "commonName": "Arrowhead Plant / Syngonium",
        "dogriName": "Syngonium",
        "family": "Araceae",
        "habit": "Climber",
        "zone": "",
        "latitude": null,
        "longitude": null,
        "coords": null,
        "elevation": "",
        "toxicity": "Safe",
        "toxicAgent": "Non-toxic",
        "firstAid": "Standard hygiene.",
        "phenology": "Standard foothill phenological schedule.",
        "iucn": "LC",
        "notes": "Groundcover microhabitat and indoor air filtration",
        "photo": null
    },
    {
        "id": "SMVDU-FL-120",
        "verified": true,
        "botanicalName": "Bambusa vulgaris",
        "commonName": "Common Bamboo",
        "dogriName": "Bains / Baans",
        "family": "Poaceae",
        "habit": "Grass",
        "zone": "",
        "latitude": null,
        "longitude": null,
        "coords": null,
        "elevation": "",
        "toxicity": "Safe",
        "toxicAgent": "Non-toxic",
        "firstAid": "Standard hygiene.",
        "phenology": "Standard foothill phenological schedule.",
        "iucn": "LC",
        "notes": "Soil stabilization, carbon sequestration, and dense wildlife cover",
        "photo": null
    },
    {
        "id": "SMVDU-FL-121",
        "verified": true,
        "botanicalName": "Bidens pilosa",
        "commonName": "Blackjack / Cobbler's Pegs",
        "dogriName": "Sui Kanta",
        "family": "Asteraceae",
        "habit": "Herb",
        "zone": "",
        "latitude": null,
        "longitude": null,
        "coords": null,
        "elevation": "",
        "toxicity": "Safe",
        "toxicAgent": "Non-toxic",
        "firstAid": "Standard hygiene.",
        "phenology": "Standard foothill phenological schedule.",
        "iucn": "LC",
        "notes": "Major generalist nectar and pollen source for native bees",
        "photo": null
    },
    {
        "id": "SMVDU-FL-122",
        "verified": true,
        "botanicalName": "Callistemon lanceolatus (Melaleuca citrina)",
        "commonName": "Bottlebrush",
        "dogriName": "Botal Brush",
        "family": "Myrtaceae",
        "habit": "Tree",
        "zone": "",
        "latitude": null,
        "longitude": null,
        "coords": null,
        "elevation": "",
        "toxicity": "Safe",
        "toxicAgent": "Non-toxic",
        "firstAid": "Standard hygiene.",
        "phenology": "Standard foothill phenological schedule.",
        "iucn": "LC",
        "notes": "High-nectar forage for sunbirds, honeybees, and butterflies",
        "photo": null
    },
    {
        "id": "SMVDU-FL-123",
        "verified": true,
        "botanicalName": "Celosia argentea",
        "commonName": "Silver Cock's Comb / Plumed Celosia",
        "dogriName": "Sillar",
        "family": "Amaranthaceae",
        "habit": "Herb",
        "zone": "",
        "latitude": null,
        "longitude": null,
        "coords": null,
        "elevation": "",
        "toxicity": "Safe",
        "toxicAgent": "Non-toxic",
        "firstAid": "Standard hygiene.",
        "phenology": "Standard foothill phenological schedule.",
        "iucn": "LC",
        "notes": "Attracts wild bees, hoverflies, and seed-eating birds",
        "photo": null
    },
    {
        "id": "SMVDU-FL-124",
        "verified": true,
        "botanicalName": "Platanus orientalis",
        "commonName": "Chinar / Oriental Plane Tree",
        "dogriName": "Chinar / Boonyi",
        "family": "Platanaceae",
        "habit": "Tree",
        "zone": "",
        "latitude": null,
        "longitude": null,
        "coords": null,
        "elevation": "",
        "toxicity": "Safe",
        "toxicAgent": "Non-toxic",
        "firstAid": "Standard hygiene.",
        "phenology": "Standard foothill phenological schedule.",
        "iucn": "LC",
        "notes": "Massive shade canopy, carbon sink, and avian nesting habitat",
        "photo": null
    },
    {
        "id": "SMVDU-FL-125",
        "verified": true,
        "botanicalName": "Coleus scutellarioides (Plectranthus scutellarioides)",
        "commonName": "Coleus / Painted Nettle",
        "dogriName": "Coleus",
        "family": "Lamiaceae",
        "habit": "Herb",
        "zone": "",
        "latitude": null,
        "longitude": null,
        "coords": null,
        "elevation": "",
        "toxicity": "Safe",
        "toxicAgent": "Non-toxic",
        "firstAid": "Standard hygiene.",
        "phenology": "Standard foothill phenological schedule.",
        "iucn": "LC",
        "notes": "Flowers support small bees; foliage provides ground cover",
        "photo": null
    },
    {
        "id": "SMVDU-FL-126",
        "verified": true,
        "botanicalName": "Ficus carica",
        "commonName": "Common Fig / Anjeer",
        "dogriName": "Anjeer / Phagwara",
        "family": "Moraceae",
        "habit": "Tree",
        "zone": "",
        "latitude": null,
        "longitude": null,
        "coords": null,
        "elevation": "",
        "toxicity": "Safe",
        "toxicAgent": "Non-toxic",
        "firstAid": "Standard hygiene.",
        "phenology": "Standard foothill phenological schedule.",
        "iucn": "LC",
        "notes": "Keystone resource for fig wasps and frugivorous birds",
        "photo": null
    },
    {
        "id": "SMVDU-FL-127",
        "verified": true,
        "botanicalName": "Psidium guajava",
        "commonName": "Common Guava",
        "dogriName": "Amrood",
        "family": "Myrtaceae",
        "habit": "Tree",
        "zone": "",
        "latitude": null,
        "longitude": null,
        "coords": null,
        "elevation": "",
        "toxicity": "Safe",
        "toxicAgent": "Non-toxic",
        "firstAid": "Standard hygiene.",
        "phenology": "Standard foothill phenological schedule.",
        "iucn": "LC",
        "notes": "Flowers support bees; fruits feed parakeets, bulbuls, and squirrels",
        "photo": null
    },
    {
        "id": "SMVDU-FL-128",
        "verified": true,
        "botanicalName": "Acalypha wilkesiana",
        "commonName": "Copperleaf / Jacob's Coat",
        "dogriName": "Tamba Patta",
        "family": "Euphorbiaceae",
        "habit": "Shrub",
        "zone": "",
        "latitude": null,
        "longitude": null,
        "coords": null,
        "elevation": "",
        "toxicity": "Safe",
        "toxicAgent": "Non-toxic",
        "firstAid": "Standard hygiene.",
        "phenology": "Standard foothill phenological schedule.",
        "iucn": "LC",
        "notes": "Dense hedge cover for garden insects and small birds",
        "photo": null
    },
    {
        "id": "SMVDU-FL-129",
        "verified": true,
        "botanicalName": "Erythrina variegata",
        "commonName": "Indian Coral Tree",
        "dogriName": "Mandar",
        "family": "Fabaceae",
        "habit": "Tree",
        "zone": "",
        "latitude": null,
        "longitude": null,
        "coords": null,
        "elevation": "",
        "toxicity": "Safe",
        "toxicAgent": "Non-toxic",
        "firstAid": "Standard hygiene.",
        "phenology": "Standard foothill phenological schedule.",
        "iucn": "LC",
        "notes": "Nitrogen-fixing legume; rich nectar source for sunbirds, mynas, and crows",
        "photo": null
    },
    {
        "id": "SMVDU-FL-130",
        "verified": true,
        "botanicalName": "Codiaeum variegatum",
        "commonName": "Garden Croton Gold Dust & Oakleaf",
        "dogriName": "Croton",
        "family": "Euphorbiaceae",
        "habit": "Shrub",
        "zone": "",
        "latitude": null,
        "longitude": null,
        "coords": null,
        "elevation": "",
        "toxicity": "Safe",
        "toxicAgent": "Non-toxic",
        "firstAid": "Standard hygiene.",
        "phenology": "Standard foothill phenological schedule.",
        "iucn": "LC",
        "notes": "Provides dense evergreen shelter in landscaped beds",
        "photo": null
    },
    {
        "id": "SMVDU-FL-131",
        "verified": true,
        "botanicalName": "Euphorbia milii",
        "commonName": "Crown of Thorns",
        "dogriName": "Kanta Taj",
        "family": "Euphorbiaceae",
        "habit": "Shrub",
        "zone": "",
        "latitude": null,
        "longitude": null,
        "coords": null,
        "elevation": "",
        "toxicity": "Safe",
        "toxicAgent": "Non-toxic",
        "firstAid": "Standard hygiene.",
        "phenology": "Standard foothill phenological schedule.",
        "iucn": "LC",
        "notes": "Drought-hardy rockery plant; cyathia visited by ants and small flies",
        "photo": null
    },
    {
        "id": "SMVDU-FL-132",
        "verified": true,
        "botanicalName": "Bergera koenigii (Murraya koenigii)",
        "commonName": "Curry Leaf Tree",
        "dogriName": "Darankari / Kadi Patta",
        "family": "Rutaceae",
        "habit": "Shrub",
        "zone": "",
        "latitude": null,
        "longitude": null,
        "coords": null,
        "elevation": "",
        "toxicity": "Safe",
        "toxicAgent": "Non-toxic",
        "firstAid": "Standard hygiene.",
        "phenology": "Standard foothill phenological schedule.",
        "iucn": "LC",
        "notes": "Host plant for Swallowtail butterflies (Papilio polytes); berries eaten by birds",
        "photo": null
    },
    {
        "id": "SMVDU-FL-133",
        "verified": true,
        "botanicalName": "Cycas revoluta",
        "commonName": "Sago Palm / King Sago",
        "dogriName": "Sabudana Palm",
        "family": "Cycadaceae",
        "habit": "Gymnosperm",
        "zone": "",
        "latitude": null,
        "longitude": null,
        "coords": null,
        "elevation": "",
        "toxicity": "Safe",
        "toxicAgent": "Non-toxic",
        "firstAid": "Standard hygiene.",
        "phenology": "Standard foothill phenological schedule.",
        "iucn": "LC",
        "notes": "Ancient living fossil gymnosperm providing architectural garden habitat",
        "photo": null
    },
    {
        "id": "SMVDU-FL-134",
        "verified": true,
        "botanicalName": "Ipomoea quamoclit",
        "commonName": "Cypress Vine",
        "dogriName": "Kamlata",
        "family": "Convolvulaceae",
        "habit": "Climber",
        "zone": "",
        "latitude": null,
        "longitude": null,
        "coords": null,
        "elevation": "",
        "toxicity": "Safe",
        "toxicAgent": "Non-toxic",
        "firstAid": "Standard hygiene.",
        "phenology": "Standard foothill phenological schedule.",
        "iucn": "LC",
        "notes": "Tubular red blooms attract long-tongued butterflies, moths, and sunbirds",
        "photo": null
    },
    {
        "id": "SMVDU-FL-135",
        "verified": true,
        "botanicalName": "Portulacaria afra",
        "commonName": "Elephant Bush / Dwarf Jade",
        "dogriName": "Jade Booti",
        "family": "Didiereaceae",
        "habit": "Succulent",
        "zone": "",
        "latitude": null,
        "longitude": null,
        "coords": null,
        "elevation": "",
        "toxicity": "Safe",
        "toxicAgent": "Non-toxic",
        "firstAid": "Standard hygiene.",
        "phenology": "Standard foothill phenological schedule.",
        "iucn": "LC",
        "notes": "High carbon-sequestering CAM succulent and drought-tolerant soil binder",
        "photo": null
    },
    {
        "id": "SMVDU-FL-136",
        "verified": true,
        "botanicalName": "Ficus microcarpa (Ficus retusa)",
        "commonName": "Ficus Topiary / Indian Laurel",
        "dogriName": "Pilkhan",
        "family": "Moraceae",
        "habit": "Tree",
        "zone": "",
        "latitude": null,
        "longitude": null,
        "coords": null,
        "elevation": "",
        "toxicity": "Safe",
        "toxicAgent": "Non-toxic",
        "firstAid": "Standard hygiene.",
        "phenology": "Standard foothill phenological schedule.",
        "iucn": "LC",
        "notes": "Fig wasp mutualism; dense pruned canopy provides bird nesting sites",
        "photo": null
    },
    {
        "id": "SMVDU-FL-137",
        "verified": true,
        "botanicalName": "Wodyetia bifurcata",
        "commonName": "Foxtail Palm",
        "dogriName": "Lomdi Palm",
        "family": "Arecaceae",
        "habit": "Palm",
        "zone": "",
        "latitude": null,
        "longitude": null,
        "coords": null,
        "elevation": "",
        "toxicity": "Safe",
        "toxicAgent": "Non-toxic",
        "firstAid": "Standard hygiene.",
        "phenology": "Standard foothill phenological schedule.",
        "iucn": "LC",
        "notes": "Provides vertical structure, perching sites, and fruit for frugivorous birds",
        "photo": null
    },
    {
        "id": "SMVDU-FL-138",
        "verified": true,
        "botanicalName": "Duranta erecta",
        "commonName": "Golden Dewdrop / Skyflower",
        "dogriName": "Duranta",
        "family": "Verbenaceae",
        "habit": "Shrub",
        "zone": "",
        "latitude": null,
        "longitude": null,
        "coords": null,
        "elevation": "",
        "toxicity": "Safe",
        "toxicAgent": "Non-toxic",
        "firstAid": "Standard hygiene.",
        "phenology": "Standard foothill phenological schedule.",
        "iucn": "LC",
        "notes": "Nectar-rich flowers for butterflies; dense thorny hedge shelters sparrows",
        "photo": null
    },
    {
        "id": "SMVDU-FL-139",
        "verified": true,
        "botanicalName": "Cuphea llavea / Cuphea procumbens",
        "commonName": "Hawaiian Bell / Cigar Flower",
        "dogriName": "Cuphea",
        "family": "Lythraceae",
        "habit": "Herb",
        "zone": "",
        "latitude": null,
        "longitude": null,
        "coords": null,
        "elevation": "",
        "toxicity": "Safe",
        "toxicAgent": "Non-toxic",
        "firstAid": "Standard hygiene.",
        "phenology": "Standard foothill phenological schedule.",
        "iucn": "LC",
        "notes": "Continuous tubular floral nectar for bees and hoverflies",
        "photo": null
    },
    {
        "id": "SMVDU-FL-140",
        "verified": true,
        "botanicalName": "Hibiscus rosa-sinensis",
        "commonName": "Chinese Hibiscus / Gudhal",
        "dogriName": "Gudhal",
        "family": "Malvaceae",
        "habit": "Shrub",
        "zone": "",
        "latitude": null,
        "longitude": null,
        "coords": null,
        "elevation": "",
        "toxicity": "Safe",
        "toxicAgent": "Non-toxic",
        "firstAid": "Standard hygiene.",
        "phenology": "Standard foothill phenological schedule.",
        "iucn": "LC",
        "notes": "Major nectar source for sunbirds, carpenter bees, and butterflies",
        "photo": null
    },
    {
        "id": "SMVDU-FL-141",
        "verified": true,
        "botanicalName": "Terminalia catappa",
        "commonName": "Indian Almond",
        "dogriName": "Desi Badam",
        "family": "Combretaceae",
        "habit": "Tree",
        "zone": "",
        "latitude": null,
        "longitude": null,
        "coords": null,
        "elevation": "",
        "toxicity": "Safe",
        "toxicAgent": "Non-toxic",
        "firstAid": "Standard hygiene.",
        "phenology": "Standard foothill phenological schedule.",
        "iucn": "LC",
        "notes": "Tiered pagoda canopy provides shade; fruits eaten by bats and birds",
        "photo": null
    },
    {
        "id": "SMVDU-FL-142",
        "verified": true,
        "botanicalName": "Alternanthera sessilis",
        "commonName": "Joyweed / Sessile Joyweed",
        "dogriName": "Sarponkha",
        "family": "Amaranthaceae",
        "habit": "Herb",
        "zone": "",
        "latitude": null,
        "longitude": null,
        "coords": null,
        "elevation": "",
        "toxicity": "Safe",
        "toxicAgent": "Non-toxic",
        "firstAid": "Standard hygiene.",
        "phenology": "Standard foothill phenological schedule.",
        "iucn": "LC",
        "notes": "Soil moisture retention and low-lying insect microhabitat",
        "photo": null
    },
    {
        "id": "SMVDU-FL-143",
        "verified": true,
        "botanicalName": "Neolamarckia cadamba",
        "commonName": "Kadamba Tree",
        "dogriName": "Kadamb",
        "family": "Rubiaceae",
        "habit": "Tree",
        "zone": "",
        "latitude": null,
        "longitude": null,
        "coords": null,
        "elevation": "",
        "toxicity": "Safe",
        "toxicAgent": "Non-toxic",
        "firstAid": "Standard hygiene.",
        "phenology": "Standard foothill phenological schedule.",
        "iucn": "LC",
        "notes": "Globose fragrant flower heads attract bees, butterflies, and fruit bats",
        "photo": null
    },
    {
        "id": "SMVDU-FL-144",
        "verified": true,
        "botanicalName": "Saccharum spontaneum",
        "commonName": "Kans Grass / Wild Sugarcane",
        "dogriName": "Kans / Kaah",
        "family": "Poaceae",
        "habit": "Grass",
        "zone": "",
        "latitude": null,
        "longitude": null,
        "coords": null,
        "elevation": "",
        "toxicity": "Safe",
        "toxicAgent": "Non-toxic",
        "firstAid": "Standard hygiene.",
        "phenology": "Standard foothill phenological schedule.",
        "iucn": "LC",
        "notes": "Pioneer soil binder on riverbanks and disturbed slopes; shelter for ground birds",
        "photo": null
    },
    {
        "id": "SMVDU-FL-145",
        "verified": true,
        "botanicalName": "Citrus limon / Citrus pseudolimon",
        "commonName": "Lemon / Hill Lemon Galgal",
        "dogriName": "Galgal / Kimb",
        "family": "Rutaceae",
        "habit": "Shrub",
        "zone": "",
        "latitude": null,
        "longitude": null,
        "coords": null,
        "elevation": "",
        "toxicity": "Safe",
        "toxicAgent": "Non-toxic",
        "firstAid": "Standard hygiene.",
        "phenology": "Standard foothill phenological schedule.",
        "iucn": "LC",
        "notes": "Host plant for Lime Butterfly (Papilio demoleus); fragrant flowers feed honeybees",
        "photo": null
    },
    {
        "id": "SMVDU-FL-146",
        "verified": true,
        "botanicalName": "Mangifera indica",
        "commonName": "Mango Tree",
        "dogriName": "Amb / Aam",
        "family": "Anacardiaceae",
        "habit": "Tree",
        "zone": "",
        "latitude": null,
        "longitude": null,
        "coords": null,
        "elevation": "",
        "toxicity": "Safe",
        "toxicAgent": "Non-toxic",
        "firstAid": "Standard hygiene.",
        "phenology": "Standard foothill phenological schedule.",
        "iucn": "LC",
        "notes": "Dense evergreen shade canopy; supports pollinators and frugivorous wildlife",
        "photo": null
    },
    {
        "id": "SMVDU-FL-147",
        "verified": true,
        "botanicalName": "Cuphea hyssopifolia",
        "commonName": "Mexican Heather / False Heather",
        "dogriName": "Mexican Heather",
        "family": "Lythraceae",
        "habit": "Shrub",
        "zone": "",
        "latitude": null,
        "longitude": null,
        "coords": null,
        "elevation": "",
        "toxicity": "Safe",
        "toxicAgent": "Non-toxic",
        "firstAid": "Standard hygiene.",
        "phenology": "Standard foothill phenological schedule.",
        "iucn": "LC",
        "notes": "High-density low border plant attracting small native bees and hoverflies",
        "photo": null
    },
    {
        "id": "SMVDU-FL-148",
        "verified": true,
        "botanicalName": "Tradescantia spathacea",
        "commonName": "Moses-in-the-Cradle / Oyster Plant",
        "dogriName": "Kishti Booti",
        "family": "Commelinaceae",
        "habit": "Herb",
        "zone": "",
        "latitude": null,
        "longitude": null,
        "coords": null,
        "elevation": "",
        "toxicity": "Safe",
        "toxicAgent": "Non-toxic",
        "firstAid": "Standard hygiene.",
        "phenology": "Standard foothill phenological schedule.",
        "iucn": "LC",
        "notes": "Dense groundcover suppressing weeds and retaining soil moisture",
        "photo": null
    },
    {
        "id": "SMVDU-FL-149",
        "verified": true,
        "botanicalName": "Quercus leucotrichophora (Quercus spp.)",
        "commonName": "White Oak / Banj Oak",
        "dogriName": "Baan / Ringa",
        "family": "Fagaceae",
        "habit": "Tree",
        "zone": "",
        "latitude": null,
        "longitude": null,
        "coords": null,
        "elevation": "",
        "toxicity": "Safe",
        "toxicAgent": "Non-toxic",
        "firstAid": "Standard hygiene.",
        "phenology": "Standard foothill phenological schedule.",
        "iucn": "LC",
        "notes": "Keystone Himalayan watershed tree; acorns feed squirrels, jays, and bears",
        "photo": null
    },
    {
        "id": "SMVDU-FL-150",
        "verified": true,
        "botanicalName": "Chamaedorea elegans",
        "commonName": "Parlour Palm",
        "dogriName": "Parlour Palm",
        "family": "Arecaceae",
        "habit": "Palm",
        "zone": "",
        "latitude": null,
        "longitude": null,
        "coords": null,
        "elevation": "",
        "toxicity": "Safe",
        "toxicAgent": "Non-toxic",
        "firstAid": "Standard hygiene.",
        "phenology": "Standard foothill phenological schedule.",
        "iucn": "LC",
        "notes": "Shade-adapted understory palm improving indoor/shaded microclimates",
        "photo": null
    },
    {
        "id": "SMVDU-FL-151",
        "verified": true,
        "botanicalName": "Punica granatum",
        "commonName": "Pomegranate / Anar",
        "dogriName": "Dadam / Anar",
        "family": "Lythraceae",
        "habit": "Shrub",
        "zone": "",
        "latitude": null,
        "longitude": null,
        "coords": null,
        "elevation": "",
        "toxicity": "Safe",
        "toxicAgent": "Non-toxic",
        "firstAid": "Standard hygiene.",
        "phenology": "Standard foothill phenological schedule.",
        "iucn": "LC",
        "notes": "Bright red blooms attract birds and bees; wild hills form stabilizes rocky slopes",
        "photo": null
    },
    {
        "id": "SMVDU-FL-152",
        "verified": true,
        "botanicalName": "Millettia pinnata (Pongamia pinnata)",
        "commonName": "Pongam / Karanj / Indian Beech",
        "dogriName": "Karanj / Sukhchain",
        "family": "Fabaceae",
        "habit": "Tree",
        "zone": "",
        "latitude": null,
        "longitude": null,
        "coords": null,
        "elevation": "",
        "toxicity": "Safe",
        "toxicAgent": "Non-toxic",
        "firstAid": "Standard hygiene.",
        "phenology": "Standard foothill phenological schedule.",
        "iucn": "LC",
        "notes": "Nitrogen-fixing legume tree; drought-resistant shade and bee forage",
        "photo": null
    },
    {
        "id": "SMVDU-FL-153",
        "verified": true,
        "botanicalName": "Tradescantia pallida",
        "commonName": "Purple Heart Plant",
        "dogriName": "Baingani Booti",
        "family": "Commelinaceae",
        "habit": "Herb",
        "zone": "",
        "latitude": null,
        "longitude": null,
        "coords": null,
        "elevation": "",
        "toxicity": "Safe",
        "toxicAgent": "Non-toxic",
        "firstAid": "Standard hygiene.",
        "phenology": "Standard foothill phenological schedule.",
        "iucn": "LC",
        "notes": "Hardy drought-tolerant groundcover protecting exposed soil from erosion",
        "photo": null
    },
    {
        "id": "SMVDU-FL-154",
        "verified": true,
        "botanicalName": "Combretum indicum (Quisqualis indica)",
        "commonName": "Rangoon Creeper / Madhumalti",
        "dogriName": "Madhumalti",
        "family": "Combretaceae",
        "habit": "Climber",
        "zone": "",
        "latitude": null,
        "longitude": null,
        "coords": null,
        "elevation": "",
        "toxicity": "Safe",
        "toxicAgent": "Non-toxic",
        "firstAid": "Standard hygiene.",
        "phenology": "Standard foothill phenological schedule.",
        "iucn": "LC",
        "notes": "Color-shifting fragrant tubular flowers pollinated by hawk-moths (nocturnal) and bees (diurnal)",
        "photo": null
    },
    {
        "id": "SMVDU-FL-155",
        "verified": true,
        "botanicalName": "Mussaenda erythrophylla",
        "commonName": "Red Mussaenda / Ashanti Blood",
        "dogriName": "Lal Mussaenda",
        "family": "Rubiaceae",
        "habit": "Shrub",
        "zone": "",
        "latitude": null,
        "longitude": null,
        "coords": null,
        "elevation": "",
        "toxicity": "Safe",
        "toxicAgent": "Non-toxic",
        "firstAid": "Standard hygiene.",
        "phenology": "Standard foothill phenological schedule.",
        "iucn": "LC",
        "notes": "Showy crimson calycophylls (sepal bracts) attract butterflies and sunbirds",
        "photo": null
    },
    {
        "id": "SMVDU-FL-156",
        "verified": true,
        "botanicalName": "Chlorophytum comosum (or Ophiopogon jaburan)",
        "commonName": "Ribbon Grass / Spider Plant",
        "dogriName": "Ribbon Ghaas",
        "family": "Asparagaceae",
        "habit": "Herb",
        "zone": "",
        "latitude": null,
        "longitude": null,
        "coords": null,
        "elevation": "",
        "toxicity": "Safe",
        "toxicAgent": "Non-toxic",
        "firstAid": "Standard hygiene.",
        "phenology": "Standard foothill phenological schedule.",
        "iucn": "LC",
        "notes": "Dense fibrous roots bind potting/border soil and filter indoor air pollutants",
        "photo": null
    },
    {
        "id": "SMVDU-FL-157",
        "verified": true,
        "botanicalName": "Rosa × alba / Rosa hybrida",
        "commonName": "Rose / White Rose",
        "dogriName": "Gulab",
        "family": "Rosaceae",
        "habit": "Shrub",
        "zone": "",
        "latitude": null,
        "longitude": null,
        "coords": null,
        "elevation": "",
        "toxicity": "Safe",
        "toxicAgent": "Non-toxic",
        "firstAid": "Standard hygiene.",
        "phenology": "Standard foothill phenological schedule.",
        "iucn": "LC",
        "notes": "Pollen source for bees; thorny thickets shelter small birds",
        "photo": null
    },
    {
        "id": "SMVDU-FL-158",
        "verified": true,
        "botanicalName": "Roystonea regia",
        "commonName": "Royal Palm",
        "dogriName": "Shahi Palm",
        "family": "Arecaceae",
        "habit": "Palm",
        "zone": "",
        "latitude": null,
        "longitude": null,
        "coords": null,
        "elevation": "",
        "toxicity": "Safe",
        "toxicAgent": "Non-toxic",
        "firstAid": "Standard hygiene.",
        "phenology": "Standard foothill phenological schedule.",
        "iucn": "LC",
        "notes": "Tall columnar trunks offer nesting cavities for parakeets and owls; fruits feed birds",
        "photo": null
    },
    {
        "id": "SMVDU-FL-159",
        "verified": true,
        "botanicalName": "Ficus elastica 'Variegata'",
        "commonName": "Rubber Plant Variegated",
        "dogriName": "Rabar Boota",
        "family": "Moraceae",
        "habit": "Tree",
        "zone": "",
        "latitude": null,
        "longitude": null,
        "coords": null,
        "elevation": "",
        "toxicity": "Safe",
        "toxicAgent": "Non-toxic",
        "firstAid": "Standard hygiene.",
        "phenology": "Standard foothill phenological schedule.",
        "iucn": "LC",
        "notes": "Broad glossy leaves trap particulate dust and improve indoor air quality",
        "photo": null
    },
    {
        "id": "SMVDU-FL-160",
        "verified": true,
        "botanicalName": "Nelumbo nucifera",
        "commonName": "Sacred Lotus",
        "dogriName": "Kamal / Bhen / Nadroo",
        "family": "Nelumbonaceae",
        "habit": "Herb",
        "zone": "",
        "latitude": null,
        "longitude": null,
        "coords": null,
        "elevation": "",
        "toxicity": "Safe",
        "toxicAgent": "Non-toxic",
        "firstAid": "Standard hygiene.",
        "phenology": "Standard foothill phenological schedule.",
        "iucn": "LC",
        "notes": "Aquatic ecosystem engineer providing shade and refuge for fish, frogs, and waterbirds",
        "photo": null
    },
    {
        "id": "SMVDU-FL-161",
        "verified": true,
        "botanicalName": "Bombax ceiba",
        "commonName": "Silk Cotton Tree / Semal",
        "dogriName": "Simbal / Semal",
        "family": "Malvaceae",
        "habit": "Tree",
        "zone": "",
        "latitude": null,
        "longitude": null,
        "coords": null,
        "elevation": "",
        "toxicity": "Safe",
        "toxicAgent": "Non-toxic",
        "firstAid": "Standard hygiene.",
        "phenology": "Standard foothill phenological schedule.",
        "iucn": "LC",
        "notes": "Massive nectar source for birds, bats, and bees in late winter; thorny trunk protects nesting birds",
        "photo": null
    },
    {
        "id": "SMVDU-FL-162",
        "verified": true,
        "botanicalName": "Dracaena reflexa",
        "commonName": "Song of India",
        "dogriName": "Dracaena",
        "family": "Asparagaceae",
        "habit": "Shrub",
        "zone": "",
        "latitude": null,
        "longitude": null,
        "coords": null,
        "elevation": "",
        "toxicity": "Safe",
        "toxicAgent": "Non-toxic",
        "firstAid": "Standard hygiene.",
        "phenology": "Standard foothill phenological schedule.",
        "iucn": "LC",
        "notes": "Evergreen architectural foliage and indoor VOC air purification",
        "photo": null
    },
    {
        "id": "SMVDU-FL-163",
        "verified": true,
        "botanicalName": "Jatropha integerrima",
        "commonName": "Spicy Jatropha / Peregrina",
        "dogriName": "Jatropha",
        "family": "Euphorbiaceae",
        "habit": "Shrub",
        "zone": "",
        "latitude": null,
        "longitude": null,
        "coords": null,
        "elevation": "",
        "toxicity": "Safe",
        "toxicAgent": "Non-toxic",
        "firstAid": "Standard hygiene.",
        "phenology": "Standard foothill phenological schedule.",
        "iucn": "LC",
        "notes": "Starry crimson blooms are a magnet for Swallowtail butterflies and sunbirds",
        "photo": null
    },
    {
        "id": "SMVDU-FL-164",
        "verified": true,
        "botanicalName": "Yucca gigantea (Yucca elephantipes)",
        "commonName": "Spineless Yucca",
        "dogriName": "Yucca",
        "family": "Asparagaceae",
        "habit": "Shrub",
        "zone": "",
        "latitude": null,
        "longitude": null,
        "coords": null,
        "elevation": "",
        "toxicity": "Safe",
        "toxicAgent": "Non-toxic",
        "firstAid": "Standard hygiene.",
        "phenology": "Standard foothill phenological schedule.",
        "iucn": "LC",
        "notes": "Drought-resilient architectural plant for dryland landscaping",
        "photo": null
    },
    {
        "id": "SMVDU-FL-165",
        "verified": true,
        "botanicalName": "Platycladus orientalis (Thuja orientalis)",
        "commonName": "Oriental Thuja / Morpankhi",
        "dogriName": "Morpankhi",
        "family": "Cupressaceae",
        "habit": "Shrub",
        "zone": "",
        "latitude": null,
        "longitude": null,
        "coords": null,
        "elevation": "",
        "toxicity": "Safe",
        "toxicAgent": "Non-toxic",
        "firstAid": "Standard hygiene.",
        "phenology": "Standard foothill phenological schedule.",
        "iucn": "LC",
        "notes": "Dense fan-like evergreen sprays provide year-round nesting cover for small birds",
        "photo": null
    },
    {
        "id": "SMVDU-FL-166",
        "verified": true,
        "botanicalName": "Mimosa pudica",
        "commonName": "Touch-Me-Not / Sensitive Plant",
        "dogriName": "- Chhui-Mui / Lajwanti",
        "family": "Fabaceae",
        "habit": "Herb",
        "zone": "",
        "latitude": null,
        "longitude": null,
        "coords": null,
        "elevation": "",
        "toxicity": "Safe",
        "toxicAgent": "Non-toxic",
        "firstAid": "Standard hygiene.",
        "phenology": "Standard foothill phenological schedule.",
        "iucn": "LC",
        "notes": "Nitrogen-fixing groundcover; thigmonastic leaf-folding demonstrates plant biomechanics",
        "photo": null
    },
    {
        "id": "SMVDU-FL-167",
        "verified": true,
        "botanicalName": "Ocimum tenuiflorum (Ocimum sanctum)",
        "commonName": "Tulsi / Holy Basil",
        "dogriName": "Tulsi",
        "family": "Lamiaceae",
        "habit": "Herb",
        "zone": "",
        "latitude": null,
        "longitude": null,
        "coords": null,
        "elevation": "",
        "toxicity": "Safe",
        "toxicAgent": "Non-toxic",
        "firstAid": "Standard hygiene.",
        "phenology": "Standard foothill phenological schedule.",
        "iucn": "LC",
        "notes": "Aromatic blooms support honeybees and solitary bees",
        "photo": null
    },
    {
        "id": "SMVDU-FL-168",
        "verified": true,
        "botanicalName": "Heptapleurum arboricola (Schefflera arboricola)",
        "commonName": "Dwarf Umbrella Tree",
        "dogriName": "Chhatri Boota",
        "family": "Araliaceae",
        "habit": "Shrub",
        "zone": "",
        "latitude": null,
        "longitude": null,
        "coords": null,
        "elevation": "",
        "toxicity": "Safe",
        "toxicAgent": "Non-toxic",
        "firstAid": "Standard hygiene.",
        "phenology": "Standard foothill phenological schedule.",
        "iucn": "LC",
        "notes": "Glossy palmately compound foliage provides dense shade-tolerant greenery",
        "photo": null
    },
    {
        "id": "SMVDU-FL-169",
        "verified": true,
        "botanicalName": "Agave americana var. marginata",
        "commonName": "Variegated Agave / Century Plant",
        "dogriName": "Rambans",
        "family": "Asparagaceae",
        "habit": "Succulent",
        "zone": "",
        "latitude": null,
        "longitude": null,
        "coords": null,
        "elevation": "",
        "toxicity": "Safe",
        "toxicAgent": "Non-toxic",
        "firstAid": "Standard hygiene.",
        "phenology": "Standard foothill phenological schedule.",
        "iucn": "LC",
        "notes": "Prevents slope erosion in rocky/arid soils; towering flower stalk feeds bats and birds",
        "photo": null
    },
    {
        "id": "SMVDU-FL-170",
        "verified": true,
        "botanicalName": "Polyscias guilfoylei / Polyscias fruticosa",
        "commonName": "Variegated Ming Aralia",
        "dogriName": "Aralia",
        "family": "Araliaceae",
        "habit": "Shrub",
        "zone": "",
        "latitude": null,
        "longitude": null,
        "coords": null,
        "elevation": "",
        "toxicity": "Safe",
        "toxicAgent": "Non-toxic",
        "firstAid": "Standard hygiene.",
        "phenology": "Standard foothill phenological schedule.",
        "iucn": "LC",
        "notes": "Provides dense, lacy foliage cover in shaded garden borders",
        "photo": null
    },
    {
        "id": "SMVDU-FL-171",
        "verified": true,
        "botanicalName": "Euphorbia heterophylla",
        "commonName": "Wild Poinsettia / Mexican Fireplant",
        "dogriName": "Jangli Duddhi",
        "family": "Euphorbiaceae",
        "habit": "Herb",
        "zone": "",
        "latitude": null,
        "longitude": null,
        "coords": null,
        "elevation": "",
        "toxicity": "Safe",
        "toxicAgent": "Non-toxic",
        "firstAid": "Standard hygiene.",
        "phenology": "Standard foothill phenological schedule.",
        "iucn": "LC",
        "notes": "Nectar glands on cyathia attract ants, wasps, and hoverflies",
        "photo": null
    },
    {
        "id": "SMVDU-FL-172",
        "verified": true,
        "botanicalName": "Tecoma stans",
        "commonName": "Yellow Elder / Tecoma",
        "dogriName": "Peela Tecoma",
        "family": "Bignoniaceae",
        "habit": "Shrub",
        "zone": "",
        "latitude": null,
        "longitude": null,
        "coords": null,
        "elevation": "",
        "toxicity": "Safe",
        "toxicAgent": "Non-toxic",
        "firstAid": "Standard hygiene.",
        "phenology": "Standard foothill phenological schedule.",
        "iucn": "LC",
        "notes": "Bright yellow trumpet flowers are a major nectar source for bumblebees and sunbirds",
        "photo": null
    },
    {
        "id": "SMVDU-FL-173",
        "verified": true,
        "botanicalName": "Cascabela thevetia (Thevetia peruviana)",
        "commonName": "Yellow Oleander / Kaner",
        "dogriName": "Peela Kaner",
        "family": "Apocynaceae",
        "habit": "Shrub",
        "zone": "",
        "latitude": null,
        "longitude": null,
        "coords": null,
        "elevation": "",
        "toxicity": "Safe",
        "toxicAgent": "Non-toxic",
        "firstAid": "Standard hygiene.",
        "phenology": "Standard foothill phenological schedule.",
        "iucn": "LC",
        "notes": "Drought-hardy roadside/campus shrub; flowers visited by butterflies and carpenter bees",
        "photo": null
    },
    {
        "id": "SMVDU-FL-174",
        "verified": true,
        "botanicalName": "Brunfelsia pauciflora / Brunfelsia australis",
        "commonName": "Yesterday-Today-and-Tomorrow",
        "dogriName": "Brunfelsia / -",
        "family": "Solanaceae",
        "habit": "Shrub",
        "zone": "",
        "latitude": null,
        "longitude": null,
        "coords": null,
        "elevation": "",
        "toxicity": "Safe",
        "toxicAgent": "Non-toxic",
        "firstAid": "Standard hygiene.",
        "phenology": "Standard foothill phenological schedule.",
        "iucn": "LC",
        "notes": "Color-shifting fragrant flowers (purple to lavender to white) attract butterflies and moths",
        "photo": null
    },
    {
        "id": "SMVDU-FL-175",
        "verified": true,
        "botanicalName": "Pelargonium × hortorum",
        "commonName": "Zonal Geranium",
        "dogriName": "Geranium",
        "family": "Geraniaceae",
        "habit": "Herb",
        "zone": "",
        "latitude": null,
        "longitude": null,
        "coords": null,
        "elevation": "",
        "toxicity": "Safe",
        "toxicAgent": "Non-toxic",
        "firstAid": "Standard hygiene.",
        "phenology": "Standard foothill phenological schedule.",
        "iucn": "LC",
        "notes": "Bright umbels provide nectar for bees and butterflies in container gardens",
        "photo": null
    }
];
const LEGACY_SEED_MAX_ID = 116;

_cachedFloraRecords = [...INITIAL_FLORA_RECORDS];

function openIndexedDB() {
    return new Promise((resolve, reject) => {
        if (_dbInstance) return resolve(_dbInstance);
        if (!window.indexedDB) return resolve(null);
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            let store;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                store.createIndex('zone', 'zone', { unique: false });
                store.createIndex('family', 'family', { unique: false });
                store.createIndex('toxicity', 'toxicity', { unique: false });
            } else {
                store = request.transaction.objectStore(STORE_NAME);
            }
            if (!store.indexNames.contains('verified')) {
                store.createIndex('verified', 'verified', { unique: false });
            }
        };
        request.onsuccess = (event) => {
            _dbInstance = event.target.result;
            resolve(_dbInstance);
        };
        request.onerror = (event) => reject(event.target.error);
    });
}

function requestToPromise(request) {
    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

function transactionDone(transaction) {
    return new Promise((resolve, reject) => {
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
        transaction.onabort = () => reject(transaction.error || new Error('IndexedDB transaction aborted'));
    });
}

function numericSpecimenId(record) {
    const match = String(record && record.id ? record.id : '').match(/(\d+)$/);
    return match ? parseInt(match[1], 10) : Number.MAX_SAFE_INTEGER;
}

function sortFloraRecords(records) {
    return records.slice().sort((a, b) => numericSpecimenId(a) - numericSpecimenId(b));
}

function getNextSpecimenNumber(records) {
    let highest = 0;
    records.forEach((record) => {
        const value = numericSpecimenId(record);
        if (Number.isFinite(value) && value > highest) highest = value;
    });
    return highest + 1;
}

function buildSpecimenId(number) {
    return `SMVDU-FL-${String(number).padStart(3, '0')}`;
}

async function hydrateFloraFromDB() {
    try {
        const db = await openIndexedDB();
        if (!db) {
            _cachedFloraRecords = [...INITIAL_FLORA_RECORDS];
            window.dispatchEvent(new CustomEvent('smvdu:dataready', { detail: _cachedFloraRecords }));
            window.dispatchEvent(new CustomEvent('smvdu:storage-unavailable', {
                detail: { message: 'IndexedDB is unavailable; changes will not persist.' }
            }));
            return;
        }

        const readTx = db.transaction([STORE_NAME], 'readonly');
        const existing = await requestToPromise(readTx.objectStore(STORE_NAME).getAll());
        const recordsById = new Map();
        existing.forEach((record) => recordsById.set(record.id, record));

        const usedNumbers = existing.concat(INITIAL_FLORA_RECORDS);
        let nextNumber = getNextSpecimenNumber(usedNumbers);
        const relocated = [];

        /*
         * V2.3.0 allocated IDs 117+ to locally logged observations. The new
         * verified datasheet now occupies 117-175, so move those legacy
         * observations beyond the new seed range instead of overwriting them.
         */
        existing.forEach((record) => {
            const isLegacyObservation = numericSpecimenId(record) > LEGACY_SEED_MAX_ID &&
                !Object.prototype.hasOwnProperty.call(record, 'verified');
            if (!isLegacyObservation) return;

            const newId = buildSpecimenId(nextNumber++);
            recordsById.delete(record.id);
            const moved = { ...record, id: newId, verified: false };
            recordsById.set(newId, moved);
            relocated.push({ oldId: record.id, record: moved });
        });

        const writeTx = db.transaction([STORE_NAME], 'readwrite');
        const store = writeTx.objectStore(STORE_NAME);
        const done = transactionDone(writeTx);

        relocated.forEach(({ oldId, record }) => {
            store.delete(oldId);
            store.put(record);
        });

        INITIAL_FLORA_RECORDS.forEach((seed) => {
            const current = recordsById.get(seed.id);
            if (!current) {
                recordsById.set(seed.id, seed);
                store.put(seed);
            } else if (current.verified !== seed.verified) {
                const updated = { ...current, verified: seed.verified };
                recordsById.set(seed.id, updated);
                store.put(updated);
            }
        });

        recordsById.forEach((record) => {
            if (Object.prototype.hasOwnProperty.call(record, 'verified')) return;
            const updated = { ...record, verified: false };
            recordsById.set(record.id, updated);
            store.put(updated);
        });

        await done;
        _lastMigrationRelocatedCount = relocated.length;
        _cachedFloraRecords = sortFloraRecords([...recordsById.values()]);
        window.dispatchEvent(new CustomEvent('smvdu:dataready', { detail: _cachedFloraRecords }));
    } catch (err) {
        console.error('[IndexedDB] Hydration failure:', err);
        _cachedFloraRecords = [...INITIAL_FLORA_RECORDS];
        window.dispatchEvent(new CustomEvent('smvdu:dataready', { detail: _cachedFloraRecords }));
    }
}

hydrateFloraFromDB();

function getFloraData() {
    return [..._cachedFloraRecords];
}

async function saveFloraData(records) {
    if (!Array.isArray(records)) return false;

    try {
        const db = await openIndexedDB();
        if (!db) return false;

        const tx = db.transaction([STORE_NAME], 'readwrite');
        const done = transactionDone(tx);
        const store = tx.objectStore(STORE_NAME);

        store.clear();
        records.forEach((record) => store.put(record));

        await done;
        _cachedFloraRecords = [...records];
        window.dispatchEvent(new CustomEvent('smvdu:datachanged', { detail: _cachedFloraRecords }));
        return true;
    } catch (err) {
        console.error('[IndexedDB] saveFloraData error:', err);
        return false;
    }
}

function normalizeStoredToxicity(value) {
    const normalized = String(value == null ? '' : value).trim().toLowerCase().replace(/[\s_-]+/g, ' ');
    if (['safe', 'non toxic', 'non-toxic', 'listed non-toxic'].includes(normalized)) return 'Safe';
    if (['mild irritant', 'irritant', 'allergenic'].includes(normalized)) return 'Mild Irritant';
    if (['toxic', 'severe toxic', 'highly toxic'].includes(normalized)) return 'Toxic';
    return 'Unknown';
}

function hasValidCoordinates(record) {
    if (!record || typeof record !== 'object') return false;
    const candidates = [
        [record.coords?.[0], record.coords?.[1]],
        [record.latitude, record.longitude],
        [record.lat, record.lng]
    ];
    return candidates.some(([rawLat, rawLng]) => {
        const lat = parseFloat(rawLat);
        const lng = parseFloat(rawLng);
        return Number.isFinite(lat) && Number.isFinite(lng) &&
            lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
    });
}

async function logObservation(entry) {
    entry = entry && typeof entry === 'object' ? entry : {};
    const records = getFloraData();
    const botanicalName = entry.botanicalName ? entry.botanicalName.trim() : '';
    const commonName = entry.commonName ? entry.commonName.trim() : '';
    const family = entry.family ? entry.family.trim() : '';
    const habit = entry.habit ? entry.habit.trim() : '';
    const zone = entry.zone ? entry.zone.trim() : '';
    const lat = parseFloat(entry.lat);
    const lng = parseFloat(entry.lng);

    if (!botanicalName || !commonName || !family || !habit || !zone) {
        return { ok: false, error: 'Botanical name, common name, family, habit and sector are required.' };
    }
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        return { ok: false, error: 'Valid latitude and longitude are required before saving.' };
    }

    let db;
    try {
        db = await openIndexedDB();
    } catch (err) {
        console.error('[IndexedDB] Unable to open database:', err);
        return { ok: false, error: 'Persistent storage could not be opened. The observation was not saved.' };
    }
    if (!db) {
        return { ok: false, error: 'Persistent storage is unavailable. The observation was not saved.' };
    }

    let nextNumber = getNextSpecimenNumber(records);
    const usedIds = new Set(records.map((record) => record.id));
    let id = buildSpecimenId(nextNumber);
    while (usedIds.has(id)) {
        nextNumber += 1;
        id = buildSpecimenId(nextNumber);
    }

    const normalizedToxicity = normalizeStoredToxicity(entry.toxicity);
    const newRecord = {
        id,
        verified: false,
        botanicalName,
        commonName,
        dogriName: entry.dogriName ? entry.dogriName.trim() : '',
        family,
        habit,
        zone,
        coords: [lat, lng],
        elevation: entry.elevation ? entry.elevation.trim() : '',
        toxicity: normalizedToxicity,
        toxicAgent: entry.toxicAgent ? entry.toxicAgent.trim() : 'Not recorded',
        firstAid: entry.firstAid ? entry.firstAid.trim() : 'Not recorded',
        phenology: entry.phenology ? entry.phenology.trim() : '',
        iucn: entry.iucn ? entry.iucn.trim() : '',
        notes: entry.notes ? entry.notes.trim() : '',
        photo: entry.photo || null,
        loggedAt: new Date().toISOString()
    };

    try {
        const tx = db.transaction([STORE_NAME], 'readwrite');
        const done = transactionDone(tx);
        tx.objectStore(STORE_NAME).put(newRecord);
        await done;
    } catch (err) {
        console.error('[IndexedDB] logObservation error:', err);
        const message = err && err.name === 'QuotaExceededError'
            ? 'Storage quota was exceeded. Reduce the photo size or free browser storage, then retry.'
            : 'The observation could not be written to persistent storage. It was not saved.';
        return { ok: false, error: message };
    }

    _cachedFloraRecords = [newRecord, ...records];
    window.dispatchEvent(new CustomEvent('smvdu:datachanged', { detail: _cachedFloraRecords }));
    return { ok: true, record: newRecord };
}

function getCampusTelemetry() {
    const records = getFloraData();
    const seedIds = new Set(INITIAL_FLORA_RECORDS.map((record) => record.id));
    const mappedRecords = records.filter(hasValidCoordinates);
    const loggedObservationCount = records.filter((record) => !seedIds.has(record.id)).length;
    const toxicityCounts = { Safe: 0, 'Mild Irritant': 0, Toxic: 0, Unknown: 0 };
    records.forEach((record) => {
        toxicityCounts[normalizeStoredToxicity(record.toxicity)] += 1;
    });

    return {
        totalSpecies: new Set(records.map((record) => record.botanicalName).filter(Boolean)).size,
        totalFamilies: new Set(records.map((record) => record.family).filter(Boolean)).size,
        records,
        safeCount: toxicityCounts.Safe,
        irritantCount: toxicityCounts['Mild Irritant'],
        toxicCount: toxicityCounts.Toxic,
        unknownCount: toxicityCounts.Unknown,
        verifiedCount: records.filter((record) => record.verified === true).length,
        mappedCount: mappedRecords.length,
        unmappedCount: records.length - mappedRecords.length,
        loggedObservationCount,
        migratedObservationCount: _lastMigrationRelocatedCount,
        studentObservations: loggedObservationCount
    };
}