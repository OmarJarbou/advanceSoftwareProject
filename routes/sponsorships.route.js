const express = require("express");
const router = express.Router();
const sponsorshipController = require("../controllers/sponsorships.controller.js");
const verifyToken = require("../middlewares/verifyToken.js");
const allowedTo = require("../middlewares/allowedTo.js");
const userRoles = require("../utilities/userRoles.js");
const Sponsor = require("../models/user.model.js");

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

// Step 1: Create a Setup Intent & Generate Checkout URL
router.post("/setup-payment", verifyToken , allowedTo(userRoles.SPONSOR), async (req, res) => {
    try {
        console.log("setup");
        
        const sponsorId = req.currentUser.id; // Get sponsor ID from request

        // Fetch the sponsor from the database
        const sponsor = await Sponsor.findById(sponsorId);
        if (!sponsor) {
            return res.status(404).json({ message: "Sponsor not found" });
        }

        // Ensure the sponsor has a Stripe customer ID
        // if (!sponsor.stripeCustomerId) {
        //     return res.status(400).json({ message: "Sponsor does not have a Stripe customer ID" });
        // }
        //If the sponsor does not have a Stripe Customer ID, create one
        if (!sponsor.stripeCustomerId) {
            const customer = await stripe.customers.create({
            email: sponsor.email,
            name: sponsor.name,
            });

            sponsor.stripeCustomerId = customer.id;
            await sponsor.save();
        }

        // Create a Setup Intent (for saving payment method)
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            mode: "setup",
            customer: sponsor.stripeCustomerId,
            success_url: "https://yourapp.com/success",
            cancel_url: "https://yourapp.com/cancel",
        });

        res.json({ url: session.url }); // Send URL to frontend
    } catch (error) {
        console.error("Error creating Setup Intent:", error);
        res.status(500).json({ error: error.message });
    }
});

router.post("/attach-payment", verifyToken, allowedTo(userRoles.SPONSOR), async (req, res) => {
    try {
        const sponsorId = req.currentUser.id; // Get sponsor ID

        // Fetch the sponsor from the database
        const sponsor = await Sponsor.findById(sponsorId);
        if (!sponsor) {
            return res.status(404).json({ message: "Sponsor not found" });
        }

        // List payment methods for the customer
        const paymentMethods = await stripe.paymentMethods.list({
            customer: sponsor.stripeCustomerId,
            type: "card",
        });

        if (paymentMethods.data.length === 0) {
            return res.status(400).json({ message: "No payment method found" });
        }

        // Get the first payment method
        const paymentMethodId = paymentMethods.data[0].id;

        // Attach the payment method to the customer
        await stripe.paymentMethods.attach(paymentMethodId, {
            customer: sponsor.stripeCustomerId,
        });

        // Set as default payment method
        await stripe.customers.update(sponsor.stripeCustomerId, {
            invoice_settings: { default_payment_method: paymentMethodId },
        });

        res.json({ message: "Payment method attached successfully" });
    } catch (error) {
        console.error("Error attaching payment method:", error);
        res.status(500).json({ error: error.message });
    }
});

router
    .route("/:orphanageid")
    .post(verifyToken, allowedTo(userRoles.SPONSOR), sponsorshipController.createSponsorship);

module.exports = router;