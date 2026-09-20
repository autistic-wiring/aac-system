// AAC Vocabulary Structure based on Modified Fitzgerald Key
// Yellow: Pronouns/People (#fcdb03, #ffeb3b)
// Green: Verbs (#4CAF50, #81c784)
// Orange: Nouns/Places/Things (#ff9800, #ffb74d)
// Blue: Adjectives (#2196F3, #64b5f6)
// Pink: Prepositions/Social (#e91e63, #f06292)
// Purple: Questions (#9c27b0, #ba68c8)
//
// Page layout copied from the GoTalk NOW app on the Tab A6 Kids tablet
// (2026-09-20, via wireless ADB screenshots). 4 pages:
//   1. Core words — More, All done, No, Want, Help (home board)
//   2. Core words (Action) — Eat, Drink water, Go washroom, Wipe, Wash
//   3. Favorite things — Strawberry, Crackers, Water play, Spinning, Music
//   4. Social greetings — Hi, Bye, Mommy, Daddy
// Buttons without `image` use emoji placeholders; buttons without a matching
// /audio/<id>.wav fall back to live TTS via speechAdapter.

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
};

export const defaultVocabulary = {
  // Home board = GoTalk "Core words" page, in fixed display order for motor
  // planning. Folder cards at the end link to the other three pages.
  core: [
    { id: 'more',     word: 'More',     icon: '🤲', color: colors.social, image: 'images/core/more.png', animation: 'images/core/animated/more.webp', animationDuration: 1.0 },
    { id: 'all_done', word: 'All done', icon: '🏁', color: colors.social, audioId: 'all-done', image: 'images/core/all_done.png', animation: 'images/core/animated/all_done.webp', animationDuration: 1.0 },
    { id: 'no',       word: 'No',       icon: '🚫', color: colors.social, image: 'images/core/no.png' },
    { id: 'want',     word: 'Want',     icon: '🙏', color: colors.verb, image: 'images/core/want.png' },
    { id: 'help',     word: 'Help',     icon: '🆘', color: colors.verb, image: 'images/core/help.png' },
    { id: 'action',    word: 'Core words Action', icon: '▶️', type: 'folder', color: colors.folder },
    { id: 'favorites', word: 'Favorite things',   icon: '⭐', type: 'folder', color: colors.folder },
    { id: 'social',    word: 'Social greetings',  icon: '👋', type: 'folder', color: colors.folder },
  ],
  folders: [
    { id: 'action', word: 'Core words (Action)', icon: '▶️', type: 'folder', color: colors.folder },
    { id: 'favorites', word: 'Favorite things', icon: '⭐', type: 'folder', color: colors.folder },
    { id: 'social', word: 'Social greetings', icon: '👋', type: 'folder', color: colors.folder },
  ],
  categories: {
    action: [
      { id: 'eat',         word: 'Eat',          icon: '🍽️', color: colors.verb },
      { id: 'drink_water', word: 'Drink water',  icon: '🥛', color: colors.verb },
      { id: 'go_washroom', word: 'Go washroom',  icon: '🚻', color: colors.verb, image: 'images/core/washroom.png' },
      { id: 'wipe',        word: 'Wipe',         icon: '🧻', color: colors.verb, image: 'images/core/wipe.png', animation: 'images/core/animated/wipe.webp', animationDuration: 1.0 },
      { id: 'wash',        word: 'Wash',         icon: '🧼', color: colors.verb, image: 'images/core/wash.png', animation: 'images/core/animated/wash.webp', animationDuration: 1.0 },
    ],
    favorites: [
      { id: 'strawberry', word: 'Strawberry', icon: '🍓', color: colors.noun, image: 'images/core/strawberry.png' },
      { id: 'crackers',   word: 'Crackers',   icon: '🍘', color: colors.noun, image: 'images/core/cracker.png', audioId: 'cracker' },
      { id: 'water_play', word: 'Water play', icon: '💦', color: colors.noun },
      { id: 'spinning',   word: 'Spinning',   icon: '🌀', color: colors.noun },
      { id: 'music',      word: 'Music',      icon: '🎵', color: colors.noun, audioId: 'music' },
    ],
    social: [
      { id: 'hi',     word: 'Hi',     icon: '👋', color: colors.social, image: 'images/core/hi.png' },
      { id: 'bye',    word: 'Bye',    icon: '👋', color: colors.social, image: 'images/core/bye.png' },
      { id: 'mommy',  word: 'Mommy',  icon: '👩', color: colors.pronoun },
      { id: 'daddy',  word: 'Daddy',  icon: '👨', color: colors.pronoun },
    ],
  }
};
