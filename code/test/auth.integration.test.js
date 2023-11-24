import request from 'supertest';
import { app } from '../app';
import { User } from '../models/User.js';
import jwt from 'jsonwebtoken';
const bcrypt = require("bcryptjs")
import mongoose, { Model } from 'mongoose';
import dotenv from 'dotenv';
import { Group } from '../models/User.js';
import { transactions } from '../models/model';
import { categories } from '../models/model';

dotenv.config();

afterEach(async () => {
  jest.clearAllMocks(); 
  jest.resetAllMocks(); 

  await User.deleteMany();
  await Group.deleteMany();
  await transactions.deleteMany();
  await categories.deleteMany();
})

beforeAll(async () => {
  const dbName = "testingDatabaseAuth";
  const url = `${process.env.MONGO_URI}/${dbName}`;

  await mongoose.connect(url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    
  });

});

afterAll(async () => {
 // await mongoose.connection.db.dropDatabase();
  await mongoose.connection.close();
});

describe('register', () => {
  beforeEach(async () => {
    await User.deleteMany({})
  })

  test('I1: register new user -> return 200 and message: user added succesfully', async()=>{
    const newUser = {
      username : 'user',
      email: 'test@example.com',
      password: '123'
    };

    const resp = await request(app)
    .post(`/api/register`)
    .send(newUser);
     

    expect(resp.status).toBe(200);
    expect(resp.body.data.message).toBe('user added succesfully')


  })

    test('I2: one field is empty -> return 400 and error message', async()=>{
    const newUser = {
      username : '',
      email: 'test@example.com',
      password: '123'
    };

    const resp = await request(app)
    .post(`/api/register`)
    .send(newUser);
     

    expect(resp.status).toBe(400);
    expect(resp.body.error).toBe("empty fields are not allowed")


  })

  test('I3: one field is missing -> return 400 and error message', async()=>{
    const newUser = {
      email: 'test@example.com',
      password: '123'
    };

    const resp = await request(app)
    .post(`/api/register`)
    .send(newUser);
     

    expect(resp.status).toBe(400);
    expect(resp.body.error).toBe("some fields are missing")


  })

  
  test('I4: invalid email-> return 400 and error message', async()=>{
    const newUser = {
      username: 'user',
      email: 'testexample.com',
      password: '123'
    };

    const resp = await request(app)
    .post(`/api/register`)
    .send(newUser);
     

    expect(resp.status).toBe(400);
    expect(resp.body.error).toBe("invalid email")


  })

  test('I5: user already in db-> return 400 and error message', async()=>{
    const user = {
      username: 'user',
      email: 'testexample.com',
      password: '123'
    };

    await User.create(user);

    const resp = await request(app)
    .post(`/api/register`)
    .send(user);
     

    expect(resp.status).toBe(400);
    expect(resp.body.error).toBe("you are already registered")


  })



});

describe("registerAdmin", () => { 
  beforeEach(async () => {
    await User.deleteMany({})
  })

  test('I1: register new admin -> return 200 and message: admin added succesfully', async()=>{
    const newAdmin = {
      username : 'user',
      email: 'test@example.com',
      password: '123'
    };

    const resp = await request(app)
    .post(`/api/admin`)
    .send(newAdmin);
     

    expect(resp.status).toBe(200);
    expect(resp.body.data.message).toBe('admin added succesfully')


  })

    test('T2: one field is empty -> return 200 and error message', async()=>{
    const newAdmin = {
      username : '',
      email: 'test@example.com',
      password: '123'
    };

    const resp = await request(app)
    .post(`/api/admin`)
    .send(newAdmin);
     

    expect(resp.status).toBe(400);
    expect(resp.body.error).toBe("empty fields are not allowed")


  })

  test('I3: one field is missing -> return 400 and error message', async()=>{
    const newAdmin = {
      email: 'test@example.com',
      password: '123'
    };

    const resp = await request(app)
    .post(`/api/admin`)
    .send(newAdmin);
     

    expect(resp.status).toBe(400);
    expect(resp.body.error).toBe("some fields are missing")


  })

  
  test('I4: invalid email-> return 400 and error message', async()=>{
    const newAdmin = {
      username: 'user',
      email: 'testexample.com',
      password: '123'
    };

    const resp = await request(app)
    .post(`/api/admin`)
    .send(newAdmin);
     

    expect(resp.status).toBe(400);
    expect(resp.body.error).toBe("invalid email")


  })

  test('I5: admin already in db-> return 400 and error message', async()=>{
    const admin = {
      username: 'user',
      email: 'testexample.com',
      password: '123'
    };

    await User.create(admin);

    const resp = await request(app)
    .post(`/api/admin`)
    .send(admin);
     

    expect(resp.status).toBe(400);
    expect(resp.body.error).toBe("you are already registered")


  })

})

describe('login', () => { 
  beforeEach(async () => {
    await User.deleteMany({})
  })

  test('I1: login a user -> return 200', async()=>{
    const user = {
     
      username : 'user',
      email: 'test@example.com',
      password: '123'
      
    };

    let hashedPassowrd = await bcrypt.hash(user.password, 12);
    const newUser = await User.create({
      username : user.username,
      email :user.email,
      password: hashedPassowrd

    })
    
    const testUser = {
      email :user.email,
      id: '1',
      username : user.username,
      role: 'Regular'
    }

    const resp = await request(app)
    .post(`/api/login`)
    .send(user);
     

    expect(resp.status).toBe(200);

    var cookies = resp.headers['set-cookie'][0];
    var cookiesArray = cookies.split(";");
    cookiesArray.splice(4,1);
    /////
    var accessToken = cookiesArray[0];
    /////
    accessToken = accessToken.slice(12);
    cookiesArray.splice(0.1);
    cookies = cookiesArray.join(';');

    var cookies = resp.headers['set-cookie'][1];
    var cookiesArray = cookies.split(";");
    cookiesArray.splice(4,1);
    /////
    var refreshToken = cookiesArray[0];
    /////
    refreshToken = refreshToken.slice(13);
    cookiesArray.splice(0.1);
    cookies = cookiesArray.join(';');


    const MockaccessToken = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2ODU1MjAxNTQsImV4cCI6MTcxNzA1NjE1NCwiYXVkIjoid3d3LmV4YW1wbGUuY29tIiwic3ViIjoianJvY2tldEBleGFtcGxlLmNvbSIsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsImlkIjoiMSIsInVzZXJuYW1lIjoidXNlciIsInJvbGUiOiJSZWd1bGFyIn0.J5FWQPm8QihGHKu6AON-TJkCFgNPSO9Tv6l5wYEunpo";
    const MockRefreshToken = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2ODU1MjAxNTQsImV4cCI6MTcxNzA1NjE1NCwiYXVkIjoid3d3LmV4YW1wbGUuY29tIiwic3ViIjoianJvY2tldEBleGFtcGxlLmNvbSIsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsImlkIjoiMSIsInVzZXJuYW1lIjoidXNlciIsInJvbGUiOiJSZWd1bGFyIn0.J5FWQPm8QihGHKu6AON-TJkCFgNPSO9Tv6l5wYEunpo";
    //decode the token
    const decodedMockAccessToken = jwt.verify(MockaccessToken, process.env.ACCESS_KEY);
    const decodedMockRefreshToken = jwt.verify(MockRefreshToken, process.env.ACCESS_KEY);
    // const accessToken = resp.body.data.accessToken;
    // const refreshToken = resp.body.data.refreshToken;

    // var cookies = resp.headers['set-cookie'][0];


    const DecodedAccessToken = jwt.verify(accessToken, process.env.ACCESS_KEY);
    const DecodedRefreshToken = jwt.verify(refreshToken, process.env.ACCESS_KEY);

     const accessEmail = DecodedAccessToken.email;
     const accessUsername = DecodedAccessToken.username;
     const accessRole = DecodedAccessToken.role;
    
    

    const mockAccessEmail = decodedMockAccessToken.email;
    const mockAccessUsername = decodedMockAccessToken.username;
    const mockAccessRole = decodedMockAccessToken.role;
  


    const accessEmail_ref = DecodedRefreshToken.email;
    const accessUsername_ref = DecodedRefreshToken.username;
    const accessRole_ref = DecodedRefreshToken.role;
   

   

   const mockAccessEmail_ref = decodedMockRefreshToken.email;
   const mockAccessUsername_ref = decodedMockRefreshToken.username;
   const mockAccessRole_ref = decodedMockRefreshToken.role;

     expect(accessEmail).toEqual(mockAccessEmail);
     expect(accessUsername).toEqual(mockAccessUsername);
     expect(accessRole).toEqual(mockAccessRole);

     expect(accessEmail_ref).toEqual(mockAccessEmail_ref);
     expect(accessUsername_ref).toEqual(mockAccessUsername_ref);
     expect(accessRole_ref).toEqual(mockAccessRole_ref);
    
    



  })

    test('I2: user does not exist in db -> return 400 and error message', async()=>{
    const newUser = {
      username : '',
      email: 'test@example.com',
      password: '123'
    };

    const resp = await request(app)
    .post(`/api/login`)
    .send(newUser);
     

    expect(resp.status).toBe(400);
    expect(resp.body.error).toBe('please you need to register')


  })

  test('I3: one field is empty -> return 400 and error message', async()=>{
    const user = {
      username : 'user',
      email: 'test@example.com',
      password: '123'
    };

    let hashedPassowrd = await bcrypt.hash(user.password, 12);
    const newUser = await User.create({
      username : user.username,
      email :user.email,
      password: hashedPassowrd

    })

    const userLogIn = {
      email: "test@exapmle.com",
      password: ''
    }
    

    const resp = await request(app)
    .post(`/api/login`)
    .send(userLogIn);
     

    expect(resp.status).toBe(400);
    expect(resp.body.error).toBe("empty fields are not allowed")


  })

  
  test('I4: some fields are missing-> return 400 and error message', async()=>{
    const user = {
      username : 'user',
      email: 'test@example.com',
      password: '123'
    };

    let hashedPassowrd = await bcrypt.hash(user.password, 12);
    const newUser = await User.create({
      username : user.username,
      email :user.email,
      password: hashedPassowrd

    })

    const userLogIn = {
      email: "test@exapmle.com",
      
    }
    

    const resp = await request(app)
    .post(`/api/login`)
    .send(userLogIn);
     

    expect(resp.status).toBe(400);
    expect(resp.body.error).toBe("some fields are missing")



  })

  test('I5: invalid email-> return 400 and error message', async()=>{
    const user = {
      username : 'user',
      email: 'test@example.com',
      password: '123'
    };

    let hashedPassowrd = await bcrypt.hash(user.password, 12);
    const newUser = await User.create({
      username : user.username,
      email :user.email,
      password: hashedPassowrd

    })

    const userLogIn = {
      email: "testexapmle.com",
      password: '123'
      
    }
    

    const resp = await request(app)
    .post(`/api/login`)
    .send(userLogIn);
     

    expect(resp.status).toBe(400);
    expect(resp.body.error).toBe("invalid email")



  })
  test('I6: wrong password-> return 400 and error message', async()=>{
    const user = {
      username : "user",
      email: "test@example.com",
      password: "123"
    };

    let hashedPassowrd = await bcrypt.hash(user.password, 12);
    const newUser = await User.create({
      username : user.username,
      email :user.email,
      password: hashedPassowrd

    })

    const userLogIn = {
      email: "test@example.com",
      password: '123456'
      
    }
    

    const resp = await request(app)
    .post(`/api/login`)
    .send(userLogIn);
     

    expect(resp.status).toBe(400);
    expect(resp.body.error).toBe("wrong credentials")



  })

});

describe('logout', () => { 
  beforeEach(async () => {
    await User.deleteMany({})
  })

  test('I1: logout the user -> return 200 and message: logged out', async()=>{
        const user = {
          username : 'user',
          email: 'test@example.com',
          password: '123'
        };

        let hashedPassowrd = await bcrypt.hash(user.password, 12);
        const newUser = await User.create({
          username : user.username,
          email :user.email,
          password: hashedPassowrd,
          refreshToken: "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2ODU1MjAxNTQsImV4cCI6MTcxNzA1NjE1NCwiYXVkIjoid3d3LmV4YW1wbGUuY29tIiwic3ViIjoianJvY2tldEBleGFtcGxlLmNvbSIsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsImlkIjoiMSIsInVzZXJuYW1lIjoidXNlciIsInJvbGUiOiJSZWd1bGFyIn0.J5FWQPm8QihGHKu6AON-TJkCFgNPSO9Tv6l5wYEunpo"

        })
        const resp = await request(app)
        .get(`/api/logout`)
        .set("Cookie", `refreshToken=${newUser.refreshToken}`);

     
    expect(resp.status).toBe(200);
    expect(resp.body.data).toEqual({ message: 'logged out' });


  })

  test('I2: no refresh token in the cookies -> return 400 and error message', async()=>{
    const user = {
      username : 'user',
      email: 'test@example.com',
      password: '123',
      refreshToken: "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2ODU1MjAxNTQsImV4cCI6MTcxNzA1NjE1NCwiYXVkIjoid3d3LmV4YW1wbGUuY29tIiwic3ViIjoianJvY2tldEBleGFtcGxlLmNvbSIsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsImlkIjoiMSIsInVzZXJuYW1lIjoidXNlciIsInJvbGUiOiJSZWd1bGFyIn0.J5FWQPm8QihGHKu6AON-TJkCFgNPSO9Tv6l5wYEunpo"
    };

    let hashedPassowrd = await bcrypt.hash(user.password, 12);
    const newUser = await User.create({
      username : user.username,
      email :user.email,
      password: hashedPassowrd,

    })
    const resp = await request(app)
    .get(`/api/logout`);

 
expect(resp.status).toBe(400);
expect(resp.body.error).toEqual('no refresh token');


})



test('I3: wrong refresh token -> return 400 and error message', async()=>{
  const user = {
    username : 'user',
    email: 'test@example.com',
    password: '123'
  };

  let hashedPassowrd = await bcrypt.hash(user.password, 12);
  const newUser = await User.create({
    username : user.username,
    email :user.email,
    password: hashedPassowrd,
    refreshToken: " wrong"

  })
  const resp = await request(app)
  .get(`/api/logout`)
  .set("Cookie", `refreshToken=${newUser.refreshToken}`);


expect(resp.status).toBe(400);
expect(resp.body.error).toBe('user not found');


})





    
});
