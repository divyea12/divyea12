const mongoose = require('mongoose');
mongoose.connect('mongodb+srv://divyea:Abc123@cluster0.kuu2wrz.mongodb.net/?retryWrites=true&w=majority').then(()=>{
    console.log("CONNNNNN");
}).catch((err)=>{
    console.log("err",err);
})

let userSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true,
        unique:true
    },
    password:{
        type:String,
        required:true,
        unique:true
    },
    confirmPassword:{
        required:true,
        type:String,
        validate:{
            validator:function(){
                return this.password==this.confirmPassword
            },
            message:"Password doesnot match"
        }
    },
    role:{
        type:"String",
        default:"user"
    },
    otp:{
        type:String,
    },
    otp_expiry:{
        type:Date,
    },
    img:{
        type:[],
    },
    likedReels:{
        type:[mongoose.Schema.ObjectId],
        ref:"InstaReel",
        unique:true
    }
})
const userModel = mongoose.model("InstaUser",userSchema);
module.exports=userModel;