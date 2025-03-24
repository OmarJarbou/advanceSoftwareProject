const mongoose = require("mongoose");
const Sponsorship = require("../models/sponsorship.model.js");
const User = require("../models/user.model.js");
const Orphan = require("../models/orphan.model.js");
const Orphanage = require("../models/orphanage.model.js");
const asyncWrapper = require("../middlewares/asyncWrapper.js");
const appError = require("../utilities/appError.js");
const httpStatusText = require("../utilities/httpStatusText.js");
const sponsorshipStatus = require("../utilities/sponsorshipStatus.js");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

// Create Sponsorship with Subscription
const createSponsorship = asyncWrapper(async (req, res, next) => {
    const { orphan, amount, currency, frequency, endDate } = req.body;
    const sponsor = req.currentUser.id;

    // Validate required fields
    if (!sponsor || !orphan || !amount || !currency || !frequency || !endDate) {
        return next(appError.create("Missing required fields", 400, httpStatusText.FAIL));
    }

    // Check if sponsor exists
    const sponsorExists = await User.findById(sponsor);
    if (!sponsorExists) {
        return next(appError.create("Sponsor not found", 404, httpStatusText.FAIL));
    }

    // Check if orphan exists
    const orphanExists = await Orphan.findById(orphan);
    if (!orphanExists) {
        return next(appError.create("Orphan not found", 404, httpStatusText.FAIL));
    }

    // Check orphanage existence
    const orphanageExists = await Orphanage.findById(orphanExists.orphanage);
    if (!orphanageExists) {
        return next(appError.create("Orphanage not found or does not match the orphan", 400, httpStatusText.FAIL));
    }

    // Ensure the sponsor has a Stripe customer ID
    if (!sponsorExists.stripeCustomerId) {
        return res.status(400).json({ message: "Sponsor does not have a Stripe customer ID" });
    }
    // If the sponsor does not have a Stripe Customer ID, create one
    // if (!sponsorExists.stripeCustomerId) {
    //     const customer = await stripe.customers.create({
    //     email: sponsorExists.email,
    //     name: sponsorExists.name,
    //     });

    //     sponsorExists.stripeCustomerId = customer.id;
    //     await sponsorExists.save();
    // }

    // Create a Stripe Subscription
    // const price = await stripe.prices.create({
    //     unit_amount: amount * 100, // Convert to cents
    //     currency: currency.toLowerCase(),
    //     recurring: { interval: frequency.toLowerCase() },
    //     product: process.env.STRIPE_PRODUCT_ID,
    // });

    console.log('hello');

    const subscription = await stripe.subscriptions.create({
        customer: sponsorExists.stripeCustomerId,
        items: [{ price: process.env.STRIPE_PRODUCT_PRICE_ID }],
        default_payment_method: sponsorExists.defaultPaymentMethodId, // Attach the saved card
        payment_behavior: "allow_incomplete",
        expand: ["latest_invoice.payment_intent"],
    });

    console.log('hi');

    // Check if payment_intent exists
    const paymentIntent = subscription.latest_invoice?.payment_intent;
    const nextActionUrl = paymentIntent?.next_action?.use_stripe_sdk?.stripe_js || null;

    // Create Sponsorship entry
    const sponsorship = new Sponsorship({
        sponsor: sponsor,
        orphan: orphan,
        amount: amount,
        currency: currency,
        frequency: frequency,
        endDate: endDate,
        status: sponsorshipStatus.PENDING,
        subscriptionId: subscription.id,
        latestInvoiceId: subscription.latest_invoice.id,
    });

    await sponsorship.save();

    res.status(201).json({
        status: httpStatusText.SUCCESS,
        message: "Sponsorship subscription created successfully",
        data: { sponsorship, subscriptionUrl: nextActionUrl }
    });
});

module.exports = { createSponsorship };