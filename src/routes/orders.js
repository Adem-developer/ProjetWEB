const express = require("express");
const router = express.Router();
const db = require("../db")


// fonction pour voir les commandes en cours (admin)
router.get("/pending", async (req, res) => {
  try {
    const result = await db.query(`
      SELECT id_commande, id_client, id_employe, date_commande, total_commande
      FROM Commandes 
      WHERE statut = 'EN_COURS';
    `)
    res.json(result.rows)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
});

// fonction pour voir les commandes passées (admin)
router.get("/done", async (req, res) => {
  try {
    const result = await db.query(`
      SELECT * 
      FROM Commandes 
      WHERE statut <> 'EN_COURS';
    `)
    res.json(result.rows)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
});

//fonction pour voir les détails d'une commande (admin + client)
router.get("/details/:id", async (req, res) => {
  try {
    const result_order = await db.query(`
      SELECT *
      FROM Commandes 
      WHERE id_commande = $1;
    `, [req.params.id])

    const result_details = await db.query(`
      SELECT 
        m.id_plat
        ,m.nom_plat
        ,m.description
        ,m.prix
        ,d.quantite 
      FROM Details_Commande d
        LEFT JOIN Menus m ON d.id_plat = m.id_plat
      WHERE d.id_commande = $1;
    `, [req.params.id])

    let order = result_order.rows[0]

    if (order === undefined) {
      res.status(404).json({ message: "No order has the given id" })
      return
    }

    order.details = result_details.rows

    res.json(order)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
});


// fonction pour modifier le statut d'une commande (admin)
router.put("/status/:id", async (req, res) => {
  try {
    const { status } = req.body

    const result = await db.query(`
      UPDATE Commandes
      SET statut = $1
      WHERE id_commande = $2;
    `, [status, req.params.id])
    
    res.json(result.rows)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
});


// fonction pour ajouter une commande (admin)
router.post("/", async (req, res) => {
  try {
    const { id_client, id_employe, total_commande } = req.body

    const result = await db.query(`
      INSERT INTO Commandes (id_client, id_employe, date_commande, statut, total_commande) 
      VALUES ($1, $2, NOW(), 'EN_COURS', $3);
    `, [id_client, id_employe, total_commande])
    
    res.json(result.rows)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
});


// fonction pour supprimer une commande (admin)
router.delete("/:id", async (req, res) => {
  try {
    const result = await db.query(`
      DELETE FROM Commandes 
      WHERE id_commande = $1
    `, [req.params.id])

    res.json(result.rows)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
});

module.exports = router;
