//PACKAGES
const express = require("express");
const app = express();
const mongoose = require('mongoose');
const dotenv= require('dotenv');
const connectToDb = require('./config/db');
const Studentmodel= require('./model/Student/Student');
const jwt = require('jsonwebtoken');
const cookieParser= require('cookie-parser');
const bcrypt= require('bcrypt');

//PORT
const port = 3000;

dotenv.config();

//MIDDLEWARE SETUP
app.use(express.json());
app.use(cookieParser());


app.get('/',(req,res)=>{
    res.send("Hello World");
})


//BASIC AUTH SET UP
const generateToken = (createdStudent) => {
  return jwt.sign({email: createdStudent.email, id: createdStudent._id},process.env.JWT_SECRET),{
    expiresIn:'1d'
  };
}

app.post('/api/register-Student', async (req, res) => {
    const { name, email, password, course } = req.body;

    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const createdStudent = await Studentmodel.create({
            name,
            email,
            password: hashedPassword,
            course
        });

       let token = generateToken(createdStudent);
        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production"
        });

        res.status(201).send(createdStudent);
    } catch (error) {
        console.error("Registration error:", error.message);
        res.status(400).send({ error: error.message });
    }
});

app.post('/api/login-Students',async (req,res) => {
  try{
    let{email,password}= req.body;
    let Student = await Studentmodel.findOne({email:email});
    if(!Student){
        res.send("Email or password is incorrect");
    } bcrypt.compare(password,Student.password, async  function(err,result)  {
        if(result){
            let token =generateToken(Student);
                 res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV != "production"
      });

      res.status(200).send({ message: "Login successful", token });
        }
        else{
            res.send("Incorrect password");
        }
    })
  }catch(err){
    console.log(err.message);
  }
})


app.post('/api/logout-Student',(req,res) => {
  res.cookie("token","");
}
)

app.listen(port,()=>{
    connectToDb();
    console.log("rUNNING STABLY");
})