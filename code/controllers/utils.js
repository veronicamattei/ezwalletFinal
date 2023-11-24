import jwt, { decode } from 'jsonwebtoken'
import { Group, User } from '../models/User.js';

/*
- Returns an object with a `date` attribute used for filtering mongoDB's `aggregate` queries
- The value of `date` is an object that depends on the query parameters:
  - If the query parameters include `from` then it must include a `$gte` attribute that specifies the starting date as a `Date` object in the format **YYYY-MM-DDTHH:mm:ss**
    - Example: `/api/users/Mario/transactions?from=2023-04-30` => `{date: {$gte: 2023-04-30T00:00:00.000Z}}`
  - If the query parameters include `upTo` then it must include a `$lte` attribute that specifies the ending date as a `Date` object in the format **YYYY-MM-DDTHH:mm:ss**
    - Example: `/api/users/Mario/transactions?upTo=2023-05-10` => `{date: {$lte: 2023-05-10T23:59:59.000Z}}`
  - If both `from` and `upTo` are present then both `$gte` and `$lte` must be included
  - If `date` is present then it must include both `$gte` and `$lte` attributes, these two attributes must specify the same date as a `Date` object in the format **YYYY-MM-DDTHH:mm:ss**
    - Example: `/api/users/Mario/transactions?date=2023-05-10` => `{date: {$gte: 2023-05-10T00:00:00.000Z, $lte: 2023-05-10T23:59:59.000Z}}`
  - If there is no query parameter then it returns an empty object
    - Example: `/api/users/Mario/transactions` => `{}`
- Throws an error if `date` is present in the query parameter together with at least one of `from` or `upTo`
- Throws an error if the value of any of the three query parameters is not a string that represents a date in the format **YYYY-MM-DD**
*/
export const handleDateFilterParams = (req) => {

    const {from, upTo, date} = req.query;

    // validate filters
    if(date && (upTo || from)) throw new Error('Cannot use date filter with upTo or from');
    
    const re = new RegExp("^[0-9]{4}-[0-9]{2}-[0-9]{2}$");
    if(date && !re.test(date)) throw new Error('Invalid date format');
    if(from && !re.test(from)) throw new Error('Invalid date format');
    if(upTo && !re.test(upTo)) throw new Error('Invalid date format');    

    if(date){
        const [year, month, day] = date.split("-"); 
        if(month > 12 || month < 1 || day > 31 || day < 1) throw new Error('Invalid date format');  
        const dateStart = new Date(Date.UTC(Number(year), Number(month)-1, Number(day), 0, 0, 0)); 
        const dateEnd = new Date(Date.UTC(Number(year), Number(month)-1, Number(day), 23, 59, 59));         
        return {
            date : {
                $gte : dateStart,
                $lte : dateEnd
            }
        }
    }else if(from || upTo){
        let filter = {
            date : {}
        }

        if(from){
            const [year, month, day] = from.split("-");   
            if(month > 12 || month < 1 || day > 31 || day < 1) throw new Error('Invalid date format');
            const dateStart = new Date(Date.UTC(Number(year), Number(month)-1, Number(day), 0, 0, 0));
            filter.date["$gte"] = dateStart
        }
        if(upTo){
            const [year, month, day] = upTo.split("-");   
            if(month > 12 || month < 1 || day > 31 || day < 1) throw new Error('Invalid date format');
            const dateEnd = new Date(Date.UTC(Number(year), Number(month)-1, Number(day), 23, 59, 59));
            filter.date["$lte"] = dateEnd
        } 
        return filter;
    }else{
        return {};
    }
}

/**
 * Handle possible authentication modes depending on `authType`
 * @param req the request object that contains cookie information
 * @param res the result object of the request
 * @param info an object that specifies the `authType` and that contains additional information, depending on the value of `authType`
 *      Example: {authType: "Simple"}
 *      Additional criteria:
 *          - authType === "User":
 *              - either the accessToken or the refreshToken have a `username` different from the requested one => error 401
 *              - the accessToken is expired and the refreshToken has a `username` different from the requested one => error 401
 *              - both the accessToken and the refreshToken have a `username` equal to the requested one => success
 *              - the accessToken is expired and the refreshToken has a `username` equal to the requested one => success
 *          - authType === "Admin":
 *              - either the accessToken or the refreshToken have a `role` which is not Admin => error 401
 *              - the accessToken is expired and the refreshToken has a `role` which is not Admin => error 401
 *              - both the accessToken and the refreshToken have a `role` which is equal to Admin => success
 *              - the accessToken is expired and the refreshToken has a `role` which is equal to Admin => success
 *          - authType === "Group":
 *              - either the accessToken or the refreshToken have a `email` which is not in the requested group => error 401
 *              - the accessToken is expired and the refreshToken has a `email` which is not in the requested group => error 401
 *              - both the accessToken and the refreshToken have a `email` which is in the requested group => success
 *              - the accessToken is expired and the refreshToken has a `email` which is in the requested group => success
 * @returns true if the user satisfies all the conditions of the specified `authType` and false if at least one condition is not satisfied
 *  Refreshes the accessToken if it has expired and the refreshToken is still valid
 */
export const verifyAuth = (req, res, info) => {
    const cookie = req.cookies
    if (!cookie.accessToken || !cookie.refreshToken) {
        return { authorized: false, cause: "Unauthorized"}
    }
    try {        
        const decodedAccessToken = jwt.verify(cookie.accessToken, process.env.ACCESS_KEY);
        const decodedRefreshToken = jwt.verify(cookie.refreshToken, process.env.ACCESS_KEY);        
        if (!decodedAccessToken.username || !decodedAccessToken.email || !decodedAccessToken.role) {
            return { authorized: false, cause: "Token is missing information"}
        }
        if (!decodedRefreshToken.username || !decodedRefreshToken.email || !decodedRefreshToken.role) {
            return { authorized: false, cause: "Token is missing information" }
        }
        if (decodedAccessToken.username !== decodedRefreshToken.username || decodedAccessToken.email !== decodedRefreshToken.email || decodedAccessToken.role !== decodedRefreshToken.role) {
            return { authorized: false, cause: "Mismatched users" }
        }
        if (info.authType === 'User') {
            const requestedUsername = info.username
            if (decodedAccessToken.username != requestedUsername /* || decodedRefreshToken.username != requestedUsername */) {
                return { authorized: false, cause: "Username does not match with requested one" }
            }
            if (decodedAccessToken.username === requestedUsername /* && decodedRefreshToken.username === requestedUsername */) {
                return { authorized: true, cause: "Authorized" }
            }
        }
        else if (info.authType === 'Admin') {
            if (decodedAccessToken.role != 'Admin' /* || decodedRefreshToken.role != 'Admin' */) {
                return { authorized: false, cause: "User does not have admin role" }
            }
        } 
        else if (info.authType === 'Group') {
            const requestedEmails = info.emails
            if (!requestedEmails.includes(decodedAccessToken.email) /* || !requestedEmails.includes(decodecRefreshToken.email) */) {
                return { authorized: false, cause: "User is not part of the group" }
            }
        }
        return { authorized: true, cause: "Authorized" }


} catch (err) {
    if (err.name === "TokenExpiredError") {
        try {
            const refreshToken = jwt.verify(cookie.refreshToken, process.env.ACCESS_KEY)
            const newAccessToken = jwt.sign({
                username: refreshToken.username,
                email: refreshToken.email,
                id: refreshToken.id,
                role: refreshToken.role
            }, process.env.ACCESS_KEY, { expiresIn: '1h' })
            res.cookie('accessToken', newAccessToken, { httpOnly: true, path: '/api', maxAge: 60 * 60 * 1000, sameSite: 'none', secure: true })
            res.locals.message = 'Access token has been refreshed. Remember to copy the new one in the headers of subsequent calls'
            if (info.authType === 'User') {
                const requestedUsername = info.username
                if (refreshToken.username != requestedUsername) {
                    return { authorized: false, cause: "Username does not match with requested one" }
                }
            }
            else if (info.authType === 'Admin') {
                if (refreshToken.role != 'Admin') {
                    return { authorized: false, cause: "User does not have admin role" }
                }
            } 
            else if (info.authType === 'Group') {
                const requestedEmails = info.emails
                if (!requestedEmails.includes(refreshToken.email)) {
                    return { authorized: false, cause: "User is not in the group" }
                }    
            }
            return { authorized: true, cause: "Authorized" }
        } catch (err) {
            if (err.name === "TokenExpiredError") {
                return { authorized: false, cause: "Perform login again" }
            } else {
                return { authorized: false, cause: err.name }
            }
        }
    } else {
        return { authorized: false, cause: err.name };
    }
}
}

/*
- Returns an object with an `amount` attribute used for filtering mongoDB's `aggregate` queries
- The value of `amount` is an object that depends on the query parameters:
  - If the query parameters include `min` then it must include a `$gte` attribute that is an integer equal to `min`
    - Example: `/api/users/Mario/transactions?min=10` => `{amount: {$gte: 10} }
  - If the query parameters include `min` then it must include a `$lte` attribute that is an integer equal to `max`
    - Example: `/api/users/Mario/transactions?min=50` => `{amount: {$lte: 50} }
  - If both `min` and `max` are present then both `$gte` and `$lte` must be included
- Throws an error if the value of any of the two query parameters is not a numerical value
*/
export const handleAmountFilterParams = (req) => {

    const {min, max} = req.query;
    
    // if(!min && !max) return {}
    if(min && !/^[0-9\.]+$/.test(min)) throw new Error("min param is not a number");
    if(max && !/^[0-9\.]+$/.test(max)) throw new Error("max param is not a number");

    let filter = {
        amount : {}
    }

    if(!min && !max) return {}
    if(min) filter.amount["$gte"] = Number(min);
    if(max) filter.amount["$lte"] = Number(max);

    return filter
}

/*----------------------------------------------------
    not in the original project
----------------------------------------------------*/

/*
    functions verifyAuthUser(), verifyAuthAdmin(), verifyAuthGroup() are used as wrapper for calling to verifyAuth() 
    the proper way for calling is:

        const simpleAuth = verifyAuth(req, res, {authType: "Simple"})
        const userAuth = await verifyAuthUser(req, res)
        const adminAuth = verifyAuthAdmin(req, res)
        const groupAuth = await verifyAuthGroup(req, res)

    returned object
    {
        authorized: true|false,
        cause: String
    }


    example scenario for getTransactionByGroupByCategory():
    - user can work only with his own group
    - admin does not have this limit
    
export const getTransactionsByGroupByCategory = async (req, res) => {
    // parameters for the function
    const groupName = req.params.name
    const categoryType = req.params.category

    // the functions called are the same and must have different behaviors depending on the route.
    const pathAdmin = '/transactions/groups/:name/category/:category'
    
    // (.*) stands for whatever as parameters' placeholder
    const regexp = new RegExp('/transactions/groups/(.*)/category/(.*)')
    
    const userAuthInfo = await verifyAuthUser(req, res)
    const adminAuthInfo = verifyAuthAdmin(req, res)

    if ( userAuthInfo.authorized) {

        const groupAuthInfo = await verifyAuthGroup(req, res, groupName)
        if ( groupAuthInfo.authorized) {

            // work
        }
        else {

            return res.status(401).json({ message: groupAuthInfo.cause })
        }
    } 
    else if (req.path.match(regexp) && adminAuthInfo.authorized){


        // work
    }
    else {

        return res.status(401).json({ message: adminAuthInfo.cause }) // unauthorized
    }
    ...
}
*/

export function verifyAuthSimple(req, res) {
    if(!req.cookies.accessToken || !req.cookies.refreshToken) 
        return { authorized: false, cause: "Unauthorized"}
    return verifyAuth(req, res, {authType: 'Simple'})
}

export function verifyAuthUser(req, res, username) {
    if(!req.cookies.accessToken || !req.cookies.refreshToken || !username) 
        return { authorized: false, cause: "Unauthorized"}
    return verifyAuth(req, res, {authType: 'User', username})
}

export function verifyAuthAdmin(req, res) {
    if(!req.cookies.accessToken || !req.cookies.refreshToken) 
        return { authorized: false, cause: "Unauthorized"}
    return verifyAuth(req, res, {authType: 'Admin'})
}

export async function verifyAuthGroup(req, res, group) {
    if(!req.cookies.accessToken || !req.cookies.refreshToken || !group) 
        return { authorized: false, cause: "Unauthorized"}
    const document = await Group.findOne({name: group}, {members: 1, _id: 0})
    if (!document)
        return { authorized: false, cause: "Group does not exist"}
    const emails = document.members.map(member => member.email)
    return verifyAuth(req, res, {authType: 'Group', emails: emails})
}


