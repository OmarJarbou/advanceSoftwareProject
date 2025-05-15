require('dotenv').config(); // config() by default finds .env file and load it into process.env
const express = require('express');
const cors = require('cors');
const httpStatusText = require('./utilities/httpStatusText.js');
const path = require('path');

const app = express();

app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // handle files (paths) invoking


const mongoose = require('mongoose');
const url = process.env.MONGO_URL; // sensitive data
mongoose.connect(url).then(() => {
    console.log('Connected to MongoDB');
});

app.use(cors());
app.use((req, res, next) => {
    if (req.originalUrl === "/webhooks/stripe") {
      next(); // Skip JSON parsing for Stripe webhook
    } else {
      express.json()(req, res, next);// tells express to handle json body comes to us
    }
});
   
//or:
// app.use(bodyParser.json()); // you have to install the middleware from internet first

const coursesRouter = require('./routes/courses.route.js');
const usersRouter = require('./routes/users.route.js');
const orphanageRouter = require("./routes/orphanages.route.js");
const orphansRouter = require("./routes/orphans.route.js");
const sponsorshipsRouter = require("./routes/sponsorships.route.js");
const handleWebhook = require("./routes/webhook.route.js");
const campaignRoutes = require("./routes/emergencyCampaign.route.js");
const volunteerApplicationsRoutes = require("./routes/volunteerApplications.route.js");
const orphanageVolunteerRequestsRoutes = require("./routes/orphanageVolunteerRequests.route.js");
const orphanageApplicationsRoutes= require("./routes/orphanageApplications.route.js");

require("./routes/sponsorshipCompletionJob.route.js");



// use router as middleware
// middleware1
app.use("/webhooks", handleWebhook);
app.use('/api/courses', coursesRouter); // any request comes on '/' it will go and handle it in coursesRouter
app.use('/api/users', usersRouter);
app.use("/api/orphanages", orphanageRouter);
app.use("/api/orphans", orphansRouter);
app.use('/api/sponsorships', sponsorshipsRouter);
 
app.use("/api/campaigns", campaignRoutes);

app.use("/api/orphanage/volunteer-requests", orphanageVolunteerRequestsRoutes);

//(volunteer + orphanage admin)
app.use("/api/volunteer/applications", volunteerApplicationsRoutes);
app.use("/api/orphanage/applications", orphanageApplicationsRoutes);


// wild card:
// middleware2 - global middleware for not found root 
app.all('*', (req, res, next) => {
    return res.status(404).json({ status: httpStatusText.ERROR, message: 'Route not found' });
}); // handle all/any url passed the router without being handled

// middleware3 - global error handler
app.use((err, req, res, next) => {
    return res.status(err.statusCode || 500).json({ status: err.statusText || httpStatusText.ERROR, data: null, message: /*"Invalid Object ID"*/ err.message, code: err.statusCode});
});

app.listen(process.env.PORT || 5000, () => {
    console.log('Server is running on port 5000');
});

// express is unopinionated (does not has fixed structure - controller, middlewares, routes,... as you want).8
// while nestjs is opinionated (fixed structure - it gives me: controller, module, service, main).

// see app.route() on express website:
// app.route('/book')
//   .get((req, res) => {
//     res.send('Get a random book')
//   })
//   .post((req, res) => {
//     res.send('Add a book')
//   })
//   .put((req, res) => {
//     res.send('Update the book')
// })