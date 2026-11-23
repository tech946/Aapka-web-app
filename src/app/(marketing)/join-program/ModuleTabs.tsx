'use client';

import { useState, type CSSProperties } from 'react';
import { AUTO_MS, MODULES } from './content';

export default function ModuleTabs() {
  const [index, setIndex] = useState(0);
  const [round, setRound] = useState(0);
  const mod = MODULES[index];
  const Icon = mod.icon;

  const pick = (i: number) => {
    setIndex(i);
    setRound((r) => r + 1);
  };

  const next = () => pick((index + 1) % MODULES.length);

  return (
    <div className="jp-mods" style={{ '--jp-auto': `${AUTO_MS}ms` } as CSSProperties}>
      <div className="jp-mods__list" role="tablist" aria-label="Program walkthroughs">
        {MODULES.map((m, i) => {
          const MIcon = m.icon;
          const on = i === index;
          return (
            <button
              key={m.key}
              type="button"
              role="tab"
              aria-selected={on}
              className={'jp-mod' + (on ? ' is-on' : '')}
              onClick={() => pick(i)}
            >
              <span className="jp-mod__ico" aria-hidden="true">
                <MIcon />
              </span>
              <span className="jp-mod__copy">
                <span className="jp-mod__name">{m.name}</span>
                <span className="jp-mod__short">{m.short}</span>
              </span>
              <span className={'jp-tag' + (m.capstone ? ' jp-tag--hot' : '')}>{m.tag}</span>
              {on && (
                <span className="jp-mod__track" aria-hidden="true">
                  <i key={round} onAnimationEnd={next} />
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="jp-view" role="tabpanel" key={mod.key}>
        <div className="jp-screen">
          <div className="jp-screen__bar">
            <span className="jp-screen__dots" aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
            <span className="jp-screen__url">{mod.url}</span>
          </div>
          <div className="jp-screen__body">
            <div className="jp-screen__head">
              <span className="jp-screen__ico" aria-hidden="true">
                <Icon />
              </span>
              {mod.name}
              <span className="jp-screen__live">Live</span>
            </div>
            <dl className="jp-screen__rows">
              {mod.lines.map((l) => (
                <div key={l.label}>
                  <dt>{l.label}</dt>
                  <dd>{l.value}</dd>
                </div>
              ))}
            </dl>
            <div className="jp-screen__badges">
              {mod.badges.map((b) => (
                <span key={b}>{b}</span>
              ))}
            </div>
          </div>
        </div>

        <div className="jp-view__copy">
          <p className="jp-view__step">
            {mod.capstone ? 'Hands-on finale' : `Walkthrough ${index + 1} of ${MODULES.length - 1}`}
          </p>
          <h3 className="jp-view__name">{mod.name}</h3>
          <p className="jp-view__sub">{mod.headline}</p>
          <p className="jp-view__body">{mod.body}</p>
          <div className="jp-view__chips">
            {mod.skills.map((s) => (
              <span key={s}>{s}</span>
            ))}
          </div>
          <p className="jp-view__leave">
            <strong>You leave with:</strong> {mod.leave}
          </p>
        </div>
      </div>
    </div>
  );
}
