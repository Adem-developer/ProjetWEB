const express = require("express");
const router = express.Router();
const db = require("../db")


//fonction pour avoir la liste des clients (admin)
router.get("/", async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM Clients')
    res.json(result.rows)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
});

// top des meilleurs clients (admin + client)
router.get("/top", async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        Clients.*
        ,RANK() OVER (ORDER BY COALESCE(subquery.total, 0) DESC) rank
      FROM Clients 
      LEFT JOIN (
        SELECT 
          id_client, 
          SUM(total_commande) total 
        FROM Commandes 
        WHERE statut = 'PAYE' 
        GROUP BY id_client  
      ) AS subquery ON Clients.id_client = subquery.id_client
      ORDER BY rank DESC;
    `)
    
    res.json(result.rows)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
});


//fonction pour ajouter un client (admin)
router.post("/", async (req, res) => {
  try {
    const { last_name, first_name, contact } = req.body;

    const result = await db.query(`
      INSERT INTO clients(nom, prenom, contact, points_fidelite) 
      VALUES ($1, $2, $3, 0);
    `, [last_name, first_name, contact])
    
    res.json(result.rows)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
});


//fonction pour supprimer un client (admin)
router.delete("/:id", async (req, res) => {
  try {
    const result = await db.query(`
      DELETE FROM Clients 
      WHERE id_client = $1
    `, [req.params.id])
    
    res.json(result.rows)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
});

module.exports = router;
