// GoTalk-style page system — replicates the speech therapist's GoTalk Lite
// setup (see email "Fwd: Visual supports for AAC device", 2026-08-14):
//   - one simple page per function, only 2 pictures per page
//   - fixed positions on each page for motor planning
//   - home button always visible; next cycles through pages
//
// `bakedLabel` buttons use card artwork extracted from the therapist's own
// GoTalk screenshots (label text is part of the image). Buttons without it
// render the label in CSS under the picture.

export const gotalkPages = [
  {
    id: 'turn_taking',
    title: 'Turn Taking',
    thumb: 'images/gotalk/my_turn.webp',
    buttons: [
      { id: 'my_turn', word: 'My turn', image: 'images/gotalk/my_turn.webp', bakedLabel: true },
      { id: 'your_turn', word: 'Your turn', image: 'images/gotalk/your_turn.webp', bakedLabel: true },
    ],
  },
  {
    id: 'yes_no',
    title: 'Yes No',
    thumb: 'images/gotalk/yes.webp',
    buttons: [
      { id: 'yes', word: 'Yes', image: 'images/gotalk/yes.webp', bakedLabel: true },
      { id: 'no', word: 'No', image: 'images/gotalk/no.webp', bakedLabel: true },
    ],
  },
  {
    id: 'more_block',
    title: 'More Block',
    thumb: 'images/core/more.png',
    buttons: [
      { id: 'more', word: 'More', image: 'images/core/more.png' },
      { id: 'all_done', word: 'All done', image: 'images/core/all_done.png', audioId: 'all-done' },
    ],
  },
  {
    id: 'help',
    title: 'Help',
    thumb: 'images/core/help.png',
    buttons: [
      { id: 'help_me', word: 'Help me', image: 'images/core/help.png' },
      { id: 'open', word: 'Open', icon: '🔓' },
    ],
  },
  {
    id: 'i_want',
    title: 'I Want',
    thumb: 'images/core/want.png',
    buttons: [
      { id: 'i_want', word: 'I want', image: 'images/core/want.png' },
      { id: 'more', word: 'More', image: 'images/core/more.png' },
    ],
  },
];

export const allGotalkButtons = gotalkPages.flatMap((page) => page.buttons);
