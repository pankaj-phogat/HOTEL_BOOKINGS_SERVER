import express from 'express';// can use import export using esm package
import { readdirSync } from 'fs';
import cors from 'cors';
import mongoose from 'mongoose';
const morgan=require('morgan');
require('dotenv').config();


//db connection
mongoose.connect(process.env.DATABASE,{
    //use these otherwise you will get warnings
    useNewUrlParser : true,
    useFindAndModify : false,
    useUnifiedTopology : true,
    useCreateIndex : true
})
.then(() => {
    console.log('db connected');
})
.catch(err => console.log('db error : ',err));

const app=express();

//middlewares
app.use(cors());//make sure its on top of all middlewares
app.use(morgan("dev"));
app.use(express.json()); //otherwise app won't get any JSON data-----> similar to bodyParser

//route middlewares
readdirSync('./routes').map( (r) => app.use('/api',require(`./routes/${r}`)) );

const port=process.env.PORT || 8000;
app.listen(port, ()=> console.log(`server is running on port ${port}`));