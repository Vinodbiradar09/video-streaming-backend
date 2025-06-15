import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import mongoose, {isValidObjectId} from "mongoose";
import {Like} from "../models/likes.model.js";
import { Video } from "../models/video.model.js";
import { Comment } from "../models/comment.model.js";
import { Tweet } from "../models/tweet.model.js";

 const toggleVideoLike = asyncHandler(async (req, res) => {
 
    // first get videoId , check it ,
    // get user ,check it 
    // find the video , check it 
    // now find the like exist or not , if exists remove not means add 
    const {videoId} = req.params;
    if(!videoId){
        throw new ApiError(404 , "videoId is empty or Invalid");
    }

    const userId = req.user._id;

    if(!userId){
        throw new ApiError(404 , "Please login to like the video");
    }

    const video = await Video.findById(videoId);

    if(!video){
        throw new ApiError(404 , "Video Not Found");
    }

    const existingLike = await Like.findOne({
        video : videoId,
        owner : userId,
    })
let isLiked ;
let message;
    if(existingLike){
        await Like.findByIdAndDelete(
           existingLike._id
        )

        isLiked = false,
        message = "Successfully removed the like"
    }
    else {
        await Like.create({
            video : videoId,
            owner : userId,
        })

        isLiked = true,
        message = "Successfully Liked the Video"
    }

    let totalLikes = await Like.countDocuments({video : videoId})

    return res.status(200)
    .json(new ApiResponse(200 , {isLiked , videoId , totalLikes} , message , "Successfully liked the video"));
});


const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    const userId = req.user._id;

    console.log("com" , commentId);
    console.log("user" , userId);

 
    if (!commentId || !mongoose.isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid commentId");
    }

    if (!userId) {
        throw new ApiError(401, "Please login");
    }

 
    const comment = await Comment.findById(commentId);
    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }

    const existingLike = await Like.findOne({
        comment: commentId,
        owner: userId
    });

    let isLiked;
    let message;

    if (existingLike) {

        await Like.findByIdAndDelete(existingLike._id);
        isLiked = false;
        message = "Unliked successfully";
    } else {

        await Like.create({
            comment: commentId,  
            owner: userId
        });
        isLiked = true;
        message = "Liked successfully";
    }

  
    const countLikes = await Like.countDocuments({ comment: commentId });

    return res.status(200).json(
        new ApiResponse(200, {
            isLiked,
            commentId,
            countLikes
        }, message)
    );
});

const toggleTweetLike = asyncHandler ( async ( req , res)=>{
    const {tweetId} = req.params;
    if(!tweetId){
        throw new ApiError(404 , "Invalid TweetId or Empty");
    }

    const userId = req.user._id;

    if(!userId){
        throw new ApiError(404 , "Please LogIn to like the tweet");
    }

    const tweet = await Tweet.findById(tweetId);

    if(!tweet){
        throw new ApiError(404 , "Tweet Not Found Sorry 😔");
    }


    console.log("com" , tweetId);
    console.log("usersn" , userId);

    const existingLike = await Like.findOne({
        tweet : tweetId,
        owner : userId,
    })

    let isLiked;
    let message;

    if(existingLike){
        await Like.findByIdAndDelete(existingLike._id)

        isLiked = false,
        message = "Like removed successfully"
    }
    else {
        await Like.create({
            tweet : tweetId,
            owner : userId,
        })

        isLiked = true,
        message = "Liked SuccessFully"
    }

    const totalLikes = await Like.countDocuments({ tweet : tweetId});

    res.status(200)
    .json(new ApiResponse(200 , {isLiked , tweetId , totalLikes} , message));
})

const getDetailsOfOwnerAndVideoDetailsForVideo = asyncHandler ( async ( req , res)=>{
    // first get the liked id from params , check it 
    // now use aggregation and match it 
    // now write the pipelines for it for getting the info of the user and liked video information 
    // send res 

    const {likedId} = req.params;

    if(!likedId){
        throw new ApiError(404 , "Invalid Id or empty");
    }

    const informationOfUserAndVideo = await Like.aggregate([
        {
            $match : {
                _id : new mongoose.Types.ObjectId(likedId),
                 video: { $exists: true, $ne: null },
            }
        },
        {
            $lookup : {
                from : "users",
                localField : "owner",
                foreignField : "_id",
                as : "userDetails",
                pipeline : [
                    {
                        $project : {
                            username : 1,
                            fullName : 1,
                            email : 1,
                            avatar : 1,
                        }
                    }
                ]
            }
        },
        {
            $lookup : {
                from : "videos",
                localField : "video",
                foreignField : "_id",
                as : "videoDetails",
                pipeline : [
                    {
                        $project : {
                            videoFile : 1,
                            thumbnail : 1,
                            title : 1,
                            description : 1,
                            duration : 1,
                            views : 1,
                        }
                    }
                ]
            }
        },
        {
            $project: {
                user: { $arrayElemAt: ["$userDetails", 0] }, // ✅ Get first element
                video: { $arrayElemAt: ["$videoDetails", 0] }, // ✅ Get first element
                likedAt: "$createdAt" // ✅ Include when it was liked
            }
        }
    ])

    if(!informationOfUserAndVideo.length){
        throw new ApiError(404 , "Failed to fetch the details of liked and videoInformation likedBy user information");
    }

    res.status(200).json(new ApiResponse(200 , informationOfUserAndVideo[0] , "Successfully fetched the details of the user"));


})

const getLikedVideos = asyncHandler(async ( req , res)=>{
    // first get the user from middleware , check it 
    // find the user in Like schema and match it 
    // now using aggregation lookup for the videos collection and find all the videos 

    const user = req.user._id;

    if(!user){
        throw new ApiError(404 , "Invalid User please login ");
    }

    const allLikedVideos = await Like.aggregate([
        {
            $match : {
                owner : new mongoose.Types.ObjectId(user),
                 video: { $exists: true }
            }
        },
        {
            $lookup : {
                from : "videos",
                localField : "video",
                foreignField : "_id",
                as : "likedVideos",
                pipeline : [
                    {
                        $project : {
                         videoFile : 1,
                        thumbnail : 1,
                        title : 1,
                        description : 1,
                        views : 1,
                        }
                    }
                ]
            }

        },
        {
            $project : {
                videos : "$likedVideos",
            }
        }
    ])

    if(!allLikedVideos.length){
        throw new ApiError(404 , "Failed to get all the liked videos");
    }

    res.status(200).json(new ApiResponse(200 , allLikedVideos , "Successfully fetched all the Liked videos"));
})

const getLikedTweets = asyncHandler(async ( req , res)=>{
    // get the user from the middleware , check it 
    // now do the aggregation and match the user with owner field 
    // and now lookup for the tweet collection and get the details of the tweets 

    const user = req.user._id;
    if(!user){
        throw new ApiError(404 , "Please logIn to get LikedTweets");
    }

    const allLikedTweets = await Like.aggregate([
        {
            $match : {
                owner : new mongoose.Types.ObjectId(user),
                 tweet: { $exists: true }
            }
        },
        {
            $lookup : {
                from : "tweets",
                localField : "tweet",
                foreignField : "_id",
                as : "likedTweets",
                pipeline : [
                    {
                        $project : {
                            content : 1,
                        }
                    }
                ]
            }
        },
        {
            $lookup : {
                from : "users",
                localField : "owner",
                foreignField : "_id",
                as : "likedUser",
                pipeline : [
                    {
                        $project : {
                            username : 1,
                            email : 1,
                            avatar : 1,
                        }
                    }
                ]
            }
        },
        {
            $project : {
                tweets : {$arrayElemAt : ["$likedTweets", 0]},
                user :  {$arrayElemAt : ["$likedUser", 0]},
            }
        }
       
    ])

    if(!allLikedTweets.length){
        throw new ApiError(404 , "failed to fetch all the Liked Tweets");
    }
    res.status(200).json(new ApiResponse(200 , allLikedTweets , "Successfully fetched all the liked tweets"));
})

const getLikedComments = asyncHandler ( async ( req , res)=>{
    // get user from middleware , check it 
    // now do the aggregation and find the likedComments 

    const user = req.user._id;
    if(!user){
        throw new ApiError(404 , "Failed to get the user");
    }

 
    const allLikedComments = await Like.aggregate([
        // Stage 1: Match likes by current user for comments only
        {
            $match: {
                owner: new mongoose.Types.ObjectId(user),
                comment: { $exists: true, $ne: null }
            }
        },
        
        // Stage 2: Lookup comment details
        {
            $lookup: {
                from: "comments",
                localField: "comment",
                foreignField: "_id",
                as: "commentDetails"
            }
        },
        
        // Stage 3: Unwind comment details
        {
            $unwind: "$commentDetails"
        },
        
        // Stage 4: Lookup video details from the comment
        {
            $lookup: {
                from: "videos",
                localField: "commentDetails.video",
                foreignField: "_id",
                as: "videoDetails"
            }
        },
        
        // Stage 5: Lookup user details (comment owner)
        {
            $lookup: {
                from: "users",
                localField: "commentDetails.owner",
                foreignField: "_id",
                as: "commentOwnerDetails"
            }
        },
        
        // Stage 6: Project the final structure
        {
            $project: {
               
            
                comment: {
                  
                    content: "$commentDetails.content",
                   
                },
                video: {
                    $cond: {
                        if: { $gt: [{ $size: "$videoDetails" }, 0] },
                        then: {
                       
                            title: { $arrayElemAt: ["$videoDetails.title", 0] },
                            description: { $arrayElemAt: ["$videoDetails.description", 0] },
                            thumbnail: { $arrayElemAt: ["$videoDetails.thumbnail", 0] },
                            videoFile: { $arrayElemAt: ["$videoDetails.videoFile", 0] },
                            views: { $arrayElemAt: ["$videoDetails.views", 0] }
                        },
                        else: null
                    }
                },
                commentOwner: {
                    $cond: {
                        if: { $gt: [{ $size: "$commentOwnerDetails" }, 0] },
                        then: {
                           
                            username: { $arrayElemAt: ["$commentOwnerDetails.username", 0] },
                            email: { $arrayElemAt: ["$commentOwnerDetails.email", 0] },
                            avatar: { $arrayElemAt: ["$commentOwnerDetails.avatar", 0] }
                        },
                        else: null
                    }
                }
            }
        },
        
        // Stage 7: Sort by most recently liked
        {
            $sort: {
                likedAt: -1
            }
        }
    ]);
    if(!allLikedComments.length){
        throw new ApiError(404 , "failed to fetch the all Liked Comments")
    }

    res.status(200).json(new ApiResponse(200 , allLikedComments , "Successfully fetched all the liked comments"));
})

export {toggleVideoLike , toggleCommentLike , toggleTweetLike , getDetailsOfOwnerAndVideoDetailsForVideo , getLikedVideos , getLikedTweets ,getLikedComments};

