const mongoose = require('mongoose');

const recipeSchema = new mongoose.Schema({
    name: String,
    ingredients: Array,
    allergens: Array,
    price: Number,
});

const daySchema = new mongoose.Schema({
    day: String,
    suppe: [recipeSchema],
    menue1: [recipeSchema],
    menue2: [recipeSchema],
    dessert: [recipeSchema],
    abendSuppe: [recipeSchema],
    milchspeise: [recipeSchema],
    normalkost: [recipeSchema],
});

const weekPlanSchema = new mongoose.Schema({
    year: Number,
    week: Number,
    days: [daySchema],
});

module.exports = mongoose.model('WeekPlan', weekPlanSchema);
