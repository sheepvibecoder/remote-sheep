// Which image types the phone may display, shared by the agent (which only offers those) and the
// app (which only builds a Blob of those).
//
// The type comes from a transcript, which anyone able to write to it controls. A blob: URL
// inherits the page's origin, so an `image/svg+xml` or `text/html` payload would run with the
// PWA's privileges. Only raster formats are safe, and the match is exact: no case folding and no
// parameters, because a browser would accept variants the list never meant to allow.

export const DISPLAYABLE_IMAGE_TYPES: readonly string[] = [
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
];

export function isDisplayableImage(media: string): boolean {
  return DISPLAYABLE_IMAGE_TYPES.includes(media);
}
