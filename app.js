//PACKAGES
const express = require("express");
const app = express();
const mongoose = require('mongoose');
const dotenv= require('dotenv');
const connectToDb = require('./config/db');
const jwt = require('jsonwebtoken');
const cookieParser= require('cookie-parser');
const bcrypt= require('bcrypt');
// Add these at the top with other imports
const { 
Student,
  CurrentProgram,
  Degree,
  Specialization,
  Category,
  SGPA,
  Address 
} = require('./model/Student/Student'); // Adjust path
const port = 3000;
const router = require('router');

dotenv.config();

//MIDDLEWARE SETUP
app.use(express.json());
app.use(cookieParser());
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal server error' });
});

const StudentRoutes= require('./Routes/Student_Routes');

app.get('/',(req,res)=>{
    res.send("Hello World");
})

app.use("/Student",StudentRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!'
  });
});

// Handle 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;

app.listen(port,()=>{
    connectToDb();
    console.log("rUNNING STABLY");
})