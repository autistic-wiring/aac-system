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
  // Core communication board — dynamically laid out; cards are listed in
  // display order. `audioId` lets a card reuse a shared audio file instead
  // of regenerating. Cards with `image` + `animation` get a button that
  // animates on press; new words currently use emoji placeholders.
  core: [
    { id: 'strawberry', word: 'Strawberry', icon: '🍓', color: colors.noun, image: 'images/core/strawberry.png' },
    { id: 'orange',     word: 'Orange',     icon: '🍊', color: colors.noun, image: 'images/core/orange.png' },
    { id: 'apple',      word: 'Apple',      icon: '🍎', color: colors.noun, image: 'images/core/apple.png' },
    { id: 'cracker',    word: 'Cracker',    icon: '🍘', color: colors.noun, image: 'images/core/cracker.png', hidden: true },
    { id: 'bread',      word: 'Bread',      icon: '🍞', color: colors.noun, image: 'images/core/bread.png', hidden: true },
    { id: 'toast',      word: 'Toast',      icon: '🍞', color: colors.noun, image: 'images/core/toast.png', hidden: true },
    { id: 'water',      word: 'Water',      icon: '💧', color: colors.noun, image: 'images/core/water.png' },
    { id: 'wash',       word: 'Wash',       icon: '🧼', color: colors.verb, image: 'images/core/wash.png', animation: 'images/core/animated/wash.webp', animationDuration: 1.0 },
    { id: 'wipe',       word: 'Wipe',       icon: '🧻', color: colors.verb, image: 'images/core/wipe.png', animation: 'images/core/animated/wipe.webp', animationDuration: 1.0 },
    { id: 'wait',       word: 'Wait',       icon: '✋', color: colors.verb, image: 'images/core/wait.png', animation: 'images/core/animated/wait.webp', animationDuration: 1.0 },
    { id: 'eat',        word: 'Eat',        icon: '🍽️', color: colors.verb },
    { id: 'all_done',   word: 'All done',   icon: '🏁', color: colors.social, audioId: 'all-done', image: 'images/core/all_done.png', animation: 'images/core/animated/all_done.webp', animationDuration: 1.0 },
    { id: 'more',       word: 'More',       icon: '🤲', color: colors.social, image: 'images/core/more.png', animation: 'images/core/animated/more.webp', animationDuration: 1.0 },
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
      { id: 'apple', word: 'Apple', icon: '🍎', color: colors.noun, hidden: true },
      { id: 'orange', word: 'Orange', icon: '🍊', color: colors.noun, hidden: true },
      { id: 'bread', word: 'Bread', icon: '🍞', color: colors.noun, hidden: true },
      { id: 'bun', word: 'Bun', icon: '🥐', color: colors.noun, hidden: true },
      { id: 'cookies', word: 'Cookies', icon: '🍪', color: colors.noun, hidden: true },
      { id: 'cake', word: 'Cake', icon: '🍰', color: colors.noun, hidden: true },
      { id: 'cracker', word: 'Cracker', icon: '🍘', color: colors.noun, hidden: true },
      { id: 'keto', word: 'Keto', icon: '🥩', color: colors.noun, hidden: true },
      { id: 'cereal', word: 'Cereal', icon: '🥣', color: colors.noun, hidden: true },
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
