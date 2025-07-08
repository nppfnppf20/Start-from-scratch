const Client = require('../models/client');

// Create a new client
const createClient = async (req, res) => {
  try {
    const client = new Client(req.body);
    await client.save();
    res.status(201).send(client);
  } catch (error) {
    res.status(400).send(error);
  }
};

// Get all clients
const getAllClients = async (req, res) => {
  try {
    const clients = await Client.find({});
    res.send(clients);
  } catch (error) {
    res.status(500).send(error);
  }
};

// Get a single client by ID
const getClientById = async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) {
      return res.status(404).send();
    }
    res.send(client);
  } catch (error) {
    res.status(500).send(error);
  }
};

// Update a client by ID
const updateClient = async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ['Name', 'Industry', 'Contacts'];
  const isValidOperation = updates.every((update) => allowedUpdates.includes(update));

  if (!isValidOperation) {
    return res.status(400).send({ error: 'Invalid updates!' });
  }

  try {
    const client = await Client.findById(req.params.id);
    if (!client) {
      return res.status(404).send();
    }
    updates.forEach((update) => client[update] = req.body[update]);
    await client.save();
    res.send(client);
  } catch (error) {
    res.status(400).send(error);
  }
};

// Delete a client by ID
const deleteClient = async (req, res) => {
  try {
    const client = await Client.findByIdAndDelete(req.params.id);
    if (!client) {
      return res.status(404).send();
    }
    res.send(client);
  } catch (error) {
    res.status(500).send(error);
  }
};

module.exports = {
  createClient,
  getAllClients,
  getClientById,
  updateClient,
  deleteClient,
}; 