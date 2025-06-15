import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
dotenv.config();

import fs from "fs";
import { fileURLToPath } from "url";


cloudinary.config(
    {
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
    }
)

const uploadOnCloudinary = async  (localFilePath)=>{
 
    try{

      if(!localFilePath) return null; // we have handled the localFilePath if it is empty then we return null

        const response = await cloudinary.uploader.upload(localFilePath , {resource_type : 'auto' ,});
        // file has been successfull uploaded in the cloudinary 

        // console.log("response", response);

       // console.log("file has been successfull uploaded" , response.url);

       fs.unlinkSync(localFilePath);

        return response;
        // here we are uploader.upload and we are passing the localfilepath and the resource-type has a auto , here we are consoling the response.url , the uploaded url is we are printing

    }
    catch(error){

        fs.unlinkSync(localFilePath);
        // here we are removing or deleting the file which we have stored in the server 
        return null

    }


}

const deleteOnCloudinary = async (public_id) =>{

    try {

        // console.log("public" , public_id);

        if(!public_id) return null;

        let actualPublicID = public_id;
             if (public_id.includes('cloudinary.com')) {
            // Extract public_id from URL
            actualPublicID = public_id.split('/').pop().split('.')[0];

            console.log("actual" , actualPublicID)
        }
        const result = await cloudinary.uploader.destroy(actualPublicID);
        console.log("res" , result);

        return result.result === "ok";


        
    } catch (error) {
         console.error("Cloudinary delete error:", error);
         return null
    }

}

const deleteOnCloudinaryForVideos = async (public_id) => {
  try {
    if (!public_id) return null;

    let actualPublicID = public_id;

    if (public_id.includes('cloudinary.com')) {
      // Extract only the public_id from URL (remove extension)
      actualPublicID = public_id.split('/').pop().split('.')[0];
      console.log("actual public_id:", actualPublicID);
    }

    const result = await cloudinary.uploader.destroy(actualPublicID, {
      resource_type: 'video'  // 👈 Important!
    });

    console.log("Cloudinary delete result:", result);

    return result.result === "ok";
  } catch (error) {
    console.error("Cloudinary delete error:", error);
    return null;
  }
};


export {uploadOnCloudinary , deleteOnCloudinary , deleteOnCloudinaryForVideos};




// today we will discuss about clodinary for file uploading , videos and image uploading 
// there are two steps for uploading the images or files to the cloudinary 
// 1. first we use multer and upload the file in the server 
// 2. from the server we extract the actual path and upload to the cloudinary , 
// 3. after successfully uploading the file we will remove from the server all the files and videos or images 



// now i will explain the how file uploading or other images pdf's are uploaded 



// step 1 :- we use multer to take the videos or the files from the frontend 
// using multer we access the videos , multer is used as the middleware , becoz there are no all the routes , we are uploading there might be only two three routes , for these two three routes , we use to write the multer in the controllers we have to write it for two , three routes instead of it we will it as middleware , and were every required we will inject this middleware 
