'use client';

import { useState, type KeyboardEvent } from 'react';
import { Check, Loader2, Search, Star, X } from 'lucide-react';
import { useAttractionSearch, usePopularAttractions, type Attraction } from './use-attractions';

/* Tours & activities: popular picks as small tap chips, then a search
   that runs on Enter (or the Search button) — nothing heavier loads until
   someone asks. Picks show as removable tags and are kept as whole
   attractions so the form can name them. */

/** How many top attractions to offer as one-tap chips. */
const POPULAR_COUNT = 8;

interface AttractionPickerProps {
  value: Attraction[];
  onChange: (next: Attraction[]) => void;
  invalid?: boolean;
}

export default function AttractionPicker({ value, onChange, invalid }: AttractionPickerProps) {
  const [draft, setDraft] = useState('');
  const [term, setTerm] = useState('');
  const popular = usePopularAttractions();
  const results = useAttractionSearch(term);

  const isOn = (id: string) => value.some((a) => a.id === id);
  const toggle = (a: Attraction) => onChange(isOn(a.id) ? value.filter((v) => v.id !== a.id) : [...value, a]);

  function runSearch() {
    setTerm(draft.trim());
  }

  // Enter searches here; it must not submit the enquiry form around it
  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      runSearch();
    }
  }

  const popularList = (popular.data ?? []).slice(0, POPULAR_COUNT);
  const list = results.data ?? [];

  return (
    <div className={'te-tours' + (invalid ? ' is-invalid' : '')}>
      {popularList.length > 0 && (
        <div>
          <p className="te-kicker">
            <Star className="te-star" aria-hidden="true" />
            Popular picks
          </p>
          <div className="te-chips te-chips--sm" role="group" aria-label="Popular tours">
            {popularList.map((a) => {
              const on = isOn(a.id);
              return (
                <button key={a.id} type="button" aria-pressed={on} className={'te-chip te-chip--sm' + (on ? ' is-on' : '')} onClick={() => toggle(a)}>
                  {on ? <Check aria-hidden="true" /> : null}
                  {a.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {value.length > 0 && (
        <ul className="te-tours__picked" aria-label="Selected tours">
          {value.map((a) => (
            <li key={a.id} className="te-tag">
              {a.name}
              <button type="button" aria-label={`Remove ${a.name}`} onClick={() => toggle(a)}>
                <X aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="te-tours__box">
        <div className="ui-search te-tours__search">
          <Search aria-hidden="true" />
          <input
            type="search"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onKeyDown}
            enterKeyHint="search"
            placeholder="Search tours, areas or codes"
            aria-label="Search tours and activities"
          />
          <button type="button" className="te-tours__go" onClick={runSearch} disabled={!draft.trim()}>
            Search
          </button>
        </div>

        {!term ? (
          <p className="te-tours__state">Looking for something else? Type a tour or area and press Enter.</p>
        ) : results.isLoading ? (
          <p className="te-tours__state">
            <Loader2 className="te-spin" aria-hidden="true" />
            Searching…
          </p>
        ) : results.isError ? (
          <p className="te-tours__state">Couldn’t load tours — please try again.</p>
        ) : list.length === 0 ? (
          <p className="te-tours__state">No tours match “{term}”</p>
        ) : (
          <ul className="te-tours__list" aria-label={`Results for ${term}`}>
            {list.map((a) => {
              const on = isOn(a.id);
              return (
                <li key={a.id}>
                  <label className={'te-tours__row' + (on ? ' is-on' : '')}>
                    <input type="checkbox" className="ui-check" checked={on} onChange={() => toggle(a)} />
                    <span className="te-tours__name">
                      {a.name}
                      {a.area_name ? <small>{a.area_name}</small> : null}
                    </span>
                    {a.top_attraction ? (
                      <span className="ui-flag ui-flag--amber">
                        <Star className="te-star" aria-hidden="true" />
                        Top
                      </span>
                    ) : null}
                  </label>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
