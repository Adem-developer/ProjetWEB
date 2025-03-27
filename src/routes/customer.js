const express = require("express");
const router = express.Router();
const db = require("../db")


router.get("/", async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM Clients')
    res.send(result.rows)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
});

router.get("/top", async (req, res) => {
  try {
    const result = await db.query(
      `
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
      `
    )
    res.send(result.rows)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
});

module.exports = router;

/*
- fonction pour avoir la liste des clients (admin)
- top des meilleurs clients (admin + client)
*/