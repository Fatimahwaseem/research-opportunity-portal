# University Research Opportunity Portal

A full-stack web app where faculty can post, view, update, close and delete research opportunities.

**Stack:** Node.js + Express (REST API), MySQL, HTML/JavaScript + Bootstrap.

**GitHub Repository:** https://github.com/YOUR-USERNAME/research-opportunity-portal

## Project structure
```
backend/    Express REST API (server.js)
frontend/   index.html + app.js (served by the backend)
database/   schema.sql
postman/    exported Postman collection
```

## Setup and run
1. Install Node.js and MySQL.
2. Create the database and table: open MySQL Workbench (or the command line client) and run `database/schema.sql`.
3. In `backend/`, copy `.env.example` to `.env` and put in your own MySQL password.
4. Install and start:
   ```
   cd backend
   npm install
   npm start
   ```
5. Open http://localhost:3000 in your browser.

## API endpoints
| Method | Endpoint | Description | Success code |
|--------|----------|-------------|--------------|
| POST | /api/opportunities | Create | 201 |
| GET | /api/opportunities | List all | 200 |
| GET | /api/opportunities/:id | Get one | 200 |
| PUT | /api/opportunities/:id | Update | 200 |
| DELETE | /api/opportunities/:id | Delete | 200 |

Errors: 400 (invalid input), 404 (not found), 500 (server error).

## Testing
Import `postman/Research_Portal.postman_collection.json` into Postman and run the requests in order.

## Fields
id, title, description, research_area, faculty_name, department, required_skills, positions, deadline, status (Open/Closed).
