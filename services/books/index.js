const express = require("express");
const fs = require("fs-extra");
const shortid = require("shortid");
const { MongoClient, ObjectID } = require("mongodb");
const fetch = require("node-fetch");

const mongoServerURL = "mongodb://localhost:27017";

getStudents = async (filter = {}) => {
  try {
    const mongo = await MongoClient.connect(mongoServerURL, {
      useNewUrlParser: true
    });

    const collection = mongo.db("students").collection("studentData");
    const students = collection.find(filter).toArray();
    return students ? students : [];
  } catch (error) {
    console.log(error);
  }
};

const router = express.Router();

router.get("/checkemail", async (req, res) => {
  const students = await getStudents(req.query);
  students.length ? res.send({ isThere: true }) : res.send({ isThere: false });
});

router.get("/", async (req, res) => {
  const students = await getStudents(req.query);
  console.log(students[0].surname);
  res.send(students);
});

router.get("/:id", async (req, res) => {
  try {
    const book = await getStudents({ _id: new ObjectID(req.params.id) });
    res.send(book);
  } catch (error) {}
});

router.post("/", async (req, res) => {
  req.body.hasOwnProperty("email")
    ? fetch(
        "http://www.localhost:3450/books/checkemail?email=" + req.body.email
      )
        .then(res => {
          //non riesco ad entrare neanche qui req.body.email è giusto,
          //fetch da postMan a quell'indirizzo worka
          console.log(res);
          if (res.ok) {
            return res.json();
          } else throw res.statusText;
        })
        .then(async json => {
          console.log(json);
          if (!json.isThere) {
            console.log(json);
            try {
              const mongo = await MongoClient.connect(mongoServerURL, {
                useNewUrlParser: true
              });

              const collection = await mongo
                .db("students")
                .collection("studentData");
              const { insertedId } = collection.insertOne(req.body);
              res.send(insertedId);
            } catch (error) {
              res.send(error);
            }
          } else res.send("Email already in use");
        })
        .catch(err => res.send("Email already in use(in the catch)")) //esco sempre qui
    : res.status(400).send("missing email field");
});

router.put("/:id", async (req, res) => {
  try {
    const mongo = await MongoClient.connect(mongoServerURL, {
      useNewUrlParser: true
    });

    const collection = mongo.db("students").collection("studentData");

    const { modifiedCount } = await collection.updateOne(
      { _id: new ObjectID(req.params.id) },
      { $set: { name: `${req.body.name}` } }
    );

    if (modifiedCount > 0) {
      res.send("OK");
    } else {
      res.send("NOTHING TO MODIFY");
    }
  } catch (error) {}
});

router.delete("/:id", async (req, res) => {
  try {
    const mongo = await MongoClient.connect(mongoServerURL, {
      useNewUrlParser: true
    });
    const collection = mongo.db("students").collection("studentData");
    const { deletedCount } = await collection.deleteOne({
      _id: new ObjectID(req.params.id)
    });
    if (deletedCount > 0) {
      res.send("OK");
    } else {
      res.send("NOTHING TO DELETE");
    }
  } catch (error) {}
});

module.exports = router;
