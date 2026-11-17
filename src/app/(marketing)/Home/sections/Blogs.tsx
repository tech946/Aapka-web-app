'use client';

import Link from 'next/link';
import { useTcSlider } from '@/components/site/useTcSlider';
import { shortDate, useHomeBlogs } from '../home-data';

/* Not in the redesign: production's blog slider, kept for the internal
   links. Drawn with the "Offers For You" card so it reads as one system. */
export default function Blogs() {
  const { blogs } = useHomeBlogs(10);
  const s = useTcSlider({ count: blogs.length, perView: 3, gap: 16 });
  if (!blogs.length) return null;

  return (
    <div className="offers_section blogs_section rn__section__gapTop">
      <div className="container">
        <div className="row">
          <div className="col-inner">
            <div className="main_heading">
              <div>
                <h2>Travel guides &amp; tips</h2>
              </div>
              <Link href="/blogs" className="btn btn_secondary">
                All articles
              </Link>
            </div>
            <div className="inner__gapTop">
              <div className="offers_slide">
                <div className="tc-slider" {...s.rootProps}>
                  <div className="tc-slider-track" style={s.trackStyle} {...s.trackProps}>
                    {blogs.map((b, i) => (
                      <div className="tc-slide" style={s.slideStyle(i)} key={b.id}>
                        <div className="item_card">
                          <Link href={`/blogs/${b.slug}`} className="img_block" tabIndex={-1} aria-hidden="true">
                            <img src={b.featured_image || '/images/package-1.png'} alt="" loading="lazy" />
                          </Link>
                          <div className="text_box">
                            <div className="top_blk">
                              <div className="lft">
                                <span>{b.blog_categories?.name || 'Travel'}</span>
                                {b.published_at ? (
                                  <>
                                    <div className="brdr" />
                                    <span>{shortDate(b.published_at.slice(0, 10))}</span>
                                  </>
                                ) : null}
                              </div>
                              <div className="right">
                                <span>Read more</span>
                              </div>
                            </div>
                            <div className="title">
                              <p>
                                <Link href={`/blogs/${b.slug}`}>{b.title}</Link>
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                {!s.single && (
                  <>
                    <button type="button" className="swiper-button-prev" onClick={s.prev} disabled={!s.canPrev} aria-label="Previous articles" />
                    <button type="button" className="swiper-button-next" onClick={s.next} disabled={!s.canNext} aria-label="Next articles" />
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
