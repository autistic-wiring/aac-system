// AAC Vocabulary Structure based on Modified Fitzgerald Key
// Yellow: Pronouns/People (#fcdb03, #ffeb3b)
// Green: Verbs (#4CAF50, #81c784)
// Orange: Nouns/Places/Things (#ff9800, #ffb74d)
// Blue: Adjectives (#2196F3, #64b5f6)
// Pink: Prepositions/Social (#e91e63, #f06292)
// Purple: Questions (#9c27b0, #ba68c8)
//
// Pages, artwork and voice copied from the GoTalk NOW app on the Tab A6 Kids
// tablet (2026-09-20, via wireless ADB). 4 pages:
//   1. Core words — More, All done, No, Want, Help (home board)
//   2. Core words (Action) — Eat, Drink water, Go washroom, Wipe, Wash
//   3. Favorite things — Strawberry, Crackers, Water play, Spinning, Music
//   4. Social greetings — Hi, Bye, Mommy, Daddy
// Card images live in public/images/gotalk/ (extracted from the GoTalk APK
// asset bundle, or cropped from app screenshots where the bundle differs).
// Voice is ElevenLabs Kat (see scripts/generate-kat-audio.js).
// Regenerate all button audio with `npm run generate-audio` (key via
// ELEVENLABS_API_KEY or the elevenlabs-api-key k8s secret). Older files were
// GoTalk Ivy recordings, gTTS, or local Piper — all replaced by the Kat bake;
// compare voices on /voice.
// Pictogram credit: "carry" piggyback symbol by ARASAAC (arasaac.org),
// CC BY-NC-SA. All other card images as labeled per-file.

const colors = {
  pronoun: '#ffeb3b', // Yellow
  verb: '#81c784',    // Green
  noun: '#ffb74d',    // Orange
  adjective: '#64b5f6', // Blue
  preposition: '#f48fb1', // Pink (using lighter pink for better contrast)
  social: '#f06292',  // Darker Pink
  question: '#ba68c8',// Purple
  emergency: '#ef5350', // Red
  folder: '#e0e0e0',  // Grey for folders
  // GoTalk NOW card backgrounds (sampled from app screenshots): blue/green
  // core-words cards, white everywhere else.
  gotalkBlue: '#40a1de',
  gotalkGreen: '#0ed601',
  gotalkWhite: '#ffffff',
  gotalkBlack: '#000000',
};

const G = 'images/gotalk/';

export const defaultVocabulary = {
  // Home board = first page, in fixed display order for motor planning.
  // 3x3 grid: eat, drink, more / go, help, all done / empty, play, empty.
  // Empty slots render as blank space (no button).
  core: [
    { id: 'eat',      word: 'Eat',      icon: '🍽️', color: colors.gotalkWhite, image: `${G}eat.png`, goto: 'eat_drink' },
    { id: 'drink',    word: 'Drink',    icon: '🥛', color: colors.gotalkWhite, image: `${G}drink.png`, goto: 'eat_drink' },
    { id: 'more',     word: 'More',     icon: '🤲', color: colors.gotalkBlue, image: `${G}more.png` },
    { id: 'go',       word: 'Go',       icon: '🚶', color: colors.gotalkWhite, image: `${G}go.png`, goto: 'place' },
    { id: 'help',     word: 'Help',     icon: '🆘', color: colors.gotalkGreen, image: `${G}help.png` },
    { id: 'all_done', word: 'All done', icon: '🏁', color: colors.gotalkBlue, audioId: 'all-done', image: `${G}all_done.png` },
    { id: 'empty_1', type: 'empty' },
    { id: 'play',     word: 'Play',     icon: '▶️', color: colors.gotalkWhite, image: `${G}play.png`, goto: 'play_page' },
    { id: 'empty_2', type: 'empty' },
  ],
  folders: [
    { id: 'eat_drink', word: 'Eat & Drink', icon: '🍽️', type: 'folder', color: colors.folder },
    { id: 'place', word: 'Place', icon: '📍', type: 'folder', color: colors.folder },
    { id: 'play_page', word: 'Play', icon: '🧸', type: 'folder', color: colors.folder },
    { id: 'action', word: 'Core words (Action)', icon: '▶️', type: 'folder', color: colors.folder },
    { id: 'favorites', word: 'Favorite things', icon: '⭐', type: 'folder', color: colors.folder },
    { id: 'social', word: 'Social greetings', icon: '👋', type: 'folder', color: colors.folder },
  ],
  categories: {
    eat_drink: [
      { id: 'strawberry', word: 'Strawberry', icon: '🍓', color: colors.gotalkWhite, image: `${G}strawberry.webp` },
      { id: 'orange',     word: 'Orange',     icon: '🍊', color: colors.gotalkWhite, image: `${G}orange.webp` },
      { id: 'apple',      word: 'Apple',      icon: '🍎', color: colors.gotalkWhite, image: `${G}apple.webp` },
      { id: 'cereal',     word: 'Cereal',     icon: '🥣', color: colors.gotalkWhite, image: `${G}cereal.webp` },
      { id: 'cracker',    word: 'Cracker',    icon: '🍘', color: colors.gotalkWhite, image: `${G}cracker.webp` },
      { id: 'empty_5', type: 'empty' },
      { id: 'empty_6', type: 'empty' },
      { id: 'water',      word: 'Water',      icon: '💧', color: colors.gotalkWhite, image: `${G}water.webp` },
      { id: 'empty_7', type: 'empty' },
    ],
    place: [
      { id: 'class',      word: 'Class',      icon: '🏫', color: colors.gotalkWhite, image: `${G}class.webp` },
      { id: 'gym',        word: 'Gym',        icon: '🏋️', color: colors.gotalkWhite, image: `${G}gym.webp` },
      { id: 'outdoor',    word: 'Outdoor',    icon: '🌳', color: colors.gotalkWhite, image: `${G}outdoor.png` },
      { id: 'empty_8', type: 'empty' },
      { id: 'playground', word: 'Playground', icon: '🛝', color: colors.gotalkWhite, image: `${G}playground.webp` },
      { id: 'empty_9', type: 'empty' },
      { id: 'washroom',  word: 'Washroom',  icon: '🚻', color: colors.gotalkWhite, image: `${G}go_washroom.png`, audioId: 'peepee', pronounce: 'pee pee' },
      { id: 'empty_11', type: 'empty' },
      { id: 'home_place', word: 'Home',       icon: '🏠', color: colors.gotalkWhite, image: `${G}home.png`, audioId: 'home' },
    ],
    play_page: [
      { id: 'blocks', word: 'Blocks', icon: '🧱', color: colors.gotalkWhite, image: `${G}blocks.png` },
      { id: 'cars',   word: 'Cars',   icon: '🚗', color: colors.gotalkWhite, image: `${G}cars.png` },
      { id: 'empty_12', type: 'empty' },
      { id: 'spin',   word: 'Spin',   icon: '🌀', color: colors.gotalkWhite, image: `${G}spin.png`, audioId: 'spinning' },
      { id: 'carry',  word: 'Carry',  icon: '📦', color: colors.gotalkWhite, image: `${G}carry.png` },
      { id: 'run',    word: 'Run',    icon: '🏃', color: colors.gotalkWhite, image: `${G}run.png` },
      { id: 'empty_13', type: 'empty' },
      { id: 'cap',    word: 'Cap',    icon: '🧢', color: colors.gotalkWhite, image: `${G}cap.png` },
      { id: 'empty_14', type: 'empty' },
    ],
    action: [
      { id: 'eat',         word: 'Eat',         icon: '🍽️', color: colors.gotalkWhite, image: `${G}eat.png` },
      { id: 'drink_water', word: 'Drink water', icon: '🥛', color: colors.gotalkWhite, image: `${G}drink_water.png` },
      { id: 'go_washroom', word: 'Go washroom', icon: '🚻', color: colors.gotalkWhite, image: `${G}go_washroom.png`, audioId: 'peepee' },
      { id: 'wipe',        word: 'Wipe',        icon: '🧻', color: colors.gotalkWhite, image: `${G}wipe.png` },
      { id: 'wash',        word: 'Wash',        icon: '🧼', color: colors.gotalkWhite, image: `${G}wash.png` },
    ],
    favorites: [
      { id: 'strawberry', word: 'Strawberry', icon: '🍓', color: colors.gotalkWhite, image: `${G}strawberry.webp` },
      { id: 'crackers',   word: 'Crackers',   icon: '🍘', color: colors.gotalkWhite, image: `${G}crackers.png`, audioId: 'cracker' },
      { id: 'water_play', word: 'Water play', icon: '💦', color: colors.gotalkWhite, image: `${G}water_play.png` },
      { id: 'spinning',   word: 'Spinning',   icon: '🌀', color: colors.gotalkWhite, image: `${G}spinning.png` },
      { id: 'music',      word: 'Music',      icon: '🎵', color: colors.gotalkWhite, image: `${G}music.png`, audioId: 'music' },
    ],
    social: [
      { id: 'hi',    word: 'Hi',    icon: '👋', color: colors.gotalkWhite, image: `${G}hi.png` },
      { id: 'bye',   word: 'Bye',   icon: '👋', color: colors.gotalkWhite, image: `${G}bye.png` },
      { id: 'mommy', word: 'Mommy', icon: '👩', color: colors.gotalkWhite, image: `${G}mommy.png` },
      { id: 'daddy', word: 'Daddy', icon: '👨', color: colors.gotalkWhite, image: `${G}daddy.png` },
    ],
  }
};
