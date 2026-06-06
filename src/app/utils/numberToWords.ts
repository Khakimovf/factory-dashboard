/**
 * Converts a number to its verbal representation in Russian.
 * Useful for accounting and legal documents (Waybills).
 */
export function numberToWordsRU(amount: number): string {
    const units = ['', 'один', 'два', 'три', 'четыре', 'пять', 'шесть', 'семь', 'восемь', 'девять'];
    const teens = ['десять', 'одиннадцать', 'двенадцать', 'тринадцать', 'четырнадцать', 'пятнадцать', 'шестнадцать', 'семнадцать', 'восемнадцать', 'девятнадцать'];
    const tens = ['', '', 'двадцать', 'тридцать', 'сорок', 'пятьдесят', 'шестьдесят', 'семьдесят', 'восемьдесят', 'девяносто'];
    const hundreds = ['', 'сто', 'двести', 'триста', 'четыреста', 'пятьсот', 'шестьсот', 'семьсот', 'восемьсот', 'девятьсот'];

    const thousands = ['тысяча', 'тысячи', 'тысяч'];
    const millions = ['миллион', 'миллиона', 'миллионов'];
    const billions = ['миллиард', 'миллиарда', 'миллиардов'];

    function getPlural(n: number, forms: string[]): string {
        n = Math.abs(n) % 100;
        const n1 = n % 10;
        if (n > 10 && n < 20) return forms[2];
        if (n1 > 1 && n1 < 5) return forms[1];
        if (n1 === 1) return forms[0];
        return forms[2];
    }

    function convertGroup(n: number, isThousands: boolean = false): string {
        let result = '';
        const h = Math.floor(n / 100);
        const t = Math.floor((n % 100) / 10);
        const u = n % 10;

        if (h > 0) result += hundreds[h] + ' ';

        if (t === 1) {
            result += teens[u] + ' ';
        } else {
            if (t > 1) result += tens[t] + ' ';
            if (u > 0) {
                if (isThousands) {
                    if (u === 1) result += 'одна ';
                    else if (u === 2) result += 'две ';
                    else result += units[u] + ' ';
                } else {
                    result += units[u] + ' ';
                }
            }
        }

        return result.trim();
    }

    if (amount === 0) return 'ноль';

    const parts: string[] = [];
    const b = Math.floor(amount / 1000000000);
    const m = Math.floor((amount % 1000000000) / 1000000);
    const th = Math.floor((amount % 1000000) / 1000);
    const r = Math.floor(amount % 1000);

    if (b > 0) parts.push(convertGroup(b) + ' ' + getPlural(b, billions));
    if (m > 0) parts.push(convertGroup(m) + ' ' + getPlural(m, millions));
    if (th > 0) parts.push(convertGroup(th, true) + ' ' + getPlural(th, thousands));
    if (r > 0) parts.push(convertGroup(r));

    let finalStr = parts.join(' ').trim();

    // Capitalize first letter
    if (finalStr.length > 0) {
        finalStr = finalStr.charAt(0).toUpperCase() + finalStr.slice(1);
    }

    return finalStr;
}

/**
 * Formats the amount into words with currency (UZS).
 */
export function amountToWordsUZS(amount: number): string {
    const integerPart = Math.floor(amount);
    // const fractionalPart = Math.round((amount - integerPart) * 100);

    const words = numberToWordsRU(integerPart);
    return `${words} сум 00 тийин`;
}
