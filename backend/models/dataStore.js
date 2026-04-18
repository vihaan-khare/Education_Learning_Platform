const levels = [
  {
    id: "alphabets",
    title: "Alphabets",
    unlockOrder: 1,
    tasks: [
      { id: "a1", mode: "learn", prompt: "Tap the letter A", options: ["A", "M", "T"], answer: "A", hint: "A has a pointed top.", difficulty: "easy" },
      { id: "a2", mode: "learn", prompt: "Pick the uppercase B", options: ["b", "B", "d"], answer: "B", hint: "Uppercase is taller.", difficulty: "easy" },
      { id: "a3", mode: "learn", prompt: "Find letter D", options: ["D", "O", "Q"], answer: "D", hint: "Straight line plus curve.", difficulty: "easy" },
      { id: "a4", mode: "practice", prompt: "Which letter comes after C?", options: ["B", "D", "F"], answer: "D", hint: "Count forward.", difficulty: "easy" },
      { id: "a5", mode: "practice", prompt: "Find the vowel", options: ["L", "I", "P"], answer: "I", hint: "Vowels are A, E, I, O, U.", difficulty: "medium" },
      { id: "a6", mode: "practice", prompt: "Which comes before G?", options: ["E", "F", "H"], answer: "F", hint: "One step back.", difficulty: "medium" },
      { id: "a7", mode: "test", prompt: "Which letters match in sound: C and _", options: ["K", "E", "Y"], answer: "K", hint: "Both can sound like /k/.", difficulty: "medium" },
      { id: "a8", mode: "test", prompt: "Pick the missing letter: H, I, _, K", options: ["G", "J", "L"], answer: "J", hint: "It comes after I.", difficulty: "hard" },
      { id: "a9", mode: "test", prompt: "Pick the last letter in alphabet", options: ["X", "Y", "Z"], answer: "Z", hint: "It is the final letter.", difficulty: "hard" },
      { id: "a10", mode: "test", prompt: "Choose the pair in correct order", options: ["P,Q", "Q,P", "R,P"], answer: "P,Q", hint: "Alphabet goes forward.", difficulty: "hard" }
    ]
  },
  {
    id: "numbers",
    title: "Numbers",
    unlockOrder: 2,
    tasks: [
      { id: "n1", mode: "learn", prompt: "Select number 5", options: ["3", "5", "8"], answer: "5", hint: "It is in the middle.", difficulty: "easy" },
      { id: "n2", mode: "learn", prompt: "Which is the largest?", options: ["6", "2", "9"], answer: "9", hint: "Look for highest value.", difficulty: "easy" },
      { id: "n3", mode: "learn", prompt: "Pick number 0", options: ["0", "6", "9"], answer: "0", hint: "Round shape, no value.", difficulty: "easy" },
      { id: "n4", mode: "practice", prompt: "2 + 1 = ?", options: ["3", "4", "2"], answer: "3", hint: "Start at 2 and add one.", difficulty: "easy" },
      { id: "n5", mode: "practice", prompt: "7 - 3 = ?", options: ["4", "5", "6"], answer: "4", hint: "Count backward three.", difficulty: "medium" },
      { id: "n6", mode: "practice", prompt: "5 + 4 = ?", options: ["8", "9", "10"], answer: "9", hint: "Add both numbers.", difficulty: "medium" },
      { id: "n7", mode: "test", prompt: "What is 10 - 4?", options: ["5", "6", "7"], answer: "6", hint: "Count backward four.", difficulty: "medium" },
      { id: "n8", mode: "test", prompt: "Double of 6 is", options: ["10", "11", "12"], answer: "12", hint: "6 + 6.", difficulty: "hard" },
      { id: "n9", mode: "test", prompt: "Half of 8 is", options: ["2", "4", "6"], answer: "4", hint: "Split into two equal parts.", difficulty: "hard" },
      { id: "n10", mode: "test", prompt: "9 + 3 = ?", options: ["11", "12", "13"], answer: "12", hint: "Add three more to nine.", difficulty: "hard" }
    ]
  },
  {
    id: "spelling",
    title: "Spelling",
    unlockOrder: 3,
    tasks: [
      { id: "s1", mode: "learn", prompt: "Complete: C _ T", options: ["A", "E", "O"], answer: "A", hint: "Animal that says meow.", difficulty: "easy" },
      { id: "s2", mode: "learn", prompt: "Complete: D _ G", options: ["A", "O", "U"], answer: "O", hint: "Pet that barks.", difficulty: "easy" },
      { id: "s3", mode: "learn", prompt: "Complete: S _ N", options: ["A", "U", "I"], answer: "U", hint: "Bright in the sky.", difficulty: "easy" },
      { id: "s4", mode: "practice", prompt: "Pick correct word", options: ["frend", "friend", "freind"], answer: "friend", hint: "i comes before e here.", difficulty: "medium" },
      { id: "s5", mode: "practice", prompt: "Choose correct spelling", options: ["school", "skool", "schol"], answer: "school", hint: "Two o letters.", difficulty: "medium" },
      { id: "s6", mode: "practice", prompt: "Choose correct spelling", options: ["banana", "bananna", "bannana"], answer: "banana", hint: "Only one double letter pair.", difficulty: "medium" },
      { id: "s7", mode: "test", prompt: "Complete: B _ L L", options: ["A", "E", "O"], answer: "A", hint: "Round toy word.", difficulty: "medium" },
      { id: "s8", mode: "test", prompt: "Pick the right spelling", options: ["beautiful", "beutiful", "butiful"], answer: "beautiful", hint: "Starts with beau.", difficulty: "hard" },
      { id: "s9", mode: "test", prompt: "Pick the right spelling", options: ["because", "becuse", "beacause"], answer: "because", hint: "be + cause.", difficulty: "hard" },
      { id: "s10", mode: "test", prompt: "Complete: P _ A N E", options: ["L", "R", "T"], answer: "L", hint: "It flies in the sky.", difficulty: "hard" }
    ]
  },
  {
    id: "grammar",
    title: "Basic Grammar",
    unlockOrder: 4,
    tasks: [
      { id: "g1", mode: "learn", prompt: "Choose a noun", options: ["run", "happy", "book"], answer: "book", hint: "Nouns are things.", difficulty: "easy" },
      { id: "g2", mode: "learn", prompt: "Choose an adjective", options: ["green", "jump", "sing"], answer: "green", hint: "It describes something.", difficulty: "easy" },
      { id: "g3", mode: "learn", prompt: "Choose a pronoun", options: ["she", "table", "quick"], answer: "she", hint: "It replaces a noun.", difficulty: "easy" },
      { id: "g4", mode: "practice", prompt: "Pick a verb", options: ["jump", "blue", "table"], answer: "jump", hint: "Verbs are actions.", difficulty: "medium" },
      { id: "g5", mode: "practice", prompt: "They ___ playing.", options: ["is", "are", "am"], answer: "are", hint: "They pairs with are.", difficulty: "medium" },
      { id: "g6", mode: "practice", prompt: "We ___ happy.", options: ["is", "are", "was"], answer: "are", hint: "We takes are.", difficulty: "medium" },
      { id: "g7", mode: "test", prompt: "I ___ to school.", options: ["go", "goes", "gone"], answer: "go", hint: "With I, use base verb.", difficulty: "medium" },
      { id: "g8", mode: "test", prompt: "She ___ a song.", options: ["sing", "sings", "sung"], answer: "sings", hint: "She usually takes s.", difficulty: "hard" },
      { id: "g9", mode: "test", prompt: "They ___ football.", options: ["plays", "play", "played"], answer: "play", hint: "They takes base verb.", difficulty: "hard" },
      { id: "g10", mode: "test", prompt: "Choose correct sentence", options: ["He go home.", "He goes home.", "He going home."], answer: "He goes home.", hint: "He + goes.", difficulty: "hard" }
    ]
  },
  {
    id: "reading",
    title: "Reading Comprehension",
    unlockOrder: 5,
    tasks: [
      { id: "r1", mode: "learn", prompt: "Story: Sam has a red cap. What color is cap?", options: ["Blue", "Red", "Green"], answer: "Red", hint: "The sentence tells the color.", difficulty: "easy" },
      { id: "r2", mode: "learn", prompt: "Story: Leo ate an apple. What did Leo eat?", options: ["Apple", "Bread", "Rice"], answer: "Apple", hint: "Find the object word.", difficulty: "easy" },
      { id: "r3", mode: "learn", prompt: "Story: Nina has two cats. How many cats?", options: ["One", "Two", "Three"], answer: "Two", hint: "Look for number word.", difficulty: "easy" },
      { id: "r4", mode: "practice", prompt: "Story: Mia drinks milk at night. When?", options: ["Morning", "Night", "Noon"], answer: "Night", hint: "Look for time word.", difficulty: "medium" },
      { id: "r5", mode: "practice", prompt: "Story: Ria went to the park by bus. How did she go?", options: ["Bus", "Bike", "Walk"], answer: "Bus", hint: "Look for transport word.", difficulty: "medium" },
      { id: "r6", mode: "practice", prompt: "Story: Omar opened the door slowly. How did he open it?", options: ["Slowly", "Quickly", "Loudly"], answer: "Slowly", hint: "Find describing word.", difficulty: "medium" },
      { id: "r7", mode: "test", prompt: "Story: Ben ran fast and won. Who won?", options: ["Sam", "Mia", "Ben"], answer: "Ben", hint: "Winner is named at end.", difficulty: "hard" },
      { id: "r8", mode: "test", prompt: "Story: Ana read two books on Sunday. How many books?", options: ["One", "Two", "Three"], answer: "Two", hint: "Find the number in sentence.", difficulty: "hard" },
      { id: "r9", mode: "test", prompt: "Story: Raj kept the key in the box. Where is key?", options: ["Bag", "Box", "Desk"], answer: "Box", hint: "Location is in sentence.", difficulty: "hard" },
      { id: "r10", mode: "test", prompt: "Story: Pooja woke up early to study. Why did she wake early?", options: ["To play", "To study", "To sleep"], answer: "To study", hint: "Reason appears at end.", difficulty: "hard" }
    ]
  }
];

const serverScores = [];

export function getLevels() {
  return levels;
}

export function saveScore(scorePayload) {
  serverScores.push({ ...scorePayload, id: Date.now() });
  return serverScores;
}

export function getLeaderboard() {
  return [...serverScores]
    .sort((a, b) => b.points - a.points || a.timeMs - b.timeMs)
    .slice(0, 20);
}
