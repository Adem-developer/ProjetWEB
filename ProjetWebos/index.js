const express = require("express")
const app = express()
const cors = require('cors')
const bodyParser = require('body-parser')
const swaggerSetup = require('./src/swagger')
const port = 3000

app.use(bodyParser.json())
app.use(cors())

app.get('/', async (req, res) => {
  try {
    res.json({ message: "Welcome to Foody API" })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

const orderRouter = require("./src/routes/order")
const stockRouter = require("./src/routes/stock")
const customerRouter = require("./src/routes/customer")

app.use("/order", orderRouter)
app.use("/stock", stockRouter)
app.use("/customer", customerRouter)

swaggerSetup(app)

app.listen(port, () => {
  console.log(`Server is running on port ${port}`)
})
