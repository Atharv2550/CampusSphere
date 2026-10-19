export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized. User context missing.',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Role '${req.user.role}' is not authorized to perform this action.`,
      });
    }

    next();
  };
};

export const requireClubOwnershipOrAdmin = (req, res, next) => {
  if (req.user.role === 'admin') {
    return next();
  }

  const clubId = req.params.clubId || req.body.clubId || req.body.club;
  if (req.user.role === 'coordinator' && req.user.assignedClub && req.user.assignedClub.toString() === clubId?.toString()) {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: 'Access denied: You can only manage your assigned club.',
  });
};
