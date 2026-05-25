#!/usr/bin/env node
/**
 * Consistency-workflow demo for bens-game.
 *
 * Regenerates pages 2, 15, and 30 using gpt-image-2 with the techniques from
 * ~/Projects/hello-gpt-image/docs/06-consistency-workflow.md:
 *   1. Canonical character bibles (compact identity strings)
 *   2. Generated character reference sheets (3-view model sheets)
 *   3. Per-panel edits() calls with character sheets as references
 *   4. Explicit identity restatement + "do not redesign" negative
 *
 * Does NOT touch data/pages/*.json, scripts/generate_openai.py, or output/panels/*.
 * Writes only to output/v2-consistency/.
 *
 * Usage:
 *   node scripts/generate-consistency-demo.mjs            # full run
 *   node scripts/generate-consistency-demo.mjs --refs     # only generate char reference sheets
 *   node scripts/generate-consistency-demo.mjs --only=30  # only render page 30 (refs must exist)
 */

import fs from 'node:fs';

// -- Load .env manually (bens-game is a Python project, no node_modules here) --
function loadEnv(p) {
  if (!fs.existsSync(p)) return;
  for (const line of fs.readFileSync(p, 'utf-8').split('\n')) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/);
    if (m) {
      const val = m[2].trim().replace(/^['"]|['"]$/g, '');
      if (!process.env[m[1]]) process.env[m[1]] = val;
    }
  }
}
loadEnv('/Users/robgruhl/Projects/bens-game/.env');

// -- Dynamic import of hello-gpt-image lib (absolute path so `openai` resolves from its own node_modules) --
const { generate, edit, saveImage } = await import('/Users/robgruhl/Projects/hello-gpt-image/lib/gpt-image.js');

// -- Paths --
const BENS = '/Users/robgruhl/Projects/bens-game';
const OUT = `${BENS}/output/v2-consistency`;
const REFS = `${OUT}/_refs`;
fs.mkdirSync(REFS, { recursive: true });

// -- Shared art-style spec --
const STYLE = 'PROFESSIONAL GRAPHIC NOVEL ART STYLE: bold confident ink line work in varied weights, dynamic use of solid blacks for shadow and form, vibrant saturated comic-book color palette, cel-style flat color fills with minimal gradients, cinematic mood lighting with strong key light, expressive posing, publication-ready graphic novel artwork. Think Mike Mignola meets Fiona Staples — bold shapes, fearless color. NOT photo-realistic, NOT manga or anime, NOT painterly illustration.';

// -- Character bibles: compact canonical identity strings (5-10 traits each) --
const BIBLES = {
  'giovanni-young':  "GIOVANNI (age 12, young farm boy): Twelve-year-old northern-Italian peasant boy. Mediterranean features, unkempt dark hair, wide innocent brown eyes, dirt-smudged cheeks. Small wiry underfed build. Patched homespun tan tunic, barefoot. Sometimes carries a shepherd's crook.",
  'giovanni-father': "GIOVANNI'S FATHER: Italian peasant farmer in his forties. Weathered sun-beaten Mediterranean face, deeply lined, stern but not unkind dark eyes, graying dark hair and rough stubble. Stooped shoulders, strong calloused hands. Patched earth-toned peasant tunic, work-stained trousers, worn leather belt, simple wooden cross on a cord, wool cap.",
  'bansi-young':     "IKSHA / BANSI.YOUNG (age 13, Kashmiri princess): Thirteen-year-old Kashmiri princess, round youthful olive-toned face. Large dark intelligent eyes carrying quiet rebellion. Elaborate styled black hair with jewels and gold pins. Slim not-yet-fully-grown build. Fine silk sari in deep royal colors (sapphire and crimson) with gold embroidery. Gold jewelry at ears and nose, pearl necklace, jeweled slippers.",
  'bansi-servant':   "IKSHA disguised as BANSI / Ravi (age 13, servant boy disguise): SAME thirteen-year-old Kashmiri face, build, and identity as the princess variant, but hair entirely hidden beneath a coarse brown cap, cheeks dust-smudged, eyes lowered in focused purpose. Rough undyed-wool servant's tunic, simple cotton trousers, worn sandals, carrying a water jug or serving tray. Identical underlying features to the princess reference.",
  'eskil-young':     "ESKIL.YOUNG (late-teens Nordic youth, before the curse): Young Nordic man. Strong jaw, clear pale blue eyes full of life, flowing blonde hair to his shoulders, unmarked skin with no scars or runic sigils. Already tall and powerfully built but not yet at full adult size. Simple wool tunic in undyed cream over rough trousers, wide leather belt, fur-lined boots, a simple knife.",
  'eskil':           "ESKIL THE EXECUTIONER (Norseman, post-ritual, 6'8\" giant): Massive Norseman. Entire head PERMANENTLY encased in a riveted battle-scarred STEEL HELM with narrow horizontal eye slits revealing only his pale blue eyes — helm locked by molten iron to a thick STEEL COLLAR at his throat carved with glowing runic sigils. Body heavily muscled, bare arms covered in ritual scars and carved runic sigils. Practical warrior's leather-and-mail garb. Massive rune-inscribed war-blade. An iron skull hanging at his belt on a cord. A permanent prison of steel.",
  'leif-skull':      "LEIF'S IRON SKULL: A heavy stylized iron skull sized for a human head, dark gray metal surface carved with intricate Norse runes that faintly glow. Hollow eye sockets seem to watch. A mouth that appears almost to speak. Wrapped partially in fine gray cloth with a cord for carrying.",
};

// -- Map from bens-game character keys → bible slugs --
const CHAR_SLUGS = {
  'Giovanni.Young':  'giovanni-young',
  'GiovanniFather':  'giovanni-father',
  'Bansi.Young':     'bansi-young',
  'Bansi.Servant':   'bansi-servant',
  'Eskil.Young':     'eskil-young',
  'Eskil':           'eskil',
  'LeifSkull':       'leif-skull',
};

// -- Prompt overrides for panels where the source JSON language trips OpenAI's
//    prompt-level moderation filter even at moderation: 'low'. These preserve
//    the scene intent but rephrase literal self-harm / violence / death triggers. --
const PANEL_OVERRIDES = {
  // Original: "retrieves coins stolen over months... a small knife"
  '15-1': 'In the dim candlelit interior of an abandoned stone guard tower high in the palace of Sonapura, Iksha crouches before her hidden cache tucked into a wall alcove. She gathers a small cloth bundle containing plain travel clothes, a purse of palace coins, and a simple traveler\'s belt knife. The last item she lifts is a small wooden flute her mother gave her years ago. She holds it a moment, then slips it carefully into the bundle. Her face is composed, clear-eyed, resolute. The only light is from a single candle. Portrait-orientation, close three-quarter shot.',


  // Original: "Eskil raises his hand to his mouth and bites down on his own wrist"
  '30-1': 'In a dim torchlit underground gladiator cell, young Eskil (before the curse has taken its final form, face uncovered, no scars yet, blonde-haired) sits on a low wooden bench, both hands clenched in his lap. A supernatural red glow seeps faintly from the veins beneath the skin of his forearms — a visual metaphor for the otherworldly hunger now awakening inside him. His face is a study in horror and fearful resolve — the expression of a young man realizing something terrible has begun to claim him. Dramatic chiaroscuro shadow, single torch source. Portrait shot. No physical self-harm depicted; the horror is internal and rendered through lighting, expression, and the uncanny glow.',

};

// -- FULL prompt overrides: for panels where the full assembled prompt
//    (bibles + consistency instructions + scene) cumulatively trips moderation.
//    These replace the ENTIRE prompt with a minimal, calm, moderation-safe
//    version that still carries enough identity direction for the refs to work. --
const PANEL_FULL_OVERRIDES = {
  '15-4': `A graphic novel panel in bold ink and vibrant cel-shaded color.

A bright midday outdoor scene: a wide stone archway of a richly carved Kashmiri palace stands open. A young girl in her early teens, matching the figure shown in the reference image, walks out through the archway wearing plain travel clothes and a simple cap — exactly as depicted in the reference. She carries a small cloth bundle. Beyond the archway stretches a lively open-air market: colorful cloth awnings over merchant stalls, shoppers in traditional dress, distant snow-capped mountains. Her three-quarter profile shows calm quiet determination. Golden sunlight, soft shadows.

Match the reference image exactly for her face, build, clothing, and art style. Portrait orientation, single panel, no text.`,

  '30-2': `A graphic novel panel in bold ink and vibrant cel-shaded color.

A warm candlelit indoor workshop. A young Nordic man with flowing blonde hair — matching the figure in the reference image — sits at a low wooden bench carefully engraving ornamental Nordic knotwork patterns into a thick curved steel band using a small chisel. Tools lie neatly on the bench: files, tongs, a whetstone. A small brazier glows soft orange in the corner. An ornamental steel helmet rests on a stand nearby. Warm golden candlelight, deep honest shadows. His expression is focused and craftsmanly.

Match the reference image exactly for his face, build, clothing, and art style. Portrait orientation, single panel, no text.`,
};

// -- Novelization enrichment snippets (distilled from input/narrative/prologue-0[123].md) --
const NOVEL_NOTES = {
  '2-1':  'From the prologue: "a hard life but not an unhappy one. The soil was poor but it yielded enough. The winters were cold but the family survived them." Simple bread, cheese, and a thin stew. Wooden crucifix on the wall. Firelight from the hearth.',
  '2-2':  'From the prologue: the village asks nothing of heaven "more than that the crops not fail and the children not starve." A small stone village church with a bell tower. A circuit priest at a simple altar, candles flickering.',
  '2-3':  'From the prologue: "his hands were calloused from the plow before he was ten. His back knew the weight of seed-sacks and water-buckets." Generations of labor on the same rocky hillside, terraced fields rising toward the distant Alps.',
  '15-1': 'From the prologue: the abandoned guard tower holds her hidden cache. The only thing she keeps from the old life is a wooden flute her mother Maya gave her. "Cold, clear certainty." Not fear.',
  '15-2': 'From the prologue: "The disguise was perfect — she had practiced it a hundred times. And this time, she would not be coming back." A procedural transformation by lamplight in a servants\' privy — smudging the cheeks with dust, binding the hair.',
  '15-3': 'From the prologue: "one of the invisible multitude who kept the great machine of state running." Moving with a servant\'s purposeful gait past guards who have seen her a dozen times.',
  '15-4': 'From the prologue: "as she passed through the great gates for the last time, Iksha Bhima died. What walked into the streets of Srinagar was someone new... Bansi. It meant flute in the old tongue — a fitting name for someone who would make her own music."',
  '30-1': 'From the prologue: "The hunger came on the third day. His own blood was like liquid fire, like honey and lightning." Gladiator\'s cell lit only by candlelight. Horror at what he is compelled to do, but he cannot stop.',
  '30-2': 'From the prologue: "in secret, by candlelight in the dead of night, he forged his salvation." Thick bands of steel inscribed with runes of binding and protection that Leif\'s voice guides him to carve. The iron skull watches from nearby, its eye sockets seeming to glow.',
  '30-3': 'From the prologue: "he donned both pieces and sealed them shut with molten iron, binding himself for all time... the runes activating all at once in a surge of power that made his vision go white." Steam rises where iron fuses to flesh.',
  '30-4': 'From the prologue: "The helmed giant who never removed his armor, who fought with cold precision and terrible strength." Six foot eight, encased in his permanent prison of steel. The blade inscribed: "A furore Normannorum libera nos, Domine."',
};

// -- Character reference sheet: 3-view model sheet at 1536x1024 --
async function generateRefSheet(slug, bible) {
  const out = `${REFS}/char-${slug}.png`;
  if (fs.existsSync(out)) { console.log(`  [ref] ${slug}: exists`); return out; }

  const prompt = `A character reference sheet / model sheet for a graphic novel production bible.

${bible}

COMPOSITION: Show the character in THREE full-body views, arranged side by side on the same neutral page, at the same scale, standing on a shared horizontal ground line:
  (1) FRONT view, arms relaxed at sides or holding signature item, neutral expression.
  (2) THREE-QUARTER view, same neutral pose.
  (3) PROFILE view, same neutral pose.

Plain pale neutral gray/beige empty background. No decorative elements. No text labels. No logos. No signatures. No legible writing. Clean production-reference aesthetic.

${STYLE}

This is the CANONICAL MODEL SHEET for this character — their face, hair, clothing, proportions, color palette, and signature details shown here MUST remain EXACTLY the same in every future image that uses this reference. This sheet establishes identity.`;

  const t0 = Date.now();
  const { images } = await generate(prompt, { size: '1536x1024', quality: 'high', moderation: 'low' });
  saveImage(images[0], out);
  console.log(`  [ref] ${slug}: ${((Date.now() - t0) / 1000).toFixed(1)}s  ${(images[0].length / 1024 / 1024).toFixed(1)}MB`);
  return out;
}

// -- Panel: edit() with character ref sheets as inputs --
async function generatePanel({ pageNum, panel }) {
  const out = `${OUT}/page-${String(pageNum).padStart(3, '0')}-panel-${panel.panel_num}.png`;
  if (fs.existsSync(out)) {
    console.log(`  [panel] p${pageNum}-${panel.panel_num}: exists`);
    return out;
  }

  const slugs = panel.characters.map(c => CHAR_SLUGS[c]).filter(Boolean);
  const bibles = slugs.map(s => BIBLES[s]).filter(Boolean);
  const refPaths = slugs.map(s => `${REFS}/char-${s}.png`).filter(p => fs.existsSync(p));

  if (refPaths.length === 0) {
    throw new Error(`No reference images for panel ${pageNum}-${panel.panel_num} (characters: ${panel.characters.join(', ')})`);
  }

  const fullOverride = PANEL_FULL_OVERRIDES[`${pageNum}-${panel.panel_num}`];
  const override = PANEL_OVERRIDES[`${pageNum}-${panel.panel_num}`];
  const note = NOVEL_NOTES[`${pageNum}-${panel.panel_num}`] || '';

  let prompt;
  if (fullOverride) {
    prompt = fullOverride;
  } else {
    const sceneBlock = override
      ? `SCENE (rephrased for moderation compliance — preserve original intent):\n${override}`
      : `SCENE:\n${panel.visual}${panel.narration ? '\n\nMOOD / NARRATIVE CONTEXT: ' + panel.narration : ''}`;

    prompt = `
${STYLE}

CHARACTERS IN THIS PANEL — identity MUST match the reference image(s) exactly:
${bibles.join('\n\n')}

LOCATION: ${panel.location}

${sceneBlock}${note ? '\n\nADDITIONAL SOURCE CONTEXT: ' + note : ''}

CRITICAL CONSISTENCY INSTRUCTIONS: Use the reference image(s) as the canonical appearance for every character present. Same face, same hair, same clothing details, same proportions, same color palette as in the reference. DO NOT REDESIGN any character. DO NOT alter signature features. Match the line weight, color saturation, cel-shading, and rendering style of the reference(s) exactly. Single comic-book panel — no panel border, no text, no speech bubbles, no caption boxes, no logos, no legible writing.
`.trim();
  }

  const t0 = Date.now();
  const { images } = await edit(prompt, {
    image: refPaths,
    size: panel.size,
    quality: 'high',
    moderation: 'low',
  });
  saveImage(images[0], out);
  console.log(`  [panel] p${pageNum}-${panel.panel_num}: ${((Date.now() - t0) / 1000).toFixed(1)}s  ${panel.size}  refs=[${slugs.join(',')}]`);
  return out;
}

// -- CLI --
const args = process.argv.slice(2);
const refsOnly = args.includes('--refs');
const onlyArg = args.find(a => a.startsWith('--only='));
const onlyPages = onlyArg ? onlyArg.split('=')[1].split(',').map(n => parseInt(n, 10)) : [2, 15, 30];

// -- Phase 1: reference sheets (parallel) --
console.log(`Generating ${Object.keys(BIBLES).length} character reference sheets...`);
const refStart = Date.now();
const refResults = await Promise.allSettled(Object.entries(BIBLES).map(([slug, bible]) => generateRefSheet(slug, bible)));
const refFailed = refResults
  .map((r, i) => [Object.keys(BIBLES)[i], r])
  .filter(([, r]) => r.status === 'rejected');
console.log(`Refs: ${refResults.length - refFailed.length}/${refResults.length} in ${((Date.now() - refStart) / 1000).toFixed(1)}s.`);
refFailed.forEach(([slug, r]) => {
  const msg = r.reason?.error?.message || r.reason?.message || r.reason;
  console.error(`  [ref FAIL] ${slug}: ${msg}`);
});
console.log();

if (refsOnly) {
  console.log('--refs mode: skipping panels.');
  process.exit(0);
}

// -- Phase 2: panels (parallel across all selected pages) --
const allTasks = [];
for (const pn of onlyPages) {
  const pageFile = `${BENS}/data/pages/page-${String(pn).padStart(3, '0')}.json`;
  const page = JSON.parse(fs.readFileSync(pageFile, 'utf-8'));
  for (const panel of page.panels) {
    allTasks.push(() => generatePanel({ pageNum: pn, panel }));
  }
}
console.log(`Generating ${allTasks.length} panels across pages ${onlyPages.join(', ')}...`);
const panelStart = Date.now();
const results = await Promise.allSettled(allTasks.map(t => t()));
const failed = results.filter(r => r.status === 'rejected');
const ok = results.length - failed.length;
console.log(`\n${ok}/${results.length} panels done in ${((Date.now() - panelStart) / 1000).toFixed(1)}s.`);
failed.forEach(f => console.error('FAIL:', f.reason?.message || f.reason));
if (failed.length) process.exit(1);
