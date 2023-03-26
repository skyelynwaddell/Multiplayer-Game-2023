const mongoose = require("mongoose")
//data to save in user database
const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String,
    opt : String,
    confirmed: String,
    color: String,
    x: Number,
    y: Number,
    room: String,
})
module.exports = mongoose.model("User",userSchema)