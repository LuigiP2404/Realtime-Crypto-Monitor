import { describe, it, expect } from 'vitest';
import { amountDecimalsFor, decimalsFor, formatNumber, formatPercent, formatPrice } from './format';

describe('decimalsFor', () => {
    it.each([
        [1, 2],
        [0.01, 4],
        [0, 2],
        [-3, 2],
        [0.99, 4],
        [1.01, 2],
        [-0.01, 4],
        [-0.0005, 8]
    ])('decimals for %d -> %i', (val, expected) => {
        expect(decimalsFor(val)).toBe(expected);
    })
});

describe('amountDecimalsFor', () => {
    const testArr = [
        [10000, 2],
        [100, 3],
        [1, 4],
        [-0.99, 6],
        [1.01, 4],
        [99.999, 4],
        [-101.01, 3],
        [-10000.01, 2],
        [0, 6]
    ]
    it.each(testArr)('decimals for %d -> %i', (val, expected) => {
        expect(amountDecimalsFor(val)).toBe(expected);
    })
});


describe('amountDecimalsFor', () => {
    const testArr = [
        [10000, 2],
        [100, 3],
        [1, 4],
        [-0.99, 6],
        [1.01, 4],
        [99.999, 4],
        [-101.01, 3],
        [-10000.01, 2],
        [0, 6]
    ]
    it.each(testArr)('%d -> %i', (val, expected) => {
        expect(amountDecimalsFor(val)).toBe(expected);
    })
});

describe('formatNumber', () => {
    const testArr: [number,number,string][] = [
        [NaN, 2, '—'],
        [100, 3, '100.000'],
        [1, 4, '1.0000'],
        [-0.99, 6, '-0.990000'],
        [1.01, 4, '1.0100'],
        [99.999, 4, '99.9990'],
        [-101.01, 3, '-101.010'],
        [-10000.01, 2, '-10,000.01'],
        [0, 6, '0.000000'],
        [1034245.2789, 3, '1,034,245.279']
    ]
    it.each(testArr)('format %d, %d -> %s', (val, digits, expected) => {
        expect(formatNumber(val, digits)).toBe(expected);
    })
});

describe('formatPrice', () => {
    const testArr: [number | null | undefined,string][] = [
        [2,'$2.00'],
        [null, '—'],
        [undefined, '—'],
        [NaN, '—'],
        [450.467, '$450.47'],
        [0.045632, '$0.0456'],
        [0.005678447364, '$0.00567845'],
        [0.0056, '$0.00560000']
    ]
    it.each(testArr)('format %s -> %s', (val, expected) => {
        expect(formatPrice(val)).toBe(expected);
    })
});

describe('formatPercent', () => {
    const testArr: [number | null | undefined,string][] = [
        [2,'+2.00%'],
        [null, '—'],
        [undefined, '—'],
        [NaN, '—'],
        [450.467, '+450.47%'],
        [0.045632, '+0.05%'],
        [0.005678447364, '+0.01%'],
        [0.0044, '0.00%'],
        [-2, '-2.00%'],
        [-54.78900, '-54.79%'],
        [-0.004, '0.00%']
    ]
    it.each(testArr)('format %s -> %s', (val, expected) => {
        expect(formatPercent(val)).toBe(expected);
    })
});