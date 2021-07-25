import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
const { Schema }= mongoose;

const userSchema=new Schema({
    name : {
        type : String,
        trim : true,
        required : 'Name is required'
    },
    email : {
        type : String,
        trim : true,
        required : 'Email is required',
        unique : true
    },
    password : {
        type : String,
        required : true,
        min : 6,
        max : 64
    },
    stripe_account_id : '',
    stripe_seller : {},
    stripeSession : {},
},{ timestamps : true}
);

//bcrypt hash password
//Need to use middleware for that
//Should be done only in 2 cases
// 1. first time user is created/saved
// 2. user has updated the existing password
// using pre, it gets called before save
userSchema.pre('save', function(next){//make sure this callback fxn is not arrow function
    let user= this;
    if(user.isModified('password')){
        return bcrypt.hash(user.password,12,function(err,hash){//12 is salt -- 8/12/16 denoted how strong
            if(err){
                console.log('BCRYPT HASH ERROR : ',err);
                return next(err);
            }
            user.password=hash;
            return next();
        });
    }else{
        return next();
    }
})

//define methods thie way, make sure you use regular functions not arrow fxns
//Q. Why? --> cur arrow fxn don't have this!
userSchema.methods.comparePasswords= function(password,next){
    bcrypt.compare(password,this.password,function(err,match){
        if(err){
            console.log('COMPARE PASSWORD ERROR',err);
            return next(err,false);
        }
        //if no error we get null
        console.log("MATCH PASSWORD",match);
        return next(null,match);//true
    });   
}

export default mongoose.model('User',userSchema);