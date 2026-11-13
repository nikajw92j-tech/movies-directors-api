# Movies & Directors API

**Live API:** https://movies-directors-api.vercel.app (try [/movies](https://movies-directors-api.vercel.app/movies) or [/directors](https://movies-directors-api.vercel.app/directors))

A REST API built with **Node.js, Express, MongoDB and Mongoose**.
It has two resources, **Directors** and **Movies**, with a **One-to-Many** relationship:
one director can have many movies, and each movie belongs to exactly one director.

## Project structure

```
├── config/
│   └── db.js                    # connects to MongoDB
├── controllers/
│   ├── directorController.js    # logic for /directors
│   └── movieController.js       # logic for /movies
├── models/
│   ├── Director.js              # Director schema
│   └── Movie.js                 # Movie schema
├── routes/
│   ├── directorRoutes.js        # URL -> controller function
│   └── movieRoutes.js
├── server.js                    # app entry point
├── .env.example
└── package.json
```

A request goes **server.js → routes → controller → model → MongoDB**, and the response travels back the same way.

---

## 1. Setup

### Create the project from scratch (if you are not using this folder)

```bash
mkdir movies-directors-api
cd movies-directors-api
npm init -y
npm install express mongoose dotenv
npm install -D nodemon
```

### Or, with this folder

```bash
npm install
```

### Connect MongoDB

You need one of these:

**Option A: local MongoDB.** Install [MongoDB Community Server](https://www.mongodb.com/try/download/community). It runs on `mongodb://127.0.0.1:27017`.

**Option B: MongoDB Atlas (free cloud database).**
1. Create a free cluster at https://www.mongodb.com/atlas
2. In *Database Access*, create a user with a password.
3. In *Network Access*, allow your IP (or `0.0.0.0/0` while testing).
4. Click *Connect → Drivers* and copy the connection string.

### Create the `.env` file

Copy `.env.example` to `.env` and fill in your values:

```env
PORT=3000
# local MongoDB
MONGO_URI=mongodb://127.0.0.1:27017/movies-directors
# or Atlas:
# MONGO_URI=mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/movies-directors
```

### Start the app

```bash
npm run dev     # with nodemon (restarts automatically when you save a file)
npm start       # plain node
```

You should see:

```
server running on http://localhost:3000
connected to MongoDB successfully
```

---

## 2. Endpoints

| Method | URL | Description |
|---|---|---|
| POST | /directors | Create a director |
| GET | /directors | Get all directors (with their movies populated) |
| GET | /directors/:id | Get one director (with movies populated) |
| PATCH | /directors/:id | Update a director |
| DELETE | /directors/:id | Delete a director **and all of their movies** |
| POST | /movies | Create a movie (**director id goes in the `X-Director-Id` header**) |
| GET | /movies | Get all movies (with the director populated) |
| GET | /movies/:id | Get one movie (with the director populated) |
| PATCH | /movies/:id | Update a movie (send `X-Director-Id` to change its director) |
| DELETE | /movies/:id | Delete a movie (also removed from the director's `movies` array) |

### Status codes used

| Code | When |
|---|---|
| 200 | Request succeeded |
| 201 | Resource created |
| 400 | Invalid ObjectId, missing or invalid fields, missing header, bad JSON |
| 404 | Director, movie or route not found |
| 500 | Unexpected server error |

---

## 3. Testing with Postman

For every request with a body: **Body → raw → JSON**.
Postman sets `Content-Type: application/json` automatically when you select JSON.

> Tip: replace `DIRECTOR_ID` and `MOVIE_ID` below with real `_id` values from earlier responses.

### Directors

**Create a director**
```
POST http://localhost:3000/directors
Headers: Content-Type: application/json
```
```json
{
  "name": "Christopher Nolan",
  "age": 54,
  "nationality": "British-American",
  "birthDate": "1970-07-30"
}
```
→ `201 Created`
```json
{
  "message": "director created successfully",
  "data": { "_id": "665f...", "name": "Christopher Nolan", "age": 54, "nationality": "British-American", "birthDate": "1970-07-30T00:00:00.000Z", "movies": [], "createdAt": "...", "updatedAt": "..." }
}
```

**Get all directors** (each director's `movies` contains full movie objects)
```
GET http://localhost:3000/directors
```

**Get one director**
```
GET http://localhost:3000/directors/DIRECTOR_ID
```

**Update a director** (send only the fields you want to change)
```
PATCH http://localhost:3000/directors/DIRECTOR_ID
Headers: Content-Type: application/json
```
```json
{ "age": 55 }
```

**Delete a director** (their movies are deleted too)
```
DELETE http://localhost:3000/directors/DIRECTOR_ID
```
→ `200 OK`
```json
{ "message": "director and related movies deleted successfully", "deletedMoviesCount": 2, "data": { ... } }
```

### Movies

**Create a movie: the director id goes in the HEADER**
```
POST http://localhost:3000/movies
Headers:
  Content-Type: application/json
  X-Director-Id: DIRECTOR_ID
```
```json
{
  "title": "Inception",
  "releaseYear": 2010,
  "genre": "Sci-Fi",
  "duration": 148
}
```
In Postman, open the **Headers** tab, type `X-Director-Id` as the Key and paste the director's `_id` as the Value.

→ `201 Created` (the `director` field is already populated)
```json
{
  "message": "movie created successfully",
  "data": {
    "_id": "6660...",
    "title": "Inception",
    "releaseYear": 2010,
    "genre": "Sci-Fi",
    "duration": 148,
    "director": { "_id": "665f...", "name": "Christopher Nolan", "...": "..." }
  }
}
```

Errors you can try:
- no `X-Director-Id` header → `400 { "message": "X-Director-Id header is required" }`
- `X-Director-Id: abc` → `400` (invalid ObjectId)
- `X-Director-Id: 000000000000000000000000` → `404 director not found`
- body without `genre` → `400 { "message": "required fields are missing", "missingFields": ["genre"] }`

**Get all movies** (each movie's `director` is a full director object)
```
GET http://localhost:3000/movies
```

**Get one movie**
```
GET http://localhost:3000/movies/MOVIE_ID
```

**Update a movie**
```
PATCH http://localhost:3000/movies/MOVIE_ID
Headers: Content-Type: application/json
```
```json
{ "duration": 150 }
```

**Change a movie's director** (both directors' `movies` arrays are updated)
```
PATCH http://localhost:3000/movies/MOVIE_ID
Headers:
  Content-Type: application/json
  X-Director-Id: NEW_DIRECTOR_ID
```
Body can be empty `{}` or contain other fields to update at the same time.
(Sending `"director": "NEW_DIRECTOR_ID"` in the body also works.)

**Delete a movie** (its id is removed from the director's `movies` array)
```
DELETE http://localhost:3000/movies/MOVIE_ID
```

---

### Testing the live version

Use the same requests, but replace `http://localhost:3000` with `https://movies-directors-api.vercel.app`.

---

## 4. Deployment (Vercel)

- `vercel.json` tells Vercel to run `server.js` with `@vercel/node` and send every URL to it.
- `server.js` exports `app`, and only calls `app.listen()` when it is NOT running on Vercel.
- The database is a free MongoDB Atlas cluster, added through Vercel's MongoDB Atlas integration. It creates the `MONGODB_URI` environment variable automatically, and `config/db.js` reads `MONGO_URI || MONGODB_URI`.
- The Vercel project is connected to this GitHub repo, so every `git push` to `main` deploys automatically.

---

## 5. How the relationship is kept in sync

| Action | What happens in the database |
|---|---|
| Create movie | `Movie.create(...)` then `$push` the movie id into `director.movies` |
| Delete movie | `Movie.findByIdAndDelete(...)` then `$pull` the id from `director.movies` |
| Change movie's director | `$pull` from the old director, `$addToSet` into the new one |
| Delete director | `Director.findByIdAndDelete(...)` then `Movie.deleteMany({ director: id })` so no orphan movies remain |
