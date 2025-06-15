
import mongoose ,{Schema , model} from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
dotenv.config();


const userSchema = new Schema(
    
    {
        username : {
            type : String,
            required : true,
            unique : true,
            index : true,
            lowercase : true,
            trim : true,
        },

        email : {
            type : String,
            required : true,
            unique : true,
            lowercase :true,
            trim : true
        },

        fullName : {
            type : String,
            required : true,
            trim : true,
            index : true,
        },
        avatar : {
            type : String, // cloudinary image url
            required :true,
        },

        coverImage : {
            type : String, // cloudinary image url
        },

        watchHistory : [
            {
                type : mongoose.Schema.Types.ObjectId,
                ref : "Video",
            }
        ],

        password : {
            type : String,
            required : [true , "Password is Required"],
        },

        refreshTokens : {
            type : String,
        },



    } , 
    
    {timestamps : true}


)





// now we will hash the password using bcrypt 

userSchema.pre( "save", async  function (next) {

    if(!this.isModified("password")) return next(); // agar ye modified nahi hai to next()

    this.password = await bcrypt.hash(this.password , 10); // here we are accessing the above password field and hashing it 
    next();

})

userSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password , this.password)
} 

userSchema.methods.generateAccessToken = function (){
  return  jwt.sign(
        {
            _id : this._id,
            email : this.email,
            username : this.username,
            fullName : this.fullName,
            // here we are storing the _id , and email , username and the value is we are accessing from the above schema fields 
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn : process.env.ACCESS_TOKEN_EXPIRY,
        }
    )
}

userSchema.methods.generateRefreshToken = function (){
    return jwt.sign(
        {
            _id : this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn : process.env.REFRESH_TOKEN_EXPIRY,
        }
    )
}

const User = model("User" , userSchema);

export {User};
// here we have to use methods only and creating a isPasswordCorrect method as a function and we recive the password has a parameter 
// the save is method ;- it means before saving something to the database we are running this middleware , make sure to not to use arrow function becoz function does not have this reference , and the this reference we are accessing it from the above password field 

// the next() is used for passing the next() flag to anothere field after completing the hashing 
// here !this.isModified("password") agar ye modified nahi hai to return karo to next() 





// in industry standards the password hashing is done in the models only using pre hooks , the pre hooks means something doing or creating the before the we can do something , this is follwed in industry standards


// we will discuss about some jwt , jwt is bearer token using this the database can send the access for anything we store in database using this jwt token only we check user is logged in or not for this is only we are using the jwt token 













































// some imp topics 
// indexing , the indexing is the best and powerfull query in mongoDB 

// i will discuss about three types of indexing 
// 1. indexing the single field 
// email :{ type : String , index : true} // 
// 2.compound indexing (multiple fields)
// userSchema.index({age : 14 , gender : Male}) // here we are combining two fields and indexing it 
// 3.unique indexs 
// address : { type : String, unique : true , index : true} // here using unique we are saying the index is unique , it means no duplicate index same as address is not done 






// populate :- i will discuss about populate in mongoDb , when the use reference modeling , we refer one model to another model using the model id which is mongoDb auto-generated id ,
// User (stores user data like name, email).
// Post (stores blog posts, with a reference to the user who wrote the post).

//without populate when we fetch the user or other model , then we only get the id's of the user or other model 

// const postSchema = new mongoose.Schema({
//   title: String,
//   content: String,
//   // Reference the "User" model
//   author: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User', // Name of the model to reference
//   },
// });

// const post = await Post.findOne({ title: 'First Post' })
//   .populate('author'); // Replaces "author" ID with the user document
// here we are finding by the title  and we are using the populate , to fetch all the details of the users not the id 
