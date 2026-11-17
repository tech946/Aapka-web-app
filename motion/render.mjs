// Renders every clip into ../public/videos/search: <slug>.mp4 (H.264, loops on
// the site) and <slug>.jpg (the poster, also shown for reduced motion).
//   npm run render
import { execFileSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';

const IDS = ['flexible-date-packages', 'offer-packages', 'uae-tours'];
const OUT = '../public/videos/search';
const POSTER_FRAME = 115; // everything is on screen by then

mkdirSync(OUT, { recursive: true });
const cli = (args) => execFileSync('npx', ['remotion', ...args], { stdio: 'inherit', shell: true });
for (const id of IDS) {
  cli(['render', 'src/index.ts', id, `${OUT}/${id}.mp4`, '--codec=h264', '--crf=24', '--muted']);
  cli(['still', 'src/index.ts', id, `${OUT}/${id}.jpg`, `--frame=${POSTER_FRAME}`, '--image-format=jpeg', '--jpeg-quality=85']);
}
