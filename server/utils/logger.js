const info = (...messages) => {
  if (process.env.NODE_ENV !== 'test') {
    console.log(`[INFO] ${new Date().toISOString()}:`, ...messages);
  }
};

const error = (...messages) => {
  if (process.env.NODE_ENV !== 'test') {
    console.error(`[ERROR] ${new Date().toISOString()}:`, ...messages);
  }
};

const warn = (...messages) => {
  if (process.env.NODE_ENV !== 'test') {
    console.warn(`[WARN] ${new Date().toISOString()}:`, ...messages);
  }
};

module.exports = {
  info,
  error,
  warn
};
