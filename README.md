# FlowEngine

FlowEngine is a secure authentication system built with Express.js and MongoDB. It provides a robust backend for user authentication with features like registration, login, and profile management.

## Features

- User registration and authentication
- JWT-based authentication
- Protected routes
- User profile management
- Secure password hashing with bcrypt
- MongoDB integration for data persistence
- Environment-based configuration

## Tech Stack

- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling
- **JWT** - JSON Web Tokens for authentication
- **bcrypt** - Password hashing
- **dotenv** - Environment variable management

## Prerequisites

Before running this application, make sure you have the following installed:

- Node.js (v18 or higher)
- MongoDB (local or remote instance)

## Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   cd flowengine
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file in the root directory with the following variables:
   ```
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/flowengine
   JWT_SECRET=your_jwt_secret_key
   JWT_EXPIRE=30d
   JWT_COOKIE_EXPIRE=30
   ```

## Running the Application

### Development Mode
```
npm run dev
```

### Production Mode
```
npm start
```

## API Endpoints

### Authentication

- **Register User**
  - `POST /api/auth/register`
  - Request Body: `{ "name": "John Doe", "email": "john@example.com", "password": "password123" }`

- **Login User**
  - `POST /api/auth/login`
  - Request Body: `{ "email": "john@example.com", "password": "password123" }`

- **Get Current User**
  - `GET /api/auth/me`
  - Headers: `Authorization: Bearer <token>`

- **Logout User**
  - `GET /api/auth/logout`

## Project Structure

```
flowengine/
├── config/
│   └── database.js       # Database configuration
├── controllers/
│   └── authController.js # Authentication controller
├── middleware/
│   └── auth.js           # Authentication middleware
├── models/
│   └── User.js           # User model
├── routes/
│   └── authRoutes.js     # Authentication routes
├── .env                  # Environment variables
├── package.json          # Project dependencies
├── README.md             # Project documentation
└── server.js             # Main application file
```

## Security

This application implements several security best practices:

- Password hashing using bcrypt
- JWT for secure authentication
- HTTP-only cookies
- Protected routes with middleware
- Input validation

## License

ISC

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
