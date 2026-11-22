const { query } = require("../config/db");

// GET /api/health: confirma que el servidor vive y que la base responde.
const revisar = async (req, res) => {
  try {
    await query("SELECT 1");
    res.json({ status: "ok", db: "ok" });
  } catch (err) {
    console.error("Health: la base no responde:", err.message);
    res.status(503).json({ status: "ok", db: "error" });
  }
};

module.exports = { revisar };
