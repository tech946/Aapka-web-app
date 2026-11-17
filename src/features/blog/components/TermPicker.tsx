import type { BlogTerm } from '../types';

interface TermPickerProps {
  terms: BlogTerm[];
  selected: string[];
  onChange: (ids: string[]) => void;
  emptyMessage: string;
}

export function TermPicker({ terms, selected, onChange, emptyMessage }: TermPickerProps) {
  if (terms.length === 0) return <p className='dk-muted'>{emptyMessage}</p>;

  const toggle = (id: string) => onChange(selected.includes(id) ? selected.filter((t) => t !== id) : [...selected, id]);

  return (
    <div className='dk-chips'>
      {terms.map((term) => {
        const on = selected.includes(term.id);
        return (
          <button key={term.id} type='button' className={`dk-chip${on ? ' is-on' : ''}`} aria-pressed={on} onClick={() => toggle(term.id)}>
            {term.name}
          </button>
        );
      })}
    </div>
  );
}
