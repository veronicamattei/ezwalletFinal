import { categories, transactions } from "../models/model.js";
import { Group, User } from "../models/User.js";
import { handleDateFilterParams, handleAmountFilterParams, verifyAuthSimple, verifyAuthUser, verifyAuthGroup, verifyAuthAdmin } from "./utils.js";

import mongoose from "mongoose";
/**
 * Create a new category
    - Request Parameters: None
    - Request Body Content: An object having attributes `type` and `color`
     - Example: `{type: "food", color: "red"}`
    - Response `data` Content: An object having attributes `type` and `color`
     - Example: `res.status(200).json({data: {type: "food", color: "red"}, refreshedTokenMessage: res.locals.refreshedTokenMessage})`
    - Returns a 400 error if the request body does not contain all the necessary attributes
    - Returns a 400 error if at least one of the parameters in the request body is an empty string
    - Returns a 400 error if the type of category passed in the request body represents an already existing category in the database
    - Returns a 401 error if called by an authenticated user who is not an admin (authType = Admin)
*/
export const createCategory = async (req, res) => {
    try {

        // check if an admin sent the request
        const { authorized, cause } = verifyAuthAdmin(req, res);
        if (!authorized) return res.status(401).json({ error: cause })

        // validate request body
        const { type, color } = req.body;

        if (type == '' || (type && !type.trim().length)) {
            return res.status(400).json({ error: "type is empty" });
        }

        if (!type) {
            return res.status(400).json({ error: "type is not provided" });
        }

        if (color == '' || (color && !color.trim().length)) {
            return res.status(400).json({ error: "color is empty" });
        }

        if (!color) {
            return res.status(400).json({ error: "color is not provided" });
        }

        let result = await categories.countDocuments({ type });
        if (result === 1) {
            return res.status(400).json({ error: "category type is already in use" });
        }

        const new_categories = new categories({ type, color });
        new_categories.save()
            .then(data => {
                return res.status(200).json({
                    data,
                    refreshedTokenMessage: res.locals.refreshedTokenMessage
                })
            })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

/**
 * Edit a category's type or color
  - Request Parameters: A string equal to the `type` of the category that must be edited
    - Example: `api/categories/food`
  - Request Body Content: An object having attributes `type` and `color` equal to the new values to assign to the category
    - Example: `{type: "Food", color: "yellow"}`
  - Response `data` Content: An object with parameter `message` that confirms successful editing and a parameter `count` that is equal to the count of transactions whose category was changed with the new type
    - Example: `res.status(200).json({data: {message: "Category edited successfully", count: 2}, refreshedTokenMessage: res.locals.refreshedTokenMessage})`
  - In case any of the following errors apply then the category is not updated, and transactions are not changed
  - Returns a 400 error if the request body does not contain all the necessary attributes
  - Returns a 400 error if at least one of the parameters in the request body is an empty string
  - Returns a 400 error if the type of category passed as a route parameter does not represent a category in the database
  - Returns a 400 error if the type of category passed in the request body as the new type represents an already existing category in the database
  - Returns a 401 error if called by an authenticated user who is not an admin (authType = Admin)
*/
export const updateCategory = async (req, res) => {
    try {

        // authentication
        const { authorized, cause } = verifyAuthAdmin(req, res);
        if (!authorized) return res.status(401).json({ error: cause })

        const { type } = req.params;
        const { type: newType, color: newColor } = req.body;

        //
        // input validation
        //

        if (newColor == '' || (newColor && !newColor.trim().length)) {
            return res.status(400).json({ error: "New color is empty" });
        }
        if (!newColor) {
            return res.status(400).json({ error: "New color is not provided" });
        }

        if (newType == '' || (newType && !newType.trim().length)) {
            return res.status(400).json({ error: "New type is empty" });
        }
        if (!newType) {
            return res.status(400).json({ error: "New type is not provided" });
        }

        // check that the new type is not in use 
        if (newType !== type) {
            const result = await categories.countDocuments({
                type: newType
            });

            if (result >= 1) {
                return res.status(400).json({
                    error: "New type is already in use"
                });
            }
        }

        // // check if new value stayed the same
        // if(newType == type && newColor == color){
        //     return res.status(400).json({
        //         data : {
        //             message : ""                    
        //         },
        //         message : res.locals.message
        //     })
        // }

        // // check if color is valid
        // if(!/^#[a-fA-F0-9]{6}$/.test(newColor)){
        //     return res.status(400).json({
        //         data : {
        //             message : "color should be a hexadecimal string"                    
        //         },
        //         message : res.locals.message
        //     })
        // }

        // update category
        const result = await categories.updateOne(
            {
                type: type
            },
            {
                type: newType,
                color: newColor
            }
        )

        if (result.modifiedCount === 0) {
            // category does not exist
            return res.status(400).json({
                error: "Selected category does not exist"
            })
        }

        // if type changed, update transactions to the new type 
        let modifiedCount = 0;
        if (newType !== type) {
            const result = await transactions.updateMany(
                {
                    type: type
                },
                {
                    type: newType
                }
            )

            modifiedCount = result.modifiedCount;
        }

        return res.status(200).json({
            data: {
                message: "Succesfully update category",
                count: modifiedCount
            },
            refreshedTokenMessage: res.locals.refreshedTokenMessage
        })

    } catch (error) {
        return res.status(500).json({ error: error.message })
    }
}

/**
 * Delete a category
- Request Parameters: None
- Request Body Content: An array of strings that lists the `types` of the categories to be deleted
    - Example: `{types: ["health"]}`
- Response `data` Content: An object with an attribute `message` that confirms successful deletion and an attribute `count` that specifies the number of transactions that have had their category type changed
    - Example: `res.status(200).json({data: {message: "Categories deleted", count: 1}, refreshedTokenMessage: res.locals.refreshedTokenMessage})`
- Given N = categories in the database and T = categories to delete:
    - If N > T then all transactions with a category to delete must have their category set to the oldest category that is not in T
    - If N = T then the oldest created category cannot be deleted and all transactions must have their category set to that category
- In case any of the following errors apply then no category is deleted
- Returns a 400 error if the request body does not contain all the necessary attributes
- Returns a 400 error if called when there is only one category in the database
- Returns a 400 error if at least one of the types in the array is an empty string
- Returns a 400 error if at least one of the types in the array does not represent a category in the database
- Returns a 401 error if called by an authenticated user who is not an admin (authType = Admin)
*/
export const deleteCategory = async (req, res) => {
    try {

        // authentication
        const {authorized, cause} = verifyAuthAdmin(req, res);
        if(!authorized) return res.status(401).json({error: cause})

        const { types } = req.body;
        

        // check if all required fields were provided
        if (!types || types.length === 0) return res.status(400).json({ error: "List of categories' types to deleted was not provided" });

        // check for empty strings
        for (let type of types) {
            if (type === "") return res.status(400).json({ error: "The list of categories can't have empty entries" });
        }

        // check if the database has at least one category
        let T = await categories.countDocuments();
        if (T <= 1) return res.status(400).json({ error: "Cannot delete categories, there should be at least one category" });

        // check if all categories to be deleted exist in the database 
        let toBeDeleted = await categories.find({
            type: {
                $in: types
            }
        }, {
            type: 1,
            _id: 0
        }).sort({
            createdAt: -1
        });

        toBeDeleted = toBeDeleted.map(category => category.type);
        const notFound = types.filter(type => !toBeDeleted.includes(type));

        if (notFound.length !== 0) {
            return res.status(400).json({ error: `the following categories don't exist: ${notFound.join(', ')}` });
        }

        // number of categories to be deleted
        const N = types.length;
        let newType;

        if (N === T) {
            // delete all categories except the oldest one   
            // types are sorted based on their creation date, so the oldest 
            // category is the first element of the types array         
            newType = toBeDeleted[0];
            toBeDeleted = toBeDeleted.slice(1);
        } else {
            // find oldest category
            let oldest = await categories.find({
                type: {
                    $nin: toBeDeleted
                }
            }, {
                type: 1,
                _id: 0
            }).sort({
                createdAt: -1
            });
            oldest = oldest[0]
            newType = oldest.type;
        }

        // delete categories
        let result = await categories.deleteMany({
            type: {
                $in: toBeDeleted
            }
        })

        // update transactions that belong to deleted categories
        result = await transactions.updateMany(
            {
                type: {
                    $in: toBeDeleted
                }
            },
            {
                type: newType
            }
        )

        return res.status(200).json({
            data: {
                message: "successfully deleted categories",
                count: result.modifiedCount
            },
            refreshedTokenMessage: res.locals.refreshedTokenMessage
        })

    } catch (error) {
        return res.status(500).json({ error: error.message })
    }
}


/**
 * Return all the categories
- Request Parameters: None
- Request Body Content: None
- Response `data` Content: An array of objects, each one having attributes `type` and `color`
  - Example: `res.status(200).json({data: [{type: "food", color: "red"}, {type: "health", color: "green"}], refreshedTokenMessage: res.locals.refreshedTokenMessage})`
- Returns a 401 error if called by a user who is not authenticated (authType = Simple)
*/
export const getCategories = async (req, res) => {
    try {

        const { authorized, cause } = verifyAuthSimple(req, res);
        if (!authorized) return res.status(401).json({ error: cause })

        let data = await categories.find({})

        let filter = data.map(v => Object.assign({}, { type: v.type, color: v.color }))

        return res.json({
            data: filter,
            refreshedTokenMessage: res.locals.refreshedTokenMessage
        })
    } catch (error) {
        return res.status(500).json({ error: error.message })
    }
}

/**
 * Create a new transaction made by a specific user
- Request Parameters: A string equal to the `username` of the involved user
  - Example: `/api/users/Mario/transactions`
- Request Body Content: An object having attributes `username`, `type` and `amount`
  - Example: `{username: "Mario", amount: 100, type: "food"}`
- Response `data` Content: An object having attributes `username`, `type`, `amount` and `date`
  - Example: `res.status(200).json({data: {username: "Mario", amount: 100, type: "food", date: "2023-05-19T00:00:00"}, refreshedTokenMessage: res.locals.refreshedTokenMessage})`
- Returns a 400 error if the request body does not contain all the necessary attributes
- Returns a 400 error if at least one of the parameters in the request body is an empty string
- Returns a 400 error if the type of category passed in the request body does not represent a category in the database
- Returns a 400 error if the username passed in the request body is not equal to the one passed as a route parameter
- Returns a 400 error if the username passed in the request body does not represent a user in the database
- Returns a 400 error if the username passed as a route parameter does not represent a user in the database
- Returns a 400 error if the amount passed in the request body cannot be parsed as a floating value (negative numbers are accepted)
- Returns a 401 error if called by an authenticated user who is not the same user as the one in the route parameter (authType = User)
*/
export const createTransaction = async (req, res) => {
    try {

        let { authorized, cause } = verifyAuthUser(req, res, req.params.username);
        if (!authorized) return res.status(401).json({ error: cause });

        const username_param = req.params.username;
        const username_body = req.body.username;
        const amount = req.body.amount;
        const type = req.body.type;

        if (username_body == '' || (username_body && !username_body.trim().length)) {
            return res.status(400).json({ error: "Username is empty" });
        }
        if (!username_body) {
            return res.status(400).json({ error: "Username is not provided" });
        }

        if (amount == '') {
            return res.status(400).json({ error: "Amount is empty" });
        }
        if (!amount) {
            return res.status(400).json({ error: "Amount is not provided" });
        }

        if (type == '' || (type && !type.trim().length)) {
            return res.status(400).json({ error: "Category is empty" });
        }
        if (!type) {
            return res.status(400).json({ error: "Category is not provided" });
        }

        // check if username in request body and parameters are the same
        if (username_body !== username_param) {
            return res.status(400).json({ error: "Username provided in the request body does not match the username provided in the request params" })
        };

        // check if amount string passed in body contains a float
        if (!/^[-+]?[0-9]*\.?[0-9]+$/.test(amount)) return res.status(400).json({ error: "Amount should be a number" });

        // check if the category type in the body represents a category in the database
        let result = await categories.countDocuments({ type })
        if (result !== 1) return res.status(400).json({ error: "Category does not exist" });

        // check if the username provided in the request reperesents a user in the database
        result = await User.countDocuments({ username: username_param })
        

        if (result !== 1) return res.status(400).json({ error: "User does not exist" });

        const new_transactions = new transactions({ username: username_body, amount, type });
        new_transactions.save()
            .then(data => {return res.status(200).json({
                data,
                refreshedTokenMessage: res.locals.refreshedTokenMessage
            })})
    } catch (error) {
        
        return res.status(500).json({ error: error.message })
    }
}

/**
 * Return all transactions made by all users
 - Request Parameters: None
 - Request Body Content: None
 - Response `data` Content: An array of objects, each one having attributes `username`, `type`, `amount`, `date` and `color`
  - Example: `res.status(200).json({data: [{username: "Mario", amount: 100, type: "food", date: "2023-05-19T00:00:00", color: "red"}, {username: "Mario", amount: 70, type: "health", date: "2023-05-19T10:00:00", color: "green"}, {username: "Luigi", amount: 20, type: "food", date: "2023-05-19T10:00:00", color: "red"} ], refreshedTokenMessage: res.locals.refreshedTokenMessage})`
 - Returns a 401 error if called by an authenticated user who is not an admin (authType = Admin)
**/
export const getAllTransactions = async (req, res) => {
    try {

        let { authorized, cause } = verifyAuthAdmin(req, res);
        if (!authorized) return res.status(401).json({ error: cause });

        transactions.aggregate([
            {
                $lookup: {
                    from: "categories",
                    localField: "type",
                    foreignField: "type",
                    as: "categories_info"
                }
            },
            { $unwind: "$categories_info" }
        ]).then((result) => {
            let data = result.map(v => Object.assign({}, { /*_id: v._id,*/ username: v.username, amount: v.amount, type: v.type, color: v.categories_info.color, date: v.date }))
            return res.status(200).json({
                data: data,
                refreshedTokenMessage: res.locals.refreshedTokenMessage
            });
        })
    } catch (error) {
        return res.status(500).json({ error: error.message })
    }
}

/**
 * Return all transactions made by a specific user
  - Request Parameters: A string equal to the `username` of the involved user
    - Example: `/api/users/Mario/transactions` (user route)
    - Example: `/api/transactions/users/Mario` (admin route)
  - Request Body Content: None
  - Response `data` Content: An array of objects, each one having attributes `username`, `type`, `amount`, `date` and `color`
    - Example: `res.status(200).json({data: [{username: "Mario", amount: 100, type: "food", date: "2023-05-19T00:00:00", color: "red"}, {username: "Mario", amount: 70, type: "health", date: "2023-05-19T10:00:00", color: "green"} ] refreshedTokenMessage: res.locals.refreshedTokenMessage})`
  - Returns a 400 error if the username passed as a route parameter does not represent a user in the database
  - Returns a 401 error if called by an authenticated user who is not the same user as the one in the route (authType = User) if the route is `/api/users/:username/transactions`
  - Returns a 401 error if called by an authenticated user who is not an admin (authType = Admin) if the route is `/api/transactions/users/:username`
  - Can be filtered by date and amount if the necessary query parameters are present and if the route is `/api/users/:username/transactions`
*/
export const getTransactionsByUser = async (req, res) => {
    try {
        //Distinction between route accessed by Admins or Regular users for functions that can be called by both
        //and different behaviors and access rights
        let filters;
        if (req.url.indexOf("/transactions/users/") >= 0) {
            // admin authentication
            const { authorized, cause } = verifyAuthAdmin(req, res);
            if (!authorized) return res.status(401).json({ error: cause })


            filters = {username : req.params.username};                        
        } else {
            // regular user authentication                        
            const {authorized, cause} = verifyAuthUser(req, res, req.params.username);            
            if(!authorized) return res.status(401).json({error: cause})

            const amountFilter = handleAmountFilterParams(req);
            const dateFilter = handleDateFilterParams(req);

            filters = { $and: [] }

            filters["$and"].push(amountFilter);
            filters["$and"].push(dateFilter);
            filters["$and"].push({username : req.params.username});
        }                  

        const { username } = req.params;

        // check if username passed in params represents a user in the database
        let result = await User.countDocuments({ username });
        if (result !== 1) {
            return res.status(400).json({ error: "User does not exist" });
        }

        const projection = {
            _id: 0, username: 1, type: 1, amount: 1, date: 1, color: 1, "category.color": 1
        }

        result = await transactions.aggregate(
            [{
                $match: filters
            }, {
                $lookup: {
                    from: "categories",
                    localField: "type",
                    foreignField: "type",
                    as: "category"
                }
            },
            {
                $project: projection
            }]
        );

        result = result.map(transaction => {
            return {
                color: transaction.category[0].color,
                username: transaction.username,
                type: transaction.type,
                amount: transaction.amount,
                date: transaction.date
            }
        });

        return res.status(200).json({
            data: result,
            refreshedTokenMessage: res.locals.refreshedTokenMessage
        })

    } catch (error) {
        return res.status(500).json({ error: error.message })
    }
}

/**
 * Return all transactions made by a specific user filtered by a specific category
    - The behavior defined below applies only for the specified route
    - Request Parameters: A string equal to the `username` of the involved user, a string equal to the requested `category`
      - Example: `/api/users/Mario/transactions/category/food` (user route)
      - Example: `/api/transactions/users/Mario/category/food` (admin route)
    - Request Body Content: None
    - Response `data` Content: An array of objects, each one having attributes `username`, `type`, `amount`, `date` and `color`, filtered so that `type` is the same for all objects
      - Example: `res.status(200).json({data: [{username: "Mario", amount: 100, type: "food", date: "2023-05-19T00:00:00", color: "red"} ] refreshedTokenMessage: res.locals.refreshedTokenMessage})`
    - Returns a 400 error if the username passed as a route parameter does not represent a user in the database
    - Returns a 400 error if the category passed as a route parameter does not represent a category in the database
    - Returns a 401 error if called by an authenticated user who is not the same user as the one in the route (authType = User) if the route is `/api/users/:username/transactions/category/:category`
    - Returns a 401 error if called by an authenticated user who is not an admin (authType = Admin) if the route is `/api/transactions/users/:username/category/:category`
*/
export const getTransactionsByUserByCategory = async (req, res) => {
    try {

        const { username, category: type } = req.params;

        if (req.url.indexOf("/transactions/users/") >= 0) {
            // admin authentication
            const { authorized, cause } = verifyAuthAdmin(req, res);
            if (!authorized) return res.status(401).json({ error: cause })
        } else {
            // regular user authentication
            const { authorized, cause } = verifyAuthUser(req, res, username);
            if (!authorized) return res.status(401).json({ error: cause })
        }

        // check if username passed in params represents a user in the database
        let result = await User.countDocuments({ username });
        if (result !== 1) {
            return res.status(400).json({ error: "User does not exist" });
        }

        // check if category passed in params represents a category in the database
        result = await categories.countDocuments({ type });
        if (result !== 1) {
            return res.status(400).json({ error: "Category does not exist" })
        }

        const projection = {
            _id: 0, username: 1, type: 1, amount: 1, date: 1, color: 1, category: 1
        }

        result = await transactions.aggregate(
            [
                {
                    $match : {
                        type,
                        username
                    }    
                },
                {
                    $lookup: {
                        from: "categories",
                        localField: "type",
                        foreignField: "type",
                        as: "category"
                    }
                },
                {
                    $project: projection
                }
            ]
        );

        result = result.map(transaction => {
            return {
                color: transaction.category[0].color,
                username: transaction.username,
                type: transaction.type,
                amount: transaction.amount,
                date: transaction.date
            }
        });

        res.status(200).json({
            data: result,
            refreshedTokenMessage: res.locals.refreshedTokenMessage
        })

    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

/**
 * Return all transactions made by members of a specific group
  - Request Parameters: A string equal to the `name` of the requested group
  - Example: `/api/groups/Family/transactions` (user route)
  - Example: `/api/transactions/groups/Family` (admin route)
   - Request Body Content: None
   - Response `data` Content: An array of objects, each one having attributes `username`, `type`, `amount`, `date` and `color`
  - Example: `res.status(200).json({data: [{username: "Mario", amount: 100, type: "food", date: "2023-05-19T00:00:00", color: "red"}, {username: "Mario", amount: 70, type: "health", date: "2023-05-19T10:00:00", color: "green"}, {username: "Luigi", amount: 20, type: "food", date: "2023-05-19T10:00:00", color: "red"} ] refreshedTokenMessage: res.locals.refreshedTokenMessage})`
   - Returns a 400 error if the group name passed as a route parameter does not represent a group in the database
   - Returns a 401 error if called by an authenticated user who is not part of the group (authType = Group) if the route is `/api/groups/:name/transactions`
  - Returns a 401 error if called by an authenticated user who is not an admin (authType = Admin) if the route is `/api/transactions/groups/:name`
*/
export const getTransactionsByGroup = async (req, res) => {
    try {
        const { name } = req.params;

        if (req.url.indexOf("/transactions/groups/") >= 0) {
            // admin authentication
            const { authorized, cause } = verifyAuthAdmin(req, res);
            if (!authorized) return res.status(401).json({ error: cause })
        } else {
            // regular user authentication
            const { authorized, cause } = await verifyAuthGroup(req, res, name);                        
            if (!authorized){
                if(cause === "Group does not exist") return res.status(400).json({error : cause})
                else return res.status(401).json({ error: cause })
            }
        }

        // get group members
        let result = await Group.aggregate([
            {
                $match: {
                    name
                }
            },         
            {
                $lookup: {
                    from: "users",
                    localField: "members.email",
                    foreignField: "email",
                    as: "members_info"
                }
            },{
                $project : {
                    _id : 0,
                    "members_info.username" : 1
                }
            }                       
        ])    
        
        

        if(result.length === 0){
            return res.status(400).json({ error : "Group does not exist" })
        }        
        
        let members = result[0].members_info.map(m => m.username)            

        // get transactions
        const projection = {
            _id: 0, username: 1, type: 1, amount: 1, date: 1, color: 1, category: 1
        }

        result = await transactions.aggregate(
            [
                {
                    $match: {
                        username: {
                            $in: members
                        }
                    }
                },
                {
                    $lookup: {
                        from: "categories",
                        localField: "type",
                        foreignField: "type",
                        as: "category"
                    }
                },
                {
                    $project: projection
                }
            ]
        );

        result = result.map(transaction => {
            return {
                color: transaction.category[0].color,
                username: transaction.username,
                type: transaction.type,
                amount: transaction.amount,
                date: transaction.date
            }
        });

        res.status(200).json({
            data: result,
            refreshedTokenMessage: res.locals.refreshedTokenMessage
        })

    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

/**
 * Return all transactions made by members of a specific group filtered by a specific category
  - Request Parameters: A string equal to the `name` of the requested group, a string equal to the requested `category`
  - Example: `/api/groups/Family/transactions/category/food` (user route)
  - Example: `/api/transactions/groups/Family/category/food` (admin route)
- Request Body Content: None
- Response `data` Content: An array of objects, each one having attributes `username`, `type`, `amount`, `date` and `color`, filtered so that `type` is the same for all objects.
  - Example: `res.status(200).json({data: [{username: "Mario", amount: 100, type: "food", date: "2023-05-19T00:00:00", color: "red"}, {username: "Luigi", amount: 20, type: "food", date: "2023-05-19T10:00:00", color: "red"} ] refreshedTokenMessage: res.locals.refreshedTokenMessage})`
- Returns a 400 error if the group name passed as a route parameter does not represent a group in the database
- Returns a 400 error if the category passed as a route parameter does not represent a category in the database
- Returns a 401 error if called by an authenticated user who is not part of the group (authType = Group) if the route is `/api/groups/:name/transactions/category/:category`
- Returns a 401 error if called by an authenticated user who is not an admin (authType = Admin) if the route is `/api/transactions/groups/:name/category/:category`
 */
export const getTransactionsByGroupByCategory = async (req, res) => {

    try {
        const regexp = new RegExp('\/transactions\/groups\/(.*)\/category\/(.*)')
        /**
         * MongoDB equivalent to the query 
         * 
         * SELECT USERNAME, TYPE, AMOUNT, DATE, COLOR
         * FROM TRANSACTION, USER, GROUP, CATEGORIES
         * WHERE USER.USERNAME = TRANSACTION.USERNAME AND
         * USER.USERNAME = GROUP.USERNAME AND
         * GROUP.NAME = $GROUPNAME AND 
         * TRANSACTION.TYPE = CATEGORIES.TYPE AND
         * CATEGORIES.TYPE = $CATEGORYTYPE
         * 
         *  */

        const groupName = req.params.name
        const categoryType = req.params.category


        if (!req.url.match(regexp)) {
            // group authentication                     
            const { authorized, cause } = await verifyAuthGroup(req, res, groupName);                        
            if (!authorized){
                if(cause === "Group does not exist") return res.status(400).json({error : cause})
                else return res.status(401).json({ error: cause })
            }
        }
        else {
            // admin authentication                     
            const { authorized, cause } = verifyAuthAdmin(req, res);
            
            if (!authorized) return res.status(401).json({ error: cause })
        }

        // group is not into the db
        let found = await Group.findOne({ name: groupName })        
        if (!found) {
            return res.status(400).json({ error: "group does not exist" })
        }        
        // category is not into the db
        found = await categories.findOne({ type: categoryType })        
        if (!found)
            return res.status(400).json({ error: "category does not exist" })

        let members = await Group.aggregate([
            { $match: { name: groupName } },
            {
                $lookup: {
                    from: "users",
                    localField: "members.email",
                    foreignField: "email",
                    as: "members_info"
                }
            },{
                $project : {                    
                    "members_info.username" : 1
                }
            }
        ]);         
        
        

        if (members.length === 0) {
            return res.status(400).json({ error: "group or category does not exist" })
        }   

        members = members[0].members_info.map(m => m.username)                        

        const query = await transactions.aggregate([
            {
                $match: {
                    "username": { $in: members }
                }
            },
            {
                $lookup: {
                    from: "categories",
                    localField: "type",
                    foreignField: "type",
                    as: "categories_info"
                }
            },
            { $match: { type: categoryType } },
            { $unwind: "$categories_info" }
        ])
        
        let result = query.map(item => {return {username : item.username, type : item.type, amount : item.amount, date : item.date, color : item.categories_info.color}})        
        res.status(200).json({ data: result, refreshedTokenMessage: res.locals.refreshedTokenMessage })        

    } catch (error) {        
        res.status(500).json({ error: error.message })
    }
}

/**
 * Delete a transaction made by a specific user
 - Request Parameters: A string equal to the `username` of the involved user
  - Example: `/api/users/Mario/transactions`
- Request Body Content: The `_id` of the transaction to be deleted
  - Example: `{_id: "6hjkohgfc8nvu786"}`
- Response `data` Content: A string indicating successful deletion of the transaction
  - Example: `res.status(200).json({data: {message: "Transaction deleted"}, refreshedTokenMessage: res.locals.refreshedTokenMessage})`
- Returns a 400 error if the request body does not contain all the necessary attributes
- Returns a 400 error if the username passed as a route parameter does not represent a user in the database
- Returns a 400 error if the `_id` in the request body does not represent a transaction in the database
- Returns a 401 error if called by an authenticated user who is not the same user as the one in the route (authType = User)
*/
export const deleteTransaction = async (req, res) => {
    try {
        const id = req.body._id
        const username = req.params.username

        const userAuthInfo = verifyAuthUser(req, res, username)

        if (!userAuthInfo.authorized) {
            return res.status(401).json({ error: userAuthInfo.cause })
        }        

        // body is not complete
        if (!id || id === '') return res.status(400).json({ error: 'body does not contain all the necessary attributes' })
        
        // user not found
        let found = await User.findOne({ username: username })
        if (!found)
            return res.status(400).json({ error: 'user not found' })

        // transaction not found
        found = await transactions.findOne({ _id: id })
        if (!found)
            return res.status(400).json({ error: 'transaction not found' })

        if(found.username != username)
            return res.status(400).json({ error: 'transaction not found for the user' })

        const query = { _id: mongoose.Types.ObjectId(id), username: username }
        const data = await transactions.deleteOne(query);
        if (data.deletedCount === 0)
            return res.status(400).json({ error: "transaction not found" })

        res.status(200).json({ data: { message: "Transaction deleted" }, refreshedTokenMessage: res.locals.refreshedTokenMessage })
    } catch (error) {
        
        res.status(500).json({ error: error.message })
    }
}

/**
 * Delete multiple transactions identified by their ids
 - Request Parameters: None
- Request Body Content: An array of strings that lists the `_ids` of the transactions to be deleted
  - Example: `{_ids: ["6hjkohgfc8nvu786"]}`
- Response `data` Content: A message confirming successful deletion
  - Example: `res.status(200).json({data: {message: "Transactions deleted"}, refreshedTokenMessage: res.locals.refreshedTokenMessage})`
- In case any of the following errors apply then no transaction is deleted
- Returns a 400 error if the request body does not contain all the necessary attributes
- Returns a 400 error if at least one of the ids in the array is an empty string
- Returns a 400 error if at least one of the ids in the array does not represent a transaction in the database
- Returns a 401 error if called by an authenticated user who is not an admin (authType = Admin)
*/
export const deleteTransactions = async (req, res) => {
    try {
        const adminAuthInfo = verifyAuthAdmin(req, res)
        if (!adminAuthInfo.authorized) {
            return res.status(401).json({ error: adminAuthInfo.cause })
        }

        const _ids = req.body._ids
        if (!_ids)
            return res.status(400).json({ error: 'body does not contain all the necessary attributes' })

        if (_ids.includes(""))
            return res.status(400).json({ error: "input _ids are not valid" });

        let result = await transactions.find({
            _id: {
                $in: _ids
            }
        },
            { _id: 1 }
        );

        result = result.map(obj => obj._id.toString());
        let notFound = _ids.filter(id => !result.includes(id));

        if (notFound.length !== 0) {
            return res.status(400).json({ error: `the following transactions don't exist : ${notFound.join(",")}` });
        }

        result = await transactions.deleteMany({ _id: { $in: _ids } })

        res.status(200).json({ data: { message: "Transactions deleted" }, refreshedTokenMessage: res.locals.refreshedTokenMessage })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}
