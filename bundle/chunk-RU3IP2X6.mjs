import {
  __commonJS,
  __export,
  __toESM
} from "./chunk-7LWY23YD.mjs";

// ../english-lint/node_modules/boolbase/index.js
var require_boolbase = __commonJS({
  "../english-lint/node_modules/boolbase/index.js"(exports, module) {
    module.exports = {
      trueFunc: function trueFunc4() {
        return true;
      },
      falseFunc: function falseFunc6() {
        return false;
      }
    };
  }
});

// ../english-lint/dist/types/index.js
var ErrorId = {
  NO_ABSOLUTE_PHRASES: "no-absolute-phrases",
  NO_BAD_SENTENCE_STRUCTURES: "no-bad-sentence-structures",
  NO_BAD_WORDS: "no-bad-words",
  NO_EXPLAINED_ANTONYMS: "no-explained-antonyms",
  NO_EXPLAINED_INTENSIFIERS: "no-explained-intensifiers",
  NO_HIGH_LEXICAL_DENSITY: "no-high-lexical-density",
  NO_MIXED_DIALECTS: "no-mixed-dialects",
  NO_NEGATED_CONTRASTS: "no-negated-contrasts",
  NO_NESTED_CLAUSES: "no-nested-clauses",
  NO_NOUN_CLUSTERS: "no-noun-clusters",
  NO_PASSIVE_SENTENCES: "no-passive-sentences",
  NO_SIMILES: "no-similes",
  NO_SPECIAL_PUNCTUATION: "no-special-punctuation"
};

// ../english-lint/dist/parse-to-subtree.js
var createIsAncestor = (tokens, parent) => (id) => {
  let { head } = tokens[id];
  while (head !== -1) {
    if (head === parent) {
      return true;
    }
    ({ head } = tokens[head]);
  }
  return false;
};
var parse_to_subtree_default = (tokens, parent) => {
  const isAncestor2 = createIsAncestor(tokens, parent);
  let leftmostDescendant = 0;
  while (leftmostDescendant < parent && !isAncestor2(leftmostDescendant)) {
    leftmostDescendant += 1;
  }
  let rightmostDescendant = tokens.length - 1;
  while (rightmostDescendant > parent && !isAncestor2(rightmostDescendant)) {
    rightmostDescendant -= 1;
  }
  return Array.from({ length: rightmostDescendant - leftmostDescendant + 1 }, (_, index) => index + leftmostDescendant);
};

// ../english-lint/dist/rules/no-absolute-phrases.js
var isFloatingParticiple = ({ feats: { VerbForm } }) => VerbForm === "Part";
var isComma = ({ feats: { PunctType } }) => PunctType === "Comm";
var isStructuralBoundary = ({ form, feats }) => ["Colo", "Semi", "Brck"].includes(feats.PunctType ?? "") || /^[—–]$/u.test(form);
var reportingVerbs = [
  "say",
  "ask",
  "reply",
  "answer",
  "whisper",
  "mutter",
  "murmur",
  "add",
  "continue",
  "explain",
  "remark",
  "note",
  "shout",
  "call",
  "cry",
  "sigh",
  "think",
  "muse",
  "wonder",
  "announce",
  "declare",
  "insist",
  "admit",
  "confess",
  "offer",
  "interrupt",
  "snap",
  "laugh",
  "repeat",
  "recall",
  "report"
];
var isReportingClause = ({ lemma, form }) => reportingVerbs.includes(lemma ?? form.toLowerCase());
var isBareSubject = (entities, subject) => parse_to_subtree_default(entities, subject.id).every((id) => entities[id].xpos !== "VERB" && !isComma(entities[id]));
var hasOwnSubject = (entities, participle) => participle.misc.children.some((child) => entities[child].xpos === "NOUN" && entities[child].feats.PronType == null && child < participle.id && isBareSubject(entities, entities[child]));
var coordinators = ["and", "but", "or", "nor", "so", "yet"];
var isCoordinator = ({ lemma, form }) => coordinators.includes(lemma ?? form.toLowerCase());
var hasLeadingSubordinator = (entities, participle) => participle.misc.children.some((child) => {
  const marker = entities[child];
  return marker.xpos === "MARK" && child < participle.id && marker.misc.children.length === 0;
});
var introducesCoordinatedClause = (entities, participle) => participle.misc.children.some((child) => {
  const marker = entities[child];
  if (marker.xpos !== "MARK" || !isCoordinator(marker)) {
    return false;
  }
  return marker.misc.children.some((grandchild) => {
    const conjunct = entities[grandchild];
    return conjunct.xpos === "VERB" && conjunct.misc.children.some((id) => entities[id].xpos === "NOUN" && entities[id].feats.PronType !== "Rel" && id < conjunct.id);
  });
});
var countBetween = (entities, from, to, matches) => {
  const [start, end] = from < to ? [from, to] : [to, from];
  let count = 0;
  for (let index = start + 1; index <= end; index += 1) {
    if (matches(entities[index])) {
      count += 1;
    }
  }
  return count;
};
var isEdgeOfClause = (entities, root, participle, subtree) => {
  const isRightFloating = participle.id > root.id;
  const outerBound = isRightFloating ? Math.max(...subtree) : Math.min(...subtree);
  return !root.misc.children.some((child) => {
    if (child === participle.id) {
      return false;
    }
    const { id, xpos } = entities[child];
    return (isRightFloating ? id > outerBound : id < outerBound) && !["PUNCT", "ADV"].includes(xpos);
  });
};
var isQuoted = (entities, subtree) => entities[Math.min(...subtree)].feats.PunctType === "Quot" && entities[Math.max(...subtree)].feats.PunctType === "Quot";
var hasParticipleSiblingCloserToRoot = (entities, root, participle) => root.misc.children.some((child) => {
  const sibling = entities[child];
  const isBetweenRootAndParticiple = participle.id > root.id ? sibling.id > root.id && sibling.id < participle.id : sibling.id < root.id && sibling.id > participle.id;
  return isBetweenRootAndParticiple && isFloatingParticiple(sibling);
});
var isAdjacentToComma = (entities, boundary, isRightFloating) => {
  if (isComma(entities[boundary])) {
    return true;
  }
  const outside = isRightFloating ? boundary - 1 : boundary + 1;
  return entities[outside] != null && isComma(entities[outside]);
};
var isAbsoluteInForm = (entities, participle, subtree, isRightFloating) => hasOwnSubject(entities, participle) && !hasLeadingSubordinator(entities, participle) && !introducesCoordinatedClause(entities, participle) && !isQuoted(entities, subtree) && !(isRightFloating && isReportingClause(participle));
var sitsAtAClauseEdge = ({ entities, root, participle, subtree, boundary, isRightFloating }) => isAdjacentToComma(entities, boundary, isRightFloating) && countBetween(entities, root.id, boundary, isComma) % 2 === 1 && countBetween(entities, root.id, boundary, isCoordinator) === 0 && countBetween(entities, root.id, participle.id, isStructuralBoundary) === 0 && isEdgeOfClause(entities, root, participle, subtree) && !hasParticipleSiblingCloserToRoot(entities, root, participle);
var findFloatingParticiples = (entities, root) => root.misc.children.map((child) => entities[child]).filter(isFloatingParticiple).filter((participle) => {
  const subtree = parse_to_subtree_default(entities, participle.id);
  const isRightFloating = participle.id > root.id;
  const boundary = isRightFloating ? Math.min(...subtree) : Math.max(...subtree);
  return isAbsoluteInForm(entities, participle, subtree, isRightFloating) && sitsAtAClauseEdge({
    entities,
    root,
    participle,
    subtree,
    boundary,
    isRightFloating
  });
});
var buildError = (entities, participle) => {
  const subtree = parse_to_subtree_default(entities, participle.id);
  const leftMostChild = Math.min(...subtree);
  const rightMostChild = Math.max(...subtree);
  const { form: lastWord, misc: { at: endOffset } } = entities[rightMostChild];
  return {
    start: entities[leftMostChild].misc.at,
    end: endOffset + lastWord.length,
    message: `Rewrite absolute phrases by joining them with a conjunction, or by separating the two clauses into their own sentences. Example: "We scrambled along the shore, the waves splashing at our feet" should be rewritten as "The waves splashed at our feet as we scrambled along the shore."`,
    id: ErrorId.NO_ABSOLUTE_PHRASES
  };
};
var applyRule = (entities) => {
  const root = entities.find(({ head }) => head === -1);
  if (!root || root.xpos !== "VERB" || isFloatingParticiple(root)) {
    return [];
  }
  return findFloatingParticiples(entities, root).map((participle) => buildError(entities, participle));
};
var no_absolute_phrases_default = (sentences2) => sentences2.reduce((errors, entities) => [...errors, ...applyRule(entities)], []);

// ../english-lint/dist/rules/no-bad-sentence-structures.js
var withNoJustStructure = (tokens) => tokens.filter(({ lemma, form }) => ["just", "merely", "only", "simply", "solely"].includes(lemma ?? form.toLowerCase())).reduce((errors, { id, misc: { children, at }, head }) => {
  if (head < 0 || !children.some((id2) => tokens[id2].lemma === "not" || tokens[id2].form.toLowerCase() === "not")) {
    return errors;
  }
  const { misc: { children: headChildren } } = tokens[head];
  const headModifierBut = headChildren.find((headChildId) => headChildId > id && tokens[headChildId].lemma === "but");
  if (headModifierBut) {
    const rightMostChild = Math.max(...parse_to_subtree_default(tokens, headModifierBut));
    const { form: lastWord, misc: { at: endOffset } } = tokens[rightMostChild];
    return [
      ...errors,
      {
        start: at,
        end: endOffset + lastWord.length,
        message: `Instead of 'not just X but Y', rewrite this section to say 'X and Y'.`,
        id: ErrorId.NO_BAD_SENTENCE_STRUCTURES
      }
    ];
  }
  return errors;
}, []);
var no_bad_sentence_structures_default = (sentences2) => sentences2.reduce((errors, tokens) => [
  ...errors,
  ...withNoJustStructure(tokens)
], []);

// ../nlp/dist/inflect/irregular-dictionary.js
var irregular_dictionary_default = {
  abet: { 1: "abets", 2: "abetted", 3: "abetting" },
  abhor: { 1: "abhors", 2: "abhorred", 3: "abhorring" },
  abide: { 1: "abides", 2: "abode", 3: "abiding" },
  abut: { 1: "abuts", 2: "abutted", 3: "abutting" },
  accustom: { 1: "accustoms", 2: "accustomed", 3: "accustoming" },
  acquit: { 1: "acquits", 2: "acquitted", 3: "acquitting" },
  acropolis: { 5: "acropolises" },
  adagio: { 5: "adagios" },
  addendum: { 5: "addenda" },
  adman: { 5: "admen" },
  admit: { 1: "admits", 2: "admitted", 3: "admitting" },
  ado: { 5: "ados" },
  aegis: { 5: "aegises" },
  aficionado: { 5: "aficionados" },
  afterlife: { 5: "afterlives" },
  agape: { 5: "agapae" },
  ageratum: { 5: "ageratum" },
  agree: { 1: "agrees", 2: "agreed", 3: "agreeing" },
  aircraft: { 5: "aircraft" },
  airman: { 5: "airmen" },
  albacore: { 5: "albacore" },
  albatross: { 5: "albatross" },
  albino: { 5: "albinos" },
  alderman: { 5: "aldermen" },
  alderwoman: { 5: "alderwomen" },
  alewife: { 5: "alewives" },
  alga: { 5: "algae" },
  alkali: { 5: "alkalies" },
  allegretto: { 5: "allegrettos" },
  allegro: { 5: "allegros" },
  allot: { 1: "allots", 2: "allotted", 3: "allotting" },
  alto: { 5: "altos" },
  alumna: { 5: "alumnae" },
  alumnus: { 5: "alumni" },
  amaretto: { 5: "amarettos" },
  amaryllis: { 5: "amaryllises" },
  ambergris: { 5: "ambergrises" },
  amigo: { 5: "amigos" },
  ammo: { 5: "ammos" },
  amontillado: { 5: "amontillados" },
  amphora: { 5: "amphorae" },
  anchorman: { 5: "anchormen" },
  anchorwoman: { 5: "anchorwomen" },
  angelfish: { 5: "angelfish" },
  annul: { 1: "annuls", 2: "annulled", 3: "annulling" },
  anopheles: { 5: "anopheles" },
  ante: { 1: "antes", 2: "anted", 3: "anteing" },
  antelope: { 5: "antelope" },
  anthrax: { 5: "anthraces" },
  antipasto: { 5: "antipastos" },
  aphelion: { 5: "aphelia" },
  appal: { 1: "appals", 2: "appalled", 3: "appalling" },
  appendicitis: { 5: "appendicitises" },
  appendix: { 5: "appendices" },
  applique: { 1: "appliques", 2: "appliqued", 3: "appliqueing" },
  arc: { 1: "arcs", 2: "arced", 3: "arcing" },
  archipelago: { 5: "archipelagos" },
  arise: { 1: "arises", 2: "arose", 3: "arising", 4: "arisen" },
  armadillo: { 5: "armadillos" },
  arpeggio: { 5: "arpeggios" },
  arroyo: { 5: "arroyos" },
  art: {},
  arthritis: { 5: "arthritides" },
  artilleryman: { 5: "artillerymen" },
  assemblyman: { 5: "assemblymen" },
  assemblywoman: { 5: "assemblywomen" },
  atrium: { 5: "atria" },
  audio: { 5: "audios" },
  auto: { 5: "autos" },
  aver: { 1: "avers", 2: "averred", 3: "averring" },
  avocado: { 5: "avocados" },
  avoirdupois: { 5: "avoirdupoises" },
  awake: { 1: "awakes", 2: "awoke", 3: "awaking", 4: "awoken" },
  ay: { 5: "ayes" },
  babysit: { 1: "babysits", 2: "babysit", 3: "babysitting", 4: "babysat" },
  bacchanalia: { 5: "bacchanalia" },
  bacillus: { 5: "bacilli" },
  backbite: { 1: "backbites", 2: "backbit", 3: "backbiting", 4: "backbitten" },
  backslide: {
    1: "backslides",
    2: "backslid",
    3: "backsliding",
    4: "backslid"
  },
  backwoodsman: { 5: "backwoodsmen" },
  bacteria: { 5: "-bacterias" },
  bacterium: { 5: "bacteria" },
  badman: { 5: "badmen" },
  xbailiff: { 5: "bailiffs" },
  bailsman: { 5: "bailsmen" },
  ban: { 1: "bans", 2: "banned", 3: "banning" },
  bandeau: { 5: "bandeaux" },
  bandsman: { 5: "bandsmen" },
  banjo: { 5: "banjos" },
  bargeman: { 5: "bargemen" },
  barman: { 5: "barmen" },
  barrio: { 5: "barrios" },
  baseman: { 5: "basemen" },
  bass: { 5: "bass" },
  basso: { 5: "bassos" },
  bat: { 1: "bats", 2: "batted", 3: "batting" },
  batman: { 5: "batmen" },
  batsman: { 5: "batsmen" },
  baud: { 5: "baud" },
  be: { undefined: "are" },
  bear: { 1: "bears", 2: "bore", 3: "bearing", 4: "borne" },
  beat: { 1: "beats", 2: "beat", 3: "beating", 4: "beaten" },
  become: { 1: "becomes", 2: "became", 3: "becoming", 4: "become" },
  beef: { 5: "beeves" },
  befall: { 1: "befalls", 2: "befell", 3: "befalling", 4: "befallen" },
  befit: { 1: "befits", 2: "befitted", 3: "befitting" },
  beget: { 1: "begets", 2: "begot", 3: "begetting", 4: "begotten" },
  begin: { 1: "begins", 2: "began", 3: "beginning", 4: "begun" },
  begone: {},
  behalf: { 5: "behalves" },
  behold: { 1: "beholds", 2: "beheld", 3: "beholding" },
  bejewel: { 1: "bejewels", 2: "bejewelled", 3: "bejewelling" },
  bellman: { 5: "bellmen" },
  bend: { 1: "bends", 2: "bent", 3: "bending" },
  beseech: { 1: "beseeches", 2: "besought", 3: "beseeching" },
  beset: { 1: "besets", 2: "beset", 3: "besetting" },
  besot: { 1: "besots", 2: "besotted", 3: "besotting" },
  bespeak: { 1: "bespeaks", 2: "bespoke", 3: "bespeaking", 4: "bespoken" },
  bestir: { 1: "bestirs", 2: "bestirred", 3: "bestirring" },
  bestrew: { 1: "bestrews", 2: "bestrewed", 3: "bestrewing", 4: "bestrewed" },
  bestride: { 1: "bestrides", 2: "bestrode", 3: "bestriding", 4: "bestridden" },
  bet: { 1: "bets", 2: "bet", 3: "betting" },
  betake: { 1: "betakes", 2: "betook", 3: "betaking", 4: "betaken" },
  bethink: { 1: "bethinks", 2: "bethought", 3: "bethinking" },
  betrothed: { 5: "betrothed" },
  biceps: { 5: "biceps" },
  bid: { 1: "bids", 2: "bid", 3: "bidding", 4: "bidden" },
  bide: { 1: "bides", 2: "bode", 3: "biding" },
  bijou: { 5: "bijoux" },
  bimbo: { 5: "bimbos" },
  bin: { 1: "bins", 2: "binned", 3: "binning" },
  bind: { 1: "binds", 2: "bound", 3: "binding" },
  bingo: { 5: "bingos" },
  bio: { 5: "bios" },
  birdie: { 1: "birdies", 2: "birdied", 3: "birdieing" },
  bison: { 5: "bison" },
  bistro: { 5: "bistros" },
  bite: { 1: "bites", 2: "bit", 3: "biting", 4: "bitten" },
  biz: { 5: "bizzes" },
  bleed: { 1: "bleeds", 2: "bled", 3: "bleeding" },
  blini: { 5: "blini" },
  blossom: { 1: "blossoms", 2: "blossomed", 3: "blossoming" },
  blot: { 1: "blots", 2: "blotted", 3: "blotting" },
  blow: { 1: "blows", 2: "blew", 3: "blowing", 4: "blown" },
  boatman: { 5: "boatmen" },
  bogeyman: { 5: "bogeymen" },
  bogie: { 1: "bogies", 2: "bogied", 3: "bogieing" },
  bogyman: { 5: "bogymen" },
  bolero: { 5: "boleros" },
  bondman: { 5: "bondmen" },
  bondsman: { 5: "bondsmen" },
  bondwoman: { 5: "bondwomen" },
  bongo: { 5: "bongos" },
  bonito: { 5: "bonitos" },
  bonsai: { 5: "bonsai" },
  boogeyman: { 5: "boogeymen" },
  boogie: { 1: "boogies", 2: "boogied", 3: "boogieing" },
  boogieman: { 5: "boogiemen" },
  bookshelf: { 5: "bookshelves" },
  bordello: { 5: "bordellos" },
  bottom: { 1: "bottoms", 2: "bottomed", 3: "bottoming" },
  bourgeois: { 5: "bourgeois" },
  bowman: { 5: "bowmen" },
  box: { 5: "box" },
  bozo: { 5: "bozos" },
  bracero: { 5: "braceros" },
  braggadocio: { 5: "braggadocios" },
  brainchild: { 5: "brainchildren" },
  brakeman: { 5: "brakemen" },
  bravo: { 5: "bravos" },
  break: { 1: "breaks", 2: "broke", 3: "breaking", 4: "broken" },
  breed: { 1: "breeds", 2: "bred", 3: "breeding" },
  brevet: { 1: "brevets", 2: "brevetted", 3: "brevetting" },
  bring: { 1: "brings", 2: "brought", 3: "bringing" },
  bro: { 5: "bros" },
  broadcast: { 1: "broadcasts", 2: "broadcast", 3: "broadcasting" },
  bronchitis: { 5: "bronchitises" },
  broncho: { 5: "bronchos" },
  bronchus: { 5: "bronchi" },
  bronco: { 5: "broncos" },
  browbeat: {
    1: "browbeats",
    2: "browbeat",
    3: "browbeating",
    4: "browbeaten"
  },
  bucktooth: { 5: "buckteeth" },
  buffer: { 1: "buffers", 2: "buffered", 3: "buffering" },
  build: { 1: "builds", 2: "built", 3: "building" },
  bullshit: {
    1: "bullshits",
    2: "bullshitted",
    3: "bullshitting",
    4: "-bullshat"
  },
  bunco: { 1: "buncos", 2: "buncoed", 3: "buncoing", 5: "buncos" },
  bunko: { 5: "bunkos" },
  burrito: { 5: "burritos" },
  burro: { 5: "burros" },
  bursa: { 5: "bursae" },
  bursitis: { 5: "bursitises" },
  burst: { 1: "bursts", 2: "burst", 3: "bursting" },
  bushman: { 5: "bushmen" },
  businessman: { 5: "businessmen" },
  businesswoman: { 5: "businesswomen" },
  buy: { 1: "buys", 2: "bought", 3: "buying", 4: "bought" },
  caballero: { 5: "caballeros" },
  cablecast: { 1: "cablecasts", 2: "cablecast", 3: "cablecasting" },
  cacao: { 5: "cacaos" },
  cactus: { 5: "cacti" },
  caduceus: { 5: "caducei" },
  calculus: { 5: "calculi" },
  calf: { 5: "calves" },
  calypso: { 5: "calypsos" },
  cameo: { 5: "cameos" },
  cameraman: { 5: "cameramen" },
  camerawoman: { 5: "camerawomen" },
  candelabrum: { 5: "candelabra" },
  cannabis: { 5: "cannabises" },
  cannot: {},
  canoe: { 1: "canoes", 2: "canoed", 3: "canoeing" },
  canto: { 5: "cantos" },
  capo: { 5: "capos" },
  cappuccino: { 5: "cappuccinos" },
  caribou: { 5: "caribou" },
  carom: { 1: "caroms", 2: "caromed", 3: "caroming" },
  carp: { 5: "carp" },
  carpus: { 5: "carpi" },
  casino: { 5: "casinos" },
  cassino: { 5: "cassinos" },
  cast: { 1: "casts", 2: "cast", 3: "casting" },
  catalog: { 1: "catalogs", 2: "cataloged", 3: "cataloging" },
  catch: { 1: "catches", 2: "caught", 3: "catching" },
  catfish: { 5: "catfish" },
  cattleman: { 5: "cattlemen" },
  cavalryman: { 5: "cavalrymen" },
  caveman: { 5: "cavemen" },
  cecum: { 5: "ceca" },
  cello: { 5: "cellos" },
  cementum: { 5: "cementa" },
  centavo: { 5: "centavos" },
  cervix: { 5: "cervices" },
  chairman: { 5: "chairmen" },
  chairwoman: { 5: "chairwomen" },
  challis: { 5: "challises" },
  chamois: { 5: "chamois" },
  char: { 5: "char" },
  charisma: { 5: "charismata" },
  charwoman: { 5: "charwomen" },
  chassis: { 5: "chassis" },
  chat: { 1: "chats", 2: "chatted", 3: "chatting" },
  chateau: { 5: "chateaux" },
  cheerio: { 5: "cheerios" },
  chemo: { 5: "chemos" },
  chessman: { 5: "chessmen" },
  chiaroscuro: { 5: "chiaroscuros" },
  chide: { 1: "chides", 2: "chided", 3: "chiding", 4: "chided" },
  child: { 5: "children" },
  chili: { 5: "chilies" },
  chilli: { 5: "chillies" },
  chin: { 1: "chins", 2: "chinned", 3: "chinning" },
  chino: { 5: "chinos" },
  chirrup: { 1: "chirrups", 2: "chirruped", 3: "chirruping" },
  chitchat: { 1: "chitchats", 2: "chitchatted", 3: "chitchatting" },
  chlamydia: { 5: "chlamydiae" },
  choose: { 1: "chooses", 2: "chose", 3: "choosing", 4: "chosen" },
  chrysalis: { 5: "chrysalises" },
  chub: { 5: "chub" },
  churchman: { 5: "churchmen" },
  cicatrix: { 5: "cicatrices" },
  cicerone: { 5: "ciceroni" },
  cigarillo: { 5: "cigarillos" },
  cilantro: { 5: "cilantros" },
  cilium: { 5: "cilia" },
  cirrus: { 5: "cirri" },
  clansman: { 5: "clansmen" },
  cleave: { undefined: "cleaves" },
  clematis: { 5: "clematises" },
  clergyman: { 5: "clergymen" },
  clergywoman: { 5: "clergywomen" },
  clevis: { 5: "clevises" },
  cling: { 1: "clings", 2: "clung", 3: "clinging" },
  clip: { 1: "clips", 2: "clipped", 3: "clipping", 4: "clipped" },
  clitoris: { 5: "clitorises" },
  cloaca: { 5: "cloacae" },
  clot: { 1: "clots", 2: "clotted", 3: "clotting" },
  clubfoot: { 5: "clubfeet" },
  coachman: { 5: "coachmen" },
  coccus: { 5: "cocci" },
  coccyx: { 5: "coccyges" },
  cochlea: { 5: "cochleae" },
  coco: { 5: "cocos" },
  cod: { 5: "cod" },
  codex: { 5: "codices" },
  codfish: { 5: "codfish" },
  cognoscente: { 5: "cognoscenti" },
  coho: { 5: "coho" },
  coif: { 1: "coifs", 2: "coiffed", 3: "coiffing" },
  colitis: { 5: "colitises" },
  colloquy: { 5: "colloquies" },
  colon: { 5: "colones" },
  colossus: { 5: "colossi" },
  combo: { 5: "combos" },
  come: { 1: "comes", 2: "came", 3: "coming", 4: "come" },
  commando: { 5: "commandos" },
  commit: { 1: "commits", 2: "committed", 3: "committing" },
  committeeman: { 5: "committeemen" },
  committeewoman: { 5: "committeewomen" },
  compel: { 1: "compels", 2: "compelled", 3: "compelling" },
  con: { 1: "cons", 2: "conned", 3: "conning" },
  concerto: { 5: "concertos" },
  conch: { 5: "conchs" },
  condo: { 5: "condos" },
  congressman: { 5: "congressmen" },
  congresswoman: { 5: "congresswomen" },
  conjunctivitis: { 5: "conjunctivitises" },
  conman: { 5: "conmen" },
  consortium: { 5: "consortia" },
  continuum: { 5: "continua" },
  contralto: { 5: "contraltos" },
  contretemps: { 5: "contretemps" },
  control: { 1: "controls", 2: "controlled", 3: "controlling" },
  copycat: { 1: "copycats", 2: "copycatted", 3: "copycatting" },
  corps: { 5: "corps" },
  corpsman: { 5: "corpsmen" },
  corpus: { 5: "corpora" },
  corral: { 1: "corrals", 2: "corralled", 3: "corralling" },
  cortex: { 5: "cortices" },
  cost: { 1: "costs", 2: "cost", 3: "costing" },
  costar: { 1: "costars", 2: "costarred", 3: "costarring" },
  councilman: { 5: "councilmen" },
  councilwoman: { 5: "councilwomen" },
  counsel: { 5: "counsel" },
  counterman: { 5: "countermen" },
  counteroffer: {
    1: "counteroffers",
    2: "counteroffered",
    3: "counteroffering"
  },
  countersink: {
    1: "countersinks",
    2: "countersunk",
    3: "countersinking",
    4: "countersunk"
  },
  countryman: { 5: "countrymen" },
  countrywoman: { 5: "countrywomen" },
  cowman: { 5: "cowmen" },
  craft: { 5: "craft" },
  craftsman: { 5: "craftsmen" },
  craftswoman: { 5: "craftswomen" },
  crappie: { 5: "crappie" },
  crawfish: { 5: "crawfish" },
  crayfish: { 5: "crayfish" },
  credo: { 5: "credos" },
  creep: { 1: "creeps", 2: "crept", 3: "creeping" },
  crescendo: { 5: "crescendos" },
  crewman: { 5: "crewmen" },
  criterion: { 5: "criteria" },
  crossbowman: { 5: "crossbowmen" },
  crossbreed: { 1: "crossbreeds", 2: "crossbred", 3: "crossbreeding" },
  crosscut: { 1: "crosscuts", 2: "crosscut", 3: "crosscutting" },
  cum: { 1: "cums", 2: "came", 3: "cumming" },
  cumulonimbus: { 5: "cumulonimbi" },
  cumulus: { 5: "cumuli" },
  curia: { 5: "curiae" },
  curio: { 5: "curios" },
  curriculum: { 5: "curricula" },
  cut: { 1: "cuts", 2: "cut", 3: "cutting" },
  cuttlefish: { 5: "cuttlefish" },
  cyclops: { 5: "cyclops" },
  dace: { 5: "dace" },
  dairyman: { 5: "dairymen" },
  dairywoman: { 5: "dairywomen" },
  dais: { 5: "daises" },
  daresay: {},
  datum: { 5: "data" },
  dead: { 5: "dead" },
  deadpan: { 1: "deadpans", 2: "deadpanned", 3: "deadpanning" },
  deal: { 1: "deals", 2: "dealt", 3: "dealing" },
  debris: { 5: "debris" },
  deceased: { 5: "deceased" },
  decontrol: { 1: "decontrols", 2: "decontrolled", 3: "decontrolling" },
  decree: { 1: "decrees", 2: "decreed", 3: "decreeing" },
  decrescendo: { 5: "decrescendos" },
  deer: { 5: "deer" },
  degas: { 1: "degases", 2: "degassed", 3: "degassing" },
  deliveryman: { 5: "deliverymen" },
  demo: { 5: "demos" },
  departed: { 5: "departed" },
  dermatitis: { 5: "dermatitises" },
  dermis: { 5: "dermises" },
  desideratum: { 5: "desiderata" },
  deter: { 1: "deters", 2: "deterred", 3: "deterring" },
  detritus: { 5: "detritus" },
  develop: { 1: "develops", 2: "developed", 3: "developing" },
  diabetes: { 5: "diabetes" },
  dictum: { 5: "dicta" },
  die: { 5: "dice" },
  differ: { 1: "differs", 2: "differed", 3: "differing" },
  dig: { 1: "digs", 2: "dug", 3: "digging" },
  digitalis: { 5: "digitalises" },
  diminuendo: { 5: "diminuendos" },
  din: { 1: "dins", 2: "dinned", 3: "dinning" },
  diptych: { 5: "diptychs" },
  dis: { 1: "disses", 2: "dissed", 3: "dissing", 5: "disses" },
  disagree: { 1: "disagrees", 2: "disagreed", 3: "disagreeing" },
  disco: { 1: "discos", 2: "discoed", 3: "discoing", 5: "discos" },
  disinter: { 1: "disinters", 2: "disinterred", 3: "disinterring" },
  dispel: { 1: "dispels", 2: "dispelled", 3: "dispelling" },
  disprove: { 1: "disproves", 2: "disproved", 3: "disproving", 4: "disproved" },
  distil: { 1: "distils", 2: "distilled", 3: "distilling" },
  ditto: { 1: "dittos", 2: "dittoed", 3: "dittoing", 5: "dittos" },
  dive: { 1: "dives", 2: "dived", 3: "diving", 4: "dived" },
  diverticulitis: { 5: "diverticulitises" },
  do: { 1: "does", 2: "did", 3: "doing", 4: "done", 5: "dos" },
  dodo: { 5: "dodos" },
  doe: { 5: "doe" },
  dogtrot: { 1: "dogtrots", 2: "dogtrotted", 3: "dogtrotting" },
  dollop: { 1: "dollops", 2: "dolloped", 3: "dolloping" },
  dominatrix: { 5: "dominatrices" },
  don: { 1: "dons", 2: "donned", 3: "donning" },
  dong: { 5: "dong" },
  doorman: { 5: "doormen" },
  dormouse: { 5: "dormice" },
  dot: { 1: "dots", 2: "dotted", 3: "dotting" },
  draftsman: { 5: "draftsmen" },
  draftswoman: { 5: "draftswomen" },
  draughtsman: { 5: "draughtsmen" },
  draw: { 1: "draws", 2: "drew", 3: "drawing", 4: "drawn" },
  drink: { 1: "drinks", 2: "drank", 3: "drinking", 4: "drunk" },
  drive: { 1: "drives", 2: "drove", 3: "driving", 4: "driven" },
  dry: { 5: "drys" },
  dun: { 1: "duns", 2: "dunned", 3: "dunning" },
  duo: { 5: "duos" },
  duodenum: { 5: "duodena" },
  dwell: { 1: "dwells", 2: "dwelt", 3: "dwelling" },
  dybbuk: { 5: "dybbukim" },
  dye: { 1: "dyes", 2: "dyed", 3: "dyeing" },
  dynamo: { 5: "dynamos" },
  eat: { 1: "eats", 2: "ate", 3: "eating", 4: "eaten" },
  ed: { 5: "ed" },
  effluvium: { 5: "effluvia" },
  egis: { 5: "egises" },
  ego: { 5: "egos" },
  eland: { 5: "eland" },
  elect: { 5: "elect" },
  elf: { 5: "elves" },
  embryo: { 5: "embryos" },
  emcee: { 1: "emcees", 2: "emceed", 3: "emceeing" },
  emit: { 1: "emits", 2: "emitted", 3: "emitting" },
  encephalitis: { 5: "encephalitides" },
  enrol: { 1: "enrols", 2: "enrolled", 3: "enrolling" },
  enteritis: { 5: "enteritises" },
  enthral: { 1: "enthrals", 2: "enthralled", 3: "enthralling" },
  envelop: { 1: "envelops", 2: "enveloped", 3: "enveloping" },
  envenom: { 1: "envenoms", 2: "envenomed", 3: "envenoming" },
  epidermis: { 5: "epidermises" },
  epiglottis: { 5: "epiglottises" },
  epoch: { 5: "epochs" },
  equip: { 1: "equips", 2: "equipped", 3: "equipping" },
  erratum: { 5: "errata" },
  escallop: { 1: "escallops", 2: "escalloped", 3: "escalloping" },
  escalop: { 1: "escalops", 2: "escaloped", 3: "escaloping" },
  escudo: { 5: "escudos" },
  esophagus: { 5: "esophagi" },
  espresso: { 5: "espressos" },
  eunuch: { 5: "eunuchs" },
  euro: { 5: "euros" },
  excel: { 1: "excels", 2: "excelled", 3: "excelling" },
  executrix: { 5: "executrices" },
  expel: { 1: "expels", 2: "expelled", 3: "expelling" },
  expo: { 5: "expos" },
  extol: { 1: "extols", 2: "extolled", 3: "extolling" },
  eye: { 1: "eyes", 2: "eyed", 3: "eyeing" },
  eyetooth: { 5: "eyeteeth" },
  facsimile: { 1: "facsimiles", 2: "facsimiled", 3: "facsimileing" },
  fall: { 1: "falls", 2: "fell", 3: "falling", 4: "fallen" },
  falsetto: { 5: "falsettos" },
  fan: { 1: "fans", 2: "fanned", 3: "fanning" },
  fandango: { 5: "fandangos" },
  farewell: {},
  faro: { 5: "faros" },
  fathom: { 1: "fathoms", 2: "fathomed", 3: "fathoming" },
  feed: { 1: "feeds", 2: "fed", 3: "feeding" },
  feel: { 1: "feels", 2: "felt", 3: "feeling" },
  fellatio: { 5: "fellatios" },
  fellowman: { 5: "fellowmen" },
  fen: { 5: "fen" },
  ferryman: { 5: "ferrymen" },
  fez: { 5: "fezzes" },
  fibula: { 5: "fibulae" },
  ficus: { 5: "ficus" },
  fight: { 1: "fights", 2: "fought", 3: "fighting" },
  filigree: { 1: "filigrees", 2: "filigreed", 3: "filigreeing" },
  fillip: { 1: "fillips", 2: "filliped", 3: "filliping" },
  find: { 1: "finds", 2: "found", 3: "finding" },
  finis: { 5: "finises" },
  fireman: { 5: "firemen" },
  firstborn: { 5: "firstborn" },
  fish: { 5: "fish" },
  fisherman: { 5: "fishermen" },
  fishwife: { 5: "fishwives" },
  fit: { 1: "fits", 2: "fitted", 3: "fitting" },
  flagellum: { 5: "flagella" },
  flagman: { 5: "flagmen" },
  flak: { 5: "flak" },
  flambe: { 1: "flambes", 2: "flambeed", 3: "flambeing" },
  flamenco: { 5: "flamencos" },
  flamingo: { 5: "flamingos" },
  flat: { 1: "flats", 2: "flatted", 3: "flatting" },
  flatfish: { 5: "flatfish" },
  flatfoot: { 5: "flatfeet" },
  flee: { 1: "flees", 2: "fled", 3: "fleeing" },
  fling: { 1: "flings", 2: "flung", 3: "flinging" },
  flit: { 1: "flits", 2: "flitted", 3: "flitting" },
  flounder: { 5: "flounder" },
  fly: { 1: "flies", 2: "flew", 3: "flying", 4: "flown" },
  flyby: { 5: "flybys" },
  flyleaf: { 5: "flyleaves" },
  folio: { 5: "folios" },
  foot: { 5: "feet" },
  footman: { 5: "footmen" },
  forbear: { 1: "forbears", 2: "forbore", 3: "forbearing", 4: "forborne" },
  forbid: { 1: "forbids", 2: "forbade", 3: "forbidding", 4: "forbidden" },
  forceps: { 5: "forceps" },
  forecast: { 1: "forecasts", 2: "forecast", 3: "forecasting" },
  forefoot: { 5: "forefeet" },
  forego: { 1: "foregoes", 2: "forewent", 3: "foregoing", 4: "foregone" },
  foreknow: { 1: "foreknows", 2: "foreknew", 3: "foreknowing", 4: "foreknown" },
  foreman: { 5: "foremen" },
  foresee: { 1: "foresees", 2: "foresaw", 3: "foreseeing", 4: "foreseen" },
  foreswear: {
    1: "foreswears",
    2: "foreswore",
    3: "foreswearing",
    4: "foresworn"
  },
  foretell: { 1: "foretells", 2: "foretold", 3: "foretelling" },
  forewoman: { 5: "forewomen" },
  forget: { 1: "forgets", 2: "forgot", 3: "forgetting", 4: "forgotten" },
  forgive: { 1: "forgives", 2: "forgave", 3: "forgiving", 4: "forgiven" },
  forgo: { 1: "forgoes", 2: "forwent", 3: "forgoing", 4: "forgone" },
  format: { 1: "formats", 2: "formatted", 3: "formatting" },
  forsake: { 1: "forsakes", 2: "forsook", 3: "forsaking", 4: "forsaken" },
  forswear: { 1: "forswears", 2: "forswore", 3: "forswearing", 4: "forsworn" },
  fowl: { 5: "fowl" },
  foxtrot: { 1: "foxtrots", 2: "foxtrotted", 3: "foxtrotting" },
  free: { 1: "frees", 2: "freed", 3: "freeing" },
  freedman: { 5: "freedmen" },
  freeman: { 5: "freemen" },
  freeze: { 1: "freezes", 2: "froze", 3: "freezing", 4: "frozen" },
  freshman: { 5: "freshmen" },
  fret: { 1: "frets", 2: "fretted", 3: "fretting" },
  fricassee: { 1: "fricassees", 2: "fricasseed", 3: "fricasseeing" },
  friz: { 1: "frizzes", 2: "frizzed", 3: "frizzing", 5: "frizzes" },
  frogman: { 5: "frogmen" },
  frontiersman: { 5: "frontiersmen" },
  frosh: { 5: "frosh" },
  frostbite: {
    1: "frostbites",
    2: "frostbit",
    3: "frostbiting",
    4: "frostbitten"
  },
  fulfil: { 1: "fulfils", 2: "fulfilled", 3: "fulfilling" },
  fungus: { 5: "fungi" },
  funnyman: { 5: "funnymen" },
  gainsay: { 1: "gainsays", 2: "gainsaid", 3: "gainsaying" },
  gallop: { 1: "gallops", 2: "galloped", 3: "galloping" },
  gallows: { 5: "gallows" },
  ganglion: { 5: "ganglia" },
  garbanzo: { 5: "garbanzos" },
  garfish: { 5: "garfish" },
  garnishee: { 1: "garnishees", 2: "garnisheed", 3: "garnisheeing" },
  gas: { 1: "gases", 2: "gassed", 3: "gassing" },
  gastritis: { 5: "gastritides" },
  gastroenteritis: { 5: "gastroenteritides" },
  gaucho: { 5: "gauchos" },
  gazebo: { 5: "gazebos" },
  gazpacho: { 5: "gazpachos" },
  gecko: { 5: "geckos" },
  gee: { 1: "gees", 2: "geed", 3: "geeing" },
  geisha: { 5: "geisha" },
  gel: { 1: "gels", 2: "gelled", 3: "gelling" },
  generalissimo: { 5: "generalissimos" },
  gentleman: { 5: "gentlemen" },
  gentlewoman: { 5: "gentlewomen" },
  genus: { 5: "genera" },
  gestapo: { 5: "gestapos" },
  get: { 1: "gets", 2: "got", 3: "getting", 4: "got" },
  ghetto: { 5: "ghettos" },
  ghostwrite: {
    1: "ghostwrites",
    2: "ghostwrote",
    3: "ghostwriting",
    4: "ghostwritten"
  },
  gigahertz: { 5: "gigahertz" },
  gigolo: { 5: "gigolos" },
  gin: { 1: "gins", 2: "ginned", 3: "ginning" },
  gingivitis: { 5: "gingivitises" },
  gismo: { 5: "gismos" },
  give: { 1: "gives", 2: "gave", 3: "giving", 4: "given" },
  gizmo: { 5: "gizmos" },
  glace: { 1: "glaces", 2: "glaceed", 3: "glaceing" },
  gladiolus: { 5: "gladioli" },
  glans: { 5: "glandes" },
  glissando: { 5: "glissandi" },
  glottis: { 5: "glottises" },
  glut: { 1: "gluts", 2: "glutted", 3: "glutting" },
  gnaw: { 1: "gnaws", 2: "gnawed", 3: "gnawing", 4: "gnawed" },
  gnu: { 5: "gnu" },
  go: { 1: "goes", 2: "went", 3: "going", 4: "gone" },
  godchild: { 5: "godchildren" },
  goldfish: { 5: "goldfish" },
  goodby: { 5: "goodbys" },
  goose: { 5: "geese" },
  gossip: { 1: "gossips", 2: "gossiped", 3: "gossiping" },
  graffito: { 5: "graffiti" },
  grandchild: { 5: "grandchildren" },
  grave: { 1: "graves", 2: "graved", 3: "graving", 4: "graven" },
  grin: { 1: "grins", 2: "grinned", 3: "grinning" },
  grind: { 1: "grinds", 2: "ground", 3: "grinding" },
  gringo: { 5: "gringos" },
  grit: { 1: "grits", 2: "gritted", 3: "gritting" },
  groomsman: { 5: "groomsmen" },
  gross: { 5: "gross" },
  grouse: { 5: "grouse" },
  grow: { 1: "grows", 2: "grew", 3: "growing", 4: "grown" },
  guano: { 5: "guanos" },
  guarantee: { 1: "guarantees", 2: "guaranteed", 3: "guaranteeing" },
  guardsman: { 5: "guardsmen" },
  gumbo: { 5: "gumbos" },
  gumshoe: { 1: "gumshoes", 2: "gumshoed", 3: "gumshoeing" },
  gun: { 1: "guns", 2: "gunned", 3: "gunning" },
  gunman: { 5: "gunmen" },
  gut: { 1: "guts", 2: "gutted", 3: "gutting" },
  gyp: { 1: "gyps", 2: "gypped", 3: "gypping" },
  gyro: { 5: "gyros" },
  hadj: { 5: "hadjes" },
  haggis: { 5: "haggises" },
  haiku: { 5: "haiku" },
  hairdo: { 5: "hairdos" },
  hajj: { 5: "hajjes" },
  hake: { 5: "hake" },
  half: { 5: "halves" },
  halibut: { 5: "halibut" },
  hallo: { 5: "hallos" },
  halo: { 1: "halos", 2: "haloed", 3: "haloing", 5: "halos" },
  hamstring: { 1: "hamstrings", 2: "hamstrung", 3: "hamstringing" },
  handyman: { 5: "handymen" },
  hangman: { 5: "hangmen" },
  hat: { 1: "hats", 2: "hatted", 3: "hatting" },
  have: { 1: "has", 2: "had", 3: "having", 4: "had" },
  headman: { 5: "headmen" },
  headquarters: { 5: "headquarters" },
  headsman: { 5: "headsmen" },
  hear: { 1: "hears", 2: "heard", 3: "hearing" },
  helix: { 5: "helices" },
  hello: { 5: "hellos" },
  helmsman: { 5: "helmsmen" },
  henchman: { 5: "henchmen" },
  hepatitis: { 5: "hepatitides" },
  herdsman: { 5: "herdsmen" },
  herring: { 5: "herring" },
  hertz: { 5: "hertz" },
  hetero: { 5: "heteros" },
  hew: { 1: "hews", 2: "hewed", 3: "hewing", 4: "hewed" },
  hiccup: { 1: "hiccups", 2: "hiccuped", 3: "hiccuping" },
  hide: { 1: "hides", 2: "hid", 3: "hiding", 4: "hidden" },
  hie: { 1: "hies", 2: "hied", 3: "hieing" },
  highwayman: { 5: "highwaymen" },
  hippo: { 5: "hippos" },
  hit: { 1: "hits", 2: "hit", 3: "hitting" },
  ho: { 5: "-ho's" },
  hobo: { 5: "hobos" },
  hoe: { 1: "hoes", 2: "hoed", 3: "hoeing" },
  hold: { 1: "holds", 2: "held", 3: "holding" },
  homo: { 5: "homos" },
  honcho: { 5: "honchos" },
  horseflesh: { 5: "horseflesh" },
  horseman: { 5: "horsemen" },
  horsepower: { 5: "horsepower" },
  horseshoe: { 1: "horseshoes", 2: "horseshoed", 3: "horseshoeing" },
  horsewoman: { 5: "horsewomen" },
  housebreak: {
    1: "housebreaks",
    2: "housebroke",
    3: "housebreaking",
    4: "housebroken"
  },
  houseman: { 5: "housemen" },
  housewife: { 5: "housewives" },
  hovercraft: { 5: "hovercraft" },
  hubris: { 5: "hubrises" },
  hullo: { 5: "hullos" },
  humerus: { 5: "humeri" },
  hundredweight: { 5: "hundredweight" },
  huntsman: { 5: "huntsmen" },
  hurt: { 1: "hurts", 2: "hurt", 3: "hurting" },
  husbandman: { 5: "husbandmen" },
  hydro: { 5: "hydros" },
  hydrocephalus: { 5: "hydrocephali" },
  hypo: { 5: "hypos" },
  hypothalamus: { 5: "hypothalami" },
  ibex: { 5: "ibex" },
  ibis: { 5: "ibis" },
  iceman: { 5: "icemen" },
  ileitis: { 5: "ileitides" },
  ileum: { 5: "ilea" },
  ilium: { 5: "ilia" },
  imbroglio: { 5: "imbroglios" },
  impasto: { 5: "impastos" },
  impatiens: { 5: "impatiens" },
  impel: { 1: "impels", 2: "impelled", 3: "impelling" },
  impetigo: { 5: "impetigos" },
  impresario: { 5: "impresarios" },
  inbreed: { 1: "inbreeds", 2: "inbred", 3: "inbreeding" },
  incognito: { 5: "incognitos" },
  incunabulum: { 5: "incunabula" },
  indigo: { 5: "indigos" },
  indwell: { 1: "indwells", 2: "indwelt", 3: "indwelling" },
  infantryman: { 5: "infantrymen" },
  inferno: { 5: "infernos" },
  info: { 5: "infos" },
  inlay: { 1: "inlays", 2: "inlaid", 3: "inlaying" },
  innuendo: { 5: "innuendos" },
  input: { 1: "inputs", 2: "inputted", 3: "inputting" },
  inset: { 1: "insets", 2: "inset", 3: "insetting" },
  insigne: { 5: "insignia" },
  instal: { 1: "instals", 2: "installed", 3: "installing" },
  instil: { 1: "instils", 2: "instilled", 3: "instilling" },
  intaglio: { 5: "intaglios" },
  inter: { 1: "inters", 2: "interred", 3: "interring" },
  interbreed: { 1: "interbreeds", 2: "interbred", 3: "interbreeding" },
  intermezzo: { 5: "intermezzos" },
  interweave: {
    1: "interweaves",
    2: "interwove",
    3: "interweaving",
    4: "interwoven"
  },
  intro: { 5: "intros" },
  invalid: { 1: "invalids", 2: "invalided", 3: "invaliding" },
  iris: { 5: "irises" },
  jackknife: { 5: "jackknives" },
  jalapeno: { 5: "jalapenos" },
  japan: { 1: "japans", 2: "japanned", 3: "japanning" },
  jato: { 5: "jatos" },
  jejunum: { 5: "jejuna" },
  jello: { 5: "jellos" },
  jellyfish: { 5: "jellyfish" },
  jet: { 1: "jets", 2: "jetted", 3: "jetting" },
  jigsaw: { 1: "jigsaws", 2: "jigsawed", 3: "jigsawing", 4: "jigsawed" },
  jot: { 1: "jots", 2: "jotted", 3: "jotting" },
  journeyman: { 5: "journeymen" },
  joyride: { 1: "joyrides", 2: "joyrode", 3: "joyriding", 4: "joyridden" },
  judo: { 5: "judos" },
  jumbo: { 5: "jumbos" },
  junco: { 5: "juncos" },
  juryman: { 5: "jurymen" },
  jurywoman: { 5: "jurywomen" },
  jut: { 1: "juts", 2: "jutted", 3: "jutting" },
  kayo: { 1: "kayos", 2: "kayoed", 3: "kayoing", 5: "kayos" },
  keep: { 1: "keeps", 2: "kept", 3: "keeping" },
  ken: { 1: "kens", 2: "kenned", 3: "kenning" },
  keno: { 5: "kenos" },
  kibbutz: { 5: "kibbutzim" },
  kiddo: { 5: "kiddos" },
  kilo: { 5: "kilos" },
  kilohertz: { 5: "kilohertz" },
  kimono: { 5: "kimonos" },
  kin: { 5: "kin" },
  kinsman: { 5: "kinsmen" },
  kinswoman: { 5: "kinswomen" },
  kip: { 5: "kip" },
  knee: { 1: "knees", 2: "kneed", 3: "kneeing" },
  kneel: { 1: "kneels", 2: "knelt", 3: "kneeling" },
  knife: { 5: "knives" },
  knit: { 1: "knits", 2: "knitted", 3: "knitting" },
  knot: { 1: "knots", 2: "knotted", 3: "knotting" },
  know: { 1: "knows", 2: "knew", 3: "knowing", 4: "known" },
  kohlrabi: { 5: "kohlrabies" },
  krona: { 5: "kronor" },
  krone: { 5: "kroner" },
  kuchen: { 5: "kuchen" },
  labium: { 5: "labia" },
  lacuna: { 5: "lacunae" },
  lade: { 1: "lades", 2: "laded", 3: "lading", 4: "laden" },
  lamina: { 5: "laminae" },
  landslide: {
    1: "landslides",
    2: "landslid",
    3: "landsliding",
    4: "landslid"
  },
  landsman: { 5: "landsmen" },
  largo: { 5: "largos" },
  larva: { 5: "larvae" },
  laryngitis: { 5: "laryngitides" },
  larynx: { 5: "larynges" },
  lasso: { 1: "lassos", 2: "lassoed", 3: "lassoing", 5: "lassos" },
  latex: { 5: "latices" },
  laundryman: { 5: "laundrymen" },
  laundrywoman: { 5: "laundrywomen" },
  lawman: { 5: "lawmen" },
  lay: { 1: "lays", 2: "laid", 3: "laying" },
  layman: { 5: "laymen" },
  laywoman: { 5: "laywomen" },
  lead: { 1: "leads", 2: "led", 3: "leading" },
  leaf: { 5: "leaves" },
  leap: { 1: "leaps", 2: "leaped", 3: "leaping", 4: "lept" },
  leave: { 1: "leaves", 2: "left", 3: "leaving" },
  legato: { 5: "legatos" },
  legman: { 5: "legmen" },
  lend: { 1: "lends", 2: "lent", 3: "lending" },
  less: { 5: "less" },
  let: { 1: "lets", 2: "let", 3: "letting" },
  libido: { 5: "libidos" },
  libretto: { 5: "librettos" },
  lido: { 5: "lidos" },
  lie: { 1: "lies", 2: "lay", 3: "lying", 4: "lain" },
  lied: { 5: "lieder" },
  life: { 5: "lives" },
  lightning: { 1: "lightnings", 2: "lightninged", 3: "lightning" },
  limbo: { 5: "limbos" },
  limo: { 5: "limos" },
  lineman: { 5: "linemen" },
  linesman: { 5: "linesmen" },
  ling: { 5: "ling" },
  linguine: { 5: "linguine" },
  linguini: { 5: "linguini" },
  lipread: { 1: "lipreads", 2: "lipread", 3: "lipreading" },
  lira: { 5: "lire" },
  liveryman: { 5: "liverymen" },
  llano: { 5: "llanos" },
  loaf: { 5: "loaves" },
  lobster: { 5: "lobster" },
  loch: { 5: "lochs" },
  locus: { 5: "loci" },
  logo: { 5: "logos" },
  longshoreman: { 5: "longshoremen" },
  loris: { 5: "lorises" },
  lose: { 1: "loses", 2: "lost", 3: "losing" },
  lotto: { 5: "lottos" },
  louse: { 5: "lice" },
  lovechild: { 5: "lovechildren" },
  lox: { 5: "lox" },
  lumbago: { 5: "lumbagos" },
  lumberman: { 5: "lumbermen" },
  lynx: { 5: "lynx" },
  mach: { 5: "machs" },
  machismo: { 5: "machismos" },
  macho: { 5: "machos" },
  mackerel: { 5: "mackerel" },
  macro: { 5: "macros" },
  madam: { 5: "mesdames" },
  madame: { 5: "mesdames" },
  madman: { 5: "madmen" },
  madwoman: { 5: "madwomen" },
  maestro: { 5: "maestros" },
  mafioso: { 5: "mafiosi" },
  magneto: { 5: "magnetos" },
  magus: { 5: "magi" },
  mailman: { 5: "mailmen" },
  majordomo: { 5: "majordomos" },
  make: { 1: "makes", 2: "made", 3: "making" },
  mambo: { 1: "mambos", 2: "mamboed", 3: "mamboing", 5: "mambos" },
  man: { 1: "mans", 2: "manned", 3: "manning", 5: "men" },
  manifesto: { 5: "manifestos" },
  manservant: { 5: "menservants" },
  mantis: { 5: "mantises" },
  manumit: { 1: "manumits", 2: "manumitted", 3: "manumitting" },
  maraschino: { 5: "maraschinos" },
  mare: { 5: "maria" },
  markka: { 5: "markkaa" },
  marksman: { 5: "marksmen" },
  marlin: { 5: "marlin" },
  marquis: { 5: "marquises" },
  masturbation: { 5: "masturbationsq" },
  mat: { 1: "mats", 2: "matted", 3: "matting" },
  matriarch: { 5: "matriarchs" },
  matrix: { 5: "matrices" },
  matzo: { 5: "matzoth" },
  matzoh: { 5: "matzoth" },
  maxilla: { 5: "maxillae" },
  mayo: { 5: "mayos" },
  mean: { 1: "means", 2: "meant", 3: "meaning" },
  meatloaf: { 5: "meatloaves" },
  medico: { 5: "medicos" },
  medium: { 5: "media" },
  meet: { 1: "meets", 2: "met", 3: "meeting" },
  megahertz: { 5: "megahertz" },
  megalopolis: { 5: "megalopolises" },
  melt: { 1: "melts", 2: "melted", 3: "melting", 4: "melted" },
  memento: { 5: "mementos" },
  memo: { 5: "memos" },
  menhaden: { 5: "menhaden" },
  meningitis: { 5: "meningitides" },
  meninx: { 5: "meninges" },
  meniscus: { 5: "menisci" },
  merchantman: { 5: "merchantmen" },
  merino: { 5: "merinos" },
  merman: { 5: "mermen" },
  mestizo: { 5: "mestizos" },
  metacarpus: { 5: "metacarpi" },
  metatarsus: { 5: "metatarsi" },
  methinks: { undefined: "methought" },
  metro: { 5: "metros" },
  metropolis: { 5: "metropolises" },
  mezzo: { 5: "mezzos" },
  micro: { 5: "micros" },
  microfiche: { 5: "microfiche" },
  middleman: { 5: "middlemen" },
  midlife: { 5: "midlives" },
  midshipman: { 5: "midshipmen" },
  midwife: { 5: "midwives" },
  mikado: { 5: "mikados" },
  military: { 5: "military" },
  militiaman: { 5: "militiamen" },
  milkman: { 5: "milkmen" },
  miniseries: { 5: "miniseries" },
  mink: { 5: "mink" },
  minuteman: { 5: "minutemen" },
  minutia: { 5: "minutiae" },
  miscast: { 1: "miscasts", 2: "miscast", 3: "miscasting" },
  misdeal: { 1: "misdeals", 2: "misdealt", 3: "misdealing" },
  misdo: { 1: "misdoes", 2: "misdid", 3: "misdoing", 4: "misdone" },
  misfit: { 1: "misfits", 2: "misfitted", 3: "misfitting" },
  mishear: { 1: "mishears", 2: "misheard", 3: "mishearing" },
  mislay: { 1: "mislays", 2: "mislaid", 3: "mislaying" },
  mislead: { 1: "misleads", 2: "misled", 3: "misleading" },
  misread: { 1: "misreads", 2: "misread", 3: "misreading" },
  misshape: { 1: "misshapes", 2: "misshaped", 3: "misshaping", 4: "misshaped" },
  missis: { 5: "missises" },
  misspeak: { 1: "misspeaks", 2: "misspoke", 3: "misspeaking", 4: "misspoken" },
  misspend: { 1: "misspends", 2: "misspent", 3: "misspending" },
  mistake: { 1: "mistakes", 2: "mistook", 3: "mistaking", 4: "mistaken" },
  misunderstand: {
    1: "misunderstands",
    2: "misunderstood",
    3: "misunderstanding"
  },
  momentum: { 5: "momenta" },
  monarch: { 5: "monarchs" },
  monetize: { 1: "monitizes", 2: "monetized", 3: "monetizing" },
  mono: { 5: "monos" },
  monseigneur: { 5: "messeigneurs" },
  monsieur: { 5: "messieurs" },
  moose: { 5: "moose" },
  morocco: { 5: "moroccos" },
  motorman: { 5: "motormen" },
  mouse: { 5: "mice" },
  mow: { 1: "mows", 2: "mowed", 3: "mowing", 4: "mowed" },
  murmur: { 1: "murmurs", 2: "murmured", 3: "murmuring" },
  muskellunge: { 5: "muskellunge" },
  muskox: { 5: "muskoxen" },
  muskrat: { 5: "muskrat" },
  mustachio: { 5: "mustachios" },
  myelitis: { 5: "myelitides" },
  nacho: { 5: "nachos" },
  narcissus: { 5: "narcissus" },
  nebula: { 5: "nebulae" },
  necropolis: { 5: "necropolises" },
  needlewoman: { 5: "needlewomen" },
  nephritis: { 5: "nephritides" },
  net: { 1: "nets", 2: "netted", 3: "netting" },
  neuritis: { 5: "neuritides" },
  neutrino: { 5: "neutrinos" },
  nevus: { 5: "nevi" },
  newsman: { 5: "newsmen" },
  newspaperman: { 5: "newspapermen" },
  newspaperwoman: { 5: "newspaperwomen" },
  newswoman: { 5: "newswomen" },
  nimbus: { 5: "nimbi" },
  nisei: { 5: "nisei" },
  nobleman: { 5: "noblemen" },
  noblewoman: { 5: "noblewomen" },
  nonplus: { 1: "nonplusses", 2: "nonplussed", 3: "nonplussing" },
  nosedive: { 1: "nosedives", 2: "nosedived", 3: "nosediving", 4: "nosedived" },
  nucleolus: { 5: "nucleoli" },
  nucleus: { 5: "nuclei" },
  nuncio: { 5: "nuncios" },
  nurseryman: { 5: "nurserymen" },
  nut: { 1: "nuts", 2: "nutted", 3: "nutting" },
  oarsman: { 5: "oarsmen" },
  oarswoman: { 5: "oarswomen" },
  obbligato: { 5: "obbligatos" },
  obloquy: { 5: "obloquies" },
  obsequy: { 5: "obsequies" },
  octavo: { 5: "octavos" },
  oesophagus: { 5: "oesophagi" },
  offer: { 1: "offers", 2: "offered", 3: "offering" },
  offset: { 1: "offsets", 2: "offset", 3: "offsetting" },
  offspring: { 5: "offspring" },
  oleo: { 5: "oleos" },
  oligarch: { 5: "oligarchs" },
  ombudsman: { 5: "ombudsmen" },
  omit: { 1: "omits", 2: "omitted", 3: "omitting" },
  optimum: { 5: "optima" },
  opus: { 5: "opera" },
  oratorio: { 5: "oratorios" },
  ore: { 5: "ore" },
  oregano: { 5: "oreganos" },
  orris: { 5: "orrises" },
  orzo: { 5: "orzos" },
  osteoarthritis: { 5: "osteoarthritides" },
  outbid: { 1: "outbids", 2: "outbid", 3: "outbidding", 4: "outbid" },
  outdo: { 1: "outdoes", 2: "outdid", 3: "outdoing", 4: "outdone" },
  outdraw: { 1: "outdraws", 2: "outdrew", 3: "outdrawing", 4: "outdrawn" },
  outfight: { 1: "outfights", 2: "outfought", 3: "outfighting" },
  outfit: { 1: "outfits", 2: "outfitted", 3: "outfitting" },
  outgrow: { 1: "outgrows", 2: "outgrew", 3: "outgrowing", 4: "outgrown" },
  outgun: { 1: "outguns", 2: "outgunned", 3: "outgunning" },
  outhit: { 1: "outhits", 2: "outhit", 3: "outhitting" },
  outlay: { 1: "outlays", 2: "outlaid", 3: "outlaying" },
  output: { 1: "outputs", 2: "outputted", 3: "outputting" },
  outrun: { 1: "outruns", 2: "outran", 3: "outrunning", 4: "outrun" },
  outsell: { 1: "outsells", 2: "outsold", 3: "outselling" },
  outshine: { 1: "outshines", 2: "outshone", 3: "outshining" },
  outspend: { 1: "outspends", 2: "outspent", 3: "outspending" },
  outspread: { 1: "outspreads", 2: "outspread", 3: "outspreading" },
  outwear: { 1: "outwears", 2: "outwore", 3: "outwearing", 4: "outworn" },
  outwit: { 1: "outwits", 2: "outwitted", 3: "outwitting" },
  ouzo: { 5: "ouzos" },
  overbear: { 1: "overbears", 2: "overbore", 3: "overbearing", 4: "overborne" },
  overbid: { 1: "overbids", 2: "overbid", 3: "overbidding" },
  overbuild: { 1: "overbuilds", 2: "overbuilt", 3: "overbuilding" },
  overbuy: { 1: "overbuys", 2: "overbought", 3: "overbuying" },
  overcast: { 1: "overcasts", 2: "overcast", 3: "overcasting" },
  overcome: { 1: "overcomes", 2: "overcame", 3: "overcoming", 4: "overcome" },
  overdevelop: { 1: "overdevelops", 2: "overdeveloped", 3: "overdeveloping" },
  overdo: { 1: "overdoes", 2: "overdid", 3: "overdoing", 4: "overdone" },
  overdraw: { 1: "overdraws", 2: "overdrew", 3: "overdrawing", 4: "overdrawn" },
  overeat: { 1: "overeats", 2: "overate", 3: "overeating", 4: "overeaten" },
  overfeed: { 1: "overfeeds", 2: "overfed", 3: "overfeeding" },
  overfly: { 1: "overflies", 2: "overflew", 3: "overflying", 4: "overflown" },
  overgrow: { 1: "overgrows", 2: "overgrew", 3: "overgrowing", 4: "overgrown" },
  overhang: { 1: "overhangs", 2: "overhung", 3: "overhanging" },
  overhear: { 1: "overhears", 2: "overheard", 3: "overhearing" },
  overlay: { 1: "overlays", 2: "overlaid", 3: "overlaying" },
  overlie: { 1: "overlies", 2: "overlay", 3: "overlying", 4: "overlain" },
  overload: {
    1: "overloads",
    2: "overloaded",
    3: "overloading",
    4: "overloaded"
  },
  overpay: { 1: "overpays", 2: "overpaid", 3: "overpaying" },
  override: { 1: "overrides", 2: "overrode", 3: "overriding", 4: "overridden" },
  overrun: { 1: "overruns", 2: "overran", 3: "overrunning", 4: "overrun" },
  oversee: { 1: "oversees", 2: "oversaw", 3: "overseeing", 4: "overseen" },
  oversell: { 1: "oversells", 2: "oversold", 3: "overselling" },
  overshoot: { 1: "overshoots", 2: "overshot", 3: "overshooting" },
  oversleep: { 1: "oversleeps", 2: "overslept", 3: "oversleeping" },
  overspend: { 1: "overspends", 2: "overspent", 3: "overspending" },
  overspread: { 1: "overspreads", 2: "overspread", 3: "overspreading" },
  overtake: { 1: "overtakes", 2: "overtook", 3: "overtaking", 4: "overtaken" },
  overthrow: {
    1: "overthrows",
    2: "overthrew",
    3: "overthrowing",
    4: "overthrown"
  },
  ovum: { 5: "ova" },
  ox: { 5: "oxen" },
  oxymoron: { 5: "oxymora" },
  pal: { 1: "pals", 2: "palled", 3: "palling" },
  palmetto: { 5: "palmettos" },
  palomino: { 5: "palominos" },
  pan: { 1: "pans", 2: "panned", 3: "panning" },
  papilla: { 5: "papillae" },
  papyrus: { 5: "papyri" },
  paramecium: { 5: "paramecia" },
  partake: { 1: "partakes", 2: "partook", 3: "partaking", 4: "partaken" },
  passerby: { 5: "passersby" },
  pat: { 1: "pats", 2: "patted", 3: "patting" },
  paterfamilias: { 5: "patresfamilias" },
  patio: { 5: "patios" },
  patois: { 5: "patois" },
  patriarch: { 5: "patriarchs" },
  patrol: { 1: "patrols", 2: "patrolled", 3: "patrolling" },
  patrolman: { 5: "patrolmen" },
  patrolwoman: { 5: "patrolwomen" },
  pay: { 1: "pays", 2: "paid", 3: "paying" },
  pee: { 1: "pees", 2: "peed", 3: "peeing" },
  pekinese: { 5: "pekinese" },
  pekingese: { 5: "pekingese" },
  pelvis: { 5: "pelvises" },
  pen: { 1: "pens", 2: "penned", 3: "penning", 4: "-pent" },
  penis: { 5: "penises" },
  penknife: { 5: "penknives" },
  penman: { 5: "penmen" },
  penumbra: { 5: "penumbrae" },
  percent: { 5: "percent" },
  perch: { 5: "perch" },
  pericardium: { 5: "pericardia" },
  perihelion: { 5: "perihelia" },
  perineum: { 5: "perinea" },
  peritonitis: { 5: "peritonitises" },
  permit: { 1: "permits", 2: "permitted", 3: "permitting" },
  persona: { 5: "personae" },
  pertussis: { 5: "pertussises" },
  peso: { 5: "pesos" },
  pesto: { 5: "pestos" },
  pet: { 1: "pets", 2: "petted", 3: "petting" },
  pfennig: { 5: "pfennig" },
  phallus: { 5: "phalli" },
  pharyngitis: { 5: "pharyngitides" },
  pharynx: { 5: "pharynges" },
  phenomenon: { 5: "phenomena" },
  phlebitis: { 5: "phlebitides" },
  phlox: { 5: "phlox" },
  photo: { 1: "photos", 2: "photoed", 3: "photoing", 5: "photos" },
  photostat: {
    1: "photostats",
    2: "photostatted",
    3: "photostatting",
    5: "protostats"
  },
  phylum: { 5: "phyla" },
  pi: { 1: "pies", 2: "pied", 3: "pieing" },
  pianissimo: { 5: "pianissimos" },
  piano: { 5: "pianos" },
  pibroch: { 5: "pibrochs" },
  piccolo: { 5: "piccolos" },
  pickerel: { 5: "pickerel" },
  pilfer: { 1: "pilfers", 2: "pilfered", 3: "pilfering" },
  pimento: { 5: "pimentos" },
  pimiento: { 5: "pimientos" },
  pin: { 1: "pins", 2: "pinned", 3: "pinning" },
  pinko: { 5: "pinkos" },
  pinto: { 5: "pintos" },
  pinyin: { 5: "pinyin" },
  piranha: { 5: "piranha" },
  pistachio: { 5: "pistachios" },
  pit: { 1: "pits", 2: "pitted", 3: "pitting" },
  pitchman: { 5: "pitchmen" },
  pizzicato: { 5: "pizzicati" },
  placebo: { 5: "placebos" },
  plainclothesman: { 5: "plainclothesmen" },
  plainsman: { 5: "plainsmen" },
  plan: { 1: "plans", 2: "planned", 3: "planning" },
  planeload: { 5: "planeload" },
  plat: { 1: "plats", 2: "platted", 3: "platting" },
  platy: { 5: "platys" },
  plectrum: { 5: "plectra" },
  pleura: { 5: "pleurae" },
  plot: { 1: "plots", 2: "plotted", 3: "plotting" },
  plover: { 5: "plover" },
  plowman: { 5: "plowmen" },
  pocketknife: { 5: "pocketknives" },
  poi: { 5: "poi" },
  polecat: { 5: "polecat" },
  police: { 5: "police" },
  policeman: { 5: "policemen" },
  policewoman: { 5: "policewomen" },
  polio: { 5: "polios" },
  poliomyelitis: { 5: "poliomyelitides" },
  politburo: { 5: "politburos" },
  politico: { 5: "politicos" },
  pollack: { 5: "pollack" },
  pollock: { 5: "pollock" },
  polo: { 5: "polos" },
  pompano: { 5: "pompano" },
  poncho: { 5: "ponchos" },
  porgy: { 5: "porgy" },
  porno: { 5: "pornos" },
  porpoise: { 5: "porpoise" },
  portcullis: { 5: "portcullises" },
  portfolio: { 5: "portfolios" },
  possum: { 5: "possum" },
  postman: { 5: "postmen" },
  pot: { 1: "pots", 2: "potted", 3: "potting" },
  pound: { 5: "pound" },
  precis: { 5: "precis" },
  prepay: { 1: "prepays", 2: "prepaid", 3: "prepaying" },
  preset: { 1: "presets", 2: "preset", 3: "presetting" },
  preshrink: {
    1: "preshrinks",
    2: "preshrank",
    3: "preshrinking",
    4: "preshrunk"
  },
  presidium: { 5: "presidia" },
  pressman: { 5: "pressmen" },
  presto: { 5: "prestos" },
  pro: { 5: "pros" },
  proboscis: { 5: "proboscises" },
  proffer: { 1: "proffers", 2: "proffered", 3: "proffering" },
  promo: { 1: "promos", 2: "promoed", 3: "promoing", 5: "promos" },
  proofread: { 1: "proofreads", 2: "proofread", 3: "proofreading" },
  propel: { 1: "propels", 2: "propelled", 3: "propelling" },
  prosciutto: { 5: "prosciutti" },
  protozoon: { 5: "protozoa" },
  prove: { 1: "proves", 2: "proved", 3: "proving", 4: "proved" },
  proviso: { 5: "provisos" },
  psych: { 1: "psychs", 2: "psyched", 3: "psyching", 5: "psychs" },
  psycho: { 5: "psychos" },
  ptarmigan: { 5: "ptarmigan" },
  pubes: { 5: "pubes" },
  pudendum: { 5: "pudenda" },
  pueblo: { 5: "pueblos" },
  pun: { 1: "puns", 2: "punned", 3: "punning" },
  punctilio: { 5: "punctilios" },
  pupa: { 5: "pupae" },
  puree: { 1: "purees", 2: "pureed", 3: "pureeing" },
  put: { 1: "puts", 2: "put", 3: "putting" },
  pylorus: { 5: "pylori" },
  pyramid: { 1: "pyramids", 2: "pyramided", 3: "pyramiding" },
  quadrivium: { 5: "quadrivia" },
  quail: { 5: "quail" },
  quantum: { 5: "quanta" },
  quarterstaff: { 5: "quarterstaves" },
  quarto: { 5: "quartos" },
  quid: { 5: "quid" },
  quip: { 1: "quips", 2: "quipped", 3: "quipping" },
  quit: { 1: "quits", 2: "quit", 3: "quitting" },
  quiz: { 1: "quizzes", 2: "quizzed", 3: "quizzing", 5: "quizzes" },
  quoth: {},
  rabies: { 5: "rabies" },
  radicchio: { 5: "radicchios" },
  radio: { 1: "radios", 2: "radioed", 3: "radioing", 5: "radios" },
  radioman: { 5: "radiomen" },
  radius: { 5: "radii" },
  rail: { 5: "rail" },
  rand: { 5: "rand" },
  ransom: { 1: "ransoms", 2: "ransomed", 3: "ransoming" },
  rappel: { 1: "rappels", 2: "rappelled", 3: "rappelling" },
  rat: { 1: "rats", 2: "ratted", 3: "ratting" },
  ratio: { 5: "ratios" },
  read: { 1: "reads", 2: "read", 3: "reading" },
  readmit: { 1: "readmits", 2: "readmitted", 3: "readmitting" },
  rebel: { 1: "rebels", 2: "rebelled", 3: "rebelling" },
  rebid: { 1: "rebids", 2: "rebid", 3: "rebidding" },
  rebind: { 1: "rebinds", 2: "rebound", 3: "rebinding" },
  rebroadcast: { 1: "rebroadcasts", 2: "rebroadcast", 3: "rebroadcasting" },
  rebuild: { 1: "rebuilds", 2: "rebuilt", 3: "rebuilding" },
  rebut: { 1: "rebuts", 2: "rebutted", 3: "rebutting" },
  recast: { 1: "recasts", 2: "recast", 3: "recasting" },
  recommit: { 1: "recommits", 2: "recommitted", 3: "recommitting" },
  recto: { 5: "rectos" },
  redevelop: { 1: "redevelops", 2: "redeveloped", 3: "redeveloping" },
  redo: { 1: "redoes", 2: "redid", 3: "redoing", 4: "redone" },
  redraw: { 1: "redraws", 2: "redrew", 3: "redrawing", 4: "redrawn" },
  redye: { 1: "redyes", 2: "redyed", 3: "redyeing" },
  reequip: { 1: "reequips", 2: "reequipped", 3: "reequipping" },
  reeve: { 1: "reeves", 2: "rove", 3: "reeving" },
  referee: { 1: "referees", 2: "refereed", 3: "refereeing" },
  refit: { 1: "refits", 2: "refitted", 3: "refitting" },
  refreeze: { 1: "refreezes", 2: "refroze", 3: "refreezing", 4: "refrozen" },
  regret: { 1: "regrets", 2: "regretted", 3: "regretting" },
  regrind: { 1: "regrinds", 2: "reground", 3: "regrinding" },
  regrow: { 1: "regrows", 2: "regrew", 3: "regrowing", 4: "regrown" },
  rehear: { 1: "rehears", 2: "reheard", 3: "rehearing" },
  reindeer: { 5: "reindeer" },
  relay: { undefined: "relayed" },
  religious: { 5: "religious" },
  remake: { 1: "remakes", 2: "remade", 3: "remaking" },
  remit: { 1: "remits", 2: "remitted", 3: "remitting" },
  rend: { 1: "rends", 2: "rent", 3: "rending" },
  rendezvous: { 5: "rendezvous" },
  repairman: { 5: "repairmen" },
  repay: { 1: "repays", 2: "repaid", 3: "repaying" },
  repel: { 1: "repels", 2: "repelled", 3: "repelling" },
  reread: { 1: "rereads", 2: "reread", 3: "rereading" },
  rerun: { 1: "reruns", 2: "reran", 3: "rerunning", 4: "rerun" },
  resell: { 1: "resells", 2: "resold", 3: "reselling" },
  reset: { 1: "resets", 2: "reset", 3: "resetting" },
  resew: { 1: "resews", 2: "resewed", 3: "resewing", 4: "resewn" },
  residuum: { 5: "residua" },
  resow: { 1: "resows", 2: "resowed", 3: "resowing", 4: "resown" },
  restring: { 1: "restrings", 2: "restrung", 3: "restringing" },
  resubmit: { 1: "resubmits", 2: "resubmitted", 3: "resubmitting" },
  retake: { 1: "retakes", 2: "retook", 3: "retaking", 4: "retaken" },
  reteach: { 1: "reteaches", 2: "retaught", 3: "reteaching" },
  retell: { 1: "retells", 2: "retold", 3: "retelling" },
  rethink: { 1: "rethinks", 2: "rethought", 3: "rethinking" },
  retread: { 1: "retreads", 2: "retrod", 3: "retreading", 4: "retrodden" },
  retro: { 5: "retros" },
  retrofit: { 1: "retrofits", 2: "retrofitted", 3: "retrofitting" },
  rev: { 1: "revs", 2: "revved", 3: "revving" },
  revers: { 5: "revers" },
  reweave: { 1: "reweaves", 2: "rewove", 3: "reweaving", 4: "rewoven" },
  rewind: { 1: "rewinds", 2: "rewound", 3: "rewinding" },
  rewrite: { 1: "rewrites", 2: "rewrote", 3: "rewriting", 4: "rewritten" },
  rhinitis: { 5: "rhinitides" },
  rhino: { 5: "rhinos" },
  rho: { 5: "rhos" },
  rid: { 1: "rids", 2: "rid", 3: "ridding" },
  ride: { 1: "rides", 2: "rode", 3: "riding", 4: "ridden" },
  rifleman: { 5: "riflemen" },
  rigatoni: { 5: "rigatoni" },
  ring: { 1: "rings", 2: "rang", 3: "ringing", 4: "rung" },
  rise: { 1: "rises", 2: "rose", 3: "rising", 4: "risen" },
  risotto: { 5: "risottos" },
  rive: { 1: "rives", 2: "rived", 3: "riving", 4: "rived" },
  rococo: { 5: "rococos" },
  rodeo: { 5: "rodeos" },
  roe: { 5: "roe" },
  romeo: { 5: "romeos" },
  rondo: { 5: "rondos" },
  rot: { 1: "rots", 2: "rotted", 3: "rotting" },
  rubato: { 5: "rubatos" },
  run: { 1: "runs", 2: "ran", 3: "running", 4: "run" },
  rut: { 1: "ruts", 2: "rutted", 3: "rutting" },
  sable: { 5: "sable" },
  sacrum: { 5: "sacra" },
  sago: { 5: "sagos" },
  saguaro: { 5: "saguaros" },
  sailfish: { 5: "sailfish" },
  salesman: { 5: "salesmen" },
  saleswoman: { 5: "saleswomen" },
  salmon: { 5: "salmon" },
  salmonella: { 5: "salmonellae" },
  salvo: { 5: "salvos" },
  samurai: { 5: "samurai" },
  sandman: { 5: "sandmen" },
  sarcophagus: { 5: "sarcophagi" },
  saute: { 1: "sautes", 2: "sauteed", 3: "sauteing" },
  sauternes: { 5: "sauternes" },
  saw: { 1: "saws", 2: "sawed", 3: "sawing", 4: "sawed" },
  sawbones: { 5: "sawbones" },
  say: { 1: "says", 2: "said", 3: "saying" },
  scallop: { 1: "scallops", 2: "scalloped", 3: "scalloping" },
  scampi: { 5: "scampi" },
  scan: { 1: "scans", 2: "scanned", 3: "scanning" },
  scapula: { 5: "scapulae" },
  scarf: { 5: "scarves" },
  scat: { 1: "scats", 2: "scatted", 3: "scatting" },
  scenario: { 5: "scenarios" },
  scherzo: { 5: "scherzos" },
  schizo: { 5: "schizos" },
  schnapps: { 5: "schnapps" },
  schnaps: { 5: "schnaps" },
  schoolchild: { 5: "schoolchildren" },
  schrod: { 5: "schrod" },
  scollop: { 1: "scollops", 2: "scolloped", 3: "scolloping" },
  scrod: { 5: "scrod" },
  scrotum: { 5: "scrota" },
  seaman: { 5: "seamen" },
  see: { 1: "sees", 2: "saw", 3: "seeing", 4: "seen" },
  seek: { 1: "seeks", 2: "sought", 3: "seeking" },
  seethe: { 1: "seethes", 2: "seethed", 3: "seething", 4: "seethed" },
  segue: { 1: "segues", 2: "segued", 3: "segueing" },
  selectman: { 5: "selectmen" },
  self: { 5: "selves" },
  sell: { 1: "sells", 2: "sold", 3: "selling" },
  ssemipro: { 5: "semipros" },
  send: { 1: "sends", 2: "sent", 3: "sending" },
  septum: { 5: "septa" },
  seraglio: { 5: "seraglios" },
  seraphim: { 5: "seraphim" },
  serviceman: { 5: "servicemen" },
  servicewoman: { 5: "servicewomen" },
  servo: { 5: "servos" },
  set: { 1: "sets", 2: "set", 3: "setting" },
  sew: { 1: "sews", 2: "sewed", 3: "sewing", 4: "sewn" },
  shad: { 5: "shad" },
  shake: { 1: "shakes", 2: "shook", 3: "shaking", 4: "shaken" },
  shave: { 1: "shaves", 2: "shaved", 3: "shaving", 4: "shaved" },
  sheaf: { 5: "sheaves" },
  shear: { 1: "shears", 2: "sheared", 3: "shearing", 4: "sheared" },
  shed: { 1: "sheds", 2: "shed", 3: "shedding" },
  sheep: { 5: "sheep" },
  shelf: { 5: "shelves" },
  shellfish: { 5: "shellfish" },
  shew: { 1: "shews", 2: "shewed", 3: "shewing", 4: "shewn" },
  shin: { 1: "shins", 2: "shinned", 3: "shinning" },
  shine: { 1: "shines", 2: "shone", 3: "shining" },
  shit: { 1: "shits", 2: "shit", 3: "shitting" },
  shoe: { 1: "shoes", 2: "shod", 3: "shoeing", 4: "shod" },
  shoot: { 1: "shoots", 2: "shot", 3: "shooting" },
  shotgun: { 1: "shotguns", 2: "shotgunned", 3: "shotgunning" },
  show: { 1: "shows", 2: "showed", 3: "showing", 4: "shown" },
  showbiz: { 5: "showbizzes" },
  showman: { 5: "showmen" },
  shrimp: { 5: "shrimp" },
  shrink: { 1: "shrinks", 2: "shrank", 3: "shrinking", 4: "shrunk" },
  shrive: { 1: "shrives", 2: "shrived", 3: "shriving", 4: "shriven" },
  shun: { 1: "shuns", 2: "shunned", 3: "shunning" },
  shut: { 1: "shuts", 2: "shut", 3: "shutting" },
  sicko: { 5: "sickos" },
  sideman: { 5: "sidemen" },
  sightread: { 1: "sightreads", 2: "sightread", 3: "sightreading" },
  signalman: { 5: "signalmen" },
  silo: { 5: "silos" },
  silverfish: { 5: "silverfish" },
  simulcast: { 1: "simulcasts", 2: "simulcast", 3: "simulcasting" },
  sin: { 1: "sins", 2: "sinned", 3: "sinning" },
  sing: { 1: "sings", 2: "sang", 3: "singing", 4: "sung" },
  singe: { 1: "singes", 2: "singed", 3: "singeing" },
  singles: { 5: "singles" },
  sink: { 1: "sinks", 2: "sank", 3: "sinking", 4: "sunk" },
  sinusitis: { 5: "sinusitises" },
  sirocco: { 5: "siroccos" },
  sis: { 5: "sises" },
  sit: { 1: "sits", 2: "sat", 3: "sitting" },
  sixpence: { 5: "sixpence" },
  skin: { 1: "skins", 2: "skinned", 3: "skinning" },
  slalom: { 1: "slaloms", 2: "slalomed", 3: "slaloming" },
  slay: { 1: "slays", 2: "slew", 3: "slaying", 4: "slain" },
  sleep: { 1: "sleeps", 2: "slept", 3: "sleeping" },
  slide: { 1: "slides", 2: "slid", 3: "sliding" },
  sling: { 1: "slings", 2: "slung", 3: "slinging" },
  slink: { 1: "slinks", 2: "slunk", 3: "slinking" },
  slit: { 1: "slits", 2: "slit", 3: "slitting" },
  slot: { 1: "slots", 2: "slotted", 3: "slotting" },
  smartypants: { 5: "smartypants" },
  smite: { 1: "smites", 2: "smote", 3: "smiting", 4: "smitten" },
  snapper: { 5: "snapper" },
  snipe: { 5: "snipe" },
  snowman: { 5: "snowmen" },
  snowshoe: { 1: "snowshoes", 2: "snowshoed", 3: "snowshoeing" },
  so: { 5: "sos" },
  sockeye: { 5: "sockeye" },
  solarium: { 5: "solaria" },
  sole: { 5: "sole" },
  solidus: { 5: "solidi" },
  soliloquy: { 5: "soliloquies" },
  solo: { 1: "solos", 2: "soloed", 3: "soloing", 5: "solos" },
  sombrero: { 5: "sombreros" },
  somerset: { 1: "somersets", 2: "somersetted", 3: "somersetting" },
  soprano: { 5: "sopranos" },
  sortie: { 1: "sorties", 2: "sortied", 3: "sortieing" },
  sow: { 1: "sows", 2: "sowed", 3: "sowing", 4: "sown" },
  spaceman: { 5: "spacemen" },
  spacewoman: { 5: "spacewomen" },
  spadix: { 5: "spadices" },
  span: { 1: "spans", 2: "spanned", 3: "spanning" },
  spat: { 1: "spats", 2: "spatted", 3: "spatting" },
  speak: { 1: "speaks", 2: "spoke", 3: "speaking", 4: "spoken" },
  spearfish: { 5: "spearfish" },
  spec: { 1: "specs", 2: "-spec'd", 3: "-spec'ing" },
  species: { 5: "species" },
  spectrum: { 5: "spectra" },
  speed: { 1: "speeds", 2: "sped", 3: "speeding" },
  spellbind: { 1: "spellbinds", 2: "spellbound", 3: "spellbinding" },
  spend: { 1: "spends", 2: "spent", 3: "spending" },
  spermatozoon: { 5: "spermatozoa" },
  spin: { 1: "spins", 2: "spun", 3: "spinning" },
  spit: { 1: "spits", 2: "spit", 3: "spitting", 4: "spitted" },
  splat: { 1: "splats", 2: "splatted", 3: "splatting" },
  splayfoot: { 5: "splayfeet" },
  split: { 1: "splits", 2: "split", 3: "splitting" },
  spokesman: { 5: "spokesmen" },
  spokeswoman: { 5: "spokeswomen" },
  sportsman: { 5: "sportsmen" },
  sportswoman: { 5: "sportswomen" },
  spot: { 1: "spots", 2: "spotted", 3: "spotting" },
  spread: { 1: "spreads", 2: "spread", 3: "spreading" },
  spring: { 1: "springs", 2: "sprang", 3: "springing", 4: "sprung" },
  springbok: { 5: "springbok" },
  sputum: { 5: "sputa" },
  squab: { 5: "squab" },
  squat: { 1: "squats", 2: "squatted", 3: "squatting" },
  squeegee: { 1: "squeegees", 2: "squeegeed", 3: "squeegeeing" },
  squid: { 5: "squid" },
  stableman: { 5: "stablemen" },
  staccato: { 5: "staccatos" },
  staff: { 5: "staves" },
  stand: { 1: "stands", 2: "stood", 3: "standing" },
  standby: { 5: "standbys" },
  staphylococcus: { 5: "staphylococci" },
  star: { 1: "stars", 2: "starred", 3: "starring" },
  starfish: { 5: "starfish" },
  statesman: { 5: "statesmen" },
  stateswoman: { 5: "stateswomen" },
  steal: { 1: "steals", 2: "stole", 3: "stealing", 4: "stolen" },
  steersman: { 5: "steersmen" },
  steno: { 5: "stenos" },
  stepchild: { 5: "stepchildren" },
  stereo: { 5: "stereos" },
  stet: { 1: "stets", 2: "stetted", 3: "stetting" },
  stick: { 1: "sticks", 2: "stuck", 3: "sticking" },
  stiletto: { 5: "stilettos" },
  stimulus: { 5: "stimuli" },
  sting: { 1: "stings", 2: "stung", 3: "stinging" },
  stink: { 1: "stinks", 2: "stank", 3: "stinking", 4: "stunk" },
  stir: { 1: "stirs", 2: "stirred", 3: "stirring" },
  stomach: { 1: "stomachs", 2: "stomached", 3: "stomaching", 5: "stomachs" },
  stratum: { 5: "strata" },
  stratus: { 5: "strati" },
  streptococcus: { 5: "streptococci" },
  strew: { 1: "strews", 2: "strewed", 3: "strewing", 4: "strewed" },
  stria: { 5: "striae" },
  stride: { 1: "strides", 2: "strode", 3: "striding", 4: "stridden" },
  strike: { 1: "strikes", 2: "struck", 3: "striking", 4: "struck" },
  string: { 1: "strings", 2: "strung", 3: "stringing" },
  strive: { 1: "strives", 2: "strove", 3: "striving", 4: "striven" },
  strongman: { 5: "strongmen" },
  strut: { 1: "struts", 2: "strutted", 3: "strutting" },
  studio: { 5: "studios" },
  stun: { 1: "stuns", 2: "stunned", 3: "stunning" },
  sturgeon: { 5: "sturgeon" },
  stymie: { 1: "stymies", 2: "stymied", 3: "stymieing" },
  sublet: { 1: "sublets", 2: "sublet", 3: "subletting" },
  submit: { 1: "submits", 2: "submitted", 3: "submitting" },
  subspecies: { 5: "subspecies" },
  substratum: { 5: "substrata" },
  suffer: { 1: "suffers", 2: "suffered", 3: "suffering" },
  sumach: { 5: "sumachs" },
  sumo: { 5: "sumos" },
  sun: { 1: "suns", 2: "sunned", 3: "sunning" },
  sunfish: { 5: "sunfish" },
  suntan: { 1: "suntans", 2: "suntanned", 3: "suntanning" },
  superego: { 5: "superegos" },
  superman: { 5: "supermen" },
  superwoman: { 5: "superwomen" },
  surplus: { 1: "surpluses", 2: "surplussed", 3: "surplussing" },
  swat: { 1: "swats", 2: "swatted", 3: "swatting" },
  swear: { 1: "swears", 2: "swore", 3: "swearing", 4: "sworn" },
  sweat: { 1: "sweats", 2: "sweat", 3: "sweating" },
  sweep: { 1: "sweeps", 2: "swept", 3: "sweeping" },
  sweepstakes: { 5: "sweepstakes" },
  swell: { 1: "swells", 2: "swelled", 3: "swelling", 4: "swollen" },
  swim: { 1: "swims", 2: "swam", 3: "swimming", 4: "swum" },
  swine: { 5: "swine" },
  swing: { 1: "swings", 2: "swung", 3: "swinging" },
  swordfish: { 5: "swordfish" },
  swordsman: { 5: "swordsmen" },
  sync: { 1: "syncs", 2: "synced", 3: "syncing" },
  synch: { 1: "synchs", 2: "synched", 3: "synching", 5: "synchs" },
  syphilis: { 5: "syphilises" },
  tableau: { 5: "tableaux" },
  taco: { 5: "tacos" },
  take: { 1: "takes", 2: "took", 3: "taking", 4: "taken" },
  tallyho: { 1: "tallyhos", 2: "tallyhoed", 3: "tallyhoing", 5: "tallyhos" },
  tan: { 1: "tans", 2: "tanned", 3: "tanning" },
  tangelo: { 5: "tangelos" },
  tango: { 1: "tangos", 2: "tangoed", 3: "tangoing", 5: "tangos" },
  tar: { 1: "tars", 2: "tarred", 3: "tarring" },
  taro: { 5: "taros" },
  tarpon: { 5: "tarpon" },
  tarsus: { 5: "tarsi" },
  tat: { 1: "tats", 2: "tatted", 3: "tatting" },
  tatami: { 5: "tatami" },
  teach: { 1: "teaches", 2: "taught", 3: "teaching" },
  teal: { 5: "teal" },
  tear: { 1: "tears", 2: "tore", 3: "tearing", 4: "torn" },
  teargas: { 1: "teargases", 2: "teargassed", 3: "teargassing" },
  tech: { 5: "techs" },
  tee: { 1: "tees", 2: "teed", 3: "teeing" },
  telecast: { 1: "telecasts", 2: "telecast", 3: "telecasting" },
  telecommunications: { 5: "telecommunications" },
  telephoto: { 5: "telephotos" },
  tell: { 1: "tells", 2: "told", 3: "telling" },
  tempo: { 5: "tempos" },
  tendinitis: { 5: "tendinitises" },
  tendonitis: { 5: "tendonitises" },
  tennis: { 5: "tennises" },
  terminus: { 5: "termini" },
  terrazzo: { 5: "terrazzos" },
  testatrix: { 5: "testatrices" },
  thalamus: { 5: "thalami" },
  thief: { 5: "thieves" },
  thin: { 1: "thins", 2: "thinned", 3: "thinning" },
  think: { 1: "thinks", 2: "thought", 3: "thinking" },
  threepence: { 5: "threepence" },
  thrive: { 1: "thrives", 2: "thrived", 3: "thriving", 4: "thrived" },
  thrombus: { 5: "thrombi" },
  throw: { 1: "throws", 2: "threw", 3: "throwing", 4: "thrown" },
  thrust: { 1: "thrusts", 2: "thrust", 3: "thrusting" },
  tibia: { 5: "tibiae" },
  timpani: { 5: "timpani" },
  tin: { 1: "tins", 2: "tinned", 3: "tinning" },
  tinge: { 1: "tinges", 2: "tinged", 3: "tingeing" },
  tiptoe: { 1: "tiptoes", 2: "tiptoed", 3: "tiptoeing" },
  tiro: { 5: "tiros" },
  titmouse: { 5: "titmice" },
  tobacco: { 5: "tobaccos" },
  toe: { 1: "toes", 2: "toed", 3: "toeing" },
  tonsillitis: { 5: "tonsillitises" },
  tooth: { 5: "teeth" },
  torso: { 5: "torsos" },
  tot: { 1: "tots", 2: "totted", 3: "totting" },
  townsman: { 5: "townsmen" },
  townswoman: { 5: "townswomen" },
  trachea: { 5: "tracheae" },
  tradesman: { 5: "tradesmen" },
  tradeswoman: { 5: "tradeswomen" },
  trainman: { 5: "trainmen" },
  transmit: { 1: "transmits", 2: "transmitted", 3: "transmitting" },
  tread: { 1: "treads", 2: "trod", 3: "treading", 4: "trodden" },
  tree: { 1: "trees", 2: "treed", 3: "treeing" },
  trek: { 1: "treks", 2: "trekked", 3: "trekking" },
  trellis: { 5: "trellises" },
  tremolo: { 5: "tremolos" },
  trencherman: { 5: "trenchermen" },
  trial: { 1: "trials", 2: "trialled", 3: "trialling" },
  tribesman: { 5: "tribesmen" },
  tribeswoman: { 5: "tribeswomen" },
  triceps: { 5: "triceps" },
  triceratops: { 5: "triceratops" },
  trichina: { 5: "trichinae" },
  trio: { 5: "trios" },
  triptych: { 5: "triptychs" },
  trivia: { 5: "trivia" },
  trivium: { 5: "trivia" },
  trot: { 1: "trots", 2: "trotted", 3: "trotting" },
  troubleshoot: { 1: "troubleshoots", 2: "troubleshot", 3: "troubleshooting" },
  trousseau: { 5: "trousseaux" },
  trout: { 5: "trout" },
  tuna: { 5: "tuna" },
  turbo: { 5: "turbos" },
  tut: { 1: "tuts", 2: "tutted", 3: "tutting" },
  tuxedo: { 5: "tuxedos" },
  twin: { 1: "twins", 2: "twinned", 3: "twinning" },
  twit: { 1: "twits", 2: "twitted", 3: "twitting" },
  two: { 5: "twos" },
  twopence: { 5: "twopence" },
  tympani: { 5: "tympani" },
  typecast: { 1: "typecasts", 2: "typecast", 3: "typecasting" },
  typeset: { 1: "typesets", 2: "typeset", 3: "typesetting" },
  typewrite: {
    1: "typewrites",
    2: "typewrote",
    3: "typewriting",
    4: "typewritten"
  },
  typo: { 5: "typos" },
  tyro: { 5: "tyros" },
  ulna: { 5: "ulnae" },
  umbilicus: { 5: "umbilici" },
  unbend: { 1: "unbends", 2: "unbent", 3: "unbending" },
  unbind: { 1: "unbinds", 2: "unbound", 3: "unbinding" },
  unbosom: { 1: "unbosoms", 2: "unbosomed", 3: "unbosoming" },
  underbid: { 1: "underbids", 2: "underbid", 3: "underbidding" },
  underclassman: { 5: "underclassmen" },
  undercut: { 1: "undercuts", 2: "undercut", 3: "undercutting" },
  underfeed: { 1: "underfeeds", 2: "underfed", 3: "underfeeding" },
  undergo: { 1: "undergoes", 2: "underwent", 3: "undergoing", 4: "undergone" },
  underlie: { 1: "underlies", 2: "underlay", 3: "underlying", 4: "underlain" },
  underpay: { 1: "underpays", 2: "underpaid", 3: "underpaying" },
  underpin: { 1: "underpins", 2: "underpinned", 3: "underpinning" },
  undersell: { 1: "undersells", 2: "undersold", 3: "underselling" },
  undershoot: { 1: "undershoots", 2: "undershot", 3: "undershooting" },
  undersigned: { 5: "undersigned" },
  understand: { 1: "understands", 2: "understood", 3: "understanding" },
  undertake: {
    1: "undertakes",
    2: "undertook",
    3: "undertaking",
    4: "undertaken"
  },
  underwrite: {
    1: "underwrites",
    2: "underwrote",
    3: "underwriting",
    4: "underwritten"
  },
  undo: { 1: "undoes", 2: "undid", 3: "undoing", 4: "undone" },
  unfit: { 1: "unfits", 2: "unfitted", 3: "unfitting" },
  unfreeze: { 1: "unfreezes", 2: "unfroze", 3: "unfreezing", 4: "unfrozen" },
  unmake: { 1: "unmakes", 2: "unmade", 3: "unmaking" },
  unman: { 1: "unmans", 2: "unmanned", 3: "unmanning" },
  unpin: { 1: "unpins", 2: "unpinned", 3: "unpinning" },
  unsay: { 1: "unsays", 2: "unsaid", 3: "unsaying" },
  unwind: { 1: "unwinds", 2: "unwound", 3: "unwinding" },
  uphold: { 1: "upholds", 2: "upheld", 3: "upholding" },
  upperclassman: { 5: "upperclassmen" },
  uppercut: { 1: "uppercuts", 2: "uppercut", 3: "uppercutting" },
  upset: { 1: "upsets", 2: "upset", 3: "upsetting" },
  upthrust: { 1: "upthrusts", 2: "upthrust", 3: "upthrusting" },
  urethra: { 5: "urethrae" },
  uterus: { 5: "uteri" },
  vagina: { 5: "vaginae" },
  van: { 1: "vans", 2: "vanned", 3: "vanning" },
  vaquero: { 5: "vaqueros" },
  vat: { 1: "vats", 2: "vatted", 3: "vatting" },
  veg: { 1: "vegs", 2: "vegged", 3: "vegges", 4: "vegging" },
  velours: { 5: "velours" },
  velum: { 5: "vela" },
  venireman: { 5: "veniremen" },
  ventriloquy: { 5: "ventriloquies" },
  verdigris: { 5: "verdigrises" },
  vermicelli: { 5: "vermicelli" },
  vermin: { 5: "vermin" },
  verruca: { 5: "verrucae" },
  verso: { 5: "versos" },
  vertebra: { 5: "vertebrae" },
  vestryman: { 5: "vestrymen" },
  vet: { 1: "vets", 2: "vetted", 3: "vetting" },
  vibrato: { 5: "vibratos" },
  video: { 1: "videos", 2: "videoed", 3: "videoing", 5: "videos" },
  villus: { 5: "villi" },
  vino: { 5: "vinos" },
  violoncello: { 5: "violoncellos" },
  vireo: { 5: "vireos" },
  virtuoso: { 5: "virtuosos" },
  viscus: { 5: "viscera" },
  vita: { 5: "vitae" },
  vulva: { 5: "vulvae" },
  wacko: { 5: "wackos" },
  wake: { 1: "wakes", 2: "woke", 3: "waking", 4: "waked" },
  walleye: { 5: "walleye" },
  wallop: { 1: "wallops", 2: "walloped", 3: "walloping" },
  washerwoman: { 5: "washerwomen" },
  watchman: { 5: "watchmen" },
  watercraft: { 5: "watercraft" },
  waterfowl: { 5: "waterfowl" },
  wax: { 1: "waxes", 2: "waxed", 3: "waxing", 4: "waxed" },
  waylay: { 1: "waylays", 2: "waylaid", 3: "waylaying" },
  weakfish: { 5: "weakfish" },
  wear: { 1: "wears", 2: "wore", 3: "wearing", 4: "worn" },
  weatherman: { 5: "weathermen" },
  weave: { 1: "weaves", 2: "wove", 3: "weaving", 4: "woven" },
  webfoot: { 5: "webfeet" },
  wee: { 1: "wees", 2: "weed", 3: "weeing" },
  weep: { 1: "weeps", 2: "wept", 3: "weeping" },
  weirdo: { 5: "weirdos" },
  werewolf: { 5: "werewolves" },
  werwolf: { 5: "werwolves" },
  wet: { 1: "wets", 2: "wet", 3: "wetting" },
  wharf: { 5: "wharves" },
  whereabouts: { 5: "whereabouts" },
  whet: { 1: "whets", 2: "whetted", 3: "whetting" },
  whipsaw: { 1: "whipsaws", 2: "whipsawed", 3: "whipsawing", 4: "whipsawed" },
  whitefish: { 5: "whitefish" },
  whiting: { 5: "whiting" },
  whiz: { 1: "whizzes", 2: "whizzed", 3: "whizzing", 5: "whizzes" },
  whoa: {},
  wife: { 5: "wives" },
  wildcat: { 1: "wildcats", 2: "wildcatted", 3: "wildcatting" },
  wildfowl: { 5: "wildfowl" },
  win: { 1: "wins", 2: "won", 3: "winning" },
  wind: { 1: "winds", 2: "wound", 3: "winding" },
  wino: { 5: "winos" },
  withdraw: { 1: "withdraws", 2: "withdrew", 3: "withdrawing", 4: "withdrawn" },
  withhold: { 1: "withholds", 2: "withheld", 3: "withholding" },
  wiz: { 5: "wizzes" },
  wolf: { 5: "wolves" },
  woman: { 5: "women" },
  won: { 5: "won" },
  woodman: { 5: "woodmen" },
  woodsman: { 5: "woodsmen" },
  workingman: { 5: "workingmen" },
  workingwoman: { 5: "workingwomen" },
  workman: { 5: "workmen" },
  worship: { 1: "worships", 2: "worshiped", 3: "worshiping" },
  wring: { 1: "wrings", 2: "wrung", 3: "wringing" },
  write: { 1: "writes", 2: "wrote", 3: "writing", 4: "written" },
  yachtsman: { 5: "yachtsmen" },
  yachtswoman: { 5: "yachtswomen" },
  yak: { 1: "yaks", 2: "yakked", 3: "yakking" },
  yardman: { 5: "yardmen" },
  yeoman: { 5: "yeomen" },
  young: { 5: "young" },
  yuan: { 5: "yuan" },
  yuk: { 1: "yuks", 2: "yukked", 3: "yukking" },
  zero: { 1: "zeros", 2: "zeroed", 3: "zeroing", 5: "zeros" },
  zloty: { 5: "zlotys" },
  zydeco: { 5: "zydecos" },
  can: { 1: "can", 2: "could", 3: "can", 4: "could" },
  could: { 1: "could", 2: "could", 3: "could", 4: "could" },
  may: { 1: "may", 2: "might", 3: "may", 4: "might" },
  might: { 1: "might", 2: "might", 3: "might", 4: "might" },
  must: { 1: "must", 2: "must", 3: "must", 4: "must" },
  ought: { 1: "ought", 2: "ought", 3: "ought", 4: "ought" },
  shall: { 1: "shall", 2: "should", 3: "shall", 4: "should" },
  should: { 1: "should", 2: "should", 3: "should", 4: "should" },
  will: { 1: "will", 2: "would", 3: "will", 4: "would" },
  would: { 1: "would", 2: "would", 3: "would", 4: "would" }
};

// ../nlp/dist/trace.js
var enabled = false;
var trace = (message) => {
  if (enabled && typeof console !== "undefined") {
    console.debug(message());
  }
};

// ../nlp/dist/inflect/index.js
var InflectionKeys;
(function(InflectionKeys2) {
  InflectionKeys2[InflectionKeys2["PRESENT_THIRD_PERSON"] = 1] = "PRESENT_THIRD_PERSON";
  InflectionKeys2[InflectionKeys2["PAST_SIMPLE"] = 2] = "PAST_SIMPLE";
  InflectionKeys2[InflectionKeys2["PRESENT_PART"] = 3] = "PRESENT_PART";
  InflectionKeys2[InflectionKeys2["PAST_PART"] = 4] = "PAST_PART";
  InflectionKeys2[InflectionKeys2["PLURAL"] = 5] = "PLURAL";
})(InflectionKeys || (InflectionKeys = {}));
var { PRESENT_THIRD_PERSON, PAST_SIMPLE, PRESENT_PART, PAST_PART, PLURAL } = InflectionKeys;
var endsInSibilantOrO = /(?:[sxz]|[^o]o|sh|ch)$/iu;
var endsInConsonantPlusY = /[^aeiou]y$/iu;
var endsInIs = /is$/iu;
var endsInIe = /ie$/iu;
var endsInE = /e$/iu;
var endsInC = /c$/iu;
var endsInConsonantBeforeY = /[^aeiou]y$/iu;
var endsInDoublingR = /(?:b[au]|ch?[au]|f[eu]|ja|lu|m[au]|p[au]|wh?[ai])r$/iu;
var endsInDoublingConsonant = /[^aeiou][aeiou][bdfgmp]$/iu;
var inflectNoun = ({ lemma = "", feats: { Number: Number2 = void 0 } = {} }) => {
  if (Number2 === "Sing") {
    return lemma;
  }
  if (endsInIs.test(lemma)) {
    return `${lemma.slice(0, lemma.length - 2)}es`;
  }
  if (endsInSibilantOrO.test(lemma)) {
    return `${lemma}es`;
  }
  if (endsInConsonantPlusY.test(lemma)) {
    return `${lemma.slice(0, lemma.length - 1)}ies`;
  }
  return `${lemma}s`;
};
var inflectPast = (lemma) => {
  if (endsInE.test(lemma)) {
    return `${lemma}d`;
  }
  if (endsInC.test(lemma)) {
    return `${lemma}ked`;
  }
  if (endsInConsonantBeforeY.test(lemma)) {
    return `${lemma.slice(0, lemma.length - 1)}ied`;
  }
  if (endsInDoublingR.test(lemma)) {
    return `${lemma}red`;
  }
  if (endsInDoublingConsonant.test(lemma)) {
    return `${lemma}${lemma[lemma.length - 1]}ed`;
  }
  return `${lemma}ed`;
};
var inflectPresentParticiple = (lemma) => {
  if (endsInIe.test(lemma)) {
    return `${lemma.slice(0, lemma.length - 2)}ying`;
  }
  if (endsInE.test(lemma)) {
    return `${lemma.slice(0, lemma.length - 1)}ing`;
  }
  if (endsInC.test(lemma)) {
    return `${lemma}king`;
  }
  if (endsInDoublingR.test(lemma)) {
    return `${lemma}ring`;
  }
  if (endsInDoublingConsonant.test(lemma)) {
    return `${lemma}${lemma[lemma.length - 1]}ing`;
  }
  return `${lemma}ing`;
};
var inflectThirdPersonSingular = (lemma) => {
  if (endsInSibilantOrO.test(lemma)) {
    return `${lemma}es`;
  }
  if (endsInConsonantPlusY.test(lemma)) {
    return `${lemma.slice(0, lemma.length - 1)}ies`;
  }
  return `${lemma}s`;
};
var inflectVerb = ({ lemma = "", feats = {} }) => {
  const { Person, Number: Number2 = "Sing", VerbForm, Tense } = feats;
  if (Tense === "Past") {
    return inflectPast(lemma);
  }
  if (VerbForm === "Part") {
    return inflectPresentParticiple(lemma);
  }
  if (Person === 3 && Number2 === "Sing") {
    return inflectThirdPersonSingular(lemma);
  }
  return lemma;
};
var inflectRegular = ({ xpos, lemma, feats }) => {
  switch (xpos) {
    case "NOUN":
      return inflectNoun({ lemma, feats });
    case "VERB":
      return inflectVerb({ lemma, feats });
    default:
      return lemma;
  }
};
var pastBe = (Person, Number2) => Person && Person !== 2 && Number2 === "Sing" ? "was" : "were";
var presentBe = (Person, Number2) => {
  if (Number2 === "Plur") {
    return "are";
  }
  if (Person === 1) {
    return "am";
  }
  return Person === 3 ? "is" : "are";
};
var inflectBe = ({ feats }) => {
  const { Person, VerbForm, Tense, Number: Number2 } = feats ?? {};
  if (VerbForm === "Part") {
    return Tense === "Past" ? "been" : "being";
  }
  return Tense === "Past" ? pastBe(Person, Number2) : presentBe(Person, Number2);
};
var irregularVerbForm = (entry, lemma, { Person, Number: Number2, VerbForm, Tense }) => {
  if (Tense === "Past") {
    return VerbForm === "Part" && entry[PAST_PART] != null ? entry[PAST_PART] : entry[PAST_SIMPLE];
  }
  if (VerbForm === "Part") {
    return entry[PRESENT_PART];
  }
  return Person === 3 && Number2 === "Sing" ? entry[PRESENT_THIRD_PERSON] : lemma;
};
var inflectIrregular = (dictionary2, { lemma, xpos, feats: { Number: Number2, Person, VerbForm, Tense } = {} }) => {
  const entry = lemma ? dictionary2[lemma] : null;
  trace(() => `Inflect ${lemma} with feats ${JSON.stringify({
    lemma,
    xpos,
    Number: Number2,
    Person,
    VerbForm,
    Tense
  })} and entry ${JSON.stringify(entry)}`);
  if (entry == null) {
    return null;
  }
  if (xpos === "NOUN") {
    return Number2 === "Plur" ? entry[PLURAL] : lemma;
  }
  return xpos === "VERB" ? irregularVerbForm(entry, lemma, { Number: Number2, Person, VerbForm, Tense }) : null;
};
var inflect_default = ({ lemma, xpos, feats }) => {
  if (lemma === "be") {
    return inflectBe({ feats });
  }
  const irregularInflection = inflectIrregular(irregular_dictionary_default, {
    lemma,
    xpos,
    feats
  });
  if (irregularInflection != null) {
    return irregularInflection;
  }
  return inflectRegular({ lemma, xpos, feats });
};

// ../english-lint/node_modules/css-what/dist/esm/types.js
var SelectorType;
(function(SelectorType2) {
  SelectorType2["Attribute"] = "attribute";
  SelectorType2["Pseudo"] = "pseudo";
  SelectorType2["PseudoElement"] = "pseudo-element";
  SelectorType2["Tag"] = "tag";
  SelectorType2["Universal"] = "universal";
  SelectorType2["Adjacent"] = "adjacent";
  SelectorType2["Child"] = "child";
  SelectorType2["Descendant"] = "descendant";
  SelectorType2["Parent"] = "parent";
  SelectorType2["Sibling"] = "sibling";
  SelectorType2["ColumnCombinator"] = "column-combinator";
})(SelectorType || (SelectorType = {}));
var AttributeAction;
(function(AttributeAction2) {
  AttributeAction2["Any"] = "any";
  AttributeAction2["Element"] = "element";
  AttributeAction2["End"] = "end";
  AttributeAction2["Equals"] = "equals";
  AttributeAction2["Exists"] = "exists";
  AttributeAction2["Hyphen"] = "hyphen";
  AttributeAction2["Not"] = "not";
  AttributeAction2["Start"] = "start";
})(AttributeAction || (AttributeAction = {}));

// ../english-lint/node_modules/css-what/dist/esm/parse.js
var reName = /^[^#\\]?(?:\\(?:[\da-f]{1,6}\s?|.)|[\w\u00B0-\uFFFF-])+/;
var reEscape = /\\([\da-f]{1,6}\s?|(\s)|.)/gi;
var CharCode;
(function(CharCode2) {
  CharCode2[CharCode2["LeftParenthesis"] = 40] = "LeftParenthesis";
  CharCode2[CharCode2["RightParenthesis"] = 41] = "RightParenthesis";
  CharCode2[CharCode2["LeftSquareBracket"] = 91] = "LeftSquareBracket";
  CharCode2[CharCode2["RightSquareBracket"] = 93] = "RightSquareBracket";
  CharCode2[CharCode2["Comma"] = 44] = "Comma";
  CharCode2[CharCode2["Period"] = 46] = "Period";
  CharCode2[CharCode2["Colon"] = 58] = "Colon";
  CharCode2[CharCode2["SingleQuote"] = 39] = "SingleQuote";
  CharCode2[CharCode2["DoubleQuote"] = 34] = "DoubleQuote";
  CharCode2[CharCode2["Plus"] = 43] = "Plus";
  CharCode2[CharCode2["Tilde"] = 126] = "Tilde";
  CharCode2[CharCode2["QuestionMark"] = 63] = "QuestionMark";
  CharCode2[CharCode2["ExclamationMark"] = 33] = "ExclamationMark";
  CharCode2[CharCode2["Slash"] = 47] = "Slash";
  CharCode2[CharCode2["Equal"] = 61] = "Equal";
  CharCode2[CharCode2["Dollar"] = 36] = "Dollar";
  CharCode2[CharCode2["Pipe"] = 124] = "Pipe";
  CharCode2[CharCode2["Circumflex"] = 94] = "Circumflex";
  CharCode2[CharCode2["Asterisk"] = 42] = "Asterisk";
  CharCode2[CharCode2["GreaterThan"] = 62] = "GreaterThan";
  CharCode2[CharCode2["LessThan"] = 60] = "LessThan";
  CharCode2[CharCode2["Hash"] = 35] = "Hash";
  CharCode2[CharCode2["LowerI"] = 105] = "LowerI";
  CharCode2[CharCode2["LowerS"] = 115] = "LowerS";
  CharCode2[CharCode2["BackSlash"] = 92] = "BackSlash";
  CharCode2[CharCode2["Space"] = 32] = "Space";
  CharCode2[CharCode2["Tab"] = 9] = "Tab";
  CharCode2[CharCode2["NewLine"] = 10] = "NewLine";
  CharCode2[CharCode2["FormFeed"] = 12] = "FormFeed";
  CharCode2[CharCode2["CarriageReturn"] = 13] = "CarriageReturn";
})(CharCode || (CharCode = {}));
var actionTypes = /* @__PURE__ */ new Map([
  [CharCode.Tilde, AttributeAction.Element],
  [CharCode.Circumflex, AttributeAction.Start],
  [CharCode.Dollar, AttributeAction.End],
  [CharCode.Asterisk, AttributeAction.Any],
  [CharCode.ExclamationMark, AttributeAction.Not],
  [CharCode.Pipe, AttributeAction.Hyphen]
]);
var unpackPseudos = /* @__PURE__ */ new Set([
  "has",
  "not",
  "matches",
  "is",
  "where",
  "host",
  "host-context"
]);
var pseudosToPseudoElements = /* @__PURE__ */ new Set([
  "before",
  "after",
  "first-line",
  "first-letter"
]);
function isTraversal(selector) {
  switch (selector.type) {
    case SelectorType.Adjacent:
    case SelectorType.Child:
    case SelectorType.Descendant:
    case SelectorType.Parent:
    case SelectorType.Sibling:
    case SelectorType.ColumnCombinator: {
      return true;
    }
    default: {
      return false;
    }
  }
}
var stripQuotesFromPseudos = /* @__PURE__ */ new Set(["contains", "icontains"]);
function funescape(_, escaped, escapedWhitespace) {
  const high = Number.parseInt(escaped, 16) - 65536;
  return high !== high || escapedWhitespace ? escaped : high < 0 ? (
    // BMP codepoint
    String.fromCharCode(high + 65536)
  ) : (
    // Supplemental Plane codepoint (surrogate pair)
    String.fromCharCode(high >> 10 | 55296, high & 1023 | 56320)
  );
}
function unescapeCSS(cssString) {
  return cssString.replace(reEscape, funescape);
}
function isQuote(c) {
  return c === CharCode.SingleQuote || c === CharCode.DoubleQuote;
}
function isWhitespace(c) {
  return c === CharCode.Space || c === CharCode.Tab || c === CharCode.NewLine || c === CharCode.FormFeed || c === CharCode.CarriageReturn;
}
function parse(selector) {
  const subselects2 = [];
  const endIndex = parseSelector(subselects2, `${selector}`, 0);
  if (endIndex < selector.length) {
    throw new Error(`Unmatched selector: ${selector.slice(endIndex)}`);
  }
  return subselects2;
}
function parseSelector(subselects2, selector, selectorIndex) {
  let tokens = [];
  function getName2(offset) {
    const match = selector.slice(selectorIndex + offset).match(reName);
    if (!match) {
      throw new Error(`Expected name, found ${selector.slice(selectorIndex)}`);
    }
    const [name] = match;
    selectorIndex += offset + name.length;
    return unescapeCSS(name);
  }
  function stripWhitespace(offset) {
    selectorIndex += offset;
    while (selectorIndex < selector.length && isWhitespace(selector.charCodeAt(selectorIndex))) {
      selectorIndex++;
    }
  }
  function readValueWithParenthesis() {
    selectorIndex += 1;
    const start = selectorIndex;
    for (let counter = 1; selectorIndex < selector.length; selectorIndex++) {
      switch (selector.charCodeAt(selectorIndex)) {
        case CharCode.BackSlash: {
          selectorIndex += 1;
          break;
        }
        case CharCode.LeftParenthesis: {
          counter += 1;
          break;
        }
        case CharCode.RightParenthesis: {
          counter -= 1;
          if (counter === 0) {
            return unescapeCSS(selector.slice(start, selectorIndex++));
          }
          break;
        }
      }
    }
    throw new Error("Parenthesis not matched");
  }
  function ensureNotTraversal() {
    if (tokens.length > 0 && isTraversal(tokens[tokens.length - 1])) {
      throw new Error("Did not expect successive traversals.");
    }
  }
  function addTraversal(type) {
    if (tokens.length > 0 && tokens[tokens.length - 1].type === SelectorType.Descendant) {
      tokens[tokens.length - 1].type = type;
      return;
    }
    ensureNotTraversal();
    tokens.push({ type });
  }
  function addSpecialAttribute(name, action) {
    tokens.push({
      type: SelectorType.Attribute,
      name,
      action,
      value: getName2(1),
      namespace: null,
      ignoreCase: "quirks"
    });
  }
  function finalizeSubselector() {
    if (tokens.length > 0 && tokens[tokens.length - 1].type === SelectorType.Descendant) {
      tokens.pop();
    }
    if (tokens.length === 0) {
      throw new Error("Empty sub-selector");
    }
    subselects2.push(tokens);
  }
  stripWhitespace(0);
  if (selector.length === selectorIndex) {
    return selectorIndex;
  }
  loop: while (selectorIndex < selector.length) {
    const firstChar = selector.charCodeAt(selectorIndex);
    switch (firstChar) {
      // Whitespace
      case CharCode.Space:
      case CharCode.Tab:
      case CharCode.NewLine:
      case CharCode.FormFeed:
      case CharCode.CarriageReturn: {
        if (tokens.length === 0 || tokens[0].type !== SelectorType.Descendant) {
          ensureNotTraversal();
          tokens.push({ type: SelectorType.Descendant });
        }
        stripWhitespace(1);
        break;
      }
      // Traversals
      case CharCode.GreaterThan: {
        addTraversal(SelectorType.Child);
        stripWhitespace(1);
        break;
      }
      case CharCode.LessThan: {
        addTraversal(SelectorType.Parent);
        stripWhitespace(1);
        break;
      }
      case CharCode.Tilde: {
        addTraversal(SelectorType.Sibling);
        stripWhitespace(1);
        break;
      }
      case CharCode.Plus: {
        addTraversal(SelectorType.Adjacent);
        stripWhitespace(1);
        break;
      }
      // Special attribute selectors: .class, #id
      case CharCode.Period: {
        addSpecialAttribute("class", AttributeAction.Element);
        break;
      }
      case CharCode.Hash: {
        addSpecialAttribute("id", AttributeAction.Equals);
        break;
      }
      case CharCode.LeftSquareBracket: {
        stripWhitespace(1);
        let name;
        let namespace = null;
        if (selector.charCodeAt(selectorIndex) === CharCode.Pipe) {
          name = getName2(1);
        } else if (selector.startsWith("*|", selectorIndex)) {
          namespace = "*";
          name = getName2(2);
        } else {
          name = getName2(0);
          if (selector.charCodeAt(selectorIndex) === CharCode.Pipe && selector.charCodeAt(selectorIndex + 1) !== CharCode.Equal) {
            namespace = name;
            name = getName2(1);
          }
        }
        stripWhitespace(0);
        let action = AttributeAction.Exists;
        const possibleAction = actionTypes.get(selector.charCodeAt(selectorIndex));
        if (possibleAction) {
          action = possibleAction;
          if (selector.charCodeAt(selectorIndex + 1) !== CharCode.Equal) {
            throw new Error("Expected `=`");
          }
          stripWhitespace(2);
        } else if (selector.charCodeAt(selectorIndex) === CharCode.Equal) {
          action = AttributeAction.Equals;
          stripWhitespace(1);
        }
        let value = "";
        let ignoreCase = null;
        if (action !== "exists") {
          if (isQuote(selector.charCodeAt(selectorIndex))) {
            const quote = selector.charCodeAt(selectorIndex);
            selectorIndex += 1;
            const sectionStart = selectorIndex;
            while (selectorIndex < selector.length && selector.charCodeAt(selectorIndex) !== quote) {
              selectorIndex += // Skip next character if it is escaped
              selector.charCodeAt(selectorIndex) === CharCode.BackSlash ? 2 : 1;
            }
            if (selector.charCodeAt(selectorIndex) !== quote) {
              throw new Error("Attribute value didn't end");
            }
            value = unescapeCSS(selector.slice(sectionStart, selectorIndex));
            selectorIndex += 1;
          } else {
            const valueStart = selectorIndex;
            while (selectorIndex < selector.length && !isWhitespace(selector.charCodeAt(selectorIndex)) && selector.charCodeAt(selectorIndex) !== CharCode.RightSquareBracket) {
              selectorIndex += // Skip next character if it is escaped
              selector.charCodeAt(selectorIndex) === CharCode.BackSlash ? 2 : 1;
            }
            value = unescapeCSS(selector.slice(valueStart, selectorIndex));
          }
          stripWhitespace(0);
          switch (selector.charCodeAt(selectorIndex) | 32) {
            // If the forceIgnore flag is set (either `i` or `s`), use that value
            case CharCode.LowerI: {
              ignoreCase = true;
              stripWhitespace(1);
              break;
            }
            case CharCode.LowerS: {
              ignoreCase = false;
              stripWhitespace(1);
              break;
            }
          }
        }
        if (selector.charCodeAt(selectorIndex) !== CharCode.RightSquareBracket) {
          throw new Error("Attribute selector didn't terminate");
        }
        selectorIndex += 1;
        const attributeSelector = {
          type: SelectorType.Attribute,
          name,
          action,
          value,
          namespace,
          ignoreCase
        };
        tokens.push(attributeSelector);
        break;
      }
      case CharCode.Colon: {
        if (selector.charCodeAt(selectorIndex + 1) === CharCode.Colon) {
          tokens.push({
            type: SelectorType.PseudoElement,
            name: getName2(2).toLowerCase(),
            data: selector.charCodeAt(selectorIndex) === CharCode.LeftParenthesis ? readValueWithParenthesis() : null
          });
          break;
        }
        const name = getName2(1).toLowerCase();
        if (pseudosToPseudoElements.has(name)) {
          tokens.push({
            type: SelectorType.PseudoElement,
            name,
            data: null
          });
          break;
        }
        let data = null;
        if (selector.charCodeAt(selectorIndex) === CharCode.LeftParenthesis) {
          if (unpackPseudos.has(name)) {
            if (isQuote(selector.charCodeAt(selectorIndex + 1))) {
              throw new Error(`Pseudo-selector ${name} cannot be quoted`);
            }
            data = [];
            selectorIndex = parseSelector(data, selector, selectorIndex + 1);
            if (selector.charCodeAt(selectorIndex) !== CharCode.RightParenthesis) {
              throw new Error(`Missing closing parenthesis in :${name} (${selector})`);
            }
            selectorIndex += 1;
          } else {
            data = readValueWithParenthesis();
            if (stripQuotesFromPseudos.has(name)) {
              const quot = data.charCodeAt(0);
              if (quot === data.charCodeAt(data.length - 1) && isQuote(quot)) {
                data = data.slice(1, -1);
              }
            }
            data = unescapeCSS(data);
          }
        }
        tokens.push({ type: SelectorType.Pseudo, name, data });
        break;
      }
      case CharCode.Comma: {
        finalizeSubselector();
        tokens = [];
        stripWhitespace(1);
        break;
      }
      default: {
        if (selector.startsWith("/*", selectorIndex)) {
          const endIndex = selector.indexOf("*/", selectorIndex + 2);
          if (endIndex < 0) {
            throw new Error("Comment was not terminated");
          }
          selectorIndex = endIndex + 2;
          if (tokens.length === 0) {
            stripWhitespace(0);
          }
          break;
        }
        let namespace = null;
        let name;
        if (firstChar === CharCode.Asterisk) {
          selectorIndex += 1;
          name = "*";
        } else if (firstChar === CharCode.Pipe) {
          name = "";
          if (selector.charCodeAt(selectorIndex + 1) === CharCode.Pipe) {
            addTraversal(SelectorType.ColumnCombinator);
            stripWhitespace(2);
            break;
          }
        } else if (reName.test(selector.slice(selectorIndex))) {
          name = getName2(0);
        } else {
          break loop;
        }
        if (selector.charCodeAt(selectorIndex) === CharCode.Pipe && selector.charCodeAt(selectorIndex + 1) !== CharCode.Pipe) {
          namespace = name;
          if (selector.charCodeAt(selectorIndex + 1) === CharCode.Asterisk) {
            name = "*";
            selectorIndex += 2;
          } else {
            name = getName2(1);
          }
        }
        tokens.push(name === "*" ? { type: SelectorType.Universal, namespace } : { type: SelectorType.Tag, name, namespace });
      }
    }
  }
  finalizeSubselector();
  return selectorIndex;
}

// ../english-lint/node_modules/css-what/dist/esm/stringify.js
var attribValueChars = ["\\", '"'];
var pseudoValueChars = [...attribValueChars, "(", ")"];
var charsToEscapeInAttributeValue = new Set(attribValueChars.map((c) => c.charCodeAt(0)));
var charsToEscapeInPseudoValue = new Set(pseudoValueChars.map((c) => c.charCodeAt(0)));
var charsToEscapeInName = new Set([
  ...pseudoValueChars,
  "~",
  "^",
  "$",
  "*",
  "+",
  "!",
  "|",
  ":",
  "[",
  "]",
  " ",
  ".",
  "%"
].map((c) => c.charCodeAt(0)));

// ../english-lint/dist/compile-queries.js
var INDEXED_ATTRIBUTES = /* @__PURE__ */ new Set(["form", "lemma"]);
var DISJUNCTIONS = /* @__PURE__ */ new Set(["matches", "is", "where"]);
var key = (name, value) => `${name}:${value.toLowerCase()}`;
var isDisjunction = (token) => token.type === SelectorType.Pseudo && DISJUNCTIONS.has(token.name) && Array.isArray(token.data) && token.data.length > 0 && typeof token.data[0] !== "string";
var chainLiterals = (chain) => {
  let alternatives = [/* @__PURE__ */ new Set()];
  chain.forEach((token) => {
    if (token.type === SelectorType.Attribute) {
      if (token.action === AttributeAction.Equals && INDEXED_ATTRIBUTES.has(token.name)) {
        alternatives.forEach((alternative) => alternative.add(key(token.name, token.value)));
      }
    } else if (isDisjunction(token)) {
      const branches = token.data.flatMap(chainLiterals);
      if (branches.some((branch) => branch.size === 0)) {
        return;
      }
      alternatives = alternatives.flatMap((alternative) => branches.map((branch) => /* @__PURE__ */ new Set([...alternative, ...branch])));
    }
  });
  return alternatives;
};
var requiredLiterals = (parsed) => parsed.flatMap(chainLiterals).map((alternative) => [...alternative]);
var sentenceLiterals = (tokens) => {
  const present = /* @__PURE__ */ new Set();
  tokens.forEach(({ form, lemma }) => {
    if (form) {
      present.add(key("form", form));
    }
    if (lemma) {
      present.add(key("lemma", lemma));
    }
  });
  return present;
};
var compile_queries_default = (queries2) => {
  const parsed = queries2.map(({ selector }) => parse(selector));
  const required = parsed.map(requiredLiterals);
  const index = /* @__PURE__ */ new Map();
  const always = [];
  required.forEach((alternatives, queryIndex) => {
    if (alternatives.some((alternative) => alternative.length === 0)) {
      always.push(queryIndex);
      return;
    }
    new Set(alternatives.map(([literal]) => literal)).forEach((literal) => {
      const bucket = index.get(literal);
      if (bucket) {
        bucket.push(queryIndex);
      } else {
        index.set(literal, [queryIndex]);
      }
    });
  });
  return { queries: queries2, parsed, required, index, always };
};
var candidates = ({ required, index, always }, tokens) => {
  const present = sentenceLiterals(tokens);
  const possible = new Set(always);
  present.forEach((literal) => index.get(literal)?.forEach((queryIndex) => possible.add(queryIndex)));
  return [...possible].filter((queryIndex) => required[queryIndex].some((alternative) => alternative.every((literal) => present.has(literal)))).sort((a, b) => a - b);
};

// ../english-lint/node_modules/css-select/dist/esm/index.js
var boolbase6 = __toESM(require_boolbase(), 1);

// ../english-lint/node_modules/domutils/lib/esm/index.js
var esm_exports3 = {};
__export(esm_exports3, {
  DocumentPosition: () => DocumentPosition,
  append: () => append,
  appendChild: () => appendChild,
  compareDocumentPosition: () => compareDocumentPosition,
  existsOne: () => existsOne,
  filter: () => filter,
  find: () => find,
  findAll: () => findAll,
  findOne: () => findOne,
  findOneChild: () => findOneChild,
  getAttributeValue: () => getAttributeValue,
  getChildren: () => getChildren,
  getElementById: () => getElementById,
  getElements: () => getElements,
  getElementsByClassName: () => getElementsByClassName,
  getElementsByTagName: () => getElementsByTagName,
  getElementsByTagType: () => getElementsByTagType,
  getFeed: () => getFeed,
  getInnerHTML: () => getInnerHTML,
  getName: () => getName,
  getOuterHTML: () => getOuterHTML,
  getParent: () => getParent,
  getSiblings: () => getSiblings,
  getText: () => getText,
  hasAttrib: () => hasAttrib,
  hasChildren: () => hasChildren,
  innerText: () => innerText,
  isCDATA: () => isCDATA,
  isComment: () => isComment,
  isDocument: () => isDocument,
  isTag: () => isTag2,
  isText: () => isText,
  nextElementSibling: () => nextElementSibling,
  prepend: () => prepend,
  prependChild: () => prependChild,
  prevElementSibling: () => prevElementSibling,
  removeElement: () => removeElement,
  removeSubsets: () => removeSubsets,
  replaceElement: () => replaceElement,
  testElement: () => testElement,
  textContent: () => textContent,
  uniqueSort: () => uniqueSort
});

// ../english-lint/node_modules/domelementtype/lib/esm/index.js
var ElementType;
(function(ElementType2) {
  ElementType2["Root"] = "root";
  ElementType2["Text"] = "text";
  ElementType2["Directive"] = "directive";
  ElementType2["Comment"] = "comment";
  ElementType2["Script"] = "script";
  ElementType2["Style"] = "style";
  ElementType2["Tag"] = "tag";
  ElementType2["CDATA"] = "cdata";
  ElementType2["Doctype"] = "doctype";
})(ElementType || (ElementType = {}));
function isTag(elem) {
  return elem.type === ElementType.Tag || elem.type === ElementType.Script || elem.type === ElementType.Style;
}
var Root = ElementType.Root;
var Text = ElementType.Text;
var Directive = ElementType.Directive;
var Comment = ElementType.Comment;
var Script = ElementType.Script;
var Style = ElementType.Style;
var Tag = ElementType.Tag;
var CDATA = ElementType.CDATA;
var Doctype = ElementType.Doctype;

// ../english-lint/node_modules/domhandler/lib/esm/node.js
function isTag2(node) {
  return isTag(node);
}
function isCDATA(node) {
  return node.type === ElementType.CDATA;
}
function isText(node) {
  return node.type === ElementType.Text;
}
function isComment(node) {
  return node.type === ElementType.Comment;
}
function isDocument(node) {
  return node.type === ElementType.Root;
}
function hasChildren(node) {
  return Object.prototype.hasOwnProperty.call(node, "children");
}

// ../english-lint/node_modules/entities/lib/esm/generated/decode-data-html.js
var decode_data_html_default = new Uint16Array(
  // prettier-ignore
  '\u1D41<\xD5\u0131\u028A\u049D\u057B\u05D0\u0675\u06DE\u07A2\u07D6\u080F\u0A4A\u0A91\u0DA1\u0E6D\u0F09\u0F26\u10CA\u1228\u12E1\u1415\u149D\u14C3\u14DF\u1525\0\0\0\0\0\0\u156B\u16CD\u198D\u1C12\u1DDD\u1F7E\u2060\u21B0\u228D\u23C0\u23FB\u2442\u2824\u2912\u2D08\u2E48\u2FCE\u3016\u32BA\u3639\u37AC\u38FE\u3A28\u3A71\u3AE0\u3B2E\u0800EMabcfglmnoprstu\\bfms\x7F\x84\x8B\x90\x95\x98\xA6\xB3\xB9\xC8\xCFlig\u803B\xC6\u40C6P\u803B&\u4026cute\u803B\xC1\u40C1reve;\u4102\u0100iyx}rc\u803B\xC2\u40C2;\u4410r;\uC000\u{1D504}rave\u803B\xC0\u40C0pha;\u4391acr;\u4100d;\u6A53\u0100gp\x9D\xA1on;\u4104f;\uC000\u{1D538}plyFunction;\u6061ing\u803B\xC5\u40C5\u0100cs\xBE\xC3r;\uC000\u{1D49C}ign;\u6254ilde\u803B\xC3\u40C3ml\u803B\xC4\u40C4\u0400aceforsu\xE5\xFB\xFE\u0117\u011C\u0122\u0127\u012A\u0100cr\xEA\xF2kslash;\u6216\u0176\xF6\xF8;\u6AE7ed;\u6306y;\u4411\u0180crt\u0105\u010B\u0114ause;\u6235noullis;\u612Ca;\u4392r;\uC000\u{1D505}pf;\uC000\u{1D539}eve;\u42D8c\xF2\u0113mpeq;\u624E\u0700HOacdefhilorsu\u014D\u0151\u0156\u0180\u019E\u01A2\u01B5\u01B7\u01BA\u01DC\u0215\u0273\u0278\u027Ecy;\u4427PY\u803B\xA9\u40A9\u0180cpy\u015D\u0162\u017Aute;\u4106\u0100;i\u0167\u0168\u62D2talDifferentialD;\u6145leys;\u612D\u0200aeio\u0189\u018E\u0194\u0198ron;\u410Cdil\u803B\xC7\u40C7rc;\u4108nint;\u6230ot;\u410A\u0100dn\u01A7\u01ADilla;\u40B8terDot;\u40B7\xF2\u017Fi;\u43A7rcle\u0200DMPT\u01C7\u01CB\u01D1\u01D6ot;\u6299inus;\u6296lus;\u6295imes;\u6297o\u0100cs\u01E2\u01F8kwiseContourIntegral;\u6232eCurly\u0100DQ\u0203\u020FoubleQuote;\u601Duote;\u6019\u0200lnpu\u021E\u0228\u0247\u0255on\u0100;e\u0225\u0226\u6237;\u6A74\u0180git\u022F\u0236\u023Aruent;\u6261nt;\u622FourIntegral;\u622E\u0100fr\u024C\u024E;\u6102oduct;\u6210nterClockwiseContourIntegral;\u6233oss;\u6A2Fcr;\uC000\u{1D49E}p\u0100;C\u0284\u0285\u62D3ap;\u624D\u0580DJSZacefios\u02A0\u02AC\u02B0\u02B4\u02B8\u02CB\u02D7\u02E1\u02E6\u0333\u048D\u0100;o\u0179\u02A5trahd;\u6911cy;\u4402cy;\u4405cy;\u440F\u0180grs\u02BF\u02C4\u02C7ger;\u6021r;\u61A1hv;\u6AE4\u0100ay\u02D0\u02D5ron;\u410E;\u4414l\u0100;t\u02DD\u02DE\u6207a;\u4394r;\uC000\u{1D507}\u0100af\u02EB\u0327\u0100cm\u02F0\u0322ritical\u0200ADGT\u0300\u0306\u0316\u031Ccute;\u40B4o\u0174\u030B\u030D;\u42D9bleAcute;\u42DDrave;\u4060ilde;\u42DCond;\u62C4ferentialD;\u6146\u0470\u033D\0\0\0\u0342\u0354\0\u0405f;\uC000\u{1D53B}\u0180;DE\u0348\u0349\u034D\u40A8ot;\u60DCqual;\u6250ble\u0300CDLRUV\u0363\u0372\u0382\u03CF\u03E2\u03F8ontourIntegra\xEC\u0239o\u0274\u0379\0\0\u037B\xBB\u0349nArrow;\u61D3\u0100eo\u0387\u03A4ft\u0180ART\u0390\u0396\u03A1rrow;\u61D0ightArrow;\u61D4e\xE5\u02CAng\u0100LR\u03AB\u03C4eft\u0100AR\u03B3\u03B9rrow;\u67F8ightArrow;\u67FAightArrow;\u67F9ight\u0100AT\u03D8\u03DErrow;\u61D2ee;\u62A8p\u0241\u03E9\0\0\u03EFrrow;\u61D1ownArrow;\u61D5erticalBar;\u6225n\u0300ABLRTa\u0412\u042A\u0430\u045E\u047F\u037Crrow\u0180;BU\u041D\u041E\u0422\u6193ar;\u6913pArrow;\u61F5reve;\u4311eft\u02D2\u043A\0\u0446\0\u0450ightVector;\u6950eeVector;\u695Eector\u0100;B\u0459\u045A\u61BDar;\u6956ight\u01D4\u0467\0\u0471eeVector;\u695Fector\u0100;B\u047A\u047B\u61C1ar;\u6957ee\u0100;A\u0486\u0487\u62A4rrow;\u61A7\u0100ct\u0492\u0497r;\uC000\u{1D49F}rok;\u4110\u0800NTacdfglmopqstux\u04BD\u04C0\u04C4\u04CB\u04DE\u04E2\u04E7\u04EE\u04F5\u0521\u052F\u0536\u0552\u055D\u0560\u0565G;\u414AH\u803B\xD0\u40D0cute\u803B\xC9\u40C9\u0180aiy\u04D2\u04D7\u04DCron;\u411Arc\u803B\xCA\u40CA;\u442Dot;\u4116r;\uC000\u{1D508}rave\u803B\xC8\u40C8ement;\u6208\u0100ap\u04FA\u04FEcr;\u4112ty\u0253\u0506\0\0\u0512mallSquare;\u65FBerySmallSquare;\u65AB\u0100gp\u0526\u052Aon;\u4118f;\uC000\u{1D53C}silon;\u4395u\u0100ai\u053C\u0549l\u0100;T\u0542\u0543\u6A75ilde;\u6242librium;\u61CC\u0100ci\u0557\u055Ar;\u6130m;\u6A73a;\u4397ml\u803B\xCB\u40CB\u0100ip\u056A\u056Fsts;\u6203onentialE;\u6147\u0280cfios\u0585\u0588\u058D\u05B2\u05CCy;\u4424r;\uC000\u{1D509}lled\u0253\u0597\0\0\u05A3mallSquare;\u65FCerySmallSquare;\u65AA\u0370\u05BA\0\u05BF\0\0\u05C4f;\uC000\u{1D53D}All;\u6200riertrf;\u6131c\xF2\u05CB\u0600JTabcdfgorst\u05E8\u05EC\u05EF\u05FA\u0600\u0612\u0616\u061B\u061D\u0623\u066C\u0672cy;\u4403\u803B>\u403Emma\u0100;d\u05F7\u05F8\u4393;\u43DCreve;\u411E\u0180eiy\u0607\u060C\u0610dil;\u4122rc;\u411C;\u4413ot;\u4120r;\uC000\u{1D50A};\u62D9pf;\uC000\u{1D53E}eater\u0300EFGLST\u0635\u0644\u064E\u0656\u065B\u0666qual\u0100;L\u063E\u063F\u6265ess;\u62DBullEqual;\u6267reater;\u6AA2ess;\u6277lantEqual;\u6A7Eilde;\u6273cr;\uC000\u{1D4A2};\u626B\u0400Aacfiosu\u0685\u068B\u0696\u069B\u069E\u06AA\u06BE\u06CARDcy;\u442A\u0100ct\u0690\u0694ek;\u42C7;\u405Eirc;\u4124r;\u610ClbertSpace;\u610B\u01F0\u06AF\0\u06B2f;\u610DizontalLine;\u6500\u0100ct\u06C3\u06C5\xF2\u06A9rok;\u4126mp\u0144\u06D0\u06D8ownHum\xF0\u012Fqual;\u624F\u0700EJOacdfgmnostu\u06FA\u06FE\u0703\u0707\u070E\u071A\u071E\u0721\u0728\u0744\u0778\u078B\u078F\u0795cy;\u4415lig;\u4132cy;\u4401cute\u803B\xCD\u40CD\u0100iy\u0713\u0718rc\u803B\xCE\u40CE;\u4418ot;\u4130r;\u6111rave\u803B\xCC\u40CC\u0180;ap\u0720\u072F\u073F\u0100cg\u0734\u0737r;\u412AinaryI;\u6148lie\xF3\u03DD\u01F4\u0749\0\u0762\u0100;e\u074D\u074E\u622C\u0100gr\u0753\u0758ral;\u622Bsection;\u62C2isible\u0100CT\u076C\u0772omma;\u6063imes;\u6062\u0180gpt\u077F\u0783\u0788on;\u412Ef;\uC000\u{1D540}a;\u4399cr;\u6110ilde;\u4128\u01EB\u079A\0\u079Ecy;\u4406l\u803B\xCF\u40CF\u0280cfosu\u07AC\u07B7\u07BC\u07C2\u07D0\u0100iy\u07B1\u07B5rc;\u4134;\u4419r;\uC000\u{1D50D}pf;\uC000\u{1D541}\u01E3\u07C7\0\u07CCr;\uC000\u{1D4A5}rcy;\u4408kcy;\u4404\u0380HJacfos\u07E4\u07E8\u07EC\u07F1\u07FD\u0802\u0808cy;\u4425cy;\u440Cppa;\u439A\u0100ey\u07F6\u07FBdil;\u4136;\u441Ar;\uC000\u{1D50E}pf;\uC000\u{1D542}cr;\uC000\u{1D4A6}\u0580JTaceflmost\u0825\u0829\u082C\u0850\u0863\u09B3\u09B8\u09C7\u09CD\u0A37\u0A47cy;\u4409\u803B<\u403C\u0280cmnpr\u0837\u083C\u0841\u0844\u084Dute;\u4139bda;\u439Bg;\u67EAlacetrf;\u6112r;\u619E\u0180aey\u0857\u085C\u0861ron;\u413Ddil;\u413B;\u441B\u0100fs\u0868\u0970t\u0500ACDFRTUVar\u087E\u08A9\u08B1\u08E0\u08E6\u08FC\u092F\u095B\u0390\u096A\u0100nr\u0883\u088FgleBracket;\u67E8row\u0180;BR\u0899\u089A\u089E\u6190ar;\u61E4ightArrow;\u61C6eiling;\u6308o\u01F5\u08B7\0\u08C3bleBracket;\u67E6n\u01D4\u08C8\0\u08D2eeVector;\u6961ector\u0100;B\u08DB\u08DC\u61C3ar;\u6959loor;\u630Aight\u0100AV\u08EF\u08F5rrow;\u6194ector;\u694E\u0100er\u0901\u0917e\u0180;AV\u0909\u090A\u0910\u62A3rrow;\u61A4ector;\u695Aiangle\u0180;BE\u0924\u0925\u0929\u62B2ar;\u69CFqual;\u62B4p\u0180DTV\u0937\u0942\u094CownVector;\u6951eeVector;\u6960ector\u0100;B\u0956\u0957\u61BFar;\u6958ector\u0100;B\u0965\u0966\u61BCar;\u6952ight\xE1\u039Cs\u0300EFGLST\u097E\u098B\u0995\u099D\u09A2\u09ADqualGreater;\u62DAullEqual;\u6266reater;\u6276ess;\u6AA1lantEqual;\u6A7Dilde;\u6272r;\uC000\u{1D50F}\u0100;e\u09BD\u09BE\u62D8ftarrow;\u61DAidot;\u413F\u0180npw\u09D4\u0A16\u0A1Bg\u0200LRlr\u09DE\u09F7\u0A02\u0A10eft\u0100AR\u09E6\u09ECrrow;\u67F5ightArrow;\u67F7ightArrow;\u67F6eft\u0100ar\u03B3\u0A0Aight\xE1\u03BFight\xE1\u03CAf;\uC000\u{1D543}er\u0100LR\u0A22\u0A2CeftArrow;\u6199ightArrow;\u6198\u0180cht\u0A3E\u0A40\u0A42\xF2\u084C;\u61B0rok;\u4141;\u626A\u0400acefiosu\u0A5A\u0A5D\u0A60\u0A77\u0A7C\u0A85\u0A8B\u0A8Ep;\u6905y;\u441C\u0100dl\u0A65\u0A6FiumSpace;\u605Flintrf;\u6133r;\uC000\u{1D510}nusPlus;\u6213pf;\uC000\u{1D544}c\xF2\u0A76;\u439C\u0480Jacefostu\u0AA3\u0AA7\u0AAD\u0AC0\u0B14\u0B19\u0D91\u0D97\u0D9Ecy;\u440Acute;\u4143\u0180aey\u0AB4\u0AB9\u0ABEron;\u4147dil;\u4145;\u441D\u0180gsw\u0AC7\u0AF0\u0B0Eative\u0180MTV\u0AD3\u0ADF\u0AE8ediumSpace;\u600Bhi\u0100cn\u0AE6\u0AD8\xEB\u0AD9eryThi\xEE\u0AD9ted\u0100GL\u0AF8\u0B06reaterGreate\xF2\u0673essLes\xF3\u0A48Line;\u400Ar;\uC000\u{1D511}\u0200Bnpt\u0B22\u0B28\u0B37\u0B3Areak;\u6060BreakingSpace;\u40A0f;\u6115\u0680;CDEGHLNPRSTV\u0B55\u0B56\u0B6A\u0B7C\u0BA1\u0BEB\u0C04\u0C5E\u0C84\u0CA6\u0CD8\u0D61\u0D85\u6AEC\u0100ou\u0B5B\u0B64ngruent;\u6262pCap;\u626DoubleVerticalBar;\u6226\u0180lqx\u0B83\u0B8A\u0B9Bement;\u6209ual\u0100;T\u0B92\u0B93\u6260ilde;\uC000\u2242\u0338ists;\u6204reater\u0380;EFGLST\u0BB6\u0BB7\u0BBD\u0BC9\u0BD3\u0BD8\u0BE5\u626Fqual;\u6271ullEqual;\uC000\u2267\u0338reater;\uC000\u226B\u0338ess;\u6279lantEqual;\uC000\u2A7E\u0338ilde;\u6275ump\u0144\u0BF2\u0BFDownHump;\uC000\u224E\u0338qual;\uC000\u224F\u0338e\u0100fs\u0C0A\u0C27tTriangle\u0180;BE\u0C1A\u0C1B\u0C21\u62EAar;\uC000\u29CF\u0338qual;\u62ECs\u0300;EGLST\u0C35\u0C36\u0C3C\u0C44\u0C4B\u0C58\u626Equal;\u6270reater;\u6278ess;\uC000\u226A\u0338lantEqual;\uC000\u2A7D\u0338ilde;\u6274ested\u0100GL\u0C68\u0C79reaterGreater;\uC000\u2AA2\u0338essLess;\uC000\u2AA1\u0338recedes\u0180;ES\u0C92\u0C93\u0C9B\u6280qual;\uC000\u2AAF\u0338lantEqual;\u62E0\u0100ei\u0CAB\u0CB9verseElement;\u620CghtTriangle\u0180;BE\u0CCB\u0CCC\u0CD2\u62EBar;\uC000\u29D0\u0338qual;\u62ED\u0100qu\u0CDD\u0D0CuareSu\u0100bp\u0CE8\u0CF9set\u0100;E\u0CF0\u0CF3\uC000\u228F\u0338qual;\u62E2erset\u0100;E\u0D03\u0D06\uC000\u2290\u0338qual;\u62E3\u0180bcp\u0D13\u0D24\u0D4Eset\u0100;E\u0D1B\u0D1E\uC000\u2282\u20D2qual;\u6288ceeds\u0200;EST\u0D32\u0D33\u0D3B\u0D46\u6281qual;\uC000\u2AB0\u0338lantEqual;\u62E1ilde;\uC000\u227F\u0338erset\u0100;E\u0D58\u0D5B\uC000\u2283\u20D2qual;\u6289ilde\u0200;EFT\u0D6E\u0D6F\u0D75\u0D7F\u6241qual;\u6244ullEqual;\u6247ilde;\u6249erticalBar;\u6224cr;\uC000\u{1D4A9}ilde\u803B\xD1\u40D1;\u439D\u0700Eacdfgmoprstuv\u0DBD\u0DC2\u0DC9\u0DD5\u0DDB\u0DE0\u0DE7\u0DFC\u0E02\u0E20\u0E22\u0E32\u0E3F\u0E44lig;\u4152cute\u803B\xD3\u40D3\u0100iy\u0DCE\u0DD3rc\u803B\xD4\u40D4;\u441Eblac;\u4150r;\uC000\u{1D512}rave\u803B\xD2\u40D2\u0180aei\u0DEE\u0DF2\u0DF6cr;\u414Cga;\u43A9cron;\u439Fpf;\uC000\u{1D546}enCurly\u0100DQ\u0E0E\u0E1AoubleQuote;\u601Cuote;\u6018;\u6A54\u0100cl\u0E27\u0E2Cr;\uC000\u{1D4AA}ash\u803B\xD8\u40D8i\u016C\u0E37\u0E3Cde\u803B\xD5\u40D5es;\u6A37ml\u803B\xD6\u40D6er\u0100BP\u0E4B\u0E60\u0100ar\u0E50\u0E53r;\u603Eac\u0100ek\u0E5A\u0E5C;\u63DEet;\u63B4arenthesis;\u63DC\u0480acfhilors\u0E7F\u0E87\u0E8A\u0E8F\u0E92\u0E94\u0E9D\u0EB0\u0EFCrtialD;\u6202y;\u441Fr;\uC000\u{1D513}i;\u43A6;\u43A0usMinus;\u40B1\u0100ip\u0EA2\u0EADncareplan\xE5\u069Df;\u6119\u0200;eio\u0EB9\u0EBA\u0EE0\u0EE4\u6ABBcedes\u0200;EST\u0EC8\u0EC9\u0ECF\u0EDA\u627Aqual;\u6AAFlantEqual;\u627Cilde;\u627Eme;\u6033\u0100dp\u0EE9\u0EEEuct;\u620Fortion\u0100;a\u0225\u0EF9l;\u621D\u0100ci\u0F01\u0F06r;\uC000\u{1D4AB};\u43A8\u0200Ufos\u0F11\u0F16\u0F1B\u0F1FOT\u803B"\u4022r;\uC000\u{1D514}pf;\u611Acr;\uC000\u{1D4AC}\u0600BEacefhiorsu\u0F3E\u0F43\u0F47\u0F60\u0F73\u0FA7\u0FAA\u0FAD\u1096\u10A9\u10B4\u10BEarr;\u6910G\u803B\xAE\u40AE\u0180cnr\u0F4E\u0F53\u0F56ute;\u4154g;\u67EBr\u0100;t\u0F5C\u0F5D\u61A0l;\u6916\u0180aey\u0F67\u0F6C\u0F71ron;\u4158dil;\u4156;\u4420\u0100;v\u0F78\u0F79\u611Cerse\u0100EU\u0F82\u0F99\u0100lq\u0F87\u0F8Eement;\u620Builibrium;\u61CBpEquilibrium;\u696Fr\xBB\u0F79o;\u43A1ght\u0400ACDFTUVa\u0FC1\u0FEB\u0FF3\u1022\u1028\u105B\u1087\u03D8\u0100nr\u0FC6\u0FD2gleBracket;\u67E9row\u0180;BL\u0FDC\u0FDD\u0FE1\u6192ar;\u61E5eftArrow;\u61C4eiling;\u6309o\u01F5\u0FF9\0\u1005bleBracket;\u67E7n\u01D4\u100A\0\u1014eeVector;\u695Dector\u0100;B\u101D\u101E\u61C2ar;\u6955loor;\u630B\u0100er\u102D\u1043e\u0180;AV\u1035\u1036\u103C\u62A2rrow;\u61A6ector;\u695Biangle\u0180;BE\u1050\u1051\u1055\u62B3ar;\u69D0qual;\u62B5p\u0180DTV\u1063\u106E\u1078ownVector;\u694FeeVector;\u695Cector\u0100;B\u1082\u1083\u61BEar;\u6954ector\u0100;B\u1091\u1092\u61C0ar;\u6953\u0100pu\u109B\u109Ef;\u611DndImplies;\u6970ightarrow;\u61DB\u0100ch\u10B9\u10BCr;\u611B;\u61B1leDelayed;\u69F4\u0680HOacfhimoqstu\u10E4\u10F1\u10F7\u10FD\u1119\u111E\u1151\u1156\u1161\u1167\u11B5\u11BB\u11BF\u0100Cc\u10E9\u10EEHcy;\u4429y;\u4428FTcy;\u442Ccute;\u415A\u0280;aeiy\u1108\u1109\u110E\u1113\u1117\u6ABCron;\u4160dil;\u415Erc;\u415C;\u4421r;\uC000\u{1D516}ort\u0200DLRU\u112A\u1134\u113E\u1149ownArrow\xBB\u041EeftArrow\xBB\u089AightArrow\xBB\u0FDDpArrow;\u6191gma;\u43A3allCircle;\u6218pf;\uC000\u{1D54A}\u0272\u116D\0\0\u1170t;\u621Aare\u0200;ISU\u117B\u117C\u1189\u11AF\u65A1ntersection;\u6293u\u0100bp\u118F\u119Eset\u0100;E\u1197\u1198\u628Fqual;\u6291erset\u0100;E\u11A8\u11A9\u6290qual;\u6292nion;\u6294cr;\uC000\u{1D4AE}ar;\u62C6\u0200bcmp\u11C8\u11DB\u1209\u120B\u0100;s\u11CD\u11CE\u62D0et\u0100;E\u11CD\u11D5qual;\u6286\u0100ch\u11E0\u1205eeds\u0200;EST\u11ED\u11EE\u11F4\u11FF\u627Bqual;\u6AB0lantEqual;\u627Dilde;\u627FTh\xE1\u0F8C;\u6211\u0180;es\u1212\u1213\u1223\u62D1rset\u0100;E\u121C\u121D\u6283qual;\u6287et\xBB\u1213\u0580HRSacfhiors\u123E\u1244\u1249\u1255\u125E\u1271\u1276\u129F\u12C2\u12C8\u12D1ORN\u803B\xDE\u40DEADE;\u6122\u0100Hc\u124E\u1252cy;\u440By;\u4426\u0100bu\u125A\u125C;\u4009;\u43A4\u0180aey\u1265\u126A\u126Fron;\u4164dil;\u4162;\u4422r;\uC000\u{1D517}\u0100ei\u127B\u1289\u01F2\u1280\0\u1287efore;\u6234a;\u4398\u0100cn\u128E\u1298kSpace;\uC000\u205F\u200ASpace;\u6009lde\u0200;EFT\u12AB\u12AC\u12B2\u12BC\u623Cqual;\u6243ullEqual;\u6245ilde;\u6248pf;\uC000\u{1D54B}ipleDot;\u60DB\u0100ct\u12D6\u12DBr;\uC000\u{1D4AF}rok;\u4166\u0AE1\u12F7\u130E\u131A\u1326\0\u132C\u1331\0\0\0\0\0\u1338\u133D\u1377\u1385\0\u13FF\u1404\u140A\u1410\u0100cr\u12FB\u1301ute\u803B\xDA\u40DAr\u0100;o\u1307\u1308\u619Fcir;\u6949r\u01E3\u1313\0\u1316y;\u440Eve;\u416C\u0100iy\u131E\u1323rc\u803B\xDB\u40DB;\u4423blac;\u4170r;\uC000\u{1D518}rave\u803B\xD9\u40D9acr;\u416A\u0100di\u1341\u1369er\u0100BP\u1348\u135D\u0100ar\u134D\u1350r;\u405Fac\u0100ek\u1357\u1359;\u63DFet;\u63B5arenthesis;\u63DDon\u0100;P\u1370\u1371\u62C3lus;\u628E\u0100gp\u137B\u137Fon;\u4172f;\uC000\u{1D54C}\u0400ADETadps\u1395\u13AE\u13B8\u13C4\u03E8\u13D2\u13D7\u13F3rrow\u0180;BD\u1150\u13A0\u13A4ar;\u6912ownArrow;\u61C5ownArrow;\u6195quilibrium;\u696Eee\u0100;A\u13CB\u13CC\u62A5rrow;\u61A5own\xE1\u03F3er\u0100LR\u13DE\u13E8eftArrow;\u6196ightArrow;\u6197i\u0100;l\u13F9\u13FA\u43D2on;\u43A5ing;\u416Ecr;\uC000\u{1D4B0}ilde;\u4168ml\u803B\xDC\u40DC\u0480Dbcdefosv\u1427\u142C\u1430\u1433\u143E\u1485\u148A\u1490\u1496ash;\u62ABar;\u6AEBy;\u4412ash\u0100;l\u143B\u143C\u62A9;\u6AE6\u0100er\u1443\u1445;\u62C1\u0180bty\u144C\u1450\u147Aar;\u6016\u0100;i\u144F\u1455cal\u0200BLST\u1461\u1465\u146A\u1474ar;\u6223ine;\u407Ceparator;\u6758ilde;\u6240ThinSpace;\u600Ar;\uC000\u{1D519}pf;\uC000\u{1D54D}cr;\uC000\u{1D4B1}dash;\u62AA\u0280cefos\u14A7\u14AC\u14B1\u14B6\u14BCirc;\u4174dge;\u62C0r;\uC000\u{1D51A}pf;\uC000\u{1D54E}cr;\uC000\u{1D4B2}\u0200fios\u14CB\u14D0\u14D2\u14D8r;\uC000\u{1D51B};\u439Epf;\uC000\u{1D54F}cr;\uC000\u{1D4B3}\u0480AIUacfosu\u14F1\u14F5\u14F9\u14FD\u1504\u150F\u1514\u151A\u1520cy;\u442Fcy;\u4407cy;\u442Ecute\u803B\xDD\u40DD\u0100iy\u1509\u150Drc;\u4176;\u442Br;\uC000\u{1D51C}pf;\uC000\u{1D550}cr;\uC000\u{1D4B4}ml;\u4178\u0400Hacdefos\u1535\u1539\u153F\u154B\u154F\u155D\u1560\u1564cy;\u4416cute;\u4179\u0100ay\u1544\u1549ron;\u417D;\u4417ot;\u417B\u01F2\u1554\0\u155BoWidt\xE8\u0AD9a;\u4396r;\u6128pf;\u6124cr;\uC000\u{1D4B5}\u0BE1\u1583\u158A\u1590\0\u15B0\u15B6\u15BF\0\0\0\0\u15C6\u15DB\u15EB\u165F\u166D\0\u1695\u169B\u16B2\u16B9\0\u16BEcute\u803B\xE1\u40E1reve;\u4103\u0300;Ediuy\u159C\u159D\u15A1\u15A3\u15A8\u15AD\u623E;\uC000\u223E\u0333;\u623Frc\u803B\xE2\u40E2te\u80BB\xB4\u0306;\u4430lig\u803B\xE6\u40E6\u0100;r\xB2\u15BA;\uC000\u{1D51E}rave\u803B\xE0\u40E0\u0100ep\u15CA\u15D6\u0100fp\u15CF\u15D4sym;\u6135\xE8\u15D3ha;\u43B1\u0100ap\u15DFc\u0100cl\u15E4\u15E7r;\u4101g;\u6A3F\u0264\u15F0\0\0\u160A\u0280;adsv\u15FA\u15FB\u15FF\u1601\u1607\u6227nd;\u6A55;\u6A5Clope;\u6A58;\u6A5A\u0380;elmrsz\u1618\u1619\u161B\u161E\u163F\u164F\u1659\u6220;\u69A4e\xBB\u1619sd\u0100;a\u1625\u1626\u6221\u0461\u1630\u1632\u1634\u1636\u1638\u163A\u163C\u163E;\u69A8;\u69A9;\u69AA;\u69AB;\u69AC;\u69AD;\u69AE;\u69AFt\u0100;v\u1645\u1646\u621Fb\u0100;d\u164C\u164D\u62BE;\u699D\u0100pt\u1654\u1657h;\u6222\xBB\xB9arr;\u637C\u0100gp\u1663\u1667on;\u4105f;\uC000\u{1D552}\u0380;Eaeiop\u12C1\u167B\u167D\u1682\u1684\u1687\u168A;\u6A70cir;\u6A6F;\u624Ad;\u624Bs;\u4027rox\u0100;e\u12C1\u1692\xF1\u1683ing\u803B\xE5\u40E5\u0180cty\u16A1\u16A6\u16A8r;\uC000\u{1D4B6};\u402Amp\u0100;e\u12C1\u16AF\xF1\u0288ilde\u803B\xE3\u40E3ml\u803B\xE4\u40E4\u0100ci\u16C2\u16C8onin\xF4\u0272nt;\u6A11\u0800Nabcdefiklnoprsu\u16ED\u16F1\u1730\u173C\u1743\u1748\u1778\u177D\u17E0\u17E6\u1839\u1850\u170D\u193D\u1948\u1970ot;\u6AED\u0100cr\u16F6\u171Ek\u0200ceps\u1700\u1705\u170D\u1713ong;\u624Cpsilon;\u43F6rime;\u6035im\u0100;e\u171A\u171B\u623Dq;\u62CD\u0176\u1722\u1726ee;\u62BDed\u0100;g\u172C\u172D\u6305e\xBB\u172Drk\u0100;t\u135C\u1737brk;\u63B6\u0100oy\u1701\u1741;\u4431quo;\u601E\u0280cmprt\u1753\u175B\u1761\u1764\u1768aus\u0100;e\u010A\u0109ptyv;\u69B0s\xE9\u170Cno\xF5\u0113\u0180ahw\u176F\u1771\u1773;\u43B2;\u6136een;\u626Cr;\uC000\u{1D51F}g\u0380costuvw\u178D\u179D\u17B3\u17C1\u17D5\u17DB\u17DE\u0180aiu\u1794\u1796\u179A\xF0\u0760rc;\u65EFp\xBB\u1371\u0180dpt\u17A4\u17A8\u17ADot;\u6A00lus;\u6A01imes;\u6A02\u0271\u17B9\0\0\u17BEcup;\u6A06ar;\u6605riangle\u0100du\u17CD\u17D2own;\u65BDp;\u65B3plus;\u6A04e\xE5\u1444\xE5\u14ADarow;\u690D\u0180ako\u17ED\u1826\u1835\u0100cn\u17F2\u1823k\u0180lst\u17FA\u05AB\u1802ozenge;\u69EBriangle\u0200;dlr\u1812\u1813\u1818\u181D\u65B4own;\u65BEeft;\u65C2ight;\u65B8k;\u6423\u01B1\u182B\0\u1833\u01B2\u182F\0\u1831;\u6592;\u65914;\u6593ck;\u6588\u0100eo\u183E\u184D\u0100;q\u1843\u1846\uC000=\u20E5uiv;\uC000\u2261\u20E5t;\u6310\u0200ptwx\u1859\u185E\u1867\u186Cf;\uC000\u{1D553}\u0100;t\u13CB\u1863om\xBB\u13CCtie;\u62C8\u0600DHUVbdhmptuv\u1885\u1896\u18AA\u18BB\u18D7\u18DB\u18EC\u18FF\u1905\u190A\u1910\u1921\u0200LRlr\u188E\u1890\u1892\u1894;\u6557;\u6554;\u6556;\u6553\u0280;DUdu\u18A1\u18A2\u18A4\u18A6\u18A8\u6550;\u6566;\u6569;\u6564;\u6567\u0200LRlr\u18B3\u18B5\u18B7\u18B9;\u655D;\u655A;\u655C;\u6559\u0380;HLRhlr\u18CA\u18CB\u18CD\u18CF\u18D1\u18D3\u18D5\u6551;\u656C;\u6563;\u6560;\u656B;\u6562;\u655Fox;\u69C9\u0200LRlr\u18E4\u18E6\u18E8\u18EA;\u6555;\u6552;\u6510;\u650C\u0280;DUdu\u06BD\u18F7\u18F9\u18FB\u18FD;\u6565;\u6568;\u652C;\u6534inus;\u629Flus;\u629Eimes;\u62A0\u0200LRlr\u1919\u191B\u191D\u191F;\u655B;\u6558;\u6518;\u6514\u0380;HLRhlr\u1930\u1931\u1933\u1935\u1937\u1939\u193B\u6502;\u656A;\u6561;\u655E;\u653C;\u6524;\u651C\u0100ev\u0123\u1942bar\u803B\xA6\u40A6\u0200ceio\u1951\u1956\u195A\u1960r;\uC000\u{1D4B7}mi;\u604Fm\u0100;e\u171A\u171Cl\u0180;bh\u1968\u1969\u196B\u405C;\u69C5sub;\u67C8\u016C\u1974\u197El\u0100;e\u1979\u197A\u6022t\xBB\u197Ap\u0180;Ee\u012F\u1985\u1987;\u6AAE\u0100;q\u06DC\u06DB\u0CE1\u19A7\0\u19E8\u1A11\u1A15\u1A32\0\u1A37\u1A50\0\0\u1AB4\0\0\u1AC1\0\0\u1B21\u1B2E\u1B4D\u1B52\0\u1BFD\0\u1C0C\u0180cpr\u19AD\u19B2\u19DDute;\u4107\u0300;abcds\u19BF\u19C0\u19C4\u19CA\u19D5\u19D9\u6229nd;\u6A44rcup;\u6A49\u0100au\u19CF\u19D2p;\u6A4Bp;\u6A47ot;\u6A40;\uC000\u2229\uFE00\u0100eo\u19E2\u19E5t;\u6041\xEE\u0693\u0200aeiu\u19F0\u19FB\u1A01\u1A05\u01F0\u19F5\0\u19F8s;\u6A4Don;\u410Ddil\u803B\xE7\u40E7rc;\u4109ps\u0100;s\u1A0C\u1A0D\u6A4Cm;\u6A50ot;\u410B\u0180dmn\u1A1B\u1A20\u1A26il\u80BB\xB8\u01ADptyv;\u69B2t\u8100\xA2;e\u1A2D\u1A2E\u40A2r\xE4\u01B2r;\uC000\u{1D520}\u0180cei\u1A3D\u1A40\u1A4Dy;\u4447ck\u0100;m\u1A47\u1A48\u6713ark\xBB\u1A48;\u43C7r\u0380;Ecefms\u1A5F\u1A60\u1A62\u1A6B\u1AA4\u1AAA\u1AAE\u65CB;\u69C3\u0180;el\u1A69\u1A6A\u1A6D\u42C6q;\u6257e\u0261\u1A74\0\0\u1A88rrow\u0100lr\u1A7C\u1A81eft;\u61BAight;\u61BB\u0280RSacd\u1A92\u1A94\u1A96\u1A9A\u1A9F\xBB\u0F47;\u64C8st;\u629Birc;\u629Aash;\u629Dnint;\u6A10id;\u6AEFcir;\u69C2ubs\u0100;u\u1ABB\u1ABC\u6663it\xBB\u1ABC\u02EC\u1AC7\u1AD4\u1AFA\0\u1B0Aon\u0100;e\u1ACD\u1ACE\u403A\u0100;q\xC7\xC6\u026D\u1AD9\0\0\u1AE2a\u0100;t\u1ADE\u1ADF\u402C;\u4040\u0180;fl\u1AE8\u1AE9\u1AEB\u6201\xEE\u1160e\u0100mx\u1AF1\u1AF6ent\xBB\u1AE9e\xF3\u024D\u01E7\u1AFE\0\u1B07\u0100;d\u12BB\u1B02ot;\u6A6Dn\xF4\u0246\u0180fry\u1B10\u1B14\u1B17;\uC000\u{1D554}o\xE4\u0254\u8100\xA9;s\u0155\u1B1Dr;\u6117\u0100ao\u1B25\u1B29rr;\u61B5ss;\u6717\u0100cu\u1B32\u1B37r;\uC000\u{1D4B8}\u0100bp\u1B3C\u1B44\u0100;e\u1B41\u1B42\u6ACF;\u6AD1\u0100;e\u1B49\u1B4A\u6AD0;\u6AD2dot;\u62EF\u0380delprvw\u1B60\u1B6C\u1B77\u1B82\u1BAC\u1BD4\u1BF9arr\u0100lr\u1B68\u1B6A;\u6938;\u6935\u0270\u1B72\0\0\u1B75r;\u62DEc;\u62DFarr\u0100;p\u1B7F\u1B80\u61B6;\u693D\u0300;bcdos\u1B8F\u1B90\u1B96\u1BA1\u1BA5\u1BA8\u622Arcap;\u6A48\u0100au\u1B9B\u1B9Ep;\u6A46p;\u6A4Aot;\u628Dr;\u6A45;\uC000\u222A\uFE00\u0200alrv\u1BB5\u1BBF\u1BDE\u1BE3rr\u0100;m\u1BBC\u1BBD\u61B7;\u693Cy\u0180evw\u1BC7\u1BD4\u1BD8q\u0270\u1BCE\0\0\u1BD2re\xE3\u1B73u\xE3\u1B75ee;\u62CEedge;\u62CFen\u803B\xA4\u40A4earrow\u0100lr\u1BEE\u1BF3eft\xBB\u1B80ight\xBB\u1BBDe\xE4\u1BDD\u0100ci\u1C01\u1C07onin\xF4\u01F7nt;\u6231lcty;\u632D\u0980AHabcdefhijlorstuwz\u1C38\u1C3B\u1C3F\u1C5D\u1C69\u1C75\u1C8A\u1C9E\u1CAC\u1CB7\u1CFB\u1CFF\u1D0D\u1D7B\u1D91\u1DAB\u1DBB\u1DC6\u1DCDr\xF2\u0381ar;\u6965\u0200glrs\u1C48\u1C4D\u1C52\u1C54ger;\u6020eth;\u6138\xF2\u1133h\u0100;v\u1C5A\u1C5B\u6010\xBB\u090A\u016B\u1C61\u1C67arow;\u690Fa\xE3\u0315\u0100ay\u1C6E\u1C73ron;\u410F;\u4434\u0180;ao\u0332\u1C7C\u1C84\u0100gr\u02BF\u1C81r;\u61CAtseq;\u6A77\u0180glm\u1C91\u1C94\u1C98\u803B\xB0\u40B0ta;\u43B4ptyv;\u69B1\u0100ir\u1CA3\u1CA8sht;\u697F;\uC000\u{1D521}ar\u0100lr\u1CB3\u1CB5\xBB\u08DC\xBB\u101E\u0280aegsv\u1CC2\u0378\u1CD6\u1CDC\u1CE0m\u0180;os\u0326\u1CCA\u1CD4nd\u0100;s\u0326\u1CD1uit;\u6666amma;\u43DDin;\u62F2\u0180;io\u1CE7\u1CE8\u1CF8\u40F7de\u8100\xF7;o\u1CE7\u1CF0ntimes;\u62C7n\xF8\u1CF7cy;\u4452c\u026F\u1D06\0\0\u1D0Arn;\u631Eop;\u630D\u0280lptuw\u1D18\u1D1D\u1D22\u1D49\u1D55lar;\u4024f;\uC000\u{1D555}\u0280;emps\u030B\u1D2D\u1D37\u1D3D\u1D42q\u0100;d\u0352\u1D33ot;\u6251inus;\u6238lus;\u6214quare;\u62A1blebarwedg\xE5\xFAn\u0180adh\u112E\u1D5D\u1D67ownarrow\xF3\u1C83arpoon\u0100lr\u1D72\u1D76ef\xF4\u1CB4igh\xF4\u1CB6\u0162\u1D7F\u1D85karo\xF7\u0F42\u026F\u1D8A\0\0\u1D8Ern;\u631Fop;\u630C\u0180cot\u1D98\u1DA3\u1DA6\u0100ry\u1D9D\u1DA1;\uC000\u{1D4B9};\u4455l;\u69F6rok;\u4111\u0100dr\u1DB0\u1DB4ot;\u62F1i\u0100;f\u1DBA\u1816\u65BF\u0100ah\u1DC0\u1DC3r\xF2\u0429a\xF2\u0FA6angle;\u69A6\u0100ci\u1DD2\u1DD5y;\u445Fgrarr;\u67FF\u0900Dacdefglmnopqrstux\u1E01\u1E09\u1E19\u1E38\u0578\u1E3C\u1E49\u1E61\u1E7E\u1EA5\u1EAF\u1EBD\u1EE1\u1F2A\u1F37\u1F44\u1F4E\u1F5A\u0100Do\u1E06\u1D34o\xF4\u1C89\u0100cs\u1E0E\u1E14ute\u803B\xE9\u40E9ter;\u6A6E\u0200aioy\u1E22\u1E27\u1E31\u1E36ron;\u411Br\u0100;c\u1E2D\u1E2E\u6256\u803B\xEA\u40EAlon;\u6255;\u444Dot;\u4117\u0100Dr\u1E41\u1E45ot;\u6252;\uC000\u{1D522}\u0180;rs\u1E50\u1E51\u1E57\u6A9Aave\u803B\xE8\u40E8\u0100;d\u1E5C\u1E5D\u6A96ot;\u6A98\u0200;ils\u1E6A\u1E6B\u1E72\u1E74\u6A99nters;\u63E7;\u6113\u0100;d\u1E79\u1E7A\u6A95ot;\u6A97\u0180aps\u1E85\u1E89\u1E97cr;\u4113ty\u0180;sv\u1E92\u1E93\u1E95\u6205et\xBB\u1E93p\u01001;\u1E9D\u1EA4\u0133\u1EA1\u1EA3;\u6004;\u6005\u6003\u0100gs\u1EAA\u1EAC;\u414Bp;\u6002\u0100gp\u1EB4\u1EB8on;\u4119f;\uC000\u{1D556}\u0180als\u1EC4\u1ECE\u1ED2r\u0100;s\u1ECA\u1ECB\u62D5l;\u69E3us;\u6A71i\u0180;lv\u1EDA\u1EDB\u1EDF\u43B5on\xBB\u1EDB;\u43F5\u0200csuv\u1EEA\u1EF3\u1F0B\u1F23\u0100io\u1EEF\u1E31rc\xBB\u1E2E\u0269\u1EF9\0\0\u1EFB\xED\u0548ant\u0100gl\u1F02\u1F06tr\xBB\u1E5Dess\xBB\u1E7A\u0180aei\u1F12\u1F16\u1F1Als;\u403Dst;\u625Fv\u0100;D\u0235\u1F20D;\u6A78parsl;\u69E5\u0100Da\u1F2F\u1F33ot;\u6253rr;\u6971\u0180cdi\u1F3E\u1F41\u1EF8r;\u612Fo\xF4\u0352\u0100ah\u1F49\u1F4B;\u43B7\u803B\xF0\u40F0\u0100mr\u1F53\u1F57l\u803B\xEB\u40EBo;\u60AC\u0180cip\u1F61\u1F64\u1F67l;\u4021s\xF4\u056E\u0100eo\u1F6C\u1F74ctatio\xEE\u0559nential\xE5\u0579\u09E1\u1F92\0\u1F9E\0\u1FA1\u1FA7\0\0\u1FC6\u1FCC\0\u1FD3\0\u1FE6\u1FEA\u2000\0\u2008\u205Allingdotse\xF1\u1E44y;\u4444male;\u6640\u0180ilr\u1FAD\u1FB3\u1FC1lig;\u8000\uFB03\u0269\u1FB9\0\0\u1FBDg;\u8000\uFB00ig;\u8000\uFB04;\uC000\u{1D523}lig;\u8000\uFB01lig;\uC000fj\u0180alt\u1FD9\u1FDC\u1FE1t;\u666Dig;\u8000\uFB02ns;\u65B1of;\u4192\u01F0\u1FEE\0\u1FF3f;\uC000\u{1D557}\u0100ak\u05BF\u1FF7\u0100;v\u1FFC\u1FFD\u62D4;\u6AD9artint;\u6A0D\u0100ao\u200C\u2055\u0100cs\u2011\u2052\u03B1\u201A\u2030\u2038\u2045\u2048\0\u2050\u03B2\u2022\u2025\u2027\u202A\u202C\0\u202E\u803B\xBD\u40BD;\u6153\u803B\xBC\u40BC;\u6155;\u6159;\u615B\u01B3\u2034\0\u2036;\u6154;\u6156\u02B4\u203E\u2041\0\0\u2043\u803B\xBE\u40BE;\u6157;\u615C5;\u6158\u01B6\u204C\0\u204E;\u615A;\u615D8;\u615El;\u6044wn;\u6322cr;\uC000\u{1D4BB}\u0880Eabcdefgijlnorstv\u2082\u2089\u209F\u20A5\u20B0\u20B4\u20F0\u20F5\u20FA\u20FF\u2103\u2112\u2138\u0317\u213E\u2152\u219E\u0100;l\u064D\u2087;\u6A8C\u0180cmp\u2090\u2095\u209Dute;\u41F5ma\u0100;d\u209C\u1CDA\u43B3;\u6A86reve;\u411F\u0100iy\u20AA\u20AErc;\u411D;\u4433ot;\u4121\u0200;lqs\u063E\u0642\u20BD\u20C9\u0180;qs\u063E\u064C\u20C4lan\xF4\u0665\u0200;cdl\u0665\u20D2\u20D5\u20E5c;\u6AA9ot\u0100;o\u20DC\u20DD\u6A80\u0100;l\u20E2\u20E3\u6A82;\u6A84\u0100;e\u20EA\u20ED\uC000\u22DB\uFE00s;\u6A94r;\uC000\u{1D524}\u0100;g\u0673\u061Bmel;\u6137cy;\u4453\u0200;Eaj\u065A\u210C\u210E\u2110;\u6A92;\u6AA5;\u6AA4\u0200Eaes\u211B\u211D\u2129\u2134;\u6269p\u0100;p\u2123\u2124\u6A8Arox\xBB\u2124\u0100;q\u212E\u212F\u6A88\u0100;q\u212E\u211Bim;\u62E7pf;\uC000\u{1D558}\u0100ci\u2143\u2146r;\u610Am\u0180;el\u066B\u214E\u2150;\u6A8E;\u6A90\u8300>;cdlqr\u05EE\u2160\u216A\u216E\u2173\u2179\u0100ci\u2165\u2167;\u6AA7r;\u6A7Aot;\u62D7Par;\u6995uest;\u6A7C\u0280adels\u2184\u216A\u2190\u0656\u219B\u01F0\u2189\0\u218Epro\xF8\u209Er;\u6978q\u0100lq\u063F\u2196les\xF3\u2088i\xED\u066B\u0100en\u21A3\u21ADrtneqq;\uC000\u2269\uFE00\xC5\u21AA\u0500Aabcefkosy\u21C4\u21C7\u21F1\u21F5\u21FA\u2218\u221D\u222F\u2268\u227Dr\xF2\u03A0\u0200ilmr\u21D0\u21D4\u21D7\u21DBrs\xF0\u1484f\xBB\u2024il\xF4\u06A9\u0100dr\u21E0\u21E4cy;\u444A\u0180;cw\u08F4\u21EB\u21EFir;\u6948;\u61ADar;\u610Firc;\u4125\u0180alr\u2201\u220E\u2213rts\u0100;u\u2209\u220A\u6665it\xBB\u220Alip;\u6026con;\u62B9r;\uC000\u{1D525}s\u0100ew\u2223\u2229arow;\u6925arow;\u6926\u0280amopr\u223A\u223E\u2243\u225E\u2263rr;\u61FFtht;\u623Bk\u0100lr\u2249\u2253eftarrow;\u61A9ightarrow;\u61AAf;\uC000\u{1D559}bar;\u6015\u0180clt\u226F\u2274\u2278r;\uC000\u{1D4BD}as\xE8\u21F4rok;\u4127\u0100bp\u2282\u2287ull;\u6043hen\xBB\u1C5B\u0AE1\u22A3\0\u22AA\0\u22B8\u22C5\u22CE\0\u22D5\u22F3\0\0\u22F8\u2322\u2367\u2362\u237F\0\u2386\u23AA\u23B4cute\u803B\xED\u40ED\u0180;iy\u0771\u22B0\u22B5rc\u803B\xEE\u40EE;\u4438\u0100cx\u22BC\u22BFy;\u4435cl\u803B\xA1\u40A1\u0100fr\u039F\u22C9;\uC000\u{1D526}rave\u803B\xEC\u40EC\u0200;ino\u073E\u22DD\u22E9\u22EE\u0100in\u22E2\u22E6nt;\u6A0Ct;\u622Dfin;\u69DCta;\u6129lig;\u4133\u0180aop\u22FE\u231A\u231D\u0180cgt\u2305\u2308\u2317r;\u412B\u0180elp\u071F\u230F\u2313in\xE5\u078Ear\xF4\u0720h;\u4131f;\u62B7ed;\u41B5\u0280;cfot\u04F4\u232C\u2331\u233D\u2341are;\u6105in\u0100;t\u2338\u2339\u621Eie;\u69DDdo\xF4\u2319\u0280;celp\u0757\u234C\u2350\u235B\u2361al;\u62BA\u0100gr\u2355\u2359er\xF3\u1563\xE3\u234Darhk;\u6A17rod;\u6A3C\u0200cgpt\u236F\u2372\u2376\u237By;\u4451on;\u412Ff;\uC000\u{1D55A}a;\u43B9uest\u803B\xBF\u40BF\u0100ci\u238A\u238Fr;\uC000\u{1D4BE}n\u0280;Edsv\u04F4\u239B\u239D\u23A1\u04F3;\u62F9ot;\u62F5\u0100;v\u23A6\u23A7\u62F4;\u62F3\u0100;i\u0777\u23AElde;\u4129\u01EB\u23B8\0\u23BCcy;\u4456l\u803B\xEF\u40EF\u0300cfmosu\u23CC\u23D7\u23DC\u23E1\u23E7\u23F5\u0100iy\u23D1\u23D5rc;\u4135;\u4439r;\uC000\u{1D527}ath;\u4237pf;\uC000\u{1D55B}\u01E3\u23EC\0\u23F1r;\uC000\u{1D4BF}rcy;\u4458kcy;\u4454\u0400acfghjos\u240B\u2416\u2422\u2427\u242D\u2431\u2435\u243Bppa\u0100;v\u2413\u2414\u43BA;\u43F0\u0100ey\u241B\u2420dil;\u4137;\u443Ar;\uC000\u{1D528}reen;\u4138cy;\u4445cy;\u445Cpf;\uC000\u{1D55C}cr;\uC000\u{1D4C0}\u0B80ABEHabcdefghjlmnoprstuv\u2470\u2481\u2486\u248D\u2491\u250E\u253D\u255A\u2580\u264E\u265E\u2665\u2679\u267D\u269A\u26B2\u26D8\u275D\u2768\u278B\u27C0\u2801\u2812\u0180art\u2477\u247A\u247Cr\xF2\u09C6\xF2\u0395ail;\u691Barr;\u690E\u0100;g\u0994\u248B;\u6A8Bar;\u6962\u0963\u24A5\0\u24AA\0\u24B1\0\0\0\0\0\u24B5\u24BA\0\u24C6\u24C8\u24CD\0\u24F9ute;\u413Amptyv;\u69B4ra\xEE\u084Cbda;\u43BBg\u0180;dl\u088E\u24C1\u24C3;\u6991\xE5\u088E;\u6A85uo\u803B\xAB\u40ABr\u0400;bfhlpst\u0899\u24DE\u24E6\u24E9\u24EB\u24EE\u24F1\u24F5\u0100;f\u089D\u24E3s;\u691Fs;\u691D\xEB\u2252p;\u61ABl;\u6939im;\u6973l;\u61A2\u0180;ae\u24FF\u2500\u2504\u6AABil;\u6919\u0100;s\u2509\u250A\u6AAD;\uC000\u2AAD\uFE00\u0180abr\u2515\u2519\u251Drr;\u690Crk;\u6772\u0100ak\u2522\u252Cc\u0100ek\u2528\u252A;\u407B;\u405B\u0100es\u2531\u2533;\u698Bl\u0100du\u2539\u253B;\u698F;\u698D\u0200aeuy\u2546\u254B\u2556\u2558ron;\u413E\u0100di\u2550\u2554il;\u413C\xEC\u08B0\xE2\u2529;\u443B\u0200cqrs\u2563\u2566\u256D\u257Da;\u6936uo\u0100;r\u0E19\u1746\u0100du\u2572\u2577har;\u6967shar;\u694Bh;\u61B2\u0280;fgqs\u258B\u258C\u0989\u25F3\u25FF\u6264t\u0280ahlrt\u2598\u25A4\u25B7\u25C2\u25E8rrow\u0100;t\u0899\u25A1a\xE9\u24F6arpoon\u0100du\u25AF\u25B4own\xBB\u045Ap\xBB\u0966eftarrows;\u61C7ight\u0180ahs\u25CD\u25D6\u25DErrow\u0100;s\u08F4\u08A7arpoon\xF3\u0F98quigarro\xF7\u21F0hreetimes;\u62CB\u0180;qs\u258B\u0993\u25FAlan\xF4\u09AC\u0280;cdgs\u09AC\u260A\u260D\u261D\u2628c;\u6AA8ot\u0100;o\u2614\u2615\u6A7F\u0100;r\u261A\u261B\u6A81;\u6A83\u0100;e\u2622\u2625\uC000\u22DA\uFE00s;\u6A93\u0280adegs\u2633\u2639\u263D\u2649\u264Bppro\xF8\u24C6ot;\u62D6q\u0100gq\u2643\u2645\xF4\u0989gt\xF2\u248C\xF4\u099Bi\xED\u09B2\u0180ilr\u2655\u08E1\u265Asht;\u697C;\uC000\u{1D529}\u0100;E\u099C\u2663;\u6A91\u0161\u2669\u2676r\u0100du\u25B2\u266E\u0100;l\u0965\u2673;\u696Alk;\u6584cy;\u4459\u0280;acht\u0A48\u2688\u268B\u2691\u2696r\xF2\u25C1orne\xF2\u1D08ard;\u696Bri;\u65FA\u0100io\u269F\u26A4dot;\u4140ust\u0100;a\u26AC\u26AD\u63B0che\xBB\u26AD\u0200Eaes\u26BB\u26BD\u26C9\u26D4;\u6268p\u0100;p\u26C3\u26C4\u6A89rox\xBB\u26C4\u0100;q\u26CE\u26CF\u6A87\u0100;q\u26CE\u26BBim;\u62E6\u0400abnoptwz\u26E9\u26F4\u26F7\u271A\u272F\u2741\u2747\u2750\u0100nr\u26EE\u26F1g;\u67ECr;\u61FDr\xEB\u08C1g\u0180lmr\u26FF\u270D\u2714eft\u0100ar\u09E6\u2707ight\xE1\u09F2apsto;\u67FCight\xE1\u09FDparrow\u0100lr\u2725\u2729ef\xF4\u24EDight;\u61AC\u0180afl\u2736\u2739\u273Dr;\u6985;\uC000\u{1D55D}us;\u6A2Dimes;\u6A34\u0161\u274B\u274Fst;\u6217\xE1\u134E\u0180;ef\u2757\u2758\u1800\u65CAnge\xBB\u2758ar\u0100;l\u2764\u2765\u4028t;\u6993\u0280achmt\u2773\u2776\u277C\u2785\u2787r\xF2\u08A8orne\xF2\u1D8Car\u0100;d\u0F98\u2783;\u696D;\u600Eri;\u62BF\u0300achiqt\u2798\u279D\u0A40\u27A2\u27AE\u27BBquo;\u6039r;\uC000\u{1D4C1}m\u0180;eg\u09B2\u27AA\u27AC;\u6A8D;\u6A8F\u0100bu\u252A\u27B3o\u0100;r\u0E1F\u27B9;\u601Arok;\u4142\u8400<;cdhilqr\u082B\u27D2\u2639\u27DC\u27E0\u27E5\u27EA\u27F0\u0100ci\u27D7\u27D9;\u6AA6r;\u6A79re\xE5\u25F2mes;\u62C9arr;\u6976uest;\u6A7B\u0100Pi\u27F5\u27F9ar;\u6996\u0180;ef\u2800\u092D\u181B\u65C3r\u0100du\u2807\u280Dshar;\u694Ahar;\u6966\u0100en\u2817\u2821rtneqq;\uC000\u2268\uFE00\xC5\u281E\u0700Dacdefhilnopsu\u2840\u2845\u2882\u288E\u2893\u28A0\u28A5\u28A8\u28DA\u28E2\u28E4\u0A83\u28F3\u2902Dot;\u623A\u0200clpr\u284E\u2852\u2863\u287Dr\u803B\xAF\u40AF\u0100et\u2857\u2859;\u6642\u0100;e\u285E\u285F\u6720se\xBB\u285F\u0100;s\u103B\u2868to\u0200;dlu\u103B\u2873\u2877\u287Bow\xEE\u048Cef\xF4\u090F\xF0\u13D1ker;\u65AE\u0100oy\u2887\u288Cmma;\u6A29;\u443Cash;\u6014asuredangle\xBB\u1626r;\uC000\u{1D52A}o;\u6127\u0180cdn\u28AF\u28B4\u28C9ro\u803B\xB5\u40B5\u0200;acd\u1464\u28BD\u28C0\u28C4s\xF4\u16A7ir;\u6AF0ot\u80BB\xB7\u01B5us\u0180;bd\u28D2\u1903\u28D3\u6212\u0100;u\u1D3C\u28D8;\u6A2A\u0163\u28DE\u28E1p;\u6ADB\xF2\u2212\xF0\u0A81\u0100dp\u28E9\u28EEels;\u62A7f;\uC000\u{1D55E}\u0100ct\u28F8\u28FDr;\uC000\u{1D4C2}pos\xBB\u159D\u0180;lm\u2909\u290A\u290D\u43BCtimap;\u62B8\u0C00GLRVabcdefghijlmoprstuvw\u2942\u2953\u297E\u2989\u2998\u29DA\u29E9\u2A15\u2A1A\u2A58\u2A5D\u2A83\u2A95\u2AA4\u2AA8\u2B04\u2B07\u2B44\u2B7F\u2BAE\u2C34\u2C67\u2C7C\u2CE9\u0100gt\u2947\u294B;\uC000\u22D9\u0338\u0100;v\u2950\u0BCF\uC000\u226B\u20D2\u0180elt\u295A\u2972\u2976ft\u0100ar\u2961\u2967rrow;\u61CDightarrow;\u61CE;\uC000\u22D8\u0338\u0100;v\u297B\u0C47\uC000\u226A\u20D2ightarrow;\u61CF\u0100Dd\u298E\u2993ash;\u62AFash;\u62AE\u0280bcnpt\u29A3\u29A7\u29AC\u29B1\u29CCla\xBB\u02DEute;\u4144g;\uC000\u2220\u20D2\u0280;Eiop\u0D84\u29BC\u29C0\u29C5\u29C8;\uC000\u2A70\u0338d;\uC000\u224B\u0338s;\u4149ro\xF8\u0D84ur\u0100;a\u29D3\u29D4\u666El\u0100;s\u29D3\u0B38\u01F3\u29DF\0\u29E3p\u80BB\xA0\u0B37mp\u0100;e\u0BF9\u0C00\u0280aeouy\u29F4\u29FE\u2A03\u2A10\u2A13\u01F0\u29F9\0\u29FB;\u6A43on;\u4148dil;\u4146ng\u0100;d\u0D7E\u2A0Aot;\uC000\u2A6D\u0338p;\u6A42;\u443Dash;\u6013\u0380;Aadqsx\u0B92\u2A29\u2A2D\u2A3B\u2A41\u2A45\u2A50rr;\u61D7r\u0100hr\u2A33\u2A36k;\u6924\u0100;o\u13F2\u13F0ot;\uC000\u2250\u0338ui\xF6\u0B63\u0100ei\u2A4A\u2A4Ear;\u6928\xED\u0B98ist\u0100;s\u0BA0\u0B9Fr;\uC000\u{1D52B}\u0200Eest\u0BC5\u2A66\u2A79\u2A7C\u0180;qs\u0BBC\u2A6D\u0BE1\u0180;qs\u0BBC\u0BC5\u2A74lan\xF4\u0BE2i\xED\u0BEA\u0100;r\u0BB6\u2A81\xBB\u0BB7\u0180Aap\u2A8A\u2A8D\u2A91r\xF2\u2971rr;\u61AEar;\u6AF2\u0180;sv\u0F8D\u2A9C\u0F8C\u0100;d\u2AA1\u2AA2\u62FC;\u62FAcy;\u445A\u0380AEadest\u2AB7\u2ABA\u2ABE\u2AC2\u2AC5\u2AF6\u2AF9r\xF2\u2966;\uC000\u2266\u0338rr;\u619Ar;\u6025\u0200;fqs\u0C3B\u2ACE\u2AE3\u2AEFt\u0100ar\u2AD4\u2AD9rro\xF7\u2AC1ightarro\xF7\u2A90\u0180;qs\u0C3B\u2ABA\u2AEAlan\xF4\u0C55\u0100;s\u0C55\u2AF4\xBB\u0C36i\xED\u0C5D\u0100;r\u0C35\u2AFEi\u0100;e\u0C1A\u0C25i\xE4\u0D90\u0100pt\u2B0C\u2B11f;\uC000\u{1D55F}\u8180\xAC;in\u2B19\u2B1A\u2B36\u40ACn\u0200;Edv\u0B89\u2B24\u2B28\u2B2E;\uC000\u22F9\u0338ot;\uC000\u22F5\u0338\u01E1\u0B89\u2B33\u2B35;\u62F7;\u62F6i\u0100;v\u0CB8\u2B3C\u01E1\u0CB8\u2B41\u2B43;\u62FE;\u62FD\u0180aor\u2B4B\u2B63\u2B69r\u0200;ast\u0B7B\u2B55\u2B5A\u2B5Flle\xEC\u0B7Bl;\uC000\u2AFD\u20E5;\uC000\u2202\u0338lint;\u6A14\u0180;ce\u0C92\u2B70\u2B73u\xE5\u0CA5\u0100;c\u0C98\u2B78\u0100;e\u0C92\u2B7D\xF1\u0C98\u0200Aait\u2B88\u2B8B\u2B9D\u2BA7r\xF2\u2988rr\u0180;cw\u2B94\u2B95\u2B99\u619B;\uC000\u2933\u0338;\uC000\u219D\u0338ghtarrow\xBB\u2B95ri\u0100;e\u0CCB\u0CD6\u0380chimpqu\u2BBD\u2BCD\u2BD9\u2B04\u0B78\u2BE4\u2BEF\u0200;cer\u0D32\u2BC6\u0D37\u2BC9u\xE5\u0D45;\uC000\u{1D4C3}ort\u026D\u2B05\0\0\u2BD6ar\xE1\u2B56m\u0100;e\u0D6E\u2BDF\u0100;q\u0D74\u0D73su\u0100bp\u2BEB\u2BED\xE5\u0CF8\xE5\u0D0B\u0180bcp\u2BF6\u2C11\u2C19\u0200;Ees\u2BFF\u2C00\u0D22\u2C04\u6284;\uC000\u2AC5\u0338et\u0100;e\u0D1B\u2C0Bq\u0100;q\u0D23\u2C00c\u0100;e\u0D32\u2C17\xF1\u0D38\u0200;Ees\u2C22\u2C23\u0D5F\u2C27\u6285;\uC000\u2AC6\u0338et\u0100;e\u0D58\u2C2Eq\u0100;q\u0D60\u2C23\u0200gilr\u2C3D\u2C3F\u2C45\u2C47\xEC\u0BD7lde\u803B\xF1\u40F1\xE7\u0C43iangle\u0100lr\u2C52\u2C5Ceft\u0100;e\u0C1A\u2C5A\xF1\u0C26ight\u0100;e\u0CCB\u2C65\xF1\u0CD7\u0100;m\u2C6C\u2C6D\u43BD\u0180;es\u2C74\u2C75\u2C79\u4023ro;\u6116p;\u6007\u0480DHadgilrs\u2C8F\u2C94\u2C99\u2C9E\u2CA3\u2CB0\u2CB6\u2CD3\u2CE3ash;\u62ADarr;\u6904p;\uC000\u224D\u20D2ash;\u62AC\u0100et\u2CA8\u2CAC;\uC000\u2265\u20D2;\uC000>\u20D2nfin;\u69DE\u0180Aet\u2CBD\u2CC1\u2CC5rr;\u6902;\uC000\u2264\u20D2\u0100;r\u2CCA\u2CCD\uC000<\u20D2ie;\uC000\u22B4\u20D2\u0100At\u2CD8\u2CDCrr;\u6903rie;\uC000\u22B5\u20D2im;\uC000\u223C\u20D2\u0180Aan\u2CF0\u2CF4\u2D02rr;\u61D6r\u0100hr\u2CFA\u2CFDk;\u6923\u0100;o\u13E7\u13E5ear;\u6927\u1253\u1A95\0\0\0\0\0\0\0\0\0\0\0\0\0\u2D2D\0\u2D38\u2D48\u2D60\u2D65\u2D72\u2D84\u1B07\0\0\u2D8D\u2DAB\0\u2DC8\u2DCE\0\u2DDC\u2E19\u2E2B\u2E3E\u2E43\u0100cs\u2D31\u1A97ute\u803B\xF3\u40F3\u0100iy\u2D3C\u2D45r\u0100;c\u1A9E\u2D42\u803B\xF4\u40F4;\u443E\u0280abios\u1AA0\u2D52\u2D57\u01C8\u2D5Alac;\u4151v;\u6A38old;\u69BClig;\u4153\u0100cr\u2D69\u2D6Dir;\u69BF;\uC000\u{1D52C}\u036F\u2D79\0\0\u2D7C\0\u2D82n;\u42DBave\u803B\xF2\u40F2;\u69C1\u0100bm\u2D88\u0DF4ar;\u69B5\u0200acit\u2D95\u2D98\u2DA5\u2DA8r\xF2\u1A80\u0100ir\u2D9D\u2DA0r;\u69BEoss;\u69BBn\xE5\u0E52;\u69C0\u0180aei\u2DB1\u2DB5\u2DB9cr;\u414Dga;\u43C9\u0180cdn\u2DC0\u2DC5\u01CDron;\u43BF;\u69B6pf;\uC000\u{1D560}\u0180ael\u2DD4\u2DD7\u01D2r;\u69B7rp;\u69B9\u0380;adiosv\u2DEA\u2DEB\u2DEE\u2E08\u2E0D\u2E10\u2E16\u6228r\xF2\u1A86\u0200;efm\u2DF7\u2DF8\u2E02\u2E05\u6A5Dr\u0100;o\u2DFE\u2DFF\u6134f\xBB\u2DFF\u803B\xAA\u40AA\u803B\xBA\u40BAgof;\u62B6r;\u6A56lope;\u6A57;\u6A5B\u0180clo\u2E1F\u2E21\u2E27\xF2\u2E01ash\u803B\xF8\u40F8l;\u6298i\u016C\u2E2F\u2E34de\u803B\xF5\u40F5es\u0100;a\u01DB\u2E3As;\u6A36ml\u803B\xF6\u40F6bar;\u633D\u0AE1\u2E5E\0\u2E7D\0\u2E80\u2E9D\0\u2EA2\u2EB9\0\0\u2ECB\u0E9C\0\u2F13\0\0\u2F2B\u2FBC\0\u2FC8r\u0200;ast\u0403\u2E67\u2E72\u0E85\u8100\xB6;l\u2E6D\u2E6E\u40B6le\xEC\u0403\u0269\u2E78\0\0\u2E7Bm;\u6AF3;\u6AFDy;\u443Fr\u0280cimpt\u2E8B\u2E8F\u2E93\u1865\u2E97nt;\u4025od;\u402Eil;\u6030enk;\u6031r;\uC000\u{1D52D}\u0180imo\u2EA8\u2EB0\u2EB4\u0100;v\u2EAD\u2EAE\u43C6;\u43D5ma\xF4\u0A76ne;\u660E\u0180;tv\u2EBF\u2EC0\u2EC8\u43C0chfork\xBB\u1FFD;\u43D6\u0100au\u2ECF\u2EDFn\u0100ck\u2ED5\u2EDDk\u0100;h\u21F4\u2EDB;\u610E\xF6\u21F4s\u0480;abcdemst\u2EF3\u2EF4\u1908\u2EF9\u2EFD\u2F04\u2F06\u2F0A\u2F0E\u402Bcir;\u6A23ir;\u6A22\u0100ou\u1D40\u2F02;\u6A25;\u6A72n\u80BB\xB1\u0E9Dim;\u6A26wo;\u6A27\u0180ipu\u2F19\u2F20\u2F25ntint;\u6A15f;\uC000\u{1D561}nd\u803B\xA3\u40A3\u0500;Eaceinosu\u0EC8\u2F3F\u2F41\u2F44\u2F47\u2F81\u2F89\u2F92\u2F7E\u2FB6;\u6AB3p;\u6AB7u\xE5\u0ED9\u0100;c\u0ECE\u2F4C\u0300;acens\u0EC8\u2F59\u2F5F\u2F66\u2F68\u2F7Eppro\xF8\u2F43urlye\xF1\u0ED9\xF1\u0ECE\u0180aes\u2F6F\u2F76\u2F7Approx;\u6AB9qq;\u6AB5im;\u62E8i\xED\u0EDFme\u0100;s\u2F88\u0EAE\u6032\u0180Eas\u2F78\u2F90\u2F7A\xF0\u2F75\u0180dfp\u0EEC\u2F99\u2FAF\u0180als\u2FA0\u2FA5\u2FAAlar;\u632Eine;\u6312urf;\u6313\u0100;t\u0EFB\u2FB4\xEF\u0EFBrel;\u62B0\u0100ci\u2FC0\u2FC5r;\uC000\u{1D4C5};\u43C8ncsp;\u6008\u0300fiopsu\u2FDA\u22E2\u2FDF\u2FE5\u2FEB\u2FF1r;\uC000\u{1D52E}pf;\uC000\u{1D562}rime;\u6057cr;\uC000\u{1D4C6}\u0180aeo\u2FF8\u3009\u3013t\u0100ei\u2FFE\u3005rnion\xF3\u06B0nt;\u6A16st\u0100;e\u3010\u3011\u403F\xF1\u1F19\xF4\u0F14\u0A80ABHabcdefhilmnoprstux\u3040\u3051\u3055\u3059\u30E0\u310E\u312B\u3147\u3162\u3172\u318E\u3206\u3215\u3224\u3229\u3258\u326E\u3272\u3290\u32B0\u32B7\u0180art\u3047\u304A\u304Cr\xF2\u10B3\xF2\u03DDail;\u691Car\xF2\u1C65ar;\u6964\u0380cdenqrt\u3068\u3075\u3078\u307F\u308F\u3094\u30CC\u0100eu\u306D\u3071;\uC000\u223D\u0331te;\u4155i\xE3\u116Emptyv;\u69B3g\u0200;del\u0FD1\u3089\u308B\u308D;\u6992;\u69A5\xE5\u0FD1uo\u803B\xBB\u40BBr\u0580;abcfhlpstw\u0FDC\u30AC\u30AF\u30B7\u30B9\u30BC\u30BE\u30C0\u30C3\u30C7\u30CAp;\u6975\u0100;f\u0FE0\u30B4s;\u6920;\u6933s;\u691E\xEB\u225D\xF0\u272El;\u6945im;\u6974l;\u61A3;\u619D\u0100ai\u30D1\u30D5il;\u691Ao\u0100;n\u30DB\u30DC\u6236al\xF3\u0F1E\u0180abr\u30E7\u30EA\u30EEr\xF2\u17E5rk;\u6773\u0100ak\u30F3\u30FDc\u0100ek\u30F9\u30FB;\u407D;\u405D\u0100es\u3102\u3104;\u698Cl\u0100du\u310A\u310C;\u698E;\u6990\u0200aeuy\u3117\u311C\u3127\u3129ron;\u4159\u0100di\u3121\u3125il;\u4157\xEC\u0FF2\xE2\u30FA;\u4440\u0200clqs\u3134\u3137\u313D\u3144a;\u6937dhar;\u6969uo\u0100;r\u020E\u020Dh;\u61B3\u0180acg\u314E\u315F\u0F44l\u0200;ips\u0F78\u3158\u315B\u109Cn\xE5\u10BBar\xF4\u0FA9t;\u65AD\u0180ilr\u3169\u1023\u316Esht;\u697D;\uC000\u{1D52F}\u0100ao\u3177\u3186r\u0100du\u317D\u317F\xBB\u047B\u0100;l\u1091\u3184;\u696C\u0100;v\u318B\u318C\u43C1;\u43F1\u0180gns\u3195\u31F9\u31FCht\u0300ahlrst\u31A4\u31B0\u31C2\u31D8\u31E4\u31EErrow\u0100;t\u0FDC\u31ADa\xE9\u30C8arpoon\u0100du\u31BB\u31BFow\xEE\u317Ep\xBB\u1092eft\u0100ah\u31CA\u31D0rrow\xF3\u0FEAarpoon\xF3\u0551ightarrows;\u61C9quigarro\xF7\u30CBhreetimes;\u62CCg;\u42DAingdotse\xF1\u1F32\u0180ahm\u320D\u3210\u3213r\xF2\u0FEAa\xF2\u0551;\u600Foust\u0100;a\u321E\u321F\u63B1che\xBB\u321Fmid;\u6AEE\u0200abpt\u3232\u323D\u3240\u3252\u0100nr\u3237\u323Ag;\u67EDr;\u61FEr\xEB\u1003\u0180afl\u3247\u324A\u324Er;\u6986;\uC000\u{1D563}us;\u6A2Eimes;\u6A35\u0100ap\u325D\u3267r\u0100;g\u3263\u3264\u4029t;\u6994olint;\u6A12ar\xF2\u31E3\u0200achq\u327B\u3280\u10BC\u3285quo;\u603Ar;\uC000\u{1D4C7}\u0100bu\u30FB\u328Ao\u0100;r\u0214\u0213\u0180hir\u3297\u329B\u32A0re\xE5\u31F8mes;\u62CAi\u0200;efl\u32AA\u1059\u1821\u32AB\u65B9tri;\u69CEluhar;\u6968;\u611E\u0D61\u32D5\u32DB\u32DF\u332C\u3338\u3371\0\u337A\u33A4\0\0\u33EC\u33F0\0\u3428\u3448\u345A\u34AD\u34B1\u34CA\u34F1\0\u3616\0\0\u3633cute;\u415Bqu\xEF\u27BA\u0500;Eaceinpsy\u11ED\u32F3\u32F5\u32FF\u3302\u330B\u330F\u331F\u3326\u3329;\u6AB4\u01F0\u32FA\0\u32FC;\u6AB8on;\u4161u\xE5\u11FE\u0100;d\u11F3\u3307il;\u415Frc;\u415D\u0180Eas\u3316\u3318\u331B;\u6AB6p;\u6ABAim;\u62E9olint;\u6A13i\xED\u1204;\u4441ot\u0180;be\u3334\u1D47\u3335\u62C5;\u6A66\u0380Aacmstx\u3346\u334A\u3357\u335B\u335E\u3363\u336Drr;\u61D8r\u0100hr\u3350\u3352\xEB\u2228\u0100;o\u0A36\u0A34t\u803B\xA7\u40A7i;\u403Bwar;\u6929m\u0100in\u3369\xF0nu\xF3\xF1t;\u6736r\u0100;o\u3376\u2055\uC000\u{1D530}\u0200acoy\u3382\u3386\u3391\u33A0rp;\u666F\u0100hy\u338B\u338Fcy;\u4449;\u4448rt\u026D\u3399\0\0\u339Ci\xE4\u1464ara\xEC\u2E6F\u803B\xAD\u40AD\u0100gm\u33A8\u33B4ma\u0180;fv\u33B1\u33B2\u33B2\u43C3;\u43C2\u0400;deglnpr\u12AB\u33C5\u33C9\u33CE\u33D6\u33DE\u33E1\u33E6ot;\u6A6A\u0100;q\u12B1\u12B0\u0100;E\u33D3\u33D4\u6A9E;\u6AA0\u0100;E\u33DB\u33DC\u6A9D;\u6A9Fe;\u6246lus;\u6A24arr;\u6972ar\xF2\u113D\u0200aeit\u33F8\u3408\u340F\u3417\u0100ls\u33FD\u3404lsetm\xE9\u336Ahp;\u6A33parsl;\u69E4\u0100dl\u1463\u3414e;\u6323\u0100;e\u341C\u341D\u6AAA\u0100;s\u3422\u3423\u6AAC;\uC000\u2AAC\uFE00\u0180flp\u342E\u3433\u3442tcy;\u444C\u0100;b\u3438\u3439\u402F\u0100;a\u343E\u343F\u69C4r;\u633Ff;\uC000\u{1D564}a\u0100dr\u344D\u0402es\u0100;u\u3454\u3455\u6660it\xBB\u3455\u0180csu\u3460\u3479\u349F\u0100au\u3465\u346Fp\u0100;s\u1188\u346B;\uC000\u2293\uFE00p\u0100;s\u11B4\u3475;\uC000\u2294\uFE00u\u0100bp\u347F\u348F\u0180;es\u1197\u119C\u3486et\u0100;e\u1197\u348D\xF1\u119D\u0180;es\u11A8\u11AD\u3496et\u0100;e\u11A8\u349D\xF1\u11AE\u0180;af\u117B\u34A6\u05B0r\u0165\u34AB\u05B1\xBB\u117Car\xF2\u1148\u0200cemt\u34B9\u34BE\u34C2\u34C5r;\uC000\u{1D4C8}tm\xEE\xF1i\xEC\u3415ar\xE6\u11BE\u0100ar\u34CE\u34D5r\u0100;f\u34D4\u17BF\u6606\u0100an\u34DA\u34EDight\u0100ep\u34E3\u34EApsilo\xEE\u1EE0h\xE9\u2EAFs\xBB\u2852\u0280bcmnp\u34FB\u355E\u1209\u358B\u358E\u0480;Edemnprs\u350E\u350F\u3511\u3515\u351E\u3523\u352C\u3531\u3536\u6282;\u6AC5ot;\u6ABD\u0100;d\u11DA\u351Aot;\u6AC3ult;\u6AC1\u0100Ee\u3528\u352A;\u6ACB;\u628Alus;\u6ABFarr;\u6979\u0180eiu\u353D\u3552\u3555t\u0180;en\u350E\u3545\u354Bq\u0100;q\u11DA\u350Feq\u0100;q\u352B\u3528m;\u6AC7\u0100bp\u355A\u355C;\u6AD5;\u6AD3c\u0300;acens\u11ED\u356C\u3572\u3579\u357B\u3326ppro\xF8\u32FAurlye\xF1\u11FE\xF1\u11F3\u0180aes\u3582\u3588\u331Bppro\xF8\u331Aq\xF1\u3317g;\u666A\u0680123;Edehlmnps\u35A9\u35AC\u35AF\u121C\u35B2\u35B4\u35C0\u35C9\u35D5\u35DA\u35DF\u35E8\u35ED\u803B\xB9\u40B9\u803B\xB2\u40B2\u803B\xB3\u40B3;\u6AC6\u0100os\u35B9\u35BCt;\u6ABEub;\u6AD8\u0100;d\u1222\u35C5ot;\u6AC4s\u0100ou\u35CF\u35D2l;\u67C9b;\u6AD7arr;\u697Bult;\u6AC2\u0100Ee\u35E4\u35E6;\u6ACC;\u628Blus;\u6AC0\u0180eiu\u35F4\u3609\u360Ct\u0180;en\u121C\u35FC\u3602q\u0100;q\u1222\u35B2eq\u0100;q\u35E7\u35E4m;\u6AC8\u0100bp\u3611\u3613;\u6AD4;\u6AD6\u0180Aan\u361C\u3620\u362Drr;\u61D9r\u0100hr\u3626\u3628\xEB\u222E\u0100;o\u0A2B\u0A29war;\u692Alig\u803B\xDF\u40DF\u0BE1\u3651\u365D\u3660\u12CE\u3673\u3679\0\u367E\u36C2\0\0\0\0\0\u36DB\u3703\0\u3709\u376C\0\0\0\u3787\u0272\u3656\0\0\u365Bget;\u6316;\u43C4r\xEB\u0E5F\u0180aey\u3666\u366B\u3670ron;\u4165dil;\u4163;\u4442lrec;\u6315r;\uC000\u{1D531}\u0200eiko\u3686\u369D\u36B5\u36BC\u01F2\u368B\0\u3691e\u01004f\u1284\u1281a\u0180;sv\u3698\u3699\u369B\u43B8ym;\u43D1\u0100cn\u36A2\u36B2k\u0100as\u36A8\u36AEppro\xF8\u12C1im\xBB\u12ACs\xF0\u129E\u0100as\u36BA\u36AE\xF0\u12C1rn\u803B\xFE\u40FE\u01EC\u031F\u36C6\u22E7es\u8180\xD7;bd\u36CF\u36D0\u36D8\u40D7\u0100;a\u190F\u36D5r;\u6A31;\u6A30\u0180eps\u36E1\u36E3\u3700\xE1\u2A4D\u0200;bcf\u0486\u36EC\u36F0\u36F4ot;\u6336ir;\u6AF1\u0100;o\u36F9\u36FC\uC000\u{1D565}rk;\u6ADA\xE1\u3362rime;\u6034\u0180aip\u370F\u3712\u3764d\xE5\u1248\u0380adempst\u3721\u374D\u3740\u3751\u3757\u375C\u375Fngle\u0280;dlqr\u3730\u3731\u3736\u3740\u3742\u65B5own\xBB\u1DBBeft\u0100;e\u2800\u373E\xF1\u092E;\u625Cight\u0100;e\u32AA\u374B\xF1\u105Aot;\u65ECinus;\u6A3Alus;\u6A39b;\u69CDime;\u6A3Bezium;\u63E2\u0180cht\u3772\u377D\u3781\u0100ry\u3777\u377B;\uC000\u{1D4C9};\u4446cy;\u445Brok;\u4167\u0100io\u378B\u378Ex\xF4\u1777head\u0100lr\u3797\u37A0eftarro\xF7\u084Fightarrow\xBB\u0F5D\u0900AHabcdfghlmoprstuw\u37D0\u37D3\u37D7\u37E4\u37F0\u37FC\u380E\u381C\u3823\u3834\u3851\u385D\u386B\u38A9\u38CC\u38D2\u38EA\u38F6r\xF2\u03EDar;\u6963\u0100cr\u37DC\u37E2ute\u803B\xFA\u40FA\xF2\u1150r\u01E3\u37EA\0\u37EDy;\u445Eve;\u416D\u0100iy\u37F5\u37FArc\u803B\xFB\u40FB;\u4443\u0180abh\u3803\u3806\u380Br\xF2\u13ADlac;\u4171a\xF2\u13C3\u0100ir\u3813\u3818sht;\u697E;\uC000\u{1D532}rave\u803B\xF9\u40F9\u0161\u3827\u3831r\u0100lr\u382C\u382E\xBB\u0957\xBB\u1083lk;\u6580\u0100ct\u3839\u384D\u026F\u383F\0\0\u384Arn\u0100;e\u3845\u3846\u631Cr\xBB\u3846op;\u630Fri;\u65F8\u0100al\u3856\u385Acr;\u416B\u80BB\xA8\u0349\u0100gp\u3862\u3866on;\u4173f;\uC000\u{1D566}\u0300adhlsu\u114B\u3878\u387D\u1372\u3891\u38A0own\xE1\u13B3arpoon\u0100lr\u3888\u388Cef\xF4\u382Digh\xF4\u382Fi\u0180;hl\u3899\u389A\u389C\u43C5\xBB\u13FAon\xBB\u389Aparrows;\u61C8\u0180cit\u38B0\u38C4\u38C8\u026F\u38B6\0\0\u38C1rn\u0100;e\u38BC\u38BD\u631Dr\xBB\u38BDop;\u630Eng;\u416Fri;\u65F9cr;\uC000\u{1D4CA}\u0180dir\u38D9\u38DD\u38E2ot;\u62F0lde;\u4169i\u0100;f\u3730\u38E8\xBB\u1813\u0100am\u38EF\u38F2r\xF2\u38A8l\u803B\xFC\u40FCangle;\u69A7\u0780ABDacdeflnoprsz\u391C\u391F\u3929\u392D\u39B5\u39B8\u39BD\u39DF\u39E4\u39E8\u39F3\u39F9\u39FD\u3A01\u3A20r\xF2\u03F7ar\u0100;v\u3926\u3927\u6AE8;\u6AE9as\xE8\u03E1\u0100nr\u3932\u3937grt;\u699C\u0380eknprst\u34E3\u3946\u394B\u3952\u395D\u3964\u3996app\xE1\u2415othin\xE7\u1E96\u0180hir\u34EB\u2EC8\u3959op\xF4\u2FB5\u0100;h\u13B7\u3962\xEF\u318D\u0100iu\u3969\u396Dgm\xE1\u33B3\u0100bp\u3972\u3984setneq\u0100;q\u397D\u3980\uC000\u228A\uFE00;\uC000\u2ACB\uFE00setneq\u0100;q\u398F\u3992\uC000\u228B\uFE00;\uC000\u2ACC\uFE00\u0100hr\u399B\u399Fet\xE1\u369Ciangle\u0100lr\u39AA\u39AFeft\xBB\u0925ight\xBB\u1051y;\u4432ash\xBB\u1036\u0180elr\u39C4\u39D2\u39D7\u0180;be\u2DEA\u39CB\u39CFar;\u62BBq;\u625Alip;\u62EE\u0100bt\u39DC\u1468a\xF2\u1469r;\uC000\u{1D533}tr\xE9\u39AEsu\u0100bp\u39EF\u39F1\xBB\u0D1C\xBB\u0D59pf;\uC000\u{1D567}ro\xF0\u0EFBtr\xE9\u39B4\u0100cu\u3A06\u3A0Br;\uC000\u{1D4CB}\u0100bp\u3A10\u3A18n\u0100Ee\u3980\u3A16\xBB\u397En\u0100Ee\u3992\u3A1E\xBB\u3990igzag;\u699A\u0380cefoprs\u3A36\u3A3B\u3A56\u3A5B\u3A54\u3A61\u3A6Airc;\u4175\u0100di\u3A40\u3A51\u0100bg\u3A45\u3A49ar;\u6A5Fe\u0100;q\u15FA\u3A4F;\u6259erp;\u6118r;\uC000\u{1D534}pf;\uC000\u{1D568}\u0100;e\u1479\u3A66at\xE8\u1479cr;\uC000\u{1D4CC}\u0AE3\u178E\u3A87\0\u3A8B\0\u3A90\u3A9B\0\0\u3A9D\u3AA8\u3AAB\u3AAF\0\0\u3AC3\u3ACE\0\u3AD8\u17DC\u17DFtr\xE9\u17D1r;\uC000\u{1D535}\u0100Aa\u3A94\u3A97r\xF2\u03C3r\xF2\u09F6;\u43BE\u0100Aa\u3AA1\u3AA4r\xF2\u03B8r\xF2\u09EBa\xF0\u2713is;\u62FB\u0180dpt\u17A4\u3AB5\u3ABE\u0100fl\u3ABA\u17A9;\uC000\u{1D569}im\xE5\u17B2\u0100Aa\u3AC7\u3ACAr\xF2\u03CEr\xF2\u0A01\u0100cq\u3AD2\u17B8r;\uC000\u{1D4CD}\u0100pt\u17D6\u3ADCr\xE9\u17D4\u0400acefiosu\u3AF0\u3AFD\u3B08\u3B0C\u3B11\u3B15\u3B1B\u3B21c\u0100uy\u3AF6\u3AFBte\u803B\xFD\u40FD;\u444F\u0100iy\u3B02\u3B06rc;\u4177;\u444Bn\u803B\xA5\u40A5r;\uC000\u{1D536}cy;\u4457pf;\uC000\u{1D56A}cr;\uC000\u{1D4CE}\u0100cm\u3B26\u3B29y;\u444El\u803B\xFF\u40FF\u0500acdefhiosw\u3B42\u3B48\u3B54\u3B58\u3B64\u3B69\u3B6D\u3B74\u3B7A\u3B80cute;\u417A\u0100ay\u3B4D\u3B52ron;\u417E;\u4437ot;\u417C\u0100et\u3B5D\u3B61tr\xE6\u155Fa;\u43B6r;\uC000\u{1D537}cy;\u4436grarr;\u61DDpf;\uC000\u{1D56B}cr;\uC000\u{1D4CF}\u0100jn\u3B85\u3B87;\u600Dj;\u600C'.split("").map((c) => c.charCodeAt(0))
);

// ../english-lint/node_modules/entities/lib/esm/generated/decode-data-xml.js
var decode_data_xml_default = new Uint16Array(
  // prettier-ignore
  "\u0200aglq	\x1B\u026D\0\0p;\u4026os;\u4027t;\u403Et;\u403Cuot;\u4022".split("").map((c) => c.charCodeAt(0))
);

// ../english-lint/node_modules/entities/lib/esm/decode_codepoint.js
var _a;
var decodeMap = /* @__PURE__ */ new Map([
  [0, 65533],
  // C1 Unicode control character reference replacements
  [128, 8364],
  [130, 8218],
  [131, 402],
  [132, 8222],
  [133, 8230],
  [134, 8224],
  [135, 8225],
  [136, 710],
  [137, 8240],
  [138, 352],
  [139, 8249],
  [140, 338],
  [142, 381],
  [145, 8216],
  [146, 8217],
  [147, 8220],
  [148, 8221],
  [149, 8226],
  [150, 8211],
  [151, 8212],
  [152, 732],
  [153, 8482],
  [154, 353],
  [155, 8250],
  [156, 339],
  [158, 382],
  [159, 376]
]);
var fromCodePoint = (
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition, node/no-unsupported-features/es-builtins
  (_a = String.fromCodePoint) !== null && _a !== void 0 ? _a : function(codePoint) {
    let output = "";
    if (codePoint > 65535) {
      codePoint -= 65536;
      output += String.fromCharCode(codePoint >>> 10 & 1023 | 55296);
      codePoint = 56320 | codePoint & 1023;
    }
    output += String.fromCharCode(codePoint);
    return output;
  }
);
function replaceCodePoint(codePoint) {
  var _a2;
  if (codePoint >= 55296 && codePoint <= 57343 || codePoint > 1114111) {
    return 65533;
  }
  return (_a2 = decodeMap.get(codePoint)) !== null && _a2 !== void 0 ? _a2 : codePoint;
}

// ../english-lint/node_modules/entities/lib/esm/decode.js
var CharCodes;
(function(CharCodes2) {
  CharCodes2[CharCodes2["NUM"] = 35] = "NUM";
  CharCodes2[CharCodes2["SEMI"] = 59] = "SEMI";
  CharCodes2[CharCodes2["EQUALS"] = 61] = "EQUALS";
  CharCodes2[CharCodes2["ZERO"] = 48] = "ZERO";
  CharCodes2[CharCodes2["NINE"] = 57] = "NINE";
  CharCodes2[CharCodes2["LOWER_A"] = 97] = "LOWER_A";
  CharCodes2[CharCodes2["LOWER_F"] = 102] = "LOWER_F";
  CharCodes2[CharCodes2["LOWER_X"] = 120] = "LOWER_X";
  CharCodes2[CharCodes2["LOWER_Z"] = 122] = "LOWER_Z";
  CharCodes2[CharCodes2["UPPER_A"] = 65] = "UPPER_A";
  CharCodes2[CharCodes2["UPPER_F"] = 70] = "UPPER_F";
  CharCodes2[CharCodes2["UPPER_Z"] = 90] = "UPPER_Z";
})(CharCodes || (CharCodes = {}));
var TO_LOWER_BIT = 32;
var BinTrieFlags;
(function(BinTrieFlags2) {
  BinTrieFlags2[BinTrieFlags2["VALUE_LENGTH"] = 49152] = "VALUE_LENGTH";
  BinTrieFlags2[BinTrieFlags2["BRANCH_LENGTH"] = 16256] = "BRANCH_LENGTH";
  BinTrieFlags2[BinTrieFlags2["JUMP_TABLE"] = 127] = "JUMP_TABLE";
})(BinTrieFlags || (BinTrieFlags = {}));
function isNumber(code) {
  return code >= CharCodes.ZERO && code <= CharCodes.NINE;
}
function isHexadecimalCharacter(code) {
  return code >= CharCodes.UPPER_A && code <= CharCodes.UPPER_F || code >= CharCodes.LOWER_A && code <= CharCodes.LOWER_F;
}
function isAsciiAlphaNumeric(code) {
  return code >= CharCodes.UPPER_A && code <= CharCodes.UPPER_Z || code >= CharCodes.LOWER_A && code <= CharCodes.LOWER_Z || isNumber(code);
}
function isEntityInAttributeInvalidEnd(code) {
  return code === CharCodes.EQUALS || isAsciiAlphaNumeric(code);
}
var EntityDecoderState;
(function(EntityDecoderState2) {
  EntityDecoderState2[EntityDecoderState2["EntityStart"] = 0] = "EntityStart";
  EntityDecoderState2[EntityDecoderState2["NumericStart"] = 1] = "NumericStart";
  EntityDecoderState2[EntityDecoderState2["NumericDecimal"] = 2] = "NumericDecimal";
  EntityDecoderState2[EntityDecoderState2["NumericHex"] = 3] = "NumericHex";
  EntityDecoderState2[EntityDecoderState2["NamedEntity"] = 4] = "NamedEntity";
})(EntityDecoderState || (EntityDecoderState = {}));
var DecodingMode;
(function(DecodingMode2) {
  DecodingMode2[DecodingMode2["Legacy"] = 0] = "Legacy";
  DecodingMode2[DecodingMode2["Strict"] = 1] = "Strict";
  DecodingMode2[DecodingMode2["Attribute"] = 2] = "Attribute";
})(DecodingMode || (DecodingMode = {}));
var EntityDecoder = class {
  constructor(decodeTree, emitCodePoint, errors) {
    this.decodeTree = decodeTree;
    this.emitCodePoint = emitCodePoint;
    this.errors = errors;
    this.state = EntityDecoderState.EntityStart;
    this.consumed = 1;
    this.result = 0;
    this.treeIndex = 0;
    this.excess = 1;
    this.decodeMode = DecodingMode.Strict;
  }
  /** Resets the instance to make it reusable. */
  startEntity(decodeMode) {
    this.decodeMode = decodeMode;
    this.state = EntityDecoderState.EntityStart;
    this.result = 0;
    this.treeIndex = 0;
    this.excess = 1;
    this.consumed = 1;
  }
  /**
   * Write an entity to the decoder. This can be called multiple times with partial entities.
   * If the entity is incomplete, the decoder will return -1.
   *
   * Mirrors the implementation of `getDecoder`, but with the ability to stop decoding if the
   * entity is incomplete, and resume when the next string is written.
   *
   * @param string The string containing the entity (or a continuation of the entity).
   * @param offset The offset at which the entity begins. Should be 0 if this is not the first call.
   * @returns The number of characters that were consumed, or -1 if the entity is incomplete.
   */
  write(str, offset) {
    switch (this.state) {
      case EntityDecoderState.EntityStart: {
        if (str.charCodeAt(offset) === CharCodes.NUM) {
          this.state = EntityDecoderState.NumericStart;
          this.consumed += 1;
          return this.stateNumericStart(str, offset + 1);
        }
        this.state = EntityDecoderState.NamedEntity;
        return this.stateNamedEntity(str, offset);
      }
      case EntityDecoderState.NumericStart: {
        return this.stateNumericStart(str, offset);
      }
      case EntityDecoderState.NumericDecimal: {
        return this.stateNumericDecimal(str, offset);
      }
      case EntityDecoderState.NumericHex: {
        return this.stateNumericHex(str, offset);
      }
      case EntityDecoderState.NamedEntity: {
        return this.stateNamedEntity(str, offset);
      }
    }
  }
  /**
   * Switches between the numeric decimal and hexadecimal states.
   *
   * Equivalent to the `Numeric character reference state` in the HTML spec.
   *
   * @param str The string containing the entity (or a continuation of the entity).
   * @param offset The current offset.
   * @returns The number of characters that were consumed, or -1 if the entity is incomplete.
   */
  stateNumericStart(str, offset) {
    if (offset >= str.length) {
      return -1;
    }
    if ((str.charCodeAt(offset) | TO_LOWER_BIT) === CharCodes.LOWER_X) {
      this.state = EntityDecoderState.NumericHex;
      this.consumed += 1;
      return this.stateNumericHex(str, offset + 1);
    }
    this.state = EntityDecoderState.NumericDecimal;
    return this.stateNumericDecimal(str, offset);
  }
  addToNumericResult(str, start, end, base) {
    if (start !== end) {
      const digitCount = end - start;
      this.result = this.result * Math.pow(base, digitCount) + parseInt(str.substr(start, digitCount), base);
      this.consumed += digitCount;
    }
  }
  /**
   * Parses a hexadecimal numeric entity.
   *
   * Equivalent to the `Hexademical character reference state` in the HTML spec.
   *
   * @param str The string containing the entity (or a continuation of the entity).
   * @param offset The current offset.
   * @returns The number of characters that were consumed, or -1 if the entity is incomplete.
   */
  stateNumericHex(str, offset) {
    const startIdx = offset;
    while (offset < str.length) {
      const char = str.charCodeAt(offset);
      if (isNumber(char) || isHexadecimalCharacter(char)) {
        offset += 1;
      } else {
        this.addToNumericResult(str, startIdx, offset, 16);
        return this.emitNumericEntity(char, 3);
      }
    }
    this.addToNumericResult(str, startIdx, offset, 16);
    return -1;
  }
  /**
   * Parses a decimal numeric entity.
   *
   * Equivalent to the `Decimal character reference state` in the HTML spec.
   *
   * @param str The string containing the entity (or a continuation of the entity).
   * @param offset The current offset.
   * @returns The number of characters that were consumed, or -1 if the entity is incomplete.
   */
  stateNumericDecimal(str, offset) {
    const startIdx = offset;
    while (offset < str.length) {
      const char = str.charCodeAt(offset);
      if (isNumber(char)) {
        offset += 1;
      } else {
        this.addToNumericResult(str, startIdx, offset, 10);
        return this.emitNumericEntity(char, 2);
      }
    }
    this.addToNumericResult(str, startIdx, offset, 10);
    return -1;
  }
  /**
   * Validate and emit a numeric entity.
   *
   * Implements the logic from the `Hexademical character reference start
   * state` and `Numeric character reference end state` in the HTML spec.
   *
   * @param lastCp The last code point of the entity. Used to see if the
   *               entity was terminated with a semicolon.
   * @param expectedLength The minimum number of characters that should be
   *                       consumed. Used to validate that at least one digit
   *                       was consumed.
   * @returns The number of characters that were consumed.
   */
  emitNumericEntity(lastCp, expectedLength) {
    var _a2;
    if (this.consumed <= expectedLength) {
      (_a2 = this.errors) === null || _a2 === void 0 ? void 0 : _a2.absenceOfDigitsInNumericCharacterReference(this.consumed);
      return 0;
    }
    if (lastCp === CharCodes.SEMI) {
      this.consumed += 1;
    } else if (this.decodeMode === DecodingMode.Strict) {
      return 0;
    }
    this.emitCodePoint(replaceCodePoint(this.result), this.consumed);
    if (this.errors) {
      if (lastCp !== CharCodes.SEMI) {
        this.errors.missingSemicolonAfterCharacterReference();
      }
      this.errors.validateNumericCharacterReference(this.result);
    }
    return this.consumed;
  }
  /**
   * Parses a named entity.
   *
   * Equivalent to the `Named character reference state` in the HTML spec.
   *
   * @param str The string containing the entity (or a continuation of the entity).
   * @param offset The current offset.
   * @returns The number of characters that were consumed, or -1 if the entity is incomplete.
   */
  stateNamedEntity(str, offset) {
    const { decodeTree } = this;
    let current = decodeTree[this.treeIndex];
    let valueLength = (current & BinTrieFlags.VALUE_LENGTH) >> 14;
    for (; offset < str.length; offset++, this.excess++) {
      const char = str.charCodeAt(offset);
      this.treeIndex = determineBranch(decodeTree, current, this.treeIndex + Math.max(1, valueLength), char);
      if (this.treeIndex < 0) {
        return this.result === 0 || // If we are parsing an attribute
        this.decodeMode === DecodingMode.Attribute && // We shouldn't have consumed any characters after the entity,
        (valueLength === 0 || // And there should be no invalid characters.
        isEntityInAttributeInvalidEnd(char)) ? 0 : this.emitNotTerminatedNamedEntity();
      }
      current = decodeTree[this.treeIndex];
      valueLength = (current & BinTrieFlags.VALUE_LENGTH) >> 14;
      if (valueLength !== 0) {
        if (char === CharCodes.SEMI) {
          return this.emitNamedEntityData(this.treeIndex, valueLength, this.consumed + this.excess);
        }
        if (this.decodeMode !== DecodingMode.Strict) {
          this.result = this.treeIndex;
          this.consumed += this.excess;
          this.excess = 0;
        }
      }
    }
    return -1;
  }
  /**
   * Emit a named entity that was not terminated with a semicolon.
   *
   * @returns The number of characters consumed.
   */
  emitNotTerminatedNamedEntity() {
    var _a2;
    const { result, decodeTree } = this;
    const valueLength = (decodeTree[result] & BinTrieFlags.VALUE_LENGTH) >> 14;
    this.emitNamedEntityData(result, valueLength, this.consumed);
    (_a2 = this.errors) === null || _a2 === void 0 ? void 0 : _a2.missingSemicolonAfterCharacterReference();
    return this.consumed;
  }
  /**
   * Emit a named entity.
   *
   * @param result The index of the entity in the decode tree.
   * @param valueLength The number of bytes in the entity.
   * @param consumed The number of characters consumed.
   *
   * @returns The number of characters consumed.
   */
  emitNamedEntityData(result, valueLength, consumed) {
    const { decodeTree } = this;
    this.emitCodePoint(valueLength === 1 ? decodeTree[result] & ~BinTrieFlags.VALUE_LENGTH : decodeTree[result + 1], consumed);
    if (valueLength === 3) {
      this.emitCodePoint(decodeTree[result + 2], consumed);
    }
    return consumed;
  }
  /**
   * Signal to the parser that the end of the input was reached.
   *
   * Remaining data will be emitted and relevant errors will be produced.
   *
   * @returns The number of characters consumed.
   */
  end() {
    var _a2;
    switch (this.state) {
      case EntityDecoderState.NamedEntity: {
        return this.result !== 0 && (this.decodeMode !== DecodingMode.Attribute || this.result === this.treeIndex) ? this.emitNotTerminatedNamedEntity() : 0;
      }
      // Otherwise, emit a numeric entity if we have one.
      case EntityDecoderState.NumericDecimal: {
        return this.emitNumericEntity(0, 2);
      }
      case EntityDecoderState.NumericHex: {
        return this.emitNumericEntity(0, 3);
      }
      case EntityDecoderState.NumericStart: {
        (_a2 = this.errors) === null || _a2 === void 0 ? void 0 : _a2.absenceOfDigitsInNumericCharacterReference(this.consumed);
        return 0;
      }
      case EntityDecoderState.EntityStart: {
        return 0;
      }
    }
  }
};
function getDecoder(decodeTree) {
  let ret = "";
  const decoder = new EntityDecoder(decodeTree, (str) => ret += fromCodePoint(str));
  return function decodeWithTrie(str, decodeMode) {
    let lastIndex = 0;
    let offset = 0;
    while ((offset = str.indexOf("&", offset)) >= 0) {
      ret += str.slice(lastIndex, offset);
      decoder.startEntity(decodeMode);
      const len = decoder.write(
        str,
        // Skip the "&"
        offset + 1
      );
      if (len < 0) {
        lastIndex = offset + decoder.end();
        break;
      }
      lastIndex = offset + len;
      offset = len === 0 ? lastIndex + 1 : lastIndex;
    }
    const result = ret + str.slice(lastIndex);
    ret = "";
    return result;
  };
}
function determineBranch(decodeTree, current, nodeIdx, char) {
  const branchCount = (current & BinTrieFlags.BRANCH_LENGTH) >> 7;
  const jumpOffset = current & BinTrieFlags.JUMP_TABLE;
  if (branchCount === 0) {
    return jumpOffset !== 0 && char === jumpOffset ? nodeIdx : -1;
  }
  if (jumpOffset) {
    const value = char - jumpOffset;
    return value < 0 || value >= branchCount ? -1 : decodeTree[nodeIdx + value] - 1;
  }
  let lo = nodeIdx;
  let hi = lo + branchCount - 1;
  while (lo <= hi) {
    const mid = lo + hi >>> 1;
    const midVal = decodeTree[mid];
    if (midVal < char) {
      lo = mid + 1;
    } else if (midVal > char) {
      hi = mid - 1;
    } else {
      return decodeTree[mid + branchCount];
    }
  }
  return -1;
}
var htmlDecoder = getDecoder(decode_data_html_default);
var xmlDecoder = getDecoder(decode_data_xml_default);

// ../english-lint/node_modules/entities/lib/esm/generated/encode-html.js
function restoreDiff(arr) {
  for (let i = 1; i < arr.length; i++) {
    arr[i][0] += arr[i - 1][0] + 1;
  }
  return arr;
}
var encode_html_default = new Map(/* @__PURE__ */ restoreDiff([[9, "&Tab;"], [0, "&NewLine;"], [22, "&excl;"], [0, "&quot;"], [0, "&num;"], [0, "&dollar;"], [0, "&percnt;"], [0, "&amp;"], [0, "&apos;"], [0, "&lpar;"], [0, "&rpar;"], [0, "&ast;"], [0, "&plus;"], [0, "&comma;"], [1, "&period;"], [0, "&sol;"], [10, "&colon;"], [0, "&semi;"], [0, { v: "&lt;", n: 8402, o: "&nvlt;" }], [0, { v: "&equals;", n: 8421, o: "&bne;" }], [0, { v: "&gt;", n: 8402, o: "&nvgt;" }], [0, "&quest;"], [0, "&commat;"], [26, "&lbrack;"], [0, "&bsol;"], [0, "&rbrack;"], [0, "&Hat;"], [0, "&lowbar;"], [0, "&DiacriticalGrave;"], [5, { n: 106, o: "&fjlig;" }], [20, "&lbrace;"], [0, "&verbar;"], [0, "&rbrace;"], [34, "&nbsp;"], [0, "&iexcl;"], [0, "&cent;"], [0, "&pound;"], [0, "&curren;"], [0, "&yen;"], [0, "&brvbar;"], [0, "&sect;"], [0, "&die;"], [0, "&copy;"], [0, "&ordf;"], [0, "&laquo;"], [0, "&not;"], [0, "&shy;"], [0, "&circledR;"], [0, "&macr;"], [0, "&deg;"], [0, "&PlusMinus;"], [0, "&sup2;"], [0, "&sup3;"], [0, "&acute;"], [0, "&micro;"], [0, "&para;"], [0, "&centerdot;"], [0, "&cedil;"], [0, "&sup1;"], [0, "&ordm;"], [0, "&raquo;"], [0, "&frac14;"], [0, "&frac12;"], [0, "&frac34;"], [0, "&iquest;"], [0, "&Agrave;"], [0, "&Aacute;"], [0, "&Acirc;"], [0, "&Atilde;"], [0, "&Auml;"], [0, "&angst;"], [0, "&AElig;"], [0, "&Ccedil;"], [0, "&Egrave;"], [0, "&Eacute;"], [0, "&Ecirc;"], [0, "&Euml;"], [0, "&Igrave;"], [0, "&Iacute;"], [0, "&Icirc;"], [0, "&Iuml;"], [0, "&ETH;"], [0, "&Ntilde;"], [0, "&Ograve;"], [0, "&Oacute;"], [0, "&Ocirc;"], [0, "&Otilde;"], [0, "&Ouml;"], [0, "&times;"], [0, "&Oslash;"], [0, "&Ugrave;"], [0, "&Uacute;"], [0, "&Ucirc;"], [0, "&Uuml;"], [0, "&Yacute;"], [0, "&THORN;"], [0, "&szlig;"], [0, "&agrave;"], [0, "&aacute;"], [0, "&acirc;"], [0, "&atilde;"], [0, "&auml;"], [0, "&aring;"], [0, "&aelig;"], [0, "&ccedil;"], [0, "&egrave;"], [0, "&eacute;"], [0, "&ecirc;"], [0, "&euml;"], [0, "&igrave;"], [0, "&iacute;"], [0, "&icirc;"], [0, "&iuml;"], [0, "&eth;"], [0, "&ntilde;"], [0, "&ograve;"], [0, "&oacute;"], [0, "&ocirc;"], [0, "&otilde;"], [0, "&ouml;"], [0, "&div;"], [0, "&oslash;"], [0, "&ugrave;"], [0, "&uacute;"], [0, "&ucirc;"], [0, "&uuml;"], [0, "&yacute;"], [0, "&thorn;"], [0, "&yuml;"], [0, "&Amacr;"], [0, "&amacr;"], [0, "&Abreve;"], [0, "&abreve;"], [0, "&Aogon;"], [0, "&aogon;"], [0, "&Cacute;"], [0, "&cacute;"], [0, "&Ccirc;"], [0, "&ccirc;"], [0, "&Cdot;"], [0, "&cdot;"], [0, "&Ccaron;"], [0, "&ccaron;"], [0, "&Dcaron;"], [0, "&dcaron;"], [0, "&Dstrok;"], [0, "&dstrok;"], [0, "&Emacr;"], [0, "&emacr;"], [2, "&Edot;"], [0, "&edot;"], [0, "&Eogon;"], [0, "&eogon;"], [0, "&Ecaron;"], [0, "&ecaron;"], [0, "&Gcirc;"], [0, "&gcirc;"], [0, "&Gbreve;"], [0, "&gbreve;"], [0, "&Gdot;"], [0, "&gdot;"], [0, "&Gcedil;"], [1, "&Hcirc;"], [0, "&hcirc;"], [0, "&Hstrok;"], [0, "&hstrok;"], [0, "&Itilde;"], [0, "&itilde;"], [0, "&Imacr;"], [0, "&imacr;"], [2, "&Iogon;"], [0, "&iogon;"], [0, "&Idot;"], [0, "&imath;"], [0, "&IJlig;"], [0, "&ijlig;"], [0, "&Jcirc;"], [0, "&jcirc;"], [0, "&Kcedil;"], [0, "&kcedil;"], [0, "&kgreen;"], [0, "&Lacute;"], [0, "&lacute;"], [0, "&Lcedil;"], [0, "&lcedil;"], [0, "&Lcaron;"], [0, "&lcaron;"], [0, "&Lmidot;"], [0, "&lmidot;"], [0, "&Lstrok;"], [0, "&lstrok;"], [0, "&Nacute;"], [0, "&nacute;"], [0, "&Ncedil;"], [0, "&ncedil;"], [0, "&Ncaron;"], [0, "&ncaron;"], [0, "&napos;"], [0, "&ENG;"], [0, "&eng;"], [0, "&Omacr;"], [0, "&omacr;"], [2, "&Odblac;"], [0, "&odblac;"], [0, "&OElig;"], [0, "&oelig;"], [0, "&Racute;"], [0, "&racute;"], [0, "&Rcedil;"], [0, "&rcedil;"], [0, "&Rcaron;"], [0, "&rcaron;"], [0, "&Sacute;"], [0, "&sacute;"], [0, "&Scirc;"], [0, "&scirc;"], [0, "&Scedil;"], [0, "&scedil;"], [0, "&Scaron;"], [0, "&scaron;"], [0, "&Tcedil;"], [0, "&tcedil;"], [0, "&Tcaron;"], [0, "&tcaron;"], [0, "&Tstrok;"], [0, "&tstrok;"], [0, "&Utilde;"], [0, "&utilde;"], [0, "&Umacr;"], [0, "&umacr;"], [0, "&Ubreve;"], [0, "&ubreve;"], [0, "&Uring;"], [0, "&uring;"], [0, "&Udblac;"], [0, "&udblac;"], [0, "&Uogon;"], [0, "&uogon;"], [0, "&Wcirc;"], [0, "&wcirc;"], [0, "&Ycirc;"], [0, "&ycirc;"], [0, "&Yuml;"], [0, "&Zacute;"], [0, "&zacute;"], [0, "&Zdot;"], [0, "&zdot;"], [0, "&Zcaron;"], [0, "&zcaron;"], [19, "&fnof;"], [34, "&imped;"], [63, "&gacute;"], [65, "&jmath;"], [142, "&circ;"], [0, "&caron;"], [16, "&breve;"], [0, "&DiacriticalDot;"], [0, "&ring;"], [0, "&ogon;"], [0, "&DiacriticalTilde;"], [0, "&dblac;"], [51, "&DownBreve;"], [127, "&Alpha;"], [0, "&Beta;"], [0, "&Gamma;"], [0, "&Delta;"], [0, "&Epsilon;"], [0, "&Zeta;"], [0, "&Eta;"], [0, "&Theta;"], [0, "&Iota;"], [0, "&Kappa;"], [0, "&Lambda;"], [0, "&Mu;"], [0, "&Nu;"], [0, "&Xi;"], [0, "&Omicron;"], [0, "&Pi;"], [0, "&Rho;"], [1, "&Sigma;"], [0, "&Tau;"], [0, "&Upsilon;"], [0, "&Phi;"], [0, "&Chi;"], [0, "&Psi;"], [0, "&ohm;"], [7, "&alpha;"], [0, "&beta;"], [0, "&gamma;"], [0, "&delta;"], [0, "&epsi;"], [0, "&zeta;"], [0, "&eta;"], [0, "&theta;"], [0, "&iota;"], [0, "&kappa;"], [0, "&lambda;"], [0, "&mu;"], [0, "&nu;"], [0, "&xi;"], [0, "&omicron;"], [0, "&pi;"], [0, "&rho;"], [0, "&sigmaf;"], [0, "&sigma;"], [0, "&tau;"], [0, "&upsi;"], [0, "&phi;"], [0, "&chi;"], [0, "&psi;"], [0, "&omega;"], [7, "&thetasym;"], [0, "&Upsi;"], [2, "&phiv;"], [0, "&piv;"], [5, "&Gammad;"], [0, "&digamma;"], [18, "&kappav;"], [0, "&rhov;"], [3, "&epsiv;"], [0, "&backepsilon;"], [10, "&IOcy;"], [0, "&DJcy;"], [0, "&GJcy;"], [0, "&Jukcy;"], [0, "&DScy;"], [0, "&Iukcy;"], [0, "&YIcy;"], [0, "&Jsercy;"], [0, "&LJcy;"], [0, "&NJcy;"], [0, "&TSHcy;"], [0, "&KJcy;"], [1, "&Ubrcy;"], [0, "&DZcy;"], [0, "&Acy;"], [0, "&Bcy;"], [0, "&Vcy;"], [0, "&Gcy;"], [0, "&Dcy;"], [0, "&IEcy;"], [0, "&ZHcy;"], [0, "&Zcy;"], [0, "&Icy;"], [0, "&Jcy;"], [0, "&Kcy;"], [0, "&Lcy;"], [0, "&Mcy;"], [0, "&Ncy;"], [0, "&Ocy;"], [0, "&Pcy;"], [0, "&Rcy;"], [0, "&Scy;"], [0, "&Tcy;"], [0, "&Ucy;"], [0, "&Fcy;"], [0, "&KHcy;"], [0, "&TScy;"], [0, "&CHcy;"], [0, "&SHcy;"], [0, "&SHCHcy;"], [0, "&HARDcy;"], [0, "&Ycy;"], [0, "&SOFTcy;"], [0, "&Ecy;"], [0, "&YUcy;"], [0, "&YAcy;"], [0, "&acy;"], [0, "&bcy;"], [0, "&vcy;"], [0, "&gcy;"], [0, "&dcy;"], [0, "&iecy;"], [0, "&zhcy;"], [0, "&zcy;"], [0, "&icy;"], [0, "&jcy;"], [0, "&kcy;"], [0, "&lcy;"], [0, "&mcy;"], [0, "&ncy;"], [0, "&ocy;"], [0, "&pcy;"], [0, "&rcy;"], [0, "&scy;"], [0, "&tcy;"], [0, "&ucy;"], [0, "&fcy;"], [0, "&khcy;"], [0, "&tscy;"], [0, "&chcy;"], [0, "&shcy;"], [0, "&shchcy;"], [0, "&hardcy;"], [0, "&ycy;"], [0, "&softcy;"], [0, "&ecy;"], [0, "&yucy;"], [0, "&yacy;"], [1, "&iocy;"], [0, "&djcy;"], [0, "&gjcy;"], [0, "&jukcy;"], [0, "&dscy;"], [0, "&iukcy;"], [0, "&yicy;"], [0, "&jsercy;"], [0, "&ljcy;"], [0, "&njcy;"], [0, "&tshcy;"], [0, "&kjcy;"], [1, "&ubrcy;"], [0, "&dzcy;"], [7074, "&ensp;"], [0, "&emsp;"], [0, "&emsp13;"], [0, "&emsp14;"], [1, "&numsp;"], [0, "&puncsp;"], [0, "&ThinSpace;"], [0, "&hairsp;"], [0, "&NegativeMediumSpace;"], [0, "&zwnj;"], [0, "&zwj;"], [0, "&lrm;"], [0, "&rlm;"], [0, "&dash;"], [2, "&ndash;"], [0, "&mdash;"], [0, "&horbar;"], [0, "&Verbar;"], [1, "&lsquo;"], [0, "&CloseCurlyQuote;"], [0, "&lsquor;"], [1, "&ldquo;"], [0, "&CloseCurlyDoubleQuote;"], [0, "&bdquo;"], [1, "&dagger;"], [0, "&Dagger;"], [0, "&bull;"], [2, "&nldr;"], [0, "&hellip;"], [9, "&permil;"], [0, "&pertenk;"], [0, "&prime;"], [0, "&Prime;"], [0, "&tprime;"], [0, "&backprime;"], [3, "&lsaquo;"], [0, "&rsaquo;"], [3, "&oline;"], [2, "&caret;"], [1, "&hybull;"], [0, "&frasl;"], [10, "&bsemi;"], [7, "&qprime;"], [7, { v: "&MediumSpace;", n: 8202, o: "&ThickSpace;" }], [0, "&NoBreak;"], [0, "&af;"], [0, "&InvisibleTimes;"], [0, "&ic;"], [72, "&euro;"], [46, "&tdot;"], [0, "&DotDot;"], [37, "&complexes;"], [2, "&incare;"], [4, "&gscr;"], [0, "&hamilt;"], [0, "&Hfr;"], [0, "&Hopf;"], [0, "&planckh;"], [0, "&hbar;"], [0, "&imagline;"], [0, "&Ifr;"], [0, "&lagran;"], [0, "&ell;"], [1, "&naturals;"], [0, "&numero;"], [0, "&copysr;"], [0, "&weierp;"], [0, "&Popf;"], [0, "&Qopf;"], [0, "&realine;"], [0, "&real;"], [0, "&reals;"], [0, "&rx;"], [3, "&trade;"], [1, "&integers;"], [2, "&mho;"], [0, "&zeetrf;"], [0, "&iiota;"], [2, "&bernou;"], [0, "&Cayleys;"], [1, "&escr;"], [0, "&Escr;"], [0, "&Fouriertrf;"], [1, "&Mellintrf;"], [0, "&order;"], [0, "&alefsym;"], [0, "&beth;"], [0, "&gimel;"], [0, "&daleth;"], [12, "&CapitalDifferentialD;"], [0, "&dd;"], [0, "&ee;"], [0, "&ii;"], [10, "&frac13;"], [0, "&frac23;"], [0, "&frac15;"], [0, "&frac25;"], [0, "&frac35;"], [0, "&frac45;"], [0, "&frac16;"], [0, "&frac56;"], [0, "&frac18;"], [0, "&frac38;"], [0, "&frac58;"], [0, "&frac78;"], [49, "&larr;"], [0, "&ShortUpArrow;"], [0, "&rarr;"], [0, "&darr;"], [0, "&harr;"], [0, "&updownarrow;"], [0, "&nwarr;"], [0, "&nearr;"], [0, "&LowerRightArrow;"], [0, "&LowerLeftArrow;"], [0, "&nlarr;"], [0, "&nrarr;"], [1, { v: "&rarrw;", n: 824, o: "&nrarrw;" }], [0, "&Larr;"], [0, "&Uarr;"], [0, "&Rarr;"], [0, "&Darr;"], [0, "&larrtl;"], [0, "&rarrtl;"], [0, "&LeftTeeArrow;"], [0, "&mapstoup;"], [0, "&map;"], [0, "&DownTeeArrow;"], [1, "&hookleftarrow;"], [0, "&hookrightarrow;"], [0, "&larrlp;"], [0, "&looparrowright;"], [0, "&harrw;"], [0, "&nharr;"], [1, "&lsh;"], [0, "&rsh;"], [0, "&ldsh;"], [0, "&rdsh;"], [1, "&crarr;"], [0, "&cularr;"], [0, "&curarr;"], [2, "&circlearrowleft;"], [0, "&circlearrowright;"], [0, "&leftharpoonup;"], [0, "&DownLeftVector;"], [0, "&RightUpVector;"], [0, "&LeftUpVector;"], [0, "&rharu;"], [0, "&DownRightVector;"], [0, "&dharr;"], [0, "&dharl;"], [0, "&RightArrowLeftArrow;"], [0, "&udarr;"], [0, "&LeftArrowRightArrow;"], [0, "&leftleftarrows;"], [0, "&upuparrows;"], [0, "&rightrightarrows;"], [0, "&ddarr;"], [0, "&leftrightharpoons;"], [0, "&Equilibrium;"], [0, "&nlArr;"], [0, "&nhArr;"], [0, "&nrArr;"], [0, "&DoubleLeftArrow;"], [0, "&DoubleUpArrow;"], [0, "&DoubleRightArrow;"], [0, "&dArr;"], [0, "&DoubleLeftRightArrow;"], [0, "&DoubleUpDownArrow;"], [0, "&nwArr;"], [0, "&neArr;"], [0, "&seArr;"], [0, "&swArr;"], [0, "&lAarr;"], [0, "&rAarr;"], [1, "&zigrarr;"], [6, "&larrb;"], [0, "&rarrb;"], [15, "&DownArrowUpArrow;"], [7, "&loarr;"], [0, "&roarr;"], [0, "&hoarr;"], [0, "&forall;"], [0, "&comp;"], [0, { v: "&part;", n: 824, o: "&npart;" }], [0, "&exist;"], [0, "&nexist;"], [0, "&empty;"], [1, "&Del;"], [0, "&Element;"], [0, "&NotElement;"], [1, "&ni;"], [0, "&notni;"], [2, "&prod;"], [0, "&coprod;"], [0, "&sum;"], [0, "&minus;"], [0, "&MinusPlus;"], [0, "&dotplus;"], [1, "&Backslash;"], [0, "&lowast;"], [0, "&compfn;"], [1, "&radic;"], [2, "&prop;"], [0, "&infin;"], [0, "&angrt;"], [0, { v: "&ang;", n: 8402, o: "&nang;" }], [0, "&angmsd;"], [0, "&angsph;"], [0, "&mid;"], [0, "&nmid;"], [0, "&DoubleVerticalBar;"], [0, "&NotDoubleVerticalBar;"], [0, "&and;"], [0, "&or;"], [0, { v: "&cap;", n: 65024, o: "&caps;" }], [0, { v: "&cup;", n: 65024, o: "&cups;" }], [0, "&int;"], [0, "&Int;"], [0, "&iiint;"], [0, "&conint;"], [0, "&Conint;"], [0, "&Cconint;"], [0, "&cwint;"], [0, "&ClockwiseContourIntegral;"], [0, "&awconint;"], [0, "&there4;"], [0, "&becaus;"], [0, "&ratio;"], [0, "&Colon;"], [0, "&dotminus;"], [1, "&mDDot;"], [0, "&homtht;"], [0, { v: "&sim;", n: 8402, o: "&nvsim;" }], [0, { v: "&backsim;", n: 817, o: "&race;" }], [0, { v: "&ac;", n: 819, o: "&acE;" }], [0, "&acd;"], [0, "&VerticalTilde;"], [0, "&NotTilde;"], [0, { v: "&eqsim;", n: 824, o: "&nesim;" }], [0, "&sime;"], [0, "&NotTildeEqual;"], [0, "&cong;"], [0, "&simne;"], [0, "&ncong;"], [0, "&ap;"], [0, "&nap;"], [0, "&ape;"], [0, { v: "&apid;", n: 824, o: "&napid;" }], [0, "&backcong;"], [0, { v: "&asympeq;", n: 8402, o: "&nvap;" }], [0, { v: "&bump;", n: 824, o: "&nbump;" }], [0, { v: "&bumpe;", n: 824, o: "&nbumpe;" }], [0, { v: "&doteq;", n: 824, o: "&nedot;" }], [0, "&doteqdot;"], [0, "&efDot;"], [0, "&erDot;"], [0, "&Assign;"], [0, "&ecolon;"], [0, "&ecir;"], [0, "&circeq;"], [1, "&wedgeq;"], [0, "&veeeq;"], [1, "&triangleq;"], [2, "&equest;"], [0, "&ne;"], [0, { v: "&Congruent;", n: 8421, o: "&bnequiv;" }], [0, "&nequiv;"], [1, { v: "&le;", n: 8402, o: "&nvle;" }], [0, { v: "&ge;", n: 8402, o: "&nvge;" }], [0, { v: "&lE;", n: 824, o: "&nlE;" }], [0, { v: "&gE;", n: 824, o: "&ngE;" }], [0, { v: "&lnE;", n: 65024, o: "&lvertneqq;" }], [0, { v: "&gnE;", n: 65024, o: "&gvertneqq;" }], [0, { v: "&ll;", n: new Map(/* @__PURE__ */ restoreDiff([[824, "&nLtv;"], [7577, "&nLt;"]])) }], [0, { v: "&gg;", n: new Map(/* @__PURE__ */ restoreDiff([[824, "&nGtv;"], [7577, "&nGt;"]])) }], [0, "&between;"], [0, "&NotCupCap;"], [0, "&nless;"], [0, "&ngt;"], [0, "&nle;"], [0, "&nge;"], [0, "&lesssim;"], [0, "&GreaterTilde;"], [0, "&nlsim;"], [0, "&ngsim;"], [0, "&LessGreater;"], [0, "&gl;"], [0, "&NotLessGreater;"], [0, "&NotGreaterLess;"], [0, "&pr;"], [0, "&sc;"], [0, "&prcue;"], [0, "&sccue;"], [0, "&PrecedesTilde;"], [0, { v: "&scsim;", n: 824, o: "&NotSucceedsTilde;" }], [0, "&NotPrecedes;"], [0, "&NotSucceeds;"], [0, { v: "&sub;", n: 8402, o: "&NotSubset;" }], [0, { v: "&sup;", n: 8402, o: "&NotSuperset;" }], [0, "&nsub;"], [0, "&nsup;"], [0, "&sube;"], [0, "&supe;"], [0, "&NotSubsetEqual;"], [0, "&NotSupersetEqual;"], [0, { v: "&subne;", n: 65024, o: "&varsubsetneq;" }], [0, { v: "&supne;", n: 65024, o: "&varsupsetneq;" }], [1, "&cupdot;"], [0, "&UnionPlus;"], [0, { v: "&sqsub;", n: 824, o: "&NotSquareSubset;" }], [0, { v: "&sqsup;", n: 824, o: "&NotSquareSuperset;" }], [0, "&sqsube;"], [0, "&sqsupe;"], [0, { v: "&sqcap;", n: 65024, o: "&sqcaps;" }], [0, { v: "&sqcup;", n: 65024, o: "&sqcups;" }], [0, "&CirclePlus;"], [0, "&CircleMinus;"], [0, "&CircleTimes;"], [0, "&osol;"], [0, "&CircleDot;"], [0, "&circledcirc;"], [0, "&circledast;"], [1, "&circleddash;"], [0, "&boxplus;"], [0, "&boxminus;"], [0, "&boxtimes;"], [0, "&dotsquare;"], [0, "&RightTee;"], [0, "&dashv;"], [0, "&DownTee;"], [0, "&bot;"], [1, "&models;"], [0, "&DoubleRightTee;"], [0, "&Vdash;"], [0, "&Vvdash;"], [0, "&VDash;"], [0, "&nvdash;"], [0, "&nvDash;"], [0, "&nVdash;"], [0, "&nVDash;"], [0, "&prurel;"], [1, "&LeftTriangle;"], [0, "&RightTriangle;"], [0, { v: "&LeftTriangleEqual;", n: 8402, o: "&nvltrie;" }], [0, { v: "&RightTriangleEqual;", n: 8402, o: "&nvrtrie;" }], [0, "&origof;"], [0, "&imof;"], [0, "&multimap;"], [0, "&hercon;"], [0, "&intcal;"], [0, "&veebar;"], [1, "&barvee;"], [0, "&angrtvb;"], [0, "&lrtri;"], [0, "&bigwedge;"], [0, "&bigvee;"], [0, "&bigcap;"], [0, "&bigcup;"], [0, "&diam;"], [0, "&sdot;"], [0, "&sstarf;"], [0, "&divideontimes;"], [0, "&bowtie;"], [0, "&ltimes;"], [0, "&rtimes;"], [0, "&leftthreetimes;"], [0, "&rightthreetimes;"], [0, "&backsimeq;"], [0, "&curlyvee;"], [0, "&curlywedge;"], [0, "&Sub;"], [0, "&Sup;"], [0, "&Cap;"], [0, "&Cup;"], [0, "&fork;"], [0, "&epar;"], [0, "&lessdot;"], [0, "&gtdot;"], [0, { v: "&Ll;", n: 824, o: "&nLl;" }], [0, { v: "&Gg;", n: 824, o: "&nGg;" }], [0, { v: "&leg;", n: 65024, o: "&lesg;" }], [0, { v: "&gel;", n: 65024, o: "&gesl;" }], [2, "&cuepr;"], [0, "&cuesc;"], [0, "&NotPrecedesSlantEqual;"], [0, "&NotSucceedsSlantEqual;"], [0, "&NotSquareSubsetEqual;"], [0, "&NotSquareSupersetEqual;"], [2, "&lnsim;"], [0, "&gnsim;"], [0, "&precnsim;"], [0, "&scnsim;"], [0, "&nltri;"], [0, "&NotRightTriangle;"], [0, "&nltrie;"], [0, "&NotRightTriangleEqual;"], [0, "&vellip;"], [0, "&ctdot;"], [0, "&utdot;"], [0, "&dtdot;"], [0, "&disin;"], [0, "&isinsv;"], [0, "&isins;"], [0, { v: "&isindot;", n: 824, o: "&notindot;" }], [0, "&notinvc;"], [0, "&notinvb;"], [1, { v: "&isinE;", n: 824, o: "&notinE;" }], [0, "&nisd;"], [0, "&xnis;"], [0, "&nis;"], [0, "&notnivc;"], [0, "&notnivb;"], [6, "&barwed;"], [0, "&Barwed;"], [1, "&lceil;"], [0, "&rceil;"], [0, "&LeftFloor;"], [0, "&rfloor;"], [0, "&drcrop;"], [0, "&dlcrop;"], [0, "&urcrop;"], [0, "&ulcrop;"], [0, "&bnot;"], [1, "&profline;"], [0, "&profsurf;"], [1, "&telrec;"], [0, "&target;"], [5, "&ulcorn;"], [0, "&urcorn;"], [0, "&dlcorn;"], [0, "&drcorn;"], [2, "&frown;"], [0, "&smile;"], [9, "&cylcty;"], [0, "&profalar;"], [7, "&topbot;"], [6, "&ovbar;"], [1, "&solbar;"], [60, "&angzarr;"], [51, "&lmoustache;"], [0, "&rmoustache;"], [2, "&OverBracket;"], [0, "&bbrk;"], [0, "&bbrktbrk;"], [37, "&OverParenthesis;"], [0, "&UnderParenthesis;"], [0, "&OverBrace;"], [0, "&UnderBrace;"], [2, "&trpezium;"], [4, "&elinters;"], [59, "&blank;"], [164, "&circledS;"], [55, "&boxh;"], [1, "&boxv;"], [9, "&boxdr;"], [3, "&boxdl;"], [3, "&boxur;"], [3, "&boxul;"], [3, "&boxvr;"], [7, "&boxvl;"], [7, "&boxhd;"], [7, "&boxhu;"], [7, "&boxvh;"], [19, "&boxH;"], [0, "&boxV;"], [0, "&boxdR;"], [0, "&boxDr;"], [0, "&boxDR;"], [0, "&boxdL;"], [0, "&boxDl;"], [0, "&boxDL;"], [0, "&boxuR;"], [0, "&boxUr;"], [0, "&boxUR;"], [0, "&boxuL;"], [0, "&boxUl;"], [0, "&boxUL;"], [0, "&boxvR;"], [0, "&boxVr;"], [0, "&boxVR;"], [0, "&boxvL;"], [0, "&boxVl;"], [0, "&boxVL;"], [0, "&boxHd;"], [0, "&boxhD;"], [0, "&boxHD;"], [0, "&boxHu;"], [0, "&boxhU;"], [0, "&boxHU;"], [0, "&boxvH;"], [0, "&boxVh;"], [0, "&boxVH;"], [19, "&uhblk;"], [3, "&lhblk;"], [3, "&block;"], [8, "&blk14;"], [0, "&blk12;"], [0, "&blk34;"], [13, "&square;"], [8, "&blacksquare;"], [0, "&EmptyVerySmallSquare;"], [1, "&rect;"], [0, "&marker;"], [2, "&fltns;"], [1, "&bigtriangleup;"], [0, "&blacktriangle;"], [0, "&triangle;"], [2, "&blacktriangleright;"], [0, "&rtri;"], [3, "&bigtriangledown;"], [0, "&blacktriangledown;"], [0, "&dtri;"], [2, "&blacktriangleleft;"], [0, "&ltri;"], [6, "&loz;"], [0, "&cir;"], [32, "&tridot;"], [2, "&bigcirc;"], [8, "&ultri;"], [0, "&urtri;"], [0, "&lltri;"], [0, "&EmptySmallSquare;"], [0, "&FilledSmallSquare;"], [8, "&bigstar;"], [0, "&star;"], [7, "&phone;"], [49, "&female;"], [1, "&male;"], [29, "&spades;"], [2, "&clubs;"], [1, "&hearts;"], [0, "&diamondsuit;"], [3, "&sung;"], [2, "&flat;"], [0, "&natural;"], [0, "&sharp;"], [163, "&check;"], [3, "&cross;"], [8, "&malt;"], [21, "&sext;"], [33, "&VerticalSeparator;"], [25, "&lbbrk;"], [0, "&rbbrk;"], [84, "&bsolhsub;"], [0, "&suphsol;"], [28, "&LeftDoubleBracket;"], [0, "&RightDoubleBracket;"], [0, "&lang;"], [0, "&rang;"], [0, "&Lang;"], [0, "&Rang;"], [0, "&loang;"], [0, "&roang;"], [7, "&longleftarrow;"], [0, "&longrightarrow;"], [0, "&longleftrightarrow;"], [0, "&DoubleLongLeftArrow;"], [0, "&DoubleLongRightArrow;"], [0, "&DoubleLongLeftRightArrow;"], [1, "&longmapsto;"], [2, "&dzigrarr;"], [258, "&nvlArr;"], [0, "&nvrArr;"], [0, "&nvHarr;"], [0, "&Map;"], [6, "&lbarr;"], [0, "&bkarow;"], [0, "&lBarr;"], [0, "&dbkarow;"], [0, "&drbkarow;"], [0, "&DDotrahd;"], [0, "&UpArrowBar;"], [0, "&DownArrowBar;"], [2, "&Rarrtl;"], [2, "&latail;"], [0, "&ratail;"], [0, "&lAtail;"], [0, "&rAtail;"], [0, "&larrfs;"], [0, "&rarrfs;"], [0, "&larrbfs;"], [0, "&rarrbfs;"], [2, "&nwarhk;"], [0, "&nearhk;"], [0, "&hksearow;"], [0, "&hkswarow;"], [0, "&nwnear;"], [0, "&nesear;"], [0, "&seswar;"], [0, "&swnwar;"], [8, { v: "&rarrc;", n: 824, o: "&nrarrc;" }], [1, "&cudarrr;"], [0, "&ldca;"], [0, "&rdca;"], [0, "&cudarrl;"], [0, "&larrpl;"], [2, "&curarrm;"], [0, "&cularrp;"], [7, "&rarrpl;"], [2, "&harrcir;"], [0, "&Uarrocir;"], [0, "&lurdshar;"], [0, "&ldrushar;"], [2, "&LeftRightVector;"], [0, "&RightUpDownVector;"], [0, "&DownLeftRightVector;"], [0, "&LeftUpDownVector;"], [0, "&LeftVectorBar;"], [0, "&RightVectorBar;"], [0, "&RightUpVectorBar;"], [0, "&RightDownVectorBar;"], [0, "&DownLeftVectorBar;"], [0, "&DownRightVectorBar;"], [0, "&LeftUpVectorBar;"], [0, "&LeftDownVectorBar;"], [0, "&LeftTeeVector;"], [0, "&RightTeeVector;"], [0, "&RightUpTeeVector;"], [0, "&RightDownTeeVector;"], [0, "&DownLeftTeeVector;"], [0, "&DownRightTeeVector;"], [0, "&LeftUpTeeVector;"], [0, "&LeftDownTeeVector;"], [0, "&lHar;"], [0, "&uHar;"], [0, "&rHar;"], [0, "&dHar;"], [0, "&luruhar;"], [0, "&ldrdhar;"], [0, "&ruluhar;"], [0, "&rdldhar;"], [0, "&lharul;"], [0, "&llhard;"], [0, "&rharul;"], [0, "&lrhard;"], [0, "&udhar;"], [0, "&duhar;"], [0, "&RoundImplies;"], [0, "&erarr;"], [0, "&simrarr;"], [0, "&larrsim;"], [0, "&rarrsim;"], [0, "&rarrap;"], [0, "&ltlarr;"], [1, "&gtrarr;"], [0, "&subrarr;"], [1, "&suplarr;"], [0, "&lfisht;"], [0, "&rfisht;"], [0, "&ufisht;"], [0, "&dfisht;"], [5, "&lopar;"], [0, "&ropar;"], [4, "&lbrke;"], [0, "&rbrke;"], [0, "&lbrkslu;"], [0, "&rbrksld;"], [0, "&lbrksld;"], [0, "&rbrkslu;"], [0, "&langd;"], [0, "&rangd;"], [0, "&lparlt;"], [0, "&rpargt;"], [0, "&gtlPar;"], [0, "&ltrPar;"], [3, "&vzigzag;"], [1, "&vangrt;"], [0, "&angrtvbd;"], [6, "&ange;"], [0, "&range;"], [0, "&dwangle;"], [0, "&uwangle;"], [0, "&angmsdaa;"], [0, "&angmsdab;"], [0, "&angmsdac;"], [0, "&angmsdad;"], [0, "&angmsdae;"], [0, "&angmsdaf;"], [0, "&angmsdag;"], [0, "&angmsdah;"], [0, "&bemptyv;"], [0, "&demptyv;"], [0, "&cemptyv;"], [0, "&raemptyv;"], [0, "&laemptyv;"], [0, "&ohbar;"], [0, "&omid;"], [0, "&opar;"], [1, "&operp;"], [1, "&olcross;"], [0, "&odsold;"], [1, "&olcir;"], [0, "&ofcir;"], [0, "&olt;"], [0, "&ogt;"], [0, "&cirscir;"], [0, "&cirE;"], [0, "&solb;"], [0, "&bsolb;"], [3, "&boxbox;"], [3, "&trisb;"], [0, "&rtriltri;"], [0, { v: "&LeftTriangleBar;", n: 824, o: "&NotLeftTriangleBar;" }], [0, { v: "&RightTriangleBar;", n: 824, o: "&NotRightTriangleBar;" }], [11, "&iinfin;"], [0, "&infintie;"], [0, "&nvinfin;"], [4, "&eparsl;"], [0, "&smeparsl;"], [0, "&eqvparsl;"], [5, "&blacklozenge;"], [8, "&RuleDelayed;"], [1, "&dsol;"], [9, "&bigodot;"], [0, "&bigoplus;"], [0, "&bigotimes;"], [1, "&biguplus;"], [1, "&bigsqcup;"], [5, "&iiiint;"], [0, "&fpartint;"], [2, "&cirfnint;"], [0, "&awint;"], [0, "&rppolint;"], [0, "&scpolint;"], [0, "&npolint;"], [0, "&pointint;"], [0, "&quatint;"], [0, "&intlarhk;"], [10, "&pluscir;"], [0, "&plusacir;"], [0, "&simplus;"], [0, "&plusdu;"], [0, "&plussim;"], [0, "&plustwo;"], [1, "&mcomma;"], [0, "&minusdu;"], [2, "&loplus;"], [0, "&roplus;"], [0, "&Cross;"], [0, "&timesd;"], [0, "&timesbar;"], [1, "&smashp;"], [0, "&lotimes;"], [0, "&rotimes;"], [0, "&otimesas;"], [0, "&Otimes;"], [0, "&odiv;"], [0, "&triplus;"], [0, "&triminus;"], [0, "&tritime;"], [0, "&intprod;"], [2, "&amalg;"], [0, "&capdot;"], [1, "&ncup;"], [0, "&ncap;"], [0, "&capand;"], [0, "&cupor;"], [0, "&cupcap;"], [0, "&capcup;"], [0, "&cupbrcap;"], [0, "&capbrcup;"], [0, "&cupcup;"], [0, "&capcap;"], [0, "&ccups;"], [0, "&ccaps;"], [2, "&ccupssm;"], [2, "&And;"], [0, "&Or;"], [0, "&andand;"], [0, "&oror;"], [0, "&orslope;"], [0, "&andslope;"], [1, "&andv;"], [0, "&orv;"], [0, "&andd;"], [0, "&ord;"], [1, "&wedbar;"], [6, "&sdote;"], [3, "&simdot;"], [2, { v: "&congdot;", n: 824, o: "&ncongdot;" }], [0, "&easter;"], [0, "&apacir;"], [0, { v: "&apE;", n: 824, o: "&napE;" }], [0, "&eplus;"], [0, "&pluse;"], [0, "&Esim;"], [0, "&Colone;"], [0, "&Equal;"], [1, "&ddotseq;"], [0, "&equivDD;"], [0, "&ltcir;"], [0, "&gtcir;"], [0, "&ltquest;"], [0, "&gtquest;"], [0, { v: "&leqslant;", n: 824, o: "&nleqslant;" }], [0, { v: "&geqslant;", n: 824, o: "&ngeqslant;" }], [0, "&lesdot;"], [0, "&gesdot;"], [0, "&lesdoto;"], [0, "&gesdoto;"], [0, "&lesdotor;"], [0, "&gesdotol;"], [0, "&lap;"], [0, "&gap;"], [0, "&lne;"], [0, "&gne;"], [0, "&lnap;"], [0, "&gnap;"], [0, "&lEg;"], [0, "&gEl;"], [0, "&lsime;"], [0, "&gsime;"], [0, "&lsimg;"], [0, "&gsiml;"], [0, "&lgE;"], [0, "&glE;"], [0, "&lesges;"], [0, "&gesles;"], [0, "&els;"], [0, "&egs;"], [0, "&elsdot;"], [0, "&egsdot;"], [0, "&el;"], [0, "&eg;"], [2, "&siml;"], [0, "&simg;"], [0, "&simlE;"], [0, "&simgE;"], [0, { v: "&LessLess;", n: 824, o: "&NotNestedLessLess;" }], [0, { v: "&GreaterGreater;", n: 824, o: "&NotNestedGreaterGreater;" }], [1, "&glj;"], [0, "&gla;"], [0, "&ltcc;"], [0, "&gtcc;"], [0, "&lescc;"], [0, "&gescc;"], [0, "&smt;"], [0, "&lat;"], [0, { v: "&smte;", n: 65024, o: "&smtes;" }], [0, { v: "&late;", n: 65024, o: "&lates;" }], [0, "&bumpE;"], [0, { v: "&PrecedesEqual;", n: 824, o: "&NotPrecedesEqual;" }], [0, { v: "&sce;", n: 824, o: "&NotSucceedsEqual;" }], [2, "&prE;"], [0, "&scE;"], [0, "&precneqq;"], [0, "&scnE;"], [0, "&prap;"], [0, "&scap;"], [0, "&precnapprox;"], [0, "&scnap;"], [0, "&Pr;"], [0, "&Sc;"], [0, "&subdot;"], [0, "&supdot;"], [0, "&subplus;"], [0, "&supplus;"], [0, "&submult;"], [0, "&supmult;"], [0, "&subedot;"], [0, "&supedot;"], [0, { v: "&subE;", n: 824, o: "&nsubE;" }], [0, { v: "&supE;", n: 824, o: "&nsupE;" }], [0, "&subsim;"], [0, "&supsim;"], [2, { v: "&subnE;", n: 65024, o: "&varsubsetneqq;" }], [0, { v: "&supnE;", n: 65024, o: "&varsupsetneqq;" }], [2, "&csub;"], [0, "&csup;"], [0, "&csube;"], [0, "&csupe;"], [0, "&subsup;"], [0, "&supsub;"], [0, "&subsub;"], [0, "&supsup;"], [0, "&suphsub;"], [0, "&supdsub;"], [0, "&forkv;"], [0, "&topfork;"], [0, "&mlcp;"], [8, "&Dashv;"], [1, "&Vdashl;"], [0, "&Barv;"], [0, "&vBar;"], [0, "&vBarv;"], [1, "&Vbar;"], [0, "&Not;"], [0, "&bNot;"], [0, "&rnmid;"], [0, "&cirmid;"], [0, "&midcir;"], [0, "&topcir;"], [0, "&nhpar;"], [0, "&parsim;"], [9, { v: "&parsl;", n: 8421, o: "&nparsl;" }], [44343, { n: new Map(/* @__PURE__ */ restoreDiff([[56476, "&Ascr;"], [1, "&Cscr;"], [0, "&Dscr;"], [2, "&Gscr;"], [2, "&Jscr;"], [0, "&Kscr;"], [2, "&Nscr;"], [0, "&Oscr;"], [0, "&Pscr;"], [0, "&Qscr;"], [1, "&Sscr;"], [0, "&Tscr;"], [0, "&Uscr;"], [0, "&Vscr;"], [0, "&Wscr;"], [0, "&Xscr;"], [0, "&Yscr;"], [0, "&Zscr;"], [0, "&ascr;"], [0, "&bscr;"], [0, "&cscr;"], [0, "&dscr;"], [1, "&fscr;"], [1, "&hscr;"], [0, "&iscr;"], [0, "&jscr;"], [0, "&kscr;"], [0, "&lscr;"], [0, "&mscr;"], [0, "&nscr;"], [1, "&pscr;"], [0, "&qscr;"], [0, "&rscr;"], [0, "&sscr;"], [0, "&tscr;"], [0, "&uscr;"], [0, "&vscr;"], [0, "&wscr;"], [0, "&xscr;"], [0, "&yscr;"], [0, "&zscr;"], [52, "&Afr;"], [0, "&Bfr;"], [1, "&Dfr;"], [0, "&Efr;"], [0, "&Ffr;"], [0, "&Gfr;"], [2, "&Jfr;"], [0, "&Kfr;"], [0, "&Lfr;"], [0, "&Mfr;"], [0, "&Nfr;"], [0, "&Ofr;"], [0, "&Pfr;"], [0, "&Qfr;"], [1, "&Sfr;"], [0, "&Tfr;"], [0, "&Ufr;"], [0, "&Vfr;"], [0, "&Wfr;"], [0, "&Xfr;"], [0, "&Yfr;"], [1, "&afr;"], [0, "&bfr;"], [0, "&cfr;"], [0, "&dfr;"], [0, "&efr;"], [0, "&ffr;"], [0, "&gfr;"], [0, "&hfr;"], [0, "&ifr;"], [0, "&jfr;"], [0, "&kfr;"], [0, "&lfr;"], [0, "&mfr;"], [0, "&nfr;"], [0, "&ofr;"], [0, "&pfr;"], [0, "&qfr;"], [0, "&rfr;"], [0, "&sfr;"], [0, "&tfr;"], [0, "&ufr;"], [0, "&vfr;"], [0, "&wfr;"], [0, "&xfr;"], [0, "&yfr;"], [0, "&zfr;"], [0, "&Aopf;"], [0, "&Bopf;"], [1, "&Dopf;"], [0, "&Eopf;"], [0, "&Fopf;"], [0, "&Gopf;"], [1, "&Iopf;"], [0, "&Jopf;"], [0, "&Kopf;"], [0, "&Lopf;"], [0, "&Mopf;"], [1, "&Oopf;"], [3, "&Sopf;"], [0, "&Topf;"], [0, "&Uopf;"], [0, "&Vopf;"], [0, "&Wopf;"], [0, "&Xopf;"], [0, "&Yopf;"], [1, "&aopf;"], [0, "&bopf;"], [0, "&copf;"], [0, "&dopf;"], [0, "&eopf;"], [0, "&fopf;"], [0, "&gopf;"], [0, "&hopf;"], [0, "&iopf;"], [0, "&jopf;"], [0, "&kopf;"], [0, "&lopf;"], [0, "&mopf;"], [0, "&nopf;"], [0, "&oopf;"], [0, "&popf;"], [0, "&qopf;"], [0, "&ropf;"], [0, "&sopf;"], [0, "&topf;"], [0, "&uopf;"], [0, "&vopf;"], [0, "&wopf;"], [0, "&xopf;"], [0, "&yopf;"], [0, "&zopf;"]])) }], [8906, "&fflig;"], [0, "&filig;"], [0, "&fllig;"], [0, "&ffilig;"], [0, "&ffllig;"]]));

// ../english-lint/node_modules/entities/lib/esm/escape.js
var xmlReplacer = /["&'<>$\x80-\uFFFF]/g;
var xmlCodeMap = /* @__PURE__ */ new Map([
  [34, "&quot;"],
  [38, "&amp;"],
  [39, "&apos;"],
  [60, "&lt;"],
  [62, "&gt;"]
]);
var getCodePoint = (
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  String.prototype.codePointAt != null ? (str, index) => str.codePointAt(index) : (
    // http://mathiasbynens.be/notes/javascript-encoding#surrogate-formulae
    (c, index) => (c.charCodeAt(index) & 64512) === 55296 ? (c.charCodeAt(index) - 55296) * 1024 + c.charCodeAt(index + 1) - 56320 + 65536 : c.charCodeAt(index)
  )
);
function encodeXML(str) {
  let ret = "";
  let lastIdx = 0;
  let match;
  while ((match = xmlReplacer.exec(str)) !== null) {
    const i = match.index;
    const char = str.charCodeAt(i);
    const next = xmlCodeMap.get(char);
    if (next !== void 0) {
      ret += str.substring(lastIdx, i) + next;
      lastIdx = i + 1;
    } else {
      ret += `${str.substring(lastIdx, i)}&#x${getCodePoint(str, i).toString(16)};`;
      lastIdx = xmlReplacer.lastIndex += Number((char & 64512) === 55296);
    }
  }
  return ret + str.substr(lastIdx);
}
function getEscaper(regex, map) {
  return function escape2(data) {
    let match;
    let lastIdx = 0;
    let result = "";
    while (match = regex.exec(data)) {
      if (lastIdx !== match.index) {
        result += data.substring(lastIdx, match.index);
      }
      result += map.get(match[0].charCodeAt(0));
      lastIdx = match.index + 1;
    }
    return result + data.substring(lastIdx);
  };
}
var escapeUTF8 = getEscaper(/[&<>'"]/g, xmlCodeMap);
var escapeAttribute = getEscaper(/["&\u00A0]/g, /* @__PURE__ */ new Map([
  [34, "&quot;"],
  [38, "&amp;"],
  [160, "&nbsp;"]
]));
var escapeText = getEscaper(/[&<>\u00A0]/g, /* @__PURE__ */ new Map([
  [38, "&amp;"],
  [60, "&lt;"],
  [62, "&gt;"],
  [160, "&nbsp;"]
]));

// ../english-lint/node_modules/entities/lib/esm/index.js
var EntityLevel;
(function(EntityLevel2) {
  EntityLevel2[EntityLevel2["XML"] = 0] = "XML";
  EntityLevel2[EntityLevel2["HTML"] = 1] = "HTML";
})(EntityLevel || (EntityLevel = {}));
var EncodingMode;
(function(EncodingMode2) {
  EncodingMode2[EncodingMode2["UTF8"] = 0] = "UTF8";
  EncodingMode2[EncodingMode2["ASCII"] = 1] = "ASCII";
  EncodingMode2[EncodingMode2["Extensive"] = 2] = "Extensive";
  EncodingMode2[EncodingMode2["Attribute"] = 3] = "Attribute";
  EncodingMode2[EncodingMode2["Text"] = 4] = "Text";
})(EncodingMode || (EncodingMode = {}));

// ../english-lint/node_modules/dom-serializer/lib/esm/foreignNames.js
var elementNames = new Map([
  "altGlyph",
  "altGlyphDef",
  "altGlyphItem",
  "animateColor",
  "animateMotion",
  "animateTransform",
  "clipPath",
  "feBlend",
  "feColorMatrix",
  "feComponentTransfer",
  "feComposite",
  "feConvolveMatrix",
  "feDiffuseLighting",
  "feDisplacementMap",
  "feDistantLight",
  "feDropShadow",
  "feFlood",
  "feFuncA",
  "feFuncB",
  "feFuncG",
  "feFuncR",
  "feGaussianBlur",
  "feImage",
  "feMerge",
  "feMergeNode",
  "feMorphology",
  "feOffset",
  "fePointLight",
  "feSpecularLighting",
  "feSpotLight",
  "feTile",
  "feTurbulence",
  "foreignObject",
  "glyphRef",
  "linearGradient",
  "radialGradient",
  "textPath"
].map((val) => [val.toLowerCase(), val]));
var attributeNames = new Map([
  "definitionURL",
  "attributeName",
  "attributeType",
  "baseFrequency",
  "baseProfile",
  "calcMode",
  "clipPathUnits",
  "diffuseConstant",
  "edgeMode",
  "filterUnits",
  "glyphRef",
  "gradientTransform",
  "gradientUnits",
  "kernelMatrix",
  "kernelUnitLength",
  "keyPoints",
  "keySplines",
  "keyTimes",
  "lengthAdjust",
  "limitingConeAngle",
  "markerHeight",
  "markerUnits",
  "markerWidth",
  "maskContentUnits",
  "maskUnits",
  "numOctaves",
  "pathLength",
  "patternContentUnits",
  "patternTransform",
  "patternUnits",
  "pointsAtX",
  "pointsAtY",
  "pointsAtZ",
  "preserveAlpha",
  "preserveAspectRatio",
  "primitiveUnits",
  "refX",
  "refY",
  "repeatCount",
  "repeatDur",
  "requiredExtensions",
  "requiredFeatures",
  "specularConstant",
  "specularExponent",
  "spreadMethod",
  "startOffset",
  "stdDeviation",
  "stitchTiles",
  "surfaceScale",
  "systemLanguage",
  "tableValues",
  "targetX",
  "targetY",
  "textLength",
  "viewBox",
  "viewTarget",
  "xChannelSelector",
  "yChannelSelector",
  "zoomAndPan"
].map((val) => [val.toLowerCase(), val]));

// ../english-lint/node_modules/dom-serializer/lib/esm/index.js
var unencodedElements = /* @__PURE__ */ new Set([
  "style",
  "script",
  "xmp",
  "iframe",
  "noembed",
  "noframes",
  "plaintext",
  "noscript"
]);
function replaceQuotes(value) {
  return value.replace(/"/g, "&quot;");
}
function formatAttributes(attributes, opts) {
  var _a2;
  if (!attributes)
    return;
  const encode = ((_a2 = opts.encodeEntities) !== null && _a2 !== void 0 ? _a2 : opts.decodeEntities) === false ? replaceQuotes : opts.xmlMode || opts.encodeEntities !== "utf8" ? encodeXML : escapeAttribute;
  return Object.keys(attributes).map((key2) => {
    var _a3, _b;
    const value = (_a3 = attributes[key2]) !== null && _a3 !== void 0 ? _a3 : "";
    if (opts.xmlMode === "foreign") {
      key2 = (_b = attributeNames.get(key2)) !== null && _b !== void 0 ? _b : key2;
    }
    if (!opts.emptyAttrs && !opts.xmlMode && value === "") {
      return key2;
    }
    return `${key2}="${encode(value)}"`;
  }).join(" ");
}
var singleTag = /* @__PURE__ */ new Set([
  "area",
  "base",
  "basefont",
  "br",
  "col",
  "command",
  "embed",
  "frame",
  "hr",
  "img",
  "input",
  "isindex",
  "keygen",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr"
]);
function render(node, options = {}) {
  const nodes = "length" in node ? node : [node];
  let output = "";
  for (let i = 0; i < nodes.length; i++) {
    output += renderNode(nodes[i], options);
  }
  return output;
}
var esm_default = render;
function renderNode(node, options) {
  switch (node.type) {
    case Root:
      return render(node.children, options);
    // @ts-expect-error We don't use `Doctype` yet
    case Doctype:
    case Directive:
      return renderDirective(node);
    case Comment:
      return renderComment(node);
    case CDATA:
      return renderCdata(node);
    case Script:
    case Style:
    case Tag:
      return renderTag(node, options);
    case Text:
      return renderText(node, options);
  }
}
var foreignModeIntegrationPoints = /* @__PURE__ */ new Set([
  "mi",
  "mo",
  "mn",
  "ms",
  "mtext",
  "annotation-xml",
  "foreignObject",
  "desc",
  "title"
]);
var foreignElements = /* @__PURE__ */ new Set(["svg", "math"]);
function renderTag(elem, opts) {
  var _a2;
  if (opts.xmlMode === "foreign") {
    elem.name = (_a2 = elementNames.get(elem.name)) !== null && _a2 !== void 0 ? _a2 : elem.name;
    if (elem.parent && foreignModeIntegrationPoints.has(elem.parent.name)) {
      opts = { ...opts, xmlMode: false };
    }
  }
  if (!opts.xmlMode && foreignElements.has(elem.name)) {
    opts = { ...opts, xmlMode: "foreign" };
  }
  let tag2 = `<${elem.name}`;
  const attribs = formatAttributes(elem.attribs, opts);
  if (attribs) {
    tag2 += ` ${attribs}`;
  }
  if (elem.children.length === 0 && (opts.xmlMode ? (
    // In XML mode or foreign mode, and user hasn't explicitly turned off self-closing tags
    opts.selfClosingTags !== false
  ) : (
    // User explicitly asked for self-closing tags, even in HTML mode
    opts.selfClosingTags && singleTag.has(elem.name)
  ))) {
    if (!opts.xmlMode)
      tag2 += " ";
    tag2 += "/>";
  } else {
    tag2 += ">";
    if (elem.children.length > 0) {
      tag2 += render(elem.children, opts);
    }
    if (opts.xmlMode || !singleTag.has(elem.name)) {
      tag2 += `</${elem.name}>`;
    }
  }
  return tag2;
}
function renderDirective(elem) {
  return `<${elem.data}>`;
}
function renderText(elem, opts) {
  var _a2;
  let data = elem.data || "";
  if (((_a2 = opts.encodeEntities) !== null && _a2 !== void 0 ? _a2 : opts.decodeEntities) !== false && !(!opts.xmlMode && elem.parent && unencodedElements.has(elem.parent.name))) {
    data = opts.xmlMode || opts.encodeEntities !== "utf8" ? encodeXML(data) : escapeText(data);
  }
  return data;
}
function renderCdata(elem) {
  return `<![CDATA[${elem.children[0].data}]]>`;
}
function renderComment(elem) {
  return `<!--${elem.data}-->`;
}

// ../english-lint/node_modules/domutils/lib/esm/stringify.js
function getOuterHTML(node, options) {
  return esm_default(node, options);
}
function getInnerHTML(node, options) {
  return hasChildren(node) ? node.children.map((node2) => getOuterHTML(node2, options)).join("") : "";
}
function getText(node) {
  if (Array.isArray(node))
    return node.map(getText).join("");
  if (isTag2(node))
    return node.name === "br" ? "\n" : getText(node.children);
  if (isCDATA(node))
    return getText(node.children);
  if (isText(node))
    return node.data;
  return "";
}
function textContent(node) {
  if (Array.isArray(node))
    return node.map(textContent).join("");
  if (hasChildren(node) && !isComment(node)) {
    return textContent(node.children);
  }
  if (isText(node))
    return node.data;
  return "";
}
function innerText(node) {
  if (Array.isArray(node))
    return node.map(innerText).join("");
  if (hasChildren(node) && (node.type === ElementType.Tag || isCDATA(node))) {
    return innerText(node.children);
  }
  if (isText(node))
    return node.data;
  return "";
}

// ../english-lint/node_modules/domutils/lib/esm/traversal.js
function getChildren(elem) {
  return hasChildren(elem) ? elem.children : [];
}
function getParent(elem) {
  return elem.parent || null;
}
function getSiblings(elem) {
  const parent = getParent(elem);
  if (parent != null)
    return getChildren(parent);
  const siblings = [elem];
  let { prev, next } = elem;
  while (prev != null) {
    siblings.unshift(prev);
    ({ prev } = prev);
  }
  while (next != null) {
    siblings.push(next);
    ({ next } = next);
  }
  return siblings;
}
function getAttributeValue(elem, name) {
  var _a2;
  return (_a2 = elem.attribs) === null || _a2 === void 0 ? void 0 : _a2[name];
}
function hasAttrib(elem, name) {
  return elem.attribs != null && Object.prototype.hasOwnProperty.call(elem.attribs, name) && elem.attribs[name] != null;
}
function getName(elem) {
  return elem.name;
}
function nextElementSibling(elem) {
  let { next } = elem;
  while (next !== null && !isTag2(next))
    ({ next } = next);
  return next;
}
function prevElementSibling(elem) {
  let { prev } = elem;
  while (prev !== null && !isTag2(prev))
    ({ prev } = prev);
  return prev;
}

// ../english-lint/node_modules/domutils/lib/esm/manipulation.js
function removeElement(elem) {
  if (elem.prev)
    elem.prev.next = elem.next;
  if (elem.next)
    elem.next.prev = elem.prev;
  if (elem.parent) {
    const childs = elem.parent.children;
    const childsIndex = childs.lastIndexOf(elem);
    if (childsIndex >= 0) {
      childs.splice(childsIndex, 1);
    }
  }
  elem.next = null;
  elem.prev = null;
  elem.parent = null;
}
function replaceElement(elem, replacement) {
  const prev = replacement.prev = elem.prev;
  if (prev) {
    prev.next = replacement;
  }
  const next = replacement.next = elem.next;
  if (next) {
    next.prev = replacement;
  }
  const parent = replacement.parent = elem.parent;
  if (parent) {
    const childs = parent.children;
    childs[childs.lastIndexOf(elem)] = replacement;
    elem.parent = null;
  }
}
function appendChild(parent, child) {
  removeElement(child);
  child.next = null;
  child.parent = parent;
  if (parent.children.push(child) > 1) {
    const sibling = parent.children[parent.children.length - 2];
    sibling.next = child;
    child.prev = sibling;
  } else {
    child.prev = null;
  }
}
function append(elem, next) {
  removeElement(next);
  const { parent } = elem;
  const currNext = elem.next;
  next.next = currNext;
  next.prev = elem;
  elem.next = next;
  next.parent = parent;
  if (currNext) {
    currNext.prev = next;
    if (parent) {
      const childs = parent.children;
      childs.splice(childs.lastIndexOf(currNext), 0, next);
    }
  } else if (parent) {
    parent.children.push(next);
  }
}
function prependChild(parent, child) {
  removeElement(child);
  child.parent = parent;
  child.prev = null;
  if (parent.children.unshift(child) !== 1) {
    const sibling = parent.children[1];
    sibling.prev = child;
    child.next = sibling;
  } else {
    child.next = null;
  }
}
function prepend(elem, prev) {
  removeElement(prev);
  const { parent } = elem;
  if (parent) {
    const childs = parent.children;
    childs.splice(childs.indexOf(elem), 0, prev);
  }
  if (elem.prev) {
    elem.prev.next = prev;
  }
  prev.parent = parent;
  prev.prev = elem.prev;
  prev.next = elem;
  elem.prev = prev;
}

// ../english-lint/node_modules/domutils/lib/esm/querying.js
function filter(test, node, recurse = true, limit = Infinity) {
  return find(test, Array.isArray(node) ? node : [node], recurse, limit);
}
function find(test, nodes, recurse, limit) {
  const result = [];
  const nodeStack = [Array.isArray(nodes) ? nodes : [nodes]];
  const indexStack = [0];
  for (; ; ) {
    if (indexStack[0] >= nodeStack[0].length) {
      if (indexStack.length === 1) {
        return result;
      }
      nodeStack.shift();
      indexStack.shift();
      continue;
    }
    const elem = nodeStack[0][indexStack[0]++];
    if (test(elem)) {
      result.push(elem);
      if (--limit <= 0)
        return result;
    }
    if (recurse && hasChildren(elem) && elem.children.length > 0) {
      indexStack.unshift(0);
      nodeStack.unshift(elem.children);
    }
  }
}
function findOneChild(test, nodes) {
  return nodes.find(test);
}
function findOne(test, nodes, recurse = true) {
  const searchedNodes = Array.isArray(nodes) ? nodes : [nodes];
  for (let i = 0; i < searchedNodes.length; i++) {
    const node = searchedNodes[i];
    if (isTag2(node) && test(node)) {
      return node;
    }
    if (recurse && hasChildren(node) && node.children.length > 0) {
      const found = findOne(test, node.children, true);
      if (found)
        return found;
    }
  }
  return null;
}
function existsOne(test, nodes) {
  return (Array.isArray(nodes) ? nodes : [nodes]).some((node) => isTag2(node) && test(node) || hasChildren(node) && existsOne(test, node.children));
}
function findAll(test, nodes) {
  const result = [];
  const nodeStack = [Array.isArray(nodes) ? nodes : [nodes]];
  const indexStack = [0];
  for (; ; ) {
    if (indexStack[0] >= nodeStack[0].length) {
      if (nodeStack.length === 1) {
        return result;
      }
      nodeStack.shift();
      indexStack.shift();
      continue;
    }
    const elem = nodeStack[0][indexStack[0]++];
    if (isTag2(elem) && test(elem))
      result.push(elem);
    if (hasChildren(elem) && elem.children.length > 0) {
      indexStack.unshift(0);
      nodeStack.unshift(elem.children);
    }
  }
}

// ../english-lint/node_modules/domutils/lib/esm/legacy.js
var Checks = {
  tag_name(name) {
    if (typeof name === "function") {
      return (elem) => isTag2(elem) && name(elem.name);
    } else if (name === "*") {
      return isTag2;
    }
    return (elem) => isTag2(elem) && elem.name === name;
  },
  tag_type(type) {
    if (typeof type === "function") {
      return (elem) => type(elem.type);
    }
    return (elem) => elem.type === type;
  },
  tag_contains(data) {
    if (typeof data === "function") {
      return (elem) => isText(elem) && data(elem.data);
    }
    return (elem) => isText(elem) && elem.data === data;
  }
};
function getAttribCheck(attrib, value) {
  if (typeof value === "function") {
    return (elem) => isTag2(elem) && value(elem.attribs[attrib]);
  }
  return (elem) => isTag2(elem) && elem.attribs[attrib] === value;
}
function combineFuncs(a, b) {
  return (elem) => a(elem) || b(elem);
}
function compileTest(options) {
  const funcs = Object.keys(options).map((key2) => {
    const value = options[key2];
    return Object.prototype.hasOwnProperty.call(Checks, key2) ? Checks[key2](value) : getAttribCheck(key2, value);
  });
  return funcs.length === 0 ? null : funcs.reduce(combineFuncs);
}
function testElement(options, node) {
  const test = compileTest(options);
  return test ? test(node) : true;
}
function getElements(options, nodes, recurse, limit = Infinity) {
  const test = compileTest(options);
  return test ? filter(test, nodes, recurse, limit) : [];
}
function getElementById(id, nodes, recurse = true) {
  if (!Array.isArray(nodes))
    nodes = [nodes];
  return findOne(getAttribCheck("id", id), nodes, recurse);
}
function getElementsByTagName(tagName, nodes, recurse = true, limit = Infinity) {
  return filter(Checks["tag_name"](tagName), nodes, recurse, limit);
}
function getElementsByClassName(className, nodes, recurse = true, limit = Infinity) {
  return filter(getAttribCheck("class", className), nodes, recurse, limit);
}
function getElementsByTagType(type, nodes, recurse = true, limit = Infinity) {
  return filter(Checks["tag_type"](type), nodes, recurse, limit);
}

// ../english-lint/node_modules/domutils/lib/esm/helpers.js
function removeSubsets(nodes) {
  let idx = nodes.length;
  while (--idx >= 0) {
    const node = nodes[idx];
    if (idx > 0 && nodes.lastIndexOf(node, idx - 1) >= 0) {
      nodes.splice(idx, 1);
      continue;
    }
    for (let ancestor = node.parent; ancestor; ancestor = ancestor.parent) {
      if (nodes.includes(ancestor)) {
        nodes.splice(idx, 1);
        break;
      }
    }
  }
  return nodes;
}
var DocumentPosition;
(function(DocumentPosition2) {
  DocumentPosition2[DocumentPosition2["DISCONNECTED"] = 1] = "DISCONNECTED";
  DocumentPosition2[DocumentPosition2["PRECEDING"] = 2] = "PRECEDING";
  DocumentPosition2[DocumentPosition2["FOLLOWING"] = 4] = "FOLLOWING";
  DocumentPosition2[DocumentPosition2["CONTAINS"] = 8] = "CONTAINS";
  DocumentPosition2[DocumentPosition2["CONTAINED_BY"] = 16] = "CONTAINED_BY";
})(DocumentPosition || (DocumentPosition = {}));
function compareDocumentPosition(nodeA, nodeB) {
  const aParents = [];
  const bParents = [];
  if (nodeA === nodeB) {
    return 0;
  }
  let current = hasChildren(nodeA) ? nodeA : nodeA.parent;
  while (current) {
    aParents.unshift(current);
    current = current.parent;
  }
  current = hasChildren(nodeB) ? nodeB : nodeB.parent;
  while (current) {
    bParents.unshift(current);
    current = current.parent;
  }
  const maxIdx = Math.min(aParents.length, bParents.length);
  let idx = 0;
  while (idx < maxIdx && aParents[idx] === bParents[idx]) {
    idx++;
  }
  if (idx === 0) {
    return DocumentPosition.DISCONNECTED;
  }
  const sharedParent = aParents[idx - 1];
  const siblings = sharedParent.children;
  const aSibling = aParents[idx];
  const bSibling = bParents[idx];
  if (siblings.indexOf(aSibling) > siblings.indexOf(bSibling)) {
    if (sharedParent === nodeB) {
      return DocumentPosition.FOLLOWING | DocumentPosition.CONTAINED_BY;
    }
    return DocumentPosition.FOLLOWING;
  }
  if (sharedParent === nodeA) {
    return DocumentPosition.PRECEDING | DocumentPosition.CONTAINS;
  }
  return DocumentPosition.PRECEDING;
}
function uniqueSort(nodes) {
  nodes = nodes.filter((node, i, arr) => !arr.includes(node, i + 1));
  nodes.sort((a, b) => {
    const relative = compareDocumentPosition(a, b);
    if (relative & DocumentPosition.PRECEDING) {
      return -1;
    } else if (relative & DocumentPosition.FOLLOWING) {
      return 1;
    }
    return 0;
  });
  return nodes;
}

// ../english-lint/node_modules/domutils/lib/esm/feeds.js
function getFeed(doc) {
  const feedRoot = getOneElement(isValidFeed, doc);
  return !feedRoot ? null : feedRoot.name === "feed" ? getAtomFeed(feedRoot) : getRssFeed(feedRoot);
}
function getAtomFeed(feedRoot) {
  var _a2;
  const childs = feedRoot.children;
  const feed = {
    type: "atom",
    items: getElementsByTagName("entry", childs).map((item) => {
      var _a3;
      const { children } = item;
      const entry = { media: getMediaElements(children) };
      addConditionally(entry, "id", "id", children);
      addConditionally(entry, "title", "title", children);
      const href2 = (_a3 = getOneElement("link", children)) === null || _a3 === void 0 ? void 0 : _a3.attribs["href"];
      if (href2) {
        entry.link = href2;
      }
      const description = fetch("summary", children) || fetch("content", children);
      if (description) {
        entry.description = description;
      }
      const pubDate = fetch("updated", children);
      if (pubDate) {
        entry.pubDate = new Date(pubDate);
      }
      return entry;
    })
  };
  addConditionally(feed, "id", "id", childs);
  addConditionally(feed, "title", "title", childs);
  const href = (_a2 = getOneElement("link", childs)) === null || _a2 === void 0 ? void 0 : _a2.attribs["href"];
  if (href) {
    feed.link = href;
  }
  addConditionally(feed, "description", "subtitle", childs);
  const updated = fetch("updated", childs);
  if (updated) {
    feed.updated = new Date(updated);
  }
  addConditionally(feed, "author", "email", childs, true);
  return feed;
}
function getRssFeed(feedRoot) {
  var _a2, _b;
  const childs = (_b = (_a2 = getOneElement("channel", feedRoot.children)) === null || _a2 === void 0 ? void 0 : _a2.children) !== null && _b !== void 0 ? _b : [];
  const feed = {
    type: feedRoot.name.substr(0, 3),
    id: "",
    items: getElementsByTagName("item", feedRoot.children).map((item) => {
      const { children } = item;
      const entry = { media: getMediaElements(children) };
      addConditionally(entry, "id", "guid", children);
      addConditionally(entry, "title", "title", children);
      addConditionally(entry, "link", "link", children);
      addConditionally(entry, "description", "description", children);
      const pubDate = fetch("pubDate", children) || fetch("dc:date", children);
      if (pubDate)
        entry.pubDate = new Date(pubDate);
      return entry;
    })
  };
  addConditionally(feed, "title", "title", childs);
  addConditionally(feed, "link", "link", childs);
  addConditionally(feed, "description", "description", childs);
  const updated = fetch("lastBuildDate", childs);
  if (updated) {
    feed.updated = new Date(updated);
  }
  addConditionally(feed, "author", "managingEditor", childs, true);
  return feed;
}
var MEDIA_KEYS_STRING = ["url", "type", "lang"];
var MEDIA_KEYS_INT = [
  "fileSize",
  "bitrate",
  "framerate",
  "samplingrate",
  "channels",
  "duration",
  "height",
  "width"
];
function getMediaElements(where) {
  return getElementsByTagName("media:content", where).map((elem) => {
    const { attribs } = elem;
    const media = {
      medium: attribs["medium"],
      isDefault: !!attribs["isDefault"]
    };
    for (const attrib of MEDIA_KEYS_STRING) {
      if (attribs[attrib]) {
        media[attrib] = attribs[attrib];
      }
    }
    for (const attrib of MEDIA_KEYS_INT) {
      if (attribs[attrib]) {
        media[attrib] = parseInt(attribs[attrib], 10);
      }
    }
    if (attribs["expression"]) {
      media.expression = attribs["expression"];
    }
    return media;
  });
}
function getOneElement(tagName, node) {
  return getElementsByTagName(tagName, node, true, 1)[0];
}
function fetch(tagName, where, recurse = false) {
  return textContent(getElementsByTagName(tagName, where, recurse, 1)).trim();
}
function addConditionally(obj, prop, tagName, where, recurse = false) {
  const val = fetch(tagName, where, recurse);
  if (val)
    obj[prop] = val;
}
function isValidFeed(value) {
  return value === "rss" || value === "feed" || value === "rdf:RDF";
}

// ../english-lint/node_modules/css-select/dist/esm/compile.js
var boolbase5 = __toESM(require_boolbase(), 1);

// ../english-lint/node_modules/css-select/dist/esm/attributes.js
var boolbase = __toESM(require_boolbase(), 1);
var reChars = /[-[\]{}()*+?.,\\^$|#\s]/g;
function escapeRegex(value) {
  return value.replace(reChars, "\\$&");
}
var caseInsensitiveAttributes = /* @__PURE__ */ new Set([
  "accept",
  "accept-charset",
  "align",
  "alink",
  "axis",
  "bgcolor",
  "charset",
  "checked",
  "clear",
  "codetype",
  "color",
  "compact",
  "declare",
  "defer",
  "dir",
  "direction",
  "disabled",
  "enctype",
  "face",
  "frame",
  "hreflang",
  "http-equiv",
  "lang",
  "language",
  "link",
  "media",
  "method",
  "multiple",
  "nohref",
  "noresize",
  "noshade",
  "nowrap",
  "readonly",
  "rel",
  "rev",
  "rules",
  "scope",
  "scrolling",
  "selected",
  "shape",
  "target",
  "text",
  "type",
  "valign",
  "valuetype",
  "vlink"
]);
function shouldIgnoreCase(selector, options) {
  return typeof selector.ignoreCase === "boolean" ? selector.ignoreCase : selector.ignoreCase === "quirks" ? !!options.quirksMode : !options.xmlMode && caseInsensitiveAttributes.has(selector.name);
}
var attributeRules = {
  equals(next, data, options) {
    const { adapter } = options;
    const { name } = data;
    let { value } = data;
    if (shouldIgnoreCase(data, options)) {
      value = value.toLowerCase();
      return (elem) => {
        const attr = adapter.getAttributeValue(elem, name);
        return attr != null && attr.length === value.length && attr.toLowerCase() === value && next(elem);
      };
    }
    return (elem) => adapter.getAttributeValue(elem, name) === value && next(elem);
  },
  hyphen(next, data, options) {
    const { adapter } = options;
    const { name } = data;
    let { value } = data;
    const len = value.length;
    if (shouldIgnoreCase(data, options)) {
      value = value.toLowerCase();
      return function hyphenIC(elem) {
        const attr = adapter.getAttributeValue(elem, name);
        return attr != null && (attr.length === len || attr.charAt(len) === "-") && attr.substr(0, len).toLowerCase() === value && next(elem);
      };
    }
    return function hyphen(elem) {
      const attr = adapter.getAttributeValue(elem, name);
      return attr != null && (attr.length === len || attr.charAt(len) === "-") && attr.substr(0, len) === value && next(elem);
    };
  },
  element(next, data, options) {
    const { adapter } = options;
    const { name, value } = data;
    if (/\s/.test(value)) {
      return boolbase.falseFunc;
    }
    const regex = new RegExp(`(?:^|\\s)${escapeRegex(value)}(?:$|\\s)`, shouldIgnoreCase(data, options) ? "i" : "");
    return function element(elem) {
      const attr = adapter.getAttributeValue(elem, name);
      return attr != null && attr.length >= value.length && regex.test(attr) && next(elem);
    };
  },
  exists(next, { name }, { adapter }) {
    return (elem) => adapter.hasAttrib(elem, name) && next(elem);
  },
  start(next, data, options) {
    const { adapter } = options;
    const { name } = data;
    let { value } = data;
    const len = value.length;
    if (len === 0) {
      return boolbase.falseFunc;
    }
    if (shouldIgnoreCase(data, options)) {
      value = value.toLowerCase();
      return (elem) => {
        const attr = adapter.getAttributeValue(elem, name);
        return attr != null && attr.length >= len && attr.substr(0, len).toLowerCase() === value && next(elem);
      };
    }
    return (elem) => !!adapter.getAttributeValue(elem, name)?.startsWith(value) && next(elem);
  },
  end(next, data, options) {
    const { adapter } = options;
    const { name } = data;
    let { value } = data;
    const len = -value.length;
    if (len === 0) {
      return boolbase.falseFunc;
    }
    if (shouldIgnoreCase(data, options)) {
      value = value.toLowerCase();
      return (elem) => adapter.getAttributeValue(elem, name)?.substr(len).toLowerCase() === value && next(elem);
    }
    return (elem) => !!adapter.getAttributeValue(elem, name)?.endsWith(value) && next(elem);
  },
  any(next, data, options) {
    const { adapter } = options;
    const { name, value } = data;
    if (value === "") {
      return boolbase.falseFunc;
    }
    if (shouldIgnoreCase(data, options)) {
      const regex = new RegExp(escapeRegex(value), "i");
      return function anyIC(elem) {
        const attr = adapter.getAttributeValue(elem, name);
        return attr != null && attr.length >= value.length && regex.test(attr) && next(elem);
      };
    }
    return (elem) => !!adapter.getAttributeValue(elem, name)?.includes(value) && next(elem);
  },
  not(next, data, options) {
    const { adapter } = options;
    const { name } = data;
    let { value } = data;
    if (value === "") {
      return (elem) => !!adapter.getAttributeValue(elem, name) && next(elem);
    }
    if (shouldIgnoreCase(data, options)) {
      value = value.toLowerCase();
      return (elem) => {
        const attr = adapter.getAttributeValue(elem, name);
        return (attr == null || attr.length !== value.length || attr.toLowerCase() !== value) && next(elem);
      };
    }
    return (elem) => adapter.getAttributeValue(elem, name) !== value && next(elem);
  }
};

// ../english-lint/node_modules/css-select/dist/esm/helpers/querying.js
function findAll2(query, elems, options) {
  const { adapter, xmlMode = false } = options;
  const result = [];
  const nodeStack = [elems];
  const indexStack = [0];
  for (; ; ) {
    if (indexStack[0] >= nodeStack[0].length) {
      if (nodeStack.length === 1) {
        return result;
      }
      nodeStack.shift();
      indexStack.shift();
      continue;
    }
    const elem = nodeStack[0][indexStack[0]++];
    if (!adapter.isTag(elem)) {
      continue;
    }
    if (query(elem)) {
      result.push(elem);
    }
    if (xmlMode || adapter.getName(elem) !== "template") {
      const children = adapter.getChildren(elem);
      if (children.length > 0) {
        nodeStack.unshift(children);
        indexStack.unshift(0);
      }
    }
  }
}
function findOne2(query, elems, options) {
  const { adapter, xmlMode = false } = options;
  const nodeStack = [elems];
  const indexStack = [0];
  for (; ; ) {
    if (indexStack[0] >= nodeStack[0].length) {
      if (nodeStack.length === 1) {
        return null;
      }
      nodeStack.shift();
      indexStack.shift();
      continue;
    }
    const elem = nodeStack[0][indexStack[0]++];
    if (!adapter.isTag(elem)) {
      continue;
    }
    if (query(elem)) {
      return elem;
    }
    if (xmlMode || adapter.getName(elem) !== "template") {
      const children = adapter.getChildren(elem);
      if (children.length > 0) {
        nodeStack.unshift(children);
        indexStack.unshift(0);
      }
    }
  }
}
function getNextSiblings(elem, adapter) {
  const siblings = adapter.getSiblings(elem);
  if (siblings.length <= 1) {
    return [];
  }
  const elemIndex = siblings.indexOf(elem);
  if (elemIndex < 0 || elemIndex === siblings.length - 1) {
    return [];
  }
  return siblings.slice(elemIndex + 1).filter(adapter.isTag);
}
function getElementParent(node, adapter) {
  const parent = adapter.getParent(node);
  return parent != null && adapter.isTag(parent) ? parent : null;
}

// ../english-lint/node_modules/css-select/dist/esm/pseudo-selectors/aliases.js
var textControl = "input:is([type=text i],[type=search i],[type=url i],[type=tel i],[type=email i],[type=password i],[type=date i],[type=month i],[type=week i],[type=time i],[type=datetime-local i],[type=number i])";
var aliases = {
  // Links
  "any-link": ":is(a, area, link)[href]",
  link: ":any-link:not(:visited)",
  // Forms
  // https://html.spec.whatwg.org/multipage/scripting.html#disabled-elements
  disabled: `:is(
        :is(button, input, select, textarea, optgroup, option)[disabled],
        optgroup[disabled] > option,
        fieldset[disabled]:not(fieldset[disabled] legend:first-of-type *)
    )`,
  enabled: ":not(:disabled)",
  checked: ":is(:is(input[type=radio], input[type=checkbox])[checked], :selected)",
  required: ":is(input, select, textarea)[required]",
  optional: ":is(input, select, textarea):not([required])",
  "read-only": `[readonly]:is(textarea, ${textControl})`,
  "read-write": `:not([readonly]):is(textarea, ${textControl})`,
  // JQuery extensions
  /**
   * `:selected` matches option elements that have the `selected` attribute,
   * or are the first option element in a select element that does not have
   * the `multiple` attribute and does not have any option elements with the
   * `selected` attribute.
   *
   * @see https://html.spec.whatwg.org/multipage/form-elements.html#concept-option-selectedness
   */
  selected: "option:is([selected], select:not([multiple]):not(:has(> option[selected])) > :first-of-type)",
  checkbox: "[type=checkbox]",
  file: "[type=file]",
  password: "[type=password]",
  radio: "[type=radio]",
  reset: "[type=reset]",
  image: "[type=image]",
  submit: "[type=submit]",
  parent: ":not(:empty)",
  header: ":is(h1, h2, h3, h4, h5, h6)",
  button: ":is(button, input[type=button])",
  input: ":is(input, textarea, select, button)",
  text: "input:is(:not([type!='']), [type=text])"
};

// ../english-lint/node_modules/css-select/dist/esm/pseudo-selectors/filters.js
var boolbase3 = __toESM(require_boolbase(), 1);

// ../english-lint/node_modules/nth-check/lib/esm/parse.js
var whitespace = /* @__PURE__ */ new Set([9, 10, 12, 13, 32]);
var ZERO = "0".charCodeAt(0);
var NINE = "9".charCodeAt(0);
function parse2(formula) {
  formula = formula.trim().toLowerCase();
  if (formula === "even") {
    return [2, 0];
  } else if (formula === "odd") {
    return [2, 1];
  }
  let idx = 0;
  let a = 0;
  let sign = readSign();
  let number = readNumber();
  if (idx < formula.length && formula.charAt(idx) === "n") {
    idx++;
    a = sign * (number !== null && number !== void 0 ? number : 1);
    skipWhitespace();
    if (idx < formula.length) {
      sign = readSign();
      skipWhitespace();
      number = readNumber();
    } else {
      sign = number = 0;
    }
  }
  if (number === null || idx < formula.length) {
    throw new Error(`n-th rule couldn't be parsed ('${formula}')`);
  }
  return [a, sign * number];
  function readSign() {
    if (formula.charAt(idx) === "-") {
      idx++;
      return -1;
    }
    if (formula.charAt(idx) === "+") {
      idx++;
    }
    return 1;
  }
  function readNumber() {
    const start = idx;
    let value = 0;
    while (idx < formula.length && formula.charCodeAt(idx) >= ZERO && formula.charCodeAt(idx) <= NINE) {
      value = value * 10 + (formula.charCodeAt(idx) - ZERO);
      idx++;
    }
    return idx === start ? null : value;
  }
  function skipWhitespace() {
    while (idx < formula.length && whitespace.has(formula.charCodeAt(idx))) {
      idx++;
    }
  }
}

// ../english-lint/node_modules/nth-check/lib/esm/compile.js
var import_boolbase = __toESM(require_boolbase(), 1);
function compile(parsed) {
  const a = parsed[0];
  const b = parsed[1] - 1;
  if (b < 0 && a <= 0)
    return import_boolbase.default.falseFunc;
  if (a === -1)
    return (index) => index <= b;
  if (a === 0)
    return (index) => index === b;
  if (a === 1)
    return b < 0 ? import_boolbase.default.trueFunc : (index) => index >= b;
  const absA = Math.abs(a);
  const bMod = (b % absA + absA) % absA;
  return a > 1 ? (index) => index >= b && index % absA === bMod : (index) => index <= b && index % absA === bMod;
}

// ../english-lint/node_modules/nth-check/lib/esm/index.js
function nthCheck(formula) {
  return compile(parse2(formula));
}

// ../english-lint/node_modules/css-select/dist/esm/helpers/cache.js
function cacheParentResults(next, { adapter, cacheResults }, matches) {
  if (cacheResults === false || typeof WeakMap === "undefined") {
    return (elem) => next(elem) && matches(elem);
  }
  const resultCache = /* @__PURE__ */ new WeakMap();
  function addResultToCache(elem) {
    const result = matches(elem);
    resultCache.set(elem, result);
    return result;
  }
  return function cachedMatcher(elem) {
    if (!next(elem)) {
      return false;
    }
    if (resultCache.has(elem)) {
      return resultCache.get(elem);
    }
    let node = elem;
    do {
      const parent = getElementParent(node, adapter);
      if (parent === null) {
        return addResultToCache(elem);
      }
      node = parent;
    } while (!resultCache.has(node));
    return resultCache.get(node) && addResultToCache(elem);
  };
}

// ../english-lint/node_modules/css-select/dist/esm/pseudo-selectors/filters.js
var filters = {
  contains(next, text, options) {
    const { getText: getText2 } = options.adapter;
    return cacheParentResults(next, options, (elem) => getText2(elem).includes(text));
  },
  icontains(next, text, options) {
    const itext = text.toLowerCase();
    const { getText: getText2 } = options.adapter;
    return cacheParentResults(next, options, (elem) => getText2(elem).toLowerCase().includes(itext));
  },
  // Location specific methods
  "nth-child"(next, rule, { adapter, equals }) {
    const func = nthCheck(rule);
    if (func === boolbase3.falseFunc) {
      return boolbase3.falseFunc;
    }
    if (func === boolbase3.trueFunc) {
      return (elem) => getElementParent(elem, adapter) !== null && next(elem);
    }
    return function nthChild(elem) {
      const siblings = adapter.getSiblings(elem);
      let pos = 0;
      for (let i = 0; i < siblings.length; i++) {
        if (equals(elem, siblings[i])) {
          break;
        }
        if (adapter.isTag(siblings[i])) {
          pos++;
        }
      }
      return func(pos) && next(elem);
    };
  },
  "nth-last-child"(next, rule, { adapter, equals }) {
    const func = nthCheck(rule);
    if (func === boolbase3.falseFunc) {
      return boolbase3.falseFunc;
    }
    if (func === boolbase3.trueFunc) {
      return (elem) => getElementParent(elem, adapter) !== null && next(elem);
    }
    return function nthLastChild(elem) {
      const siblings = adapter.getSiblings(elem);
      let pos = 0;
      for (let i = siblings.length - 1; i >= 0; i--) {
        if (equals(elem, siblings[i])) {
          break;
        }
        if (adapter.isTag(siblings[i])) {
          pos++;
        }
      }
      return func(pos) && next(elem);
    };
  },
  "nth-of-type"(next, rule, { adapter, equals }) {
    const func = nthCheck(rule);
    if (func === boolbase3.falseFunc) {
      return boolbase3.falseFunc;
    }
    if (func === boolbase3.trueFunc) {
      return (elem) => getElementParent(elem, adapter) !== null && next(elem);
    }
    return function nthOfType(elem) {
      const siblings = adapter.getSiblings(elem);
      let pos = 0;
      for (let i = 0; i < siblings.length; i++) {
        const currentSibling = siblings[i];
        if (equals(elem, currentSibling)) {
          break;
        }
        if (adapter.isTag(currentSibling) && adapter.getName(currentSibling) === adapter.getName(elem)) {
          pos++;
        }
      }
      return func(pos) && next(elem);
    };
  },
  "nth-last-of-type"(next, rule, { adapter, equals }) {
    const func = nthCheck(rule);
    if (func === boolbase3.falseFunc) {
      return boolbase3.falseFunc;
    }
    if (func === boolbase3.trueFunc) {
      return (elem) => getElementParent(elem, adapter) !== null && next(elem);
    }
    return function nthLastOfType(elem) {
      const siblings = adapter.getSiblings(elem);
      let pos = 0;
      for (let i = siblings.length - 1; i >= 0; i--) {
        const currentSibling = siblings[i];
        if (equals(elem, currentSibling)) {
          break;
        }
        if (adapter.isTag(currentSibling) && adapter.getName(currentSibling) === adapter.getName(elem)) {
          pos++;
        }
      }
      return func(pos) && next(elem);
    };
  },
  // TODO determine the actual root element
  root(next, _rule, { adapter }) {
    return (elem) => getElementParent(elem, adapter) === null && next(elem);
  },
  scope(next, rule, options, context) {
    const { equals } = options;
    if (!context || context.length === 0) {
      return filters["root"](next, rule, options);
    }
    if (context.length === 1) {
      return (elem) => equals(context[0], elem) && next(elem);
    }
    return (elem) => context.includes(elem) && next(elem);
  },
  hover: dynamicStatePseudo("isHovered"),
  visited: dynamicStatePseudo("isVisited"),
  active: dynamicStatePseudo("isActive")
};
function dynamicStatePseudo(name) {
  return function dynamicPseudo(next, _rule, { adapter }) {
    const func = adapter[name];
    if (typeof func !== "function") {
      return boolbase3.falseFunc;
    }
    return function active(elem) {
      return func(elem) && next(elem);
    };
  };
}

// ../english-lint/node_modules/css-select/dist/esm/pseudo-selectors/pseudos.js
var isDocumentWhiteSpace = /^[ \t\r\n]*$/;
var pseudos = {
  empty(elem, { adapter }) {
    const children = adapter.getChildren(elem);
    return (
      // First, make sure the tag does not have any element children.
      children.every((elem2) => !adapter.isTag(elem2)) && // Then, check that the text content is only whitespace.
      children.every((elem2) => (
        // FIXME: `getText` call is potentially expensive.
        isDocumentWhiteSpace.test(adapter.getText(elem2))
      ))
    );
  },
  "first-child"(elem, { adapter, equals }) {
    if (adapter.prevElementSibling) {
      return adapter.prevElementSibling(elem) == null;
    }
    const firstChild = adapter.getSiblings(elem).find((elem2) => adapter.isTag(elem2));
    return firstChild != null && equals(elem, firstChild);
  },
  "last-child"(elem, { adapter, equals }) {
    const siblings = adapter.getSiblings(elem);
    for (let i = siblings.length - 1; i >= 0; i--) {
      if (equals(elem, siblings[i])) {
        return true;
      }
      if (adapter.isTag(siblings[i])) {
        break;
      }
    }
    return false;
  },
  "first-of-type"(elem, { adapter, equals }) {
    const siblings = adapter.getSiblings(elem);
    const elemName = adapter.getName(elem);
    for (let i = 0; i < siblings.length; i++) {
      const currentSibling = siblings[i];
      if (equals(elem, currentSibling)) {
        return true;
      }
      if (adapter.isTag(currentSibling) && adapter.getName(currentSibling) === elemName) {
        break;
      }
    }
    return false;
  },
  "last-of-type"(elem, { adapter, equals }) {
    const siblings = adapter.getSiblings(elem);
    const elemName = adapter.getName(elem);
    for (let i = siblings.length - 1; i >= 0; i--) {
      const currentSibling = siblings[i];
      if (equals(elem, currentSibling)) {
        return true;
      }
      if (adapter.isTag(currentSibling) && adapter.getName(currentSibling) === elemName) {
        break;
      }
    }
    return false;
  },
  "only-of-type"(elem, { adapter, equals }) {
    const elemName = adapter.getName(elem);
    return adapter.getSiblings(elem).every((sibling) => equals(elem, sibling) || !adapter.isTag(sibling) || adapter.getName(sibling) !== elemName);
  },
  "only-child"(elem, { adapter, equals }) {
    return adapter.getSiblings(elem).every((sibling) => equals(elem, sibling) || !adapter.isTag(sibling));
  }
};
function verifyPseudoArgs(func, name, subselect, argIndex) {
  if (subselect === null) {
    if (func.length > argIndex) {
      throw new Error(`Pseudo-class :${name} requires an argument`);
    }
  } else if (func.length === argIndex) {
    throw new Error(`Pseudo-class :${name} doesn't have any arguments`);
  }
}

// ../english-lint/node_modules/css-select/dist/esm/pseudo-selectors/subselects.js
var boolbase4 = __toESM(require_boolbase(), 1);

// ../english-lint/node_modules/css-select/dist/esm/helpers/selectors.js
function isTraversal2(token) {
  return token.type === "_flexibleDescendant" || isTraversal(token);
}
function sortRules(arr) {
  const ratings = arr.map(getQuality);
  for (let i = 1; i < arr.length; i++) {
    const procNew = ratings[i];
    if (procNew < 0) {
      continue;
    }
    for (let j = i; j > 0 && procNew < ratings[j - 1]; j--) {
      const token = arr[j];
      arr[j] = arr[j - 1];
      arr[j - 1] = token;
      ratings[j] = ratings[j - 1];
      ratings[j - 1] = procNew;
    }
  }
}
function getAttributeQuality(token) {
  switch (token.action) {
    case AttributeAction.Exists: {
      return 10;
    }
    case AttributeAction.Equals: {
      return token.name === "id" ? 9 : 8;
    }
    case AttributeAction.Not: {
      return 7;
    }
    case AttributeAction.Start: {
      return 6;
    }
    case AttributeAction.End: {
      return 6;
    }
    case AttributeAction.Any: {
      return 5;
    }
    case AttributeAction.Hyphen: {
      return 4;
    }
    case AttributeAction.Element: {
      return 3;
    }
  }
}
function getQuality(token) {
  switch (token.type) {
    case SelectorType.Universal: {
      return 50;
    }
    case SelectorType.Tag: {
      return 30;
    }
    case SelectorType.Attribute: {
      return Math.floor(getAttributeQuality(token) / // `ignoreCase` adds some overhead, half the result if applicable.
      (token.ignoreCase ? 2 : 1));
    }
    case SelectorType.Pseudo: {
      return !token.data ? 3 : token.name === "has" || token.name === "contains" || token.name === "icontains" ? (
        // Expensive in any case — run as late as possible.
        0
      ) : Array.isArray(token.data) ? (
        // Eg. `:is`, `:not`
        Math.max(
          // If we have traversals, try to avoid executing this selector
          0,
          Math.min(...token.data.map((d) => Math.min(...d.map(getQuality))))
        )
      ) : 2;
    }
    default: {
      return -1;
    }
  }
}
function includesScopePseudo(t) {
  return t.type === SelectorType.Pseudo && (t.name === "scope" || Array.isArray(t.data) && t.data.some((data) => data.some(includesScopePseudo)));
}

// ../english-lint/node_modules/css-select/dist/esm/pseudo-selectors/subselects.js
var PLACEHOLDER_ELEMENT = {};
function hasDependsOnCurrentElement(selector) {
  return selector.some((sel) => sel.length > 0 && (isTraversal2(sel[0]) || sel.some(includesScopePseudo)));
}
function copyOptions(options) {
  return {
    xmlMode: !!options.xmlMode,
    lowerCaseAttributeNames: !!options.lowerCaseAttributeNames,
    lowerCaseTags: !!options.lowerCaseTags,
    quirksMode: !!options.quirksMode,
    cacheResults: !!options.cacheResults,
    pseudos: options.pseudos,
    adapter: options.adapter,
    equals: options.equals
  };
}
var is = (next, token, options, context, compileToken2) => {
  const func = compileToken2(token, copyOptions(options), context);
  return func === boolbase4.trueFunc ? next : func === boolbase4.falseFunc ? boolbase4.falseFunc : (elem) => func(elem) && next(elem);
};
var subselects = {
  is,
  /**
   * `:matches` and `:where` are aliases for `:is`.
   */
  matches: is,
  where: is,
  not(next, token, options, context, compileToken2) {
    const func = compileToken2(token, copyOptions(options), context);
    return func === boolbase4.falseFunc ? next : func === boolbase4.trueFunc ? boolbase4.falseFunc : (elem) => !func(elem) && next(elem);
  },
  has(next, subselect, options, _context, compileToken2) {
    const { adapter } = options;
    const opts = copyOptions(options);
    opts.relativeSelector = true;
    const context = subselect.some((s) => s.some(isTraversal2)) ? (
      // Used as a placeholder. Will be replaced with the actual element.
      [PLACEHOLDER_ELEMENT]
    ) : void 0;
    const skipCache = hasDependsOnCurrentElement(subselect);
    const compiled2 = compileToken2(subselect, opts, context);
    if (compiled2 === boolbase4.falseFunc) {
      return boolbase4.falseFunc;
    }
    if (context && compiled2 !== boolbase4.trueFunc) {
      return skipCache ? (elem) => {
        if (!next(elem)) {
          return false;
        }
        context[0] = elem;
        const childs = adapter.getChildren(elem);
        return findOne2(compiled2, compiled2.shouldTestNextSiblings ? [
          ...childs,
          ...getNextSiblings(elem, adapter)
        ] : childs, options) !== null;
      } : cacheParentResults(next, options, (elem) => {
        context[0] = elem;
        return findOne2(compiled2, adapter.getChildren(elem), options) !== null;
      });
    }
    const hasOne = (elem) => findOne2(compiled2, adapter.getChildren(elem), options) !== null;
    return skipCache ? (elem) => next(elem) && hasOne(elem) : cacheParentResults(next, options, hasOne);
  }
};

// ../english-lint/node_modules/css-select/dist/esm/pseudo-selectors/index.js
function compilePseudoSelector(next, selector, options, context, compileToken2) {
  const { name, data } = selector;
  if (Array.isArray(data)) {
    if (!(name in subselects)) {
      throw new Error(`Unknown pseudo-class :${name}(${data})`);
    }
    return subselects[name](next, data, options, context, compileToken2);
  }
  const userPseudo = options.pseudos?.[name];
  const stringPseudo = typeof userPseudo === "string" ? userPseudo : aliases[name];
  if (typeof stringPseudo === "string") {
    if (data != null) {
      throw new Error(`Pseudo ${name} doesn't have any arguments`);
    }
    const alias = parse(stringPseudo);
    return subselects["is"](next, alias, options, context, compileToken2);
  }
  if (typeof userPseudo === "function") {
    verifyPseudoArgs(userPseudo, name, data, 1);
    return (elem) => userPseudo(elem, data) && next(elem);
  }
  if (name in filters) {
    return filters[name](next, data, options, context);
  }
  if (name in pseudos) {
    const pseudo = pseudos[name];
    verifyPseudoArgs(pseudo, name, data, 2);
    return (elem) => pseudo(elem, options, data) && next(elem);
  }
  throw new Error(`Unknown pseudo-class :${name}`);
}

// ../english-lint/node_modules/css-select/dist/esm/general.js
function compileGeneralSelector(next, selector, options, context, compileToken2, hasExpensiveSubselector) {
  const { adapter, equals, cacheResults } = options;
  switch (selector.type) {
    case SelectorType.PseudoElement: {
      throw new Error("Pseudo-elements are not supported by css-select");
    }
    case SelectorType.ColumnCombinator: {
      throw new Error("Column combinators are not yet supported by css-select");
    }
    case SelectorType.Attribute: {
      if (selector.namespace != null) {
        throw new Error("Namespaced attributes are not yet supported by css-select");
      }
      if (!options.xmlMode || options.lowerCaseAttributeNames) {
        selector.name = selector.name.toLowerCase();
      }
      return attributeRules[selector.action](next, selector, options);
    }
    case SelectorType.Pseudo: {
      return compilePseudoSelector(next, selector, options, context, compileToken2);
    }
    // Tags
    case SelectorType.Tag: {
      if (selector.namespace != null) {
        throw new Error("Namespaced tag names are not yet supported by css-select");
      }
      let { name } = selector;
      if (!options.xmlMode || options.lowerCaseTags) {
        name = name.toLowerCase();
      }
      return function tag2(elem) {
        return adapter.getName(elem) === name && next(elem);
      };
    }
    // Traversal
    case SelectorType.Descendant: {
      if (!hasExpensiveSubselector || cacheResults === false || typeof WeakMap === "undefined") {
        return function descendant(elem) {
          let current = elem;
          while (current = getElementParent(current, adapter)) {
            if (next(current)) {
              return true;
            }
          }
          return false;
        };
      }
      const resultCache = /* @__PURE__ */ new WeakMap();
      return function cachedDescendant(elem) {
        let current = elem;
        let result;
        while (current = getElementParent(current, adapter)) {
          const cached = resultCache.get(current);
          if (cached === void 0) {
            result ?? (result = { matches: false });
            result.matches = next(current);
            resultCache.set(current, result);
            if (result.matches) {
              return true;
            }
          } else {
            if (result) {
              result.matches = cached.matches;
            }
            return cached.matches;
          }
        }
        return false;
      };
    }
    case "_flexibleDescendant": {
      return function flexibleDescendant(elem) {
        let current = elem;
        do {
          if (next(current)) {
            return true;
          }
          current = getElementParent(current, adapter);
        } while (current);
        return false;
      };
    }
    case SelectorType.Parent: {
      return function parent(elem) {
        return adapter.getChildren(elem).some((elem2) => adapter.isTag(elem2) && next(elem2));
      };
    }
    case SelectorType.Child: {
      return function child(elem) {
        const parent = getElementParent(elem, adapter);
        return parent !== null && next(parent);
      };
    }
    case SelectorType.Sibling: {
      return function sibling(elem) {
        const siblings = adapter.getSiblings(elem);
        for (let i = 0; i < siblings.length; i++) {
          const currentSibling = siblings[i];
          if (equals(elem, currentSibling)) {
            break;
          }
          if (adapter.isTag(currentSibling) && next(currentSibling)) {
            return true;
          }
        }
        return false;
      };
    }
    case SelectorType.Adjacent: {
      if (adapter.prevElementSibling) {
        return function adjacent(elem) {
          const previous = adapter.prevElementSibling(elem);
          return previous != null && next(previous);
        };
      }
      return function adjacent(elem) {
        const siblings = adapter.getSiblings(elem);
        let lastElement;
        for (let i = 0; i < siblings.length; i++) {
          const currentSibling = siblings[i];
          if (equals(elem, currentSibling)) {
            break;
          }
          if (adapter.isTag(currentSibling)) {
            lastElement = currentSibling;
          }
        }
        return !!lastElement && next(lastElement);
      };
    }
    case SelectorType.Universal: {
      if (selector.namespace != null && selector.namespace !== "*") {
        throw new Error("Namespaced universal selectors are not yet supported by css-select");
      }
      return next;
    }
  }
}

// ../english-lint/node_modules/css-select/dist/esm/compile.js
var DESCENDANT_TOKEN = { type: SelectorType.Descendant };
var FLEXIBLE_DESCENDANT_TOKEN = {
  type: "_flexibleDescendant"
};
var SCOPE_TOKEN = {
  type: SelectorType.Pseudo,
  name: "scope",
  data: null
};
function absolutize(token, { adapter }, context) {
  const hasContext = !!context?.every((e) => e === PLACEHOLDER_ELEMENT || adapter.isTag(e) && getElementParent(e, adapter) !== null);
  for (const t of token) {
    if (t.length > 0 && isTraversal2(t[0]) && t[0].type !== SelectorType.Descendant) {
    } else if (hasContext && !t.some(includesScopePseudo)) {
      t.unshift(DESCENDANT_TOKEN);
    } else {
      continue;
    }
    t.unshift(SCOPE_TOKEN);
  }
}
function compileToken(token, options, ctx) {
  token.forEach(sortRules);
  const { context = ctx, rootFunc = boolbase5.trueFunc } = options;
  const isArrayContext = Array.isArray(context);
  const finalContext = context && (Array.isArray(context) ? context : [context]);
  if (options.relativeSelector !== false) {
    absolutize(token, options, finalContext);
  } else if (token.some((t) => t.length > 0 && isTraversal2(t[0]))) {
    throw new Error("Relative selectors are not allowed when the `relativeSelector` option is disabled");
  }
  let shouldTestNextSiblings = false;
  let query = boolbase5.falseFunc;
  combineLoop: for (const rules2 of token) {
    if (rules2.length >= 2) {
      const [first, second] = rules2;
      if (first.type !== SelectorType.Pseudo || first.name !== "scope") {
      } else if (isArrayContext && second.type === SelectorType.Descendant) {
        rules2[1] = FLEXIBLE_DESCENDANT_TOKEN;
      } else if (second.type === SelectorType.Adjacent || second.type === SelectorType.Sibling) {
        shouldTestNextSiblings = true;
      }
    }
    let next = rootFunc;
    let hasExpensiveSubselector = false;
    for (const rule of rules2) {
      next = compileGeneralSelector(next, rule, options, finalContext, compileToken, hasExpensiveSubselector);
      const quality = getQuality(rule);
      if (quality === 0) {
        hasExpensiveSubselector = true;
      }
      if (next === boolbase5.falseFunc) {
        continue combineLoop;
      }
    }
    if (next === rootFunc) {
      return rootFunc;
    }
    query = query === boolbase5.falseFunc ? next : or(query, next);
  }
  query.shouldTestNextSiblings = shouldTestNextSiblings;
  return query;
}
function or(a, b) {
  return (elem) => a(elem) || b(elem);
}

// ../english-lint/node_modules/css-select/dist/esm/index.js
var defaultEquals = (a, b) => a === b;
var defaultOptions = {
  adapter: esm_exports3,
  equals: defaultEquals
};
function convertOptionFormats(options) {
  const opts = options ?? defaultOptions;
  opts.adapter ?? (opts.adapter = esm_exports3);
  opts.equals ?? (opts.equals = opts.adapter?.equals ?? defaultEquals);
  return opts;
}
function compile2(selector, options, context) {
  const opts = convertOptionFormats(options);
  const next = _compileUnsafe(selector, opts, context);
  return next === boolbase6.falseFunc ? boolbase6.falseFunc : (elem) => opts.adapter.isTag(elem) && next(elem);
}
function _compileUnsafe(selector, options, context) {
  return _compileToken(typeof selector === "string" ? parse(selector) : selector, options, context);
}
function _compileToken(selector, options, context) {
  return compileToken(selector, convertOptionFormats(options), context);
}
function getSelectorFunc(searchFunc) {
  return function select(query, elements, options) {
    const opts = convertOptionFormats(options);
    if (typeof query !== "function") {
      query = _compileUnsafe(query, opts, elements);
    }
    const filteredElements = prepareContext(elements, opts.adapter, query.shouldTestNextSiblings);
    return searchFunc(query, filteredElements, opts);
  };
}
function prepareContext(elems, adapter, shouldTestNextSiblings = false) {
  if (shouldTestNextSiblings) {
    elems = appendNextSiblings(elems, adapter);
  }
  return Array.isArray(elems) ? adapter.removeSubsets(elems) : adapter.getChildren(elems);
}
function appendNextSiblings(elem, adapter) {
  const elems = Array.isArray(elem) ? elem.slice(0) : [elem];
  const elemsLength = elems.length;
  for (let i = 0; i < elemsLength; i++) {
    const nextSiblings = getNextSiblings(elems[i], adapter);
    elems.push(...nextSiblings);
  }
  return elems;
}
var selectAll = getSelectorFunc((query, elems, options) => query === boolbase6.falseFunc || !elems || elems.length === 0 ? [] : findAll2(query, elems, options));
var selectOne = getSelectorFunc((query, elems, options) => query === boolbase6.falseFunc || !elems || elems.length === 0 ? null : findOne2(query, elems, options));
function is2(elem, query, options) {
  return (typeof query === "function" ? query : compile2(query, options))(elem);
}

// ../english-lint/dist/css-select-adapter.js
var childrenByParent = (nodes) => nodes.reduce((children, node) => {
  if (!children.has(node)) {
    children.set(node, []);
  }
  if (node.head !== -1) {
    const parent = nodes[node.head];
    const siblings = children.get(parent);
    if (siblings) {
      siblings.push(node);
    } else {
      children.set(parent, [node]);
    }
  }
  return children;
}, /* @__PURE__ */ new Map());
var attributeValue = (node, name) => {
  const value = node[name] || node.feats?.[name] || node.misc?.[name];
  if (typeof value === "string") {
    return value;
  }
  return typeof value === "number" || typeof value === "boolean" ? String(value) : void 0;
};
var hasAttribute = (node, name) => node[name] !== void 0 || node.feats?.[name] !== void 0 || node.misc?.[name] !== void 0;
var inOrderFrom = (getChildren2) => {
  const walk = (node, traversal = []) => {
    const children = getChildren2(node);
    children.filter((child) => child.id < node.id).forEach((child) => walk(child, traversal));
    traversal.push(node);
    children.filter((child) => child.id > node.id).forEach((child) => walk(child, traversal));
    return traversal;
  };
  return walk;
};
var offsetOf = (node) => Number(node.misc?.at);
var joinForms = (traversal) => traversal.reduce((text, node, index) => {
  const form = node.form || "";
  const separated = index < traversal.length - 1 && offsetOf(traversal[index + 1]) > offsetOf(node) + form.length;
  return `${text}${form}${separated ? " " : ""}`;
}, "");
var hasAncestorIn = (node, nodes, getParent2) => {
  for (let ancestor = getParent2(node); ancestor != null; ancestor = getParent2(ancestor)) {
    if (nodes.indexOf(ancestor) > -1) {
      return true;
    }
  }
  return false;
};
var removeSubsetsWith = (getParent2) => (nodes) => {
  let index = nodes.length - 1;
  while (index >= 0) {
    const node = nodes[index];
    const duplicated = index > 0 && nodes.lastIndexOf(node, index - 1) >= 0;
    if (duplicated || hasAncestorIn(node, nodes, getParent2)) {
      nodes.splice(index, 1);
    }
    index -= 1;
  }
  return nodes;
};
var findAllWith = (getChildren2) => (test, nodes) => {
  const result = [];
  const stack = [...nodes];
  let node = stack.shift();
  while (node != null) {
    stack.unshift(...getChildren2(node));
    if (test(node)) {
      result.push(node);
    }
    node = stack.shift();
  }
  return result;
};
function css_select_adapter_default(nodes) {
  const children = childrenByParent(nodes);
  const getChildren2 = (node) => children.get(node) ?? [];
  const getParent2 = (node) => node.head >= 0 ? nodes[node.head] : null;
  const inOrder = inOrderFrom(getChildren2);
  const adapter = {
    nodes,
    children,
    getChildren: getChildren2,
    getParent: getParent2,
    isTag: (node) => node.id != null,
    existsOne: (test, candidates2) => candidates2.some((node) => test(node) || adapter.existsOne(test, getChildren2(node))),
    getAttributeValue: attributeValue,
    getName: (node) => node.tagName || "",
    getSiblings: (node) => {
      const parent = getParent2(node);
      return parent ? getChildren2(parent) : [node];
    },
    getText: (node) => Array.isArray(node) ? node.map((one) => adapter.getText(one)).join(" ") : joinForms(inOrder(node)),
    hasAttrib: hasAttribute,
    removeSubsets: removeSubsetsWith(getParent2),
    findAll: findAllWith(getChildren2),
    findOne: (test, candidates2) => {
      let result = null;
      for (let i = 0; result == null && i < candidates2.length; i += 1) {
        const node = candidates2[i];
        result = test(node) ? node : adapter.findOne(test, getChildren2(node));
      }
      return result;
    }
  };
  return adapter;
}

// ../english-lint/dist/query-parse.js
var compoundBefore = (selectorTokens, from) => {
  const gathered = [];
  let index = from;
  while (index >= 0 && !isTraversal(selectorTokens[index])) {
    gathered.unshift(selectorTokens[index]);
    index -= 1;
  }
  return { gathered, index };
};
var childStep = ({ head, index }, tokens, tree) => {
  tree.unshift(head);
  const parent = tokens[head];
  return { id: parent.id, head: parent.head, index: index - 1 };
};
var siblingStep = (position, { tokens, selectorTokens, options }, tree) => {
  const { gathered, index } = compoundBefore(selectorTokens, position.index - 1);
  const ownId = position.id;
  const sibling = options.adapter.getSiblings(tokens[ownId]).find((token) => is2(token, [gathered], options) && token.id !== ownId);
  if (sibling == null) {
    return null;
  }
  tree.unshift(sibling.id);
  return { ...position, index };
};
var descendantStep = (position, { tokens, selectorTokens, options }, tree) => {
  const { gathered, index } = compoundBefore(selectorTokens, position.index - 1);
  let { id, head } = position;
  while (!is2(tokens[head], [gathered], options)) {
    ({ id, head } = tokens[head]);
  }
  tree.unshift(head);
  return { id, head, index };
};
var treeFor = (token, context) => {
  const { selectorTokens } = context;
  const tree = [token.id];
  let position = {
    id: token.id,
    head: token.head,
    index: selectorTokens.length - 1
  };
  while (position.index > 0) {
    const { type } = selectorTokens[position.index];
    if (type === SelectorType.Child) {
      position = childStep(position, context.tokens, tree);
    } else if (type === SelectorType.Sibling || type === SelectorType.Adjacent) {
      const next = siblingStep(position, context, tree);
      if (next == null) {
        return null;
      }
      position = next;
    } else if (type === SelectorType.Descendant) {
      position = descendantStep(position, context, tree);
    } else {
      position = { ...position, index: position.index - 1 };
    }
  }
  return tree;
};
function query_parse_default(tokens, queries2) {
  const elements = [tokens.find(({ head }) => head === -1)];
  const options = {
    xmlMode: true,
    adapter: css_select_adapter_default(tokens)
  };
  const matches = [];
  queries2.forEach((query, selectorIndex) => {
    const [selectorTokens] = query;
    const context = { tokens, selectorTokens, options };
    selectAll(query, elements, options).forEach((token) => {
      const tree = treeFor(token, context);
      if (tree != null) {
        matches.push({ selectorIndex, tree });
      }
    });
  });
  return matches;
}

// ../english-lint/dist/repair-suggestion.js
var isComma2 = (token) => token?.feats?.PunctType === "Comm";
var isTerminal = (token) => token?.feats?.PunctType === "Peri" || token?.feats?.PunctType === "Qest" || token?.feats?.PunctType === "Excl";
var COMPLEMENTIZERS = /* @__PURE__ */ new Set(["that", "whether"]);
var isComplementizer = (token, next) => token != null && token.xpos === "MARK" && COMPLEMENTIZERS.has(token.form.toLowerCase()) && next != null && next.xpos !== "VERB";
var DETERMINERS = /* @__PURE__ */ new Set(["a", "an", "the"]);
var isDeterminer = (token) => token != null && DETERMINERS.has(token.form.toLowerCase());
var VOWEL_SOUNDED_H = /^h(?:our|onest|onou?r)/u;
var articleFor = (word) => {
  const letters2 = word.toLowerCase().replace(/[^a-z]/gu, "");
  if (letters2.length < 2) {
    return null;
  }
  if (/^[A-Z]{2}/u.test(word)) {
    return null;
  }
  if (VOWEL_SOUNDED_H.test(letters2)) {
    return "an";
  }
  if (letters2.startsWith("u") || letters2.startsWith("eu")) {
    return null;
  }
  if (/^[aeio]/u.test(letters2)) {
    return "an";
  }
  return /^[bcdfghjklmnpqrstvwxyz]/u.test(letters2) ? "a" : null;
};
var matchCase = (replacement, original) => /^[A-Z]/u.test(original) ? `${replacement.charAt(0).toUpperCase()}${replacement.slice(1)}` : replacement;
var capitalize = (word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`;
var endOf = (token) => token.misc.at + token.form.length;
var withoutCommas = ({ first, last, before, after, opensSentence }) => {
  const commaBefore = isComma2(before);
  const commaAfter = isComma2(after);
  if (commaBefore && commaAfter) {
    return { from: first - 1, to: last + 1 };
  }
  if (commaAfter && opensSentence) {
    return { from: first, to: last + 1 };
  }
  if (commaBefore && (after == null || isTerminal(after))) {
    return { from: first - 1, to: last };
  }
  return { from: first, to: last };
};
var strandedComplementizer = (tokens, to, opensSentence) => opensSentence && isComplementizer(tokens[to + 1], tokens[to + 2]);
var gapLeftBy = (tokens, from, to) => {
  const outerBefore = tokens[from - 1];
  const outerAfter = tokens[to + 1];
  if (outerBefore != null) {
    return [endOf(outerBefore), endOf(tokens[to])];
  }
  if (outerAfter != null) {
    return [tokens[from].misc.at, outerAfter.misc.at];
  }
  return [tokens[from].misc.at, endOf(tokens[to])];
};
var promotesNextWord = ({ tokens, first, opensSentence }, outerAfter) => opensSentence && outerAfter != null && /^[a-z]/u.test(outerAfter.form) && /^[A-Z]/u.test(tokens[first].form);
var repairDeletion = (place2) => {
  const { tokens, opensSentence } = place2;
  const { from, to: trimmed } = withoutCommas(place2);
  const to = strandedComplementizer(tokens, trimmed, opensSentence) ? trimmed + 1 : trimmed;
  const [start, end] = gapLeftBy(tokens, from, to);
  const outerAfter = tokens[to + 1];
  return promotesNextWord(place2, outerAfter) ? { range: [start, endOf(outerAfter)], text: capitalize(outerAfter.form) } : { range: [start, end], text: "" };
};
var swappedDeterminer = (before, replacement, firstWord, end) => DETERMINERS.has(firstWord.toLowerCase()) && isDeterminer(before) ? {
  range: [before.misc.at, end],
  text: matchCase(replacement, before.form)
} : void 0;
var agreedArticle = (before, replacement, firstWord, end) => {
  const article = before == null ? "" : before.form.toLowerCase();
  if (article !== "a" && article !== "an") {
    return void 0;
  }
  const wanted = articleFor(firstWord);
  return wanted == null || wanted === article ? void 0 : {
    range: [before.misc.at, end],
    text: `${matchCase(wanted, before.form)} ${replacement}`
  };
};
var repair_suggestion_default = ({ tokens, tree, range, text }) => {
  const first = Math.min(...tree);
  const last = Math.max(...tree);
  const [start, end] = range;
  const replacement = text;
  const place2 = {
    tokens,
    first,
    last,
    before: tokens[first - 1],
    after: tokens[last + 1],
    opensSentence: tokens.slice(0, first).every(({ xpos }) => xpos === "PUNCT")
  };
  if (replacement === "") {
    return repairDeletion(place2);
  }
  const [firstWord = ""] = replacement.split(/\s+/u);
  return swappedDeterminer(place2.before, replacement, firstWord, end) ?? agreedArticle(place2.before, replacement, firstWord, end) ?? {
    range: [start, end],
    text: replacement
  };
};

// ../english-lint/dist/queries-to-errors.js
var contractionRegExp = /['’`´]/iu;
var compiled = /* @__PURE__ */ new WeakMap();
var compile3 = (queries2) => {
  const cached = compiled.get(queries2);
  if (cached) {
    return cached;
  }
  const compilation = compile_queries_default(queries2);
  compiled.set(queries2, compilation);
  return compilation;
};
var withInflections = (tokens, tree, suggestion) => suggestion.replace(/:inflect\((\w+)\)/giu, (_match, lemma) => inflect_default({ ...tokens[tree[0]], lemma }) ?? "");
var queries_to_errors_default = (queries2, sentences2) => {
  const compilation = compile3(queries2);
  const errors = [];
  sentences2.forEach((tokens) => {
    const queryIndices = candidates(compilation, tokens);
    if (queryIndices.length === 0) {
      return;
    }
    query_parse_default(tokens, queryIndices.map((queryIndex) => compilation.parsed[queryIndex])).forEach(({ selectorIndex, tree }) => {
      const { misc: { at: start } } = tokens[Math.min(...tree)];
      const { misc: { at: endPosition }, form: endWord } = tokens[Math.max(...tree)];
      const { message, id, suggestions } = queries2[queryIndices[selectorIndex]];
      const { form } = tokens[tree[0]];
      const end = endPosition + endWord.length;
      errors.push({
        id,
        start,
        end,
        message,
        ...suggestions ? {
          suggestions: suggestions.map((suggestion) => repair_suggestion_default({
            tokens,
            tree,
            range: [start, end],
            text: `${contractionRegExp.test(form) ? " " : ""}${withInflections(tokens, tree, suggestion)}`
          }))
        } : {}
      });
    });
  });
  return errors;
};

// ../english-lint/dist/rules/no-bad-words.js
var categoryMessages = {
  ai: "Avoid words and expressions that are common in AI-generated writing.",
  cliche: "Avoid clich\xE9s that make your writing stale",
  empty: "Remove empty phrases that add nothing to your writing",
  "explained-verb": "Avoid verb + adverb constructions when there's a stronger, shorter alternative",
  formalism: "Avoid formal or academic phrases if you aim for a natural tone",
  hedge: "Avoid cautious language to make your writing more persuasive",
  opinion: "Omit unpersuasive constructions that indicate something is the author's opinion",
  redundancy: "Replace redundant expressions with stronger single words",
  variation: "Prefer short, common words over rare words and long expressions"
};
var anyOf = (selectors2) => selectors2.length === 1 ? selectors2[0] : `:matches(${selectors2.join(", ")})`;
var copula = (rows) => rows.map(([copulas, adjectives, replacement, governed]) => {
  const verbs = copulas.split(" ");
  const words = adjectives.split(" ");
  const [verb, ...rest] = replacement.split(" ");
  return {
    phrase: `${verbs.join("/")} ${words.map((word) => word.replace(/\*$/u, "")).join("/")}${governed ? ` ${governed}` : ""}`,
    category: "explained-verb",
    selector: `${anyOf(verbs.map((verb2) => `[lemma=${verb2}]`))} > ${anyOf(words.map((word) => word.endsWith("*") ? `[lemma=${word.slice(0, -1)}]` : `[form=${word} i]`))}${governed ? ` > [form=${governed} i]` : ""}`,
    suggestions: [[`:inflect(${verb})`, ...rest].join(" ")]
  };
});
var entries = [
  {
    phrase: "aamof",
    category: "variation",
    selector: "[form=aamof i]",
    suggestions: ["actually"]
  },
  {
    phrase: "ability to navigate",
    category: "ai",
    selector: "[lemma=ability] > [form=to i] > [lemma=navigate]",
    message: "Rewrite with the equivalent of 'can handle' or 'knows how to get through'"
  },
  {
    phrase: "according to me",
    category: "opinion",
    selector: "[form=according i] > [form=to i] > [form=me i]",
    suggestions: [""]
  },
  {
    phrase: "actual fact",
    category: "redundancy",
    selector: "[lemma=fact] > [form=actual i]",
    suggestions: [":inflect(fact)"]
  },
  {
    phrase: "add a layer",
    category: "ai",
    selector: "[lemma=add] > [form=layer i]",
    message: "Rewrite with 'add an extra element'"
  },
  {
    phrase: "add a layer of complexity",
    category: "ai",
    selector: "[lemma=add] > [lemma=layer] > [form=of i] > [form=complexity i]",
    suggestions: [":inflect(complicate)"]
  },
  {
    phrase: "add insult to injury",
    category: "cliche",
    selector: "[lemma=add] > [lemma=insult] > [form=to i] > [form=injury i]",
    suggestions: [":inflect(aggravate)"]
  },
  {
    phrase: "added bonus",
    category: "redundancy",
    selector: "[lemma=bonus] > [form=added i]",
    suggestions: ["bonus"]
  },
  {
    phrase: "address the root cause",
    category: "ai",
    selector: "[lemma=address] > [lemma=cause] > [form=root]",
    message: "Name what actually causes the problem and say you are fixing that, instead of 'addressing the root cause'"
  },
  {
    phrase: "affluent",
    category: "variation",
    selector: "[lemma=affluent]",
    suggestions: ["wealthy"]
  },
  {
    phrase: "after all is said and done",
    category: "variation",
    selector: "[form=after i] > [lemma=be] > [form=all i] ~ [form=said i] > [form=and i] > [form=done i]",
    suggestions: ["at last"]
  },
  {
    phrase: "aim to explore",
    category: "ai",
    selector: "[lemma=aim] > [form=to i] > [lemma=explore]",
    message: "Say what the work does, not what it aims to do: 'the study aims to explore X' => 'the study looks at X'"
  },
  {
    phrase: "align with",
    category: "ai",
    selector: "[lemma=align] > [form=with i]",
    suggestions: [":inflect(match)", ":inflect(agree)", ":inflect(fit)"]
  },
  {
    phrase: "all things being equal",
    category: "empty",
    selector: "[form=being i][xpos=VERB] > [form=things i] ~ [form=equal i]",
    suggestions: [""]
  },
  {
    phrase: "along the lines of",
    category: "variation",
    selector: "[form=along i] > [lemma=line] > [form=of i]",
    suggestions: ["like"]
  },
  {
    phrase: "alternative choice",
    category: "redundancy",
    selector: "[lemma=choice] > [form=alternative i]",
    suggestions: [":inflect(choice)"]
  },
  {
    phrase: "amiable / amicable",
    category: "variation",
    selector: ":matches([form=amiable i][xpos=ADJ], [form=amicable i][xpos=ADJ])",
    suggestions: ["friendly"]
  },
  {
    phrase: "amidst",
    category: "variation",
    selector: "[form=amidst i]",
    message: "Rewrite using the word 'during', 'in' or 'among' depending on what makes the most sense given the context"
  },
  {
    phrase: "amongst",
    category: "variation",
    selector: "[form=amongst i]",
    suggestions: ["among"]
  },
  {
    phrase: "an analysis of the data",
    category: "ai",
    selector: "[lemma=analysis] > [form=of i] > [form=data i]",
    message: "Rewrite as a phrase: 'the data shows'"
  },
  {
    phrase: "an approach ensures",
    category: "ai",
    selector: "[lemma=ensure] > [lemma=approach]",
    message: "Say who does what and what happens as a result, instead of crediting the approach"
  },
  {
    phrase: "as a matter of fact",
    category: "variation",
    selector: "[form=as i] > [form=matter i] > [form=of i] > [form=fact i]",
    suggestions: ["actually"]
  },
  {
    phrase: "as a result of",
    category: "variation",
    selector: "[form=as i] > [form=result i] > [form=of i]",
    suggestions: ["because"]
  },
  {
    phrase: "as far as I am concerned",
    category: "opinion",
    selector: "[form=as i] > [form=far i] > [form=as i] > [lemma=be] > [lemma=concern]",
    suggestions: [""]
  },
  {
    phrase: "as mentioned earlier",
    category: "empty",
    selector: "[form=as i] > [lemma=mention] > [form=earlier i]",
    suggestions: [""]
  },
  {
    phrase: "as to whether",
    category: "redundancy",
    selector: "[form=as i] > [form=to i] > [form=whether i]",
    suggestions: ["whether"]
  },
  {
    phrase: "as we can see",
    category: "empty",
    selector: "[form=as i] > [lemma=can] > [lemma=see]",
    suggestions: [""]
  },
  {
    phrase: "as yet",
    category: "redundancy",
    selector: "[form=as i] > [form=yet i]",
    suggestions: ["yet"]
  },
  {
    phrase: "associated with",
    category: "variation",
    selector: "[form=associated i] > [form=with i]",
    suggestions: ["linked to"]
  },
  {
    phrase: "assuming/conceding/granted/supposing that",
    category: "variation",
    selector: ":matches([form=assuming i], [form=conceding i], [form=granted i], [form=supposing i]) > [form=that i]",
    suggestions: ["if"]
  },
  {
    phrase: "at a point in time",
    category: "variation",
    selector: "[form=at i] > [form=point i]:not(:has(> :matches([form=this i], [form=that i]))) > [form=in i] > [form=time i]",
    message: "Rewrite with 'then' or 'when': 'at which point in time did it fail?' => 'when did it fail?'"
  },
  {
    phrase: "at loose ends",
    category: "cliche",
    selector: "[form=at i] > [form=ends i] > [form=loose i]",
    suggestions: ["uneasy"]
  },
  {
    phrase: "at that point in time",
    category: "variation",
    selector: "[form=at i] > [form=point i] > [form=that i] ~ [form=in i] > [form=time i]",
    suggestions: ["then"]
  },
  {
    phrase: "at the end of the day",
    category: "empty",
    selector: "[form=at i] > [form=end i] > [form=the i] ~ [form=of i] > [form=day i] > [form=the i]",
    suggestions: [""]
  },
  {
    phrase: "at the hands of",
    category: "variation",
    selector: "[form=at i] > [lemma=hand] > [form=of i]",
    suggestions: ["by"]
  },
  {
    phrase: "at the intersection of",
    category: "formalism",
    selector: "[form=at i] > [form=intersection i] > [form=of i]"
  },
  {
    phrase: "at the present time",
    category: "variation",
    selector: "[form=at i] > [lemma=time] > [form=present i]",
    suggestions: ["now"]
  },
  {
    phrase: "at this point in time",
    category: "variation",
    selector: "[form=at i] > [form=point i] > [form=this i] ~ [form=in i] > [form=time i]",
    suggestions: ["now"]
  },
  {
    phrase: "audacious",
    category: "variation",
    selector: "[form=audacious i][xpos=ADJ]",
    suggestions: ["bold"]
  },
  {
    phrase: "be a testament to",
    category: "variation",
    selector: "[lemma=be] > [form=testament i] > [form=to i]",
    suggestions: [":inflect(show)"]
  },
  {
    phrase: "be aware/cognizant/conscious of",
    category: "variation",
    selector: "[lemma=be] > :matches([form=aware i], [form=cognizant i], [form=conscious i]) > [form=of i]",
    suggestions: [":inflect(know) about"]
  },
  {
    phrase: "be familiar/acquainted with",
    category: "variation",
    selector: "[lemma=be] > :matches([form=familiar i], [form=acquainted i]) > [form=with i]",
    suggestions: [":inflect(know)"]
  },
  {
    phrase: "be in need of",
    category: "variation",
    selector: "[lemma=be] > [form=in i] > [form=need i] > [form=of i]",
    suggestions: [":inflect(need)"]
  },
  {
    phrase: "be in possession of",
    category: "variation",
    selector: "[lemma=be] > [form=in i] > [form=possession i] > [form=of i]",
    suggestions: [":inflect(have)"]
  },
  {
    phrase: "be not sure",
    category: "explained-verb",
    selector: "[lemma=be] > [form=sure i] > [lemma=not]",
    suggestions: [":inflect(doubt)"]
  },
  {
    phrase: "be not willing",
    category: "explained-verb",
    selector: "[lemma=be] > [form=willing i] > [lemma=not]",
    suggestions: [":inflect(refuse)"]
  },
  {
    phrase: "be unsure",
    category: "explained-verb",
    selector: "[lemma=be] > [form=unsure i]",
    suggestions: [":inflect(doubt)"]
  },
  {
    phrase: "be unwilling",
    category: "explained-verb",
    selector: "[lemma=be] > [form=unwilling i]",
    suggestions: [":inflect(refuse)"]
  },
  {
    phrase: "a beacon of",
    category: "cliche",
    selector: "[form=beacon i] > [form=of i]",
    message: "Rewrite this phrase to go from 'a beacon of X' to describe it with an adjective that conveys X. Example: 'Her smile, once a beacon of warmth' => 'Her smile, once warm'."
  },
  {
    phrase: "beat a retreat",
    category: "redundancy",
    selector: "[lemma=beat] > [lemma=retreat]",
    suggestions: [":inflect(retreat)"]
  },
  {
    phrase: "beauteous / ravishing / splendiferous / pulchritudinous",
    category: "variation",
    selector: ":matches([form=beauteous i][xpos=ADJ], [form=ravishing i][xpos=ADJ], [form=splendiferous i][xpos=ADJ], [form=pulchritudinous i][xpos=ADJ])",
    suggestions: ["beautiful"]
  },
  ...copula([
    ["become", "aware", "realize", "of"],
    ["become", "dry", "dry"],
    ["become", "known apparent", "emerge"],
    ["become", "liquid", "liquefy"],
    ["become", "pregnant", "conceive"],
    ["become", "solid", "solidify"],
    ["become get", "different", "change"],
    ["become get", "established", "establish"],
    ["become get", "hot", "heat"],
    ["become get", "large", "enlarge"],
    ["become get", "smaller shorter", "shrink"],
    ["become get", "smaller shorter", "shrink to less than", "than"],
    ["become get", "taller bigger", "grow"],
    ["become get", "taller bigger", "grow bigger than", "than"],
    ["become get grow", "old", "age"],
    ["become get make", "blacker", "blacken"],
    ["become get make", "cold*", "chill"],
    ["become get make", "damp*", "dampen"],
    ["become get make", "darker", "darken"],
    ["become get make", "deep*", "deepen"],
    ["become get make", "lighter", "lighten"],
    ["become get make", "longer", "lengthen"],
    ["become get make", "stronger", "strengthen"],
    ["become get make", "worse", "worsen"],
    ["become make", "better", "improve"],
    ["become make", "broad*", "broaden"],
    ["become make", "even", "even"],
    ["become make", "stiff*", "stiffen"],
    ["become make", "strong*", "strengthen"],
    ["become make", "sweet*", "sweeten"],
    ["become make", "thick*", "thicken"]
  ]),
  {
    phrase: "beg the question",
    category: "cliche",
    selector: "[lemma=beg] > [lemma=question]",
    message: "Skip the filler, just ask the question"
  },
  {
    phrase: "beyond a shadow of a doubt",
    category: "cliche",
    selector: "[form=beyond i] > [lemma=shadow] > [form=of i] > [lemma=doubt]",
    suggestions: ["absolutely"]
  },
  {
    phrase: "bite off more than one can chew",
    category: "cliche",
    selector: ":matches([lemma=bite], [form=bit i], [form=bits i], [form=biting i]) > [form=off i] > [form=more i] > [form=than i] > :matches([lemma=can], [form=could i]) > [lemma=chew]",
    suggestions: [":inflect(overextend)"]
  },
  {
    phrase: "blend together",
    category: "redundancy",
    selector: "[lemma=blend] > [form=together i]",
    suggestions: [":inflect(blend)"]
  },
  {
    phrase: "boil the ocean",
    category: "cliche",
    selector: "[lemma=boil] > [form=ocean i]",
    message: "Delete the phrase."
  },
  {
    phrase: "bolster",
    category: "ai",
    selector: "[lemma=bolster]",
    suggestions: [":inflect(strengthen)", ":inflect(support)"]
  },
  {
    phrase: "breath coming in ragged gasps",
    category: "cliche",
    selector: "[form=breath i] > [form=coming i] > [form=in i] > [lemma=gasp] > [form=ragged i]",
    message: "Use a shorter description to convey fear of anxiety, such as 'trembling', 'panicked', 'terrified' or 'breathless'."
  },
  {
    phrase: "brief moment",
    category: "redundancy",
    selector: "[lemma=moment] > [form=brief i]",
    suggestions: [":inflect(moment)"]
  },
  {
    phrase: "built on top of",
    category: "ai",
    selector: "[lemma=build] > [form=on i] > [form=top i] > [form=of i]",
    message: "When one technology relies on another, say that the other powers it: 'the app is built on top of Postgres' => 'Postgres powers the app'"
  },
  {
    phrase: "bury the hatchet",
    category: "cliche",
    selector: "[lemma=bury] > [form=hatchet i]",
    suggestions: [":inflect(make) peace"]
  },
  {
    phrase: "bustle",
    category: "variation",
    selector: "[lemma=bustle][xpos=VERB]",
    suggestions: [":inflect(scurry)", ":inflect(move) quickly"]
  },
  {
    phrase: "bustling",
    category: "variation",
    selector: "[form=bustling i][xpos=ADJ]",
    message: "Remove 'bustling', it's not necessary describing this"
  },
  {
    phrase: "busy as a bee",
    category: "cliche",
    selector: "[form=busy i] > [form=as i] > [lemma=bee]",
    suggestions: ["busy"]
  },
  {
    phrase: "by cause/reason/virtue of",
    category: "variation",
    selector: "[form=by i] > :matches([form=cause i], [form=reason i], [form=virtue i]) > [form=of i]",
    suggestions: ["because"]
  },
  {
    phrase: "by orders of magnitude",
    category: "variation",
    selector: "[form=by i] > [lemma=order] > [form=of i] > [form=magnitude i]",
    suggestions: ["massively", "considerably"]
  },
  {
    phrase: "byte-for-byte",
    category: "ai",
    selector: ":matches([form=byte-for-byte i], [form=bit-for-bit i])",
    message: "Write 'identical', or say what you compared and how"
  },
  {
    phrase: "byte-identical/bit-identical",
    category: "ai",
    selector: ":matches([form=byte-identical i], [form=bit-identical i])",
    suggestions: ["identical"]
  },
  {
    phrase: "call loudly",
    category: "explained-verb",
    selector: "[lemma=call] > [form=loudly i]",
    suggestions: [":inflect(cry)"]
  },
  {
    phrase: "cameo appearance",
    category: "redundancy",
    selector: "[lemma=appearance] > [form=cameo i]",
    suggestions: ["cameo"]
  },
  {
    phrase: "cannot help but",
    category: "empty",
    selector: "[Mood=Pot] > [lemma=help] > [lemma=not] ~ [form=but i]",
    suggestions: [""]
  },
  {
    phrase: "carefully constructed",
    category: "ai",
    selector: "[form=constructed i] > [form=carefully i]",
    suggestions: ["well-planned", "thoughtfully put together"]
  },
  {
    phrase: "carry a weight",
    category: "ai",
    selector: "[lemma=carry] > [lemma=weight]",
    suggestions: [":inflect(matter)", ":inflect(count)"]
  },
  {
    phrase: "catalyst",
    category: "variation",
    selector: "[lemma=catalyst]",
    suggestions: [":inflect(trigger)", ":inflect(cause)"]
  },
  {
    phrase: "catalyze",
    category: "variation",
    selector: ":matches([lemma=catalyze], [lemma=catalyse], [form=catalyzed i], [form=catalysed i], [form=catalyzing i], [form=catalysing i])",
    suggestions: [":inflect(trigger)", ":inflect(cause)"]
  },
  {
    phrase: "cause a drop in",
    category: "variation",
    selector: "[lemma=cause] > [lemma=drop] > [form=in i]",
    suggestions: [":inflect(reduce)"]
  },
  {
    phrase: "cerebrate / ideate / intellectualize / logicalize",
    category: "variation",
    selector: ":matches([lemma=cerebrate], [lemma=ideate], [lemma=intellectualize], [lemma=logicalize])",
    suggestions: [":inflect(think)"]
  },
  {
    phrase: "certainly",
    category: "ai",
    selector: "[form=certainly i]",
    message: "Cut it, along with whatever qualifies it: 'the release will almost certainly slip' => 'the release will slip'"
  },
  {
    phrase: "choose one's words carefully",
    category: "ai",
    selector: "[lemma=choose] > [lemma=word] ~ [form=carefully i]",
    message: "Rewrite using 'watching (his/her) words'"
  },
  {
    phrase: "a clarion call",
    category: "cliche",
    selector: "[form=call i] > [form=clarion i]",
    message: "Rewrite this whole sentence to describe how something is a 'clear signal' or a 'compelling appeal'."
  },
  {
    phrase: "clear as crystal",
    category: "cliche",
    selector: "[lemma=clear] > [form=as i] > [form=crystal i]",
    suggestions: ["transparent"]
  },
  {
    phrase: "close proximity",
    category: "redundancy",
    selector: "[form=proximity i] > [form=close i]",
    suggestions: ["proximity"]
  },
  {
    phrase: "cloud one's judgement",
    category: "ai",
    selector: "[lemma=cloud] > [lemma=judgement]",
    message: "Rewrite with the equivalent of 'bias', either as a verb or as a noun"
  },
  {
    phrase: "cogitate",
    category: "variation",
    selector: "[lemma=cogitate]",
    suggestions: [":inflect(ponder)"]
  },
  {
    phrase: "cognize / cognise",
    category: "variation",
    selector: ":matches([lemma=cognize], [lemma=cognise])",
    suggestions: [":inflect(know)"]
  },
  {
    phrase: "commence / dive headfirst",
    category: "variation",
    selector: ":matches([lemma=commence], [lemma=dive] > [form=headfirst i])",
    suggestions: [":inflect(start)", ":inflect(begin)"]
  },
  {
    phrase: "commitment to",
    category: "ai",
    selector: "[lemma=commitment] > [form=to i]",
    message: "Use a verb: say what they promised to do"
  },
  {
    phrase: "a commitment to excellence",
    category: "ai",
    selector: "[lemma=commitment] > [form=to i] [lemma=excellence]",
    message: "Rewrite this as a verb expressing someone is 'decided to do things right'"
  },
  {
    phrase: "a complex interplay",
    category: "ai",
    selector: "[lemma=interplay] > [lemma=complex]",
    suggestions: ["link", "complicated relationship"]
  },
  {
    phrase: "comprehensive",
    category: "ai",
    selector: "[form=comprehensive i]",
    suggestions: ["broad", "wide", "complete"]
  },
  {
    phrase: "conceptualization",
    category: "variation",
    selector: "[lemma=conceptualization]",
    suggestions: [":inflect(interpretation)"]
  },
  {
    phrase: "conceptualize",
    category: "variation",
    selector: "[lemma=conceptualize]",
    suggestions: [":inflect(interpret)"]
  },
  {
    phrase: "connected with/to",
    category: "variation",
    selector: "[form=connected i] > :matches([form=with i], [form=to i])",
    suggestions: ["linked to"]
  },
  {
    phrase: "continue to inspire",
    category: "ai",
    selector: "[lemma=continue] > [form=to i] > [lemma=inspire]",
    suggestions: ["still :inflect(inspire)"]
  },
  {
    phrase: "contribute to",
    category: "ai",
    selector: "[lemma=contribute] > [form=to i]",
    suggestions: [":inflect(lead)", ":inflect(cause)"]
  },
  {
    phrase: "cornerstone",
    category: "ai",
    selector: "[lemma=cornerstone]",
    suggestions: [":inflect(foundation)", ":inflect(basis)"]
  },
  {
    phrase: "corporate greed",
    category: "cliche",
    selector: "[form=greed i] > [form=corporate i]",
    message: "Corporate greed is a clich\xE9. Describe instead a specific way in which a specific company is doing something illegal, immoral or reckless for profit, or if there are no examples remove this altogether."
  },
  {
    phrase: "a crucial/pivotal/vital/key role/moment",
    category: "ai",
    selector: ":matches([lemma=role], [lemma=moment]) > :matches([form=crucial i], [form=pivotal i], [form=vital i], [form=key i])",
    message: "Say what the person or thing actually did"
  },
  {
    phrase: "a crucible of",
    category: "cliche",
    selector: "[form=crucible i] > [form=of i]",
    message: "Rewrite this whole sentence to avoid using 'crucible' as a metaphor. If it's used to mean something that is enduring a difficult situation, use 'test', 'trial' or 'gauntlet' instead."
  },
  {
    phrase: "cultivate",
    category: "ai",
    selector: "[lemma=cultivate]",
    suggestions: [":inflect(build)", ":inflect(grow)", ":inflect(develop)"]
  },
  {
    phrase: "current trend",
    category: "redundancy",
    selector: "[lemma=trend] > [form=current i]",
    suggestions: [":inflect(trend)"]
  },
  {
    phrase: "cut to the chase",
    category: "cliche",
    selector: "[lemma=cut] > [form=to i] > [form=chase i]",
    suggestions: [":inflect(summarize)"]
  },
  {
    phrase: "cutting-edge",
    category: "ai",
    selector: "[form=cutting-edge i]",
    suggestions: ["new", "latest", "modern"]
  },
  {
    phrase: "deconstruct",
    category: "variation",
    selector: "[lemma=deconstruct]",
    suggestions: [":inflect(examine)"]
  },
  {
    phrase: "decrease in strength",
    category: "variation",
    selector: "[lemma=decrease] > [form=in i] > [form=strength i]",
    suggestions: [":inflect(weaken)"]
  },
  {
    phrase: "deep dive",
    category: "ai",
    selector: "[lemma=dive] > [form=deep i]",
    message: "Rewrite when it's a metaphor for a long exploration of a subject"
  },
  {
    phrase: "deeply rooted",
    category: "ai",
    selector: "[form=rooted i] > [form=deeply i]",
    suggestions: ["ingrained", "entrenched"]
  },
  {
    phrase: "deeply-rooted",
    category: "ai",
    selector: "[form=deeply-rooted i]",
    suggestions: ["ingrained", "entrenched"]
  },
  {
    phrase: "delve",
    category: "variation",
    selector: "[lemma=delve]",
    message: "Rewrite using 'explore', 'investigate' or 'examine'"
  },
  {
    phrase: "delve into",
    category: "variation",
    selector: "[lemma=delve] [form=into i]",
    suggestions: [
      ":inflect(explore)",
      ":inflect(investigate)",
      ":inflect(examine)",
      ":inflect(look) into"
    ]
  },
  {
    phrase: "demonstrate",
    category: "ai",
    selector: "[lemma=demonstrate]",
    suggestions: [":inflect(show)", ":inflect(display)"]
  },
  {
    phrase: "depreciate in value",
    category: "variation",
    selector: "[lemma=depreciate] > [form=in i] > [form=value i]",
    suggestions: [":inflect(depreciate)"]
  },
  {
    phrase: "desiderate",
    category: "variation",
    selector: "[lemma=desiderate]",
    suggestions: [":inflect(desire)"]
  },
  {
    phrase: "despite the challenge/fact",
    category: "ai",
    selector: "[form=despite i] > :matches([lemma=challenge], [lemma=fact])",
    message: "Name the specific obstacle, or drop the concession and state what happened"
  },
  {
    phrase: "diaspora",
    category: "variation",
    selector: "[lemma=diaspora]",
    suggestions: [":inflect(dispersion)"]
  },
  {
    phrase: "dimly lit",
    category: "variation",
    selector: "[form=lit i] > [form=dimly i]",
    suggestions: ["dark", "somber", "shadowy"]
  },
  {
    phrase: "a diverse perspective",
    category: "ai",
    selector: "[lemma=perspective] > [form=diverse i]",
    suggestions: ["different :inflect(view)", "varied :inflect(opinion)"]
  },
  {
    phrase: "do not remember",
    category: "variation",
    selector: ":matches([lemma=do], [form=can i], [form=could i]) > [lemma=remember] > [form=not i]",
    suggestions: [":inflect(forget)"]
  },
  {
    phrase: "during the course of",
    category: "variation",
    selector: "[form=during i] > [form=course i] > [form=of i]",
    suggestions: ["during"]
  },
  {
    phrase: "dynamic",
    category: "ai",
    selector: "[form=dynamic i][xpos=ADJ]",
    suggestions: ["changing", "active"]
  },
  {
    phrase: "each and every",
    category: "variation",
    selector: "[form=each i] > [form=and i] > [form=every i]",
    suggestions: ["each"]
  },
  {
    phrase: "easier said than done",
    category: "variation",
    selector: ":matches([form=easier i], [form=sooner i], [form=better i]) ~ [lemma=say] > [form=than i] > [form=done i]",
    suggestions: ["hard"]
  },
  {
    phrase: "echo",
    category: "ai",
    selector: "[lemma=echo][xpos=VERB]",
    message: "When it means 'repeat', rewrite as 'repeat'. When it means 'resonate', rewrite as 'resonate'"
  },
  {
    phrase: "elevate",
    category: "variation",
    selector: "[lemma=elevate i]",
    message: "Rewrite as 'high' if referring to physical altitude, and 'exalted' or 'sublime' if referring to something or someone's high quality"
  },
  {
    phrase: "elucidate",
    category: "variation",
    selector: "[lemma=elucidate]",
    suggestions: [":inflect(explain)"]
  },
  {
    phrase: "embark",
    category: "variation",
    selector: "[lemma=embark]",
    message: "Rewrite using 'start' or 'begin'"
  },
  {
    phrase: "emphasize",
    category: "ai",
    selector: "[lemma=emphasize][xpos=VERB]",
    suggestions: [
      ":inflect(underline)",
      ":inflect(stress)",
      ":inflect(point) out"
    ]
  },
  {
    phrase: "emphasize/underscore/highlight the need/potential",
    category: "ai",
    selector: ":matches([lemma=emphasize], [lemma=underscore], [lemma=highlight]) > :matches([lemma=need], [lemma=potential])",
    message: "Say what is needed or what is possible, instead of reporting that a need or a potential is being pointed at"
  },
  {
    phrase: "empower",
    category: "variation",
    selector: "[lemma=empower][xpos=VERB]",
    suggestions: [":inflect(enable)"]
  },
  {
    phrase: "encompass",
    category: "variation",
    selector: "[lemma=encompass]",
    suggestions: [":inflect(include)", ":inflect(cover)"]
  },
  {
    phrase: "endeavor (noun)",
    category: "ai",
    selector: "[lemma=endeavor][xpos=NOUN]",
    suggestions: [":inflect(attempt)", ":inflect(effort)"]
  },
  {
    phrase: "endeavor (verb)",
    category: "ai",
    selector: "[lemma=endeavor][xpos=VERB]",
    suggestions: [":inflect(try)"]
  },
  {
    phrase: "enduring",
    category: "ai",
    selector: "[form=enduring i][xpos=ADJ]",
    suggestions: ["lasting"]
  },
  {
    phrase: "an enduring legacy",
    category: "ai",
    selector: "[lemma=legacy] > [form=enduring i]",
    message: "Drop 'enduring', or say what the person left behind that people still use"
  },
  {
    phrase: "enhance",
    category: "ai",
    selector: "[lemma=enhance]",
    suggestions: [":inflect(improve)", ":inflect(boost)"]
  },
  {
    phrase: "ensure compliance",
    category: "ai",
    selector: "[lemma=ensure] > [form=compliance i]",
    message: "Rewrite to mean 'make sure (someone) plays/follows along' or 'make (someone) go along with it'"
  },
  {
    phrase: "the evidence base",
    category: "ai",
    selector: "[lemma=base] > [form=evidence i]",
    suggestions: [":inflect(evidence)"]
  },
  {
    phrase: "evolving landscape",
    category: "ai",
    selector: "[lemma=landscape] > [form=evolving i]",
    message: "Name the thing that is changing, and say how"
  },
  {
    phrase: "exact same",
    category: "redundancy",
    selector: "[form=exact i] ~ [lemma=same]",
    suggestions: ["same"]
  },
  {
    phrase: "an exceptional performance",
    category: "ai",
    selector: "[lemma=performance] > [form=exceptional i]",
    message: "Rewrite with the equivalent of 'great', 'outstanding' or 'remarkable'"
  },
  {
    phrase: "exemplify",
    category: "ai",
    selector: "[lemma=exemplify]",
    suggestions: [":inflect(show)"]
  },
  {
    phrase: "exhibit a tendency to",
    category: "variation",
    selector: "[lemma=exhibit] > [form=tendency i] > [form=to i]",
    suggestions: [":inflect(tend) to"]
  },
  {
    phrase: "experts/critics argue",
    category: "ai",
    selector: ":matches([lemma=argue], [lemma=claim]) > :matches([lemma=expert], [lemma=critic])",
    message: "Avoid vague generalizations, point to specific claims"
  },
  {
    phrase: "face adversity",
    category: "ai",
    selector: "[lemma=face] > [lemma=adversity]",
    suggestions: [":inflect(struggle)", ":inflect(suffer)"]
  },
  {
    phrase: "facilitate",
    category: "variation",
    selector: "[lemma=facilitate]",
    suggestions: [":inflect(help)"]
  },
  {
    phrase: "the fact that",
    category: "empty",
    selector: "[form=fact i] > [form=the i] ~ [form=that i]",
    message: "Rewrite the sentence without this"
  },
  {
    phrase: "fast-paced",
    category: "ai",
    selector: "[form=fast-paced i]",
    suggestions: ["fast", "hectic", "quick"]
  },
  {
    phrase: "feel the necessity for",
    category: "variation",
    selector: "[lemma=feel] > [form=necessity i] > [form=for i]",
    suggestions: [":inflect(need)"]
  },
  {
    phrase: "few and far between",
    category: "cliche",
    selector: "[form=few i] > [form=and i] > [form=far i] > [form=between i]",
    suggestions: ["scarce"]
  },
  {
    phrase: "fleeting",
    category: "ai",
    selector: "[form=fleeting i][xpos=ADJ]",
    suggestions: ["brief", "quick"]
  },
  {
    phrase: "focal point",
    category: "ai",
    selector: "[lemma=point] > [form=focal i]",
    suggestions: [":inflect(center)", ":inflect(focus)"]
  },
  {
    phrase: "for all intents and purposes",
    category: "empty",
    selector: "[form=for i] > [form=intents i] > [form=all i] ~ [form=and i] > [form=purposes i]",
    suggestions: [""]
  },
  {
    phrase: "for the most part",
    category: "empty",
    selector: "[form=for i] > [form=part i] > [form=the i] ~ [form=most i]",
    suggestions: [""]
  },
  {
    phrase: "for the purpose of",
    category: "variation",
    selector: "[form=for i] > [form=purpose i] > [form=of i]",
    suggestions: ["to"]
  },
  {
    phrase: "for the reason that",
    category: "variation",
    selector: "[form=for i] > [form=reason i] > [form=the i] ~ [form=that i]",
    suggestions: ["because"]
  },
  {
    phrase: "foreseeable future",
    category: "redundancy",
    selector: "[form=future i] > [form=foreseeable i]",
    suggestions: ["future"]
  },
  {
    phrase: "foster",
    category: "ai",
    selector: "[lemma=foster][xpos=VERB]",
    suggestions: [":inflect(encourage)", ":inflect(support)"]
  },
  {
    phrase: "from my personal perspective/standpoint",
    category: "opinion",
    selector: "[form=from i] > :matches([form=perspective i], [form=standpoint i]) > :matches([form=personal i], [form=my i])",
    suggestions: [""]
  },
  {
    phrase: "from the point of view",
    category: "opinion",
    selector: "[form=from i] > [form=point i] > [form=of i] > [form=view i]",
    suggestions: [""]
  },
  {
    phrase: "from the point of view of",
    category: "variation",
    selector: "[form=from i] > [form=point i] > [form=of i] > [form=view i] > [form=of i]",
    message: "Say what that person or group thinks: 'from the point of view of the users, the change is welcome' => 'the users welcome the change'"
  },
  {
    phrase: "fully grasp",
    category: "ai",
    selector: "[lemma=grasp] > [form=fully i]",
    suggestions: ["entirely :inflect(understand)", "totally :inflect(get)"]
  },
  {
    phrase: "furthermore/moreover/additionally",
    category: "empty",
    selector: ":matches([form=furthermore i], [form=moreover i], [form=additionally i])",
    suggestions: ["also", ""]
  },
  {
    phrase: "gain an insight",
    category: "ai",
    selector: "[lemma=gain] > [lemma=insight]",
    suggestions: [":inflect(learn)", ":inflect(understand)"]
  },
  {
    phrase: "galvanize",
    category: "ai",
    selector: ":matches([lemma=galvanize], [lemma=galvanise])",
    suggestions: [":inflect(motivate)", ":inflect(inspire)", ":inflect(rally)"]
  },
  {
    phrase: "game-changer",
    category: "ai",
    selector: ":matches([form=game-changer i], [form=game-changers i], [form=game-changing i])",
    suggestions: ["revolutionary"]
  },
  {
    phrase: "garner",
    category: "variation",
    selector: "[lemma=garner]",
    suggestions: [":inflect(get)", ":inflect(gain)"]
  },
  {
    phrase: "genuinely",
    category: "empty",
    selector: "[form=genuinely i]",
    suggestions: [""]
  },
  {
    phrase: "give an account of",
    category: "variation",
    selector: "[lemma=give] > [form=account i] > [form=of i]",
    suggestions: [":inflect(tell)"]
  },
  {
    phrase: "give rise to",
    category: "variation",
    selector: "[lemma=give] > [form=rise i] > [form=to i]",
    suggestions: [":inflect(create)"]
  },
  {
    phrase: "green with envy",
    category: "cliche",
    selector: "[form=green i] > [form=with i] > [form=envy i]",
    suggestions: ["jealous"]
  },
  {
    phrase: "ground-truth",
    category: "ai",
    selector: ":matches([form=ground-truth i], [form=ground-truths i])",
    suggestions: ["reference"]
  },
  {
    phrase: "hale and hearty",
    category: "cliche",
    selector: "[form=hale i] > [form=and i] > [form=hearty i]",
    suggestions: ["healthy"]
  },
  {
    phrase: "hang in the air between",
    category: "cliche",
    selector: "[lemma=hang] > [form=in i] > [form=air i] > [form=between i]",
    message: "Delete the sentence. What hangs in the air between two people is never what the scene is about, and the sentence around it already says it"
  },
  {
    phrase: "harness",
    category: "ai",
    selector: "[lemma=harness][xpos=VERB]",
    suggestions: [":inflect(use)"]
  },
  {
    phrase: "have knowledge of",
    category: "variation",
    selector: "[lemma=have] > [form=knowledge i] > [form=of i]",
    suggestions: [":inflect(know)"]
  },
  {
    phrase: "have the effect of",
    category: "variation",
    selector: "[lemma=have] > [form=effect i] > [form=of i]",
    suggestions: [":inflect(cause)"]
  },
  {
    phrase: "he is the man who is",
    category: "variation",
    selector: "[lemma=be] > [form=he i] ~ [form=man i] > [lemma=be] > [PronType=Rel]",
    suggestions: ["he is"]
  },
  {
    phrase: "heart pounding against one's ribs",
    category: "variation",
    selector: "[lemma=pound][xpos=VERB] > [form=heart i] ~ [form=against i] > [lemma=rib]",
    suggestions: ["heart :inflect(pound)"]
  },
  {
    phrase: "heart pounding in one's chest",
    category: "variation",
    selector: "[lemma=pound][xpos=VERB] > [form=heart i] ~ [form=in i] > [lemma=chest]",
    suggestions: ["heart :inflect(pound)"]
  },
  {
    phrase: "highlight",
    category: "ai",
    selector: "[lemma=highlight][xpos=VERB]",
    suggestions: [
      ":inflect(underline)",
      ":inflect(stress)",
      ":inflect(point) out"
    ]
  },
  {
    phrase: "hold out an olive branch",
    category: "cliche",
    selector: "[lemma=hold] > [form=out i] > [form=branch i] > [form=olive i]",
    suggestions: [":inflect(offer) to make peace"]
  },
  {
    phrase: "hold tightly",
    category: "explained-verb",
    selector: "[lemma=hold] > [form=tightly i]",
    suggestions: [":inflect(clutch)"]
  },
  {
    phrase: "holistic",
    category: "variation",
    selector: "[form=holistic i]",
    suggestions: ["complete", "whole"]
  },
  {
    phrase: "hone one's skills",
    category: "ai",
    selector: "[lemma=hone] > [lemma=skill]",
    message: "Rewrite with the equivalent of 'improve (one's) skills'"
  },
  {
    phrase: "I believe that",
    category: "opinion",
    selector: "[form=believe i] > [form=I i] ~ [form=that i]",
    suggestions: [""]
  },
  {
    phrase: "identify an area of improvement",
    category: "ai",
    selector: "[lemma=identify] > [lemma=area] > [form=of i] > [form=improvement i]",
    message: "Rewrite saying what to improve"
  },
  {
    phrase: "imo / imho / personally",
    category: "opinion",
    selector: ":matches([form=imo i], [form=imho i], [form=personally i])",
    suggestions: [""]
  },
  {
    phrase: "implication",
    category: "ai",
    selector: "[lemma=implication]",
    message: "Rewrite the sentence to avoid using a noun here. Say what the implication is instead of saying there is an implication."
  },
  {
    phrase: "importance",
    category: "ai",
    selector: "[lemma=importance]",
    message: "Rewrite into a verb that turns 'importance of X' into 'X is important/crucial/critical'."
  },
  {
    phrase: "importantly/notably/interestingly",
    category: "empty",
    selector: ":matches([form=importantly i], [form=notably i], [form=interestingly i])",
    suggestions: [""]
  },
  {
    phrase: "in a world where",
    category: "formalism",
    selector: "[form=in i] > [form=world i] > [form=where i]"
  },
  {
    phrase: "in accordance with",
    category: "variation",
    selector: "[form=in i] > [form=accordance i] > [form=with i]",
    suggestions: ["following"]
  },
  {
    phrase: "in association with",
    category: "variation",
    selector: "[form=in i] > [lemma=association] > [form=with i]",
    suggestions: ["with"]
  },
  {
    phrase: "in connection with/to",
    category: "variation",
    selector: "[form=in i] > [lemma=connection] > :matches([form=with i], [form=to i])",
    suggestions: ["about", "over"]
  },
  {
    phrase: "in my opinion/view/estimation/judgement",
    category: "opinion",
    selector: "[form=in i] > :matches([form=opinion i], [form=view i], [form=estimation i], [form=judgement i]) > [form=my i]",
    suggestions: [""]
  },
  {
    phrase: "in order to",
    category: "variation",
    selector: "[form=in i] > [form=order i] > [form=to i]",
    suggestions: ["to"]
  },
  {
    phrase: "in spite of",
    category: "variation",
    selector: "[form=in i] > [form=spite i] > [form=of i]",
    suggestions: ["despite"]
  },
  {
    phrase: "in summary/conclusion",
    category: "empty",
    selector: "[form=in i] > :matches([lemma=summary], [lemma=conclusion]):not(:has([PronType=Art]))",
    suggestions: [""]
  },
  {
    phrase: "in the digital age",
    category: "ai",
    selector: "[lemma=age] > [form=digital i]",
    message: "Rewrite to avoid speaking about the 'modern day' or 'digital age', use 'anachronistic' or 'out of date' for things which are out of date."
  },
  {
    phrase: "in the event/case of",
    category: "variation",
    selector: "[form=in i] > :matches([form=event i], [form=case i]) > [form=the i] ~ :matches([form=of i], [form=that i])",
    suggestions: ["if"]
  },
  {
    phrase: "in the heart of",
    category: "ai",
    selector: "[form=in i] > [lemma=heart] > [form=the i] ~ [form=of i]",
    suggestions: ["in"]
  },
  {
    phrase: "in the nature of",
    category: "variation",
    selector: "[form=in i] > [form=nature i] > [form=of i]",
    suggestions: ["like"]
  },
  {
    phrase: "in the neighborhood of",
    category: "variation",
    selector: "[form=in i] > [form=neighborhood i] > [form=the i] ~ [form=of i]",
    suggestions: ["around"]
  },
  {
    phrase: "in the process of",
    category: "empty",
    selector: "[form=in i] > [form=process i] > [form=the i] ~ [form=of i]",
    suggestions: [""]
  },
  {
    phrase: "in the realm of",
    category: "formalism",
    selector: "[form=in i] > [form=realm i] > [form=of i]"
  },
  {
    phrase: "in the scheme of things",
    category: "empty",
    selector: "[form=in i] > [form=scheme i] > [form=of i] > [form=things i]",
    suggestions: [""]
  },
  {
    phrase: "in this day and age",
    category: "cliche",
    selector: "[form=in i] > [form=day i] > [form=this i] ~ [form=and i] > [form=age i]",
    suggestions: ["now"]
  },
  {
    phrase: "in this section",
    category: "empty",
    selector: "[form=in i] > [lemma=section] > [form=this i]",
    message: "Delete it. The heading already says this"
  },
  {
    phrase: "inasmuch as",
    category: "variation",
    selector: "[form=inasmuch i] > [form=as i]",
    suggestions: ["since"]
  },
  {
    phrase: "incline toward",
    category: "variation",
    selector: "[lemma=incline] > :matches([form=toward i], [form=towards i])",
    suggestions: [":inflect(lean)"]
  },
  {
    phrase: "indistinguishable",
    category: "variation",
    selector: "[form=indistinguishable i]",
    suggestions: ["identical", "same"]
  },
  {
    phrase: "industry reports",
    category: "ai",
    selector: "[lemma=report] > [form=industry i]",
    message: "Avoid vague language. Name the reports and who wrote them"
  },
  {
    phrase: "an initiative aims to",
    category: "ai",
    selector: "[lemma=aim] > [lemma=initiative] ~ [form=to i]",
    message: "Say what the initiative does, not what it aims to do. If it has not done it yet, say when it will"
  },
  {
    phrase: "innovative / groundbreaking / avant-garde / newfound",
    category: "variation",
    selector: ":matches([form=innovative i], [form=innovational i], [form=innovatory i], [form=avant-garde i], [form=groundbreaking i], [form=newfound i])",
    suggestions: [":inflect(original)", ":inflect(new)", ":inflect(reserve)"]
  },
  {
    phrase: "internalize",
    category: "variation",
    selector: ":matches([lemma=internalize], [lemma=internalise])",
    suggestions: [":inflect(absorb)", ":inflect(learn)"]
  },
  {
    phrase: "interplay",
    category: "variation",
    selector: "[lemma=interplay]",
    suggestions: [":inflect(interaction)"]
  },
  {
    phrase: "intricacies",
    category: "ai",
    selector: "[lemma=intricacy]",
    suggestions: [":inflect(detail)"]
  },
  {
    phrase: "intricate",
    category: "ai",
    selector: "[form=intricate i]",
    suggestions: ["complex", "complicated"]
  },
  {
    phrase: "introduce for the first time",
    category: "redundancy",
    selector: "[lemma=introduce] > [form=for i] > [form=time i] > [form=first i]",
    suggestions: ["introduce"]
  },
  {
    phrase: "is a reminder",
    category: "ai",
    selector: "[lemma=be] [lemma=reminder] > [form=a i]",
    message: "Say what it reminds the reader of, or cut the sentence"
  },
  {
    phrase: "it could be suggested that",
    category: "hedge",
    selector: "[Mood=Pot] > [form=be i] > [lemma=suggest]",
    message: "Avoid vague language"
  },
  {
    phrase: "it goes without saying",
    category: "empty",
    selector: "[lemma=go] > [form=without i] > [lemma=say]",
    suggestions: [""]
  },
  {
    phrase: "it is agreed/probable/conceivable that",
    category: "hedge",
    selector: "[lemma=be] > [form=it i] ~ :matches([form=agreed i], [form=probable i], [form=conceivable i]) > [form=that i]"
  },
  {
    phrase: "it is clear to me",
    category: "opinion",
    selector: "[lemma=be] > [form=it i] ~ [form=clear i] > [form=to i] > [form=me i]",
    suggestions: [""]
  },
  {
    phrase: "it is important/critical/crucial to",
    category: "empty",
    selector: "[lemma=be] > [form=it i] ~ :matches([form=important i], [form=critical i], [form=crucial i]) > [form=to i]",
    suggestions: [""]
  },
  {
    phrase: "it is important/critical/crucial/desirable to",
    category: "formalism",
    selector: "[lemma=be] > [form=it i] ~ :matches([form=important i], [form=critical i], [form=crucial i], [form=desirable i]) > :matches([form=to i], [Tense=Pres][VerbForm=Part])"
  },
  {
    phrase: "it is worth noting",
    category: "empty",
    selector: "[lemma=be] > [form=it i] ~ [lemma=note] > [form=worth i]",
    suggestions: [""]
  },
  {
    phrase: "it might be said/argued",
    category: "hedge",
    selector: "[Mood=Pot] > [form=it i] ~ [form=be i] > :matches([lemma=say], [lemma=argue])"
  },
  {
    phrase: "it might be the case/possible that",
    category: "hedge",
    selector: "[Mood=Pot] > [form=it i] ~ [form=be i] > :matches([form=case i], [form=possible i]) > [form=that i]"
  },
  {
    phrase: "it seems important to note",
    category: "hedge",
    selector: ":matches([form=seems i], [lemma=be]) > [form=it i] ~ :matches([form=important i], [form=worth i]) > [form=to i] > :matches([form=note i], [form=mention i])"
  },
  {
    phrase: "it seems to me",
    category: "opinion",
    selector: "[lemma=seem] > [form=it i] ~ [form=to i] > [form=me i]",
    suggestions: [""]
  },
  {
    phrase: "it seems/appears that",
    category: "hedge",
    selector: ":matches([form=seems i], [form=appears i]) > [form=it i] ~ [form=that i]"
  },
  {
    phrase: "the journey begins",
    category: "ai",
    selector: "[lemma=begin] > [lemma=journey]",
    message: "Name what is actually starting instead of calling it a journey"
  },
  {
    phrase: "just only",
    category: "variation",
    selector: "[form=only i] > [form=just i]",
    suggestions: ["just"]
  },
  {
    phrase: "juxtapose",
    category: "variation",
    selector: "[lemma=juxtapose]",
    suggestions: [":inflect(compare)", ":inflect(contrast)"]
  },
  {
    phrase: "kind of / sort of",
    category: "hedge",
    selector: ":matches([form=kind i], [form=sort i]) > [lemma=of] > :matches([xpos=ADJ], [xpos=ADV])"
  },
  {
    phrase: "landscape",
    category: "ai",
    selector: "[lemma=landscape]",
    message: "If you mean a field, a market or a situation rather than scenery, say which"
  },
  {
    phrase: "last but not least",
    category: "variation",
    selector: "[form=last i] > [form=but i] > [form=least i] > [form=not i]",
    suggestions: ["finally"]
  },
  {
    phrase: "a lasting/indelible mark",
    category: "ai",
    selector: "[xpos=NOUN] > :matches([form=indelible i], [form=lasting i])",
    message: "Say what the thing actually changed, instead of saying it left something that lasts"
  },
  {
    phrase: "lay eyes on",
    category: "variation",
    selector: "[lemma=lay] > [lemma=eye] > [form=on i]",
    suggestions: [":inflect(see)"]
  },
  {
    phrase: "lay the groundwork",
    category: "ai",
    selector: "[form=lay] > [lemma=groundwork]",
    suggestions: [":inflect(prepare)", ":inflect(set) up"]
  },
  {
    phrase: "leave a mark",
    category: "ai",
    selector: "[lemma=leave] > [lemma=mark]",
    suggestions: [":inflect(make) an impact", ":inflect(impress)"]
  },
  {
    phrase: "leave suddenly",
    category: "explained-verb",
    selector: "[lemma=leave] > [form=suddenly i]",
    suggestions: [":inflect(disappear)"]
  },
  {
    phrase: "let bygones be bygones",
    category: "cliche",
    selector: "[lemma=let] > [form=be i] > [form=bygones i] ~ [form=bygones i]",
    suggestions: [":inflect(make) peace"]
  },
  {
    phrase: "let's dive into/explore",
    category: "empty",
    selector: "[form=let i] > [lemma=us] ~ :matches([lemma=dive], [lemma=explore])",
    message: "Delete it and start with the content"
  },
  {
    phrase: "leverage",
    category: "ai",
    selector: "[lemma=leverage][xpos=VERB]",
    suggestions: [":inflect(use)"]
  },
  {
    phrase: "load-bearing",
    category: "ai",
    selector: "[form=load-bearing i]",
    message: "Avoid this when used as a metaphor"
  },
  {
    phrase: "loom large",
    category: "ai",
    selector: "[lemma=loom] > [form=large i]",
    suggestions: ["inflect(dominate)"]
  },
  {
    phrase: "lucubrate",
    category: "variation",
    selector: "[lemma=lucubrate]",
    suggestions: [":inflect(study)"]
  },
  {
    phrase: "make a long story short",
    category: "cliche",
    selector: ":matches([lemma=make], [lemma=cut]) > [form=story i] ~ [form=short i]",
    suggestions: [":inflect(summarize)"]
  },
  {
    phrase: "make a lot of sense",
    category: "variation",
    selector: "[lemma=make] > [form=lot i] > [form=of i] > [form=sense i]",
    message: "Say that it is logical: 'the plan makes a lot of sense' => 'the plan is logical'"
  },
  {
    phrase: "make an attempt",
    category: "variation",
    selector: "[lemma=make] > [form=attempt i]",
    suggestions: [":inflect(try)"]
  },
  {
    phrase: "mark a turning point",
    category: "ai",
    selector: "[lemma=mark] > [lemma=point] > [form=turning i]",
    message: "Say what changed and when, e.g. 'it marked a turning point in the war' => 'from then on the war went the other way'"
  },
  {
    phrase: "may vary",
    category: "hedge",
    selector: "[form=may i] > [lemma=vary]",
    message: "Say what changes it, or give the range"
  },
  {
    phrase: "meticulous",
    category: "ai",
    selector: "[form=meticulous i]",
    message: "Rewrite using 'detailed', 'accurate' or 'thorough' if describing something, or 'perfectionist' or 'conscientious' if describing someone"
  },
  {
    phrase: "meticulous attention",
    category: "ai",
    selector: "[form=attention i] > [form=meticulous i]",
    suggestions: ["special care"]
  },
  {
    phrase: "meticulously",
    category: "ai",
    selector: "[form=meticulously i]",
    suggestions: ["accurately", "exactly", "precisely"]
  },
  {
    phrase: "might be a reason why/for",
    category: "hedge",
    selector: "[Mood=Pot] > [form=be i] > [lemma=reason] > :matches([form=why i], [form=for i])"
  },
  {
    phrase: "might have been a reason why/for",
    category: "hedge",
    selector: "[Mood=Pot] > [form=have i] > [form=been i] > [lemma=reason] > :matches([form=why i], [form=for i])"
  },
  {
    phrase: "more specifically",
    category: "redundancy",
    selector: "[form=more i] [lemma=specifically]",
    suggestions: ["specifically"]
  },
  {
    phrase: "most profound",
    category: "ai",
    selector: "[form=profound i] > [form=most i]",
    suggestions: ["deepest"]
  },
  {
    phrase: "mounting pressure",
    category: "ai",
    selector: "[lemma=mount] > [form=pressure i]",
    suggestions: ["heat :inflect(rise)", "tension :inflect(escalate)"]
  },
  {
    phrase: "multifaceted",
    category: "ai",
    selector: "[lemma=multifaceted]",
    suggestions: ["complex", "varied", "versatile"]
  },
  {
    phrase: "multiplicity",
    category: "variation",
    selector: "[lemma=multiplicity]",
    suggestions: [":inflect(variety)"]
  },
  {
    phrase: "mutation-tested/mutation-checked/mutation-verified",
    category: "ai",
    selector: ":matches([form=mutation-tested i], [form=mutation-checked i], [form=mutation-verified i])",
    suggestions: ["tested"]
  },
  {
    phrase: "a myriad/plethora of",
    category: "variation",
    selector: ":matches([lemma=myriad], [lemma=plethora]) > [form=a i] ~ [form=of i]",
    suggestions: ["many"]
  },
  {
    phrase: "natural beauty",
    category: "cliche",
    selector: "[lemma=beauty] > [form=natural i]",
    message: "Say what the thing looks like"
  },
  {
    phrase: "navigate",
    category: "ai",
    selector: "[lemma=navigate][xpos=VERB]",
    message: "Rewrite using the most appropriate from 'making/finding one's way', 'sail' or 'maneuver'"
  },
  {
    phrase: "navigate the complex",
    category: "ai",
    selector: "[lemma=navigate] > [xpos=NOUN] > [form=complex i]",
    message: "Rewrite with the equivalent of 'finding one's way through', and drop 'complex' if the difficulty is already clear"
  },
  {
    phrase: "nestled",
    category: "ai",
    selector: "[form=nestled i]",
    message: "Write 'sits in' or 'is in'"
  },
  {
    phrase: "a new avenue",
    category: "ai",
    selector: "[lemma=avenue] > [form=new i]",
    suggestions: ["new :inflect(possibility)", "new :inflect(option)"]
  },
  {
    phrase: "not anticipate",
    category: "variation",
    selector: "[lemma=anticipate] > [form=not i]",
    message: "Rewrite using the verb 'miss' or 'overlook'"
  },
  {
    phrase: "not fully understand",
    category: "ai",
    selector: "[lemma=understand] > [lemma=not] ~ [form=fully i]",
    suggestions: [
      "partially :inflect(understand)",
      "only somewhat :inflect(comprehend)"
    ]
  },
  {
    phrase: "notwithstanding",
    category: "variation",
    selector: "[form=notwithstanding i]",
    suggestions: ["despite"]
  },
  {
    phrase: "nuanced",
    category: "ai",
    selector: "[form=nuanced i]",
    suggestions: ["subtle", "complex"]
  },
  {
    phrase: "observers have cited",
    category: "ai",
    selector: "[lemma=have] > [lemma=observer] ~ [lemma=cite]",
    message: "Avoid vague claims and statements. Name who said it"
  },
  {
    phrase: "off the top of my head",
    category: "empty",
    selector: "[form=off i] > [form=top i] > [form=of i] > [lemma=head]",
    suggestions: [""]
  },
  {
    phrase: "offer/present/provide something unique/valuable",
    category: "ai",
    selector: ":matches([lemma=offer], [lemma=present], [lemma=provide]) > [xpos=NOUN] > :matches([form=unique i], [form=valuable i])",
    message: "Say what the thing actually gives the reader, instead of calling it unique or valuable"
  },
  {
    phrase: "oft",
    category: "variation",
    selector: "[form=oft i]",
    suggestions: ["often"]
  },
  {
    phrase: "on a regular basis",
    category: "variation",
    selector: "[form=on i] > [form=basis i] > [form=regular i]",
    suggestions: ["regularly"]
  },
  {
    phrase: "on the assumption that",
    category: "variation",
    selector: "[form=on i] > [form=assumption i] > [form=the i] ~ [form=that i]",
    suggestions: ["if"]
  },
  {
    phrase: "on the basis of",
    category: "variation",
    selector: "[form=on i] > [form=basis i] > [form=of i]",
    suggestions: ["based on"]
  },
  {
    phrase: "on the grounds that",
    category: "variation",
    selector: "[form=on i] > [form=grounds i] > [form=that i]",
    suggestions: ["because"]
  },
  {
    phrase: "one might say/argue",
    category: "hedge",
    selector: "[Mood=Pot] > [form=one i] ~ :matches([form=say i], [form=argue i])"
  },
  {
    phrase: "an ongoing dialogue",
    category: "ai",
    selector: "[lemma=dialogue] > [form=ongoing i]",
    message: "Rewrite with the equivalent of 'they keep talking' and/or say what the talks are about"
  },
  {
    phrase: "operationalize",
    category: "variation",
    selector: ":matches([lemma=operationalize], [lemma=operationalise])",
    message: "Write 'put into practice' or 'start using', and say who does it"
  },
  {
    phrase: "optimize",
    category: "ai",
    selector: ":matches([lemma=optimize], [lemma=optimise])",
    suggestions: [":inflect(improve)", ":inflect(tune)"]
  },
  {
    phrase: "over the course of",
    category: "variation",
    selector: "[form=over i] > [form=course i] > [form=of i]",
    suggestions: ["during"]
  },
  {
    phrase: "owing to",
    category: "variation",
    selector: "[form=owing i] > [form=to i]",
    suggestions: ["because of"]
  },
  {
    phrase: "paradigm",
    category: "variation",
    selector: "[lemma=paradigm]",
    suggestions: [":inflect(model)", ":inflect(approach)"]
  },
  {
    phrase: "pave the way",
    category: "ai",
    selector: "[lemma=pave] > [lemma=way]",
    suggestions: [":inflect(make) way", ":inflect(aid)"]
  },
  {
    phrase: "pave the way for the future",
    category: "ai",
    selector: "[lemma=pave] > [lemma=way] > [form=for i] > [lemma=future]",
    message: "'Paving the way' already points forward. Drop 'for the future', or name what it makes possible"
  },
  {
    phrase: "personae",
    category: "variation",
    selector: "[form=personae i]",
    suggestions: ["characters"]
  },
  {
    phrase: "pivotal",
    category: "ai",
    selector: "[form=pivotal i]",
    suggestions: ["important", "key", "central"]
  },
  {
    phrase: "a pivotal moment",
    category: "ai",
    selector: "[lemma=moment] > [form=pivotal i]",
    suggestions: ["decisive :inflect(moment)"]
  },
  {
    phrase: "plainly",
    category: "ai",
    selector: "[form=plainly i]",
    suggestions: ["clearly", "simply"]
  },
  {
    phrase: "play a pivotal/crucial role",
    category: "ai",
    selector: "[lemma=play] > [lemma=role] > :matches([form=pivotal i], [form=crucial i])",
    message: "Say what the person or thing actually did, e.g. 'he played a pivotal role in the deal' => 'he made the deal happen'"
  },
  {
    phrase: "a potential risk/concern",
    category: "ai",
    selector: ":matches([lemma=risk], [lemma=concern]) > [form=potential i]",
    message: "A risk is already potential. Drop the adjective, or say how likely the harm is"
  },
  {
    phrase: "potentially lead to",
    category: "ai",
    selector: "[lemma=lead] > [form=potentially i] ~ [form=to i]",
    suggestions: ["can :inflect(cause)"]
  },
  {
    phrase: "pre-fix",
    category: "ai",
    selector: ":matches([form=pre-fix i], [form=pre-fixes i], [form=pre-fixed i], [form=pre-fixing i])",
    message: "Say what you fixed, and when"
  },
  {
    phrase: "predate",
    category: "variation",
    selector: "[lemma=predate]",
    message: "Write 'happen before', ideally say when"
  },
  {
    phrase: "prepossessing",
    category: "variation",
    selector: "[form=prepossessing i][xpos=ADJ]",
    suggestions: ["attractive"]
  },
  {
    phrase: "prior to",
    category: "variation",
    selector: "[form=prior i] > [form=to i]",
    suggestions: ["before"]
  },
  {
    phrase: "profound",
    category: "ai",
    selector: "[form=profound i]",
    suggestions: ["deep"]
  },
  {
    phrase: "a prominent figure",
    category: "ai",
    selector: "[lemma=figure] > [form=prominent i]",
    suggestions: ["notable :inflect(person)", "key :inflect(individual)"]
  },
  {
    phrase: "provide insight",
    category: "ai",
    selector: "[lemma=provide] > [lemma=insight]",
    suggestions: [":inflect(clarify)", ":inflect(explain)", ":inflect(reveal)"]
  },
  {
    phrase: "push boundaries",
    category: "ai",
    selector: "[lemma=push] > [lemma=boundary]",
    suggestions: [":inflect(innovate)", ":inflect(pioneer)"]
  },
  {
    phrase: "put into words",
    category: "variation",
    selector: "[lemma=put] > [form=into i] > [form=words i]",
    suggestions: [":inflect(say)"]
  },
  {
    phrase: "the question hanging between them",
    category: "cliche",
    selector: "[form=question i] > [form=hanging i] > [form=between i]",
    message: "Rewrite this sentence to succinctly describe how characters stood physically."
  },
  {
    phrase: "the question hangs between them",
    category: "cliche",
    selector: "[lemma=hang] > [form=question i] ~ [form=between i]",
    message: "Rewrite this sentence to succinctly describe how characters stood physically."
  },
  {
    phrase: "quick as a flash",
    category: "cliche",
    selector: "[form=quick i] > [form=as i] > [form=flash i]",
    suggestions: ["quick"]
  },
  {
    phrase: "raise an important question",
    category: "ai",
    selector: "[lemma=raise] > [lemma=question] > [form=important i]",
    message: "Avoid filler. Directly state the question"
  },
  {
    phrase: "rather / somewhat / fairly / quite / pretty",
    category: "hedge",
    selector: ":matches([xpos=ADJ], [xpos=ADV]) > :matches([form=rather i][xpos=ADV], [form=somewhat i], [form=fairly i], [form=quite i], [form=pretty i])"
  },
  {
    phrase: "re-derive/re-verify/re-measure",
    category: "ai",
    selector: ":matches([form=re-derive i], [form=re-derives i], [form=re-derived i], [form=re-deriving i], [form=re-verify i], [form=re-verifies i], [form=re-verified i], [form=re-verifying i], [form=re-measure i], [form=re-measures i], [form=re-measured i], [form=re-measuring i])",
    message: "Drop the 're-': say you worked it out again, and what changed"
  },
  {
    phrase: "realm",
    category: "ai",
    selector: "[lemma=realm]",
    suggestions: [":inflect(area)", ":inflect(field)"],
    message: "Avoid 'realm' as a metaphor, outside of a fictional context"
  },
  {
    phrase: "reflect broader",
    category: "ai",
    selector: "[lemma=reflect] > [xpos=NOUN] > [form=broader i]",
    message: "Name the bigger thing you mean"
  },
  {
    phrase: "regard as being",
    category: "variation",
    selector: "[lemma=regard] > [form=as i] > [form=being i]",
    suggestions: [":inflect(consider)"]
  },
  {
    phrase: "a relentless pursuit",
    category: "ai",
    selector: "[lemma=pursuit] > [form=relentless i]",
    message: "Rewrite using 'drive to get'"
  },
  {
    phrase: "render inoperative",
    category: "variation",
    selector: "[lemma=render] > [form=inoperative i]",
    suggestions: [":inflect(disable)"]
  },
  {
    phrase: "a renewed sense",
    category: "ai",
    selector: "[lemma=sense] > [form=renewed i]",
    message: "Name the feeling directly: 'a renewed sense of purpose' => 'she knew what she was for again'"
  },
  {
    phrase: "renowned",
    category: "variation",
    selector: "[form=renowned i]",
    suggestions: ["famous", "well known"]
  },
  {
    phrase: "reply in a tone",
    category: "ai",
    selector: "[lemma=reply] > [form=in i] > [lemma=tone]",
    message: "Use a speech verb that carries the tone: 'replied in a soft tone' => 'whispered'"
  },
  {
    phrase: "represent/mark a shift",
    category: "ai",
    selector: ":matches([lemma=represent], [lemma=mark]) [lemma=shift] > [form=a i]",
    message: "Say what changed, from what to what"
  },
  {
    phrase: "resonate",
    category: "ai",
    selector: "[lemma=resonate]",
    message: "Avoid as a metaphor, say how it connects with or matches something else"
  },
  {
    phrase: "resonate with",
    category: "ai",
    selector: "[lemma=resonate] > [form=with i]",
    suggestions: [":inflect(align)", ":inflect(match)"]
  },
  {
    phrase: "revolutionize",
    category: "ai",
    selector: ":matches([lemma=revolutionize], [lemma=revolutionise])",
    suggestions: [":inflect(transform)", ":inflect(reimagine)"]
  },
  {
    phrase: "a role in shaping",
    category: "ai",
    selector: "[lemma=role] > [form=in i] > [lemma=shape]",
    message: "Rewrite without 'a role' to say what the thing did: 'played a role in shaping society' => 'shaped society'"
  },
  {
    phrase: "seamless",
    category: "ai",
    selector: "[form=seamless i]",
    suggestions: ["smooth"]
  },
  {
    phrase: "seamlessly",
    category: "ai",
    selector: "[form=seamlessly i]",
    suggestions: ["smoothly", "easily"]
  },
  {
    phrase: "send shockwaves",
    category: "ai",
    selector: "[lemma=send] > [lemma=shockwave]",
    suggestions: [
      ":inflect(reverberate)",
      ":inflect(make) waves",
      ":inflect(ripple)"
    ]
  },
  {
    phrase: "a sense of (noun)",
    category: "ai",
    selector: "[lemma=sense][xpos=NOUN] > [xpos=ADJ] ~ [lemma=of]",
    message: "Rewrite using a single noun instead of a phrase. E.g. 'his sense of isolation' => 'his isolation', 'a sense of self' => 'individuality'"
  },
  {
    phrase: "a sense of anticipation",
    category: "cliche",
    selector: "[form=sense i] > [form=of i] > [form=anticipation i]",
    message: "Rewrite this whole sentence to describe the person as 'anxious' or 'nervous'"
  },
  {
    phrase: "serve the purpose of",
    category: "variation",
    selector: "[lemma=serve] > [lemma=purpose] > [form=of i]",
    suggestions: [":inflect(help)"]
  },
  {
    phrase: "serve/stand/function/operate as",
    category: "ai",
    selector: ":matches([lemma=serve], [lemma=stand], [lemma=function], [lemma=operate]) > [form=as i] > [xpos=NOUN]",
    suggestions: ["inflect(be)"]
  },
  {
    phrase: "set the stage for",
    category: "ai",
    selector: "[lemma=set] > [lemma=stage]",
    message: "Say what happened next"
  },
  {
    phrase: "shape the public opinion",
    category: "ai",
    selector: "[lemma=shape] > [lemma=opinion] > [form=public i]",
    message: "Say who ends up believing what, instead of 'shaping public opinion'"
  },
  {
    phrase: "she is the woman who is",
    category: "variation",
    selector: "[lemma=be] > [form=she i] ~ [form=woman i] > [lemma=be] > [PronType=Rel]",
    suggestions: ["she is"]
  },
  {
    phrase: "shed light",
    category: "ai",
    selector: "[lemma=shed] > [lemma=light]",
    suggestions: [
      ":inflect(illuminate)",
      ":inflect(clarify)",
      ":inflect(explain)"
    ]
  },
  {
    phrase: "shed light on",
    category: "ai",
    selector: "[lemma=shed] > [lemma=light] ~ [form=on i]",
    suggestions: [":inflect(explain)", ":inflect(clarify)", ":inflect(reveal)"]
  },
  {
    phrase: "shimmer / glimmer / glint / glitter / glisten",
    category: "variation",
    selector: ":matches([lemma=shimmer], [lemma=glimmer], [lemma=glint], [lemma=glitter], [lemma=glisten])",
    suggestions: [
      ":inflect(shine)",
      ":inflect(sparkle)",
      ":inflect(glow)",
      ":inflect(beam)"
    ]
  },
  {
    phrase: "showcase",
    category: "ai",
    selector: ":matches([lemma=showcase][xpos=VERB], [form=showcases i][xpos=VERB], [form=showcased i], [form=showcasing i])",
    suggestions: [":inflect(show)"]
  },
  {
    phrase: "significant",
    category: "ai",
    selector: "[form=significant i]",
    message: "Prefer a more common, shorter version of the same notion: important, major or big"
  },
  {
    phrase: "smoke the peace pipe",
    category: "cliche",
    selector: "[lemma=smoke] > [lemma=pipe] > [form=peace i]",
    suggestions: [":inflect(make) peace"]
  },
  {
    phrase: "the societal expectation",
    category: "ai",
    selector: "[lemma=expectation] > [form=societal i]",
    suggestions: ["social :inflect(expectation)"]
  },
  {
    phrase: "spate",
    category: "variation",
    selector: "[lemma=spate]",
    suggestions: [":inflect(flood)"]
  },
  {
    phrase: "speak loudly",
    category: "explained-verb",
    selector: "[lemma=speak] > [form=loudly i]",
    suggestions: [":inflect(shout)"]
  },
  {
    phrase: "speak/say quietly",
    category: "explained-verb",
    selector: ":matches([lemma=speak], [lemma=say]) > [form=quietly i]",
    suggestions: [":inflect(whisper)"]
  },
  {
    phrase: "speaks volumes",
    category: "ai",
    selector: "[form=speaks i] > [form=volumes i]",
    suggestions: ["shows", "indicates", "says a lot"]
  },
  {
    phrase: "the stakes are high",
    category: "ai",
    selector: "[lemma=be] > [form=stakes i] ~ [form=high i]",
    message: "Rewrite with the equivalent of 'there is a lot at risk'"
  },
  {
    phrase: "stand in stark contrast",
    category: "ai",
    selector: "[lemma=stand] > [form=in i] > [lemma=contrast] > [form=stark i]",
    message: "Rewrite with the equivalent of 'X and Y are nothing alike' or 'X clashes with Y'"
  },
  {
    phrase: "a stark contrast",
    category: "ai",
    selector: "[lemma=contrast] > [form=stark i]",
    suggestions: ["clear :inflect(distinction)", "sharp :inflect(contrast)"]
  },
  {
    phrase: "a stark reminder",
    category: "ai",
    selector: "[lemma=reminder] > [lemma=stark]",
    suggestions: [
      "harsh :inflect(reminder)",
      "clear :inflect(reminder)",
      "strong :inflect(reminder)"
    ]
  },
  {
    phrase: "a step forward",
    category: "ai",
    selector: "[form=forward i][xpos=NOUN] > [lemma=step]",
    message: "Rewrite the sentence to use an action verb, e.g. 'it is a step forward for the industry' => 'it advances the industry'"
  },
  {
    phrase: "a step toward",
    category: "ai",
    selector: "[lemma=step] > [lemma=toward]",
    message: "Rewrite the sentence to use an action verb, e.g. rewrite 'X is a step toward Y' to 'X brings Y closer', or 'with each step toward X' => 'as he approached X'"
  },
  {
    phrase: "stop to consider",
    category: "variation",
    selector: "[lemma=stop] > [form=to i] > [form=consider i]",
    suggestions: [":inflect(consider)"]
  },
  {
    phrase: "strategize",
    category: "variation",
    selector: ":matches([lemma=strategize], [lemma=strategise])",
    suggestions: [":inflect(plan)"]
  },
  {
    phrase: "streamline",
    category: "ai",
    selector: "[lemma=streamline]",
    suggestions: [":inflect(simplify)"]
  },
  {
    phrase: "structural",
    category: "ai",
    selector: "[form=structural i]",
    message: "Avoid vague metaphors, use concrete language."
  },
  {
    phrase: "structurally",
    category: "ai",
    selector: "[form=structurally i]",
    message: "Avoid vague metaphors, use concrete language."
  },
  {
    phrase: "swear to protect",
    category: "ai",
    selector: "[lemma=swear] > [form=to i] > [lemma=protect]",
    message: "Rewrite with the equivalent of 'vow to defend', or 'pledge to protect'"
  },
  {
    phrase: "symbolize its ongoing/enduring/lasting",
    category: "ai",
    selector: ":matches([lemma=symbolize], [lemma=symbolise]) > [xpos=NOUN] > :matches([form=ongoing i], [form=enduring i], [form=lasting i])",
    message: "Say what the thing keeps doing"
  },
  {
    phrase: "a symphony of",
    category: "ai",
    selector: "[lemma=symphony] > [form=of i]",
    message: "Rewrite saying something is 'full of X' rather than saying it's a 'symphony of X'"
  },
  {
    phrase: "synergy/synergize",
    category: "ai",
    selector: ":matches([lemma=synergy], [lemma=synergize], [lemma=synergise])",
    message: "Delete it, and say what the two things do together"
  },
  {
    phrase: "take under consideration",
    category: "variation",
    selector: "[lemma=take] > [form=under i] > [form=consideration i]",
    suggestions: [":inflect(consider)"]
  },
  {
    phrase: "a tapestry of",
    category: "cliche",
    selector: "[lemma=tapestry]",
    message: "If used as a tailoring metaphor, rewrite this whole sentence to remove it. Describe the concrete actions or details."
  },
  {
    phrase: "target an intervention",
    category: "ai",
    selector: "[lemma=target] > [lemma=intervention]",
    message: "Say who is helped and how, instead of 'targeted interventions'"
  },
  {
    phrase: "tbh",
    category: "variation",
    selector: "[form=tbh i]",
    suggestions: ["honestly"]
  },
  {
    phrase: "a testament to",
    category: "cliche",
    selector: "[form=testament i] > [form=to i]",
    message: "Rewrite this whole sentence to avoid using 'testament' as a metaphor. Describe something as 'proof' or 'evidence' instead."
  },
  {
    phrase: "that is to say",
    category: "variation",
    selector: "[lemma=be] > [form=that i] ~ [form=to i] > [form=say i]",
    suggestions: ["that :inflect(be)"]
  },
  {
    phrase: "think in terms of",
    category: "variation",
    selector: "[lemma=think] > [form=in i] > [form=terms i] > [form=of i]",
    suggestions: [":inflect(think) of"]
  },
  {
    phrase: "thrilling",
    category: "ai",
    selector: "[form=thrilling i]",
    suggestions: ["exciting", "exhilarating"]
  },
  {
    phrase: "through the agency/medium of",
    category: "variation",
    selector: "[form=through i] > :matches([form=agency i], [form=medium i]) > [form=of i]",
    suggestions: ["by"]
  },
  {
    phrase: "thrum",
    category: "variation",
    selector: "[lemma=thrum][xpos=VERB]",
    suggestions: [":inflect(hum)"]
  },
  {
    phrase: "thusly",
    category: "variation",
    selector: "[form=thusly i]",
    suggestions: ["thus"]
  },
  {
    phrase: "to be honest",
    category: "variation",
    selector: "[form=to i] > [form=be i] > [form=honest i]",
    suggestions: ["honestly"]
  },
  {
    phrase: "to summarize",
    category: "empty",
    selector: "[form=to i] > :matches([lemma=summarize], [lemma=summarise])",
    suggestions: [""]
  },
  {
    phrase: "a transformative power",
    category: "ai",
    selector: "[lemma=power] > [lemma=transformative]",
    suggestions: ["driving force"]
  },
  {
    phrase: "treasure trove",
    category: "variation",
    selector: "[form=trove i] > [form=treasure i]",
    suggestions: [
      ":inflect(collection)",
      ":inflect(hoard)",
      ":inflect(reserve)"
    ]
  },
  {
    phrase: "trials and tribulations",
    category: "cliche",
    selector: "[lemma=trial] > [form=and i] > [lemma=tribulation]",
    suggestions: ["trouble"]
  },
  {
    phrase: "try to shake",
    category: "ai",
    selector: "[lemma=try] > [form=to i] > [form=shake i]",
    suggestions: [":inflect(try) to get rid of"]
  },
  {
    phrase: "turn a profit",
    category: "variation",
    selector: "[lemma=turn] > [form=profit i]",
    suggestions: [":inflect(profit)"]
  },
  {
    phrase: "a turning point",
    category: "ai",
    selector: "[lemma=point] > [form=turning i]",
    suggestions: ["crossroads", "decisive moment", "watershed"]
  },
  {
    phrase: "unboundedness",
    category: "variation",
    selector: "[lemma=unboundedness]",
    message: "Say the thing is unbounded rather than naming the property: 'the unboundedness of the domain' => 'the domain is unbounded'"
  },
  {
    phrase: "undeniable",
    category: "ai",
    selector: "[form=undeniable i]",
    suggestions: ["certain", "sure"]
  },
  {
    phrase: "underscore",
    category: "ai",
    selector: "[lemma=underscore][xpos=VERB]",
    suggestions: [":inflect(highlight)", ":inflect(stress)", ":inflect(show)"]
  },
  {
    phrase: "understanding",
    category: "ai",
    selector: "[form=understanding i][xpos=NOUN]",
    message: "Rewrite the phrase using 'know' or 'understand' acting as verbs."
  },
  {
    phrase: "a unique blend",
    category: "ai",
    selector: "[lemma=blend] > [lemma=unique]",
    suggestions: ["particular combination", "special mix"]
  },
  {
    phrase: "unleash",
    category: "ai",
    selector: "[lemma=unleash][xpos=VERB]",
    suggestions: [":inflect(release)", ":inflect(let) loose", ":inflect(free)"]
  },
  {
    phrase: "unleashed",
    category: "ai",
    selector: "[form=unleashed i][xpos=ADJ]",
    suggestions: ["unfettered", "liberated", "free", "unbound"]
  },
  {
    phrase: "unwavering",
    category: "ai",
    selector: "[form=unwavering i]",
    suggestions: ["unshakable", "resolute", "staunch"]
  },
  {
    phrase: "an unwavering commitment",
    category: "ai",
    selector: "[lemma=commitment] > [form=unwavering i]",
    message: "Rewrite with a verb phrase: 'they showed an unwavering commitment to quality' => 'they refused to ship anything shoddy'"
  },
  {
    phrase: "up to the time/moment/point when",
    category: "variation",
    selector: "[form=up i] > [form=to i] > :matches([form=time i], [form=moment i], [form=point i]) > [form=the i] ~ :matches([form=when i], [form=where i])",
    suggestions: ["until"]
  },
  {
    phrase: "utilize / utilise / put to use",
    category: "variation",
    selector: ":matches([lemma=utilize], [lemma=utilise], [lemma=put] > [form=to i] > [form=use i])",
    suggestions: ["use"]
  },
  {
    phrase: "vacuous",
    category: "variation",
    selector: "[form=vacuous i]",
    suggestions: ["empty", "meaningless"]
  },
  {
    phrase: "vacuously",
    category: "ai",
    selector: "[form=vacuously i]",
    message: "Say the test proves nothing, and why"
  },
  {
    phrase: "verbalize",
    category: "variation",
    selector: ":matches([lemma=verbalize], [lemma=verbalise])",
    suggestions: [":inflect(say)"]
  },
  {
    phrase: "the very",
    category: "variation",
    selector: "[form=the i] ~ [form=very i]",
    suggestions: ["the"]
  },
  {
    phrase: "vibrant",
    category: "ai",
    selector: "[form=vibrant i]",
    suggestions: ["alive", "vivid", "lively"]
  },
  {
    phrase: "vis-a-vis",
    category: "variation",
    selector: ":matches([form=vis-a-vis], [form=vis-\xE0-vis])",
    suggestions: ["compared to", "face to face"]
  },
  {
    phrase: "a voice fills",
    category: "ai",
    selector: "[lemma=fill] > [lemma=voice]",
    message: "Generally avoid this cliche, just write what the character said"
  },
  {
    phrase: "walk slowly",
    category: "explained-verb",
    selector: "[lemma=walk] > [form=slowly i]",
    suggestions: [":inflect(stroll)"]
  },
  {
    phrase: "want/need strongly/desperately",
    category: "explained-verb",
    selector: ":matches([lemma=want], [lemma=need]) > :matches([form=strongly i], [form=desperately i])",
    suggestions: [":inflect(crave)"]
  },
  {
    phrase: "the way I see it",
    category: "opinion",
    selector: "[form=way i] > [form=the i] ~ [lemma=see] > [form=I i] ~ [form=it i]",
    suggestions: [""]
  },
  {
    phrase: "the way I think/feel about it",
    category: "opinion",
    selector: "[form=way i] > [form=the i] ~ :matches([lemma=think], [lemma=feel]) > [form=I i] ~ [form=about i] > [form=it i]",
    suggestions: [""]
  },
  {
    phrase: "wedge",
    category: "ai",
    selector: "[lemma=wedge][xpos=VERB]",
    message: "Say what got stuck, or what you drove in between"
  },
  {
    phrase: "wedged",
    category: "ai",
    selector: "[form=wedged i]",
    suggestions: ["stuck", "jammed"]
  },
  {
    phrase: "well-nigh",
    category: "variation",
    selector: "[form=well-nigh]",
    suggestions: ["almost"]
  },
  {
    phrase: "what is the reason",
    category: "variation",
    selector: "[lemma=be] > [form=what i] ~ [lemma=reason]",
    message: "Ask it with 'why': 'What is the reason we keep losing customers?' => 'Why do we keep losing customers?'"
  },
  {
    phrase: "when it comes to",
    category: "variation",
    selector: "[form=when i] > [form=comes i] > [form=it i] ~ [form=to i]",
    suggestions: ["when", "regarding"]
  },
  {
    phrase: "whilst",
    category: "variation",
    selector: "[form=whilst i]",
    suggestions: ["while"]
  },
  {
    phrase: "white as a sheet",
    category: "cliche",
    selector: "[form=white i] > [form=as i] > [lemma=sheet]",
    suggestions: ["pale"]
  },
  {
    phrase: "with a grain/pinch of salt",
    category: "cliche",
    selector: "[form=with i] > :matches([form=grain i], [form=pinch i]) > [form=of i] > [form=salt i]",
    suggestions: ["with caution"]
  },
  {
    phrase: "with a view to",
    category: "variation",
    selector: "[lemma=with] > [form=view i] > [form=to i]",
    suggestions: ["to"]
  },
  {
    phrase: "with or in regard/reference to",
    category: "variation",
    selector: ":matches([lemma=with], [form=in i]) > :matches([form=regard i], [form=reference i]) > [form=to i]",
    suggestions: ["about"]
  },
  {
    phrase: "with practiced ease",
    category: "cliche",
    selector: "[form=with i] > [lemma=ease] > :matches([form=practiced i], [form=practised i])",
    suggestions: ["effortlessly"]
  },
  {
    phrase: "with the advent of",
    category: "formalism",
    selector: "[form=with i] > [form=advent i] > [form=of i]"
  },
  {
    phrase: "with the condition that",
    category: "variation",
    selector: "[form=with i] > [form=condition i] > [form=that i]",
    suggestions: ["if"]
  },
  {
    phrase: "without further ado",
    category: "empty",
    selector: "[form=without i] > [lemma=ado] > [form=further i]",
    suggestions: [""]
  },
  {
    phrase: "work tirelessly",
    category: "ai",
    selector: "[lemma=work] > [form=tirelessly i]",
    suggestions: [":inflect(toil)", ":inflect(strive)", ":inflect(labor)"]
  },
  {
    phrase: "woven into",
    category: "ai",
    selector: "[form=woven i] > [form=into i]",
    suggestions: ["embedded in", "included in"]
  }
];
var asQuery = ({ selector, suggestions, message, category }) => ({
  selector,
  ...suggestions ? { suggestions } : {},
  message: message ?? categoryMessages[category],
  id: ErrorId.NO_BAD_WORDS
});
var queries = entries.map(asQuery);
var no_bad_words_default = (sentences2) => queries_to_errors_default(queries, sentences2);

// ../english-lint/dist/antonyms.js
var antonyms = {
  able: { ADJ: "unable" },
  abridged: { ADJ: "unabridged" },
  absent: { ADJ: "present" },
  abundant: { ADJ: "scarce" },
  accept: { VERB: "refuse" },
  acceptable: { ADJ: "unacceptable" },
  acceptably: { ADV: "unacceptably" },
  accessible: { ADJ: "inaccessible" },
  accidentally: { ADV: "deliberately" },
  accurate: { ADJ: "inaccurate" },
  accustomed: { ADJ: "unaccustomed" },
  addicted: { ADJ: "unaddicted" },
  addictive: { ADJ: "nonaddictive" },
  adequate: { ADJ: "inadequate" },
  adhesive: { ADJ: "nonadhesive" },
  admissible: { ADJ: "inadmissible" },
  advantageous: { ADJ: "disadvantageous" },
  affected: { ADJ: "unaffected" },
  agree: { VERB: "disagree" },
  agreeable: { ADJ: "disagreeable" },
  alterable: { ADJ: "unalterable" },
  amateur: { ADJ: "professional" },
  ambiguous: { ADJ: "unambiguous" },
  ambitious: { ADJ: "unambitious" },
  appropriate: { ADJ: "inappropriate" },
  approve: { VERB: "disapprove" },
  artificial: { ADJ: "natural" },
  asleep: { ADJ: "awake" },
  attractive: { ADJ: "repulsive" },
  available: { ADJ: "unavailable" },
  bad: { ADJ: "good", ADV: "good" },
  balanced: { ADJ: "unbalanced" },
  beautiful: { ADJ: "ugly" },
  benign: { ADJ: "malign" },
  boundless: { ADJ: "limited" },
  brave: { ADJ: "cowardly" },
  broad: { ADJ: "narrow" },
  busy: { ADJ: "idle" },
  capable: { ADJ: "incapable" },
  careful: { ADJ: "careless" },
  carelessly: { ADV: "carefully" },
  cease: { VERB: "continue" },
  certain: { ADJ: "uncertain" },
  chalant: { ADJ: "nonchalant" },
  changeable: { ADJ: "unchangeable" },
  changed: { ADJ: "unchanged" },
  civilized: { ADJ: "uncivilized" },
  clean: { ADJ: "dirty" },
  clear: { ADJ: "unclear" },
  clement: { ADJ: "inclement" },
  clever: { ADJ: "stupid" },
  closed: { ADJ: "open" },
  clothed: { ADJ: "unclothed" },
  coiled: { ADJ: "uncoiled" },
  colored: { ADJ: "uncolored" },
  colorful: { ADJ: "colorless" },
  colourful: { ADJ: "colourless" },
  comfortable: { ADJ: "uncomfortable" },
  comfortably: { ADV: "uncomfortably" },
  commensurate: { ADJ: "incommensurate" },
  commercial: { ADJ: "noncommercial" },
  common: { ADJ: "rare" },
  commutable: { ADJ: "incommutable" },
  comparable: { ADJ: "incomparable" },
  comparably: { ADV: "incomparably" },
  compatible: { ADJ: "incompatible" },
  competent: { ADJ: "incompetent" },
  complete: { ADJ: "incomplete" },
  compliant: { ADJ: "defiant" },
  compulsory: { ADJ: "voluntary" },
  concise: { ADJ: "prolix" },
  conclusive: { ADJ: "inconclusive" },
  concrete: { ADJ: "abstract" },
  confirmed: { ADJ: "unconfirmed" },
  congruent: { ADJ: "incongruent" },
  connected: { ADJ: "disconnected" },
  conscious: { ADJ: "unconscious" },
  consciously: { ADV: "unconsciously" },
  considerate: { ADJ: "inconsiderate" },
  consistent: { ADJ: "inconsistent" },
  conspicuous: { ADJ: "inconspicuous" },
  constitutional: { ADJ: "unconstitutional" },
  controversial: { ADJ: "uncontroversial" },
  convenient: { ADJ: "inconvenient" },
  convergent: { ADJ: "divergent" },
  convinced: { ADJ: "unconvinced" },
  convincing: { ADJ: "unconvincing" },
  convincingly: { ADV: "unconvincingly" },
  correct: { ADJ: "incorrect", ADV: "incorrect" },
  correctly: { ADV: "incorrectly" },
  counterfeit: { ADJ: "genuine" },
  courteous: { ADJ: "discourteous" },
  courteously: { ADV: "discourteously" },
  credible: { ADJ: "incredible" },
  credulous: { ADJ: "incredulous" },
  critical: { ADJ: "noncritical" },
  critically: { ADV: "uncritically" },
  curable: { ADJ: "incurable" },
  dangerous: { ADJ: "safe" },
  decisive: { ADJ: "indecisive" },
  decrease: { ADJ: "increase" },
  defined: { ADJ: "undefined" },
  definite: { ADJ: "indefinite" },
  democratic: { ADJ: "undemocratic" },
  deniable: { ADJ: "undeniable" },
  dependable: { ADJ: "undependable" },
  dependent: { ADJ: "independent" },
  desirable: { ADJ: "undesirable" },
  destructible: { ADJ: "indestructible" },
  detached: { ADJ: "attached" },
  developed: { ADJ: "undeveloped" },
  directly: { ADV: "indirectly" },
  documented: { ADJ: "undocumented" },
  drinkable: { ADJ: "undrinkable" },
  easy: { ADJ: "hard", ADV: "hard" },
  edible: { ADJ: "inedible" },
  educated: { ADJ: "uneducated" },
  effective: { ADJ: "ineffective" },
  efficacious: { ADJ: "inefficacious" },
  efficient: { ADJ: "inefficient" },
  elastic: { ADJ: "inelastic" },
  elegant: { ADJ: "inelegant" },
  eligible: { ADJ: "ineligible" },
  employable: { ADJ: "unemployable" },
  employed: { ADJ: "unemployed" },
  enfranchised: { ADJ: "disenfranchised" },
  equal: { ADJ: "unequal" },
  equally: { ADV: "unequally" },
  equivocal: { ADJ: "unequivocal" },
  esoteric: { ADJ: "exoteric" },
  essential: { ADJ: "inessential" },
  ethical: { ADJ: "unethical" },
  euphonious: { ADJ: "cacophonous" },
  evenly: { ADV: "unevenly" },
  exact: { ADJ: "inexact" },
  excitable: { ADJ: "unexcitable" },
  excusable: { ADJ: "inexcusable" },
  excusably: { ADV: "inexcusably" },
  expected: { ADJ: "unexpected" },
  expedient: { ADJ: "inexpedient" },
  expendable: { ADV: "necessary" },
  experienced: { ADJ: "inexperienced" },
  explicit: { ADJ: "implicit" },
  extant: { ADJ: "extinct" },
  external: { ADJ: "internal" },
  extinguishable: { ADJ: "inextinguishable" },
  extricable: { ADJ: "inextricable" },
  extrinsic: { ADJ: "intrinsic" },
  extrospective: { ADJ: "introspective" },
  extrovert: { ADJ: "introvert" },
  fair: { ADJ: "unfair" },
  fallible: { ADJ: "infallible" },
  false: { ADJ: "true" },
  fathomable: { ADJ: "unfathomable" },
  favorable: { ADJ: "unfavorable" },
  favorably: { ADV: "unfavorably" },
  favored: { ADJ: "unfavored" },
  fearfully: { ADV: "fearlessly" },
  feeble: { ADJ: "strong" },
  figurative: { ADJ: "literal" },
  figuratively: { ADV: "literally" },
  finitely: { ADV: "infinitely" },
  fit: { ADJ: "unfit" },
  fixed: { ADJ: "unfixed" },
  flexible: { ADJ: "inflexible" },
  flexibly: { ADV: "inflexibly" },
  foolish: { ADJ: "wise" },
  foolishly: { ADV: "wisely" },
  forget: { VERB: "remember" },
  forgettable: { ADJ: "unforgettable" },
  forgivably: { ADV: "unforgivably" },
  forgiving: { ADJ: "unforgiving" },
  forgivingly: { ADV: "unforgivingly" },
  formal: { ADJ: "informal" },
  fortunate: { ADJ: "unfortunate" },
  frail: { ADJ: "robust" },
  frequent: { ADJ: "infrequent" },
  frequently: { ADV: "infrequently" },
  fresh: { ADJ: "stale" },
  friendly: { ADJ: "hostile" },
  fruitful: { ADJ: "unfruitful" },
  fruitfully: { ADV: "fruitlessly" },
  furnished: { ADJ: "unfurnished" },
  generous: { ADJ: "stingy" },
  gloomy: { ADJ: "cheerful" },
  gracious: { ADJ: "ungracious" },
  graciously: { ADV: "ungraciously" },
  grateful: { ADJ: "ungrateful" },
  gratefully: { ADV: "ungratefully" },
  harmful: { ADJ: "harmless" },
  harsh: { ADJ: "mild" },
  healthy: { ADJ: "sick" },
  helpful: { ADJ: "unhelpful" },
  helpfully: { ADV: "unhelpfully" },
  holy: { ADJ: "unholy" },
  honest: { ADJ: "dishonest" },
  honorable: { ADJ: "dishonorable" },
  hopeful: { ADJ: "hopeless" },
  hopefully: { ADV: "hopelessly" },
  hospitable: { ADJ: "inhospitable" },
  hospitably: { ADV: "inhospitably" },
  human: { ADJ: "inhuman" },
  humane: { ADJ: "inhumane" },
  humanely: { ADV: "inhumanely" },
  humble: { ADJ: "arrogant" },
  humorous: { ADJ: "humorless" },
  humorously: { ADV: "humorlessly" },
  hurried: { ADJ: "unhurried" },
  hurriedly: { ADV: "unhurriedly" },
  immanent: { ADJ: "transeunt" },
  important: { ADJ: "trivial" },
  include: { VERB: "exclude" },
  ingenuous: { ADJ: "disingenuous" },
  intelligent: { ADJ: "stupid" },
  intentional: { ADJ: "accidental" },
  interesting: { ADJ: "boring" },
  interior: { ADJ: "exterior" },
  justly: { ADV: "unjustly" },
  known: { ADJ: "unknown" },
  lawful: { ADJ: "unlawful" },
  lawfully: { ADV: "unlawfully" },
  legal: { ADJ: "illegal" },
  legible: { ADJ: "illegible" },
  legibly: { ADV: "illegibly" },
  legitimate: { ADJ: "illegitimate" },
  legitimately: { ADV: "illegitimately" },
  licit: { ADJ: "illicit" },
  licitly: { ADV: "illicitly" },
  like: { MARK: "unlike", VERB: "dislike" },
  likely: { ADJ: "unlikely" },
  literate: { ADJ: "illiterate" },
  logical: { ADJ: "illogical" },
  logically: { ADV: "illogically" },
  loyal: { ADJ: "disloyal" },
  loyally: { ADV: "disloyally" },
  lucky: { ADV: "unlucky" },
  manageable: { ADJ: "unmanageable" },
  manly: { ADV: "unmanly" },
  mature: { ADJ: "immature" },
  meaningful: { ADJ: "meaningless" },
  merciful: { ADJ: "merciless" },
  mitigated: { ADJ: "unmitigated" },
  modifiable: { ADJ: "unmodifiable" },
  moral: { ADJ: "amoral" },
  multilateral: { ADJ: "unilateral" },
  nasty: { ADJ: "nice" },
  natural: { ADJ: "unnatural" },
  necessary: { ADJ: "unnecessary" },
  normal: { ADJ: "abnormal" },
  obedient: { ADJ: "disobedient" },
  objective: { ADJ: "subjective" },
  objectively: { ADV: "subjectively" },
  obligatory: { ADJ: "optional" },
  obtrusive: { ADJ: "unobtrusive" },
  obtrusively: { ADV: "unobtrusively" },
  occupied: { ADJ: "unoccupied" },
  official: { ADJ: "unofficial" },
  officially: { ADV: "unofficially" },
  original: { ADJ: "unoriginal" },
  painful: { ADJ: "painless" },
  painfully: { ADV: "painlessly" },
  palatable: { ADJ: "unpalatable" },
  palatably: { ADV: "unpalatably" },
  pardonable: { ADJ: "unpardonable" },
  pardonably: { ADV: "unpardonably" },
  partisan: { ADJ: "nonpartisan" },
  patient: { ADJ: "impatient" },
  patriotic: { ADJ: "unpatriotic" },
  patriotically: { ADV: "unpatriotically" },
  permanent: { ADJ: "temporary" },
  planned: { ADJ: "unplanned" },
  playable: { ADJ: "unplayable" },
  pleasant: { ADJ: "unpleasant" },
  pleasantly: { ADV: "unpleasantly" },
  polite: { ADJ: "rude" },
  political: { ADJ: "apolitical" },
  popular: { ADJ: "unpopular" },
  possible: { ADJ: "impossible" },
  powerful: { ADJ: "weak" },
  precedented: { ADJ: "unprecedented" },
  predictable: { ADJ: "unpredictable" },
  prejudiced: { ADJ: "unprejudiced" },
  premeditated: { ADJ: "improvised" },
  prepared: { ADJ: "unprepared" },
  pretentious: { ADJ: "unpretentious" },
  pretentiously: { ADV: "unpretentiously" },
  pretty: { ADJ: "ugly" },
  preventable: { ADJ: "unpreventable" },
  private: { ADJ: "public" },
  privately: { ADV: "publicly" },
  processed: { ADJ: "unprocessed" },
  productive: { ADJ: "unproductive" },
  productively: { ADV: "unproductively" },
  profitable: { ADJ: "unprofitable" },
  propitious: { ADJ: "unpropitious" },
  propitiously: { ADV: "unpropitiously" },
  protected: { ADJ: "unprotected" },
  proved: { ADJ: "unproved" },
  prudent: { ADJ: "imprudent" },
  publishable: { ADJ: "unpublishable" },
  published: { ADJ: "unpublished" },
  punctual: { ADJ: "tardy" },
  pure: { ADJ: "impure" },
  qualified: { ADJ: "unqualified" },
  questionable: { ADJ: "unquestionable" },
  real: { ADJ: "fake" },
  realistic: { ADJ: "unrealistic" },
  realistically: { ADV: "unrealistically" },
  reasonable: { ADJ: "unreasonable" },
  reasonably: { ADV: "unreasonably" },
  reciprocal: { ADJ: "nonreciprocal" },
  recognizably: { ADV: "unrecognizably" },
  recoverable: { ADJ: "unrecoverable" },
  refined: { ADJ: "unrefined" },
  reflective: { ADJ: "nonreflective" },
  registered: { ADJ: "unregistered" },
  regular: { ADJ: "irregular" },
  regulated: { ADJ: "unregulated" },
  relaxed: { ADJ: "tense" },
  reliable: { ADJ: "unreliable" },
  reliably: { ADV: "unreliably" },
  religious: { ADJ: "secular" },
  remarkable: { ADJ: "unremarkable" },
  remarkably: { ADV: "unremarkably" },
  repetitive: { ADJ: "nonrepetitive" },
  requested: { ADJ: "unrequested" },
  reserved: { ADJ: "unreserved" },
  residential: { ADJ: "nonresidential" },
  responsive: { ADJ: "unresponsive" },
  restrained: { ADJ: "unrestrained" },
  restricted: { ADJ: "unrestricted" },
  reversible: { ADJ: "irreversible" },
  rewarding: { ADJ: "unrewarding" },
  satisfactorily: { ADV: "unsatisfactorily" },
  satisfactory: { ADJ: "unsatisfactory" },
  scrupulous: { ADJ: "unscrupulous" },
  secure: { ADJ: "insecure" },
  significant: { ADJ: "insignificant" },
  skilled: { ADJ: "unskilled" },
  sober: { ADJ: "drunk" },
  solved: { ADJ: "unsolved" },
  specialized: { ADJ: "unspecialized" },
  specific: { ADJ: "nonspecific" },
  specified: { ADJ: "unspecified" },
  stable: { ADJ: "unstable" },
  standard: { ADJ: "nonstandard" },
  stoppable: { ADJ: "unstoppable" },
  structured: { ADJ: "unstructured" },
  successful: { ADJ: "unsuccessful" },
  successfully: { ADV: "unsuccessfully" },
  supervised: { ADJ: "unsupervised" },
  supported: { ADJ: "unsupported" },
  supportive: { ADJ: "unsupportive" },
  sure: { ADJ: "unsure" },
  surprised: { ADJ: "unsurprised" },
  surprising: { ADV: "unsurprising" },
  susceptible: { ADJ: "unsusceptible" },
  suspected: { ADJ: "unsuspected" },
  sympathetic: { ADJ: "unsympathetic" },
  sympathetically: { ADV: "unsympathetically" },
  systematic: { ADJ: "unsystematic" },
  systematically: { ADV: "unsystematically" },
  tactful: { ADJ: "tactless" },
  tactfully: { ADV: "tactlessly" },
  talented: { ADJ: "untalented" },
  tame: { ADJ: "wild" },
  tasteful: { ADJ: "tasteless" },
  tastefully: { ADV: "tastelessly" },
  tasty: { ADJ: "tasteless" },
  technical: { ADJ: "nontechnical" },
  tempered: { ADJ: "untempered" },
  thoughtful: { ADJ: "thoughtless" },
  thoughtfully: { ADV: "thoughtlessly" },
  tidy: { ADJ: "untidy" },
  touched: { ADJ: "untouched" },
  trained: { ADJ: "untrained" },
  transparent: { ADJ: "opaque" },
  treated: { ADJ: "untreated" },
  troubled: { ADJ: "untroubled" },
  truthful: { ADJ: "untruthful" },
  truthfully: { ADV: "untruthfully" },
  unsafe: { ADJ: "safe" },
  usual: { ADJ: "unusual" },
  vacant: { ADJ: "occupied" },
  varied: { ADJ: "unvaried" },
  violent: { ADJ: "nonviolent" },
  visible: { ADJ: "invisible" },
  wanted: { ADJ: "unwanted" },
  welcome: { ADJ: "unwelcome" },
  willing: { ADJ: "unwilling" },
  willingly: { ADJ: "unwillingly" },
  witting: { ADJ: "unwitting" },
  wittingly: { ADJ: "unwittingly" },
  worthy: { ADJ: "unworthy" }
};
var antonyms_default = ({ lemma, form, xpos }) => antonyms[lemma ?? form.toLowerCase()]?.[xpos];

// ../english-lint/dist/rules/no-explained-antonyms.js
var isPredicate = (token) => ["ADJ", "ADV"].includes(token.xpos);
var predicateSiblingAfter = (entities, head, siblings) => siblings.find((sibling) => sibling > head && isPredicate(entities[sibling]) && antonyms_default(entities[sibling]));
var swappedPredicateError = (entities, start, siblingIndex) => {
  const sibling = entities[siblingIndex];
  return {
    start,
    end: sibling.misc.at + sibling.form.length,
    message: `Rewrite using '${antonyms_default(sibling)}' instead of 'not ${sibling.form}'`,
    id: ErrorId.NO_EXPLAINED_ANTONYMS
  };
};
var isAuxiliaryBefore = (token, negativePosition) => token != null && token.xpos === "VERB" && token.misc.at < negativePosition && (token.lemma === "do" || token.feats.Mood != null);
var auxiliaryFor = (entities, { id, grandFather, negativePosition }) => {
  const preceding = id > 0 ? entities[id - 1] : void 0;
  if (isAuxiliaryBefore(preceding, negativePosition)) {
    return preceding;
  }
  const ancestor = grandFather !== -1 ? entities[grandFather] : void 0;
  return isAuxiliaryBefore(ancestor, negativePosition) ? ancestor : void 0;
};
var agreementOf = (entities, auxiliary) => {
  const { feats: { Tense, Person, VerbForm } = {}, misc: { children: auxiliaryChildren = [] } = {}, id: auxiliaryId = -1 } = auxiliary ?? {};
  const subject = auxiliaryChildren.find((child) => child < auxiliaryId && entities[child].xpos === "NOUN");
  const Number2 = subject == null ? "Sing" : entities[subject].feats.Number;
  return { Number: Number2, Tense, Person, VerbForm };
};
var inflectsTheAuxiliary = (headTag, auxiliary) => headTag === "VERB" && auxiliary != null;
var replacementsFor = (headAntonym, headTag, auxiliary, agreement) => inflectsTheAuxiliary(headTag, auxiliary) ? [
  inflect_default({
    lemma: headAntonym,
    xpos: "VERB",
    feats: agreement
  })
] : [headAntonym];
var startOf = (headTag, auxiliary, negativePosition) => inflectsTheAuxiliary(headTag, auxiliary) ? auxiliary.misc.at : negativePosition;
var applyRule2 = (entities) => entities.filter(({ lemma }) => lemma === "not").reduce((errors, { id, head, misc: { at: negativePosition } }) => {
  if (head === -1) {
    return errors;
  }
  const headToken = entities[head];
  const { form: headWord, xpos: headTag, misc: { at: headPosition, children: siblings }, head: grandFather } = headToken;
  const headAntonym = antonyms_default(headToken);
  const siblingAfterVerb = predicateSiblingAfter(entities, head, siblings);
  if (headTag === "VERB" && head > id && siblingAfterVerb != null) {
    return errors.concat(swappedPredicateError(entities, negativePosition, siblingAfterVerb));
  }
  if (!headAntonym || negativePosition > headPosition) {
    return errors;
  }
  const negator = { id, grandFather, negativePosition };
  const auxiliary = auxiliaryFor(entities, negator);
  if (headTag === "VERB" && auxiliary == null) {
    return errors;
  }
  const start = startOf(headTag, auxiliary, negativePosition);
  const end = headPosition + headWord.length;
  const suggestions = replacementsFor(headAntonym, headTag, auxiliary, agreementOf(entities, auxiliary));
  return errors.concat({
    start,
    end,
    suggestions: suggestions.map((text) => ({
      range: [start, end],
      text
    })),
    message: `Replace a negative with a positive when it retains the same meaning`,
    id: ErrorId.NO_EXPLAINED_ANTONYMS
  });
}, []);
var no_explained_antonyms_default = (sentences2) => sentences2.reduce((errors, entities) => [...errors, ...applyRule2(entities)], []);

// ../english-lint/dist/rules/no-explained-intensifiers.js
var intensifierDictionary = {
  accurate: ["exact"],
  afraid: ["terrified"],
  angry: ["furious"],
  appealing: ["fascinating", "charming", "irresistible"],
  bad: ["awful", "horrible", "abysmal"],
  beautiful: ["gorgeous"],
  big: ["huge"],
  boring: ["tedious"],
  bright: ["brilliant"],
  busy: ["swamped"],
  calm: ["serene"],
  careful: ["meticulous"],
  cheap: ["stingy"],
  clean: ["immaculate"],
  clear: ["transparent"],
  clever: ["brilliant"],
  cold: ["freezing"],
  confused: ["perplexed"],
  creative: ["ingenious", "visionary"],
  crowded: ["packed"],
  cute: ["adorable"],
  damaged: ["ruined"],
  dear: ["cherished"],
  dirty: ["filthy"],
  disconcerted: ["amazed", "astounded", "astonished", "shocked"],
  disconcerting: ["amazing", "astounding", "astonishing", "shocking"],
  dry: ["arid"],
  dull: ["tedious"],
  eager: ["restless"],
  fast: ["instant"],
  fierce: ["ferocious"],
  "fine-looking": ["gorgeous", "stunning"],
  funny: ["hilarious"],
  glad: ["delighted"],
  good: ["excellent"],
  "good-looking": ["gorgeous", "stunning"],
  happy: ["ecstatic", "blissful"],
  heavy: ["massive", "impenetrable", "powerful"],
  hungry: ["starving"],
  hurt: ["devastated", "ruined"],
  important: ["crucial"],
  large: ["huge", "giant"],
  lazy: ["slacking"],
  light: ["weightless"],
  little: ["tiny"],
  long: ["interminable"],
  loud: ["deafening"],
  mean: ["cruel"],
  messy: ["chaotic"],
  nasty: ["disgusting"],
  nice: ["great", "kind"],
  noisy: ["deafening"],
  often: ["frequently"],
  old: ["ancient"],
  open: ["transparent"],
  pale: ["ashen"],
  poor: ["destitute", "weak"],
  powerful: ["mighty"],
  pretty: ["beautiful"],
  quick: ["instant"],
  quiet: ["silent"],
  rainy: ["pouring"],
  rich: ["wealthy"],
  sad: ["depressed", "dismal"],
  scared: ["terrified"],
  scary: ["terrifying"],
  serious: ["grave"],
  sharp: ["keen"],
  shiny: ["dazzling", "brilliant"],
  short: ["tiny"],
  shy: ["timid"],
  simple: ["plain"],
  small: ["tiny"],
  smart: ["brilliant"],
  special: ["exceptional"],
  sure: ["confident"],
  surprised: ["amazed", "astounded", "astonished", "shocked"],
  talented: ["gifted"],
  tasty: ["delicious"],
  tired: ["exhausted"],
  ugly: ["disgusting"],
  upset: ["disturbed"],
  warm: ["hot"],
  wet: ["soaked"],
  willing: ["eager"],
  worried: ["distressed"]
};
var applyRule3 = (entities) => entities.filter(({ lemma, xpos, head }, index) => lemma && ["very", "really"].includes(lemma) && xpos === "ADV" && head !== -1 && head > index && ["ADJ", "ADV"].includes(entities[head].xpos)).reduce((errors, { head }) => {
  const { lemma: headLemma, misc: { at }, form: headWord } = entities[head];
  const suggestions = headLemma ? intensifierDictionary[headLemma] : null;
  if (suggestions == null) {
    return errors;
  }
  const subtree = parse_to_subtree_default(entities, head);
  const { misc: { at: start } } = entities[Math.min(...subtree)];
  const end = at + headWord.length;
  return [
    ...errors,
    {
      start,
      end,
      suggestions: suggestions.map((text) => ({
        range: [start, end],
        text
      })),
      message: `Replace intensified modifiers with a more powerful and concise word that retains the meaning`,
      id: ErrorId.NO_EXPLAINED_INTENSIFIERS
    }
  ];
}, []);
var no_explained_intensifiers_default = (sentences2) => sentences2.reduce((errors, entities) => [...errors, ...applyRule3(entities)], []);

// ../english-lint/dist/rules/no-high-lexical-density.js
var defaultOptions2 = {
  nounPercentage: 40,
  adjectivePercentage: 20,
  nounAndAdjectivePercentage: 50,
  minimumWords: 16
};
var isWord = ({ xpos }) => xpos !== "PUNCT";
var isPlainNoun = ({ xpos, feats: { PronType } }) => xpos === "NOUN" && PronType == null;
var isPlainAdjective = ({ xpos, feats: { PronType } }) => xpos === "ADJ" && PronType == null;
var optionsOf = (config) => {
  const given = config[ErrorId.NO_HIGH_LEXICAL_DENSITY];
  const chosen = typeof given === "object" ? given : {};
  return {
    nounPercentage: chosen.nounPercentage ?? defaultOptions2.nounPercentage,
    adjectivePercentage: chosen.adjectivePercentage ?? defaultOptions2.adjectivePercentage,
    nounAndAdjectivePercentage: chosen.nounAndAdjectivePercentage ?? defaultOptions2.nounAndAdjectivePercentage,
    minimumWords: chosen.minimumWords ?? defaultOptions2.minimumWords
  };
};
var measuresOf = (tokens, options) => {
  const words = tokens.filter(isWord);
  const nouns = words.filter(isPlainNoun).length;
  const adjectives = words.filter(isPlainAdjective).length;
  const share = (count) => count / words.length * 100;
  return [
    { share: share(nouns), limit: options.nounPercentage },
    { share: share(adjectives), limit: options.adjectivePercentage },
    {
      share: share(nouns + adjectives),
      limit: options.nounAndAdjectivePercentage
    }
  ];
};
var buildError2 = (tokens) => {
  const words = tokens.filter(isWord);
  const last = words[words.length - 1];
  return {
    start: tokens[0].misc.at,
    end: last.misc.at + last.form.length,
    message: `This sentence is too dense. Simplify it into shorter sentences carrying less ideas/information/facts each, and remove unnecessary adjectives and nouns.`,
    id: ErrorId.NO_HIGH_LEXICAL_DENSITY
  };
};
var applyRule4 = (tokens, options) => {
  const words = tokens.filter(isWord);
  if (words.length < Math.max(options.minimumWords, 1)) {
    return [];
  }
  const over = measuresOf(tokens, options).filter(({ share, limit }) => share > limit);
  return over.length === 0 ? [] : [buildError2(tokens)];
};
var no_high_lexical_density_default = (sentences2, config) => {
  const options = optionsOf(config);
  return sentences2.reduce((errors, tokens) => [...errors, ...applyRule4(tokens, options)], []);
};

// ../english-lint/dist/rules/no-mixed-dialects.js
var selectors = [
  {
    selector: "[form=canceled i]",
    suggestions: ["cancelled"],
    "en-GB": true,
    "en-CA": true,
    "en-AU": true
  },
  {
    selector: "[form=cancelled i]",
    suggestions: ["canceled"],
    "en-US": true
  },
  {
    selector: "[form=traveled i]",
    suggestions: ["travelled"],
    "en-GB": true,
    "en-CA": true,
    "en-AU": true
  },
  {
    selector: "[form=travelled i]",
    suggestions: ["traveled"],
    "en-US": true
  },
  {
    selector: "[form=channeled i]",
    suggestions: ["channelled"],
    "en-GB": true,
    "en-CA": true,
    "en-AU": true
  },
  {
    selector: "[form=channelled i]",
    suggestions: ["channeled"],
    "en-US": true
  },
  {
    selector: "[form=marvelous i]",
    suggestions: ["marvellous"],
    "en-GB": true,
    "en-CA": true,
    "en-AU": true
  },
  {
    selector: "[form=marvellous i]",
    suggestions: ["marvelous"],
    "en-US": true
  },
  {
    selector: "[form=counselor i]",
    suggestions: ["counsellor"],
    "en-GB": true,
    "en-CA": true,
    "en-AU": true
  },
  {
    selector: "[form=counsellor i]",
    suggestions: ["counselor"],
    "en-US": true
  },
  {
    selector: "[lemma=license][xpos=NOUN]",
    suggestions: [":inflect(licence)"],
    "en-GB": true,
    "en-CA": true,
    "en-AU": true
  },
  {
    selector: "[lemma=licence]",
    suggestions: [":inflect(license)"],
    "en-US": true
  },
  {
    selector: "[lemma=defense][xpos=NOUN]",
    suggestions: [":inflect(defence)"],
    "en-GB": true,
    "en-CA": true,
    "en-AU": true
  },
  {
    selector: "[lemma=defence]",
    suggestions: [":inflect(defense)"],
    "en-US": true
  },
  {
    selector: "[lemma=organize]",
    suggestions: [":inflect(organise)"],
    "en-GB": true,
    "en-AU": true
  },
  {
    selector: "[lemma=organise]",
    suggestions: [":inflect(organize)"],
    "en-US": true,
    "en-CA": true
  },
  {
    selector: "[lemma=authorize]",
    suggestions: [":inflect(authorise)"],
    "en-GB": true,
    "en-AU": true
  },
  {
    selector: "[lemma=authorise]",
    suggestions: [":inflect(authorize)"],
    "en-US": true,
    "en-CA": true
  },
  {
    selector: "[lemma=prioritize]",
    suggestions: [":inflect(prioritise)"],
    "en-GB": true,
    "en-AU": true
  },
  {
    selector: "[lemma=prioritise]",
    suggestions: [":inflect(prioritize)"],
    "en-US": true,
    "en-CA": true
  },
  {
    selector: "[lemma=realize]",
    suggestions: [":inflect(realise)"],
    "en-GB": true,
    "en-AU": true
  },
  {
    selector: "[lemma=realise]",
    suggestions: [":inflect(realize)"],
    "en-US": true,
    "en-CA": true
  },
  {
    selector: "[lemma=recognize]",
    suggestions: [":inflect(recognise)"],
    "en-GB": true,
    "en-AU": true
  },
  {
    selector: "[lemma=recognise]",
    suggestions: [":inflect(recognize)"],
    "en-US": true,
    "en-CA": true
  },
  {
    selector: "[lemma=apologize]",
    suggestions: [":inflect(apologise)"],
    "en-GB": true,
    "en-AU": true
  },
  {
    selector: "[lemma=apologise]",
    suggestions: [":inflect(apologize)"],
    "en-US": true,
    "en-CA": true
  },
  {
    selector: "[lemma=memorize]",
    suggestions: [":inflect(memorise)"],
    "en-GB": true,
    "en-AU": true
  },
  {
    selector: "[lemma=memorise]",
    suggestions: [":inflect(memorize)"],
    "en-US": true,
    "en-CA": true
  },
  {
    selector: "[lemma=appetizer]",
    suggestions: [":inflect(appetiser)"],
    "en-GB": true,
    "en-AU": true
  },
  {
    selector: "[lemma=appetiser]",
    suggestions: [":inflect(appetizer)"],
    "en-US": true,
    "en-CA": true
  },
  {
    selector: "[lemma=familiarize]",
    suggestions: [":inflect(familiarise)"],
    "en-GB": true,
    "en-AU": true
  },
  {
    selector: "[lemma=familiarise]",
    suggestions: [":inflect(familiarize)"],
    "en-US": true,
    "en-CA": true
  },
  { selector: "[lemma=cozy]", suggestions: [":inflect(cosy)"], "en-GB": true },
  { selector: "[lemma=cosy]", suggestions: [":inflect(cozy)"], "en-US": true },
  {
    selector: "[lemma=enroll]",
    suggestions: [":inflect(enrol)"],
    "en-GB": true,
    "en-AU": true,
    "en-CA": true
  },
  {
    selector: "[lemma=enrol]",
    suggestions: [":inflect(enroll)"],
    "en-US": true
  },
  {
    selector: "[lemma=fulfill]",
    suggestions: [":inflect(fulfil)"],
    "en-GB": true,
    "en-AU": true,
    "en-CA": true
  },
  {
    selector: "[lemma=fulfil]",
    suggestions: [":inflect(fulfill)"],
    "en-US": true
  },
  {
    selector: "[lemma=skilfull]",
    suggestions: [":inflect(skilful)"],
    "en-GB": true,
    "en-AU": true,
    "en-CA": true
  },
  {
    selector: "[lemma=skilful]",
    suggestions: [":inflect(skilfull)"],
    "en-US": true
  },
  {
    selector: "[lemma=program]",
    suggestions: [":inflect(programme)"],
    "en-GB": true,
    "en-AU": true,
    "en-CA": true
  },
  {
    selector: "[lemma=programme]",
    suggestions: [":inflect(program)"],
    "en-US": true
  },
  {
    selector: "[lemma=behavior]",
    suggestions: [":inflect(behaviour)"],
    "en-GB": true,
    "en-AU": true,
    "en-CA": true
  },
  {
    selector: "[lemma=behaviour]",
    suggestions: [":inflect(behavior)"],
    "en-US": true
  },
  {
    selector: "[lemma=color]",
    suggestions: [":inflect(colour)"],
    "en-GB": true,
    "en-AU": true,
    "en-CA": true
  },
  {
    selector: "[lemma=colour]",
    suggestions: [":inflect(color)"],
    "en-US": true
  },
  {
    selector: "[lemma=honor]",
    suggestions: [":inflect(honour)"],
    "en-GB": true,
    "en-AU": true,
    "en-CA": true
  },
  {
    selector: "[lemma=honour]",
    suggestions: [":inflect(honor)"],
    "en-US": true
  },
  {
    selector: "[lemma=favorite]",
    suggestions: [":inflect(favourite)"],
    "en-GB": true,
    "en-AU": true,
    "en-CA": true
  },
  {
    selector: "[lemma=favourite]",
    suggestions: [":inflect(favorite)"],
    "en-US": true
  },
  {
    selector: "[lemma=humor]",
    suggestions: [":inflect(humour)"],
    "en-GB": true,
    "en-AU": true,
    "en-CA": true
  },
  {
    selector: "[lemma=humour]",
    suggestions: [":inflect(humor)"],
    "en-US": true
  },
  {
    selector: "[lemma=flavor]",
    suggestions: [":inflect(flavour)"],
    "en-GB": true,
    "en-AU": true,
    "en-CA": true
  },
  {
    selector: "[lemma=flavour]",
    suggestions: [":inflect(flavor)"],
    "en-US": true
  },
  {
    selector: "[lemma=harbor]",
    suggestions: [":inflect(harbour)"],
    "en-GB": true,
    "en-AU": true,
    "en-CA": true
  },
  {
    selector: "[lemma=harbour]",
    suggestions: [":inflect(harbor)"],
    "en-US": true
  },
  {
    selector: "[lemma=labor]",
    suggestions: [":inflect(labour)"],
    "en-GB": true,
    "en-AU": true,
    "en-CA": true
  },
  {
    selector: "[lemma=labour]",
    suggestions: [":inflect(labor)"],
    "en-US": true
  },
  {
    selector: "[lemma=mold]",
    suggestions: [":inflect(mould)"],
    "en-GB": true,
    "en-AU": true,
    "en-CA": true
  },
  {
    selector: "[lemma=mould]",
    suggestions: [":inflect(mold)"],
    "en-US": true
  },
  {
    selector: "[lemma=neighbor]",
    suggestions: [":inflect(neighbour)"],
    "en-GB": true,
    "en-AU": true,
    "en-CA": true
  },
  {
    selector: "[lemma=neighbour]",
    suggestions: [":inflect(neighbor)"],
    "en-US": true
  },
  {
    selector: "[lemma=diarrea]",
    suggestions: [":inflect(diarrhoea)"],
    "en-GB": true,
    "en-AU": true,
    "en-CA": true
  },
  {
    selector: "[lemma=diarrhoea]",
    suggestions: [":inflect(diarrea)"],
    "en-US": true
  },
  {
    selector: "[lemma=catalog]",
    suggestions: [":inflect(catalogue)"],
    "en-GB": true,
    "en-AU": true,
    "en-CA": true
  },
  {
    selector: "[lemma=catalogue]",
    suggestions: [":inflect(catalog)"],
    "en-US": true
  },
  {
    selector: "[lemma=dialog]",
    suggestions: [":inflect(dialogue)"],
    "en-GB": true,
    "en-AU": true,
    "en-CA": true
  },
  {
    selector: "[lemma=dialogue]",
    suggestions: [":inflect(dialog)"],
    "en-US": true
  },
  {
    selector: "[lemma=analog]",
    suggestions: [":inflect(analogue)"],
    "en-GB": true,
    "en-AU": true,
    "en-CA": true
  },
  {
    selector: "[lemma=analogue]",
    suggestions: [":inflect(analog)"],
    "en-US": true
  },
  {
    selector: "[lemma=monolog]",
    suggestions: [":inflect(monologue)"],
    "en-GB": true,
    "en-AU": true,
    "en-CA": true
  },
  {
    selector: "[lemma=monologue]",
    suggestions: [":inflect(monolog)"],
    "en-US": true
  },
  {
    selector: "[lemma=center]",
    suggestions: [":inflect(centre)"],
    "en-GB": true,
    "en-CA": true,
    "en-AU": true
  },
  {
    selector: "[lemma=centre]",
    suggestions: [":inflect(center)"],
    "en-US": true
  },
  {
    selector: "[lemma=kilometer]",
    suggestions: [":inflect(kilometre)"],
    "en-GB": true,
    "en-CA": true,
    "en-AU": true
  },
  {
    selector: "[lemma=kilometre]",
    suggestions: [":inflect(kilometer)"],
    "en-US": true
  },
  {
    selector: "[lemma=liter]",
    suggestions: [":inflect(litre)"],
    "en-GB": true,
    "en-CA": true,
    "en-AU": true
  },
  {
    selector: "[lemma=litre]",
    suggestions: [":inflect(liter)"],
    "en-US": true
  },
  {
    selector: "[lemma=theater]",
    suggestions: [":inflect(theatre)"],
    "en-GB": true,
    "en-CA": true,
    "en-AU": true
  },
  {
    selector: "[lemma=theatre]",
    suggestions: [":inflect(theater)"],
    "en-US": true
  },
  {
    selector: "[lemma=fiber]",
    suggestions: [":inflect(fibre)"],
    "en-GB": true,
    "en-CA": true,
    "en-AU": true
  },
  {
    selector: "[lemma=fibre]",
    suggestions: [":inflect(fiber)"],
    "en-US": true
  },
  {
    selector: "[form=learnt i][xpos=VERB]",
    suggestions: ["learned"],
    "en-US": true
  },
  {
    selector: "[form=dreamt i][xpos=VERB]",
    suggestions: ["dreamed"],
    "en-US": true
  },
  {
    selector: "[form=burnt i][xpos=VERB]",
    suggestions: ["burned"],
    "en-US": true
  },
  {
    selector: "[form=leapt i][xpos=VERB]",
    suggestions: ["leaped"],
    "en-US": true
  },
  { selector: "[lemma=tyre]", suggestions: [":inflect(tire)"], "en-US": true },
  { selector: "[lemma=tire]", suggestions: [":inflect(tyre)"], "en-GB": true },
  {
    selector: "[lemma=eggplant]",
    suggestions: [":inflect(aubergine)"],
    "en-GB": true
  },
  {
    selector: "[lemma=aubergine]",
    suggestions: [":inflect(eggplant)"],
    "en-US": true,
    "en-AU": true,
    "en-CA": true
  },
  {
    selector: ":matches([lemma=barrister], [lemma=solicitor])",
    suggestions: [":inflect(lawyer)", ":inflect(attorney)"],
    "en-US": true
  },
  {
    selector: "[lemma=bathe][xpos=VERB]",
    suggestions: [":inflect(bath)"],
    "en-GB": true
  },
  {
    selector: "[lemma=bath][xpos=VERB]",
    suggestions: [":inflect(bathe)"],
    "en-US": true,
    "en-AU": true,
    "en-CA": true
  },
  {
    selector: "[lemma=beet]",
    suggestions: [":inflect(beetroot)"],
    "en-GB": true,
    "en-AU": true
  },
  {
    selector: "[lemma=beetroot]",
    suggestions: [":inflect(beet)"],
    "en-US": true,
    "en-CA": true
  },
  {
    selector: "[lemma=can] > :matches([form=garbage i], [form=trash i])",
    suggestions: [":inflect(bin)", ":inflect(dustbin)"],
    "en-GB": true,
    "en-AU": true
  },
  {
    selector: ":matches([lemma=bin], [lemma=dustbin])",
    suggestions: ["garbage :inflect(can)", "trash :inflect(can)"],
    "en-US": true,
    "en-CA": true
  },
  {
    selector: "[lemma=pen] > [form=ball-point i]",
    suggestions: ["biro"],
    "en-GB": true,
    "en-AU": true
  },
  {
    selector: "[lemma=biro]",
    suggestions: ["ball-point :inflect(pen)"],
    "en-US": true
  },
  {
    selector: "[lemma=floss] > [form=fairy i]",
    suggestions: ["candy :inflect(floss)"],
    "en-GB": true
  },
  {
    selector: "[lemma=floss] > [form=fairy i]",
    suggestions: ["cotton :inflect(candy)"],
    "en-US": true,
    "en-CA": true
  },
  {
    selector: "[lemma=candy] > [form=cotton i]",
    suggestions: ["candy :inflect(floss)"],
    "en-GB": true
  },
  {
    selector: "[lemma=candy] > [form=cotton i]",
    suggestions: ["fairy :inflect(floss)"],
    "en-AU": true
  },
  {
    selector: "[lemma=floss] > [form=candy i]",
    suggestions: ["cotton :inflect(candy)"],
    "en-US": true
  },
  {
    selector: "[lemma=floss] > [form=candy i]",
    suggestions: ["fairy :inflect(floss)"],
    "en-AU": true
  },
  {
    selector: "[lemma=lot] > [form=parking i]",
    suggestions: ["car :inflect(park)"],
    "en-GB": true
  },
  {
    selector: "[lemma=park] > [form=car i]",
    suggestions: ["parking :inflect(lot)"],
    "en-US": true
  },
  {
    selector: "[lemma=drugstore]",
    suggestions: ["chemist's :inflect(shop)"],
    "en-GB": true,
    "en-AU": true
  },
  {
    selector: "[lemma=shop] > [AdpType=Post][lemma=be] > [form=chemist i]",
    suggestions: [":inflect(drugstore)", ":inflect(pharmacy)"],
    "en-US": true,
    "en-CA": true
  },
  {
    selector: "[lemma=clothespin]",
    suggestions: ["clothes :inflect(peg)"],
    "en-GB": true
  },
  {
    selector: "[lemma=peg] > [form=clothes i]",
    suggestions: [":inflect(clothespin)"],
    "en-US": true,
    "en-CA": true,
    "en-AU": true
  },
  {
    selector: "[lemma=stove][xpos=NOUN]",
    suggestions: [":inflect(cooker)"],
    "en-GB": true
  },
  {
    selector: "[lemma=cooker][xpos=NOUN]",
    suggestions: [":inflect(stove)"],
    "en-US": true,
    "en-CA": true,
    "en-AU": true
  },
  {
    selector: "[lemma=zucchini]",
    suggestions: [":inflect(courgette)"],
    "en-GB": true
  },
  {
    selector: "[lemma=courgette]",
    suggestions: [":inflect(zucchini)"],
    "en-US": true,
    "en-CA": true,
    "en-AU": true
  },
  {
    selector: "[form=r\xE9sum\xE9 i]",
    suggestions: ["curriculum :inflect(vitae)"],
    "en-GB": true
  },
  {
    selector: "[lemma=vitae] > [form=curriculum i]",
    suggestions: [":inflect(r\xE9sum\xE9)"],
    "en-US": true
  },
  {
    selector: "[lemma=cream] > [form=heavy i]",
    suggestions: ["double :inflect(cream)"],
    "en-GB": true
  },
  {
    selector: "[lemma=cream] > [form=double i]",
    suggestions: ["heavy :inflect(cream)"],
    "en-US": true,
    "en-CA": true
  },
  {
    selector: "[form=draft i]",
    suggestions: ["draught"],
    "en-GB": true
  },
  {
    selector: "[form=draught i]",
    suggestions: ["draft"],
    "en-US": true
  },
  {
    selector: "[lemma=thumbtack]",
    suggestions: ["drawing :inflect(pin)"],
    "en-GB": true
  },
  {
    selector: "[lemma=pin] > [form=drawing i]",
    suggestions: [":inflect(thumbtack)"],
    "en-US": true
  },
  {
    selector: "[lemma=gown] > [form=dressing i]",
    suggestions: [":inflect(bathrobe)"],
    "en-US": true
  },
  {
    selector: "[lemma=driving] > [form=drunk i]",
    suggestions: ["drink :inflect(driving)"],
    "en-GB": true
  },
  {
    selector: "[lemma=driving] > [form=drink i]",
    suggestions: ["drunk :inflect(driving)"],
    "en-US": true
  },
  {
    selector: "[lemma=license] > [AdpType=Post][lemma=be] > [form=driver i]",
    suggestions: ["driving :inflect(licence)"],
    "en-GB": true
  },
  {
    selector: "[lemma=licence] > [form=driving i]",
    suggestions: ["driver's :inflect(license)"],
    "en-US": true
  },
  {
    selector: "[lemma=inquiry]",
    suggestions: [":inflect(enquiry)"],
    "en-GB": true,
    "en-AU": true
  },
  {
    selector: "[lemma=enquiry]",
    suggestions: [":inflect(inquiry)"],
    "en-US": true
  },
  {
    selector: "[lemma=date] > [form=expiration i]",
    suggestions: ["expiry :inflect(date)"],
    "en-GB": true
  },
  {
    selector: "[lemma=date] > [form=expiry i]",
    suggestions: ["expiration :inflect(date)"],
    "en-US": true
  },
  {
    selector: "[lemma=dress] > [form=fancy i]",
    suggestions: [":inflect(costume)"],
    "en-US": true
  },
  {
    selector: "[lemma=stick] > [form=fish i]",
    suggestions: ["fish :inflect(finger)"],
    "en-GB": true,
    "en-AU": true
  },
  {
    selector: "[lemma=finger] > [form=fish i]",
    suggestions: ["fish :inflect(stick)"],
    "en-US": true
  },
  {
    selector: "[lemma=apartment][xpos=NOUN]",
    suggestions: [":inflect(flat)"],
    "en-GB": true
  },
  {
    selector: "[lemma=shift] > [form=gear i]",
    suggestions: ["gear :inflect(lever)"],
    "en-GB": true
  },
  {
    selector: "[lemma=lever] > [form=gear i]",
    suggestions: ["gear :inflect(shift)"],
    "en-US": true,
    "en-CA": true
  },
  {
    selector: "[lemma=train][xpos=NOUN] > [form=freight i]",
    suggestions: ["goods :inflect(train)"],
    "en-GB": true
  },
  {
    selector: "[lemma=train][xpos=NOUN] > [form=goods i]",
    suggestions: ["freight :inflect(train)"],
    "en-US": true
  },
  {
    selector: "[lemma=principal][xpos=NOUN]",
    suggestions: [":inflect(headmaster)", ":inflect(headteacher)"],
    "en-GB": true
  },
  {
    selector: ":matches([lemma=headmaster], [lemma=headteacher])",
    suggestions: [":inflect(principal)"],
    "en-US": true,
    "en-CA": true,
    "en-AU": true
  },
  {
    selector: "[lemma=cleaner] > [form=vacuum i]",
    suggestions: [":inflect(hoover)"],
    "en-GB": true
  },
  {
    selector: "[lemma=sugar] > [form=powdered i]",
    suggestions: ["icing :inflect(sugar)"],
    "en-GB": true,
    "en-CA": true,
    "en-AU": true
  },
  {
    selector: "[lemma=sugar] > [form=icing i]",
    suggestions: ["powdered :inflect(sugar)"],
    "en-US": true
  },
  {
    selector: "[lemma=potato] > [form=baked i]",
    suggestions: ["jacket :inflect(potato)"],
    "en-GB": true
  },
  {
    selector: "[lemma=potato] > [form=jacket i]",
    suggestions: ["baked :inflect(potato)"],
    "en-US": true
  },
  {
    selector: "[lemma=comma] > [form=inverted i]",
    suggestions: ["quotation :inflect(mark)"],
    "en-US": true
  },
  {
    selector: "[lemma=jewelry]",
    suggestions: [":inflect(jewellery)"],
    "en-GB": true,
    "en-CA": true
  },
  {
    selector: "[lemma=jewellery]",
    suggestions: [":inflect(jewelry)"],
    "en-US": true
  },
  {
    selector: "[lemma=sale] > [form=yard i]",
    suggestions: ["jumble :inflect(sale)"],
    "en-GB": true
  },
  {
    selector: "[lemma=sale] > [form=jumble i]",
    suggestions: ["yard :inflect(sale)"],
    "en-US": true
  },
  {
    selector: "[lemma=ladybug]",
    suggestions: [":inflect(ladybird)"],
    "en-GB": true
  },
  {
    selector: "[lemma=ladybird]",
    suggestions: [":inflect(ladybug)"],
    "en-US": true,
    "en-CA": true
  },
  {
    selector: "[lemma=lay] > [form=table i]",
    suggestions: [":inflect(set) the table"],
    "en-US": true
  },
  {
    selector: "[lemma=elevator][xpos=NOUN]",
    suggestions: [":inflect(lift)"],
    "en-GB": true,
    "en-AU": true
  },
  {
    selector: "[lemma=lift][xpos=NOUN]",
    suggestions: [":inflect(elevator)"],
    "en-US": true,
    "en-CA": true
  },
  {
    selector: "[lemma=mailbox]",
    suggestions: [":inflect(letterbox)", ":inflect(postbox)"],
    "en-GB": true
  },
  {
    selector: ":matches([lemma=letterbox], [lemma=postbox])",
    suggestions: [":inflect(mailbox)"],
    "en-US": true
  },
  {
    selector: "[lemma=truck]",
    suggestions: [":inflect(lorry)"],
    "en-GB": true
  },
  {
    selector: "[lemma=lorry]",
    suggestions: [":inflect(truck)"],
    "en-US": true,
    "en-CA": true,
    "en-AU": true
  },
  {
    selector: "[form=lost i][xpos=NOUN] > [form=and] > [form=found i][xpos=NOUN]",
    suggestions: ["lost property"],
    "en-GB": true
  },
  {
    selector: "[lemma=property] > [form=lost i][xpos=ADJ]",
    suggestions: ["lost and found"],
    "en-US": true,
    "en-CA": true,
    "en-AU": true
  },
  {
    selector: "[form=ceo i]",
    suggestions: ["managing :inflect(director)"],
    "en-GB": true
  },
  {
    selector: "[lemma=director] > [form=managing i]",
    suggestions: [":inflect(CEO)"],
    "en-US": true
  },
  {
    selector: "[form=maths i]",
    suggestions: ["math"],
    "en-US": true
  },
  {
    selector: "[lemma=cellphone]",
    suggestions: ["mobile :inflect(phone)"],
    "en-GB": true
  },
  {
    selector: "[lemma=phone] > [form=mobile i]",
    suggestions: [":inflect(cellphone)"],
    "en-US": true,
    "en-CA": true
  },
  {
    selector: "[lemma=motorcycle]",
    suggestions: [":inflect(motorbike)"],
    "en-GB": true
  },
  {
    selector: "[lemma=motorbike]",
    suggestions: [":inflect(motorcycle)"],
    "en-US": true
  },
  {
    selector: ":matches([lemma=freeway], [lemma=highway])",
    suggestions: [":inflect(motorway)"],
    "en-GB": true
  },
  {
    selector: "[lemma=motorway]",
    suggestions: [":inflect(freeway)", ":inflect(highway)"],
    "en-US": true,
    "en-CA": true,
    "en-AU": true
  },
  {
    selector: "[lemma=mom]",
    suggestions: [":inflect(mum)"],
    "en-GB": true,
    "en-CA": true,
    "en-AU": true
  },
  { selector: "[lemma=mum]", suggestions: [":inflect(mom)"], "en-US": true },
  {
    selector: "[lemma=diaper]",
    suggestions: [":inflect(nappy)"],
    "en-GB": true,
    "en-AU": true
  },
  {
    selector: "[lemma=nappy]",
    suggestions: [":inflect(diaper)"],
    "en-US": true,
    "en-CA": true
  },
  {
    selector: "[lemma=plate] > [form=license i]",
    suggestions: ["number :inflect(plate)"],
    "en-GB": true,
    "en-AU": true
  },
  {
    selector: "[lemma=plate] > [form=number i]",
    suggestions: ["license :inflect(plate)"],
    "en-US": true
  },
  {
    selector: "[lemma=deck] > [form=of i] > [form=cards i]",
    suggestions: [":inflect(pack) of cards"],
    "en-GB": true
  },
  {
    selector: "[lemma=pack] > [form=of i] > [form=cards i]",
    suggestions: [":inflect(deck) of cards"],
    "en-US": true
  },
  {
    selector: ":matches([lemma=kerosene], [lemma=kerosine])",
    suggestions: [":inflect(paraffin)", ":inflect(paraffine)"],
    "en-GB": true
  },
  {
    selector: ":matches([lemma=paraffin], [lemma=paraffine])",
    suggestions: [":inflect(kerosene)", ":inflect(kerosine)"],
    "en-US": true
  },
  {
    selector: "[lemma=crosswalk]",
    suggestions: ["pedestrian :inflect(crossing)", "zebra :inflect(crossing)"],
    "en-GB": true,
    "en-AU": true
  },
  {
    selector: "[lemma=crossing] > :matches([form=pedestrian i], [form=zebra i])",
    suggestions: [":inflect(crosswalk)"],
    "en-US": true
  },
  {
    selector: "[lemma=gasoline][xpos=NOUN]",
    suggestions: [":inflect(petrol)"],
    "en-GB": true,
    "en-AU": true
  },
  {
    selector: "[lemma=petrol]",
    suggestions: [":inflect(gasoline)", ":inflect(gas)"],
    "en-US": true
  },
  {
    selector: "[lemma=booth] > [form=phone i]",
    suggestions: ["phone :inflect(box)"],
    "en-GB": true
  },
  {
    selector: "[lemma=box] > [form=phone i]",
    suggestions: ["phone :inflect(booth)"],
    "en-US": true
  },
  {
    selector: "[lemma=turtleneck]",
    suggestions: ["polo :inflect(neck)"],
    "en-GB": true
  },
  {
    selector: "[lemma=neck] > [form=polo i]",
    suggestions: [":inflect(turtleneck)"],
    "en-US": true
  },
  {
    selector: "[lemma=mailman]",
    suggestions: [":inflect(postman)"],
    "en-GB": true
  },
  {
    selector: "[lemma=postman]",
    suggestions: [":inflect(mailman)"],
    "en-US": true,
    "en-CA": true
  },
  {
    selector: ":matches([lemma=carriage], [lemma=buggy]) > [form=baby i]",
    suggestions: [
      ":inflect(pram)",
      ":inflect(perambulator)",
      ":inflect(pushchair)"
    ],
    "en-GB": true,
    "en-AU": true
  },
  {
    selector: ":matches([lemma=pram], [lemma=perambulator], [lemma=pushchair])",
    suggestions: [
      "baby :inflect(carriage)",
      "baby :inflect(buggy)",
      ":inflect(stroller)"
    ],
    "en-US": true
  },
  {
    selector: "[lemma=school] > :matches([form=elementary i], [form=grade i])",
    suggestions: ["primary :inflect(school)"],
    "en-GB": true
  },
  {
    selector: "[lemma=school] > [form=primary i]",
    suggestions: ["elementary :inflect(school)", "grade :inflect(school)"],
    "en-US": true,
    "en-CA": true
  },
  {
    selector: "[lemma=railroad]",
    suggestions: [":inflect(railway)"],
    "en-GB": true,
    "en-CA": true,
    "en-AU": true
  },
  {
    selector: "[lemma=railway]",
    suggestions: [":inflect(railroad)"],
    "en-US": true
  },
  {
    selector: "[lemma=quid]",
    suggestions: ["sterling :inflect(pound)"],
    "en-US": true
  },
  {
    selector: "[lemma=garbage]",
    suggestions: [":inflect(rubbish)"],
    "en-GB": true
  },
  {
    selector: "[lemma=rubbish]",
    suggestions: [":inflect(garbage)"],
    "en-US": true,
    "en-CA": true
  },
  {
    selector: "[lemma=wrench]",
    suggestions: [":inflect(spanner)"],
    "en-GB": true,
    "en-AU": true
  },
  {
    selector: "[lemma=spanner]",
    suggestions: [":inflect(wrench)"],
    "en-US": true
  },
  {
    selector: "[lemma=store] > [form=candy i]",
    suggestions: ["sweet :inflect(shop)"],
    "en-GB": true
  },
  {
    selector: "[lemma=shop] > [form=sweet i]",
    suggestions: ["candy :inflect(store)"],
    "en-US": true
  },
  {
    selector: "[lemma=faucet]",
    suggestions: [":inflect(tap)"],
    "en-GB": true,
    "en-AU": true
  },
  {
    selector: "[lemma=sultana]",
    suggestions: ["golden :inflect(raisin)"],
    "en-US": true
  },
  {
    selector: ":matches([lemma=bathroom], [lemma=restroom])",
    suggestions: [":inflect(toilet)", ":inflect(loo)", ":inflect(WC)"],
    "en-GB": true
  },
  {
    selector: ":matches([lemma=toilet], [lemma=loo], [form=WC])",
    suggestions: [":inflect(bathroom)", ":inflect(restroom)"],
    "en-US": true
  },
  {
    selector: "[lemma=streetcar]",
    suggestions: [":inflect(tram)"],
    "en-GB": true,
    "en-AU": true
  },
  {
    selector: "[lemma=tram]",
    suggestions: [":inflect(streetcar)"],
    "en-US": true,
    "en-CA": true
  },
  {
    selector: "[lemma=cart]",
    suggestions: [":inflect(trolley)"],
    "en-GB": true,
    "en-AU": true
  },
  {
    selector: "[lemma=trolley]",
    suggestions: [":inflect(cart)"],
    "en-US": true
  },
  {
    selector: "[lemma=pants]",
    suggestions: [":inflect(trousers)"],
    "en-GB": true
  },
  {
    selector: "[lemma=trousers]",
    suggestions: [":inflect(pants)"],
    "en-US": true,
    "en-CA": true,
    "en-AU": true
  },
  {
    selector: "[lemma=mortician]",
    suggestions: [":inflect(undertaker)"],
    "en-GB": true
  }
];
var enUS = selectors.filter(({ "en-US": isAmerican = false }) => isAmerican).map(({ ...query }) => ({
  ...query,
  message: "Use the American English spelling whenever possible",
  id: ErrorId.NO_MIXED_DIALECTS
}));
var enGB = selectors.filter(({ "en-GB": isBritish = false }) => isBritish).map(({ ...query }) => ({
  ...query,
  message: "Use the British English spelling whenever possible",
  id: ErrorId.NO_MIXED_DIALECTS
}));
var enAU = selectors.filter(({ "en-AU": isAustralian = false }) => isAustralian).map(({ ...query }) => ({
  ...query,
  message: "Use the Australian English spelling whenever possible",
  id: ErrorId.NO_MIXED_DIALECTS
}));
var enCA = selectors.filter(({ "en-CA": isCanadian = false }) => isCanadian).map(({ ...query }) => ({
  ...query,
  message: "Use the Canadian English spelling whenever possible",
  id: ErrorId.NO_MIXED_DIALECTS
}));
var getQueries = (locale) => {
  switch (locale) {
    case "en-AU":
      return enAU;
    case "en-CA":
      return enCA;
    case "en-GB":
      return enGB;
    case "en-US":
    default:
      return enUS;
  }
};
var no_mixed_dialects_default = (sentences2, { locale = "en-US" }) => queries_to_errors_default(getQueries(locale), sentences2);

// ../english-lint/dist/rules/no-negated-contrasts.js
var minimizers = ["just", "merely", "only", "simply", "solely"];
var contrastiveMarks = ["but"];
var clauseBreaks = ["Comm", "Dash", "Colo", "Semi"];
var negativeWords = /* @__PURE__ */ new Set(["not", "never", "neither", "nor"]);
var reportingPredicates = /* @__PURE__ */ new Set([
  "swear",
  "promise",
  "say",
  "insist",
  "assure",
  "suppose",
  "think",
  "guess"
]);
var messages = {
  trailing: `Cut the negated tail and keep what is true: "the reported span is the phrase, not a stray overlap elsewhere in the sentence" becomes "the reported span is the phrase".`,
  minimized: `Instead of "not just X, but also Y", write "X and Y": "He is not just a teacher, but also a coach" becomes "He is a teacher and a coach".`,
  restated: `Say what the thing is instead of what it is not: "The thing that blows up is not the deficit; it's the debt" becomes "But it's the debt that blows up".`
};
var wordOf = ({ form, lemma }) => (lemma ?? form).toLowerCase();
var isNegation = ({ lemma }) => lemma === "not";
var isMinimizer = (token) => minimizers.includes(wordOf(token));
var isContrastiveMark = (token) => token.xpos === "MARK" && contrastiveMarks.includes(wordOf(token));
var isComma3 = ({ feats: { PunctType } }) => PunctType === "Comm";
var isSemicolon = ({ feats: { PunctType } }) => PunctType === "Semi";
var isClauseBreak = ({ feats: { PunctType } }) => PunctType != null && clauseBreaks.includes(PunctType);
var isPronoun = ({ xpos, feats: { PronType } }) => xpos === "NOUN" && PronType != null;
var isNominal = ({ xpos }) => xpos === "NOUN" || xpos === "ADJ";
var endOf2 = ({ form, misc: { at } }) => at + form.length;
var lastContentToken = (tokens) => [...tokens].reverse().find(({ xpos }) => xpos !== "PUNCT");
var subtreeEnd = (tokens, id) => {
  const words = parse_to_subtree_default(tokens, id).filter((member) => tokens[member].xpos !== "PUNCT");
  return endOf2(tokens[Math.max(...words, id)]);
};
var firstConjunct = (tokens, head) => head.misc.children.map((child) => tokens[child]).find(({ xpos }) => xpos !== "PUNCT");
var markerChildOf = (tokens, token) => token.misc.children.map((child) => tokens[child]).find(({ xpos }) => xpos === "MARK");
var runsParallel = (tokens, joined, negated) => {
  const marker = markerChildOf(tokens, negated);
  return joined.xpos === "MARK" && marker != null && wordOf(marker) === wordOf(joined);
};
var conjunctsOf = (tokens, contrast, negated) => {
  const joined = firstConjunct(tokens, contrast);
  if (joined == null) {
    return [];
  }
  const inner = runsParallel(tokens, joined, negated) ? firstConjunct(tokens, joined) : null;
  return inner == null ? [joined] : [joined, inner];
};
var ancestorsOf = (tokens, token) => {
  const chain = /* @__PURE__ */ new Set();
  let { id } = token;
  while (id !== -1 && !chain.has(id)) {
    chain.add(id);
    ({ head: id } = tokens[id]);
  }
  return chain;
};
var joinsTheSameClause = (tokens, contrast, negated) => {
  const chain = ancestorsOf(tokens, negated);
  return chain.has(contrast.head) || chain.has(tokens[contrast.head]?.head ?? -1);
};
var subjectOf = (tokens, head) => head.misc.children.map((child) => tokens[child]).find(({ id, xpos }) => id < head.id && xpos === "NOUN");
var isAuxiliary = (token) => token.xpos === "VERB" && (token.feats.Mood != null || ["be", "do", "have"].includes(wordOf(token)));
var predicateContains = (tokens, head, words) => words.has(wordOf(head)) || head.misc.children.some((id) => {
  const child = tokens[id];
  return words.has(wordOf(child)) || isAuxiliary(head) && child.id > head.id && ["VERB", "NOUN", "ADJ"].includes(child.xpos) && predicateContains(tokens, child, words);
});
var isAffirmativeCounterpart = (tokens, head) => !predicateContains(tokens, head, negativeWords);
var isRestatingPredicate = (tokens, head) => head.xpos === "VERB" && !reportingPredicates.has(wordOf(head)) && isAffirmativeCounterpart(tokens, head);
var hasAdditiveConjunct = (tokens, contrast) => contrast.misc.children.some((id) => predicateContains(tokens, tokens[id], /* @__PURE__ */ new Set(["also", "even", "too", "still"])));
var contrastsWith = (tokens, contrast, negated) => {
  if (!joinsTheSameClause(tokens, contrast, negated)) {
    return false;
  }
  const [conjunct, ...inner] = conjunctsOf(tokens, contrast, negated);
  if (conjunct == null || subjectOf(tokens, conjunct) != null || !isAffirmativeCounterpart(tokens, conjunct)) {
    return false;
  }
  if (!isMinimizer(negated) && hasAdditiveConjunct(tokens, contrast)) {
    return false;
  }
  return isMinimizer(negated) || [conjunct, ...inner].some(({ xpos }) => xpos === negated.xpos);
};
var contrastAfter = (tokens, negation, negated) => tokens.find((token) => token.id > negation.id && isContrastiveMark(token) && contrastsWith(tokens, token, negated));
var hasPronounSubject = (tokens, verb) => verb.misc.children.some((child) => child < verb.id && isPronoun(tokens[child]));
var offersNominalCounterpart = (tokens, clause, negated) => clause.misc.children.some((child) => child > clause.id && tokens[child].xpos === negated.xpos);
var noVerbBetween = (tokens, from, to) => tokens.slice(from + 1, to).every(({ xpos }) => xpos !== "VERB");
var clauseSubject = (tokens, verb) => subjectOf(tokens, verb) ?? (verb.head >= 0 ? subjectOf(tokens, tokens[verb.head]) : void 0);
var sharesItsSubject = (tokens, clause, negated) => {
  const restated2 = clauseSubject(tokens, clause);
  const original = clauseSubject(tokens, negated);
  return restated2 != null && original != null && restated2.form.toLowerCase() === original.form.toLowerCase();
};
var restatesInPlace = (tokens, clause, negated, breakId) => negated.xpos === "VERB" ? clause.head === negated.head && noVerbBetween(tokens, negated.id, breakId) && sharesItsSubject(tokens, clause, negated) : offersNominalCounterpart(tokens, clause, negated);
var restatesAcrossTheBreak = (tokens, clause, negated) => negated.xpos === "VERB" || offersNominalCounterpart(tokens, clause, negated);
var clauseBreakBefore = (tokens, verb) => verb.misc.children.find((child) => child < verb.id && isClauseBreak(tokens[child]));
var opensRightAfter = (tokens, negated, breakId) => breakId != null && Math.max(...parse_to_subtree_default(tokens, negated.id)) === breakId - 1;
var restatingClause = (tokens, negation, negated) => tokens.find((token) => {
  const breakId = clauseBreakBefore(tokens, token);
  return token.id > negation.id && isRestatingPredicate(tokens, token) && hasPronounSubject(tokens, token) && breakId != null && opensRightAfter(tokens, negated, breakId) && !parse_to_subtree_default(tokens, negated.id).includes(token.id) && restatesInPlace(tokens, token, negated, breakId);
});
var restatingSentence = (tokens, negated, next) => {
  const last = tokens[tokens.length - 1];
  if (!next || !last || !isSemicolon(last)) {
    return void 0;
  }
  if (!opensRightAfter(tokens, negated, last.id)) {
    return void 0;
  }
  const root = next.find(({ head }) => head === -1);
  return root && isRestatingPredicate(next, root) && hasPronounSubject(next, root) && restatesAcrossTheBreak(next, root, negated) ? next : void 0;
};
var hasCounterpart = (tokens, negated) => {
  const parent = tokens[negated.head];
  if (parent.xpos === negated.xpos && parent.id < negated.id) {
    return true;
  }
  return parent.misc.children.some((child) => child < negated.id && tokens[child].xpos === negated.xpos);
};
var isTail = (tokens, negated) => isNominal(negated) && negated.head >= 0 && hasCounterpart(tokens, negated);
var isCommonNoun = ({ xpos, feats }) => xpos === "NOUN" && feats.PronType == null;
var restatesAnEarlierNoun = (tokens, tail) => tokens.slice(0, tail.id).some((token) => isCommonNoun(token) && wordOf(token) === wordOf(tail));
var isRestatedTail = (tokens, negation, token) => isCommonNoun(token) && token.head === negation.head && restatesAnEarlierNoun(tokens, token);
var negatedTail = (tokens, negation, negated) => isTail(tokens, negated) ? negated : tokens.slice(negation.id + 1).find((token) => isRestatedTail(tokens, negation, token));
var closingComma = (tokens, chunkEnd) => {
  const next = tokens[chunkEnd + 1];
  return next && isComma3(next) ? next : void 0;
};
var noPunctuationBetween = (tokens, from, to) => tokens.slice(from + 1, to + 1).every(({ xpos }) => xpos !== "PUNCT");
var chunkEndOf = (tokens, negated) => {
  const words = parse_to_subtree_default(tokens, negated.id).filter((member) => tokens[member].xpos !== "PUNCT");
  return Math.max(...words, negated.id);
};
var tailEnd = (tokens, negated) => {
  const chunkEnd = chunkEndOf(tokens, negated);
  const closing = closingComma(tokens, chunkEnd);
  if (closing) {
    return endOf2(closing);
  }
  const last = lastContentToken(tokens);
  return last && noPunctuationBetween(tokens, chunkEnd, last.id) ? endOf2(last) : endOf2(tokens[chunkEnd]);
};
var trailingError = (tokens, tail, opening) => {
  const range = [opening.misc.at, tailEnd(tokens, tail)];
  return {
    start: range[0],
    end: range[1],
    message: messages.trailing,
    id: ErrorId.NO_NEGATED_CONTRASTS,
    suggestions: [{ range, text: "" }]
  };
};
var contraction = /^(?:['’`´]|n['’`´]?t$)/u;
var startOf2 = (tokens, negation) => {
  const host = tokens[negation.id - 1];
  return contraction.test(negation.form) && host ? host.misc.at : negation.misc.at;
};
var spanning = (tokens, negation, end, message) => ({
  start: startOf2(tokens, negation),
  end,
  message,
  id: ErrorId.NO_NEGATED_CONTRASTS
});
var restated = ({ tokens, negation, negated, next }) => {
  const clause = restatingClause(tokens, negation, negated);
  const ownEnd = clause && lastContentToken(tokens);
  if (ownEnd) {
    return spanning(tokens, negation, endOf2(ownEnd), messages.restated);
  }
  const sentence = restatingSentence(tokens, negated, next);
  const last = sentence && lastContentToken(sentence);
  return last ? spanning(tokens, negation, endOf2(last), messages.restated) : void 0;
};
var classify = ({ tokens, negation, negated, next }) => {
  if (tokens[negation.id + 1]?.form.toLowerCase() === "even") {
    return void 0;
  }
  const contrast = contrastAfter(tokens, negation, negated);
  if (contrast) {
    const end = subtreeEnd(tokens, contrast.id);
    const message = isMinimizer(negated) ? messages.minimized : messages.restated;
    return spanning(tokens, negation, end, message);
  }
  const restatement = restated({ tokens, negation, negated, next });
  if (restatement) {
    return restatement;
  }
  const opening = tokens[negation.id - 1];
  const tail = negatedTail(tokens, negation, negated);
  return opening && isComma3(opening) && tail ? trailingError(tokens, tail, opening) : void 0;
};
var applyRule5 = (tokens, next) => tokens.filter((token) => isNegation(token) && token.head >= 0).map((negation) => classify({ tokens, negation, negated: tokens[negation.head], next })).filter((error) => error != null);
var no_negated_contrasts_default = (sentences2) => sentences2.reduce((errors, tokens, index) => [
  ...errors,
  ...applyRule5(tokens, sentences2[index + 1])
], []);

// ../english-lint/dist/rules/no-nested-clauses.js
var MAX_NESTED_CLAUSES = 1;
var isVerb = ({ xpos }) => xpos === "VERB";
var isNoun = ({ xpos }) => xpos === "NOUN";
var relativePronouns = /* @__PURE__ */ new Set(["that", "who", "whom", "whose", "which"]);
var isRelativeClauseMarker = (token) => ["NOUN", "MARK"].includes(token.xpos) && token.feats.PronType === "Rel" && relativePronouns.has(token.lemma ?? token.form.toLowerCase());
var carriesRelative = (token, sawRelative) => isRelativeClauseMarker(token) || sawRelative && !isVerb(token);
var nestedClauses = (tokens, noun) => {
  const head = tokens[noun.head];
  const first = Math.min(noun.id, head.id);
  const last = Math.max(noun.id, head.id);
  const isBetween = (id) => id > first && id < last;
  const walk = (id, sawRelative) => {
    const token = tokens[id];
    const closed = sawRelative && isVerb(token) ? 1 : 0;
    const below = token.misc.children.filter(isBetween).map((child) => walk(child, carriesRelative(token, sawRelative)));
    return closed + Math.max(0, ...below);
  };
  return walk(noun.id, false);
};
var isSeparatedFromItsVerb = (tokens, noun) => noun.head > noun.id && isVerb(tokens[noun.head]) && noun.head - noun.id > 1;
var buildError3 = (tokens, noun, clauses) => {
  const phrase = parse_to_subtree_default(tokens, noun.id);
  const first = tokens[Math.min(...phrase)];
  const last = tokens[Math.max(...phrase)];
  return {
    start: first.misc.at,
    end: last.misc.at + last.form.length,
    message: `${clauses} clauses sit between "${noun.form}" and its verb, so the reader has to hold the subject in mind to the end. Give each clause its own sentence.`,
    id: ErrorId.NO_NESTED_CLAUSES
  };
};
var applyRule6 = (tokens) => tokens.filter((token) => isNoun(token) && isSeparatedFromItsVerb(tokens, token)).map((noun) => ({ noun, clauses: nestedClauses(tokens, noun) })).filter(({ clauses }) => clauses > MAX_NESTED_CLAUSES).map(({ noun, clauses }) => buildError3(tokens, noun, clauses));
var no_nested_clauses_default = (sentences2) => sentences2.reduce((errors, tokens) => [...errors, ...applyRule6(tokens)], []);

// ../english-lint/dist/rules/no-noun-clusters.js
var isLexicalNoun = ({ xpos, form, feats }) => xpos === "NOUN" && !feats.PronType && new RegExp("\\p{L}", "u").test(form) && !/\d/u.test(form);
var contiguousNounModifiers = (entities, id) => {
  let start = id;
  while (start > 0 && entities[start - 1].head === id && isLexicalNoun(entities[start - 1])) {
    start -= 1;
  }
  return entities.slice(start, id);
};
var applyRule7 = (entities) => entities.reduce((clusters, token) => {
  const { form, id, misc: { at } } = token;
  const leftNounChildren = contiguousNounModifiers(entities, id);
  if (isLexicalNoun(token) && leftNounChildren.length > 2) {
    const [leftMostChild] = leftNounChildren;
    const { misc: { at: start } } = leftMostChild;
    return clusters.concat({
      start,
      end: at + form.length,
      message: `Rewrite long noun clusters with either a shorter name or using hyphens (-) between words that are used as a single unit`,
      id: ErrorId.NO_NOUN_CLUSTERS
    });
  }
  return clusters;
}, []);
var no_noun_clusters_default = (sentences2) => sentences2.reduce((errors, entities) => [...errors, ...applyRule7(entities)], []);

// ../english-lint/dist/rules/no-passive-sentences.js
var passiveSelector = parse("[lemma=be][xpos=VERB] > [xpos=VERB][Tense=Past]");
var openingDelimiters = ["(", "[", "{", "\xAB", "\u2018", "\u201C", "\u201E", "\u2039", "\u201B"];
var closingDelimiters = [")", "]", "}", "\xBB", "\u2019", "\u201D", "\u201D", "\u203A", "\u2019"];
var particleContractionRegExp = /('|’|`|´)\w+/iu;
var sentencePunctuation = ["Peri", "Excl", "Qest", "Comm"];
var pairedPunctuation = ["Quot", "Brck", "Comm"];
var pairedSeparator = (form, opened) => {
  if (closingDelimiters.includes(form)) {
    return "";
  }
  if (openingDelimiters.includes(form)) {
    return " ";
  }
  const seen = opened[form] || 0;
  opened[form] = seen + 1;
  return seen % 2 === 1 ? "" : " ";
};
var glued = (form, previous, opened) => {
  const { xpos: lastTag = "", form: lastWord = "" } = previous || {};
  return lastTag === "PUNCT" && (openingDelimiters.includes(lastWord) || opened[lastWord] % 2 === 1) || particleContractionRegExp.test(form);
};
var separatorBefore = ({ token, previous, atStart, opened }) => {
  const { form, xpos, feats: { PunctType = "" } } = token;
  if (atStart || xpos === "PUNCT" && sentencePunctuation.includes(PunctType)) {
    return "";
  }
  if (xpos === "PUNCT" && pairedPunctuation.includes(PunctType)) {
    return pairedSeparator(form, opened);
  }
  return glued(form, previous, opened) ? "" : " ";
};
var subtreeToString = (entities, subtree) => {
  const opened = {};
  return subtree.reduce((string, index, indexInSubtree) => {
    const token = entities[index];
    const separator = separatorBefore({
      token,
      previous: entities[index - 1],
      atStart: indexInSubtree === 0,
      opened
    });
    return `${string}${separator}${token.form}`;
  }, "");
};
var findPassiveRoot = (entities, currentRoot) => {
  const { head, feats: { VerbForm: currentVerbForm, Tense: currentTense } } = entities[currentRoot];
  if (head === -1 || entities[currentRoot].misc.children.some((child) => {
    const { feats: { PunctType } } = entities[child];
    return PunctType != null;
  })) {
    return currentRoot;
  }
  const { feats: { Mood, VerbForm }, lemma } = entities[head];
  if (Mood != null || lemma === "have" || lemma === "be" && VerbForm === "Fin" && currentVerbForm === "Part" && currentTense === "Pres") {
    return findPassiveRoot(entities, head);
  }
  return currentRoot;
};
var firstPersonWords = ["i", "me"];
var secondPersonWords = ["you"];
var getPersonAndNumber = (entities, beVerb, subjectSubtree) => {
  const { head: beVerbHead } = entities[beVerb];
  const { Mood } = beVerbHead === -1 ? { Mood: void 0 } : entities[beVerbHead].feats;
  if (Mood) {
    return { Person: 3, Number: "Plur" };
  }
  const root = subjectSubtree.find((index) => !subjectSubtree.includes(entities[index].head));
  const { form, feats: { Number: Number2 } } = root ? entities[root] : { form: "", feats: { Number: void 0 } };
  if (firstPersonWords.includes(form)) {
    return { Person: 1, Number: "Sing" };
  }
  if (secondPersonWords.includes(form)) {
    return { Person: 2, Number: Number2 };
  }
  const Person = 3;
  if (Number2) {
    return { Person, Number: Number2 };
  }
  return { Person, Number: "Sing" };
};
var buildComplementString = (entities, verb, complementSubtree) => {
  if (complementSubtree.length === 0) {
    return "";
  }
  const firstComplement = Math.min(...complementSubtree);
  const { misc: { at: firstComplementPosition } } = entities[firstComplement];
  const { misc: { at: verbPosition }, form: verbWord } = entities[verb];
  const hasNoLeftMargin = firstComplementPosition === verbPosition + verbWord.length;
  const leftString = hasNoLeftMargin ? "" : " ";
  return `${leftString}${subtreeToString(entities, complementSubtree)}`;
};
var getLeftPassiveRootString = (entities, beVerb, { passiveRoot, passiveSubject, agreement: { Person, Number: Number2 } }) => {
  const passiveRootSubtree = parse_to_subtree_default(entities, passiveRoot);
  const passiveRootSubjectSubtree = parse_to_subtree_default(entities, passiveSubject);
  const lastSubjectIndex = Math.max(...passiveRootSubjectSubtree);
  const passiveRootComplements = passiveRootSubtree.filter((index) => index > lastSubjectIndex && index !== passiveRoot && index < beVerb && index > 0 && entities[index].xpos !== "PUNCT");
  const complementString = buildComplementString(entities, passiveRoot, passiveRootComplements);
  if (passiveRoot !== beVerb) {
    const { lemma, feats: { VerbForm, Tense } } = entities[passiveRoot];
    return `${inflect_default({
      lemma,
      xpos: "VERB",
      feats: { VerbForm, Tense, Person, Number: Number2 }
    })}${complementString} `;
  }
  return complementString;
};
var findLeftNegation = (entities, argumentVerb) => parse_to_subtree_default(entities, argumentVerb).find((index) => index < argumentVerb && entities[index].lemma === "not");
var toActiveVerb = (entities, [beVerb, argumentVerb], voice) => {
  const { agreement: { Person, Number: Number2 } } = voice;
  const { feats: { VerbForm: beVerbForm, Tense: beVerbTense }, head: beVerbHead } = entities[beVerb];
  const { lemma } = entities[argumentVerb];
  const stringBeforeVerb = getLeftPassiveRootString(entities, beVerb, voice);
  if (findLeftNegation(entities, argumentVerb) != null) {
    return `${stringBeforeVerb}${inflect_default({
      lemma,
      xpos: "VERB",
      feats: {
        VerbForm: "Fin",
        Tense: "Pres",
        Person: 3,
        Number: "Plur"
      }
    })}`;
  }
  if (beVerbHead !== -1 && entities[beVerbHead].xpos === "VERB") {
    return `${stringBeforeVerb}${inflect_default({
      lemma,
      xpos: "VERB",
      feats: {
        VerbForm: beVerbForm,
        Tense: beVerbTense,
        Person: 3,
        Number: "Plur"
      }
    })}`;
  }
  return `${stringBeforeVerb}${inflect_default({
    lemma,
    xpos: "VERB",
    feats: { VerbForm: beVerbForm, Tense: beVerbTense, Person, Number: Number2 }
  })}`;
};
var isAccusative = (entities, subtree) => {
  if (subtree.length > 1) {
    return false;
  }
  const [index] = subtree;
  const { feats: { Case } } = entities[index];
  return Case === "Acc";
};
var toNominative = (entities, subtree) => {
  const [index] = subtree;
  const { form } = entities[index];
  const lowerCased = form.toLowerCase();
  switch (lowerCased) {
    case "me":
      return "I";
    case "him":
      return "he";
    case "her":
      return "she";
    case "us":
      return "we";
    default:
      return "they";
  }
};
var findPassiveAgentMarker = (entities, argumentVerb) => {
  let index = argumentVerb + 1;
  while (index < entities.length) {
    const { head, lemma, xpos, feats: { PunctType = "" } } = entities[index];
    if (xpos === "PUNCT" && ["Peri", "Excl", "Qest", "Comm"].includes(PunctType)) {
      return -1;
    }
    if (head === argumentVerb && lemma === "by") {
      return index;
    }
    index += 1;
  }
  return -1;
};
var getPassiveAgentSubtree = (entities, passiveAgentMarker) => {
  if (passiveAgentMarker === -1) {
    return [];
  }
  const passiveAgent = entities[passiveAgentMarker].misc.children.find((child) => entities[child].xpos === "NOUN");
  if (passiveAgent == null) {
    return [];
  }
  return parse_to_subtree_default(entities, passiveAgent).filter((index) => index < entities.length);
};
var nonAgentNouns = /* @__PURE__ */ new Set([
  "afternoon",
  "april",
  "august",
  "autumn",
  "beginning",
  "chapter",
  "christmas",
  "dawn",
  "day",
  "daybreak",
  "deadline",
  "december",
  "dusk",
  "end",
  "episode",
  "evening",
  "february",
  "footnote",
  "fortnight",
  "friday",
  "hour",
  "january",
  "july",
  "june",
  "march",
  "may",
  "midday",
  "midnight",
  "millennium",
  "minute",
  "monday",
  "month",
  "morning",
  "night",
  "nightfall",
  "noon",
  "november",
  "october",
  "page",
  "paragraph",
  "quarter",
  "saturday",
  "section",
  "sentence",
  "september",
  "slide",
  "stanza",
  "start",
  "summer",
  "sunday",
  "sunrise",
  "sunset",
  "thursday",
  "time",
  "today",
  "tomorrow",
  "tonight",
  "tuesday",
  "wednesday",
  "week",
  "weekend",
  "winter",
  "year",
  "yesterday"
]);
var bareNumber = /^\d[\d,]*$/u;
var isNonAgent = (entities, subtree) => {
  const listed = (index) => {
    const { form: form2, lemma, xpos } = entities[index];
    return xpos === "NOUN" && nonAgentNouns.has((lemma ?? form2).toLowerCase());
  };
  const head = subtree.find((index) => !subtree.includes(entities[index].head));
  if (head == null) {
    return false;
  }
  if (listed(head)) {
    return true;
  }
  const { form, feats } = entities[head];
  if (feats.Number != null) {
    return false;
  }
  return subtree.length === 1 && bareNumber.test(form) || subtree.some(listed);
};
var toActiveSubject = (entities, passiveAgentSubtree) => {
  if (isAccusative(entities, passiveAgentSubtree)) {
    return toNominative(entities, passiveAgentSubtree);
  }
  return subtreeToString(entities, passiveAgentSubtree);
};
var isNominative = (entities, subtree) => {
  if (subtree.length > 1) {
    return false;
  }
  const [index] = subtree;
  const { feats: { Case } } = entities[index];
  return Case === "Nom";
};
var toAccusative = (entities, subtree) => {
  const [index] = subtree;
  const { form } = entities[index];
  const lowerCased = form.toLowerCase();
  switch (lowerCased) {
    case "i":
      return "me";
    case "he":
      return "him";
    case "she":
      return "her";
    case "we":
      return "us";
    default:
      return "them";
  }
};
var detitleCase = (string) => `${string[0].toLowerCase()}${string.slice(1)}`;
var isProperNoun = ({ lemma, form }) => {
  const [initial = ""] = lemma ?? form;
  return initial !== initial.toLowerCase();
};
var separatorPunctuation = ["Comm", "Peri", "Semi", "Colo"];
var withoutTrailingSeparators = (entities, subtree) => {
  let end = subtree.length;
  while (end > 0) {
    const { xpos, feats } = entities[subtree[end - 1]];
    if (xpos !== "PUNCT" || !separatorPunctuation.includes(feats.PunctType ?? "")) {
      break;
    }
    end -= 1;
  }
  return subtree.slice(0, end);
};
var toDirectObject = (entities, passiveSubject) => {
  const objectSubtree = withoutTrailingSeparators(entities, parse_to_subtree_default(entities, passiveSubject));
  if (isNominative(entities, objectSubtree)) {
    return toAccusative(entities, objectSubtree);
  }
  const object = subtreeToString(entities, objectSubtree);
  return isProperNoun(entities[objectSubtree[0]]) ? object : detitleCase(object);
};
var titleCase = (string) => `${string[0].toUpperCase()}${string.slice(1)}`;
var getLeftVerbComplementString = (entities, [beVerb, argumentVerb], passiveAgentSubtree) => {
  const complements = parse_to_subtree_default(entities, argumentVerb).filter((child) => child < argumentVerb && child < entities.length);
  if (complements.length === 0) {
    return "";
  }
  const notArgument = findLeftNegation(entities, argumentVerb);
  if (notArgument == null) {
    return `${subtreeToString(entities, complements)} `;
  }
  const { feats: { Tense } } = entities[beVerb];
  const otherComplements = complements.filter((index) => index !== notArgument);
  const rightString = otherComplements.length === 0 ? `` : ` ${subtreeToString(entities, otherComplements)}`;
  return `${inflect_default({
    lemma: "do",
    xpos: "VERB",
    feats: {
      VerbForm: "Fin",
      Tense,
      ...getPersonAndNumber(entities, beVerb, passiveAgentSubtree)
    }
  })} not${rightString} `;
};
var belongToDifferentClauses = (entities, start, end) => {
  const separatingEntities = entities.slice(start + 1, end);
  return separatingEntities.some(({ xpos }) => ["PUNCT", "NOUN", "MARK"].includes(xpos));
};
var toVerbArgumentString = (entities, verbArgumentsSubtree) => verbArgumentsSubtree.length === 0 ? "" : ` ${subtreeToString(entities, verbArgumentsSubtree)}`;
var passiveSubjectOf = (entities, passiveRoot) => {
  const candidates2 = parse_to_subtree_default(entities, passiveRoot).filter((index) => entities[index].xpos === "NOUN" && index < passiveRoot && entities[index].head === passiveRoot);
  return candidates2[candidates2.length - 1];
};
var activeRewriteOf = ({ entities, passiveBeSubtree, passiveAgentMarker, passiveAgentSubtree, voice }) => {
  const [, argumentVerb] = passiveBeSubtree;
  const leftVerbComplementString = getLeftVerbComplementString(entities, passiveBeSubtree, passiveAgentSubtree);
  const verbArgumentsSubtree = parse_to_subtree_default(entities, argumentVerb).filter((index) => index > argumentVerb && index < passiveAgentMarker && index < entities.length);
  const verbArgumentsString = toVerbArgumentString(entities, verbArgumentsSubtree);
  const activeDirectObject = toDirectObject(entities, voice.passiveSubject);
  const activeSubject = toActiveSubject(entities, passiveAgentSubtree);
  const verb = toActiveVerb(entities, passiveBeSubtree, voice);
  return `${activeSubject} ${leftVerbComplementString}${verb}${verbArgumentsString} ${activeDirectObject}`;
};
var opensTheSentence = (entities, leftMost) => leftMost === 0 || entities.slice(0, leftMost).every(({ xpos }) => ["PUNCT", "INTJ"].includes(xpos));
var spanOfPassive = (entities, passiveSubject, passiveAgentSubtree) => {
  const leftMost = Math.min(...parse_to_subtree_default(entities, passiveSubject));
  const { misc: { at: start } } = entities[leftMost];
  const { misc: { at: endPosition }, form: endWord } = entities[passiveAgentSubtree[passiveAgentSubtree.length - 1]];
  return { leftMost, start, end: endPosition + endWord.length };
};
var hasUsableAgent = (entities, passiveAgentSubtree) => passiveAgentSubtree.length > 0 && !isNonAgent(entities, passiveAgentSubtree);
var PASSIVE_MESSAGE = `Prefer the active voice over the passive to make your message clear in the reader's mind`;
var toErrors = (entities, { tree: passiveBeSubtree }) => {
  const [beVerb, argumentVerb] = passiveBeSubtree;
  const passiveRoot = findPassiveRoot(entities, beVerb);
  const passiveSubject = passiveSubjectOf(entities, passiveRoot);
  if (belongToDifferentClauses(entities, beVerb, argumentVerb) || passiveSubject == null) {
    return [];
  }
  const passiveAgentMarker = findPassiveAgentMarker(entities, argumentVerb);
  const passiveAgentSubtree = getPassiveAgentSubtree(entities, passiveAgentMarker);
  if (!hasUsableAgent(entities, passiveAgentSubtree)) {
    return [];
  }
  const { leftMost: leftMostPassiveEntity, start, end } = spanOfPassive(entities, passiveSubject, passiveAgentSubtree);
  const voice = {
    passiveRoot,
    passiveSubject,
    agreement: getPersonAndNumber(entities, beVerb, passiveAgentSubtree)
  };
  const baseReplacement = activeRewriteOf({
    entities,
    passiveBeSubtree,
    passiveAgentMarker,
    passiveAgentSubtree,
    voice
  });
  const replacement = opensTheSentence(entities, leftMostPassiveEntity) ? titleCase(baseReplacement) : baseReplacement;
  const { feats: { PronType: passiveSubjectPronType } } = entities[passiveSubject];
  const reported = {
    start,
    end,
    id: ErrorId.NO_PASSIVE_SENTENCES,
    message: PASSIVE_MESSAGE
  };
  return passiveSubjectPronType === "Rel" ? [reported] : [
    {
      ...reported,
      suggestions: [{ range: [start, end], text: replacement }]
    }
  ];
};
var no_passive_sentences_default = (sentences2) => sentences2.reduce((errors, entities) => {
  const matches = query_parse_default(entities, [passiveSelector]);
  return [
    ...errors,
    ...matches.reduce((newErrors, match) => [
      ...newErrors,
      ...toErrors(entities, match)
    ], [])
  ];
}, []);

// ../english-lint/dist/rules/no-similes.js
var properLikePhrasalVerbHeads = [
  "act",
  "appear",
  "be",
  "feel",
  "look",
  "see",
  "seem",
  "sound",
  "taste",
  "smell",
  "talk"
];
var isClauseBoundary = ({ form, lemma, xpos, feats }) => ["Colo", "Semi"].includes(feats.PunctType ?? "") || /^[—–]$/u.test(form) || xpos === "MARK" && ["and", "but", "or"].includes(lemma ?? "");
var followsDetachedNominal = (tokens, id) => {
  const previous = tokens[id - 1];
  return previous?.xpos === "NOUN" && previous.feats.Tense == null && tokens.slice(tokens[id].head + 1, id - 1).some(isClauseBoundary);
};
var applyRule8 = (tokens) => tokens.filter(({ lemma, xpos }) => lemma === "like" && xpos === "MARK").reduce((similes, { head, id, misc: { at } }) => {
  if (head < 0) {
    return similes;
  }
  const parent = tokens[head];
  if (parent.xpos === "NOUN" || followsDetachedNominal(tokens, id)) {
    return similes;
  }
  if (parent.lemma && properLikePhrasalVerbHeads.includes(parent.lemma)) {
    return similes;
  }
  const rightMostChild = Math.max(...parse_to_subtree_default(tokens, id));
  const { form: lastWord, misc: { at: endOffset } } = tokens[rightMostChild];
  return [
    ...similes,
    {
      start: at,
      end: endOffset + lastWord.length,
      message: `Avoid similes and metaphors such as "The evening settled like a duvet over bones" or "I landed on the pavement like a sack of unwrapped potatoes".`,
      id: ErrorId.NO_SIMILES
    }
  ];
}, []);
var no_similes_default = (sentences2) => sentences2.reduce((errors, entities) => [...errors, ...applyRule8(entities)], []);

// ../english-lint/dist/rules/no-special-punctuation.js
var EN_DASH = "\u2013";
var isPunctuation = ({ xpos }) => xpos === "PUNCT";
var enDashError = (at) => ({
  start: at,
  end: at + 1,
  suggestions: [{ range: [at, at + 1], text: "-" }],
  message: `Replace the en dash '\u2013' with a hyphen '-'.`,
  id: ErrorId.NO_SPECIAL_PUNCTUATION
});
var emDashError = (previousToken, nextToken, at) => {
  const range = [
    Math.max(previousToken.misc.at + previousToken.form.length, at - 1),
    Math.min(nextToken.misc.at, at + 2)
  ];
  return {
    start: at,
    end: at + 1,
    suggestions: [{ range, text: ", " }],
    message: `Rewrite the sentence to replace the dash with a full stop '.' if the next sentence is a separate thought, a colon ':' if the dash is introducing a thought or parentheses if there are two dashes enclosing an aside.`,
    id: ErrorId.NO_SPECIAL_PUNCTUATION
  };
};
var joinsTwoStatements = (tokens, nextToken, id) => tokens.slice(0, id).some((token) => !isPunctuation(token)) && !isPunctuation(nextToken);
var applyDashRule = (tokens, at, id, form) => {
  if (form === EN_DASH) {
    return [enDashError(at)];
  }
  const nextToken = tokens[id + 1];
  const previousToken = tokens[id - 1];
  if (nextToken == null || previousToken == null) {
    return [];
  }
  return joinsTwoStatements(tokens, nextToken, id) ? [emDashError(previousToken, nextToken, at)] : [];
};
var applyRule9 = (tokens) => tokens.filter(({ xpos }) => xpos === "PUNCT").reduce((errors, { form, misc: { at }, id }) => {
  if (["\u2014", EN_DASH].includes(form)) {
    return errors.concat(applyDashRule(tokens, at, id, form));
  }
  return errors;
}, []);
var no_special_punctuation_default = (sentences2) => sentences2.reduce((errors, entities) => [...errors, ...applyRule9(entities)], []);

// ../english-lint/dist/index.js
var { NO_ABSOLUTE_PHRASES, NO_BAD_SENTENCE_STRUCTURES, NO_BAD_WORDS, NO_EXPLAINED_ANTONYMS, NO_EXPLAINED_INTENSIFIERS, NO_HIGH_LEXICAL_DENSITY, NO_MIXED_DIALECTS, NO_NEGATED_CONTRASTS, NO_NESTED_CLAUSES, NO_NOUN_CLUSTERS, NO_PASSIVE_SENTENCES, NO_SIMILES, NO_SPECIAL_PUNCTUATION } = ErrorId;
var rules = [
  [NO_PASSIVE_SENTENCES, no_passive_sentences_default],
  [NO_EXPLAINED_ANTONYMS, no_explained_antonyms_default],
  [NO_EXPLAINED_INTENSIFIERS, no_explained_intensifiers_default],
  [NO_NOUN_CLUSTERS, no_noun_clusters_default],
  [NO_HIGH_LEXICAL_DENSITY, no_high_lexical_density_default],
  [NO_NESTED_CLAUSES, no_nested_clauses_default],
  [NO_SIMILES, no_similes_default],
  [NO_SPECIAL_PUNCTUATION, no_special_punctuation_default],
  [NO_BAD_SENTENCE_STRUCTURES, no_bad_sentence_structures_default],
  [NO_NEGATED_CONTRASTS, no_negated_contrasts_default],
  [NO_ABSOLUTE_PHRASES, no_absolute_phrases_default],
  [NO_BAD_WORDS, no_bad_words_default],
  [NO_MIXED_DIALECTS, no_mixed_dialects_default]
];
var defaults = {
  locale: "en-US",
  [NO_ABSOLUTE_PHRASES]: true,
  [NO_BAD_SENTENCE_STRUCTURES]: true,
  [NO_BAD_WORDS]: true,
  [NO_EXPLAINED_ANTONYMS]: true,
  [NO_EXPLAINED_INTENSIFIERS]: true,
  [NO_HIGH_LEXICAL_DENSITY]: true,
  [NO_MIXED_DIALECTS]: false,
  [NO_NEGATED_CONTRASTS]: true,
  [NO_NESTED_CLAUSES]: true,
  [NO_NOUN_CLUSTERS]: false,
  [NO_PASSIVE_SENTENCES]: true,
  [NO_SIMILES]: true,
  [NO_SPECIAL_PUNCTUATION]: false
};
var overlaps = (one, other) => one.start < other.end && other.start < one.end;
var offersReplacement = ({ suggestions }) => (suggestions ?? []).length > 0;
var widthOf = ({ start, end }) => end - start;
var widestFirst = (one, other) => widthOf(other) - widthOf(one) || one.start - other.start;
var byPosition = (one, other) => one.start - other.start || one.end - other.end;
var supersedes = (keeper, problem) => overlaps(keeper, problem) && (offersReplacement(keeper) || keeper.id === problem.id);
var settled = (problems) => [...problems].sort(widestFirst).reduce((kept, problem) => kept.some((keeper) => supersedes(keeper, problem)) ? kept : [...kept, problem], []).sort(byPosition);
var dist_default = (sentences2, config = defaults) => settled(rules.reduce((lintErrors, [id, rule]) => config[id] ? lintErrors.concat(rule(sentences2, config)) : lintErrors, []));

// src/config.ts
var known = Object.values(ErrorId);
var SHAPE_RULES = ["no-bold-lead-ins"];
var everyRule = {
  ...defaults,
  ...Object.fromEntries(known.map((id) => [id, true]))
};
var editorial = everyRule;
var scopeOfRule = {
  [ErrorId.NO_ABSOLUTE_PHRASES]: "sentences",
  [ErrorId.NO_BAD_SENTENCE_STRUCTURES]: "sentences",
  [ErrorId.NO_BAD_WORDS]: "words",
  [ErrorId.NO_EXPLAINED_ANTONYMS]: "words",
  [ErrorId.NO_EXPLAINED_INTENSIFIERS]: "words",
  [ErrorId.NO_HIGH_LEXICAL_DENSITY]: "sentences",
  [ErrorId.NO_MIXED_DIALECTS]: "words",
  [ErrorId.NO_NEGATED_CONTRASTS]: "sentences",
  [ErrorId.NO_NESTED_CLAUSES]: "sentences",
  [ErrorId.NO_NOUN_CLUSTERS]: "words",
  [ErrorId.NO_PASSIVE_SENTENCES]: "sentences",
  [ErrorId.NO_SIMILES]: "words",
  [ErrorId.NO_SPECIAL_PUNCTUATION]: "words",
  "no-bold-lead-ins": "shape"
};
var scopeOf = ({ id }) => scopeOfRule[id] ?? "sentences";
var allRules = () => [...known, ...SHAPE_RULES];
var configure = (off) => {
  const missing = off.filter(
    (id) => !known.includes(id) && !SHAPE_RULES.includes(id)
  );
  return {
    config: {
      ...everyRule,
      ...Object.fromEntries(off.map((id) => [id, false]))
    },
    unknown: missing.length === 0 ? "" : `No rule named ${missing.join(", ")}. The rules are:
${allRules().map((id) => `  ${id}`).join("\n")}`
  };
};

// src/markdown.ts
var blank = (text) => text.replace(/[^\n]/gu, " ");
var label = (match, text) => {
  const at = match.indexOf(text);
  return blank(match.slice(0, at)) + text + blank(match.slice(at + text.length));
};
var MASKS = [
  [/^---[ \t]*\n[\s\S]*?\n---[ \t]*(?=\n|$)/u, blank],
  [/^[ \t]*(`{3,}|~{3,})[\s\S]*?(?:\n[ \t]*\1[^\n]*|$(?![\s\S]))/gmu, blank],
  [/<!--[\s\S]*?-->/gu, blank],
  [/<\/?[a-zA-Z][^>\n]*>/gu, blank],
  [/`[^`\n]*`/gu, blank],
  [/"[^"\n]{1,80}"/gu, blank],
  [/“[^”\n]{1,80}”/gu, blank],
  [/^[ \t]*\[[^\]\n]+\]:[^\n]*$/gmu, blank],
  [/!?\[([^\]\n]*)\]\([^)\n]*\)/gu, label],
  [/!?\[([^\]\n]*)\]\[[^\]\n]*\]/gu, label],
  [/<[a-z][\w+.-]*:\/\/[^>\s]*>/giu, blank],
  [/\b[a-z][\w+.-]*:\/\/\S+|\bwww\.\S+/giu, blank],
  [/^[ \t]*(?:#{1,6}[ \t]+|>[ \t]?|[-*+][ \t]+|\d+[.)][ \t]+)/gmu, blank],
  [/[ \t]#+[ \t]*$/gmu, blank],
  [/^[ \t]*[-=|:*_ \t]{3,}$/gmu, blank],
  [/[[\]|]/gu, blank],
  [/\*+|~~+/gu, blank],
  [/(?<!\w)_+|_+(?!\w)/gu, blank]
];
var mask = (text) => MASKS.reduce(
  (masked, [pattern, replace]) => masked.replace(pattern, replace),
  text
);
var STANDALONE = /^[ \t]*(?:#{1,6}[ \t]|>|[-*+][ \t]|\d+[.)][ \t]|\||={2,}|-{2,}|`{3,}|~{3,})/u;
var blocks = (text) => {
  const lines2 = text.split("\n");
  const masked = mask(text).split("\n");
  const found = [];
  let open = null;
  let offset = 0;
  const close = () => {
    if (open && open.text.trim() !== "") {
      found.push(open);
    }
    open = null;
  };
  lines2.forEach((line, index) => {
    const empty = line.trim() === "";
    if (empty || STANDALONE.test(line)) {
      close();
    }
    if (!empty) {
      open = open == null ? { at: offset, text: masked[index] } : { at: open.at, text: `${open.text}
${masked[index]}` };
    }
    offset += line.length + 1;
  });
  close();
  return found;
};

// src/nlp.ts
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

// ../nlp/dist/grammar/index.js
var tagIndexMap = {
  VERB: 0,
  NOUN: 1,
  MARK: 2,
  ADJ: 3,
  ADV: 4,
  PUNCT: 5,
  INTJ: 6
};
var tagOrder = (tag1, tag2) => tagIndexMap[tag1] - tagIndexMap[tag2];
var translativeDegree = ({ feats: { AdpType, ConjType } = {} }) => !AdpType && ConjType === "Sub" ? 2 : AdpType && !ConjType ? 1 : 0;
var markerDegreeLabel = (token) => {
  const degree = translativeDegree(token);
  return degree === 0 ? "MARK" : `MARK/${degree}`;
};
var terminatorTypes = ["Peri", "Qest", "Excl", "Comm", "Colo", "Semi"];
var isTerminatorType = (type) => type != null && terminatorTypes.includes(type);
var isTerminator = ({ feats: { PunctType } }) => isTerminatorType(PunctType);
var delimiterTypes = ["Quot", "Brck", "Comm"];
var isDelimiter = ({ feats: { PunctType } }) => PunctType != null && delimiterTypes.includes(PunctType);
var pairedDelimiterTypes = ["Quot", "Brck"];
var isGerund = ({ feats: { Tense, VerbForm } }) => Tense === "Pres" && VerbForm === "Part";
var timeModifiers = ["now", "yesterday", "tomorrow"];
var isTimeModifier = ({ lemma }) => timeModifiers.includes(lemma ?? "");
var objectComplementVerbs = [
  "call",
  "consider",
  "declare",
  "deem",
  "feel",
  "find",
  "get",
  "have",
  "hear",
  "help",
  "keep",
  "leave",
  "let",
  "make",
  "name",
  "paint",
  "prove",
  "render",
  "see",
  "turn",
  "watch"
];
var takesObjectComplement = (lemma) => objectComplementVerbs.includes(lemma ?? "");
var canStillBe = (token, tags) => {
  const { xpos, misc: { pos = {} } = {} } = token;
  return xpos == null ? tags.some((tag2) => Boolean(pos[tag2])) : tags.includes(xpos);
};
var isNegator = ({ lemma }) => lemma === "not";
var auxiliaryLemmas = ["be", "do", "have"];
var isAuxiliaryOrModal = (token) => {
  const { lemma, feats: { Mood } } = token;
  return canStillBe(token, ["VERB"]) && (Mood != null || auxiliaryLemmas.includes(lemma ?? ""));
};
var isSettledAdverb = (token) => {
  const { xpos, misc: { pos } } = token;
  const tags = Object.keys(pos);
  return xpos === "ADV" || xpos == null && tags.length === 1 && tags[0] === "ADV";
};
var negatesVerbGroup = (tokens, index) => index > 0 && isNegator(tokens[index]) && isAuxiliaryOrModal(tokens[index - 1]);
var findNegatedVerb = (tokens, index) => {
  if (!negatesVerbGroup(tokens, index)) {
    return -1;
  }
  let candidate = index + 1;
  while (candidate < tokens.length && isSettledAdverb(tokens[candidate])) {
    candidate += 1;
  }
  return candidate < tokens.length && canStillBe(tokens[candidate], ["VERB"]) ? candidate : -1;
};
var isNonFiniteRelativeRoot = (tokens, heads, headVerb) => {
  const { feats: { Tense, VerbForm } } = tokens[headVerb];
  const grandparent = heads[headVerb];
  return Tense === "Past" && VerbForm !== "Fin" && grandparent !== -2 && tokens[grandparent].xpos === "NOUN";
};
var isPastOrParticiple = ({ feats: { Tense, VerbForm } }) => VerbForm === "Part" || Tense === "Past";
var tensedHeadAcceptsChild = (head, child) => {
  const { lemma: headLemma, feats: { Mood: headMood, Tense: headTense } } = head;
  const { lemma, feats: { Tense, VerbForm, Person } } = child;
  const isDoSupport = headLemma === "do" && (Person === 1 || headTense === "Past");
  return Boolean(headMood) || isDoSupport || VerbForm === "Part" || Tense === "Past" && lemma !== "be";
};
var verbsAreCompatible = (tokens, heads, headVerb, childVerb) => {
  if (isNonFiniteRelativeRoot(tokens, heads, headVerb)) {
    return false;
  }
  const head = tokens[headVerb];
  const { feats: { Tense: headTense, VerbForm: headVerbForm } } = head;
  return headVerbForm === "Fin" || headTense === "Past" ? tensedHeadAcceptsChild(head, tokens[childVerb]) : isPastOrParticiple(tokens[childVerb]);
};
var hasVerbLaterInClause = (tokens, index) => {
  let currentIndex = index + 1;
  while (currentIndex < tokens.length) {
    const { xpos, feats: { ConjType }, misc: { pos } } = tokens[currentIndex];
    if (xpos === "MARK" && ConjType) {
      return false;
    }
    if (xpos === "VERB" || pos.VERB) {
      return true;
    }
    currentIndex += 1;
  }
  return false;
};
var isFollowedByClause = (tokens, currentIndex) => {
  if (currentIndex >= tokens.length - 1) {
    return false;
  }
  let index = currentIndex + 1;
  while (index < tokens.length) {
    const { xpos = "X", misc: { pos } } = tokens[index];
    if (xpos === "VERB" || pos.VERB) {
      return true;
    }
    if (["ADV", "ADJ", "NOUN"].includes(xpos) || Object.keys(pos).every((xpos2) => ["ADV", "ADJ", "NOUN"].includes(xpos2))) {
      index += 1;
    } else {
      return false;
    }
  }
  return false;
};
var capitalizedRegExp = new RegExp("\\p{Lu}", "u");
var isCapitalizedWord = (form) => {
  const firstCharacter = form.charAt(0);
  if (["#", "@"].includes(firstCharacter) && form.length > 1) {
    return capitalizedRegExp.test(form.charAt(1));
  }
  return capitalizedRegExp.test(firstCharacter);
};
var hasChildWithMatcher = (heads, tokens, index, matches) => heads.some((head, child) => head === index && matches(tokens[child], child, tokens));
var hasAppositivePunctuation = (heads, tokens, appositiveRoot, isSentenceEnd = false) => {
  let terminators = 0;
  let delimiters = 0;
  heads.forEach((head, child) => {
    if (head !== appositiveRoot) {
      return;
    }
    const token = tokens[child];
    const { feats: { PunctType } } = token;
    if (PunctType == null) {
      return;
    }
    if (pairedDelimiterTypes.includes(PunctType)) {
      delimiters += 1;
    }
    if (isTerminator(token)) {
      terminators += 1;
    }
  });
  return terminators === 1 && isSentenceEnd || terminators === 2 || delimiters === 2;
};

// ../nlp/dist/featurize/index.js
var START_TOKEN = {
  id: -1,
  xpos: "START",
  form: "",
  lemma: "",
  feats: {},
  misc: { at: -1, pos: {} }
};
var END_TOKEN = {
  id: -1,
  xpos: "END",
  form: "",
  lemma: "",
  feats: {},
  misc: { at: -1, pos: {} }
};
var verbTag = ({ Mood, VerbForm, Tense, Person }) => {
  if (Mood) {
    return "MODAL";
  }
  if (VerbForm === "Part") {
    return "PARTICIPLE";
  }
  if (Tense === "Past") {
    return "VERB/Past";
  }
  return Person ? `VERB/${Person}` : "VERB";
};
var punctuationTag = (PunctType) => {
  if (PunctType === "Dash") {
    return "PUNCT/Dash";
  }
  return ["Quot", "Brck"].includes(PunctType ?? "") ? "PUNCT/Brck,Quot" : "PUNCT/Comm,Excl,Peri,Ques";
};
var extendTag = (token) => {
  const { xpos, feats = {} } = token;
  const { PronType, PunctType } = feats;
  switch (xpos) {
    case "NOUN":
      return PronType ? `NOUN/${PronType}` : "NOUN";
    case "VERB":
      return verbTag(feats);
    case "ADJ":
      return PronType ? `ADJ/${PronType}` : "ADJ";
    case "MARK":
      return markerDegreeLabel(token);
    case "PUNCT":
      return punctuationTag(PunctType);
    default:
      return xpos;
  }
};
var verbShapeFeatures = ({ feats: { Tense, VerbForm, Person } = {} }) => {
  if (Tense) {
    if (Person) {
      return [`${Tense}/${VerbForm}/${Person}`];
    }
    return [`${Tense}/${VerbForm}`];
  }
  return [];
};
var flagFeatures = ({ Mood, Poss, PronType }) => [
  ...Poss ? ["POSS"] : [],
  ...Mood ? ["MODAL"] : [],
  ...PronType ? ["PRON"] : []
];
var extractShapeFeatures = (token) => {
  const { feats = {}, misc: { pos = {} } = {} } = token;
  const { Number: Number2 } = feats;
  const shapeFeatures = [
    ...verbShapeFeatures(token),
    ...Number2 ? [Number2] : [],
    ...pos.MARK ? [markerDegreeLabel(token)] : [],
    ...flagFeatures(feats)
  ];
  const tags = Object.keys(pos);
  if (tags.length > 0 && shapeFeatures.length === 0) {
    shapeFeatures.push(...tags.sort(tagOrder));
  }
  return shapeFeatures;
};
var isCapitalized = (string) => new RegExp("^\\p{Lu}", "u").test(string);
var F_THRESHOLD = 1e-4;
var amplifyF = (f) => Math.min(1 / (1 - f), 10);
var letters = new RegExp("^\\p{L}+$", "u");
var suffixesOf = (form) => {
  const word = form.toLowerCase();
  if (!letters.test(word)) {
    return [];
  }
  return [2, 3, 4].filter((length) => word.length > length).map((length) => `suf${length}=${word.slice(-length)}`);
};
var band = (value, high, middle) => {
  if (value >= high) {
    return "h";
  }
  return value >= middle ? "m" : "l";
};
var taggedTokenAt = (tokens, path, index, offset) => {
  const at = index - offset;
  if (at < 0) {
    return START_TOKEN;
  }
  const inPath = path.length - offset;
  return inPath < 0 ? tokens[at] : { ...tokens[at], xpos: path[inPath].xpos };
};
var addLikelihoodFeatures = (features, pos, { pathTags, likelihoodWeight = 1 }) => {
  const keys = Object.keys(pos ?? {});
  const sum = keys.reduce((total, xpos) => total + (pos?.[xpos] ?? 0), 0);
  if (sum >= 2) {
    return;
  }
  keys.forEach((xpos) => {
    const weight = pos?.[xpos];
    if (weight && weight >= 0.2 && pathTags.includes(xpos)) {
      features[`${xpos}:${band(weight, 0.7, 0.3)}`] = likelihoodWeight;
    }
  });
};
var addPrepositionPairFeatures = (features, token, next, { pathTags, likelihoodWeight = 1 }) => {
  const { prepPairs } = token.misc;
  if (!prepPairs) {
    return;
  }
  const { form: n1Form, lemma: n1Lemma } = next;
  const entry = prepPairs[n1Form] ? prepPairs[n1Form] : prepPairs[n1Lemma ?? ""];
  if (!entry) {
    return;
  }
  Object.entries(entry).forEach(([xpos, weight]) => {
    if (pathTags.includes(xpos)) {
      features[`mpair-${xpos}:${band(weight, 0.66, 0.33)}`] = amplifyF(weight) * likelihoodWeight;
    }
  });
};
var addWordFeatures = (features, { form, f, lastTag, previous }) => {
  if (f <= F_THRESHOLD) {
    suffixesOf(form).forEach((suffix) => {
      features[suffix] = 1;
      features[`${lastTag}>${suffix}`] = 1;
    });
    return;
  }
  const { form: l1Form, misc: { f: fMinus1 = 0 } = {} } = previous;
  features[`w=${form}`] = 1;
  features[`${lastTag}>${form}`] = 1;
  if (fMinus1 > F_THRESHOLD) {
    features[`${l1Form}>${form}`] = 1;
  }
};
var addNextTagFeatures = (features, next, lastTag) => {
  const candidates2 = Object.keys(next.misc.pos ?? {}).slice().sort();
  if (candidates2.length === 0) {
    return;
  }
  const n1Tags = `n1=${candidates2.join("|")}`;
  features[n1Tags] = 1;
  features[`${lastTag}>${n1Tags}`] = 1;
};
var addShapePairFeatures = (features, shapeFeatures, nextShapeFeatures, lastTag) => {
  shapeFeatures.forEach((feat) => {
    nextShapeFeatures.forEach((featN1) => {
      features[`${lastTag}>${feat}<${featN1}`] = 1;
      features[`${feat}<${featN1}`] = 1;
    });
  });
};
function featurize_default(tokens, index, weighting) {
  const { path } = weighting;
  const features = {};
  const token = tokens[index];
  const l1 = taggedTokenAt(tokens, path, index, 1);
  const l2 = taggedTokenAt(tokens, path, index, 2);
  const n1 = index < tokens.length - 1 ? tokens[index + 1] : END_TOKEN;
  const shapeFeatures = extractShapeFeatures(token);
  const { form, misc: { pos = {}, f = 0 } } = token;
  addLikelihoodFeatures(features, pos, weighting);
  features.bias = 1;
  if (isCapitalized(form)) {
    features.Cap = 1;
  }
  const lastTag = extendTag(l1);
  const lastTwoTags = `${extendTag(l2)}${lastTag}`;
  shapeFeatures.forEach((feat) => {
    features[`${lastTag}>${feat}`] = 1;
    features[`${lastTwoTags}>${feat}`] = 1;
  });
  addPrepositionPairFeatures(features, token, n1, weighting);
  addWordFeatures(features, { form, f, lastTag, previous: l1 });
  addNextTagFeatures(features, n1, lastTag);
  addShapePairFeatures(features, shapeFeatures, extractShapeFeatures(n1), lastTag);
  return features;
}

// ../nlp/dist/lemmatize/index.js
var adjectiveSuffixes = /(?:ine|ous|bound|most|like|ical)$/iu;
var irregularSingularsSuffixes = /(?:asis|ness|(?:it|nc|log)y)$/iu;
var irregularPluralSuffixIes = /(?:log|it|nc)ies$/iu;
var simpleNounSuffixes = /(?:ation|ment|[st]ion|ence|ship|ism|ium|ifier)s?$/iu;
var verbLemmaSuffixes = /(?:ise|ify|ate)$/iu;
var adjectiveNounSuffixes = /(?:ist|ful|ian|oid)s?$/iu;
var findPluralLemma = (lemma, dictionary2) => {
  const { pos: lemmaPos = {} } = dictionary2.get(lemma) || {};
  const pos = {};
  const feats = {};
  if (lemmaPos.NOUN) {
    pos.NOUN = 1;
    feats.Number = "Plur";
  }
  if (lemmaPos.VERB) {
    pos.VERB = 1;
    feats.VerbForm = "Fin";
    feats.Tense = "Pres";
    feats.Person = 3;
  }
  if (lemmaPos.NOUN || lemmaPos.VERB) {
    return { lemma, pos, feats };
  }
  return null;
};
var knows = (dictionary2, related, tag2) => {
  const { pos = {} } = dictionary2.get(related) || {};
  return Boolean(pos[tag2]);
};
var firstKnownVerb = (dictionary2, stems) => stems.find((stem) => knows(dictionary2, stem, "VERB"));
var firstPlural = (dictionary2, candidates2) => {
  for (const candidate of candidates2) {
    const found = findPluralLemma(candidate, dictionary2);
    if (found != null) {
      return found;
    }
  }
  return null;
};
var numberOf = (word) => {
  const plural = word.endsWith("s");
  return { plural, stem: plural ? word.slice(0, -1) : word };
};
var byRelatedWord = (word, dictionary2, { related, tag: tag2, whenKnown, otherwise }) => ({
  lemma: word,
  pos: knows(dictionary2, related, tag2) ? whenKnown : otherwise
});
var ADVERB_UNLESS_ADJECTIVE = {
  tag: "ADJ",
  whenKnown: { ADV: 1 },
  otherwise: { ADJ: 1, ADV: 1 }
};
var ADJECTIVE_IF_ADVERB_EXISTS = {
  tag: "ADV",
  whenKnown: { ADJ: 1 },
  otherwise: { ADJ: 1, ADV: 1 }
};
var asIngly = (word) => word.endsWith("ingly") ? { lemma: word, pos: { ADV: 1 } } : null;
var asAdjectiveSuffix = (word) => adjectiveSuffixes.test(word) ? { lemma: word, pos: { ADJ: 1 } } : null;
var asProof = (word) => word.endsWith("proof") ? {
  lemma: word,
  pos: { ADJ: 1, VERB: 1 },
  feats: { VerbForm: "Fin", Tense: "Pres", Person: 1 }
} : null;
var asIrregularSingular = (word) => irregularSingularsSuffixes.test(word) ? { lemma: word, pos: { NOUN: 1 }, feats: { Number: "Sing" } } : null;
var asIrregularPlural = (word) => irregularPluralSuffixIes.test(word) ? {
  lemma: `${word.slice(0, -3)}y`,
  pos: { NOUN: 1 },
  feats: { Number: "Plur" }
} : null;
var asSimpleNoun = (word) => {
  if (!simpleNounSuffixes.test(word)) {
    return null;
  }
  const { plural, stem } = numberOf(word);
  return {
    lemma: stem,
    pos: { NOUN: 1 },
    feats: { Number: plural ? "Plur" : "Sing" }
  };
};
var asAdjectiveNoun = (word) => {
  if (!adjectiveNounSuffixes.test(word)) {
    return null;
  }
  const { plural, stem } = numberOf(word);
  return {
    lemma: stem,
    feats: { Number: plural ? "Plur" : "Sing" },
    pos: plural ? { NOUN: 1 } : { NOUN: 1, ADJ: 1 }
  };
};
var asWise = (word) => word.endsWith("wise") ? { lemma: word, pos: { ADJ: 1, ADV: 1 } } : null;
var asVerbLemma = (word) => verbLemmaSuffixes.test(word) ? {
  lemma: word,
  pos: { VERB: 1 },
  feats: { VerbForm: "Fin", Tense: "Pres", Person: 1 }
} : null;
var asAge = (word) => {
  if (!word.endsWith("age") && !word.endsWith("ages")) {
    return null;
  }
  const { plural, stem } = numberOf(word);
  return {
    lemma: stem,
    feats: {
      Number: plural ? "Plur" : "Sing",
      VerbForm: "Fin",
      Tense: "Pres",
      Person: plural ? 3 : 1
    },
    pos: { NOUN: 1, VERB: 1 }
  };
};
var asIly = (word, dictionary2) => word.endsWith("ily") ? byRelatedWord(word, dictionary2, {
  related: `${word.slice(0, -3)}y`,
  ...ADVERB_UNLESS_ADJECTIVE
}) : null;
var asBly = (word, dictionary2) => word.endsWith("bly") ? byRelatedWord(word, dictionary2, {
  related: `${word.slice(0, -1)}e`,
  ...ADVERB_UNLESS_ADJECTIVE
}) : null;
var asIcally = (word, dictionary2) => word.endsWith("ically") ? byRelatedWord(word, dictionary2, {
  related: word.slice(0, -4),
  ...ADVERB_UNLESS_ADJECTIVE
}) : null;
var asLe = (word, dictionary2) => word.endsWith("le") ? byRelatedWord(word, dictionary2, {
  related: `${word.slice(0, -1)}y`,
  ...ADJECTIVE_IF_ADVERB_EXISTS
}) : null;
var NOMINALIZING_SUFFIXES = ["ancy", "ency", "ance", "ence", "ation"];
var asEntOrAnt = (word, dictionary2) => {
  if (!word.endsWith("ent") && !word.endsWith("ant")) {
    return null;
  }
  const nouns = NOMINALIZING_SUFFIXES.map((suffix) => `${word.slice(0, -3)}${suffix}`);
  return nouns.some((noun) => knows(dictionary2, noun, "NOUN")) ? { lemma: word, pos: { ADJ: 1 } } : null;
};
var asIc = (word, dictionary2) => word.endsWith("ic") ? byRelatedWord(word, dictionary2, {
  related: `${word}ally`,
  ...ADJECTIVE_IF_ADVERB_EXISTS
}) : null;
var asIal = (word, dictionary2) => word.endsWith("ial") ? byRelatedWord(word, dictionary2, {
  related: word.slice(0, -3),
  tag: "NOUN",
  whenKnown: { ADJ: 1 },
  otherwise: { ADJ: 1, ADV: 1 }
}) : null;
var asPastParticiple = (dictionary2, stems) => {
  const lemma = firstKnownVerb(dictionary2, stems);
  return lemma == null ? null : { lemma, pos: { VERB: 1, ADJ: 1 }, feats: { Tense: "Past" } };
};
var asIed = (word, dictionary2) => word.endsWith("ied") ? asPastParticiple(dictionary2, [`${word.slice(0, -3)}y`]) : null;
var asEd = (word, dictionary2) => word.endsWith("ed") ? asPastParticiple(dictionary2, [word.slice(0, -1), word.slice(0, -2)]) : null;
var asIng = (word, dictionary2) => {
  if (!word.endsWith("ing")) {
    return null;
  }
  const lemma = firstKnownVerb(dictionary2, [
    word.slice(0, -3),
    `${word.slice(0, -3)}e`
  ]);
  return lemma == null ? null : {
    lemma,
    pos: { NOUN: 1, VERB: 1, ADJ: 1 },
    feats: { VerbForm: "Part", Tense: "Pres", Number: "Sing" }
  };
};
var asIes = (word, dictionary2) => word.endsWith("ies") ? firstPlural(dictionary2, [`${word.slice(0, -3)}y`, word.slice(0, -1)]) : null;
var asEs = (word, dictionary2) => word.endsWith("es") ? firstPlural(dictionary2, [word.slice(0, -1), word.slice(0, -2)]) : null;
var asS = (word, dictionary2) => word.endsWith("s") ? firstPlural(dictionary2, [word.slice(0, -1)]) : null;
var asY = (word, dictionary2) => {
  if (!word.endsWith("y")) {
    return null;
  }
  const noun = word.slice(0, -1);
  const derivedFromNoun = knows(dictionary2, noun, "NOUN") || knows(dictionary2, `${noun}ily`, "ADV");
  return {
    lemma: word,
    pos: derivedFromNoun ? { ADJ: 1 } : { ADJ: 1, ADV: 1, NOUN: 1 }
  };
};
var analyzers = [
  asIngly,
  asAdjectiveSuffix,
  asProof,
  asIrregularSingular,
  asIrregularPlural,
  asSimpleNoun,
  asAdjectiveNoun,
  asWise,
  asVerbLemma,
  asAge,
  asIly,
  asBly,
  asIcally,
  asLe,
  asEntOrAnt,
  asIc,
  asIal,
  asIed,
  asEd,
  asIng,
  asIes,
  asEs,
  asS,
  asY
];
var lemmatize_default = (word, { dictionary: dictionary2 }) => {
  for (const analyze of analyzers) {
    const reading = analyze(word, dictionary2);
    if (reading != null) {
      return reading;
    }
  }
  return { lemma: word, pos: { NOUN: 1 } };
};

// ../nlp/dist/tag/predict.js
function predict_default(weights2, features, labels) {
  const { length } = labels;
  const scores = new Float64Array(length);
  const keys = Object.keys(features);
  for (let key2 = 0; key2 < keys.length; key2 += 1) {
    const feature = keys[key2];
    const value = features[feature];
    const classes = weights2[feature] || {};
    for (let label2 = 0; label2 < length; label2 += 1) {
      const weight = classes[labels[label2]];
      if (weight) {
        scores[label2] += weight * value;
      }
    }
  }
  let prediction = 0;
  for (let label2 = 1; label2 < length; label2 += 1) {
    if (scores[label2] > scores[prediction]) {
      prediction = label2;
    }
  }
  return labels[prediction];
}

// ../nlp/dist/tag/audit.js
var sink = null;
var isAuditing = () => sink != null;
var recordTagEvent = (event) => {
  if (sink != null) {
    sink(event());
  }
};

// ../nlp/dist/grammar/divergent.js
var phraseBoundaryTypes = ["Peri", "Qest", "Excl", "Comm"];
var isPhraseBoundaryType = (type) => type != null && phraseBoundaryTypes.includes(type);
var canBeSubjectOfWhenTagging = (subjectToken, verbToken) => {
  const { feats: { Number: Number2 } } = subjectToken;
  const { feats: { Person: verbPerson, Tense, VerbForm, Mood } } = verbToken;
  return Boolean(Mood) || Tense === "Past" && VerbForm === "Fin" || verbPerson === 3 && Number2 !== "Plur" || verbPerson != null && [1, 2].includes(verbPerson) && Number2 !== "Sing";
};
var cannotBeSubjectWhenParsing = (tokens, subject, verb) => {
  const { feats: { Number: Number2, Person: subjectPerson } } = tokens[subject];
  const { feats: { Person } } = tokens[verb];
  return Person === 3 && Number2 === "Plur" || Person != null && [1, 2].includes(Person) && Number2 === "Sing" && subjectPerson !== 1;
};

// ../nlp/dist/tag/index.js
var END_TOKEN2 = {
  xpos: "END",
  feats: {},
  misc: {}
};
var START_TOKEN2 = {
  xpos: "START",
  feats: {},
  misc: {}
};
var isCompoundNoun = ({ token: { feats: { PronType, NumType } }, aftToken: { xpos: aftTag, feats: { PronType: aftPronType, NumType: aftNumType } } }) => aftTag === "NOUN" && !PronType && !aftPronType && !(NumType === "Card" && aftNumType !== "Card");
var nounHasRightVerbParent = ({ token: { feats: { Case } }, foreToken: { xpos: foreTag }, aftToken: { xpos: aftTag } }) => (Case !== "Acc" || foreTag !== "VERB") && aftTag === "VERB";
var headsPhraseOnItsRight = (marker, afterMarker) => {
  const { xpos, feats: { AdpType, ConjType } } = marker;
  const { xpos: afterMarkerTag, feats: { PunctType: afterMarkerPunctType } } = afterMarker;
  const closesTheClause = AdpType != null && ConjType != null && ["END", "MARK"].includes(String(afterMarkerTag));
  return xpos === "MARK" && (AdpType === "Post" || closesTheClause || isPhraseBoundaryType(afterMarkerPunctType));
};
var nounHasRightMarkerParent = ({ tokens, index, foreToken: { xpos: foreTag }, token: { feats: { Case } } }) => {
  const aftToken = index + 1 < tokens.length ? tokens[index + 1] : END_TOKEN2;
  const aftToken2 = index + 2 < tokens.length ? tokens[index + 2] : END_TOKEN2;
  return (Case !== "Acc" || foreTag !== "VERB") && headsPhraseOnItsRight(aftToken, aftToken2);
};
var hasGerundVerbHeadInStack = (stack, tokens, taggedWindow) => {
  let indexInStack = stack.length - 1;
  while (indexInStack >= 0) {
    const id = stack[indexInStack];
    const { xpos: stackTag, lemma: stackLemma } = tokens[id];
    const isVerbInTaggedWindow = taggedWindow.some(({ id: taggedIndex, xpos: tagInWindow }) => id === taggedIndex && tagInWindow === "VERB");
    if (stackTag === "VERB" || isVerbInTaggedWindow) {
      return stackLemma === "be";
    }
    if (stackTag === "MARK") {
      return false;
    }
    indexInStack -= 1;
  }
  return false;
};
var UNKNOWN_TOKEN = {
  xpos: "X",
  feats: {},
  misc: {}
};
var stackHeadOr = (stack, tokens, fallback, minimumStackDepth) => stack.length < minimumStackDepth ? fallback : tokens[stack[stack.length - 2]];
var gerundFollowsVerbalContext = ({ stack, tokens, foreToken: { xpos: foreTag, feats: { VerbForm: foreVerbForm } } }) => {
  const { xpos: stackHeadTag, feats: { ConjType: stackHeadConjType } } = stackHeadOr(stack, tokens, START_TOKEN2, 2);
  return stackHeadTag === "MARK" && Boolean(stackHeadConjType) || foreTag === "VERB" && foreVerbForm === "Fin";
};
var gerundTakesAnObject = ({ aftToken: { xpos: aftTag, feats: { PronType: aftPronType } } }) => ["ADJ", "NOUN"].includes(String(aftTag)) || Boolean(aftPronType);
var gerundHeadsReducedRelative = ({ stack, tokens, taggedWindow, foreToken: { xpos: foreTag }, aftToken: { misc: { pos: aftPos = {} } } }) => foreTag === "NOUN" && !hasGerundVerbHeadInStack(stack, tokens, taggedWindow) && Boolean(aftPos.MARK);
var isInvalidGerundNoun = (args) => isGerund(args.token) && (gerundFollowsVerbalContext(args) || gerundTakesAnObject(args) || gerundHeadsReducedRelative(args));
var isRightHeadedAdverb = ({ aftToken: { xpos: aftTag }, foreToken2: { xpos: foreTag2 }, token: { feats: { PronType } } }) => Boolean(PronType) && aftTag === "ADV" && foreTag2 === "NOUN";
var isInvalidCompoundNoun = ({ foreToken: { xpos: foreTag, feats: { PronType: forePronType, Tense: foreTense }, misc: { parentDirection: foreDirection } }, token: { lemma, feats: { VerbForm, Tense } } }) => foreTag === "NOUN" && !forePronType && (VerbForm === "Part" && Tense === "Past" || isTimeModifier({ lemma }) || foreDirection === "L" || foreTense === "Past");
var isInvalidNounAfterPronoun = ({ token: { feats: { PronType } }, foreToken: { xpos: foreTag, feats: { Case, PronType: forePronType, NumType: foreNumType } } }) => foreTag === "NOUN" && !PronType && Boolean(forePronType) && !foreNumType && Case !== "Acc";
var canOmitMarker = ({ feats: { Poss, PronType }, misc: { pos } }) => pos.NOUN && (["Ind", "Neg", "Tot"].includes(String(PronType)) || PronType === "Prs" && Poss);
var isRelativeClauseMarkerPronoun = ({ foreToken: { xpos: foreTag }, token }) => foreTag === "NOUN" && canOmitMarker(token);
var closesVerbSearch = (taggedWindow, indexInWindow) => {
  const token = taggedWindow[indexInWindow];
  const foreToken = indexInWindow > 0 ? taggedWindow[indexInWindow - 1] : { xpos: "START" };
  return ["PUNCT", "MARK"].includes(token.xpos ?? "") || isRelativeClauseMarkerPronoun({ foreToken, token });
};
var findLeftVerbHead = (taggedWindow) => {
  let indexInWindow = taggedWindow.length - 1;
  let crossedObject = false;
  while (indexInWindow >= 0) {
    const { xpos, lemma, feats: { VerbForm }, id } = taggedWindow[indexInWindow];
    if (xpos === "VERB" && VerbForm !== "Part") {
      return !crossedObject || takesObjectComplement(lemma) ? id : null;
    }
    if (closesVerbSearch(taggedWindow, indexInWindow)) {
      return null;
    }
    if (xpos === "NOUN") {
      if (crossedObject) {
        return null;
      }
      crossedObject = true;
    }
    indexInWindow -= 1;
  }
  return null;
};
var isMarkerObject = (taggedWindow) => {
  let indexInWindow = taggedWindow.length - 1;
  while (indexInWindow >= 0) {
    const { xpos, feats: { ConjType } } = taggedWindow[indexInWindow];
    if (xpos === "MARK" && !ConjType) {
      return true;
    }
    if (["PUNCT", "VERB", "NOUN"].includes(String(xpos))) {
      return false;
    }
    indexInWindow -= 1;
  }
  return false;
};
var isPerfectOrPassiveComplement = ({ feats: { Tense, VerbForm } }, { lemma: headLemma }) => Tense === "Past" && (VerbForm === "Part" || headLemma === "have" || headLemma === "be");
var isBareInfinitiveComplement = ({ form, lemma, feats: { Tense, VerbForm } }, { lemma: headLemma, feats: { Mood: headMood, VerbForm: headVerbForm } }) => {
  const isDoSupported = headLemma === "do" && headVerbForm === "Fin";
  const isModalComplement = headLemma !== "be" && Boolean(headMood) && lemma === form.toLowerCase();
  return Tense === "Pres" && VerbForm === "Fin" && (isDoSupported || isModalComplement);
};
var isModalVerbComplement = ({ token, foreToken }) => foreToken.xpos === "VERB" && Boolean(foreToken.feats.Mood) && isBareInfinitiveComplement(token, foreToken);
var isCompatibleVerb = ({ taggedWindow, token, foreToken: { lemma: foreLemma } }) => {
  const { feats: { Tense, VerbForm } } = token;
  if (foreLemma === "be" && (Tense === "Past" || VerbForm === "Part")) {
    return true;
  }
  let indexInWindow = taggedWindow.length - 1;
  while (indexInWindow >= 0) {
    const head = taggedWindow[indexInWindow];
    if (head.xpos === "VERB") {
      return isPerfectOrPassiveComplement(token, head) || isBareInfinitiveComplement(token, head);
    }
    if (head.xpos !== "ADV") {
      return false;
    }
    indexInWindow -= 1;
  }
  return false;
};
var isImmediatelyPrecededByDeterminer = (taggedWindow) => {
  let indexInWindow = taggedWindow.length - 1;
  while (indexInWindow >= 0) {
    const { xpos, feats: { PronType } } = taggedWindow[indexInWindow];
    if (xpos === "ADV") {
      indexInWindow -= 1;
    } else if (xpos === "ADJ") {
      if (PronType) {
        return true;
      }
      indexInWindow -= 1;
    } else {
      return false;
    }
  }
  return false;
};
var headVerbLicensesAdjObject = (headLemma, aftTag) => !["be", "have"].includes(headLemma) || ["PUNCT", "END"].includes(String(aftTag));
var adjObjectIsRightDelimited = ({ aftToken: { xpos: aftTag, feats: { PronType: aftPronType }, misc: { pos: aftTags = {} } } }) => Boolean(aftTags.ADJ && aftPronType) || ["MARK", "PUNCT", "END"].includes(String(aftTag));
var isVerbsAdjObject = (args) => {
  const { steps, tokens, taggedWindow, token: { feats: { PronType }, misc: { pos } }, aftToken: { xpos: aftTag } } = args;
  const leftVerbHead = findLeftVerbHead(taggedWindow);
  if (leftVerbHead == null || PronType) {
    return false;
  }
  const { lemma: headLemma = "" } = tokens[leftVerbHead];
  const isVerbItself = steps.some(({ xpos }) => xpos === "VERB") && isCompatibleVerb(args);
  return (pos.NOUN == null || !isImmediatelyPrecededByDeterminer(taggedWindow)) && headVerbLicensesAdjObject(headLemma, aftTag) && !isVerbItself && adjObjectIsRightDelimited(args);
};
var hasLaterAgreeingNoun = (tokens, index, parentNumber) => tokens.slice(index + 1).some(({ misc: { pos }, feats: { Number: Number2 } }) => pos.NOUN && (parentNumber == null || Number2 == null || parentNumber === Number2));
var isAccusativeDeterminerOfPlural = ({ foreToken: { xpos: foreTag }, token: { feats: { Case } }, aftToken: { feats: { Number: aftNumber }, misc: { pos: aftPos = {} } } }) => Case === "Acc" && foreTag === "VERB" && aftNumber === "Plur" && Object.keys(aftPos).some((xpos) => ["NOUN", "ADJ"].includes(xpos));
var determinesNominalThatCannotBeSubject = ({ tokens, index, aftToken: { feats: { PronType: aftPronType }, misc: { pos: aftPos = {} } } }) => !["Art", "Prs"].includes(String(aftPronType)) && Object.keys(aftPos).every((xpos) => ["NOUN", "ADJ"].includes(xpos)) && !canBeSubjectOfWhenTagging(tokens[index], tokens[index + 1]);
var determinesFollowingWord = (args) => {
  const { token: { feats: { PronType, Poss } }, aftToken: { xpos: aftTag, feats: { PronType: aftPronType } } } = args;
  return isAccusativeDeterminerOfPlural(args) || ["Tot", "Neg"].includes(String(PronType)) && Boolean(aftPronType) || Boolean(Poss) && ["NOUN", "ADJ"].includes(String(aftTag)) || determinesNominalThatCannotBeSubject(args);
};
var nounIsDeterminer = (args) => {
  const { tokens, index, token: { feats: { PronType, Number: Number2, NumType }, misc: { pos } } } = args;
  return PronType != null && Boolean(pos.ADJ) && !NumType && index < tokens.length - 1 && hasLaterAgreeingNoun(tokens, index, Number2) && determinesFollowingWord(args);
};
var isAdjectiveBetweenDeterminerAndNoun = ({ foreToken: { xpos: foreTag, feats: { PronType: forePronType } }, token: { feats: { NumType } }, aftToken: { xpos: aftTag, feats: { PronType: aftPronType }, misc: { pos: aftTags = {} } } }) => NumType !== "Card" && foreTag === "ADJ" && Boolean(forePronType) && aftTag === "NOUN" && !aftPronType && !aftTags.MARK;
var isAdverbModifiedPredicate = ({ foreToken: { xpos: foreTag }, token: { feats: { NumType, PronType }, misc: { isOpaque } }, aftToken: { xpos: aftTag } }) => foreTag === "ADV" && ["MARK", "END"].includes(String(aftTag)) && !NumType && !PronType && !isOpaque;
var nounIsAdjective = (args) => {
  const { token: { feats: { NumType }, misc: { pos } } } = args;
  return Boolean(pos.ADJ) && (NumType == null && isVerbsAdjObject(args) || isAdjectiveBetweenDeterminerAndNoun(args) || isAdverbModifiedPredicate(args));
};
var isAdverbNotMarker = ({ token: { misc: { pos } }, aftToken: { xpos: aftTag, feats: { Tense: aftTense }, misc: { pos: aftTags = {} } } }) => pos.ADV && (aftTense === "Past" || ["ADJ", "ADV"].includes(String(aftTag)) || Object.keys(aftTags).every((xpos) => ["ADJ", "ADV"].includes(xpos)));
var hasVerbHeadInStack = (stack, tokens, heads) => {
  const verbIndex = stack[stack.length - 1];
  let indexInStack = stack.length - 2;
  while (indexInStack >= 0) {
    const { xpos } = tokens[stack[indexInStack]];
    if (xpos === "VERB") {
      return verbsAreCompatible(tokens, heads, stack[indexInStack], verbIndex);
    }
    indexInStack -= 1;
  }
  return false;
};
var isNumberWithUnit = ({ foreToken: { feats: { NumType: foreNumType } }, token: { feats: { NumType } }, aftToken: { lemma: aftLemma, feats: { NumType: aftNumType }, misc: { isUnit: aftIsUnit } } }) => NumType === "Card" && (Boolean(aftNumType) || ["antemeridiem", "postmeridiem"].includes(aftLemma ?? "") || foreNumType === "Card" || Boolean(aftIsUnit));
var shareCapitalization = (form, otherForm) => {
  const capitalized = form != null && isCapitalizedWord(form);
  const otherCapitalized = otherForm != null && isCapitalizedWord(otherForm);
  return capitalized === otherCapitalized;
};
var nextTokenHeadsUnmarkedRelative = ({ tokens, index, aftToken: { misc: { pos: aftPos = {} }, feats: { Tense: aftTense, VerbForm: aftVerbForm } } }) => {
  const { misc: { pos: aft2Pos = {} } } = index + 2 < tokens.length ? tokens[index + 2] : END_TOKEN2;
  return Boolean(aftPos.VERB && (aftTense === "Past" || aftVerbForm === "Part") && aft2Pos.MARK);
};
var compoundNounHasNoHeadOfItsOwn = (args) => {
  const { steps, stack, heads, tokens, token: { misc: { pos } }, aftToken: { xpos: aftTag } } = args;
  return aftTag === "NOUN" || ["END", "PUNCT"].includes(String(aftTag)) && !steps.some(({ xpos }) => xpos === "VERB") || !hasVerbHeadInStack(stack, tokens, heads) && Boolean(pos.NOUN) || nextTokenHeadsUnmarkedRelative(args);
};
var isCompoundNounModifier = (args) => {
  const { foreToken: { form: foreForm, xpos: foreTag, feats: { NumType: foreNumType } }, token: { form, feats: { PronType } } } = args;
  return PronType == null && foreTag === "NOUN" && shareCapitalization(form, foreForm) && foreNumType == null && !isVerbsAdjObject(args) && compoundNounHasNoHeadOfItsOwn(args);
};
var isCompoundNounAdj = (args) => {
  const { foreToken, token, aftToken } = args;
  const isGerundBeforeBoundary = isGerund(token) && ["MARK", "END", "PUNCT", "VERB"].includes(String(aftToken.xpos));
  return isGerundBeforeBoundary || isCompoundNounModifier(args) || isNumberWithUnit({ foreToken, token, aftToken });
};
var nounIsNonRelMarker = (args) => {
  const { token: { feats: { PronType }, misc: { pos } }, taggedWindow } = args;
  if (!pos.MARK || PronType === "Rel" || isAdverbNotMarker(args) || isNumberWithUnit(args)) {
    return false;
  }
  let indexInWindow = taggedWindow.length - 1;
  while (indexInWindow >= 0) {
    const { xpos } = taggedWindow[indexInWindow];
    if (["VERB", "MARK", "PUNCT"].includes(String(xpos))) {
      return true;
    }
    if (xpos === "ADJ") {
      return false;
    }
    indexInWindow -= 1;
  }
  return false;
};
var isNonFiniteVerb = ({ xpos, feats: { Tense, VerbForm } }) => xpos === "VERB" && (Tense === "Past" || VerbForm === "Part");
var isFiniteVerb = (token) => token.xpos === "VERB" && !isNonFiniteVerb(token);
var isPrepositionOfItsOwnPhrase = ({ xpos, feats: { AdpType, ConjType } }, head) => xpos === "MARK" && Boolean(AdpType) && AdpType !== "Post" && !ConjType && !isNonFiniteVerb(head);
var nounHasLeftParent = ({ tokens, heads, taggedWindow, aftToken: { xpos: aftTag } }) => {
  if (!["ADJ", "MARK", "PUNCT", "END"].includes(String(aftTag))) {
    return false;
  }
  let indexInWindow = taggedWindow.length - 1;
  while (indexInWindow >= 0) {
    const windowToken = taggedWindow[indexInWindow];
    const { xpos, id } = windowToken;
    const head = id == null ? -2 : heads[id];
    const headToken = head === -2 ? START_TOKEN2 : tokens[head];
    if (isFiniteVerb(windowToken) || isPrepositionOfItsOwnPhrase(windowToken, headToken)) {
      return true;
    }
    if (["START", "PUNCT"].includes(String(xpos))) {
      return false;
    }
    indexInWindow -= 1;
  }
  return false;
};
var isInvalidPronounAfterNoun = ({ token, foreToken: { xpos: foreTag }, aftToken: { misc: { pos: aftTags = {} } } }) => foreTag === "NOUN" && Boolean(token.feats.PronType) && !(canOmitMarker(token) || aftTags.VERB);
var isAtStart = ({ foreToken: { xpos: foreTag } }) => foreTag === "START";
var nounIsRightDelimited = ({ foreToken: { xpos: foreTag }, aftToken: { xpos: aftTag, feats: { PunctType: aftPunctType } } }) => foreTag !== "NOUN" && (["MARK", "END"].includes(String(aftTag)) || isPhraseBoundaryType(aftPunctType));
var isCompoundTense = (taggedWindow) => {
  let indexInWindow = taggedWindow.length - 1;
  while (indexInWindow >= 0) {
    const { lemma, xpos, feats: { Mood, Tense } } = taggedWindow[indexInWindow];
    if (xpos === "VERB" && (Mood || lemma === "do" && Tense === "Past")) {
      return true;
    }
    if (["PUNCT", "MARK"].includes(String(xpos))) {
      return false;
    }
    indexInWindow -= 1;
  }
  return false;
};
var isFollowedByOwnArgument = ({ aftToken: { misc: { pos: aftPos = {} }, feats: { PronType: aftPronType, PunctType: aftPunctType } } }) => Boolean(aftPronType && aftPronType !== "Rel" || aftPunctType || aftPos.MARK);
var isGovernedByDeterminerOrPreposition = ({ tokens, stack, foreToken: { xpos: foreTag, feats: { PronType: forePronType } } }) => {
  const { feats: { AdpType: stackHeadAdpType } } = stackHeadOr(stack, tokens, START_TOKEN2, 2);
  return Boolean(forePronType && foreTag === "ADJ" || stackHeadAdpType);
};
var hasPluralOrAuxiliarySubject = ({ tokens, stack, taggedWindow, foreToken: { lemma: foreLemma, feats: { Number: foreNumber } } }) => {
  const { feats: { Number: stackHeadNumber } } = stackHeadOr(stack, tokens, START_TOKEN2, 2);
  return ["to", "not"].includes(foreLemma ?? "") || isCompoundTense(taggedWindow) || stackHeadNumber === "Plur" || foreNumber === "Plur";
};
var isInfinitiveVerb = (args) => {
  const { steps, token: { feats: { Person, Tense, VerbForm } } } = args;
  return steps.some(({ xpos }) => xpos === "VERB") && VerbForm === "Fin" && Tense === "Pres" && Person === 1 && isFollowedByOwnArgument(args) && !isGovernedByDeterminerOrPreposition(args) && hasPluralOrAuxiliarySubject(args);
};
var isModalOrPseudoAuxiliaryBeforeVerb = ({ token: { form, lemma = form.toLowerCase(), feats: { Mood } }, aftToken: { feats: { Tense: aftTense, VerbForm: aftVerbForm } } }) => (Boolean(Mood) || lemma === "do") && aftTense === "Pres" && aftVerbForm === "Fin";
var isImperative = ({ steps, token: { form, lemma }, foreToken: { xpos: foreTag }, aftToken: { feats: { Tense: aftTense } } }) => steps.some(({ xpos }) => xpos === "VERB") && form.toLowerCase() === lemma && !aftTense && ["START", "PUNCT"].includes(String(foreTag));
var isVerbAfterNominative = ({ steps, foreToken: { feats: { Case } } }) => steps.some(({ xpos }) => xpos === "VERB") && Case === "Nom";
var closesDeterminerSearch = (heads, tokens, windowToken) => {
  const { xpos, id, feats: { PronType } } = windowToken;
  if (["VERB", "MARK"].includes(String(xpos))) {
    return true;
  }
  if (xpos === "NOUN") {
    return Boolean(PronType);
  }
  if (xpos !== "PUNCT") {
    return false;
  }
  const head = heads[id];
  const isSentenceEnd = id === tokens.length - 1 || id === tokens.length - 2 && tokens[id + 1].xpos === "PUNCT";
  return head === -2 || !hasAppositivePunctuation(heads, tokens, head, isSentenceEnd);
};
var findPrecedingDeterminer = (heads, tokens, taggedWindow, parentNumber) => {
  let currentIndex = taggedWindow.length - 1;
  while (currentIndex >= 0) {
    const windowToken = taggedWindow[currentIndex];
    const { xpos, id, feats: { PronType, Number: Number2 } } = windowToken;
    if (closesDeterminerSearch(heads, tokens, windowToken)) {
      return -1;
    }
    if (xpos === "ADJ" && PronType && (!Number2 || Number2 === parentNumber)) {
      return id;
    }
    currentIndex -= 1;
  }
  return -1;
};
var isObjectComplementInfinitive = ({ heads, steps, stack, taggedWindow, tokens, token: { form, lemma, feats: { Number: Number2, Tense, VerbForm } } }) => {
  if (stack.length < 3 || !steps.some(({ xpos }) => xpos === "VERB") || Tense !== "Pres" || VerbForm !== "Fin" || lemma !== form.toLowerCase() || findPrecedingDeterminer(heads, tokens, taggedWindow, Number2) !== -1) {
    return false;
  }
  const [verb, object] = stack.slice(stack.length - 3);
  return tokens[verb].xpos === "VERB" && takesObjectComplement(tokens[verb].lemma) && tokens[object].xpos === "NOUN";
};
var isInvalidPastNoun = ({ token, taggedWindow }) => {
  const { misc: { pos }, feats: { Tense } } = token;
  if (Tense !== "Past" || !pos.VERB) {
    return false;
  }
  let indexInWindow = taggedWindow.length - 1;
  while (indexInWindow >= 0) {
    const { xpos, lemma } = taggedWindow[indexInWindow];
    if (xpos === "VERB") {
      if (["be", "have"].includes(lemma ?? "")) {
        return true;
      }
      return false;
    }
    if (["PUNCT", "MARK"].includes(String(xpos))) {
      return false;
    }
    if (xpos === "NOUN" && canBeSubjectOfWhenTagging(taggedWindow[indexInWindow], token)) {
      return true;
    }
    indexInWindow -= 1;
  }
  return false;
};
var takesTheFollowingObject = ({ heads, tokens, taggedWindow, token: { feats: { VerbForm, Number: Number2 } }, aftToken: { feats: { AdpType: aftAdpType, ConjType: aftConjType, PronType: aftPronType, NumType: aftNumType } } }) => {
  const isFollowedByDetOrPronoun = Boolean(aftPronType && aftPronType !== "Rel");
  const isUndeterminedFiniteVerb = findPrecedingDeterminer(heads, tokens, taggedWindow, Number2) === -1 && VerbForm === "Fin" && !aftNumType;
  return isFollowedByDetOrPronoun && (Boolean(aftConjType && !aftAdpType) || isUndeterminedFiniteVerb);
};
var previousWordIsNumberWithUnit = ({ tokens, index, foreToken, token }) => isNumberWithUnit({
  foreToken: index >= 2 ? tokens[index - 2] : START_TOKEN2,
  token: foreToken,
  aftToken: token
});
var isVerbWithObject = (args) => {
  const { taggedWindow, token: { misc: { pos } } } = args;
  return findLeftVerbHead(taggedWindow) == null && !isMarkerObject(taggedWindow) && Boolean(pos.VERB) && !previousWordIsNumberWithUnit(args) && takesTheFollowingObject(args);
};
var findSubjectNounInStack = (stack, tokens, token) => {
  let indexInStack = stack.length - 2;
  while (indexInStack >= 0) {
    const candidate = tokens[stack[indexInStack]];
    if (candidate.xpos === "NOUN" && canBeSubjectOfWhenTagging(candidate, token)) {
      return indexInStack;
    }
    if (!["ADV", "ADJ", "INTJ"].includes(String(candidate.xpos))) {
      return -1;
    }
    indexInStack -= 1;
  }
  return -1;
};
var isRelativizedNoun = (heads, tokens, stack, nounIndexInStack) => {
  const { xpos: nounHeadTag, feats: { PronType: nounHeadPronType } } = tokens[stack[nounIndexInStack - 1]];
  const nounIndex = stack[nounIndexInStack];
  const { feats: { PronType } } = tokens[nounIndex];
  const hasRelativeDeterminer = hasChildWithMatcher(heads, tokens, nounIndex, ({ xpos, feats: { PronType: PronType2 } }) => xpos === "ADJ" && Boolean(PronType2));
  return nounHeadTag === "MARK" && Boolean(nounHeadPronType) || nounHeadTag === "NOUN" && (PronType === "Rel" || hasRelativeDeterminer);
};
var isVerbRelativeRoot = ({ heads, stack, tokens, taggedWindow, token }) => {
  if (stack.length < 2) {
    return false;
  }
  const stackHead = stack[stack.length - 2];
  const hasNominalAfterStackHead = taggedWindow.filter(({ id }) => id > stackHead).some(({ xpos }) => ["ADJ", "NOUN"].includes(String(xpos)));
  if (hasNominalAfterStackHead) {
    return false;
  }
  const nounIndexInStack = findSubjectNounInStack(stack, tokens, token);
  return nounIndexInStack > 0 && isRelativizedNoun(heads, tokens, stack, nounIndexInStack);
};
var isImmediatelyAfterDegree2Marker = (taggedWindow) => {
  let currentIndex = taggedWindow.length - 1;
  while (currentIndex >= 0) {
    const { xpos, feats: { AdpType, ConjType } } = taggedWindow[currentIndex];
    if (["VERB", "PUNCT"].includes(String(xpos))) {
      return false;
    }
    if (xpos === "MARK") {
      return !AdpType && ConjType === "Sub";
    }
    currentIndex -= 1;
  }
  return false;
};
var isLastPossibleVerbAfterDegree2Marker = ({ taggedWindow, tokens, index }) => {
  if (!isImmediatelyAfterDegree2Marker(taggedWindow)) {
    return false;
  }
  let currentIndex = index + 1;
  while (currentIndex < tokens.length) {
    const { misc: { pos }, feats: { PunctType } } = tokens[currentIndex];
    if (pos.VERB) {
      return false;
    }
    if (isPhraseBoundaryType(PunctType)) {
      return true;
    }
    currentIndex += 1;
  }
  return true;
};
var coordinatesTwoVerbs = (tokens, heads, index, coordinator) => {
  const { xpos: headTag = "" } = tokens[heads[coordinator]] || {};
  const beforeCoordinator = tokens[coordinator - 1];
  const coordinatesANoun = beforeCoordinator != null && canStillBe(beforeCoordinator, ["NOUN"]);
  return headTag === "VERB" && !coordinatesANoun && !hasVerbLaterInClause(tokens, index);
};
var isVerbConjunct = ({ steps, tokens, stack, heads, index }) => {
  if (!steps.some(({ xpos }) => xpos === "VERB")) {
    return false;
  }
  let indexInStack = stack.length - 2;
  while (indexInStack >= 0) {
    const stackItem = stack[indexInStack];
    const { xpos, feats: { ConjType, PunctType } } = tokens[stackItem];
    if (xpos === "MARK" && ConjType === "Coor") {
      return coordinatesTwoVerbs(tokens, heads, index, stackItem);
    }
    if (xpos === "MARK" && ConjType) {
      return false;
    }
    if (xpos === "VERB" || isPhraseBoundaryType(PunctType)) {
      return false;
    }
    indexInStack -= 1;
  }
  return false;
};
var isComparativeAdjective = ({ foreToken: { feats: { Degree: foreDegree } }, token: { misc: { pos } }, aftToken: { lemma: aftLemma } }) => pos.ADJ && !foreDegree && ["then", "than"].includes(String(aftLemma));
var verbIsPrecededByNounOrAdj = (taggedWindow) => {
  let indexInWindow = taggedWindow.length - 1;
  while (indexInWindow >= 0) {
    const { xpos } = taggedWindow[indexInWindow];
    if (xpos === "ADV") {
      indexInWindow -= 1;
    } else if (["NOUN", "ADJ"].includes(String(xpos))) {
      return true;
    } else {
      return false;
    }
  }
  return false;
};
var gerundIsVerbal = ({ taggedWindow, foreToken: { feats: { Tense: foreTense } }, aftToken: { misc: { pos: aftPos = {} }, feats: { PronType: aftPronType } } }) => verbIsPrecededByNounOrAdj(taggedWindow) && foreTense === "Past" || Boolean(aftPronType) || Boolean(aftPos.MARK);
var isSentenceInitialAfterAdverbs = (tokens, index) => index === 0 || tokens.slice(0, index).every(({ xpos }) => xpos === "ADV");
var finitePastIsVerbal = ({ stack, tokens, index, taggedWindow, foreToken: { feats: { PronType: forePronType } }, aftToken: { misc: { pos: aftPos = {} }, feats: { PronType: aftPronType, VerbForm: aftVerbForm, Tense: aftTense } } }) => {
  const { xpos: stackHeadTag } = stackHeadOr(stack, tokens, START_TOKEN2, 2);
  return isSentenceInitialAfterAdverbs(tokens, index) || ["NOUN", "VERB"].includes(String(stackHeadTag)) || stackHeadTag === "MARK" && Boolean(aftPos.MARK) || Boolean(aftPronType) || aftVerbForm === "Part" || aftTense === "Past" || verbIsPrecededByNounOrAdj(taggedWindow) && forePronType !== "Art";
};
var isGerundOrPastVerb = (args) => {
  const { token, token: { misc: { pos }, feats: { Tense, VerbForm } } } = args;
  if (!pos.VERB) {
    return false;
  }
  const isFinitePast = Tense === "Past" && VerbForm !== "Part";
  return isGerund(token) && gerundIsVerbal(args) || isFinitePast && finitePastIsVerbal(args);
};
var nounIsAdverb = ({ token: { lemma }, aftToken: { xpos: aftTag } }) => aftTag === "NOUN" && isTimeModifier({ lemma });
var isNegatedDeterminer = ({ tokens, index, foreToken, token: { feats: { PronType }, misc: { pos } }, aftToken }) => Boolean(pos.ADJ) && PronType != null && ["Ind", "Tot", "Neg"].includes(PronType) && isNegator(foreToken) && !negatesVerbGroup(tokens, index - 1) && canStillBe(aftToken, ["NOUN"]);
var isPostposedDegree = ({ token, foreToken }) => token.lemma === "enough" && foreToken.xpos === "ADJ" && !foreToken.feats.PronType;
var objectControlVerbs = /* @__PURE__ */ new Set([
  "need",
  "want",
  "expect",
  "ask",
  "tell",
  "urge",
  "require",
  "allow"
]);
var followsObjectControl = ({ taggedWindow, foreToken, foreToken2 }) => {
  const governor = taggedWindow.at(-3);
  return foreToken.xpos === "MARK" && foreToken.lemma === "to" && foreToken2.xpos === "NOUN" && foreToken2.feats.Case === "Acc" && governor?.xpos === "VERB" && objectControlVerbs.has(governor.lemma ?? "");
};
var isObjectControlInfinitive = (args) => {
  const { token, steps } = args;
  return token.feats.Tense === "Pres" && token.feats.VerbForm === "Fin" && token.form.toLowerCase() === token.lemma && followsObjectControl(args) && steps.some(({ xpos }) => xpos === "VERB");
};
var isWorthGerund = ({ token, aftToken, tokens, index }) => {
  const following = tokens[index + 2];
  const isNominalContinuation = following?.misc.pos.NOUN && !following.misc.pos.VERB;
  return token.lemma === "worth" && isGerund(aftToken) && !isNominalContinuation;
};
var nounRules = [
  { id: "n-is-worth-gerund", when: isWorthGerund, features: null },
  {
    id: "n-is-object-control-infinitive",
    when: isObjectControlInfinitive,
    features: null
  },
  { id: "n-is-modal-complement", when: isModalVerbComplement, features: null },
  { id: "n-is-postposed-degree", when: isPostposedDegree, features: null },
  { id: "n-is-verb-conj", when: isVerbConjunct, features: null },
  {
    id: "n-is-last-possible-v-after-mark",
    when: isLastPossibleVerbAfterDegree2Marker,
    features: null
  },
  { id: "n-is-adv", when: nounIsAdverb, features: null },
  { id: "n-is-gerund-or-past-v", when: isGerundOrPastVerb, features: null },
  { id: "n-is-verb-with-object", when: isVerbWithObject, features: null },
  { id: "n-is-forced-relative-root", when: isVerbRelativeRoot, features: null },
  { id: "n-is-invalid-gerund", when: isInvalidGerundNoun, features: null },
  { id: "invalid-past-n", when: isInvalidPastNoun, features: null },
  {
    id: "n-is-v-after-nominative",
    when: isVerbAfterNominative,
    features: null
  },
  {
    id: "n-is-object-complement-v",
    when: isObjectComplementInfinitive,
    features: null
  },
  {
    id: "n-mod-before-v",
    when: isModalOrPseudoAuxiliaryBeforeVerb,
    features: null
  },
  { id: "n-is-infinitive", when: isInfinitiveVerb, features: null },
  { id: "n-right-headed-adv", when: isRightHeadedAdverb, features: null },
  {
    id: "invalid-n-after-pro",
    when: isInvalidNounAfterPronoun,
    features: null
  },
  { id: "n-is-negated-det", when: isNegatedDeterminer, features: null },
  { id: "n-is-det", when: nounIsDeterminer, features: null },
  { id: "n-is-adj", when: nounIsAdjective, features: null },
  { id: "n-is-marker", when: nounIsNonRelMarker, features: null },
  {
    id: "n-invalid-pro-after-n",
    when: isInvalidPronounAfterNoun,
    features: null
  },
  { id: "n-is-comp-adj", when: isComparativeAdjective, features: null },
  {
    id: "n-compound",
    when: isCompoundNoun,
    features: { parentDirection: "R" }
  },
  { id: "n-invalid-compound", when: isInvalidCompoundNoun, features: null },
  {
    id: "n-right-v-parent",
    when: nounHasRightVerbParent,
    features: { parentDirection: "R" }
  },
  {
    id: "n-right-mark-parent",
    when: nounHasRightMarkerParent,
    features: { parentDirection: "R" }
  },
  { id: "n-is-imperative-v", when: isImperative, features: null },
  { id: "n-at-start", when: isAtStart, features: { parentDirection: "R" } },
  {
    id: "n-left-parent",
    when: nounHasLeftParent,
    features: { parentDirection: "L" }
  },
  {
    id: "n-right-delimited",
    when: nounIsRightDelimited,
    features: { parentDirection: "L" }
  },
  {
    id: "n-rel-clause-mark-pronoun",
    when: isRelativeClauseMarkerPronoun,
    features: { parentDirection: "R" }
  }
];
var isIrregularPastAdjective = ({ foreToken: { xpos: foreTag }, token: { feats: { Tense, VerbForm } } }) => VerbForm === "Part" && Tense === "Past" && ["START", "ADJ"].includes(String(foreTag));
var isPrecededByHeadVerb = (taggedWindow) => {
  let indexInWindow = taggedWindow.length - 1;
  while (indexInWindow >= 0) {
    const { xpos, lemma } = taggedWindow[indexInWindow];
    if (xpos === "ADV") {
      indexInWindow -= 1;
    } else if (xpos === "VERB") {
      return ["be", "have"].includes(String(lemma));
    } else {
      return false;
    }
  }
  return false;
};
var isUnmarkedRelativeRoot = ({ foreToken: { xpos: foreTag }, token, aftToken: { misc: { pos: aftPos = {} } } }) => {
  const { misc: { pos }, feats: { Tense, VerbForm } } = token;
  return foreTag === "NOUN" && Boolean(pos.VERB) && (Tense === "Past" || VerbForm === "Part") && Boolean(aftPos.MARK);
};
var isPastAdjective = (args) => {
  const { taggedWindow, foreToken: { feats: { NumType: foreNumType, AdpType: foreAdpType, ConjType: foreConjType } }, token: { feats: { Tense }, misc: { pos } }, aftToken: { misc: { isUnit: aftIsUnit } } } = args;
  return Tense === "Past" && pos.ADJ && !(isPrecededByHeadVerb(taggedWindow) || isUnmarkedRelativeRoot(args)) && (foreAdpType != null && foreConjType == null || isVerbsAdjObject(args) || foreNumType === "Card" && Boolean(aftIsUnit));
};
var isAssignedVerbArgument = (heads, tokens, index) => {
  const head = heads[index];
  const { xpos } = tokens[index];
  return ["ADJ", "ADV", "NOUN"].includes(String(xpos)) && head >= 0 && tokens[head].xpos === "VERB";
};
var determinerHeadIsItsOwnSubject = (args, determinerHead) => {
  const { stack, tokens, heads, token, token: { misc: { pos }, feats: { VerbForm, Mood } } } = args;
  return Boolean(pos.VERB) && tokens[determinerHead].xpos === "NOUN" && (canBeSubjectOfWhenTagging(tokens[determinerHead], token) || hasVerbHeadInStack(stack, tokens, heads) || Boolean(Mood) || VerbForm === "Part");
};
var isDeterminedNoun = (args) => {
  const { taggedWindow, heads, tokens, token: { misc: { pos }, feats: { Number: Number2 } } } = args;
  const precedingDeterminer = findPrecedingDeterminer(heads, tokens, taggedWindow, Number2);
  if (!pos.NOUN || precedingDeterminer < 0) {
    return false;
  }
  const determinerHead = heads[precedingDeterminer];
  return determinerHead !== -2 && !determinerHeadIsItsOwnSubject(args, determinerHead);
};
var adjectiveOpensItsPhrase = (taggedWindow, indexInWindow) => indexInWindow > 0 && ["START", "PUNCT", "MARK"].includes(String(taggedWindow[indexInWindow - 1].xpos));
var isAfterRightADJ = (args) => {
  const { taggedWindow, heads, tokens, index } = args;
  if (isDeterminedNoun(args)) {
    return true;
  }
  let currentIndex = index - 1;
  let indexInWindow = taggedWindow.length - 1;
  while (indexInWindow >= 0) {
    const { xpos, feats: { PronType } } = taggedWindow[indexInWindow];
    if (xpos === "ADJ" && (Boolean(PronType) || adjectiveOpensItsPhrase(taggedWindow, indexInWindow) || indexInWindow > 0 && isAssignedVerbArgument(heads, tokens, currentIndex - 1))) {
      return true;
    }
    if (!["ADJ", "ADV"].includes(String(xpos))) {
      return false;
    }
    currentIndex -= 1;
    indexInWindow -= 1;
  }
  return false;
};
var isNonVerbObject = ({ foreToken: { lemma: foreLemma, xpos: foreTag, feats: { Mood: foreMood, VerbForm: foreVerbForm } }, token: { form, lemma, feats: { Tense, VerbForm, Person } } }) => Tense === "Pres" && VerbForm === "Fin" && foreTag === "VERB" && !(["go", "do"].includes(String(foreLemma)) && foreVerbForm === "Fin" || foreMood && lemma === form.toLowerCase() || Person === 1 && lemma !== form.toLowerCase());
var isMarkedRelative = (stack, tokens) => {
  let indexInStack = stack.length - 2;
  while (indexInStack > 0) {
    const index = stack[indexInStack];
    const previousIndex = stack[indexInStack - 1];
    const { xpos: previousTag, feats: { PronType: previousPronType } } = tokens[previousIndex];
    const { xpos } = tokens[index];
    if (previousTag === "MARK" && previousPronType === "Rel" && xpos === "NOUN") {
      return true;
    }
    if (xpos === "VERB") {
      return false;
    }
    indexInStack -= 1;
  }
  return false;
};
var isUnmarkedRelative = (stack, tokens) => {
  if (stack.length < 3) {
    return false;
  }
  const { xpos: secondLastTag } = tokens[stack[stack.length - 3]];
  const { xpos: lastTag, feats: { PronType: lastPronType } } = tokens[stack[stack.length - 2]];
  return canBeSubjectOfWhenTagging(tokens[stack[stack.length - 2]], tokens[stack[stack.length - 1]]) && secondLastTag === "NOUN" && lastTag === "NOUN" && lastPronType;
};
var hasNonVerbObject = ({ stack, tokens, token: { feats: { Mood, Tense } }, aftToken: { form: aftWord = "", lemma: aftLemma = "", xpos: aftTag, feats: { Tense: aftTense, VerbForm: aftVerbForm } } }) => aftTag === "VERB" && aftTense === "Pres" && aftVerbForm === "Fin" && !(Mood && aftLemma === aftWord.toLowerCase() || Tense === "Past" || isMarkedRelative(stack, tokens) || isUnmarkedRelative(stack, tokens));
var isAfterIncompatibleMarker = ({ token: { feats: { Tense, VerbForm } }, foreToken: { xpos, feats: { AdpType, ConjType } } }) => xpos === "MARK" && AdpType && !ConjType && Tense === "Pres" && VerbForm === "Fin";
var closesSingularNounSearch = (windowToken, token) => {
  const { xpos, feats: { PronType } } = windowToken;
  if (["PUNCT", "VERB", "MARK"].includes(String(xpos))) {
    return true;
  }
  return xpos === "NOUN" && (Boolean(PronType) || canBeSubjectOfWhenTagging(windowToken, token));
};
var isSingularDeterminer = ({ xpos, feats: { PronType, Number: Number2 } }, { feats: { AdpType: aftAdpType, PronType: aftPronType } }) => xpos === "ADJ" && Boolean(PronType) && (Number2 === "Sing" || Boolean(aftAdpType) || aftPronType === "Rel");
var isSingularNoun = (taggedWindow, tokens, index) => {
  const token = tokens[index];
  const aftToken = index < tokens.length - 1 ? tokens[index + 1] : END_TOKEN2;
  let indexInWindow = taggedWindow.length - 1;
  while (indexInWindow >= 0) {
    const windowToken = taggedWindow[indexInWindow];
    if (closesSingularNounSearch(windowToken, token)) {
      return false;
    }
    if (isSingularDeterminer(windowToken, aftToken)) {
      return true;
    }
    indexInWindow -= 1;
  }
  return false;
};
var isValidStandaloneGerundVerb = (taggedWindow) => {
  let currentIndex = taggedWindow.length - 1;
  while (currentIndex >= 0 && taggedWindow[currentIndex].xpos !== "START") {
    const { xpos } = taggedWindow[currentIndex];
    if (xpos === "ADV") {
      currentIndex -= 1;
    } else if (xpos === "MARK" || xpos === "PUNCT") {
      return true;
    } else {
      return false;
    }
  }
  return true;
};
var isImmediatelyPrecededByParticipleADJ = (taggedWindow) => {
  let currentIndex = taggedWindow.length - 1;
  while (currentIndex >= 0 && taggedWindow[currentIndex].xpos !== "START") {
    const { xpos, feats: { VerbForm } } = taggedWindow[currentIndex];
    if (xpos === "ADV") {
      currentIndex -= 1;
    } else if (xpos === "ADJ") {
      if (VerbForm === "Part") {
        return true;
      }
      currentIndex -= 1;
    } else {
      return false;
    }
  }
  return false;
};
var isBlockedByObjectComplementVerb = ({ stack, tokens, token }) => {
  if (stack.length < 3) {
    return false;
  }
  const { form, lemma, feats: { Tense, VerbForm } } = token;
  const isBareForm = Tense === "Pres" && VerbForm === "Fin" && lemma === form.toLowerCase();
  const [modalVerb, modalArgument] = stack.slice(stack.length - 3);
  const { lemma: modalLemma, feats: { Mood: modalMood } } = tokens[modalVerb];
  return Boolean(modalMood || isBareForm && takesObjectComplement(modalLemma)) && tokens[modalArgument].xpos === "NOUN";
};
var isGerundWithoutVerbalSupport = ({ stack, tokens, taggedWindow, token, aftToken: { misc: { pos: aftPos = {} }, feats: { PronType: aftPronType } } }) => isGerund(token) && !hasGerundVerbHeadInStack(stack, tokens, taggedWindow) && !isValidStandaloneGerundVerb(taggedWindow) && !aftPos.MARK && !aftPronType;
var disagreesWithStackSubject = ({ stack, tokens, taggedWindow, token: { feats: { Person, VerbForm, Tense } } }) => {
  const { xpos: stackHeadTag, feats: { Number: stackHeadNumber, PronType: stackHeadPronType } } = stackHeadOr(stack, tokens, UNKNOWN_TOKEN, 3);
  const isFirstPersonAfterSingularNoun = VerbForm !== "Part" && Tense !== "Past" && stackHeadTag === "NOUN" && Person === 1 && stackHeadNumber === "Sing" && !stackHeadPronType;
  return isImmediatelyPrecededByParticipleADJ(taggedWindow) || isFirstPersonAfterSingularNoun || Person === 3 && stackHeadNumber === "Plur";
};
var closesPrepositionalPhrase = ({ stack, tokens, aftToken: { xpos: aftTag } }) => {
  const { xpos: stackHeadTag, feats: { AdpType: stackHeadAdpType, ConjType: stackHeadConjType } } = stackHeadOr(stack, tokens, UNKNOWN_TOKEN, 3);
  return stackHeadTag === "MARK" && Boolean(stackHeadAdpType) && !stackHeadConjType && ["END", "PUNCT"].includes(String(aftTag));
};
var opensClauseBeforeVerb = ({ foreToken: { xpos: foreTag }, aftToken: { lemma: aftLemma, form: aftForm, misc: { pos: aftPos = {} }, feats: { Tense: aftTense, VerbForm: aftVerbForm, PronType: aftPronType } } }) => ["START", "MARK", "PUNCT"].includes(String(foreTag)) && Boolean(aftPos.VERB && aftLemma === aftForm.toLowerCase() || aftPronType === "Rel" || aftTense === "Past" || aftVerbForm === "Part");
var verbIsNoun = (args) => {
  const { taggedWindow, stack, tokens, index, token: { feats: { Number: Number2 }, misc: { pos } } } = args;
  if (!pos.NOUN || isBlockedByObjectComplementVerb(args) || isUnmarkedRelativeRoot(args)) {
    return false;
  }
  if (isGerundWithoutVerbalSupport(args)) {
    trace(() => `Verb at ${index} is gerund noun: has gerund verb in stack? ${hasGerundVerbHeadInStack(stack, tokens, taggedWindow)}; is valid standalone gerund verb? ${isValidStandaloneGerundVerb(taggedWindow)}`);
    return true;
  }
  if (disagreesWithStackSubject(args)) {
    return true;
  }
  if (Number2 === "Plur") {
    return closesPrepositionalPhrase(args) || opensClauseBeforeVerb(args);
  }
  return isSingularNoun(taggedWindow, tokens, index);
};
var followsADeterminer = (tokens, index) => {
  const { xpos: foreTag, feats: { PronType: forePronType } } = tokens[index - 1];
  return foreTag === "ADJ" && Boolean(forePronType);
};
var isPluralSubjectOfPersonalVerb = (tokens, index) => {
  const { feats: { Number: Number2 } } = tokens[index];
  const { xpos: nextTag, feats: { Person: nextPerson }, misc: { pos: nextPos = {} } } = index + 1 === tokens.length ? END_TOKEN2 : tokens[index + 1];
  return (nextTag === "VERB" || Boolean(nextPos.VERB)) && [1, 2].includes(nextPerson ?? -1) && Number2 === "Plur";
};
var hasModifiableNounAfter = (tokens, from) => {
  let currentIndex = from;
  while (currentIndex < tokens.length) {
    const { xpos, misc: { pos } } = tokens[currentIndex];
    if (["MARK", "END", "PUNCT"].includes(String(xpos))) {
      return false;
    }
    if ((xpos === "NOUN" || pos.NOUN) && (followsADeterminer(tokens, currentIndex) || isPluralSubjectOfPersonalVerb(tokens, currentIndex))) {
      return true;
    }
    currentIndex += 1;
  }
  return false;
};
var isGerundAdjective = ({ tokens, index }) => {
  const token = tokens[index];
  const { misc: { pos } } = token;
  const { feats: { PronType: aftPronType } } = index < tokens.length - 1 ? tokens[index + 1] : END_TOKEN2;
  if (!pos.ADJ || aftPronType || !isGerund(token)) {
    return false;
  }
  return hasModifiableNounAfter(tokens, index + 1);
};
var findLastDegree1Marker = (tokens, stack) => {
  let indexInStack = stack.length - 1;
  while (indexInStack >= 0) {
    const index = stack[indexInStack];
    const { xpos, feats: { AdpType, ConjType } } = tokens[index];
    if (xpos === "MARK" && AdpType && !ConjType) {
      return index;
    }
    if (["PUNCT", "VERB", "MARK"].includes(String(xpos))) {
      return -1;
    }
    indexInStack -= 1;
  }
  return -1;
};
var hasConjunction = (taggedWindow) => taggedWindow.some(({ xpos, feats: { ConjType } }) => xpos === "MARK" && ConjType);
var markerHeadHasItsOwnSubject = (tokens, stack, index, markerHead) => {
  const { xpos: markerHeadTag, feats: { Tense, VerbForm } } = tokens[markerHead];
  const hasSubjectBeforeTheHead = stack.filter((member) => member < markerHead).some((member) => tokens[member].xpos === "NOUN" && canBeSubjectOfWhenTagging(tokens[member], tokens[index]));
  return canBeSubjectOfWhenTagging(tokens[markerHead], tokens[index]) || markerHeadTag === "VERB" && (Tense === "Past" || VerbForm === "Part") && hasSubjectBeforeTheHead;
};
var hasOnlyClosedTagsAhead = (tokens, from) => {
  let currentIndex = from;
  while (currentIndex < tokens.length) {
    const pos = Object.keys(tokens[currentIndex].misc.pos);
    if (pos.includes("NOUN")) {
      return false;
    }
    if (pos.every((xpos) => ["PUNCT", "MARK", "VERB"].includes(xpos))) {
      return true;
    }
    currentIndex += 1;
  }
  return false;
};
var isInvalidVerbAfterDegree1Marker = ({ stack, heads, tokens, index, taggedWindow, token, foreToken }) => {
  const { feats: { Tense, VerbForm } } = tokens[index];
  const degree1Marker = findLastDegree1Marker(tokens, stack);
  const markerAlreadyHasANoun = degree1Marker !== -1 && hasChildWithMatcher(heads, tokens, degree1Marker, ({ xpos }) => xpos === "NOUN");
  if (foreToken.xpos === "VERB" && isBareInfinitiveComplement(token, foreToken) || degree1Marker === -1 || markerAlreadyHasANoun || hasConjunction(taggedWindow) || Tense === "Past" || VerbForm === "Part") {
    return false;
  }
  const markerHead = heads[degree1Marker];
  return markerHead === -2 ? hasOnlyClosedTagsAhead(tokens, index + 1) : !markerHeadHasItsOwnSubject(tokens, stack, index, markerHead);
};
var hasIncompatibleVerbOnTheLeft = (tokens, heads, beVerbIndex) => {
  let currentIndex = beVerbIndex - 2;
  while (currentIndex >= 0) {
    const { xpos, feats: { AdpType, ConjType, Mood } } = tokens[currentIndex];
    if (xpos === "MARK" && AdpType) {
      return true;
    }
    if (xpos === "VERB") {
      return Boolean(Mood) || !verbsAreCompatible(tokens, heads, currentIndex, beVerbIndex);
    }
    if (xpos === "MARK" && ConjType || xpos === "PUNCT") {
      return false;
    }
    currentIndex -= 1;
  }
  return false;
};
var followingClauseRejectsBeVerb = (tokens, heads, beVerbIndex) => {
  let currentIndex = beVerbIndex + 1;
  while (currentIndex < tokens.length) {
    const { xpos, feats: { PronType, PunctType } } = tokens[currentIndex];
    if (xpos === "VERB") {
      return !verbsAreCompatible(tokens, heads, beVerbIndex, currentIndex);
    }
    if (xpos === "MARK" || ["Art", "Rel"].includes(String(PronType)) || isPhraseBoundaryType(PunctType)) {
      return false;
    }
    currentIndex += 1;
  }
  return false;
};
var isPossessiveMarker = ({ tokens, heads, index: beVerbIndex, foreToken: { lemma: foreLemma, xpos: foreTag, feats: { PronType: forePronType } }, token: { lemma, feats: { AdpType } } }) => {
  const possessesAPrecedingNoun = AdpType === "Post" && lemma === "be" && beVerbIndex !== tokens.length - 1 && !["he", "she", "it"].includes(String(foreLemma)) && foreTag === "NOUN" && !["Prs", "Dem", "Rel"].includes(String(forePronType));
  return possessesAPrecedingNoun && (hasIncompatibleVerbOnTheLeft(tokens, heads, beVerbIndex) || followingClauseRejectsBeVerb(tokens, heads, beVerbIndex));
};
var hasComplexVerbHead = (stack, tokens) => {
  let indexInStack = stack.length - 2;
  while (indexInStack >= 0) {
    const index = stack[indexInStack];
    const { xpos, lemma, feats: { Tense, VerbForm, Mood } } = tokens[index];
    if (xpos === "VERB") {
      return Mood || lemma === "do" || Tense === "Pres" && VerbForm === "Fin";
    }
    indexInStack -= 1;
  }
  return false;
};
var stackHeadIsHeadlessNoun = (stack, tokens, heads) => {
  if (stack.length <= 2) {
    return false;
  }
  const stackHead = stack[stack.length - 2];
  return tokens[stackHead].xpos === "NOUN" && heads[stackHead] === -2;
};
var modifierRunEndsWithoutANoun = (tokens, from) => {
  let currentIndex = from;
  while (currentIndex < tokens.length - 1) {
    const tags = Object.keys(tokens[currentIndex].misc.pos);
    if (tags.includes("NOUN")) {
      return false;
    }
    if (!tags.some((tag2) => ["ADJ", "ADV"].includes(tag2))) {
      return true;
    }
    currentIndex += 1;
  }
  return false;
};
var isPastTenseSubject = ({ tokens, index, stack, heads, token: { misc: { pos } }, aftToken: { feats: { Tense: aftTense, VerbForm: aftVerbForm } } }) => {
  if (stackHeadIsHeadlessNoun(stack, tokens, heads) || hasComplexVerbHead(stack, tokens) || !pos.NOUN || aftTense !== "Past" || aftVerbForm === "Part") {
    return false;
  }
  return modifierRunEndsWithoutANoun(tokens, index + 2);
};
var verbRules = [
  { id: "v-is-pos-mark", when: isPossessiveMarker, features: null },
  {
    id: "v-is-invalid-after-mark-1",
    when: isInvalidVerbAfterDegree1Marker,
    features: null
  },
  { id: "v-is-noun", when: verbIsNoun, features: null },
  { id: "v-is-gerund-adj", when: isGerundAdjective, features: null },
  {
    id: "v-after-incompatible-marker",
    when: isAfterIncompatibleMarker,
    features: null
  },
  {
    id: "v-irregular-past-adj",
    when: isIrregularPastAdjective,
    features: null
  },
  { id: "v-is-past-adj", when: isPastAdjective, features: null },
  { id: "v-after-right-adj", when: isAfterRightADJ, features: null },
  { id: "v-has-non-verb-object", when: hasNonVerbObject, features: null },
  { id: "v-non-verb-object", when: isNonVerbObject, features: null },
  { id: "v-is-comp-adj", when: isComparativeAdjective, features: null },
  { id: "v-is-past-subj", when: isPastTenseSubject, features: null },
  {
    id: "v-object",
    when: isCompatibleVerb,
    features: { parentDirection: "L" }
  }
];
var isAdjChainAfterDeterminer = (taggedWindow) => {
  const lastDeterminerOffset = taggedWindow.slice().reverse().findIndex(({ xpos, feats: { PronType } }) => PronType && xpos === "ADJ");
  if (lastDeterminerOffset === -1) {
    return false;
  }
  const indexInWindow = taggedWindow.length - 1 - lastDeterminerOffset;
  const tokensAfterDeterminer = taggedWindow.slice(indexInWindow + 1);
  return tokensAfterDeterminer.every(({ xpos }) => ["ADJ", "ADV"].includes(String(xpos)));
};
var isCoordinatedDeterminer = ({ tokens, index }) => {
  const conjunction = index + 1 < tokens.length ? tokens[index + 1] : null;
  const conjunct = index + 2 < tokens.length ? tokens[index + 2] : null;
  return conjunction?.feats.ConjType === "Coor" && conjunct != null && Boolean(conjunct.feats.PronType) && canStillBe(conjunct, ["ADJ"]) && tokens.slice(index + 3).some(({ xpos, misc: { pos } }) => xpos === "NOUN" || Boolean(pos.NOUN));
};
var isHeadlessAdjective = ({ steps, taggedWindow, foreToken: { xpos: foreTag }, aftToken: { xpos: aftTag } }) => ["VERB", "MARK", "END", "PUNCT"].includes(String(aftTag)) && (steps.some(({ xpos }) => xpos === "NOUN") && (["MARK", "START"].includes(String(foreTag)) || foreTag === "PUNCT") || isAdjChainAfterDeterminer(taggedWindow));
var isDeterminer2 = ({ token: { feats: { PronType } } }) => Boolean(PronType);
var postAdjectives = ["all", "both", "each", "else"];
var isPostADJ = ({ foreToken: { xpos: foreTag, feats: { PronType: forePronType }, misc: { pos: forePosTags = {} } }, token: { form, lemma = form.toLowerCase(), misc: { pos } } }) => pos.ADJ && (foreTag === "NOUN" && (["Ind", "Tot", "Neg"].includes(String(forePronType)) && !forePosTags.ADJ || postAdjectives.includes(lemma)) || foreTag === "VERB" && !pos.ADV && !pos.NOUN);
var unmodifiableAfterTags = ["END", "MARK", "VERB", "ADV"];
var isFollowedByUnmodifiableTag = ({ aftToken: { xpos: aftTag } }) => unmodifiableAfterTags.includes(String(aftTag));
var nounPhraseIsAlreadyDetermined = ({ heads, steps, taggedWindow, tokens, token: { feats: { Number: Number2 } }, aftToken: { misc: { pos: aftPos = {} } } }) => steps.some(({ xpos }) => xpos === "NOUN") && Boolean(aftPos.MARK || aftPos.PUNCT) && findPrecedingDeterminer(heads, tokens, taggedWindow, Number2) >= 0;
var isDeterminedByPreviousWord = ({ foreToken: { xpos: foreTag, feats: { PronType: forePronType }, misc: { pos: forePosTags } } }) => Boolean(forePronType) || Boolean(foreTag === "ADJ" && forePosTags && forePosTags.ADV);
var nextWordIsUnmodifiable = (args) => {
  const { token: { feats: { NumType, PronType } }, aftToken: { feats: { PronType: aftPronType, PunctType: aftPunctType } } } = args;
  const modifiesANumber = Boolean(NumType) && (aftPunctType === "Dash" || isFollowedByUnmodifiableTag(args));
  return !PronType && Boolean(aftPronType) || nounPhraseIsAlreadyDetermined(args) || modifiesANumber || isDeterminedByPreviousWord(args) && isFollowedByUnmodifiableTag(args);
};
var isForcedPronoun = (args) => {
  const { token: { feats: { PronType }, misc: { pos } }, aftToken: { xpos: aftTag, feats: { PunctType: aftPunctType } } } = args;
  return (["MARK", "VERB", "END"].includes(String(aftTag)) || isPhraseBoundaryType(aftPunctType)) && pos.NOUN && Boolean(PronType) && !isCoordinatedDeterminer(args);
};
var isPossessiveParticleArgument = ({ token: { misc: { pos } }, aftToken: { lemma: aftLemma, feats: { AdpType: aftAdpType } } }) => aftAdpType === "Post" && aftLemma === "be" && pos.NOUN;
var skipAdjectivesToNoun = (taggedWindow) => {
  let indexInWindow = taggedWindow.length - 1;
  while (indexInWindow >= 0 && taggedWindow[indexInWindow].xpos === "ADJ") {
    indexInWindow -= 1;
  }
  return indexInWindow >= 0 && taggedWindow[indexInWindow].xpos === "NOUN" ? indexInWindow : -1;
};
var nounPhraseIsHeadedOnTheLeft = (taggedWindow, from) => {
  let indexInWindow = from;
  while (indexInWindow >= 0) {
    const { xpos, feats: { NumType } } = taggedWindow[indexInWindow];
    if (xpos === "MARK") {
      return true;
    }
    if (xpos === "VERB") {
      return false;
    }
    if (!(xpos === "ADJ" || xpos === "NOUN" && NumType !== "Card")) {
      return true;
    }
    indexInWindow -= 1;
  }
  return false;
};
var isInvalidADJAfterNoun = ({ taggedWindow, aftToken: { xpos: aftTag } }) => {
  if (!["VERB", "END"].includes(String(aftTag))) {
    return false;
  }
  const nounInWindow = skipAdjectivesToNoun(taggedWindow);
  return nounInWindow >= 0 && nounPhraseIsHeadedOnTheLeft(taggedWindow, nounInWindow);
};
var isIncompatibleInNumber = ({ token: { feats: { Number: Number2, PronType } }, index, tokens }) => {
  if (!Number2 || !PronType) {
    return false;
  }
  let currentIndex = index + 1;
  let seenDifferentNumber = false;
  while (currentIndex < tokens.length) {
    const { feats: { Number: otherNumber, PronType: PronType2 }, misc: { pos } } = tokens[currentIndex];
    if (otherNumber) {
      if (otherNumber === Number2) {
        return false;
      }
      seenDifferentNumber = true;
    }
    if (pos.VERB || pos.MARK || PronType2) {
      return seenDifferentNumber;
    }
    currentIndex += 1;
  }
  return false;
};
var lastIsADJ = ({ foreToken: { xpos: foreTag } }) => foreTag === "ADJ";
var isAdverb = ({ token: { misc: { pos } }, aftToken: { xpos: aftTag, feats: { PronType: aftPronType }, misc: { pos: aftTokenPossiblePosTags = {} } } }) => {
  const aftTags = Object.keys(aftTokenPossiblePosTags);
  return Boolean(pos.ADV) && !aftPronType && (["ADJ", "ADV"].includes(String(aftTag)) || aftTags.length > 0 && aftTags.every((xpos) => ["ADJ", "ADV"].includes(xpos)));
};
var adjIsForcedVerb = (args) => {
  if (!args.token.misc.pos.VERB) {
    return false;
  }
  return isGerundOrPastVerb(args) || isUnmarkedRelativeRoot(args) || isCompatibleVerb(args) && !isAfterRightADJ(args) && !args.steps.some(({ xpos }) => xpos === "NOUN");
};
var adjectiveRules = [
  {
    id: "adj-worth-gerund",
    when: isWorthGerund,
    features: { parentDirection: "L" }
  },
  { id: "adj-is-postposed-degree", when: isPostposedDegree, features: null },
  { id: "adj-is-adv", when: isAdverb, features: null },
  { id: "inv-adj-after-n", when: isInvalidADJAfterNoun, features: null },
  {
    id: "adj-incompatible-Number",
    when: isIncompatibleInNumber,
    features: null
  },
  { id: "adj-is-compound-noun", when: isCompoundNounAdj, features: null },
  {
    id: "adj-poss-particle-argument",
    when: isPossessiveParticleArgument,
    features: null
  },
  { id: "adj-is-forced-verb", when: adjIsForcedVerb, features: null },
  {
    id: "adj-is-verb-object",
    when: isVerbsAdjObject,
    features: { parentDirection: "L" }
  },
  { id: "adj-post-adj", when: isPostADJ, features: { parentDirection: "L" } },
  { id: "adj-is-forced-pro", when: isForcedPronoun, features: null },
  { id: "adj-headless", when: isHeadlessAdjective, features: null },
  {
    id: "adj-next-form-unmodifiable",
    when: nextWordIsUnmodifiable,
    features: null
  },
  { id: "adj-after-adj", when: lastIsADJ, features: {} },
  { id: "adj-det", when: isDeterminer2, features: { parentDirection: "R" } }
];
var isRepurposedADVAfterRightADJ = (args) => {
  const { aftToken: { misc: { pos = {} } } } = args;
  return isAfterRightADJ(args) && !pos.ADV && !pos.ADJ;
};
var advIsMarker = ({ steps, token: { feats: { AdpType, ConjType } }, aftToken }) => {
  const { xpos: aftTag, feats: { PronType: aftPronType, PunctType: aftPunctType } } = aftToken;
  return steps.some(({ xpos }) => xpos === "MARK") && (["NOUN", "ADJ"].includes(String(aftTag)) || AdpType && ConjType && !canStillBe(aftToken, ["VERB", "ADV"]) || isPhraseBoundaryType(aftPunctType) || Boolean(aftPronType));
};
var advIsNoun = ({ steps, aftToken: { xpos: aftTag, feats: { PronType: aftPronType, PunctType: aftPunctType, AdpType: aftAdpType } } }) => steps.some(({ xpos }) => xpos === "NOUN") && (aftTag === "MARK" && Boolean(aftAdpType) || isPhraseBoundaryType(aftPunctType) || Boolean(aftPronType));
var adverbIsRightDelimited = ({ aftToken: { xpos: aftTag } }) => ["PUNCT", "END"].includes(String(aftTag));
var adverbIsLeftDelimited = ({ foreToken: { xpos: foreTag } }) => ["PUNCT", "START"].includes(String(foreTag));
var advIsSubject = ({ foreToken: { xpos: foreTag }, token: { misc: { pos } }, aftToken: { xpos: aftTag } }) => aftTag === "VERB" && ["START", "PUNCT", "MARK"].includes(String(foreTag)) && pos.NOUN;
var isAdjective = ({ steps, token: { feats: { PronType } }, foreToken: { xpos: foreTag }, aftToken: { xpos: aftTag, misc: { pos: aftPos = {} } } }) => steps.some(({ xpos }) => xpos === "ADJ") && (aftTag === "NOUN" || foreTag === "NOUN" && PronType && aftPos.NOUN && !aftPos.ADJ);
var isDirectObject = ({ stack, steps, tokens, aftToken: { misc: { pos = {} } } }) => {
  if (stack.length < 2) {
    return false;
  }
  const lastStackItem = stack[stack.length - 2];
  const { xpos: lastStackTag } = tokens[lastStackItem];
  return steps.some(({ xpos }) => xpos === "NOUN") && lastStackTag === "VERB" && !pos.ADJ && !pos.ADV;
};
var adverbRules = [
  { id: "adv-is-subj", when: advIsSubject, features: null },
  { id: "adv-is-adj", when: isAdjective, features: null },
  { id: "adv-is-verb-object", when: isDirectObject, features: null },
  {
    id: "adv-after-right-adj",
    when: isRepurposedADVAfterRightADJ,
    features: null
  },
  { id: "adv-is-mark", when: advIsMarker, features: null },
  { id: "adv-is-noun", when: advIsNoun, features: null },
  { id: "adv-post-adj", when: isPostADJ, features: null },
  {
    id: "adv-is-right-delimited",
    when: adverbIsRightDelimited,
    features: { parentDirection: "L" }
  },
  {
    id: "adv-left-delimited",
    when: adverbIsLeftDelimited,
    features: { parentDirection: "R" }
  }
];
var isPostpositionAfterVerb = ({ token: { feats: { AdpType } }, foreToken: { xpos: foreTag } }) => AdpType === "Post" && foreTag === "VERB";
var isPossParticleWithoutArguments = ({ token: { lemma, feats: { AdpType } }, foreToken: { xpos: foreTag, feats: { PronType: forePronType } } }) => AdpType === "Post" && lemma === "be" && (foreTag !== "NOUN" || ["Prs", "Dem", "Rel"].includes(String(forePronType)));
var isRelativePronoun = ({ steps, foreToken: { xpos: foreTag }, token: { feats: { PronType }, misc: { pos } }, aftToken: { feats: { PronType: aftPronType, PunctType: aftPunctType }, misc: { pos: aftTags } } }) => (steps.some(({ xpos }) => xpos === "NOUN") || pos.ADJ) && PronType === "Rel" && !aftPronType && (foreTag === "MARK" || isPhraseBoundaryType(aftPunctType) || !aftTags || !["NOUN", "VERB"].includes(String(foreTag)));
var isVerbNotMarker = ({ foreToken: { xpos: foreTag }, token: { lemma, misc: { pos } }, aftToken, taggedWindow }) => {
  if (!pos.VERB) {
    return false;
  }
  if (lemma === "like") {
    const { misc: { pos: aftPos = {} } } = aftToken;
    return Boolean(aftPos.MARK) || foreTag === "ADV";
  }
  const precedingDoVerbOffset = taggedWindow.slice().reverse().findIndex(({ xpos, lemma: lemma2 }) => xpos === "VERB" && lemma2 === "do");
  if (precedingDoVerbOffset === -1) {
    return false;
  }
  const indexInWindow = taggedWindow.length - 1 - precedingDoVerbOffset;
  const tokensAfterDo = taggedWindow.slice(indexInWindow + 1);
  return tokensAfterDo.every(({ xpos }) => ["ADV"].includes(String(xpos)));
};
var isAmount = ({ token: { feats: { NumType } }, aftToken: { misc: { isUnit: aftIsUnit } } }) => NumType != null && Boolean(aftIsUnit);
var followingClauseNeedsABeVerb = (tokens, heads, beVerbIndex) => {
  let currentIndex = beVerbIndex + 1;
  while (currentIndex < tokens.length) {
    const { xpos, feats: { PronType } } = tokens[currentIndex];
    if (canStillBe(tokens[currentIndex], ["NOUN"])) {
      return false;
    }
    if (xpos === "VERB") {
      return verbsAreCompatible(tokens, heads, beVerbIndex, currentIndex);
    }
    if (xpos === "MARK" || ["Art", "Rel"].includes(String(PronType))) {
      return true;
    }
    currentIndex += 1;
  }
  return false;
};
var isBeVerbContraction = ({ tokens, heads, index: beVerbIndex, foreToken: { lemma: foreLemma, xpos: foreTag, feats: { Number: foreNumber } }, token: { lemma, feats: { AdpType } } }) => {
  const contractsABeVerb = AdpType === "Post" && lemma === "be" && beVerbIndex !== tokens.length - 1 && !(foreNumber === "Plur" && foreTag === "NOUN");
  return contractsABeVerb && (["he", "she", "it"].includes(String(foreLemma)) || followingClauseNeedsABeVerb(tokens, heads, beVerbIndex));
};
var isPrecededByDeterminedNoun = (taggedWindow) => {
  let indexInWindow = taggedWindow.length - 1;
  while (indexInWindow >= 0) {
    const { xpos, feats: { PronType } } = taggedWindow[indexInWindow];
    if (["ADV", "NOUN"].includes(String(xpos))) {
      indexInWindow -= 1;
    } else if (xpos === "ADJ") {
      if (PronType) {
        return true;
      }
      indexInWindow -= 1;
    } else {
      return false;
    }
  }
  return false;
};
var isNounNotMarker = ({ token: { misc: { pos } }, aftToken: { feats: { Tense: aftTense, VerbForm: aftVerbForm } }, taggedWindow }) => {
  if (!pos.NOUN) {
    return false;
  }
  return isPrecededByDeterminedNoun(taggedWindow) && (aftVerbForm === "Part" || aftTense === "Past" && aftVerbForm !== "Fin");
};
var markerRules = [
  { id: "mark-is-amount", when: isAmount, features: null },
  { id: "mark-is-be-verb", when: isBeVerbContraction, features: null },
  { id: "mark-is-verb", when: isVerbNotMarker, features: null },
  { id: "mark-is-noun", when: isNounNotMarker, features: null },
  { id: "mark-relative-pro", when: isRelativePronoun, features: null },
  { id: "is-adverb-not-marker", when: isAdverbNotMarker, features: null },
  { id: "mark-post-after-v", when: isPostpositionAfterVerb, features: null },
  {
    id: "mark-poss-particle-no-args",
    when: isPossParticleWithoutArguments,
    features: null
  }
];
var isIsolatedIntj = ({ foreToken: { xpos: foreTag, misc: { pos: forePosTags } }, token: { misc: { isOpaque } }, aftToken: { misc: { pos: aftPosTags } } }) => !isOpaque && (["START", "INTJ"].includes(String(foreTag)) && (!aftPosTags || aftPosTags.PUNCT || aftPosTags.INTJ) || !forePosTags || forePosTags.INTJ);
var endOfRules = { id: "end-of-rules", when: () => true, features: {} };
var forcedTag = {
  id: "forced-no-legal-tag",
  when: () => true,
  features: {}
};
var matchingRules = (rules2, args) => {
  if (!isAuditing()) {
    return [];
  }
  return rules2.reduce((matched, { id, when }) => {
    try {
      if (when(args)) {
        matched.push(id);
      }
    } catch {
      matched.push(`${id} (threw)`);
    }
    return matched;
  }, []);
};
var applyRules = (rules2, xpos, args) => {
  const { sortedPosTags, steps, hasAlternativePath, flexibleMode } = args;
  if (flexibleMode && !hasAlternativePath && steps.length === 0 && sortedPosTags.indexOf(xpos) > 0 && sortedPosTags.indexOf(xpos) === sortedPosTags.length - 1) {
    trace(() => `Tag ${xpos} forced for ${args.tokens[args.index].form}`);
    return {
      features: forcedTag.features,
      id: forcedTag.id,
      forced: true,
      matched: matchingRules(rules2, args)
    };
  }
  const { id, features } = rules2.find(({ when }) => when(args)) ?? endOfRules;
  trace(() => id);
  return { features, id, forced: false, matched: matchingRules(rules2, args) };
};
var intjRules = [
  { id: "isolated-intj", when: isIsolatedIntj, features: {} },
  { id: "no-ambiguous-intjs", when: () => true, features: null }
];
var toStepFeatures = (xpos, args) => {
  switch (xpos) {
    case "VERB":
      return applyRules(verbRules, xpos, args);
    case "NOUN":
      return applyRules(nounRules, xpos, args);
    case "MARK":
      return applyRules(markerRules, xpos, args);
    case "ADJ":
      return applyRules(adjectiveRules, xpos, args);
    case "ADV":
      return applyRules(adverbRules, xpos, args);
    case "PUNCT":
      return {
        features: null,
        id: "punct-never-in-a-chain",
        forced: false,
        matched: []
      };
    default:
      return applyRules(intjRules, xpos, args);
  }
};
var buildTaggedWindow = (tokens, id, path, windowLength = 4) => {
  const window = [];
  for (let i = id - windowLength, start = id - path.length; i < id; i += 1) {
    window.push(i < 0 ? { xpos: "START", misc: {}, feats: {} } : i < start ? tokens[i] : { ...tokens[i], ...path[i - start] });
  }
  return window;
};
var traceStepVerdict = (token, xpos, path, features) => trace(() => {
  const pathTags = path.map(({ xpos: xpos2 }) => xpos2).join("-");
  const verdict = features == null ? "can't act as" : "can act as";
  const detail = features == null ? "" : ` (features: ${JSON.stringify(features)})`;
  return `Word "${token.form}" ${verdict} "${xpos}" in "${pathTags}"${detail}`;
});
var validSteps = ({ state: { tokens, stack, heads }, index, path, hasAlternativePath, flexibleMode }) => {
  trace(() => `Find valid steps for "${tokens[index].form}" (${JSON.stringify(tokens[index])}); flexible mode? ${flexibleMode}`);
  const taggedWindow = buildTaggedWindow(tokens, index, path);
  const sortedPosTags = Object.keys(tokens[index].misc.pos).sort(tagOrder);
  const verdicts = [];
  const steps = sortedPosTags.reduce((steps2, xpos) => {
    const { features, id, forced, matched } = toStepFeatures(xpos, {
      flexibleMode,
      hasAlternativePath,
      sortedPosTags,
      tokens,
      index,
      taggedWindow,
      token: tokens[index],
      foreToken: taggedWindow[taggedWindow.length - 1],
      foreToken2: taggedWindow[taggedWindow.length - 2],
      aftToken: tokens[index + 1] || END_TOKEN2,
      stack,
      heads,
      steps: steps2
    });
    verdicts.push({
      xpos,
      rule: id,
      accepted: features != null,
      forced,
      matched
    });
    traceStepVerdict(tokens[index], xpos, path, features);
    return features == null ? steps2 : [...steps2, { index, xpos, ...features }];
  }, []);
  recordTagEvent(() => ({
    type: "judged",
    index,
    candidates: sortedPosTags,
    verdicts,
    flexibleMode
  }));
  return steps;
};
var extendSubpaths = ({ state, chain, chainIndex, path, subpaths, flexibleMode = false }) => {
  const { subpaths: extendedSubpaths } = subpaths.reduce(({ subpaths: subpaths2, steps }, subpath) => {
    const newSteps = validSteps({
      state,
      index: chain[chainIndex],
      path: [...path, ...subpath],
      hasAlternativePath: steps.length > 0,
      flexibleMode
    });
    return {
      subpaths: [...subpaths2, ...newSteps.map((step) => [...subpath, step])],
      steps: [...steps, ...newSteps]
    };
  }, { subpaths: [], steps: [] });
  return extendedSubpaths;
};
var filterSubpaths = ({ weights: weights2, tokens }, path, subpaths, chainIndex) => {
  const [firstSubpath] = subpaths;
  const { index } = firstSubpath[chainIndex];
  const { pos } = tokens[index].misc;
  const tags = subpaths.reduce((tags2, subpath) => {
    const { xpos: tagAtChainIndex } = subpath[chainIndex];
    return tags2.includes(tagAtChainIndex) ? tags2 : [...tags2, tagAtChainIndex];
  }, []).sort((tag1, tag2) => (pos[tag2] ?? 0) - (pos[tag1] ?? 0));
  if (tags.length < 2) {
    return subpaths;
  }
  const extendedPath = [...path, ...firstSubpath.slice(0, chainIndex)];
  const features = featurize_default(tokens, index, {
    path: extendedPath,
    pathTags: tags
  });
  const predictedTag = predict_default(weights2, features, tags);
  recordTagEvent(() => ({
    type: "chose",
    index,
    tags,
    predicted: predictedTag
  }));
  tokens[index].isDisambiguated = true;
  trace(() => `Prediction for token ${JSON.stringify(tokens[index])}: possible pos ${JSON.stringify(tags)}; extended path ${JSON.stringify(extendedPath)}; index ${index}; chain index ${chainIndex}; subpaths ${JSON.stringify(subpaths)}; features ${JSON.stringify(features)}; prediction ${predictedTag}`);
  return subpaths.filter((subpath) => subpath[chainIndex].xpos === predictedTag);
};
var prune = (state, path, subpaths) => {
  if (subpaths.length === 1) {
    return subpaths[0];
  }
  const [{ length: chainLength }] = subpaths;
  let filteredSubpaths = subpaths;
  let chainIndex = 0;
  trace(() => `Initial subpaths: ${JSON.stringify(filteredSubpaths)}`);
  while (filteredSubpaths.length > 1 && chainIndex < chainLength) {
    filteredSubpaths = filterSubpaths(state, path, filteredSubpaths, chainIndex);
    chainIndex += 1;
  }
  trace(() => `Filtered subpaths: ${JSON.stringify(filteredSubpaths)}`);
  const [bestSubpath] = filteredSubpaths;
  return bestSubpath;
};
var pruningLength = 3;
var greedyPath = (run, chain) => {
  const state = { ...run, tokens: run.tokens.slice() };
  let chainIndex = 0;
  let path = [];
  let subpaths = [[]];
  while (chainIndex < chain.length) {
    let extendedSubpaths = extendSubpaths({
      state,
      chain,
      chainIndex,
      path,
      subpaths
    });
    if (extendedSubpaths.length === 0) {
      extendedSubpaths = extendSubpaths({
        state,
        chain,
        chainIndex,
        path,
        subpaths,
        flexibleMode: true
      });
    }
    subpaths = extendedSubpaths;
    chainIndex += 1;
    if (chainIndex % pruningLength === 0 || chainIndex === chain.length) {
      path = [...path, ...prune(state, path, subpaths)];
      if (chainIndex !== chain.length) {
        subpaths = [[]];
      }
    }
  }
  return path;
};
var apply = (path, tokens) => {
  path.forEach(({ index, xpos, parentDirection }) => {
    tokens[index].xpos = xpos;
    if (parentDirection) {
      tokens[index].misc.parentDirection = parentDirection;
    }
  });
};
function tag_default(weights2, chain, { tokens, stack, heads }) {
  const path = greedyPath({ weights: weights2, tokens, stack, heads }, chain);
  trace(() => `Best path: ${JSON.stringify(path)}`);
  apply(path, tokens);
}
var ruleRegistry = [
  ["NOUN", nounRules],
  ["VERB", verbRules],
  ["ADJ", adjectiveRules],
  ["ADV", adverbRules],
  ["MARK", markerRules],
  ["INTJ", intjRules]
].flatMap(([tag2, rules2]) => rules2.map(({ id, features }) => ({
  id,
  tag: tag2,
  vetoes: features == null,
  features: JSON.stringify(features)
})));

// ../nlp/dist/parse/index.js
var maxConjunctParentDistance = 16;
var rootTagsOrdered = ["VERB", "NOUN", "ADJ", "ADV"];
var punctSideFinRegExp = /^[\p{Pf}\p{Pe}]$/u;
var pairs = {
  '"': '"',
  "'": "'",
  "\xAB": "\xBB",
  "\xBB": "\xAB",
  "\u2018": "\u2019",
  "\u2019": "\u2018",
  "\u201A": "\u2019",
  "\u201B": "\u2019",
  "\u201C": "\u201D",
  "\u201D": "\u201C",
  "\u201E": "\u201D",
  "\u201F": "\u201D",
  "\u2039": "\u203A",
  "\u203A": "\u2039",
  "\u2E42": "\u201D",
  "\u301D": "\u301E",
  "\u301E": "\u301D",
  "\u301F": "\u301D",
  "\uFE41": "\uFE42",
  "\uFE42": "\uFE41",
  "\uFE43": "\uFE44",
  "\uFE44": "\uFE43",
  "\uFF02": "\uFF02",
  "\uFF07": "\uFF07",
  "(": ")",
  ")": "(",
  "[": "]",
  "]": "[",
  "{": "}",
  "}": "{",
  "\u0F3A": "\u0F3B",
  "\u0F3B": "\u0F3A",
  "\u0F3C": "\u0F3D",
  "\u0F3D": "\u0F3C",
  "\u169B": "\u169C",
  "\u169C": "\u169B",
  "\u2045": "\u2046",
  "\u2046": "\u2045",
  "\u207D": "\u207E",
  "\u207E": "\u207D",
  "\u208D": "\u208E",
  "\u208E": "\u208D",
  "\u2308": "\u2309",
  "\u2309": "\u2308",
  "\u230A": "\u230B",
  "\u230B": "\u230A",
  "\u2329": "\u232A",
  "\u232A": "\u2329",
  "\u2768": "\u2769",
  "\u2769": "\u2768",
  "\u276A": "\u276B",
  "\u276B": "\u276A",
  "\u276C": "\u276D",
  "\u276D": "\u276C",
  "\u276E": "\u276F",
  "\u276F": "\u276E",
  "\u2770": "\u2771",
  "\u2771": "\u2770",
  "\u2772": "\u2773",
  "\u2773": "\u2772",
  "\u2774": "\u2775",
  "\u2775": "\u2774",
  "\u27C5": "\u27C6",
  "\u27C6": "\u27C5",
  "\u27E6": "\u27E7",
  "\u27E7": "\u27E6",
  "\u27E8": "\u27E9",
  "\u27E9": "\u27E8",
  "\u27EA": "\u27EB",
  "\u27EB": "\u27EA",
  "\u27EC": "\u27ED",
  "\u27ED": "\u27EC",
  "\u27EE": "\u27EF",
  "\u27EF": "\u27EE",
  "\u2983": "\u2984",
  "\u2984": "\u2983",
  "\u2985": "\u2986",
  "\u2986": "\u2985",
  "\u2987": "\u2988",
  "\u2988": "\u2987",
  "\u2989": "\u298A",
  "\u298A": "\u2989",
  "\u298B": "\u298C",
  "\u298C": "\u298B",
  "\u298D": "\u2990",
  "\u298E": "\u298F",
  "\u298F": "\u298E",
  "\u2990": "\u298D",
  "\u2991": "\u2992",
  "\u2992": "\u2991",
  "\u2993": "\u2994",
  "\u2994": "\u2993",
  "\u2995": "\u2996",
  "\u2996": "\u2995",
  "\u2997": "\u2998",
  "\u2998": "\u2997",
  "\u29D8": "\u29D9",
  "\u29D9": "\u29D8",
  "\u29DA": "\u29DB",
  "\u29DB": "\u29DA",
  "\u29FC": "\u29FD",
  "\u29FD": "\u29FC",
  "\u2E22": "\u2E23",
  "\u2E23": "\u2E22",
  "\u2E24": "\u2E25",
  "\u2E25": "\u2E24",
  "\u2E26": "\u2E27",
  "\u2E27": "\u2E26",
  "\u2E28": "\u2E29",
  "\u2E29": "\u2E28",
  "\u3008": "\u3009",
  "\u3009": "\u3008",
  "\u300A": "\u300B",
  "\u300B": "\u300A",
  "\u300C": "\u300D",
  "\u300D": "\u300C",
  "\u300E": "\u300F",
  "\u300F": "\u300E",
  "\u3010": "\u3011",
  "\u3011": "\u3010",
  "\u3014": "\u3015",
  "\u3015": "\u3014",
  "\u3016": "\u3017",
  "\u3017": "\u3016",
  "\u3018": "\u3019",
  "\u3019": "\u3018",
  "\u301A": "\u301B",
  "\u301B": "\u301A",
  "\uFE59": "\uFE5A",
  "\uFE5A": "\uFE59",
  "\uFE5B": "\uFE5C",
  "\uFE5C": "\uFE5B",
  "\uFE5D": "\uFE5E",
  "\uFE5E": "\uFE5D",
  "\uFF08": "\uFF09",
  "\uFF09": "\uFF08",
  "\uFF3B": "\uFF3D",
  "\uFF3D": "\uFF3B",
  "\uFF5B": "\uFF5D",
  "\uFF5D": "\uFF5B",
  "\uFF5F": "\uFF60",
  "\uFF60": "\uFF5F",
  "\uFF62": "\uFF63",
  "\uFF63": "\uFF62"
};
var endToken = {
  xpos: "END",
  feats: {},
  misc: {}
};
var startToken = {
  xpos: "START",
  feats: {},
  misc: {}
};
var tokenAfter = (tokens, index) => index + 1 < tokens.length ? tokens[index + 1] : endToken;
var isUnbrokenNounPhrase = (tokens, child, head) => child < head && tokens.slice(child, head).every(({ xpos = "" }) => ["ADJ", "NOUN"].includes(xpos));
var grandchildCanJoinTheNounPhrase = ({ xpos: grandchildTag, feats: { AdpType: grandchildAdpType } }, childTag) => grandchildTag === "NOUN" || grandchildTag === "PUNCT" || (grandchildTag === "ADJ" || grandchildTag === "ADV") && childTag === "NOUN" || grandchildTag === "MARK" && grandchildAdpType === "Post";
var isNounArgument = ({ tokens, head, child, grandchild }) => {
  const { xpos: headTag } = tokens[head];
  const { xpos: childTag = "" } = tokens[child];
  const { feats: { NumType: grandchildNumType } } = tokens[grandchild];
  return isUnbrokenNounPhrase(tokens, child, head) && headTag === "NOUN" && ["NOUN", "ADJ"].includes(childTag) && grandchildCanJoinTheNounPhrase(tokens[grandchild], childTag) && !(childTag === "NOUN" && grandchildNumType);
};
var isAdverb2 = ({ tokens, head, child, grandchild }) => {
  const { xpos: headTag } = tokens[head];
  const { xpos: childTag } = tokens[child];
  const { xpos: grandchildTag } = tokens[grandchild];
  return (headTag === "ADJ" || headTag === "ADV") && childTag === "ADV" && grandchildTag === "PUNCT";
};
var hasMatchingDelimiter = ({ heads, tokens, child, grandchild }) => heads.some((otherHead, otherGrandchild) => otherGrandchild > grandchild && otherHead === child && (tokens[grandchild].feats.PunctType === "Comm" && tokens[otherGrandchild].feats.PunctType === "Comm" || pairs[tokens[grandchild].form] === tokens[otherGrandchild].form));
var isStartingDelimiter = (inheritance) => {
  const { tokens, head, child, grandchild } = inheritance;
  return isDelimiter(tokens[grandchild]) && !punctSideFinRegExp.test(tokens[grandchild].form) && grandchild < head && grandchild < child && !hasMatchingDelimiter(inheritance);
};
var canInherit = (inheritance) => isNounArgument(inheritance) || isAdverb2(inheritance) || isStartingDelimiter(inheritance);
var isAncestor = (heads, child, ancestor) => {
  let currentAncestor = heads[child];
  while (currentAncestor >= 0 && currentAncestor !== ancestor) {
    currentAncestor = heads[currentAncestor];
  }
  return currentAncestor === ancestor;
};
var addToParse = (heads, tokens, head, child) => {
  const currentHead = heads[child];
  heads.forEach((index, grandchild) => {
    if (index === child && canInherit({ heads, tokens, head, child, grandchild })) {
      heads[grandchild] = head;
    }
  });
  if (currentHead !== -2) {
    heads[head] = currentHead;
  }
  if (head !== child && !isAncestor(heads, head, child)) {
    heads[child] = head;
  }
};
var leftArc = (childOffset) => (heads, tokens, stack) => {
  const head = stack[stack.length - 1];
  const childIndex = stack.length - childOffset - 1;
  trace(() => `L-arc from ${head} to ${stack[childIndex]}`);
  stack.splice(childIndex, childOffset).forEach((index, i) => {
    if (heads[index] === -2 || i === 0) {
      addToParse(heads, tokens, head, index);
    }
  });
};
var rightArc = (headOffset, { pop = false }) => (heads, tokens, stack) => {
  const headIndex = stack.length - headOffset - 1;
  const head = stack[headIndex];
  trace(() => `R-arc from ${head} to ${stack[stack.length - 1]}`);
  stack.splice(headIndex + 1, headOffset - 1 + (pop ? 1 : 0)).forEach((index) => {
    if (heads[index] === -2) {
      trace(() => `Adding long-right-arc child ${index} to ${head}`);
      addToParse(heads, tokens, head, index);
    }
  });
  if (!pop) {
    addToParse(heads, tokens, head, stack[stack.length - 1]);
  }
};
var assignHead = (head) => (heads, tokens, stack) => {
  trace(() => `Assign head ${head} to ${stack[stack.length - 1]}`);
  addToParse(heads, tokens, head, stack[stack.length - 1]);
};
var reduce = (_heads, _tokens, stack) => {
  trace(() => `Reduce ${stack[stack.length - 1]}`);
  stack.pop();
};
var canBeRelativePronoun = ({ xpos, feats: { Case, Poss, PronType } }) => xpos === "NOUN" && (PronType && ["Ind", "Tot", "Neg"].includes(PronType) || PronType === "Prs" && (Poss || Case === "Nom"));
var childrenOf = (id) => (heads, head, index) => {
  if (head === id) {
    heads.push(index);
  }
  return heads;
};
var hasCommaBetween = (tokens, first, second) => {
  const [start, end] = first < second ? [first, second] : [second, first];
  for (let index = start + 1; index < end; index += 1) {
    if (tokens[index].feats.PunctType === "Comm") {
      return true;
    }
  }
  return false;
};
var isMatchingDelimiterRoot = (heads, tokens, candidateRoot, closingMarker) => {
  if (tokens[closingMarker] == null) {
    return false;
  }
  const { form: closingMarkerWord } = tokens[closingMarker];
  const closingMarkerIsTerminator = isTerminator(tokens[closingMarker]);
  const children = heads.reduce(childrenOf(candidateRoot), []);
  if (children.includes(closingMarker)) {
    return false;
  }
  return children.some((openingMarker) => {
    const { form, feats: { PunctType } } = tokens[openingMarker];
    return openingMarker < closingMarker && (PunctType === "Comm" && closingMarkerIsTerminator || PunctType != null && ["Quot", "Brck"].includes(PunctType) && pairs[form] === closingMarkerWord);
  });
};
var findDelimitedClauseRootOffset = ({ heads, tokens, stack }) => {
  const currentItem = stack[stack.length - 1];
  const { feats: { PunctType } } = tokens[currentItem];
  return stack.slice().reverse().findIndex((index, offset) => {
    if (offset === 0) {
      return false;
    }
    if (PunctType === "Peri") {
      return heads[index] === -2;
    }
    return !(PunctType === "Comm" && tokens[index].feats.ConjType === "Coor") && isMatchingDelimiterRoot(heads, tokens, index, stack[stack.length - 1]);
  });
};
var hasNonDashPunctuationChild = (heads, tokens, index) => hasChildWithMatcher(heads, tokens, index, ({ feats: { PunctType } }) => PunctType != null && PunctType !== "Dash");
var findClauseLimit = (heads, tokens, reverseStack, isSentenceEnd) => reverseStack.findIndex((index, offset) => {
  if (offset === 0) {
    return false;
  }
  const { xpos, feats: { ConjType } } = tokens[index];
  const head = heads[index];
  return xpos === "MARK" && ConjType && head === -2 || xpos === "VERB" && head === -2 || hasNonDashPunctuationChild(heads, tokens, index) && !hasAppositivePunctuation(heads, tokens, index, isSentenceEnd);
});
var isDelimitedClause = (tokens, reverseStack, searchLimit) => searchLimit !== -1 && ["VERB", "MARK"].includes(tokens[reverseStack[searchLimit]].xpos ?? "X");
var isNonDelimitedPastVerb = (tokens, verb, index, isSentenceEnd) => {
  const { feats: { Tense, VerbForm } } = tokens[verb];
  return Tense === "Past" && VerbForm !== "Fin" && !isSentenceEnd && !["PUNCT", "VERB", "NOUN"].includes(tokens[index + 1].xpos ?? "X");
};
var isNominalCandidate = (tokens, subject, offset) => {
  const { xpos } = tokens[subject];
  return xpos === "NOUN" || xpos === "VERB" && isGerund(tokens[subject]) && offset > 0;
};
var isObjectOfALaterVerb = ({ tokens, reverseStack }, subject, offset) => tokens[subject].feats.Case === "Acc" && reverseStack.slice(offset).some((index) => tokens[index].xpos === "VERB");
var isEligibleSubject = (search, subject, offset) => {
  const { heads, tokens, verb, verbIsNonDelimitedPast } = search;
  const { xpos: subjectTag, feats: { PronType } } = tokens[subject];
  const isBareNounUnderAPastParticiple = verbIsNonDelimitedPast && subjectTag === "NOUN" && !PronType;
  return isNominalCandidate(tokens, subject, offset) && !isAncestor(heads, verb, subject) && !cannotBeSubjectWhenParsing(tokens, subject, verb) && !isBareNounUnderAPastParticiple && !isObjectOfALaterVerb(search, subject, offset);
};
var subjectHeadAllowsAttachment = ({ heads, tokens, isDelimited }, subject) => {
  const head = heads[subject];
  if (head === -2) {
    return true;
  }
  const { xpos: subjectHeadTag, feats: { AdpType: subjectAdpType, ConjType: subjectConjType } } = tokens[head];
  const headIsASubordinator = subjectHeadTag !== "MARK" || !subjectAdpType && subjectConjType === "Sub" || Boolean(subjectConjType && heads[head] !== -2 && tokens[heads[head]].xpos === "VERB");
  return !isGerund(tokens[head]) && isDelimited && headIsASubordinator;
};
var findSubjectOffset = ({ heads, tokens, stack, index }) => {
  const verb = stack[stack.length - 1];
  if (heads[verb] !== -2 || hasNonDashPunctuationChild(heads, tokens, verb)) {
    return -1;
  }
  const isSentenceEnd = index === tokens.length - 1;
  const reverseStack = stack.slice().reverse();
  const searchLimit = findClauseLimit(heads, tokens, reverseStack, isSentenceEnd);
  const search = {
    heads,
    tokens,
    reverseStack,
    verb,
    isDelimited: isDelimitedClause(tokens, reverseStack, searchLimit),
    verbIsNonDelimitedPast: isNonDelimitedPastVerb(tokens, verb, index, isSentenceEnd)
  };
  const searchEnd = searchLimit === -1 ? reverseStack.length : searchLimit + 1;
  return reverseStack.slice(0, searchEnd).findIndex((subject, offset) => isEligibleSubject(search, subject, offset) && subjectHeadAllowsAttachment(search, subject));
};
var punctuationStep = (args) => {
  const delimitedClauseRootOffset = findDelimitedClauseRootOffset(args);
  if (delimitedClauseRootOffset !== -1) {
    return rightArc(delimitedClauseRootOffset, { pop: true });
  }
  return null;
};
var findLeftModifierHead = (tokens, stack) => {
  const reverseStack = stack.slice().reverse();
  const verbIndex = reverseStack.findIndex((index, offset) => offset !== 0 && tokens[index].xpos === "VERB");
  if (verbIndex !== -1) {
    return verbIndex;
  }
  return reverseStack.findIndex((index, offset) => offset !== 0 && ["NOUN", "ADJ", "ADV"].includes(tokens[index].xpos ?? "X"));
};
var negatorModifiesTheMarkerAhead = ({ tokens, stack }, nextTag) => {
  const currentIndex = stack[stack.length - 1];
  return nextTag === "MARK" && isNegator(tokens[currentIndex]) && !negatesVerbGroup(tokens, currentIndex);
};
var adverbIsPartOfWhatFollows = (args, nextToken) => {
  const { heads, tokens, stack } = args;
  const currentIndex = stack[stack.length - 1];
  const { xpos: nextTag, feats: { PronType: nextPronType } } = nextToken;
  return nextTag === "ADV" || nextTag === "ADJ" && !nextPronType || isMatchingDelimiterRoot(heads, tokens, currentIndex, currentIndex + 1) || negatorModifiesTheMarkerAhead(args, nextTag);
};
var adverbModifiesTheVerbBefore = ({ tokens, stack }, nextToken) => {
  const currentIndex = stack[stack.length - 1];
  const { xpos: nextTag, misc: { pos: nextPosTags = {} } } = nextToken;
  const negatorAwaitsPredicate = isNegator(tokens[currentIndex]) && negatesVerbGroup(tokens, currentIndex) && nextTag != null && ["ADJ", "NOUN"].includes(nextTag);
  const nothingOnTheRightCanHeadIt = Boolean(nextTag && nextTag !== "VERB") || !Object.keys(nextPosTags).some((tag2) => ["VERB", "ADJ", "ADV"].includes(tag2));
  return !negatorAwaitsPredicate && nothingOnTheRightCanHeadIt;
};
var adverbModifiesTheModifierBefore = ({ heads, tokens, stack }) => {
  const lastIndex = stack[stack.length - 2];
  const { xpos: lastTag = "START", feats: { PronType: lastPronType } } = tokens[lastIndex];
  const lastIsLeftHeaded = heads[lastIndex - 1] < lastIndex - 1;
  return ["ADJ", "ADV"].includes(lastTag) && lastIsLeftHeaded && !lastPronType;
};
var adverbCompletesTheMarkerBefore = ({ heads, tokens, stack }, nextToken) => {
  const lastIndex = stack[stack.length - 2];
  const { feats: { ConjType: lastConjType } } = tokens[lastIndex];
  const { xpos: nextTag } = nextToken;
  const markerAlreadyHasObject = hasChildWithMatcher(heads, tokens, lastIndex, ({ xpos }) => xpos === "NOUN");
  const { xpos: markerHeadTag } = heads[lastIndex] < 0 ? startToken : tokens[heads[lastIndex]];
  return !markerAlreadyHasObject && (nextTag != null && ["PUNCT", "END", "MARK"].includes(nextTag) || Boolean(lastConjType && markerHeadTag === "ADV"));
};
var adverbAttachesToTheLeft = (args, nextToken) => {
  const { tokens, stack } = args;
  const { xpos: lastTag = "START" } = tokens[stack[stack.length - 2]];
  return lastTag === "VERB" && adverbModifiesTheVerbBefore(args, nextToken) || adverbModifiesTheModifierBefore(args) || lastTag === "MARK" && adverbCompletesTheMarkerBefore(args, nextToken);
};
var adverbEndsItsPhrase = ({ heads, tokens, stack }, nextTag) => {
  const currentIndex = stack[stack.length - 1];
  return nextTag != null && ["END", "MARK"].includes(nextTag) || nextTag === "PUNCT" && !hasAppositivePunctuation(heads, tokens, currentIndex);
};
var advStep = (args) => {
  const { tokens, stack } = args;
  const currentIndex = stack[stack.length - 1];
  const lastIndex = stack[stack.length - 2];
  const { xpos: lastTag = "START" } = tokens[lastIndex];
  const nextToken = tokenAfter(tokens, currentIndex);
  if (lastTag === "ADV") {
    return findNegatedVerb(tokens, lastIndex) === -1 ? leftArc(1) : null;
  }
  if (adverbIsPartOfWhatFollows(args, nextToken)) {
    return null;
  }
  if (adverbAttachesToTheLeft(args, nextToken)) {
    return rightArc(1, { pop: true });
  }
  if (!adverbEndsItsPhrase(args, nextToken.xpos)) {
    return null;
  }
  const headIndex = findLeftModifierHead(tokens, stack);
  return headIndex === -1 ? null : rightArc(headIndex, { pop: true });
};
var isModifiablePronoun = ({ feats: { PronType } }) => PronType != null && ["Ind", "Tot", "Neg"].includes(PronType);
var isNegatedQuantifier = (tokens, stack) => {
  const currentIndex = stack[stack.length - 1];
  const lastIndex = stack[stack.length - 2];
  return lastIndex === currentIndex - 1 && isModifiablePronoun(tokens[currentIndex]) && isNegator(tokens[lastIndex]) && !negatesVerbGroup(tokens, lastIndex);
};
var findObjectComplementVerbOffset = (tokens, stack) => {
  const reverseStack = stack.slice().reverse();
  const offset = reverseStack.findIndex((index, indexInStack) => indexInStack > 0 && tokens[index].xpos === "VERB");
  if (offset < 2 || !takesObjectComplement(tokens[reverseStack[offset]].lemma) || !reverseStack.slice(1, offset).every((index) => ["NOUN", "ADJ"].includes(tokens[index].xpos ?? "X"))) {
    return -1;
  }
  return offset;
};
var isCoordinatedModifier = (heads, tokens, markerIndex) => {
  const { xpos, feats: { ConjType } } = tokens[markerIndex];
  const head = heads[markerIndex];
  return xpos === "MARK" && ConjType === "Coor" && head >= 0 && tokens[head].xpos === "ADJ";
};
var adjectiveJoinsACoordination = ({ heads, tokens, stack }) => {
  const currentIndex = stack[stack.length - 1];
  const lastIndex = stack[stack.length - 2];
  return heads[currentIndex] === -2 && isCoordinatedModifier(heads, tokens, lastIndex);
};
var adjectiveModifiesWhatFollows = ({ heads, tokens, stack }, nextToken) => {
  const currentIndex = stack[stack.length - 1];
  const lastStackToken = tokens[stack[stack.length - 2]];
  const { xpos: nextTag, feats: { PronType: nextPronType }, misc: { pos: nextPosTags = {} } } = nextToken;
  const modifiesAnUntaggedNoun = !nextTag && Boolean(nextPosTags.NOUN) && !nextPronType && !isModifiablePronoun(lastStackToken);
  return heads[currentIndex] !== -2 || nextTag === "NOUN" || modifiesAnUntaggedNoun || isMatchingDelimiterRoot(heads, tokens, currentIndex, currentIndex + 1);
};
var findAdjectiveComplementVerbOffset = ({ tokens, stack }, isBeforeABoundary) => {
  const { xpos: lastTag } = tokens[stack[stack.length - 2]];
  return lastTag === "NOUN" && isBeforeABoundary ? findObjectComplementVerbOffset(tokens, stack) : -1;
};
var adjectiveIsPredicateOfNounBefore = ({ heads, tokens, stack, index }, nextToken) => {
  const currentIndex = stack[stack.length - 1];
  const lastStackToken = tokens[stack[stack.length - 2]];
  const { xpos: nextTag } = nextToken;
  return isModifiablePronoun(lastStackToken) || nextTag != null && ["PUNCT", "END"].includes(nextTag) || hasAppositivePunctuation(heads, tokens, currentIndex, index === tokens.length - 1);
};
var adjectiveIsPredicateOfVerbBefore = ({ xpos: nextTag, feats: { PronType: nextPronType } }) => nextTag != null && ["VERB", "ADV", "MARK", "PUNCT", "END"].includes(nextTag) || nextTag === "ADJ" && Boolean(nextPronType) || nextPronType === "Rel";
var adjectiveIsObjectOfMarkerBefore = (nextToken) => {
  const { xpos: nextTag } = nextToken;
  return nextTag != null && ["MARK", "END"].includes(nextTag) || isTerminator(nextToken);
};
var adjectiveAttachesToTheLeft = (args, nextToken) => {
  const { tokens, stack } = args;
  const { xpos: lastTag } = tokens[stack[stack.length - 2]];
  return lastTag === "NOUN" && adjectiveIsPredicateOfNounBefore(args, nextToken) || lastTag === "VERB" && adjectiveIsPredicateOfVerbBefore(nextToken) || lastTag === "MARK" && adjectiveIsObjectOfMarkerBefore(nextToken);
};
var popsAfterAttaching = ({ xpos: nextTag, misc: { pos: nextPosTags = {} } }) => nextTag !== "MARK" && !nextPosTags.ADV;
var adjectiveStep = (args) => {
  const { tokens, stack, index } = args;
  const { xpos: lastTag } = tokens[stack[stack.length - 2]];
  const nextToken = tokenAfter(tokens, index);
  const { xpos: nextTag } = nextToken;
  if (lastTag === "ADV") {
    return leftArc(1);
  }
  if (adjectiveJoinsACoordination(args)) {
    return rightArc(1, { pop: true });
  }
  if (adjectiveModifiesWhatFollows(args, nextToken)) {
    return null;
  }
  const isBeforeABoundary = nextTag != null && ["PUNCT", "END"].includes(nextTag);
  const complementVerbOffset = findAdjectiveComplementVerbOffset(args, isBeforeABoundary);
  if (complementVerbOffset !== -1) {
    return rightArc(complementVerbOffset, { pop: true });
  }
  if (adjectiveAttachesToTheLeft(args, nextToken)) {
    return rightArc(1, { pop: popsAfterAttaching(nextToken) });
  }
  if (!isBeforeABoundary) {
    return null;
  }
  const headIndex = findLeftModifierHead(tokens, stack);
  return headIndex === -1 ? null : rightArc(headIndex, { pop: true });
};
var findLeftVerbModifierOffset = (heads, stack, tokens, currentIndex) => {
  const head = heads[currentIndex];
  const reverseStack = stack.slice().reverse();
  const searchLimit = reverseStack.findIndex((index, offset) => offset !== 0 && (head >= 0 && index <= head || tokens[index].xpos === "VERB" && !hasAppositivePunctuation(heads, tokens, index)));
  const searchEnd = searchLimit === -1 ? reverseStack.length : searchLimit;
  return reverseStack.slice(0, searchEnd).findIndex((index, offset) => {
    if (offset === 0 || heads[index] !== -2 || isAncestor(heads, currentIndex, index)) {
      return false;
    }
    const { xpos } = tokens[index];
    return ["MARK", "ADV"].includes(xpos ?? "X") || hasAppositivePunctuation(heads, tokens, index) && xpos === "ADJ";
  });
};
var belongToTheSameClause = (tokens, heads, start, end) => {
  const separatingTokens = tokens.slice(start + 1, end);
  const delimiters = separatingTokens.reduce((delimiters2, token) => isDelimiter(token) ? [...delimiters2, token] : delimiters2, []);
  if (delimiters.length % 2 === 0) {
    return true;
  }
  if (delimiters.length === 1) {
    const [{ form: endingDelimiterWord }] = delimiters;
    return hasChildWithMatcher(heads, tokens, start, (token, index) => isDelimiter(token) && index < start && pairs[token.form] === endingDelimiterWord);
  }
  return false;
};
var findIndexAfterPreposition = (tokens, from) => {
  let currentIndex = from;
  while (currentIndex < tokens.length) {
    const { xpos, feats: { AdpType }, misc: { pos = {} } } = tokens[currentIndex];
    if ((xpos === "MARK" || pos.MARK) && AdpType) {
      return currentIndex + 1;
    }
    if (xpos !== "ADV") {
      return -1;
    }
    currentIndex += 1;
  }
  return -1;
};
var hasVerbFrom = (tokens, from) => {
  let currentIndex = from;
  while (currentIndex < tokens.length) {
    const { xpos, misc: { pos = {} } } = tokens[currentIndex];
    if (xpos === "VERB" || pos.VERB) {
      return true;
    }
    currentIndex += 1;
  }
  return false;
};
var canBeUnmarkedPastRelative = (tokens, index) => {
  if (tokens[index].feats.Tense !== "Past") {
    return false;
  }
  const afterPreposition = findIndexAfterPreposition(tokens, index + 1);
  return afterPreposition !== -1 && hasVerbFrom(tokens, afterPreposition);
};
var findVerbAfterUnmarkedRelative = (stack, tokens, heads) => {
  if (stack.length < 3) {
    return { subject: -2, relativeVerb: -2 };
  }
  const currentIndex = stack[stack.length - 1];
  const lastIndex = stack[stack.length - 2];
  const secondLastIndex = stack[stack.length - 3];
  const head = heads[currentIndex];
  const lastHead = heads[lastIndex];
  const secondLastHead = heads[secondLastIndex];
  const { xpos: lastTag, feats: { Tense: lastTense, VerbForm: lastVerbForm } } = tokens[lastIndex];
  const { xpos: secondLastTag } = tokens[secondLastIndex];
  const lastWordHasMarkedObject = heads.reduce(childrenOf(lastIndex), []).some((child) => tokens[child].xpos === "MARK");
  if (secondLastHead === -2 && lastHead === -2 && head === -2 && secondLastTag === "NOUN" && lastTag === "VERB" && (lastTense === "Past" || lastVerbForm === "Part") && lastWordHasMarkedObject) {
    return { subject: secondLastIndex, relativeVerb: lastIndex };
  }
  return { subject: -2, relativeVerb: -2 };
};
var lastNounIsAlreadyRelative = (heads, tokens, stack) => {
  if (stack.length < 3) {
    return false;
  }
  const lastStackItem = stack[stack.length - 2];
  const { feats: { PronType: lastStackItemPronType } } = tokens[lastStackItem];
  const secondLastStackItem = stack[stack.length - 3];
  const { xpos: secondLastTag, feats: { PronType: secondLastPronType } } = tokens[secondLastStackItem];
  return secondLastTag === "MARK" && secondLastPronType || secondLastTag === "NOUN" && (hasChildWithMatcher(heads, tokens, lastStackItem, ({ xpos, feats: { PronType } }) => xpos === "ADJ" && PronType != null) || lastStackItemPronType);
};
var lastVerbIsForcedHead = (heads, tokens, stack) => {
  if (stack.length < 3) {
    return false;
  }
  let indexInStack = stack.length - 3;
  while (indexInStack >= 0) {
    const index = stack[indexInStack];
    const { xpos } = tokens[index];
    const head = heads[index];
    if (xpos === "VERB" && head === -2) {
      return true;
    }
    indexInStack -= 1;
  }
  return false;
};
var isNonFinitePastForm = ({ feats: { Tense, VerbForm } }) => Tense === "Past" && VerbForm !== "Fin" || VerbForm === "Part";
var isReducedRelativeVerb = (tokens, index) => {
  const token = tokens[index];
  const { xpos, misc: { pos = {} } } = token;
  const { xpos: aftTag, misc: { pos: aftPos = {} } } = tokenAfter(tokens, index);
  const isFollowedByAMarker = ["MARK", "PUNCT", "END"].includes(aftTag ?? "X") || Boolean(aftPos.MARK);
  return (xpos === "VERB" || Boolean(pos.VERB)) && isNonFinitePastForm(token) && isFollowedByAMarker;
};
var isUnmarkedRelativeSubject = (tokens, index) => {
  let currentIndex = index + 1;
  while (currentIndex < tokens.length) {
    if (tokens[currentIndex].xpos !== "ADV") {
      return isReducedRelativeVerb(tokens, currentIndex);
    }
    currentIndex += 1;
  }
  return false;
};
var verbIsFollowedByChildVerb = (heads, tokens, index) => {
  let currentIndex = index + 1;
  while (currentIndex < tokens.length) {
    const { xpos, misc: { pos = {} } } = tokens[currentIndex];
    if (xpos === "ADV") {
      currentIndex += 1;
    } else if (xpos === "MARK") {
      return false;
    } else if ((xpos === "VERB" || pos.VERB) && verbsAreCompatible(tokens, heads, index, currentIndex)) {
      return true;
    } else {
      return false;
    }
  }
  return false;
};
var isPartOfAComplexTense = (tokens, auxiliary, rootIndex) => {
  const { lemma: auxiliaryLemma, feats: { Tense: auxiliaryTense, VerbForm: auxiliaryVerbForm } } = tokens[auxiliary];
  const { feats: { Tense, VerbForm } } = tokens[rootIndex];
  const isPerfect = auxiliaryTense === "Past" && Tense === "Past";
  const isProgressive = auxiliaryTense === "Pres" && auxiliaryVerbForm === "Fin" && Tense === "Pres" && VerbForm === "Part";
  return ["be", "have"].includes(auxiliaryLemma ?? "") && (isPerfect || isProgressive);
};
var closesTheRelativeClause = ({ xpos, feats: { PronType }, misc: { pos } }) => ["PUNCT", "NOUN"].includes(xpos ?? "X") || Boolean(PronType) || xpos == null && Boolean(pos.NOUN) && !pos.MARK;
var opensTheRelativeClause = ({ xpos, misc: { pos } }) => ["VERB", "MARK"].includes(xpos ?? "X") || xpos == null && Boolean(pos.MARK);
var relativeClauseContinues = (tokens, from) => {
  let currentIndex = from;
  while (currentIndex < tokens.length) {
    const token = tokens[currentIndex];
    if (closesTheRelativeClause(token)) {
      return false;
    }
    if (opensTheRelativeClause(token)) {
      return true;
    }
    currentIndex += 1;
  }
  return false;
};
var relativeVerbNeedsItsOwnSubject = (heads, tokens, stack, rootIndex) => {
  const hasMarkerArgument = hasChildWithMatcher(heads, tokens, rootIndex, (token, index) => token.xpos === "MARK" && index > rootIndex);
  if (hasMarkerArgument) {
    return false;
  }
  const stackWithoutNounHead = stack.filter((_item, index) => index !== stack.length - 2);
  const subjectOffset = findSubjectOffset({
    heads,
    stack: stackWithoutNounHead,
    tokens,
    index: rootIndex
  });
  return subjectOffset !== -1 || verbIsFollowedByChildVerb(heads, tokens, rootIndex);
};
var isUnmarkedRelativeRoot2 = (heads, tokens, stack, rootIndex) => {
  const rootToken = tokens[rootIndex];
  if (stack.length < 3 || !isNonFinitePastForm(rootToken)) {
    return false;
  }
  const lastStackItem = stack[stack.length - 2];
  const { xpos: lastStackTag, feats: { PronType: lastStackPronType } } = tokens[lastStackItem];
  if (lastStackTag !== "NOUN" || lastStackPronType != null) {
    return false;
  }
  if (isPartOfAComplexTense(tokens, stack[stack.length - 3], rootIndex) || !belongToTheSameClause(tokens, heads, lastStackItem, rootIndex) || relativeVerbNeedsItsOwnSubject(heads, tokens, stack, rootIndex)) {
    return false;
  }
  return rootToken.feats.VerbForm === "Part" || relativeClauseContinues(tokens, rootIndex + 1);
};
var isObjectOfAPrecedingPreposition = ({ heads, tokens, stack }) => {
  if (stack.length <= 2) {
    return false;
  }
  const lastIndex = stack[stack.length - 2];
  const secondLastIndex = stack[stack.length - 3];
  const lastHead = heads[lastIndex];
  if (tokens[lastIndex].xpos !== "NOUN" || lastHead === -2 || lastHead !== secondLastIndex) {
    return false;
  }
  const { xpos: markerTag, feats: { AdpType, ConjType } } = tokens[lastHead];
  return heads[lastHead] === -2 && markerTag === "MARK" && Boolean(AdpType) && !ConjType;
};
var isNotPartiallyDelimited = (heads, tokens, currentIndex) => !hasChildWithMatcher(heads, tokens, currentIndex, (token, index) => isDelimiter(token) && index < currentIndex) || hasChildWithMatcher(heads, tokens, currentIndex, (token, index) => isDelimiter(token) && index > currentIndex);
var findSubjectChild = (heads, tokens, currentIndex) => heads.reduce(childrenOf(currentIndex), []).find((child) => tokens[child].xpos === "NOUN" && child < currentIndex);
var isRelativeGerund = ({ tokens, stack }) => {
  const { feats: { Tense, VerbForm } } = tokens[stack[stack.length - 1]];
  return stack.length === 2 && tokens.length > 2 && VerbForm === "Part" && Tense === "Pres";
};
var isUnmarkedRelativeVerb = ({ heads, tokens, stack }, subject) => {
  const currentIndex = stack[stack.length - 1];
  const lastIndex = stack[stack.length - 2];
  const hasRelativeSubjectChild = hasChildWithMatcher(heads, tokens, currentIndex, (token, otherIndex) => otherIndex < currentIndex && canBeRelativePronoun(token));
  const subjectHasADeterminer = subject != null && hasChildWithMatcher(heads, tokens, subject, ({ xpos, feats: { PronType } }) => xpos === "ADJ" && PronType != null);
  return (hasRelativeSubjectChild || isUnmarkedRelativeRoot2(heads, tokens, stack, currentIndex) || subjectHasADeterminer) && !tokens.slice(lastIndex, currentIndex - 1).some(isTerminator);
};
var isExplicitRelativeVerb = ({ heads, tokens, stack }, isAppositiveOrNotPartiallyDelimited) => hasChildWithMatcher(heads, tokens, stack[stack.length - 1], ({ xpos, feats: { PronType } }) => xpos === "NOUN" && PronType === "Rel") && isAppositiveOrNotPartiallyDelimited;
var headsAPrecedingNoun = (args, subject, isAppositiveOrNotPartiallyDelimited) => {
  const { heads, tokens, stack } = args;
  const currentIndex = stack[stack.length - 1];
  const lastIndex = stack[stack.length - 2];
  return tokens[lastIndex].xpos === "NOUN" && heads[currentIndex] === -2 && !isAncestor(heads, currentIndex, lastIndex) && (isRelativeGerund(args) || isUnmarkedRelativeVerb(args, subject) || isExplicitRelativeVerb(args, isAppositiveOrNotPartiallyDelimited));
};
var relativeClausePops = ({ heads, tokens, stack, index }) => {
  const currentIndex = stack[stack.length - 1];
  const nextToken = tokenAfter(tokens, currentIndex);
  return hasAppositivePunctuation(heads, tokens, currentIndex, index === tokens.length - 1) || nextToken.xpos === "END" || isTerminator(nextToken);
};
var isUnmarkedPastRelativeOfPrecedingNoun = ({ heads, tokens, stack }) => {
  const currentIndex = stack[stack.length - 1];
  const lastIndex = stack[stack.length - 2];
  return tokens[lastIndex].xpos === "NOUN" && belongToTheSameClause(tokens, heads, lastIndex, currentIndex) && !lastNounIsAlreadyRelative(heads, tokens, stack) && heads[currentIndex] === -2 && !isAncestor(heads, currentIndex, lastIndex) && canBeUnmarkedPastRelative(tokens, currentIndex);
};
var verbAttachesToTheVerbBefore = ({ heads, tokens, stack, index }, subject) => {
  const currentIndex = stack[stack.length - 1];
  const lastIndex = stack[stack.length - 2];
  const hasSubjectOrCanFindOne = subject != null || findSubjectOffset({ heads, stack, tokens, index }) !== -1;
  const opensANewClause = hasSubjectOrCanFindOne && hasCommaBetween(tokens, lastIndex, currentIndex);
  const continuesTheVerbGroup = !opensANewClause && verbsAreCompatible(tokens, heads, lastIndex, currentIndex);
  const isForcedConjunct = belongToTheSameClause(tokens, heads, lastIndex, currentIndex) && subject != null && lastVerbIsForcedHead(heads, tokens, stack);
  return continuesTheVerbGroup || isForcedConjunct;
};
var verbAttachesToTheMarkerBefore = ({ tokens, stack }) => {
  const currentIndex = stack[stack.length - 1];
  const { feats: { AdpType: lastAdpType, ConjType: lastConjType } } = tokens[stack[stack.length - 2]];
  return Boolean(lastConjType || lastAdpType && isGerund(tokens[currentIndex]));
};
var verbAttachesToTheLeft = (args, subject, isAppositiveOrNotPartiallyDelimited) => {
  const { heads, tokens, stack } = args;
  const currentIndex = stack[stack.length - 1];
  const lastIndex = stack[stack.length - 2];
  const { xpos: lastTag } = tokens[lastIndex];
  return !isAncestor(heads, currentIndex, lastIndex) && heads[currentIndex] === -2 && isAppositiveOrNotPartiallyDelimited && (lastTag === "VERB" && verbAttachesToTheVerbBefore(args, subject) || lastTag === "MARK" && verbAttachesToTheMarkerBefore(args));
};
var findMissingSubjectOffset = ({ heads, stack, tokens, index }, subject) => {
  const { feats: { VerbForm } } = tokens[stack[stack.length - 1]];
  return subject == null && VerbForm !== "Part" ? findSubjectOffset({ heads, stack, tokens, index }) : -1;
};
var attachUnmarkedRelativeVerb = ({ heads, stack, tokens }) => {
  const { subject: relativeHead, relativeVerb } = findVerbAfterUnmarkedRelative(stack, tokens, heads);
  if (relativeHead < 0 || relativeVerb < 0) {
    return null;
  }
  addToParse(heads, tokens, relativeHead, relativeVerb);
  return leftArc(2);
};
var verbFallbackStep = (args, subject, isAppositiveOrNotPartiallyDelimited) => {
  const { heads, stack, tokens, index } = args;
  const currentIndex = stack[stack.length - 1];
  const lastIndex = stack[stack.length - 2];
  const subjectOffset = findMissingSubjectOffset(args, subject);
  if (subjectOffset !== -1) {
    return leftArc(subjectOffset);
  }
  const leftModifierOffset = findLeftVerbModifierOffset(heads, stack, tokens, currentIndex);
  if (leftModifierOffset !== -1 && isAppositiveOrNotPartiallyDelimited && !isAncestor(heads, currentIndex, lastIndex)) {
    return leftArc(leftModifierOffset);
  }
  const relativeTransition = attachUnmarkedRelativeVerb(args);
  if (relativeTransition != null) {
    return relativeTransition;
  }
  return index === tokens.length - 1 && heads[currentIndex] !== -2 ? reduce : null;
};
var verbStep = (args) => {
  const { heads, stack, tokens, index } = args;
  const currentIndex = stack[stack.length - 1];
  const { xpos: lastTag } = tokens[stack[stack.length - 2]];
  if (lastTag === "ADV") {
    return leftArc(1);
  }
  if (isMatchingDelimiterRoot(heads, tokens, currentIndex, currentIndex + 1)) {
    return null;
  }
  if (isObjectOfAPrecedingPreposition(args)) {
    return leftArc(2);
  }
  const isAppositiveOrNotPartiallyDelimited = isNotPartiallyDelimited(heads, tokens, currentIndex) || hasAppositivePunctuation(heads, tokens, currentIndex, index === tokens.length - 1);
  const subject = findSubjectChild(heads, tokens, currentIndex);
  if (headsAPrecedingNoun(args, subject, isAppositiveOrNotPartiallyDelimited)) {
    return rightArc(1, { pop: relativeClausePops(args) });
  }
  if (isUnmarkedPastRelativeOfPrecedingNoun(args)) {
    return null;
  }
  if (verbAttachesToTheLeft(args, subject, isAppositiveOrNotPartiallyDelimited)) {
    return rightArc(1, { pop: false });
  }
  return verbFallbackStep(args, subject, isAppositiveOrNotPartiallyDelimited);
};
var isNounConjunct = (heads, tokens, stack, index) => {
  const marker = stack[stack.length - 2];
  const { xpos: markerTag, feats: { ConjType } } = tokens[marker];
  const markerParent = heads[marker];
  if (markerParent === -2 || markerTag !== "MARK" || ConjType !== "Coor") {
    return false;
  }
  const { xpos: markerParentTag } = tokens[markerParent];
  const { feats: { ConjType: nextConjType } = { ConjType: void 0 } } = index + 1 < tokens.length ? tokens[index + 1] : { feats: {} };
  return markerParentTag === "NOUN" && nextConjType !== "Coor";
};
var isPostpositionObject = (tokens, currentIndex) => {
  const { feats: { AdpType, ConjType } = { AdpType: void 0, ConjType: void 0 } } = currentIndex + 1 < tokens.length ? tokens[currentIndex + 1] : { feats: {} };
  if (currentIndex >= tokens.length || !AdpType || ConjType) {
    return false;
  }
  let index = currentIndex + 2;
  while (index < tokens.length) {
    const { xpos } = tokens[index];
    if (xpos === "PUNCT") {
      return true;
    }
    if (xpos === "ADV") {
      index += 1;
    } else {
      return false;
    }
  }
  return true;
};
var arePartOfTheSameNoun = (tokens, start, end) => {
  const { feats: { NumType: childNumType } } = tokens[start];
  return !tokens.slice(start + 1, end).some(({ xpos = "X" }) => xpos === "ADJ" && !childNumType || ["MARK", "VERB"].includes(xpos));
};
var missingToken = {
  feats: {},
  misc: {}
};
var tokenTwoAfter = (tokens, index) => index + 2 < tokens.length ? tokens[index + 2] : missingToken;
var nounClosesAnAppositive = ({ heads, tokens, stack, index }) => {
  const currentIndex = stack[stack.length - 1];
  const lastToken = tokens[stack[stack.length - 2]];
  const { lemma, feats: { Reflex } } = tokens[currentIndex];
  return lastToken.xpos === "NOUN" && (Boolean(Reflex) || Boolean(lemma === "all" && lastToken.feats.PronType) || hasAppositivePunctuation(heads, tokens, currentIndex, index === tokens.length - 1));
};
var closesACoordinatedModifier = ({ heads, tokens, stack }) => {
  if (stack.length < 3) {
    return false;
  }
  const currentIndex = stack[stack.length - 1];
  const lastIndex = stack[stack.length - 2];
  const secondLastIndex = stack[stack.length - 3];
  const coordinationHasARightConjunct = hasChildWithMatcher(heads, tokens, lastIndex, ({ xpos }, otherIndex) => xpos === "ADJ" && otherIndex > lastIndex);
  return heads[currentIndex] === -2 && heads[secondLastIndex] === -2 && isCoordinatedModifier(heads, tokens, lastIndex) && heads[lastIndex] === secondLastIndex && coordinationHasARightConjunct && !isAncestor(heads, currentIndex, secondLastIndex);
};
var nounCanBeModified = ({ tokens, stack }) => {
  const { lemma, feats: { PronType } } = tokens[stack[stack.length - 1]];
  const { feats: { PronType: lastPronType } } = tokens[stack[stack.length - 2]];
  const isModifiableQuantifier = ["Ind", "Tot", "Neg"].includes(String(PronType)) && !["here", "there"].includes(lemma ?? "");
  return !PronType || isModifiableQuantifier || Boolean(lastPronType);
};
var adverbClosesTheNounPhrase = ({ tokens, stack }, nextToken) => {
  const lastIndex = stack[stack.length - 2];
  const { feats: { Tense } } = tokens[stack[stack.length - 1]];
  const { xpos: nextTag = "X", feats: { ConjType: nextConjType } } = nextToken;
  const secondLastToken = stack.length >= 3 ? tokens[stack[stack.length - 3]] : startToken;
  const negatorModifiesNoun = isNegator(tokens[lastIndex]) && !negatesVerbGroup(tokens, lastIndex);
  return negatorModifiesNoun || Tense === "Past" || nextConjType === "Coor" || ["END", "PUNCT"].includes(nextTag) || isTerminator(secondLastToken);
};
var isNumberWithItsUnit = ({ feats: { NumType } }, { misc: { isUnit } }) => Boolean(NumType && isUnit);
var nounJoinsTheNounBefore = ({ heads, tokens, stack, index }, nextToken) => {
  const currentIndex = stack[stack.length - 1];
  const lastIndex = stack[stack.length - 2];
  const currentToken = tokens[currentIndex];
  const lastToken = tokens[lastIndex];
  const { feats: { PronType }, misc: { isOpaque } } = currentToken;
  const isFollowedByAPostposition = nextToken.xpos === "MARK" && nextToken.feats.AdpType === "Post";
  return !isFollowedByAPostposition && !PronType && belongToTheSameClause(tokens, heads, lastIndex, currentIndex) && arePartOfTheSameNoun(tokens, lastIndex, currentIndex) && !isTimeModifier(tokens[index]) && !isTimeModifier(lastToken) && !isOpaque && !isNumberWithItsUnit(currentToken, lastToken);
};
var nounAttachesLeftward = (args, nextToken) => {
  const { heads, tokens, stack } = args;
  const currentIndex = stack[stack.length - 1];
  const lastIndex = stack[stack.length - 2];
  const lastToken = tokens[lastIndex];
  const { xpos: lastTag } = lastToken;
  const headIsPostposition = lastTag === "MARK" && lastToken.feats.AdpType === "Post";
  return !isAncestor(heads, currentIndex, lastIndex) && nounCanBeModified(args) && (lastTag === "ADJ" || lastTag === "ADV" && adverbClosesTheNounPhrase(args, nextToken) || headIsPostposition || lastTag === "NOUN" && nounJoinsTheNounBefore(args, nextToken));
};
var modifiesTheNounAfter = ({ tokens, stack }, nextToken, secondNextToken) => {
  const { feats: { PronType } } = tokens[stack[stack.length - 1]];
  const { xpos: nextTag, feats: { NumType: nextNumType, PronType: nextPronType } } = nextToken;
  const secondNextIsAPostposition = secondNextToken.xpos === "MARK" && secondNextToken.feats.AdpType === "Post";
  return nextTag === "NOUN" && !nextNumType && !PronType && !nextPronType && !secondNextIsAPostposition;
};
var countsTheUnitAfter = ({ tokens, stack }, nextToken) => {
  const { feats: { NumType } } = tokens[stack[stack.length - 1]];
  const { feats: { NumType: nextNumType }, misc: { pos: nextPosTags = {}, isUnit: nextIsUnit } } = nextToken;
  return Boolean(nextPosTags.NOUN && NumType && (nextIsUnit || nextNumType != null));
};
var nounModifiesWhatFollows = (args, nextToken, secondNextToken) => {
  const { heads, stack } = args;
  const currentIndex = stack[stack.length - 1];
  const lastIndex = stack[stack.length - 2];
  return modifiesTheNounAfter(args, nextToken, secondNextToken) || countsTheUnitAfter(args, nextToken) || isAncestor(heads, currentIndex, lastIndex) || heads[currentIndex] !== -2;
};
var nounEndsACommaList = ({ heads, tokens, stack }, nextToken, secondNextToken) => {
  const currentIndex = stack[stack.length - 1];
  const { feats: { ConjType: nextConjType, PunctType: nextPunctType } } = nextToken;
  const { xpos: secondNextTag } = secondNextToken;
  const hasACommaChild = hasChildWithMatcher(heads, tokens, currentIndex, ({ feats: { PunctType } }) => PunctType === "Comm");
  return tokens[stack[stack.length - 2]].xpos === "NOUN" && hasACommaChild && (nextConjType === "Coor" || nextPunctType === "Comm") && secondNextTag != null && !["VERB", "ADV"].includes(secondNextTag);
};
var isAtSentenceEnd = ({ tokens, index }, { feats: { PunctType: nextPunctType } }) => index === tokens.length - 1 || Boolean(index === tokens.length - 2 && nextPunctType && nextPunctType !== "Dash");
var isLeafPronoun = ({ tokens, stack }, { misc: { pos: nextPosTags = {} } }) => {
  const { feats: { Case, PronType } } = tokens[stack[stack.length - 1]];
  const aftTags = Object.keys(nextPosTags);
  return Case === "Acc" || PronType === "Prs" && !(aftTags.length > 0 && aftTags.some((xpos) => ["MARK", "VERB"].includes(xpos)));
};
var objectPops = (args, nextToken) => isAtSentenceEnd(args, nextToken) || isLeafPronoun(args, nextToken);
var conjunctionTakesTheNoun = ({ heads, tokens, stack }, nextToken) => {
  const currentIndex = stack[stack.length - 1];
  const { misc: { parentDirection } } = tokens[currentIndex];
  const { xpos: nextTag = "X", feats: { PronType: nextPronType, PunctType: nextPunctType } } = nextToken;
  return parentDirection === "L" || isNounConjunct(heads, tokens, stack, currentIndex) || ["MARK", "PUNCT", "END"].includes(nextTag) || nextPronType === "Rel" || Boolean(nextPunctType && ["Peri", "Qest", "Excl"].includes(nextPunctType));
};
var nounIsMarkerObject = (args, nextToken) => {
  const { heads, tokens, stack, index } = args;
  const currentIndex = stack[stack.length - 1];
  const lastIndex = stack[stack.length - 2];
  const { xpos: lastTag, feats: { AdpType: lastAdpType, ConjType: lastConjType } } = tokens[lastIndex];
  if (lastTag !== "MARK") {
    return false;
  }
  const markerAlreadyHasObject = hasChildWithMatcher(heads, tokens, lastIndex, ({ xpos }) => xpos === "NOUN");
  const isInTheSameClause = hasAppositivePunctuation(heads, tokens, currentIndex, index === tokens.length - 1) || belongToTheSameClause(tokens, heads, lastIndex, currentIndex);
  const licensedByTheMarker = lastAdpType && !lastConjType || lastConjType && conjunctionTakesTheNoun(args, nextToken);
  return Boolean(!markerAlreadyHasObject && isInTheSameClause && licensedByTheMarker);
};
var closesTheConjunct = ({ heads, tokens, stack }, { misc: { pos: nextPosTags = {} } }) => {
  const currentIndex = stack[stack.length - 1];
  return isNounConjunct(heads, tokens, stack, currentIndex) && !Object.keys(nextPosTags).some((xpos) => ["MARK", "NOUN"].includes(xpos)) && !isUnmarkedRelativeSubject(tokens, currentIndex);
};
var isBeforeAPostposition = (nextTag, secondNextToken) => nextTag === "NOUN" && secondNextToken.xpos === "MARK" && secondNextToken.feats.AdpType === "Post";
var isBeforeAnAttachedVerb = ({ heads, tokens, stack }, nextTag) => {
  const currentIndex = stack[stack.length - 1];
  const lastHead = heads[stack[stack.length - 2]];
  return nextTag === "VERB" && lastHead >= 0 && !isUnmarkedRelativeSubject(tokens, currentIndex);
};
var markerObjectPops = (args, nextToken, secondNextToken) => {
  const { xpos: nextTag = "X" } = nextToken;
  return objectPops(args, nextToken) || closesTheConjunct(args, nextToken) || isBeforeAPostposition(nextTag, secondNextToken) || nextTag === "ADV" || isBeforeAnAttachedVerb(args, nextTag);
};
var verbCanTakeTheObject = ({ heads, tokens, stack }, nextToken) => {
  const currentIndex = stack[stack.length - 1];
  const lastIndex = stack[stack.length - 2];
  const lastHead = heads[lastIndex];
  const { feats: { VerbForm: lastVerbForm, Tense: lastTense } } = tokens[lastIndex];
  const { feats: { Case } } = tokens[currentIndex];
  const { xpos: nextTag = "X", misc: { pos: nextPosTags = {} } } = nextToken;
  const isGerundArgument = lastVerbForm === "Part" && lastTense === "Pres";
  return lastHead >= 0 && tokens[lastHead].xpos === "NOUN" || Case === "Acc" || nextTag !== "VERB" || !nextPosTags.VERB || isGerundArgument;
};
var nounIsVerbObject = (args, nextToken) => {
  const { heads, tokens, stack } = args;
  const currentIndex = stack[stack.length - 1];
  const lastIndex = stack[stack.length - 2];
  const { feats: { Case } } = tokens[currentIndex];
  return tokens[lastIndex].xpos === "VERB" && Case !== "Nom" && belongToTheSameClause(tokens, heads, lastIndex, currentIndex) && !isPostpositionObject(tokens, currentIndex) && verbCanTakeTheObject(args, nextToken);
};
var nextIsANoun = ({ xpos: nextTag = "X", misc: { pos: nextPosTags = {} } }) => nextTag === "NOUN" || Boolean(nextPosTags.NOUN);
var nounIsSecondObjectOfVerb = ({ heads, tokens, stack }, nextToken) => {
  if (stack.length < 3) {
    return false;
  }
  const currentIndex = stack[stack.length - 1];
  const lastIndex = stack[stack.length - 2];
  const secondLastIndex = stack[stack.length - 3];
  const lastWordHasDeterminer = hasChildWithMatcher(heads, tokens, lastIndex, ({ xpos, feats: { PronType } }, otherIndex) => otherIndex < lastIndex && xpos === "ADJ" && PronType != null);
  return tokens[secondLastIndex].xpos === "VERB" && tokens[lastIndex].xpos === "NOUN" && belongToTheSameClause(tokens, heads, secondLastIndex, currentIndex) && !nextIsANoun(nextToken) && !lastWordHasDeterminer;
};
var headTagOf = (heads, tokens, index) => {
  const head = heads[index] || -2;
  return head === -2 ? "START" : tokens[head].xpos;
};
var nounIsObjectOfMarkedVerb = ({ heads, tokens, stack }, nextToken) => {
  if (stack.length < 4) {
    return false;
  }
  const currentIndex = stack[stack.length - 1];
  const lastIndex = stack[stack.length - 2];
  const secondLastIndex = stack[stack.length - 3];
  const thirdLastIndex = stack[stack.length - 4];
  return tokens[thirdLastIndex].xpos === "VERB" && headTagOf(heads, tokens, thirdLastIndex) !== "VERB" && tokens[secondLastIndex].xpos === "MARK" && tokens[lastIndex].xpos === "NOUN" && belongToTheSameClause(tokens, heads, thirdLastIndex, currentIndex) && !hasNonDashPunctuationChild(heads, tokens, currentIndex) && !nextIsANoun(nextToken);
};
var nounAttachesRightward = (args, nextToken, secondNextToken) => {
  if (nounEndsACommaList(args, nextToken, secondNextToken)) {
    return rightArc(1, { pop: true });
  }
  if (nounIsMarkerObject(args, nextToken)) {
    return rightArc(1, {
      pop: markerObjectPops(args, nextToken, secondNextToken)
    });
  }
  const pop = objectPops(args, nextToken);
  if (nounIsVerbObject(args, nextToken)) {
    return rightArc(1, { pop });
  }
  if (nounIsSecondObjectOfVerb(args, nextToken)) {
    return rightArc(2, { pop });
  }
  if (nounIsObjectOfMarkedVerb(args, nextToken)) {
    return rightArc(3, { pop });
  }
  return null;
};
var nounStep = (args) => {
  const { tokens, stack } = args;
  const currentIndex = stack[stack.length - 1];
  const nextToken = tokenAfter(tokens, currentIndex);
  const secondNextToken = tokenTwoAfter(tokens, currentIndex);
  if (nounClosesAnAppositive(args)) {
    return rightArc(1, { pop: true });
  }
  if (closesACoordinatedModifier(args)) {
    return leftArc(2);
  }
  if (nounAttachesLeftward(args, nextToken)) {
    return leftArc(1);
  }
  if (nounModifiesWhatFollows(args, nextToken, secondNextToken)) {
    return null;
  }
  return nounAttachesRightward(args, nextToken, secondNextToken);
};
var findVerbConjunct = (tokens, object, candidateParents) => {
  const { feats: { Tense, VerbForm } } = tokens[object];
  const exactTenseMatch = candidateParents.findIndex((candidate) => tokens[candidate].xpos === "VERB" && (tokens[candidate].feats.Tense === "Past" && Tense === "Past" || tokens[candidate].feats.Tense === Tense && tokens[candidate].feats.VerbForm === VerbForm));
  if (exactTenseMatch !== -1) {
    return exactTenseMatch + 1;
  }
  const partialTenseMatch = candidateParents.findIndex((candidate) => tokens[candidate].xpos === "VERB" && tokens[candidate].feats.VerbForm === VerbForm);
  return partialTenseMatch === -1 ? -1 : partialTenseMatch + 1;
};
var conjunctTagsOf = (pos, index) => Object.keys(pos).filter((tag2) => ["VERB", "NOUN", "ADJ", "ADV"].includes(tag2)).map((xpos) => ({ index, xpos }));
var toCandidates = (tokens, currentIndex) => {
  let index = currentIndex + 1;
  const candidates2 = [];
  while (index < tokens.length) {
    const { xpos, feats: { ConjType }, misc: { pos } } = tokens[index];
    if (xpos === "PUNCT" || ConjType) {
      return candidates2;
    }
    if (xpos === "VERB") {
      candidates2.push({ index, xpos: "VERB" });
      return candidates2;
    }
    if (pos.VERB) {
      candidates2.push({ index, xpos: "VERB" });
    }
    if (!candidates2.some(({ xpos: otherTag }) => otherTag === xpos)) {
      candidates2.push(...conjunctTagsOf(pos, index));
    }
    index += 1;
  }
  return candidates2;
};
var nextWordAgreesWithTheFirstParent = ({ heads, tokens, currentIndex, candidates: candidates2, candidateParents }) => {
  const [firstParent] = candidateParents;
  const { xpos: parentTag, feats: { Number: parentNumber } } = tokens[firstParent];
  const parentHead = heads[firstParent];
  const parentIsBeVerbArgument = parentTag === "ADJ" && parentHead !== -2 && tokens[parentHead].lemma === "be";
  return candidates2.some(({ index, xpos }) => index === currentIndex + 1 && xpos === "NOUN" && (parentTag === "NOUN" || parentIsBeVerbArgument) && tokens[index].feats.Number === parentNumber);
};
var nextWordModifiesTheFirstParent = ({ tokens, currentIndex, candidates: candidates2, candidateParents }) => {
  const [firstParent] = candidateParents;
  const { xpos: parentTag } = tokens[firstParent];
  const nextCandidate = candidates2.find(({ index }) => index === currentIndex + 1);
  const nextIsUnrecognisedNoun = nextCandidate?.xpos === "NOUN" && Object.keys(tokens[currentIndex + 1].misc.pos ?? {}).length === 1;
  return parentTag === "ADJ" && (nextCandidate?.xpos === "ADJ" || nextIsUnrecognisedNoun);
};
var findFirstParentOffset = (coordination) => {
  if (coordination.candidateParents.length === 0) {
    return -1;
  }
  return nextWordAgreesWithTheFirstParent(coordination) || nextWordModifiesTheFirstParent(coordination) ? 1 : -1;
};
var findVerbConjunctOffset = ({ tokens, candidates: candidates2, candidateParents }) => {
  const verbCandidates = candidates2.filter(({ xpos }) => xpos === "VERB");
  let indexInVerbCandidates = 0;
  while (indexInVerbCandidates < verbCandidates.length) {
    const verbConjunct = findVerbConjunct(tokens, verbCandidates[indexInVerbCandidates].index, candidateParents);
    if (verbConjunct !== -1) {
      return verbConjunct;
    }
    indexInVerbCandidates += 1;
  }
  return -1;
};
var findNounConjunctOffset = ({ tokens, candidates: candidates2, candidateParents }) => {
  if (!candidates2.some(({ xpos }) => xpos === "NOUN")) {
    return -1;
  }
  const nounParent = candidateParents.findIndex((candidate) => tokens[candidate].xpos === "NOUN");
  if (nounParent !== -1) {
    return nounParent + 1;
  }
  const verbParent = candidateParents.findIndex((candidate) => tokens[candidate].xpos === "VERB");
  return verbParent === -1 ? 1 : verbParent + 1;
};
var findModifierConjunctOffset = ({ tokens, candidates: candidates2, candidateParents }) => {
  if (!candidates2.some(({ xpos }) => ["ADJ", "ADV"].includes(xpos))) {
    return -1;
  }
  const modifierParent = candidateParents.findIndex((candidate) => ["ADJ", "ADV"].includes(tokens[candidate].xpos ?? "X"));
  return modifierParent === -1 ? 1 : modifierParent + 1;
};
var conjunctStages = [
  findFirstParentOffset,
  findVerbConjunctOffset,
  findNounConjunctOffset,
  findModifierConjunctOffset
];
var getConjunct = (heads, stack, tokens, currentIndex) => {
  const candidates2 = toCandidates(tokens, currentIndex);
  if (candidates2.length === 0) {
    const { xpos: nextTag } = tokens[currentIndex + 1] || {};
    return nextTag === "PUNCT" && currentIndex < tokens.length - 2 ? -1 : 1;
  }
  const candidateParents = stack.slice(0, stack.length - 1).reverse().filter((parent) => currentIndex - parent < maxConjunctParentDistance);
  const coordination = {
    heads,
    tokens,
    currentIndex,
    candidates: candidates2,
    candidateParents
  };
  const offset = conjunctStages.reduce((found, stage) => found === -1 ? stage(coordination) : found, -1);
  return offset === -1 ? 1 : offset;
};
var findDegree2Parent = (stack, tokens) => {
  const { feats: { PronType } } = tokens[stack[stack.length - 1]];
  const candidates2 = stack.slice(0, stack.length - 1).reverse();
  if (PronType === "Rel") {
    const candidateHeadOffset = candidates2.findIndex((candidate) => ["VERB", "NOUN"].includes(tokens[candidate].xpos ?? "X"));
    return candidateHeadOffset === -1 ? -1 : candidateHeadOffset + 1;
  }
  const verbOffset = candidates2.findIndex((candidate) => tokens[candidate].xpos === "VERB");
  return verbOffset === -1 ? -1 : verbOffset + 1;
};
var findDegree0Parent = (heads, stack, tokens, index) => {
  const { lemma, feats: { ConjType } } = tokens[index];
  if (ConjType === "Coor") {
    return getConjunct(heads, stack, tokens, index);
  }
  const isSentenceEnd = index === tokens.length - 1;
  const lastWordIsLeftDelimited = stack.length >= 2 && hasChildWithMatcher(heads, tokens, stack[stack.length - 2], (token, otherIndex) => isDelimiter(token) && otherIndex < index) && !hasAppositivePunctuation(heads, tokens, stack[stack.length - 2], isSentenceEnd);
  if (lemma === "to" || lastWordIsLeftDelimited) {
    return 1;
  }
  if (hasChildWithMatcher(heads, tokens, index, ({ feats: { PunctType } }) => PunctType !== "Dash") || isFollowedByClause(tokens, index)) {
    const verbOffset = stack.slice(0, stack.length - 1).reverse().findIndex((candidate) => tokens[candidate].xpos === "VERB");
    if (verbOffset !== -1) {
      return verbOffset + 1;
    }
    const nonVerbHead = stack.slice(0, stack.length - 1).reverse().findIndex((candidate) => ["NOUN", "ADJ", "ADV"].includes(tokens[candidate].xpos ?? "X"));
    return nonVerbHead === -1 ? -1 : nonVerbHead + 1;
  }
  return 1;
};
var findDegree1Parent = (heads, stack, tokens, index) => {
  const [parent, marker] = stack.slice(stack.length - 2);
  const { xpos: parentTag } = tokens[parent];
  const markerHasLeftDelimiter = heads.some((head, child) => {
    const { feats: { PunctType } } = tokens[child];
    return head === marker && PunctType != null && PunctType !== "Dash";
  });
  const { xpos: nextTag = "" } = tokens[index + 1] || { xpos: "END" };
  return parentTag === "VERB" && !(markerHasLeftDelimiter && ["END", "PUNCT"].includes(nextTag)) || parentTag === "NOUN" && !markerHasLeftDelimiter || parentTag === "ADJ" && !markerHasLeftDelimiter ? 1 : -1;
};
var degreeQuantifiers = ["more", "most", "less", "least", "fewer", "fewest"];
var isComparativeCorrelate = (heads, tokens, index) => {
  if (index < 0) {
    return false;
  }
  const { form, xpos } = tokens[index];
  if (!["ADJ", "ADV", "NOUN"].includes(xpos ?? "X")) {
    return false;
  }
  if (degreeQuantifiers.includes(form.toLowerCase())) {
    return true;
  }
  const head = heads[index];
  if (head < 0) {
    return false;
  }
  const { lemma: headLemma, xpos: headTag, feats: { ConjType: headConjType } } = tokens[head];
  return headTag === "MARK" && headConjType === "Comp" && headLemma === "as";
};
var findMarkerParentOffset = (heads, stack, tokens, index) => {
  const tDeg = translativeDegree(tokens[index]);
  return tDeg === 2 ? findDegree2Parent(stack, tokens) : tDeg === 1 ? findDegree1Parent(heads, stack, tokens, index) : findDegree0Parent(heads, stack, tokens, index);
};
var isRightDelimitedMarker = ({ tokens, stack }, nextToken) => {
  const { feats: { AdpType, ConjType } } = tokens[stack[stack.length - 1]];
  const { xpos: nextTag, feats: { AdpType: nextAdpType, ConjType: nextConjType } } = nextToken;
  return Boolean(nextTag === "END" || isTerminator(nextToken) || AdpType && !ConjType && nextAdpType && !nextConjType);
};
var markerFollowsAVerbObject = ({ tokens, stack }, nextToken) => {
  const { feats: { PronType: lastPronType, Case: lastCase } } = tokens[stack[stack.length - 2]];
  const { xpos: secondLastTag } = tokens[stack[stack.length - 3]];
  const { xpos: nextTag, misc: { pos: nextPosTags = {} } } = nextToken;
  return secondLastTag === "VERB" && (lastPronType === "Dem" || lastCase === "Acc") || nextTag != null && ["MARK", "PUNCT", "END"].includes(nextTag) || Boolean(nextPosTags.MARK && !nextPosTags.ADJ);
};
var markerClosesAVerbObject = (args, nextToken) => {
  const { heads, tokens, stack } = args;
  if (stack.length <= 2) {
    return false;
  }
  const currentIndex = stack[stack.length - 1];
  const secondLastIndex = stack[stack.length - 3];
  const { feats: { AdpType, ConjType } } = tokens[currentIndex];
  return tokens[secondLastIndex].xpos === "VERB" && Boolean(AdpType) && !ConjType && markerFollowsAVerbObject(args, nextToken) && belongToTheSameClause(tokens, heads, secondLastIndex, currentIndex);
};
var markerAttachesToTheLeft = (args, nextToken) => {
  const { heads, tokens, stack } = args;
  const currentIndex = stack[stack.length - 1];
  const lastIndex = stack[stack.length - 2];
  const { xpos, feats: { AdpType } } = tokens[currentIndex];
  const { xpos: lastTag } = tokens[lastIndex];
  const isPostpositionOfTheNoun = lastTag === "NOUN" && xpos === "MARK" && AdpType === "Post";
  const modifiesTheAdverbBefore = lastTag === "ADV" && belongToTheSameClause(tokens, heads, lastIndex, currentIndex);
  return !isAncestor(heads, currentIndex, lastIndex) && (modifiesTheAdverbBefore || lastTag === "NOUN" && markerClosesAVerbObject(args, nextToken) || isPostpositionOfTheNoun);
};
var chainsOntoThePrecedingMarker = ({ tokens, stack }) => {
  const { feats: { AdpType, ConjType } } = tokens[stack[stack.length - 1]];
  const { feats: { AdpType: lastAdpType, ConjType: lastConjType } } = tokens[stack[stack.length - 2]];
  return Boolean(lastAdpType && !lastConjType && (AdpType && !ConjType || !AdpType && ConjType === "Sub"));
};
var findPrecedingMarkerHeadOffset = ({ heads, stack }) => {
  const lastHead = heads[stack[stack.length - 2]];
  return lastHead === -2 ? -1 : stack.slice().reverse().findIndex((stackMember) => stackMember === lastHead);
};
var headlessMarkerStep = (args, nextToken) => {
  const { heads, tokens, stack } = args;
  const currentIndex = stack[stack.length - 1];
  const lastIndex = stack[stack.length - 2];
  const { feats: { ConjType } } = tokens[currentIndex];
  const pop = isRightDelimitedMarker(args, nextToken);
  if (ConjType === "Comp" && isComparativeCorrelate(heads, tokens, currentIndex - 1) && !isAncestor(heads, currentIndex - 1, currentIndex)) {
    return assignHead(currentIndex - 1);
  }
  if (tokens[lastIndex].xpos === "MARK" && belongToTheSameClause(tokens, heads, lastIndex, currentIndex)) {
    if (!chainsOntoThePrecedingMarker(args)) {
      return rightArc(1, { pop });
    }
    const headOffset = findPrecedingMarkerHeadOffset(args);
    return headOffset === -1 ? null : rightArc(headOffset, { pop });
  }
  const parentOffset = findMarkerParentOffset(heads, stack, tokens, currentIndex);
  return parentOffset === -1 ? null : rightArc(parentOffset, { pop });
};
var markerStep = (args) => {
  const { heads, tokens, stack } = args;
  const currentIndex = stack[stack.length - 1];
  const nextToken = tokenAfter(tokens, currentIndex);
  if (markerAttachesToTheLeft(args, nextToken)) {
    return leftArc(1);
  }
  if (heads[currentIndex] === -2) {
    return headlessMarkerStep(args, nextToken);
  }
  const objectIsAssigned = heads.some((head, child) => head === currentIndex && child > currentIndex);
  return objectIsAssigned ? reduce : null;
};
var determinerOrAdjectiveStep = (args) => {
  const { heads, tokens, stack } = args;
  const { feats: { PronType } } = tokens[stack[stack.length - 1]];
  if (isNegatedQuantifier(tokens, stack)) {
    return leftArc(1);
  }
  const isBareDeterminer = PronType && !isCoordinatedModifier(heads, tokens, stack[stack.length - 2]);
  return isBareDeterminer ? null : adjectiveStep(args);
};
var stepsByTag = /* @__PURE__ */ new Map([
  ["ADV", advStep],
  ["ADJ", determinerOrAdjectiveStep],
  ["VERB", verbStep],
  ["NOUN", nounStep]
]);
var oracle = (args) => {
  const { stack, tokens } = args;
  if (stack.length < 2) {
    return null;
  }
  trace(() => `Oracle at ${args.index} with stack ${JSON.stringify(stack)} and heads ${JSON.stringify(args.heads)}`);
  const { xpos } = tokens[stack[stack.length - 1]];
  const lastToken = tokens[stack[stack.length - 2]];
  if (xpos === "PUNCT") {
    return punctuationStep(args);
  }
  if (isDelimiter(lastToken) && !punctSideFinRegExp.test(lastToken.form)) {
    return leftArc(1);
  }
  return (stepsByTag.get(xpos ?? "") ?? markerStep)(args);
};
var unitAbbreviations = ({ tokens, index, pos }) => {
  if (index > 0 && tokens[index].form.toLowerCase() === "in") {
    const { feats: { NumType: lastNumType } } = tokens[index - 1];
    if (lastNumType != null) {
      return pos;
    }
  }
  delete pos.NOUN;
  return pos;
};
var isPossessiveMark = ({ form, lemma = form.toLowerCase(), misc: { pos } }) => lemma === "be" && pos.MARK;
var isPrecededByDeterminer = (tokens, index) => {
  let currentIndex = index - 1;
  while (currentIndex >= 0) {
    const { feats: { PronType }, misc: { pos } } = tokens[currentIndex];
    const tags = Object.keys(pos);
    if (tags.length === 1 && pos.ADV) {
      currentIndex -= 1;
    } else {
      return Boolean(tags.length === 1 && pos.ADJ && PronType);
    }
  }
  return false;
};
var followsADeterminerAndClosesThePhrase = (tokens, index) => {
  const { feats: { PronType } } = tokens[index];
  const { feats: { PronType: nextPronType }, misc: { pos: nextPossiblePosTags } } = index + 1 < tokens.length ? tokens[index + 1] : { feats: { PronType: void 0 }, misc: { pos: { END: 1 } } };
  const aftTags = Object.keys(nextPossiblePosTags ?? {});
  const nextTagClosesThePhrase = ["END", "PUNCT", "VERB", "MARK"].includes(aftTags[0]) || aftTags[0] === "NOUN" && nextPronType === "Prs";
  return !PronType && aftTags.length === 1 && nextTagClosesThePhrase && isPrecededByDeterminer(tokens, index);
};
var isAnUnrecognisedProperNoun = ({ tokens, index, pos }) => {
  const { form, feats: { PronType } } = tokens[index];
  return !PronType && index > 0 && !(pos.NOUN || pos.MARK) && isCapitalizedWord(form) || index + 1 < tokens.length && isPossessiveMark(tokens[index + 1]);
};
var forcedNouns = (args) => {
  const { tokens, index, pos } = args;
  if (followsADeterminerAndClosesThePhrase(tokens, index)) {
    return { NOUN: 1 };
  }
  if (isAnUnrecognisedProperNoun(args)) {
    pos.NOUN = 0.01;
  }
  return pos;
};
var endsInS = /s$/iu;
var genitiveWithoutS = ({ tokens, index, pos }) => {
  if (index === 0) {
    return pos;
  }
  const { form } = tokens[index];
  const { form: lastForm, misc: { pos: lastPos } } = tokens[index - 1];
  if (endsInS.test(lastForm) && lastPos && lastPos.NOUN && !tokens.slice(0, index).some(({ form: opening }) => pairs[opening] === form)) {
    tokens[index].lemma = "be";
    tokens[index].feats = {
      AdpType: "Post"
    };
    return { MARK: 1 };
  }
  return pos;
};
var isMostlyCapitalizedSentence = (tokens) => {
  const capitalizedTotal = tokens.filter(({ misc: { pos, isOpaque }, form }) => !pos.PUNCT && !isOpaque && isCapitalizedWord(form)).length;
  return capitalizedTotal / tokens.length > 0.7;
};
var hasCapitalizedNeighbour = (tokens, index) => {
  const { form: foreForm = "" } = index > 0 ? tokens[index - 1] : {};
  const { form: aftForm = "" } = index + 1 < tokens.length ? tokens[index + 1] : {};
  return isCapitalizedWord(foreForm) || isCapitalizedWord(aftForm);
};
var properNouns = ({ tokens, index, pos }) => {
  const { misc } = tokens[index];
  const isSentenceInitialWithFeature = index === 0 && Boolean(misc.f);
  if (isSentenceInitialWithFeature || isMostlyCapitalizedSentence(tokens)) {
    return pos;
  }
  return !pos.NOUN && hasCapitalizedNeighbour(tokens, index) ? { ...pos, NOUN: 0.1 } : pos;
};
var clockHours = [
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
  "eleven",
  "twelve"
];
var antemeridiemAbbreviation = ({ tokens, index }) => {
  if (index === 0) {
    return { VERB: 1 };
  }
  const { form: foreForm, lemma: foreLemma } = tokens[index - 1];
  if (clockHours.includes(foreLemma ?? "") || Number(foreForm) <= 12) {
    return { VERB: 0.1, NOUN: 0.9 };
  }
  return { VERB: 1 };
};
var adjusters = [
  [
    ({ form, misc: { pos } }) => isCapitalizedWord(form) && !Object.keys(pos).includes("NOUN"),
    properNouns
  ],
  [({ form }) => form.toLowerCase() === "am", antemeridiemAbbreviation],
  [
    ({ misc: { pos, isUnit } }) => Boolean(isUnit) && (pos.PUNCT || pos.MARK),
    unitAbbreviations
  ],
  [
    ({ misc: { pos } }) => Object.keys(pos).some((xpos) => ["MARK", "ADV", "ADJ", "INTJ"].includes(xpos)),
    forcedNouns
  ],
  [({ form }) => ["'", "\u2019", "`", "\xB4"].includes(form), genitiveWithoutS]
];
var adjustPosTags = (tokens, index) => {
  const { misc: { pos } } = tokens[index];
  return adjusters.reduce((pos2, [condition, adjust]) => condition({ ...tokens[index] }) ? adjust({ tokens, index, pos: pos2 }) : pos2, pos);
};
var isAmbiguous = ({ xpos, misc: { pos } }) => Object.keys(pos).length > 1 && !xpos;
var buildAmbiguousChain = (tokens, index) => {
  let currentIndex = index;
  const chain = [];
  while (currentIndex < tokens.length && isAmbiguous(tokens[currentIndex])) {
    chain.push(currentIndex);
    currentIndex += 1;
  }
  return chain;
};
var canBeDisambiguated = (tokens, chain) => {
  const lastChainMember = chain[chain.length - 1];
  const { misc: { pos: nextPossibleTags = { END: 1 } } = {} } = lastChainMember + 1 < tokens.length ? tokens[lastChainMember + 1] : {};
  return chain.length > 0 && Object.keys(nextPossibleTags).length === 1;
};
var hasCoordinatingConjunctionChild = (heads, tokens, candidate) => heads.reduce(childrenOf(candidate), []).some((child) => {
  const { xpos, feats: { ConjType } } = tokens[child];
  if (xpos !== "MARK" || ConjType !== "Coor") {
    return false;
  }
  return heads.reduce(childrenOf(child), []).some((grandchild) => {
    const conjunct = tokens[grandchild];
    return conjunct.xpos === "VERB" && heads.reduce(childrenOf(grandchild), []).some((id) => {
      const { xpos: subjectTag, feats: { PronType } } = tokens[id];
      return id < grandchild && subjectTag === "NOUN" && PronType !== "Rel";
    });
  });
});
var hasLeadingMarkerChild = (heads, tokens, candidate) => heads.reduce(childrenOf(candidate), []).some((child) => {
  const { xpos, feats: { ConjType } } = tokens[child];
  if (child >= candidate || xpos !== "MARK" || ConjType === "Coor") {
    return false;
  }
  return !heads.reduce(childrenOf(child), []).some((grandchild) => tokens[grandchild].xpos === "NOUN");
});
var findSubject = ({ heads, stack, tokens }, candidate) => {
  const isSubjectNoun = (index) => tokens[index].xpos === "NOUN" && tokens[index].feats.PronType !== "Rel";
  const attachedSubject = heads.reduce(childrenOf(candidate), []).find((child) => child < candidate && isSubjectNoun(child));
  if (attachedSubject != null) {
    return attachedSubject;
  }
  const precedingStackEntry = stack[stack.indexOf(candidate) - 1];
  return precedingStackEntry != null && isSubjectNoun(precedingStackEntry) ? precedingStackEntry : void 0;
};
var isUnambiguouslyFinite = ({ feats: { Tense, VerbForm } }) => VerbForm !== "Part" && !(Tense === "Past" && VerbForm !== "Fin");
var hasPronounSubject2 = (search, candidate) => {
  const subject = findSubject(search, candidate);
  return subject != null && search.tokens[subject].feats.PronType === "Prs";
};
var isSolidRoot = (search, candidate) => hasPronounSubject2(search, candidate) || isUnambiguouslyFinite(search.tokens[candidate]);
var parentheticalPredicateLemmas = [
  "say",
  "ask",
  "reply",
  "answer",
  "whisper",
  "mutter",
  "murmur",
  "add",
  "continue",
  "explain",
  "remark",
  "note",
  "shout",
  "call",
  "cry",
  "sigh",
  "think",
  "muse",
  "wonder",
  "announce",
  "declare",
  "insist",
  "admit",
  "confess",
  "offer",
  "interrupt",
  "snap",
  "laugh",
  "repeat",
  "recall",
  "report",
  "believe",
  "guess",
  "suppose",
  "hope",
  "bet",
  "gather",
  "assume",
  "reckon",
  "figure"
];
var evidentialAdjectiveLemmas = ["certain", "sure", "positive", "confident"];
var lemmaOf = ({ lemma, form }) => lemma ?? form.toLowerCase();
var isParentheticalPredicate = (heads, tokens, candidate) => {
  if (parentheticalPredicateLemmas.includes(lemmaOf(tokens[candidate]))) {
    return true;
  }
  if (lemmaOf(tokens[candidate]) !== "be") {
    return false;
  }
  return heads.reduce(childrenOf(candidate), []).some((child) => {
    const { xpos } = tokens[child];
    return xpos === "ADJ" && evidentialAdjectiveLemmas.includes(lemmaOf(tokens[child]));
  });
};
var isCompellingReplacement = (search, chosen, next) => {
  const { heads, tokens } = search;
  return hasPronounSubject2(search, next) && !isParentheticalPredicate(heads, tokens, next) || findSubject(search, next) != null && findSubject(search, chosen) == null;
};
var replacesTheChosenRoot = (search, chosen, next) => {
  const { heads, tokens } = search;
  return hasCommaBetween(tokens, chosen, next) && !hasCoordinatingConjunctionChild(heads, tokens, next) && !hasLeadingMarkerChild(heads, tokens, next) && isCompellingReplacement(search, chosen, next);
};
var chooseVerbRoot = (search, candidates2) => {
  const { heads, tokens } = search;
  const eligibleStart = candidates2.findIndex((candidate) => !hasLeadingMarkerChild(heads, tokens, candidate));
  const start = eligibleStart === -1 ? 0 : eligibleStart;
  let chosen = candidates2[start];
  let indexInCandidates = start + 1;
  while (indexInCandidates < candidates2.length && !isSolidRoot(search, chosen)) {
    const next = candidates2[indexInCandidates];
    if (replacesTheChosenRoot(search, chosen, next)) {
      chosen = next;
    }
    indexInCandidates += 1;
  }
  return chosen;
};
var findBestRoot = (search) => {
  const { heads, stack, tokens } = search;
  let tagIndex = 0;
  while (tagIndex < rootTagsOrdered.length) {
    const rootTag = rootTagsOrdered[tagIndex];
    const candidates2 = stack.filter((index) => heads[index] === -2 && tokens[index].xpos === rootTag);
    if (candidates2.length > 0) {
      return rootTag === "VERB" ? chooseVerbRoot(search, candidates2) : candidates2[0];
    }
    tagIndex += 1;
  }
  return 0;
};
var findClosestWithMatchers = (heads, stack, indexInStack, matches) => {
  const index = stack[indexInStack];
  const reverseLeftStack = stack.slice(0, indexInStack).reverse();
  const rightStack = stack.slice(indexInStack + 1);
  const leftHeadOffset = reverseLeftStack.findIndex((headIndex) => matches.left(headIndex) && !isAncestor(heads, headIndex, index));
  const rightHeadOffset = rightStack.findIndex((headIndex) => matches.right(headIndex) && !isAncestor(heads, headIndex, index));
  if (leftHeadOffset === -1 && rightHeadOffset === -1) {
    return null;
  }
  if (leftHeadOffset === -1 && rightHeadOffset !== -1) {
    return stack[indexInStack + 1 + rightHeadOffset];
  }
  if (leftHeadOffset !== -1 && rightHeadOffset === -1) {
    return stack[indexInStack - 1 - leftHeadOffset];
  }
  return rightHeadOffset > leftHeadOffset ? stack[indexInStack - 1 - leftHeadOffset] : stack[indexInStack + 1 + rightHeadOffset];
};
var findClosestMarkerHead = ({ heads, stack, tokens }, indexInStack) => {
  const childTags = heads.reduce(childrenOf(stack[indexInStack]), []).map((child) => tokens[child].xpos);
  const headTags = childTags.includes("VERB") ? ["VERB"] : childTags.includes("NOUN") ? ["VERB", "NOUN"] : ["VERB", "NOUN", "MARK"];
  return findClosestWithMatchers(heads, stack, indexInStack, {
    left: (index) => headTags.includes(tokens[index].xpos),
    right: () => false
  });
};
var findClosestVerbHead = ({ heads, stack, tokens }, indexInStack) => findClosestWithMatchers(heads, stack, indexInStack, {
  left: (candidateIndex) => {
    const candidate = tokens[candidateIndex];
    return candidate.xpos === "MARK" && translativeDegree(candidate) === 2 && !heads.reduce(childrenOf(candidateIndex), []).some((child) => tokens[child].xpos === "VERB");
  },
  right: () => false
});
var findClosestHead = (search, indexInStack) => {
  const { root, heads, stack, tokens } = search;
  const { xpos } = tokens[stack[indexInStack]];
  const isNominalHead = (index) => ["MARK", "VERB", "NOUN"].includes(tokens[index].xpos);
  if (["ADJ", "ADV"].includes(xpos)) {
    return findClosestWithMatchers(heads, stack, indexInStack, {
      left: isNominalHead,
      right: (index) => ["MARK", "NOUN"].includes(tokens[index].xpos)
    });
  }
  if (xpos === "NOUN") {
    return findClosestWithMatchers(heads, stack, indexInStack, {
      left: isNominalHead,
      right: isNominalHead
    });
  }
  if (xpos === "MARK") {
    return findClosestMarkerHead(search, indexInStack);
  }
  return xpos === "VERB" ? findClosestVerbHead(search, indexInStack) ?? root : null;
};
var settleUnambiguousTags = (tokens) => {
  tokens.forEach((_token, index) => {
    tokens[index].misc.pos = adjustPosTags(tokens, index);
    const pos = Object.keys(tokens[index].misc.pos);
    if (pos.length === 1) {
      [tokens[index].xpos] = pos;
    }
  });
};
var runTransitions = ({ heads, stack, tokens }, index) => {
  let iteration = 0;
  let transition = oracle({ heads, stack, tokens, index });
  trace(() => `Stack: ${JSON.stringify(stack)} Heads: ${JSON.stringify(heads)}`);
  while (transition != null && iteration < tokens.length) {
    transition(heads, tokens, stack);
    trace(() => `Updated stack: ${JSON.stringify(stack)} Heads: ${JSON.stringify(heads)}`);
    iteration += 1;
    transition = oracle({ heads, stack, tokens, index });
  }
};
var tagAndParseAt = (state, weights2, index) => {
  const { tokens, stack } = state;
  if (tokens[index].xpos !== "INTJ") {
    stack.push(index);
  }
  const ambiguousChain = buildAmbiguousChain(tokens, index);
  trace(() => `Ambiguous chain at ${index} ${tokens[index].form}: ${JSON.stringify(ambiguousChain)}; pos tags: ${JSON.stringify(tokens[index].misc.pos)}; assigned xpos: ${tokens[index].xpos}`);
  if (canBeDisambiguated(tokens, ambiguousChain)) {
    trace(() => `Can disambiguate chain ${JSON.stringify(ambiguousChain)}`);
    tag_default(weights2, ambiguousChain, state);
  }
  trace(() => `Tag: ${tokens[index].xpos}`);
  runTransitions(state, index);
};
var tag = (baseTokens, weights2) => {
  const tokens = baseTokens;
  const state = {
    tokens,
    heads: new Array(tokens.length).fill(-2),
    stack: []
  };
  settleUnambiguousTags(tokens);
  for (let index = 0; index < tokens.length; index += 1) {
    tagAndParseAt(state, weights2, index);
  }
  return {
    heads: state.heads,
    stack: state.stack,
    tokens
  };
};
var isThirdPersonSForm = (form, lemma) => {
  const surface = form.toLowerCase();
  const base = lemma.toLowerCase();
  return surface === `${base}s` || surface === `${base}es` || base.endsWith("y") && surface === `${base.slice(0, -1)}ies`;
};
var agreesWithASingularSubject = ({ xpos, form, lemma, feats: { Person, Tense, VerbForm } }) => xpos === "VERB" && Person === 3 && Tense === "Pres" && VerbForm === "Fin" && lemma != null && isThirdPersonSForm(form, lemma);
var numberVerbsByTheirSuffix = (tokens) => tokens.forEach((token) => {
  if (agreesWithASingularSubject(token)) {
    token.feats.Number = "Sing";
  }
});
function parse_default(tokens, { weights: weights2 = {} } = {}) {
  const { heads, stack, tokens: taggedTokens } = tag(tokens, weights2);
  const root = stack.length > 0 ? findBestRoot({ heads, stack, tokens: taggedTokens }) : heads.findIndex((head) => head === -2);
  heads[root] = -1;
  const headSearch = { root, heads, stack, tokens: taggedTokens };
  stack.forEach((index, indexInStack) => {
    if (heads[index] !== -2) {
      return;
    }
    const closestHead = findClosestHead(headSearch, indexInStack);
    if (closestHead != null) {
      addToParse(heads, taggedTokens, closestHead, index);
    }
  });
  const headless = taggedTokens.reduce((headless2, _token, index) => index === root || heads[index] !== -2 ? headless2 : [...headless2, index], []);
  trace(() => `Assigning root. Stack: ${JSON.stringify(stack)}`);
  headless.forEach((headlessChild) => addToParse(heads, taggedTokens, root, headlessChild));
  taggedTokens.forEach((t, index) => {
    const token = t;
    const head = heads[index];
    token.head = head;
    if (!token.misc.children) {
      token.misc.children = [];
    }
    if (head !== -1) {
      const { misc: parent } = taggedTokens[head];
      if (parent.children) {
        parent.children.push(index);
      } else {
        parent.children = [index];
      }
    }
  });
  numberVerbsByTheirSuffix(taggedTokens);
  return taggedTokens;
}

// ../nlp/dist/sentencize/index.js
function sentencize_default(tokens) {
  let index = 0;
  const sentences2 = [];
  while (index < tokens.length) {
    const offset = tokens.slice(index).findIndex(({ feats: { PunctType = "" }, form }) => ["Peri", "Qest", "Excl", "Semi"].includes(PunctType) || ["\\n", "\n", "\\\\n"].includes(form));
    if (offset === -1) {
      const sentence2 = tokens.slice(index);
      sentence2.forEach((token, id) => {
        token.id = id;
      });
      sentences2.push(sentence2);
      return sentences2;
    }
    const start = index;
    let end = index + offset;
    if (tokens.slice(index, index + offset).some(({ feats: { PunctType = "" } }) => ["Quot", "Brck"].includes(PunctType)) && tokens[end + 1] && ["Quot", "Brck"].includes(tokens[end + 1].feats.PunctType ?? "") && tokens[end + 1].misc.at === tokens[end].misc.at + tokens[end].form.length) {
      end += 1;
      index += offset + 2;
    } else {
      index += offset === 0 ? 1 : offset + 1;
    }
    const sentence = tokens.slice(start, end + 1);
    sentence.forEach((token, id) => {
      token.id = id;
    });
    sentences2.push(sentence);
  }
  return sentences2;
}

// ../nlp/dist/tokenize/index.js
var numberRegExp = /-?\d+(?:[.,]\d+)*(?:[eE][+-]?\d+)?/g;
var strayNumberRegExp = /\d+/g;
var ordinalRegExp = /\d+(?:st|nd|rd|(?:t?ie)?th)/gi;
var datetimeRegExp = /\b(\d{4})-?(0[1-9]|1[0-2])-?([12]\d|3[01]|0[1-9])T([01][0-9]|2[0-3])(?::?([0-5][0-9])(?::?([0-5][0-9])(?:\.(\d+))?)?)?(Z|([+-][01][0-9]|2[0-3])(?::?([0-5][0-9]))?)?\b/gi;
var dateRegExp = /\b((\d{4})[-/.,]{1,2}(0?[1-9]|1[0-2])[-/.,]{1,2}([12]\d|3[01]|0?[1-9])\b|([12]\d|3[01]|0?[1-9])[-/.,]{1,2}(0?[1-9]|1[0-2])[-/.,]{1,2}(\d{4})|(0?[1-9]|1[0-2])[-/.,]{1,2}([12]\d|3[01]|0?[1-9])[-/.,]{1,2}(\d{4}))/g;
var monthRegExp = /\b((\d{4})[-/.,]{1,2}(0?[1-9]|1[0-2])|(0?[1-9]|1[0-2])[-/.,]{1,2}(\d{4}))\b/g;
var timeRegExp = /\b([01]?[0-9]|2[0-3]):([0-5][0-9])(?::([0-5][0-9])(?:\.(\d+))?)?\b/g;
var postcodeRegExp = /\b([A-Z]{1,4}\d{1,3}[A-Z]?[\\-]?\d?[A-Z]{0,4}\d?|\d{3,5}([\\-]\d{4,5}))\b/g;
var telephoneRegExp = /(?:\+(1|2(?:[07]|1[1-368]|[236][0-9]|4[0-689]|5[0-8]|9[017-9])|3(?:[0-469]|5[0-9]|7[0-8]|8[0-35-79])|4(?:[013-9]|2[013])|5(?:[1-8]|[09][0-9])|6(?:[0-6]|7[02-9]|8[0-35-9]|9[0-2])|7|8(?:[1246]|5[02356]|8[06])|9(?:[0-58]|6[0-8]|7[0-7]|9[2-68]))[1-9]\d{3,13}|\d{5,15})/g;
var emailRegExp = /((\b[^<>()[\].,;:\s@"]+(\.[^<>()[\].,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z-0-9]+\.)+[a-zA-Z]{2,}))/gi;
var urlRegExp = /(([a-zA-Z+.\d/:-]+:\/{1,3}[a-z\d:]+)([-._~:/?#[\]@!$&'()*+,;=%][%?]?\w+)*|([./]*[a-zA-Z:]+[@:.]([-._~:/?#[\]@!$&'()*+,;=%]?\w+)+))=?/g;
var hashtagRegExp = /#[^\s\p{Ps}\p{Pe}\p{Pi}\p{Pf}\p{Term}]+/gu;
var mentionRegExp = /@[\d\w]+\b/g;
var currencyRegExp = new RegExp("\\p{Sc}", "gu");
var specialPunctuatedNounsRegExp = new RegExp("(?:(M(rs?|iss)|Hon|St|Dr?)\\.|\xB0[CF]|\\p{Lu}+[\xB2\xB3]|#\\p{L}+)", "giu");
var acronymRegExp = new RegExp("\\b\\p{L}+(?:\\.\\p{L}+)+\\.|\\b\\p{L}+[-.&](?:\\p{L}+(?:[-.&](?=\\p{L})|\\b))+", "gu");
var punctuationRegExp = new RegExp("\\.+|\\\\{1,2}n|\\p{P}", "gu");
var symbolRegExp = /&(?:[a-z]+|#\d+);|[#%&*\\^/\p{S}\p{Pc}]/giu;
var unhyphenatedWordRegExp = new RegExp("\\p{L}+", "giu");
var beforeApostropheCharacters = `(?:[abcdefghijklmnpqrstuvwxyz]\\p{L}*|[o]\\p{L}+)`;
var apostropheCharacters = `['\`\xB4\u2019\uFF07]`;
var afterApostropheCharacters = `((s|m|ve|ll|re|d)\\p{L}+\\b|([abcefghijknopqtuwxyz]\\p{L}*)|ve\\p{L}+|ll\\p{L}+|re\\p{L}+)`;
var midApostropheWordRegExp = RegExp(`${beforeApostropheCharacters}${apostropheCharacters}${afterApostropheCharacters}`, "giu");
var tokenRegExp = new RegExp("\\p{L}[\\p{L}\\p{N}]*(?:[\\p{Pc}-][\\p{L}\\p{N}]+)+", "giu");
var emojiKeycapSequence = `[#*0-9]\uFE0F\u20E3`;
var emojiFlagSequence = `\\p{RI}{2}`;
var emojiTagSequence = `\u{1F3F4}[\u{E0030}-\u{E0039}\u{E0061}-\u{E007A}]{4,5}\u{E007F}`;
var emojiModifierSequence = `\\p{EBase}\\p{EMod}`;
var emojiPresentationSequence = `\\p{Emoji}\uFE0F`;
var emojiZwjElement = `${emojiModifierSequence}?|${emojiPresentationSequence}|\\p{Emoji}`;
var emojiZwjSequence = `(?:${emojiZwjElement})(?:\u200D(?:${emojiZwjElement}))*`;
var emojiSequenceRegExp = RegExp(`${emojiKeycapSequence}|${emojiFlagSequence}|${emojiTagSequence}|${emojiZwjSequence}`, "giu");
var emoticonSymbols = `-%&@=\u2032'*:;<>|?^(){}`;
var emoticonCharacters = `dDpPoOcl38`;
var emoticon = `(?:\\b[${emoticonCharacters}][${emoticonSymbols}]+|[${emoticonSymbols}]{2,}|[${emoticonSymbols}]+[${emoticonCharacters}](?:[${emoticonSymbols}]|\\b))|\\( '\\}\\{' \\)`;
var interjection = `\\b(?:u?h?m+|[eg]r+m*|e+w+|[aou]{2,}g*h*|(?:h[ae]){2,})\\b`;
var interjectionRegExp = RegExp(`${emoticon}|${interjection}`, "giu");
var specialContractions = `let${apostropheCharacters}s\\b`;
var specialContractionRegExp = RegExp(specialContractions, "gi");
var contractionsRegExp = RegExp(`${apostropheCharacters}(s|m|ve|ll|re|d|t)\\b`, "gi");
var adjacentWordCharactersRegExp = /[-_#*]+/;
var aphostropheAltRegExp = /[`´’]+/;
var patternsToTokens = [
  [emojiSequenceRegExp, { misc: { pos: { INTJ: 1 } } }],
  [interjectionRegExp, { misc: { pos: { INTJ: 1 } } }],
  [contractionsRegExp, {}],
  [specialContractionRegExp, {}],
  [hashtagRegExp, { misc: { isOpaque: true } }],
  [mentionRegExp, { misc: { pos: { INTJ: 1, NOUN: 1 }, isOpaque: true } }],
  [specialPunctuatedNounsRegExp, { misc: { pos: { NOUN: 1 } } }],
  [currencyRegExp, { misc: { pos: { NOUN: 1 } } }],
  [
    numberRegExp,
    {
      feats: { NumType: "Card" },
      misc: { pos: { NOUN: 1, ADJ: 1 } }
    }
  ],
  [
    strayNumberRegExp,
    {
      feats: { NumType: "Card" },
      misc: { pos: { NOUN: 1, ADJ: 1 } }
    }
  ],
  [
    ordinalRegExp,
    {
      feats: { NumType: "Ord" },
      misc: { pos: { NOUN: 1, ADJ: 1 } }
    }
  ],
  [emailRegExp, { misc: { pos: { NOUN: 1 }, isOpaque: true } }],
  [urlRegExp, { misc: { pos: { NOUN: 1 }, isOpaque: true } }],
  [datetimeRegExp, { misc: { pos: { NOUN: 1 } } }],
  [dateRegExp, { misc: { pos: { NOUN: 1 } } }],
  [monthRegExp, { misc: { pos: { NOUN: 1 } } }],
  [timeRegExp, { misc: { pos: { NOUN: 1 } } }],
  [postcodeRegExp, { misc: { pos: { NOUN: 1 }, isOpaque: true } }],
  [telephoneRegExp, { misc: { pos: { NOUN: 1 }, isOpaque: true } }],
  [acronymRegExp, { misc: { pos: { NOUN: 1 } } }],
  [unhyphenatedWordRegExp, {}],
  [midApostropheWordRegExp, {}],
  [tokenRegExp, {}],
  [symbolRegExp, { misc: { pos: { INTJ: 1 } } }],
  [punctuationRegExp, { misc: { pos: { PUNCT: 1 } } }]
];
var defined = (props) => {
  const result = {};
  for (const key2 in props) {
    if (props[key2] !== void 0) {
      result[key2] = props[key2];
    }
  }
  return result;
};
var createToken = ({ AdpType, Case, ConjType, Degree, Mood, NumType, Number: Number2, Person, Poss, PronType, PunctType, Reflex, Tense, VerbForm, f, fused, isOpaque, isUnit, pos, prepPairs, lemma } = {}) => {
  const token = {
    feats: defined({
      AdpType,
      Case,
      ConjType,
      Degree,
      Mood,
      NumType,
      Number: Number2,
      Person,
      Poss,
      PronType,
      PunctType,
      Reflex,
      Tense,
      VerbForm
    }),
    misc: defined({
      f,
      fused,
      isOpaque,
      isUnit,
      pos: pos && { ...pos },
      prepPairs: prepPairs && { ...prepPairs }
    })
  };
  if (lemma) {
    token.lemma = lemma;
  }
  return token;
};
var independentContractions = `${apostropheCharacters}(s|m|ve|ll|re|d)`;
var combinePos = (a = {}, b = {}) => {
  for (const pos in b) {
    if (b[pos] !== void 0 && a[pos] == null) {
      a[pos] = b[pos];
    }
  }
  return a;
};
var merge = (a, b) => {
  if (!a) {
    return b ?? {};
  }
  if (!b) {
    return a;
  }
  for (const prop in b) {
    if (b[prop] !== void 0) {
      a[prop] = b[prop];
    }
  }
  return a;
};
var matchedTokens = (text) => patternsToTokens.reduce((tokens, [pattern, { misc, feats }]) => {
  let match = pattern.exec(text);
  const { pos = {}, ...miscProps } = misc ?? {};
  while (match != null) {
    tokens.push({
      form: match[0].trim(),
      misc: { at: match.index, pos: { ...pos }, ...miscProps },
      feats: feats ?? {}
    });
    match = pattern.exec(text);
  }
  return tokens;
}, []);
var byPositionThenLength = (a, b) => a.misc.at - b.misc.at || b.form.length - a.form.length;
var mergedInto = (replaced, token) => {
  const { feats, misc: { pos, prepPairs, ...misc }, ...props } = token;
  const mergedMisc = merge(merge(replaced.misc, misc), {
    pos: combinePos(replaced.misc.pos, pos),
    prepPairs: merge(replaced.misc.prepPairs, prepPairs)
  });
  return {
    ...merge(replaced, props),
    feats: merge(replaced.feats, feats),
    misc: mergedMisc
  };
};
var stripsAnIndependentContraction = (replacedWord, replacementWord) => !RegExp(specialContractions, "iu").test(replacedWord) && RegExp(`\\w${apostropheCharacters}\\w`, "iu").test(replacedWord) && replacementWord === replacedWord.replace(RegExp(`${independentContractions}$`, "iu"), "");
var atSamePosition = (filtered, token, replacedIndex) => {
  const replacedToken = filtered[replacedIndex];
  if (replacedToken.form.length === token.form.length) {
    filtered[replacedIndex] = mergedInto(replacedToken, token);
  }
  if (stripsAnIndependentContraction(replacedToken.form, token.form)) {
    filtered[replacedIndex] = token;
  }
  return filtered;
};
var splitsANegativeNumber = (filtered, replacedPosition, replacedWord) => {
  const { misc: { at: preReplacedPosition }, form: preReplacedWord } = filtered.length - 2 >= 0 ? filtered[filtered.length - 2] : { misc: { at: 0 }, form: "" };
  return replacedPosition === preReplacedPosition + preReplacedWord.length && /\d$/iu.test(preReplacedWord) && /^-\d/iu.test(replacedWord);
};
var overlapping = (text, filtered, token, replacedIndex) => {
  const { misc: { at: replacedPosition }, form: replacedWord } = filtered[replacedIndex];
  if (splitsANegativeNumber(filtered, replacedPosition, replacedWord)) {
    filtered[replacedIndex] = {
      form: text.slice(replacedPosition, replacedPosition + 1),
      misc: { at: replacedPosition, pos: {} },
      feats: {}
    };
    filtered.push(token);
  }
  return filtered;
};
var overlaps2 = (replaced, token) => token.misc.at < replaced.misc.at + replaced.form.length && replaced.misc.at < token.misc.at + token.form.length;
var withoutOverlaps = (text) => (tokens) => tokens.reduce((filtered, token) => {
  if (filtered.length === 0) {
    return [token];
  }
  const replacedIndex = filtered.length - 1;
  const replaced = filtered[replacedIndex];
  if (token.misc.at === replaced.misc.at) {
    return atSamePosition(filtered, token, replacedIndex);
  }
  if (overlaps2(replaced, token)) {
    return overlapping(text, filtered, token, replacedIndex);
  }
  filtered.push(token);
  return filtered;
}, []);
var normalizedForm = (form) => form.length <= 1 ? form.toLowerCase() : form.toLowerCase().replace(adjacentWordCharactersRegExp, "").replace(aphostropheAltRegExp, "'");
var withDictionaryEntry = (dictionary2) => (token) => {
  const { form } = token;
  const formToken = createToken(dictionary2.get(form));
  const { feats, misc: { fused, pos, prepPairs, ...misc }, ...props } = createToken(dictionary2.get(normalizedForm(form)));
  const miscMergedProps = merge(merge(misc, formToken.misc), token.misc);
  const mergedToken = {
    ...merge(merge(props, formToken), token),
    feats: merge(merge(feats, formToken.feats), token.feats),
    misc: {
      ...miscMergedProps,
      ...!adjacentWordCharactersRegExp.test(form) && fused ? { fused } : {},
      pos: combinePos(combinePos(pos, formToken.misc.pos), token.misc.pos),
      prepPairs: merge(merge(prepPairs, formToken.misc.prepPairs), token.misc.prepPairs)
    }
  };
  if (mergedToken.misc.pos.INTJ && mergedToken.feats.NumType === "Card") {
    delete mergedToken.misc.pos.INTJ;
  }
  if (Object.keys(mergedToken.misc.prepPairs ?? {}).length === 0) {
    delete mergedToken.misc.prepPairs;
  }
  return mergedToken;
};
var splitFused = (token) => {
  const { form: fusedForm, misc: { at, fused } } = token;
  if (fused == null) {
    return [token];
  }
  let offsetInToken = 0;
  const normalizedFusedWord = fusedForm.replace(aphostropheAltRegExp, "'");
  return fused.reduce((splitTokens, { fragment, information }) => {
    const match = RegExp(fragment, "iu").exec(normalizedFusedWord.slice(offsetInToken));
    if (match == null) {
      return splitTokens;
    }
    const { index: fragmentOffset } = match;
    const fragmentAt = at + offsetInToken + fragmentOffset;
    const form = fusedForm.substring(offsetInToken + fragmentOffset, offsetInToken + fragmentOffset + fragment.length);
    offsetInToken += fragmentOffset + fragment.length;
    const fragmentToken = createToken(information);
    fragmentToken.misc.at = fragmentAt;
    return splitTokens.concat({ ...fragmentToken, form });
  }, []);
};
var withLemma = (dictionary2) => (token, id) => {
  const { form, misc } = token;
  if (Object.keys(misc.pos ?? {}).length > 0) {
    return { id, ...token };
  }
  const { lemma, pos, feats = {} } = lemmatize_default(form, { dictionary: dictionary2 });
  return { id, ...token, lemma, misc: { ...misc, pos }, feats };
};
function tokenize_default(text, { dictionary: dictionary2 }) {
  const distinct = withoutOverlaps(text)(matchedTokens(text).sort(byPositionThenLength));
  return distinct.map(withDictionaryEntry(dictionary2)).flatMap(splitFused).map(withLemma(dictionary2));
}

// ../nlp/dist/index.js
function dist_default2(text, { dictionary: dictionary2, weights: weights2 }) {
  return sentencize_default(tokenize_default(text, { dictionary: dictionary2 })).map((tokens) => parse_default(tokens, { weights: weights2 }));
}

// src/nlp.ts
var located = (name) => {
  const bundled = fileURLToPath(new URL(`./data/${name}`, import.meta.url));
  return existsSync(bundled) ? bundled : fileURLToPath(import.meta.resolve(`nlp/${name}`));
};
var load = async (name) => JSON.parse(await readFile(located(name), "utf8"));
var dictionary = new Map(
  await load("dictionary.json")
);
var weights = await load("weights.json");
var nlp_default = (text) => dist_default2(text, { dictionary, weights });

// src/document.ts
var sentences = (source) => blocks(source).flatMap(
  (block) => nlp_default(block.text).map(
    (tokens) => tokens.map((token) => ({
      ...token,
      misc: { ...token.misc, at: token.misc.at + block.at }
    }))
  )
);
var wordsIn = (text) => (text.match(/\S+/gu) ?? []).length;

// src/structure.ts
var FENCE = /^ {0,3}(?:`{3,}|~{3,})/u;
var THEMATIC_BREAK = /^ {0,3}(?:(?:[-*_] *){3,})$/u;
var BOLD_LEAD = /^ {0,3}(\*\*\*[^\n]+?\*\*\*|\*\*[^\n]+?\*\*|__[^\n]+?__)/u;
var HEADING = /^ {0,3}#{1,6}(?:[ \t]|$)/u;
var placed = (source) => source.split("\n").reduce((made, text) => {
  const last = made[made.length - 1];
  const at = last == null ? 0 : last.at + last.text.length + 1;
  return [...made, { text, at }];
}, []);
var blank2 = (line) => line == null || line.text.trim() === "";
var ends = (line) => blank2(line) || HEADING.test(line?.text ?? "");
var fencing = (found) => found.reduce((made, line) => {
  const open = made[made.length - 1]?.open ?? false;
  const marker = FENCE.test(line.text);
  return [...made, { open: marker ? !open : open, fenced: open || marker }];
}, []);
var lines = (source) => {
  const found = placed(source);
  const fences = fencing(found);
  return found.map((line, index) => ({
    ...line,
    fenced: fences[index].fenced,
    opens: !fences[index].fenced && !blank2(line) && ends(found[index - 1])
  }));
};
var leadFinding = ({ text, at }, bold) => ({
  id: "no-bold-lead-ins",
  start: at + text.indexOf(bold),
  end: at + text.indexOf(bold) + bold.length,
  message: "This paragraph opens with a bold phrase announcing what the paragraph is about. Delete the announcement and open with the point itself."
});
var findingIn = (line) => {
  if (line.fenced || THEMATIC_BREAK.test(line.text)) {
    return [];
  }
  const lead = line.opens ? BOLD_LEAD.exec(line.text) : null;
  return lead == null ? [] : [leadFinding(line, lead[1])];
};
var structureProblems = (source) => lines(source).flatMap(findingIn);

// src/lint.ts
var proseProblems = (source, config = editorial) => dist_default(sentences(source), config);
var byPosition2 = (one, other) => one.start - other.start || one.end - other.end;
var allProblems = (source, config = editorial, { shape = true } = {}) => [
  ...proseProblems(source, config),
  ...shape ? structureProblems(source) : []
].sort(byPosition2);

// src/report.ts
var collapse = (text) => text.replace(/\s+/gu, " ").trim();
var QUOTED = 48;
var spanOf = (source, { start, end }) => collapse(source.slice(start, end));
var shortSpan = (source, finding) => {
  const span = spanOf(source, finding);
  return span.length > QUOTED ? `${span.slice(0, QUOTED - 3)}...` : span;
};
var place = (source, at) => {
  const before = source.slice(0, at);
  const line = before.split("\n").length;
  return { line, column: at - (before.lastIndexOf("\n") + 1) + 1 };
};
var ORDER = ["shape", "sentences", "words"];
var grouped = (findings) => findings.reduce(
  (by, finding) => {
    const scope = scopeOf(finding);
    return by.set(scope, [...by.get(scope) ?? [], finding]);
  },
  /* @__PURE__ */ new Map()
);
var shortRule = (id) => id.replace(/^no-/u, "");
var SAMPLES = 3;
var labelsFor = (source, scope, found) => scope === "words" ? [...new Set(found.map((one) => shortSpan(source, one)))] : [...new Set(found.map((one) => shortRule(one.id)))];
var scopePart = (source, scope, found) => {
  const labels = labelsFor(source, scope, found);
  const shown = labels.slice(0, SAMPLES).join(", ");
  const more = labels.length > SAMPLES ? ", ..." : "";
  return `${found.length} ${scope} (${shown}${more})`;
};
var summary = (source, findings) => {
  if (findings.length === 0) {
    return "";
  }
  const by = grouped(findings);
  const parts = ORDER.filter((scope) => (by.get(scope) ?? []).length > 0).map(
    (scope) => scopePart(source, scope, by.get(scope))
  );
  return `${findings.length} style ${findings.length === 1 ? "issue" : "issues"} \u2014 ${parts.join("; ")}`;
};
var OFFERED = 56;
var swapsOffered = (source, finding) => {
  const swaps = (finding.suggestions ?? []).filter(
    ({ range: [from, to] }) => from === finding.start && to === finding.end
  ).map(({ text }) => collapse(text)).filter((text) => text !== "");
  if (swaps.length === 0) {
    return "";
  }
  const joined = swaps.join(", ");
  return `  -> ${joined.length > OFFERED ? `${joined.slice(0, OFFERED - 3)}...` : joined}`;
};
var row = (source, finding) => {
  const { line, column } = place(source, finding.start);
  const at = `${line}:${column}`.padEnd(8);
  const scope = scopeOf(finding).padEnd(10);
  const rule = finding.id.padEnd(28);
  return `  ${at}${scope}${rule}"${shortSpan(source, finding)}"${swapsOffered(
    source,
    finding
  )}`;
};
var listing = (source, findings) => findings.map((finding) => row(source, finding)).join("\n");
var header = (source, findings, label2) => `${label2}: ${wordsIn(source)} words, ${findings.length} ${findings.length === 1 ? "issue" : "issues"}`;
var density = (source, findings) => {
  const total = wordsIn(source);
  return total === 0 ? 0 : findings.length / total * 100;
};

export {
  ErrorId,
  editorial,
  allRules,
  configure,
  sentences,
  wordsIn,
  proseProblems,
  allProblems,
  spanOf,
  place,
  grouped,
  summary,
  listing,
  header,
  density
};
