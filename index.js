const express = require('express');
const cors = require('cors');
require('dotenv').config();
const port = process.env.PORT || 5000;
const app = express();
const { MongoClient, ServerApiVersion } = require('mongodb');

app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASS}@cluster0.s9tp4.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function runServer() {

    try {

        await client.connect();
        const AllProductsCollection = client.db("OurProducts").collection("AllProducts");


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