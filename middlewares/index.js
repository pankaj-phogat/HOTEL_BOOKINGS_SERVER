import expressJwt from 'express-jwt';

import Hotel from '../models/hotel';
export const requireSignIn=expressJwt({
    //secret, expiryDate
    secret : process.env.JWT_SECRET,
    algorithms : ["HS256"]
})

export const hotelOwner=async (req,res,next) => {
    const hotel=await Hotel.findById(req.params.hotelId).exec();
    console.log(hotel._id);
    // to use 3 equals use hotel.postedBy._id.toString() === req.user._id.to_String()
    let owner= hotel.postedBy._id == req.user._id;
    if(!owner){
        res.status(403).send("Unauthorized");
    }
    next();
}