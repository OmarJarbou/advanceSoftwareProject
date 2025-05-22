const express = require("express");
const webhookController = require("../controllers/webhook.controller.js");
const bodyParser = require("body-parser");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const router = express.Router();

// Stripe will send events when:

// A payment succeeds (mark sponsorship as ACTIVE).
// A payment fails (mark sponsorship as FAILED).
// The sponsor cancels the subscription (mark as CANCELED).

// Use raw body for Stripe Webhooks
router.post(
    "/stripe",
    express.raw({ type: "application/json" }), // This is required for Stripe webhooks
    webhookController.handleWebhook
  );

module.exports = router;
