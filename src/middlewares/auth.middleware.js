import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import  jwt  from "jsonwebtoken";
import { User } from "../models/user.model.js";

import dotenv from "dotenv";
dotenv.config();

export const verifyJWT = asyncHandler(async (req, res, next) => {

    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");

        if (!token) {
            throw new ApiError(401, "Unauthorized User's request");

        }

        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);


        const user = await User.findById({ _id: decodedToken._id }).select("-password -refreshTokens");

        req.user = user;
        next();

    } catch (error) {

        throw new ApiError(401, error.message || "Invalid Access Token")

    }
})

// normal way req.user = decodedToken (daldete aur user ka pura information uspe atatha)
// produnction way const user = await User.findById(_id : decodedToken._id).select("-password -refreshTokens") nikalte hain


// here using this middleware we are creating a object using req.user = user , in this req.user object we are passing the user , we have find him by findById 


// here we are authenticating the user based on the cookies , this is the middleware we are creating based on the cookie-parser were we have used in the app.use(cookie-parser()) and this cookie-parser in now available in the req 


// Scenario 2: Using Authorization Header
// You send a request with this header:
// Authorization: Bearer xyz789

// Code result: token = "xyz789"
// (removes "Bearer ")

// here we are removing the bearer from the header Bearer hai to remove karo "" empty 
