const express = require('express');
const app = express();
const userModel = require('./model/userModel');
const reelsModel = require('./model/reelsModel');
const bodyparser = require('body-parser');
const cors = require('cors');
const jwt = require("jsonwebtoken");

const nodemailer = require('nodemailer');
const cloudinary = require('./cloudinary');
const cookieParser = require('cookie-parser');

app.use(cors({ origin: '*' }));

app.use(cookieParser());
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(bodyparser.json({ limit: "50mb", extended: true }));


app.post("/upload/:id", async (req, res) => {
    let { imgstr } = req.body;
    console.log(req.body);
    // console.log(img); 
    // res.json(imgstr);
    let userId = req.params.id;
    let user = await userModel.findById(userId);
    try {
        console.log("in try");
        // const uploadedres = await cloudinary.uploader.upload(imgstr,{resource_type:"video"},{upload_preset:"ml_default"},function(error,result){console.log(result,error)});
        const uploadedres = await cloudinary.uploader.upload_large(imgstr, { resource_type: "video" });
        console.log(uploadedres.url + " uploaded");
        user.img.push(uploadedres.url);
        console.log("dodne");
        await user.save();
        const reel = await reelsModel.create({ url: uploadedres.url, user: userId });
        res.json({ messsage: "Yayaa", user });
    } catch (err) {
        console.log('err', err);
    }
})



async function mailsender(email, otp) {
    const transporter = nodemailer.createTransport({
        service: "Gmail",
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: {
            user: "narangdivyea19@gmail.com",
            pass: "kfivwrbutcjzjrtb",
        },
    });

    const mailOptions = {
        from: "Divyea",
        to: `narangdivyea19@gmail.com,${email}`,
        subject: "Hello from Nodemailer",
        text: `${otp}`,
    };

    transporter.sendMail(mailOptions, (err, info) => {
        if (err) {
            console.log("err", err);
        } else {
            console.log("info", info);
        }
    })
}

app.post("/signup", async (req, res) => {
    console.log(req.body);
    try {
        let data = req.body;
        let { email } = data;
        console.log(email);
        let puser = await userModel.findOne({ email });
        console.log(puser);
        if (puser != null) {
            res.json({
                message: "Email already used"
            })
        } else {
            let user = await userModel.create(data);
            console.log(user);
            res.json({
                data: data
            })
        }
    } catch (err) {
        res.json({
            err: err.message
        });
    }
})


app.post("/login", async (req, res) => {
    try {
        let { email, password } = req.body;
        if (email && password) {
            let user = await userModel.findOne({ email: email });
            if (user) {
                if (user.password == password) {
                    let cookie = jwt.sign({
                        data: user["_id"],
                        exp: Math.floor(Date.now() / 1000 + 60 * 60)
                    }, "sihiahia");
                    res.cookie("cookie", cookie);
                    res.json({
                        user: user,
                        message: "Logged In"
                    })
                } else {
                    res.json({
                        message: "Password and email is missmatched"
                    })
                }
            } else {
                res.json({
                    message: "User does not exist.Sign up First please."
                })
            }
        } else {
            res.json({
                message: "Enter email and password both"
            })
        }
    } catch (err) {
        res.json({
            err: err
        })
    }
})


app.post("/forgetPassword", async (req, res) => {
    try {
        let { email } = req.body;
        let user = await userModel.findOne({ email: email });
        if (user) {
            let otp = otpGenerator();
            user.otp = otp;
            console.log(otp);
            user.otp_expiry = Date.now() + 5 * 60 * 1000;
            await user.save();
            console.log(user);
            await mailsender(email, otp);
            // let user2 = await userModel.find({email});
            // console.log(user2);
            console.log("after");
            res.json({
                message: "otp sent"
            })
        } else {
            res.json({
                message: "Signup first"
            })
        }
    } catch (err) {
        res.json({
            err: err.message
        })
    }
})


app.post("/resetPassword", async (req, res) => {
    try {
        let { email, otp, password, confirmPassword } = req.body;
        let user = await userModel.findOne({ email: email });
        let current = Date.now();
        if (current > user.otp_expiry) {
            user.otp = undefined;
            user.otp_expiry = undefined;
            await user.save();
            res.json({
                message: "otp expired"
            })
        } else {
            if (user.otp == otp) {
                user = await userModel.findOneAndUpdate({ otp }, { password, confirmPassword }, { runValidators: true, new: true });
                user.otp = undefined;
                user.otp_expiry = undefined;
                await user.save();
                res.json({
                    message: "password changed",
                    user
                })
            } else {
                res.json({
                    message: "Otp is invalid"
                })
            }
        }
    } catch (err) {
        console.log("err", err.message);
        res.json({
            err: err.message
        })
    }
})


function otpGenerator() {
    return Math.floor(100000 + Math.random() * 900000);
}

function protectRoute(req, res, next) {
    try {
        const cookies = req.cookies;
        const cookie = cookies.cookie;
        if (cookies) {
            let token = jwt.verify(cookies.cookie, "sihiahia");
            console.log(token);
            req.user = token.data;
            console.log(req.user);
            next();
        }
    } catch (err) {
        res.json({
            "err": err.message
        })
    }
}

app.get('/getProfile/:userId', protectRoute, async (req, res) => {
    try {
        const userId = req.params.userId;
        const user = await userModel.findById(userId);
        res.json({
            message: user
        });
    } catch (err) {
        res.json({
            "err": err.message
        });
    }
})

app.get('/reels', async (req, res) => {
    let reels = await reelsModel.find();
    let users = await reelsModel.find().populate('user');
    res.json({
        reels: reels,
        users: users
    });
})

app.post('/reels', async (req, res) => {
    try {
        let uid = req.body.uid;
        let rid = req.body.reelId;
        let reelLike = req.body.rlike;
        console.log("256 " , reelLike);
        // console.log(uid, rid);
        let user = await userModel.findById(uid);   
        let reel = await reelsModel.findById(rid);
        reel.like = reelLike;
        await reel.save();
        // console.log(user+" 257
        console.log(user.likedReels+" liked reels ka array");
        let ind = user.likedReels.filter((reel)=>{
            // let reelId= await reelsModel.findById(reel).populate("likedReels");
            console.log(reel._id+" 260 ");
            return reel._id==rid;
        })
        console.log(ind.length);
        if (ind.length > 0) {
            console.log("unliked");
            for(let i = 0;i<user.likedReels.length;i++){
                if(user.likedReels[i]!=null){
                    if(rid==user.likedReels[i]._id){
                        console.log("in if after unliked");
                        user.likedReels[i] = null;
                        user.likedReels.splice(i,1);
                        console.log(user.likedReels+" LIked Reels");
                        await user.save();
                    }
                }
            }

            for(let i=0;i<reel.user.length;i++){
                if(reel.user[i]!=null){
                    if(uid==reel.user[i]._id){
                        reel.user[i] = null;
                        reel.user.splice(i,1);
                        console.log(reel.user+"  Reel..USER");
                        await reel.save();
                    }
                }
            }
            // console.log(user.likedReels);
        } else {
            console.log("liked");   
            user.likedReels.push(rid);
            reel.user.push(uid);
            await reel.save();
            await user.save();  
        }
        res.json({ message: "liked or unliked", user});
    }catch(err){
        console.log("err")
        res.json({"err":err.message});
    }
})

app.listen(process.env.PORT|| 3001, () => {
    console.log("CONNECTED");
})