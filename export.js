const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const mongoURI = 'mongodb+srv://omarjarbou2019:Mnioajilinipaibo%402004@learn-mongo-db.wbdtx.mongodb.net/codeZone?retryWrites=true&w=majority';

mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const collections = [
  'ControllingDonation',
  'DeliveryRequest',
  'Donation',
  'EmergencyCampaign',
  'Notification',
  'Orphan',
  'Orphanage',
  'Review',
  'Sponsorship',
  'SupportProgram',
  'SystemSettings',
  'User',
  'VolunteerApplication',
  'VolunteerRequest',
];

// إنشاء موديلات ديناميكية بدون سكيمات
const models = collections.reduce((acc, name) => {
  acc[name] = mongoose.model(name, new mongoose.Schema({}, { strict: false }));
  return acc;
}, {});

(async () => {
  for (const name of collections) {
    try {
      const data = await models[name].find().lean();
      const fileName = `${name.toLowerCase()}.json`;
      fs.writeFileSync(path.join(__dirname, fileName), JSON.stringify(data, null, 2));
      console.log(`✅ Exported ${name} to ${fileName}`);
    } catch (err) {
      console.error(`❌ Failed to export ${name}:`, err);
    }
  }

  mongoose.disconnect();
})();
