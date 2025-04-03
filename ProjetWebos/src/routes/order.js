const express = require("express");
const router = express.Router();
const db = require("../db")


/**
 * @swagger
 * /order/pending:
 *   get:
 *     summary: Récupérer les commandes en cours
 *     description: Récupère la liste des commandes dont le statut est "EN_COURS".
 *     tags:
 *       - Commandes
 *     responses:
 *       200:
 *         description: Liste des commandes en cours.
 *         content:
 *           application/json:
 *             example:
 *               id_commande: 11
 *               id_client: 5
 *               id_employe: 2
 *               date_commande: "2024-11-18T11:30:00.000Z"
 *               total_commande: 100
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Commande'
 *       500:
 *         description: Erreur serveur.
 */
router.get("/", async (req, res) => {
  try {
    const result = await db.query(`SELECT * FROM Commandes;`)
    res.json(result.rows)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
});


/**
 * @swagger
 * /order/pending:
 *   get:
 *     summary: Récupérer les commandes en cours
 *     description: Récupère la liste des commandes dont le statut est "EN_COURS".
 *     tags:
 *       - Commandes
 *     responses:
 *       200:
 *         description: Liste des commandes en cours.
 *         content:
 *           application/json:
 *             example:
 *               id_commande: 11
 *               id_client: 5
 *               id_employe: 2
 *               date_commande: "2024-11-18T11:30:00.000Z"
 *               total_commande: 100
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Commande'
 *       500:
 *         description: Erreur serveur.
 */
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


/**
 * @swagger
 * /order/done:
 *   get:
 *     summary: Récupérer les commandes passées
 *     description: Récupère la liste des commandes dont le statut n'est pas "EN_COURS".
 *     tags:
 *       - Commandes
 *     responses:
 *       200:
 *         description: Liste des commandes passées.
 *         content:
 *           application/json:
 *             example:
 *               id_commande: 11
 *               id_client: 5
 *               id_employe: 2
 *               date_commande: "2024-11-18T11:30:00.000Z"
 *               total_commande: 100
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Commande'
 *       500:
 *         description: Erreur serveur.
 */
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


/**
 * @swagger
 * /order/details/{id}:
 *   get:
 *     summary: Récupérer les détails d'une commande
 *     description: Récupère les détails d'une commande spécifique en utilisant son ID.
 *     tags:
 *       - Commandes
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID de la commande
 *     responses:
 *       200:
 *         description: Détails de la commande.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id_commande:
 *                   type: integer
 *                 id_client:
 *                   type: integer
 *                 id_employe:
 *                   type: integer
 *                 date_commande:
 *                   type: string
 *                 statut:
 *                   type: string
 *                 total_commande:
 *                   type: number
 *                 details:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id_plat:
 *                         type: integer
 *                       nom_plat:
 *                         type: string
 *                       description:
 *                         type: string
 *                       prix:
 *                         type: number
 *                       quantite:
 *                         type: integer
 *       404:
 *         description: Aucune commande trouvée avec l'ID donné.
 *       500:
 *         description: Erreur serveur.
 */
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


/**
 * @swagger
 * /order/status/{id}:
 *   put:
 *     summary: Modifier le statut d'une commande
 *     description: Met à jour le statut d'une commande spécifique en utilisant son ID.
 *     tags:
 *       - Commandes
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID de la commande
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             status: "PAYE"
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *     responses:
 *       200:
 *         description: Statut de la commande mis à jour.
 *       500:
 *         description: Erreur serveur.
 */
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


/**
 * @swagger
 * /order/:
 *   post:
 *     summary: Ajouter une nouvelle commande
 *     description: Ajoute une nouvelle commande à la base de données.
 *     tags:
 *       - Commandes
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             id_client: 1
 *             id_employe: 1
 *             total_commande: 100
 *           schema:
 *             type: object
 *             properties:
 *               id_client:
 *                 type: integer
 *               id_employe:
 *                 type: integer
 *               total_commande:
 *                 type: number
 *     responses:
 *       200:
 *         description: Commande ajoutée avec succès.
 *       500:
 *         description: Erreur serveur.
 */
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


/**
 * @swagger
 * /order/{id}:
 *   delete:
 *     summary: Supprimer une commande
 *     description: Supprime une commande spécifique en utilisant son ID.
 *     tags:
 *       - Commandes
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID de la commande
 *     responses:
 *       200:
 *         description: Commande supprimée avec succès.
 *       500:
 *         description: Erreur serveur.
 */
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


/**
 * @swagger
 * components:
 *   schemas:
 *     Commande:
 *       type: object
 *       properties:
 *         id_commande:
 *           type: integer
 *           description: ID unique de la commande
 *         id_client:
 *           type: integer
 *           description: ID du client qui a passé la commande
 *         id_employe:
 *           type: integer
 *           description: ID de l'employé qui a traité la commande
 *         date_commande:
 *           type: string
 *           format: date-time
 *           description: Date et heure de la commande
 *         statut:
 *           type: string
 *           description: Statut de la commande (EN_COURS, TERMINEE, etc.)
 *         total_commande:
 *           type: number
 *           description: Montant total de la commande
 *       example:
 *         id_commande: 1
 *         id_client: 101
 *         id_employe: 201
 *         date_commande: "2023-10-01T12:34:56Z"
 *         statut: "EN_COURS"
 *         total_commande: 50.75
 *     DetailCommande:
 *       type: object
 *       properties:
 *         id_plat:
 *           type: integer
 *           description: ID du plat
 *         nom_plat:
 *           type: string
 *           description: Nom du plat
 *         description:
 *           type: string
 *           description: Description du plat
 *         prix:
 *           type: number
 *           description: Prix du plat
 *         quantite:
 *           type: integer
 *           description: Quantité du plat commandée
 *       example:
 *         id_plat: 1
 *         nom_plat: "Pizza Margherita"
 *         description: "Pizza avec sauce tomate, mozzarella et basilic"
 *         prix: 12.50
 *         quantite: 2
 */

module.exports = router;
