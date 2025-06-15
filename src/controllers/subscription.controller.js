import {ApiError} from "../utils/ApiError.js";
import {ApiResponse} from "../utils/ApiResponse.js";
import {asyncHandler} from "../utils/asyncHandler.js";
import mongoose, {isValidObjectId} from "mongoose";
import { User } from "../models/user.model.js";

import {Subscription} from "../models/subscription.model.js"
import { application } from "express";

const toggleSubscription = asyncHandler(async ( req , res)=>{
    // get the channel Id from req.params check it 
    // get the user Id from req.user midddleware as a subscriber , check it 
    // now using findOne find the subscriber by adding the user to sub , channel Id to channnel 
    // if found then delete it , not means create one 


    const {channelId} = req.params;
    const userSubscriberId = req.user._id;

    if(!channelId){
        throw new ApiError(404 , "Channel does not exist or failed to get the channel");
    }

    if(!userSubscriberId){
        throw new ApiError(404 , "Please login to subscribe to channel");
    }

    const existingSubscriber = await Subscription.findOne({
        subscriber : userSubscriberId,
        channel : channelId,
    })

    let isSubscribed , message ;
    if(existingSubscriber){
        await Subscription.findByIdAndDelete(existingSubscriber._id)

        isSubscribed = false,
        message = "SuccessFully unsubscribed the channel"
    } 
    else {
        await Subscription.create({
            subscriber : userSubscriberId,
            channel : channelId,
        })
        isSubscribed = true,
        message = "Successfully subscribed the channel"
    }

    const totalSubscribers = await Subscription.countDocuments({channel : channelId});

    res.status(200)
    .json(new ApiResponse(200 , {isSubscribed , totalSubscribers , channelId} , message));
})

//get all the users who has subscribed to the channel
const getUserChannelSubscribers = asyncHandler( async ( req , res)=>{
    //get the channel Id , check it 
    // use aggregation and match the channel using channel Id 
    // then lookup for the subscribers field and match it to the users collection and project the username and avatar of theirs

    const {channelId} = req.params;

    if(!channelId || !mongoose.isValidObjectId(channelId)){
        throw new ApiError(404 , "Channel does not exist failed to fetch the channel");
    }

    const channelExist = await User.findById(channelId);

    if(!channelExist){
        throw new ApiError(404 , "The Channel Does Not exists");
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;


     const userChannelSubscribers = await Subscription.aggregate([
        {
            $match: {
                channel: new mongoose.Types.ObjectId(channelId),
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "subscriber",
                foreignField: "_id",
                as: "subscriberDetails",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            fullName: 1,
                            email: 1,
                            avatar: 1,
                            createdAt: 1
                        }
                    }
                ]
            }
        },
        {
            $unwind: "$subscriberDetails"
        },
        {
            $project: {
                _id: 1,
                subscriber: "$subscriberDetails",
                subscribedAt: "$createdAt",
                channel: 1
            }
        },
        {
            $sort: {
                subscribedAt: -1 // Most recent subscribers first
            }
        },
        {
            $skip: skip
        },
        {
            $limit: limit
        }
    ]);
    if(!userChannelSubscribers.length){
        console.log("user" , userChannelSubscribers)
        throw new ApiError(404 , "The Channel has no subscribers ");
    }

    // get total subscribers numbers
    const totalSubscribers = await Subscription.countDocuments({
        channel : new mongoose.Types.ObjectId(channelId)
    });
const totalPages = Math.ceil(totalSubscribers / limit);
    res.status(200).json(
        new ApiResponse(200, {
            subscribers: userChannelSubscribers,
            pagination: {
                currentPage: page,
                totalPages: totalPages,
                totalSubscribers: totalSubscribers,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            }
        }, "Channel subscribers fetched successfully")
    );
})


// the below controller returns all the channels that user has subscribed 
const getSubscribedChannels = asyncHandler( async ( req , res)=>{
    // get the subscriberId from req.params , check it 
    //  now do aggregation and match the userId to subscriber field , then we get many documents from these documents we have to do lookup and get channel's  details and project it 

    const {subscriberId} = req.params;

    if(!subscriberId || !mongoose.isValidObjectId(subscriberId)){
        throw new ApiError(400 , "The subscriber doesnot exists")
    }

    const subscriberExists = await User.findById(subscriberId);

    if(!subscriberExists){
        throw new ApiError(404 , "Invalid subscriber");
    }
     const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
     const sortBy = req.query.sortBy || 'recent'; // recent, alphabetical, popular
    
    let sortStage = {};
    switch (sortBy) {
        case 'alphabetical':
            sortStage = { 'channel.username': 1 };
            break;
        case 'popular':
            sortStage = { 'channelStats.subscriberCount': -1 };
            break;
        default: // recent
            sortStage = { subscribedAt: -1 };
    }

    const channelsThatUserHasSubscribed = await Subscription.aggregate([
        {
            $match : {
                subscriber : new mongoose.Types.ObjectId(subscriberId)
            }
        },
        {
            $lookup : {
                from : "users",
                localField : "channel",
                foreignField : "_id",
                as : "channelDetails",
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
             $unwind: "$channelDetails"
        },
        {
            $project : {
                _id : 1,
                channel : "$channelDetails",
                subscriber : 1,
            }
        },
        {
            $sort: sortStage
        },
        {
            $skip: skip
        },
        {
            $limit: limit
        }
    ])

    if(!channelsThatUserHasSubscribed.length){
        throw new ApiError(404 , "The user has not subscibed to any channel");

    }
      const totalSubscriptions = await Subscription.countDocuments({
        subscriber: new mongoose.Types.ObjectId(subscriberId)
    });
    const totalPages = Math.ceil(totalSubscriptions / limit);
    res.status(200).json(
        new ApiResponse(200, {
            channels: channelsThatUserHasSubscribed,
            pagination: {
                currentPage: page,
                totalPages: totalPages,
                totalSubscriptions: totalSubscriptions,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            }
        }, 
        )
    );
})

export {toggleSubscription , getUserChannelSubscribers , getSubscribedChannels} ;

