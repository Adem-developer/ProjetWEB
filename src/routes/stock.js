const express = require("express");
const router = express.Router();
const db = require("../db")


/**
 * @swagger
 * /stock/:
 *   get:
 *     summary: Voir l'inventaire
 *     description: Récupère la liste complète des produits dans l'inventaire.
 *     tags:
 *       - Inventaire
 *     responses:
 *       200:
 *         description: Liste des produits dans l'inventaire.
 *         content:
 *           application/json:
 *             example:
 *               id_produit: 1
 *               nom_produit: "Tomate"
 *               quantite_disponible: 50
 *               seuil_critique: 10
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Produit'
 *       500:
 *         description: Erreur serveur.
 */
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


/**
 * @swagger
 * /stock/restock:
 *   get:
 *     summary: Voir les produits à réapprovisionner
 *     description: Récupère la liste des produits dont la quantité disponible est inférieure au seuil critique.
 *     tags:
 *       - Inventaire
 *     responses:
 *       200:
 *         description: Liste des produits à réapprovisionner.
 *         content:
 *           application/json:
 *             example:
 *               id_produit: 1
 *               nom_produit: "Tomate"
 *               quantite_disponible: 50
 *               seuil_critique: 10
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Produit'
 *       500:
 *         description: Erreur serveur.
 */
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


/**
 * @swagger
 * /stock/dish:
 *   get:
 *     summary: Voir les plats disponibles
 *     description: Récupère la liste des plats disponibles dans le menu.
 *     tags:
 *       - Inventaire
 *     responses:
 *       200:
 *         description: Liste des plats disponibles.
 *         content:
 *           application/json:
 *             example:
 *               id_plat: 1
 *               nom_plat: "Pizza Margherita"
 *               description: "Pizza avec sauce tomate, mozzarella et basilic"
 *               prix: 10
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Plat'
 *       500:
 *         description: Erreur serveur.
 */
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


/**
 * @swagger
 * /stock/{id}:
 *   put:
 *     summary: Mettre à jour la quantité d'un produit
 *     description: Met à jour la quantité disponible d'un produit spécifique en utilisant son ID.
 *     tags:
 *       - Inventaire
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID du produit
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               quantity:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Quantité du produit mise à jour.
 *       500:
 *         description: Erreur serveur.
 */
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


/**
 * @swagger
 * /stock/:
 *   post:
 *     summary: Ajouter un nouvel aliment
 *     description: Ajoute un nouvel aliment à l'inventaire.
 *     tags:
 *       - Inventaire
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             name: "Salade"
 *             quantity: 30
 *             threshold: 10
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 required: true
 *                 description: Nom de l'aliment
 *                 value: "Tomate"
 *               quantity:
 *                 type: integer
 *                 required: true
 *                 description: Quantité en stock
 *                 value: "Tomate"
 *               threshold:
 *                 type: integer
 *                 required: true
 *                 description: Quantité critique
 *                 value: "Tomate"
 *     responses:
 *       200:
 *         description: Aliment ajouté avec succès.
 *       500:
 *         description: Erreur serveur.
 */
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


/**
 * @swagger
 * /stock/{id}:
 *   delete:
 *     summary: Supprimer un aliment
 *     description: Supprime un aliment spécifique de l'inventaire en utilisant son ID.
 *     tags:
 *       - Inventaire
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID du produit
 *     responses:
 *       200:
 *         description: Aliment supprimé avec succès.
 *       500:
 *         description: Erreur serveur.
 */
router.delete("/:id", async (req, res) => {
  try {
    const result = await db.query(`
      DELETE FROM Inventaire
      WHERE id_produit = $1
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
 *     Produit:
 *       type: object
 *       properties:
 *         id_produit:
 *           type: integer
 *           description: ID unique du produit
 *         nom_produit:
 *           type: string
 *           description: Nom du produit
 *         quantite_disponible:
 *           type: integer
 *           description: Quantité disponible du produit
 *         seuil_critique:
 *           type: integer
 *           description: Seuil critique pour le réapprovisionnement
 *       example:
 *         id_produit: 1
 *         nom_produit: "Tomate"
 *         quantite_disponible: 50
 *         seuil_critique: 10
 *     Plat:
 *       type: object
 *       properties:
 *         id_plat:
 *           type: integer
 *           description: ID unique du plat
 *         nom_plat:
 *           type: string
 *           description: Nom du plat
 *         description:
 *           type: string
 *           description: Description du plat
 *         prix:
 *           type: number
 *           description: Prix du plat
 *       example:
 *         id_plat: 1
 *         nom_plat: "Pizza Margherita"
 *         description: "Pizza avec sauce tomate, mozzarella et basilic"
 *         prix: 12.50
 */

module.exports = router;
