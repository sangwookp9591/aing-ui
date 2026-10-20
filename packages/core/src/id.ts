export const id = (prefix: string, key: string) =>
  `${prefix}-${key.replace(/[^a-zA-Z0-9_-]/g, "")}`;
