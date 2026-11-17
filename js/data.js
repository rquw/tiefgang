// Prompt pool. Each prompt has an English and a German version.
// `common` = the most obvious answers, ordered from MOST to LESS common.
// Aliases for the same answer are separated by "/".
// Answers found here are scored instantly (shallow dive); anything else goes to the AI judge.

export const PROMPTS = [
  {
    en: { q: "Name something you do with two hands", common: ["clap/clapping/applaud", "wash hands/washing hands/hand washing", "type/typing", "drive/driving", "play piano/piano/playing piano", "catch a ball/catch/catching", "hug/hugging", "pray/praying", "knead dough/kneading", "lift weights/lifting", "climb/climbing", "row/rowing", "play guitar/guitar", "juggle/juggling", "swim/swimming"] },
    de: { q: "Nenne etwas, das man mit beiden Händen macht", common: ["klatschen/applaudieren", "hände waschen/händewaschen", "tippen/schreiben am computer", "autofahren/fahren/lenken", "klavier spielen/klavier", "ball fangen/fangen", "umarmen", "beten", "teig kneten/kneten", "gewichte heben/heben", "klettern", "rudern", "gitarre spielen/gitarre", "jonglieren", "schwimmen"] },
  },
  {
    en: { q: "Name something you find in a fridge", common: ["milk", "butter", "eggs/egg", "cheese", "yogurt/yoghurt", "juice/orange juice", "ketchup", "vegetables/veggies", "meat", "water", "beer", "jam", "leftovers", "salad/lettuce", "sausage/ham"] },
    de: { q: "Nenne etwas, das man im Kühlschrank findet", common: ["milch", "butter", "eier/ei", "käse", "joghurt", "saft/orangensaft", "ketchup", "gemüse", "fleisch", "wasser", "bier", "marmelade", "reste/essensreste", "salat", "wurst/schinken"] },
  },
  {
    en: { q: "Name something that is yellow", common: ["banana", "sun", "lemon", "cheese", "corn", "school bus/bus", "duck/rubber duck", "taxi/cab", "egg yolk/yolk", "sunflower", "minions/minion", "chick", "pineapple", "post box/mailbox", "highlighter"] },
    de: { q: "Nenne etwas, das gelb ist", common: ["banane", "sonne", "zitrone", "käse", "mais", "quietscheente/ente/gummiente", "eigelb/dotter", "sonnenblume", "post/briefkasten/postauto", "minions/minion", "küken", "ananas", "taxi", "textmarker", "raps/rapsfeld"] },
  },
  {
    en: { q: "Name an animal that lives in the ocean", common: ["shark", "whale", "dolphin", "fish", "octopus", "jellyfish", "crab", "turtle/sea turtle", "seal", "starfish/sea star", "squid", "orca/killer whale", "clownfish", "stingray/ray", "lobster"] },
    de: { q: "Nenne ein Tier, das im Meer lebt", common: ["hai", "wal", "delfin/delphin", "fisch", "oktopus/krake/tintenfisch", "qualle", "krebs/krabbe", "schildkröte/meeresschildkröte", "robbe/seehund", "seestern", "orca/schwertwal", "clownfisch", "rochen", "hummer", "seepferdchen"] },
  },
  {
    en: { q: "Name something you take to the beach", common: ["towel/beach towel", "sunscreen/sunblock/sun cream", "sunglasses", "umbrella/parasol", "swimsuit/bikini/swimming trunks", "ball/beach ball", "water/drinks", "book", "hat", "bucket and spade/bucket/shovel", "snacks/food", "cooler", "chair/beach chair", "flip flops", "speaker/music"] },
    de: { q: "Nenne etwas, das man an den Strand mitnimmt", common: ["handtuch/strandtuch", "sonnencreme/sonnenmilch", "sonnenbrille", "sonnenschirm/schirm", "badehose/bikini/badeanzug", "ball/wasserball", "wasser/getränke", "buch", "hut/kappe", "schaufel/eimer/sandspielzeug", "essen/snacks", "kühlbox", "liegestuhl/stuhl", "flipflops/badeschlappen", "lautsprecher/musik"] },
  },
  {
    en: { q: "Name something that has wheels", common: ["car", "bike/bicycle", "bus", "truck/lorry", "skateboard", "train", "motorcycle/motorbike", "shopping cart/trolley", "wheelchair", "scooter", "stroller/pram/baby carriage", "suitcase", "airplane/plane", "roller skates/rollerblades", "office chair/chair"] },
    de: { q: "Nenne etwas, das Räder hat", common: ["auto", "fahrrad/rad", "bus", "lkw/lastwagen", "skateboard", "zug", "motorrad", "einkaufswagen", "rollstuhl", "roller/tretroller", "kinderwagen", "koffer", "flugzeug", "inlineskates/rollschuhe", "bürostuhl/stuhl"] },
  },
  {
    en: { q: "Name a reason to be late", common: ["traffic/traffic jam", "overslept/oversleeping/slept in", "alarm didn't go off/alarm", "missed the bus/bus", "car broke down/car trouble", "train delay/train", "couldn't find keys/keys", "weather/snow/rain", "accident", "sick/illness", "kids/children", "forgot", "flat tire/flat tyre", "phone died", "dog/pet"] },
    de: { q: "Nenne einen Grund, zu spät zu kommen", common: ["stau/verkehr", "verschlafen", "wecker hat nicht geklingelt/wecker", "bus verpasst/bus", "auto kaputt/panne", "zug verspätet/zug/bahn/deutsche bahn", "schlüssel nicht gefunden/schlüssel", "wetter/schnee/glatteis", "unfall", "krank", "kinder", "vergessen", "platten/reifen platt", "handy leer/akku leer", "hund/haustier"] },
  },
  {
    en: { q: "Name something that can fly", common: ["bird", "airplane/plane", "helicopter", "bee", "butterfly", "kite", "drone", "fly", "bat", "rocket", "balloon/hot air balloon", "superman/superhero", "mosquito", "paper plane", "eagle"] },
    de: { q: "Nenne etwas, das fliegen kann", common: ["vogel", "flugzeug", "hubschrauber/helikopter", "biene", "schmetterling", "drachen", "drohne", "fliege", "fledermaus", "rakete", "ballon/heißluftballon", "superman/superheld", "mücke", "papierflieger", "adler"] },
  },
  {
    en: { q: "Name something you do in the morning", common: ["brush teeth/brushing teeth", "shower/take a shower", "eat breakfast/breakfast", "drink coffee/coffee", "get dressed/dress", "wake up", "make the bed", "check phone/phone", "wash face", "go to work/work", "go to school/school", "comb hair/brush hair", "stretch", "walk the dog", "read the news/news"] },
    de: { q: "Nenne etwas, das man morgens macht", common: ["zähne putzen/zähneputzen", "duschen", "frühstücken/frühstück", "kaffee trinken/kaffee", "anziehen", "aufstehen/aufwachen", "bett machen", "handy checken/handy", "gesicht waschen/waschen", "zur arbeit gehen/arbeiten", "zur schule gehen/schule", "haare kämmen/kämmen", "dehnen/strecken", "mit dem hund gehen/gassi gehen", "nachrichten lesen/zeitung lesen"] },
  },
  {
    en: { q: "Name something that is round", common: ["ball", "wheel", "sun", "moon", "pizza", "coin", "plate", "clock", "earth/globe", "orange", "cookie", "donut/doughnut", "ring", "button", "cd/disc"] },
    de: { q: "Nenne etwas, das rund ist", common: ["ball", "rad/reifen", "sonne", "mond", "pizza", "münze", "teller", "uhr", "erde/globus", "orange", "keks", "donut", "ring", "knopf", "cd"] },
  },
  {
    en: { q: "Name something people collect", common: ["stamps", "coins", "cards/trading cards/pokemon cards", "money", "shells/seashells", "stickers", "rocks/stones", "books", "comics", "records/vinyl", "art/paintings", "toys/action figures", "shoes/sneakers", "postcards", "magnets"] },
    de: { q: "Nenne etwas, das Menschen sammeln", common: ["briefmarken", "münzen", "karten/sammelkarten/pokemonkarten", "geld", "muscheln", "sticker/aufkleber", "steine", "bücher", "comics", "schallplatten/platten", "kunst/bilder", "spielzeug/figuren", "schuhe/sneaker", "postkarten", "magnete"] },
  },
  {
    en: { q: "Name something you find in a hospital", common: ["doctor/doctors", "nurse/nurses", "bed/beds", "patient/patients", "syringe/needle", "wheelchair", "medicine/medication/pills", "stethoscope", "ambulance", "x-ray", "bandage", "blood", "gloves", "mask", "operating room/surgery"] },
    de: { q: "Nenne etwas, das man im Krankenhaus findet", common: ["arzt/ärzte/ärztin", "krankenschwester/pfleger/pflegekraft", "bett/betten", "patient/patienten", "spritze/nadel", "rollstuhl", "medikamente/tabletten", "stethoskop", "krankenwagen", "röntgen/röntgengerät", "verband/pflaster", "blut", "handschuhe", "maske", "op/operationssaal"] },
  },
  {
    en: { q: "Name something that makes a loud noise", common: ["fireworks", "thunder", "siren/ambulance", "car horn/horn", "drum/drums", "baby/crying baby", "dog/barking", "alarm/alarm clock", "airplane/plane/jet", "train", "explosion/bomb", "gun", "motorcycle", "speaker/music", "vacuum cleaner/vacuum"] },
    de: { q: "Nenne etwas, das laut ist", common: ["feuerwerk/böller", "donner/gewitter", "sirene/krankenwagen/martinshorn", "hupe", "trommel/schlagzeug", "baby", "hund/bellen", "wecker/alarm", "flugzeug", "zug", "explosion/bombe", "pistole/schuss", "motorrad", "lautsprecher/musik", "staubsauger"] },
  },
  {
    en: { q: "Name a job where you wear a uniform", common: ["police officer/police/cop", "firefighter/fireman", "nurse", "soldier/military", "pilot", "doctor", "chef/cook", "security guard/security", "flight attendant", "mail carrier/postman", "waiter/waitress", "mechanic", "astronaut", "judge", "sailor"] },
    de: { q: "Nenne einen Beruf mit Uniform", common: ["polizist/polizei", "feuerwehrmann/feuerwehr", "krankenschwester/pfleger", "soldat/bundeswehr/militär", "pilot", "arzt", "koch", "security/wachmann/sicherheitsdienst", "flugbegleiter/stewardess", "postbote/briefträger", "kellner", "mechaniker", "astronaut", "richter", "matrose"] },
  },
  {
    en: { q: "Name something you can't bring on a plane", common: ["gun/guns/weapon", "knife/knives", "bomb/explosives", "liquids/water", "lighter", "scissors", "fireworks", "drugs", "pets/animals", "gasoline/fuel", "alcohol", "lithium batteries/batteries", "aerosol/spray", "baseball bat/bat", "sword"] },
    de: { q: "Nenne etwas, das man nicht mit ins Flugzeug nehmen darf", common: ["waffe/pistole", "messer", "bombe/sprengstoff", "flüssigkeiten/wasser", "feuerzeug", "schere", "feuerwerk/böller", "drogen", "haustier/tiere", "benzin", "alkohol", "akkus/powerbank/batterien", "spray/deo", "baseballschläger", "schwert"] },
  },
  {
    en: { q: "Name something sticky", common: ["glue", "honey", "tape/sticky tape", "gum/chewing gum", "syrup/maple syrup", "candy", "jam", "stickers/sticker", "slime", "caramel", "sap/tree sap", "peanut butter", "post-it/sticky note", "spider web/web", "cotton candy"] },
    de: { q: "Nenne etwas, das klebrig ist", common: ["kleber/klebstoff", "honig", "klebeband/tesa", "kaugummi", "sirup", "bonbon/süßigkeiten", "marmelade", "sticker/aufkleber", "schleim/slime", "karamell", "harz/baumharz", "nutella/erdnussbutter", "post-it/klebezettel", "spinnennetz", "zuckerwatte"] },
  },
  {
    en: { q: "Name something you do at a birthday party", common: ["eat cake/cake", "sing happy birthday/sing", "open presents/presents/gifts", "blow out candles/candles", "dance/dancing", "play games/games", "eat/food", "drink", "take photos/pictures", "party hats", "balloons", "make a wish", "laugh", "piñata/pinata", "talk/chat"] },
    de: { q: "Nenne etwas, das man auf einer Geburtstagsparty macht", common: ["kuchen essen/kuchen/torte", "singen/happy birthday singen", "geschenke auspacken/geschenke", "kerzen ausblasen/kerzen", "tanzen", "spiele spielen/spiele", "essen", "trinken/anstoßen", "fotos machen", "partyhüte", "luftballons", "wünschen/etwas wünschen", "lachen", "topfschlagen", "quatschen/reden"] },
  },
  {
    en: { q: "Name something that melts", common: ["ice", "ice cream", "chocolate", "snow", "butter", "cheese", "candle/wax", "ice cube", "metal", "snowman", "glacier", "popsicle", "plastic", "glass", "heart"] },
    de: { q: "Nenne etwas, das schmilzt", common: ["eis", "speiseeis", "schokolade", "schnee", "butter", "käse", "kerze/wachs", "eiswürfel", "metall", "schneemann", "gletscher", "eis am stiel", "plastik", "glas", "herz"] },
  },
  {
    en: { q: "Name something with buttons", common: ["remote/remote control", "shirt", "phone", "keyboard", "jacket/coat", "elevator", "controller/game controller", "calculator", "microwave", "jeans/pants", "computer", "doorbell", "calculator", "car", "vending machine"] },
    de: { q: "Nenne etwas, das Knöpfe hat", common: ["fernbedienung", "hemd", "handy/telefon", "tastatur", "jacke/mantel", "aufzug/fahrstuhl", "controller", "taschenrechner", "mikrowelle", "jeans/hose", "computer", "klingel", "auto", "automat/getränkeautomat", "bluse"] },
  },
  {
    en: { q: "Name something you find in a forest", common: ["trees/tree", "mushrooms/mushroom", "deer", "leaves", "birds", "squirrel", "bear", "moss", "pine cones/pinecone", "berries", "fox", "wolf", "sticks/branches", "flowers", "owl"] },
    de: { q: "Nenne etwas, das man im Wald findet", common: ["bäume/baum", "pilze/pilz", "reh/hirsch", "blätter/laub", "vögel/vogel", "eichhörnchen", "wildschwein", "moos", "tannenzapfen/zapfen", "beeren", "fuchs", "wolf", "äste/stöcke", "blumen", "eule"] },
  },
  {
    en: { q: "Name a sport played with a ball", common: ["soccer/football", "basketball", "tennis", "baseball", "volleyball", "american football", "golf", "rugby", "handball", "table tennis/ping pong", "cricket", "bowling", "water polo", "badminton", "dodgeball"] },
    de: { q: "Nenne eine Sportart mit Ball", common: ["fußball", "basketball", "tennis", "handball", "volleyball", "baseball", "golf", "rugby", "tischtennis/ping pong", "american football/football", "bowling/kegeln", "wasserball", "völkerball", "hockey", "cricket"] },
  },
  {
    en: { q: "Name something that has a tail", common: ["dog", "cat", "monkey", "horse", "fish", "mouse/rat", "comet", "airplane/plane", "kite", "lizard", "cow", "dinosaur", "squirrel", "pig", "devil"] },
    de: { q: "Nenne etwas, das einen Schwanz hat", common: ["hund", "katze", "affe", "pferd", "fisch", "maus/ratte", "komet", "flugzeug", "drachen", "eidechse", "kuh", "dinosaurier", "eichhörnchen", "schwein", "teufel"] },
  },
  {
    en: { q: "Name something you can fold", common: ["paper", "clothes/laundry/shirt", "towel", "blanket", "napkin", "map", "chair/folding chair", "letter", "table", "umbrella", "origami", "bed sheet/sheets", "phone/foldable phone", "arms", "wallet"] },
    de: { q: "Nenne etwas, das man falten kann", common: ["papier", "kleidung/wäsche/t-shirt", "handtuch", "decke", "serviette", "landkarte/karte", "stuhl/klappstuhl", "brief", "tisch", "regenschirm/schirm", "origami", "bettlaken/laken", "handy/klapphandy", "hände/arme", "geldbeutel/portemonnaie"] },
  },
  {
    en: { q: "Name something that is hot", common: ["sun", "fire", "coffee", "stove/oven", "lava", "tea", "soup", "summer", "chili/pepper", "desert", "sauna", "iron", "pizza", "candle", "volcano"] },
    de: { q: "Nenne etwas, das heiß ist", common: ["sonne", "feuer", "kaffee", "herd/ofen", "lava", "tee", "suppe", "sommer", "chili/peperoni", "wüste", "sauna", "bügeleisen", "pizza", "kerze", "vulkan"] },
  },
  {
    en: { q: "Name something you find in a classroom", common: ["desk/desks", "chair/chairs", "teacher", "board/blackboard/whiteboard", "students/pupils", "books/book", "pencil/pen", "chalk", "clock", "backpack/bag", "eraser/rubber", "ruler", "map", "computer", "projector"] },
    de: { q: "Nenne etwas, das man im Klassenzimmer findet", common: ["tisch/tische", "stuhl/stühle", "lehrer/lehrerin", "tafel/whiteboard", "schüler", "buch/bücher", "stift/bleistift/füller", "kreide", "uhr", "schulranzen/rucksack", "radiergummi", "lineal", "landkarte/karte", "computer", "beamer"] },
  },
  {
    en: { q: "Name something you'd find in a toolbox", common: ["hammer", "screwdriver", "wrench/spanner", "nails", "screws", "pliers", "tape measure/measuring tape", "saw", "drill", "tape/duct tape", "level", "allen key/hex key", "knife/utility knife", "file", "glue"] },
    de: { q: "Nenne etwas aus einem Werkzeugkasten", common: ["hammer", "schraubenzieher/schraubendreher", "schraubenschlüssel", "nägel", "schrauben", "zange", "maßband/zollstock", "säge", "bohrer/bohrmaschine", "klebeband/panzertape", "wasserwaage", "inbusschlüssel/inbus", "cuttermesser/messer", "feile", "kleber"] },
  },
  {
    en: { q: "Name something that smells bad", common: ["garbage/trash", "feet/socks", "fart", "skunk", "rotten eggs/eggs", "toilet", "poop", "fish", "cheese", "sweat", "dog", "diaper", "onion", "garlic", "sewer"] },
    de: { q: "Nenne etwas, das stinkt", common: ["müll", "füße/socken", "furz/pups", "stinktier", "faule eier/eier", "toilette/klo", "kacke/kot", "fisch", "käse", "schweiß", "hund", "windel", "zwiebel", "knoblauch", "kanal/kanalisation"] },
  },
  {
    en: { q: "Name something you can open", common: ["door", "window", "box", "book", "bottle", "jar", "present/gift", "eyes", "mouth", "bag", "can", "laptop", "fridge", "letter/envelope", "app"] },
    de: { q: "Nenne etwas, das man öffnen kann", common: ["tür", "fenster", "box/kiste/karton", "buch", "flasche", "glas/einmachglas", "geschenk", "augen", "mund", "tasche", "dose", "laptop", "kühlschrank", "brief/umschlag", "app"] },
  },
];

export const ROUNDS = 7;
export const SEAFLOOR = 10935; // Challenger Deep, metres

export const ZONES = [
  { from: 0, en: "Sunlight Zone", de: "Sonnenlichtzone" },
  { from: 200, en: "Twilight Zone", de: "Dämmerungszone" },
  { from: 1000, en: "Midnight Zone", de: "Mitternachtszone" },
  { from: 4000, en: "Abyssal Zone", de: "Abyssal" },
  { from: 6000, en: "Hadal Zone", de: "Hadalzone" },
];

export function zoneAt(d) {
  let z = ZONES[0];
  for (const zz of ZONES) if (d >= zz.from) z = zz;
  return z;
}

export const RARITY = [
  { min: 1, key: "common", color: "#b8c4cc", en: "Common", de: "Häufig", emoji: "⬜" },
  { min: 3, key: "uncommon", color: "#5ee38a", en: "Uncommon", de: "Ungewöhnlich", emoji: "🟩" },
  { min: 5, key: "rare", color: "#4fb3ff", en: "Rare", de: "Selten", emoji: "🟦" },
  { min: 7, key: "epic", color: "#c07bff", en: "Epic", de: "Episch", emoji: "🟪" },
  { min: 9, key: "legendary", color: "#ffd24a", en: "Legendary", de: "Legendär", emoji: "🟨" },
];

export function rarityTier(r) {
  let t = RARITY[0];
  for (const tt of RARITY) if (r >= tt.min) t = tt;
  return t;
}

// rarity 1..10 -> metres. 10 ≈ 1500 m, so 7 perfect answers ≈ the Challenger Deep.
export function metresFor(rarity) {
  const base = 30 * Math.pow(rarity, 1.7);
  const jitter = 1 + (Math.random() * 0.16 - 0.08);
  return Math.max(10, Math.round(base * jitter));
}

export const UI = {
  en: {
    tagline: "Give rare answers. Dive deeper.",
    how: "7 prompts. Common answers sink you a little, rare-but-correct answers send you plunging. Off-topic answers don't count.",
    model: "AI judge (runs in your browser)",
    start: "Start dive",
    noAI: "Play without AI (lists only)",
    noGPU: "Your browser has no WebGPU, so the AI can't run here. Try Chrome or Edge on desktop. You can still play with lists only.",
    loading: "Downloading AI",
    loadingNote: "First time only, cached afterwards.",
    placeholder: "Your answer…",
    dive: "Dive",
    thinking: "Sonar is analysing…",
    waitingAI: "Waiting for AI…",
    invalid: "Doesn't count",
    retry: "One more try",
    next: "Next prompt",
    finish: "Surface report",
    round: "Prompt",
    of: "of",
    duplicate: "You already used that one.",
    tooShort: "That's not really an answer.",
    unknownNoAI: "Not on the list, and there's no AI to judge it.",
    listHit: "On the list of obvious answers.",
    final: "Final depth",
    best: "Personal best",
    newBest: "New personal best!",
    again: "Dive again",
    share: "Copy result",
    copied: "Copied!",
    zone: "Zone",
    deepest: "Deepest sighting",
    mute: "Sound",
    aiReady: "AI ready",
    aiFail: "AI failed to load. Playing with lists only.",
  },
  de: {
    tagline: "Seltene Antworten. Tiefer tauchen.",
    how: "7 Fragen. Offensichtliche Antworten bringen dich nur ein Stück runter, seltene (aber richtige) lassen dich abtauchen. Themenfremdes zählt nicht.",
    model: "KI-Schiedsrichter (läuft in deinem Browser)",
    start: "Tauchgang starten",
    noAI: "Ohne KI spielen (nur Listen)",
    noGPU: "Dein Browser hat kein WebGPU, die KI läuft hier also nicht. Probier Chrome oder Edge am Computer. Mit Listen geht's trotzdem.",
    loading: "KI wird geladen",
    loadingNote: "Nur beim ersten Mal, danach im Cache.",
    placeholder: "Deine Antwort…",
    dive: "Tauchen",
    thinking: "Sonar analysiert…",
    waitingAI: "Warte auf KI…",
    invalid: "Zählt nicht",
    retry: "Noch ein Versuch",
    next: "Nächste Frage",
    finish: "Auftauchbericht",
    round: "Frage",
    of: "von",
    duplicate: "Die hattest du schon.",
    tooShort: "Das ist keine richtige Antwort.",
    unknownNoAI: "Nicht auf der Liste, und ohne KI kann das keiner prüfen.",
    listHit: "Steht auf der Liste der offensichtlichen Antworten.",
    final: "Endtiefe",
    best: "Persönlicher Rekord",
    newBest: "Neuer Rekord!",
    again: "Nochmal tauchen",
    share: "Ergebnis kopieren",
    copied: "Kopiert!",
    zone: "Zone",
    deepest: "Tiefste Sichtung",
    mute: "Ton",
    aiReady: "KI bereit",
    aiFail: "KI konnte nicht laden. Es geht mit Listen weiter.",
  },
};
