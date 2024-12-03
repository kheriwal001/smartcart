const mongoose = require("mongoose");


const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String
});

// Export the Users model
module.exports = mongoose.model("users", userSchema);
