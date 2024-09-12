// dependencies
const express = require("express");
require("dotenv").config();
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

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
    // create a database
    const db = client.db("hireNow");

    // collections
    // job listings
    const jobListingsCollection = db.collection("jobListings");

    // job listings api endpoints

    // fetch all job listings
    app.get("/jobs", async (req, res) => {
      const jobListings = await jobListingsCollection.find().toArray();

      res.send(jobListings);
    });

    // fetch a single job
    app.get("/jobs/:id", async (req, res) => {
      const { id } = req.params;

      const query = { _id: new ObjectId(id) };

      const job = await jobListingsCollection.findOne(query);

      res.send(job);
    });

    // create a new job (employer only)
    app.post("/jobs", async (req, res) => {
      const data = req.body;

      const newJobDoc = {
        ...data,
        postedAt: Date.now(),
      };

      const result = await jobListingsCollection.insertOne(newJobDoc);

      res.send(result);
    });

    // update a job listing
    app.put("/jobs/:id", async (req, res) => {
      const { id } = req.params;
      const data = req.body;

      const filter = { _id: new ObjectId(id) };

      const jobUpdateDoc = {
        $set: { ...data },
      };

      const result = await jobListingsCollection.updateOne(
        filter,
        jobUpdateDoc
      );

      res.send(result);
    });

    // delete a job listing
    app.delete("/jobs/:id", async (req, res) => {
      const { id } = req.params;

      const filter = {
        _id: new ObjectId(id),
      };

      const result = await jobListingsCollection.deleteOne(filter);

      res.send(result);
    });

    // ..................
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
