const express = require("express");
const app = express();
const mongoose = require('mongoose');
const dotenv= require('dotenv');
const connectToDb = require('./config/db');
const Student= require('./model/Student')


const port = 3000;
dotenv.config();

app.use(express.json());


console.log(process.env.MONGO_URI);
app.get('/',(req,res)=>{
    res.send("Hello World");
})

app.post('/Students', async (req, res) => {
    const studentData = req.body;

    const newStudent = new Student(studentData);

    try {
        await newStudent.save();
        res.status(201).send(newStudent);
    } catch (error) {
        console.log("Validation failed:", error.message);
        res.status(400).send({ error: error.message });
    }
});
app.listen(port,()=>{
    connectToDb();
    console.log("rUNNING STABLY");
})