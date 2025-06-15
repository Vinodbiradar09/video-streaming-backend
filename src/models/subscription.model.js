import mongoose , {Schema , model} from "mongoose";

const subscriptionSchema = new Schema(
    
    {
        subscriber : {
            type : mongoose.Schema.Types.ObjectId,
            ref : "User", // the one who is subscribing the channel 
        },
        channel : {
            type : mongoose.Schema.Types.ObjectId,
            ref : "User", // the one who is got subscribe by the users 
        }
    } , 
    
    {timestamps: true}
)

const Subscription = model("Subscription" , subscriptionSchema);

export {Subscription};


// understanding of the subscription model 
// how it works , how we can extract the subscribers , how many people are subscribe to the channel 
// and we will understand how many channel user subscribe to the other channels 


// now we will discuss about aggregation pipelines 
// first aggregation pipelines means in a array we are digging into the pipe like structure 
// here one document is being processed one by one through the pipeline stages 
// suppose think there are 100 documents using first aggregate pipeline we made it to 50 
// using second pipeline we made 25 , now the 25 is made from out of 50 not 100 
// among these 25 we are finding the who age is > 35 
// atlast we get the result these are called aggregation 

// a bunch of documents we are trying to get the finite result among the documents 
// using aggregation we can combine multiple collections , we can filter and group 
// why we use aggregation we take raw data and process it with multiple pipelines and get the finest data from all the raw data 
// they is operator or method called lookup we will discuss this 

// lookup is used for joining the data , basically we are joining the two different data from two schema's 


// there is a collection called ORDERS 
// [
//   {
//     "_id": 1,
//     "product": "iPhone",
//     "price": 1000,
//     "userId": 101
//   },
//   {
//     "_id": 2,
//     "product": "Laptop",
//     "price": 1500,
//     "userId": 102
//   }
// ]

// there is a collection called USERS 
// [
//   {
//     "_id": 101,
//     "name": "Alice",
//     "email": "alice@example.com"
//   },
//   {
//     "_id": 102,
//     "name": "Bob",
//     "email": "bob@example.com"
//   }
// ]

// in orders there is a field called userID in that we are putting the mongoose.Schema.Types.ObjectID of the users 

// How lookup works 
// aggregate is a method which takes an array , in which we can write the pipelines using the object {} , {}

// orders.aggregate([
//     {
//         $lookup : {
//             from : "users",// the name of the collections we want to join , so we are joining the orders collections to the users collection
//             localField : "userId" ,// the name of the field in the order schema to match with 
//             foreignField : "_id", //  the name of the field that we want to add in the userID 
//             as : "userInfo", // the new field to add with matched user data 
//         }
//     }
// ])

// db.orders.aggregate([
//   {
//     $lookup: {
//       from: "users",                // 👈 the name of the collection we want to join (users)
//       localField: "userId",         // 👈 the field in "orders" collection to match with
//       foreignField: "_id",          // 👈 the field in "users" collection to match against
//       as: "userInfo"                // 👈 the new field to add with matched user data (array)
//     }
//   }
// ])



// so basically we are doing , joining the orders schema and users schema 

// localField means in orders for orders we are aggregating then local field becomes the userId for this userId we want to add the value of the foreign field of _id of User Schema 


// [
//   {
//     "_id": 1,
//     "product": "iPhone",
//     "price": 1000,
//     "userId": 101,
//     "userInfo": [
//       {
//         "_id": 101,
//         "name": "Alice",
//         "email": "alice@example.com"
//       }
//     ]
//   },
//   {
//     "_id": 2,
//     "product": "Laptop",
//     "price": 1500,
//     "userId": 102,
//     "userInfo": [
//       {
//         "_id": 102,
//         "name": "Bob",
//         "email": "bob@example.com"
//       }
//     ]
//   }
// ]

// this is the final output we are creating a newfield called userInfo which is an array and putting the matched user document value to it 
