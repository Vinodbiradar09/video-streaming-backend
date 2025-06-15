import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js";
import { uploadOnCloudinary , deleteOnCloudinary} from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import mongoose from "mongoose";
dotenv.config();



const generateAccessAndRefreshTokens = async (userId) => {

    try {

        console.log("usersId", userId);

        const user = await User.findById({ _id: userId });

        const accessToken = user.generateAccessToken();

        //  console.log("acctok" , accessToken);


        const refreshToken = user.generateRefreshToken();

        //  console.log("refretok" , refreshToken);

        user.refreshTokens = refreshToken;
        await user.save({ validateBeforeSave: false }); // here validation is done becoz we have saved the user through mongosse 

        return { accessToken, refreshToken };



    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating the access token and refresh tokens ")
    }

}




const registerUser = asyncHandler(async (req, res) => {
    // steps for creating or registering the user
    // get the details from the frontend
    // validate the details , they are empty or not 
    // check if the user already exist using , email and username 
    // check for images and avatar's
    // upload them to cloudinary 
    // create a User object and use create method for creating 
    // remove the password and refresh tokens so it is not visible in frontend
    // check if user is created or not 
    // and send res user  

    const { email, username, fullName, password } = req.body;
    //console.log("email" , email + "username" , username + "fullName" , fullName);


    if (
        [email, username, fullName, password].some((field) => field?.trim() === "")

    ) {
        throw new ApiError(400, "All the fields are required");

    }




    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    }) // here are finding a user based on the email and username using $or operator [in array we have to pass it has a object]

    if (existedUser) {
        throw new ApiError(409, "The username or email is Already existed");
    }

    // console.log("existed user:" , existedUser);

    const avatarLocalFilePath = req.files?.avatar[0].path;
    // const coverImageLocalFilePath = req.files?.coverImage[0].path; // the multer middleware allows us to take the req.files and name of the field zero indexs path and putting in the variable 
    let coverImageLocalFilePath;

    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalFilePath = req.files.coverImage[0].path
    }

    if (!avatarLocalFilePath) {
        throw new ApiError(400, "Avatar file is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalFilePath); // here we are using the await becoz file is uploading on the cloudinary which takes time

    const coverImage = await uploadOnCloudinary(coverImageLocalFilePath);

 

    
    // console.log("cover", coverImage);

    if (!avatar) {
        console.log(avatar);
        throw new ApiError(409, "internal server problem");
    }
    const user = await User.create(
        {
            username: username.toLowerCase(),
            email: email,
            fullName: fullName,
            avatar: avatar.url,
            coverImage: coverImage?.url || "", // if coverIamge is uploaded then send the coverImage url not means let it be empty 
            password: password,

        }
    )

    const createdUser = await User.findById({ _id: user._id }).select(
        "-password -refreshTokens"
    ) // using this select "-password -refreshToken" we are reomving this and not sending at frontend

    if (!createdUser) {
        throw new ApiError(509, "Something went wrong while registering the user");
    }

    res.status(201).json(
        new ApiResponse(201, createdUser, "User registered successfully")
    )

})


const loginUser = asyncHandler(async (req, res) => {

    // access the data from req.body 
    // username or email 
    // find the user 
    // password check
    // access token and refresh token
    // send through cookies 
    // send a successfull response 


    const { email, username, password } = req.body;

    if (!username && !email) {
        throw new ApiError(400, "username or email is required");
    }

    const user = await User.findOne(
        {
            $or: [{ email: email }, { username: username }]
        }
    )

    if (!user) {
        throw new ApiError(404, "User not exists you need to login");
    }

    const isPasswordValid = await user.isPasswordCorrect(password); // here we are checking for password correct based on the user we have find him through email or username 


    if (!isPasswordValid) {
        throw new ApiError(404, "Invalid credentials");
    }


    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id); // here the above method we returned using destructure{accessToken , refreshToken}
    //    main note using the await here becoz these are async communications 

    //    console.log("accessToken" , accessToken);
    //    console.log("refreshToken" , refreshToken);

    const loggedInUser = await User.findById({ _id: user._id }).select("-password -refreshTokens");

    const options = {
        httpOnly: true,
        secure: true,
    }

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(200, { user: loggedInUser, accessToken, refreshToken }, "User loggend In successfully")
        )
})

const logoutUser = asyncHandler(async (req, res) => {

    await User.findByIdAndUpdate(req.user._id,

        {
            $unset: {
                refreshTokens: 1, // using unset operator we are setting the refreshTokens as flag 1 using this user is logged out // using this remove the field from documents
            },



        },
        {
            new: true, // 
        }
    )

    const options = {
        httpOnly: true,
        secure: true,
    }
    return res.status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User LoggedOut successfully"))

})

const refreshAccessToken = asyncHandler(async (req, res) => {
    // get the refreshToken from the cookies 
    // check if the cookies is came or not 
    // get verify with jwt 
    // find the user based on the decoded token
    // check for the decoded user 
    // now check the incoming refresh token and the user saved token in the database 
    // create options for setting up in the cookies 
    // generate new refreshtokens using the above method 
    // And now set these destructed tokens in the frontend 
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;
    if (!incomingRefreshToken) {
        throw new ApiError(401, "invalid tokens there is no tokens in it ");
    }

    try {



        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);

        const user = await User.findById({ _id: decodedToken?._id });

        if (!user) {
            throw new ApiError(404, "Invalid user and  refresh token is expired");
        }

        if (incomingRefreshToken !== user.refreshTokens) {
            throw new ApiError(404, "there is no match between the tokens of incoming and saved database token")
        }

        const options = {
            httpOnly: true,
            secure: true,
        }

        const { accessToken, newrefreshToken } = await generateAccessAndRefreshTokens(user._id);

        res.status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newrefreshToken, options)
            .json(
                new ApiResponse(200, { accessToken: accessToken, refreshToken: newrefreshToken }, "Access Token refreshed ")
            )


    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }
})

const changeCurrentPassword = asyncHandler(async (req, res) => {
    // first get the values from the body 
    // get the current logged in User from the middleware 
    // using this user extract the method called isPasswordCorrect and pass the oldpassword to it 
    // hold it refrence and check it is valid or not 
    //  if valid then using this user update the oldpassword to new password using the bcrypt , in the pre hook we said that if the password is modified then hash the password , the password is not modified then return the next() flag 
    // now send the response to the frontend 

    const { oldPassword, newPassword } = req.body;

    // console.log("id" , req.user._id);

    const user = await User.findById({ _id: req.user?._id });

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

    if (!isPasswordCorrect) {
        throw new ApiError(404, "Invalid oldPassword");
    }

    user.password = newPassword;
    await user.save({ validateBeforeSave: false }); // here the save method is used for current user ,not the model User
    //    here mainly use validateBeforeSave : false becoz the only changes must takes place for password not for all 

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "password changed successfully"));
})

const getCurrentUser = asyncHandler(async (req, res) => {
    // here we are fetching the current logged in User by using the authmiddleware which gives the req.user 
    const user = req.user;
    return res
        .status(200)
        .json(new ApiResponse(200, user, "Current User is Accessed"));
})

const updateAccountDetails = asyncHandler(async (req, res) => {
    // here we are updating the fullName and email
    // first get the fullName and email from body 
    // check if the fullName and email  is came or not
    // get the current User from the middleware using req.user 
    // using this user.fullName , email update it 
    // and make sure to save it 
    // we can do it by using mongoDb operator $set 

    const { fullName, email } = req.body;

  console.log("fullname" , fullName);
  console.log("email" , email);

    if (!fullName && !email) {
        throw new ApiError(404, "fullName and email is required");
    }

    const user = await User.findByIdAndUpdate({ _id: req.user?._id },

        {
            $set: {
                fullName: fullName,
                email: email
            }
        },
        {
            new: true, // it means it gives the all the updated user in user variable
        }
    ).select("-password")

    console.log("user", user)


  return  res.status(200)
        .json(new ApiResponse(200, {user}, "Account details updated successfully"));




})

const updateUserAvatar = asyncHandler(async (req, res) => {
    //  first get the local file path from the middleware the upar wala we used files becoz we are allowing the user to upload multiple files  but now in the route we will specify the user to upload single file so we use file not files 
    // hold refrence of filepath , check if the fileapath exist or not 
    //  if file path exist then upload it to the cloudinary 
    // after uploading it get the refrence of the url in some variable 
    // check for the variable it is exists or not 
    // now update the user details by finding the user by the auth middleware by req.user 
    //  update it by using $set operator , or just update  user.avatar = avatar
    // after uploading we must save it in the database also make sure to handle it 

    const avatarLocalPath = req.file?.path;

    if (!avatarLocalPath) {
        throw new ApiError(404, "The avatar Image is missing or  not available")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);

    if (!avatar.url) {
        throw new ApiError(404, "Error occured while uploading the file on the cloudinary");
    }

    const oldPublicId = req.user.avatar;

    if(!oldPublicId){
        throw new ApiError(404 , "The publicId is missing for Avatar or not available");
    }


    

    const user = await User.findByIdAndUpdate({ _id: req.user?._id },
        {
            $set: {
                avatar: avatar.url,
            }
        },
        {
            new: true
        }
    )

    const deletedavatar = await deleteOnCloudinary(oldPublicId);

    console.log("delete" , deletedavatar);

    if(!deletedavatar){
        throw new ApiError(404 , "The old Avatar is Not deleted");
    }



    return res
        .status(200)
        .json(new ApiResponse(200, user, "Avatar updated successfully"))
})

const updateUserCoverImage = asyncHandler(async (req, res) => {
    const coverImageLocalPath = req.file?.path;
    if (!coverImageLocalPath) {
        throw new ApiError(404, "Cover Image is missing or not available");
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if (!coverImage.url) {
        throw new ApiError(404, "Error occured while uploading the coverImage")
    }

    const oldPublicId = req.user.coverImage;

    if(!oldPublicId){
         throw new ApiError(404 , "The publicId is missing for CoverImage or not available");
    }

    const user = await User.findByIdAndUpdate({ _id: req.user?._id },
        {
            $set: {
                coverImage: coverImage.url,
            }
        },
        {
            new: true,
        }
    )

    const deletedCoverImage = await deleteOnCloudinary(oldPublicId);

    if(!deletedCoverImage){
        new ApiError(404, "Error occured While deleting coverImage");
    }


    return res.status(200)
        .json(new ApiResponse(200, user, "CoverImage updated successfully"));


})

const getUserChannelProfile = asyncHandler ( async (req , res)=>{
    // first get the username from params 
    // check if username is there or not 
    // now do aggregate on the User.model and using $match find the particular user based on the username and store the refrence in channel variable
    // now using lookup we are joining the user model and subscription model , localfiled will _id and foreign field will channel


    const {username} = req.params;

    if(!username){
        throw new ApiError(400 , "Username is not available");
    }

    const channel = await User.aggregate([
        {
            $match : {
                username : username,
            }
        },
        {
            $lookup : {
                from : "subscriptions",
                localField : "_id",
                foreignField : "channel",
                as : "subscribers", // using this as there will be a new field called subscribers : and value will be foreignField information
            }
        },
        {
            $lookup : {
                from : "subscriptions",
                localField : "_id",
                foreignField : "subscriber",
                as : "subscribedTo" , // using this as there will be a new field called subscribedTo and value will be foreignField info 
            }
        },
        {
            $addFields : {
                subscribersCount : { // now we are adding a field called subscribersCount and using $sizee we are calculating $subscribers field 
                    $size : "$subscribers"
                },
                channelsSubscribedToCount : {
                    $size : "$subscribedTo", // here also we are adding new field and the value is finded subscribedTo info and using $sizee we are calculating the total 
                },
                isSubscribed : {
                    $cond : {
                        if : {$in : [req.user?._id , "$subscribers.subscriber"]},
                        // here we are checking $inn if this req.user._id is present or not in the $subscribers.subscriber field 
                        then : true,
                        else : false
                    }
                }
            }

        },
        {
            $project : {
                fullName : 1,
                email : 1,
                username : 1,
                subscribersCount : 1,
                channelsSubscribedToCount : 1,
                isSubscribed : 1,
                avatar : 1,
                coverImage : 1,

                // these are the fields we are sending to the frontend



            }
        }

    ])

    if(!channel?.length){
        throw new ApiError (404, "channel does not exists");
    }

    return res.status(200)
    .json( new ApiResponse( 200 , channel[0] , "User channel fetched successfully"));
    // make sure that keep in mind aggregation returns in array in many cases 
})

const getWatchHistory = asyncHandler( async ( req , res)=>{

    // when we do req.user._id we get the ID in string from , we are using the mongoose so the reason mongoose handles in the beside part , but aggregation is a mongoDb part when we give the req.user._id we get string , now we have to convert it into the ID using mongoose.types.ObjectId(req.user._id)

    

 const user = await  User.aggregate([
        {
            $match : {
                _id : new mongoose.Types.ObjectId(req.user._id),
            }
        },
        {
            $lookup : {
                from : "videos",
                localField : "watchHistory",
                foreignField : "_id",
                  as : "watchHistory",
                  pipeline : [
                    {
                        $lookup : {
                            from : "users",
                            localField : "owner",
                            foreignField : "_id",
                            as : "owner",
                            pipeline : [
                                {
                                    $project : {
                                        fullName : 1,
                                        username : 1,
                                        avatar : 1,
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields : { // here we are adding the newField called owner : now the owner field is array and we have to access the first field so we use $firstt for accessing the $owner 
                            owner : {
                                $first :"$owner",
                            }
                        }
                    }
                  ]
            }
        }
    ])

    return res.status(200)
    .json(new ApiResponse(200 , user[0].watchHistory , "Watch history fetched successfully" ))

})


// when we are getting the Channel user subscribers , for this we have to match the user first we get the user by match operator 

// $match is used to match the user by id or username or email 
// $lookup is used for matching joining the two collections 
// $set is used for setting the new value 
//  $or is used for || operator 
// $addFields is used for adding the new fields 
// $size is used for calculating the total 
// $cond is used conditioning 
// $in is used for arrays and object also 
// $project is used for while returning the response what are fields we need to add there are many fields so we decide what are fields we need to add here 




export { registerUser, loginUser, logoutUser, refreshAccessToken, changeCurrentPassword, getCurrentUser, updateAccountDetails, updateUserAvatar, updateUserCoverImage , getUserChannelProfile , getWatchHistory  }   