const express = require("express")
const db = require("./db")
const app = express()
const port = 3000

app.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM users')
    res.send(result.rows)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

const orderRouter = require("./routes/orders")
const otherRouter = require("./routes/other")
const customerRouter = require("./routes/customer")

app.use("/orders", orderRouter)
app.use("/other", otherRouter)
app.use("/customer", customerRouter)

app.listen(port);

/*
- fonction pour voir les commandes en cour (admin)
- fonction pour voir les commandes passé (admin)
- fonction pour voir les details d'une commande (admin + client)
- fonction pour avoir la liste des clients (admin)
- permettre de voir les plats disponible (admin + client)
- (mettre une commande en livré quand elle est faite) (admin + client)
- Liste d'attente des commandes effectué (admin + client)
- permettre de voir les produits à acheter pour refaire un plat épuisé (admin)
- top des meilleurs clients (admin + client)
- fonction pour modifier une commande (admin + client)
*/
