export const validateBody = (schema) => {
  return (req, res, next) => {
    try {
      const parsed = schema.parse(req.body);
      req.body = parsed;
      next();
    } catch (error) {
      const formattedErrors = error.errors?.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      })) || [{ message: error.message }];

      return res.status(422).json({
        success: false,
        message: 'Validation failed',
        errors: formattedErrors,
      });
    }
  };
};

export const validateQuery = (schema) => {
  return (req, res, next) => {
    try {
      const parsed = schema.parse(req.query);
      req.query = parsed;
      next();
    } catch (error) {
      const formattedErrors = error.errors?.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      })) || [{ message: error.message }];

      return res.status(422).json({
        success: false,
        message: 'Query parameter validation failed',
        errors: formattedErrors,
      });
    }
  };
};
