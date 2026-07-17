// AAC Vocabulary Structure based on Modified Fitzgerald Key
// Yellow: Pronouns/People (#fcdb03, #ffeb3b)
// Green: Verbs (#4CAF50, #81c784)
// Orange: Nouns/Places/Things (#ff9800, #ffb74d)
// Blue: Adjectives (#2196F3, #64b5f6)
// Pink: Prepositions/Social (#e91e63, #f06292)
// Purple: Questions (#9c27b0, #ba68c8)

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
  // Core communication board — 20 cards in a 5×4 grid (matches LessonPix board).
  // Cards are listed row-by-row so grid order is deterministic.
  // `audioId` lets duplicate cards reuse a shared audio file instead of regenerating.
  core: [
    // Row 1
    { id: 'help',      word: 'Help',      icon: '🤝', color: colors.verb, image: 'images/core/help.png', animation: 'images/core/animated/help.mp4' },
    { id: 'me',        word: 'Me',        icon: '👈', color: colors.pronoun, image: 'images/core/me.png' },
    { id: 'i',         word: 'I',         icon: '🙋', color: colors.pronoun, image: 'images/core/i.png' },
    { id: 'want',      word: 'Want',      icon: '🤲', color: colors.verb, image: 'images/core/want.png' },
    // Row 2
    { id: 'give',      word: 'Give',      icon: '👐', color: colors.verb, image: 'images/core/give.png' },
    { id: 'me2',       word: 'Me',        icon: '👈', color: colors.pronoun, audioId: 'me', image: 'images/core/me2.png' },
    { id: 'yes',       word: 'Yes',       icon: '✅', color: colors.social, image: 'images/core/yes.png' },
    { id: 'no',        word: 'No',        icon: '❌', color: colors.social, image: 'images/core/no.png' },
    // Row 3
    { id: 'hi',        word: 'Hi',        icon: '👋', color: colors.social, image: 'images/core/hi.png' },
    { id: 'bye',       word: 'Bye',       icon: '👋', color: colors.social, image: 'images/core/bye.png' },
    { id: 'my_turn',   word: 'My turn',   icon: '🙋', color: colors.pronoun, image: 'images/core/my_turn.png' },
    { id: 'your_turn', word: 'Your turn', icon: '👉', color: colors.pronoun, image: 'images/core/your_turn.png' },
    // Row 4
    { id: 'more',      word: 'More',      icon: '➕', color: colors.adjective, image: 'images/core/more.png' },
    { id: 'all_done',  word: 'All done',  icon: '🏁', color: colors.social, audioId: 'all-done', image: 'images/core/all_done.png' },
    { id: 'washroom',  word: 'Washroom',  icon: '🚻', color: colors.noun, image: 'images/core/washroom.png' },
    { id: 'wait',      word: 'Wait',      icon: '✋', color: colors.verb, image: 'images/core/wait.png' },
    // Row 5
    { id: 'i_eat',     word: 'I eat',     icon: '🍽️', color: colors.verb, pronounce: 'I eat', image: 'images/core/i_eat.png' },
    { id: 'i_drink',   word: 'I drink',   icon: '🥤', color: colors.verb, pronounce: 'I drink', image: 'images/core/i_drink.png' },
    { id: 'hi2',       word: 'Hi',        icon: '👋', color: colors.social, audioId: 'hi', image: 'images/core/hi2.png' },
    { id: 'bye2',      word: 'Bye',       icon: '👋', color: colors.social, audioId: 'bye', image: 'images/core/bye2.png' },
  ],
  folders: [
    { id: 'food', word: 'Foods', icon: '🍔', type: 'folder', color: colors.folder },
    { id: 'places', word: 'Places', icon: '🏠', type: 'folder', color: colors.folder, hidden: true },
    { id: 'people', word: 'People', icon: '👪', type: 'folder', color: colors.folder, hidden: true },
    { id: 'activities', word: 'Play', icon: '🧸', type: 'folder', color: colors.folder, hidden: true },
    { id: 'things', word: 'Things', icon: '👕', type: 'folder', color: colors.folder, hidden: true },
    { id: 'about_me', word: 'About Me', icon: 'ℹ️', type: 'folder', color: colors.folder, hidden: true },
  ],
  categories: {
    food: [
      { id: 'iced_strawberries', word: 'Iced Strawberries', icon: '🍓', color: colors.noun },
      { id: 'apple', word: 'Apple', icon: '🍎', color: colors.noun },
      { id: 'orange', word: 'Orange', icon: '🍊', color: colors.noun },
      { id: 'bread', word: 'Bread', icon: '🍞', color: colors.noun },
      { id: 'bun', word: 'Bun', icon: '🥐', color: colors.noun },
      { id: 'cookies', word: 'Cookies', icon: '🍪', color: colors.noun },
      { id: 'cake', word: 'Cake', icon: '🍰', color: colors.noun },
      { id: 'cracker', word: 'Cracker', icon: '🍘', color: colors.noun },
      { id: 'keto', word: 'Keto', icon: '🥩', color: colors.noun },
      { id: 'cereal', word: 'Cereal', icon: '🥣', color: colors.noun },
    ],
    places: [
      { id: 'home', word: 'Home', icon: '🏠', color: colors.noun },
      { id: 'school', word: 'School', icon: '🏫', color: colors.noun },
      { id: 'park', word: 'Park', icon: '🏞️', color: colors.noun },
      { id: 'store', word: 'Store', icon: '🛒', color: colors.noun },
      { id: 'restaurant', word: 'Restaurant', icon: '🍽️', color: colors.noun },
    ],
    people: [
      { id: 'mom', word: 'Mom', icon: '👩', color: colors.pronoun },
      { id: 'dad', word: 'Dad', icon: '👨', color: colors.pronoun },
      { id: 'teacher', word: 'Teacher', icon: '🧑‍🏫', color: colors.pronoun },
      { id: 'friend', word: 'Friend', icon: '🧑‍🤝‍🧑', color: colors.pronoun },
      { id: 'doctor', word: 'Doctor', icon: '👨‍⚕️', color: colors.pronoun },
    ],
    activities: [
      { id: 'book', word: 'Book', icon: '📖', color: colors.noun },
      { id: 'blocks', word: 'Blocks', icon: '🧱', color: colors.noun },
      { id: 'car_toy', word: 'Toy Car', icon: '🚗', color: colors.noun },
      { id: 'music', word: 'Music', icon: '🎵', color: colors.noun },
      { id: 'ipad', word: 'iPad', icon: '📱', color: colors.noun },
      { id: 'youtube', word: 'YouTube', icon: '▶️', color: colors.noun },
    ],
    things: [
      { id: 'shirt', word: 'Shirt', icon: '👕', color: colors.noun },
      { id: 'shoes', word: 'Shoes', icon: '👟', color: colors.noun },
      { id: 'pants', word: 'Pants', icon: '👖', color: colors.noun },
      { id: 'bed', word: 'Bed', icon: '🛏️', color: colors.noun },
      { id: 'chair', word: 'Chair', icon: '🪑', color: colors.noun },
      { id: 'toilet', word: 'Toilet', icon: '🚽', color: colors.noun },
    ],
    about_me: [
      { id: 'my_name', word: 'My Name Is', icon: '📛', color: colors.social },
      { id: 'im_hurt', word: 'I am hurt', icon: '🩹', color: colors.emergency },
      { id: 'sick', word: 'Sick', icon: '🤢', color: colors.emergency },
      { id: 'tired', word: 'Tired', icon: '😴', color: colors.adjective },
      { id: 'bathroom', word: 'Bathroom', icon: '🚻', color: colors.noun },
    ]
  }
};
