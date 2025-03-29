const express = require("express")
const app = express()
const bodyParser = require('body-parser')
const swaggerSetup = require('./swagger')
const port = 3000

app.use(bodyParser.json());

app.get('/', async (req, res) => {
  try {
    res.json({ message: "Welcome to Foody API" })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

const orderRouter = require("./routes/order")
const stockRouter = require("./routes/stock")
const customerRouter = require("./routes/customer")

app.use("/order", orderRouter)
app.use("/stock", stockRouter)
app.use("/customer", customerRouter)

swaggerSetup(app)

app.listen(port)


/*
- fonction pour avoir la liste des clients (admin)
- top des meilleurs clients (admin + client)

- permettre de voir les plats disponible (admin + client)
- permettre de voir les produits à acheter pour refaire un plat épuisé (admin)

- fonction pour voir les commandes en cour (admin)
- fonction pour voir les commandes passé (admin)
- fonction pour voir les details d'une commande (admin + client)
- (mettre une commande en livré quand elle est faite) (admin + client)
- Liste d'attente des commandes effectué (admin + client)
- fonction pour modifier une commande (admin + client)
*/
