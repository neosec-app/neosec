const RoleTemplate = require('../models/RoleTemplate');
const User = require('../models/User');

// Get all role templates
const getRoleTemplates = async (req, res) => {
  try {
    const templates = await RoleTemplate.findAll({
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'email']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
      success: true,
      data: templates
    });
  } catch (error) {
    console.error('Get role templates error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching role templates',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get single role template
const getRoleTemplate = async (req, res) => {
  try {
    const { id } = req.params;

    const template = await RoleTemplate.findByPk(id, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'email']
        }
      ]
    });

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Role template not found'
      });
    }

    res.status(200).json({
      success: true,
      data: template
    });
  } catch (error) {
    console.error('Get role template error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching role template',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Create role template
const createRoleTemplate = async (req, res) => {
  try {
    const { name, description, permissions } = req.body;

    if (!name || !permissions) {
      return res.status(400).json({
        success: false,
        message: 'name and permissions are required'
      });
    }

    // Check if template with same name exists
    const existing = await RoleTemplate.findOne({ where: { name } });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Role template with this name already exists'
      });
    }

    const template = await RoleTemplate.create({
      name,
      description: description || null,
      permissions: permissions || {},
      createdBy: req.user.id
    });

    res.status(201).json({
      success: true,
      data: template
    });
  } catch (error) {
    console.error('Create role template error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating role template',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update role template
const updateRoleTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, permissions } = req.body;

    const template = await RoleTemplate.findByPk(id);
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Role template not found'
      });
    }

    // Don't allow updating system templates
    if (template.isSystem) {
      return res.status(400).json({
        success: false,
        message: 'Cannot modify system role templates'
      });
    }

    if (name) template.name = name;
    if (description !== undefined) template.description = description;
    if (permissions) template.permissions = permissions;

    await template.save();

    res.status(200).json({
      success: true,
      data: template
    });
  } catch (error) {
    console.error('Update role template error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating role template',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Delete role template
const deleteRoleTemplate = async (req, res) => {
  try {
    const { id } = req.params;

    const template = await RoleTemplate.findByPk(id);
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Role template not found'
      });
    }

    // Don't allow deleting system templates
    if (template.isSystem) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete system role templates'
      });
    }

    await template.destroy();

    res.status(200).json({
      success: true,
      message: 'Role template deleted successfully'
    });
  } catch (error) {
    console.error('Delete role template error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting role template',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  getRoleTemplates,
  getRoleTemplate,
  createRoleTemplate,
  updateRoleTemplate,
  deleteRoleTemplate
};

