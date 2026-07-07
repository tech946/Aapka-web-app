'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft,
  MessageCircle,
  MoreVertical,
  RotateCcw,
  X,
} from 'lucide-react';
import {
  CHAT_NODES,
  INITIAL_NODE_ID,
  WHATSAPP_URL,
} from './chatbot-data';
import type { ChatMessage, ChatNode, ChatOption } from './types';
import './chatbot.css';

const HOME_HEADING = 'How can I help you?';

function createMessage(role: ChatMessage['role'], text: string): ChatMessage {
  return {
    id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    role,
    text,
  };
}

function getBotText(node: ChatNode): string | null {
  if (node.answer) return node.answer;
  if (node.prompt) return node.prompt;
  return null;
}

function buildMessagesFromStack(stack: string[]): ChatMessage[] {
  const msgs: ChatMessage[] = [];

  for (let i = 1; i < stack.length; i++) {
    const nodeId = stack[i];
    const prevNode = CHAT_NODES[stack[i - 1]];
    const option = prevNode?.options?.find((o) => o.nextId === nodeId);
    const label = option?.label ?? 'Selected';

    msgs.push(createMessage('user', label));

    const botText = getBotText(CHAT_NODES[nodeId]);
    if (botText) {
      msgs.push(createMessage('bot', botText));
    }
  }

  return msgs;
}

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentNode, setCurrentNode] = useState<ChatNode | null>(null);
  const [nodeStack, setNodeStack] = useState<string[]>([INITIAL_NODE_ID]);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const isHomeView = nodeStack.length === 1;
  const canGoBack = nodeStack.length > 1;

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const resetConversation = useCallback(() => {
    const node = CHAT_NODES[INITIAL_NODE_ID];
    setMessages([]);
    setCurrentNode(node);
    setNodeStack([INITIAL_NODE_ID]);
    setMenuOpen(false);
    setHasInitialized(true);
  }, []);

  useEffect(() => {
    if (isOpen && !hasInitialized) {
      resetConversation();
    }
  }, [isOpen, hasInitialized, resetConversation]);

  useEffect(() => {
    if (isOpen && !isHomeView) {
      scrollToBottom();
    }
  }, [isOpen, isHomeView, messages, currentNode, scrollToBottom]);

  useEffect(() => {
    if (!menuOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  const getVisibleOptions = (node: ChatNode): ChatOption[] => {
    return (node.options ?? []).slice(0, 3);
  };

  const navigateToNode = (nextId: string, optionLabel: string) => {
    const node = CHAT_NODES[nextId];
    if (!node) return;

    const botText = getBotText(node);

    setMessages((prev) => [
      ...prev,
      createMessage('user', optionLabel),
      ...(botText ? [createMessage('bot', botText)] : []),
    ]);
    setCurrentNode(node);
    setNodeStack((prev) => [...prev, nextId]);
    setMenuOpen(false);
  };

  const handleBack = () => {
    if (nodeStack.length <= 1) return;

    const newStack = nodeStack.slice(0, -1);
    const prevId = newStack[newStack.length - 1];

    setNodeStack(newStack);
    setCurrentNode(CHAT_NODES[prevId]);
    setMessages(buildMessagesFromStack(newStack));
    setMenuOpen(false);
  };

  const handleToggle = () => {
    setIsOpen((prev) => !prev);
  };

  const handleClose = () => {
    setIsOpen(false);
    setMenuOpen(false);
  };

  const handleRestart = () => {
    resetConversation();
  };

  const visibleOptions = currentNode ? getVisibleOptions(currentNode) : [];

  const renderPills = (className = 'chatbot-pills') => (
    <div className={className} role='group' aria-label='Suggested questions'>
      {visibleOptions.map((option) => (
        <button
          key={option.nextId + option.label}
          type='button'
          className='chatbot-pill'
          onClick={() => navigateToNode(option.nextId, option.label)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );

  const renderLinks = () => {
    if (!currentNode?.links?.length) return null;

    return (
      <div className='chatbot-pills chatbot-pills--links'>
        {currentNode.links.map((link) =>
          link.external ? (
            <a
              key={link.href + link.label}
              href={link.href}
              target='_blank'
              rel='noopener noreferrer'
              className='chatbot-pill chatbot-pill--link'
            >
              {link.label}
            </a>
          ) : (
            <Link
              key={link.href + link.label}
              href={link.href}
              className='chatbot-pill chatbot-pill--link'
              onClick={handleClose}
            >
              {link.label}
            </Link>
          )
        )}
      </div>
    );
  };

  return (
    <div className='chatbot-root' aria-live='polite'>
      {isOpen && (
        <div
          className='chatbot-panel'
          role='dialog'
          aria-label='Aapka Tourism help chat'
        >
          <header className='chatbot-header'>
            {canGoBack ? (
              <button
                type='button'
                className='chatbot-header-btn'
                onClick={handleBack}
                aria-label='Go back'
              >
                <ArrowLeft size={20} />
              </button>
            ) : (
              <div className='chatbot-header-spacer' aria-hidden='true' />
            )}

            <div className='chatbot-header-brand'>
              <div className='chatbot-logo-badge' aria-hidden='true'>
                <Image
                  src='/aapka-tourism-logo.png'
                  alt=''
                  width={22}
                  height={22}
                  className='chatbot-logo-img'
                />
              </div>
              <span className='chatbot-header-title'>Aapka Tourism Help</span>
            </div>

            <div className='chatbot-header-actions' ref={menuRef}>
              <button
                type='button'
                className='chatbot-header-btn'
                onClick={() => setMenuOpen((prev) => !prev)}
                aria-label='More options'
                aria-expanded={menuOpen}
              >
                <MoreVertical size={20} />
              </button>
              {menuOpen && (
                <div className='chatbot-menu'>
                  <button type='button' onClick={handleRestart}>
                    <RotateCcw size={16} />
                    New chat
                  </button>
                  <button type='button' onClick={handleClose}>
                    <X size={16} />
                    Close
                  </button>
                </div>
              )}
            </div>
          </header>

          <div className='chatbot-body'>
            {isHomeView ? (
              <div className='chatbot-home'>
                <h2 className='chatbot-home-title'>{HOME_HEADING}</h2>
                {renderPills('chatbot-home-pills')}
              </div>
            ) : (
              <div className='chatbot-messages'>
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`chatbot-message chatbot-message--${msg.role}`}
                  >
                    <div className='chatbot-bubble'>{msg.text}</div>
                  </div>
                ))}

                {(visibleOptions.length > 0 || currentNode?.links?.length) && (
                  <div className='chatbot-suggestions'>
                    {visibleOptions.length > 0 && renderPills()}
                    {renderLinks()}
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          <footer className='chatbot-footer'>
            <div className='chatbot-footer-bar'>
              <MessageCircle size={18} className='chatbot-footer-icon' />
              <span className='chatbot-footer-text'>
                {isHomeView
                  ? 'Select a topic above to get started'
                  : 'Choose a follow-up question above'}
              </span>
              <a
                href={WHATSAPP_URL}
                target='_blank'
                rel='noopener noreferrer'
                className='chatbot-footer-action'
                aria-label='Chat on WhatsApp'
              >
                <MessageCircle size={18} />
              </a>
            </div>
          </footer>
        </div>
      )}

      <button
        type='button'
        className={`chatbot-trigger ${isOpen ? 'chatbot-trigger--open' : ''}`}
        onClick={handleToggle}
        aria-label={isOpen ? 'Close help chat' : 'Open help chat'}
        aria-expanded={isOpen}
      >
        {isOpen ? <X size={26} /> : <MessageCircle size={26} />}
      </button>
    </div>
  );
}
