const express = require('express');
const cors = require('cors');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const port = process.env.PORT || 5000;
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const query = require('express/lib/middleware/query');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASS}@cluster0.s9tp4.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });




function verifyJWT(req, res, next) {

    const authHeader = req?.headers?.authorization;


    if (!authHeader) {
        return res.status(401).send({ message: "Unauthorize access" });
    }
    const token = authHeader.split(' ')[1];

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {

        if (err) {
            return res.status(403).send({ message: 'Forbidden Access' })
        }
        req.decoded = decoded;
        next();

    });

}






async function runServer() {

    try {

        await client.connect();
        const AllProductsCollection = client.db("OurProducts").collection("AllProducts");
        const ordersCollection = client.db("ordersData").collection("orders");
        const usersCollection = client.db("usersData").collection("users");
        const reviewsCollection = client.db("usersData").collection("reviews");


        // verifyAdmin

        const verifyAdmin = async (req, res, next) => {
            const requester = req.decoded.email;
            console.log(requester);
            const requesterAccount = await usersCollection.findOne({ UserEmail: requester });
            if (requesterAccount?.role === 'Admin') {
                next();
            } else {
                return res.status(403).send({ message: 'Forbidden access' });
            }
        }


        //get all products what we Manufacturer
        app.get('/allProducts', async (req, res) => {

            const data = await AllProductsCollection.find({}).toArray();

            res.send(data)
        })

        //post a product
        app.post('/allProducts', verifyJWT, async (req, res) => {
            const product = req.body;

            const result = await AllProductsCollection.insertOne(product);
            res.send(result)
        })

        //post a product
        app.delete('/allProducts/:id', verifyJWT, async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const result = await AllProductsCollection.deleteOne(query);
            res.send(result)
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
            // console.log(orderData);
        })

        //Create an user
        app.put('/Login/:email', async (req, res) => {
            const email = req.params.email;
            const user = req.body;
            const filter = { UserEmail: email }
            const options = { upsert: true };
            const updateDoc = {
                $set: user,
            };

            console.log(filter);
            const result = await usersCollection.updateOne(filter, updateDoc, options);

            const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1d' });

            res.send({ result, token });

        })

        //get an user
        app.get('/user/:email', verifyJWT, async (req, res) => {
            const email = req.params.email;
            const query = { UserEmail: email }
            const userDb = await usersCollection.findOne(query);
            res.send(userDb);

        })

        //get all user
        app.get('/userAll', verifyJWT, async (req, res) => {
            const userDb = await usersCollection.find({}).toArray();
            res.send(userDb);
        })

        //get products by user email
        app.get('/ordersByUser/:email', verifyJWT, async (req, res) => {
            const email = req.params.email;
            const query = { BuyerEmail: email }
            const result = await ordersCollection.find(query).toArray();
            res.send(result)
        })


        //get products by user email
        app.get('/ordersByUser', verifyJWT, async (req, res) => {

            const result = await ordersCollection.find({}).toArray();
            res.send(result)
        })

        //Delete a product by id
        app.delete('/deleteMyOrder/:id', verifyJWT, async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const data = await ordersCollection.deleteOne(query);
            res.send(data)
        })

        //update user 
        app.put('/ordersUpdate/:id', async (req, res) => {
            const id = req.params.id;
            const payData = req.body;
            const filter = { _id: ObjectId(id) }
            const options = { upsert: true };
            const updateDoc = {
                $set: payData,
            };

            // console.log('payData', payData);
            // console.log('id', id);

            const result = await ordersCollection.updateOne(filter, updateDoc, options);
            res.send(result);
        })


        //increase and decrease a product Quantity by id
        app.put('/updateQuantity/:id', async (req, res) => {
            const id = req.params.id;
            const newQuantity = req.body;
            const filter = { _id: ObjectId(id) };
            const option = { upsert: true };
            const updateDoc = {
                $set: newQuantity
            }
            console.log(id);
            console.log('update', updateDoc);

            const result = await AllProductsCollection.updateOne(filter, updateDoc, option);
            res.send(result)
        });

        app.put('/updateShipped/:id', verifyJWT, verifyAdmin, async (req, res) => {
            const id = req.params.id;
            const Shipped = req.body;
            const filter = { _id: ObjectId(id) };
            const option = { upsert: true };
            const updateDoc = {
                $set: Shipped
            }
            console.log(id);
            console.log('update', updateDoc);

            const result = await ordersCollection.updateOne(filter, updateDoc, option);
            res.send(result)
        });

        app.post('/addReview', verifyJWT, async (req, res) => {
            const review = req.body;

            const result = await reviewsCollection.insertOne(review);

            res.send(result)

        })


        // users reviews
        app.get('/getReview/:email', async (req, res) => {
            const userEmail = req.params.email;

            const query = { userEmail: userEmail }

            const result = await reviewsCollection.find(query).toArray();

            res.send(result)

        })

        // get random 3 reviews for home page
        app.get('/getReviewLimit/:limit', async (req, res) => {
            const limit = req.params.limit;
            const result = await reviewsCollection.find({}).limit(+limit).toArray();
            res.send(result)


        })




        //payment api for card .
        app.post("/create-payment-intent", async (req, res) => {
            const product = req.body;
            const price = product.price;
            const amount = price * 100;

            // Create a PaymentIntent with the order amount and currency
            const paymentIntent = await stripe.paymentIntents.create({
                amount: amount,
                currency: "usd",
                payment_method_types: ['card']
            });
            res.send({ clientSecret: paymentIntent.client_secret })
        });

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