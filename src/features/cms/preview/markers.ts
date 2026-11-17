import { CMS_ATTR } from './protocol';

export function cmsSection(section: string, label: string) {
  return { [CMS_ATTR.section]: section, [CMS_ATTR.label]: label };
}

export function cmsText(field: string) {
  return { [CMS_ATTR.field]: field };
}

export function cmsHtml(field: string, listClass: string) {
  return { [CMS_ATTR.field]: field, [CMS_ATTR.html]: '', [CMS_ATTR.listClass]: listClass };
}
