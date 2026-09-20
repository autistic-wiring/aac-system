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
// Voice is the GoTalk "Ivy" TTS (public/audio/*.wav); wipe + go washroom
// have no GoTalk recording and fall back to live TTS via speechAdapter.

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
  // Home board = GoTalk "Core words" page, in fixed display order for motor
  // planning. The bottom bar navigates to the other three pages.
  core: [
    { id: 'more',     word: 'More',     icon: '🤲', color: colors.gotalkBlue, image: `${G}more.png` },
    { id: 'all_done', word: 'All done', icon: '🏁', color: colors.gotalkBlue, audioId: 'all-done', image: `${G}all_done.png` },
    { id: 'no',       word: 'No',       icon: '🚫', color: colors.gotalkBlue, image: `${G}no.png` },
    { id: 'want',     word: 'Want',     icon: '🙏', color: colors.gotalkGreen, image: `${G}want.png` },
    { id: 'help',     word: 'Help',     icon: '🆘', color: colors.gotalkGreen, image: `${G}help.png` },
  ],
  folders: [
    { id: 'action', word: 'Core words (Action)', icon: '▶️', type: 'folder', color: colors.folder },
    { id: 'favorites', word: 'Favorite things', icon: '⭐', type: 'folder', color: colors.folder },
    { id: 'social', word: 'Social greetings', icon: '👋', type: 'folder', color: colors.folder },
  ],
  categories: {
    action: [
      { id: 'eat',         word: 'Eat',         icon: '🍽️', color: colors.gotalkWhite, image: `${G}eat.png` },
      { id: 'drink_water', word: 'Drink water', icon: '🥛', color: colors.gotalkWhite, image: `${G}drink_water.png` },
      { id: 'go_washroom', word: 'Go washroom', icon: '🚻', color: colors.gotalkWhite, image: `${G}go_washroom.png` },
      { id: 'wipe',        word: 'Wipe',        icon: '🧻', color: colors.gotalkWhite, image: `${G}wipe.png` },
      { id: 'wash',        word: 'Wash',        icon: '🧼', color: colors.gotalkWhite, image: `${G}wash.png` },
    ],
    favorites: [
      { id: 'strawberry', word: 'Strawberry', icon: '🍓', color: colors.gotalkWhite, image: `${G}strawberry.png` },
      { id: 'crackers',   word: 'Crackers',   icon: '🍘', color: colors.gotalkWhite, image: `${G}crackers.png`, audioId: 'cracker' },
      { id: 'water_play', word: 'Water play', icon: '💦', color: colors.gotalkWhite, image: `${G}water_play.png` },
      { id: 'spinning',   word: 'Spinning',   icon: '🌀', color: colors.gotalkWhite, image: `${G}spinning.png` },
      { id: 'music',      word: 'Music',      icon: '🎵', color: colors.gotalkWhite, image: `${G}music.png`, audioId: 'music' },
    ],
    social: [
      { id: 'hi',    word: 'Hi',    icon: '👋', color: colors.gotalkWhite, image: `${G}hi.png` },
      { id: 'bye',   word: 'Bye',   icon: '👋', color: colors.gotalkWhite, image: `${G}bye.png` },
      { id: 'mommy', word: 'Mommy', icon: '👩', color: colors.gotalkBlack, image: `${G}mommy.png` },
      { id: 'daddy', word: 'Daddy', icon: '👨', color: colors.gotalkBlack, image: `${G}daddy.png` },
    ],
  }
};
