const express = require('express');
const {
    getUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser
} = require('../../controllers/userController');
const { requireAuth } = require('../../middlewares/auth');
const router = express.Router();

// All user CRUD routes require JWT authentication
router.use(requireAuth);

// GET /users - Get all users with pagination
router.get('/', getUsers);

// GET /users/:id - Get user by ID
router.get('/:id', getUserById);

// POST /users - Create new user
router.post('/', createUser);

// PUT /users/:id - Update user
router.put('/:id', updateUser);

// DELETE /users/:id - Delete user
router.delete('/:id', deleteUser);

module.exports = router;