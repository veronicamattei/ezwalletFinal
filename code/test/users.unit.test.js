import request from 'supertest';
import { app } from '../app';
import { Group, User } from '../models/User.js';
import { transactions } from '../models/model.js';
import * as utils from '../controllers/utils';
import * as users from '../controllers/users';
import jwt from 'jsonwebtoken';
import { getGroups, getUser, getUsers, createGroup, getGroup, deleteUser, deleteGroup, addToGroup, removeFromGroup } from '../controllers/users';
import { TokenExpiredError } from 'jsonwebtoken';
import { createCategory } from '../controllers/controller';

/**
 * In order to correctly mock the calls to external modules it is necessary to mock them using the following line.
 * Without this operation, it is not possible to replace the actual implementation of the external functions with the one
 * needed for the test cases.
 * `jest.mock()` must be called for every external module that is called in the functions under test.
 */
jest.mock('../models/User.js');
jest.mock('../models/model.js');

beforeEach(() => {
  jest.clearAllMocks();
  jest.resetAllMocks();
});


/**
 * Defines code to be executed before each test case is launched
 * In this case the mock implementation of `User.find()` is cleared, allowing the definition of a new mock implementation.
 * Not doing this `mockClear()` means that test cases may use a mock implementation intended for other test cases.
 */

describe("getUsers", () => {
  let mockReq, mockResp;

  beforeEach(

	() => {

	  mockReq = {};
	  mockResp = {
		status: jest.fn(() => mockResp),
		json: jest.fn(),
		locals: {
		  refreshTokenMessage: "dummy message"
		}
	  }
	}
  );
  afterEach(() => {
	jest.clearAllMocks();
	
  })


  test("U1:no users -> return 200 and empty list", async () => {
	//any time the `User.find()` method is called jest will replace its actual implementation with the one defined below
	//sverifyAuthAdmin.mockImplementation(()=>({ authorized: false, cause: "Unauthorized"}))

	jest.spyOn(utils, "verifyAuthAdmin").mockImplementation(() => (
	  {
		authorized: true,
		cause: "Authorized"
	  }
	));
	jest.spyOn(User, "find").mockImplementation(() => []);
	await getUsers(mockReq, mockResp);

	expect(mockResp.status).toHaveBeenCalledWith(200)
	const jsonResp = mockResp.json.mock.calls[0][0];
	expect(jsonResp.data).toEqual([])

  })

  test("U2: at least one user exists -> return 200 and list of retrieved users", async () => {
    const retrievedUsers = [{ username: 'test1', email: 'test1@example.com', password: 'hashedPassword1', role: 'Regular' }, { username: 'test2', email: 'test2@example.com', password: 'hashedPassword2', role: 'Regular' }]
    jest.spyOn(utils, "verifyAuthAdmin").mockImplementation(() => (
      {
        authorized: true,
        cause: "Authorized"
      }
    ))
    jest.spyOn(User, "find").mockImplementation(() => [...retrievedUsers]);

    await getUsers(mockReq, mockResp);
    expect(mockResp.status).toHaveBeenCalledWith(200);
    expect(mockResp.json.mock.calls[0][0].data).toEqual(retrievedUsers.map( user => { return {username: user.username, email: user.email, role: user.role} }));
    expect(mockResp.locals).toEqual({ refreshTokenMessage: "dummy message" });
  })

  test("U3:not authentified -> return 401", async () => {
	//any time the `User.find()` method is called jest will replace its actual implementation with the one defined below
	jest.spyOn(utils, "verifyAuthAdmin").mockImplementation(() => (
	  {
		authorized: false,
		cause: "Unauthorized"
	  }
	))
	await getUsers(mockReq, mockResp);

	expect(mockResp.status).toHaveBeenCalledWith(401);
  })

  test("U4: Network error -> return 500", async () => {
	jest.spyOn(utils, "verifyAuthAdmin").mockImplementation(() => (
	  {
		authorized: true,
		cause: "Authorized"
	  }
	));
	jest.spyOn(User, "find").mockImplementation(() => { throw new Error('server crash') });

	await getUsers(mockReq, mockResp);

	expect(mockResp.status).toHaveBeenCalledWith(500);
	expect(mockResp.json).toHaveBeenCalledWith({ error: 'server crash' });
  })





})
describe("getUser", () => {
  let mockReq, mockResp;

  beforeEach(
	() => {
	  mockReq = {
		params: {
		  username: 'user',
		},
		cookies: {}
	  };
	  mockResp = {
		status: jest.fn(() => mockResp),
		json: jest.fn(),
		locals: {
		  refreshTokenMessage: "dummy message"
		}
	  };

	}
  )

  afterEach(() => {
	jest.clearAllMocks();
	jest.resetAllMocks();
  })


  test('U1: user exists -> return 200 and user info', async () => {
    const user = {
      username: 'user',
      email: 'test@example.com',
      role: 'role',
      refreshToken: 'refreshToken'
    }
    jest.spyOn(User, "findOne").mockImplementation(() => user);
    jest.spyOn(utils, "verifyAuthAdmin").mockImplementation(() => (
      {
        authorized: true,
        cause: "Authorized"
      }
    ))
    jest.spyOn(utils, "verifyAuthUser").mockImplementation(() => (
      {
        authorized: true,
        cause: "Authorized"
      }
    ))
    await getUser(mockReq, mockResp);
    expect(mockResp.status).toHaveBeenCalledWith(200);
    const jsonResp = mockResp.json.mock.calls[0][0];
    expect(mockResp.json).toHaveBeenCalledWith({
      data: { username: user.username, email: user.email, role: user.role },
      refreshTokenMessage: mockResp.locals.refreshTokenMessage,
    });


  })

  test('U2: user not found -> return 400 and message: user not found', async () => {
	jest.spyOn(User, "findOne").mockImplementation(() => null);
	// jest.spyOn(utils, "verifyAuthAdmin").mockImplementation(()=>(
	//   {authorized: true,
	//     cause:"Authorized"
	//   }
	// ))
	 jest.spyOn(utils, "verifyAuthUser").mockImplementation(()=>(
	   {authorized: true,
	     cause:"Authorized"
	   }
	 ))
	// jest.spyOn(User, "findOne").mockImplementation(()=> null);

	await getUser(mockReq, mockResp);
	expect(mockResp.status).toHaveBeenCalledWith(400);
	expect(mockResp.json.mock.calls[0][0].error).toBe('user not found')
  })

  test('U3: not authorized -> return 401 and message: unauthorized', async () => {
	jest.spyOn(User, "findOne").mockImplementation(() => user);

	const user = {
	  username: 'differentUser',
	  email: 'test@example.com',
	  role: 'role',
	  refreshToken: 'refreshToken'

	}
	jest.spyOn(utils, "verifyAuthAdmin").mockImplementation(() => (
	  {
		authorized: false,
		cause: "Unauthorized"
	  }
	))
	jest.spyOn(utils, "verifyAuthUser").mockImplementation(() => (
	  {
		authorized: false,
		cause: "Unauthorized"
	  }
	))
	await getUser(mockReq, mockResp);
	expect(mockResp.status).toHaveBeenCalledWith(401);
	expect(mockResp.json.mock.calls[0][0].error).toBe('not authorized');

  })


  // test("T4:not authentified -> return 401", async () => {
  //   //any time the `User.find()` method is called jest will replace its actual implementation with the one defined below
  //   jest.spyOn(utils, "verifyAuthAdmin").mockImplementation(()=>(
  //     {authorized: false,
  //       cause:"Unauthorized"
  //     }
  //   ))  
  //   await getUser(mockReq, mockResp);

  //   expect(mockResp.status).toHaveBeenCalledWith(401);
  // })



  test("U4: Network error -> return 500", async () => {
	jest.spyOn(User, "findOne").mockImplementation(() => { throw new Error('server crash') });
	jest.spyOn(utils, "verifyAuthAdmin").mockImplementation(() => (
	  {
		authorized: true,
		cause: "Authorized"
	  }
	))
	jest.spyOn(utils, "verifyAuthUser").mockImplementation(() => (
	  {
		authorized: true,
		cause: "Authorized"
	  }
	))

	await getUser(mockReq, mockResp);

	expect(mockResp.status).toHaveBeenCalledWith(500);
	expect(mockResp.json).toHaveBeenCalledWith({ error: 'server crash' });
  })



})

describe("createGroup", () => {

  afterEach(() => {
	jest.clearAllMocks();
  })
  beforeEach(() => jest.resetAllMocks())


  test('U1: not authentified -> return 401', async () => {
	const mockReq = {
	  cookies: {
		accessToken: 'accessToken',
		refreshToken: 'refreshToken'
	  },
	  body: {
		name: 'groupTest',
		memberEmails: [
		  'mail1',
		  'mail2',
		  'mail3'
		]
	  }
	}
	const mockRes = {
	  status: jest.fn().mockReturnThis(),
	  json: jest.fn()
	}
	const expectedRespone = { authorized: false, cause: 'Unauthorized' }
	jest.spyOn(utils, "verifyAuthSimple").mockImplementation(() => expectedRespone)

	await createGroup(mockReq, mockRes);

	expect(mockRes.status).toHaveBeenCalledWith(401);
  });

  test('U2: create group -> retun 200', async () => {
	const mockReq = {
	  cookies: {
		accessToken: 'accessToken',
		refreshToken: 'refreshToken'
	  },
	  body: {
		name: 'groupTest',
		memberEmails: [
		  'tester@mail.com',
		  'mail1@mail.com',
		  'mail2@mail.com',
		  'mail3@mail.com'
		]
	  }
	}
	const mockRes = {
	  locals: {
		refreshedTokenMessage: "dummy message"
	  },
	  status: jest.fn().mockReturnThis(),
	  json: jest.fn()
	}
	// authorized
	const expectedResponeAuth = { authorized: true, cause: 'authorized' }
	jest.spyOn(utils, "verifyAuthSimple").mockImplementation(() => expectedResponeAuth);

	const myUserInfo = {
	  username: 'tester',
	  email: 'tester@mail.com',
	  role: 'Regular',
	  _id: 123
	}

	// user's email found
	jest.spyOn(User, "findOne").mockResolvedValueOnce(myUserInfo);

	// group name does not exist
	jest.spyOn(Group, "findOne").mockResolvedValueOnce(null);

	// user is not already in group
	jest.spyOn(Group, "findOne").mockResolvedValueOnce(null);

	const fakeData = [
	  myUserInfo,
	  {
		username: 'mail1',
		email: 'mail1@mail.com',
		role: 'Regular',
		_id: 456
	  }, {
		username: 'mail2',
		email: 'mail2@mail.com',
		role: 'Regular',
		_id: 789
	  }, {
		username: 'mail3',
		email: 'mail3@mail.com',
		role: 'Regular',
		_id: 100
	  }
	]

	// user is found by email and then we look for a group he is part of
	jest.spyOn(User, "findOne").mockResolvedValueOnce(fakeData[0])  //found

	jest.spyOn(Group, "findOne").mockResolvedValueOnce(null)        // no group

	jest.spyOn(User, "findOne").mockResolvedValueOnce(fakeData[1])  //found

	jest.spyOn(Group, "findOne").mockResolvedValueOnce(null)        // no group

	jest.spyOn(User, "findOne").mockResolvedValueOnce(fakeData[2])  //found

	jest.spyOn(Group, "findOne").mockResolvedValueOnce(null)        // no group

	jest.spyOn(User, "findOne").mockResolvedValueOnce(fakeData[3])  //found

	jest.spyOn(Group, "findOne").mockResolvedValueOnce(null)        // no group

	//  each email is registered ==> memberNotFound array is empty
	//  each member is free to join a new group ==> alreadyInGroup array is empty

	jest.spyOn(Group, 'create').mockImplementation(() => { })
	await createGroup(mockReq, mockRes);

	expect(mockRes.status).toHaveBeenCalledWith(200);
	expect(mockRes.json.mock.calls[0][0].data.membersNotFound).toEqual([])
	expect(mockRes.json.mock.calls[0][0].data.alreadyInGroup).toEqual([])
	expect(mockRes.json.mock.calls[0][0].data.group.name).toBe('groupTest')

	const expectedRespone = mockReq.body.memberEmails.map(email => {
	  return { email: email }
	})
	expect(mockRes.json.mock.calls[0][0].data.group.members).toEqual(expectedRespone)
  });

  test('U3: group name is not defined in the body', async () => {
	const mockReq = {
	  cookies: {
		accessToken: 'accessToken',
		refreshToken: 'refreshToken'
	  },
	  body: {
		memberEmails: [
		  'mail1',
		  'mail2',
		  'mail3'
		]
	  }
	}
	const mockRes = {
	  status: jest.fn().mockReturnThis(),
	  json: jest.fn()
	}
	const expectedRespone = { authorized: true, cause: 'authorized' }
	jest.spyOn(utils, "verifyAuthSimple").mockImplementation(() => expectedRespone)

	const myUserInfo = {
	  username: 'tester',
	  email: 'tester@mail.com',
	  role: 'Regular',
	  _id: 123
	}

	// user's email found
	jest.spyOn(User, "findOne").mockResolvedValueOnce(myUserInfo);

	// group name does not exist
	jest.spyOn(Group, "findOne").mockResolvedValueOnce(null);

	// user is not already in group
	jest.spyOn(Group, "findOne").mockResolvedValueOnce(null);

	// user is found by email
	jest.spyOn(User, "findOne").mockResolvedValueOnce(myUserInfo)

	// entered user already in a group
	jest.spyOn(Group, "findOne").mockResolvedValueOnce(null);

	jest.spyOn(Group, 'create').mockImplementation(() => { })
	await createGroup(mockReq, mockRes);

	expect(mockRes.status).toHaveBeenCalledWith(400);
	expect(mockRes.json).toBeDefined()
  });

  test('U4: email list is not defined in the body', async () => {
	const mockReq = {
	  cookies: {
		accessToken: 'accessToken',
		refreshToken: 'refreshToken'
	  },
	  body: {
		name: 'testGroup'
	  }
	}
	const mockRes = {
	  status: jest.fn().mockReturnThis(),
	  json: jest.fn()
	}
	const expectedRespone = { authorized: true, cause: 'authorized' }
	jest.spyOn(utils, "verifyAuthSimple").mockImplementation(() => expectedRespone)

	const myUserInfo = {
	  username: 'tester',
	  email: 'tester@mail.com',
	  role: 'Regular',
	  _id: 123
	}

	// user's email found
	jest.spyOn(User, "findOne").mockResolvedValueOnce(myUserInfo);

	// group name does not exist
	jest.spyOn(Group, "findOne").mockResolvedValueOnce(null);

	// user is not already in group
	jest.spyOn(Group, "findOne").mockResolvedValueOnce(null);

	// user is found by email
	jest.spyOn(User, "findOne").mockResolvedValueOnce(myUserInfo)

	// entered user already in a group
	jest.spyOn(Group, "findOne").mockResolvedValueOnce(null);

	jest.spyOn(Group, 'create').mockImplementation(() => { })
	await createGroup(mockReq, mockRes);

	expect(mockRes.status).toHaveBeenCalledWith(400);
	expect(mockRes.json).toBeDefined()
  });

  test('U5: group name is empty', async () => {
	const mockReq = {
	  cookies: {
		accessToken: 'accessToken',
		refreshToken: 'refreshToken'
	  },
	  body: {
		name: '',
		memberEmails: [
		  'mail1',
		  'mail2',
		  'mail3'
		]
	  }
	}
	const mockRes = {
	  status: jest.fn().mockReturnThis(),
	  json: jest.fn()
	}
	const expectedRespone = { authorized: true, cause: 'authorized' }
	jest.spyOn(utils, "verifyAuthSimple").mockImplementation(() => expectedRespone)

	const myUserInfo = {
	  username: 'tester',
	  email: 'tester@mail.com',
	  role: 'Regular',
	  _id: 123
	}

	// user's email found
	jest.spyOn(User, "findOne").mockResolvedValueOnce(myUserInfo);

	// group name does not exist
	jest.spyOn(Group, "findOne").mockResolvedValueOnce(null);

	// user is not already in group
	jest.spyOn(Group, "findOne").mockResolvedValueOnce(null);

	// user is found by email
	jest.spyOn(User, "findOne").mockResolvedValueOnce(myUserInfo)

	// entered user already in a group
	jest.spyOn(Group, "findOne").mockResolvedValueOnce(null);

	jest.spyOn(Group, 'create').mockImplementation(() => { })
	await createGroup(mockReq, mockRes);

	expect(mockRes.status).toHaveBeenCalledWith(400);
	expect(mockRes.json).toBeDefined()
  });

  test('U6: email is not valid according to pattern', async () => {
	const mockReq = {
	  cookies: {
		accessToken: 'accessToken',
		refreshToken: 'refreshToken'
	  },
	  body: {
		name: 'testGroup',
		memberEmails: [
		  'mail1',
		  'mail2',
		  'mail3'
		]
	  }
	}
	const mockRes = {
	  status: jest.fn().mockReturnThis(),
	  json: jest.fn()
	}
	const expectedRespone = { authorized: true, cause: 'authorized' }
	jest.spyOn(utils, "verifyAuthSimple").mockImplementation(() => expectedRespone)

	const myUserInfo = {
	  username: 'tester',
	  email: 'tester@mail.com',
	  role: 'Regular',
	  _id: 123
	}

	// user's email found
	jest.spyOn(User, "findOne").mockResolvedValueOnce(myUserInfo);

	// group name does not exist
	jest.spyOn(Group, "findOne").mockResolvedValueOnce(null);

	// user is not already in group
	jest.spyOn(Group, "findOne").mockResolvedValueOnce(null);

	// user is found by email
	jest.spyOn(User, "findOne").mockResolvedValueOnce(myUserInfo)

	// entered user already in a group
	jest.spyOn(Group, "findOne").mockResolvedValueOnce(null);

	jest.spyOn(Group, 'create').mockImplementation(() => { })
	await createGroup(mockReq, mockRes);


	expect(mockRes.status).toHaveBeenCalledWith(400);
	expect(mockRes.json).toBeDefined()
  });

  test('U7: email is empty', async () => {
	const mockReq = {
	  cookies: {
		accessToken: 'accessToken',
		refreshToken: 'refreshToken'
	  },
	  body: {
		name: 'testGroup',
		memberEmails: [
		  ''
		]
	  }
	}
	const mockRes = {
	  status: jest.fn().mockReturnThis(),
	  json: jest.fn()
	}
	const expectedRespone = { authorized: true, cause: 'authorized' }
	jest.spyOn(utils, "verifyAuthSimple").mockImplementation(() => expectedRespone)

	const myUserInfo = {
	  username: 'tester',
	  email: 'tester@mail.com',
	  role: 'Regular',
	  _id: 123
	}

	// user's email found
	jest.spyOn(User, "findOne").mockResolvedValueOnce(myUserInfo);

	// group name does not exist
	jest.spyOn(Group, "findOne").mockResolvedValueOnce(null);

	// user is not already in group
	jest.spyOn(Group, "findOne").mockResolvedValueOnce(null);

	// user is found by email
	jest.spyOn(User, "findOne").mockResolvedValueOnce(myUserInfo)

	// entered user already in a group
	jest.spyOn(Group, "findOne").mockResolvedValueOnce(null);

	jest.spyOn(Group, 'create').mockImplementation(() => { })
	await createGroup(mockReq, mockRes);

	expect(mockRes.status).toHaveBeenCalledWith(400);
	expect(mockRes.json).toBeDefined()
  });

  test('U8: group name is not unique', async () => {
	const mockReq = {
	  cookies: {
		accessToken: 'accessToken',
		refreshToken: 'refreshToken'
	  },
	  body: {
		name: 'testGroup',
		memberEmails: [
		  ''
		]
	  }
	}
	const mockRes = {
	  status: jest.fn().mockReturnThis(),
	  json: jest.fn()
	}
	const expectedRespone = { authorized: true, cause: 'authorized' }
	jest.spyOn(utils, "verifyAuthSimple").mockImplementation(() => expectedRespone)

	const myUserInfo = {
	  username: 'tester',
	  email: 'tester@mail.com',
	  role: 'Regular',
	  _id: 123
	}

	// user's email found
	jest.spyOn(User, "findOne").mockResolvedValueOnce(myUserInfo);

	// group name does exist
	jest.spyOn(Group, "findOne").mockResolvedValueOnce({ name: 'groupFound', members: [{ email: 'user1', id: 123 }] });

	// user is not already in group
	jest.spyOn(Group, "findOne").mockResolvedValueOnce(null);

	// user is found by email
	jest.spyOn(User, "findOne").mockResolvedValueOnce(myUserInfo)

	// entered user already in a group
	jest.spyOn(Group, "findOne").mockResolvedValueOnce(null);

	jest.spyOn(Group, 'create').mockImplementation(() => { })
	await createGroup(mockReq, mockRes);

	expect(mockRes.status).toHaveBeenCalledWith(400);
	expect(mockRes.json).toBeDefined()
  });

  test('U9: user is registered into another group', async () => {
	const mockReq = {
	  cookies: {
		accessToken: 'accessToken',
		refreshToken: 'refreshToken'
	  },
	  body: {
		name: 'testGroup',
		memberEmails: [
		  ''
		]
	  }
	}
	const mockRes = {
	  status: jest.fn().mockReturnThis(),
	  json: jest.fn()
	}
	const expectedRespone = { authorized: true, cause: 'authorized' }
	jest.spyOn(utils, "verifyAuthSimple").mockImplementation(() => expectedRespone)

	const myUserInfo = {
	  username: 'tester',
	  email: 'tester@mail.com',
	  role: 'Regular',
	  _id: 123
	}

	// user's email found
	jest.spyOn(User, "findOne").mockResolvedValueOnce(myUserInfo);

	// group name does exist
	jest.spyOn(Group, "findOne").mockResolvedValueOnce(null);

	// user is already in group
	jest.spyOn(Group, "findOne").mockResolvedValueOnce(myUserInfo);

	// user is found by email
	jest.spyOn(User, "findOne").mockResolvedValueOnce(myUserInfo)

	// entered user already in a group
	jest.spyOn(Group, "findOne").mockResolvedValueOnce(null);

	jest.spyOn(Group, 'create').mockImplementation(() => { })
	await createGroup(mockReq, mockRes);

	expect(mockRes.status).toHaveBeenCalledWith(400);
	expect(mockRes.json).toBeDefined()
  });

  test('U10: create group but an email is not registered -> retun 200', async () => {
	const mockReq = {
	  cookies: {
		accessToken: 'accessToken',
		refreshToken: 'refreshToken'
	  },
	  body: {
		name: 'groupTest',
		memberEmails: [
		  'tester@mail.com',
		  'mail1@mail.com',
		  'mail2@mail.com',
		  'mailIsNotRegistered@mail.com'
		]
	  }
	}
	const mockRes = {
	  locals: {
		refreshedTokenMessage: "dummy message"
	  },
	  status: jest.fn().mockReturnThis(),
	  json: jest.fn()
	}
	// authorized
	const expectedResponeAuth = { authorized: true, cause: 'authorized' }
	jest.spyOn(utils, "verifyAuthSimple").mockImplementation(() => expectedResponeAuth);

	const myUserInfo = {
	  username: 'tester',
	  email: 'tester@mail.com',
	  role: 'Regular',
	  _id: 123
	}

	// user's email found
	jest.spyOn(User, "findOne").mockResolvedValueOnce(myUserInfo);

	// group name does not exist
	jest.spyOn(Group, "findOne").mockResolvedValueOnce(null);

	// user is not already in group
	jest.spyOn(Group, "findOne").mockResolvedValueOnce(null);

	const fakeData = [
	  myUserInfo,
	  {
		username: 'mail1',
		email: 'mail1@mail.com',
		role: 'Regular',
		_id: 456
	  }, {
		username: 'mail2',
		email: 'mail2@mail.com',
		role: 'Regular',
		_id: 789
	  }
	]

	// user is found by email and then we look for a group he is part of
	jest.spyOn(User, "findOne").mockResolvedValueOnce(fakeData[0])  // found

	jest.spyOn(Group, "findOne").mockResolvedValueOnce(null)        // no group

	jest.spyOn(User, "findOne").mockResolvedValueOnce(fakeData[1])  // found

	jest.spyOn(Group, "findOne").mockResolvedValueOnce(null)        // no group

	jest.spyOn(User, "findOne").mockResolvedValueOnce(fakeData[2])  // found

	jest.spyOn(Group, "findOne").mockResolvedValueOnce(null)        // no group

	jest.spyOn(User, "findOne").mockResolvedValueOnce(null)  // NOT found

	jest.spyOn(Group, "findOne").mockResolvedValueOnce(null)        // no group

	//  each email is registered ==> memberNotFound array is empty
	//  each member is free to join a new group ==> alreadyInGroup array is empty

	jest.spyOn(Group, 'create').mockImplementation(() => { })
	await createGroup(mockReq, mockRes);

	expect(mockRes.status).toHaveBeenCalledWith(200);
	expect(mockRes.json.mock.calls[0][0].data.membersNotFound).toEqual(['mailIsNotRegistered@mail.com'])
	expect(mockRes.json.mock.calls[0][0].data.alreadyInGroup).toEqual([])
	expect(mockRes.json.mock.calls[0][0].data.group.name).toBe('groupTest')

	mockReq.body.memberEmails.pop()
	const expectedRespone = mockReq.body.memberEmails.map(email => {
	  return { email: email }
	})
	expect(mockRes.json.mock.calls[0][0].data.group.members).toEqual(expectedRespone)
  });

  test('U11: create group but an email is already in group -> retun 200', async () => {
	const mockReq = {
	  cookies: {
		accessToken: 'accessToken',
		refreshToken: 'refreshToken'
	  },
	  body: {
		name: 'groupTest',
		memberEmails: [
		  'tester@mail.com',
		  'mail1@mail.com',
		  'mail2@mail.com',
		  'alreadyInGroup@mail.com'
		]
	  }
	}
	const mockRes = {
	  locals: {
		refreshedTokenMessage: "dummy message"
	  },
	  status: jest.fn().mockReturnThis(),
	  json: jest.fn()
	}
	// authorized
	const expectedResponeAuth = { authorized: true, cause: 'authorized' }
	jest.spyOn(utils, "verifyAuthSimple").mockImplementation(() => expectedResponeAuth);

	const myUserInfo = {
	  username: 'tester',
	  email: 'tester@mail.com',
	  role: 'Regular',
	  _id: 123
	}

	// user's email found
	jest.spyOn(User, "findOne").mockResolvedValueOnce(myUserInfo);

	// group name does not exist
	jest.spyOn(Group, "findOne").mockResolvedValueOnce(null);

	// user is not already in group
	jest.spyOn(Group, "findOne").mockResolvedValueOnce(null);

	const fakeData = [
	  myUserInfo,
	  {
		username: 'mail1',
		email: 'mail1@mail.com',
		role: 'Regular',
		_id: 456
	  }, {
		username: 'mail2',
		email: 'mail2@mail.com',
		role: 'Regular',
		_id: 789
	  }, {
		username: 'alreadyInGroup',
		email: 'alreadyInGroup@mail.com',
		role: 'Regular',
		_id: 789
	  }
	]

	// user is found by email and then we look for a group he is part of
	jest.spyOn(User, "findOne").mockResolvedValueOnce(fakeData[0])  // found

	jest.spyOn(Group, "findOne").mockResolvedValueOnce(null)        // no group

	jest.spyOn(User, "findOne").mockResolvedValueOnce(fakeData[1])  // found

	jest.spyOn(Group, "findOne").mockResolvedValueOnce(null)        // no group

	jest.spyOn(User, "findOne").mockResolvedValueOnce(fakeData[2])  // found

	jest.spyOn(Group, "findOne").mockResolvedValueOnce(null)        // no group

	jest.spyOn(User, "findOne").mockResolvedValueOnce(fakeData[3])  // NOT found

	jest.spyOn(Group, "findOne").mockResolvedValueOnce(true)        // no group

	//  each email is registered ==> memberNotFound array is empty
	//  each member is free to join a new group ==> alreadyInGroup array is empty

	jest.spyOn(Group, 'create').mockImplementation(() => { })
	await createGroup(mockReq, mockRes);

	expect(mockRes.status).toHaveBeenCalledWith(200);
	expect(mockRes.json.mock.calls[0][0].data.membersNotFound).toEqual([])
	expect(mockRes.json.mock.calls[0][0].data.alreadyInGroup).toEqual(['alreadyInGroup@mail.com'])
	expect(mockRes.json.mock.calls[0][0].data.group.name).toBe('groupTest')

	mockReq.body.memberEmails.pop()
	const expectedRespone = mockReq.body.memberEmails.map(email => {
	  return { email: email }
	})
	expect(mockRes.json.mock.calls[0][0].data.group.members).toEqual(expectedRespone)
  });

  test('U12: create group but caller email is not provided (it should be added) -> retun 200', async () => {
	const mockReq = {
	  cookies: {
		accessToken: 'accessToken',
		refreshToken: 'refreshToken'
	  },
	  body: {
		name: 'groupTest',
		memberEmails: [
		  'mail1@mail.com',
		  'mail2@mail.com',
		  'alreadyInGroup@mail.com'
		]
	  }
	}
	const mockRes = {
	  locals: {
		refreshedTokenMessage: "dummy message"
	  },
	  status: jest.fn().mockReturnThis(),
	  json: jest.fn()
	}
	// authorized
	const expectedResponeAuth = { authorized: true, cause: 'authorized' }
	jest.spyOn(utils, "verifyAuthSimple").mockImplementation(() => expectedResponeAuth);

	const myUserInfo = {
	  username: 'tester',
	  email: 'tester@mail.com',
	  role: 'Regular',
	  _id: 123
	}

	// user's email found
	jest.spyOn(User, "findOne").mockResolvedValueOnce(myUserInfo);

	// group name does not exist
	jest.spyOn(Group, "findOne").mockResolvedValueOnce(null);

	// user is not already in group
	jest.spyOn(Group, "findOne").mockResolvedValueOnce(null);

	const fakeData = [
	  {
		username: 'mail1',
		email: 'mail1@mail.com',
		role: 'Regular',
		_id: 456
	  }, {
		username: 'mail2',
		email: 'mail2@mail.com',
		role: 'Regular',
		_id: 789
	  }, {
		username: 'alreadyInGroup',
		email: 'alreadyInGroup@mail.com',
		role: 'Regular',
		_id: 789
	  },
	  myUserInfo
	]

	// user is found by email and then we look for a group he is part of
	jest.spyOn(User, "findOne").mockResolvedValueOnce(fakeData[0])  // found

	jest.spyOn(Group, "findOne").mockResolvedValueOnce(null)        // no group

	jest.spyOn(User, "findOne").mockResolvedValueOnce(fakeData[1])  // found

	jest.spyOn(Group, "findOne").mockResolvedValueOnce(null)        // no group

	jest.spyOn(User, "findOne").mockResolvedValueOnce(fakeData[2])  // found

	jest.spyOn(Group, "findOne").mockResolvedValueOnce(true)        // no group

	jest.spyOn(User, "findOne").mockResolvedValueOnce(fakeData[3])  // found

	jest.spyOn(Group, "findOne").mockResolvedValueOnce(null)        // no group

	//  each email is registered ==> memberNotFound array is empty
	//  each member is free to join a new group ==> alreadyInGroup array is empty

	jest.spyOn(Group, 'create').mockImplementation(() => { })
	await createGroup(mockReq, mockRes);

	expect(mockRes.status).toHaveBeenCalledWith(200);
	expect(mockRes.json.mock.calls[0][0].data.membersNotFound).toEqual([])
	expect(mockRes.json.mock.calls[0][0].data.alreadyInGroup).toEqual(['alreadyInGroup@mail.com'])
	expect(mockRes.json.mock.calls[0][0].data.group.name).toBe('groupTest')

	const expectedMembersList = [
	  'mail1@mail.com',
	  'mail2@mail.com',
	  'tester@mail.com'
	]
	const expectedRespone = expectedMembersList.map(email => {
	  return { email: email }
	})
	expect(mockRes.json.mock.calls[0][0].data.group.members).toEqual(expectedRespone)
  });

  test('U13: create group but all emails do not exist -> retun 400', async () => {
	const mockReq = {
	  cookies: {
		accessToken: 'accessToken',
		refreshToken: 'refreshToken'
	  },
	  body: {
		name: 'groupTest',
		memberEmails: [
		  'mail1@mail.com',
		  'mail2@mail.com',
		  'alreadyInGroup@mail.com'
		]
	  }
	}
	const mockRes = {
	  locals: {
		refreshedTokenMessage: "dummy message"
	  },
	  status: jest.fn().mockReturnThis(),
	  json: jest.fn()
	}
	// authorized
	const expectedResponeAuth = { authorized: true, cause: 'authorized' }
	jest.spyOn(utils, "verifyAuthSimple").mockImplementation(() => expectedResponeAuth);

	const myUserInfo = {
	  username: 'tester',
	  email: 'tester@mail.com',
	  role: 'Regular',
	  _id: 123
	}

	// user's email found
	jest.spyOn(User, "findOne").mockResolvedValueOnce(myUserInfo);

	// group name does not exist
	jest.spyOn(Group, "findOne").mockResolvedValueOnce(null);

	// user is not already in group
	jest.spyOn(Group, "findOne").mockResolvedValueOnce(null);

	const fakeData = [
	  {
		username: 'mail1',
		email: 'mail1@mail.com',
		role: 'Regular',
		_id: 456
	  }, {
		username: 'mail2',
		email: 'mail2@mail.com',
		role: 'Regular',
		_id: 789
	  }, {
		username: 'alreadyInGroup',
		email: 'alreadyInGroup@mail.com',
		role: 'Regular',
		_id: 789
	  },
	  myUserInfo
	]

	// user is found by email and then we look for a group he is part of
	jest.spyOn(User, "findOne").mockResolvedValueOnce(null)  // NOT found


	jest.spyOn(User, "findOne").mockResolvedValueOnce(null)  // NOT found


	jest.spyOn(User, "findOne").mockResolvedValueOnce(null)  // NOT found


	jest.spyOn(User, "findOne").mockResolvedValueOnce(fakeData[3])  // NOT found

	jest.spyOn(Group, "findOne").mockResolvedValueOnce(null) // no group

	//  each email is registered ==> memberNotFound array is empty
	//  each member is free to join a new group ==> alreadyInGroup array is empty

	jest.spyOn(Group, 'create').mockImplementation(() => { })
	await createGroup(mockReq, mockRes);

	expect(mockRes.status).toHaveBeenCalledWith(400);
  });
  test("U14: Network error -> return 500", async () => {
	const mockReq = {
	  cookies: {
		accessToken: 'accessToken',
		refreshToken: 'refreshToken'
	  },
	  body: {
		name: 'groupTest',
		memberEmails: [
		  'mail1@mail.com',
		  'mail2@mail.com',
		  'alreadyInGroup@mail.com'
		]
	  }
	}
	const mockRes = {
	  locals: {
		refreshedTokenMessage: "dummy message"
	  },
	  status: jest.fn().mockReturnThis(),
	  json: jest.fn()
	}
	// authorized
	const expectedResponeAuth = { authorized: true, cause: 'authorized' }
	jest.spyOn(utils, "verifyAuthSimple").mockImplementation(() => expectedResponeAuth);

	const myUserInfo = {
	  username: 'tester',
	  email: 'tester@mail.com',
	  role: 'Regular',
	  _id: 123
	}

	// user's email found
	jest.spyOn(User, "findOne").mockImplementationOnce(()=> {throw new Error('server crash')});

	await createGroup(mockReq, mockRes);

	expect(mockRes.status).toHaveBeenCalledWith(500);
	expect(mockRes.json).toHaveBeenCalledWith({ error: 'server crash' });
  })
})


describe("getGroups", () => {

  let mockReq, mockResp;

  beforeEach(

	() => {

	  mockReq = {};
	  mockResp = {
		status: jest.fn(() => mockResp),
		json: jest.fn(),
		locals: {
		  refreshedTokenMessage: "dummy message"
		}
	  }


	}
  );
  afterEach(() => {
	
	jest.resetAllMocks();
  })


  test("U1:no groups -> return 200 and empty list", async () => {
	//any time the `User.find()` method is called jest will replace its actual implementation with the one defined below
	//sverifyAuthAdmin.mockImplementation(()=>({ authorized: false, cause: "Unauthorized"}))

	jest.spyOn(utils, "verifyAuthAdmin").mockImplementation(() => (
	  {
		authorized: true,
		cause: "Authorized"
	  }
	));
	jest.spyOn(utils, "verifyAuthGroup").mockImplementation(() => (
	  {
		authorized: true,
		cause: "Authorized"
	  }
	));
	jest.spyOn(Group, "find").mockImplementation(() => []);
	await getGroups(mockReq, mockResp);

	expect(mockResp.status).toHaveBeenCalledWith(200)
	const jsonResp = mockResp.json.mock.calls[0][0];
	expect(mockResp.json).toHaveBeenCalledWith({
	  data: [],
	  refreshedTokenMessage: mockResp.locals.refreshedTokenMessage,
	});


  })

  test("U2: at least one group exists -> return 200 and list of retrieved groups", async () => {
    const retrievedGroups = [{name: "Family", members: [{email: "mario.red@email.com", user: 123}, {email: "luigi.red@email.com", user: 123456}] }];
    jest.spyOn(utils, "verifyAuthAdmin").mockImplementation(() => (
      {
        authorized: true,
        cause: "Authorized"
      }
    ))
    jest.spyOn(utils, "verifyAuthGroup").mockImplementation(() => (
      {
        authorized: true,
        cause: "Authorized"
      }
    ))
    jest.spyOn(Group, "find").mockImplementation(() => retrievedGroups);

    await getGroups(mockReq, mockResp);
    const expectedRespone = 
      [
        {
          name: 'Family',
          members: [
            {email: "mario.red@email.com"},
            {email: "luigi.red@email.com"}
          ]
        }
      ]
    
    expect(mockResp.status).toHaveBeenCalledWith(200);
    expect(mockResp.json).toHaveBeenCalledWith({
      data: expectedRespone,
      refreshedTokenMessage: mockResp.locals.refreshedTokenMessage,
    });

  })

  test("U3:not authentified -> return 401", async () => {
	//any time the `User.find()` method is called jest will replace its actual implementation with the one defined below
	jest.spyOn(utils, "verifyAuthAdmin").mockImplementation(() => (
	  {
		authorized: false,
		cause: "Unauthorized"
	  }
	))
	jest.spyOn(utils, "verifyAuthGroup").mockImplementation(() => (
	  {
		authorized: false,
		cause: "Unauthorized"
	  }
	))
	await getGroups(mockReq, mockResp);

	expect(mockResp.status).toHaveBeenCalledWith(401);
  })

  test("U4: Network error -> return 500", async () => {
	jest.spyOn(utils, "verifyAuthAdmin").mockImplementation(() => (
	  {
		authorized: true,
		cause: "Authorized"
	  }
	));
	jest.spyOn(Group, "find").mockImplementation(() => { throw new Error('server crash') });

	await getGroups(mockReq, mockResp);

	expect(mockResp.status).toHaveBeenCalledWith(500);
	expect(mockResp.json).toHaveBeenCalledWith({ error: 'server crash' });
  })





})

describe("getGroup", () => {
  let mockReq, mockResp;
  beforeEach(
	() => {
	  jest.resetAllMocks();
	  mockReq = {
		params: {
		  name: 'group',
		},
		cookies: {}
	  };
	  mockResp = {
		status: jest.fn(() => mockResp),
		json: jest.fn(),
		locals: {
		  refreshedTokenMessage: "dummy message"
		}
	  };

	}
  )

  afterEach(() => {
	jest.clearAllMocks();
  })

  test('U1: get group -> return 200', async () => {
	const group_r =
	  { name: "Family", members: [{ email: "mario.red@email.com" }, { email: "luigi.red@email.com" }] };

	jest.spyOn(utils, "verifyAuthAdmin").mockImplementation(() => (
	  {
		authorized: true,
		cause: "Authorized"
	  }
	))
	jest.spyOn(utils, "verifyAuthGroup").mockImplementation(() => (
	  {
		authorized: true,
		cause: "Authorized"
	  }
	))


    jest.spyOn(Group, "findOne").mockResolvedValueOnce(group_r);
    await getGroup(mockReq, mockResp);
    expect(mockResp.status).toHaveBeenCalledWith(200);
    expect(mockResp.json).toHaveBeenCalledWith({ data: { group: group_r }, refreshedTokenMessage: mockResp.locals.refreshedTokenMessage  })

  })

  test('U2: group does not exist -> return 400', async () => {
	const group = '{name: "Family", members: [{email: "mario.red@email.com"}, {email: "luigi.red@email.com"}]}'
	jest.spyOn(utils, "verifyAuthAdmin").mockImplementation(() => (
	  {
		authorized: true,
		cause: "Authorized"
	  }
	))
	jest.spyOn(utils, "verifyAuthGroup").mockImplementation(() => (
	  {
		authorized: true,
		cause: "Authorized"
	  }
	))
	jest.spyOn(Group, "findOne").mockImplementationOnce(() => null);
	await getGroup(mockReq, mockResp);
	expect(mockResp.status).toHaveBeenCalledWith(400);
	expect(mockResp.json).toHaveBeenCalledWith({ error: "group does not exist" });


  })

  test('U3: User not authentified -> return 401', async () => {
	jest.spyOn(utils, "verifyAuthAdmin").mockImplementation(() => (
	  {
		authorized: false,
		cause: "Unauthorized"
	  }))
	jest.spyOn(utils, "verifyAuthGroup").mockImplementation(() => (
	  {
		authorized: false,
		cause: "Unauthorized"
	  }))
	await getGroup(mockReq, mockResp);
	expect(mockResp.status).toHaveBeenCalledWith(401);


  })

  test("U4: Network error -> return 500", async () => {
	jest.spyOn(utils, "verifyAuthAdmin").mockImplementation(() => (
	  {
		authorized: true,
		cause: "Authorized"
	  }
	))
	jest.spyOn(utils, "verifyAuthGroup").mockImplementation(() => (
	  {
		authorized: true,
		cause: "Authorized"
	  }
	))
	jest.spyOn(Group, "findOne").mockImplementationOnce(() => { throw new Error('server crash') });

	await getGroup(mockReq, mockResp);

	expect(mockResp.status).toHaveBeenCalledWith(500);
	expect(mockResp.json).toHaveBeenCalledWith({ error: 'server crash' });
  })


})

describe("addToGroup", () => {
  afterEach(() => {
	jest.clearAllMocks();
  })
  beforeEach(() => jest.resetAllMocks())

  test('U1: authentication as admin but the user is regular', async () => {
	const mockReq = {
	  cookies: {
		accessToken: 'accessToken',
		refreshToken: 'refreshToken'
	  },
	  params: {
		name: 'testGroup'
	  },
	  body: {
		emails: [
		  'mail1@mail.com',
		  'mail2@mail.com',
		  'mail3@mail.com'
		]
	  },
	  url: 'api/groups/testGroup/insert'
	}
	const mockRes = {
	  locals: {
		refreshedTokenMessage: "dummy message"
	  },
	  status: jest.fn().mockReturnThis(),
	  json: jest.fn()
	}
	const expectedResponeAuth = { authorized: false, cause: 'unauthorized' }
	jest.spyOn(utils, 'verifyAuthAdmin').mockImplementation(() => expectedResponeAuth)

	await addToGroup(mockReq, mockRes)

	expect(mockRes.status).toHaveBeenCalledWith(401)
  })

  test('U2: authentication as group but the user is not part of the group', async () => {
	const mockReq = {
	  cookies: {
		accessToken: 'accessToken',
		refreshToken: 'refreshToken'
	  },
	  params: {
		name: 'testGroup'
	  },
	  body: {
		emails: [
		  'mail1@mail.com',
		  'mail2@mail.com',
		  'mail3@mail.com'
		]
	  },
	  url: 'api/groups/testGroup/add'
	}
	const mockRes = {
	  locals: {
		refreshedTokenMessage: "dummy message"
	  },
	  status: jest.fn().mockReturnThis(),
	  json: jest.fn()
	}
	const expectedResponeAuth = { authorized: false, cause: 'unauthorized' }
	jest.spyOn(utils, 'verifyAuthGroup').mockImplementation(() => expectedResponeAuth)

	await addToGroup(mockReq, mockRes)

	expect(mockRes.status).toHaveBeenCalledWith(401)
  })

  test('U3: authentication as admin but there is a not valid email', async () => {
	const mockReq = {
	  cookies: {
		accessToken: 'accessToken',
		refreshToken: 'refreshToken'
	  },
	  params: {
		name: 'testGroup'
	  },
	  body: {
		emails: [
		  'mail1@mail.com',
		  'mail2@mail.com',
		  ''
		]
	  },
	  url: 'api/groups/testGroup/insert'
	}
	const mockRes = {
	  locals: {
		refreshedTokenMessage: "dummy message"
	  },
	  status: jest.fn().mockReturnThis(),
	  json: jest.fn()
	}
	const expectedResponeAuth = { authorized: true, cause: 'authorized' }
	jest.spyOn(utils, 'verifyAuthAdmin').mockImplementation(() => expectedResponeAuth)

	await addToGroup(mockReq, mockRes)

	expect(mockRes.status).toHaveBeenCalledWith(400)
  })

  test('U4: authentication as admin but there is ONLY a not valid email', async () => {
	const mockReq = {
	  cookies: {
		accessToken: 'accessToken',
		refreshToken: 'refreshToken'
	  },
	  params: {
		name: 'testGroup'
	  },
	  body: {
		emails: ''
	  },
	  url: 'api/groups/testGroup/insert'
	}
	const mockRes = {
	  locals: {
		refreshedTokenMessage: "dummy message"
	  },
	  status: jest.fn().mockReturnThis(),
	  json: jest.fn()
	}
	const expectedResponeAuth = { authorized: true, cause: 'authorized' }
	jest.spyOn(utils, 'verifyAuthAdmin').mockImplementation(() => expectedResponeAuth)

	await addToGroup(mockReq, mockRes)

	expect(mockRes.status).toHaveBeenCalledWith(400)
  })

  test('U5: authentication as admin but there are no emails', async () => {
	const mockReq = {
	  cookies: {
		accessToken: 'accessToken',
		refreshToken: 'refreshToken'
	  },
	  params: {
		name: 'testGroup'
	  },
	  body: {
		emails: [
		  'mail1@mail.com',
		  'mail2@mail.com',
		  'notValidFormatMail'
		]
	  },
	  url: 'api/groups/testGroup/insert'
	}
	const mockRes = {
	  locals: {
		refreshedTokenMessage: "dummy message"
	  },
	  status: jest.fn().mockReturnThis(),
	  json: jest.fn()
	}
	const expectedResponeAuth = { authorized: true, cause: 'authorized' }
	jest.spyOn(utils, 'verifyAuthAdmin').mockImplementation(() => expectedResponeAuth)

	await addToGroup(mockReq, mockRes)

	expect(mockRes.status).toHaveBeenCalledWith(400)
  })

  test('U6: authentication as admin but the group does not exist', async () => {
	const mockReq = {
	  cookies: {
		accessToken: 'accessToken',
		refreshToken: 'refreshToken'
	  },
	  params: {
		name: 'testGroup'
	  },
	  body: {
		emails: [
		  'mail1@mail.com',
		  'mail2@mail.com',
		  'notValidFormatMail'
		]
	  },
	  url: 'api/groups/testGroup/insert'
	}
	const mockRes = {
	  locals: {
		refreshedTokenMessage: "dummy message"
	  },
	  status: jest.fn().mockReturnThis(),
	  json: jest.fn()
	}
	const expectedResponeAuth = { authorized: true, cause: 'authorized' }
	jest.spyOn(utils, 'verifyAuthAdmin').mockImplementation(() => expectedResponeAuth)

	jest.spyOn(Group, 'findOne').mockResolvedValue(null)
	await addToGroup(mockReq, mockRes)

	expect(mockRes.status).toHaveBeenCalledWith(400)
  })

  test('U7: authentication as admin and users are added', async () => {
	const mockReq = {
	  cookies: {
		accessToken: 'accessToken',
		refreshToken: 'refreshToken'
	  },
	  params: {
		name: 'testGroup'
	  },
	  body: {
		emails: [
		  'mail1@mail.com',
		  'mail2@mail.com'
		]
	  },
	  url: 'api/groups/testGroup/insert'
	}
	const mockRes = {
	  locals: {
		refreshedTokenMessage: "dummy message"
	  },
	  status: jest.fn().mockReturnThis(),
	  json: jest.fn()
	}
	const expectedResponeAuth = { authorized: true, cause: 'authorized' }
	jest.spyOn(utils, 'verifyAuthAdmin').mockImplementation(() => expectedResponeAuth)

	const fakeGroup = {
	  name: 'testGroup',
	  members: [
		{
		  email: 'oldMember@mail.com',
		  _id: 123
		},
		{
		  email: 'anotherOldMember@mail.com',
		  _id: 321
		}
	  ]
	}
	jest.spyOn(Group, 'findOne').mockResolvedValueOnce(fakeGroup)

	const fakeData = [
	  {
		username: 'mail1',
		email: 'mail1@mail.com',
		role: 'Regular',
		_id: 456
	  }, {
		username: 'mail2',
		email: 'mail2@mail.com',
		role: 'Regular',
		_id: 789
	  }
	]

	jest.spyOn(User, 'findOne').mockResolvedValueOnce(fakeData[0])  // found
	jest.spyOn(Group, 'findOne').mockResolvedValueOnce(null)        // not already registered

	jest.spyOn(User, 'findOne').mockResolvedValueOnce(fakeData[1])  // found
	jest.spyOn(Group, 'findOne').mockResolvedValueOnce(null)        // not already registered


	jest.spyOn(Group, 'updateOne').mockImplementation(() => { })
	await addToGroup(mockReq, mockRes)

	expect(mockRes.status).toHaveBeenCalledWith(200)
	expect(mockRes.json.mock.calls[0][0].data.group.name).toBe(fakeGroup.name)
	expect(mockRes.json.mock.calls[0][0].data.membersNotFound).toEqual([])
	expect(mockRes.json.mock.calls[0][0].data.alreadyInGroup).toEqual([])

	const expectedDataRespone = [
	  { email: 'oldMember@mail.com' },
	  { email: 'anotherOldMember@mail.com' },
	  { email: 'mail1@mail.com' },
	  { email: 'mail2@mail.com' }
	]
	expect(mockRes.json.mock.calls[0][0].data.group.members).toEqual(expectedDataRespone)
  })

  test('U8: authentication as admin and one email is not registered', async () => {
	const mockReq = {
	  cookies: {
		accessToken: 'accessToken',
		refreshToken: 'refreshToken'
	  },
	  params: {
		name: 'testGroup'
	  },
	  body: {
		emails: [
		  'mail1@mail.com',
		  'notRegistered@mail.com'
		]
	  },
	  url: 'api/groups/testGroup/insert'
	}
	const mockRes = {
	  locals: {
		refreshedTokenMessage: "dummy message"
	  },
	  status: jest.fn().mockReturnThis(),
	  json: jest.fn()
	}
	const expectedResponeAuth = { authorized: true, cause: 'authorized' }
	jest.spyOn(utils, 'verifyAuthAdmin').mockImplementation(() => expectedResponeAuth)

	const fakeGroup = {
	  name: 'testGroup',
	  members: [
		{
		  email: 'oldMember@mail.com',
		  _id: 123
		},
		{
		  email: 'anotherOldMember@mail.com',
		  _id: 321
		}
	  ]
	}
	jest.spyOn(Group, 'findOne').mockResolvedValueOnce(fakeGroup)

	const fakeData = [
	  {
		username: 'mail1',
		email: 'mail1@mail.com',
		role: 'Regular',
		_id: 456
	  }
	]

	jest.spyOn(User, 'findOne').mockResolvedValueOnce(fakeData[0])  // found
	jest.spyOn(Group, 'findOne').mockResolvedValueOnce(null)        // not already registered

	jest.spyOn(User, 'findOne').mockResolvedValueOnce(null)         // not found
	jest.spyOn(Group, 'findOne').mockResolvedValueOnce(null)        // not already registered


	jest.spyOn(Group, 'updateOne').mockImplementation(() => { })
	await addToGroup(mockReq, mockRes)

	expect(mockRes.status).toHaveBeenCalledWith(200)
	expect(mockRes.json.mock.calls[0][0].data.group.name).toBe(fakeGroup.name)
	expect(mockRes.json.mock.calls[0][0].data.membersNotFound).toEqual([{ email: 'notRegistered@mail.com' }])
	expect(mockRes.json.mock.calls[0][0].data.alreadyInGroup).toEqual([])

	const expectedDataRespone = [
	  { email: 'oldMember@mail.com' },
	  { email: 'anotherOldMember@mail.com' },
	  { email: 'mail1@mail.com' }
	]
	expect(mockRes.json.mock.calls[0][0].data.group.members).toEqual(expectedDataRespone)
  })

  test('U9: authentication as admin and all emails are not registered', async () => {
	const mockReq = {
	  cookies: {
		accessToken: 'accessToken',
		refreshToken: 'refreshToken'
	  },
	  params: {
		name: 'testGroup'
	  },
	  body: {
		emails: [
		  'notRegistered@mail.com',
		  'notRegisteredToo@mail.com'
		]
	  },
	  url: 'api/groups/testGroup/insert'
	}
	const mockRes = {
	  locals: {
		refreshedTokenMessage: "dummy message"
	  },
	  status: jest.fn().mockReturnThis(),
	  json: jest.fn()
	}
	const expectedResponeAuth = { authorized: true, cause: 'authorized' }
	jest.spyOn(utils, 'verifyAuthAdmin').mockImplementation(() => expectedResponeAuth)

	const fakeGroup = {
	  name: 'testGroup',
	  members: [
		{
		  email: 'oldMember@mail.com',
		  _id: 123
		},
		{
		  email: 'anotherOldMember@mail.com',
		  _id: 321
		}
	  ]
	}
	jest.spyOn(Group, 'findOne').mockResolvedValueOnce(fakeGroup)

	const fakeData = [
	  {
		username: 'mail1',
		email: 'mail1@mail.com',
		role: 'Regular',
		_id: 456
	  }
	]

	jest.spyOn(User, 'findOne').mockResolvedValueOnce(null)  // not found
	jest.spyOn(Group, 'findOne').mockResolvedValueOnce(null) // not already registered

	jest.spyOn(User, 'findOne').mockResolvedValueOnce(null)  // not found
	jest.spyOn(Group, 'findOne').mockResolvedValueOnce(null) // not already registered

	jest.spyOn(Group, 'updateOne').mockImplementation(() => { })
	await addToGroup(mockReq, mockRes)

	expect(mockRes.status).toHaveBeenCalledWith(400)
  })

  test('U10: authentication as admin and one email is already registered to other group', async () => {
	const mockReq = {
	  cookies: {
		accessToken: 'accessToken',
		refreshToken: 'refreshToken'
	  },
	  params: {
		name: 'testGroup'
	  },
	  body: {
		emails: [
		  'mail1@mail.com',
		  'alreadyRegistered@mail.com'
		]
	  },
	  url: 'api/groups/testGroup/insert'
	}
	const mockRes = {
	  locals: {
		refreshedTokenMessage: "dummy message"
	  },
	  status: jest.fn().mockReturnThis(),
	  json: jest.fn()
	}
	const expectedResponeAuth = { authorized: true, cause: 'authorized' }
	jest.spyOn(utils, 'verifyAuthAdmin').mockImplementation(() => expectedResponeAuth)

	const fakeGroup = {
	  name: 'testGroup',
	  members: [
		{
		  email: 'oldMember@mail.com',
		  _id: 123
		},
		{
		  email: 'anotherOldMember@mail.com',
		  _id: 321
		}
	  ]
	}
	jest.spyOn(Group, 'findOne').mockResolvedValueOnce(fakeGroup)

	const fakeData = [
	  {
		username: 'mail1',
		email: 'mail1@mail.com',
		role: 'Regular',
		_id: 456
	  },
	  {
		username: 'alreadyRegistered',
		email: 'alreadyRegistered@mail.com',
		role: 'Regular',
		_id: 123
	  }
	]

	jest.spyOn(User, 'findOne').mockResolvedValueOnce(fakeData[0])  // found
	jest.spyOn(Group, 'findOne').mockResolvedValueOnce(null)        // not already registered

	jest.spyOn(User, 'findOne').mockResolvedValueOnce(fakeData[1])  // found
	jest.spyOn(Group, 'findOne').mockResolvedValueOnce(true)        // already registered

	jest.spyOn(Group, 'updateOne').mockImplementation(() => { })
	await addToGroup(mockReq, mockRes)

	expect(mockRes.status).toHaveBeenCalledWith(200)
	expect(mockRes.json.mock.calls[0][0].data.group.name).toBe(fakeGroup.name)
	expect(mockRes.json.mock.calls[0][0].data.membersNotFound).toEqual([])
	expect(mockRes.json.mock.calls[0][0].data.alreadyInGroup).toEqual([{ email: 'alreadyRegistered@mail.com' }])

	const expectedDataRespone = [
	  { email: 'oldMember@mail.com' },
	  { email: 'anotherOldMember@mail.com' },
	  { email: 'mail1@mail.com' }
	]
	expect(mockRes.json.mock.calls[0][0].data.group.members).toEqual(expectedDataRespone)
  })

  test('U11:  Network error ', async ()=>{
	const mockReq = {
	  cookies: {
		accessToken: 'accessToken',
		refreshToken: 'refreshToken'
	  },
	  params: {
		name: 'testGroup'
	  },
	  body: {
		emails: [
		  'mail1@mail.com',
		  'alreadyRegistered@mail.com'
		]
	  },
	  url: 'api/groups/testGroup/insert'
	}
	const mockRes = {
	  locals: {
		refreshedTokenMessage: "dummy message"
	  },
	  status: jest.fn().mockReturnThis(),
	  json: jest.fn()
	}
	const expectedResponeAuth = { authorized: true, cause: 'authorized' }
	jest.spyOn(utils, 'verifyAuthAdmin').mockImplementation(() => expectedResponeAuth)

	const fakeGroup = {
	  name: 'testGroup',
	  members: [
		{
		  email: 'oldMember@mail.com',
		  _id: 123
		},
		{
		  email: 'anotherOldMember@mail.com',
		  _id: 321
		}
	  ]
	}
	jest.spyOn(Group, 'findOne').mockImplementationOnce(()=>{throw new Error('server crash')})
	await addToGroup(mockReq, mockRes)
	expect(mockRes.status).toHaveBeenCalledWith(500);
	expect(mockRes.json).toHaveBeenCalledWith({ error: 'server crash' });

  })
})

describe("removeFromGroup", () => {
  afterEach(() => {
	jest.clearAllMocks();
  })
  beforeEach(() => jest.resetAllMocks())

  test('U1: authentication as admin but the user is regular', async () => {
	const mockReq = {
	  cookies: {
		accessToken: 'accessToken',
		refreshToken: 'refreshToken'
	  },
	  params: {
		name: 'testGroup'
	  },
	  body: {
		emails: [
		  'mail1@mail.com',
		  'mail2@mail.com',
		  'mail3@mail.com'
		]
	  },
	  url: 'api/groups/testGroup/pull'
	}
	const mockRes = {
	  locals: {
		refreshedTokenMessage: "dummy message"
	  },
	  status: jest.fn().mockReturnThis(),
	  json: jest.fn()
	}
	const expectedResponeAuth = { authorized: false, cause: 'unauthorized' }
	jest.spyOn(utils, 'verifyAuthAdmin').mockReturnValueOnce(expectedResponeAuth)

	await removeFromGroup(mockReq, mockRes)

	expect(mockRes.status).toHaveBeenCalledWith(401)
  })

  test('U2: authentication as group but the user is not part of the group', async () => {
	const mockReq = {
	  cookies: {
		accessToken: 'accessToken',
		refreshToken: 'refreshToken'
	  },
	  params: {
		name: 'testGroup'
	  },
	  body: {
		emails: [
		  'mail1@mail.com',
		  'mail2@mail.com',
		  'mail3@mail.com'
		]
	  },
	  url: 'api/groups/testGroup/remove'
	}
	const mockRes = {
	  locals: {
		refreshedTokenMessage: "dummy message"
	  },
	  status: jest.fn().mockReturnThis(),
	  json: jest.fn()
	}
	const expectedResponeAuth = { authorized: false, cause: 'unauthorized' }
	jest.spyOn(utils, 'verifyAuthGroup').mockReturnValueOnce(expectedResponeAuth)

	await removeFromGroup(mockReq, mockRes)

	expect(mockRes.status).toHaveBeenCalledWith(401)
  })
  test('U3: authorized as admin but some attribures are missing', async () => {
	const mockReq = {
	  cookies: {
		accessToken: 'accessToken',
		refreshToken: 'refreshToken'
	  },
	  params: {
		name: 'testGroup'
	  },
	  body: {

	  },
	  url: 'api/groups/testGroup/pull'
	}
	const mockRes = {
	  locals: {
		refreshedTokenMessage: "dummy message"
	  },
	  status: jest.fn().mockReturnThis(),
	  json: jest.fn()
	}
	const expectedResponeAuth = { authorized: true, cause: 'authorized' }

	jest.spyOn(utils, 'verifyAuthAdmin').mockReturnValueOnce(expectedResponeAuth)

	await removeFromGroup(mockReq, mockRes)

	expect(mockRes.status).toHaveBeenCalledWith(400)
	expect(mockRes.json).toHaveBeenCalledWith({ error: "The request body does not contain all the necessary attributes" });
  })


  test('U4: authentication as admin but the group does not exist', async () => {
	const mockReq = {
	  cookies: {
		accessToken: 'accessToken',
		refreshToken: 'refreshToken'
	  },
	  params: {
		name: 'testGroup'
	  },
	  body: {
		emails: [
		  'mail1@mail.com',
		  'mail2@mail.com',
		  'mail3@mail.com'
		]
	  },
	  url: 'api/groups/testGroup/pull'
	}
	const mockRes = {
	  locals: {
		refreshedTokenMessage: "dummy message"
	  },
	  status: jest.fn().mockReturnThis(),
	  json: jest.fn()
	}
	const expectedResponeAuth = { authorized: true, cause: 'authorized' }

	jest.spyOn(utils, 'verifyAuthAdmin').mockReturnValueOnce(expectedResponeAuth)

	jest.spyOn(Group, 'findOne').mockResolvedValueOnce(null)
	await removeFromGroup(mockReq, mockRes)

	expect(mockRes.status).toHaveBeenCalledWith(400)
	expect(mockRes.json).toHaveBeenCalledWith({ error: "Group name passed as a route parameter does not represent a group in the database" });

  })

  test('U5: authentication as admin and users are all not valid', async () => {
	const mockReq = {
	  cookies: {
		accessToken: 'accessToken',
		refreshToken: 'refreshToken'
	  },
	  params: {
		name: 'testGroup'
	  },
	  body: {
		emails: [
		  'mail1@mail.com',
		  'mail2@mail.com'
		]
	  },
	  url: 'api/groups/testGroup/pull'
	}
	const mockRes = {
	  locals: {
		refreshedTokenMessage: "dummy message"
	  },
	  status: jest.fn().mockReturnThis(),
	  json: jest.fn()
	}
	const expectedResponeAuth = { authorized: true, cause: 'authorized' }

	jest.spyOn(utils, 'verifyAuthAdmin').mockReturnValueOnce(expectedResponeAuth)

	const fakeGroup = {
	  name: 'testGroup',
	  members: [
		{
		  email: 'oldMember@mail.com',
		  _id: 123
		},
		{
		  email: 'anotherOldMember@mail.com',
		  _id: 321
		}
	  ]
	}
	jest.spyOn(Group, 'findOne').mockReturnValueOnce(fakeGroup)

	const fakeData = [
	  {
		username: 'mail1',
		email: 'mail1@mail.com',
		role: 'Regular',
		_id: 456
	  }, {
		username: 'mail2',
		email: 'mail2@mail.com',
		role: 'Regular',
		_id: 789
	  }
	]

	jest.spyOn(User, 'findOne').mockResolvedValueOnce(null);
	jest.spyOn(User, 'findOne').mockResolvedValueOnce(fakeData[1]);
	// jest.spyOn(User, 'findOne').mockResolvedValueOnce(fakeData[1].email);

	await removeFromGroup(mockReq, mockRes);
	expect(mockRes.status).toHaveBeenCalledWith(400);
	expect(mockRes.json).toHaveBeenCalledWith({ error: "All the members' email either do not exist or are not in the group" });

  });



  test('U6: authorized as admin but some emails are not in valid format', async () => {
	const mockReq = {
	  cookies: {
		accessToken: 'accessToken',
		refreshToken: 'refreshToken'
	  },
	  params: {
		name: 'testGroup'
	  },
	  body: {
		emails: [
		  'mail1@mail.com',
		  'mail2mail.com'
		]
	  },
	  url: 'api/groups/testGroup/pull'
	}
	const mockRes = {
	  locals: {
		refreshedTokenMessage: "dummy message"
	  },
	  status: jest.fn().mockReturnThis(),
	  json: jest.fn()
	}
	const expectedResponeAuth = { authorized: true, cause: 'authorized' }

	jest.spyOn(utils, 'verifyAuthAdmin').mockReturnValueOnce(expectedResponeAuth)

	await removeFromGroup(mockReq, mockRes)

	expect(mockRes.status).toHaveBeenCalledWith(400)
	expect(mockRes.json).toHaveBeenCalledWith({ error: "One or more emails are not in a valid format" });
  })



  test('U7: authorized as admin but some emails are empty strings', async () => {
	const mockReq = {
	  cookies: {
		accessToken: 'accessToken',
		refreshToken: 'refreshToken'
	  },
	  params: {
		name: 'testGroup'
	  },
	  body: {
		emails: [
		  'mail1@mail.com',
		  ''
		]
	  },
	  url: 'api/groups/testGroup/pull'
	}
	const mockRes = {
	  locals: {
		refreshedTokenMessage: "dummy message"
	  },
	  status: jest.fn().mockReturnThis(),
	  json: jest.fn()
	}
	const expectedResponeAuth = { authorized: true, cause: 'authorized' }

	jest.spyOn(utils, 'verifyAuthAdmin').mockReturnValueOnce(expectedResponeAuth)

	await removeFromGroup(mockReq, mockRes)

	expect(mockRes.status).toHaveBeenCalledWith(400)
	expect(mockRes.json).toHaveBeenCalledWith({ error: "One or more emails are empty strings" });
  })

  test('U8: authorized as admin but group has only one memeber', async () => {
	const mockReq = {
	  cookies: {
		accessToken: 'accessToken',
		refreshToken: 'refreshToken'
	  },
	  params: {
		name: 'testGroup'
	  },
	  body: {
		emails: [
		  'mail1@mail.com',
		  'mail2@mail.com'
		]
	  },
	  url: 'api/groups/testGroup/pull'
	}
	const mockRes = {
	  locals: {
		refreshedTokenMessage: "dummy message"
	  },
	  status: jest.fn().mockReturnThis(),
	  json: jest.fn()
	}
	const fakeGroup = {
	  name: 'testGroup',
	  members: [
		{
		  email: 'mail1@mail.com',
		  _id: 123
		},
	  ]
	}
	jest.spyOn(Group, 'findOne').mockReturnValueOnce(fakeGroup)

	const fakeData = [
	  {
		username: 'mail1',
		email: 'mail1@mail.com',
		role: 'Regular',
		_id: 456
	  }, {
		username: 'mail2',
		email: 'mail2@mail.com',
		role: 'Regular',
		_id: 789
	  }
	]

	const expectedResponeAuth = { authorized: true, cause: 'authorized' }

	jest.spyOn(utils, 'verifyAuthAdmin').mockReturnValueOnce(expectedResponeAuth)
	jest.spyOn(Group, 'findOne').mockResolvedValueOnce(fakeGroup)
	await removeFromGroup(mockReq, mockRes)

	expect(mockRes.status).toHaveBeenCalledWith(400)
	expect(mockRes.json).toHaveBeenCalledWith({ error: "The group contains only one member" });
  })

  test('U9 : Network error -> return 500', async () => {
	const mockReq = {
	  cookies: {
		accessToken: 'accessToken',
		refreshToken: 'refreshToken'
	  },
	  params: {
		name: 'testGroup'
	  },
	  body: {
		emails: [
		  'mail1@mail.com',
		  'mail2@mail.com'
		]
	  },
	  url: 'api/groups/testGroup/pull'
	}
	const mockRes = {
	  locals: {
		refreshedTokenMessage: "dummy message"
	  },
	  status: jest.fn().mockReturnThis(),
	  json: jest.fn()
	}
	const fakeGroup = {
	  name: 'testGroup',
	  members: [
		{
		  email: 'mail1@mail.com',
		  _id: 123
		},
		{
		  email: 'mail2@mail.com',
		  _id: 1234
		}
	  ]
	}
	const expectedResponeAuth = { authorized: true, cause: 'authorized' }

	jest.spyOn(utils, 'verifyAuthAdmin').mockReturnValueOnce(expectedResponeAuth)

	jest.spyOn(Group, 'findOne').mockImplementationOnce(() => { throw new Error('server crash') });

	await removeFromGroup(mockReq, mockRes);

	expect(mockRes.status).toHaveBeenCalledWith(500);
	expect(mockRes.json).toHaveBeenCalledWith({ error: 'server crash' });
  })

  test('U10 : remove user from group ', async () => {
	const mockReq = {
	  cookies: {
		accessToken: 'accessToken',
		refreshToken: 'refreshToken'
	  },
	  params: {
		name: 'testGroup'
	  },
	  body: {
		emails: [
		  'mail1@mail.com',
		  'mail2@mail.com'
		]
	  },
	  url: 'api/groups/testGroup/pull'
	}
	const mockRes = {
	  locals: {
		refreshedTokenMessage: "dummy message"
	  },
	  status: jest.fn().mockReturnThis(),
	  json: jest.fn()
	}
	const fakeGroup = {
	  name: 'testGroup',
	  members: [
		{
		  email: 'mail1@mail.com',
		  _id: 123
		},
		{
		  email: 'mail2@mail.com',
		  _id: 1234
		}
	  ]
	}
	const fakeData = [
	  {
		username: 'mail1',
		email: 'mail1@mail.com',
		role: 'Regular',
		_id: 456
	  }, {
		username: 'mail2',
		email: 'mail2@mail.com',
		role: 'Regular',
		_id: 789
	  }
	]
	const expectedResponeAuth = { authorized: true, cause: 'authorized' }

	jest.spyOn(utils, 'verifyAuthAdmin').mockReturnValueOnce(expectedResponeAuth)

	jest.spyOn(Group, 'findOne').mockResolvedValueOnce(fakeGroup);

	jest.spyOn(User, 'findOne').mockResolvedValueOnce(fakeData[0]);
	jest.spyOn(User, 'findOne').mockResolvedValueOnce(fakeData[1]);


	jest.spyOn(Group, 'updateOne').mockImplementation(() => { })
	await removeFromGroup(mockReq, mockRes)

	expect(mockRes.status).toHaveBeenCalledWith(200)
	expect(mockRes.json.mock.calls[0][0].data.group.name).toBe(fakeGroup.name)
	expect(mockRes.json.mock.calls[0][0].data.membersNotFound).toEqual([])
	expect(mockRes.json.mock.calls[0][0].data.notInGroup).toEqual([])

	const expectedDataRespone = [

	  { email: 'mail1@mail.com' }
	]
	expect(mockRes.json.mock.calls[0][0].data.group.members).toEqual(expectedDataRespone)

  })
})

describe("deleteUser", () => {

  let mockReq, mockResp;
  beforeEach(
	() => {
	  jest.resetAllMocks();
	  mockReq = {
		body: {
		  email: 'test@example.com'
		},
		cookies: {}
	  };
	  mockResp = {
		status: jest.fn(() => mockResp),
		json: jest.fn(),
		locals: {
		  refreshedTokenMessage: "dummy message"
		}
	  };



	}
  )

  afterEach(() => {
	jest.clearAllMocks();
  }
  )

  test('U1: delete the user that does not exist in a group -> return 200', async () => {
	let mockReq = {
	  body: {
		email: 'test@example.com'
	  }
	};
	jest.spyOn(utils, "verifyAuthAdmin").mockImplementation(() => (
	  {
		authorized: true,
		cause: "Authorized"
	  }
	))
	const user = { email: 'test@example.com' };
	jest.spyOn(User, "findOne").mockImplementationOnce(() => user);
	jest.spyOn(User, "deleteOne").mockResolvedValueOnce({ deletedCount: 1 });
	jest.spyOn(transactions, "deleteMany").mockResolvedValueOnce({ deletedCount: 2 });
	const group = { _id: 'group-id', members: [{ email: 'user@example.com' }] };
	jest.spyOn(Group, "findOne").mockResolvedValueOnce(null);
	//  jest.spyOn(Group, "deleteOne").mockImplementation(()=>{});

	await deleteUser(mockReq, mockResp);
	expect(mockResp.status).toHaveBeenCalledWith(200);
	expect(mockResp.json).toHaveBeenCalledWith({
	  data: {
		deletedFromGroup: false,
		deletedTransactions: 2,
	  },
	  refreshedTokenMessage: "dummy message"
	});
  });
  test('U2: delete the user beloging to a group and is the only user in the group -> return 200', async () => {
	let mockReq = {
	  body: {
		email: 'test@example.com'
	  }
	};
	jest.spyOn(utils, "verifyAuthAdmin").mockImplementation(() => (
	  {
		authorized: true,
		cause: "Authorized"
	  }
	))
	const user = { email: 'test@example.com', role: "Regular" };
	jest.spyOn(User, "findOne").mockImplementationOnce(() => user);
	jest.spyOn(User, "deleteOne").mockResolvedValueOnce({ deletedCount: 1 });
	jest.spyOn(transactions, "deleteMany").mockResolvedValueOnce({ deletedCount: 2 });
	const group = { _id: 'group-id', members: [{ email: 'test@example.com' }] };
	jest.spyOn(Group, "findOne").mockResolvedValueOnce(group);
	jest.spyOn(Group, "deleteOne").mockImplementation(() => { });

	await deleteUser(mockReq, mockResp);
	expect(mockResp.status).toHaveBeenCalledWith(200);
	expect(mockResp.json).toHaveBeenCalledWith({
	  data: {
		deletedFromGroup: true,
		deletedTransactions: 2,
	  },
	  refreshedTokenMessage: "dummy message"
	});
  });

  test('U3: delete the user beloging to a group -> return 200', async () => {
	let mockReq = {
	  body: {
		email: 'test@example.com'
	  }
	};
	jest.spyOn(utils, "verifyAuthAdmin").mockImplementation(() => (
	  {
		authorized: true,
		cause: "Authorized"
	  }
	))
	const user = { email: 'test@example.com', role: "Regular" };
	jest.spyOn(User, "findOne").mockImplementationOnce(() => user);
	jest.spyOn(User, "deleteOne").mockResolvedValueOnce({ deletedCount: 1 });
	jest.spyOn(transactions, "deleteMany").mockResolvedValueOnce({ deletedCount: 2 });
	const group = { _id: 'group-id', members: [{ email: 'test@example.com' , email: 'test1@example.com'}] , save: jest.fn()};
	jest.spyOn(Group, "findOne").mockResolvedValueOnce(group);
	jest.spyOn(group, "save").mockImplementationOnce(()=>{});
	await deleteUser(mockReq, mockResp);
	expect(mockResp.status).toHaveBeenCalledWith(200);
	expect(mockResp.json).toHaveBeenCalledWith({
	  data: {
		deletedFromGroup: true,
		deletedTransactions: 2,
	  },
	  refreshedTokenMessage: "dummy message"
	});
  });







  test('U4: missing field in body -> retunr 400', async () => {

	let mockReq_miss = {
	  body: {

	  }
	}
	jest.spyOn(utils, "verifyAuthAdmin").mockImplementation(() => (
	  {
		authorized: true,
		cause: "Authorized"
	  }
	))


	await deleteUser(mockReq_miss, mockResp)
	expect(mockResp.status).toHaveBeenCalledWith(400);
	expect(mockResp.json).toHaveBeenCalledWith({ error: "The request body does not contain all the necessary attributes" });
  })


  test('U5: missing values -> retunr 400', async () => {

	let mockReq_empty = {
	  body: {
		email: ''
	  }
	}
	jest.spyOn(utils, "verifyAuthAdmin").mockImplementation(() => (
	  {
		authorized: true,
		cause: "Authorized"
	  }
	))


	await deleteUser(mockReq_empty, mockResp)
	expect(mockResp.status).toHaveBeenCalledWith(400);
	expect(mockResp.json).toHaveBeenCalledWith({ error: "The email passed is an empty string" });
  })

  test('U6: invalid email format -> retunr 400', async () => {

	let mockReq_invalid = {
	  body: {
		email: 'email'
	  }
	}
	jest.spyOn(utils, "verifyAuthAdmin").mockImplementation(() => (
	  {
		authorized: true,
		cause: "Authorized"
	  }
	))


	await deleteUser(mockReq_invalid, mockResp)
	expect(mockResp.status).toHaveBeenCalledWith(400);
	expect(mockResp.json).toHaveBeenCalledWith({ error: "The email is not in a valid format" });
  })

  test('U7: user does not exist -> retunr 400', async () => {

	let mockReq = {
	  body: {
		email: 'test@example.com'
	  }
	}
	jest.spyOn(utils, "verifyAuthAdmin").mockImplementation(() => (
	  {
		authorized: true,
		cause: "Authorized"
	  }
	))

	jest.spyOn(User, "findOne").mockImplementation(() => null);

	await deleteUser(mockReq, mockResp)
	expect(mockResp.status).toHaveBeenCalledWith(400);
	expect(mockResp.json).toHaveBeenCalledWith({ error: "The email does not represent a user in the database" });
  })

  test('U8: the user not authentified -> retunr 400', async () => {

	let mockReq_miss = {
	  body: {
		email: 'test@example.com'

	  }
	}
	jest.spyOn(utils, "verifyAuthAdmin").mockImplementation(() => (
	  {
		authorized: false,
		cause: "UnAuthorized"
	  }
	))

	await deleteUser(mockReq, mockResp);
	expect(mockResp.status).toHaveBeenCalledWith(401);
  })

  test('U9: the target user is an admin -> return 401', async () => {
    let mockReq = {
      body: {
        email: 'test@example.com'
      }
    };
    jest.spyOn(utils, "verifyAuthAdmin").mockImplementation(() => (
      {
        authorized: true,
        cause: "Authorized"
      }
    ))
    const user = { email: 'test@example.com', role: "Admin" };
    jest.spyOn(User, "findOne").mockImplementationOnce(() => user);
    await deleteUser(mockReq, mockResp)
    expect(mockResp.status).toHaveBeenCalledWith(400);
    expect(mockResp.json).toHaveBeenCalledWith({ error: "The email represents an admin" });



  })
  test("U10: Network error -> return 500", async () => {
	let mockReq = {
	  body: {
		email: 'test@example.com'

	  }
	}
	jest.spyOn(utils, "verifyAuthAdmin").mockImplementation(() => (
	  {
		authorized: true,
		cause: "Authorized"
	  }
	))
	jest.spyOn(utils, "verifyAuthGroup").mockImplementation(() => (
	  {
		authorized: true,
		cause: "Authorized"
	  }
	))
	jest.spyOn(Group, "findOne").mockImplementation(() => { throw new Error('server crash') });

	await deleteUser(mockReq, mockResp);

	expect(mockResp.status).toHaveBeenCalledWith(500);
	expect(mockResp.json).toHaveBeenCalledWith({ error: 'server crash' });

  })
})





describe("deleteGroup", () => {
  let mockReq, mockResp;
  beforeEach(
	() => {
	  mockReq = {
		body: {
		  name: 'group'
		},
		cookies: {}
	  };
	  mockResp = {
		status: jest.fn(() => mockResp),
		json: jest.fn(),
		locals: {
		  refreshedTokenMessage: "dummy message"
		}
	  };

	}
  )

  afterEach(() => {
	jest.clearAllMocks();
  }
  )

  test('U1 : delte group -> return 200', async () => {
	jest.spyOn(utils, "verifyAuthAdmin").mockImplementation(() => (
	  {
		authorized: true,
		cause: "Authorized"
	  }
	))
	const group = {
	  name: 'group'
	};
	jest.spyOn(Group, "findOne").mockImplementationOnce(() => group);
	await deleteGroup(mockReq, mockResp);

	expect(mockResp.status).toHaveBeenCalledWith(200);
	expect(mockResp.json).toHaveBeenCalledWith({ data: { message: "Group deleted successfully" }, refreshedTokenMessage: mockResp.locals.refreshedTokenMessage })
  })

  test('U2: missing fields -> return 400', async () => {
	jest.spyOn(utils, "verifyAuthAdmin").mockImplementation(() => (
	  {
		authorized: true,
		cause: "Authorized"
	  }
	))
	mockReq = {
	  body: {

	  }
	}
	await deleteGroup(mockReq, mockResp);
	expect(mockResp.status).toHaveBeenCalledWith(400);
	expect(mockResp.json).toHaveBeenCalledWith({ error: "The request body does not contain all the necessary attributes" });

  })

  test('U3: name is an empty string -> return 400', async () => {
	jest.spyOn(utils, "verifyAuthAdmin").mockImplementation(() => (
	  {
		authorized: true,
		cause: "Authorized"
	  }
	))
	mockReq = {
	  body: {
		name: ''

	  }
	}
	await deleteGroup(mockReq, mockResp);
	expect(mockResp.status).toHaveBeenCalledWith(400);
	expect(mockResp.json).toHaveBeenCalledWith({ error: "The name passed is an empty string" });

  })
  test('U4 : group does not exist -> return 400', async () => {
	jest.spyOn(utils, "verifyAuthAdmin").mockImplementation(() => (
	  {
		authorized: true,
		cause: "Authorized"
	  }
	))
	const group = {
	  name: 'group'
	};
	jest.spyOn(Group, "findOne").mockImplementationOnce(() => null);
	await deleteGroup(mockReq, mockResp);

	expect(mockResp.status).toHaveBeenCalledWith(400);
	expect(mockResp.json).toHaveBeenCalledWith({ error: "The name passed does not represent a group in the database" })
  })



  test('U5: user is unauthenrified -> return 401', async () => {
	jest.spyOn(utils, "verifyAuthAdmin").mockImplementation(() => (
	  {
		authorized: false,
		cause: "UnAuthorized"
	  }
	))

	await deleteGroup(mockReq, mockResp);
	expect(mockResp.status).toHaveBeenCalledWith(401);


  })

  test('U6 : Network error -> return 500', async () => {
	jest.spyOn(utils, "verifyAuthAdmin").mockImplementation(() => (
	  {
		authorized: true,
		cause: "Authorized"
	  }
	))
	const group = {
	  name: 'group'
	};
	jest.spyOn(Group, "findOne").mockImplementationOnce(() => { throw new Error('server crash') });

	await deleteGroup(mockReq, mockResp);

	expect(mockResp.status).toHaveBeenCalledWith(500);
	expect(mockResp.json).toHaveBeenCalledWith({ error: 'server crash' });
  })




})

