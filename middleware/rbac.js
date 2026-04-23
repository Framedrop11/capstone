'use strict';
/**
 * middleware/rbac.js  (upgraded)
 * ClearScore — Step 2.2 / 2.3
 *
 * verifyToken:  checks JWT from httpOnly cookie first,
 *               falls back to Authorization: Bearer header
 *               (keeps existing api.js routes working)
 *
 * requireRole:  role-based access guard
 * generateToken: JWT signing helper (preserved for api.js compat)
 */
const jwt = require('jsonwebtoken');

const JWT_SECRET  = process.env.JWT_SECRET || 'your-super-secret-jwt-key';
const COOKIE_NAME = 'clearscore_token';

function generateToken(user) {
  return jwt.sign(
    { sub: user._id?.toString() || user.id, id: user._id?.toString() || user.id,
      role: user.role, email: user.email },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

/**
 * Verify JWT from cookie (preferred) or Bearer header (backward compat).
 * Attaches decoded payload to req.userAuth.
 */
function verifyToken(req, res, next) {
  // 1. Cookie (Next.js httpOnly flow)
  const cookieToken = req.cookies?.[COOKIE_NAME];
  // 2. Bearer header (api.js / Postman / mobile clients)
  const headerToken = (() => {
    const h = req.headers.authorization;
    return h && h.startsWith('Bearer ') ? h.split(' ')[1] : null;
  })();

  const token = cookieToken || headerToken;
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: No token provided.' });
  }

  try {
    const decoded   = jwt.verify(token, JWT_SECRET);
    // Normalise: new tokens use `sub`, old tokens used `id`
    decoded.id      = decoded.sub || decoded.id;
    req.userAuth    = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized: Token expired or invalid.' });
  }
}

function requireRole(roles) {
  return (req, res, next) => {
    if (!req.userAuth) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }
    if (!roles.includes(req.userAuth.role)) {
      return res.status(403).json({ error: 'Forbidden: Insufficient role.' });
    }
    next();
  };
}

module.exports = { generateToken, verifyToken, requireRole };
