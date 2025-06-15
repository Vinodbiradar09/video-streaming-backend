import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import {Playlist} from "../models/playlist.model.js"
import {User} from "../models/user.model.js"
import {Video} from "../models/video.model.js"
import mongoose,{isValidObjectId} from "mongoose";


const createPlaylist = asyncHandler( async ( req , res)=>{
    // get name and desc from body  , check it 
  
    // get the user from middleware , check it 
    // now create the playlist using these data 

    // make sure here we are not adding the videos becoz we will create a empty playlist using addPlaylistController we will add the videos to the playList 
    const {name , description} = req.body;

    if( !name && !description){
        throw new ApiError(400 , "To Create a playlist you need to fill the name and description field");
    }

    const user = req.user._id;

    if(!user){
        throw new ApiError(404 , "Please login to create playlist ");
    }

    const playList = await Playlist.create({
        name : name,
        description : description,
        owner : user,
    })

    if(!playList){
        throw new ApiError(404 , "Failed to create a playlist due to internal server")
    }

    res.status(200).json(new ApiResponse(200 , playList , "Successfully created the playlist"));
 
})

const addVideoToPlaylist = asyncHandler ( async ( req , res)=>{
    // get the playlistId and videoId from the params , check it 
    // then add this video to the playlist , so this videoID we are adding it to the videos field 

    const {playListId , videoId} = req.params;

    if (!playListId || !videoId) {
        throw new ApiError(400, "Both playlistId and videoId are required");
    }

    if(!isValidObjectId(playListId) || !isValidObjectId(videoId)){
        throw new ApiError(400 , "Invalid playlist or video ID'S format");
    }

    const playList = await Playlist.findById(playListId);
    if(!playList){
        throw new ApiError(404 , "Playlist not found");
    }
    if(playList.owner.toString() !== req.user._id.toString()){
        throw new ApiError(403 , "you can add videos to only your playlist");
    }

    const video = await Video.findById(videoId);

    if(!video){
        throw new ApiError(404 , "Invalid video or video not found");
    }

    if(playList.videos.includes(videoId)){
        throw new ApiError(403 , "Video is already In playList");
    }


    const updatedPlaylist = await Playlist.findByIdAndUpdate( playListId ,
        {
            $push : {
                videos : videoId,
            }
            // make sure to no to use set here becoz set will overwritte the existing value to new value
        },
        {
            new : true,
        }
     ).populate("videos" , "title thumbnail duration");

     if(!updatedPlaylist){
        throw new ApiError(500 , "Failed to add the video to playlist")
     }

     res.status(200).json(new ApiResponse(200 , updatedPlaylist , "Successfully added video to the playlist"));
})

const removeVideoFromPlaylist = asyncHandler(async ( req , res)=>{
    // ok first get the playlist id and video id from params , check it and check it with isValidObjectId
    // now findbyId and find playlist and video , check it 
    // now check the playlist owner to the req.user._id , if not matched then don't allow to remove the video
    // now using findByIdAndUpdate find the playlist and pop the video from it 

    const {playListId , videoId} = req.params;

    if(!playListId || !videoId){
        throw new ApiError(400 , "playList id and video id is required");
    }

    if(!isValidObjectId(playListId) || !isValidObjectId(videoId)){
        throw new ApiError(400 , "The playlist ID and Video ID are not in format");
    }

    const existedplayList = await Playlist.findById(playListId);

    if(!existedplayList){
        throw new ApiError(404 , "Invalid or Playlist not found");
    }

    const videoToRemove = await Video.findById(videoId , "title thumbnail duration");

    if(!videoToRemove){
        throw new ApiError(404 , "Video not found");
    }

    if(existedplayList.owner.toString() !== req.user._id.toString()){
        throw new ApiError(403 , "you are not allowed to remove the video becoz it is not your playlist");
    }

    const updatedPlaylistByRemovingVideo = await Playlist.findByIdAndUpdate(playListId , 
        
   {
             $pull : {
                videos : videoId,
                //  don't use pop method becoz pop only work for first index and last index 
                // use pull becoz were removing the value , there is another method called pullAll which removes all
         }
    },
    {
        new : true,
    }
).populate("videos" , "title thumbnail duration")


if(!updatedPlaylistByRemovingVideo){
 throw new ApiError(404 , "Failed to remove the video from playlist");
}

res.status(200).json(new ApiResponse(200 ,{ updatedPlaylistByRemovingVideo , removedVideo : videoToRemove} , "Successfully removed the video from playlist"));


})

const updatePlayList = asyncHandler(async ( req , res)=>{
    // get the playlist id from params , check it 
    // get the name and desc from body check it 
    // check if playlist is exist or not 
    // and check the isValidObject 
    // using findByIdAndUpdate update the details 

    const {name , description} = req.body;
    const {playListId} = req.params;

    if(!name || !description){
        throw new ApiError(400 , "name and description is required");
    }

    if(!playListId){
        throw new ApiError(400 , "Invalid or PlayList not found");
    }
    if(!isValidObjectId(playListId)){
        throw new ApiError(403 , "Inavlid Playlist ID format");
    }

    const playlist = await Playlist.findById(playListId);

    if(!playlist){
        throw new ApiError(404 , "Playlist not found");
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(playListId , 
        {
            $set : {
                name,
                description,
            }
        },
        {
            new : true,
        }
     )

     if(!updatedPlaylist){
        throw new ApiError(404 , "Failed to update the playlist");
     }

     res.status(200).json(new ApiResponse(200 , updatedPlaylist , "Successfully updated the playlist"));
})

const getPlaylistById = asyncHandler(async ( req , res)=>{
    // first get the playlistId from params check it 
    // now do the aggregation and find the details of videos and owner 
    const {playListId} = req.params;

    if(!playListId){
        throw new ApiError(400 , "Invalid Playlist ID")
    }

    if(!isValidObjectId(playListId)){
        throw new ApiError(400 , "Invalid format of playlist id");
    }

    const playList = await Playlist.findById(playListId);
    if(!playList){
        throw new ApiError(404 , "Playlist not found");
    }

    const getTheDetailsOfPlayList = await Playlist.aggregate([
        {
            $match : {
                _id : new mongoose.Types.ObjectId(playListId)
            }
        },
        {
            $lookup : {
                from : "videos",
                localField : "videos",
                foreignField : "_id",
                as : "videoDetails",
                pipeline : [
                    {
                        $project : {
                            videoFile : 1, 
                            thumbnail : 1,
                            duration : 1,
                            views : 1,
                            title : 1,
                            description : 1,
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
                as : "playListOwnerDetails",
                pipeline : [
                    {
                        $project : {
                            username : 1,
                            email : 1,
                            fullName : 1,
                            avatar : 1,
                        }
                    }
                ]
            }
        },
        {
            $project : {
                videos : "$videoDetails",
                playlistowner : { $arrayElemAt : ["$playListOwnerDetails",0]},
                name : 1,
                description : 1,
            }
        }


    ])

    if(!getTheDetailsOfPlayList.length){
        throw new ApiError(404 , "Failed to get playlist by Id");
    }
    res.status(200).json(new ApiResponse(200 , getTheDetailsOfPlayList , "Successfully fetched the playList by Id"));
})

const deletePlaylist = asyncHandler(async ( req , res)=>{
    // get the playlist Id from params , check it 
    // check for isValidObjectID 
    // check for the playList , if found delete not means throw error 
    // now findBYIdAndDelete it ,
    // send res 

    const {playListId} = req.params;

    if(!playListId){
        throw new ApiError(400 , "playList id is not available");
    }

    if(!isValidObjectId(playListId)){
        throw new ApiError(400 , "Invalid playList Object Id");
    }

    const playlist = await Playlist.findById(playListId);

    if(!playlist){
        throw new ApiError(404 , "Playlist not found");
    }

    const existedplayListForDeleting = await Playlist.findByIdAndDelete(playListId);
    if(!existedplayListForDeleting){
        throw new ApiError(500 , "Internal server issue for deleting the playlist failed to do it");
    }

    res.status(200).json(new ApiResponse(200 , existedplayListForDeleting , "Successfully deleted the playlist"));
})

const getUserPlaylist = asyncHandler ( async(req , res)=>{
     //first get userId from params , check it 
    //  now do the aggregation part match the owner using userId , and lookup for videos and get the details 

    const {userId} = req.params;
    if(!userId){
        throw new ApiError(400 , "userID is required to get the playlist");
    }

    const userPlaylist = await Playlist.aggregate([
        {
            $match : {
                owner : new mongoose.Types.ObjectId(userId),
            }
        },
        {
            $lookup : {
                from : "videos",
                localField : "videos",
                foreignField : "_id",
                as : "videoDetails",
                pipeline : [
                    {
                        $project : {
                            title : 1,
                            description : 1,
                            videoFile : 1,
                            thumbnail : 1,
                            views : 1,
                            duration : 1,
                        }
                    }
                ]
            }
        },
        {
            $project : {
                name : 1,
                description : 1,
                videos : "$videoDetails",
            }
        }
    ])

    if(!userPlaylist.length){
        throw new ApiError(404 , "user playlist not found");
    }

    res.status(200).json(new ApiResponse(200 , userPlaylist , "Successfully got the user's playlist"));
})

export{createPlaylist , addVideoToPlaylist , removeVideoFromPlaylist , updatePlayList , getPlaylistById , deletePlaylist , getUserPlaylist} ;