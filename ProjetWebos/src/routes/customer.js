const express = require("express");
const router = express.Router();
const db = require("../db")


/**
 * @swagger
 * /customer:
 *   get:
 *     summary: Récupérer la liste des clients
 *     description: Récupère la liste complète des clients.
 *     tags:
 *       - Clients
 *     responses:
 *       200:
 *         description: Liste des clients.
 *         content:
 *           application/json:
 *             example:
 *               id_client: 1
 *               nom: "Doe"
 *               prenom: "John"
 *               contact: "john.doe@example.com"
 *               points_fidelite: 10
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Customer'
 *       500:
 *         description: Erreur serveur.
 */
router.get("/", async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM Clients')
    res.json(result.rows)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
});


/**
 * @swagger
 * /customer/top:
 *   get:
 *     summary: Récupérer les meilleurs clients
 *     description: Récupère la liste des clients classés par le montant total des commandes payées.
 *     tags:
 *       - Clients
 *     responses:
 *       200:
 *         description: Liste des meilleurs clients.
 *         content:
 *           application/json:
 *             example:
 *               id_client: 1
 *               nom: "Doe"
 *               prenom: "John"
 *               contact: "john.doe@example.com"
 *               points_fidelite: 10
 *               rank: 1
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Customer'
 *       500:
 *         description: Erreur serveur.
 */
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
      ORDER BY rank ASC;
    `)
    
    res.json(result.rows)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
});


/**
 * @swagger
 * /customer:
 *   post:
 *     summary: Ajouter un nouveau client
 *     description: Ajoute un nouveau client à la base de données.
 *     tags:
 *       - Clients
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/NewCustomer'
 *           example:
 *             last_name: "Bars"
 *             first_name: "Lenny"
 *             contact: "lenny@contact.com"
 *     responses:
 *       200:
 *         description: Client ajouté avec succès.
 *       500:
 *         description: Erreur serveur.
 */
router.post("/", async (req, res) => {
  try {
    console.log(req.body)
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


/**
 * @swagger
 * /customer/{id}:
 *   delete:
 *     summary: Supprimer un client
 *     description: Supprime un client spécifique en utilisant son ID.
 *     tags:
 *       - Clients
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID du client à supprimer
 *     responses:
 *       200:
 *         description: Client supprimé avec succès.
 *       500:
 *         description: Erreur serveur.
 */
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


/**
 * @swagger
 * components:
 *   schemas:
 *     Customer:
 *       type: object
 *       required:
 *         - id_client
 *         - nom
 *         - prenom
 *         - contact
 *       properties:
 *         id_client:
 *           type: integer
 *           description: ID unique du client
 *         nom:
 *           type: string
 *           description: Nom de famille du client
 *         prenom:
 *           type: string
 *           description: Prénom du client
 *         contact:
 *           type: string
 *           description: Informations de contact du client
 *       example:
 *         id_client: 1
 *         nom: Doe
 *         prenom: John
 *         contact: john.doe@example.com
 *     NewCustomer:
 *       type: object
 *       required:
 *         - nom
 *         - prenom
 *         - contact
 *       properties:
 *         nom:
 *           type: string
 *           description: Nom de famille du client
 *         prenom:
 *           type: string
 *           description: Prénom du client
 *         contact:
 *           type: string
 *           description: Informations de contact du client
 *       example:
 *         nom: Doe
 *         prenom: John
 *         contact: john.doe@example.com
 */


module.exports = router;
