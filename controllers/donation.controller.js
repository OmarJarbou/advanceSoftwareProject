const Donation = require("../models/donation.model.js");
const User = require("../models/user.model.js");
const Orphan = require("../models/orphan.model.js");
const Orphanage = require("../models/orphanage.model.js");
const asyncWrapper = require("../middlewares/asyncWrapper.js");
const appError = require("../utilities/appError.js");
const httpStatusText = require("../utilities/httpStatusText.js");
const SystemSettings = require("../models/systemSettings.model.js");
const ExcelJS = require("exceljs");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const calculateFees = async (amount) => {
  const settings = await SystemSettings.findOne();
  const feePercent = settings ? settings.transactionFeePercent : 5; // 5% كافتراضي
  const fee = Math.round(amount * (feePercent / 100));
  const net = amount - fee;
  return { fee, net };
};

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

//////// creat midical aid material 

const createMidicalMaterial = asyncWrapper(async (req, res, next) => {
  const { material, orphanage } = req.body;
  const donor = req.currentUser.id;
  
  if (!material || !donor) {
    return next(appError.create("Missing required fields", 400, httpStatusText.FAIL));
  }

  const donation = new Donation({
    donor,
    category: "Medical Aid",
    donationType: "Material",
    material,
    orphanage,
    status: "On Arrive",
    transactionId: "TEMP"
  });
   await Orphanage.findByIdAndUpdate(orphanage, { $push: { donations: donation._id } });
  await donation.save();

  res.status(201).json({
    status: httpStatusText.SUCCESS,
    message: "Medical Aid Material donation created successfully",
    data: { donation }
  });
});


/////// creat Education material 
const createEducationMaterial = asyncWrapper(async (req, res, next) => {
  const {material, orphanage } = req.body;
  const donor = req.currentUser.id;
  
  if (!material || !donor) {
    return next(appError.create("Missing required fields", 400, httpStatusText.FAIL));
  }

  const donation = new Donation({
    donor,
    category: "Education Support",
    donationType: "Material",
    material,
    orphanage,
    status: "On Arrive",
    transactionId: "TEMP"
  });
   await Orphanage.findByIdAndUpdate(orphanage, { $push: { donations: donation._id } });
  await donation.save();

  res.status(201).json({
    status: httpStatusText.SUCCESS,
    message: "Education Support Material donation created successfully",
    data: { donation }
  });
});

/////// creat General Food 
const createGeneralFood = asyncWrapper(async (req, res, next) => {
  const {food, orphanage } = req.body;
  const donor = req.currentUser.id;
  
  if (!food || !donor) {
    return next(appError.create("Missing required fields", 400, httpStatusText.FAIL));
  }

  const donation = new Donation({
    donor,
    category: "General Fund",
    donationType: "Food",
    food,
    orphanage,
    status: "On Arrive",
    transactionId: "TEMP"
  });
   await Orphanage.findByIdAndUpdate(orphanage, { $push: { donations: donation._id } });
  await donation.save();

  res.status(201).json({
    status: httpStatusText.SUCCESS,
    message: "General Fund Food donation created successfully",
    data: { donation }
  });
});

/////// creat General Clothes 
const createGeneralClothes = asyncWrapper(async (req, res, next) => {
  const {clothes, orphanage } = req.body;
  const donor = req.currentUser.id;
  
  if (!clothes || !donor) {
    return next(appError.create("Missing required fields", 400, httpStatusText.FAIL));
  }

  const donation = new Donation({
    donor,
    category: "General Fund",
    donationType: "Clothes",
    clothes,
    orphanage,
    status: "On Arrive",
    transactionId: "TEMP"
  });
   await Orphanage.findByIdAndUpdate(orphanage, { $push: { donations: donation._id } });
  await donation.save();

  res.status(201).json({
    status: httpStatusText.SUCCESS,
    message: "General Fund Clothes donation created successfully",
    data: { donation }
  });
});

const createDonationEducattionFinancial = asyncWrapper(async (req, res, next) => {
  const { amount, orphanage } = req.body;
  const donor = req.currentUser.id;
  const category = "Education Support";

  if (!donor || !amount) {
    return next(appError.create("Missing required fields", 400, httpStatusText.FAIL));
  }

  // ✅ احسب الخصم والمبلغ الصافي
  const { fee, net } = await calculateFees(amount);

  const donation = new Donation({
    donor,
    category,
    donationType: "Financial",
    amount,
    fee,
    netAmount: net,
    orphanage,
    status: "Pending",
    transactionId: "TEMP"
  });

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "usd",
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
      fee: fee.toString(),
      netAmount: net.toString(),
    },
    success_url: `${process.env.DOMAIN}/success`,
    cancel_url: `${process.env.DOMAIN}/cancel`,
  });

  await Orphanage.findByIdAndUpdate(orphanage, { $push: { donations: donation._id } });

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



/////general-financial 
const createDonationGeneralFinancial = asyncWrapper(async (req, res, next) => {
  const { amount, orphanage } = req.body;
  const donor = req.currentUser.id;
  const category = "General Fund";

  if (!donor || !amount) {
    return next(appError.create("Missing required fields", 400, httpStatusText.FAIL));
  }

  const { fee, net } = await calculateFees(amount);

  const donation = new Donation({
    donor,
    category,
    donationType: "Financial",
    amount,
    fee,
    netAmount: net,
    orphanage,
    status: "Pending",
    transactionId: "TEMP"
  });

  // Stripe Checkout
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "usd",
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
      fee: fee.toString(),
      netAmount: net.toString(),
    },
    success_url: `${process.env.DOMAIN}/success`,
    cancel_url: `${process.env.DOMAIN}/cancel`,
  });

  await Orphanage.findByIdAndUpdate(orphanage, { $push: { donations: donation._id } });

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



/////general-financial 
const createDonationMidicalFinancial = asyncWrapper(async (req, res, next) => {
  const { amount, orphanage } = req.body;
  const donor = req.currentUser.id;
  const category = "Medical Aid";

  if (!donor || !amount) {
    return next(appError.create("Missing required fields", 400, httpStatusText.FAIL));
  }

  // ✅ احسب الخصم والمبلغ الصافي
  const { fee, net } = await calculateFees(amount);

  const donation = new Donation({
    donor,
    category,
    donationType: "Financial",
    amount,
    fee,
    netAmount: net,
    orphanage,
    status: "Pending",
    transactionId: "TEMP"
  });

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "usd",
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
      fee: fee.toString(),
      netAmount: net.toString(),
    },
    success_url: `${process.env.DOMAIN}/success`,
    cancel_url: `${process.env.DOMAIN}/cancel`,
  });

  await Orphanage.findByIdAndUpdate(orphanage, { $push: { donations: donation._id } });

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




 const exportFeesReportExcel = asyncWrapper(async (req, res, next) => {
  const { startDate, endDate } = req.query;

  const filter = {
    donationType: "Financial",
    status: "Completed"
  };

  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate) filter.createdAt.$lte = new Date(endDate);
  }

  const donations = await Donation.find(filter)
    .populate("donor", "firstName lastName email")
    .populate("orphanage", "name");

  const settings = await SystemSettings.findOne();
  const feePercentage = settings?.transactionFeePercent || 0;

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Fees Report");

  worksheet.columns = [
    { header: "Donor Name", key: "donor", width: 25 },
    { header: "Donor Email", key: "email", width: 30 },
    { header: "Orphanage", key: "orphanage", width: 25 },
    { header: "Category", key: "category", width: 20 },
    { header: "Donation Status", key: "status", width: 15 },
    { header: "Amount ($)", key: "amount", width: 15 },
    { header: "Fee ($)", key: "fee", width: 15 },
    { header: "Net Amount ($)", key: "net", width: 15 },
    { header: "Transaction ID", key: "transactionId", width: 30 },
    { header: "Donation Date", key: "date", width: 20 }
  ];

  donations.forEach(d => {
    const fullName = `${d.donor?.firstName || ""} ${d.donor?.lastName || ""}`.trim() || "Unknown";
    worksheet.addRow({
      donor: fullName,
      email: d.donor?.email || "N/A",
      orphanage: d.orphanage?.name || "N/A",
      category: d.category || "N/A",
      status: d.status,
      amount: d.amount || 0,
      fee: d.fee || 0,
      net: d.netAmount || 0,
      transactionId: d.transactionId || "N/A",
      date: d.createdAt.toLocaleString()
    });
  });

  const totalAmount = donations.reduce((sum, d) => sum + (d.amount || 0), 0);
  const totalFees = donations.reduce((sum, d) => sum + (d.fee || 0), 0);
  const totalNet = donations.reduce((sum, d) => sum + (d.netAmount || 0), 0);

  worksheet.addRow([]);
  worksheet.addRow(["Total", "", "", "", "", totalAmount, totalFees, totalNet, "", ""]);
  worksheet.addRow(["Fee %", "", "", "", "", "", "", `${feePercentage}%`, "", ""]);

  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", `attachment; filename=fees-report-${Date.now()}.xlsx`);

  await workbook.xlsx.write(res);
  res.end();
});



const getDonationFinanceSummary = asyncWrapper(async (req, res, next) => {
  const settings = await SystemSettings.findOne();
  const feePercentage = settings?.transactionFeePercent || 0;

  const financialDonations = await Donation.find({ donationType: "Financial",
    status: "Completed"
   });

  const totalDonations = financialDonations.reduce((sum, d) => sum + (d.amount || 0), 0);
  const totalFees = financialDonations.reduce((sum, d) => sum + (d.fee || 0), 0);
  const totalNetAmount = financialDonations.reduce((sum, d) => sum + (d.netAmount || 0), 0);
  const totalTransactions = financialDonations.length;

  res.status(200).json({
    status: httpStatusText.SUCCESS,
    message: "Financial donation summary retrieved",
    data: {
      totalTransactions,
      totalDonations,
      totalFees,
      totalNetAmount,
      feePercentage: `${feePercentage}%`
    }
  });
});



module.exports = {
  createDonationEducattionFinancial,//lama
  getAllDonations,
  getDonationsByOrphanage,
  getDonationDonor,
  getDonationById,
  createBooksDonation,
  createDonationGeneralFinancial,//lama
  createDonationMidicalFinancial,//lama
  createMidicalMaterial,
  createEducationMaterial,
  createGeneralFood,
  createGeneralClothes,
  exportFeesReportExcel,//lama
 getDonationFinanceSummary//lama
};
