import mongoose , {isValidObjectId} from "mongoose";
import { Tweet } from "../models/tweet.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";



const createTweet = asyncHandler( async ( req , res)=>{
    // take the content from frontend
    // check if the content is valid or not 
    // now fetched the loggedIn user from middleware using req.user._id
    //  now push the content  to the content field 
    // and push the user to the owner field 


    const {tweet} = req.body;

    if(!tweet){
        throw new ApiError(400 , "The tweet is empty can't proceed further");
    }

    const owner = req.user._id;

    if(!owner){
        throw new ApiError(404,"You are not allowed to tweet becoz you are not loggedIn")
    }

    const tweetResponse = await Tweet.create(
        {
            content : tweet,
            owner : owner,
        }
)

     if(!tweetResponse){
        throw new ApiError(404 , "Error while creating a tweet");
     }

     res.status(200)
     .json(new ApiResponse(200 , tweetResponse , "Tweet created successfully"));
})


const getUserTweets = asyncHandler ( async ( req , res)=>{
//    using aggregation we match the user from the middleware 


     const {userId} = req.params;
     if(!userId){
        throw new ApiError(404, "the TweerID is not available");
    }
  const user = await Tweet.aggregate([
    {
        $match : {
            owner : new mongoose.Types.ObjectId(userId),
        }
    },
    {
        $lookup : {
            from : "users",
            localField : "owner",
            foreignField : "_id",
            as : "userTweet",
        }
    },
    {
            $unwind : "$userTweet"
    },
    {
        $project : {
            "userTweet.username" : 1,
            "userTweet.email" : 1,
            "userTweet.avatar" : 1,
         
            content : 1,
        }
    }
  ])

  console.log("user get" , user)

  if(!user.length){
    throw new ApiError(404 , "Failed to fetch the user's tweet");
  }

  res.status(200)
  .json(new ApiResponse(200 , user , "Users tweets fetched successfully"))
    
})

const updateTweet = asyncHandler( async ( req, res)=>{
    // first we get the tweet from the frontend 
    // check if the tweet came or not 
    // now using the params id we get the tweet    

    const {newTweet} = req.body;

    const {tweetId} = req.params;

    if(!newTweet){
        throw new ApiError(404 , "the updated tweet is not came");
    }

    if(!tweetId){
        throw new ApiError(404, "the userId is not available");
    }
    
    console.log(tweetId);

 const user = await Tweet.findByIdAndUpdate({_id : tweetId},
    {
        $set : {
            content : newTweet,
        },
        
    },
    {
        new : true,
    } 
 )
    
    res.status(200).json(new ApiResponse(200 , user , "Users tweet updated successfully"))
})
 
const deleteTweet = asyncHandler( async ( req , res)=>{
    // first get tweet id from params 
    // check if the tweet id is came or not 
    // if the use findbyId and delete the tweet 

    const {tweetId} = req.params;
    if(!tweetId){
        throw new ApiError(404 , "Tweet Id is not available");
    }

    const deletedTweet = await Tweet.findByIdAndDelete({_id : tweetId});

    if(!deletedTweet){
      throw new ApiError(404 , "The Tweet is not deleted due to internal issuse")
    }

    res.status(200).json(new ApiResponse(200 , deletedTweet , "The Tweet deleted Successfully"));
})

const getSpecificTweet = asyncHandler( async ( req , res)=>{

    // if i want to get the specific tweet , i need the Id of that 
    // first get the Id of the tweet from req.params and use the aggregation to match it 
    

    const {tweetId} = req.params;
    if(!tweetId){
        throw new ApiError(404 , "The Tweet ID is not available")
    }

    const specificTweet = await Tweet.aggregate([
        {
            $match : {
                _id : new mongoose.Types.ObjectId(tweetId),
            }
        },
        {
            $lookup : {
                from : "users",
                localField : "owner",
                foreignField : "_id",
                as : "specificUserTweet",
            }
        },
        {
            $project : {
                content : 1,
                owner : 1,
                "specificUserTweet.username" : 1,
                "specificUserTweet.avatar" : 1,
                "specificUserTweet.email" : 1,
            }
        }

    ])

    if(!specificTweet.length){
            throw new ApiError(404, "Cann't Fetch the specfic user Tweet");
    }

    res.status(200).json(new ApiResponse(200 , specificTweet , "Successfully fetched the specific user tweet"));
})


export {createTweet , getUserTweets , updateTweet , deleteTweet , getSpecificTweet}