export function getCssProperty(property: string): string {
    return getComputedStyle(document.documentElement).getPropertyValue(property).trim();
}