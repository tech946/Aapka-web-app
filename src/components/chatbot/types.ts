export type ChatLink = {
  label: string;
  href: string;
  external?: boolean;
};

export type ChatOption = {
  label: string;
  nextId: string;
};

export type ChatNode = {
  id: string;
  /** Short line shown when entering a sub-topic (menus). */
  prompt?: string;
  /** Full answer shown after the user picks a question. */
  answer?: string;
  options?: ChatOption[];
  links?: ChatLink[];
};

export type ChatMessage = {
  id: string;
  role: 'bot' | 'user';
  text: string;
};
