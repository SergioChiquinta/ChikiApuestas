import jwt from 'jsonwebtoken';

export function requireAuth(req, res, next) {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
  if (!token) return res.status(401).json({ message: 'Sesión requerida' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ message: 'Sesión inválida o vencida' });
  }
}

export function requireRole(...roles) {
  return (req, res, next) => roles.includes(req.user.rol)
    ? next()
    : res.status(403).json({ message: 'No autorizado' });
}
