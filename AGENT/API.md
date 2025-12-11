# 📡 API Documentation

**Base URL:** `http://localhost:3001/api`

**Auth Header:** `Authorization: Bearer <jwt-token>`

---

## 📋 Quick Reference

### Endpoint Count by Module
- 🔐 Authentication: 4 endpoints
- 👥 Users: 3 endpoints
- 🤝 Trainer Matches: 7 endpoints
- 🏋️ Exercises: 6 endpoints
- 📋 Programs: 5 endpoints
- 📝 Program Exercises: 6 endpoints
- 📊 Workout Logs: 10 endpoints
- 🔧 Equipment: 8 endpoints
- 🏷️ Product Categories: 5 endpoints
- 🛒 Products: 7 endpoints
- 📦 Orders: 6 endpoints

**Total: 67 endpoints**

---

## 🔐 Authentication Module

### POST /auth/register
Create new user account.

**Access:** Public

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "5551234567",
  "roleId": "uuid",
  "gymId": "uuid"
}
```

**Response 201:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": { "name": "Student" },
      "gym": { "name": "Test Gym" }
    },
    "token": "jwt-access-token",
    "refreshToken": "jwt-refresh-token"
  }
}
```

---

### POST /auth/login
Login with credentials.

**Access:** Public

**Request:**
```json
{
  "email": "trainer@testgym.com",
  "password": "password123"
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "user": { "id", "email", "firstName", "lastName", "role", "gym" },
    "token": "jwt-access-token",
    "refreshToken": "jwt-refresh-token"
  }
}
```

---

### GET /auth/me
Get current user profile.

**Access:** Protected

**Headers:** `Authorization: Bearer <token>`

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "trainer@testgym.com",
    "firstName": "Jane",
    "lastName": "Smith",
    "role": {
      "id": "uuid",
      "name": "Trainer",
      "permissions": { "exercises": { "create": true, "read": true } }
    },
    "gym": {
      "id": "uuid",
      "name": "Test Gym",
      "address": "123 Main St"
    }
  }
}
```

---

### POST /auth/refresh
Refresh access token.

**Access:** Protected

**Request:**
```json
{
  "refreshToken": "jwt-refresh-token"
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "token": "new-jwt-access-token"
  }
}
```

---

## 👥 Users Module

### GET /users
List users with filtering.

**Access:** Protected (users.read)

**Query Params:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20, max: 100)
- `role` (string): Filter by role name (Student, Trainer, GymOwner)
- `search` (string): Search in firstName, lastName, email

**Response 200:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "email": "student@test.com",
        "firstName": "John",
        "lastName": "Doe",
        "phone": "5551234567",
        "role": { "name": "Student" },
        "hasPrivateTraining": true,
        "createdAt": "2025-12-01T10:00:00.000Z"
      }
    ],
    "pagination": {
      "total": 50,
      "page": 1,
      "limit": 20,
      "totalPages": 3
    }
  }
}
```

---

### GET /users/:id
Get single user by ID.

**Access:** Protected (users.read)

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "student@test.com",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "5551234567",
    "avatarUrl": null,
    "birthDate": "1995-05-15",
    "gender": "male",
    "role": { "id": "uuid", "name": "Student" },
    "gym": { "id": "uuid", "name": "Test Gym" },
    "createdAt": "2025-12-01T10:00:00.000Z"
  }
}
```

---

### PUT /users/:id
Update user.

**Access:** Protected (users.update)

**Request:**
```json
{
  "firstName": "Johnny",
  "lastName": "Doe",
  "phone": "5559876543",
  "birthDate": "1995-05-15",
  "gender": "male"
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "User updated successfully",
  "data": { /* updated user */ }
}
```

---

## 🤝 Trainer Matches Module

### POST /trainer-matches
Create trainer-student match.

**Access:** Protected (trainer_matches.create)

**Request:**
```json
{
  "trainerId": "uuid",
  "studentId": "uuid"
}
```

**Response 201:**
```json
{
  "success": true,
  "message": "Trainer-student match created successfully",
  "data": {
    "id": "uuid",
    "trainerId": "uuid",
    "studentId": "uuid",
    "status": "active",
    "trainer": { "id", "firstName", "lastName", "email" },
    "student": { "id", "firstName", "lastName", "email" },
    "createdAt": "2025-12-11T10:00:00.000Z"
  }
}
```

---

### GET /trainer-matches
List trainer-student matches.

**Access:** Protected (trainer_matches.read)

**Query Params:**
- `page`, `limit`: Pagination
- `status`: active | pending | ended
- `trainerId`: Filter by trainer UUID
- `studentId`: Filter by student UUID

**Response 200:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "trainerId": "uuid",
        "studentId": "uuid",
        "status": "active",
        "trainer": { "firstName", "lastName", "email" },
        "student": { "firstName", "lastName", "email" },
        "createdAt": "2025-12-11T10:00:00.000Z"
      }
    ],
    "pagination": { "total", "page", "limit", "totalPages" }
  }
}
```

---

### GET /trainer-matches/:id
Get single match by ID.

**Access:** Protected (trainer_matches.read)

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "active",
    "trainer": { "id", "firstName", "lastName", "email", "phone" },
    "student": { "id", "firstName", "lastName", "email", "phone", "birthDate" },
    "createdAt": "2025-12-11T10:00:00.000Z"
  }
}
```

---

### PATCH /trainer-matches/:id/status
Update match status.

**Access:** Protected (trainer_matches.update)

**Request:**
```json
{
  "status": "ended"
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Match status updated",
  "data": { /* updated match */ }
}
```

---

### DELETE /trainer-matches/:id
Delete match (soft delete).

**Access:** Protected (trainer_matches.delete)

**Response 200:**
```json
{
  "success": true,
  "message": "Match deleted successfully"
}
```

---

### GET /trainer-matches/my-students
**⭐ Trainer özel endpoint** - Kendi öğrencilerini detaylı listeler.

**Access:** Protected (Trainer role)

**Response 200:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "firstName": "John",
        "lastName": "Doe",
        "email": "john@test.com",
        "phone": "5551234567",
        "lastWorkoutDate": "2025-12-10T10:00:00.000Z",
        "assignedProgram": { "id": "uuid", "name": "Beginner Program" },
        "monthlyWorkouts": 12,
        "isActive": true,
        "latestMeasurement": { "weight": 75.5, "bodyFat": 15.2 },
        "matchedAt": "2025-11-01T10:00:00.000Z"
      }
    ],
    "stats": {
      "total": 10,
      "active": 8,
      "avgWorkoutsPerWeek": 2.8
    }
  }
}
```

---

### GET /trainer-matches/my-students/:studentId
Get detailed student info for trainer.

**Access:** Protected (Trainer role, must be matched)

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@test.com",
    "assignedProgram": { "id", "name", "difficultyLevel" },
    "workoutLogs": [ /* last 10 workouts */ ],
    "measurements": [ /* last 10 measurements */ ],
    "orders": [ /* recent orders */ ]
  }
}
```

---

## 🏋️ Exercises Module

### POST /exercises
Create exercise.

**Access:** Protected (exercises.create)

**Request:**
```json
{
  "name": "Bench Press",
  "description": "Flat barbell bench press",
  "targetMuscleGroup": "Chest",
  "videoUrl": "https://youtube.com/watch?v=xxx",
  "difficulty": "Intermediate",
  "equipment": "Barbell"
}
```

**Response 201:**
```json
{
  "success": true,
  "message": "Exercise created successfully",
  "data": {
    "id": "uuid",
    "name": "Bench Press",
    "description": "Flat barbell bench press",
    "targetMuscleGroup": "Chest",
    "videoUrl": "https://youtube.com/watch?v=xxx",
    "difficulty": "Intermediate",
    "equipment": "Barbell",
    "createdBy": "uuid",
    "creator": { "firstName": "Jane", "lastName": "Smith" },
    "createdAt": "2025-12-11T10:00:00.000Z"
  }
}
```

---

### GET /exercises
List exercises with filtering.

**Access:** Protected (exercises.read)

**Query Params:**
- `page`, `limit`: Pagination
- `search`: Search in name/description
- `targetMuscleGroup`: Filter by muscle (Chest, Back, Legs, etc.)
- `difficulty`: Beginner | Intermediate | Advanced
- `equipment`: Filter by equipment name

**Response 200:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "name": "Bench Press",
        "targetMuscleGroup": "Chest",
        "difficulty": "Intermediate",
        "equipment": "Barbell",
        "createdBy": "uuid",
        "creator": { "firstName", "lastName" }
      }
    ],
    "pagination": { "total", "page", "limit", "totalPages" }
  }
}
```

---

### GET /exercises/:id
Get single exercise.

**Access:** Protected (exercises.read)

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Bench Press",
    "description": "...",
    "videoUrl": "https://youtube.com/watch?v=xxx",
    "targetMuscleGroup": "Chest",
    "difficulty": "Intermediate",
    "equipment": "Barbell",
    "createdBy": "uuid",
    "creator": { "id", "firstName", "lastName", "email" },
    "createdAt": "2025-12-11T10:00:00.000Z"
  }
}
```

---

### PUT /exercises/:id
Update exercise.

**Access:** Protected (exercises.update + ownership check for Trainer)

**Request:** (all fields optional)
```json
{
  "name": "Incline Bench Press",
  "difficulty": "Advanced",
  "videoUrl": "https://youtube.com/watch?v=yyy"
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Exercise updated successfully",
  "data": { /* updated exercise */ }
}
```

---

### DELETE /exercises/:id
Delete exercise (soft delete).

**Access:** Protected (exercises.delete + ownership for Trainer)

**Response 200:**
```json
{
  "success": true,
  "message": "Exercise deleted successfully"
}
```

---

### GET /exercises/stats
Get exercise statistics.

**Access:** Protected (exercises.read)

**Response 200:**
```json
{
  "success": true,
  "data": {
    "total": 150,
    "byMuscleGroup": {
      "Chest": 25,
      "Back": 30,
      "Legs": 35,
      "Shoulders": 20,
      "Arms": 25,
      "Core": 15
    },
    "byDifficulty": {
      "Beginner": 50,
      "Intermediate": 70,
      "Advanced": 30
    }
  }
}
```

---

## 📋 Programs Module

### POST /programs
Create workout program.

**Access:** Protected (programs.create)

**Request:**
```json
{
  "name": "Beginner Full Body",
  "description": "3-day full body routine",
  "difficultyLevel": "Beginner",
  "durationWeeks": 8,
  "isPublic": false,
  "assignedUserId": "uuid"
}
```

**Response 201:**
```json
{
  "success": true,
  "message": "Program created successfully",
  "data": {
    "id": "uuid",
    "name": "Beginner Full Body",
    "description": "3-day full body routine",
    "difficultyLevel": "Beginner",
    "durationWeeks": 8,
    "isPublic": false,
    "creatorId": "uuid",
    "assignedUserId": "uuid",
    "creator": { "firstName", "lastName" },
    "assignedUser": { "firstName", "lastName" },
    "createdAt": "2025-12-11T10:00:00.000Z"
  }
}
```

---

### GET /programs
List programs with filtering.

**Access:** Protected (programs.read)

**Query Params:**
- `page`, `limit`: Pagination
- `search`: Search in name/description
- `difficultyLevel`: Beginner | Intermediate | Advanced
- `assignedUserId`: Filter by assigned user
- `creatorId`: Filter by creator

**⭐ Special Logic:**
- Users see: **own programs OR public programs**
- Query: `WHERE (creatorId = userId) OR (isPublic = true)`

**Response 200:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "name": "Beginner Full Body",
        "difficultyLevel": "Beginner",
        "isPublic": false,
        "creatorId": "uuid",
        "creator": { "firstName", "lastName" },
        "assignedUser": { "firstName", "lastName" },
        "_count": { "programExercises": 12 }
      }
    ],
    "pagination": { "total", "page", "limit", "totalPages" }
  }
}
```

---

### GET /programs/:id
Get program with exercises.

**Access:** Protected (programs.read)

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Beginner Full Body",
    "description": "...",
    "difficultyLevel": "Beginner",
    "isPublic": false,
    "creatorId": "uuid",
    "creator": { "firstName", "lastName" },
    "programExercises": [
      {
        "id": "uuid",
        "orderIndex": 1,
        "sets": 3,
        "reps": "10-12",
        "restTimeSeconds": 90,
        "notes": "Focus on form",
        "exercise": {
          "id": "uuid",
          "name": "Bench Press",
          "targetMuscleGroup": "Chest"
        }
      }
    ],
    "_count": { "workoutLogs": 25 }
  }
}
```

---

### PUT /programs/:id
Update program.

**Access:** Protected (programs.update + ownership for Trainer)

**Request:** (all fields optional)
```json
{
  "name": "Updated Program Name",
  "difficultyLevel": "Intermediate",
  "isPublic": true,
  "assignedUserId": "uuid"
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Program updated successfully",
  "data": { /* updated program */ }
}
```

---

### DELETE /programs/:id
Delete program (soft delete).

**Access:** Protected (programs.delete + ownership for Trainer)

**Response 200:**
```json
{
  "success": true,
  "message": "Program deleted successfully"
}
```

---

## 📝 Program Exercises Module

### POST /programs/:programId/exercises
Add exercise to program.

**Access:** Protected (programExercises.create)

**Request:**
```json
{
  "exerciseId": "uuid",
  "orderIndex": 1,
  "sets": 3,
  "reps": "10-12",
  "restTimeSeconds": 90,
  "notes": "Drop set on last set"
}
```

**Response 201:**
```json
{
  "success": true,
  "message": "Exercise added to program",
  "data": {
    "id": "uuid",
    "programId": "uuid",
    "exerciseId": "uuid",
    "orderIndex": 1,
    "sets": 3,
    "reps": "10-12",
    "restTimeSeconds": 90,
    "notes": "Drop set on last set",
    "exercise": {
      "name": "Bench Press",
      "targetMuscleGroup": "Chest"
    }
  }
}
```

---

### GET /programs/:programId/exercises
List exercises in program.

**Access:** Protected (programExercises.read)

**Response 200:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "orderIndex": 1,
        "sets": 3,
        "reps": "10-12",
        "restTimeSeconds": 90,
        "exercise": { "id", "name", "targetMuscleGroup" }
      }
    ]
  }
}
```

---

### GET /programs/:programId/exercises/:id
Get single program exercise.

**Access:** Protected (programExercises.read)

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "orderIndex": 1,
    "sets": 3,
    "reps": "10-12",
    "restTimeSeconds": 90,
    "notes": "Drop set on last set",
    "exercise": {
      "id": "uuid",
      "name": "Bench Press",
      "description": "...",
      "videoUrl": "...",
      "targetMuscleGroup": "Chest"
    }
  }
}
```

---

### PUT /programs/:programId/exercises/:id
Update program exercise.

**Access:** Protected (programExercises.update)

**Request:** (all fields optional)
```json
{
  "sets": 4,
  "reps": "8-10",
  "restTimeSeconds": 120,
  "notes": "Increase weight"
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Program exercise updated",
  "data": { /* updated program exercise */ }
}
```

---

### DELETE /programs/:programId/exercises/:id
Remove exercise from program.

**Access:** Protected (programExercises.delete)

**Response 200:**
```json
{
  "success": true,
  "message": "Exercise removed from program"
}
```

---

### POST /programs/:programId/exercises/reorder
Reorder exercises in program.

**Access:** Protected (programExercises.update)

**Request:**
```json
{
  "exercises": [
    { "id": "uuid1", "orderIndex": 1 },
    { "id": "uuid2", "orderIndex": 2 },
    { "id": "uuid3", "orderIndex": 3 }
  ]
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Exercises reordered successfully"
}
```

---

## 📊 Workout Logs Module

### POST /workout-logs/start
Start workout session.

**Access:** Protected (workoutLogs.create)

**Request:**
```json
{
  "programId": "uuid",
  "notes": "Feeling strong today!"
}
```

**Response 201:**
```json
{
  "success": true,
  "message": "Workout started",
  "data": {
    "id": "uuid",
    "userId": "uuid",
    "programId": "uuid",
    "startedAt": "2025-12-11T14:30:00.000Z",
    "endedAt": null,
    "notes": "Feeling strong today!",
    "program": { "id", "name", "difficultyLevel" }
  }
}
```

---

### PUT /workout-logs/:id/end
End workout session.

**Access:** Protected (workoutLogs.update)

**Request:**
```json
{
  "notes": "Great session!"
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Workout ended",
  "data": {
    "id": "uuid",
    "startedAt": "2025-12-11T14:30:00.000Z",
    "endedAt": "2025-12-11T15:45:00.000Z",
    "duration": 75,
    "notes": "Great session!",
    "_count": { "entries": 15 }
  }
}
```

---

### POST /workout-logs/:workoutLogId/sets
Log a set (during workout).

**Access:** Protected (workoutLogs.create)

**Request:**
```json
{
  "exerciseId": "uuid",
  "setNumber": 1,
  "weightKg": 60.0,
  "repsCompleted": 12,
  "rpe": 7
}
```

**Response 201:**
```json
{
  "success": true,
  "message": "Set logged",
  "data": {
    "id": "uuid",
    "workoutLogId": "uuid",
    "exerciseId": "uuid",
    "setNumber": 1,
    "weightKg": 60.0,
    "repsCompleted": 12,
    "rpe": 7,
    "exercise": { "name": "Bench Press" }
  }
}
```

---

### GET /workout-logs
List workout logs with filtering.

**Access:** Protected (workoutLogs.read)

**Query Params:**
- `page`, `limit`: Pagination
- `userId`: Filter by user
- `programId`: Filter by program
- `startDate`, `endDate`: Date range

**⭐ Special Logic for Trainer:**
- Trainers only see matched students' logs
- Query: `WHERE userId IN (SELECT studentId FROM trainer_matches WHERE trainerId = currentUserId)`

**Response 200:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "userId": "uuid",
        "user": { "firstName", "lastName" },
        "programId": "uuid",
        "program": { "name" },
        "startedAt": "2025-12-11T14:30:00.000Z",
        "endedAt": "2025-12-11T15:45:00.000Z",
        "_count": { "entries": 15 }
      }
    ],
    "pagination": { "total", "page", "limit", "totalPages" }
  }
}
```

---

### GET /workout-logs/:id
Get workout log with sets.

**Access:** Protected (workoutLogs.read)

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "userId": "uuid",
    "user": { "firstName", "lastName" },
    "program": { "id", "name", "difficultyLevel" },
    "startedAt": "2025-12-11T14:30:00.000Z",
    "endedAt": "2025-12-11T15:45:00.000Z",
    "notes": "Great session!",
    "entries": [
      {
        "id": "uuid",
        "exerciseId": "uuid",
        "exercise": { "name": "Bench Press" },
        "setNumber": 1,
        "weightKg": 60.0,
        "repsCompleted": 12,
        "rpe": 7
      }
    ]
  }
}
```

---

### GET /workout-logs/active
Get active (ongoing) workout for current user.

**Access:** Protected (workoutLogs.read)

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "startedAt": "2025-12-11T14:30:00.000Z",
    "endedAt": null,
    "program": { "id", "name" },
    "entries": [ /* logged sets so far */ ]
  }
}
```

**Response 404:**
```json
{
  "success": false,
  "message": "No active workout found"
}
```

---

### GET /workout-logs/stats
Get workout statistics.

**Access:** Protected (workoutLogs.read)

**Query Params:**
- `userId`: Target user (optional, defaults to current user)
- `startDate`, `endDate`: Date range

**Response 200:**
```json
{
  "success": true,
  "data": {
    "totalWorkouts": 45,
    "totalSets": 675,
    "totalVolume": 33750,
    "avgWorkoutsPerWeek": 3.2,
    "workoutsByMonth": [
      { "month": "2025-11", "count": 12 },
      { "month": "2025-12", "count": 15 }
    ],
    "topExercises": [
      { "exerciseName": "Bench Press", "count": 25 },
      { "exerciseName": "Squat", "count": 20 }
    ]
  }
}
```

---

### PUT /workout-logs/:workoutLogId/sets/:entryId
Update set entry.

**Access:** Protected (workoutLogs.update)

**Request:**
```json
{
  "weightKg": 62.5,
  "repsCompleted": 11,
  "rpe": 8
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Set updated",
  "data": { /* updated entry */ }
}
```

---

### DELETE /workout-logs/:workoutLogId/sets/:entryId
Delete set entry.

**Access:** Protected (workoutLogs.delete)

**Response 200:**
```json
{
  "success": true,
  "message": "Set deleted"
}
```

---

## 🔧 Equipment Module

### POST /equipment
Create equipment.

**Access:** Protected (equipment.create)

**Request:**
```json
{
  "name": "Leg Press Machine",
  "description": "45-degree leg press",
  "videoUrl": "https://youtube.com/watch?v=xxx",
  "status": "active"
}
```

**Response 201:**
```json
{
  "success": true,
  "message": "Equipment created",
  "data": {
    "id": "uuid",
    "name": "Leg Press Machine",
    "description": "45-degree leg press",
    "qrCodeUuid": "auto-generated-uuid",
    "videoUrl": "https://youtube.com/watch?v=xxx",
    "status": "active",
    "createdAt": "2025-12-11T10:00:00.000Z"
  }
}
```

---

### GET /equipment
List equipment with filtering.

**Access:** Protected (equipment.read)

**Query Params:**
- `page`, `limit`: Pagination
- `search`: Search in name/description
- `status`: active | maintenance | broken

**Response 200:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "name": "Leg Press Machine",
        "status": "active",
        "qrCodeUuid": "uuid"
      }
    ],
    "pagination": { "total", "page", "limit", "totalPages" }
  }
}
```

---

### GET /equipment/:id
Get equipment by ID.

**Access:** Protected (equipment.read)

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Leg Press Machine",
    "description": "45-degree leg press",
    "qrCodeUuid": "uuid",
    "videoUrl": "https://youtube.com/watch?v=xxx",
    "status": "active",
    "createdAt": "2025-12-11T10:00:00.000Z"
  }
}
```

---

### PUT /equipment/:id
Update equipment.

**Access:** Protected (equipment.update)

**Request:** (all fields optional)
```json
{
  "name": "Updated Name",
  "status": "maintenance",
  "videoUrl": "https://youtube.com/watch?v=yyy"
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Equipment updated",
  "data": { /* updated equipment */ }
}
```

---

### DELETE /equipment/:id
Delete equipment (soft delete).

**Access:** Protected (equipment.delete)

**Response 200:**
```json
{
  "success": true,
  "message": "Equipment deleted"
}
```

---

### GET /equipment/:id/qr-code
Generate QR code image for equipment.

**Access:** Protected (equipment.read)

**Response 200:**
```
Content-Type: image/png
[QR Code PNG Image]
```

---

### GET /equipment/qr/:qrCodeUuid
Get equipment by QR scan.

**Access:** Protected (equipment.read)

**⭐ Mobile App Endpoint** - Scan QR to get equipment video

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Leg Press Machine",
    "description": "45-degree leg press",
    "videoUrl": "https://youtube.com/watch?v=xxx",
    "status": "active"
  }
}
```

---

### GET /equipment/stats
Get equipment statistics.

**Access:** Protected (equipment.read)

**Response 200:**
```json
{
  "success": true,
  "data": {
    "total": 50,
    "byStatus": {
      "active": 45,
      "maintenance": 3,
      "broken": 2
    }
  }
}
```

---

## 🏷️ Product Categories Module

### POST /product-categories
Create category.

**Access:** Protected (productCategories.create)

**Request:**
```json
{
  "name": "Supplements",
  "imageUrl": "https://example.com/supplements.jpg"
}
```

**Response 201:**
```json
{
  "success": true,
  "message": "Category created",
  "data": {
    "id": "uuid",
    "name": "Supplements",
    "imageUrl": "https://example.com/supplements.jpg",
    "createdAt": "2025-12-11T10:00:00.000Z"
  }
}
```

---

### GET /product-categories
List all categories.

**Access:** Protected (productCategories.read)

**Response 200:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "name": "Supplements",
        "imageUrl": "https://example.com/supplements.jpg",
        "_count": { "products": 15 }
      }
    ]
  }
}
```

---

### GET /product-categories/:id
Get category by ID.

**Access:** Protected (productCategories.read)

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Supplements",
    "imageUrl": "https://example.com/supplements.jpg",
    "products": [
      { "id", "name", "price", "stockQuantity" }
    ]
  }
}
```

---

### PUT /product-categories/:id
Update category.

**Access:** Protected (productCategories.update)

**Request:**
```json
{
  "name": "Updated Category Name",
  "imageUrl": "https://example.com/new-image.jpg"
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Category updated",
  "data": { /* updated category */ }
}
```

---

### DELETE /product-categories/:id
Delete category (soft delete).

**Access:** Protected (productCategories.delete)

**Response 200:**
```json
{
  "success": true,
  "message": "Category deleted"
}
```

---

## 🛒 Products Module

### POST /products
Create product.

**Access:** Protected (products.create)

**Request:**
```json
{
  "categoryId": "uuid",
  "name": "Whey Protein",
  "description": "Premium whey protein powder",
  "imageUrl": "https://example.com/whey.jpg",
  "price": 350.00,
  "stockQuantity": 50,
  "isActive": true
}
```

**Response 201:**
```json
{
  "success": true,
  "message": "Product created",
  "data": {
    "id": "uuid",
    "categoryId": "uuid",
    "name": "Whey Protein",
    "description": "Premium whey protein powder",
    "imageUrl": "https://example.com/whey.jpg",
    "price": 350.00,
    "stockQuantity": 50,
    "isActive": true,
    "category": { "id", "name" },
    "createdAt": "2025-12-11T10:00:00.000Z"
  }
}
```

---

### GET /products
List products with filtering.

**Access:** Protected (products.read)

**Query Params:**
- `page`, `limit`: Pagination
- `search`: Search in name/description
- `categoryId`: Filter by category
- `isActive`: true | false

**Response 200:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "name": "Whey Protein",
        "price": 350.00,
        "stockQuantity": 50,
        "isActive": true,
        "category": { "name": "Supplements" },
        "imageUrl": "https://example.com/whey.jpg"
      }
    ],
    "pagination": { "total", "page", "limit", "totalPages" }
  }
}
```

---

### GET /products/:id
Get product by ID.

**Access:** Protected (products.read)

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "categoryId": "uuid",
    "category": { "id", "name" },
    "name": "Whey Protein",
    "description": "Premium whey protein powder",
    "imageUrl": "https://example.com/whey.jpg",
    "price": 350.00,
    "stockQuantity": 50,
    "isActive": true,
    "createdAt": "2025-12-11T10:00:00.000Z"
  }
}
```

---

### PUT /products/:id
Update product.

**Access:** Protected (products.update)

**Request:** (all fields optional)
```json
{
  "name": "Updated Product Name",
  "price": 375.00,
  "description": "Updated description"
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Product updated",
  "data": { /* updated product */ }
}
```

---

### PATCH /products/:id/stock
Update stock quantity.

**Access:** Protected (products.update)

**Request:**
```json
{
  "stockQuantity": 75
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Stock updated",
  "data": {
    "id": "uuid",
    "name": "Whey Protein",
    "stockQuantity": 75
  }
}
```

---

### PATCH /products/:id/toggle
Toggle active status.

**Access:** Protected (products.update)

**Response 200:**
```json
{
  "success": true,
  "message": "Product status toggled",
  "data": {
    "id": "uuid",
    "name": "Whey Protein",
    "isActive": false
  }
}
```

---

### DELETE /products/:id
Delete product (soft delete).

**Access:** Protected (products.delete)

**Response 200:**
```json
{
  "success": true,
  "message": "Product deleted"
}
```

---

## 📦 Orders Module

### POST /orders
Create order.

**Access:** Protected (orders.create)

**Request:**
```json
{
  "items": [
    { "productId": "uuid", "quantity": 2 },
    { "productId": "uuid", "quantity": 1 }
  ]
}
```

**Logic:**
- Auto-generate order number
- Calculate total from current product prices
- Freeze unit_price in order_items
- Set status to "pending_approval"
- Deduct stock quantity

**Response 201:**
```json
{
  "success": true,
  "message": "Order created successfully",
  "data": {
    "id": "uuid",
    "orderNumber": "ORD-2025-001234",
    "userId": "uuid",
    "user": { "firstName", "lastName" },
    "totalAmount": 1050.00,
    "status": "pending_approval",
    "items": [
      {
        "productId": "uuid",
        "product": { "name": "Whey Protein" },
        "quantity": 2,
        "unitPrice": 350.00
      }
    ],
    "createdAt": "2025-12-11T10:00:00.000Z"
  }
}
```

---

### GET /orders
List orders with filtering.

**Access:** Protected (orders.read)

**Query Params:**
- `page`, `limit`: Pagination
- `status`: pending_approval | prepared | completed | cancelled
- `userId`: Filter by user
- `startDate`, `endDate`: Date range

**⭐ Special Logic for Trainer:**
- Trainers only see matched students' orders
- Query: `WHERE userId IN (SELECT studentId FROM trainer_matches WHERE trainerId = currentUserId)`

**Response 200:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "orderNumber": "ORD-2025-001234",
        "userId": "uuid",
        "user": { "firstName", "lastName" },
        "totalAmount": 1050.00,
        "status": "pending_approval",
        "_count": { "items": 3 },
        "createdAt": "2025-12-11T10:00:00.000Z"
      }
    ],
    "pagination": { "total", "page", "limit", "totalPages" }
  }
}
```

---

### GET /orders/:id
Get order by ID with items.

**Access:** Protected (orders.read)

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "orderNumber": "ORD-2025-001234",
    "userId": "uuid",
    "user": { "firstName", "lastName", "email" },
    "totalAmount": 1050.00,
    "status": "pending_approval",
    "items": [
      {
        "id": "uuid",
        "productId": "uuid",
        "product": {
          "name": "Whey Protein",
          "imageUrl": "...",
          "currentPrice": 375.00
        },
        "quantity": 2,
        "unitPrice": 350.00
      }
    ],
    "createdAt": "2025-12-11T10:00:00.000Z",
    "updatedAt": "2025-12-11T10:00:00.000Z"
  }
}
```

---

### PATCH /orders/:id/status
Update order status.

**Access:** Protected (orders.update)

**Request:**
```json
{
  "status": "prepared"
}
```

**Status Flow:**
```
pending_approval → prepared → completed
       ↓
   cancelled (any time)
```

**Response 200:**
```json
{
  "success": true,
  "message": "Order status updated",
  "data": {
    "id": "uuid",
    "orderNumber": "ORD-2025-001234",
    "status": "prepared",
    "updatedAt": "2025-12-11T11:00:00.000Z"
  }
}
```

---

### DELETE /orders/:id
Cancel/delete order.

**Access:** Protected (orders.delete)

**Logic:**
- Can only cancel if status is "pending_approval"
- Restores stock quantity
- Sets status to "cancelled" (soft delete)

**Response 200:**
```json
{
  "success": true,
  "message": "Order cancelled successfully"
}
```

**Response 400:**
```json
{
  "success": false,
  "message": "Cannot cancel order that is already prepared/completed"
}
```

---

### GET /orders/stats
Get order statistics.

**Access:** Protected (orders.read)

**Query Params:**
- `startDate`, `endDate`: Date range

**Response 200:**
```json
{
  "success": true,
  "data": {
    "totalOrders": 156,
    "totalRevenue": 234500.00,
    "avgOrderValue": 1503.21,
    "ordersByStatus": {
      "pending_approval": 12,
      "prepared": 8,
      "completed": 130,
      "cancelled": 6
    },
    "ordersByMonth": [
      { "month": "2025-11", "count": 45, "revenue": 67500.00 },
      { "month": "2025-12", "count": 52, "revenue": 78000.00 }
    ],
    "topProducts": [
      { "productName": "Whey Protein", "quantitySold": 125, "revenue": 43750.00 }
    ]
  }
}
```

---

## 🔒 Error Responses

### 400 Bad Request - Validation Error
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    { "field": "email", "message": "Invalid email format" },
    { "field": "password", "message": "Password must be at least 6 characters" }
  ]
}
```

---

### 401 Unauthorized
```json
{
  "success": false,
  "message": "No authorization token provided"
}
```

OR

```json
{
  "success": false,
  "message": "Invalid or expired token"
}
```

---

### 403 Forbidden - Permission Denied
```json
{
  "success": false,
  "message": "You don't have permission to perform this action"
}
```

---

### 404 Not Found
```json
{
  "success": false,
  "message": "Resource not found"
}
```

---

### 409 Conflict - Duplicate
```json
{
  "success": false,
  "message": "Email already registered"
}
```

OR

```json
{
  "success": false,
  "message": "This trainer-student match already exists"
}
```

---

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "An unexpected error occurred"
}
```

---

## 📊 Pagination Format

All list endpoints return:

```json
{
  "success": true,
  "data": {
    "items": [ /* array of items */ ],
    "pagination": {
      "total": 150,
      "page": 2,
      "limit": 20,
      "totalPages": 8
    }
  }
}
```

**Defaults:**
- `page`: 1
- `limit`: 20
- `max limit`: 100

---

## 🔑 Permission Matrix

| Resource | Student | Trainer | GymOwner |
|----------|---------|---------|----------|
| exercises.create | ❌ | ✅ | ✅ |
| exercises.read | ✅ | ✅ | ✅ |
| exercises.update | ❌ | ✅ (own) | ✅ (all) |
| exercises.delete | ❌ | ✅ (own) | ✅ (all) |
| programs.create | ❌ | ✅ | ✅ |
| programs.read | ✅ | ✅ | ✅ |
| programs.update | ❌ | ✅ (own) | ✅ (all) |
| programs.delete | ❌ | ✅ (own) | ✅ (all) |
| workoutLogs.create | ✅ (own) | ❌ | ❌ |
| workoutLogs.read | ✅ (own) | ✅ (students) | ✅ (all) |
| equipment.create | ❌ | ✅ | ✅ |
| equipment.read | ✅ | ✅ | ✅ |
| equipment.update | ❌ | ✅ | ✅ |
| equipment.delete | ❌ | ❌ | ✅ |
| products.create | ❌ | ✅ | ✅ |
| products.read | ✅ | ✅ | ✅ |
| products.update | ❌ | ✅ | ✅ |
| orders.create | ✅ | ❌ | ❌ |
| orders.read | ✅ (own) | ✅ (students) | ✅ (all) |
| orders.update | ❌ | ✅ | ✅ |
| orders.delete | ✅ (pending) | ❌ | ✅ |

---

## 🧪 Testing

**Test File:** `backend/test-full-system.js`

**Coverage:** 54/54 tests (100%)

**Test Users:**
```javascript
const ownerLogin = {
  email: 'owner@testgym.com',
  password: 'password123'
};

const trainerLogin = {
  email: 'trainer@testgym.com',
  password: 'password123'
};

const studentLogin = {
  email: 'student@testgym.com',
  password: 'password123'
};
```

---

**Last Updated:** 12 Aralık 2025
**Status:** ✅ 100% Complete & Tested
**API Version:** 1.0.0
