const express = require('express');
const router = express.Router();
const {
  createClient,
  getAllClients,
  getClientById,
  updateClient,
  deleteClient,
} = require('../controllers/clientController');

// Route to create a new client
router.post('/clients', createClient);

// Route to get all clients
router.get('/clients', getAllClients);

// Route to get a single client by ID
router.get('/clients/:id', getClientById);

// Route to update a client by ID
router.patch('/clients/:id', updateClient);

// Route to delete a client by ID
router.delete('/clients/:id', deleteClient);

module.exports = router; 