/**
 * disabilitySymptoms.ts
 * 
 * Centralized registry of keyword symptoms and markers for different disability profiles.
 * Used for AI auto-classification, string matching, and as a reference prompt for LLMs.
 */

export const visualWords = [
  'blind', 'visual', 'vision', 'eye', 'sight', 'screen reader',
  'can\'t see', 'cant see', 'cannot see', 'hard to see', 'trouble seeing',
  'low vision', 'partially sighted', 'visually impaired', 'blurry', 'blur',
  'magnifier', 'magnification', 'zoom', 'contrast', 'dark mode',
  'braille', 'cane', 'guide dog', 'retina', 'glaucoma', 'cataract',
  'macular', 'color blind', 'colour blind', 'colorblind', 'colourblind',
  'light sensitive', 'photophobic', 'squint', 'strain my eyes',
  'everything is dark', 'can barely see', 'losing my sight', 'lost my sight',
  'optic', 'cornea', 'lens implant', 'eye surgery', 'eye condition',
  'screen too bright', 'font too small', 'text too small', 'enlarge',
  'high contrast', 'inverted colors', 'inverted colours', 'tts', 'text to speech',
  'voiceover', 'jaws', 'nvda', 'narrator', 'talkback',
];

export const adhdWords = [
  'adhd', 'add', 'distract', 'attention', 'concentrate', 'concentration',
  'hyperactiv', 'impulsiv', 'can\'t focus', 'cant focus', 'cannot focus',
  'hard to focus', 'trouble focusing', 'lose focus', 'losing focus',
  'mind wander', 'wandering mind', 'zoning out', 'zone out', 'zoned out',
  'fidget', 'restless', 'sit still', 'can\'t sit', 'cant sit',
  'forgetful', 'forget things', 'keep forgetting', 'memory issues',
  'procrastinat', 'putting off', 'put things off', 'last minute',
  'time management', 'manage time', 'losing track', 'track of time',
  'easily bored', 'get bored', 'boring', 'need stimulation',
  'too many tabs', 'overwhelmed by tasks', 'task switching', 'multitask',
  'scattered', 'disorganiz', 'disorganis', 'messy', 'chaotic',
  'executive function', 'working memory', 'short attention',
  'daydream', 'spacing out', 'spaced out', 'inattentive', 'inattention',
  'hyperfocus', 'hyper focus', 'over focus', 'fixat',
  'medication', 'ritalin', 'adderall', 'concerta', 'vyvanse',
  'dopamine', 'reward system', 'instant gratification',
  'interrupt', 'blurt out', 'impatient', 'can\'t wait', 'cant wait',
];

export const autismWords = [
  'autism', 'autistic', 'asd', 'asperger', 'spectrum',
  'sensory', 'overstimulat', 'understimulat', 'stimming', 'stim',
  'overwhelm', 'overload', 'meltdown', 'shutdown', 'shutting down',
  'loud noise', 'noise', 'noisy', 'sound sensitiv', 'loud',
  'crowded', 'crowd', 'too many people', 'social situation',
  'bright light', 'fluorescent', 'flickering', 'flashing',
  'texture', 'fabric', 'clothing tag', 'itchy', 'scratchy',
  'routine', 'schedule', 'predictab', 'unpredictab', 'change',
  'transition', 'unexpected', 'surprise', 'new environment',
  'eye contact', 'facial expression', 'body language', 'tone of voice',
  'literal', 'sarcasm', 'idiom', 'figure of speech', 'metaphor',
  'special interest', 'intense interest', 'obsess', 'fixat', 'passion',
  'repetitive', 'pattern', 'sameness', 'same way', 'same order',
  'anxious', 'anxiety', 'nervous', 'worried', 'panic', 'stress',
  'too much information', 'too much', 'too fast', 'too loud', 'too bright',
  'can\'t cope', 'cant cope', 'cannot cope', 'falling apart',
  'need quiet', 'need space', 'need alone', 'need break', 'decompress',
  'mask', 'masking', 'pretending', 'exhausting to socialize',
  'social cue', 'social skill', 'small talk', 'conversation',
  'neurodiverg', 'neurodivers', 'atypical', 'different brain',
  'comfort zone', 'safe space', 'calming', 'soothing',
  'food texture', 'picky eat', 'smell', 'taste sensitiv',
  'echolalia', 'scripting', 'flat affect', 'monotone',
  'executive function', 'planning', 'organiz', 'priorit',
  'processing speed', 'processing time', 'need more time',
  'emotional regulat', 'self regulat', 'dysregulat',
  'over think', 'overthink', 'ruminate', 'ruminat',
  'burnt out', 'burnout', 'autistic burnout', 'exhausted',
  'nonverbal', 'non verbal', 'non-verbal', 'selective mutism', 'mute',
  'flapping', 'rocking', 'spinning', 'hand flapping',
  'sensory diet', 'sensory room', 'weighted blanket', 'fidget',
  'spoon theory', 'low spoons', 'no spoons', 'energy budget',
];

export const physicalWords = [
  'physical', 'motor', 'wheelchair', 'mobility', 'paralys',
  'movement', 'limb', 'walk', 'walking', 'leg', 'arm',
  'can\'t move', 'cant move', 'cannot move', 'limited movement',
  'cerebral palsy', 'cp', 'muscular dystrophy', 'md',
  'spinal cord', 'spinal injury', 'spine', 'back injury',
  'amputee', 'amputation', 'prosthetic', 'prosthesis',
  'fine motor', 'gross motor', 'coordination', 'balance',
  'tremor', 'shaking', 'spasm', 'spastic', 'spasticity',
  'dexterity', 'grip', 'grasp', 'pinch', 'typing',
  'keyboard', 'mouse', 'click', 'scroll', 'swipe',
  'assistive device', 'switch control', 'eye tracking',
  'voice control', 'voice command', 'sip and puff',
  'quadripleg', 'parapleg', 'hemipleg', 'tetrapleg',
  'stroke', 'brain injury', 'tbi', 'traumatic brain',
  'arthritis', 'joint', 'stiff', 'pain', 'chronic pain',
  'fatigue', 'tired easily', 'energy', 'stamina',
  'crutch', 'walker', 'scooter', 'adaptive',
  'one hand', 'single hand', 'left hand', 'right hand',
];

export const learningWords = [
  'dyslexia', 'dyslexic', 'read', 'reading', 'letter', 'spell',
  'spelling', 'writing', 'write', 'words', 'word',
  'mix up letters', 'letters jump', 'letters move', 'letters swim',
  'b and d', 'p and q', 'mirror', 'reverse', 'backward',
  'slow reader', 'reading speed', 'comprehension',
  'phonics', 'phonetic', 'sound out', 'sounding out',
  'decode', 'decoding', 'fluency', 'literacy',
  'dyscalculia', 'math', 'numbers', 'counting', 'arithmetic',
  'dysgraphia', 'handwriting', 'pencil grip', 'forming letters',
  'learning disability', 'learning difficulty', 'learning disorder',
  'slow learner', 'learn slowly', 'takes longer', 'need extra time',
  'tutoring', 'remedial', 'special education', 'iep',
  'processing disorder', 'auditory processing', 'visual processing',
  'working memory', 'short term memory', 'retain information',
  'study', 'homework', 'assignment', 'exam', 'test',
  'grade', 'failing', 'behind', 'catch up', 'gap',
];

export const allSymptomsMapping = {
  visual: visualWords,
  adhd: adhdWords,
  autism: autismWords,
  physical: physicalWords,
  learning: learningWords
};
