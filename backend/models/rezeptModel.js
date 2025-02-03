// /backend/models/rezeptModel.js
const mongoose = require('mongoose');

const zutatSchema = new mongoose.Schema({
  name: { type: String, required: true },
  menge: { type: Number, required: true, min: 1 },
  einheit: { type: String, required: true },
  preisProEinheit: { type: Number, required: true, min: 0 }
});

const rezeptSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  rezeptKategorien: [{ type: String, required: true }],
  zutaten: [zutatSchema],
  informationen: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

rezeptSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Rezept = mongoose.model('Rezept', rezeptSchema);

module.exports = Rezept;
