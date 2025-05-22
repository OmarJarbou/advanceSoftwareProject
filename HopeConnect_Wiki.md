
# 📘 HopeConnect Project Wiki

## 🧩 1. Project Overview
HopeConnect is a Node.js and MongoDB backend platform that supports orphaned children in Gaza through a reliable, scalable system. It enables:
- Orphan sponsorships (Stripe recurring payments)
- One-Time emergency or general donations (One-Time stripe transaction)
- Physical donations with pickup & delivery logistics
- Real-time driver tracking and mapping
- Transparency and trust via automated updates and verification

---

## ⚙️ 2. Technologies Used

| Category         | Tool / Tech                        |
|------------------|------------------------------------|
| Language         | JavaScript (Node.js)               |
| Framework        | Express.js                         |
| Database         | MongoDB (Mongoose ODM)             |
| Authentication   | JWT (JSON Web Token)               |
| File Uploads     | Multer                             |
| Payments         | Stripe API                         |
| Scheduler        | node-cron                          |
| Emails           | Nodemailer + Gmail SMTP            |
| Deployment/Test  | ngrok                              |
| Maps             | Leaflet.js + OSM                   |
| Excel sheets     | exceljs                            |
| Docs             | Postman                            |

---

## 🏗️ 3. Architecture

**Structure:**
- RESTful API: Modular structure (controllers, routes, models, middlewares)
- Role-Based Access Control: Middleware authorization for roles like ADMIN, ORPHANAGE_ADMIN, DRIVER, SPONSOR, etc.
- Centralized Error & Role Handling (Middlewares like allowedTo, asyncWrapper, ...)
- Job Scheduler: node-cron handles automatic expiration and Stripe subscription cleanup.
- Webhook Listener: Handles Stripe subscription events.

**Justification:** Secure, scalable, and ideal for cloud/container environments.

---

## 🗃️ 4. Database Schema Overview

- **users**: Roles include Donor, Sponsor, Driver, OrphanageAdmin, Volunteer, Admin
- **orphans**: Profile, health, education, photos
- **orphanages**: Info, linked orphans
- **sponsorships**: Stripe-linked recurring sponsorship
- **systemsettings**: Setting the fee percent (Operating fees) for all financial donations except those for emergency campaign (fee = zero)
- **donations**: General or campaign-linked
- **emergencycampaigns**: Targeted donation goal + expiration
- **deliveryrequests**: From donor to orphanage, with route
- **controllingdonations**: How orphanages or application get used by physical and financial donations
- **reviews**: All reviews for orphanages. 
- **volunteerrequests**: Volunteer request advertisement
- **volunteerapplications**:  Volunteers applications to volunteer requests.
- **supportprograms**: Trusted governmental humanitarian organizations that provides support to our application

Each schema includes timestamps, references, and validation logic.
IMPORTANT: We exported the database and added it to our github repo.
[Exported DataBase](database_exported)  

---

## 🔗 5. URI Structure

| Method | URI                                         | Description                               |
|--------|---------------------------------------------|-------------------------------------------|
| GET    | /api/users?limit=2&page=2                   | Get paginated list of users               |
| POST   | /api/users/register                         | Register new user                         |
| POST   | /api/users/login                            | Login user and get JWT token              |
| DELETE | /api/users                                  | Delete current user's profile             |
| PUT    | /api/users                                  | Update current user's profile             |
| DELETE | /api/users/{userId}                         | Delete user by ID                         |
| GET    | /api/users/temporary                        | Get all temporary users                   |
| PUT    | /api/users/AdministrationRequest/{userId}   | Review administration request (ACCEPT/REJECT) |
| GET    | /api/users/{userId}                         | Get user by ID                            |
| GET    | /api/orphans/all_orphans_of_current_orphanage/{orphanageId} | Get orphans of specific orphanage         |
| GET    | /api/orphans/{orphanageId}/{orphanId}       | Get orphan by ID within orphanage         |
| POST   | /api/orphans                                | Create new orphan record                  |
| PATCH  | /api/orphans/{orphanId}                     | Update orphan details                     |
| DELETE | /api/orphans/{orphanId}                     | Delete orphan by ID                       |
| GET    | /api/orphans?limit=2&page=1                 | Get all orphans with pagination           |
| GET    | /api/orphans/{orphanId}                     | Get orphan by ID                          |
| GET    | /api/orphans/{orphanId}/photos              | Get orphan's photos                       |
| GET    | /api/orphanages?limit=2&page=1              | Get all orphanages with pagination        |
| GET    | /api/orphanages/{orphanageId}               | Get orphanage by ID                       |
| POST   | /api/orphanages                             | Create new orphanage                      |
| PATCH  | /api/orphanages/{orphanageId}               | Update orphanage details                  |
| DELETE | /api/orphanages/{orphanageId}               | Delete orphanage by ID                    |
| PATCH  | /api/orphanages/{orphanageId}/approve       | Approve orphanage creation request        |
| PATCH  | /api/orphanages/{orphanageId}/reject        | Reject orphanage creation request         |
| POST   | /api/sponsorships/{orphanageId}             | Create new sponsorship                    |
| POST   | /api/sponsorships/setup-payment             | Setup payment method for sponsorship      |
| POST   | /api/sponsorships/attach-payment            | Attach payment method to user             |
| GET    | /api/volunteer/applications/orphanages      | Get all orphanages for volunteer applications |
| GET    | /api/volunteer/applications/requests        | Get all volunteer requests                |
| GET    | /api/volunteer/applications/service-types   | Get all available service types           |
| GET    | /api/volunteer/applications/volunteer-requests/orphanage/{orphanageId} | Get requests by orphanage ID              |
| GET    | /api/volunteer/applications/volunteer-requests/orphanage/{orphanageId}?serviceType={type} | Get requests by orphanage ID and service type |
| POST   | /api/volunteer/applications/apply/{requestId} | Apply for volunteer request               |
| GET    | /api/volunteer/applications/my-applications | Get volunteer applications associated with user |
| DELETE | /api/volunteer/applications/6825c55be7ea605a6d614611 | Delete a specific volunteer application   |
| GET    | /api/donations                              | Get list of donations                     |
| GET    | /api/donations/orphanage/67ccc69ad7fbcd19a9fc8ebc | Get donations made to a specific orphanage |
| GET    | /api/donations/mine                         | Get donations associated with authenticated user |
| GET    | /api/donations/682dfbe3dd6acbcb7c371f74     | Get details of a specific donation        |
| POST   | /api/donations/educational-support/books    | Submit book donations to an orphanage     |
| POST   | /api/donations/medical-aid/material         | Donate medical aid materials              |
| POST   | /api/donations/educational-support/financial | Donate financial aid for education        |
| POST   | /api/donations/general-fund/financial       | Donate financial aid to general fund      |
| POST   | /api/donations/medical-aid/financial        | Donate financial aid for medical purposes |
| POST   | /api/donations/educational-support/material | Donate educational support materials      |
| POST   | /api/donations/general-fund/food            | Donate food to general fund               |
| POST   | /api/donations/general-fund/clothes         | Donate clothes to general fund            |
| POST   | /api/campaigns                              | Create a new campaign                     |
| GET    | /api/campaigns                              | Get a list of all campaigns               |
| GET    | /api/campaigns/682c8532d0cc0c32c19ea6cd     | Get details of a specific campaign        |
| POST   | /api/campaigns/682e221b827b81f99f8930b5/donate | Donate to a specific campaign             |
| GET    | /api/campaigns/682c8532d0cc0c32c19ea6cd/donations | Get donations for a specific campaign     |
| GET    | /api/campaigns/682c8532d0cc0c32c19ea6cd/summary | Get summary of a specific campaign        |
| PUT    | /api/campaigns/682c8532d0cc0c32c19ea6cd     | Update a specific campaign                |
| DELETE | /api/campaigns/682e221b827b81f99f8930b5     | Delete a specific campaign                |
| POST   | /api/orphanage/volunteer-requests           | Create a volunteer request for an orphanage |
| PATCH  | /api/orphanage/volunteer-requests/68244904b552c2d0f6477ea2 | Update a specific volunteer request       |
| GET    | /api/orphanage/volunteer-requests/682e5389d4942a6063a00135 | Get details of a specific volunteer request |
| GET    | /api/orphanage/volunteer-requests           | Get all volunteer requests for orphanages |
| GET    | /api/orphanage/applications                 | Get all orphanage volunteer applications  |
| PATCH  | /api/orphanage/applications/682522d9289dfa0902c32d1e/approve | Approve a specific orphanage volunteer application |
| PATCH  | /api/orphanage/applications/6825c55be7ea605a6d614611/reject | Reject a specific orphanage volunteer application |
| DELETE | /api/orphanage/volunteer-requests/682e5702d4942a6063a00191 | Delete a specific volunteer request       |
| GET    | /api/orphanage/applications?serviceType=Teaching | Get applications filtered by service type "Teaching" |
| GET    | /api/orphanage/volunteer-requests/dashboard-summary | Get summary of volunteer requests         |
| POST   | /api/deliveryRequest                        | Create a delivery request                  |
| POST   | /api/deliveryRequest/claim/682eec6891938fd519d45eca | Claim a specific delivery request  |
| PATCH  | /api/deliveryRequest/682de16e9280be62cd6d0ccd/status | Update the status of a delivery request |
| GET    | /api/deliveryRequest/682eec6891938fd519d45eca | Get details of a specific delivery request |
| GET    | /api/deliveryRequest/my                     | Get delivery requests associated with user |
| PUT    | /api/deliveryRequest/drivers/location       | Update the location of a delivery driver   |
| GET    | /api/deliveryRequest/drivers/busy/locations | Get locations of busy delivery drivers     |
| POST   | /api/deliveryRequest/driver-route           | Generate driver route map link             |
| POST   | /api/controlling-donations/682b52fd4ac8a0729e5b864f/control | Create a donation control record |
| GET    | /api/controlling-donations/682e38ba4155cac1b46112ec | Get details of a specific donation control record |
| GET    | /api/controlling-donations/                 | Get all donation control records           |
| PATCH  | /api/controlling-donations/682e38ba4155cac1b46112ec | Update a specific donation control record |
| GET    | /api/dashboard/donor/control-records        | Get control records associated with the donor |
| GET    | /api/dashboard/donor/control-records/68264a5ac0de2c41085e0ccd | Get a specific control record for the donor |
| GET    | /api/dashboard/donor/summary                | Get donor dashboard summary                |
| POST   | /api/reviews/                               | Submit a review for an orphanage           |
| GET    | /api/reviews/orphanage                      | Get reviews for an orphanage               |
| GET    | /api/reviews/orphanage/67ccc69ad7fbcd19a9fc8ebc?sortBy=rating&order=desc	| Get sorted orphanage reviews |
| PATCH  | /api/reviews/682860669c20613903565a59       | Update a specific review                   |
| DELETE | /api/reviews/682860669c20613903565a59       | Delete a specific review                   |
| POST   | /api/settings/init                          | Initialize settings
| GET    | /api/donations/admin/financial-summary      | Retrieve financial summary for donations   |
| GET    | /api/donations/admin/export-fees	Export     | donation fees for financial tracking       |
| GET    | /api/settings                               | Retrieve current settings                  |
| PATCH  | /api/settings                               | Update settings                            |
| POST   | /api/support-programs/create                | Create a new support program               |
| GET    | /api/support-programs/                      | Retrieve all support programs              |
| GET    | /api/support-programs/6829975b1f33993308eb234d | Retrieve details of a specific support program |
| GET    | /api/support-programs/orphanage/67ccc69ad7fbcd19a9fc8ebc | Retrieve support programs for a specific orphanage |
| DELETE | /api/support-programs/68298fc0711c13c6b3ac0abe | Delete a specific support program       |

---

## 📘 6. Main Features Documentation

| # | Feature | Description |
|---|---------|-------------|
| 1 | **Users** | 
|    | 1.1 | User Registration: Users can register on the platform with their email and phone number and other information.
|    | 1.2 | User Login: Users can log in to their account using their email and password.
|    | 1.3 | User Profile: Users can view, edit and delete their profile information.
| 2 | **Orphanages** |
|    | 2.1 | Orphanage Registration: Orphanages can register BY THIER ORPHANAGE ADMIN (create orphanage).
|    | 2.2 | Orphanage Profile: ORPHANAGE ADMIN can view and edit his orphanage information.
|    | 2.3 | Orphanage Approve/Reject : By APP ADMIN.
| 3 | **Orphans** |
|    | 3.1 | Orphan Addition: ORPHANAGE ADMIN can add orphan to his orphanage by entering his information.
|    | 3.2 | Orphan Profile: ORPHANAGE ADMIN can view, edit and delete orphans profiles.
| 4 | **Payment Method** |
|    | 4.1 | Payment Method: Users can add their payment method (Credit/Debit/...).
|    | 4.2 | Payment Attach: Users can attach (confirm) their payment method so they can use it for payment sections (Sponsorship & Donation).
| 5# | **Sponsorships** | SPONSORs choose orphans & pay monthly/yearly. Status and records auto-updated via Stripe webhooks. |
| 6 | **Donation Management System** | DONORSs donate to orphanage or to our application with FINANCIAL (via Stripe) or PHYSICAL donation to different categories (general fund, educational, medical, ...). |
| 7 | **Volunteer Matching** | 
|    | 7.1 | Orphanages post requests.
|    | 7.2 | VOLUNTEERs apply to requests.
|    | 7.3 | Orphanages accept/reject these applications.
| 8# | **Emergency Campaigns** | 
|    | 8.1 | Orphanages create urgent campaigns with targets + expiration.
|    | 8.2 | DONORs can donate to these campaigns (via Stripe).
|    | 8.3 | Campaigns auto-expire (when reaching expiry date without achieving target) and auto-complete (when donations reaches or exceeds target).
| 9 | **Trust & Transparency** | Achieved By:
|    | 9.1 | Controlling completed donations by showing donors how we (orphanage or application) deal with it.
|    | 9.2 | Tracking of physical donations delivery by "status" and "mapping", and tracking the status of financial donations by "status"(pending, completed, cancled).
| 10# | **Logistics System** | Donors create delivery requests. Available drivers are emailed. First to claim is assigned. Tracking (by mapping) enabled. |
| 11 | **Revenue & Sustainability** | Currently no monetization. Future options: admin panel licensing, affiliate supply links, donor support tiers. |

#: Explained in details in the Demo.

---

## 🌐 7. External APIs

- **Stripe**: Recurring and one-time payments
- **Nodemailer**: Gmail SMTP
- **Leaflet**: Open-source map routing
- **Ngrok**: Expose localhost for webhook testing

---

## 📦 8. GitHub Repository

- Organized in:
  - `models/`
  - `controllers/`
  - `routes/`
  - `middlewares/`
  - `utilities/`
  - `jobs/`
  - `uploads/`
  - `public/` (HTML files for map/driver links)
  - `database_exported/`
- Includes `.env`, README
- Code versioned using `main` branch, and fully documented.

---

## ✅ 9. API Testing

All endpoints documented and tested in Postman.

🧪 [Postman Collection](nodejs-advanceSW-api.postman_collection.json)  
🧾 Each feature in this Wiki has a matching folder in Postman.
