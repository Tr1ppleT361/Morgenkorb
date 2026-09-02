/**
 * Der Warenkorb im Browser.
 *
 * Ein Eintrag ist entweder ein Produkt ohne Sorten oder ein Produkt mit
 * einer bestimmten Sorte. Damit beides in dieselbe Liste passt, bauen wir
 * uns einen Schlüssel:
 *
 *   "p12"      = Produkt 12, keine Sorte
 *   "p12v34"   = Produkt 12, Sorte 34
 */

export type Schluessel = string;

export function schluessel(productId: number, variantId?: number | null): Schluessel {
  return variantId ? `p${productId}v${variantId}` : `p${productId}`;
}

/** Zerlegt den Schlüssel wieder in seine Teile. */
export function zerlegen(
  s: Schluessel,
): { productId: number; variantId: number | null } | null {
  const treffer = /^p(\d+)(?:v(\d+))?$/.exec(s);
  if (!treffer) return null;
  return {
    productId: Number(treffer[1]),
    variantId: treffer[2] ? Number(treffer[2]) : null,
  };
}
