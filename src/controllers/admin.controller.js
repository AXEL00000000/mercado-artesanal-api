const adminService = require("../services/admin.service");

const listarProductores = async (req, res) => {
  res.json(await adminService.listarProductores(req.query));
};

const decidirProductor = async (req, res) => {
  res.json(await adminService.decidirProductor(req.params.id, req.body || {}));
};

module.exports = { listarProductores, decidirProductor };
