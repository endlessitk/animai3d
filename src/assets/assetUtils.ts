export const normalizeSvgForAsset = (svg: string) => {
  const withoutScripts = svg.replace(/<script[\s\S]*?<\/script>/gi, "");
  const body = withoutScripts
    .replace(/^[\s\S]*?<svg[^>]*>/i, "")
    .replace(/<\/svg>[\s\S]*$/i, "")
    .trim();

  return body || withoutScripts;
};
