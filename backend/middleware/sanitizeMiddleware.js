const xss = require('xss');

// Password fields must never go through XSS — escaping special chars
// would corrupt the value before bcrypt comparison and break login.
const PASSWORD_KEYS = new Set(['password', 'currentPassword', 'newPassword']);

const sanitizeValue = (val, key) => {
  if (PASSWORD_KEYS.has(key)) return val;
  if (typeof val === 'string') return xss(val.trim());
  if (Array.isArray(val)) return val.map(v => sanitizeValue(v, key));
  if (val && typeof val === 'object') {
    // Strip MongoDB operator keys (NoSQL injection prevention)
    const clean = {};
    for (const [k, v] of Object.entries(val)) {
      if (typeof k === 'string' && k.startsWith('$')) continue;
      clean[k] = sanitizeValue(v, k);
    }
    return clean;
  }
  return val;
};

module.exports = (req, res, next) => {
  if (req.body)   req.body   = sanitizeValue(req.body,   '');
  if (req.query)  req.query  = sanitizeValue(req.query,  '');
  if (req.params) req.params = sanitizeValue(req.params, '');
  next();
};
