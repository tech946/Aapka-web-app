'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, ChevronRight, PhoneCall, RotateCcw, Undo2 } from 'lucide-react';
import { CHATBOT_GREETING, CHAT_NODES, INITIAL_NODE_ID, WHATSAPP_URL } from '@/components/chatbot/chatbot-data';
import type { ChatLink, ChatOption } from '@/components/chatbot/types';
import { WhatsAppIcon } from '@/components/site/WhatsAppIcon';
import { BrandAvatar, PanelFrame } from './PanelFrame';

const TYPING_MS = 650;

interface Message {
  id: number;
  role: 'bot' | 'user';
  text: string;
  links?: ChatLink[];
}

interface ChatPanelProps {
  hidden: boolean;
  online: boolean;
  onMinimize: () => void;
  onClose: () => void;
  onRequestCallback: () => void;
}

const greeting = (): Message[] => [{ id: 0, role: 'bot', text: CHATBOT_GREETING }];

function MessageLinks({ links }: { links: ChatLink[] }) {
  return (
    <div className='cl-chat__links'>
      {links.map((link) =>
        link.external ? (
          <a key={link.href} href={link.href} target='_blank' rel='noopener noreferrer'>
            {link.label}
            <ArrowUpRight size={14} aria-hidden />
          </a>
        ) : (
          <Link key={link.href} href={link.href}>
            {link.label}
            <ArrowUpRight size={14} aria-hidden />
          </Link>
        ),
      )}
    </div>
  );
}

export function ChatPanel({ hidden, online, onMinimize, onClose, onRequestCallback }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>(greeting);
  const [trail, setTrail] = useState<string[]>([INITIAL_NODE_ID]);
  const [typing, setTyping] = useState(false);
  const nextId = useRef(1);
  const timer = useRef<number | null>(null);
  const end = useRef<HTMLDivElement>(null);

  const current = CHAT_NODES[trail[trail.length - 1]] ?? CHAT_NODES[INITIAL_NODE_ID];

  useEffect(() => {
    end.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, typing, hidden]);

  useEffect(() => () => {
    if (timer.current) window.clearTimeout(timer.current);
  }, []);

  const push = (message: Omit<Message, 'id'>) => setMessages((list) => [...list, { ...message, id: nextId.current++ }]);

  const pick = (option: ChatOption) => {
    const node = CHAT_NODES[option.nextId];
    if (!node || typing) return;
    push({ role: 'user', text: option.label });
    setTyping(true);
    timer.current = window.setTimeout(() => {
      const text = node.answer ?? node.prompt;
      if (text) push({ role: 'bot', text, links: node.links });
      setTrail((t) => [...t, node.id]);
      setTyping(false);
    }, TYPING_MS);
  };

  const back = () => setTrail((t) => (t.length > 1 ? t.slice(0, -1) : t));

  const restart = () => {
    if (timer.current) window.clearTimeout(timer.current);
    setTyping(false);
    setMessages(greeting());
    setTrail([INITIAL_NODE_ID]);
  };

  return (
    <PanelFrame
      title='Chat with Aapka Tourism'
      subtitle={
        <span className={`cl-status cl-status--light${online ? ' is-online' : ''}`}>
          {online ? 'Experts online · quick reply' : "Experts busy · we'll call you back"}
        </span>
      }
      avatar
      hidden={hidden}
      onMinimize={onMinimize}
      onClose={onClose}
      className='cl-panel--chat'
      bodyClassName='cl-chat'
      footer={
        <div className='cl-chat__foot'>
          <p>Prefer to talk to a person?</p>
          <div className='cl-chat__foot-actions'>
            <button type='button' className='cl-pill cl-pill--outline' onClick={onRequestCallback}>
              <PhoneCall size={15} aria-hidden />
              Call me back
            </button>
            <a href={WHATSAPP_URL} target='_blank' rel='noopener noreferrer' className='cl-pill cl-pill--whatsapp'>
              <WhatsAppIcon size={16} />
              WhatsApp
            </a>
          </div>
        </div>
      }
    >
      <p className='cl-chat__day'>
        <span>Today</span>
      </p>

      <ol className='cl-chat__log' aria-live='polite'>
        {messages.map((m) => (
          <li key={m.id} className={`cl-msg cl-msg--${m.role}`}>
            {m.role === 'bot' && <BrandAvatar />}
            <div className='cl-msg__bubble'>
              <p>{m.text}</p>
              {m.links && m.links.length > 0 && <MessageLinks links={m.links} />}
            </div>
          </li>
        ))}
        {typing && (
          <li className='cl-msg cl-msg--bot'>
            <BrandAvatar />
            <div className='cl-msg__bubble cl-typing' aria-label='Typing'>
              <span />
              <span />
              <span />
            </div>
          </li>
        )}
      </ol>

      {!typing && (
        <div className='cl-chat__suggest'>
          <p className='cl-chat__suggest-label'>Suggested questions</p>
          <div className='cl-chat__options'>
            {(current.options ?? []).map((option) => (
              <button key={option.nextId + option.label} type='button' onClick={() => pick(option)}>
                {option.label}
                <ChevronRight size={14} aria-hidden />
              </button>
            ))}
          </div>
          {trail.length > 1 && (
            <div className='cl-chat__nav'>
              <button type='button' onClick={back}>
                <Undo2 size={13} aria-hidden /> Back
              </button>
              <button type='button' onClick={restart}>
                <RotateCcw size={13} aria-hidden /> Start over
              </button>
            </div>
          )}
        </div>
      )}
      <div ref={end} />
    </PanelFrame>
  );
}
