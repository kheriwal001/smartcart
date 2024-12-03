const express = require("express");
require("./db/config"); 
const mongoose = require("mongoose");
const User = require("./db/Users"); 
const Product = require("./db/product");
const Jwt = require('jsonwebtoken');
const cors = require("cors");

const jwtKey = 'e-comm';
const app = express();

app.use(cors());
app.use(express.json());

app.post("/register", async (req, res) => {
    
    try {
        let user = new User(req.body); 
        let result = await user.save();
        result = result.toObject();
        delete result.password; // Remove password from the response

       Jwt.sign({result},jwtKey,{expiresIn:"2h"},(err,token)=>{
        if(err){
            res.send({result:"something went wrong"});
        }
        res.send({result,auth:token});
       }) 
    } catch (error) {
        console.error("Registration error:", error);
        res.status(500).send({ error: "Registration failed. Please try again." }); 
    }
});

app.post("/login", async (req, res) => {
    if (req.body.password && req.body.email) {
        let user = await User.findOne(req.body).select("-password"); 
        if (user) {
            Jwt.sign({user},jwtKey,{expiresIn:"2h"},(err,token)=>{
                if(err){
                    res.send({result:"something went wrong"});
                }
                res.send({user,auth: token});
            })
        } else {
            res.status(404).send({ result: "No user found" }); // Updated status code for not found
        }
    } else {
        res.status(400).send({ result: "Invalid request: email and password required" }); // Improved error handling
    }
});

app.post("/add-product",verifyToken, async (req, res) => {
    try {
        let product = new Product(req.body);
        let result = await product.save(); 
        res.send(result);
    } catch (error) {
        console.error("Add product error:", error);
        res.status(500).send({ error: "Failed to add product" });
    }
});

app.get("/products",verifyToken, async (req, res) => {
    try {
        const prods = await Product.find(); 
        if (prods.length > 0) {
            res.send(prods);
        } else {
            res.send({ result: "No products found" });
        }
    } catch (error) {
        console.error("Get products error:", error);
        res.status(500).send({ error: "Error retrieving products" }); 
    }
});

app.delete("/product/:id",verifyToken, async (req, res) => {
    try {
        let result = await Product.deleteOne({ _id: req.params.id });
        if (result.deletedCount > 0) {
            res.send({ message: "Product deleted successfully" });
        } else {
            res.status(404).send({ message: "No product found with this ID" }); // Updated status code for not found
        }
    } catch (error) {
        console.error("Delete product error:", error);
        res.status(500).send({ error: "An error occurred while deleting the product" });
    }
});


app.get("/product/:id",verifyToken, async (req, res) => {
    try {
        const id = req.params.id;
        
        // Validate the ObjectId format
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).send({ error: "Invalid Product ID format" });
        }

        // Query the product by ID
        let result = await Product.findOne({ _id: id });
        
        if (result) {
            res.send(result);
        } else {
            res.status(404).send({ result: "No record found" });
        }
    } catch (error) {
        console.error("Get product error:", error);
        res.status(500).send({ error: "An error occurred while retrieving the product" });
    }
});

app.put("/product/:id",verifyToken, async (req, res) => {
    try {
        let result = await Product.updateOne({ _id: req.params.id }, { $set: req.body });
        if (result.nModified > 0) {
            res.send({ message: "Product updated successfully" });
        } else {
            res.status(404).send({ message: "No product found to update" }); // Updated status code for not found
        }
    } catch (error) {
        console.error("Update product error:", error);
        res.status(500).send({ error: "An error occurred while updating the product" });
    }
});

app.get('/search/:key',verifyToken, async (req, res) => {
    try {
        let result = await Product.find({
            "$or": [
                { name: { $regex: req.params.key, $options: 'i' } },
                { price: { $regex: req.params.key, $options: 'i' } },
                { category: { $regex: req.params.key, $options: 'i' } },
                { company: { $regex: req.params.key, $options: 'i' } }
            ]
        });

        if (result.length > 0) {
            res.send(result);
        } else {
            res.send({ message: "No products found" });
        }
    } catch (error) {
        console.error("Search products error:", error);
        res.status(500).send({ message: "Error retrieving products", error });
    }
});

function verifyToken(req, res, next) {
    let token = req.headers['authorization'];

    if (token) {
        // Directly split the token assuming the format is "Bearer <token>"
        token = token.split(" ")[1];
        console.warn("Extracted token:", token);
        Jwt.verify(token,jwtKey,(err,token)=>{
            if(err){
                res.status(401).send({result:"Please provide valid token"});
            }
            else{
                next();
            }
        })
        
    } else {
        // If no token is provided in the headers, send an error response
        res.status(403).send({ result: "Authorization token is required" });
    }
}


app.listen(5000, () => {
    console.log("Server is running on http://localhost:5000");
});
