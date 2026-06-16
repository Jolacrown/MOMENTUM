const PREFIX = '[coach]';

const warn = (...args: unknown[]) => {
  console.warn(PREFIX, ...args);
};

const error = (...args: unknown[]) => {
  console.error(PREFIX, ...args);
};

export const logger = { warn, error };
