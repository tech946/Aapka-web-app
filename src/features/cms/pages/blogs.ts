import { defineCmsPage } from '../define';

export type BlogsContent = {
  hero: { title: string; tags: { text: string }[] };
  home: { featuredTitle: string; recentTitle: string; readAll: string };
  aside: { popularTitle: string; relatedTitle: string; toursTitle: string };
  callback: { title: string; text: string; button: string; thanksTitle: string; thanksText: string };
};

export const blogsCms = defineCmsPage<BlogsContent>({
  key: 'blogs',
  title: 'Blog pages',
  description: 'The banner, headings and side column shared by every blog page. Posts themselves are written in Blogs.',
  group: 'Blog',
  preview: { kind: 'path', path: '/blogs' },
  revalidate: [{ path: '/blogs', type: 'layout' }],
  fields: [
    {
      type: 'group',
      name: 'hero',
      label: 'Blog banner',
      fields: [
        { type: 'text', name: 'title', label: 'Title' },
        { type: 'list', name: 'tags', label: 'Words under the title', itemLabel: 'Word', titleField: 'text', maxItems: 4, fields: [{ type: 'text', name: 'text', label: 'Word' }] },
      ],
    },
    {
      type: 'group',
      name: 'home',
      label: 'Blog home headings',
      fields: [
        { type: 'text', name: 'featuredTitle', label: 'Featured heading' },
        { type: 'text', name: 'recentTitle', label: 'Recent posts heading' },
        { type: 'text', name: 'readAll', label: '“Read all” link' },
      ],
    },
    {
      type: 'group',
      name: 'aside',
      label: 'Side column headings',
      fields: [
        { type: 'text', name: 'popularTitle', label: 'Popular posts heading' },
        { type: 'text', name: 'relatedTitle', label: 'Related posts heading (on a post)' },
        { type: 'text', name: 'toursTitle', label: 'Recommended tours heading' },
      ],
    },
    {
      type: 'group',
      name: 'callback',
      label: 'Contact form',
      fields: [
        { type: 'text', name: 'title', label: 'Title' },
        { type: 'textarea', name: 'text', label: 'Text', rows: 2 },
        { type: 'text', name: 'button', label: 'Button text' },
        { type: 'text', name: 'thanksTitle', label: 'Thank-you title' },
        { type: 'text', name: 'thanksText', label: 'Thank-you text' },
      ],
    },
  ],
  defaults: {
    hero: {
      title: 'Explore Aapka Tourism Travel Stories',
      tags: [{ text: 'Travel Inspiration' }, { text: 'Destination Guides' }, { text: 'Travel Tips' }],
    },
    home: { featuredTitle: 'Featured Blogs', recentTitle: 'Recently Posted', readAll: 'Read all' },
    aside: { popularTitle: 'Most Popular Blogs', relatedTitle: 'Related Blogs', toursTitle: 'Recommended Tours' },
    callback: {
      title: 'Get in touch with us',
      text: 'Share your details for a call back and subscribe to our newsletter for travel inspiration.',
      button: 'Request Call Back',
      thanksTitle: 'Thank you!',
      thanksText: 'A travel expert will call you shortly.',
    },
  },
});
