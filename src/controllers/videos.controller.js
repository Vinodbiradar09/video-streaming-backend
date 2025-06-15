import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import {Video} from "../models/video.model.js"
import { User } from "../models/user.model.js";
import {uploadOnCloudinary , deleteOnCloudinary , deleteOnCloudinaryForVideos} from "../utils/cloudinary.js";
import mongoose from "mongoose";





const publishVideo = asyncHandler(async ( req , res)=>{
// first take the title and description from frontend 
// check if these came or not 
// get the videoFile path from uploadmiddleware 
// check 
// get the thumbnail path fromt the uploadMiddleware 
// check 
//  get the owner form the middleware and check?
// get duration from the cloudinary 
// get the views 
// get the isPublished 


const {title , description} = req.body;

if(!title && !description){
    throw new ApiError(404 , "Title and description must need to upload a video")
}

const videoFilePath = req.files?.videoFile[0].path;

if(!videoFilePath){
    throw new ApiError (404 , "VideoFile Path is empty or unavailable")
}

const thumbnailPath = req.files?.thumbnail[0].path;

if(!thumbnailPath){
    throw new ApiError(404 , "Thumbnail File path is empty or unavailable")
}

const owner = req.user._id;

if(!owner){
    throw new ApiError(404 , "The owner is Logged Out or u must be loogedIn to upload the file")
}

const videoFile = await uploadOnCloudinary(videoFilePath);

if(!videoFile){
    throw new ApiError(500 , "Failed to upload the video on the cloudinary due to internal issues")
}

const thumbnail = await uploadOnCloudinary(thumbnailPath);
if(!thumbnail){
    throw new ApiError(500 , "Failed to upload the thumbnail on the cloudinary due to internal issues")
}

const duration = videoFile.duration

if(!duration){
    throw new ApiError (400 , "the duration field is empty ");
}

const video = await Video.create(
    {
        videoFile : videoFile.secure_url,
        thumbnail : thumbnail.secure_url,
        owner : owner,
        title : title,
        description : description,
        duration : duration,
        views : 0,
        isPublished : true,


  }

)

if(!video){
    throw new ApiError(404 , "Unable to Publish the  Video on db");
}

res.status(200)
.json(new ApiResponse(200 , video , "Video Published Successfully"))



})


const getVideoById = asyncHandler ( async ( req , res)=>{
    // the Id form params 
    // check if the id is came or not 
    // if id exist then find the user by id 
    // using aggregation find the user by match 
    // now lookup to user collection 
    // and get the owner details such as name , avatar , username , email
    // and show the result 

    const {videoId} = req.params
    

    if(!videoId){
        console.log("video" , videoId);
        throw new ApiError(404 , "The videoID is not available");
    }

 const videoDetails =  await Video.aggregate([
        {
            $match : {
                _id : new mongoose.Types.ObjectId(videoId),
            }
        },
        {
            $lookup : {
                from : "users",
                localField : "owner",
                foreignField : "_id",
                as : "videoByIdAndUserDetails",
            }
        },
        {
            $project : {
                videoFile : 1,
                thumbnail : 1,
                title : 1,
                description : 1,
                duration : 1,
                views : 1,
                "videoByIdAndUserDetails.username" : 1,
                "videoByIdAndUserDetails.email" : 1,
                "videoByIdAndUserDetails.avatar" : 1,
            }
        }
    ])

    if(!videoDetails.length){
        throw new ApiError(404, "Video By Id is Not Found and details aren't fetched" );
    }

    res.status(200).
    json(new ApiResponse (200 , videoDetails[0] , "Video By Id fetched Successfully"));
})

const updateVideoDetails = asyncHandler( async ( req , res)=>{
    // the get details such as title ,desc , thumbnail 
    // check all of these came or not 
    // if came then find the video by id using params 
    // now update the details using $set operator all these fields
    // and send as a response 
    
    const {videoId} = req.params;
    const {title , description } = req.body;

    let updateVideoDetails = {};

    if(!videoId){
        throw new ApiError(404 , "The videoId is empty or unavailable")
    }

    if(title){
        updateVideoDetails.title = title;
    }

    if(description){
        updateVideoDetails.description =description;
    }

    const thumbnailPath = req.file?.path;
    // console.log("thum" , thumbnailPath);
    if(!thumbnailPath){
        throw new ApiError(404 , "The Thumbnail path is empty so failed");
    }

    const thumbnail = await uploadOnCloudinary(thumbnailPath);

    if(!thumbnail){
        throw new ApiError(500 , "Failed to upload on the Cloudinary and db");
    }

    if(Object.keys(updateVideoDetails).length === 0){
        throw new ApiError (404 , "Title or Description is empty");
    }

    const updatedDets =  await Video.findByIdAndUpdate({_id : videoId}, 
        
        {
            $set : {
                title : updateVideoDetails.title,
                description : updateVideoDetails.description,
                thumbnail : thumbnail?.secure_url,

            }
        },
        {
            new : true,
        }
)

if(!updatedDets){
    new ApiError(404 , "Failed to update the Video details");
}

res.status(200)
.json(new ApiResponse(200 , updatedDets , "Successfully updated the video Details"))


})

const deleteVideo = asyncHandler ( async ( req , res)=>{

    // get the videoId from params , check validation
    // if true then make a database call and delete the video from database 
    // and send has a response to it 

    const {videoId} = req.params

    if(!videoId){
        console.log("video" , videoId);
        throw new ApiError(404 , "VideoId is empty , must require VideoID");
    }

    const videoIdToDeleteOnCloud = await Video.findById({_id : videoId});

    // console.log("vid" , videoIdToDeleteOnCloud);

    const oldVideoID = videoIdToDeleteOnCloud.videoFile;

    const oldThumbNailID = videoIdToDeleteOnCloud.thumbnail;
    //   console.log("oldvideoId" , oldVideoID);

    const deletedVideoDetails = await Video.findByIdAndDelete({_id : videoId});

    if(!deletedVideoDetails){
        throw new ApiError(404 , "Due internal issue video is not deleted from db");
    }

    if(!oldVideoID){
      
        throw new ApiError(404 , "The oldVideoID is not empty ");
    }

    if(!oldThumbNailID){
          throw new ApiError(404 , "The oldThumbnailID is not empty ");
    }



const responseOfDeleteForVideo = await deleteOnCloudinaryForVideos(oldVideoID);

if(!responseOfDeleteForVideo){
    console.log("response" , responseOfDeleteForVideo);
    throw new ApiError(404 , "The video is not deleted from Cloudinary due to internal issue")
}
    
const responseOfDeleteForThumbnail = await deleteOnCloudinary(oldThumbNailID);

if(!responseOfDeleteForThumbnail){
    throw new ApiError(404 , "The Thumbnail is failed to delete from Cloudinary");
}



    res.status(200)
    .json(new ApiResponse(200 , deletedVideoDetails , "Video deleted successfully" ))

})

const togglePublishStatus = asyncHandler ( async ( req , res)=>{
    // in this controller were toggling the status basically while creating the video published id true , but if the user want to unpublish the video we just reverse the status
    // this helps in frontend the video don't want to show in frontend but it should be saved in the database and cloudinary at that time we use this 
    // first get the videoID from params , and Check validation 
    // find the video document  by the Id and change the field published value 

    const {videoId} = req.params;

    if(!videoId){
        throw new ApiError (404 , "The videoID is empty");
    }
    const videoToggleHandle = await Video.findById(videoId); // here we are finding the video document by id and accessing the field isPublished and reversing it and using $set operator were are handling that 

    if(!videoToggleHandle){
        throw new ApiError (404 , "The VideoToggleHandle is empty");
    }
    const videoPublishStatus = await Video.findByIdAndUpdate({_id : videoId},
        {
            $set : {
                isPublished : ! videoToggleHandle.isPublished,
            }
        },
        {
            new : true,
        }
    )

    if(!videoPublishStatus){
        throw new ApiError(400 , "Failed to change the ToggleStatus of isPublished Video")
    }

    res.status(200)
    .json(new ApiResponse(200 , videoPublishStatus , "Successfully toggled the isPublishedStatus of the video"))

    
})

const getAllVideos = asyncHandler(async (req, res) => {
    const { 
        page = 1, 
        limit = 10, 
        query, 
        sortBy = "createdAt", 
        sortType = "desc", 
        userId 
    } = req.query;

    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    const skip = (pageNumber - 1) * limitNumber;

    // Build match conditions
    const matchStage = {
        isPublished: true // Only get published videos
    };

    // Add userId filter if provided
    if (userId) {
        matchStage.owner = new mongoose.Types.ObjectId(userId);
    }

    // Add search functionality
    if (query) {
        matchStage.$or = [
            { title: { $regex: query, $options: "i" } },
            { description: { $regex: query, $options: "i" } }
        ];
    }

    // Build sort stage
    const sortStage = {};
    if (sortBy) {
        sortStage[sortBy] = sortType === "asc" ? 1 : -1;
    } else {
        sortStage.createdAt = -1; // Default sort by newest first
    }

    const videos = await Video.aggregate([
        {
            $match: matchStage // Use the properly constructed match stage
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "ownerDetails",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            fullName: 1,
                            _id: 1,
                            email: 1,
                            avatar: 1,
                        }
                    }
                ]
            }
        },
        {
            $unwind: "$ownerDetails"
        },
        {
            $sort: sortStage
        },
        {
            $skip: skip
        },
        {
            $limit: limitNumber
        },
        {
            $project: {
                _id: 1,
                videoFile: 1,
                thumbnail: 1,
                title: 1,
                description: 1,
                duration: 1,
                views: 1,
                isPublished: 1,
                createdAt: 1,
                updatedAt: 1,
                owner: {
                    username: "$ownerDetails.username",
                    fullName: "$ownerDetails.fullName",
                    email: "$ownerDetails.email",
                    _id: "$ownerDetails._id",
                    avatar: "$ownerDetails.avatar",
                }
            }
        }
    ]);

    // Get total count with the same match conditions
    const totalVideosResult = await Video.aggregate([
        {
            $match: matchStage // Use the same match conditions
        },
        {
            $count: "totalvideos"
        }
    ]);

    const totalVideosOfuser = totalVideosResult.length > 0 ? totalVideosResult[0].totalvideos : 0;
    const totalPages = Math.ceil(totalVideosOfuser / limitNumber);
    const hasNextPage = pageNumber < totalPages;
    const hasPrevPage = pageNumber > 1;

    return res.status(200).json(new ApiResponse(200, {
        data: {
            videos,
            pagination: {
                currentPage: pageNumber,
                totalPages,
                totalVideos: totalVideosOfuser, 
                videosPerPage: limitNumber,
                hasNextPage,
                hasPrevPage
            }
        }
    }));
});






export {publishVideo , getVideoById , updateVideoDetails , deleteVideo , togglePublishStatus , getAllVideos};