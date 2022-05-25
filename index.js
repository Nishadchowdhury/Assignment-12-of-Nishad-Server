const express = require('express');
const cors = require('cors');
require('dotenv').config();
const port = process.env.PORT || 5000;
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const query = require('express/lib/middleware/query');

app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASS}@cluster0.s9tp4.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function runServer() {

    try {

        await client.connect();
        const AllProductsCollection = client.db("OurProducts").collection("AllProducts");
        const ordersCollection = client.db("ordersData").collection("orders");
        const usersCollection = client.db("usersData").collection("users");


        //get all products what we Manufacturer
        app.get('/allProducts', async (req, res) => {

            const data = await AllProductsCollection.find({}).toArray();

            res.send(data)
        })


        //get limited products
        app.get('/ProductsLimit', async (req, res) => {

            const total = req.query.total;

            const data = await AllProductsCollection.find({}).limit(+total).toArray();

            res.send(data)
        })

        //get single product bt id
        app.get('/ProductSingle/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const data = await AllProductsCollection.findOne(query);
            res.send(data)
        })

        //place a Order
        app.post('/addOrder', async (req, res) => {
            const orderData = req.body;
            const result = await ordersCollection.insertOne(orderData);
            res.send(result);
            console.log(orderData);
        })

        //Create an user
        app.put('/Login', async (req, res) => {
            const email = req.body.email;
            const user = req.body;
            const filter = { UserEmail: email }
            const options = { upsert: true };
            const updateDoc = {
                $set: user,
            };

            const result = await usersCollection.updateOne(filter, updateDoc, options);

            // const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '10d' });

            res.send({ result, token: 1 });

        })

        //get products by user email
        app.get('/ordersByUser/:email', async (req, res) => {
            const email = req.params.email;
            const query = { BuyerEmail: email }
            const result = await ordersCollection.find(query).toArray();
            res.send(result)
        })




    } finally {

    }


}

runServer().catch(console.dir);


//root of the server
app.get('/', async (req, res) => {
    res.send('server is running Laparts in port ' + port)
})

app.listen(port, () => {
    console.log(`running the server in port ${port}`);
    // console.log(uri);
})