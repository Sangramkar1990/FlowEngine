# FlowEngine

FlowEngine is a secure authentication system built with Express.js and OpenSearch. It provides a robust backend for user authentication with features like registration, login, profile management, and powerful search capabilities. All data is stored in OpenSearch, eliminating the need for a separate database.

## Features

- User registration and authentication
- JWT-based authentication
- Protected routes
- User profile management
- Secure password hashing with bcrypt
- OpenSearch for data storage and powerful search capabilities
- Environment-based configuration

## Tech Stack

- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **OpenSearch** - Data storage and search engine
- **JWT** - JSON Web Tokens for authentication
- **bcrypt** - Password hashing
- **dotenv** - Environment variable management
- **UUID** - Unique ID generation

## Prerequisites

Before running this application, make sure you have the following installed:

- Node.js (v18 or higher)
- OpenSearch (local or remote instance)

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
   JWT_SECRET=your_jwt_secret_key
   JWT_EXPIRE=30d
   JWT_COOKIE_EXPIRE=30

   # OpenSearch Configuration
   OPENSEARCH_NODE=https://localhost:9200
   OPENSEARCH_USERNAME=admin
   OPENSEARCH_PASSWORD=admin
   ```

## Running the Application

### Initialize OpenSearch Indices
```
npm run create-indices
```

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

### Search

- **Search Documents**
  - `GET /api/search/:index?query=search_term&fields=field1,field2&from=0&size=10`
  - Public endpoint

- **Create Index**
  - `POST /api/search/index/:index`
  - Headers: `Authorization: Bearer <token>`
  - Request Body: `{ "properties": { "field1": { "type": "text" } } }`

- **Index Document**
  - `POST /api/search/:index?id=optional_id`
  - Headers: `Authorization: Bearer <token>`
  - Request Body: `{ "field1": "value1", "field2": "value2" }`

- **Update Document**
  - `PUT /api/search/:index/:id`
  - Headers: `Authorization: Bearer <token>`
  - Request Body: `{ "field1": "updated_value" }`

- **Delete Document**
  - `DELETE /api/search/:index/:id`
  - Headers: `Authorization: Bearer <token>`

### Sequences

- **Get All Sequences**
  - `GET /api/sequences?type=beginner&effective=flexibility&page=1&limit=10`
  - Public endpoint
  - Supports filtering by type, effective, and user
  - Supports pagination

- **Get Single Sequence**
  - `GET /api/sequences/:id`
  - Public endpoint

- **Create Sequence**
  - `POST /api/sequences`
  - Headers: `Authorization: Bearer <token>`
  - Request Body: `{ "name": "Morning Flow", "description": "A gentle sequence to start your day", "videoLink": "https://youtube.com/watch?v=abc12345678", "type": "beginner", "effective": "flexibility, energy" }`

- **Update Sequence**
  - `PUT /api/sequences/:id`
  - Headers: `Authorization: Bearer <token>`
  - Request Body: `{ "name": "Updated Morning Flow", "description": "Updated description" }`

- **Delete Sequence**
  - `DELETE /api/sequences/:id`
  - Headers: `Authorization: Bearer <token>`

- **Search Sequences**
  - `GET /api/sequences/search?query=morning flow&from=0&size=10`
  - Public endpoint
  - Searches across name, description, and effective fields

- **Get User Sequences**
  - `GET /api/sequences/user/:userId`
  - Public endpoint

## Project Structure

```
flowengine/
├── config/
│   └── opensearch.js     # OpenSearch configuration
├── controllers/
│   ├── authController.js # Authentication controller
│   ├── searchController.js # Search controller
│   └── sequenceController.js # Sequence controller
├── middleware/
│   └── auth.js           # Authentication middleware
├── routes/
│   ├── authRoutes.js     # Authentication routes
│   ├── searchRoutes.js   # Search routes
│   └── sequenceRoutes.js # Sequence routes
├── scripts/
│   └── createIndices.js # Script to create OpenSearch indices
├── services/
│   ├── searchService.js  # Search service
│   ├── userService.js    # User service
│   └── sequenceService.js # Sequence service
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

