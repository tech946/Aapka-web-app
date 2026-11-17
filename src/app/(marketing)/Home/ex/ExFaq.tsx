import Link from 'next/link';
import { ArrowRight, Plus } from 'lucide-react';
import { FAQ_ITEMS } from '../../faq/foreigner/content';

export default function ExFaq() {
  return (
    <section className="ex-faq" aria-labelledby="ex-faq-title">
      <div className="ex-faq__banner">
        <img className="ex-faq__bg" src="/images/stock/faq-dubai-frame.jpg" alt="" loading="lazy" />
        <div className="ex-faq__head">
          <h2 className="ex-pop__title ex-faq__heading" id="ex-faq-title">
            <span className="ex-pop__dash" aria-hidden="true" />
            <span>
              Frequently Asked <b>Questions</b>
            </span>
            <span className="ex-pop__dash" aria-hidden="true" />
          </h2>
          <p className="ex-faq__sub">Everything you need to know before you book your holiday</p>
        </div>
      </div>
      <div className="ex-wrap ex-faq__main">
        <ul className="ex-faq__list">
          {FAQ_ITEMS.slice(0, 5).map((item, i) => (
            <li key={item.q} className="ex-faq__item">
              <details open={i === 0}>
                <summary className="ex-faq__q">
                  <span>{item.q}</span>
                  <Plus className="ex-faq__icon" aria-hidden="true" />
                </summary>
                <div className="ex-faq__a">
                  {item.a.split('\n').map((p) => (
                    <p key={p}>{p}</p>
                  ))}
                </div>
              </details>
            </li>
          ))}
        </ul>
        <Link href="/faq" className="ex-faq__all">
          View all FAQs
          <ArrowRight aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
