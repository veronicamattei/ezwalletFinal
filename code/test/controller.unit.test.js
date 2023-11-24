import { categories, transactions } from '../models/model';
import * as utils from '../controllers/utils';
import { Group, User } from '../models/User';
import { deleteTransactions, deleteTransaction, getTransactionsByGroup, getAllTransactions, getTransactionsByGroupByCategory, getTransactionsByUserByCategory, getTransactionsByUser, createCategory, updateCategory, deleteCategory, getCategories, createTransaction } from '../controllers/controller';
import { verifyAuthAdmin, verifyAuthSimple, verifyAuthUser, verifyAuthGroup } from '../controllers/utils';
import mongoose from "mongoose";
jest.mock('../models/model');



beforeEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
  });

describe('createCategory', () => {
    let mockReq;
    let mockRes;

    beforeEach(() => {
        mockReq = {
            body: {
                type: 'food',
                color: 'red'
            },
        };


        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                refreshedTokenMessage: "dummy message"
            },
        };
    });

    afterEach(() => {
        jest.clearAllMocks();
    })

    test('U1: create a new category -> return a 200 status and the saved category with refreshed token message', async () => {
        jest.spyOn(utils, 'verifyAuthAdmin').mockReturnValue({ authorized: true, cause: "Authorized" })

        const countDocumentsMock = jest.spyOn(categories, 'countDocuments').mockResolvedValueOnce(0); //no category with the same type exists
        const saveMock = jest.fn().mockResolvedValueOnce(mockReq.body);
        jest.spyOn(categories.prototype, 'save').mockImplementation(saveMock);

        await createCategory(mockReq, mockRes);

        expect(countDocumentsMock).toHaveBeenCalledWith({ type: 'food' });
        expect(categories.prototype.save).toHaveBeenCalled();
        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith({
            data: mockReq.body,
            refreshedTokenMessage: "dummy message"
        });
    });

    test('U2: not an admin request -> return a 401 status with the error message', async () => {
        jest.spyOn(utils, 'verifyAuthAdmin').mockReturnValue({ authorized: false, cause: "Unauthorized" })

        await createCategory(mockReq, mockRes);

        expect(verifyAuthAdmin).toHaveBeenCalled();
        expect(mockRes.status).toHaveBeenCalledWith(401);
        expect(mockRes.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
    });

    test('U3: missing type -> return a 400 status with the error message', async () => {
        mockReq = {
            body: {
                color: 'red'
            },
        };

        jest.spyOn(utils, 'verifyAuthAdmin').mockReturnValue({ authorized: true, cause: "Authorized" })


        await createCategory(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({ error: 'type is not provided' });
    });

    test('U4: missing color -> return a 400 status with the error message', async () => {
        mockReq = {
            body: {
                type: 'food'
            },
        };
        jest.spyOn(utils, 'verifyAuthAdmin').mockReturnValue({ authorized: true, cause: "Authorized" })

        await createCategory(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({ error: 'color is not provided' });
    });

    test('U5: empty type -> return a 400 status with the error message', async () => {
        mockReq.body.type = '';

        jest.spyOn(utils, 'verifyAuthAdmin').mockReturnValue({ authorized: true, cause: "Authorized" })


        await createCategory(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({ error: 'type is empty' });
    });

    test('U6: empty color -> return a 400 status with the error message', async () => {
        mockReq.body.color = '';

        jest.spyOn(utils, 'verifyAuthAdmin').mockReturnValue({ authorized: true, cause: "Authorized" })

        await createCategory(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({ error: 'color is empty' });
    });

    test('U7: already existing category type -> return a 400 status with the error message', async () => {
        jest.spyOn(utils, 'verifyAuthAdmin').mockReturnValue({ authorized: true, cause: "Authorized" })

        const countDocumentsMock = jest.spyOn(categories, 'countDocuments').mockResolvedValueOnce(1);

        await createCategory(mockReq, mockRes);

        expect(countDocumentsMock).toHaveBeenCalledWith({ type: 'food' });
        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({ error: 'category type is already in use' });
    });

    test('U8 : Network error -> return 500', async () => {
        jest.spyOn(utils, 'verifyAuthAdmin').mockImplementationOnce(() => { throw new Error('server crash') });

        await createCategory(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(500);
        expect(mockRes.json).toHaveBeenCalledWith({ error: 'server crash' });
    });
})

describe("updateCategory", () => {
    let mockReq;
    let mockRes;

    beforeEach(() => {
        mockReq = {
            params: { type: 'food' },
            body: {
                type: 'Food',
                color: 'yellow'
            },
        };

        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                refreshedTokenMessage: "dummy message"
            },
        };
    });

    afterEach(() => {
        jest.clearAllMocks();
    })

    test('U1: update a category -> return a 200 status and the saved category with refreshed token message', async () => {
        jest.spyOn(utils, 'verifyAuthAdmin').mockReturnValue({ authorized: true, cause: "Authorized" })

        const countDocumentsMock = jest.spyOn(categories, 'countDocuments').mockResolvedValueOnce(0); //no category with the same type exists
        categories.updateOne.mockResolvedValue({ modifiedCount: 1 });
        transactions.updateMany.mockResolvedValue({ modifiedCount: 2 });

        await updateCategory(mockReq, mockRes);

        expect(countDocumentsMock).toHaveBeenCalledWith({ type: 'Food' });
        expect(categories.updateOne).toHaveBeenCalledWith(
            { type: 'food' },
            { type: 'Food', color: 'yellow' }
        );
        expect(transactions.updateMany).toHaveBeenCalledWith(
            { type: 'food' },
            { type: 'Food' }
        );
        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith({
            data: {
                message: 'Succesfully update category',
                count: 2
            },
            refreshedTokenMessage: 'dummy message'
        });
    });

    test('U2: not an admin request -> return a 401 status with the error message', async () => {
        jest.spyOn(utils, 'verifyAuthAdmin').mockReturnValue({ authorized: false, cause: "Unauthorized" })

        await updateCategory(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(401);
        expect(mockRes.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
    });

    test('U3: missing new type -> return a 400 status with the error message', async () => {
        mockReq = {
            params: { type: 'food' },
            body: {
                color: 'red'
            },
        };

        jest.spyOn(utils, 'verifyAuthAdmin').mockReturnValue({ authorized: true, cause: "Authorized" })

        await updateCategory(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({ error: 'New type is not provided' });
    });

    test('U4: missing new color -> return a 400 status with the error message', async () => {
        mockReq = {
            params: { type: 'food' },
            body: {
                type: 'food'
            },
        };
        jest.spyOn(utils, 'verifyAuthAdmin').mockReturnValue({ authorized: true, cause: "Authorized" })

        await updateCategory(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({ error: 'New color is not provided' });
    });

    test('U5: empty new type -> return a 400 status with the error message', async () => {
        mockReq.body.type = '';

        jest.spyOn(utils, 'verifyAuthAdmin').mockReturnValue({ authorized: true, cause: "Authorized" })


        await updateCategory(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({ error: 'New type is empty' });
    });

    test('U6: empty new color -> return a 400 status with the error message', async () => {
        mockReq.body.color = '';

        jest.spyOn(utils, 'verifyAuthAdmin').mockReturnValue({ authorized: true, cause: "Authorized" })

        await updateCategory(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({ error: 'New color is empty' });
    });

    test('U7: already in use type -> return a 400 status with the error message ', async () => {
        categories.countDocuments.mockResolvedValue(1);

        jest.spyOn(utils, 'verifyAuthAdmin').mockReturnValue({ authorized: true, cause: "Authorized" })

        await updateCategory(mockReq, mockRes);

        expect(categories.countDocuments).toHaveBeenCalledWith({ type: 'Food' });
        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({ error: 'New type is already in use' });
    });

    test('U8: not existing selected category -> return a 400 status with the error message', async () => {
        categories.countDocuments.mockResolvedValue(0);
        categories.updateOne.mockResolvedValue({ modifiedCount: 0 });

        jest.spyOn(utils, 'verifyAuthAdmin').mockReturnValue({ authorized: true, cause: "Authorized" })

        await updateCategory(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({ error: 'Selected category does not exist' });
    });

    test('U9: Network error -> return 500', async () => {
        jest.spyOn(utils, 'verifyAuthAdmin').mockImplementationOnce(() => { throw new Error('server crash') });

        await updateCategory(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(500);
        expect(mockRes.json).toHaveBeenCalledWith({ error: 'server crash' });
    });

})

describe("deleteCategory", () => {
    let mockReq;
    let mockRes;

    beforeEach(() => {
        mockRes = {
            locals: {
                refreshedTokenMessage: "dummy message"
            },
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        }
    });

    afterEach(() => {
        jest.clearAllMocks();
    })

    test("U1: delete a category -> return 200 status, a message, the attribute `count`, and the refreshed token", async () => {

        mockReq = {
            // what I want to delete
            body: {
                types: ["health", "bills"],
            }
        };

        // the whole database (useless here)
        const storedCategory = [
            { type: 'health', color: '#ffffff' },
            { type: 'bills', color: '#ffffff' },
            { type: 'investment', color: '#ffffff' },
            { type: 'cash', color: '#ffffff' }
        ]


        jest.spyOn(utils, "verifyAuthAdmin").mockReturnValue({ authorized: true, cause: "Authorized" });

        // there is at least one category | 4 in the database so no error 401
        jest.spyOn(categories, "countDocuments").mockResolvedValue(4);

        // categories that find will returns from the database (both of them are defined)
        const mockFindResult1 = [
            { type: 'health' },
            { type: 'bills' }
        ]
        // all the types we have in the database
        jest.spyOn(categories, 'find').mockReturnValueOnce({
            sort: jest.fn().mockResolvedValue(mockFindResult1)
        });

        // N = given categories in the database too
        // T = total number of categories 
        // now T = 4 and N = 2 so N != T ==> else side

        const mockFindResult2 = [
            { type: 'health' }
        ]
        // the oldest one
        jest.spyOn(categories, 'find').mockReturnValueOnce({
            sort: jest.fn().mockResolvedValue(mockFindResult2)
        });

        jest.spyOn(categories, 'deleteMany').mockResolvedValue({ deletedCount: 2 })

        jest.spyOn(transactions, 'updateMany').mockResolvedValue({ modifiedCount: 3 })

        await deleteCategory(mockReq, mockRes);

        // check authentication
        expect(mockRes.status).not.toHaveBeenCalledWith(401)

        // check call to the db
        expect(categories.countDocuments).toHaveBeenCalled()

        // check query for the whole set of category
        expect(categories.find).toHaveBeenCalled()

        // check if notFound !== 0 does not throw error
        expect(mockRes.status).not.toHaveBeenCalledWith(400)

        // check if at least one category has been deleted
        expect(categories.deleteMany).toHaveBeenCalled()

        // we can't say that there is at least a transaction for each category (RIGHT?)
        // I've considered at least one in this case
        expect(transactions.updateMany).toHaveBeenCalled()

        expect(mockRes.status).toHaveBeenCalledWith(200)

        // responseObj     mockobj, first call(only one) first argument

        expect(mockRes.json.mock.calls[0][0].data.message).toBeDefined()
        expect(mockRes.json.mock.calls[0][0].data.count).toBe(3)
        expect(mockRes.json.mock.calls[0][0].refreshedTokenMessage).toBeDefined()
    });

    test("U2: delete all categories except the oldest one (N===T) -> return 200 status, a message, the attribute `count`, and the refreshed token", async () => {

        mockReq = {
            // what I want to delete
            body: {
                types: ["health", "bills"],
            }
        };

        // the whole database (useless here)
        const storedCategory = [
            { type: 'health', color: '#ffffff' },
            { type: 'bills', color: '#ffffff' },
        ]

        jest.spyOn(utils, "verifyAuthAdmin").mockReturnValue({ authorized: true, cause: "Authorized" });

        // there is at least one category | 4 in the database so no error 401
        jest.spyOn(categories, "countDocuments").mockResolvedValue(2);

        // categories that find will returns from the database (both of them are defined)
        const mockFindResult1 = [
            { type: 'health' },
            { type: 'bills' }
        ]
        // all the types we have in the database
        jest.spyOn(categories, 'find').mockReturnValueOnce({
            sort: jest.fn().mockResolvedValue(mockFindResult1)
        });

        jest.spyOn(categories, 'deleteMany').mockResolvedValue({ deletedCount: 1 })

        jest.spyOn(transactions, 'updateMany').mockResolvedValue({ modifiedCount: 3 })

        await deleteCategory(mockReq, mockRes);

        // check authentication
        expect(mockRes.status).not.toHaveBeenCalledWith(401)

        // check call to the db
        expect(categories.countDocuments).toHaveBeenCalled()

        // check query for the whole set of category
        expect(categories.find).toHaveBeenCalled()

        // check if notFound !== 0 does not throw error
        expect(mockRes.status).not.toHaveBeenCalledWith(400)

        // check if at least one category has been deleted
        expect(categories.deleteMany).toHaveBeenCalled()

        // we can't say that there is at least a transaction for each category (RIGHT?)
        // I've considered at least one in this case
        expect(transactions.updateMany).toHaveBeenCalled()

        expect(mockRes.status).toHaveBeenCalledWith(200)

        // responseObj     mockobj, first call(only one) first argument

        expect(mockRes.json.mock.calls[0][0].data.message).toBeDefined()
        expect(mockRes.json.mock.calls[0][0].data.count).toBe(3)
        expect(mockRes.json.mock.calls[0][0].refreshedTokenMessage).toBeDefined()
    });

    test('U3: not an admin request -> return a 401 status with the error message', async () => {
        jest.spyOn(utils, 'verifyAuthAdmin').mockReturnValue({ authorized: false, cause: "Unauthorized" })

        await deleteCategory(mockReq, mockRes);

        expect(verifyAuthAdmin).toHaveBeenCalled();
        expect(mockRes.status).toHaveBeenCalledWith(401);
        expect(mockRes.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
    });

    test('U4: missing type -> return a 400 status with the error message', async () => {
        mockReq = {
            body: {}
        };

        jest.spyOn(utils, 'verifyAuthAdmin').mockReturnValue({ authorized: true, cause: "Authorized" })


        await deleteCategory(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({ error: "List of categories' types to deleted was not provided" });
    });

    test('U5: empty type -> return a 400 status with the error message', async () => {
        mockReq = {
            body: {
                types: ["", "health"]
            }
        }
        jest.spyOn(utils, 'verifyAuthAdmin').mockReturnValue({ authorized: true, cause: "Authorized" })

        await deleteCategory(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({ error: "The list of categories can't have empty entries" });
    });

    test("U6: no categories in database  -> return 400 status with the error message", async () => {

        mockReq = {
            body: {
                types: ["health", "bills"],
            }
        };

        const storedCategory = [];

        jest.spyOn(utils, "verifyAuthAdmin").mockReturnValue({ authorized: true, cause: "Authorized" });

        // there are no categories
        jest.spyOn(categories, "countDocuments").mockResolvedValue(0);

        await deleteCategory(mockReq, mockRes);

        expect(categories.countDocuments).toHaveBeenCalled()
        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({ error: "Cannot delete categories, there should be at least one category" });
    });

    test("U7: not existing categories -> return 400 status with the error message", async () => {

        mockReq = {
            body: {
                types: ["health", "bills", "groceries"],
            }
        };

        let storedCategories = ["health", "bills", "investment", "entertainment"];

        jest.spyOn(utils, "verifyAuthAdmin").mockReturnValue({ authorized: true, cause: "Authorized" });

        // there are 4 categories
        jest.spyOn(categories, "countDocuments").mockResolvedValue(4);

        // categories that find will returns from the database (both of them are defined)
        let toBeDeleted = [
            { type: 'health' },
            { type: 'bills' }
        ]

        jest.spyOn(categories, 'find').mockReturnValueOnce({
            sort: jest.fn().mockResolvedValue(toBeDeleted)
        });
        jest.spyOn(Array.prototype, 'map'); // Spy on map method of Array.prototype
        jest.spyOn(Array.prototype, 'filter'); // Spy on filter method of Array.prototype

        await deleteCategory(mockReq, mockRes);

        expect(categories.countDocuments).toHaveBeenCalled();
        expect(Array.prototype.map).toHaveBeenCalledWith(expect.any(Function)); // Check that map method is called
        expect(Array.prototype.filter).toHaveBeenCalledWith(expect.any(Function)); // Check that filter method is called
        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({ error: `the following categories don't exist: groceries` });

    });

    test('U8: Network error -> return 500', async () => {
        jest.spyOn(utils, 'verifyAuthAdmin').mockImplementationOnce(() => { throw new Error('server crash') });

        await deleteCategory(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(500);
        expect(mockRes.json).toHaveBeenCalledWith({ error: 'server crash' });
    });
})

describe("getCategories", () => {
    let mockReq;
    let mockRes;

    beforeEach(() => {
        mockReq = {};

        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                refreshedTokenMessage: "dummy message"
            },
        };
    });

    afterEach(() => {
        jest.clearAllMocks();
    })

    test('U1: get all categories -> return a 200 status and the array of categories with refreshed token message', async () => {
        const mockReq = {}
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                refreshedTokenMessage: "dummy message"
            }

        }

        const expectedValue = [
            {
                "type": 'bills',
                "color": '#111111'
            },
            {
                "type": 'investment',
                "color": '#222222'
            },
            {
                "type": 'groceries',
                "color": '#333333'
            }
        ]

        jest.spyOn(utils, "verifyAuthSimple").mockReturnValue({ authorized: true, cause: "Authorized" });

        jest.spyOn(categories, 'find').mockResolvedValue(expectedValue);

        await getCategories(mockReq, mockRes);

        expect(categories.find).toHaveBeenCalledTimes(1);

        expect(mockRes.json.mock.calls[0][0].data[0]).toHaveProperty('type');
        expect(mockRes.json.mock.calls[0][0].data[0]).toHaveProperty('color');

        expect(mockRes.json).toHaveBeenCalledWith({
            data: [
                {
                    "type": 'bills',
                    "color": '#111111'
                },
                {
                    "type": 'investment',
                    "color": '#222222'
                },
                {
                    "type": 'groceries',
                    "color": '#333333'
                }
            ],
            refreshedTokenMessage: 'dummy message'
        })
    })

    test('U2: user not authorized -> return a 401 status with the error message', async () => {
        jest.spyOn(utils, 'verifyAuthSimple').mockReturnValue({ authorized: false, cause: "Unauthorized" })

        await getCategories(mockReq, mockRes);

        expect(verifyAuthSimple).toHaveBeenCalled();
        expect(mockRes.status).toHaveBeenCalledWith(401);
        expect(mockRes.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
    });

    test('U3: Network error -> return 500', async () => {
        jest.spyOn(utils, 'verifyAuthSimple').mockImplementationOnce(() => { throw new Error('server crash') });

        await getCategories(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(500);
        expect(mockRes.json).toHaveBeenCalledWith({ error: 'server crash' });
    });

})

describe("createTransaction", () => {
    let mockReq;
    let mockRes;

    beforeEach(() => {
        mockReq = {
            params: { username: 'Mario' },
            body: {
                username: 'Mario',
                type: 'food',
                amount: 100,
                date: 'date'
            },
        };

        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                refreshedTokenMessage: "dummy message"
            },
        };
    });

    afterEach(() => {
        jest.clearAllMocks();
    })

    test('U1: create a new transaction -> return a 200 status and the saved transaction with refreshed token message', async () => {
        jest.spyOn(utils, 'verifyAuthUser').mockReturnValue({ authorized: true, cause: "Authorized" })

        const countDocumentsMock = jest.spyOn(categories, 'countDocuments').mockResolvedValueOnce(1);

        const countDocumentsMock2 = jest.spyOn(User, 'countDocuments').mockResolvedValueOnce(1);

        const saveMock = jest.fn().mockResolvedValueOnce(mockReq.body);
        jest.spyOn(transactions.prototype, 'save').mockImplementation(saveMock);

        await createTransaction(mockReq, mockRes);


        expect(countDocumentsMock).toHaveBeenCalledWith({ type: 'food' });
        expect(countDocumentsMock2).toHaveBeenCalledWith({ username: 'Mario' });
        expect(transactions.prototype.save).toHaveBeenCalled();
        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith({
            data: {
                username: 'Mario',
                amount: 100,
                type: 'food',
                date: expect.any(String),
            },
            refreshedTokenMessage: 'dummy message',
        });
    });

    test('U2: user not authorized -> return a 401 status with the error message', async () => {
        jest.spyOn(utils, 'verifyAuthUser').mockReturnValue({ authorized: false, cause: "Unauthorized" })

        await createTransaction(mockReq, mockRes);

        expect(verifyAuthUser).toHaveBeenCalled();
        expect(mockRes.status).toHaveBeenCalledWith(401);
        expect(mockRes.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
    });

    test('U3: missing username -> return a 400 status with the error message', async () => {
        mockReq = {
            params: { username: 'Mario' },
            body: {
                type: 'food',
                amount: '100'
            },
        };

        delete mockReq.body.username;


        jest.spyOn(utils, 'verifyAuthUser').mockReturnValue({ authorized: true, cause: "Authorized" })


        await createTransaction(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({ error: 'Username is not provided' });
    });

    test('U4: missing amount -> return a 400 status with the error message', async () => {
        mockReq = {
            params: { username: 'Mario' },
            body: {
                username: 'Mario',
                type: 'food'
            },
        };

        jest.spyOn(utils, 'verifyAuthUser').mockReturnValue({ authorized: true, cause: "Authorized" })

        await createTransaction(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({ error: 'Amount is not provided' });
    });

    test('U5: missing category type -> return a 400 status with the error message', async () => {
        mockReq = {
            params: { username: 'Mario' },
            body: {
                username: 'Mario',
                amount: '100'
            },
        };
        jest.spyOn(utils, 'verifyAuthUser').mockReturnValue({ authorized: true, cause: "Authorized" })

        await createTransaction(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({ error: 'Category is not provided' });
    });

    test('U6: empty username -> return a 400 status with the error message', async () => {
        mockReq.body.username = '';

        jest.spyOn(utils, 'verifyAuthUser').mockReturnValue({ authorized: true, cause: "Authorized" })


        await createTransaction(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({ error: 'Username is empty' });
    });

    test('U7: empty amount -> return a 400 status with the error message', async () => {
        mockReq.body.amount = '';

        jest.spyOn(utils, 'verifyAuthUser').mockReturnValue({ authorized: true, cause: "Authorized" })

        await createTransaction(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({ error: 'Amount is empty' });
    });

    test('U8: empty category type -> return a 400 status with the error message', async () => {
        mockReq.body.type = '';

        jest.spyOn(utils, 'verifyAuthUser').mockReturnValue({ authorized: true, cause: "Authorized" })

        await createTransaction(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({ error: 'Category is empty' });
    });

    test('U9: mismatch of usernames -> return a 400 status with the error message', async () => {
        mockReq = {
            params: { username: 'Mario' },
            body: {
                username: 'Francesco',
                type: 'food',
                amount: 100,
            },
        };

        jest.spyOn(utils, 'verifyAuthUser').mockReturnValue({ authorized: true, cause: "Authorized" })


        await createTransaction(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({ error: 'Username provided in the request body does not match the username provided in the request params' });
    });

    test('U10: Not a number amount -> return a 400 status with the error message', async () => {
        mockReq = {
            params: { username: 'Mario' },
            body: {
                username: 'Mario',
                type: 'food',
                amount: 'a',
            },
        };

        jest.spyOn(utils, 'verifyAuthUser').mockReturnValue({ authorized: true, cause: "Authorized" })


        await createTransaction(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({ error: 'Amount should be a number' });
    });

    test('U11: Not existing category -> return a 400 status with the error message', async () => {
        mockReq = {
            params: { username: 'Mario' },
            body: {
                username: 'Mario',
                type: 'sport',
                amount: 100,
            },
        };

        jest.spyOn(utils, 'verifyAuthUser').mockReturnValue({ authorized: true, cause: "Authorized" })

        jest.spyOn(categories, 'countDocuments').mockResolvedValueOnce(0);

        await createTransaction(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({ error: 'Category does not exist' });
    });

    test('U12: Not existing user -> return a 400 status with the error message', async () => {
        mockReq = {
            params: { username: 'Francesco' },
            body: {
                username: 'Francesco',
                type: 'food',
                amount: 100,
            },
        };

        jest.spyOn(utils, 'verifyAuthUser').mockReturnValue({ authorized: true, cause: "Authorized" })

        jest.spyOn(categories, 'countDocuments').mockResolvedValueOnce(1);

        jest.spyOn(User, 'countDocuments').mockResolvedValueOnce(0);

        await createTransaction(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({ error: 'User does not exist' });
    });

    test('U13: Network error -> return 500', async () => {
        jest.spyOn(utils, 'verifyAuthUser').mockImplementationOnce(() => { throw new Error('server crash') });

        await createTransaction(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(500);
        expect(mockRes.json).toHaveBeenCalledWith({ error: 'server crash' });
    });
})

describe("getAllTransactions", () => {
    afterEach(() => {
        jest.clearAllMocks()
    })

    test('U1: get all transactions by all users but there are none -> should return an empty array', async () => {
        const mockReq = {
            cookie: {
                accessToken: 'accessoToken',
                refreshToken: 'refreshToken'
            }
        }
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                refreshedTokenMessage: "test message"
            }
        }
        const emptyDb = []
        jest.spyOn(utils, 'verifyAuthAdmin').mockReturnValue({ authorized: true, cause: "Authorized" })
        jest.spyOn(transactions, 'aggregate').mockResolvedValue(emptyDb)

        await getAllTransactions(mockReq, mockRes)

        expect(mockRes.json).toHaveBeenCalledWith({
            data: [],
            refreshedTokenMessage: 'test message'
        })
    });

    test('U2: get all transactions by all users and there is at least one transaction -> should return a proper array of object', async () => {
        const mockReq = {}
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                refreshedTokenMessage: "test message"
            }

        }

        const expectedValue = [
            {
                "username": "user1",
                "type": "investment",
                "amount": 150,
                "date": "01/01/2023",
                "categories_info": {
                    "type": 'bills',
                    "color": '#111111'
                }
            },
            {
                "username": "user2",
                "type": "bills",
                "amount": 350,
                "date": "01/01/2023",
                "categories_info": {
                    "type": 'bills',
                    "color": '#222222'
                }
            },
            {
                "username": "user2",
                "type": "investment",
                "amount": 250,
                "date": "01/01/2023",
                "categories_info": {
                    "type": 'bills',
                    "color": '#222222'
                }
            }
        ]

        const expectedResponeAuth = { authorized: true, cause: "authorized" }
        jest.spyOn(utils, 'verifyAuthAdmin').mockReturnValue(expectedResponeAuth)
        jest.spyOn(transactions, 'aggregate').mockReturnValue(Promise.resolve(expectedValue))
        await getAllTransactions(mockReq, mockRes)

        expect(transactions.aggregate).toHaveBeenCalledTimes(1)
        expect(mockRes.json).toBeDefined()
        expect(mockRes.json.mock.calls[0][0].data).toHaveLength(3)

        expect(mockRes.json.mock.calls[0][0].data[0]).toHaveProperty('username')
        expect(mockRes.json.mock.calls[0][0].data[0]).toHaveProperty('type')
        expect(mockRes.json.mock.calls[0][0].data[0]).toHaveProperty('amount')
        expect(mockRes.json.mock.calls[0][0].data[0]).toHaveProperty('date')
        expect(mockRes.json.mock.calls[0][0].data[0]).toHaveProperty('color')

        expect(mockRes.json).toHaveBeenCalledWith({
            data: [
                {
                    "username": "user1",
                    "type": "investment",
                    "amount": 150,
                    "date": "01/01/2023",
                    "color": "#111111"
                },
                {
                    "username": "user2",
                    "type": "bills",
                    "amount": 350,
                    "date": "01/01/2023",
                    "color": "#222222"
                },
                {
                    "username": "user2",
                    "type": "investment",
                    "amount": 250,
                    "date": "01/01/2023",
                    "color": "#222222"
                }
            ],
            refreshedTokenMessage: 'test message'
        })
    })

    test('U3: transactions.aggregate() throws an error', async () => {
        const mockReq = {}
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                refreshedTokenMessage: "test message"
            }
        }

        const expectedResponeAuth = { authorized: true, cause: "authorized" }
        jest.spyOn(utils, 'verifyAuthAdmin').mockReturnValue(expectedResponeAuth)
        jest.spyOn(transactions, 'aggregate').mockImplementationOnce(() => {
            const err = new Error('transactions aggregate error');
            throw err
        })
        await getAllTransactions(mockReq, mockRes)
        expect(mockRes.status).toHaveBeenCalledWith(500)
        expect(mockRes.json).toHaveBeenCalledWith({ error: 'transactions aggregate error' })
    })

    test('U4: admin is not authorized', async () => {
        const mockReq = {
            cookie: {
                accessToken: 'accessoToken',
                refreshToken: 'refreshToken'
            }
        }
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                refreshedTokenMessage: "test message"
            }
        }
        const emptyDb = []
        const expectedResponeAuth = { authorized: false, cause: "Not authorized" }
        jest.spyOn(utils, 'verifyAuthAdmin').mockReturnValue(expectedResponeAuth)
        const expectedRespone = { error: 'Not authorized' }
        await getAllTransactions(mockReq, mockRes)
        expect(mockRes.json).toHaveBeenCalledWith(expectedRespone)
    })
})

describe("getTransactionsByUser", () => {

    let req;
    let res;

    beforeEach(() => {

        // mock request
        req = {
            params: {
                username: "dummy_user_1",
            }
        }

        // mock response
        res = {
            locals: {
                refreshedTokenMessage: "dummy message"
            },
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        }
    });

    afterEach(() => {
        jest.clearAllMocks();
    })

    test("U1 : Should return an error indicating that the user is not authorized", async () => {

        // called by user
        req.url = `/users/${req.params.username}/transactions`;

        jest.spyOn(utils, "verifyAuthUser").mockReturnValue({
            authorized: false,
            cause: "dummy error"
        });

        // call function under test
        await getTransactionsByUser(req, res);

        expect(utils.verifyAuthUser).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
            error: "dummy error"
        });
    });

    test("U2 : Should return an error indicating that the user is not authorized or not an admin", async () => {

        // called by admin
        req.url = `/transactions/users/`;

        jest.spyOn(utils, "verifyAuthAdmin").mockReturnValue({
            authorized: false,
            cause: "dummy error"
        });

        // call function under test
        await getTransactionsByUser(req, res);

        expect(utils.verifyAuthAdmin).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
            error: "dummy error"
        });
    });

    test("U3 : Should return an error indicating that the user specified by params does not exist (authorized as an admin)", async () => {

        // called by admin
        req.url = `/transactions/users/`;

        jest.spyOn(utils, "verifyAuthAdmin").mockReturnValue({
            authorized: true,
            cause: "Authorized"
        });

        jest.spyOn(User, "countDocuments").mockResolvedValue(0);

        // call function under test
        await getTransactionsByUser(req, res);

        expect(utils.verifyAuthAdmin).toHaveBeenCalled();
        expect(User.countDocuments).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            error: "User does not exist"
        });
    });

    test("U4 : Should return a list of transactions (authorized as an admin)", async () => {

        // called by admin
        req.url = `/transactions/users/`;

        jest.spyOn(utils, "verifyAuthAdmin").mockReturnValue({
            authorized: true,
            cause: "Authorized"
        });

        jest.spyOn(User, "countDocuments").mockResolvedValue(1);
        jest.spyOn(transactions, "aggregate").mockResolvedValue([
            { username: "dummy_user_1", type: "testCategory", date: "test-date", amount: 0, category: [{ color: "blue" }] },
            { username: "dummy_user_1", type: "testCategory", date: "test-date", amount: 1, category: [{ color: "red" }] },
        ]);

        await getTransactionsByUser(req, res);

        expect(utils.verifyAuthAdmin).toHaveBeenCalled();
        expect(User.countDocuments).toHaveBeenCalled();
        expect(transactions.aggregate).toHaveBeenCalledWith([
            { $match: { username: "dummy_user_1" } },
            { $lookup: { from: "categories", localField: "type", foreignField: "type", as: "category" } },
            { $project: { _id: 0, username: 1, type: 1, amount: 1, date: 1, color: 1, "category.color": 1 } }
        ]);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            data: [
                { username: "dummy_user_1", color: "blue", type: "testCategory", amount: 0, date: "test-date" },
                { username: "dummy_user_1", color: "red", type: "testCategory", amount: 1, date: "test-date" }
            ],
            refreshedTokenMessage: "dummy message"
        });
    });

    test("U5 : Should return an empty list (authorized as an admin)", async () => {

        // called by admin
        req.url = `/transactions/users/`;

        jest.spyOn(utils, "verifyAuthAdmin").mockReturnValue({
            authorized: true,
            cause: "Authorized"
        });

        jest.spyOn(User, "countDocuments").mockResolvedValue(1);
        jest.spyOn(transactions, "aggregate").mockResolvedValue([]);

        await getTransactionsByUser(req, res);

        expect(utils.verifyAuthAdmin).toHaveBeenCalled();
        expect(User.countDocuments).toHaveBeenCalled();
        expect(transactions.aggregate).toHaveBeenCalledWith([
            { $match: { username: "dummy_user_1" } },
            { $lookup: { from: "categories", localField: "type", foreignField: "type", as: "category" } },
            { $project: { _id: 0, username: 1, type: 1, amount: 1, date: 1, color: 1, "category.color": 1 } }
        ]);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            data: [],
            refreshedTokenMessage: "dummy message"
        });
    });

    test("U6 : Should return an error indicating that the user specified by params does not exist (authorized as a user)", async () => {

        // called by user
        req.url = `/users/${req.params.username}/transactions`;

        jest.spyOn(utils, "verifyAuthUser").mockReturnValue({
            authorized: true,
            cause: "Authorized"
        });

        jest.spyOn(utils, "handleAmountFilterParams").mockReturnValue({
            amount: { dummyOp: "dummyVal" }
        });
        jest.spyOn(utils, "handleDateFilterParams").mockReturnValue({
            date: { dummyOp: "dummyVal" }
        });

        jest.spyOn(User, "countDocuments").mockResolvedValue(0);

        // call function under test
        await getTransactionsByUser(req, res);

        expect(utils.verifyAuthUser).toHaveBeenCalled();
        expect(User.countDocuments).toHaveBeenCalled();
        expect(utils.handleDateFilterParams).toHaveBeenCalled();
        expect(utils.handleAmountFilterParams).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            error: "User does not exist"
        });
    });

    test("U7 : Should return a list of transactions (authorized as a user)", async () => {

        // called by user
        req.url = `/users/${req.params.username}/transactions`;

        jest.spyOn(utils, "verifyAuthUser").mockReturnValue({
            authorized: true,
            cause: "Authorized"
        });

        jest.spyOn(utils, "handleAmountFilterParams").mockReturnValue({
            amount: { dummyOp: "dummyVal" }
        });
        jest.spyOn(utils, "handleDateFilterParams").mockReturnValue({
            date: { dummyOp: "dummyVal" }
        });

        jest.spyOn(User, "countDocuments").mockResolvedValue(1);
        jest.spyOn(transactions, "aggregate").mockResolvedValue([
            { username: "dummy_user_1", type: "testCategory", date: "test-date", amount: 0, category: [{ color: "blue" }] },
            { username: "dummy_user_1", type: "testCategory", date: "test-date", amount: 1, category: [{ color: "red" }] },
        ]);

        await getTransactionsByUser(req, res);

        expect(utils.verifyAuthUser).toHaveBeenCalled();
        expect(utils.handleDateFilterParams).toHaveBeenCalled();
        expect(utils.handleAmountFilterParams).toHaveBeenCalled();
        expect(User.countDocuments).toHaveBeenCalled();
        expect(transactions.aggregate).toHaveBeenCalledWith([
            { $match: { $and: [{ amount: { dummyOp: "dummyVal" } }, { date: { dummyOp: "dummyVal" } }, { username: "dummy_user_1" }] } },
            { $lookup: { from: "categories", localField: "type", foreignField: "type", as: "category" } },
            { $project: { _id: 0, username: 1, type: 1, amount: 1, date: 1, color: 1, "category.color": 1 } }
        ]);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            data: [
                { username: "dummy_user_1", color: "blue", type: "testCategory", amount: 0, date: "test-date" },
                { username: "dummy_user_1", color: "red", type: "testCategory", amount: 1, date: "test-date" }
            ],
            refreshedTokenMessage: "dummy message"
        });
    });

    test("U8 : Should return an empty list (authorized as a user)", async () => {

        // called by user
        req.url = `/users/${req.params.username}/transactions`;

        jest.spyOn(utils, "verifyAuthUser").mockReturnValue({
            authorized: true,
            cause: "Authorized"
        });

        jest.spyOn(utils, "handleAmountFilterParams").mockReturnValue({
            amount: { dummyOp: "dummyVal" }
        });
        jest.spyOn(utils, "handleDateFilterParams").mockReturnValue({
            date: { dummyOp: "dummyVal" }
        });

        jest.spyOn(User, "countDocuments").mockResolvedValue(1);
        jest.spyOn(transactions, "aggregate").mockResolvedValue([]);

        await getTransactionsByUser(req, res);

        expect(utils.verifyAuthUser).toHaveBeenCalled();
        expect(User.countDocuments).toHaveBeenCalled();
        expect(utils.handleDateFilterParams).toHaveBeenCalled();
        expect(utils.handleAmountFilterParams).toHaveBeenCalled();
        expect(transactions.aggregate).toHaveBeenCalledWith([
            { $match: { $and: [{ amount: { dummyOp: "dummyVal" } }, { date: { dummyOp: "dummyVal" } }, { username: "dummy_user_1" }] } },
            { $lookup: { from: "categories", localField: "type", foreignField: "type", as: "category" } },
            { $project: { _id: 0, username: 1, type: 1, amount: 1, date: 1, color: 1, "category.color": 1 } }
        ]);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            data: [],
            refreshedTokenMessage: "dummy message"
        });
    });

    test("U9 : Should return an error caused by an exception (authorized as an admin)", async () => {

        // called by admin
        req.url = `/transactions/users/`;

        jest.spyOn(utils, "verifyAuthAdmin").mockReturnValue({
            authorized: true,
            cause: "Authorized"
        });

        jest.spyOn(User, "countDocuments").mockImplementation(() => {
            throw new Error('dummy exception');
        });

        // call function under test
        await getTransactionsByUser(req, res);

        expect(utils.verifyAuthAdmin).toHaveBeenCalled();
        expect(User.countDocuments).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            error: "dummy exception"
        });
    });

})

describe("getTransactionsByUserByCategory", () => {

    let req;
    let res;

    beforeEach(() => {

        // mock request
        req = {
            params: {
                username: "dummy_user_1",
                category: "testCategory"
            }
        }

        // mock response
        res = {
            locals: {
                refreshedTokenMessage: "dummy message"
            },
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        }
    });

    afterEach(() => {
        jest.clearAllMocks();
    })

    test("U1 : Should return an error indicating that the user is not authorized", async () => {

        // called by user
        req.url = `/users/${req.params.username}/transactions`;

        jest.spyOn(utils, "verifyAuthUser").mockReturnValue({
            authorized: false,
            cause: "dummy error"
        });

        // call function under test
        await getTransactionsByUserByCategory(req, res);

        expect(utils.verifyAuthUser).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
            error: "dummy error"
        });
    });

    test("U2 : Should return an error indicating that the user is not authorized or not an admin", async () => {

        // called by admin
        req.url = `/transactions/users/`;

        jest.spyOn(utils, "verifyAuthAdmin").mockReturnValue({
            authorized: false,
            cause: "dummy error"
        });

        // call function under test
        await getTransactionsByUserByCategory(req, res);

        expect(utils.verifyAuthAdmin).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
            error: "dummy error"
        });
    });

    test("U3 : Should return an error indicating that the user specified by params does not exist (auth type doesn't matter)", async () => {

        // called by admin
        req.url = `/transactions/users/`;

        jest.spyOn(utils, "verifyAuthAdmin").mockReturnValue({
            authorized: true,
            cause: "Authorized"
        });

        jest.spyOn(User, "countDocuments").mockResolvedValue(0);

        // call function under test
        await getTransactionsByUserByCategory(req, res);

        expect(utils.verifyAuthAdmin).toHaveBeenCalled();
        expect(User.countDocuments).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            error: "User does not exist"
        });
    });

    test("U4 : Should return an error indicating that the category specified by params does not exist (auth type doesn't matter)", async () => {

        // called by admin
        req.url = `/transactions/users/`;

        jest.spyOn(utils, "verifyAuthAdmin").mockReturnValue({
            authorized: true,
            cause: "Authorized"
        });

        jest.spyOn(User, "countDocuments").mockResolvedValue(1);
        jest.spyOn(categories, "countDocuments").mockResolvedValue(0);

        // call function under test
        await getTransactionsByUserByCategory(req, res);

        expect(utils.verifyAuthAdmin).toHaveBeenCalled();
        expect(User.countDocuments).toHaveBeenCalled();
        expect(categories.countDocuments).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            error: "Category does not exist"
        });
    });

    test("U5 : Should return a list of transactions (auth type doesn't matter)", async () => {

        // called by admin
        req.url = `/transactions/users/`;

        jest.spyOn(utils, "verifyAuthAdmin").mockReturnValue({
            authorized: true,
            cause: "Authorized"
        });

        jest.spyOn(User, "countDocuments").mockResolvedValue(1);
        jest.spyOn(categories, "countDocuments").mockResolvedValue(1);
        jest.spyOn(transactions, "aggregate").mockResolvedValue([
            { username: "dummy_user_1", type: "testCategory", date: "test-date", amount: 0, category: [{ color: "red" }] },
            { username: "dummy_user_1", type: "testCategory", date: "test-date", amount: 1, category: [{ color: "red" }] },
        ]);

        await getTransactionsByUserByCategory(req, res);

        expect(utils.verifyAuthAdmin).toHaveBeenCalled();
        expect(User.countDocuments).toHaveBeenCalled();
        expect(categories.countDocuments).toHaveBeenCalled();
        expect(transactions.aggregate).toHaveBeenCalledWith([
            { $match: { type: "testCategory", username: "dummy_user_1" } },
            { $lookup: { from: "categories", localField: "type", foreignField: "type", as: "category" } },
            { $project: { _id: 0, username: 1, type: 1, amount: 1, date: 1, color: 1, category: 1 } }
        ]);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            data: [
                { username: "dummy_user_1", color: "red", type: "testCategory", amount: 0, date: "test-date" },
                { username: "dummy_user_1", color: "red", type: "testCategory", amount: 1, date: "test-date" }
            ],
            refreshedTokenMessage: "dummy message"
        });
    });

    test("U6 : Should return an empty list (auth type doesn't matter)", async () => {

        // called by admin
        req.url = `/transactions/users/`;

        jest.spyOn(utils, "verifyAuthAdmin").mockReturnValue({
            authorized: true,
            cause: "Authorized"
        });

        jest.spyOn(User, "countDocuments").mockResolvedValue(1);
        jest.spyOn(categories, "countDocuments").mockResolvedValue(1);
        jest.spyOn(transactions, "aggregate").mockResolvedValue([]);

        await getTransactionsByUserByCategory(req, res);

        expect(utils.verifyAuthAdmin).toHaveBeenCalled();
        expect(User.countDocuments).toHaveBeenCalled();
        expect(categories.countDocuments).toHaveBeenCalled();
        expect(transactions.aggregate).toHaveBeenCalledWith([
            { $match: { type: "testCategory", username: "dummy_user_1" } },
            { $lookup: { from: "categories", localField: "type", foreignField: "type", as: "category" } },
            { $project: { _id: 0, username: 1, type: 1, amount: 1, date: 1, color: 1, category: 1 } }
        ]);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            data: [],
            refreshedTokenMessage: "dummy message"
        });
    });

    test("U7 : Should return an error caused by an exception (auth type doesn't matter)", async () => {

        // called by user
        req.url = `/users/${req.params.username}/transactions`;

        jest.spyOn(utils, "verifyAuthUser").mockImplementation(() => {
            throw new Error('dummy exception');
        });

        // call function under test
        await getTransactionsByUserByCategory(req, res);

        expect(utils.verifyAuthUser).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            error: "dummy exception"
        });
    });
})

describe("getTransactionsByGroup", () => {

    let req;
    let res;

    beforeEach(() => {

        // mock request
        req = {
            params: {
                username: "dummy_user_1",
                category: "testCategory"
            }
        }

        // mock response
        res = {
            locals: {
                refreshedTokenMessage: "dummy message"
            },
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        }
    });

    afterEach(() => {
        jest.clearAllMocks();
    })

    test("U1 : Should return an error indicating that the user is not authorized or not and admin", async () => {

        // called by an admin
        req.url = `/transactions/groups/`;

        jest.spyOn(utils, "verifyAuthAdmin").mockReturnValue({
            authorized: false,
            cause: "dummy error"
        });

        // call function under test
        await getTransactionsByGroup(req, res);

        expect(utils.verifyAuthAdmin).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
            error: "dummy error"
        });
    });

    test("U2 : Should return an error indicating that the user is not authorized or not a member of the group", async () => {

        // called by group member
        req.url = `/transactions/users/`;

        jest.spyOn(utils, "verifyAuthGroup").mockResolvedValue({
            authorized: false,
            cause: "dummy error"
        });

        // call function under test
        await getTransactionsByGroup(req, res);

        expect(utils.verifyAuthGroup).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
            error: "dummy error"
        });
    });

    test("U3 : Should return an error indicating that the group specified in the request params does not exist (authorization does not matter)", async () => {

        // called by an admin (does not matter, functionality for both auth types is the same)
        req.url = `/transactions/groups/`;

        jest.spyOn(utils, "verifyAuthAdmin").mockReturnValue({
            authorized: true,
            cause: "authorized"
        });

        jest.spyOn(Group, "aggregate").mockResolvedValue([])

        // call function under test
        await getTransactionsByGroup(req, res);

        expect(utils.verifyAuthAdmin).toHaveBeenCalled();
        expect(Group.aggregate).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            error: "Group does not exist"
        });
    });


    test("U4 : Should return a list of transactions (authorization does not matter)", async () => {

        // called by an admin (does not matter, functionality for both auth types is the same)
        req.url = `/transactions/groups/`;

        jest.spyOn(utils, "verifyAuthAdmin").mockReturnValue({
            authorized: true,
            cause: "authorized"
        });

        jest.spyOn(Group, "aggregate").mockResolvedValue(
            [{ "members_info": [{ "username": "dummy_member_1" }, { "username": "dummy_member_2" }] }]
        )

        jest.spyOn(transactions, "aggregate").mockResolvedValue([
            { username: "dummy_member_1", type: "testCategory", date: "test-date", amount: 0, category: [{ color: "red" }] },
            { username: "dummy_member_2", type: "testCategory", date: "test-date", amount: 1, category: [{ color: "red" }] },
        ]);

        // call function under test
        await getTransactionsByGroup(req, res);

        expect(utils.verifyAuthAdmin).toHaveBeenCalled();
        expect(Group.aggregate).toHaveBeenCalled();
        expect(transactions.aggregate).toHaveBeenCalledWith([
            { $match: { username: { $in: ["dummy_member_1", "dummy_member_2"] } } },
            { $lookup: { from: "categories", localField: "type", foreignField: "type", as: "category" } },
            { $project: { _id: 0, username: 1, type: 1, amount: 1, date: 1, color: 1, category: 1 } }
        ]);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            data: [
                { username: "dummy_member_1", color: "red", type: "testCategory", amount: 0, date: "test-date" },
                { username: "dummy_member_2", color: "red", type: "testCategory", amount: 1, date: "test-date" }
            ],
            refreshedTokenMessage: "dummy message"
        });
    });

    test("U5 : Should return an empty list (authorization does not matter)", async () => {

        // called by an admin (does not matter, functionality for both auth types is the same)
        req.url = `/transactions/groups/`;

        jest.spyOn(utils, "verifyAuthAdmin").mockReturnValue({
            authorized: true,
            cause: "authorized"
        });

        jest.spyOn(Group, "aggregate").mockResolvedValue(
            [{ "members_info": [{ "username": "dummy_member_1" }, { "username": "dummy_member_2" }] }]
        )

        jest.spyOn(transactions, "aggregate").mockResolvedValue([]);

        // call function under test
        await getTransactionsByGroup(req, res);

        expect(utils.verifyAuthAdmin).toHaveBeenCalled();
        expect(Group.aggregate).toHaveBeenCalled();
        expect(transactions.aggregate).toHaveBeenCalledWith([
            { $match: { username: { $in: ["dummy_member_1", "dummy_member_2"] } } },
            { $lookup: { from: "categories", localField: "type", foreignField: "type", as: "category" } },
            { $project: { _id: 0, username: 1, type: 1, amount: 1, date: 1, color: 1, category: 1 } }
        ]);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            data: [],
            refreshedTokenMessage: "dummy message"
        });
    });

    test("U6 : Should return an error caused by an exception (auth type doesn't matter)", async () => {

        // called by an admin (does not matter, functionality for both auth types is the same)
        req.url = `/transactions/groups/`;

        jest.spyOn(utils, "verifyAuthAdmin").mockImplementation(() => {
            throw new Error('dummy exception');
        });

        // call function under test
        await getTransactionsByGroup(req, res);

        expect(utils.verifyAuthAdmin).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            error: "dummy exception"
        });
    });
})

describe("getTransactionsByGroupByCategory", () => {
    let req;
    let res;

    beforeEach(() => {

        jest.clearAllMocks();

        // mock request
        req = {
            params: {
                name: "dummy_group",
                category: "dummy_category"
            }
        }

        // mock response
        res = {
            locals: {
                refreshedTokenMessage: "dummy message"
            },
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        }
    });

    afterEach(() => {
        jest.clearAllMocks();
    })

    test("U1 : Should return an error indicating that the user is not authorized or not an admin", async () => {

        // called by admin
        req.url = `/transactions/groups/${req.params.name}/category/${req.params.name}`;

        jest.spyOn(utils, "verifyAuthAdmin").mockReturnValue({
            authorized: false,
            cause: "dummy error"
        });

        await getTransactionsByGroupByCategory(req, res);

        expect(utils.verifyAuthAdmin).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
            error: "dummy error"
        });
    });

    test("U2 : Should return an error indicating that the user is not authorized or not a member of the group", async () => {

        // called by group member
        req.url = `/groups/${req.params.name}/transactions/category/${req.params.name}`;

        jest.spyOn(utils, "verifyAuthGroup").mockResolvedValue({
            authorized: false,
            cause: "dummy error"
        });

        await getTransactionsByGroupByCategory(req, res);

        expect(utils.verifyAuthGroup).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
            error: "dummy error"
        });
    });

    test("U3 : Should return an error indicating that the group does not exist (auth type doesn't matter)", async () => {

        // called by admin (authorization type doesn't matter)
        req.url = `/transactions/groups/${req.params.name}/category/${req.params.name}`;

        jest.spyOn(utils, "verifyAuthAdmin").mockReturnValue({
            authorized: true,
            cause: "authorized"
        });

        jest.spyOn(Group, "findOne").mockReturnValue(null);

        await getTransactionsByGroupByCategory(req, res);

        expect(utils.verifyAuthAdmin).toHaveBeenCalled();
        expect(Group.findOne).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            error: "group does not exist"
        });
    });

    test("U4 : Should return an error indicating that the category does not exist (auth type doesn't matter)", async () => {

        // called by admin (authorization type doesn't matter)
        req.url = `/transactions/groups/${req.params.name}/category/${req.params.name}`;

        jest.spyOn(utils, "verifyAuthAdmin").mockReturnValue({
            authorized: true,
            cause: "authorized"
        });

        jest.spyOn(Group, "findOne").mockReturnValue({
            name: "dummy_group",
            members: ["dummy_user_1", "dummy_user_2"]
        });

        jest.spyOn(categories, "findOne").mockReturnValue(null);

        await getTransactionsByGroupByCategory(req, res);

        expect(utils.verifyAuthAdmin).toHaveBeenCalled();
        expect(Group.findOne).toHaveBeenCalled();
        expect(categories.findOne).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            error: "category does not exist"
        });
    });

    test("U5 : Should return an error indicating that group or category don't exist (auth type doesn't matter)", async () => {

        // called by admin (authorization type doesn't matter)
        req.url = `/transactions/groups/${req.params.name}/category/${req.params.name}`;

        jest.spyOn(utils, "verifyAuthAdmin").mockReturnValue({
            authorized: true,
            cause: "authorized"
        });

        jest.spyOn(Group, "findOne").mockReturnValueOnce({
            name: "dummy_group",
            members: ["dummy_user_1", "dummy_user_2"]
        });

        jest.spyOn(categories, "findOne").mockReturnValue({
            type: "dummy_category"
        });

        jest.spyOn(Group, "aggregate").mockReturnValue(
            []
        );

        await getTransactionsByGroupByCategory(req, res);

        expect(utils.verifyAuthAdmin).toHaveBeenCalled();
        expect(Group.findOne).toHaveBeenCalled();
        expect(categories.findOne).toHaveBeenCalled();
        expect(Group.aggregate).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            error: "group or category does not exist"
        });
    });

    test("U6 : Should return an empty list of transactions (auth type doesn't matter)", async () => {

        // called by admin (authorization type doesn't matter)
        req.url = `/transactions/groups/${req.params.name}/category/${req.params.name}`;

        jest.spyOn(utils, "verifyAuthAdmin").mockReturnValue({
            authorized: true,
            cause: "authorized"
        });

        jest.spyOn(Group, "findOne").mockReturnValueOnce({
            name: "dummy_group",
            members: ["dummy_user_1", "dummy_user_2"]
        });

        jest.spyOn(categories, "findOne").mockReturnValue({
            type: "dummy_category"
        });

        jest.spyOn(Group, "aggregate").mockReturnValue(
            [{ "_id": "647bc108d8aeb6e110b32486", "members_info": [{ "username": "dummy_member_1" }, { "username": "dummy_member_2" }] }]
        );

        jest.spyOn(transactions, "aggregate").mockReturnValue(
            []
        );

        await getTransactionsByGroupByCategory(req, res);

        expect(utils.verifyAuthAdmin).toHaveBeenCalled();
        expect(Group.findOne).toHaveBeenCalled();
        expect(categories.findOne).toHaveBeenCalled();
        expect(Group.aggregate).toHaveBeenCalled();
        expect(transactions.aggregate).toHaveBeenCalledWith([
            { $match: { "username": { $in: ["dummy_member_1", "dummy_member_2"] } } },
            { $lookup: { from: "categories", localField: "type", foreignField: "type", as: "categories_info" } },
            { $match: { type: "dummy_category" } },
            { $unwind: "$categories_info" }
        ]);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            data: [],
            refreshedTokenMessage: "dummy message"
        });
    });

    test("U7 : Should return a list of transactions (auth type doesn't matter)", async () => {

        // called by admin (authorization type doesn't matter)
        req.url = `/transactions/groups/${req.params.name}/category/${req.params.name}`;

        jest.spyOn(utils, "verifyAuthAdmin").mockReturnValue({
            authorized: true,
            cause: "authorized"
        });

        jest.spyOn(Group, "findOne").mockReturnValueOnce({
            name: "dummy_group",
            members: ["dummy_user_1", "dummy_user_2"]
        });

        jest.spyOn(categories, "findOne").mockReturnValue({
            type: "dummy_category"
        });

        jest.spyOn(Group, "aggregate").mockReturnValue(
            [{ "_id": "647bc108d8aeb6e110b32486", "members_info": [{ "username": "dummy_member_1" }, { "username": "dummy_member_2" }] }]
        );

        jest.spyOn(transactions, "aggregate").mockReturnValue([
            { username: "dummy_user_1", type: "testCategory", date: "test-date", amount: 0, categories_info: { color: "blue" } },
            { username: "dummy_user_1", type: "testCategory", date: "test-date", amount: 1, categories_info: { color: "red" } },
        ]);

        await getTransactionsByGroupByCategory(req, res);

        expect(utils.verifyAuthAdmin).toHaveBeenCalled();
        expect(Group.findOne).toHaveBeenCalled();
        expect(categories.findOne).toHaveBeenCalled();
        expect(Group.aggregate).toHaveBeenCalled();
        expect(transactions.aggregate).toHaveBeenCalledWith([
            { $match: { "username": { $in: ["dummy_member_1", "dummy_member_2"] } } },
            { $lookup: { from: "categories", localField: "type", foreignField: "type", as: "categories_info" } },
            { $match: { type: "dummy_category" } },
            { $unwind: "$categories_info" }
        ]);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            data: [
                { username: "dummy_user_1", color: "blue", type: "testCategory", amount: 0, date: "test-date" },
                { username: "dummy_user_1", color: "red", type: "testCategory", amount: 1, date: "test-date" }
            ],
            refreshedTokenMessage: "dummy message"
        });
    });

    test("U8 : Should return an error caused by an exception (auth type doesn't matter)", async () => {

        // called by admin (authorization type doesn't matter)
        req.url = `/transactions/groups/${req.params.name}/category/${req.params.name}`;

        jest.spyOn(utils, "verifyAuthAdmin").mockImplementation(() => {
            throw new Error('dummy exception');
        });

        // call function under test
        await getTransactionsByGroupByCategory(req, res);

        expect(utils.verifyAuthAdmin).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            error: "dummy exception"
        });
    });
})

describe("deleteTransaction", () => {
    let req;
    let res;

    beforeEach(() => {
        // mock response
        res = {
            locals: {
                refreshedTokenMessage: "dummy message"
            },
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        }
    });

    afterEach(() => {
        jest.clearAllMocks();
    })

    test("U1 : Should return an error indicating that the user is not authorized", async () => {

        // mock request
        req = {
            params: {
                username: "dummy_user_1",
            },
            body: {
                id: "dummy_id"
            }
        }

        jest.spyOn(utils, "verifyAuthUser").mockReturnValue({
            authorized: false,
            cause: "dummy error"
        });

        // call function under test
        await deleteTransaction(req, res);

        expect(utils.verifyAuthUser).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
            error: "dummy error"
        });
    });

    test("U2 : Should return an error indicating that not all attributes in body are present", async () => {
        // mock request
        req = {
            params: {
                username: "dummy_user_1",
            },
            body: {}
        }

        jest.spyOn(utils, "verifyAuthUser").mockReturnValue({
            authorized: true,
            cause: "authorized"
        });

        // call function under test
        await deleteTransaction(req, res);

        expect(utils.verifyAuthUser).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            error: "body does not contain all the necessary attributes"
        });
    });

    test("U3 : Should return an error indicating that the user was not found", async () => {
        // mock request
        req = {
            params: {
                username: "dummy_user_1",
            },
            body: {
                id: "dummy_id"
            }
        }

        jest.spyOn(utils, "verifyAuthUser").mockReturnValue({
            authorized: true,
            cause: "authorized"
        });

        jest.spyOn(User, "findOne").mockResolvedValue(null);

        // call function under test
        await deleteTransaction(req, res);

        expect(utils.verifyAuthUser).toHaveBeenCalled();
        expect(User.findOne).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            error: "user not found"
        });
    });

    test("U4 : Should return an error indicating that the transaction was not found", async () => {
        // mock request
        req = {
            params: {
                username: "dummy_user_1",
            },
            body: {
                id: "dummy_id"
            }
        }

        jest.spyOn(utils, "verifyAuthUser").mockReturnValue({
            authorized: true,
            cause: "authorized"
        });

        jest.spyOn(User, "findOne").mockResolvedValue({
            username: "dummy_user",
            email: "dummy_user@test.com",
            password: "dummy_hash",
            role: "dummy_role",
            refreshToken: "dummy_token"
        });

        jest.spyOn(transactions, "findOne").mockResolvedValue(null)

        // call function under test
        await deleteTransaction(req, res);

        expect(utils.verifyAuthUser).toHaveBeenCalled();
        expect(User.findOne).toHaveBeenCalled();
        expect(transactions.findOne).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            error: "transaction not found"
        });
    });

    test("U5 : Should return an error indicating that the transaction does not exist (failed to delete it)", async () => {
        // mock request
        req = {
            params: {
                username: "dummy_user_1",
            },
            body: {
                id: "dummy_id"
            }
        }

        jest.spyOn(utils, "verifyAuthUser").mockReturnValue({
            authorized: true,
            cause: "authorized"
        });

        jest.spyOn(User, "findOne").mockResolvedValue({
            username: "dummy_user",
            email: "dummy_user@test.com",
            password: "dummy_hash",
            role: "dummy_role",
            refreshToken: "dummy_token"
        });

        jest.spyOn(transactions, "findOne").mockResolvedValue({
            username: "dummy_user_2",
            type: "dummy_category",
            data: "dummy_date",
            amount: 0
        })

        // call function under test
        await deleteTransaction(req, res);

        expect(utils.verifyAuthUser).toHaveBeenCalled();
        expect(User.findOne).toHaveBeenCalled();
        expect(transactions.findOne).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            error: "transaction not found for the user"
        });
    });

    test("U6 : Should return an error indicating that the transaction was not found", async () => {
        // mock request
        req = {
            params: {
                username: "dummy_user_1",
            },
            body: {
                id: "dummy_id"
            }
        }

        jest.spyOn(utils, "verifyAuthUser").mockReturnValue({
            authorized: true,
            cause: "authorized"
        });

        jest.spyOn(User, "findOne").mockResolvedValue({
            username: "dummy_user",
            email: "dummy_user@test.com",
            password: "dummy_hash",
            role: "dummy_role",
            refreshToken: "dummy_token"
        });

        jest.spyOn(transactions, "findOne").mockResolvedValue({
            username: "dummy_user_1",
            type: "dummy_category",
            data: "dummy_date",
            amount: 0
        })

        jest.spyOn(mongoose.Types, "ObjectId").mockReturnValue(
            {}
        )

        jest.spyOn(transactions, "deleteOne").mockResolvedValue({
            deletedCount: 0
        })

        // call function under test
        await deleteTransaction(req, res);

        expect(utils.verifyAuthUser).toHaveBeenCalled();
        expect(User.findOne).toHaveBeenCalled();
        expect(transactions.findOne).toHaveBeenCalled();
        expect(transactions.deleteOne).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            error: "transaction not found"
        });
    });

    test("U7 : Should return a message indicating that the transaction was deleted", async () => {
        // mock request
        req = {
            params: {
                username: "dummy_user_1",
            },
            body: {
                id: "dummy_id"
            }
        }

        jest.spyOn(utils, "verifyAuthUser").mockReturnValue({
            authorized: true,
            cause: "authorized"
        });

        jest.spyOn(User, "findOne").mockResolvedValue({
            username: "dummy_user",
            email: "dummy_user@test.com",
            password: "dummy_hash",
            role: "dummy_role",
            refreshToken: "dummy_token"
        });

        jest.spyOn(transactions, "findOne").mockResolvedValue({
            username: "dummy_user_1",
            type: "dummy_category",
            data: "dummy_date",
            amount: 0
        })

        jest.spyOn(mongoose.Types, "ObjectId").mockReturnValue(
            {}
        )

        jest.spyOn(transactions, "deleteOne").mockResolvedValue({
            deletedCount: 1
        })

        // call function under test
        await deleteTransaction(req, res);

        expect(utils.verifyAuthUser).toHaveBeenCalled();
        expect(User.findOne).toHaveBeenCalled();
        expect(transactions.findOne).toHaveBeenCalled();
        expect(transactions.deleteOne).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            data: {
                message: "Transaction deleted"
            },
            refreshedTokenMessage: "dummy message"
        });
    });

    test("U8 : Should return an error caused by an exception", async () => {

        // mock request
        req = {
            params: {
                username: "dummy_user_1",
            },
            body: {
                id: "dummy_id"
            }
        }

        jest.spyOn(utils, "verifyAuthUser").mockReturnValue({
            authorized: true,
            cause: "authorized"
        });

        jest.spyOn(User, "findOne").mockImplementation(() => {
            throw new Error('dummy exception');
        });

        // call function under test
        await deleteTransaction(req, res);

        expect(utils.verifyAuthUser).toHaveBeenCalled();
        expect(User.findOne).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            error: "dummy exception"
        });
    });
})

describe("deleteTransactions", () => {

    let req;
    let res;

    beforeEach(() => {
        // mock response
        res = {
            locals: {
                refreshedTokenMessage: "dummy message"
            },
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        }
    });

    afterEach(() => {
        jest.clearAllMocks();
    })

    test("U1 : Should return an error indicating that the user is not authorized", async () => {

        // mock request
        req = {
            params: {
                username: "dummy_user_1",
            },
            body: {
                id: "dummy_id"
            }
        }

        jest.spyOn(utils, "verifyAuthAdmin").mockReturnValue({
            authorized: false,
            cause: "dummy error"
        });

        // call function under test
        await deleteTransactions(req, res);

        expect(utils.verifyAuthAdmin).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
            error: "dummy error"
        });
    });

    test("U2 : Should return an error indicating that not all attributes in body are present", async () => {
        // mock request
        req = {
            params: {
                username: "dummy_user_1",
            },
            body: {}
        }

        jest.spyOn(utils, "verifyAuthAdmin").mockReturnValue({
            authorized: true,
            cause: "authorized"
        });

        // call function under test
        await deleteTransactions(req, res);

        expect(utils.verifyAuthAdmin).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            error: "body does not contain all the necessary attributes"
        });
    });

    test("U3 : Should return an error indicating that the IDs are not valid", async () => {
        // mock request
        req = {
            params: {
                username: "dummy_user_1",
            },
            body: {
                _ids: ["", "dummy_id_2"]
            }
        }

        jest.spyOn(utils, "verifyAuthAdmin").mockReturnValue({
            authorized: true,
            cause: "authorized"
        });

        // call function under test
        await deleteTransactions(req, res);

        expect(utils.verifyAuthAdmin).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            error: "input _ids are not valid"
        });
    });

    test("U4 : Should return an error indicating that some of the IDs are not found", async () => {
        // mock request
        req = {
            params: {
                username: "dummy_user_1",
            },
            body: {
                _ids: ["dummy_id_1", "dummy_id_2", "dummy_id_3"]
            }
        }

        jest.spyOn(utils, "verifyAuthAdmin").mockReturnValue({
            authorized: true,
            cause: "authorized"
        });

        jest.spyOn(transactions, "find").mockResolvedValue([{ _id: "dummy_id_1" }]);

        // call function under test
        await deleteTransactions(req, res);

        expect(utils.verifyAuthAdmin).toHaveBeenCalled();
        expect(transactions.find).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            error: "the following transactions don't exist : dummy_id_2,dummy_id_3"
        });
    });


    test("U5 : Should return an error indicating that all of the IDs are not found", async () => {
        // mock request
        req = {
            params: {
                username: "dummy_user_1",
            },
            body: {
                _ids: ["dummy_id_1", "dummy_id_2", "dummy_id_3"]
            }
        }

        jest.spyOn(utils, "verifyAuthAdmin").mockReturnValue({
            authorized: true,
            cause: "authorized"
        });

        jest.spyOn(transactions, "find").mockResolvedValue([]);

        // call function under test
        await deleteTransactions(req, res);

        expect(utils.verifyAuthAdmin).toHaveBeenCalled();
        expect(transactions.find).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            error: "the following transactions don't exist : dummy_id_1,dummy_id_2,dummy_id_3"
        });
    });

    test("U6 : Should return a message indicating that the transactions were deleted", async () => {
        // mock request
        req = {
            params: {
                username: "dummy_user_1",
            },
            body: {
                _ids: ["dummy_id_1", "dummy_id_2", "dummy_id_3"]
            }
        }

        jest.spyOn(utils, "verifyAuthAdmin").mockReturnValue({
            authorized: true,
            cause: "authorized"
        });

        jest.spyOn(transactions, "find").mockResolvedValue([
            { _id: "dummy_id_1" },
            { _id: "dummy_id_2" },
            { _id: "dummy_id_3" }
        ]);

        jest.spyOn(transactions, "deleteMany").mockResolvedValue({
            deletedCount: 3
        });

        // call function under test
        await deleteTransactions(req, res);

        expect(utils.verifyAuthAdmin).toHaveBeenCalled();
        expect(transactions.find).toHaveBeenCalled();
        expect(transactions.deleteMany).toHaveBeenCalledWith({
            _id: { $in: ["dummy_id_1", "dummy_id_2", "dummy_id_3"] }
        });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            data: {
                message: "Transactions deleted"
            },
            refreshedTokenMessage: "dummy message"
        });
    });

    test("U7 : Should return an error caused by an exception", async () => {

        // mock request
        req = {
            params: {
                username: "dummy_user_1",
            },
            body: {
                id: "dummy_id"
            }
        }

        jest.spyOn(utils, "verifyAuthAdmin").mockImplementation(() => {
            throw new Error('dummy exception');
        });

        // call function under test
        await deleteTransactions(req, res);

        expect(utils.verifyAuthAdmin).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            error: "dummy exception"
        });
    });
})
