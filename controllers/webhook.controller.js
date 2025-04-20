const Sponsorship = require("../models/sponsorship.model.js");
const sponsorshipStatus = require("../utilities/sponsorshipStatus.js");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const handleWebhook = async (req, res) => {
    let event;

    try {
        const sig = req.headers["stripe-signature"];
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
        // console.log("🔹 Full Webhook Event Payload:", JSON.stringify(event, null, 2)); // Log the full event
    } catch (err) {
        console.error("❌ Webhook error:", err.message);
        return res.status(400).send(`Webhook error: ${err.message}`);
    }

    try {
        switch (event.type) {
            case "invoice.payment_succeeded": {
                const successInvoice = event.data.object;
                console.log("🔹 Invoice Object:", successInvoice);
                const updated = await Sponsorship.findOneAndUpdate(
                    { subscriptionId: successInvoice.subscription },
                    { status: sponsorshipStatus.ACTIVE },
                    { new: true }
                );
                if (!updated) {
                    console.warn(`⚠️ No matching sponsorship found for subscription ID: ${successInvoice.subscription}`);
                } else {
                    console.log("✅ Sponsorship updated to ACTIVE:", updated);
                }
                break;
            }

            case "invoice.payment_failed": {
                const failedInvoice = event.data.object;
                const updated = await Sponsorship.findOneAndUpdate(
                    { subscriptionId: failedInvoice.subscription },
                    { status: sponsorshipStatus.FAILED }
                );
                if (!updated) {
                    console.warn(`⚠️ No matching sponsorship found for subscription ID: ${failedInvoice.subscription}`);
                }
                break;
            }

            case "customer.subscription.deleted": {
                const canceledSubscription = event.data.object;
                console.log("🔹 Subscription Deleted Event:", canceledSubscription.id);
            
                // Find the sponsorship record
                const sponsorship = await Sponsorship.findOne({ subscriptionId: canceledSubscription.id });
            
                if (!sponsorship) {
                    console.warn(`⚠️ No matching sponsorship found for subscription ID: ${canceledSubscription.id}`);
                    break;
                }
            
                // Check if today's date is after the planned endDate
                const today = new Date();
                const endDate = new Date(sponsorship.endDate);
            
                if (today >= endDate) {
                    sponsorship.status = sponsorshipStatus.COMPLETED;
                    console.log("✅ Sponsorship marked as COMPLETED:", sponsorship);
                } else {
                    sponsorship.status = sponsorshipStatus.CANCELED;
                    console.log("❌ Sponsorship marked as CANCELED before end date:", sponsorship);
                }
            
                await sponsorship.save();
                break;
            }
            

            // case "customer.subscription.deleted": {
            //     const canceledSubscription = event.data.object;
            //     const updated = await Sponsorship.findOneAndUpdate(
            //         { subscriptionId: canceledSubscription.id },
            //         { status: sponsorshipStatus.CANCELED }
            //     );
            //     if (!updated) {
            //         console.warn(`⚠️ No matching sponsorship found for subscription ID: ${canceledSubscription.id}`);
            //     }
            //     break;
            // }

            default:
                console.log(`ℹ️ Unhandled event type: ${event.type}`);
        }
    } catch (dbError) {
        console.error("❌ Database update error:", dbError);
        return res.status(500).send("Internal Server Error");
    }

    res.status(200).send("✅ Webhook received successfully");
};

module.exports = { handleWebhook };