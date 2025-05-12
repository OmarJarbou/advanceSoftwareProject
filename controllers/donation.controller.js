const Donation = require("../models/donation.model.js");
const User = require("../models/user.model.js");
const Orphan = require("../models/orphan.model.js");
const Orphanage = require("../models/orphanage.model.js");
const asyncWrapper = require("../middlewares/asyncWrapper.js");
const appError = require("../utilities/appError.js");
const httpStatusText = require("../utilities/httpStatusText.js");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const createBooksDonation = asyncWrapper(async (req, res, next) => {
  const { books, orphanage } = req.body;
  const donor = req.currentUser.id;
  
  if (!books || !donor) {
    return next(appError.create("Missing required fields", 400, httpStatusText.FAIL));
  }

  const donation = new Donation({
    donor,
    category: "Education Support",
    donationType: "Books",
    books,
    orphanage,
    status: "On Arrive",
    transactionId: "TEMP"
  });
   await Orphanage.findByIdAndUpdate(orphanage, { $push: { donations: donation._id } });
  await donation.save();

  res.status(201).json({
    status: httpStatusText.SUCCESS,
    message: "Books donation created successfully",
    data: { donation }
  });
});




const createDonationEducattionFinancial = asyncWrapper(async (req, res, next) => {

   const { amount, orphanage} = req.body;
  const donor = req.currentUser.id;

  // Basic validation
  if (!donor || !amount) {
    return next(appError.create("Missing required fields", 400, httpStatusText.FAIL));
  }

  // Create donation in DB based on the URL parameters
  const donation = new Donation({
    donor,
    category: "Education Support",  
    donationType: "Financial",
    amount,
    orphanage,
    status: "Pending",
    transactionId: "TEMP"  // Later updated with real transaction ID from payment gateway
  });


  // Create Stripe Checkout session
  const session = await stripe.checkout.sessions.create({
    
    payment_method_types: ["card"],
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "usd", // or dynamic based on user
          product_data: {
            name: `Donation - ${category}`,
          },
          unit_amount: amount * 100,
        },
        quantity: 1,
      },
    ],
    metadata: {
      donationId: donation._id.toString(),
    },
    success_url: `${process.env.DOMAIN}/success`,
    cancel_url: `${process.env.DOMAIN}/cancel`,
  });
  await Orphanage.findByIdAndUpdate(orphanage, { $push: { donations: donation._id } });
  // Update transaction ID temporarily with Stripe session ID
  donation.transactionId = session.payment_intent || session.id;
  await donation.save();

  res.status(201).json({
    status: httpStatusText.SUCCESS,
    message: "Donation session created successfully",
    data: {
      donationId: donation._id,
      checkoutUrl: session.url,
    },
  });
});

//////get all donations
const getAllDonations = asyncWrapper(async (req, res, next) => {
  const donations = await Donation.find();  

 
  if (!donations) {
    return next(appError.create("No donations found", 404, httpStatusText.FAIL));
  }

 
  return res.json({ status: httpStatusText.SUCCESS, data: { donations } });
});
//////////////get donation by ID 
const getDonationsByOrphanage = asyncWrapper(async (req, res, next) => {
  const { orphanageid } = req.params; 

  const donations = await Donation.find({ orphanage: orphanageid });

  if (!donations || donations.length === 0) {
    return next(appError.create("No donations found for this orphanage", 404, httpStatusText.FAIL));
  }

  return res.json({ status: httpStatusText.SUCCESS, data: { donations } });
});

// Get donations for the logged-in donor
// const getDonationsByDonor = asyncWrapper(async (req, res, next) => {
//   console.log("Current user:", req.currentUser);

//   const donor = req.currentUser.id; // Get the current logged-in user (donor)

//   //Find donations associated with the donor
//   const donations = await Donation.find({ donor: donor });

//   if (!donations || donations.length === 0) {
//     return next(appError.create("No donations found for this donor", 404, httpStatusText.FAIL));
//   }

//   return res.json({
//     status: httpStatusText.SUCCESS,
//     message: "Donations retrieved successfully",
//     data: { donations },
//   });
// });
// Get donations for the logged-in donor
const getDonationDonor = asyncWrapper(async (req, res, next) => {
  const donor = req.currentUser.id; // Get the current logged-in user (donor)

  // Find donations associated with the donor
  const donations = await Donation.find({ donor: donor }).populate("orphanage", "name location");

  if (!donations || donations.length === 0) {
    return next(appError.create("No donations found for this donor", 404, httpStatusText.FAIL));
  }

  return res.json({
    status: httpStatusText.SUCCESS,
    message: "Donations retrieved successfully",
    data: { donations },
  });
});

// Get a single donation by ID
const getDonationById = asyncWrapper(async (req, res, next) => {
  const { id } = req.params;  // استخراج الـ id من الـ params

  // البحث عن التبرع بناءً على الـ id
  const donation = await Donation.findById(id).populate("orphanage", "name location");

  if (!donation) {
    return next(appError.create("Donation not found", 404, httpStatusText.FAIL));
  }

  return res.json({
    status: httpStatusText.SUCCESS,
    message: "Donation retrieved successfully",
    data: { donation },
  });
});



module.exports = {
  createDonationEducattionFinancial,
  getAllDonations,
  getDonationsByOrphanage,
  getDonationDonor,
  getDonationById,
  createBooksDonation,
};
