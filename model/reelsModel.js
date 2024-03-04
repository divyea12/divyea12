const mongoose = require('mongoose');
mongoose.connect('mongodb+srv://divyea:Abc123@cluster0.kuu2wrz.mongodb.net/?retryWrites=true&w=majority').then(()=>{
    console.log("CONNNNNN");
}).catch((err)=>{
    console.log("err",err);
})
const reelsSchema = new mongoose.Schema({
    url:{
        type:String,
    },
    user:{
        type:[mongoose.Schema.ObjectId],
        ref:'InstaUser',
        unique:true
    },
    like:{
        type:Number,
        default:0
    },
})

const reelsModel = mongoose.model("InstaReel",reelsSchema);
module.exports = reelsModel;