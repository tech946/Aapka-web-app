'use client';

import { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Code2, ExternalLink, FileJson, ListChecks, Wand2, XCircle } from 'lucide-react';
import { Field, Modal } from '@/components/dashboard/kit';
import { BlockFields } from '@/features/blog/components/SchemaEditor';
import { SCHEMA_BLOCK_META, SCHEMA_BLOCK_TYPES, newSchemaBlock } from '@/features/blog/structured-data/catalog';
import { schemaBlockSchema, type SchemaBlock, type SchemaBlockType } from '@/features/blog/structured-data/schema';
import { buildPageJsonLd } from '../build';
import { checkJsonLd, formatJsonLd } from '../jsonld';
import { PLACEMENTS, PLACEMENT_META, newSchemaId, type PageSchemaItem, type Placement } from '../schema';

type Mode = 'json' | 'form';

const FORM_TYPES = SCHEMA_BLOCK_TYPES.filter((t) => t !== 'custom');
const STARTER = '{\n  "@context": "https://schema.org",\n  "@type": "",\n  "name": ""\n}';
const RICH_RESULTS = 'https://search.google.com/test/rich-results';
const SCHEMA_VALIDATOR = 'https://validator.schema.org/';

export function SchemaModal({
  initial,
  path,
  busy,
  onSave,
  onClose,
}: {
  initial: PageSchemaItem | null;
  path: string;
  busy: boolean;
  onSave: (item: PageSchemaItem) => void;
  onClose: () => void;
}) {
  const startsCustom = !initial || initial.block.type === 'custom';
  const [mode, setMode] = useState<Mode>(startsCustom ? 'json' : 'form');
  const [label, setLabel] = useState(initial?.label ?? '');
  const [placement, setPlacement] = useState<Placement>(initial?.placement ?? 'head');
  const [json, setJson] = useState(initial?.block.type === 'custom' ? initial.block.json : STARTER);
  const [formBlock, setFormBlock] = useState<SchemaBlock>(initial && initial.block.type !== 'custom' ? initial.block : newSchemaBlock('faq'));
  const [showPreview, setShowPreview] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const check = useMemo(() => checkJsonLd(json), [json]);
  const formResult = useMemo(() => schemaBlockSchema.safeParse(formBlock), [formBlock]);

  const block: SchemaBlock | null = mode === 'json' ? (check.ok ? { type: 'custom', json: check.cleaned } : null) : formResult.success ? formResult.data : null;
  const formError = !formResult.success ? formResult.error.issues[0] : null;

  const preview = useMemo(() => {
    if (!showPreview || !block) return '';
    const docs = buildPageJsonLd([block], path);
    return docs.map((d) => `<script type="application/ld+json">\n${JSON.stringify(d, null, 2)}\n</script>`).join('\n\n');
  }, [showPreview, block, path]);

  const changeFormType = (type: SchemaBlockType) => setFormBlock(newSchemaBlock(type));

  const format = () => {
    const pretty = formatJsonLd(json);
    if (pretty) setJson(pretty);
  };

  const save = () => {
    setSubmitted(true);
    if (!block) return;
    onSave({ id: initial?.id ?? newSchemaId(), label: label.trim(), placement, enabled: initial?.enabled ?? true, block });
  };

  return (
    <Modal
      title={initial ? 'Edit schema' : 'Add schema'}
      onClose={onClose}
      width='lg'
      footer={
        <>
          <button type='button' className='btn_secondary' onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button type='button' className='btn_primary' onClick={save} disabled={busy || (submitted && !block)}>
            {busy ? 'Saving…' : initial ? 'Save changes' : 'Add schema'}
          </button>
        </>
      }
    >
      <div className='dk-sm'>
        <div className='dk-sm__tabs' role='tablist' aria-label='How to add the schema'>
          <button type='button' role='tab' aria-selected={mode === 'json'} className={mode === 'json' ? 'is-on' : ''} onClick={() => setMode('json')}>
            <FileJson size={15} aria-hidden /> Paste JSON-LD
          </button>
          <button type='button' role='tab' aria-selected={mode === 'form'} className={mode === 'form' ? 'is-on' : ''} onClick={() => setMode('form')}>
            <ListChecks size={15} aria-hidden /> Use a form
          </button>
        </div>

        <Field label='Name in this list' htmlFor='sm-label' hint='Optional. Only you see it, e.g. "Home FAQ" or "Desert safari product".'>
          <input id='sm-label' value={label} maxLength={120} onChange={(e) => setLabel(e.target.value)} placeholder='Leave empty to use the schema type' />
        </Field>

        {mode === 'json' ? (
          <div className='dk-sm__json'>
            <div className='dk-sm__json-head'>
              <span>JSON-LD</span>
              <button type='button' className='dk-sm__ghost' onClick={format} disabled={!check.ok}>
                <Wand2 size={14} aria-hidden /> Format
              </button>
            </div>
            <textarea className='dk-sm__code' rows={14} spellCheck={false} value={json} onChange={(e) => setJson(e.target.value)} aria-label='JSON-LD code' />
            <p className='dk-sm__help'>
              Paste the JSON only, starting with <code>{'{'}</code>. If you paste a full <code>{'<script type="application/ld+json">'}</code> tag, it is removed for you. One object, a list of objects, or an <code>@graph</code> all work.
            </p>
            <div className={'dk-sm__check' + (check.ok ? ' is-ok' : ' is-bad')} role='status'>
              {check.ok ? <CheckCircle2 size={16} aria-hidden /> : <XCircle size={16} aria-hidden />}
              <div>
                <b>{check.ok ? 'Valid JSON-LD' : 'Not valid yet'}</b>
                {check.error ? <span>{check.error}</span> : null}
                {check.types.length > 0 && (
                  <span className='dk-sm__types'>
                    {check.types.map((t) => (
                      <code key={t}>{t}</code>
                    ))}
                  </span>
                )}
              </div>
            </div>
            {check.warnings.map((w) => (
              <p key={w} className='dk-sm__warn'>
                <AlertTriangle size={14} aria-hidden /> {w}
              </p>
            ))}
          </div>
        ) : (
          <div className='dk-sm__form'>
            <Field label='Schema type' htmlFor='sm-type' hint={SCHEMA_BLOCK_META[formBlock.type].hint}>
              <select id='sm-type' value={formBlock.type} onChange={(e) => changeFormType(e.target.value as SchemaBlockType)}>
                {FORM_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {SCHEMA_BLOCK_META[t].label} ({SCHEMA_BLOCK_META[t].schemaType})
                  </option>
                ))}
              </select>
            </Field>
            {SCHEMA_BLOCK_META[formBlock.type].googleNote && (
              <p className='dk-sm__warn'>
                <AlertTriangle size={14} aria-hidden /> {SCHEMA_BLOCK_META[formBlock.type].googleNote}
              </p>
            )}
            <div className='dk-schema dk-sm__fields'>
              <BlockFields block={formBlock} onChange={setFormBlock} id='sm-block' />
            </div>
            {submitted && formError && <p className='dk-field__error'>{`${formError.path.join(' › ')}: ${formError.message}`}</p>}
          </div>
        )}

        <fieldset className='dk-sm__place'>
          <legend>Where on the page</legend>
          {PLACEMENTS.map((p) => (
            <label key={p} className={'dk-sm__place-opt' + (placement === p ? ' is-on' : '')}>
              <input type='radio' name='sm-placement' value={p} checked={placement === p} onChange={() => setPlacement(p)} />
              <span>
                <b>{PLACEMENT_META[p].label}</b>
                <small>{PLACEMENT_META[p].hint}</small>
              </span>
            </label>
          ))}
        </fieldset>

        <div className='dk-sm__tools'>
          <button type='button' className='dk-sm__ghost' onClick={() => setShowPreview((v) => !v)} disabled={!block} aria-expanded={showPreview}>
            <Code2 size={14} aria-hidden /> {showPreview ? 'Hide' : 'Preview'} the code added to the page
          </button>
          <span className='dk-sm__links'>
            Test after saving:
            <a href={RICH_RESULTS} target='_blank' rel='noopener noreferrer'>
              Rich Results Test <ExternalLink size={12} aria-hidden />
            </a>
            <a href={SCHEMA_VALIDATOR} target='_blank' rel='noopener noreferrer'>
              Schema validator <ExternalLink size={12} aria-hidden />
            </a>
          </span>
        </div>
        {showPreview && preview && <pre className='dk-schema__preview dk-sm__preview'>{preview}</pre>}
      </div>
    </Modal>
  );
}
