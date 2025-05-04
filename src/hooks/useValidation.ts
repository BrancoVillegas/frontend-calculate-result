export const isUnique = (arr: string[]): boolean => {
    return new Set(arr).size === arr.length;
};