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
  core: [
    // Pronouns
    { id: 'i', word: 'I', icon: '🙋', color: colors.pronoun, hidden: true },
    { id: 'me', word: 'Me', icon: '👈', color: colors.pronoun, hidden: true },
    { id: 'my', word: 'My', icon: '🎁', color: colors.pronoun, hidden: true }, // Abstract
    { id: 'you', word: 'You', icon: '👉', color: colors.pronoun, hidden: true },
    { id: 'it', word: 'It', icon: '📦', color: colors.pronoun, hidden: true },
    { id: 'he', word: 'He', icon: '👨', color: colors.pronoun, hidden: true },
    { id: 'she', word: 'She', icon: '👩', color: colors.pronoun, hidden: true },
    { id: 'we', word: 'We', icon: '🫂', color: colors.pronoun, hidden: true },
    { id: 'they', word: 'They', icon: '🧑‍🤝‍🧑', color: colors.pronoun, hidden: true },

    // Verbs
    { id: 'go', word: 'Go', icon: '🟢', color: colors.verb },
    { id: 'stop', word: 'Stop', pronounce: 'stopp', icon: '🛑', color: colors.verb },
    { id: 'want', word: 'Want', icon: '🤲', color: colors.verb },
    { id: 'need', word: 'Need', icon: '🙏', color: colors.verb },
    { id: 'like', word: 'Like', icon: '👍', color: colors.verb, hidden: true },
    { id: 'make', word: 'Make', icon: '🔨', color: colors.verb, hidden: true },
    { id: 'get', word: 'Get', icon: '👐', color: colors.verb, hidden: true },
    { id: 'put', word: 'Put', icon: '⬇️', color: colors.verb, hidden: true },
    { id: 'open', word: 'Open', icon: '📖', color: colors.verb, hidden: true },
    { id: 'close', word: 'Close', icon: '📕', color: colors.verb, hidden: true },
    { id: 'eat', word: 'Eat', icon: '🍎', color: colors.verb },
    { id: 'drink', word: 'Drink', icon: '🧃', color: colors.verb },
    { id: 'see', word: 'See', icon: '👀', color: colors.verb, hidden: true },
    { id: 'look', word: 'Look', icon: '🔍', color: colors.verb, hidden: true },
    { id: 'come', word: 'Come', icon: '👋', color: colors.verb, hidden: true },
    { id: 'help', word: 'Help', icon: '🤝', color: colors.verb, hidden: true },
    { id: 'say', word: 'Say', icon: '🗣️', color: colors.verb, hidden: true },
    { id: 'do', word: 'Do', icon: '✨', color: colors.verb, hidden: true },
    { id: 'have', word: 'Have', icon: '🤲', color: colors.verb, hidden: true },

    // Adjectives
    { id: 'more', word: 'More', icon: '➕', color: colors.adjective },
    { id: 'big', word: 'Big', icon: '🐘', color: colors.adjective, hidden: true },
    { id: 'little', word: 'Little', icon: '🐁', color: colors.adjective, hidden: true },
    { id: 'good', word: 'Good', icon: '😊', color: colors.adjective, hidden: true },
    { id: 'bad', word: 'Bad', icon: '☹️', color: colors.adjective, hidden: true },
    { id: 'new', word: 'New', icon: '✨', color: colors.adjective, hidden: true },
    { id: 'old', word: 'Old', icon: '👴', color: colors.adjective, hidden: true },
    { id: 'happy', word: 'Happy', icon: '😄', color: colors.adjective, hidden: true },
    { id: 'sad', word: 'Sad', icon: '😢', color: colors.adjective, hidden: true },
    { id: 'different', word: 'Different', icon: '🔀', color: colors.adjective, hidden: true },
    { id: 'same', word: 'Same', icon: '🔄', color: colors.adjective, hidden: true },

    // Prepositions
    { id: 'in', word: 'In', icon: '📥', color: colors.preposition, hidden: true },
    { id: 'out', word: 'Out', icon: '📤', color: colors.preposition, hidden: true },
    { id: 'on', word: 'On', icon: '🔛', color: colors.preposition, hidden: true },
    { id: 'off', word: 'Off', icon: '📴', color: colors.preposition, hidden: true },
    { id: 'up', word: 'Up', icon: '⬆️', color: colors.preposition, hidden: true },
    { id: 'down', word: 'Down', icon: '⬇️', color: colors.preposition, hidden: true },
    { id: 'to', word: 'To', icon: '➡️', color: colors.preposition, hidden: true },

    // Questions
    { id: 'what', word: 'What', icon: '❓', color: colors.question, hidden: true },
    { id: 'where', word: 'Where', icon: '🗺️', color: colors.question, hidden: true },
    { id: 'who', word: 'Who', icon: '👤', color: colors.question, hidden: true },
    { id: 'why', word: 'Why', icon: '🤔', color: colors.question, hidden: true },
    { id: 'how', word: 'How', icon: '🤷', color: colors.question, hidden: true },

    // Social
    { id: 'yes', word: 'Yes', icon: '✅', color: colors.social },
    { id: 'no', word: 'No', icon: '❌', color: colors.social },
    { id: 'please', word: 'Please', icon: '🥺', color: colors.social, hidden: true },
    { id: 'thank_you', word: 'Thank you', icon: '🙇', color: colors.social, hidden: true },
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
