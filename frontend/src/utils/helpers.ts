/**
 * helpers.ts
 * Tekst- og formateringsværktøjer til frontend.
 */

export const getInitials = (name: string) => {
  return name.split(/[\s_-]+/).filter(x => x).map(x => x[0]).join('').toUpperCase().substring(0, 3);
};

export const splitMarkdown = (fullMd: string) => {
  const sections = fullMd.split(/---([A-ZÆØÅ0-9_+]+)---/);
  let meta = ""; 
  let body = fullMd; 
  let currentTag = "";
  
  if (sections.length <= 1) return { meta: "", body: fullMd, tag: "" };
  
  for (let i = 1; i < sections.length; i += 2) {
    const tag = sections[i];
    const content = (sections[i+1] || "").replace(/^(\r\n|\n)/, "").replace(/(\r\n|\n)$/, "");
    if (tag === 'LAYOUT_METADATA') {
      meta = content;
    } else if (['ANSØGNING', 'CV', 'MATCH', 'MATCH_ANALYSE', 'ICAN', 'ICAN+_PITCH'].includes(tag.toUpperCase())) {
      body = content;
      currentTag = tag;
    }
  }
  return { meta, body, tag: currentTag };
};
