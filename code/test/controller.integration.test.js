import request from 'supertest';
import { app } from '../app';
import { User, Group } from '../models/User';
import { categories, transactions } from '../models/model';
import mongoose, { Model } from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();






beforeAll(async () => {

    const dbName = "test";
    const url = `${process.env.MONGO_URI}/${dbName}`;

    await mongoose.connect(url, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });

});

afterAll(async () => {    
    await mongoose.connection.db.dropDatabase();
    await mongoose.connection.close();
});

afterEach(async () => {
    jest.clearAllMocks(); 
    jest.resetAllMocks(); 

    await User.deleteMany();
    await Group.deleteMany();
    await transactions.deleteMany();
    await categories.deleteMany();
})

describe("createCategory", () => {
    let refreshTokenUser = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU1NTY4NzksImV4cCI6MTcxNzA5Mjg4MCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJ1c2VyMSIsImVtYWlsIjoidXNlcjFAdGVzdC5jb20iLCJpZCI6ImR1bW15X2lkIiwicm9sZSI6IlJlZ3VsYXIifQ.jiYB0SnMggwGL4q-2BfybxPuvU8MGvGonUNx3BZNmho';
    let refreshTokenAdmin = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU1NTY4NzksImV4cCI6MTcxNzA5Mjg4MCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJ1c2VyMyIsImVtYWlsIjoidXNlcjNAdGVzdC5jb20iLCJpZCI6ImR1bW15X2lkIiwicm9sZSI6IkFkbWluIn0.GG5693N9mnBd9tODTOSB6wedJLwBEFtdMHe-8HqryHU';
    beforeEach(async () => {

        await User.create([{
            username: "user1",
            email: "user1@test.com",
            password: "dummyPassword",
            refreshToken: refreshTokenUser
        }, {
            username: "admin",
            email: "admin@email.com",
            password: "admin",
            refreshToken: refreshTokenAdmin,
            role: "Admin"
        }])

        await categories.create({
            type: "food",
            color: "red"
        })
    })

    test('I1: create a new category -> return a 200 status and the saved category with refreshed token message', async () => {
        const response = await request(app)
            .post("/api/categories")
            .set("Cookie", `accessToken=${refreshTokenAdmin}; refreshToken=${refreshTokenAdmin}`)
            .send({ type: "health", color: "red" })

        expect(response.status).toBe(200)
        expect(response.body.data).toHaveProperty("type", "health")
        expect(response.body.data).toHaveProperty("color", "red")
    });

    test('I2: not an admin request -> return a 401 status with the error message', async () => {
        const response = await request(app)
            .post("/api/categories")
            .set("Cookie", `accessToken=${refreshTokenUser}; refreshToken=${refreshTokenUser}`)
            .send({ type: "health", color: "red" })

        expect(response.status).toBe(401)
        const errorMessage = response.body.error ? true : response.body.message ? true : false
        expect(errorMessage).toBe(true)
    });

    test('I3: missing type -> return a 400 status with the error message', async () => {
        const response = await request(app)
            .post("/api/categories")
            .set("Cookie", `accessToken=${refreshTokenAdmin}; refreshToken=${refreshTokenAdmin}`)
            .send({ color: "red" })

        expect(response.status).toBe(400)
        expect(response.body.error).toBe("type is not provided")
    });

    test('I4: missing color -> return a 400 status with the error message', async () => {
        const response = await request(app)
            .post("/api/categories")
            .set("Cookie", `accessToken=${refreshTokenAdmin}; refreshToken=${refreshTokenAdmin}`)
            .send({ type: "health" })

        expect(response.status).toBe(400)
        expect(response.body.error).toBe("color is not provided")
    });

    test('I5: empty type -> return a 400 status with the error message', async () => {
        const response = await request(app)
            .post("/api/categories")
            .set("Cookie", `accessToken=${refreshTokenAdmin}; refreshToken=${refreshTokenAdmin}`)
            .send({ type: "", color: "red" })

        expect(response.status).toBe(400)
        expect(response.body.error).toBe("type is empty")
    });

    test('I6: empty color -> return a 400 status with the error message', async () => {
        const response = await request(app)
            .post("/api/categories")
            .set("Cookie", `accessToken=${refreshTokenAdmin}; refreshToken=${refreshTokenAdmin}`)
            .send({ type: "health", color: "" })

        expect(response.status).toBe(400)
        expect(response.body.error).toBe("color is empty")
    });

    test('I7: already existing category type -> return a 400 status with the error message', async () => {
        const response = await request(app)
            .post("/api/categories")
            .set("Cookie", `accessToken=${refreshTokenAdmin}; refreshToken=${refreshTokenAdmin}`)
            .send({ type: "food", color: "blue" })

        expect(response.status).toBe(400)
        expect(response.body.error).toBe("category type is already in use")
    });
})

describe("updateCategory", () => {
    let refreshTokenUser = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU1NTY4NzksImV4cCI6MTcxNzA5Mjg4MCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJ1c2VyMSIsImVtYWlsIjoidXNlcjFAdGVzdC5jb20iLCJpZCI6ImR1bW15X2lkIiwicm9sZSI6IlJlZ3VsYXIifQ.jiYB0SnMggwGL4q-2BfybxPuvU8MGvGonUNx3BZNmho';
    let refreshTokenAdmin = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU1NTY4NzksImV4cCI6MTcxNzA5Mjg4MCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJ1c2VyMyIsImVtYWlsIjoidXNlcjNAdGVzdC5jb20iLCJpZCI6ImR1bW15X2lkIiwicm9sZSI6IkFkbWluIn0.GG5693N9mnBd9tODTOSB6wedJLwBEFtdMHe-8HqryHU';
    beforeEach(async () => {

        await categories.create([{
            type: "food",
            color: "red"
        }, {
            type: "entertainment",
            color: "blue"
        }])

        await User.create([{
            username: "user1",
            email: "user1@test.com",
            password: "dummyPassword",
            refreshToken: refreshTokenUser
        }, {
            username: "admin",
            email: "admin@email.com",
            password: "admin",
            refreshToken: refreshTokenAdmin,
            role: "Admin"
        }])

        await transactions.insertMany([{
            username: "tester",
            type: "food",
            amount: 20
        }, {
            username: "tester",
            type: "food",
            amount: 100
        }])
    })

    test("I1: update a category -> return a 200 status and the saved category with refreshed token message", async () => {
        const response = await request(app)
            .patch("/api/categories/food") //Route to call
            .set("Cookie", `accessToken=${refreshTokenAdmin}; refreshToken=${refreshTokenAdmin}`) //Setting cookies in the request
            .send({ type: "health", color: "blue" })

        expect(response.status).toBe(200)
        expect(response.body.data).toHaveProperty("message")
        expect(response.body.data).toHaveProperty("count", 2)
    })

    test("I2: not an admin request -> return a 401 status with the error message", async () => {
        const response = await request(app)
            .patch("/api/categories/food")
            .set("Cookie", `accessToken=${refreshTokenUser}; refreshToken=${refreshTokenUser}`)
            .send({ type: "food", color: "green" })

        expect(response.status).toBe(401)
        const errorMessage = response.body.error ? true : response.body.message ? true : false
        expect(errorMessage).toBe(true)
    })

    test('I3: missing new type -> return a 400 status with the error message', async () => {
        const response = await request(app)
            .patch("/api/categories/food")
            .set("Cookie", `accessToken=${refreshTokenAdmin}; refreshToken=${refreshTokenAdmin}`)
            .send({ color: "red" })

        expect(response.status).toBe(400)
        expect(response.body.error).toBe("New type is not provided")
    })

    test('I4: missing new color -> return a 400 status with the error message', async () => {
        const response = await request(app)
            .patch("/api/categories/food")
            .set("Cookie", `accessToken=${refreshTokenAdmin}; refreshToken=${refreshTokenAdmin}`)
            .send({ type: "health" })

        expect(response.status).toBe(400)
        expect(response.body.error).toBe("New color is not provided")
    })

    test('I5: empty new type -> return a 400 status with the error message', async () => {
        const response = await request(app)
            .patch("/api/categories/food")
            .set("Cookie", `accessToken=${refreshTokenAdmin}; refreshToken=${refreshTokenAdmin}`)
            .send({ type: "", color: "green" })

        expect(response.status).toBe(400)
        expect(response.body.error).toBe("New type is empty")
    })

    test('I6: empty new color -> return a 400 status with the error message', async () => {
        const response = await request(app)
            .patch("/api/categories/food")
            .set("Cookie", `accessToken=${refreshTokenAdmin}; refreshToken=${refreshTokenAdmin}`)
            .send({ type: "food", color: "" })

        expect(response.status).toBe(400)
        expect(response.body.error).toBe("New color is empty")
    })

    test('I7: already in use type -> return a 400 status with the error message ', async () => {
        const response = await request(app)
            .patch("/api/categories/food")
            .set("Cookie", `accessToken=${refreshTokenAdmin}; refreshToken=${refreshTokenAdmin}`)
            .send({ type: "entertainment", color: "blue" })

        expect(response.status).toBe(400)
        expect(response.body.error).toBe("New type is already in use")
    })

    test('I8: not existing selected category -> return a 400 status with the error message', async () => {
        const response = await request(app)
            .patch("/api/categories/investment")
            .set("Cookie", `accessToken=${refreshTokenAdmin}; refreshToken=${refreshTokenAdmin}`)
            .send({ type: "sport", color: "red" })

        expect(response.status).toBe(400)
        expect(response.body.error).toBe("Selected category does not exist")
    })
})

describe("deleteCategory", () => {
    let refreshTokenUser = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU1NTY4NzksImV4cCI6MTcxNzA5Mjg4MCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJ1c2VyMSIsImVtYWlsIjoidXNlcjFAdGVzdC5jb20iLCJpZCI6ImR1bW15X2lkIiwicm9sZSI6IlJlZ3VsYXIifQ.jiYB0SnMggwGL4q-2BfybxPuvU8MGvGonUNx3BZNmho';
    let refreshTokenAdmin = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU1NTY4NzksImV4cCI6MTcxNzA5Mjg4MCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJ1c2VyMyIsImVtYWlsIjoidXNlcjNAdGVzdC5jb20iLCJpZCI6ImR1bW15X2lkIiwicm9sZSI6IkFkbWluIn0.GG5693N9mnBd9tODTOSB6wedJLwBEFtdMHe-8HqryHU';

    beforeEach(async () => {

        await categories.create({
            type: "food",
            color: "red"
        }, {
            type: "entertainment",
            color: "blue"
        })

        await User.create([{
            username: "user1",
            email: "user1@test.com",
            password: "dummyPassword",
            refreshToken: refreshTokenUser
        }, {
            username: "admin",
            email: "admin@email.com",
            password: "admin",
            refreshToken: refreshTokenAdmin,
            role: "Admin"
        }])

        await transactions.insertMany([{
            username: "tester",
            type: "food",
            amount: 20
        }, {
            username: "tester",
            type: "food",
            amount: 100
        }])
    })

    test("I1: delete a category -> return 200 status, a message, the attribute `count`, and the refreshed token", async () => {
        const response = await request(app)
            .delete("/api/categories")
            .set("Cookie", `accessToken=${refreshTokenAdmin}; refreshToken=${refreshTokenAdmin}`)
            .send({ types: ["food"] })

        expect(response.status).toBe(200)
        expect(response.body.data).toHaveProperty("message")
        expect(response.body.data).toHaveProperty("count", 2)

    });

    test('I2: not an admin request -> return a 401 status with the error message', async () => {
        const response = await request(app)
            .delete("/api/categories")
            .set("Cookie", `accessToken=${refreshTokenUser}; refreshToken=${refreshTokenUser}`)
            .send({ types: ["food"] })

        expect(response.status).toBe(401)
        const errorMessage = response.body.error ? true : response.body.message ? true : false
        expect(errorMessage).toBe(true)
    });

    test('I3: missing type -> return a 400 status with the error message', async () => {
        const response = await request(app)
            .delete("/api/categories")
            .set("Cookie", `accessToken=${refreshTokenAdmin}; refreshToken=${refreshTokenAdmin}`)
            .send({})

        expect(response.status).toBe(400)
        expect(response.body.error).toBe("List of categories' types to deleted was not provided")
    });

    test('I4: empty type -> return a 400 status with the error message', async () => {
        const response = await request(app)
            .delete("/api/categories")
            .set("Cookie", `accessToken=${refreshTokenAdmin}; refreshToken=${refreshTokenAdmin}`)
            .send({ types: [""] })

        expect(response.status).toBe(400)
        expect(response.body.error).toBe("The list of categories can't have empty entries")
    });

    test("I5: no categories in database  -> return 400 status with the error message", async () => {
        await categories.deleteMany({})

        const response = await request(app)
            .delete("/api/categories")
            .set("Cookie", `accessToken=${refreshTokenAdmin}; refreshToken=${refreshTokenAdmin}`)
            .send({ types: ['food'] })

        expect(response.status).toBe(400)
        expect(response.body.error).toBe("Cannot delete categories, there should be at least one category")
    });

    test("I6: not existing categories -> return 400 status with the error message", async () => {
        const response = await request(app)
            .delete("/api/categories")
            .set("Cookie", `accessToken=${refreshTokenAdmin}; refreshToken=${refreshTokenAdmin}`)
            .send({ types: ["sport"] })

        expect(response.status).toBe(400)
        expect(response.body.error).toBe("the following categories don't exist: sport")
    });
})

describe("getCategories", () => {
    let refreshTokenUser = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU1NTY4NzksImV4cCI6MTcxNzA5Mjg4MCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJ1c2VyMSIsImVtYWlsIjoidXNlcjFAdGVzdC5jb20iLCJpZCI6ImR1bW15X2lkIiwicm9sZSI6IlJlZ3VsYXIifQ.jiYB0SnMggwGL4q-2BfybxPuvU8MGvGonUNx3BZNmho';
    let refreshTokenAdmin = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU1NTY4NzksImV4cCI6MTcxNzA5Mjg4MCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJ1c2VyMyIsImVtYWlsIjoidXNlcjNAdGVzdC5jb20iLCJpZCI6ImR1bW15X2lkIiwicm9sZSI6IkFkbWluIn0.GG5693N9mnBd9tODTOSB6wedJLwBEFtdMHe-8HqryHU';
    beforeEach(async () => {

        await categories.create([{
            type: "food",
            color: "red"
        }, {
            type: "entertainment",
            color: "blue"
        }])

        await User.create([{
            username: "user1",
            email: "user1@test.com",
            password: "dummyPassword",
            refreshToken: refreshTokenUser
        }, {
            username: "admin",
            email: "admin@email.com",
            password: "admin",
            refreshToken: refreshTokenAdmin,
            role: "Admin"
        }])
    })

    test('I1: get all categories -> return a 200 status and the array of categories with refreshed token message', async () => {
        const response = await request(app)
            .get("/api/categories")
            .set("Cookie", `accessToken=${refreshTokenAdmin}; refreshToken=${refreshTokenAdmin}`) //Setting cookies in the request
            

        expect(response.status).toBe(200)
        expect(response.body.data).toHaveLength(2)
    });

    test('I2: user not authorized -> return a 401 status with the error message', async () => {
        const fakeToken = 'fakeToken'
        const response = await request(app)
            .get("/api/categories")
            .set("Cookie", `accessToken=${fakeToken}; refreshToken=${fakeToken}`)
            

        expect(response.status).toBe(401)
        const errorMessage = response.body.error ? true : response.body.message ? true : false
        expect(errorMessage).toBe(true)
    });
})

describe("createTransaction", () => {
    let refreshTokenUser = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU1NTY4NzksImV4cCI6MTcxNzA5Mjg4MCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJ1c2VyMSIsImVtYWlsIjoidXNlcjFAdGVzdC5jb20iLCJpZCI6ImR1bW15X2lkIiwicm9sZSI6IlJlZ3VsYXIifQ.jiYB0SnMggwGL4q-2BfybxPuvU8MGvGonUNx3BZNmho';
    let refreshTokenAdmin = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU1NTY4NzksImV4cCI6MTcxNzA5Mjg4MCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJ1c2VyMyIsImVtYWlsIjoidXNlcjNAdGVzdC5jb20iLCJpZCI6ImR1bW15X2lkIiwicm9sZSI6IkFkbWluIn0.GG5693N9mnBd9tODTOSB6wedJLwBEFtdMHe-8HqryHU';

    beforeEach(async () => {

        await categories.create({
            type: "food",
            color: "red"
        }, {
            type: "health",
            color: "blue"
        })

        await User.create([{
            username: "user1",
            email: "user1@test.com",
            password: "dummyPassword",
            refreshToken: refreshTokenUser
        }, {
            username: "admin",
            email: "admin@email.com",
            password: "admin",
            refreshToken: refreshTokenAdmin,
            role: "Admin"
        }])

        await transactions.insertMany({
            username: "tester",
            type: "food",
            amount: 20
        })
    })

    test('I1: create a new transaction -> return a 200 status and the saved transaction with refreshed token message', async () => {
        const a = await User.find({})
        const response = await request(app)
            .post("/api/users/user1/transactions")
            .set("Cookie", `accessToken=${refreshTokenUser}; refreshToken=${refreshTokenUser}`)
            .send({ username: "user1", amount: 100, type: "health" })

        expect(response.status).toBe(200)
        expect(response.body.data).toHaveProperty("username")
        expect(response.body.data).toHaveProperty("amount")
        expect(response.body.data).toHaveProperty("type")
        expect(response.body.data).toHaveProperty("date")
    });

    test('I2: user not authorized -> return a 401 status with the error message', async () => {
        const fakeToken = 'fakeToken';
        const response = await request(app)
            .post("/api/users/user1/transactions")
            .set("Cookie", `accessToken=${fakeToken}; refreshToken=${fakeToken}`)
            .send({ username: "user1", amount: 100, type: "health" })

        expect(response.status).toBe(401)
        const errorMessage = response.body.error ? true : response.body.message ? true : false
        expect(errorMessage).toBe(true)
    });

    test('I3: missing username -> return a 400 status with the error message', async () => {
        const response = await request(app)
            .post("/api/users/user1/transactions")
            .set("Cookie", `accessToken=${refreshTokenUser}; refreshToken=${refreshTokenUser}`)
            .send({ amount: 100, type: "health" })

        expect(response.status).toBe(400)
        expect(response.body.error).toBe("Username is not provided")
    });

    test('I4: missing amount -> return a 400 status with the error message', async () => {
        const response = await request(app)
            .post("/api/users/user1/transactions")
            .set("Cookie", `accessToken=${refreshTokenUser}; refreshToken=${refreshTokenUser}`)
            .send({ username: "user1", type: "health" })

        expect(response.status).toBe(400)
        expect(response.body.error).toBe("Amount is not provided")
    });

    test('I5: missing category type -> return a 400 status with the error message', async () => {
        const response = await request(app)
            .post("/api/users/user1/transactions")
            .set("Cookie", `accessToken=${refreshTokenUser}; refreshToken=${refreshTokenUser}`)
            .send({ username: "user1", amount: 100 })

        expect(response.status).toBe(400)
        expect(response.body.error).toBe("Category is not provided")
    });

    test('I6: empty username -> return a 400 status with the error message', async () => {
        const response = await request(app)
            .post("/api/users/user1/transactions")
            .set("Cookie", `accessToken=${refreshTokenUser}; refreshToken=${refreshTokenUser}`)
            .send({ username: "", type: "health", amount: 100 })

        expect(response.status).toBe(400)
        expect(response.body.error).toBe("Username is empty")
    });

    test('I7: empty amount -> return a 400 status with the error message', async () => {
        const response = await request(app)
            .post("/api/users/user1/transactions")
            .set("Cookie", `accessToken=${refreshTokenUser}; refreshToken=${refreshTokenUser}`)
            .send({ username: "user1", type: "health", amount: "" })

        expect(response.status).toBe(400)
        expect(response.body.error).toBe("Amount is empty")
    });

    test('I8: empty category type -> return a 400 status with the error message', async () => {
        const response = await request(app)
            .post("/api/users/user1/transactions")
            .set("Cookie", `accessToken=${refreshTokenUser}; refreshToken=${refreshTokenUser}`)
            .send({ username: "user1", type: '', amount: 100 })

        expect(response.status).toBe(400)
        expect(response.body.error).toBe("Category is empty")
    });

    test('I9: mismatch of usernames -> return a 400 status with the error message', async () => {
        const response = await request(app)
            .post("/api/users/user1/transactions")
            .set("Cookie", `accessToken=${refreshTokenUser}; refreshToken=${refreshTokenUser}`)
            .send({ username: "admin", amount: 100, type: "health" })

        expect(response.status).toBe(400)
        expect(response.body.error).toBe("Username provided in the request body does not match the username provided in the request params")
    });

    test('I10: Not a number amount -> return a 400 status with the error message', async () => {
        const response = await request(app)
            .post("/api/users/user1/transactions")
            .set("Cookie", `accessToken=${refreshTokenUser}; refreshToken=${refreshTokenUser}`)
            .send({ username: "user1", amount: 'a', type: "health" })

        expect(response.status).toBe(400)
        expect(response.body.error).toBe('Amount should be a number');
    });

    test('I11: Not existing category -> return a 400 status with the error message', async () => {
        const response = await request(app)
            .post("/api/users/user1/transactions")
            .set("Cookie", `accessToken=${refreshTokenUser}; refreshToken=${refreshTokenUser}`)
            .send({ username: "user1", amount: 100, type: "sport" })

        expect(response.status).toBe(400)
        expect(response.body.error).toBe('Category does not exist');
    });

    test('I12: Not existing user -> return a 400 status with the error message', async () => {
        const response = await request(app)
            .post("/api/users/user1/transactions")
            .set("Cookie", `accessToken=${refreshTokenUser}; refreshToken=${refreshTokenUser}`)
            .send({ username: "a", amount: 100, type: "health" })

        expect(response.status).toBe(400)
    });
})

describe("getAllTransactions", () => { 
    const admin = {
        username : 'admin',
        email: 'admin@example.com',
        password: '123',
        role: 'Admin',
        refreshToken : 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODYyNTM5NTUsImV4cCI6MTcxNzc4OTk1NywiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJhZG1pbiIsImVtYWlsIjoiYWRtaW5AZXhhbXBsZS5jb20iLCJpZCI6ImR1bW15X2lkIiwicm9sZSI6IkFkbWluIn0.vOPmYNFi8ZDTRIat2qgItBxkob4UWuAtjOHifBAYqSY'
    };

    let refreshToken = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODYyNTM5NTUsImV4cCI6MTcxNzc4OTk1NywiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJhZG1pbiIsImVtYWlsIjoiYWRtaW5AZXhhbXBsZS5jb20iLCJpZCI6ImR1bW15X2lkIiwicm9sZSI6IkFkbWluIn0.vOPmYNFi8ZDTRIat2qgItBxkob4UWuAtjOHifBAYqSY'
    let accessToken = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODYyNTM5NTUsImV4cCI6MTcxNzc4OTk1NywiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJhZG1pbiIsImVtYWlsIjoiYWRtaW5AZXhhbXBsZS5jb20iLCJpZCI6ImR1bW15X2lkIiwicm9sZSI6IkFkbWluIn0.vOPmYNFi8ZDTRIat2qgItBxkob4UWuAtjOHifBAYqSY'
    
  

    beforeEach( async () => {
        const transactionsList = [
            {
                username: 'user1',
                type: 'investment',
                amount: 200,
                date: new Date('1995-12-17T03:24:00')
                
            },
            {
                username: 'user2',
                type: 'investment',
                amount: 500,
                date: new Date('1995-12-17T03:24:00')
            },
            {
                username: 'user3',
                type: 'bills',
                amount: 1000,
                date: new Date('1995-12-17T03:24:00')
            }
        ]

        const categoriesList = [
            {
                type: 'investment',
                color: '#FFFFFF'
            },
            {
                type: 'bills',
                color: '#FFFFFF'
            }
        ]

        await User.create(admin)
        await transactions.create(transactionsList)
        await categories.create(categoriesList)
    })

    test('I1: admin is correctly authenticated and obtains the transactions', async () => {
        const response = await request(app)
            .get("/api/transactions")
            .set("Cookie", `refreshToken=${refreshToken};accessToken=${accessToken}`)

        const expectedData = [
            {
                username: 'user1',
                type: 'investment',
                amount: 200,
                color: '#FFFFFF',
                date: new Date('1995-12-17T03:24:00').toISOString()
            },
            {
                username: 'user2',
                type: 'investment',
                amount: 500,
                color: '#FFFFFF',
                date: new Date('1995-12-17T03:24:00').toISOString()
            },
            {
                username: 'user3',
                type: 'bills',
                amount: 1000,
                color: '#FFFFFF',
                date: new Date('1995-12-17T03:24:00').toISOString()
            }
        ]
        
        expect(response.status).toBe(200)
        expect(response.body.data).toEqual(expectedData)
    });

    test('I2: admin is correctly authenticated and obtains empty list of transactions', async () => {
        await transactions.deleteMany({})
        const response = await request(app)
            .get("/api/transactions")
            .set("Cookie", `refreshToken=${refreshToken};accessToken=${accessToken}`)

        expect(response.status).toBe(200)
        expect(response.body.data.length).toBe(0)
    });

    test('I3: admin is not correctly authenticated', async () => {
        refreshToken = 'thisIsAFakeRefreshToken'
        const response = await request(app)
            .get("/api/transactions")
            .set("Cookie", `refreshToken=${refreshToken};  accessToken=${accessToken}`)
        expect(response.status).toBe(401)
        expect(response.body.error).toBeDefined()
    });
})

describe("getTransactionsByUser", () => { 

    let test_tokens = [
        "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU1NTY4NzksImV4cCI6MTcxNzA5Mjg4MCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJ1c2VyMSIsImVtYWlsIjoidXNlcjFAdGVzdC5jb20iLCJpZCI6ImR1bW15X2lkIiwicm9sZSI6IlJlZ3VsYXIifQ.jiYB0SnMggwGL4q-2BfybxPuvU8MGvGonUNx3BZNmho",   // user 1 (regular)
        "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU1NTY4NzksImV4cCI6MTcxNzA5Mjg4MCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJ1c2VyMiIsImVtYWlsIjoidXNlcjJAdGVzdC5jb20iLCJpZCI6ImR1bW15X2lkIiwicm9sZSI6IlJlZ3VsYXIifQ.vcyvbioE0-iiQxVasIGSAhJwRdwgT6wxYQvoe4eMAqQ",   // user 2 (regular)
        "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU1NTY4NzksImV4cCI6MTcxNzA5Mjg4MCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJ1c2VyMyIsImVtYWlsIjoidXNlcjNAdGVzdC5jb20iLCJpZCI6ImR1bW15X2lkIiwicm9sZSI6IkFkbWluIn0.GG5693N9mnBd9tODTOSB6wedJLwBEFtdMHe-8HqryHU",      // user 3 (admin)
        "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU1NTY4NzksImV4cCI6MTcxNzA5Mjg4MCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJ1c2VyNCIsImVtYWlsIjoidXNlcjRAdGVzdC5jb20iLCJpZCI6ImR1bW15X2lkIiwicm9sZSI6IlJlZ3VsYXIifQ.C40TvT7lc_ufN8xwz5HKZ1XcT2DcwAtrOoZ4t-K19Pc",   // user 4 (regular), not added to the database
        "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU1NTY4NzksImV4cCI6MTcxNzA5Mjg4MCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJ1c2VyNSIsImVtYWlsIjoidXNlcjVAdGVzdC5jb20iLCJpZCI6ImR1bW15X2lkIiwicm9sZSI6IkFkbWluIn0.U4oQH-vpYdwHqQEJxSOJR1ycSmTcA9reP6Lpfpwynw4"       // user 5 (admin), not added to the database
    ]

    let test_users = [
        {username : "user1", email : "user1@test.com", password : "dummyPassword", refreshToken : test_tokens[0], role : "Regular"},
        {username : "user2", email : "user2@test.com", password : "dummyPassword", refreshToken : test_tokens[1], role : "Regular"},
        {username : "user3", email : "user3@test.com", password : "dummyPassword", refreshToken : test_tokens[2], role : "Admin" }
    ]

    let test_categories = [
        {type : "cat1", color : "blue"},
        {type : "cat2", color : "red"},
        {type : "cat3", color : "green"},
    ]

    let test_transactions = [
        {username : "user1", amount : 1131, type : "cat1", date : new Date(2023, 2, 14)},
        {username : "user1", amount :  100, type : "cat1", date : new Date(2023, 3, 23)},
        {username : "user1", amount :  402, type : "cat2", date : new Date(2023, 2, 27)},
        {username : "user1", amount :  933, type : "cat3", date : new Date(2023, 2, 12)},
        {username : "user2", amount :  643, type : "cat2", date : new Date(2023, 2,  8, 10)},
        {username : "user2", amount :  124, type : "cat2", date : new Date(2023, 1,  5)},
        {username : "user2", amount :  632, type : "cat3", date : new Date(2023, 5, 14)},
        {username : "user2", amount :  123, type : "cat3", date : new Date(2023, 2, 20)},
        {username : "user3", amount :  552, type : "cat1", date : new Date(2023, 3, 18)},
        {username : "user3", amount :  612, type : "cat1", date : new Date(2023, 3,  1)},
        {username : "user3", amount :  231, type : "cat2", date : new Date(2023, 3,  6)},
        {username : "user3", amount :   12, type : "cat3", date : new Date(2023, 2, 26)},
        {username : "user3", amount :   53, type : "cat3", date : new Date(2023, 2, 26)},
    ]

    beforeEach(async() => {
        jest.clearAllMocks();   
        // insert test data
        await User.insertMany(test_users)
        await categories.insertMany(test_categories)
        await transactions.insertMany(test_transactions)
    })    

    test("I1 : Should return an error indicating that the User is not Atuthorized (not logged in, or the requested user doesn't match authorized user)", async () => {      
        const response = await request(app)
            .get("/api/users/user1/transactions")                        
                        
        expect(response.status).toBe(401);
        expect(response.body.error).toBe("Unauthorized");
    });
    
    test("I2 : Should return an error indicating that the user specified by params does not exist (authorized as a regular user)", async () => {      
        const response = await request(app)
            .get("/api/users/user4/transactions")                        
            .set("Cookie", `accessToken=${test_tokens[3]};refreshToken=${test_tokens[3]}`)
                        
        expect(response.status).toBe(400);
        expect(response.body.error).toBe("User does not exist");
    });
    
    test("I3 : Should return an error indicating that the User is not Atuthorized (not logged in, or not an admin)", async () => {      
        const response = await request(app)
            .get("/api/transactions/users/user1")                        
                        
        expect(response.status).toBe(401);
        expect(response.body.error).toBe("Unauthorized");
    });

    test("I4 : Should return an error indicating that the user specified by params does not exist (authorized as an admin)", async () => {      
        const response = await request(app)
            .get("/api/transactions/users/user5")   
            .set("Cookie", `accessToken=${test_tokens[4]};refreshToken=${test_tokens[4]}`)

        expect(response.status).toBe(400);
        expect(response.body.error).toBe("User does not exist");
    });

    test("I5 : Should return a list of transactions (authorized as an admin)", async () => {      
        const response = await request(app)
            .get("/api/transactions/users/user2")   
            .set("Cookie", `accessToken=${test_tokens[2]};refreshToken=${test_tokens[2]}`)

        expect(response.status).toBe(200);
        expect(response.body.data).toStrictEqual([
            {username : "user2", color : "red", type : "cat2", amount :  643, date : (new Date(2023, 2,  8, 10)).toISOString()},
            {username : "user2", color : "red", type : "cat2", amount :  124, date : (new Date(2023, 1,  5)).toISOString()},
            {username : "user2", color : "green", type : "cat3", amount :  632, date : (new Date(2023, 5, 14)).toISOString()},
            {username : "user2", color : "green", type : "cat3", amount :  123, date : (new Date(2023, 2, 20)).toISOString()},
        ]);
    });

    test("I6 : Should return a list of transactions of date after 2023-02-08 (authorized as a regular user)", async () => {      
        const response = await request(app)
            .get("/api/users/user2/transactions?from=2023-02-08")                        
            .set("Cookie", `accessToken=${test_tokens[1]};refreshToken=${test_tokens[1]}`)
                        
        expect(response.status).toBe(200);
        expect(response.body.data).toStrictEqual([
            {username : "user2", amount :  643, color : "red", type : "cat2", date : (new Date(2023, 2,  8, 10)).toISOString()},            
            {username : "user2", amount :  632, color : "green", type : "cat3", date : (new Date(2023, 5, 14)).toISOString()},
            {username : "user2", amount :  123, color : "green", type : "cat3", date : (new Date(2023, 2, 20)).toISOString()}
        ])
    });

    test("I7 : Should return a list of transactions of date before 2023-04-01 (authorized as a regular user)", async () => {      
        const response = await request(app)
            .get("/api/users/user2/transactions?upTo=2023-04-01")                        
            .set("Cookie", `accessToken=${test_tokens[1]};refreshToken=${test_tokens[1]}`)
                        
        expect(response.status).toBe(200);
        expect(response.body.data).toStrictEqual([     
            {username : "user2", amount :  643, color : "red", type : "cat2", date : (new Date(2023, 2,  8, 10)).toISOString()},
            {username : "user2", amount :  124, color : "red", type : "cat2", date : (new Date(2023, 1,  5)).toISOString()},            
            {username : "user2", amount :  123, color : "green", type : "cat3", date : (new Date(2023, 2, 20)).toISOString()}
        ])
    });

    test("I8 : Should return a list of transactions of date between 2023-02-08 and 2023-04-01  (authorized as a regular user)", async () => {      
        const response = await request(app)
            .get("/api/users/user2/transactions?from=2023-02-08&upTo=2023-04-01")                        
            .set("Cookie", `accessToken=${test_tokens[1]};refreshToken=${test_tokens[1]}`)
                        
        expect(response.status).toBe(200);
        expect(response.body.data).toStrictEqual([
            {username : "user2", amount :  643, color : "red",   type : "cat2", date : (new Date(2023, 2,  8, 10)).toISOString()},            
            {username : "user2", amount :  123, color : "green", type : "cat3", date : (new Date(2023, 2, 20)).toISOString()}
        ])
    });

    test("I9 : Should return a list of transactions of amount more than 300  (authorized as a regular user)", async () => {      
        const response = await request(app)
            .get("/api/users/user2/transactions?min=300")                        
            .set("Cookie", `accessToken=${test_tokens[1]};refreshToken=${test_tokens[1]}`)
                        
        expect(response.status).toBe(200);
        expect(response.body.data).toStrictEqual([
            {username : "user2", amount :  643, color : "red", type : "cat2", date : (new Date(2023, 2,  8, 10)).toISOString()},            
            {username : "user2", amount :  632, color : "green",type : "cat3", date : (new Date(2023, 5, 14)).toISOString()},            
        ])
    });

    test("I10: Should return a list of transactions of amount less than 300  (authorized as a regular user)", async () => {      
        const response = await request(app)
            .get("/api/users/user2/transactions?max=300")                        
            .set("Cookie", `accessToken=${test_tokens[1]};refreshToken=${test_tokens[1]}`)
                        
        expect(response.status).toBe(200);        
        expect(response.body.data).toStrictEqual([              
            {username : "user2", amount :  124, color : "red", type : "cat2", date : (new Date(2023, 1,  5)).toISOString()},            
            {username : "user2", amount :  123, color : "green", type : "cat3", date : (new Date(2023, 2, 20)).toISOString()},          
        ])
    });

    test("I11: Should return a list of transactions of amount between 100 and 500 (authorized as a regular user)", async () => {      
        const response = await request(app)
            .get("/api/users/user1/transactions?max=500&min=100")                        
            .set("Cookie", `accessToken=${test_tokens[0]};refreshToken=${test_tokens[0]}`)
                        
        expect(response.status).toBe(200);
        expect(response.body.data).toStrictEqual([                          
            {username : "user1", amount :  100, color : "blue", type : "cat1", date : (new Date(2023, 3, 23)).toISOString()},
            {username : "user1", amount :  402, color : "red", type : "cat2", date : (new Date(2023, 2, 27)).toISOString()},            
        ])
    });

    test("I12: Should return a list of transactions of amount between 100 and 500 and date between 2023-01-01 and 2023-03-01 (authorized as a regular user)", async () => {      
        const response = await request(app)
            .get("/api/users/user1/transactions?max=500&min=100&upTo=2023-04-01&from=2023-01-01")                        
            .set("Cookie", `accessToken=${test_tokens[0]};refreshToken=${test_tokens[0]}`)                           

        expect(response.status).toBe(200);
        expect(response.body.data).toStrictEqual([                                      
            {username : "user1", amount :  402, color : "red", type : "cat2", date : (new Date(2023, 2, 27)).toISOString()},            
        ])
    });

    test("I13: Should return a list of transactions of date = 2023-03-26 (authorized as a regular user)", async () => {      
        const response = await request(app)
            .get("/api/users/user3/transactions?date=2023-03-26")                        
            .set("Cookie", `accessToken=${test_tokens[2]};refreshToken=${test_tokens[2]}`)                           

        expect(response.status).toBe(200);
        expect(response.body.data).toStrictEqual([                                                  
            {username : "user3", amount :   12, color : "green", type : "cat3", date : (new Date(2023, 2, 26)).toISOString()},
            {username : "user3", amount :   53, color : "green", type : "cat3", date : (new Date(2023, 2, 26)).toISOString()},
        ])
    });

    test("I14: Should return a list of transactions of date = 2023-03-26 and amount between 10 and 20 (authorized as a regular user)", async () => {      
        const response = await request(app)
            .get("/api/users/user3/transactions?date=2023-03-26&min=10&max=20")                        
            .set("Cookie", `accessToken=${test_tokens[2]};refreshToken=${test_tokens[2]}`)                           

        expect(response.status).toBe(200);
        expect(response.body.data).toStrictEqual([                                                  
            {username : "user3", amount :   12, color : "green", type : "cat3", date : (new Date(2023, 2, 26)).toISOString()}            
        ])
    });
})

describe("getTransactionsByUserByCategory", () => { 

    let test_tokens = [
        "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU1NTY4NzksImV4cCI6MTcxNzA5Mjg4MCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJ1c2VyMSIsImVtYWlsIjoidXNlcjFAdGVzdC5jb20iLCJpZCI6ImR1bW15X2lkIiwicm9sZSI6IlJlZ3VsYXIifQ.jiYB0SnMggwGL4q-2BfybxPuvU8MGvGonUNx3BZNmho",   // user 1 (regular)
        "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU1NTY4NzksImV4cCI6MTcxNzA5Mjg4MCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJ1c2VyMiIsImVtYWlsIjoidXNlcjJAdGVzdC5jb20iLCJpZCI6ImR1bW15X2lkIiwicm9sZSI6IlJlZ3VsYXIifQ.vcyvbioE0-iiQxVasIGSAhJwRdwgT6wxYQvoe4eMAqQ",   // user 2 (regular)
        "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU1NTY4NzksImV4cCI6MTcxNzA5Mjg4MCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJ1c2VyMyIsImVtYWlsIjoidXNlcjNAdGVzdC5jb20iLCJpZCI6ImR1bW15X2lkIiwicm9sZSI6IkFkbWluIn0.GG5693N9mnBd9tODTOSB6wedJLwBEFtdMHe-8HqryHU",      // user 3 (admin)
        "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU1NTY4NzksImV4cCI6MTcxNzA5Mjg4MCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJ1c2VyNCIsImVtYWlsIjoidXNlcjRAdGVzdC5jb20iLCJpZCI6ImR1bW15X2lkIiwicm9sZSI6IlJlZ3VsYXIifQ.C40TvT7lc_ufN8xwz5HKZ1XcT2DcwAtrOoZ4t-K19Pc",   // user 4 (regular), not added to the database
        "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU1NTY4NzksImV4cCI6MTcxNzA5Mjg4MCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJ1c2VyNSIsImVtYWlsIjoidXNlcjVAdGVzdC5jb20iLCJpZCI6ImR1bW15X2lkIiwicm9sZSI6IkFkbWluIn0.U4oQH-vpYdwHqQEJxSOJR1ycSmTcA9reP6Lpfpwynw4"       // user 5 (admin), not added to the database
    ]

    let test_users = [
        {username : "user1", email : "user1@test.com", password : "dummyPassword", refreshToken : test_tokens[0], role : "Regular"},
        {username : "user2", email : "user2@test.com", password : "dummyPassword", refreshToken : test_tokens[1], role : "Regular"},
        {username : "user3", email : "user3@test.com", password : "dummyPassword", refreshToken : test_tokens[2], role : "Admin" }
    ]

    let test_categories = [
        {type : "cat1", color : "blue"},
        {type : "cat2", color : "red"},
        {type : "cat3", color : "green"},
    ]

    let test_transactions = [
        {username : "user1", amount : 1131, type : "cat1", date : new Date(2023, 2, 2, 10, 10)},
        {username : "user1", amount :  100, type : "cat1", date : new Date(2023, 2, 2, 10, 10)},
        {username : "user1", amount :  402, type : "cat2", date : new Date(2023, 2, 2, 10, 10)},
        {username : "user1", amount :  933, type : "cat3", date : new Date(2023, 2, 2, 10, 10)},
        {username : "user2", amount :  643, type : "cat2", date : new Date(2023, 2, 2, 10, 10)},
        {username : "user2", amount :  124, type : "cat2", date : new Date(2023, 2, 2, 10, 10)},
        {username : "user2", amount :  632, type : "cat3", date : new Date(2023, 2, 2, 10, 10)},
        {username : "user2", amount :  123, type : "cat3", date : new Date(2023, 2, 2, 10, 10)},
        {username : "user3", amount :  552, type : "cat1", date : new Date(2023, 2, 2, 10, 10)},
        {username : "user3", amount :  612, type : "cat1", date : new Date(2023, 2, 2, 10, 10)},
        {username : "user3", amount :  231, type : "cat2", date : new Date(2023, 2, 2, 10, 10)},
        {username : "user3", amount :   12, type : "cat3", date : new Date(2023, 2, 2, 10, 10)},
        {username : "user3", amount :   53, type : "cat3", date : new Date(2023, 2, 2, 10, 10)},
    ]

    beforeEach(async() => {
        jest.clearAllMocks();        
        // insert test data
        await User.insertMany(test_users)
        await categories.insertMany(test_categories)
        await transactions.insertMany(test_transactions)
    })    

    test("I1 : Should return an error indicating that the User is not Atuthorized (not logged in, or the requested user doesn't match authorized user)", async () => {      
        const response = await request(app)
            .get("/api/users/user1/transactions/category/cat1")                        
            .send({
                username : "user1",
                type : "cat1"
        })
                        
        expect(response.status).toBe(401);
        expect(response.body.error).toBe("Unauthorized");
    });

    test("I2 : Should return an error indicating that the User is not Atuthorized (not logged in, or not an admin)", async () => {      
        const response = await request(app)
            .get("/api/transactions/users/user1/category/cat1")                        
            .send({
                username : "user1",
                type : "cat1"
        })
                        
        expect(response.status).toBe(401);
        expect(response.body.error).toBe("Unauthorized");
    });

    test("I3 : Should return an error indicating that the user specified by params does not exist (authorized as a regular user)", async () => {      
        const response = await request(app)
            .get("/api/users/user4/transactions/category/cat1")                        
            .set("Cookie", `accessToken=${test_tokens[3]};refreshToken=${test_tokens[3]}`)
            .send({
                username : "user4",
                type : "cat1"
        })
                        
        expect(response.status).toBe(400);
        expect(response.body.error).toBe("User does not exist");
    });

    test("I4 : Should return an error indicating that the user specified by params does not exist (authorized as an admin)", async () => {      
        const response = await request(app)
            .get("/api/transactions/users/user5/category/cat1")                            
            .set("Cookie", `accessToken=${test_tokens[4]};refreshToken=${test_tokens[4]}`)
            .send({
                username : "user5",
                type : "cat1"
        })
                        
        // expect(response.status).toBe(400);
        expect(response.body.error).toBe("User does not exist");
    });

    test("I5 : Should return an error indicating that the category specified by params does not exist (authorized as a regular user)", async () => {      
        const response = await request(app)
            .get("/api/users/user1/transactions/category/catx")                        
            .set("Cookie", `accessToken=${test_tokens[0]};refreshToken=${test_tokens[0]}`)
            .send({
                username : "user1",
                type : "cat1"
        })
                        
        expect(response.status).toBe(400);
        expect(response.body.error).toBe("Category does not exist");
    });

    test("I6 : Should return an error indicating that the category specified by params does not exist (authorized as an admin)", async () => {      
        const response = await request(app)
            .get("/api/transactions/users/user1/category/catx")                             
            .set("Cookie", `accessToken=${test_tokens[2]};refreshToken=${test_tokens[2]}`)
            .send({
                username : "user1",
                type : "cat1"
        })
                        
        expect(response.status).toBe(400);
        expect(response.body.error).toBe("Category does not exist");
    });

    test("I7 : Should return an empty list of transactions (authorized as a regular user)", async () => {      
        const response = await request(app)
            .get("/api/users/user2/transactions/category/cat1")                        
            .set("Cookie", `accessToken=${test_tokens[1]};refreshToken=${test_tokens[1]}`)
            .send({
                username : "user2",
                type : "cat1"
        })        
                        
        expect(response.status).toBe(200);
        expect(response.body.data).toStrictEqual([]);
    });

    test("I8 : Should return an empty list of transactions (authorized as an admin)", async () => {      
        const response = await request(app)
            .get("/api/transactions/users/user2/category/cat1")                                                        
            .set("Cookie", `accessToken=${test_tokens[2]};refreshToken=${test_tokens[2]}`)
            .send({
                username : "user2",
                type : "cat1"
        })
                        
        expect(response.status).toBe(200);
        expect(response.body.data).toStrictEqual([]);
    });

    test("I9 : Should return a list of transactions (authorized as a regular user)", async () => {      
        const response = await request(app)
            .get("/api/users/user1/transactions/category/cat1")                        
            .set("Cookie", `accessToken=${test_tokens[0]};refreshToken=${test_tokens[0]}`)
            .send({
                username : "user1",
                type : "cat1"
        })        
                        
        expect(response.status).toBe(200);        
        expect(response.body.data).toStrictEqual([
            {username : "user1", amount : 1131, type : "cat1", color : "blue", date : (new Date(2023, 2, 2, 10, 10)).toISOString()},
            {username : "user1", amount :  100, type : "cat1", color : "blue", date : (new Date(2023, 2, 2, 10, 10)).toISOString()}
        ]);
    });

    test("I10: Should return a list of transactions (authorized as an admin)", async () => {      
        const response = await request(app)
            .get("/api/transactions/users/user1/category/cat1")                                                        
            .set("Cookie", `accessToken=${test_tokens[2]};refreshToken=${test_tokens[2]}`)
            .send({
                username : "user1",
                type : "cat1"
        })
                
        expect(response.status).toBe(200);        
        expect(response.body.data).toStrictEqual([
            {username : "user1", amount : 1131, type : "cat1", color : "blue", date : (new Date(2023, 2, 2, 10, 10)).toISOString()},
            {username : "user1", amount :  100, type : "cat1", color : "blue", date : (new Date(2023, 2, 2, 10, 10)).toISOString()}
        ]);
    });
})

describe("getTransactionsByGroup", () => {     
    let test_tokens = [
        "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU1NTY4NzksImV4cCI6MTcxNzA5Mjg4MCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJ1c2VyMSIsImVtYWlsIjoidXNlcjFAdGVzdC5jb20iLCJpZCI6ImR1bW15X2lkIiwicm9sZSI6IlJlZ3VsYXIifQ.jiYB0SnMggwGL4q-2BfybxPuvU8MGvGonUNx3BZNmho",   // user 1 (regular)
        "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU1NTY4NzksImV4cCI6MTcxNzA5Mjg4MCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJ1c2VyMiIsImVtYWlsIjoidXNlcjJAdGVzdC5jb20iLCJpZCI6ImR1bW15X2lkIiwicm9sZSI6IlJlZ3VsYXIifQ.vcyvbioE0-iiQxVasIGSAhJwRdwgT6wxYQvoe4eMAqQ",   // user 2 (regular)
        "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU1NTY4NzksImV4cCI6MTcxNzA5Mjg4MCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJ1c2VyMyIsImVtYWlsIjoidXNlcjNAdGVzdC5jb20iLCJpZCI6ImR1bW15X2lkIiwicm9sZSI6IkFkbWluIn0.GG5693N9mnBd9tODTOSB6wedJLwBEFtdMHe-8HqryHU",      // user 3 (admin)
        "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU1NTY4NzksImV4cCI6MTcxNzA5Mjg4MCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJ1c2VyNCIsImVtYWlsIjoidXNlcjRAdGVzdC5jb20iLCJpZCI6ImR1bW15X2lkIiwicm9sZSI6IlJlZ3VsYXIifQ.C40TvT7lc_ufN8xwz5HKZ1XcT2DcwAtrOoZ4t-K19Pc",   // user 4 (regular), not added to the database
        "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU1NTY4NzksImV4cCI6MTcxNzA5Mjg4MCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJ1c2VyNSIsImVtYWlsIjoidXNlcjVAdGVzdC5jb20iLCJpZCI6ImR1bW15X2lkIiwicm9sZSI6IkFkbWluIn0.U4oQH-vpYdwHqQEJxSOJR1ycSmTcA9reP6Lpfpwynw4"       // user 5 (admin), not added to the database
    ]

    let test_users = [
        {username : "user1", email : "user1@test.com", password : "dummyPassword", refreshToken : test_tokens[0], role : "Regular"},
        {username : "user2", email : "user2@test.com", password : "dummyPassword", refreshToken : test_tokens[1], role : "Regular"},
        {username : "user3", email : "user3@test.com", password : "dummyPassword", refreshToken : test_tokens[2], role : "Admin" }
    ]

    let test_groups = [
        {name : "group1", members : [
            {user : "647bb6cf593e8d6a33e403b8", email : "user1@test.com"},
            {user : "647bb6d349f0ff376890ffc8", email : "user2@test.com"}
        ]}
    ]

    let test_categories = [
        {type : "cat1", color : "blue"},
        {type : "cat2", color : "red"},
        {type : "cat3", color : "green"},
    ]

    let test_transactions = [
        {username : "user1", amount : 1131, type : "cat1", date : new Date(2023, 2, 14)},
        {username : "user1", amount :  100, type : "cat1", date : new Date(2023, 3, 23)},
        {username : "user1", amount :  402, type : "cat2", date : new Date(2023, 2, 27)},
        {username : "user1", amount :  933, type : "cat3", date : new Date(2023, 2, 12)},
        {username : "user2", amount :  643, type : "cat2", date : new Date(2023, 2,  8)},
        {username : "user2", amount :  124, type : "cat2", date : new Date(2023, 1,  5)},
        {username : "user2", amount :  632, type : "cat3", date : new Date(2023, 5, 14)},
        {username : "user2", amount :  123, type : "cat3", date : new Date(2023, 2, 20)},
        {username : "user3", amount :  552, type : "cat1", date : new Date(2023, 3, 18)},
        {username : "user3", amount :  612, type : "cat1", date : new Date(2023, 3,  1)},
        {username : "user3", amount :  231, type : "cat2", date : new Date(2023, 3,  6)},
        {username : "user3", amount :   12, type : "cat3", date : new Date(2023, 2, 26)},
        {username : "user3", amount :   53, type : "cat3", date : new Date(2023, 2, 26)},
    ]

    beforeEach(async() => {
        jest.clearAllMocks();        
        // insert test data
        await User.insertMany(test_users)
        await Group.insertMany(test_groups)
        await categories.insertMany(test_categories)
        await transactions.insertMany(test_transactions)
    })    


    test("I1 : Should return an error indicating that the User is not Atuthorized (not logged in)", async () => {      
        const response = await request(app)
            .get("/api/groups/group1/transactions")                                    
                        
        expect(response.status).toBe(401);
        expect(response.body.error).toBe("Unauthorized");
    });

    test("I2 : Should return an error indicating that the User is not Atuthorized (not member of the group specified in params)", async () => {      
        const response = await request(app)
        .get("/api/groups/group1/transactions")                                    
        .set("Cookie", `accessToken=${test_tokens[2]};refreshToken=${test_tokens[2]}`)
                        
        expect(response.status).toBe(401);
        expect(response.body.error).toBe("User is not part of the group");
    });

    test("I3 : Should return an error indicating that the User is not Atuthorized (not an admin)", async () => {      
        const response = await request(app)
            .get("/api/transactions/groups/group1")                                    
                        
        expect(response.status).toBe(401);
        expect(response.body.error).toBe("Unauthorized");
    });

    test("I4 : Should return an error indicating that group does not exist (authorized as an admin)", async () => {      
        const response = await request(app)
        .get("/api/transactions/groups/group2")                                        
        .set("Cookie", `accessToken=${test_tokens[2]};refreshToken=${test_tokens[2]}`)                                            

        expect(response.status).toBe(400);
        expect(response.body.error).toStrictEqual("Group does not exist")
    });    

    test("I5 : Should return a list of transactions (auth type doesn't matter)", async () => {      
        const response = await request(app)
        .get("/api/groups/group1/transactions")                                    
        .set("Cookie", `accessToken=${test_tokens[0]};refreshToken=${test_tokens[0]}`)                                    

        expect(response.status).toBe(200);
        expect(response.body.data).toStrictEqual([
            {username : "user1", amount : 1131, color : "blue", type : "cat1", date : (new Date(2023, 2, 14)).toISOString()},
            {username : "user1", amount :  100, color : "blue", type : "cat1", date : (new Date(2023, 3, 23)).toISOString()},
            {username : "user1", amount :  402, color : "red", type : "cat2", date : (new Date(2023, 2, 27)).toISOString()},
            {username : "user1", amount :  933, color : "green", type : "cat3", date : (new Date(2023, 2, 12)).toISOString()},
            {username : "user2", amount :  643, color : "red", type : "cat2", date : (new Date(2023, 2,  8)).toISOString()},
            {username : "user2", amount :  124, color : "red", type : "cat2", date : (new Date(2023, 1,  5)).toISOString()},
            {username : "user2", amount :  632, color : "green", type : "cat3", date : (new Date(2023, 5, 14)).toISOString()},
            {username : "user2", amount :  123, color : "green", type : "cat3", date : (new Date(2023, 2, 20)).toISOString()}
        ])
    });    
})

describe("getTransactionsByGroupByCategory", () => { 
    let test_tokens = [
        "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU1NTY4NzksImV4cCI6MTcxNzA5Mjg4MCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJ1c2VyMSIsImVtYWlsIjoidXNlcjFAdGVzdC5jb20iLCJpZCI6ImR1bW15X2lkIiwicm9sZSI6IlJlZ3VsYXIifQ.jiYB0SnMggwGL4q-2BfybxPuvU8MGvGonUNx3BZNmho",   // user 1 (regular)
        "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU1NTY4NzksImV4cCI6MTcxNzA5Mjg4MCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJ1c2VyMiIsImVtYWlsIjoidXNlcjJAdGVzdC5jb20iLCJpZCI6ImR1bW15X2lkIiwicm9sZSI6IlJlZ3VsYXIifQ.vcyvbioE0-iiQxVasIGSAhJwRdwgT6wxYQvoe4eMAqQ",   // user 2 (regular)
        "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU1NTY4NzksImV4cCI6MTcxNzA5Mjg4MCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJ1c2VyMyIsImVtYWlsIjoidXNlcjNAdGVzdC5jb20iLCJpZCI6ImR1bW15X2lkIiwicm9sZSI6IkFkbWluIn0.GG5693N9mnBd9tODTOSB6wedJLwBEFtdMHe-8HqryHU",      // user 3 (admin)
        "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU1NTY4NzksImV4cCI6MTcxNzA5Mjg4MCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJ1c2VyNCIsImVtYWlsIjoidXNlcjRAdGVzdC5jb20iLCJpZCI6ImR1bW15X2lkIiwicm9sZSI6IlJlZ3VsYXIifQ.C40TvT7lc_ufN8xwz5HKZ1XcT2DcwAtrOoZ4t-K19Pc",   // user 4 (regular), not added to the database
        "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU1NTY4NzksImV4cCI6MTcxNzA5Mjg4MCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJ1c2VyNSIsImVtYWlsIjoidXNlcjVAdGVzdC5jb20iLCJpZCI6ImR1bW15X2lkIiwicm9sZSI6IkFkbWluIn0.U4oQH-vpYdwHqQEJxSOJR1ycSmTcA9reP6Lpfpwynw4"       // user 5 (admin), not added to the database
    ]

    let test_users = [
        {username : "user1", email : "user1@test.com", password : "dummyPassword", refreshToken : test_tokens[0], role : "Regular"},
        {username : "user2", email : "user2@test.com", password : "dummyPassword", refreshToken : test_tokens[1], role : "Regular"},
        {username : "user3", email : "user3@test.com", password : "dummyPassword", refreshToken : test_tokens[2], role : "Admin" }
    ]

    let test_groups = [
        {name : "group1", members : [
            {user : "647bb6a5cd4626852b320860", email : "user1@test.com"},
            {user : "647bb6b2fc19a0391cc5e73a", email : "user2@test.com"}
        ]}
    ]

    let test_categories = [
        {type : "cat1", color : "blue"},
        {type : "cat2", color : "red"},
        {type : "cat3", color : "green"},
        {type : "cat4", color : "violet"}
    ]

    let test_transactions = [
        {username : "user1", amount : 1131, type : "cat1", date : new Date(2023, 2, 14)},
        {username : "user1", amount :  100, type : "cat1", date : new Date(2023, 3, 23)},
        {username : "user1", amount :  402, type : "cat2", date : new Date(2023, 2, 27)},
        {username : "user1", amount :  933, type : "cat3", date : new Date(2023, 2, 12)},
        {username : "user2", amount :  643, type : "cat2", date : new Date(2023, 2,  8)},
        {username : "user2", amount :  124, type : "cat2", date : new Date(2023, 1,  5)},
        {username : "user2", amount :  632, type : "cat3", date : new Date(2023, 5, 14)},
        {username : "user2", amount :  123, type : "cat3", date : new Date(2023, 2, 20)},
        {username : "user3", amount :  552, type : "cat1", date : new Date(2023, 3, 18)},
        {username : "user3", amount :  612, type : "cat1", date : new Date(2023, 3,  1)},
        {username : "user3", amount :  231, type : "cat2", date : new Date(2023, 3,  6)},
        {username : "user3", amount :   12, type : "cat3", date : new Date(2023, 2, 26)},
        {username : "user3", amount :   53, type : "cat3", date : new Date(2023, 2, 26)},
    ]

    beforeEach(async() => {
        jest.clearAllMocks();        
        // insert test data
        await User.insertMany(test_users)
        await Group.insertMany(test_groups)
        await categories.insertMany(test_categories)
        await transactions.insertMany(test_transactions)
    })    


    test("I1 : Should return an error indicating that the User is not Atuthorized (not logged in)", async () => {      
        const response = await request(app)
            .get("/api/groups/group1/transactions/category/cat1")                                    
                        
        expect(response.status).toBe(401);
        expect(response.body.error).toBe("Unauthorized");
    });

    test("I2 : Should return an error indicating that the User is not Atuthorized (not member of the group specified in params)", async () => {      
        const response = await request(app)
        .get("/api/groups/group1/transactions/category/cat1")                                    
        .set("Cookie", `accessToken=${test_tokens[2]};refreshToken=${test_tokens[2]}`)
                        
        expect(response.status).toBe(401);
        expect(response.body.error).toBe("User is not part of the group");
    });

    test("I3 : Should return an error indicating that the User is not Atuthorized (not an admin)", async () => {      
        const response = await request(app)
            .get("/api/transactions/groups/group1/category/cat1")                                    
                        
        expect(response.status).toBe(401);
        expect(response.body.error).toBe("Unauthorized");
    });

    test("I4 : Should return an error indicating that group does not exist (authorized as an admin)", async () => {      
        const response = await request(app)
        .get("/api/transactions/groups/group2/category/cat1")                                        
        .set("Cookie", `accessToken=${test_tokens[2]};refreshToken=${test_tokens[2]}`)                                            

        expect(response.status).toBe(400);
        expect(response.body.error).toStrictEqual("group does not exist")
    });   

    test("I5 : Should return an error indicating that category does not exist (authtype does not matter)", async () => {      
        const response = await request(app)
        .get("/api/transactions/groups/group1/category/cat5")                                        
        .set("Cookie", `accessToken=${test_tokens[2]};refreshToken=${test_tokens[2]}`)                                            

        expect(response.status).toBe(400);
        expect(response.body.error).toStrictEqual("category does not exist")
    });  
    
    test("I6 : Should return an empty list of transactions (authtype does not matter)", async () => {      
        const response = await request(app)
        .get("/api/transactions/groups/group1/category/cat4")                                        
        .set("Cookie", `accessToken=${test_tokens[2]};refreshToken=${test_tokens[2]}`)                                            

        expect(response.status).toBe(200);
        expect(response.body.data).toStrictEqual([])
    }); 

    test("I7 : Should return a list of transactions (authtype does not matter)", async () => {      
        const response = await request(app)
        .get("/api/transactions/groups/group1/category/cat2")                                        
        .set("Cookie", `accessToken=${test_tokens[2]};refreshToken=${test_tokens[2]}`)                                            

        expect(response.status).toBe(200);
        expect(response.body.data).toStrictEqual([        
            {username : "user1", color : "red", amount :  402, type : "cat2", date : (new Date(2023, 2, 27)).toISOString()},        
            {username : "user2", color : "red", amount :  643, type : "cat2", date : (new Date(2023, 2,  8)).toISOString()},
            {username : "user2", color : "red", amount :  124, type : "cat2", date : (new Date(2023, 1,  5)).toISOString()},        
        ])
    }); 
})

describe("deleteTransaction", () => { 

    let test_tokens = [
        "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU1NTY4NzksImV4cCI6MTcxNzA5Mjg4MCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJ1c2VyMSIsImVtYWlsIjoidXNlcjFAdGVzdC5jb20iLCJpZCI6ImR1bW15X2lkIiwicm9sZSI6IlJlZ3VsYXIifQ.jiYB0SnMggwGL4q-2BfybxPuvU8MGvGonUNx3BZNmho",   // user 1 (regular)
        "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU1NTY4NzksImV4cCI6MTcxNzA5Mjg4MCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJ1c2VyMiIsImVtYWlsIjoidXNlcjJAdGVzdC5jb20iLCJpZCI6ImR1bW15X2lkIiwicm9sZSI6IlJlZ3VsYXIifQ.vcyvbioE0-iiQxVasIGSAhJwRdwgT6wxYQvoe4eMAqQ",   // user 2 (regular)
        "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU1NTY4NzksImV4cCI6MTcxNzA5Mjg4MCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJ1c2VyMyIsImVtYWlsIjoidXNlcjNAdGVzdC5jb20iLCJpZCI6ImR1bW15X2lkIiwicm9sZSI6IkFkbWluIn0.GG5693N9mnBd9tODTOSB6wedJLwBEFtdMHe-8HqryHU",      // user 3 (admin)
        "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU1NTY4NzksImV4cCI6MTcxNzA5Mjg4MCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJ1c2VyNCIsImVtYWlsIjoidXNlcjRAdGVzdC5jb20iLCJpZCI6ImR1bW15X2lkIiwicm9sZSI6IlJlZ3VsYXIifQ.C40TvT7lc_ufN8xwz5HKZ1XcT2DcwAtrOoZ4t-K19Pc",   // user 4 (regular), not added to the database
        "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU1NTY4NzksImV4cCI6MTcxNzA5Mjg4MCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJ1c2VyNSIsImVtYWlsIjoidXNlcjVAdGVzdC5jb20iLCJpZCI6ImR1bW15X2lkIiwicm9sZSI6IkFkbWluIn0.U4oQH-vpYdwHqQEJxSOJR1ycSmTcA9reP6Lpfpwynw4"       // user 5 (admin), not added to the database
    ]

    let test_users = [
        {username : "user1", email : "user1@test.com", password : "dummyPassword", refreshToken : test_tokens[0], role : "Regular"},
        {username : "user2", email : "user2@test.com", password : "dummyPassword", refreshToken : test_tokens[1], role : "Regular"},
        {username : "user3", email : "user3@test.com", password : "dummyPassword", refreshToken : test_tokens[2], role : "Admin" }
    ]

    let test_categories = [
        {type : "cat1", color : "blue"},
        {type : "cat2", color : "red"},
        {type : "cat3", color : "green"},
    ]

    let test_transactions = [
        {_id : "647bada0e696a4c148e708c9", username : "user1", amount : 1131, type : "cat1", date : new Date(2023, 2, 14)},
        {_id : "647bada4ff983865521ec405", username : "user1", amount :  100, type : "cat1", date : new Date(2023, 3, 23)},
        {_id : "647bada9bc8db6f9ed1d49dc", username : "user1", amount :  402, type : "cat2", date : new Date(2023, 2, 27)},
        {_id : "647badad3a1b2f05cf27fe11", username : "user1", amount :  933, type : "cat3", date : new Date(2023, 2, 12)},
        {_id : "647badb472204a6f710da3c4", username : "user2", amount :  643, type : "cat2", date : new Date(2023, 2,  8, 10)},
        {_id : "647badb9b75b309606c2c183", username : "user2", amount :  124, type : "cat2", date : new Date(2023, 1,  5)},
        {_id : "647badbe2cf71b0fe569d7cb", username : "user2", amount :  632, type : "cat3", date : new Date(2023, 5, 14)},
        {_id : "647badc28c9ee03c0afd8eeb", username : "user2", amount :  123, type : "cat3", date : new Date(2023, 2, 20)},
        {_id : "647badc7d7adf5276bc97e82", username : "user3", amount :  552, type : "cat1", date : new Date(2023, 3, 18)},
        {_id : "647badcb3b639a04b00e68ea", username : "user3", amount :  612, type : "cat1", date : new Date(2023, 3,  1)},
        {_id : "647badd0e3883628397a6c13", username : "user3", amount :  231, type : "cat2", date : new Date(2023, 3,  6)},
        {_id : "647badd6b1388a89c128e1a1", username : "user3", amount :   12, type : "cat3", date : new Date(2023, 2, 26)},
        {_id : "647baddd6b672748b202408d", username : "user3", amount :   53, type : "cat3", date : new Date(2023, 2, 26)},
    ]

    beforeEach(async() => {
        jest.clearAllMocks();        
        // insert test data
        await User.insertMany(test_users)
        await categories.insertMany(test_categories)
        await transactions.insertMany(test_transactions)
    })    


    test("I1 : Should return an error indicating that the User is not Atuthorized (not logged in, or the requested user doesn't match authorized user)", async () => {      
        const response = await request(app)
            .delete("/api/users/user1/transactions")                        
                        
        expect(response.status).toBe(401);
        expect(response.body.error).toBe("Unauthorized");
    });

    test("I2 : Should return an error indicating that not all body fields are present", async () => {      
        const response = await request(app)
            .delete("/api/users/user1/transactions")  
            .set("Cookie", `accessToken=${test_tokens[0]};refreshToken=${test_tokens[0]}`)
            .send({})                      
                        
        expect(response.status).toBe(400);
        expect(response.body.error).toBe("body does not contain all the necessary attributes");
    });

    test("I3 : Should return an error indicating that the user sending the request does not exist", async () => {      
        const response = await request(app)
            .delete("/api/users/user4/transactions")  
            .set("Cookie", `accessToken=${test_tokens[3]};refreshToken=${test_tokens[3]}`)
            .send({
                id : "dummy_id"
            })                      
                        
        expect(response.status).toBe(400);
        expect(response.body.error).toBe("user not found");
    });

    test("I4 : Should return an error indicating that the transaction does not exist", async () => {      
        const response = await request(app)
            .delete("/api/users/user1/transactions")  
            .set("Cookie", `accessToken=${test_tokens[0]};refreshToken=${test_tokens[0]}`)
            .send({
                id : "647bad3077bbc2edc8fd4110" // transaction id that does not exist
            })                                             

        expect(response.status).toBe(400);
        expect(response.body.error).toBe("transaction not found");
    });

    test("I5 : Should return an error indicating that the transaction does not belong to the user sending the request", async () => {      
        const response = await request(app)
            .delete("/api/users/user1/transactions")  
            .set("Cookie", `accessToken=${test_tokens[0]};refreshToken=${test_tokens[0]}`)
            .send({
                id : "647badcb3b639a04b00e68ea" // transaction id that does not exist
            })                                             

        expect(response.status).toBe(400);
        expect(response.body.error).toBe("transaction not found for the user");
    });

    test("I6 : Should return a message indicating that the transaction was deleted", async () => {      
        const response = await request(app)
            .delete("/api/users/user1/transactions")  
            .set("Cookie", `accessToken=${test_tokens[0]};refreshToken=${test_tokens[0]}`)
            .send({
                id : "647bada0e696a4c148e708c9" // transaction id that does not exist
            })                                             
        
        expect(response.status).toBe(200);
        expect(response.body.data.message).toBe("Transaction deleted");
    });
})

describe("deleteTransactions", () => { 
    let test_tokens = [
        "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU1NTY4NzksImV4cCI6MTcxNzA5Mjg4MCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJ1c2VyMSIsImVtYWlsIjoidXNlcjFAdGVzdC5jb20iLCJpZCI6ImR1bW15X2lkIiwicm9sZSI6IlJlZ3VsYXIifQ.jiYB0SnMggwGL4q-2BfybxPuvU8MGvGonUNx3BZNmho",   // user 1 (regular)
        "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU1NTY4NzksImV4cCI6MTcxNzA5Mjg4MCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJ1c2VyMiIsImVtYWlsIjoidXNlcjJAdGVzdC5jb20iLCJpZCI6ImR1bW15X2lkIiwicm9sZSI6IlJlZ3VsYXIifQ.vcyvbioE0-iiQxVasIGSAhJwRdwgT6wxYQvoe4eMAqQ",   // user 2 (regular)
        "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU1NTY4NzksImV4cCI6MTcxNzA5Mjg4MCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJ1c2VyMyIsImVtYWlsIjoidXNlcjNAdGVzdC5jb20iLCJpZCI6ImR1bW15X2lkIiwicm9sZSI6IkFkbWluIn0.GG5693N9mnBd9tODTOSB6wedJLwBEFtdMHe-8HqryHU",      // user 3 (admin)
        "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU1NTY4NzksImV4cCI6MTcxNzA5Mjg4MCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJ1c2VyNCIsImVtYWlsIjoidXNlcjRAdGVzdC5jb20iLCJpZCI6ImR1bW15X2lkIiwicm9sZSI6IlJlZ3VsYXIifQ.C40TvT7lc_ufN8xwz5HKZ1XcT2DcwAtrOoZ4t-K19Pc",   // user 4 (regular), not added to the database
        "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU1NTY4NzksImV4cCI6MTcxNzA5Mjg4MCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJ1c2VyNSIsImVtYWlsIjoidXNlcjVAdGVzdC5jb20iLCJpZCI6ImR1bW15X2lkIiwicm9sZSI6IkFkbWluIn0.U4oQH-vpYdwHqQEJxSOJR1ycSmTcA9reP6Lpfpwynw4"       // user 5 (admin), not added to the database
    ]

    let test_users = [
        {username : "user1", email : "user1@test.com", password : "dummyPassword", refreshToken : test_tokens[0], role : "Regular"},
        {username : "user2", email : "user2@test.com", password : "dummyPassword", refreshToken : test_tokens[1], role : "Regular"},
        {username : "user3", email : "user3@test.com", password : "dummyPassword", refreshToken : test_tokens[2], role : "Admin" }
    ]

    let test_categories = [
        {type : "cat1", color : "blue"},
        {type : "cat2", color : "red"},
        {type : "cat3", color : "green"},
    ]

    let test_transactions = [
        {_id : "647bada0e696a4c148e708c9", username : "user1", amount : 1131, type : "cat1", date : new Date(2023, 2, 14)},
        {_id : "647bada4ff983865521ec405", username : "user1", amount :  100, type : "cat1", date : new Date(2023, 3, 23)},
        {_id : "647bada9bc8db6f9ed1d49dc", username : "user1", amount :  402, type : "cat2", date : new Date(2023, 2, 27)},
        {_id : "647badad3a1b2f05cf27fe11", username : "user1", amount :  933, type : "cat3", date : new Date(2023, 2, 12)},
        {_id : "647badb472204a6f710da3c4", username : "user2", amount :  643, type : "cat2", date : new Date(2023, 2,  8, 10)},
        {_id : "647badb9b75b309606c2c183", username : "user2", amount :  124, type : "cat2", date : new Date(2023, 1,  5)},
        {_id : "647badbe2cf71b0fe569d7cb", username : "user2", amount :  632, type : "cat3", date : new Date(2023, 5, 14)},
        {_id : "647badc28c9ee03c0afd8eeb", username : "user2", amount :  123, type : "cat3", date : new Date(2023, 2, 20)},
        {_id : "647badc7d7adf5276bc97e82", username : "user3", amount :  552, type : "cat1", date : new Date(2023, 3, 18)},
        {_id : "647badcb3b639a04b00e68ea", username : "user3", amount :  612, type : "cat1", date : new Date(2023, 3,  1)},
        {_id : "647badd0e3883628397a6c13", username : "user3", amount :  231, type : "cat2", date : new Date(2023, 3,  6)},
        {_id : "647badd6b1388a89c128e1a1", username : "user3", amount :   12, type : "cat3", date : new Date(2023, 2, 26)},
        {_id : "647baddd6b672748b202408d", username : "user3", amount :   53, type : "cat3", date : new Date(2023, 2, 26)},
    ]

    beforeEach(async() => {
        jest.clearAllMocks();        
        // insert test data
        await User.insertMany(test_users)
        await categories.insertMany(test_categories)
        await transactions.insertMany(test_transactions)
    })    

    test("I1 : Should return an error indicating that the User is not Atuthorized (not logged in, or not and admin)", async () => {      
        const response = await request(app)
            .delete("/api/transactions")                        
                        
        expect(response.status).toBe(401);
        expect(response.body.error).toBe("Unauthorized");
    });

    test("I2 : Should return an error indicating that the request body does not contain all the necessary values", async () => {      
        const response = await request(app)
            .delete("/api/transactions")                        
            .set("Cookie", `accessToken=${test_tokens[2]};refreshToken=${test_tokens[2]}`)
                        
        expect(response.status).toBe(400);
        expect(response.body.error).toBe("body does not contain all the necessary attributes");
    });

    test("I3 : Should return an error indicating that at _ids in request body are not valid", async () => {      
        const response = await request(app)
            .delete("/api/transactions")                        
            .set("Cookie", `accessToken=${test_tokens[2]};refreshToken=${test_tokens[2]}`)
            .send({
                _ids : [
                    "647bada4ff983865521ec405",
                    "",                    
                    "647baddd6b672748b202408d"
                ]
            })
                        
        expect(response.status).toBe(400);
        expect(response.body.error).toBe("input _ids are not valid");
    });

    test("I4 : Should return an error indicating that at least one of the transactions don't exist", async () => {      
        const response = await request(app)
            .delete("/api/transactions")     
            .set("Cookie", `accessToken=${test_tokens[2]};refreshToken=${test_tokens[2]}`)
            .send({
                _ids : [
                    "647bada4ff983865521ec405",
                    "647badcb3b639a04b00e68ea",
                    "647bb0a167c7cb3eeaea0009",
                    "647bb0ab94e0075e7aca571f",
                    "647baddd6b672748b202408d"
                ]
            })                   
                        
        expect(response.status).toBe(400);
        expect(response.body.error).toBe("the following transactions don't exist : 647bb0a167c7cb3eeaea0009,647bb0ab94e0075e7aca571f");
    });

    test("I5 : Should return a message indicating that the transaction were deleted", async () => {      
        const response = await request(app)
            .delete("/api/transactions")     
            .set("Cookie", `accessToken=${test_tokens[2]};refreshToken=${test_tokens[2]}`)
            .send({
                _ids : [
                    "647bada4ff983865521ec405",
                    "647badcb3b639a04b00e68ea",                    
                    "647baddd6b672748b202408d"
                ]
            })                   
                        
        expect(response.status).toBe(200);
        expect(response.body.data.message).toBe("Transactions deleted");
    });
})
