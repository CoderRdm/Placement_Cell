const mongoose = require('mongoose');
function connectToDb(){
    mongoose.connect(process.env.MONGO_URI).then(
        () => {
            console.log("connected");
        }
    ).catch(
        () => {
      console.log("Failed");
    }
    )
}

module.exports= connectToDb;