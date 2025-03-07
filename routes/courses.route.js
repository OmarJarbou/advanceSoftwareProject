const express = require('express');
const router = express.Router(); // mini app (instead of app)

const coursesController = require('../controller/courses.controller.js');

const {validationSchema} = require('../middlewares/validationSchema.js');
const verifyToken = require('../middlewares/verifyToken.js');
const userRoles = require('../utilities/userRoles.js');
const allowedTo = require('../middlewares/allowedTo.js');

// CRUD (Create / Read / Update / Delete)

// dont make the naming of you apis complex like:
// /api/get-all-courses
// /api/get-course-by-id
// /api/add-new-course
// because:
// 1. it's not a good practice
// 2. it's not RESTful
// 3. it's not scalable
// 4. it's not maintainable
// 5. it's not easy to understand
// 6. it's not easy to use
// 7. it's not easy to test
// 8. it's not easy to document
// 9. it's not easy to debug
// 10. it's not easy to refactor
// instead, use simple and clear naming like:
// /courses


//Routes (Resources) and there handlers (callbacks - controllers)

router.route('/')
    // get all courses
    .get(coursesController.getAllCourses) // get: takes data from server to client
    // add new course: using request body
    .post(/*middlewares-handlers*/verifyToken, allowedTo(userRoles.ADMIN), validationSchema(), coursesController.addNewCourse); // post: takes data from client to server

router.route('/:id')
    // get single course
    .get(coursesController.getCourseByID)
    // update a course:
    .patch(validationSchema(), coursesController.updateCourse)// put: replaces the object you want to update with the new object // patch: update only one value (for example title of js or price of c++)
    // delete a course:
    .delete(verifyToken, allowedTo(userRoles.ADMIN) , coursesController.deleteCourse); // delete: removes the object you want to delete


module.exports = router;