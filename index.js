// dependencies
const express = require("express");
require("dotenv").config();
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const jwt = require("jsonwebtoken");

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

// customs middleware

// token validaton of logged user
const verifyToken = (req, res, next) => {
  const token = req.headers;

  if (!token.authorization) {
    return res.status(401).send({ message: "Token is null" });
  }

  const orginalToken = token.authorization.split(" ")[1];

  const secretKey = process.env.TOKEN_SECRET;

  jwt.verify(orginalToken, secretKey, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "Token not match" });
    }

    req.decoded = decoded;

    next();
  });
};

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

    // collections ........

    // job listings
    const jobListingsCollection = db.collection("jobListings");

    // users
    const usersCollection = db.collection("users");

    // applications
    const applicationsCollection = db.collection("applications");

    // jwt security api endpoints ........

    // when user login success then create a token and sent to client side
    app.post("/token", (req, res) => {
      const { email } = req.body;

      const payload = {
        email,
      };

      const secretKey = process.env.TOKEN_SECRET;

      const token = jwt.sign(payload, secretKey, {
        expiresIn: "365d",
      });

      res.send({ token });
    });

    // job listings api endpoints ........

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
    app.post("/jobs", verifyToken, async (req, res) => {
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

    // user authentication api endpoints ........

    // register as a new job seeker or employer
    app.post("/auth/register", async (req, res) => {
      const data = req.body;

      // check is user already registered
      const query = { email: data.email };

      const isRegistered = await usersCollection.findOne(query);

      if (isRegistered) {
        return res.send({
          message: "The user is already registered",
        });
      }

      const userDoc = {
        ...data,
      };

      const result = await usersCollection.insertOne(userDoc);

      res.send(result);
    });

    // get user profile details using jwt
    app.post("/auth/me", verifyToken, async (req, res) => {
      const { email } = req.body;

      // validated user checking
      if (req.decoded.email !== email) {
        return res.status(403).send({ message: "Forbidden access" });
      }

      const query = { email: email };

      const options = {
        projection: { _id: 0 },
      };

      const user = await usersCollection.findOne(query, options);

      res.send(user);
    });

    // applications api endpoints ........

    // fetch all applications
    app.get("/applications", verifyToken, async (req, res) => {
      const { email } = req.body;

      // validated user checking
      if (req.decoded.email !== email) {
        return res.status(403).send({ message: "Forbidden access" });
      }

      const applications = await applicationsCollection.find().toArray();

      res.send(applications);
    });

    // save a new applications (job seeker only)
    app.post("/applications", verifyToken, async (req, res) => {
      const data = req.body;

      const applicationDoc = { ...data };

      const result = await applicationsCollection.insertOne(applicationDoc);

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
