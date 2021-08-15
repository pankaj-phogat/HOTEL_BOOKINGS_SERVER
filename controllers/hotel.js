import Hotel from "../models/hotel";
import Order from '../models/order';
import fs from 'fs';

export const createHotel =async (req,res) => {
    //console.log('HOTEL CRAETE REQUEST');
    //console.log('req.fields',req.fields);
    //console.log('req.files',req.files);
    try{
        let fields=req.fields;
        let files=req.files;


        let hotel= new Hotel(fields);
        hotel.postedBy=req.user._id;
        //handle image, name depends on frontend---> was sent as name here
        if(files.image){
            hotel.image.data=fs.readFileSync(files.image.path);
            hotel.image.contentType=files.image.type;
        }
        hotel.save((err,result)=> {
            if(err){
                console.log('SAVING HOTEL ERROR',err);
                res.status(400).send("Error Saving");
            }
            res.json(result);
        })
    }catch(err){
        console.log(err);
        res.status(400).json({
            err : err.message
        });
    }
}


export const getHotels=async (req,res) => {
    // *postedBy is populated
    let all=await Hotel.find({})
                        .limit(24)//send only 24 records
                        .select('-image.data')
                        .populate('postedBy','_id name')//populate only _id and name to send only these
                        .exec();
    res.status(200).json(all);
}

export const getImage= async (req,res) => {
    let hotel = await Hotel.findById(req.params.hotelId).exec();
    if(hotel && hotel.image && hotel.image.data!==null){
        res.set('Content-Type',hotel.image.contentType);
        res.send(hotel.image.data);
    }
}

export const getSellerHotels=async (req,res) => {
    let all= await Hotel.find({postedBy : req.user._id})
                        .select('-image.data')
                        .populate('postedBy','_id name')
                        .exec();
    res.json(all);
}


export const deleteHotel= async (req,res) => {
    console.log(req.params.hotelId);
    let removed=await Hotel.findByIdAndDelete(req.params.hotelId)
                            .select('-image.data').exec();
    res.json(removed);
}

export const readHotel= async (req,res) => {
    let hotel=await Hotel.findById(req.params.hotelId)
                            .populate('postedBy','_id name')
                            .select('-image.data')
                            .exec();
    res.json(hotel);
}

export const updateHotel= async (req,res) => {
    try{
        let fields=req.fields;
        let files=req.files;

        let data= {...fields};
        if(files.image){
            let image={};
            image.data=fs.readFileSync(files.image.path);
            image.contentType=files.image.type;
            data.image=image;
        }
        console.log(data);
        let updatedHotel=await Hotel.findByIdAndUpdate(req.params.hotelId,data, { new : true })
                                    .select('-image.data').exec();
        res.json(updatedHotel);
    }catch(err){
        console.log(err);
        res.status(400).send('HOTEL UPDATE FAILED, TRY AGAIN');
    }
}


export const userHotelBookings= async (req,res) => {
    const all= await Order.find({orderedBy : req.user._id})
                    .select('session')
                    .populate('hotel','-image.data')
                    .populate('orderedBy','_id name')
                    .exec();
    res.json(all);
}

export const isAlreadyBooked= async (req,res) => {
    const hotelId=req.params.hotelId;
    //find orders of currently logged in user
    const userOrders= await Order.find({ orderedBy : req.user._id})
                            .select('hotel')
                            .exec();
    //check if hotelId is found in userOrders array
    //if found ==> already booked
    let ids=[];
    for(let i=0;i<userOrders.length;i++){
        ids.push(userOrders[i].hotel.toString());
    }

    res.json({
        ok : ids.includes(hotelId)
    })
}


export const searchListings=async (req,res) => {
    const {location, date, bed}=req.body;
    //console.log({location, date, bed});
    // const fromDate=date.split(",");
    //   toDate similar
    let result=await Hotel.find({/*from : {$gte : new Date()},*/ location})
                        .select('-image.data')
                        .exec();
    res.json(result);   
    /* for more specific end date we can do something like this as well
        let result= await Hotel.find({
            from : {$gte : new Date()},
            to : {$lte : to},
            location,
            bed
        })
    */
}
