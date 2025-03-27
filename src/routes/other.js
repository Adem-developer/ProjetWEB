const express = require("express");
const router = express.Router();
const db = require("../db")


router.get("/restock", (req, res) => {
  res.json({ message: "Stock to refill" });
});

router.get("/dish", (req, res) => {
  res.json({ message:"Available dishes" });
});

module.exports = router;

/*
- permettre de voir les produits à acheter pour refaire un plat épuisé (admin)
- permettre de voir les plats disponible (admin + client)
*/