import express from 'express';
import formidable from 'express-formidable';

//controllers
import { createHotel, deleteHotel, getHotels, getImage, getSellerHotels, isAlreadyBooked, readHotel, updateHotel, userHotelBookings, searchListings } from '../controllers/hotel';

//middlewares
import { hotelOwner, requireSignIn } from '../middlewares';

const router =express.Router();
router.post('/create-hotel',requireSignIn,formidable(),createHotel);
router.get('/hotels',getHotels);
router.get('/hotel/image/:hotelId',getImage);
router.get('/seller-hotels',requireSignIn,getSellerHotels);
router.delete('/delete-hotel/:hotelId',requireSignIn,hotelOwner,deleteHotel);
router.get('/hotel/:hotelId',readHotel);
router.put('/update-hotel/:hotelId',requireSignIn,hotelOwner,formidable(),updateHotel);

router.get('/user-hotel-bookings',requireSignIn,userHotelBookings);
router.get('/is-already-booked/:hotelId',requireSignIn, isAlreadyBooked);
router.post('/search-listings',searchListings);

module.exports=router;