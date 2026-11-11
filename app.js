/* Script Builder — free standalone app.
   All data lives in localStorage on this device under 'scriptBuilder.v1'.
   Optional cloud sync (Supabase, sign-in on the home screen) backs the
   same library up to the cloud and syncs it between devices — the app
   still works fully offline if the cloud can't be reached.
   Each signed-in account has its own local cache on a shared device,
   so signing in as someone else never pushes the previous person's
   scripts to the new account (see the cloud sync section below).
   One index card at a time. No clocks, no timing features of any kind.
   Flow: idea → logline → characters/arcs → beats/scenes → write → print. */
'use strict';

var LS_KEY = 'scriptBuilder.v1';
var WORDS_PER_PAGE = 250; /* rough screenplay estimate: ~250 words ≈ 1 page */
/* Industry-standard script pages: US Letter, 1in top/bottom/right, 1.5in left
   margins = 6in of text. Courier 12pt, single spaced = 6 lines per inch,
   9in of text per page. 53 lines per page leaves a safe rounding margin. */
var LINES_PER_PAGE = 53;

var GENRES = ['Horror','Comedy','Heist / Crime','Drama','Sci-Fi','Thriller',
  'Romance / Rom-Com','Action','Mystery','Coming-of-Age','Western / Neo-Western',
  'Fantasy','Horror-Comedy','Crime Drama','Sci-Fi Thriller','Wild Card — Your Pick'];

/* What are you writing? Sets the shape: Feature = acts you pick (3 or 5);
   TV Pilot = teaser + acts with act breaks; Streaming = one flow, no breaks. */
var FORMATS = {
  feature:   { label: 'Feature',            actsDefault: 3, teaser: false },
  tv:        { label: 'TV Pilot',           actsDefault: 4, teaser: true },
  streaming: { label: 'Streaming / Netflix', actsDefault: 1, teaser: false }
};

/* Methods — how to build the story, picked per script. The picker lives
   on the Story step; it only changes the Beats step. McKee is NOT a
   method (he has no beat sheet) — his principles ride along as short
   teaching cards on Story, Characters, and Draft, for every method.
   Page targets are Snyder's / Field's 110-page numbers; they are scaled
   to this script's targetPages (see scaledPage). Teaching notes are
   Juno's 1–2 line summaries, not book text. Sources: Snyder, Save the
   Cat! (2005); Field, Screenplay (1979); Truby, The Anatomy of Story
   (2007); Vogler, The Writer's Journey (1992); McKee, Story (1997). */
var METHODS = [
  { id: 'gabe', label: "Gabe's Template", book: 'Your starter template',
    blurb: 'Cold open → setup → big turn at midpoint → short outro.',
    unit: 'Beats', steps: [
    { key: 'cold', label: 'Cold Open', hint: 'What hooks us in the first page? What do we see first? The title card lands here.' },
    { key: 'inciting', label: 'Inciting Incident', hint: 'What wrecks the normal world and forces the hero to act? (Around scene 7.)' },
    { key: 'pp1', label: 'Plot Point 1 — into Act 2', hint: 'The decision they can’t take back. The door locks.' },
    { key: 'midpoint', label: 'Midpoint — the big turn / scare', hint: 'The biggest turn or scare, right in the middle. False win or false loss — the plan flips.' },
    { key: 'allIsLost', label: 'All Is Lost', hint: 'The lowest point. The flaw costs them everything.' },
    { key: 'climax', label: 'Climax + Outro', hint: 'The final showdown, then a short outro. The last image should answer the opening.' }
  ] },
  { id: 'save-the-cat', label: 'Save the Cat', book: 'Blake Snyder, Save the Cat! (2005)',
    blurb: '15 beats, each with a page target. Proportions, not law — a beat a few pages off is fine.',
    unit: 'Beats', steps: [
    { key: 'stc-opening', label: 'Opening Image', hint: 'A snapshot of the hero’s life before anything changes. The final image will mirror it.', page: 1 },
    { key: 'stc-theme', label: 'Theme Stated', hint: 'Someone says what the movie is really about — usually around page 5. The hero isn’t ready to hear it yet.', page: 5 },
    { key: 'stc-setup', label: 'Set-Up', hint: 'The hero’s world, and everything in it that needs fixing. Show the flaw in action.', range: [1, 10] },
    { key: 'stc-catalyst', label: 'Catalyst', hint: 'The event that knocks the old life over. Life can’t go back to how it was.', page: 12 },
    { key: 'stc-debate', label: 'Debate', hint: 'The hero hesitates — should I go? Can I? The question has to feel real, not a stall.', range: [12, 25] },
    { key: 'stc-break2', label: 'Break into Two', hint: 'The hero chooses to act and steps into the new world. Act 2 starts here.', page: 25 },
    { key: 'stc-bstory', label: 'B Story', hint: 'A new relationship that carries the theme. It teaches the hero what the A story can’t.', page: 30 },
    { key: 'stc-fun', label: 'Fun and Games', hint: 'The promise of the premise — the fun of the new world. This is the trailer part.', range: [30, 55] },
    { key: 'stc-midpoint', label: 'Midpoint', hint: 'A false victory or a false defeat. Either way, the stakes go up from here.', page: 55 },
    { key: 'stc-badguys', label: 'Bad Guys Close In', hint: 'Pressure tightens from outside and from within. The hero’s own team starts to crack.', range: [55, 75] },
    { key: 'stc-allislost', label: 'All Is Lost', hint: 'The worst moment. Something or someone dies — the old plan, the old self, or a person.', page: 75 },
    { key: 'stc-darknight', label: 'Dark Night of the Soul', hint: 'The hero sits in the loss before finding the answer. No fixing it yet — just the cost.', range: [75, 85] },
    { key: 'stc-break3', label: 'Break into Three', hint: 'The A story and the B story fuse into one solution. The theme becomes the plan.', page: 85 },
    { key: 'stc-finale', label: 'Finale', hint: 'The hero applies what they learned and proves they’ve changed. Show it, don’t say it.', range: [85, 110] },
    { key: 'stc-final', label: 'Final Image', hint: 'The opening image, transformed. Proof of change in one picture.', page: 110 }
  ] },
  { id: 'field', label: 'Syd Field', book: 'Syd Field, Screenplay (1979)',
    blurb: 'Three acts, 25/50/25. Plot points are turns, not scenes — a scene can carry one.',
    unit: 'Cards', steps: [
    { key: 'field-setup', label: 'Set-Up', hint: 'Hero, world, what they want, what’s in the way. Act 1.', range: [1, 25] },
    { key: 'field-pp1', label: 'Plot Point 1', hint: 'The incident that spins the story into Act 2. The door locks behind the hero.', page: 25 },
    { key: 'field-pinch1', label: 'Pinch Point 1', hint: 'A reminder of the opposing force. Pressure, not a full turn.', page: 37 },
    { key: 'field-midpoint', label: 'Midpoint', hint: 'The stakes raiser — false win or false loss, halfway through.', page: 55 },
    { key: 'field-pinch2', label: 'Pinch Point 2', hint: 'The second squeeze. The plan is failing and the flaw is showing.', page: 62 },
    { key: 'field-pp2', label: 'Plot Point 2', hint: 'The incident that spins the story into Act 3. The hero goes proactive.', page: 75 },
    { key: 'field-resolution', label: 'Resolution / Climax', hint: 'Did they succeed or fail? The solution, not just an ending.', range: [75, 110] }
  ] },
  { id: 'truby', label: 'Truby', book: 'John Truby, The Anatomy of Story (2007)',
    blurb: '22 steps, built from character. The 7 key steps are the spine; the rest is the full checklist.',
    unit: 'Steps', steps: [
    { key: 'truby-selfrev1', label: 'Self-revelation, need, and desire', hint: 'What will the hero learn by the end — and what are they wrong about at the start?' },
    { key: 'truby-ghost', label: 'Ghost and story world', hint: 'The past event that still haunts the hero. Show the world it made.' },
    { key: 'truby-weakness', label: 'Weakness and need', hint: 'The psychological and moral flaw. The need is what the story fixes.', keyStep: true },
    { key: 'truby-inciting', label: 'Inciting event', hint: 'The outside event that gives the hero a goal and forces action.' },
    { key: 'truby-desire', label: 'Desire', hint: 'What the hero wants, starting small and growing. The engine of the plot.', keyStep: true },
    { key: 'truby-ally', label: 'Ally or allies', hint: 'Helpers with their own goals — never more interesting than the hero.' },
    { key: 'truby-opponent', label: 'Opponent and/or mystery', hint: 'The person best able to attack the hero’s weakness. Not just the strongest villain.', keyStep: true },
    { key: 'truby-fakeally', label: 'Fake-ally opponent', hint: 'Seems like a friend, works against the hero — or turns into a true ally.' },
    { key: 'truby-rev1', label: 'First revelation and decision', hint: 'New information changes what the hero wants and why. Changed desire and motive.' },
    { key: 'truby-plan', label: 'Plan', hint: 'The hero’s strategy to beat the opponent. A plan that will fail is still a plan.', keyStep: true },
    { key: 'truby-oppplan', label: 'Opponent’s plan and counterattack', hint: 'The opponent fights back with their own plan. The story is two plans colliding.' },
    { key: 'truby-drive', label: 'Drive', hint: 'The long middle: the hero acts on the plan, step by step, toward apparent defeat.' },
    { key: 'truby-allyattack', label: 'Attack by ally', hint: 'The hero starts doing immoral things to win — and an ally calls it out.' },
    { key: 'truby-defeat', label: 'Apparent defeat', hint: 'About two-thirds in: the hero loses, badly. The plan is dead.' },
    { key: 'truby-rev2', label: 'Second revelation and decision', hint: 'Just after the defeat, a new revelation. Obsessive drive, changed desire and motive.' },
    { key: 'truby-audrev', label: 'Audience revelation', hint: 'The audience learns something the hero doesn’t yet — like who the fake ally is.' },
    { key: 'truby-rev3', label: 'Third revelation and decision', hint: 'The last big reveal, often unmasking the fake ally to the hero.' },
    { key: 'truby-gate', label: 'Gate, gauntlet, visit to death', hint: 'The conflict becomes unbearable. The hero passes through a gauntlet, inside or out.' },
    { key: 'truby-battle', label: 'Battle', hint: 'Who wins is decided by which values win, not by who hits hardest.', keyStep: true },
    { key: 'truby-selfrev2', label: 'Self-revelation', hint: 'The battle changes the hero. Face the truth about yourself or be destroyed.', keyStep: true },
    { key: 'truby-moral', label: 'Moral decision', hint: 'Choose between two courses of action, each with a real cost. This is the theme, acted out.' },
    { key: 'truby-equilibrium', label: 'New equilibrium', hint: 'The world after the choice — better, worse, or just different. The story’s last word.', keyStep: true }
  ] },
  { id: 'vogler', label: 'Vogler', book: 'Christopher Vogler, The Writer’s Journey (1992)',
    blurb: 'The Hero’s Journey in 12 stages. Best for one clear hero on a transformation arc — poor fit for ensemble; if that’s your script, use Truby instead.',
    unit: 'Stages', groups: [
      { title: 'Departure — Act 1', from: 0, to: 4 },
      { title: 'Initiation — Act 2', from: 5, to: 8 },
      { title: 'Return — Act 3', from: 9, to: 11 }
    ], steps: [
    { key: 'vog-ordinary', label: 'Ordinary World', hint: 'The hero’s normal life, with a stress pulling two ways. Show it, don’t explain it.' },
    { key: 'vog-call', label: 'Call to Adventure', hint: 'Something shakes the situation up. The beginnings of change.' },
    { key: 'vog-refusal', label: 'Refusal of the Call', hint: 'Fear of the unknown. The hero turns away — or someone else voices the danger.' },
    { key: 'vog-mentor', label: 'Meeting the Mentor', hint: 'Someone who has been there gives the hero what they need to go on.' },
    { key: 'vog-threshold', label: 'Crossing the First Threshold', hint: 'The hero commits and enters the new world. End of Act 1.' },
    { key: 'vog-tests', label: 'Tests, Allies, Enemies', hint: 'The new world’s rules, learned by trial. Friends and foes sorted out.' },
    { key: 'vog-approach', label: 'Approach to the Inmost Cave', hint: 'Getting ready for the central ordeal. The danger is close now.' },
    { key: 'vog-ordeal', label: 'Ordeal', hint: 'The midpoint crisis. The hero faces death — literal or of the old self — and survives.' },
    { key: 'vog-reward', label: 'Reward (Seizing the Sword)', hint: 'What the ordeal earned. A prize, a truth, or a person to bring back.' },
    { key: 'vog-roadback', label: 'The Road Back', hint: 'About three-quarters in: driven to finish and bring the treasure home.' },
    { key: 'vog-resurrection', label: 'Resurrection', hint: 'The last test, on the threshold of home. Death and rebirth, on a higher level.' },
    { key: 'vog-elixir', label: 'Return with the Elixir', hint: 'Home again, changed — carrying something that transforms the ordinary world.' }
  ] }
];
function methodDef(id) {
  for (var i = 0; i < METHODS.length; i++) if (METHODS[i].id === id) return METHODS[i];
  return METHODS[0];
}
function methodDefFor(s) { return methodDef(s && s.method); }
/* Gabe's 6 beats live in s.beats; every other method's steps live in
   s.methodBeats, so switching method never overwrites the other one's
   text. */
function methodBeatPath(step, md) {
  return (md && md.id === 'gabe' ? 'beats.' : 'methodBeats.') + step.key;
}
function methodBeatValue(s, step, md) {
  if (!s) return '';
  if (md && md.id === 'gabe') return (s.beats && s.beats[step.key]) || '';
  return (s.methodBeats && s.methodBeats[step.key]) || '';
}
/* Scale a 110-page target to this script's length. Never hardcode 110. */
function scaledPage(s, p) {
  return Math.max(1, Math.round(p * targetPages(s) / 110));
}
function methodPageTag(s, step) {
  var tp = targetPages(s);
  if (step.page) return '~p' + scaledPage(s, step.page) + ' of ' + tp + ' (' + Math.round(100 * step.page / 110) + '%)';
  if (step.range) return '~pp' + scaledPage(s, step.range[0]) + '–' + scaledPage(s, step.range[1]) + ' of ' + tp;
  return '';
}
function setMethod(s, id) {
  var md = methodDef(id);
  if (!md || md.id === s.method) return;
  touchLocal();
  s.method = md.id;
}
/* McKee, Story (1997) — principles, not a beat sheet. Short collapsible
   cards that ride along with any method; they never block typing. */
function mckeeDetails(title, body) {
  return '<details class="mckee"><summary>McKee — ' + esc(title) + '</summary><p class="muted">' + esc(body) + '</p></details>';
}

/* Act plans: title + "this is where we need X" prompt + suggested scene count.
   Totals all add to 42 scenes (~85 pages). Counts are suggestions — editable. */
var ACT_PLANS = {
  1: [{ title: 'The Whole Story', prompt: 'One continuous arc — set it up, squeeze it, land it. This is where we need everything: the world, the want, the turn, and the ending.', scenes: 42 }],
  2: [{ title: 'Setup', prompt: 'This is where we need the world, the hero, and what they want — and the door locking behind them.', scenes: 14 },
      { title: 'Confrontation & Resolution', prompt: 'This is where we need the fight: tries, fails, lowest point — then the new resolve and the landing.', scenes: 28 }],
  3: [{ title: 'Setup and lock-in', prompt: 'This is where we need the hero in their normal world, the thing that wrecks it, and the decision they can’t take back.', scenes: 10 },
      { title: 'Confrontation', prompt: 'This is where we need the fun of the premise, the plan falling apart, and the flaw costing them — down to the lowest point.', scenes: 22 },
      { title: 'Resolution', prompt: 'This is where we need the new resolve, the final showdown, and a fast landing. No new characters, no new rules.', scenes: 10 }],
  4: [{ title: 'Setup', prompt: 'This is where we need the world, the hero, and the want — shown in action, not explained.', scenes: 10 },
      { title: 'Rising Action', prompt: 'This is where we need the plan in motion: early wins, new allies, and the mistake that will cost them later.', scenes: 12 },
      { title: 'Confrontation', prompt: 'This is where we need the squeeze: betrayals, pressure, the flaw backfiring — to the lowest point.', scenes: 12 },
      { title: 'Resolution', prompt: 'This is where we need the new resolve, the final showdown, and the ending that answers the opening.', scenes: 8 }],
  5: [{ title: 'Exposition', prompt: 'This is where we need the world and the hero — who they are, what they want, and what’s ordinary before it breaks.', scenes: 8 },
      { title: 'Rising Action', prompt: 'This is where we need the trouble to build: the hero tries, the stakes climb, complications stack up.', scenes: 12 },
      { title: 'Climax', prompt: 'This is where we need the big turn — the moment everything flips and there’s no going back.', scenes: 6 },
      { title: 'Falling Action', prompt: 'This is where we need the fallout: the plan frays, the cost lands, the hero is at their lowest.', scenes: 8 },
      { title: 'Resolution', prompt: 'This is where we need the new resolve, the final face-off, and a clean landing.', scenes: 8 }]
};
var ACT_WORDS = ['ONE', 'TWO', 'THREE', 'FOUR', 'FIVE'];

/* Page + scene targets depend on the structure, not a fixed 85.
   Feature ≈ 85 pages / 42 scenes. TV 30-min ≈ 30 pages / 22 scenes.
   TV 60-min ≈ 60 pages / 38 scenes. Streaming episode ≈ 55 pages / 38. */
function targetPages(s) {
  if (s.format === 'tv') return s.tvLength === '30' ? 30 : 60;
  if (s.format === 'streaming') return 55;
  return 85;
}
function templateScenes(s) {
  if (s.format === 'tv') return s.tvLength === '30' ? 22 : 38;
  if (s.format === 'streaming') return 38;
  return 42;
}
/* Streaming has no act breaks — its one section is the Episode Arc. */
function actStepLabel(s, a) {
  return s.format === 'streaming' ? 'Episode Arc' : 'Act ' + a;
}

var CHAR_DEFS = [
  { key: 'pro',  short: 'Pro', heading: 'Protagonist — the hero',       role: 'Protagonist',   kind: 'main' },
  { key: 'ant',  short: 'Ant', heading: 'Antagonist / opposing force',  role: 'Antagonist',    kind: 'main' },
  { key: 'sup1', short: 'S1',  heading: 'Supporting character 1',      role: 'Supporting 1', kind: 'sup' },
  { key: 'sup2', short: 'S2',  heading: 'Supporting character 2',      role: 'Supporting 2', kind: 'sup' },
  { key: 'sup3', short: 'S3',  heading: 'Supporting character 3',      role: 'Supporting 3', kind: 'sup' }
];
var ARC_STAGES = ['', 'Beginning', 'Middle', 'End'];

/* Screenplay blocks for the writing view. The type is picked from a
   <select> in the block bar; Enter guesses the next block's type. */
var BLOCK_TYPES = [
  { t: 'action',    label: 'Action',     ph: 'Action — what we see and hear.' },
  { t: 'character', label: 'CHARACTER',  ph: 'CHARACTER NAME' },
  { t: 'dialogue',  label: 'Dialogue',   ph: 'What they say.' },
  { t: 'paren',     label: '(aside)',    ph: '(quietly, not looking up)' },
  { t: 'transition', label: 'TRANSITION', ph: 'CUT TO:' }
];
function blockTypeDef(t) {
  for (var i = 0; i < BLOCK_TYPES.length; i++) if (BLOCK_TYPES[i].t === t) return BLOCK_TYPES[i];
  return BLOCK_TYPES[0];
}

/* ---------------- state ---------------- */
function blankScene() {
  /* revise = "what to tighten" — a note to your future self. It never
     overwrites the scene above it. purpose/stakes keep plot + characters
     moving so nobody gets dropped. */
  return { slug: '', happens: '', turn: '', purpose: '', stakes: '', revise: '',
           pages: '', done: false, draft: '', blocks: [], tagChar: '', tagArc: '', typeText: '' };
}
function blankScript(n) {
  return {
    id: n, title: 'Untitled ' + n, genre: '',
    format: 'feature', tvLength: '60', acts: 3, actCounts: [10, 22, 10], teaserCount: 0,
    method: 'gabe', methodBeats: {},
    /* pos = where he left off, so any script reopens on the exact card. */
    pos: { step: 0, act1: 0, act2: 0, act3: 0, act4: 0, act5: 0, char: 0, draft: 0 },
    updatedAt: '',
    story: { logline: '', hero: '', want: '', need: '', antagonist: '', stakes: '',
             ending: '', endingWhy: '', theme: '', whyGenre: '', seasonArc: '', byline: 'Gabe Arredondo',
             moralArgument: '' },
    chars: {
      pro:  { name: '', want: '', need: '', talk: '', conflict: '', arcBegin: '', arcMid: '', arcEnd: '' },
      ant:  { name: '', want: '', need: '', talk: '', conflict: '', arcBegin: '', arcMid: '', arcEnd: '' },
      sup1: { name: '', job: '', trait: '', arcBegin: '', arcMid: '', arcEnd: '' },
      sup2: { name: '', job: '', trait: '', arcBegin: '', arcMid: '', arcEnd: '' },
      sup3: { name: '', job: '', trait: '', arcBegin: '', arcMid: '', arcEnd: '' }
    },
    beats: { cold: '', inciting: '', pp1: '', midpoint: '', allIsLost: '', climax: '' },
    scenes: [], /* filled below: 42 blank scene cards */
    notes: '', learned: '', finalPages: '', dateFinished: '',
    cleanup: { read: false, beats: false, turns: false, hero: false, dialogue: false, pages: false, ending: false }
  };
}
function seed() {
  /* The library starts empty — tap ＋ New Script to start the first one.
     No preset list, no dates, no cap. */
  return { scripts: [], updatedAt: '' };
}
/* Suggested scene counts per act, scaled to however many scenes exist now. */
function suggestedCounts(total, n) {
  var base = ACT_PLANS[n].map(function (a) { return a.scenes; });
  var sum = 0; base.forEach(function (b) { sum += b; });
  var counts = base.map(function (b) { return Math.floor(b * total / sum); });
  var csum = 0; counts.forEach(function (c) { csum += c; });
  var i = 0;
  while (csum < total) { counts[i % n]++; csum++; i++; }
  return counts;
}
/* Fill in any fields older saves don't have, so an update never wipes work. */
function normalize(db) {
  if (!db || !Array.isArray(db.scripts)) return seed();
  if (typeof db.updatedAt !== 'string') db.updatedAt = '';
  if (!db.scripts.length) return db; /* an empty library is a valid state */
  delete db.startDate; /* old saves carried a year start date — no longer used */
  var seenIds = {};
  db.scripts.forEach(function (s, si) {
    if (typeof s.id !== 'number' || seenIds[s.id]) s.id = si + 1;
    seenIds[s.id] = true;
    if (!FORMATS[s.format]) s.format = 'feature';
    /* Methods: old scripts predate the picker — they are Gabe's
       template, with their 6 beats intact. Never drop a method's
       text when normalizing. */
    if (!methodDef(s.method) || s.method !== methodDef(s.method).id) s.method = 'gabe';
    if (!s.methodBeats || typeof s.methodBeats !== 'object' || Array.isArray(s.methodBeats)) s.methodBeats = {};
    if (!s.beats || typeof s.beats !== 'object') s.beats = {};
    ['cold', 'inciting', 'pp1', 'midpoint', 'allIsLost', 'climax'].forEach(function (k) {
      if (typeof s.beats[k] !== 'string') s.beats[k] = '';
    });
    if (s.tvLength !== '30' && s.tvLength !== '60') s.tvLength = '60';
    if (typeof s.acts !== 'number' || s.acts < 1 || s.acts > 5) s.acts = FORMATS[s.format].actsDefault;
    if (!Array.isArray(s.actCounts) || s.actCounts.length !== s.acts) {
      s.actCounts = suggestedCounts(s.scenes.length, s.acts);
    }
    /* Repair drift: counts must add up to the scene list. Fix the last act. */
    var sum = 0; s.actCounts.forEach(function (c) { sum += c; });
    var diff = s.scenes.length - sum;
    if (diff !== 0) s.actCounts[s.actCounts.length - 1] = Math.max(0, s.actCounts[s.actCounts.length - 1] + diff);
    s.teaserCount = s.format === 'tv' ? 3 : 0;
    if (!s.pos) s.pos = {};
    var oldPos = s.pos;
    s.pos = { step: oldPos.step || 0, act1: oldPos.act1 || 0,
      act2: oldPos.act2a || oldPos.act2 || 0, act3: oldPos.act3 || 0,
      act4: oldPos.act4 || 0, act5: oldPos.act5 || 0,
      char: oldPos.char || 0, draft: oldPos.draft || 0,
      /* notesHidden survives only as a real boolean; anything else
         means "never set" and the draft picks its own default. */
      notesHidden: (typeof oldPos.notesHidden === 'boolean' ? oldPos.notesHidden : undefined),
      /* Draft mode survives only as 'cards' or 'type'; anything else
         means "never set" and the draft defaults to Cards. */
      draftMode: (oldPos.draftMode === 'type' || oldPos.draftMode === 'cards') ? oldPos.draftMode : undefined };
    if (typeof s.updatedAt !== 'string') s.updatedAt = '';
    if (!s.story) s.story = {};
    if (typeof s.story.byline !== 'string') s.story.byline = 'Gabe Arredondo';
    if (typeof s.story.seasonArc !== 'string') s.story.seasonArc = '';
    if (typeof s.story.moralArgument !== 'string') s.story.moralArgument = '';
    ['pro', 'ant', 'sup1', 'sup2', 'sup3'].forEach(function (k) {
      if (!s.chars) s.chars = {};
      if (!s.chars[k]) s.chars[k] = {};
      ['name', 'want', 'need', 'talk', 'conflict', 'job', 'trait', 'arcBegin', 'arcMid', 'arcEnd'].forEach(function (f) {
        if (typeof s.chars[k][f] !== 'string') s.chars[k][f] = '';
      });
    });
    s.scenes.forEach(function (sc) {
      if (typeof sc.tagChar !== 'string') sc.tagChar = '';
      if (typeof sc.tagArc !== 'string') sc.tagArc = '';
      if (typeof sc.draft !== 'string') sc.draft = '';
      if (typeof sc.revise !== 'string') sc.revise = '';
      if (typeof sc.purpose !== 'string') sc.purpose = '';
      if (typeof sc.stakes !== 'string') sc.stakes = '';
      if (!Array.isArray(sc.blocks)) {
        sc.blocks = (sc.draft && sc.draft.trim()) ? [{ t: 'action', x: sc.draft }] : [];
      } else if (!sc.blocks.length && sc.draft && sc.draft.trim()) {
        /* Legacy plain-text draft with an empty blocks array — same move. */
        sc.blocks = [{ t: 'action', x: sc.draft }];
      }
      /* Type mode's raw text: if it differs from what the blocks say,
         it was typed and never parsed (closed without a blur, or typed
         on another device) — parse it once so the blocks always reflect
         the latest typed text. syncTypeText() keeps the two in step
         after every Cards-mode edit, so this only ever fires for
         genuinely unparsed text. */
      if (typeof sc.typeText !== 'string') sc.typeText = '';
      if (sc.typeText && sc.typeText !== serializeScene(sc)) {
        var tp = parseTypeText(sc.typeText);
        sc.slug = tp.slug;
        sc.blocks = tp.blocks;
        sc.typeText = serializeScene(sc);
      }
    });
    if (!s.cleanup) s.cleanup = { read: false, beats: false, turns: false, hero: false, dialogue: false, pages: false, ending: false };
  });
  return db;
}
function load() {
  try {
    var raw = localStorage.getItem(LS_KEY);
    if (!raw) return seed();
    var db = JSON.parse(raw);
    if (!db || !Array.isArray(db.scripts)) return seed();
    return normalize(db);
  } catch (e) { return seed(); }
}
var DB = load();
var currentId = 1;
var currentStep = 0;

function save() {
  /* Stamp "last worked" on the open script, so the dashboard date is real. */
  if (!document.getElementById('view-wizard').hidden) {
    cur().updatedAt = new Date().toISOString();
  }
  if (cloudUser) libraryOwner = cloudUser.id;
  persistLocal();
  var note = document.getElementById('saved-note');
  if (note) note.textContent = 'Saved on this device · ' + new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  scheduleCloudPush();
}
/* Stamp the library itself with "last changed here" — the clock the
   auto-sync uses for last-write-wins. Only ever called from real edit
   paths (typing, structural changes), never from navigation, so merely
   opening a script or returning home can never make this device look
   newer than it is. */
function touchLocal() {
  DB.updatedAt = new Date().toISOString();
}

/* ---------------- cloud sync (Supabase, optional) ----------------
   The app is fully usable without it: localStorage is the offline cache
   and the source of truth on this device. Cloud sync only ever runs
   when the user is signed in, and a failed / unreachable cloud never
   blocks typing, saving locally, or printing.
   - Project: script-builder (separate from Sumo), free tier.
   - Table: public.script_libraries, one row per user (user_id = auth.uid()).
   - Auth: email + password, email confirmation ON (see README).
   - The publishable (anon) key below is a public frontend key. Row
     Level Security only ever lets a user read/write their own row.
     NEVER put a service_role key in this app.
   - No password is ever stored. Only the Supabase session (access +
     refresh token) is kept, under SB_SESSION_KEY, so sign-in survives
     a reload on that device. Sign out clears it.
   Sync rules (decideSync, pure + tested in smoke6/8) — last-write-wins:
   - cloud empty + local has scripts -> push local up
   - cloud has scripts + local empty -> pull cloud down
   - both non-empty and identical -> nothing to do
   - both non-empty and different -> the newer copy wins, by timestamp
     (cloud row updated_at, else the newest script updatedAt on that
     side): cloud newer -> pull automatically, local newer -> push
     automatically. Only when the timestamps are missing, tied, or
     unreadable does the app stop and ask — never overwrite either
     side silently, and never overwrite non-empty data with empty data.
   - Re-checks run automatically (no Sync Now press needed): on load,
     on sign-in, when the app regains focus / becomes visible, and
     when you return to the home screen. A pull never swaps the
     library out from under an open script — while you're editing,
     the app pushes your work first and waits for you to leave that
     screen. Closing the app flushes any pending push right away
     (pagehide / hidden) and never signs you out.
   Shared-device rule (per-user local caches, tested in smoke7):
   LS_KEY holds the library currently on screen; who it belongs to is
   recorded under LS_OWNER_KEY (a user id, '' for the signed-out
   cache, or no record at all for a library saved before this fix —
   owner unknown, "legacy"). Each account also has its own stash key.
   Signing in stashes the on-screen library under its previous owner,
   then loads the new account's own stash (or starts empty). A library
   with no known owner, or one saved while signed out, is never
   auto-pushed: the app asks first ("Are they yours?") and only
   uploads it on an explicit Yes. Signing out stashes the account's
   library under its key and restores the signed-out cache. A local
   library is only ever pushed to the cloud account of the user it
   belongs to. */
var SB_URL = 'https://elnbqrnljdqvjcbpyxne.supabase.co';
var SB_ANON = 'sb_publishable_3rtVB9nuc61cLb5I7nhYZg_WFlxlk79';
var SB_SESSION_KEY = 'scriptBuilder.session.v1';
var CLOUD_DEBOUNCE_MS = 2000;

function loadCloudSession() {
  try {
    var raw = localStorage.getItem(SB_SESSION_KEY);
    if (!raw) return null;
    var s = JSON.parse(raw);
    if (!s || !s.access_token || !s.user_id) return null;
    return s;
  } catch (e) { return null; }
}
var cloudSession = loadCloudSession();
var cloudUser = cloudSession ? { id: cloudSession.user_id, email: cloudSession.email || '' } : null;
var cloudState = cloudUser ? 'local' : 'off'; /* off|saving|synced|local|error|choosing|claim|pulled */
var cloudLastSync = null;
var cloudPushHandle = null;
var cloudBusy = false;
var cloudPushPending = false;
var cloudLastPush = null; /* last pushCloud() promise — Update waits on it */
var cloudLastPushAt = 0; /* ms local and cloud were last known equal */
var cloudSuppressPush = false;
var localUnsynced = false; /* a local edit has not reached the cloud yet */
var pendingCloud = null; /* {db, updatedAt} — the cloud copy awaiting a choice */
var pendingClaim = null; /* {db, kind} — an unclaimed local library awaiting an answer */

/* ---- per-user local caches ---- */
var LS_OWNER_KEY = 'scriptBuilder.owner.v1';
var LS_SIGNEDOUT_KEY = 'scriptBuilder.signedout.v1';
var LS_LEGACY_KEY = 'scriptBuilder.legacy.v1';
var LS_LEGACY_BACKUP_KEY = 'scriptBuilder.legacy-backup.v1';
var LS_USER_PREFIX = 'scriptBuilder.user.';
function stashKeyFor(ownerId) {
  if (ownerId === '') return LS_SIGNEDOUT_KEY;
  if (ownerId === null) return LS_LEGACY_KEY;
  return LS_USER_PREFIX + ownerId;
}
/* Owner record: returns a user id, '' for the signed-out cache, or
   undefined when no record exists (a library saved before this fix —
   owner unknown). */
function loadOwnerRecord() {
  try {
    var raw = localStorage.getItem(LS_OWNER_KEY);
    if (!raw) return undefined;
    var o = JSON.parse(raw);
    return (o && typeof o.userId === 'string') ? o.userId : '';
  } catch (e) { return undefined; }
}
/* Who the library currently in LS_KEY belongs to: a user id, '' for
   the signed-out cache, or null when it is unknown (legacy). */
var libraryOwner = (function () {
  var rec = loadOwnerRecord();
  if (rec !== undefined) return rec;
  return isEmptyDB(DB) ? '' : null;
})();
function persistOwner() {
  /* Legacy (unknown owner): leave no record, so the claim question
     still fires on the next sign-in instead of being silently settled. */
  if (libraryOwner === null) return;
  try { localStorage.setItem(LS_OWNER_KEY, JSON.stringify({ userId: libraryOwner, email: cloudUser ? (cloudUser.email || '') : '' })); } catch (e) {}
}
function persistLocal() {
  try { localStorage.setItem(LS_KEY, JSON.stringify(DB)); } catch (e) {}
  persistOwner();
}
function loadStash(ownerId) {
  try {
    var raw = localStorage.getItem(stashKeyFor(ownerId));
    if (!raw) return null;
    var db = JSON.parse(raw);
    return (db && Array.isArray(db.scripts)) ? db : null;
  } catch (e) { return null; }
}
function stashLibrary(ownerId, db) {
  try { localStorage.setItem(stashKeyFor(ownerId), JSON.stringify(db)); } catch (e) {}
}
/* Whose is the library on screen right now? The signed-in user if
   there is one, else the recorded owner, else unknown (legacy) when
   a non-empty library has no record, else the signed-out cache. */
function resolveCurrentOwnerId() {
  if (cloudUser) return cloudUser.id;
  var rec = loadOwnerRecord();
  if (rec !== undefined) return rec;
  return isEmptyDB(DB) ? '' : null;
}
/* Switch the on-screen library to a newly signed-in account.
   Returns true when the library is ready for cloud sync, false when
   an unclaimed local library is waiting on the claim question. */
function switchToUser(sess, prevOwnerId) {
  pendingClaim = null;
  /* Callers pass either a session ({user_id}) or the signed-in user
     ({id}) — accept both shapes. */
  var uid = sess.user_id || sess.id;
  var email = sess.email || '';
  if (prevOwnerId === uid) {
    /* Same account as the library on screen: it is already theirs. */
    libraryOwner = uid;
    persistLocal();
    renderList();
    return true;
  }
  /* Stash the library on screen under its previous owner, so nothing
     is lost when we switch. Only a non-empty library is stashed here. */
  if (!isEmptyDB(DB)) stashLibrary(prevOwnerId, DB);
  /* Does this account already have its own local cache on this device? */
  var own = loadStash(uid);
  if (own !== null) {
    DB = normalize(own);
    libraryOwner = uid;
    persistLocal();
    renderList();
    return true;
  }
  /* No cache of theirs here. If the library we just stashed aside has
     no known owner (legacy) or was saved while signed out, it might
     be theirs — ask first, never auto-push it. */
  if (!isEmptyDB(DB) && (prevOwnerId === null || prevOwnerId === '')) {
    pendingClaim = { db: JSON.parse(JSON.stringify(DB)), kind: prevOwnerId === null ? 'legacy' : 'signedout', email: email };
    DB = seed();
    libraryOwner = uid;
    persistLocal();
    renderList();
    return false;
  }
  DB = seed();
  libraryOwner = uid;
  persistLocal();
  renderList();
  return true;
}
function showClaimPanel() {
  var el = document.getElementById('cloud-claim');
  var txt = document.getElementById('cloud-claim-text');
  if (txt && pendingClaim) {
    var n = scriptCount(pendingClaim.db);
    var where = pendingClaim.kind === 'legacy' ? 'from before cloud sync' : 'saved while signed out';
    txt.textContent = 'This device has ' + n + ' script' + (n === 1 ? '' : 's') + ' ' + where +
      '. Are they yours? Upload them to ' + (pendingClaim.email || 'your') + ' cloud account?';
  }
  if (el) el.hidden = false;
  setCloudStatus('claim');
  renderCloudAuth();
}

function isEmptyDB(db) { return !db || !Array.isArray(db.scripts) || db.scripts.length === 0; }
function scriptCount(db) { return isEmptyDB(db) ? 0 : db.scripts.length; }
function latestUpdated(db) {
  if (isEmptyDB(db)) return '';
  var best = '';
  db.scripts.forEach(function (s) { if (s.updatedAt && s.updatedAt > best) best = s.updatedAt; });
  return best;
}
/* Parse an ISO timestamp to milliseconds, or 0 when it is missing or
   unreadable. 0 means "this side has no usable clock" — never a date. */
function parseSyncTime(s) {
  var t = Date.parse(s || '');
  return isNaN(t) ? 0 : t;
}
/* When was this library last changed, on this side? The library stamp
   (set by touchLocal on real edits) is the clock — it wins over script
   stamps, because merely opening a script also stamps the script and
   must never make a device look newer. Script stamps are only the
   fallback for libraries written before the library stamp existed. */
function localSyncTime(db) {
  return parseSyncTime(db && db.updatedAt) || parseSyncTime(latestUpdated(db));
}
function cloudSyncTime(cloudDB, cloudUpdatedAt) {
  return parseSyncTime(cloudUpdatedAt) || parseSyncTime(cloudDB && cloudDB.updatedAt) || parseSyncTime(latestUpdated(cloudDB));
}
/* Two libraries with the same scripts and content are identical even
   when their last-worked stamps differ — save() re-stamps the open
   script on every save, so a stamp-only difference must never count
   as a newer copy on either side. */
function sameContent(a, b) {
  function strip(db) {
    var c = JSON.parse(JSON.stringify(db || { scripts: [] }));
    delete c.updatedAt;
    (c.scripts || []).forEach(function (s) { delete s.updatedAt; });
    return c;
  }
  return JSON.stringify(strip(a)) === JSON.stringify(strip(b));
}
/* Pure merge decision. Returns {action, localCount, cloudCount, reason}.
   'push' and 'pull' only ever carry non-empty data to an empty side, or
   the newer copy over the older one. 'choose' is only for timestamps
   that are missing on either side, tied, or unreadable. */
function decideSync(localDB, cloudDB, cloudUpdatedAt) {
  var lc = scriptCount(localDB), cc = scriptCount(cloudDB);
  if (lc === 0 && cc === 0) return { action: 'none', localCount: lc, cloudCount: cc, reason: 'both-empty' };
  if (cc === 0 && lc > 0) return { action: 'push', localCount: lc, cloudCount: cc, reason: 'cloud-empty' };
  if (lc === 0 && cc > 0) return { action: 'pull', localCount: lc, cloudCount: cc, reason: 'local-empty' };
  if (sameContent(localDB, cloudDB)) return { action: 'none', localCount: lc, cloudCount: cc, reason: 'identical' };
  var lt = localSyncTime(localDB), ct = cloudSyncTime(cloudDB, cloudUpdatedAt);
  if (lt > 0 && ct > 0) {
    if (ct > lt) return { action: 'pull', localCount: lc, cloudCount: cc, reason: 'cloud-newer' };
    if (lt > ct) return { action: 'push', localCount: lc, cloudCount: cc, reason: 'local-newer' };
    return { action: 'choose', localCount: lc, cloudCount: cc, reason: 'tied' };
  }
  return { action: 'choose', localCount: lc, cloudCount: cc, reason: 'undecided' };
}
function cloudStatusMessage(state, when) {
  if (state === 'off') return 'Cloud sync off — you\u2019re signed out';
  if (state === 'saving') return 'Saving to cloud\u2026';
  if (state === 'synced') return when ? 'Saved to cloud ' + when : 'Saved to cloud';
  if (state === 'local') return 'Saved on this device \u2014 cloud unreachable, will retry';
  if (state === 'pulled') return 'Newer copy from the cloud \u2014 loaded';
  if (state === 'choosing') return 'Cloud and this device both have scripts \u2014 pick one below';
  if (state === 'claim') return 'This device already has scripts \u2014 are they yours? Pick below';
  return 'Cloud sync had a problem \u2014 your work is still saved on this device';
}
function setCloudStatus(state, when) {
  cloudState = state;
  if (state === 'synced') cloudLastSync = when || new Date();
  /* 'synced' and 'pulled' both mean local and cloud now hold the same
     library — that is the moment the "edited since" clock resets. */
  if (state === 'synced' || state === 'pulled') cloudLastPushAt = Date.now();
  var el = document.getElementById('cloud-status');
  if (el) {
    var t = state === 'synced' ? cloudStatusMessage(state, (cloudLastSync || new Date()).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })) : cloudStatusMessage(state);
    el.textContent = t;
  }
}
function renderCloudAuth() {
  var out = document.getElementById('cloud-signed-out');
  var inn = document.getElementById('cloud-signed-in');
  if (out) out.hidden = !!cloudUser;
  if (inn) inn.hidden = !cloudUser;
  var shown = document.getElementById('cloud-email-shown');
  if (shown) shown.textContent = cloudUser ? (cloudUser.email || '') : '';
  var conflict = document.getElementById('cloud-conflict');
  if (conflict && cloudState !== 'choosing') conflict.hidden = true;
  var claim = document.getElementById('cloud-claim');
  if (claim && cloudState !== 'claim') claim.hidden = true;
}
function saveCloudSession(s) {
  cloudSession = s;
  try { localStorage.setItem(SB_SESSION_KEY, JSON.stringify(s)); } catch (e) {}
  if (s) cloudUser = { id: s.user_id, email: s.email || '' };
}
function clearCloudSession() {
  cloudSession = null; cloudUser = null; pendingCloud = null;
  try { localStorage.removeItem(SB_SESSION_KEY); } catch (e) {}
}
function friendlyAuthError(msg) {
  var m = String(msg || '');
  if (/email not confirmed/i.test(m)) return 'That email isn\u2019t confirmed yet \u2014 check your inbox for the confirmation link, tap it, then try signing in again.';
  if (/invalid login credentials/i.test(m)) return 'That email or password didn\u2019t match. Check them and try again.';
  if (/user already registered|already exists/i.test(m)) return 'That email already has an account \u2014 try Sign in instead.';
  if (/password.*(short|6 characters)|at least 6/i.test(m)) return 'Pick a password at least 6 characters long.';
  if (/network|failed to fetch|offline/i.test(m)) return 'Couldn\u2019t reach the cloud \u2014 check your connection and try again. Your work is still saved on this device.';
  return m || 'Something went wrong signing in. Your work is still saved on this device.';
}
function sbFetch(path, opts) {
  if (typeof fetch !== 'function') return Promise.reject(new Error('fetch unavailable'));
  opts = opts || {};
  var headers = { apikey: SB_ANON, 'Content-Type': 'application/json' };
  if (cloudSession && cloudSession.access_token) headers.Authorization = 'Bearer ' + cloudSession.access_token;
  if (opts.headers) Object.keys(opts.headers).forEach(function (k) { headers[k] = opts.headers[k]; });
  var req = { method: opts.method || 'GET', headers: headers, body: opts.body };
  /* keepalive lets a close flush finish as the page goes away. */
  if (opts.keepalive) req.keepalive = true;
  return fetch(SB_URL + path, req).then(function (res) {
    return res.text().then(function (txt) {
      var data = null;
      try { data = txt ? JSON.parse(txt) : null; } catch (e) { data = null; }
      if (!res.ok) {
        var msg = (data && (data.error_description || data.msg || data.message)) || (data && data.error && data.error.message) || ('HTTP ' + res.status);
        var err = new Error(msg);
        err.status = res.status;
        throw err;
      }
      return data;
    });
  });
}
function sessionFromAuth(data) {
  if (!data || !data.access_token || !data.user) return null;
  return { access_token: data.access_token, refresh_token: data.refresh_token || '',
           user_id: data.user.id, email: data.user.email || '',
           expires_at: data.expires_in ? Math.floor(Date.now() / 1000) + data.expires_in : 0 };
}
function authSignUp(email, password) {
  return sbFetch('/auth/v1/signup', { method: 'POST', body: JSON.stringify({ email: email, password: password }) });
}
function authSignIn(email, password) {
  return sbFetch('/auth/v1/token?grant_type=password', { method: 'POST', body: JSON.stringify({ email: email, password: password }) });
}
function authRefresh() {
  if (!cloudSession || !cloudSession.refresh_token) return Promise.reject(new Error('no refresh token'));
  return sbFetch('/auth/v1/token?grant_type=refresh_token', { method: 'POST', body: JSON.stringify({ refresh_token: cloudSession.refresh_token }) });
}
function authGetUser() {
  return sbFetch('/auth/v1/user', { method: 'GET' });
}
function fetchCloudRow() {
  if (!cloudUser) return Promise.reject(new Error('not signed in'));
  return sbFetch('/rest/v1/script_libraries?select=data,updated_at&user_id=eq.' + encodeURIComponent(cloudUser.id), { method: 'GET' })
    .then(function (rows) {
      if (!rows || !rows.length) return null;
      var row = rows[0];
      var db = null;
      try { db = normalize(JSON.parse(JSON.stringify(row.data || { scripts: [] }))); } catch (e) { db = null; }
      return { db: db, updatedAt: row.updated_at || '' };
    });
}
function pushCloudRow(keepalive) {
  if (!cloudUser) return Promise.reject(new Error('not signed in'));
  var body = { user_id: cloudUser.id, data: DB, updated_at: new Date().toISOString() };
  return sbFetch('/rest/v1/script_libraries', {
    method: 'POST',
    keepalive: !!keepalive,
    headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify(body)
  });
}
function showConflict(localDB, cloud) {
  pendingCloud = cloud;
  var el = document.getElementById('cloud-conflict');
  var txt = document.getElementById('cloud-conflict-text');
  if (txt) {
    var lu = latestUpdated(localDB), cu = cloud.updatedAt || latestUpdated(cloud.db);
    txt.textContent = 'This device: ' + scriptCount(localDB) + ' script' + (scriptCount(localDB) === 1 ? '' : 's') +
      (lu ? ' (last worked ' + fmtISO(lu) + ')' : '') + ' · Cloud: ' + scriptCount(cloud.db) + ' script' + (scriptCount(cloud.db) === 1 ? '' : 's') +
      (cu ? ' (saved ' + fmtISO(cu) + ')' : '') + '.';
  }
  if (el) el.hidden = false;
  setCloudStatus('choosing');
  renderCloudAuth();
}
/* Replace the on-screen library with the cloud copy. auto=true means
   the sync itself decided the cloud is newer (sign-in / load / focus
   re-check) — say so plainly. Without it, the user chose the cloud
   copy in the conflict panel, and the status reads as a save. */
function applyCloudDB(db, auto) {
  cloudSuppressPush = true;
  try {
    DB = normalize(JSON.parse(JSON.stringify(db)));
    save();
  } finally { cloudSuppressPush = false; }
  pendingCloud = null;
  localUnsynced = false;
  setCloudStatus(auto ? 'pulled' : 'synced');
  renderList();
}
/* Shared sync-failure handling for initialSync / syncAfterClaim: an
   expired session signs out (manual sign-in again); anything else just
   leaves the local copy safe and the session alone. */
function handleSyncError(err) {
  cloudBusy = false;
  if (err && err.status === 401) {
    clearCloudSession();
    setCloudStatus('off');
    renderCloudAuth();
    var msg = document.getElementById('cloud-auth-msg');
    if (msg) msg.textContent = 'Your sign-in expired \u2014 sign in again.';
    return;
  }
  /* Network / cloud unreachable: local work is safe, stay signed in. */
  setCloudStatus('local');
}
function initialSync() {
  if (!cloudUser || cloudBusy || pendingClaim) return Promise.resolve();
  cloudBusy = true;
  setCloudStatus('saving');
  return fetchCloudRow().then(function (cloud) {
    cloudBusy = false;
    if (!cloud || !cloud.db) {
      /* No cloud row yet: push local up if there is anything to push. */
      if (isEmptyDB(DB)) { setCloudStatus('synced'); return; }
      return pushCloud();
    }
    var decision = decideSync(DB, cloud.db, cloud.updatedAt);
    if (decision.action === 'push') return pushCloud();
    if (decision.action === 'pull') { applyCloudDB(cloud.db, true); return; }
    if (decision.action === 'choose') { showConflict(DB, cloud); return; }
    setCloudStatus('synced');
  }).catch(handleSyncError);
}
/* Sync right after the user answered "Yes, these scripts are mine" to
   the claim question. Same last-write-wins decision — except a newer
   cloud copy does NOT silently pull over the library they just claimed:
   that goes to the conflict chooser instead, so the Yes stays honest. */
function syncAfterClaim() {
  if (!cloudUser || cloudBusy) return Promise.resolve();
  cloudBusy = true;
  setCloudStatus('saving');
  return fetchCloudRow().then(function (cloud) {
    cloudBusy = false;
    if (!cloud || !cloud.db) {
      if (isEmptyDB(DB)) { setCloudStatus('synced'); return; }
      return pushCloud();
    }
    var decision = decideSync(DB, cloud.db, cloud.updatedAt);
    if (decision.action === 'push') return pushCloud();
    if (decision.action === 'none') { setCloudStatus('synced'); return; }
    /* pull or choose: ask, don't silently pull the cloud over the
       library the user just said was theirs. */
    showConflict(DB, cloud);
  }).catch(handleSyncError);
}
function pushCloud() {
  if (!cloudUser || cloudBusy) { if (cloudUser) cloudPushPending = true; return Promise.resolve(); }
  cloudBusy = true;
  setCloudStatus('saving');
  var run = function () {
    return pushCloudRow().then(function () {
      cloudBusy = false;
      localUnsynced = false;
      setCloudStatus('synced');
      if (cloudPushPending) { cloudPushPending = false; return pushCloud(); }
    });
  };
  var needRefresh = cloudSession && cloudSession.expires_at && cloudSession.expires_at - Math.floor(Date.now() / 1000) < 60;
  var p = needRefresh ? authRefresh().then(function (data) {
    var s = sessionFromAuth(data);
    if (s) saveCloudSession(s);
  }).catch(function () { /* refresh failed — try the push anyway; a 401 will sign out */ }) : Promise.resolve();
  cloudLastPush = p.then(run).catch(function (err) {
    cloudBusy = false;
    /* An expired session follows the shared path (sign out, plain
       message) — no separate handling here. */
    if (err && err.status === 401) { handleSyncError(err); return; }
    setCloudStatus('local');
  });
  return cloudLastPush;
}
function scheduleCloudPush() {
  if (!cloudUser || cloudSuppressPush) return;
  localUnsynced = true;
  if (cloudPushHandle) clearTimeout(cloudPushHandle);
  cloudPushHandle = setTimeout(function () { cloudPushHandle = null; pushCloud(); }, CLOUD_DEBOUNCE_MS);
}
/* Automatic re-check for an app that is already signed in and open:
   run it when the app regains focus, becomes visible, or you return
   to the home screen. Never swaps the library out from under an open
   script — while you're editing, your work goes up first and the pull
   waits until you leave that screen. */
/* Has this device been edited since local and cloud were last known
   equal? The library stamp (touchLocal, real edits only) is the
   clock — a navigation save alone must not count, or it would push
   older local content over a newer cloud copy before we compare. */
function localEditedSincePush() {
  var lt = parseSyncTime(DB && DB.updatedAt);
  if (!lt) return true; /* no library clock (pre-stamp library): keep the old push-first behaviour */
  return lt > cloudLastPushAt;
}
function recheckCloud() {
  if (!cloudUser || cloudBusy || pendingClaim || cloudState === 'choosing' || cloudState === 'claim') return Promise.resolve();
  if (localEditedSincePush()) {
    /* A real local edit is waiting: push it first, then re-check —
       the local edit is the newest write, so it wins. */
    if (cloudPushHandle) { clearTimeout(cloudPushHandle); cloudPushHandle = null; }
    return pushCloud().then(function () { return recheckCloud(); });
  }
  /* No real edit waiting: cancel any push a navigation save just
     scheduled, so it can't push older local content over a newer
     cloud copy before we compare. */
  if (cloudPushHandle) { clearTimeout(cloudPushHandle); cloudPushHandle = null; }
  localUnsynced = false;
  var list = document.getElementById('view-list');
  if (!list || list.hidden) return Promise.resolve(); /* mid-edit: wait for home */
  return initialSync();
}
/* Save on close: if a cloud push is still waiting out its ~2s debounce
   when the app is closed or hidden, push it right away instead. The
   local save already happened on every keystroke — this only gets that
   last edit to the cloud. keepalive lets the request finish as the
   page goes away. If it fails, nothing destructive happens: the local
   copy stays safe, the session stays signed in, and the next open
   pushes it then. Never signs the user out. */
function flushCloudPushOnClose() {
  parseTypeMode(); /* typed-but-unparsed text goes up as blocks, not stale ones */
  if (!cloudUser || cloudBusy) return;
  /* Only flush a real edit — a navigation save alone must not push
     older local content over a newer cloud copy on the way out. */
  if (!localEditedSincePush()) return;
  if (!cloudPushHandle && !localUnsynced) return;
  if (cloudPushHandle) { clearTimeout(cloudPushHandle); cloudPushHandle = null; }
  /* The next load re-derives "newer" from timestamps, so clearing the
     pending flag here is safe even if this flush fails. */
  localUnsynced = false;
  pushCloudRow(true).then(function () {
    if (!cloudBusy) setCloudStatus('synced');
  }).catch(function () { /* offline / unreachable: local copy stays safe */ });
}
/* ---- ↻ Update button (wizard) ----
   Saves on the device, then checks the cloud — no need to go back to
   My Scripts first. It never pulls a newer cloud copy over the open
   script (that loads when you go back to All scripts), never loses a
   local edit, and never signs you out. A 401 goes through the shared
   expired-session path, like every other sync call. */
var updateRunning = false;
function setSavedNote(text) {
  var note = document.getElementById('saved-note');
  if (note) note.textContent = text;
}
function updateClock() {
  return new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}
function handleUpdate() {
  parseTypeMode(); /* typed-but-unparsed text counts as a real edit */
  var btn = document.getElementById('btn-update');
  if (updateRunning) return;
  /* A real unsynced edit is one that was already waiting before this
     tap. save() below schedules a push of its own (it stamps the open
     script), but that must NOT count as one — flushing it would push
     older local content over a newer cloud copy before we compare. */
  var hasUnsyncedEdit = localEditedSincePush();
  save();
  if (!cloudUser) {
    setSavedNote('Update: you\u2019re signed out \u2014 sign in on My Scripts to sync');
    return;
  }
  updateRunning = true;
  if (btn) { btn.disabled = true; btn.textContent = 'Updating\u2026'; }
  var done = function () {
    updateRunning = false;
    if (btn) { btn.disabled = false; btn.textContent = '\u21bb Update'; }
  };
  var flushed = false;
  var flush;
  if (hasUnsyncedEdit) {
    flushed = true;
    if (cloudBusy && cloudLastPush) flush = cloudLastPush;
    else {
      if (cloudPushHandle) { clearTimeout(cloudPushHandle); cloudPushHandle = null; }
      flush = pushCloud();
    }
  } else {
    /* No real edit was waiting: cancel the push save() just scheduled
       and restore the pre-tap state, so the fetch below compares the
       cloud against the library as it was. */
    if (cloudPushHandle) { clearTimeout(cloudPushHandle); cloudPushHandle = null; }
    localUnsynced = false;
    flush = Promise.resolve();
  }
  flush.then(function () {
    if (!cloudUser) {
      setSavedNote('Update: your sign-in expired \u2014 sign in again on My Scripts.');
      done(); return;
    }
    return fetchCloudRow().then(function (cloud) {
      var cloudDB = cloud && cloud.db ? cloud.db : { scripts: [] };
      var decision = decideSync(DB, cloudDB, cloud ? cloud.updatedAt : '');
      if (decision.action === 'push') {
        return pushCloud().then(function () {
          if (!cloudUser) setSavedNote('Update: your sign-in expired \u2014 sign in again on My Scripts.');
          else if (cloudState === 'local') setSavedNote('Updated \u2014 saved on this device, cloud unreachable, will retry');
          else setSavedNote('Updated \u2014 saved to cloud \u00b7 ' + updateClock());
          done();
        });
      }
      if (decision.action === 'pull') {
        /* Never swap the library out from under the open script: the
           newer cloud copy loads when you go back to All scripts. */
        setSavedNote('Updated \u2014 a newer copy is on the cloud \u2014 go to All scripts to load it');
        done(); return;
      }
      if (decision.action === 'choose') {
        /* Surface the existing conflict panel — it lives on the home
           screen, so it shows when he goes back to All scripts. */
        if (cloud && cloud.db) showConflict(DB, cloud);
        setSavedNote('Updated \u2014 cloud and this device differ \u2014 go to All scripts to pick one');
        done(); return;
      }
      setSavedNote(flushed ? 'Updated \u2014 saved to cloud \u00b7 ' + updateClock()
                           : 'Updated \u2014 already up to date \u00b7 ' + updateClock());
      done();
    });
  }).catch(function (err) {
    if (err && err.status === 401) {
      handleSyncError(err);
      setSavedNote('Update: your sign-in expired \u2014 sign in again on My Scripts.');
    } else {
      setCloudStatus('local');
      setSavedNote('Updated \u2014 saved on this device, cloud unreachable, will retry');
    }
    done();
  });
}
function initCloud() {
  renderCloudAuth();
  if (!cloudUser) { setCloudStatus('off'); return Promise.resolve(); }
  setCloudStatus('local');
  if (typeof fetch !== 'function') { setCloudStatus('local'); return Promise.resolve(); }
  var needRefresh = cloudSession && cloudSession.expires_at && cloudSession.expires_at - Math.floor(Date.now() / 1000) < 60;
  var p = needRefresh ? authRefresh().then(function (data) {
    var s = sessionFromAuth(data);
    if (s) saveCloudSession(s);
  }) : Promise.resolve();
  return p.then(function () { return authGetUser(); }).then(function (u) {
    if (u && u.id) { cloudUser = { id: u.id, email: u.email || cloudUser.email }; }
    /* The library on screen may belong to someone else — or to nobody
       known, if it predates per-user caches. Switch it first, so the
       sync below only ever touches this account's library. */
    if (switchToUser(cloudUser, libraryOwner)) return initialSync();
    showClaimPanel();
  }).catch(function (err) {
    if (err && err.status === 401) {
      clearCloudSession();
      setCloudStatus('off');
      renderCloudAuth();
      return;
    }
    /* Offline / cloud unreachable on load: app works locally as normal. */
    setCloudStatus('local');
  });
}
/* Test hook (also used by smoke6/7): pure sync logic + config, nothing else. */
if (typeof window !== 'undefined') {
  window.__scriptBuilderSync = {
    decideSync: decideSync, isEmptyDB: isEmptyDB, scriptCount: scriptCount,
    latestUpdated: latestUpdated, parseSyncTime: parseSyncTime,
    localSyncTime: localSyncTime, cloudSyncTime: cloudSyncTime,
    cloudStatusMessage: cloudStatusMessage, SB_URL: SB_URL,
    recheckCloud: recheckCloud, flushCloudPushOnClose: flushCloudPushOnClose,
    stashKeyFor: stashKeyFor, signedOutKey: LS_SIGNEDOUT_KEY,
    legacyKey: LS_LEGACY_KEY, legacyBackupKey: LS_LEGACY_BACKUP_KEY,
    ownerKey: LS_OWNER_KEY,
    libraryOwner: function () { return libraryOwner; }
  };
}

function cur() {
  var found = null;
  DB.scripts.forEach(function (x) { if (x.id === currentId) found = x; });
  return found || DB.scripts[0] || null;
}
function nextId() {
  var m = 0;
  DB.scripts.forEach(function (s) { if (s.id > m) m = s.id; });
  return m + 1;
}
function newScript() {
  var s = blankScript(nextId());
  for (var i = 0; i < 42; i++) s.scenes.push(blankScene());
  s.updatedAt = new Date().toISOString();
  DB.scripts.push(s);
  touchLocal();
  save();
  openScript(s.id);
}
function duplicateScript(id) {
  var src = null;
  DB.scripts.forEach(function (x) { if (x.id === id) src = x; });
  if (!src) return;
  var copy = JSON.parse(JSON.stringify(src));
  copy.id = nextId();
  copy.title = (src.title || 'Untitled') + ' (copy)';
  copy.updatedAt = new Date().toISOString();
  copy.pos = { step: 0, act1: 0, act2: 0, act3: 0, act4: 0, act5: 0, char: 0, draft: 0 };
  DB.scripts.push(copy);
  touchLocal();
  save();
  renderList();
}
function deleteScript(id) {
  if (!confirm('Delete this script? Its outline and draft go with it. Export a backup first if you want to keep it.')) return;
  DB.scripts = DB.scripts.filter(function (x) { return x.id !== id; });
  touchLocal();
  save();
  renderList();
}

/* ---------------- dates ---------------- */
function fmt(d) { return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }); }
function fmtISO(iso) {
  if (!iso) return '';
  var d = new Date(iso);
  return isNaN(d.getTime()) ? '' : fmt(d);
}

/* ---------------- helpers ---------------- */
function $(s) { return document.querySelector(s); }
function esc(v) {
  return String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function wordCount(t) { var w = String(t || '').trim().split(/\s+/).filter(Boolean); return t && t.trim() ? w.length : 0; }
function estPages(t) { return wordCount(t) / WORDS_PER_PAGE; }
/* Plain text of a written scene, from its blocks (or the old draft field). */
function sceneText(sc) {
  if (sc.blocks && sc.blocks.length) return sc.blocks.map(function (b) { return b.x || ''; }).join('\n\n');
  return sc.draft || '';
}

/* ---------------- Type mode: free typing over the same blocks ------
   Cards mode is the picker; Type mode is one big textarea for the
   whole scene, Final Draft style. The blocks model stays the single
   source of truth for print, outline, sync and autosave — Type mode
   is a view over it: plain text in, blocks out, and back again.
   Which scene the textarea on screen belongs to (typeTextIdx): every
   navigation handler changes s.pos.draft before renderStep() rebuilds,
   so parsing "the current scene" would parse the typed text into the
   WRONG scene. The rendered scene index is the truth instead. */
var typeTextIdx = 0;
function draftMode(s) { return s.pos && s.pos.draftMode === 'type' ? 'type' : 'cards'; }
/* Plain text -> { slug, blocks }. Blank line = block boundary.
   Consecutive same-kind lines merge into one block (joined with \n).
   Rules, in order: first non-blank line that looks like a heading
   becomes the slugline; CONT'D / (MORE) after a cue joins the
   dialogue; transitions; a mid-scene INT./EXT. line is action, not a
   character cue; a line starting with "(" is a paren; an ALL-CAPS
   line (≤ 40 chars, at least one letter) is a character cue; after a
   character cue or a paren comes dialogue, otherwise action. */
function parseTypeText(text) {
  var lines = String(text || '').split('\n');
  var slug = '', blocks = [], prev = null, lastKind = null, seenFirst = false;
  function push(t, x) { var b = { t: t, x: x }; blocks.push(b); prev = b; lastKind = t; return b; }
  lines.forEach(function (raw) {
    var line = raw.replace(/^\s+|\s+$/g, '');
    /* A blank line ends the current paragraph (prev) — lines stop
       merging — but lastKind survives it: the serialization puts a
       blank line between EVERY block, so a dialogue paragraph still
       follows its character cue across one, and the round-trip
       (parse -> serialize -> parse) still gives the same blocks. */
    if (!line) { prev = null; return; }
    if (!seenFirst) {
      seenFirst = true;
      if (/^(INT\.|EXT\.|INT\/EXT\.|FADE IN)/i.test(line)) { slug = line; return; }
    }
    /* (CONT'D) / (MORE) right after a cue belongs to that dialogue —
       in print they are written with parens, and bare CONT'D shows
       up in typed drafts too. */
    if (/^(CONT'D|\(CONT'D\)|\(MORE\))$/i.test(line) && (lastKind === 'character' || lastKind === 'dialogue')) {
      if (prev && prev.t === 'dialogue') prev.x += '\n' + line;
      else push('dialogue', line);
      return;
    }
    if (/^(FADE IN|FADE OUT|CUT TO|DISSOLVE TO|SMASH CUT|MATCH CUT|TIME CUT|JUMP CUT|INTERCUT|MONTAGE)\b.*$/i.test(line) ||
        /^END\.?\s*$/i.test(line)) { push('transition', line.toUpperCase()); return; }
    /* A location line later in the scene is a new slugline in the
       story, not a person — keep it out of the character cues. */
    if (/^(INT\.|EXT\.|INT\/EXT\.)/i.test(line)) {
      if (prev && prev.t === 'action') prev.x += '\n' + line.toUpperCase();
      else push('action', line.toUpperCase());
      return;
    }
    if (line.charAt(0) === '(') { push('paren', line); return; }
    if (line.length <= 40 && /[A-Z]/.test(line) && !/[a-z]/.test(line)) { push('character', line.toUpperCase()); return; }
    /* Dialogue vs action: inside one paragraph, lines merge into the
       block they follow; across a blank line, a new paragraph after
       a cue (or after dialogue) is still dialogue, anything else is
       action — and it starts a NEW block, it never merges across
       the blank line. */
    if (prev && prev.t === 'dialogue') { prev.x += '\n' + line; return; }
    if (prev && (prev.t === 'character' || prev.t === 'paren')) { push('dialogue', line); return; }
    if (prev && prev.t === 'action') { prev.x += '\n' + line; return; }
    if (lastKind === 'character' || lastKind === 'paren' || lastKind === 'dialogue') { push('dialogue', line); return; }
    push('action', line);
  });
  return { slug: slug, blocks: blocks };
}
/* Blocks -> plain text: slugline first, then one block per paragraph,
   separated by a blank line. Round-trip (parse -> serialize -> parse)
   gives the same blocks, modulo the uppercasing rules above. */
function serializeScene(sc) {
  var parts = [];
  var slug = (sc.slug || '').trim();
  if (slug) parts.push(slug);
  (sc.blocks || []).forEach(function (b) {
    var x = (b.x || '').trim();
    if (!x) return;
    if (b.t === 'character' || b.t === 'transition') x = x.toUpperCase();
    parts.push(x);
  });
  return parts.join('\n\n');
}
/* After any Cards-mode edit, the typed text must match the blocks
   again — otherwise normalize() would re-parse stale text over the
   edit on the next load. Cheap: one scene's blocks. */
function syncTypeText(sc) { if (sc) sc.typeText = serializeScene(sc); }
/* Parse the Type textarea on screen into its scene (see typeTextIdx).
   No-op anywhere but the Draft step in Type mode, and never while
   typing — callers are blur, navigation, Update, print and close. */
function parseTypeMode() {
  var s = cur();
  if (!s || !wizardSteps(s)[currentStep] || wizardSteps(s)[currentStep].id !== 'draft') return false;
  if (draftMode(s) !== 'type') return false;
  var ta = document.getElementById('type-text');
  if (!ta) return false;
  var sc = s.scenes[typeTextIdx];
  if (!sc) return false;
  var beforeSlug = sc.slug, beforeBlocks = JSON.stringify(sc.blocks);
  var parsed = parseTypeText(ta.value);
  sc.slug = parsed.slug;
  sc.blocks = parsed.blocks;
  sc.typeText = serializeScene(sc);
  /* Only stamp this as a real edit when the parse actually changed
     something: an unconditional touchLocal() here would make
     handleUpdate() think a no-change tap was an unsynced edit and
     push local over a newer cloud copy before comparing. */
  if (sc.slug !== beforeSlug || JSON.stringify(sc.blocks) !== beforeBlocks) {
    touchLocal(); save();
    var chipsEl = document.getElementById('draft-chips');
    if (chipsEl) chipsEl.innerHTML = draftChipsHtml(s, typeTextIdx);
    updateDraftTotals();
  }
  return true;
}

/* ---------------- acts model ----------------
   Scenes live in one flat list, in order. Which act a scene is in comes
   from actCounts (scenes per act) — so add / delete / move just edits the
   list and the counts, and nothing else has to be re-wired. */
function actOf(s, idx) {
  var c = 0;
  for (var a = 0; a < s.acts; a++) { c += s.actCounts[a]; if (idx < c) return a + 1; }
  return s.acts;
}
function actStart(s, actNum) {
  var c = 0;
  for (var a = 0; a < actNum - 1; a++) c += s.actCounts[a];
  return c;
}
function actScenes(s, actNum) {
  var start = actStart(s, actNum);
  return s.scenes.slice(start, start + (s.actCounts[actNum - 1] || 0));
}
function setActs(s, n) {
  if (n === s.acts) return;
  touchLocal();
  s.acts = n;
  s.actCounts = suggestedCounts(s.scenes.length, n);
  var steps = wizardSteps(s);
  if (currentStep >= steps.length) currentStep = steps.length - 1;
}
function setFormat(s, format) {
  if (!FORMATS[format] || format === s.format) return;
  touchLocal();
  s.format = format;
  s.teaserCount = FORMATS[format].teaser ? 3 : 0;
  var defActs = format === 'tv' ? (s.tvLength === '30' ? 4 : 5) : FORMATS[format].actsDefault;
  setActs(s, defActs);
  resizeScenes(s);
}
/* TV length: 30 min = teaser + 4 acts, ~22 scenes; 60 min = teaser + 5 acts, ~38. */
function setTvLength(s, len) {
  if (len !== '30' && len !== '60') return;
  if (len === s.tvLength) return;
  touchLocal();
  s.tvLength = len;
  setActs(s, len === '30' ? 4 : 5);
  resizeScenes(s);
}
/* Grow or shrink the scene list to the template's size. Only ever removes
   trailing scenes that are completely empty — written work is never cut. */
function resizeScenes(s) {
  var target = templateScenes(s);
  while (s.scenes.length < target) s.scenes.push(blankScene());
  while (s.scenes.length > target) {
    var last = s.scenes[s.scenes.length - 1];
    if (!sceneText(last).trim() && !(last.slug || '').trim() && !last.happens && !last.turn && !last.purpose && !last.stakes && !last.revise) s.scenes.pop();
    else break;
  }
  s.actCounts = suggestedCounts(s.scenes.length, s.acts);
  var steps = wizardSteps(s);
  if (currentStep >= steps.length) currentStep = steps.length - 1;
}
/* Where does each part of the character arc live, for this act count? */
function arcMapText(acts) {
  if (acts === 1) return 'Beginning, Middle and End all live in Act 1.';
  if (acts === 2) return 'Beginning lives in Act 1 · Middle in Act 2 (first half) · End in Act 2 (second half).';
  if (acts === 3) return 'Beginning lives in Act 1 · Middle in Act 2 · End in Act 3.';
  return 'Beginning lives in Act 1 · Middle in Acts 2–' + (acts - 1) + ' · End in Act ' + acts + '.';
}
/* Beat label for a scene, from where it sits in the whole script. */
function beatFor(s, idx) {
  var total = s.scenes.length, pos = idx + 1, act = actOf(s, idx);
  var start = actStart(s, act), count = s.actCounts[act - 1] || 0;
  var isFirst = idx === start, isLast = idx === start + count - 1;
  if (pos === 1) return 'Cold Open';
  if (pos === total) return 'Final image / Outro';
  if (s.format === 'tv' && idx < s.teaserCount && idx > 0) return 'Teaser — hook them fast';
  if (isLast && act < s.acts) return act === 1 ? 'Plot Point 1 — Act 2 begins' : 'Plot Point — end of Act ' + act;
  if (isFirst && act === s.acts && s.acts > 1) return 'Break into Act ' + act;
  if (pos === Math.round(total / 2)) return 'Midpoint — big turn';
  if (pos === Math.max(2, Math.round(total * 0.17))) return 'Inciting Incident';
  var f = pos / total;
  if (f <= 0.15) return 'Setup — normal world';
  if (f <= 0.24) return 'Debate / resistance';
  if (f <= 0.5) return 'Fun & Games / rising action';
  if (f <= 0.72) return 'Bad guys close in';
  if (f <= 0.85) return 'All Is Lost / Crisis';
  return 'Finale / Climax';
}
function sceneDefFor(s, idx) {
  var total = s.scenes.length, pos = idx + 1;
  return { n: pos, act: actOf(s, idx), beat: beatFor(s, idx),
           pages: (pos === 1 || pos === Math.round(total / 2)) ? 3 : 2 };
}

function setPath(obj, path, val) {
  var parts = path.split('.'), o = obj;
  for (var i = 0; i < parts.length - 1; i++) o = o[parts[i]];
  o[parts[parts.length - 1]] = val;
}
function field(path, label, hint, tag, opts) {
  var s = cur(), val = path.split('.').reduce(function (o, k) { return o[k]; }, s);
  var h = hint ? '<span class="hint">' + hint + '</span>' : '';
  if (tag === 'textarea') return '<label>' + label + h + '<textarea data-path="' + path + '">' + esc(val) + '</textarea></label>';
  if (tag === 'select') {
    var o2 = (opts || []).map(function (x) { return '<option' + (x === val ? ' selected' : '') + '>' + esc(x) + '</option>'; }).join('');
    if (!(opts || []).includes(val)) o2 = '<option value="" selected>— Pick a genre —</option>' + o2;
    return '<label>' + label + h + '<select data-path="' + path + '">' + o2 + '</select></label>';
  }
  return '<label>' + label + h + '<input type="text" data-path="' + path + '" value="' + esc(val) + '"></label>';
}
/* Outline progress: story (7) + this method's beats/steps/cards +
   scenes with a "what happens". Only the current method counts — a
   Save the Cat script is 7 + 15 + scenes, not 7 + 6 + 15 + scenes. */
function progressFor(s) {
  var filled = 0, total = 0, md = methodDefFor(s);
  ['logline', 'hero', 'want', 'need', 'antagonist', 'stakes', 'theme'].forEach(function (k) { total++; if (s.story[k]) filled++; });
  md.steps.forEach(function (st) { total++; if (methodBeatValue(s, st, md)) filled++; });
  s.scenes.forEach(function (sc) { total++; if (sc.happens) filled++; });
  return { filled: filled, total: total, pct: Math.round(100 * filled / total) };
}
function draftStatsFor(s) {
  var words = 0, done = 0;
  s.scenes.forEach(function (sc) { var t = sceneText(sc); words += wordCount(t); if (sc.done || (t && t.trim())) done++; });
  return { words: words, pages: words / WORDS_PER_PAGE, done: done };
}
function draftStats() { return draftStatsFor(cur()); }
/* Dashboard status, worked out from what's actually filled in — never typed by hand. */
function scriptStatus(s) {
  var p = progressFor(s).pct, dp = draftStatsFor(s).pages;
  if (dp >= targetPages(s) - 5) return 'Draft done';
  if (p >= 100) return 'Outline done';
  if (p > 0 || dp > 0) return 'In progress';
  return 'Not started';
}
/* Wizard steps are built from the script's own act count. */
function wizardSteps(s) {
  var md = methodDefFor(s);
  var steps = [{ id: 'story', label: 'Story' }, { id: 'characters', label: 'Characters' }, { id: 'beats', label: md.steps.length + ' ' + md.unit }];
  for (var a = 1; a <= s.acts; a++) steps.push({ id: 'act' + a, label: actStepLabel(s, a), act: a });
  steps.push({ id: 'outline', label: 'Outline' }, { id: 'draft', label: 'Draft' });
  return steps;
}
function outlineIdx(s) { return wizardSteps(s).length - 2; }
function draftIdx(s) { return wizardSteps(s).length - 1; }
function posTotalFor(key, s) {
  if (key === 'char') return 5;
  if (key === 'draft') return s.scenes.length;
  if (key.indexOf('act') === 0) return s.actCounts[parseInt(key.slice(3), 10) - 1] || 0;
  return 1;
}
function resumeLabel(s) {
  var steps = wizardSteps(s), step = steps[s.pos.step || 0];
  if (!step) return '';
  if (step.act) return actStepLabel(s, step.act) + ' · Scene ' + (actStart(s, step.act) + (s.pos['act' + step.act] || 0) + 1);
  if (step.id === 'characters') return 'Characters · ' + CHAR_DEFS[s.pos.char || 0].role;
  if (step.id === 'draft') return 'Draft · Scene ' + ((s.pos.draft || 0) + 1);
  return step.label;
}

/* ---------------- scene tags ---------------- */
function charRoleLabel(key) {
  var def = null;
  CHAR_DEFS.forEach(function (d) { if (d.key === key) def = d; });
  if (!def) return '';
  var name = cur().chars[key] ? cur().chars[key].name : '';
  return def.role + (name ? ' — ' + name : '');
}
function tagText(sc) {
  var parts = [];
  if (sc.tagChar) parts.push(charRoleLabel(sc.tagChar));
  if (sc.tagArc) parts.push('Arc ' + sc.tagArc);
  return parts.join(' · ');
}
function tagPill(sc) {
  var t = tagText(sc);
  return t ? '<span class="tagpill">🏷 ' + esc(t) + '</span>' : '';
}
function tagSelects(idx, sc) {
  var charOpts = [{ v: '', l: '— No character tag —' }];
  CHAR_DEFS.forEach(function (d) { charOpts.push({ v: d.key, l: charRoleLabel(d.key) }); });
  var charHtml = '<label>Tag — character<span class="hint">Whose scene is this?</span><select data-scene="' + idx + '" data-field="tagChar">' +
    charOpts.map(function (o) { return '<option value="' + o.v + '"' + (o.v === sc.tagChar ? ' selected' : '') + '>' + esc(o.l) + '</option>'; }).join('') + '</select></label>';
  var arcHtml = '<label>Tag — arc stage<span class="hint">Where in their arc?</span><select data-scene="' + idx + '" data-field="tagArc">' +
    ARC_STAGES.map(function (a) {
      var l = a === '' ? '— No arc tag —' : 'Arc ' + a;
      return '<option value="' + a + '"' + (a === sc.tagArc ? ' selected' : '') + '>' + l + '</option>';
    }).join('') + '</select></label>';
  return '<div class="tagrow">' + charHtml + arcHtml + '</div>';
}

/* ---------------- home / dashboard ---------------- */
function renderList() {
  $('#view-list').hidden = false;
  $('#view-wizard').hidden = true;
  $('#nav-bottom').hidden = true;
  document.body.classList.remove('show-print');
  $('#preview-bar').hidden = true;
  var done = 0, outlines = 0, pages = 0;
  DB.scripts.forEach(function (s) {
    var st = scriptStatus(s);
    if (st === 'Draft done') done++;
    if (st === 'Outline done' || st === 'Draft done') outlines++;
    pages += draftStatsFor(s).pages;
  });
  var total = DB.scripts.length;
  $('#stat-total').textContent = total;
  $('#stat-done').textContent = done;
  $('#stat-outline').textContent = outlines;
  $('#stat-pages').textContent = Math.round(pages);
  $('#stat-bar').style.width = (total ? Math.round(100 * done / total) : 0) + '%';
  var listHtml = DB.scripts.map(function (s) {
    var p = progressFor(s), dp = draftStatsFor(s), st = scriptStatus(s);
    var title = (s.title && s.title !== 'Untitled ' + s.id) ? s.title : 'Untitled ' + s.id;
    var resume = p.pct > 0 || dp.pages > 0 ? '<br><span class="resume">Continue: ' + esc(resumeLabel(s)) + ' ›</span>' : '';
    var actsLabel = s.format === 'streaming' ? 'continuous' : s.acts + ' act' + (s.acts > 1 ? 's' : '');
    return '<div class="script-row">' +
      '<button class="open" type="button" data-open="' + s.id + '">' +
      '<span class="num">' + s.id + '</span>' +
      '<span class="body"><span class="t">' + esc(title) + '</span>' +
      '<span class="m">' + esc(s.genre || 'No genre yet') + ' · ' + esc(FORMATS[s.format].label) + ' · ' + actsLabel +
      (s.updatedAt ? '<br>Last worked: ' + fmtISO(s.updatedAt) : '') + resume + '</span>' +
      '<span class="progress"><div style="width:' + p.pct + '%"></div></span>' +
      '<span class="m">Outline ' + p.pct + '% · ~' + Math.round(dp.pages) + ' of ' + targetPages(s) + ' pages</span></span>' +
      '<span><span class="pill' + (st === 'Draft done' || st === 'Outline done' ? ' done' : '') + '">' + st + '</span>' +
      '<span class="go">›</span></span></button>' +
      '<span class="rowactions"><button type="button" class="small" data-duplicate="' + s.id + '">⧉ Duplicate</button>' +
      '<button type="button" class="small ghost" data-delete="' + s.id + '">🗑 Delete</button></span></div>';
  }).join('');
  if (!DB.scripts.length) {
    listHtml = '<div class="card"><h2>No scripts yet</h2><p class="sub">Tap ＋ New Script below to start your first one. Pick a structure — feature, TV pilot, or streaming — then fill in one card at a time.</p></div>';
  }
  $('#script-list').innerHTML = listHtml +
    '<div class="btnrow"><button type="button" class="primary" id="btn-new-script">＋ New Script</button></div>' +
    '<p class="muted">No cap, no dates, no preset list — a reusable tool for any script, any time. Everything saves on this device as you type.</p>';
}

function openScript(id) {
  currentId = id;
  currentStep = Math.min(cur().pos.step || 0, wizardSteps(cur()).length - 1);
  renderStep();
  window.scrollTo(0, 0);
}

function growTextarea(el) {
  /* The Type textarea sizes itself from CSS (min-height 60vh, user
     drag) — auto-height here would cap it at 360px and fight it. */
  if (el.classList && el.classList.contains('type-text')) return;
  el.style.height = 'auto';
  el.style.height = Math.min(360, el.scrollHeight) + 'px';
}
function pagerHtml(key, idx, label) {
  var total = posTotalFor(key, cur());
  if (total <= 1) return '';
  var left = idx > 0, right = idx < total - 1;
  return '<div class="pager"><button type="button" data-pager="' + key + '" data-dir="-1"' + (left ? '' : ' disabled') + '>‹ Prev</button>' +
    '<span class="mid">' + label + ' ' + (idx + 1) + ' of ' + total + '</span>' +
    '<button type="button" data-pager="' + key + '" data-dir="1"' + (right ? '' : ' disabled') + '>Next ›</button></div>';
}

/* ---------------- wizard ---------------- */
function renderStep() {
  /* Leaving the Draft step (or the scene) in Type mode parses what
     was just typed into blocks first — the textarea is about to be
     rebuilt, and parseTypeMode() knows which scene it belongs to
     (typeTextIdx), so navigation handlers that already moved
     s.pos.draft cannot mis-attribute the text. */
  parseTypeMode();
  /* Leaving the step ends the delete-undo window (see refreshDraft). */
  lastDeletedBlock = null;
  var s = cur(), steps = wizardSteps(s);
  if (currentStep < 0) currentStep = 0;
  if (currentStep >= steps.length) currentStep = steps.length - 1;
  s.pos.step = currentStep;
  save(); /* persist where he left off — navigation alone must save it */
  var step = steps[currentStep];
  $('#view-list').hidden = true;
  $('#view-wizard').hidden = false;
  $('#nav-bottom').hidden = false;
  /* On the Draft step the bottom bar walks scenes, not wizard steps —
     the old "Next →" relabelled to "← All scripts" and exited the
     wizard mid-draft. */
  if (step.id === 'draft') {
    var di = Math.min(s.pos.draft || 0, s.scenes.length - 1);
    $('#btn-prev').disabled = di === 0;
    $('#btn-prev').textContent = '← Prev Scene';
    $('#btn-next').disabled = di >= s.scenes.length - 1;
    $('#btn-next').textContent = 'Next Scene →';
  } else {
    $('#btn-prev').disabled = currentStep === 0;
    $('#btn-prev').textContent = '← Back';
    $('#btn-next').disabled = false;
    $('#btn-next').textContent = currentStep === steps.length - 1 ? '← All scripts' : 'Next →';
  }
  $('#wiz-title').textContent = 'Script ' + s.id + ' — ' + (s.title && s.title !== 'Untitled ' + s.id ? s.title : 'Untitled');
  $('#wiz-meta').textContent = (s.genre || 'No genre yet') + ' · ' + FORMATS[s.format].label + ' · ' + (s.format === 'streaming' ? 'continuous' : s.acts + ' act' + (s.acts > 1 ? 's' : ''));
  var p = progressFor(s), dp = draftStatsFor(s);
  $('#wiz-bar').style.width = p.pct + '%';
  $('#wiz-progress-text').textContent = p.pct + '% outline · ~' + Math.round(dp.pages) + ' of ' + targetPages(s) + ' pages';
  $('#script-status-pill').textContent = scriptStatus(s);
  var dots = steps.map(function (st, i) {
    var cls = i === currentStep ? 'on' : (i < currentStep ? 'done' : '');
    return '<button type="button" class="' + cls + '" data-step="' + i + '" aria-label="Go to ' + esc(st.label) + '"' +
      (i === currentStep ? ' aria-current="step"' : '') + '>' + esc(st.label) + '</button>';
  }).join('');
  $('#step-dots').innerHTML = dots;
  var body = $('#step-body');
  if (step.id === 'story') body.innerHTML = stepStory(s);
  else if (step.id === 'characters') body.innerHTML = stepCharacters(s);
  else if (step.id === 'beats') body.innerHTML = stepBeats(s);
  else if (step.id === 'outline') body.innerHTML = stepOutline(s);
  else if (step.id === 'draft') body.innerHTML = stepDraft(s);
  else if (step.act) body.innerHTML = stepScenes(s, step.act);
  body.querySelectorAll('textarea').forEach(growTextarea);
  window.scrollTo(0, 0);
}

/* Step 1 — Story: title, format, acts, logline, theme. */
function formatPickerHtml(s) {
  var btns = Object.keys(FORMATS).map(function (k) {
    return '<button type="button" class="' + (s.format === k ? 'primary' : '') + '" data-format="' + k + '">' + FORMATS[k].label + '</button>';
  }).join('');
  return '<label>What are you writing?<span class="hint">Feature = acts you pick. TV Pilot = a teaser, then acts with act breaks. Streaming = one flow, no act breaks.</span></label>' +
    '<div class="btnrow">' + btns + '</div>';
}
function methodPickerHtml(s) {
  var md = methodDefFor(s);
  var btns = METHODS.map(function (m) {
    return '<button type="button" class="' + (s.method === m.id ? 'primary' : '') + '" data-method="' + m.id + '">' + esc(m.label) + '</button>';
  }).join('');
  return '<label>Which method are you writing with?<span class="hint">One per script — it only changes the Beats step. Switching never deletes what you wrote; each method keeps its own beats.</span></label>' +
    '<div class="btnrow">' + btns + '</div>' +
    '<p class="muted">' + esc(md.label) + ' — ' + esc(md.book) + '. ' + esc(md.blurb) + '</p>' +
    '<p class="muted">McKee’s Story principles ride along with any method — short notes on Story, Characters, and Draft.</p>';
}
function actPickerHtml(s) {
  if (s.format === 'streaming') {
    return '<p class="muted">Streaming — 1 continuous arc, no act breaks. One flow from cold open to outro.</p>';
  }
  var btns = [1, 2, 3, 4, 5].map(function (n) {
    return '<button type="button" class="' + (s.acts === n ? 'primary' : '') + '" data-acts="' + n + '">' + n + (n === 3 ? ' (standard)' : '') + '</button>';
  }).join('');
  var plans = ACT_PLANS[s.acts].map(function (a, i) { return 'Act ' + (i + 1) + ' ' + a.title; }).join(' · ');
  return '<label>How many acts do you want?<span class="hint">Default is 3. Pick 1–5 — you can change this later, and your scenes re-spread across the acts. Your words stay put.</span></label>' +
    '<div class="btnrow">' + btns + '</div>' +
    '<p class="muted">With ' + s.acts + ' act' + (s.acts > 1 ? 's' : '') + ': ' + esc(plans) + '</p>';
}
function tvLengthPickerHtml(s) {
  if (s.format !== 'tv') return '';
  var btns = [['30', '30 min'], ['60', '60 min']].map(function (x) {
    return '<button type="button" class="' + (s.tvLength === x[0] ? 'primary' : '') + '" data-tvlength="' + x[0] + '">' + x[1] + '</button>';
  }).join('');
  return '<label>How long is the episode?<span class="hint">30 min = teaser + 4 acts, ~22 scenes, ~30 pages. 60 min = teaser + 5 acts, ~38 scenes, ~60 pages.</span></label>' +
    '<div class="btnrow">' + btns + '</div>';
}
function stepStory(s) {
  return '<div class="card"><h2>Story snapshot</h2>' +
    '<p class="sub">Shitty first draft — you can make it better later.</p>' +
    field('title', 'Title') +
    formatPickerHtml(s) +
    methodPickerHtml(s) +
    tvLengthPickerHtml(s) +
    actPickerHtml(s) +
    field('genre', 'Genre', '', 'select', GENRES) +
    (s.format === 'streaming' ? field('story.seasonArc', 'Season arc', 'Where does this episode sit in the season? What carries over from before, and what does it set up?', 'textarea') : '') +
    field('story.logline', 'Logline', 'One line: who does what, to whom, at what cost?', 'textarea') +
    field('story.hero', 'Hero', 'Who are we following? One line.', 'textarea') +
    field('story.want', 'Hero wants', 'The goal they chase on the surface.', 'textarea') +
    field('story.need', 'Hero needs', 'The truth they have to learn. Want vs. need = the whole movie.', 'textarea') +
    field('story.antagonist', 'Antagonist / opposing force', 'Who or what pushes back? What do they want?', 'textarea') +
    field('story.stakes', 'Stakes', 'What is lost if the hero fails?', 'textarea') +
    field('story.ending', 'How it ends', 'The last image. Short.', 'textarea') +
    field('story.endingWhy', 'Why this ending', 'Why does it have to end this way?', 'textarea') +
    field('story.theme', 'Theme — what is it about, really?', 'One sentence, plain words.', 'textarea') +
    (s.method === 'truby' ? field('story.moralArgument', 'Moral argument (Truby)', 'What two values are fighting, and which one wins?', 'textarea') : '') +
    mckeeDetails('Controlling idea', 'What value changes, and what does the ending prove? One sentence: [value] changes from [X] to [Y] because [choice].') +
    mckeeDetails('Want vs. need', 'The hero’s conscious want drives the plot; their unconscious need is what the story is really about. The gap between expectation and result is where a scene turns.') +
    field('story.whyGenre', 'Why this genre', 'Why is THIS story a ' + (s.genre || 'script') + '?', 'textarea') +
    field('story.byline', 'Written by (title page)', 'The name on the script’s title page.', 'textarea') +
    '</div>';
}

/* Step 2 — Characters, one card at a time, with beginning/middle/end arcs. */
function arcFields(prefix, c, label) {
  return '<h3>Character arc — ' + label + '</h3>' +
    '<p class="sub">' + esc(arcMapText(cur().acts)) + '</p>' +
    field(prefix + '.arcBegin', 'Arc Beginning', 'Who are they at the start?', 'textarea') +
    field(prefix + '.arcMid', 'Arc Middle', 'What changes them? The turning point.', 'textarea') +
    field(prefix + '.arcEnd', 'Arc End', 'Who have they become by the end?', 'textarea');
}
function charCard(def, idx, s) {
  var c = s.chars[def.key], isMain = def.kind === 'main';
  var h = '<div class="card"><h2>' + def.heading + '</h2><p class="sub">One card at a time. Fill what you know, skip the rest.</p>';
  if (idx > 0) h += pagerHtml('char', idx, 'Card');
  h += field('chars.' + def.key + '.name', 'Name', def.role === 'Protagonist' ? 'The hero’s name.' : '');
  if (isMain) {
    h += field('chars.' + def.key + '.want', 'Want', 'What do they chase?') +
      field('chars.' + def.key + '.need', 'Need', 'What do they actually need?') +
      '<div class="grid2">' +
      field('chars.' + def.key + '.talk', 'How they talk', 'Speech — slang, short sentences, swears?') +
      field('chars.' + def.key + '.conflict', 'Conflict with hero', 'What do they fight about?') +
      '</div>';
  } else {
    h += '<div class="grid2">' +
      field('chars.' + def.key + '.job', 'Job / role', 'What do they do in the story?') +
      field('chars.' + def.key + '.trait', 'Trait', 'One thing we remember them by.') +
      '</div>';
  }
  h += arcFields('chars.' + def.key, c, def.role);
  h += pagerHtml('char', idx, 'Card') + '</div>';
  return h;
}
function stepCharacters(s) {
  var idx = Math.min(s.pos.char || 0, CHAR_DEFS.length - 1);
  var chips = CHAR_DEFS.map(function (d, i) {
    return '<button type="button" data-jump-char="' + i + '"' + (i === idx ? ' class="on"' : '') + '>' + d.short + '</button>';
  }).join('');
  return '<div class="card"><h2>Characters</h2><p class="sub">Five cards — hero, opposition, three supporting. Each one has an arc: beginning, middle, end.</p>' +
    (s.method === 'truby' ? '<p class="muted">Truby: the opponent should be the person best able to attack the hero’s weakness, not just the strongest villain.</p>' : '') +
    mckeeDetails('The gap', 'Every scene should have a gap between what the hero expects and what actually happens. No gap, no turn — cut the scene or rewrite it.') +
    '</div>' +
    '<div class="chips">' + chips + '</div>' + charCard(CHAR_DEFS[idx], idx, s);
}

/* One field per beat/step of the current method. Gabe's 6 beats live in
   s.beats; every other method's steps live in s.methodBeats. */
function methodBeatField(s, step, md, n) {
  var tag = methodPageTag(s, step);
  var label = (n ? n + '. ' : '') + step.label + (tag ? ' — ' + tag : '');
  return field(methodBeatPath(step, md), label, step.hint, 'textarea');
}
/* Step 3 — Beats / Cards / Steps / Stages, per the script's method.
   Typing here only ever updates the field (input event) — no re-render,
   no scroll-to-top — same as every other step. */
function stepBeats(s) {
  var md = methodDefFor(s);
  var h;
  if (md.id === 'gabe') {
    h = '<div class="card"><h2>The six beats</h2>' +
      '<p class="sub">The starter template: cold open → setup → big turn/scare at midpoint → short outro.</p>';
  } else {
    h = '<div class="card"><h2>' + md.steps.length + ' ' + md.unit + ' — ' + esc(md.label) + '</h2>' +
      '<p class="sub">' + esc(md.book) + ' · ' + esc(md.blurb) + '</p>';
  }
  h += '<div class="rule">Shitty-draft rules: no rewriting a beat mid-draft, no perfect first lines, no dialogue before the outline is done. Keep moving. You can fix it in cleanup week.</div>' +
    '<p class="muted">Switching method never deletes what you wrote — each method keeps its own beats.</p>' +
    '<div class="btnrow">' + METHODS.map(function (m) {
      return '<button type="button" class="small' + (s.method === m.id ? ' primary' : '') + '" data-method="' + m.id + '">' + esc(m.label) + '</button>';
    }).join('') + '</div>';
  if (md.id === 'gabe') {
    /* Labels and hints unchanged from before methods existed. */
    h += field('beats.cold', '1. Cold Open', 'What hooks us in the first page? What do we see first? The title card lands here.', 'textarea') +
      field('beats.inciting', '2. Inciting Incident', 'What wrecks the normal world and forces the hero to act? (Around scene 7.)', 'textarea') +
      field('beats.pp1', '3. Plot Point 1 — into Act 2', 'The decision they can’t take back. The door locks.', 'textarea') +
      field('beats.midpoint', '4. Midpoint — the big turn / scare', 'The biggest turn or scare, right in the middle. False win or false loss — the plan flips.', 'textarea') +
      field('beats.allIsLost', '5. All Is Lost', 'The lowest point. The flaw costs them everything.', 'textarea') +
      field('beats.climax', '6. Climax + Outro', 'The final showdown, then a short outro. The last image should answer the opening.', 'textarea');
  } else if (md.id === 'truby') {
    /* 7 key steps first, in story order; the other 15 live inside one
       <details> so a phone screen isn't 22 textareas at once. Every
       step appears exactly once, so no two fields share a data-path. */
    h += '<h3>7 key steps — the spine</h3>';
    md.steps.forEach(function (st, i) {
      if (st.keyStep) h += methodBeatField(s, st, md, i + 1);
    });
    h += '<details class="collap"><summary>Show the other 15 steps</summary>';
    md.steps.forEach(function (st, i) {
      if (!st.keyStep) h += methodBeatField(s, st, md, i + 1);
    });
    h += '</details>';
  } else if (md.groups) {
    md.groups.forEach(function (g) {
      h += '<h3>' + esc(g.title) + '</h3>';
      for (var i = g.from; i <= g.to; i++) h += methodBeatField(s, md.steps[i], md, i + 1);
    });
  } else {
    md.steps.forEach(function (st, i) { h += methodBeatField(s, st, md, i + 1); });
  }
  return h + '</div>';
}

/* Steps 4+ — one act's scene cards, one at a time. Fully editable: add,
   remove, reorder. The act card says what that act needs. */
function sceneCard(def, idx) {
  var s = cur(), sc = s.scenes[idx], total = s.scenes.length;
  var isFirst = idx === 0, isLast = idx === total - 1;
  var h = '<div class="scene"><div class="head"><b>Scene ' + def.n + ' of ' + total + '</b><span class="beat">' + esc(def.beat) + '</span></div>' +
    '<div class="pages">Act ' + def.act + ' · ~' + def.pages + ' pages</div>' +
    tagPill(sc) +
    '<label>Scene heading<textarea data-scene="' + idx + '" data-field="slug" placeholder="INT. KITCHEN — NIGHT">' + esc(sc.slug) + '</textarea></label>' +
    '<label>What happens<textarea data-scene="' + idx + '" data-field="happens" placeholder="What happens in this scene?">' + esc(sc.happens) + '</textarea></label>' +
    '<label>The turn<textarea data-scene="' + idx + '" data-field="turn" placeholder="What changes by the end of the scene?">' + esc(sc.turn) + '</textarea></label>' +
    '<label>Scene purpose<textarea data-scene="' + idx + '" data-field="purpose" placeholder="Why is this scene here? What does it do for the story?">' + esc(sc.purpose) + '</textarea></label>' +
    '<label>What’s at stake in this scene<textarea data-scene="' + idx + '" data-field="stakes" placeholder="What does the hero stand to lose here?">' + esc(sc.stakes) + '</textarea></label>' +
    tagSelects(idx, sc) +
    '<label>What to tighten — revision note<span class="hint">A note to your future self. This never overwrites the scene above.</span>' +
    '<textarea data-scene="' + idx + '" data-field="revise" placeholder="What to tighten in this scene…">' + esc(sc.revise) + '</textarea></label>' +
    '<label class="checkrow"><input type="checkbox" data-scene="' + idx + '" data-field="done"' + (sc.done ? ' checked' : '') + '> Scene outlined — I’m happy with this one</label>' +
    '<div class="btnrow"><button type="button" data-write="' + idx + '">✍️ Write this scene</button></div>' +
    '<div class="btnrow"><button type="button" class="small" data-addscene="' + idx + '">＋ Scene after this</button>' +
    '<button type="button" class="small" data-movescene="-1" data-sceneidx="' + idx + '"' + (isFirst ? ' disabled' : '') + '>↑ Move up</button>' +
    '<button type="button" class="small" data-movescene="1" data-sceneidx="' + idx + '"' + (isLast ? ' disabled' : '') + '>↓ Move down</button>' +
    '<button type="button" class="small ghost" data-delscene="' + idx + '">🗑 Delete</button></div></div>';
  return h;
}
function stepScenes(s, actNum) {
  var plan = ACT_PLANS[s.acts][actNum - 1];
  var count = s.actCounts[actNum - 1] || 0;
  var start = actStart(s, actNum);
  var prompt = plan.prompt + (s.format === 'tv' ? ' End on a hook — commercial break.' : '');
  var suggested = suggestedCounts(s.scenes.length, s.acts)[actNum - 1];
  var h = '<div class="card"><h2>' + actStepLabel(s, actNum) + ' — ' + plan.title + '</h2>' +
    '<p class="sub">' + esc(prompt) + '</p>' +
    (s.format === 'tv' && actNum < s.acts ? '<p class="muted">📺 Commercial break after this act — end on a hook that makes them stay through the ads.</p>' : '') +
    '<p class="muted">Suggested: ' + suggested + ' scenes — you have ' + count + '. Add, remove, or move scene cards below; the structure bends to you.</p></div>';
  if (count === 0) {
    h += '<div class="card"><p>This act has no scenes yet.</p>' +
      '<div class="btnrow"><button type="button" class="primary" data-addscene-first="' + actNum + '">＋ Add the first scene</button></div></div>';
    return h;
  }
  var idx = Math.min(s.pos['act' + actNum] || 0, count - 1);
  var local = start + idx;
  var chips = '';
  for (var i = 0; i < count; i++) {
    chips += '<button type="button" data-jump-scene="' + (start + i) + '"' + (i === idx ? ' class="on"' : '') + '>' + (start + i + 1) + '</button>';
  }
  h += '<div class="chips scroll">' + chips + '</div>';
  h += pagerHtml('act' + actNum, idx, 'Card');
  h += sceneCard(sceneDefFor(s, local), local);
  h += pagerHtml('act' + actNum, idx, 'Card');
  var filled = actScenes(s, actNum).filter(function (sc) { return sc.happens; }).length;
  h += '<div class="card"><p class="muted">' + filled + ' of ' + count + ' scenes in this act have a “what happens”.</p>' +
    '<div class="btnrow"><button type="button" data-addscene-last="' + actNum + '">＋ Add a scene to ' + actStepLabel(s, actNum) + '</button></div></div>';
  return h;
}

/* Outline — read it back, per act, with character arcs. */
function charArcText(c) {
  var lines = [];
  if (c.arcBegin) lines.push('<b>Arc — Beginning:</b> ' + esc(c.arcBegin));
  if (c.arcMid) lines.push('<b>Arc — Middle:</b> ' + esc(c.arcMid));
  if (c.arcEnd) lines.push('<b>Arc — End:</b> ' + esc(c.arcEnd));
  return lines.length ? '<br>' + lines.join('<br>') : '';
}
function printCharacters(s) {
  var h = '<h2>Characters + arcs</h2>';
  CHAR_DEFS.forEach(function (d) {
    var c = s.chars[d.key];
    if (!c.name && !c.want && !c.need && !c.arcBegin && !c.arcMid && !c.arcEnd) return;
    var bits = [];
    if (c.name) bits.push('<b>' + esc(c.name) + '</b> (' + d.role + ')');
    if (c.want) bits.push('Wants: ' + esc(c.want));
    if (c.need) bits.push('Needs: ' + esc(c.need));
    if (d.kind === 'main') {
      if (c.talk) bits.push('Talks: ' + esc(c.talk));
      if (c.conflict) bits.push('Conflict: ' + esc(c.conflict));
    } else {
      if (c.job) bits.push('Role: ' + esc(c.job));
      if (c.trait) bits.push('Trait: ' + esc(c.trait));
    }
    h += '<p>' + bits.join('<br>') + charArcText(c) + '</p>';
  });
  return h;
}
function printSceneRow(s, idx) {
  var sc = s.scenes[idx], def = sceneDefFor(s, idx), t = tagText(sc);
  var slug = (sc.slug || '').trim();
  var h = '<div class="pscene"><p>' + (slug ? '<span class="slug">' + esc(slug.toUpperCase()) + '</span> ' : '') +
    '<span class="muted">(' + (slug ? '' : 'No scene heading yet · ') + 'Scene ' + def.n + ' · ' + esc(def.beat) + ' · ~' + def.pages + ' pages' + (t ? ' · ' + esc(t) : '') + ')</span><br>' +
    (sc.happens ? esc(sc.happens) : '<i class="muted">— empty —</i>') +
    (sc.turn ? '<br><b>Turn:</b> ' + esc(sc.turn) : '') +
    (sc.purpose ? '<br><b>Purpose:</b> ' + esc(sc.purpose) : '') +
    (sc.stakes ? '<br><b>Stakes:</b> ' + esc(sc.stakes) : '') +
    (t ? '<br><b>Tag:</b> ' + esc(t) : '') +
    (sc.revise ? '<br><b>Tighten:</b> ' + esc(sc.revise) : '') +
    '</p></div>';
  return h;
}
function printActGroups(s) {
  /* Outline groups: teaser first for TV, then one group per act.
     Streaming has no acts — one continuous Episode Arc. */
  if (s.format === 'streaming') return [{ key: 1, title: 'Episode Arc — Continuous' }];
  var groups = [];
  if (s.format === 'tv' && s.teaserCount > 0) groups.push({ key: 'teaser', title: 'Teaser' });
  for (var a = 1; a <= s.acts; a++) groups.push({ key: a, title: 'Act ' + ['One', 'Two', 'Three', 'Four', 'Five'][a - 1] + ' — ' + ACT_PLANS[s.acts][a - 1].title });
  return groups;
}
function groupSceneIndices(s, key) {
  if (key === 'teaser') {
    var out = [];
    for (var i = 0; i < Math.min(s.teaserCount, s.scenes.length); i++) out.push(i);
    return out;
  }
  var start = actStart(s, key), out2 = [];
  for (var j = 0; j < (s.actCounts[key - 1] || 0); j++) out2.push(start + j);
  return out2;
}
/* Outline's beats section lists the current method's steps, not always
   the six. Gabe's rendering is unchanged from before methods existed. */
function outlineBeatsHtml(s) {
  var md = methodDefFor(s);
  if (md.id === 'gabe') {
    return '<h3>Six beats</h3><p>' +
      ['Cold Open: ' + s.beats.cold, 'Inciting Incident: ' + s.beats.inciting, 'Plot Point 1: ' + s.beats.pp1,
       'Midpoint: ' + s.beats.midpoint, 'All Is Lost: ' + s.beats.allIsLost, 'Climax: ' + s.beats.climax]
        .map(function (b) { return esc(b); }).join('<br>') + '</p>';
  }
  return '<h3>' + md.steps.length + ' ' + md.unit.toLowerCase() + ' — ' + esc(md.label) + '</h3><p>' +
    md.steps.map(function (st) { return esc(st.label + ': ' + methodBeatValue(s, st, md)); }).join('<br>') + '</p>';
}
function stepOutline(s) {
  var p = progressFor(s), dp = draftStatsFor(s);
  var h = '<div class="card"><h2>Outline — read it back</h2>' +
    '<p class="sub">' + p.filled + ' of ' + p.total + ' boxes filled · ' + p.pct + '% · ~' + Math.round(dp.pages) + ' pages drafted</p>' +
    '<p class="muted">This is the whole movie on one page. If a scene reads boring here, it will read boring on paper.</p>' +
    '<div class="btnrow"><button type="button" data-print="outline-all">🖨 Print / Save outline as PDF</button>' +
    '<button type="button" data-print="draft-all">🖨 Print script as PDF</button>' +
    '<button type="button" data-preview="outline">👁 Preview outline</button>' +
    printActGroups(s).map(function (g) {
      return '<button type="button" class="small" data-print="outline-' + g.key + '">Print ' + esc(g.title.split(' — ')[0]) + '</button>';
    }).join('') + '</div>' +
    '<div class="btnrow"><button type="button" class="primary" data-act="goto-draft">✍️ Start writing the draft →</button></div></div>';
  h += '<div class="card"><h2>' + esc(s.title || 'Untitled') + '</h2>' +
    (s.story.logline ? '<p><b>Logline:</b> ' + esc(s.story.logline) + '</p>' : '') +
    (s.story.theme ? '<p><b>Theme:</b> ' + esc(s.story.theme) + '</p>' : '') +
    (s.story.moralArgument ? '<p><b>Moral argument:</b> ' + esc(s.story.moralArgument) + '</p>' : '') +
    (s.story.seasonArc ? '<p><b>Season arc:</b> ' + esc(s.story.seasonArc) + '</p>' : '') +
    '<p><b>Hero:</b> ' + esc(s.story.hero || '—') + ' · <b>Wants:</b> ' + esc(s.story.want || '—') + ' · <b>Needs:</b> ' + esc(s.story.need || '—') + '</p>' +
    '<p><b>Antagonist:</b> ' + esc(s.story.antagonist || '—') + ' · <b>Stakes:</b> ' + esc(s.story.stakes || '—') + '</p>' +
    '<p><b>Ending:</b> ' + esc(s.story.ending || '—') + (s.story.endingWhy ? ' — ' + esc(s.story.endingWhy) : '') + '</p>' +
    outlineBeatsHtml(s) +
    printCharacters(s) + '</div>';
  printActGroups(s).forEach(function (g) {
    var idxs = groupSceneIndices(s, g.key);
    h += '<div class="card"><h2>' + esc(g.title) + '</h2><p class="sub">' + idxs.length + ' scenes</p>';
    idxs.forEach(function (idx) {
      var sc = s.scenes[idx], def = sceneDefFor(s, idx);
      h += '<p><b>Scene ' + def.n + ' — ' + esc(sc.slug || 'Untitled') + '</b> <span class="muted">(' + esc(def.beat) + ' · ~' + def.pages + ' pages)</span><br>' +
        (sc.happens ? esc(sc.happens) : '<i class="muted">— empty —</i>') +
        (sc.turn ? '<br><b>Turn:</b> ' + esc(sc.turn) : '') +
        (sc.purpose ? '<br><b>Purpose:</b> ' + esc(sc.purpose) : '') +
        (sc.stakes ? '<br><b>Stakes:</b> ' + esc(sc.stakes) : '') +
        (sc.revise ? '<br><b>Tighten:</b> ' + esc(sc.revise) : '') +
        tagPill(sc) + ' <button type="button" class="small" data-write="' + idx + '">✍️ Write Scene ' + def.n + '</button></p>';
    });
    h += '</div>';
  });
  return h;
}

/* ---------------- writing view ---------------- */
function sceneNotesHtml(s, idx, hidden) {
  var sc = s.scenes[idx], def = sceneDefFor(s, idx);
  var h = '<div class="notes" id="notes-panel"' + (hidden ? ' hidden' : '') + '><h3>📋 Scene ' + def.n + ' notes</h3>';
  h += '<p><b>Heading:</b> ' + esc(sc.slug || '—') + '</p>';
  if (sc.happens) h += '<p><b>What happens:</b> ' + esc(sc.happens) + '</p>';
  if (sc.turn) h += '<p><b>The turn:</b> ' + esc(sc.turn) + '</p>';
  if (sc.purpose) h += '<p><b>Purpose:</b> ' + esc(sc.purpose) + '</p>';
  if (sc.stakes) h += '<p><b>What’s at stake:</b> ' + esc(sc.stakes) + '</p>';
  if (s.story.stakes) h += '<p><b>Story stakes:</b> ' + esc(s.story.stakes) + '</p>';
  if (sc.revise) h += '<p><b>Tighten:</b> ' + esc(sc.revise) + '</p>';
  var tag = tagText(sc);
  if (tag) h += '<p><b>Tag:</b> ' + esc(tag) + '</p>';
  var charKey = sc.tagChar || 'pro', c = s.chars[charKey];
  var def2 = null;
  CHAR_DEFS.forEach(function (d) { if (d.key === charKey) def2 = d; });
  h += '<h3>Character notes — ' + esc(c.name || (def2 ? def2.role : 'Protagonist')) + '</h3>';
  if (c.want) h += '<p><b>Want:</b> ' + esc(c.want) + '</p>';
  if (c.need) h += '<p><b>Need:</b> ' + esc(c.need) + '</p>';
  if (c.talk) h += '<p><b>Talk:</b> ' + esc(c.talk) + '</p>';
  if (def2 && def2.kind === 'main') {
    if (c.conflict) h += '<p><b>Conflict:</b> ' + esc(c.conflict) + '</p>';
  } else {
    if (c.job) h += '<p><b>Role:</b> ' + esc(c.job) + '</p>';
    if (c.trait) h += '<p><b>Trait:</b> ' + esc(c.trait) + '</p>';
  }
  if (c.arcBegin || c.arcMid || c.arcEnd) {
    h += '<p><b>Arc:</b> ';
    if (c.arcBegin) h += '<br>Beginning: ' + esc(c.arcBegin);
    if (c.arcMid) h += '<br>Middle: ' + esc(c.arcMid);
    if (c.arcEnd) h += '<br>End: ' + esc(c.arcEnd);
    h += '</p>';
  }
  if (sc.tagArc) h += '<p><span class="now">▶ you are here: Arc ' + esc(sc.tagArc) + '</span></p>';
  h += '</div>';
  return h;
}
function blockRow(idx, bi, b) {
  var def = blockTypeDef(b.t);
  var total = cur().scenes[idx].blocks.length;
  /* A real picker, not the old one-tap-per-step cycle: the <select>
     jumps straight to any of the five types. */
  var typeOpts = BLOCK_TYPES.map(function (t) {
    return '<option value="' + t.t + '"' + (t.t === b.t ? ' selected' : '') + '>' + t.label + '</option>';
  }).join('');
  return '<div class="block b-' + b.t + '" data-bi="' + bi + '">' +
    '<div class="blockbar"><select class="small" data-blocktype="' + idx + ':' + bi + '" aria-label="Block type">' + typeOpts + '</select>' +
    '<button type="button" class="small" data-moveblock="' + idx + ':' + bi + '" data-dir="-1"' + (bi === 0 ? ' disabled' : '') + ' title="Move this block up">↑</button>' +
    '<button type="button" class="small" data-moveblock="' + idx + ':' + bi + '" data-dir="1"' + (bi === total - 1 ? ' disabled' : '') + ' title="Move this block down">↓</button>' +
    '<button type="button" class="small" data-insertblock="' + idx + ':' + bi + '" title="Insert a block below this one">＋ below</button>' +
    '<button type="button" class="small ghost" data-blockdel="' + idx + ':' + bi + '">×</button></div>' +
    '<textarea data-block="' + idx + ':' + bi + '"' + (b.t === 'character' ? ' list="char-names"' : '') + ' placeholder="' + esc(def.ph) + '">' + esc(b.x || '') + '</textarea></div>';
}
/* Type the Enter key guesses for the block after this one: a character
   cue is always followed by dialogue, dialogue by a character cue. */
function nextBlockTypeAfter(t) {
  return { character: 'dialogue', dialogue: 'character', action: 'action', paren: 'dialogue', transition: 'action' }[t] || 'action';
}
/* Insert a block after bi, type inferred from the block above it. */
function insertBlock(idx, bi) {
  var s = cur(), sc = s.scenes[idx];
  if (!sc) return;
  var type = sc.blocks[bi] ? nextBlockTypeAfter(sc.blocks[bi].t) : 'action';
  sc.blocks.splice(bi + 1, 0, { t: type, x: '' });
  syncTypeText(sc);
  touchLocal(); save();
  refreshDraft(bi + 1);
}
/* Swap a block with its neighbour, mirroring moveScene(). */
function moveBlock(idx, bi, dir) {
  var s = cur(), blocks = s.scenes[idx].blocks, j = bi + dir;
  if (j < 0 || j >= blocks.length) return;
  var tmp = blocks[bi]; blocks[bi] = blocks[j]; blocks[j] = tmp;
  syncTypeText(s.scenes[idx]);
  touchLocal(); save();
  refreshDraft(j);
}
/* Character names for the datalist: the five character cards first,
   then any name already typed as a character cue in this script. */
function charNameOptionsHtml(s) {
  var names = [];
  CHAR_DEFS.forEach(function (d) {
    var n = (s.chars[d.key] && s.chars[d.key].name || '').trim().toUpperCase();
    if (n && names.indexOf(n) === -1) names.push(n);
  });
  s.scenes.forEach(function (sc) {
    (sc.blocks || []).forEach(function (b) {
      if (b.t === 'character') {
        var n2 = (b.x || '').trim().toUpperCase();
        if (n2 && names.indexOf(n2) === -1) names.push(n2);
      }
    });
  });
  return names.map(function (n) { return '<option value="' + esc(n) + '">'; }).join('');
}
function draftBlocksHtml(s, idx) {
  return s.scenes[idx].blocks.map(function (b, bi) { return blockRow(idx, bi, b); }).join('');
}
/* Draft scene chips, grouped by act: number + truncated slug, with a
   dot on scenes that already have draft text, plus a jump to the
   first scene with nothing written yet. */
function draftChipsHtml(s, idx) {
  var h = '';
  for (var a = 1; a <= s.acts; a++) {
    var start = actStart(s, a), count = s.actCounts[a - 1] || 0;
    if (!count) continue;
    h += '<div class="chip-group"><span class="chip-group-label">' + esc(actStepLabel(s, a)) + '</span><div class="chips">';
    for (var i = 0; i < count; i++) {
      var gi = start + i, sc = s.scenes[gi], def = sceneDefFor(s, gi);
      var slug = (sc.slug || '').trim();
      var written = !!(sceneText(sc) || '').trim();
      var label = String(def.n) + (slug ? ' · ' + slug : '');
      if (label.length > 22) label = label.slice(0, 21) + '…';
      h += '<button type="button" data-jump-draft="' + gi + '"' + (gi === idx ? ' class="on"' : '') +
        (written ? ' data-written="1"' : '') + ' title="' + esc(slug ? slug : 'Scene ' + def.n) + '">' +
        (written ? '<span class="dot">●</span> ' : '') + esc(label) + '</button>';
    }
    h += '</div></div>';
  }
  var firstEmpty = -1;
  for (var j = 0; j < s.scenes.length; j++) { if (!(sceneText(s.scenes[j]) || '').trim()) { firstEmpty = j; break; } }
  h += '<div class="btnrow"><button type="button" class="small" data-next-unwritten' + (firstEmpty < 0 ? ' disabled' : '') + '>Next unwritten →</button></div>';
  return h;
}
/* The last block deleted in this draft view, for the Undo affordance:
   { idx, bi, block }. Cleared by any other in-draft action (via
   refreshDraft) or by leaving the step (via renderStep) — it clears
   on the next action, never on a delay. */
var lastDeletedBlock = null;
function updateUndoBar() {
  var bar = document.getElementById('draft-undo');
  if (!bar) return;
  if (lastDeletedBlock) {
    bar.hidden = false;
    bar.innerHTML = '<span>Block deleted.</span><button type="button" class="small" id="btn-undo-block">Undo</button>';
  } else {
    bar.hidden = true;
    bar.innerHTML = '';
  }
}
/* Rebuild only the draft blocks + chips after an in-draft structural
   change, instead of renderStep() rebuilding the whole step and
   scrolling to the top. Typing position, scroll and focus survive:
   the slugline input and notes panel are never touched, and the
   target textarea is focused again afterwards. */
function refreshDraft(focusBi, keepUndo) {
  /* Type mode has no #blocks to rebuild — the textarea IS the editor.
     Parse once (in case this was reached without a blur) and leave
     the textarea and its caret alone. */
  if (draftMode(cur()) === 'type') { parseTypeMode(); return; }
  if (!keepUndo) lastDeletedBlock = null;
  var s = cur(), idx = Math.min(s.pos.draft || 0, s.scenes.length - 1);
  var blocksEl = document.getElementById('blocks');
  if (!blocksEl) { renderStep(); return; }
  var y = window.scrollY || 0;
  blocksEl.innerHTML = draftBlocksHtml(s, idx);
  var chipsEl = document.getElementById('draft-chips');
  if (chipsEl) chipsEl.innerHTML = draftChipsHtml(s, idx);
  var dl = document.getElementById('char-names');
  if (dl) dl.innerHTML = charNameOptionsHtml(s);
  updateDraftTotals();
  updateUndoBar();
  blocksEl.querySelectorAll('textarea').forEach(growTextarea);
  if (window.scrollTo) window.scrollTo(0, y);
  if (typeof focusBi === 'number' && focusBi >= 0) {
    var tas = blocksEl.querySelectorAll('textarea');
    var ta = tas[focusBi];
    if (ta) {
      ta.focus();
      try { var pos = ta.value ? ta.value.length : 0; ta.setSelectionRange(pos, pos); } catch (err) {}
      if (typeof ta.scrollIntoView === 'function') { try { ta.scrollIntoView({ block: 'nearest' }); } catch (err2) {} }
    }
  }
}
function stepDraft(s) {
  var idx = Math.min(s.pos.draft || 0, s.scenes.length - 1);
  var sc = s.scenes[idx], def = sceneDefFor(s, idx), dp = draftStats(), tp = targetPages(s);
  var mode = draftMode(s);
  /* Cards mode needs one block to show; Type mode starts from an
     empty textarea, so no phantom block is ever added there. */
  if (mode === 'cards' && !sc.blocks.length) { sc.blocks.push({ t: 'action', x: '' }); touchLocal(); save(); syncTypeText(sc); }
  var h = '<div class="card"><h2>Writing — Scene ' + def.n + ' of ' + s.scenes.length + '</h2>' +
    '<p class="sub">' + esc(def.beat) + ' · ~' + def.pages + ' pages planned for this scene</p>' +
    '<p class="stat"><b>' + Math.round(dp.pages) + '</b> pages drafted · <b>' + dp.words.toLocaleString() + '</b> words · target ' + tp + ' pages</p>' +
    '<div class="progress"><div style="width:' + Math.min(100, Math.round(100 * dp.pages / tp)) + '%"></div></div>' +
    '<p class="muted">Scene headings are in caps. Character names centered, dialogue underneath — same as a real script.</p>' +
    '<div class="seg" role="group" aria-label="Draft mode">' +
    '<button type="button" data-draftmode="cards"' + (mode === 'cards' ? ' class="on" aria-pressed="true"' : '') + '>Cards</button>' +
    '<button type="button" data-draftmode="type"' + (mode === 'type' ? ' class="on" aria-pressed="true"' : '') + '>Type</button></div>' +
    '<p class="muted">' + (mode === 'type'
      ? 'Type mode — just type the scene like a script. It sorts itself into blocks when you leave the page.'
      : 'Cards mode — one block at a time, with the picker. Switch to Type to just write.') + '</p>' +
    mckeeDetails('A scene is a turning point', 'A scene that doesn’t change a value — love/hate, trust/distrust, life/death — is a scene to cut.') +
    mckeeDetails('Crisis, then climax', 'Crisis is the hardest choice; climax is the action taken. Don’t skip the choice to get to the action.') +
    '<div class="btnrow"><button type="button" data-print="draft-all">🖨 Print / Save script as PDF</button>' +
    '<button type="button" data-preview="draft">👁 Preview script pages</button>' +
    '<button type="button" class="small" data-act="goto-outline">📄 Back to outline</button></div></div>';
  var chipsHtml = draftChipsHtml(s, idx);
  h += '<div id="draft-chips">' + chipsHtml + '</div>';
  h += pagerHtml('draft', idx, 'Card');
  if (mode === 'type') return h + stepDraftType(s, idx, sc, def);
  var slug = (sc.slug || '').trim();
  /* Notes start collapsed once this scene has written blocks, open on
     a fresh scene; an explicit toggle (s.pos.notesHidden) always wins. */
  var hasWritten = sc.blocks.some(function (b) { return (b.x || '').trim(); });
  var notesHidden = (typeof s.pos.notesHidden === 'boolean') ? s.pos.notesHidden : hasWritten;
  h += '<div class="card">' +
    '<label>Scene heading<span class="hint">All caps — e.g. INT. KITCHEN — NIGHT. Prints as the slugline.</span>' +
    '<input type="text" class="slugline-input" data-scene="' + idx + '" data-field="slug" placeholder="INT. KITCHEN — NIGHT" value="' + esc(sc.slug || '') + '"></label>' +
    (slug ? '' : '<p class="muted">— No scene heading yet — type it in the box above —</p>') +
    '<div class="btnrow"><button type="button" class="small" id="btn-toggle-notes">' + (notesHidden ? 'Show scene notes' : 'Hide scene notes') + '</button></div>' +
    sceneNotesHtml(s, idx, notesHidden);
  h += '<datalist id="char-names">' + charNameOptionsHtml(s) + '</datalist>';
  h += '<div class="blocks" id="blocks">' + draftBlocksHtml(s, idx) + '</div>' +
    '<div id="draft-undo" class="undobar" hidden></div>' +
    '<div class="draft-sticky">' +
    '<div class="btnrow"><button type="button" class="small" data-addblock="action" data-idx="' + idx + '">+ Action</button>' +
    '<button type="button" class="small" data-addblock="character" data-idx="' + idx + '">+ Character</button>' +
    '<button type="button" class="small" data-addblock="dialogue" data-idx="' + idx + '">+ Dialogue</button>' +
    '<button type="button" class="small" data-addblock="paren" data-idx="' + idx + '">+ (aside)</button>' +
    '<button type="button" class="small" data-addblock="transition" data-idx="' + idx + '">+ Transition</button></div>' +
    '<div class="btnrow"><button type="button" class="small" data-prevscene' + (idx === 0 ? ' disabled' : '') + '>← Prev Scene</button>' +
    (idx < s.scenes.length - 1
      ? '<button type="button" class="primary" data-nextscene>Next Scene →</button>' +
        '<button type="button" class="small ghost" data-act="goto-outline">Done — see the outline</button>'
      : '<button type="button" class="primary" data-act="goto-outline">Done — see the outline</button>') +
    '</div></div></div>';
  return h;
}
/* Type mode: the whole scene in one Courier textarea — no picker, no
   per-block taps. The slugline input lives in the text itself (first
   line), so it is not shown separately here; the notes panel stays,
   and so do the chips, pager and scene navigation. The textarea
   value is the latest typed text when it exists, otherwise the
   serialization of the blocks — so switching modes never loses a
   word, and parseTypeMode() (blur / navigation / print / close)
   turns it back into blocks. */
function stepDraftType(s, idx, sc, def) {
  typeTextIdx = idx;
  var hasWritten = sc.blocks.some(function (b) { return (b.x || '').trim(); });
  var notesHidden = (typeof s.pos.notesHidden === 'boolean') ? s.pos.notesHidden : hasWritten;
  var typeValue = (sc.typeText || '').trim() ? sc.typeText : serializeScene(sc);
  var h = '<div class="card">' +
    '<div class="btnrow"><button type="button" class="small" id="btn-toggle-notes">' + (notesHidden ? 'Show scene notes' : 'Hide scene notes') + '</button></div>' +
    sceneNotesHtml(s, idx, notesHidden) +
    '<label>Type the scene<span class="hint">Just type — no tapping, no picker. Enter is a new line.</span>' +
    '<textarea id="type-text" class="type-text" spellcheck="false" placeholder="INT. KITCHEN — NIGHT\n\nHe stirs the pot, listening.\n\nMARA\nWe have to leave tonight.">' + esc(typeValue) + '</textarea></label>' +
    '<p class="muted">Type like a script — INT./EXT. for the heading, a name in CAPS for who speaks, then their lines. It sorts itself into blocks when you leave the page.</p>' +
    '<div class="draft-sticky">' +
    '<div class="btnrow"><button type="button" class="small" data-prevscene' + (idx === 0 ? ' disabled' : '') + '>← Prev Scene</button>' +
    (idx < s.scenes.length - 1
      ? '<button type="button" class="primary" data-nextscene>Next Scene →</button>' +
        '<button type="button" class="small ghost" data-act="goto-outline">Done — see the outline</button>'
      : '<button type="button" class="primary" data-act="goto-outline">Done — see the outline</button>') +
    '</div></div></div>';
  return h;
}
function updateDraftTotals() {
  var dp = draftStats(), tp = targetPages(cur());
  var el = document.querySelector('#step-body .stat');
  if (el) el.innerHTML = '<b>' + Math.round(dp.pages) + '</b> pages drafted · <b>' + dp.words.toLocaleString() + '</b> words · target ' + tp + ' pages';
  var bar = document.querySelector('#step-body .progress > div');
  if (bar) bar.style.width = Math.min(100, Math.round(100 * dp.pages / tp)) + '%';
  var wbar = document.getElementById('wiz-bar');
  if (wbar) wbar.style.width = progressFor(cur()).pct + '%';
  var wt = document.getElementById('wiz-progress-text');
  if (wt) wt.textContent = progressFor(cur()).pct + '% outline · ~' + Math.round(dp.pages) + ' of ' + tp + ' pages';
}

/* ---------------- print ----------------
   The draft prints as an industry-standard screenplay, paginated by hand:
   US Letter, Courier 12pt, 1in top/bottom/right + 1.5in left margins,
   scene headings / action / character / dialogue / parentheticals /
   transitions, title page, page numbers top right from page 2.
   The outline prints separately, by act/scene, as a plain document. */
function wrapText(text, width) {
  var words = String(text || '').split(/\s+/).filter(Boolean);
  var lines = [], cur = '';
  words.forEach(function (w) {
    if (w.length > width) {
      if (cur) { lines.push(cur); cur = ''; }
      while (w.length > width) { lines.push(w.slice(0, width)); w = w.slice(width); }
      cur = w; return;
    }
    if (!cur) cur = w;
    else if ((cur + ' ' + w).length <= width) cur += ' ' + w;
    else { lines.push(cur); cur = w; }
  });
  if (cur) lines.push(cur);
  return lines.length ? lines : [''];
}
function sceneElements(s, idx) {
  var sc = s.scenes[idx], def = sceneDefFor(s, idx), els = [];
  var heading = (sc.slug || '').trim().toUpperCase();
  /* No slug, no heading: a real script never invents "SCENE 1" — the
     scene's blocks still print, in order, with no heading line. */
  if (heading) els.push({ kind: 'heading', lines: wrapText(heading, 60), blankBefore: true });
  var lastChar = '';
  (sc.blocks || []).forEach(function (b) {
    var x = (b.x || '').trim();
    if (!x) return;
    if (b.t === 'character') { lastChar = x.toUpperCase(); els.push({ kind: 'character', lines: wrapText(lastChar, 60), blankBefore: true }); }
    else if (b.t === 'dialogue') els.push({ kind: 'dialogue', charName: lastChar, lines: wrapText(x, 35), blankBefore: false });
    else if (b.t === 'paren') els.push({ kind: 'paren', lines: wrapText(x, 30), blankBefore: false });
    else if (b.t === 'transition') els.push({ kind: 'transition', lines: wrapText(x.toUpperCase(), 60), blankBefore: true });
    else els.push({ kind: 'action', lines: wrapText(x, 60), blankBefore: true });
  });
  return els;
}
function paginateScript(s) {
  var els = [{ kind: 'fade', lines: ['FADE IN:'], blankBefore: false }];
  if (s.format === 'tv' && s.teaserCount > 0) els.push({ kind: 'center', lines: ['TEASER'], blankBefore: true });
  s.scenes.forEach(function (sc, idx) {
    if (!sceneText(sc).trim() && !(sc.slug || '').trim()) return;
    sceneElements(s, idx).forEach(function (el) { els.push(el); });
    if (s.format === 'tv' && s.teaserCount > 0 && idx === s.teaserCount - 1) {
      els.push({ kind: 'center', lines: ['END OF TEASER'], blankBefore: true });
    }
    var act = actOf(s, idx), count = s.actCounts[act - 1] || 0;
    if (s.format === 'tv' && act < s.acts && idx === actStart(s, act) + count - 1) {
      els.push({ kind: 'center', lines: ['END OF ACT ' + ACT_WORDS[act - 1]], blankBefore: true });
    }
  });
  els.push({ kind: 'transition', lines: ['FADE OUT.'], blankBefore: true });
  var pages = [], curLines = [];
  function remaining() { return LINES_PER_PAGE - curLines.length; }
  function newPage() { pages.push(curLines); curLines = []; }
  function addLine(cls, text) { curLines.push({ cls: cls, text: text }); }
  function clsFor(kind) {
    return { heading: 'sp-heading', action: 'sp-action', character: 'sp-char', dialogue: 'sp-dia',
             paren: 'sp-paren', transition: 'sp-trans', fade: 'sp-fade', center: 'sp-center' }[kind] || 'sp-action';
  }
  els.forEach(function (el) {
    var lines = el.lines.slice();
    var needBlank = el.blankBefore && curLines.length > 0;
    /* Keep a heading or character cue with the lines that follow it. */
    if (el.kind === 'heading' || el.kind === 'character') {
      var need = lines.length + (needBlank ? 1 : 0) + 1;
      if (curLines.length > 0 && remaining() < need) { newPage(); needBlank = false; }
    }
    if (needBlank) {
      if (remaining() < 1) newPage();
      else addLine('blank', '');
    }
    if (el.kind === 'heading' || el.kind === 'character' || el.kind === 'transition' || el.kind === 'fade' || el.kind === 'center') {
      if (lines.length > remaining()) newPage();
      lines.forEach(function (ln) { addLine(clsFor(el.kind), ln); });
      return;
    }
    /* Action / dialogue / parenthetical may split across pages. */
    while (lines.length) {
      var room = remaining();
      if (room <= 0) { newPage(); room = remaining(); }
      if (lines.length <= room) {
        lines.forEach(function (ln) { addLine(clsFor(el.kind), ln); });
        lines = [];
      } else {
        var take = lines.slice(0, room);
        if (el.kind === 'dialogue' && el.charName) {
          take[take.length - 1] = take[take.length - 1] + ' (MORE)';
          take.forEach(function (ln) { addLine('sp-dia', ln); });
          newPage();
          addLine('sp-char', el.charName + " (CONT'D)");
          lines = lines.slice(room);
        } else {
          take.forEach(function (ln) { addLine(clsFor(el.kind), ln); });
          lines = lines.slice(room);
          newPage();
        }
      }
    }
  });
  if (curLines.length) pages.push(curLines);
  return pages;
}
function buildScriptPrint() {
  var s = cur();
  var h = '<div class="sp-page title-page">' +
    '<p class="sp-title">' + esc((s.title || 'Untitled ' + s.id).toUpperCase()) + '</p>' +
    (s.format === 'tv' ? '<p class="sp-byline">TELEVISION PILOT</p>' : '') +
    '<p class="sp-byline">Written by<br>' + esc(s.story.byline || 'Gabe Arredondo') + '</p>' +
    '</div>';
  var pages = paginateScript(s);
  pages.forEach(function (lines, pi) {
    var num = pi + 1; /* Page 1 carries no number — numbering starts on page 2. */
    h += '<div class="sp-page">' + (num >= 2 ? '<div class="sp-pagenum">' + num + '.</div>' : '');
    lines.forEach(function (ln) {
      h += ln.cls === 'blank' ? '<p class="sp-blank">&nbsp;</p>' : '<p class="' + ln.cls + '">' + esc(ln.text) + '</p>';
    });
    h += '</div>';
  });
  var pv = $('#print-view');
  pv.className = 'script-print';
  pv.innerHTML = h;
}
function buildPrint(actKey) {
  var s = cur();
  var h = '<h1>' + esc(s.title || 'Untitled') + '</h1>' +
    '<p>' + esc(s.genre) + ' · ' + esc(FORMATS[s.format].label) + ' · ' + s.acts + ' act' + (s.acts > 1 ? 's' : '') + ' · ' + esc(s.story.logline || '') + '</p>';
  if (s.story.theme) h += '<p><b>Theme:</b> ' + esc(s.story.theme) + '</p>';
  if (s.story.seasonArc) h += '<p><b>Season arc:</b> ' + esc(s.story.seasonArc) + '</p>';
  h += printCharacters(s);
  var groups = printActGroups(s);
  if (actKey != null) groups = groups.filter(function (g) { return String(g.key) === String(actKey); });
  groups.forEach(function (g, gi) {
    if (gi > 0) h += '<div class="pagebreak"></div>';
    h += '<h2>' + esc(g.title) + '</h2>';
    groupSceneIndices(s, g.key).forEach(function (idx) { h += printSceneRow(s, idx); });
  });
  var pv = $('#print-view');
  pv.className = 'outline-print';
  pv.innerHTML = h;
}
function doPrint(kind, actKey) {
  parseTypeMode(); /* a half-typed Type scene still prints in full */
  if (kind === 'draft') buildScriptPrint();
  else buildPrint(actKey);
  window.print();
}
function doPreview(kind) {
  parseTypeMode(); /* a half-typed Type scene still previews in full */
  if (kind === 'draft') buildScriptPrint();
  else buildPrint(null);
  document.body.classList.add('show-print');
  $('#preview-bar').hidden = false;
  window.scrollTo(0, 0);
}
function closePreview() {
  document.body.classList.remove('show-print');
  $('#preview-bar').hidden = true;
}

/* ---------------- scene structure edits ---------------- */
function addSceneAt(pos, actNum) {
  var s = cur();
  s.scenes.splice(pos, 0, blankScene());
  s.actCounts[actNum - 1]++;
  s.pos['act' + actNum] = pos - actStart(s, actNum);
  touchLocal();
  save(); renderStep();
}
function deleteScene(idx) {
  var s = cur();
  if (s.scenes.length <= 1) { alert('You need at least one scene card.'); return; }
  if (!confirm('Delete this scene card? Its outline and writing go with it.')) return;
  var act = actOf(s, idx);
  s.scenes.splice(idx, 1);
  s.actCounts[act - 1] = Math.max(0, s.actCounts[act - 1] - 1);
  var key = 'act' + act;
  s.pos[key] = Math.max(0, Math.min((s.actCounts[act - 1] || 1) - 1, s.pos[key] || 0));
  touchLocal();
  save(); renderStep();
}
function moveScene(idx, dir) {
  var s = cur(), j = idx + dir;
  if (j < 0 || j >= s.scenes.length) return;
  var tmp = s.scenes[idx]; s.scenes[idx] = s.scenes[j]; s.scenes[j] = tmp;
  var act = actOf(s, j);
  s.pos['act' + act] = j - actStart(s, act);
  touchLocal();
  save(); renderStep();
}

/* ---------------- events ---------------- */
function handleSceneField(el, rerender) {
  var s = cur(), idx = parseInt(el.dataset.scene, 10), f = el.dataset.field;
  if (el.type === 'checkbox') s.scenes[idx][f] = el.checked;
  else s.scenes[idx][f] = el.value;
  /* The slugline is the first line of the Type serialization — keep
     the typed text in step after an edit here, or normalize() would
     re-parse stale text over it on the next load. */
  if (f === 'slug') syncTypeText(s.scenes[idx]);
  touchLocal();
  save();
  /* Re-render only on blur/change — re-rendering on every keystroke
     would drop the cursor while typing. */
  if (rerender && (f === 'done' || f === 'happens' || f === 'tagChar' || f === 'tagArc')) renderStep();
}
function handleBlockField(el) {
  var parts = el.dataset.block.split(':'), idx = parseInt(parts[0], 10), bi = parseInt(parts[1], 10);
  var b = cur().scenes[idx].blocks[bi];
  var v = el.value;
  /* Character cues and transitions print uppercased, so keep what he
     types uppercased too — a lowercase "mara" can never silently
     become a different speaker from "MARA" in print. */
  if (b && (b.t === 'character' || b.t === 'transition') && v !== v.toUpperCase()) {
    v = v.toUpperCase();
    el.value = v;
  }
  if (b) b.x = v;
  if (b) syncTypeText(cur().scenes[idx]);
  touchLocal();
  save();
  updateDraftTotals();
}
document.addEventListener('input', function (e) {
  var el = e.target;
  if (el.id === 'type-text') {
    /* Type mode: save the raw text on every keystroke, exactly like
       Cards mode autosaves — but NEVER re-render here, or the caret
       drops out from under him mid-word. Parsing happens on blur
       and navigation, never while typing. */
    var sT = cur(), idxT = Math.min(sT.pos.draft || 0, sT.scenes.length - 1);
    var scT = sT.scenes[idxT];
    if (scT) { scT.typeText = el.value; touchLocal(); save(); }
  }
  if (el.dataset.path) { setPath(cur(), el.dataset.path, el.value); touchLocal(); save(); }
  if (el.dataset.scene) handleSceneField(el, false);
  if (el.dataset.block) handleBlockField(el);
  if (el.tagName === 'TEXTAREA') growTextarea(el);
});
/* Leaving the Type textarea parses it into blocks — the moment the
   text becomes blocks, not a keystroke sooner. */
document.addEventListener('focusout', function (e) {
  if (e.target && e.target.id === 'type-text') parseTypeMode();
});
document.addEventListener('change', function (e) {
  var el = e.target;
  if (el.dataset.path) { setPath(cur(), el.dataset.path, el.value); touchLocal(); save(); renderStep(); }
  if (el.dataset.scene) handleSceneField(el, true);
  /* Block type picker (draft): jump straight to the chosen type and
     keep the cursor in the same block — no full re-render. */
  if (el.dataset.blocktype) {
    var p = el.dataset.blocktype.split(':'), bi4 = parseInt(p[0], 10), bj4 = parseInt(p[1], 10);
    var blk = cur().scenes[bi4].blocks[bj4];
    if (blk) { blk.t = el.value; touchLocal(); save(); refreshDraft(bj4); }
  }
});
document.addEventListener('click', function (e) {
  var el = e.target.closest('button');
  if (!el) return;
  var s = cur();
  if (el.dataset.open) { openScript(parseInt(el.dataset.open, 10)); return; }
  if (el.id === 'btn-back-list') { parseTypeMode(); save(); renderList(); recheckCloud(); return; }
  if (el.id === 'btn-prev') {
    /* On the Draft step the bottom bar walks scenes (fix 10); the
       wizard step changes only everywhere else. */
    if (wizardSteps(s)[currentStep].id === 'draft') {
      if ((s.pos.draft || 0) > 0) { s.pos.draft--; save(); renderStep(); }
      return;
    }
    if (currentStep > 0) { currentStep--; renderStep(); } return;
  }
  if (el.id === 'btn-next') {
    if (wizardSteps(s)[currentStep].id === 'draft') {
      if ((s.pos.draft || 0) < s.scenes.length - 1) { s.pos.draft++; save(); renderStep(); }
      return;
    }
    if (currentStep >= wizardSteps(s).length - 1) { save(); renderList(); recheckCloud(); }
    else { currentStep++; renderStep(); }
    return;
  }
  if (el.id === 'btn-goto-outline') { currentStep = outlineIdx(s); renderStep(); return; }
  if (el.id === 'btn-goto-draft') { currentStep = draftIdx(s); renderStep(); return; }
  if (el.id === 'btn-update') { handleUpdate(); return; }
  /* Tappable step pills at the top of the wizard: jump straight to
     that section to edit it. renderStep() saves first (same as
     Next/Back), so what he just typed is kept. Out-of-range or
     non-numeric values are ignored; the current pill just stays. */
  if (el.dataset.step !== undefined && el.dataset.step !== '') {
    var si = parseInt(el.dataset.step, 10);
    if (!isNaN(si) && si >= 0 && si < wizardSteps(s).length) { currentStep = si; renderStep(); }
    return;
  }
  if (el.dataset.pager) {
    var key = el.dataset.pager, dir = parseInt(el.dataset.dir, 10);
    var total = posTotalFor(key, s);
    s.pos[key] = Math.max(0, Math.min(total - 1, (s.pos[key] || 0) + dir));
    save(); renderStep(); return;
  }
  if (el.dataset.jumpChar) { s.pos.char = parseInt(el.dataset.jumpChar, 10); save(); renderStep(); return; }
  if (el.dataset.jumpScene) {
    var si = parseInt(el.dataset.jumpScene, 10), act = actOf(s, si);
    s.pos['act' + act] = si - actStart(s, act); save(); renderStep(); return;
  }
  if (el.dataset.jumpDraft) { s.pos.draft = parseInt(el.dataset.jumpDraft, 10); save(); renderStep(); return; }
  if (el.dataset.write) { s.pos.draft = parseInt(el.dataset.write, 10); currentStep = draftIdx(s); save(); renderStep(); return; }
  if (el.dataset.act === 'goto-outline') { currentStep = outlineIdx(s); renderStep(); return; }
  if (el.dataset.act === 'goto-draft') { currentStep = draftIdx(s); renderStep(); return; }
  if (el.hasAttribute('data-nextscene')) { s.pos.draft = Math.min(s.scenes.length - 1, (s.pos.draft || 0) + 1); save(); renderStep(); return; }
  if (el.hasAttribute('data-prevscene')) { if ((s.pos.draft || 0) > 0) { s.pos.draft--; save(); renderStep(); } return; }
  if (el.hasAttribute('data-next-unwritten')) {
    var firstEmpty = -1;
    for (var fe = 0; fe < s.scenes.length; fe++) { if (!(sceneText(s.scenes[fe]) || '').trim()) { firstEmpty = fe; break; } }
    if (firstEmpty >= 0) { s.pos.draft = firstEmpty; save(); renderStep(); }
    return;
  }
  if (el.dataset.draftmode) {
    /* Parse what was typed before switching modes, so nothing is
       lost in the jump either way — then switch and re-render. */
    parseTypeMode();
    var dm = el.dataset.draftmode;
    if (dm === 'cards' || dm === 'type') { s.pos.draftMode = dm; touchLocal(); save(); renderStep(); }
    return;
  }
  if (el.id === 'btn-toggle-notes') {
    /* Persisted in s.pos.notesHidden: the next re-render shows the
       same state, instead of the panel coming back on every tap. */
    var np = document.getElementById('notes-panel');
    var hideNow = np ? !np.hidden : true;
    s.pos.notesHidden = hideNow;
    touchLocal(); save();
    if (np) np.hidden = hideNow;
    el.textContent = hideNow ? 'Show scene notes' : 'Hide scene notes';
    return;
  }
  if (el.dataset.method) { setMethod(s, el.dataset.method); save(); renderStep(); return; }
  if (el.dataset.format) { setFormat(s, el.dataset.format); save(); renderStep(); return; }
  if (el.dataset.tvlength) { setTvLength(s, el.dataset.tvlength); save(); renderStep(); return; }
  if (el.dataset.acts) { setActs(s, parseInt(el.dataset.acts, 10)); save(); renderStep(); return; }
  if (el.dataset.addscene) { addSceneAt(parseInt(el.dataset.addscene, 10) + 1, actOf(s, parseInt(el.dataset.addscene, 10))); return; }
  if (el.dataset.addsceneFirst) { var a1 = parseInt(el.dataset.addsceneFirst, 10); addSceneAt(actStart(s, a1), a1); return; }
  if (el.dataset.addsceneLast) { var a2 = parseInt(el.dataset.addsceneLast, 10); addSceneAt(actStart(s, a2) + (s.actCounts[a2 - 1] || 0), a2); return; }
  if (el.dataset.movescene) { moveScene(parseInt(el.dataset.sceneidx, 10), parseInt(el.dataset.movescene, 10)); return; }
  if (el.dataset.delscene) { deleteScene(parseInt(el.dataset.delscene, 10)); return; }
  if (el.dataset.addblock) {
    var idx = parseInt(el.dataset.idx, 10);
    s.scenes[idx].blocks.push({ t: el.dataset.addblock, x: '' });
    syncTypeText(s.scenes[idx]);
    touchLocal();
    save();
    refreshDraft(s.scenes[idx].blocks.length - 1);
    return;
  }
  if (el.dataset.moveblock) {
    var pm = el.dataset.moveblock.split(':'), mi = parseInt(pm[0], 10), mb = parseInt(pm[1], 10);
    moveBlock(mi, mb, parseInt(el.dataset.dir, 10));
    return;
  }
  if (el.dataset.insertblock) {
    var pi = el.dataset.insertblock.split(':'), ii = parseInt(pi[0], 10), ib = parseInt(pi[1], 10);
    insertBlock(ii, ib);
    return;
  }
  if (el.id === 'btn-undo-block') {
    var u = lastDeletedBlock;
    lastDeletedBlock = null;
    if (u && s.scenes[u.idx]) {
      var at = Math.min(u.bi, s.scenes[u.idx].blocks.length);
      s.scenes[u.idx].blocks.splice(at, 0, u.block);
      syncTypeText(s.scenes[u.idx]);
      touchLocal(); save();
      refreshDraft(at);
    } else { updateUndoBar(); }
    return;
  }
  if (el.dataset.blockdel) {
    var p2 = el.dataset.blockdel.split(':'), ci = parseInt(p2[0], 10), cj = parseInt(p2[1], 10);
    /* No confirm — undo instead: stash the block and show the Undo
       bar, so a stray tap costs one tap to fix, not a retype. */
    var removed = s.scenes[ci].blocks.splice(cj, 1)[0];
    if (removed) lastDeletedBlock = { idx: ci, bi: cj, block: removed };
    syncTypeText(s.scenes[ci]);
    touchLocal();
    save();
    refreshDraft(Math.min(cj, s.scenes[ci].blocks.length - 1), true);
    return;
  }
  if (el.dataset.print === 'draft-all') { doPrint('draft'); return; }
  if (el.dataset.print === 'outline-all') { doPrint('outline', null); return; }
  if (el.dataset.print && el.dataset.print.indexOf('outline-') === 0) { doPrint('outline', el.dataset.print.slice(8)); return; }
  if (el.dataset.preview) { doPreview(el.dataset.preview); return; }
  if (el.id === 'btn-close-preview') { closePreview(); return; }
  if (el.id === 'btn-preview-print') { window.print(); return; }
  if (el.id === 'btn-new-script') { newScript(); return; }
  if (el.dataset.duplicate) { duplicateScript(parseInt(el.dataset.duplicate, 10)); return; }
  if (el.dataset.delete) { deleteScript(parseInt(el.dataset.delete, 10)); return; }
  if (el.id === 'btn-cloud-signin' || el.id === 'btn-cloud-signup') {
    var emailEl = document.getElementById('cloud-email');
    var passEl = document.getElementById('cloud-password');
    var msgEl = document.getElementById('cloud-auth-msg');
    var email = emailEl ? emailEl.value.trim() : '';
    var pw = passEl ? passEl.value : '';
    if (!email || email.indexOf('@') < 0) { if (msgEl) msgEl.textContent = 'Enter an email address first.'; return; }
    if (!pw || pw.length < 6) { if (msgEl) msgEl.textContent = 'Enter a password at least 6 characters long.'; return; }
    if (msgEl) msgEl.textContent = el.id === 'btn-cloud-signup' ? 'Creating your account…' : 'Signing in…';
    var isSignup = el.id === 'btn-cloud-signup';
    var req = isSignup ? authSignUp(email, pw) : authSignIn(email, pw);
    req.then(function (data) {
      var sess = sessionFromAuth(data);
      if (sess) {
        /* Whose is the library on screen? Work it out BEFORE the new
           session replaces the old one, or the answer is lost. */
        var prevOwnerId = resolveCurrentOwnerId();
        saveCloudSession(sess);
        renderCloudAuth();
        if (passEl) passEl.value = '';
        if (msgEl) msgEl.textContent = '';
        if (switchToUser(sess, prevOwnerId)) initialSync();
        else showClaimPanel();
        return;
      }
      /* Sign-up with email confirmation ON: no session yet — the user
         must tap the confirmation link in their email first. */
      if (isSignup) {
        if (msgEl) msgEl.textContent = 'Check your email — we sent a confirmation link. Tap it, then come back and sign in here.';
      } else {
        if (msgEl) msgEl.textContent = 'Sign-in didn\u2019t return a session. If you just signed up, check your email for the confirmation link first.';
      }
    }).catch(function (err) {
      if (msgEl) msgEl.textContent = friendlyAuthError(err && err.message);
    });
    return;
  }
  if (el.id === 'btn-cloud-signout') {
    if (cloudSession) sbFetch('/auth/v1/logout', { method: 'POST', body: '{}' }).catch(function () {});
    /* Stash this account's library under its own key first — signing
       out must never delete anyone's scripts. Stash even an empty
       library when one already exists, so a deliberate delete-all
       is not resurrected on the next sign-in. */
    if (cloudUser && (!isEmptyDB(DB) || loadStash(cloudUser.id) !== null)) {
      try { localStorage.setItem(stashKeyFor(cloudUser.id), JSON.stringify(DB)); } catch (e) {}
    }
    /* Then restore the signed-out cache (or an empty library). */
    var out = loadStash('');
    DB = out ? normalize(out) : seed();
    libraryOwner = '';
    pendingCloud = null;
    pendingClaim = null;
    clearCloudSession();
    persistLocal();
    setCloudStatus('off');
    renderCloudAuth();
    renderList();
    return;
  }
  if (el.id === 'btn-cloud-claim-yes') {
    var pc = pendingClaim;
    pendingClaim = null;
    var conf = document.getElementById('cloud-claim');
    if (conf) conf.hidden = true;
    if (pc && pc.db && cloudUser) {
      /* They said these scripts are theirs: adopt them, then sync —
         a newer cloud copy goes to the conflict chooser, never a
         silent pull over the library they just claimed. */
      DB = normalize(JSON.parse(JSON.stringify(pc.db)));
      libraryOwner = cloudUser.id;
      persistLocal();
      renderList();
      syncAfterClaim();
    }
    return;
  }
  if (el.id === 'btn-cloud-claim-no') {
    var pc2 = pendingClaim;
    pendingClaim = null;
    var conf2 = document.getElementById('cloud-claim');
    if (conf2) conf2.hidden = true;
    if (pc2 && pc2.db) {
      /* Not theirs: stash the library aside under a backup key.
         Nothing is deleted — it stays saved on this device. */
      try { localStorage.setItem(LS_LEGACY_BACKUP_KEY, JSON.stringify(pc2.db)); } catch (e) {}
    }
    DB = seed();
    if (cloudUser) libraryOwner = cloudUser.id;
    persistLocal();
    renderList();
    initialSync();
    return;
  }
  if (el.id === 'btn-cloud-sync') {
    if (!cloudUser) { var m = document.getElementById('cloud-auth-msg'); if (m) m.textContent = 'Sign in first to sync.'; return; }
    initialSync();
    return;
  }
  if (el.id === 'btn-cloud-keep-local') {
    var pc = pendingCloud;
    pendingCloud = null;
    var conf = document.getElementById('cloud-conflict');
    if (conf) conf.hidden = true;
    if (pc) pushCloud();
    return;
  }
  if (el.id === 'btn-cloud-use-cloud') {
    var pc2 = pendingCloud;
    pendingCloud = null;
    var conf2 = document.getElementById('cloud-conflict');
    if (conf2) conf2.hidden = true;
    if (pc2 && pc2.db) applyCloudDB(pc2.db);
    return;
  }
  if (el.id === 'btn-export') {
    var blob = new Blob([JSON.stringify(DB, null, 2)], { type: 'application/json' });
    var a = document.createElement('a');
    if (window.__lastExportUrl) URL.revokeObjectURL(window.__lastExportUrl);
    a.href = URL.createObjectURL(blob);
    window.__lastExportUrl = a.href;
    a.download = 'script-builder-backup.json';
    a.click();
    return;
  }
  if (el.id === 'btn-import') { document.getElementById('import-file').click(); return; }
  if (el.id === 'btn-reset-all') {
    if (confirm('Reset ALL scripts to blank? Your saved work will be gone. Export a backup first if you want to keep it.')) {
      DB = seed(); touchLocal(); save(); renderList();
    }
    return;
  }
});
document.addEventListener('change', function (e) {
  var el = e.target;
  if (el.id === 'import-file' && el.files && el.files[0]) {
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var data = JSON.parse(reader.result);
        if (!data || !Array.isArray(data.scripts)) throw new Error('bad file');
        DB = normalize(data); touchLocal(); save(); renderList();
      } catch (err) { alert('That file did not look like a Script Builder backup.'); }
    };
    reader.readAsText(el.files[0]);
    el.value = '';
  }
});
document.addEventListener('keydown', function (e) {
  if ((e.metaKey || e.ctrlKey) && e.key === 'p') { /* browser print; #print-view must already be built — use the buttons. */ }
  /* Enter in a draft block: a new block right below it, type inferred
     from this one — a scene can be typed end to end without tapping
     the + buttons. Shift+Enter is left alone (newline in the block). */
  if (e.key === 'Enter' && !e.shiftKey && !e.metaKey && !e.ctrlKey && !e.altKey &&
      e.target && e.target.dataset && e.target.dataset.block) {
    e.preventDefault();
    var parts = e.target.dataset.block.split(':');
    var idx = parseInt(parts[0], 10), bi = parseInt(parts[1], 10);
    var sc2 = cur().scenes[idx];
    if (sc2 && sc2.blocks[bi]) insertBlock(idx, bi);
  }
});
/* Automatic re-checks (no Sync Now press needed): when the app regains
   focus or becomes visible again, pull the newest copy if there is one.
   When the app is closed or hidden, flush any pending push right away.
   Closing never signs anyone out — sign-out stays manual only. */
document.addEventListener('visibilitychange', function () {
  if (document.hidden) { flushCloudPushOnClose(); return; }
  recheckCloud();
});
window.addEventListener('focus', function () { recheckCloud(); });
window.addEventListener('pagehide', function () { flushCloudPushOnClose(); });

renderList();
initCloud();
