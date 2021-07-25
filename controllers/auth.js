//const User=require('../models/users');
import User from '../models/users';
const jwt=require('jsonwebtoken');

export const register= async (req,res) => {
    console.log(req.body);
    const { name, email, password}=req.body;
    try{
        if(!name) res.status(400).send('Name is required');
        if(!password || password.length<6) res.status(400).send('Password is required and should be min of 6 characters');
        //mongoode will execute a query only if ther is callback or .then or .exec()
        let userExist= await User.findOne({email}).exec();
        if(userExist) return res.status(400).send('Email is already taken');
        //register
        const user=new User(req.body);
        await user.save();
        console.log('USER CREATED ',user);
        return res.json({ok : true});
    }catch(err){
        console.log('CREATE USER FAILED : ',err);
        return res.status(400).send('Error. Try again!');
    }
}

export const login =async (req,res) => {
    console.log(req.body);
    const {email,password}=req.body;
    try{
        //check is user exist
        let user=await User.findOne({email}).exec();
        //console.log('USER EXIST',user);
        if(!user) res.status(400).send('NO USER FOUND WITH THAT EMAIL',);
        //if found compare password
        user.comparePasswords(password, (err,match) => {
            console.log('COMPARE PASSWORD IN LOGIN ERROR',err);
            if(!match || err){
                return res.status(400).send('WRONG PASSWORD');
            }
            //console.log('GENERATE A TOKEN THEN SEND AS RESPONSE TO CLIENT');
            let token=jwt.sign({_id : user._id},process.env.JWT_SECRET,
                { expiresIn : '7d' });
            res.statusCode=200;
            res.setHeader('Content-Type','application/json');
            res.json({ token, user : {
                name : user.name,
                email : user.email,
                _id : user._id,
                createdAt : user.createdAt,
                updatedAt : user.updatedAt,
                stripe_account_id : user.stripe_account_id,
                stripe_seller : user.stripe_seller,
                stripeSession : user.stripeSession
                } 
            });
        })
    }catch(err){
        console.log('LOGIN ERROR',err);
        res.status(400).send('SignIn failed');
    }
}