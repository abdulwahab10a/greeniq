const xss = require('xss');

// Password fields must never be sanitized — XSS escaping would
// corrupt the value before bcrypt comparison and break login.
const PASSWORD_KEYS = new Set(['password', 'currentPassword', 'newPassword']);

const sanitizeValue = (val, key) => {
  if (PASSWORD_KEYS.has(key)) return val;
  if (typeof val === 'string') return xss(val.trim());
  if (Array.isArray(val)) return val.map(v => sanitizeValue(v, key));
  if (val && typeof val === 'object') {
    return Object.fromEntries(Object.entries(val).map(([k, v]) => [k, sanitizeValue(v, k)]));
  }
  return val;
};

module.exports = (req, res, next) => {
  if (req.body)   req.body   = sanitizeValue(req.body,   '');
  if (req.query)  req.query  = sanitizeValue(req.query,  '');
  if (req.params) req.params = sanitizeValue(req.params, '');
  next();
};
