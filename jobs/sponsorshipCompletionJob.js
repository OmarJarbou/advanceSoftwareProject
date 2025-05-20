require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
console.log("Stripe Key:", process.env.STRIPE_SECRET_KEY); // Debug test
const mongoose = require("mongoose");
const cron = require("node-cron");
const moment = require("moment");
const Sponsorship = require("../models/sponsorship.model.js");
const sponsorshipStatus = require("../utilities/sponsorshipStatus.js");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const connectDB = async () => {
    if (mongoose.connection.readyState === 1) {
        console.log("✅ Already connected to MongoDB");
        return;
    }
    try {
        await mongoose.connect(process.env.MONGO_URL, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log("✅ MongoDB Connected!");
    } catch (err) {
        console.error("❌ MongoDB Connection Error:", err);
        process.exit(1);
    }
};

// Schedule the job to run every hour
cron.schedule("0 * * * *", async () => {
    console.log("🔄 Running sponsorship completion job...");

    await connectDB(); // Ensure MongoDB is connected before querying

    try {
        const today = moment().toDate();
        console.log(today);

        // Find all sponsorships where endDate has passed and status is still ACTIVE
        const expiredSponsorships = await Sponsorship.find({
            endDate: { $lt: today },
            status: sponsorshipStatus.ACTIVE
        });
        console.log("expired: " + expiredSponsorships);

        if (expiredSponsorships.length === 0) {
            console.log("✅ No expired sponsorships found.");
            return;
        }

        // Update the status to COMPLETED
        for (let sponsorship of expiredSponsorships) {

            console.log("CANCEL SUB");

            // Cancel the Stripe subscription
            if (sponsorship.subscriptionId) {
                try {
                    await stripe.subscriptions.cancel(sponsorship.subscriptionId);
                    console.log(`🔴 Stripe subscription ${sponsorship.subscriptionId} canceled.`);
                } catch (error) {
                    console.error(`❌ Failed to cancel Stripe subscription ${sponsorship.subscriptionId}:`, error);
                }
            }

            // Mark sponsorship as COMPLETED
            // sponsorship.status = sponsorshipStatus.COMPLETED;
            // await sponsorship.save();
            // console.log(`✔️ Sponsorship ${sponsorship._id} marked as COMPLETED.`);
            
            // TODO: Send notification/email to sponsor about completion
        }
        
    } catch (error) {
        console.error("❌ Error in sponsorship completion job:", error);
    }
});

module.exports = cron;
