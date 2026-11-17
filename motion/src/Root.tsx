import { Composition } from 'remotion';
import { Anydate } from './Anydate';
import { Offer } from './Offer';
import { Tours } from './Tours';
import { DURATION, FPS, SIZE } from './theme';

/* One clip per holiday type, named by its category slug — the search modal
   (HolidaySearchSheet) loads /videos/search/<slug>.mp4 and .jpg. */
export function Root() {
  return (
    <>
      <Composition id="flexible-date-packages" component={Anydate} durationInFrames={DURATION} fps={FPS} {...SIZE} />
      <Composition id="offer-packages" component={Offer} durationInFrames={DURATION} fps={FPS} {...SIZE} />
      <Composition id="uae-tours" component={Tours} durationInFrames={DURATION} fps={FPS} {...SIZE} />
    </>
  );
}
