const express = require("express");
const router = express.Router();
const db = require("../db")


// permettre de voir l'inventaire (admin + client)
router.get("/", async (req, res) => {
  try {
    const result = await db.query(`
      SELECT * 
      FROM Inventaire;
    `)
    res.json(result.rows)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
});

// permettre de voir les produits à acheter pour refaire un plat épuisé (admin)
router.get("/restock", async (req, res) => {
  try {
    const result = await db.query(`
      SELECT * 
      FROM Inventaire 
      WHERE quantite_disponible < seuil_critique;
    `)
    res.json(result.rows)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
});

// permettre de voir les plats disponible (admin + client)
router.get("/dish", async (req, res) => {
  try {
    const result = await db.query(`
      SELECT id_plat, nom_plat, description, prix 
      FROM menus 
      WHERE Disponibilite = TRUE;
    `)
    res.json(result.rows)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
});


// fonction pour mettre à jour une quantité (admin)
router.put("/:id", async (req, res) => {
  try {
    const { quantity } = req.body

    const result = await db.query(`
      UPDATE Inventaire
      SET quantite_disponible = $1
      WHERE id_produit = $2;
    `, [quantity, req.params.id])
    
    res.json(result.rows)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
});


// fonction pour ajouter un aliment (admin)
router.post("/", async (req, res) => {
  try {
    const { name, quantity, threshold } = req.body

    const result = await db.query(`
      INSERT INTO Inventaire (nom_produit, quantite_disponible, seuil_critique) 
      VALUES ($1, $2, $3);
    `, [name, quantity, threshold])
    
    res.json(result.rows)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
});


// fonction pour supprimer un aliment (admin)
router.delete("/:id", async (req, res) => {
  try {
    const result = await db.query(`
      DELETE FROM Inventaire
      WHERE id_commande = $1
    `, [req.params.id])

    res.json(result.rows)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
});

module.exports = router;
