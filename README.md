# Etasker Backend

A powerful task management system backend built with Node.js, Express, TypeScript, PostgreSQL, and Drizzle ORM.

## Features

- 🔐 **JWT Authentication** - Secure user registration and login
- 📝 **Task Management** - Full CRUD operations for tasks
- 🗄️ **PostgreSQL Database** - Reliable data persistence with Drizzle ORM
- 🔒 **Security** - Helmet, CORS, bcrypt password hashing
- 📊 **Database Schema** - Users, projects, tasks, comments, notifications, files
- 🚀 **TypeScript** - Type-safe development
- ✅ **Validation** - Request validation with Zod

## Tech Stack

- **Node.js 18+** - JavaScript runtime
- **Express** - Web framework
- **TypeScript** - Type safety
- **PostgreSQL** - Database
- **Drizzle ORM** - Type-safe ORM
- **JWT** - Authentication
- **Zod** - Schema validation
- **bcryptjs** - Password hashing

## Prerequisites (Windows)

Before you begin, ensure you have the following installed:

1. **Node.js 18+** - [Download](https://nodejs.org/)
   ```bash
   node --version  # Should be v18 or higher
   ```

2. **PostgreSQL 14+** - [Download](https://www.postgresql.org/download/windows/)
   - During installation, remember your postgres user password
   - Default port is 5432

3. **Git** - [Download](https://git-scm.com/download/win)

## Setup Instructions (Windows)

### 1. Clone the Repository

```bash
git clone https://github.com/npholodashvili/etasker.git
cd etasker
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup PostgreSQL Database

Open **pgAdmin** or use **psql** command line:

```sql
-- Connect to PostgreSQL (using psql)
psql -U postgres

-- Create database
CREATE DATABASE etasker;

-- Create a dedicated user (optional but recommended)
CREATE USER etasker_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE etasker TO etasker_user;

-- Exit psql
\q
```

Alternatively, using **Windows Command Prompt**:

```bash
psql -U postgres -c "CREATE DATABASE etasker;"
```

### 4. Configure Environment Variables

Create a `.env` file in the root directory by copying the example:

```bash
copy .env.example .env
```

Edit `.env` and set your configuration:

```env
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/etasker
JWT_SECRET=your-super-secret-jwt-key-change-this
PORT=3000
UPLOAD_DIR=./uploads
```

**Important:** 
- Replace `your_password` with your PostgreSQL password
- Generate a strong random JWT_SECRET (e.g., use `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)

### 5. Run Database Migrations

Push the schema to your database using Drizzle Kit:

```bash
npm run migrate
```

This will create all the necessary tables (users, projects, tasks, etc.) in your database.

### 6. Start the Development Server

```bash
npm run dev
```

The server should now be running at `http://localhost:3000`

You should see:
```
✅ Server is running on port 3000
📍 Environment: development
🗄️  Database: postgresql://***@localhost:5432/etasker
```

### 7. Test the API

You can test the health endpoint:

```bash
curl http://localhost:3000/health
```

Or use a tool like **Postman** or **Thunder Client** (VS Code extension).

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run migrate` - Run database migrations (Drizzle Kit push)
- `npm run typecheck` - Check TypeScript types
- `npm run lint` - Lint code with ESLint

## API Endpoints

### Authentication

#### Register a new user
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe",
  "role": "user"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

Response includes a JWT token to use for authenticated requests.

### Tasks (Protected - Requires JWT)

#### List all tasks
```http
GET /api/tasks
Authorization: Bearer <your-jwt-token>

# Optional query parameters:
# ?status=todo&priority=high&projectId=1&assignedTo=1&search=keyword
```

#### Get a specific task
```http
GET /api/tasks/:id
Authorization: Bearer <your-jwt-token>
```

#### Create a task
```http
POST /api/tasks
Authorization: Bearer <your-jwt-token>
Content-Type: application/json

{
  "title": "Implement feature X",
  "description": "Detailed description",
  "status": "todo",
  "priority": "high",
  "projectId": 1,
  "assignedTo": 2,
  "dueDate": "2024-12-31T23:59:59Z"
}
```

#### Update a task
```http
PUT /api/tasks/:id
Authorization: Bearer <your-jwt-token>
Content-Type: application/json

{
  "status": "in_progress",
  "priority": "high"
}
```

#### Delete a task
```http
DELETE /api/tasks/:id
Authorization: Bearer <your-jwt-token>
```

## Database Schema

The application includes the following tables:

- **users** - User accounts with authentication
- **projects** - Project management
- **project_users** - Many-to-many relationship between projects and users
- **tasks** - Task tracking with status and priority
- **task_comments** - Comments on tasks
- **notifications** - User notifications
- **files** - File attachments for tasks and projects

## Project Structure

```
etasker/
├── server/
│   └── src/
│       ├── index.ts          # Main entry point
│       ├── db.ts             # Database connection
│       ├── middleware/
│       │   └── auth.ts       # JWT authentication middleware
│       └── routes/
│           ├── auth.ts       # Authentication routes
│           └── tasks.ts      # Task CRUD routes
├── shared/
│   └── schema.ts             # Drizzle ORM schema definitions
├── drizzle.config.ts         # Drizzle Kit configuration
├── tsconfig.json             # TypeScript configuration
├── package.json              # Dependencies and scripts
├── .env.example              # Example environment variables
└── README.md                 # This file
```

## Troubleshooting (Windows)

### PostgreSQL Connection Issues

1. **Check if PostgreSQL is running:**
   - Open **Services** (Win + R, type `services.msc`)
   - Look for "postgresql-x64-14" (or your version)
   - Ensure it's running

2. **Connection refused:**
   - Verify the DATABASE_URL in `.env`
   - Check PostgreSQL is listening on port 5432
   - Try: `netstat -an | findstr 5432`

3. **Authentication failed:**
   - Verify your postgres password
   - Check `pg_hba.conf` (usually in `C:\Program Files\PostgreSQL\14\data\`)
   - Ensure it allows local connections

### Port Already in Use

If port 3000 is already in use:

```bash
# Find process using port 3000
netstat -ano | findstr :3000

# Kill the process (replace PID with actual process ID)
taskkill /PID <PID> /F
```

Or change the PORT in `.env` file.

### Module Not Found Errors

```bash
# Clear node_modules and reinstall
rmdir /s /q node_modules
npm install
```

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| DATABASE_URL | Yes | - | PostgreSQL connection string |
| JWT_SECRET | Yes | - | Secret key for JWT signing |
| PORT | No | 3000 | Server port |
| UPLOAD_DIR | No | ./uploads | Directory for file uploads |
| NODE_ENV | No | development | Environment (development/production) |

## Security Notes

- Always use strong JWT_SECRET in production
- Never commit `.env` file to version control
- Use HTTPS in production
- Configure CORS properly for production
- Implement rate limiting for production
- Use environment-specific credentials

## Next Steps

- Implement project management endpoints
- Add file upload functionality
- Implement WebSocket for real-time notifications
- Add comprehensive error handling
- Implement request rate limiting
- Add API documentation with Swagger
- Write unit and integration tests
- Setup CI/CD pipeline

## License

See LICENSE file for details.

## Support

For issues and questions, please open an issue on GitHub.
