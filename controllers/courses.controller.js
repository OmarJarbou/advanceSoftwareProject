// ../ => to move one step back in the path 
const { json } = require('express');
let Course = require('../models/course.model.js'); 
const httpStatusText = require('../utilities/httpStatusText.js');

const {validationResult} = require('express-validator');
const asyncWrapper = require('../middlewares/asyncWrapper.js');
const appError = require('../utilities/appError.js');

// Course.find(querryObject, projection);
// querryObject:
// Course.find({name: 'Math', price: 100}); //find me the course with name "math" and price 100
// Course.find({price: 100}); //find me the course with price 100
// Course.find({price: {$gt: 500}}); //find me the course with price > 500
// projection:
// Course.find({name: 'Math', price: 100}, {name: 1}); // 1 or true 
// means: find me the course with name "math" and price 100, and return only the name
// Course.find({name: 'Math', price: 100}, {__id: false}); // 0 or false
// means: find me the course with name "math" and price 100, and return all fields except the id field


const getAllCourses = asyncWrapper(
    async (req,res) => {
        const query = req.query; // to get the data in the url after '?'

        /* Pagination */
            // max number of elements in one page
            const limit = query.limit || 4; // means that default limit is 4 (if it not specified in the url)
            // current page
            const page = query.page || 1; // means that default page is 1 (if it not specified in the url)
            const skip = (page - 1) * limit; // skip the first ((page - 1) * limit) elements

            // get all courses from db using Course model 
            const courses = await Course.find({} /*return all*/, {__v: false}).limit(limit).skip(skip);
        /* Pagination */

        // res.send();
        return res.json({ status: httpStatusText.SUCCESS, data: {courses} });
    }
);

const getCourseByID = asyncWrapper(
    async (req, res, next) => { // the parameter feature(:id) is provided by express
        // const id = req.params.id; // req.params.id => taken from url (:id) => string
        // const course = courses.find((course) => course.id === parseInt(id));

        const course = await Course.findById(req.params.id);
        if(!course){
            // const error = new Error();
            // error.message = "course not found";
            // error.statusCode = 404;
            const error = appError.create("course not found", 400, httpStatusText.FAIL);
            return next(error);
            // return res.status(404).json({ status: httpStatusText.FAIL, data: {course: "course not found" /*or null*/} }); // return to stop executing func
        }
        return res.json({ status: httpStatusText.SUCCESS,data: {course} });
        
        // try{  
        // }
        // catch(err){
        //     return res.status(400).json({ status: httpStatusText.ERROR, data: null, message: "Invalid Object ID" /*or err.message*/, code: 400});
        // }
        
    }
);

const addNewCourse = asyncWrapper(
    async (req, res, next) => { 
        // // data validation
        // if(!req.body.name){
        //     return res.status(400).json({ message: 'Name is required' });
        // }
        // else if(!req.body.price){
        //     return res.status(400).json({ message: 'Price is required' });
        // }
        // // type validation
        // else if(typeof req.body.name !== 'string'){
        //     return res.status(400).json({ message: 'Name must be a string' });
        // }
        // else if(typeof req.body.price !== 'number'){
        //     return res.status(400).json({ message: 'Price must be a number' });
        // }

        // or using express validator (in post parameters above) or joi js or zod dev
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            // const error = new Error();
            // error.message = "Invalid request data";
            // error.statusCode = 400;
            const error = appError.create(errors.array(), 400, httpStatusText.FAIL);
            return next(error);
            // return res.status(400).json({ status: httpStatusText.FAIL, data: {errors: errors.array()} });
        }


        const newCourse = new Course(req.body);
        await newCourse.save();

        //       created
        res.status(201).json({ status: httpStatusText.SUCCESS, data: {course: newCourse} });

        // const newCourse = {
        //     id: courses.length + 1,
        //     name: req.body.name, // cant be accessed(undefined) without bodyparser middleware
        //     price: req.body.price // cant be accessed(undefined) without bodyparser middleware
        //     // or
        //     // ...req.body // (put all body info)
        // };
        // courses.push(newCourse);
    }
);

const updateCourse = asyncWrapper( 
    async (req, res) => {
        // id is a parameter
        const id = req.params.id;
        // let course = courses.find((course) => course.id === parseInt(id));

        
            // const course = await Course.findByIdAndUpdate(id, {$set: {...req.body}});// returns the found document - not the updated - then update it
            const updatedCourse = await Course.updateOne({_id: id}, {$set: {...req.body}});

            // if(!course){
            //     return res.status(404).json({ message: 'Course not found' }); // return to stop executing func
            // }
            // course = {
            //     ...course, // spread operator (put old course values)
            //     ...req.body // (put new values - overrides (merging) the old ones)
            // }
            // courses[id - 1] = course;

            return res.status(200).json({ status: httpStatusText.SUCCESS, data: {course: updatedCourse} });

        // try{
        // }
        // catch(err){
        //     return res.status(400).json({ status: httpStatusText.ERROR, data: null, message: err.message, code: 400 });
        // }
    }
);

const deleteCourse = asyncWrapper(
    async (req, res) => {
    const id = req.params.id;
    // let course = courses.find((course) => course.id === parseInt(id));

        
            await Course.deleteOne({_id: id});

            // if(!course){
            //     return res.status(404).json({ message: 'Course not found' });
            // }
            // courses.splice(id - 1, 1); // or
            // //courses = courses.filter((course) => course.id !== parseInt(id)); // return all courses that thier ids != deleted course id
            
            // // fixing ids of courses array:
            // courses.forEach((course, index) => {
            //     course.id = index + 1;
            // });

            return res.status(200).json({ success: httpStatusText.SUCCESS, data: null });
        // try{
        // }
        // catch(err){
        //     return res.status(400).json({ status: httpStatusText.ERROR, data: null, message: err.message, code: 400 });
        // }
    }
);

module.exports = {
    getAllCourses,
    getCourseByID,
    addNewCourse,
    updateCourse,
    deleteCourse
};