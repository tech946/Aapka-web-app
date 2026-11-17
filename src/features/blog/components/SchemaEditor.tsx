'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { ChevronDown, ChevronRight, Code2, Plus, Trash2 } from 'lucide-react';
import { Field } from '@/components/dashboard/kit';
import { buildBlogJsonLd, type BlogJsonLdContext } from '../structured-data/build';
import { ARTICLE_TYPE_META, SCHEMA_BLOCK_META, SCHEMA_BLOCK_TYPES, newSchemaBlock } from '../structured-data/catalog';
import { ARTICLE_TYPES, REVIEW_ITEM_TYPES, type ArticleType, type BlogSchema, type SchemaBlock, type SchemaBlockType } from '../structured-data/schema';

interface SchemaEditorProps {
  value: BlogSchema;
  onChange: (value: BlogSchema) => void;
  preview: BlogJsonLdContext;
  idPrefix?: string;
}

type Updater<T> = (patch: Partial<T>) => void;

function TextInput({ id, label, value, onChange, hint, placeholder }: { id: string; label: string; value: string; onChange: (v: string) => void; hint?: string; placeholder?: string }) {
  return (
    <Field label={label} htmlFor={id} hint={hint}>
      <input id={id} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </Field>
  );
}

function TextArea({ id, label, value, onChange, rows = 3, hint }: { id: string; label: string; value: string; onChange: (v: string) => void; rows?: number; hint?: string }) {
  return (
    <Field label={label} htmlFor={id} hint={hint}>
      <textarea id={id} rows={rows} value={value} onChange={(e) => onChange(e.target.value)} />
    </Field>
  );
}

function Repeater<T>({ items, onChange, make, itemLabel, render }: { items: T[]; onChange: (items: T[]) => void; make: () => T; itemLabel: string; render: (item: T, update: Updater<T>, index: number) => ReactNode }) {
  const update = (index: number) => (patch: Partial<T>) => onChange(items.map((item, i) => (i === index ? { ...item, ...patch } : item)));

  return (
    <div className='dk-schema__repeater'>
      {items.map((item, index) => (
        <div key={index} className='dk-schema__row'>
          <div className='dk-schema__row-head'>
            <span>
              {itemLabel} {index + 1}
            </span>
            <button type='button' onClick={() => onChange(items.filter((_, i) => i !== index))} aria-label={`Remove ${itemLabel.toLowerCase()} ${index + 1}`}>
              <Trash2 size={14} aria-hidden />
            </button>
          </div>
          {render(item, update(index), index)}
        </div>
      ))}
      <button type='button' className='dk-schema__add' onClick={() => onChange([...items, make()])}>
        <Plus size={14} aria-hidden /> Add {itemLabel.toLowerCase()}
      </button>
    </div>
  );
}

export function BlockFields({ block, onChange, id }: { block: SchemaBlock; onChange: (block: SchemaBlock) => void; id: string }) {
  const set = (patch: Partial<SchemaBlock>) => onChange({ ...block, ...patch } as SchemaBlock);

  switch (block.type) {
    case 'faq':
      return (
        <Repeater
          items={block.items}
          onChange={(items) => set({ items })}
          make={() => ({ question: '', answer: '' })}
          itemLabel='Question'
          render={(item, update, i) => (
            <>
              <TextInput id={`${id}-q${i}`} label='Question' value={item.question} onChange={(question) => update({ question })} />
              <TextArea id={`${id}-a${i}`} label='Answer' value={item.answer} onChange={(answer) => update({ answer })} />
            </>
          )}
        />
      );
    case 'howto':
      return (
        <>
          <TextInput id={`${id}-name`} label='Title' value={block.name} onChange={(name) => set({ name })} placeholder='How to apply for a UAE visa' />
          <TextArea id={`${id}-desc`} label='Description' value={block.description} onChange={(description) => set({ description })} rows={2} />
          <TextInput id={`${id}-time`} label='Total time' value={block.totalTime} onChange={(totalTime) => set({ totalTime })} hint='Optional. PT30M = 30 minutes, PT2H = 2 hours, P3D = 3 days.' />
          <Repeater
            items={block.steps}
            onChange={(steps) => set({ steps })}
            make={() => ({ name: '', text: '' })}
            itemLabel='Step'
            render={(step, update, i) => (
              <>
                <TextInput id={`${id}-sn${i}`} label='Step title' value={step.name} onChange={(name) => update({ name })} />
                <TextArea id={`${id}-st${i}`} label='Instructions' value={step.text} onChange={(text) => update({ text })} rows={2} />
              </>
            )}
          />
        </>
      );
    case 'touristTrip':
      return (
        <>
          <TextInput id={`${id}-name`} label='Trip name' value={block.name} onChange={(name) => set({ name })} placeholder='4 days in Dubai' />
          <TextArea id={`${id}-desc`} label='Description' value={block.description} onChange={(description) => set({ description })} rows={2} />
          <TextInput id={`${id}-type`} label='Best for' value={block.touristType} onChange={(touristType) => set({ touristType })} placeholder='Families, couples…' />
          <Repeater
            items={block.stops}
            onChange={(stops) => set({ stops })}
            make={() => ({ name: '', description: '' })}
            itemLabel='Stop'
            render={(stop, update, i) => (
              <>
                <TextInput id={`${id}-pn${i}`} label='Place' value={stop.name} onChange={(name) => update({ name })} placeholder='Burj Khalifa' />
                <TextArea id={`${id}-pd${i}`} label='What to do there' value={stop.description} onChange={(description) => update({ description })} rows={2} />
              </>
            )}
          />
        </>
      );
    case 'destination':
      return (
        <>
          <TextInput id={`${id}-name`} label='Place name' value={block.name} onChange={(name) => set({ name })} placeholder='Abu Dhabi' />
          <TextArea id={`${id}-desc`} label='Description' value={block.description} onChange={(description) => set({ description })} rows={2} />
          <TextInput id={`${id}-city`} label='City or area' value={block.locality} onChange={(locality) => set({ locality })} />
          <TextInput id={`${id}-country`} label='Country' value={block.country} onChange={(country) => set({ country })} placeholder='United Arab Emirates' />
          <TextInput id={`${id}-img`} label='Photo link' value={block.image} onChange={(image) => set({ image })} hint='Optional. A full https:// link or a path like /images/…' />
        </>
      );
    case 'event':
      return (
        <>
          <TextInput id={`${id}-name`} label='Event name' value={block.name} onChange={(name) => set({ name })} />
          <TextArea id={`${id}-desc`} label='Description' value={block.description} onChange={(description) => set({ description })} rows={2} />
          <TextInput id={`${id}-start`} label='Starts' value={block.startDate} onChange={(startDate) => set({ startDate })} placeholder='2026-12-15T18:00' />
          <TextInput id={`${id}-end`} label='Ends' value={block.endDate} onChange={(endDate) => set({ endDate })} placeholder='2027-01-29' />
          <TextInput id={`${id}-place`} label='Venue' value={block.locationName} onChange={(locationName) => set({ locationName })} />
          <TextInput id={`${id}-addr`} label='Address' value={block.address} onChange={(address) => set({ address })} />
          <TextInput id={`${id}-url`} label='Event link' value={block.url} onChange={(url) => set({ url })} hint='Optional.' />
        </>
      );
    case 'video':
      return (
        <>
          <TextInput id={`${id}-name`} label='Video title' value={block.name} onChange={(name) => set({ name })} />
          <TextArea id={`${id}-desc`} label='Description' value={block.description} onChange={(description) => set({ description })} rows={2} />
          <TextInput id={`${id}-thumb`} label='Thumbnail link' value={block.thumbnailUrl} onChange={(thumbnailUrl) => set({ thumbnailUrl })} />
          <TextInput id={`${id}-date`} label='Upload date' value={block.uploadDate} onChange={(uploadDate) => set({ uploadDate })} placeholder='2026-11-11' />
          <TextInput id={`${id}-embed`} label='Embed link' value={block.embedUrl} onChange={(embedUrl) => set({ embedUrl })} hint='e.g. https://www.youtube.com/embed/…' />
          <TextInput id={`${id}-file`} label='Video file link' value={block.contentUrl} onChange={(contentUrl) => set({ contentUrl })} hint='Optional.' />
        </>
      );
    case 'review':
      return (
        <>
          <Field label='What is reviewed' htmlFor={`${id}-type`}>
            <select id={`${id}-type`} value={block.itemType} onChange={(e) => set({ itemType: e.target.value as (typeof REVIEW_ITEM_TYPES)[number] })}>
              {REVIEW_ITEM_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t.replace(/([a-z])([A-Z])/g, '$1 $2')}
                </option>
              ))}
            </select>
          </Field>
          <TextInput id={`${id}-item`} label='Name' value={block.itemName} onChange={(itemName) => set({ itemName })} placeholder='Dubai Desert Safari' />
          <Field label='Rating (1–5)' htmlFor={`${id}-rating`}>
            <input id={`${id}-rating`} type='number' min={1} max={5} step={0.5} value={block.ratingValue} onChange={(e) => set({ ratingValue: Number(e.target.value) })} />
          </Field>
          <TextInput id={`${id}-author`} label='Reviewer' value={block.authorName} onChange={(authorName) => set({ authorName })} hint='Leave empty to use Aapka Tourism.' />
          <TextArea id={`${id}-body`} label='Review' value={block.reviewBody} onChange={(reviewBody) => set({ reviewBody })} />
        </>
      );
    case 'custom':
      return (
        <Field label='JSON-LD' htmlFor={`${id}-json`} hint='Paste one object or an array. Each object needs an "@type". Check it with Google’s Rich Results Test.'>
          <textarea id={`${id}-json`} className='dk-schema__code' rows={10} spellCheck={false} value={block.json} onChange={(e) => set({ json: e.target.value })} />
        </Field>
      );
  }
}

export function SchemaEditor({ value, onChange, preview, idPrefix = 'schema' }: SchemaEditorProps) {
  return (
    <div className='dk-schema'>
      <Field label='Page type' htmlFor={`${idPrefix}-article`} hint={ARTICLE_TYPE_META[value.articleType].hint}>
        <select id={`${idPrefix}-article`} value={value.articleType} onChange={(e) => onChange({ ...value, articleType: e.target.value as ArticleType })}>
          {ARTICLE_TYPES.map((t) => (
            <option key={t} value={t}>
              {ARTICLE_TYPE_META[t].label} ({t})
            </option>
          ))}
        </select>
      </Field>
      <p className='dk-schema__note'>Article and breadcrumb schema are added automatically from the title, excerpt, cover, dates, category and tags.</p>
      <SchemaBlocksEditor
        blocks={value.blocks}
        onChange={(blocks) => onChange({ ...value, blocks })}
        buildJson={(blocks) => buildBlogJsonLd({ ...value, blocks }, preview)}
        idPrefix={idPrefix}
      />
    </div>
  );
}

export function SchemaBlocksEditor({
  blocks,
  onChange,
  buildJson,
  idPrefix = 'schema',
}: {
  blocks: SchemaBlock[];
  onChange: (blocks: SchemaBlock[]) => void;
  buildJson: (blocks: SchemaBlock[]) => unknown;
  idPrefix?: string;
}) {
  const [open, setOpen] = useState<number | null>(null);
  const [adding, setAdding] = useState<SchemaBlockType>('faq');
  const [showJson, setShowJson] = useState(false);
  const json = useMemo(() => (showJson ? JSON.stringify(buildJson(blocks), null, 2) : ''), [showJson, blocks, buildJson]);
  const value = { blocks };

  const setBlock = (index: number, block: SchemaBlock) => onChange(value.blocks.map((b, i) => (i === index ? block : b)));
  const removeBlock = (index: number) => {
    onChange(value.blocks.filter((_, i) => i !== index));
    setOpen(null);
  };
  const addBlock = () => {
    onChange([...value.blocks, newSchemaBlock(adding)]);
    setOpen(value.blocks.length);
  };

  return (
    <>
      {value.blocks.map((block, index) => {
        const meta = SCHEMA_BLOCK_META[block.type];
        const isOpen = open === index;
        return (
          <div key={index} className={`dk-schema__block${isOpen ? ' is-open' : ''}`}>
            <div className='dk-schema__block-head'>
              <button type='button' className='dk-schema__toggle' onClick={() => setOpen(isOpen ? null : index)} aria-expanded={isOpen}>
                {isOpen ? <ChevronDown size={14} aria-hidden /> : <ChevronRight size={14} aria-hidden />}
                <span>{meta.label}</span>
                <code>{meta.schemaType}</code>
              </button>
              <button type='button' className='dk-schema__remove' onClick={() => removeBlock(index)} aria-label={`Remove ${meta.label}`}>
                <Trash2 size={14} aria-hidden />
              </button>
            </div>
            {isOpen && (
              <div className='dk-schema__block-body'>
                <p className='dk-schema__note'>{meta.hint}</p>
                {meta.googleNote && <p className='dk-schema__note dk-schema__note--warn'>{meta.googleNote}</p>}
                <BlockFields block={block} onChange={(next) => setBlock(index, next)} id={`${idPrefix}-${index}`} />
              </div>
            )}
          </div>
        );
      })}

      <div className='dk-schema__adder'>
        <select value={adding} onChange={(e) => setAdding(e.target.value as SchemaBlockType)} aria-label='Schema type to add'>
          {SCHEMA_BLOCK_TYPES.map((t) => (
            <option key={t} value={t}>
              {SCHEMA_BLOCK_META[t].label} ({SCHEMA_BLOCK_META[t].schemaType})
            </option>
          ))}
        </select>
        <button type='button' className='dk-schema__add' onClick={addBlock} disabled={value.blocks.length >= 12}>
          <Plus size={14} aria-hidden /> Add schema
        </button>
      </div>

      <button type='button' className='dk-schema__preview-toggle' onClick={() => setShowJson((v) => !v)} aria-expanded={showJson}>
        <Code2 size={14} aria-hidden /> {showJson ? 'Hide' : 'Show'} generated JSON-LD
      </button>
      {showJson && <pre className='dk-schema__preview'>{json}</pre>}
    </>
  );
}
