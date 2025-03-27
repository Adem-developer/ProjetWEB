const express = require("express");
const router = express.Router();
const db = require("../db")


router.get("/pending", (req, res) => {
  res.json({ message: "Pending orders" });
});

router.get("/done", (req, res) => {
  res.json({ message: "Finished orders" });
});

router.get("/details/:id", (req, res) => {
  let temp = "Order details for id : " + req.params.id
  res.json({ message: temp });
});


router.put("/modify", (req, res) => {
  res.json({ message: "Modify orders" });
});

router.put("/status", (req, res) => {
  res.json({ message: "Order status" });
});

module.exports = router;

/*
- fonction pour voir les commandes en cour (admin)
- fonction pour voir les commandes passé (admin)
- fonction pour voir les details d'une commande (admin + client)
- mettre une commande en livré quand elle est faite (admin + client)
- fonction pour modifier une commande (admin + client)
- Liste d'attente des commandes effectué (admin + client)
*/