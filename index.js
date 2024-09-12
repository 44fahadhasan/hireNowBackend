// dependencies
const express = require("express");
require("dotenv").config();
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");

// create a express app
const app = express();

// port number init for remote server and localhost
const port = process.env.PORT || 5003;

// middleware of express
app.use(express.json());
app.use(
  cors({
    origin: ["http://localhost:5173", "https://hirenow.netlify.app"],
    credentials: true,
  })
);

// mongodb uri
const uri = `mongodb+srv://${process.env.BD_USER}:${process.env.DB_PASS}@clustercar.wslyx5y.mongodb.net/?retryWrites=true&w=majority&appName=ClusterCar`;

// create a mogno client
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // clear the code when deploy in remote server
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // code
  }
}
run().catch(console.log);

// server root path
app.get("/", (req, res) => {
  res.send("Wellcome to HireNow server");
});

// send a ping when server running
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
