import { Department } from '../models/Department.js';

export const getDepartments = async (req, res, next) => {
  try {
    const departments = await Department.find({ isActive: true }).sort({ name: 1 });
    res.status(200).json({
      success: true,
      data: departments,
    });
  } catch (error) {
    next(error);
  }
};

export const createDepartment = async (req, res, next) => {
  try {
    const { name, code, description, headOfDepartment, contactEmail } = req.body;
    const department = await Department.create({
      name,
      code,
      description,
      headOfDepartment,
      contactEmail,
    });
    res.status(201).json({
      success: true,
      message: 'Department created successfully.',
      data: department,
    });
  } catch (error) {
    next(error);
  }
};
