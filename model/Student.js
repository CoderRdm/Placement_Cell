const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,           // Ensures 'name' must be present
        trim: true                // Removes leading/trailing spaces
    },
    age: {
        type: Number,
        min: 1,
        max: 150
    },
    email: {
        type: String,
        required: true,
        unique: true,             // Ensures no duplicate emails
        lowercase: true,          // Normalizes emails to lowercase
        match: [/^\S+@\S+\.\S+$/, 'Invalid email format'] // Basic email regex
    },
    course: {
        type: String,
        enum: ['CSE', 'ECE', 'EEE', 'ME', 'CE', 'IT'], // Restrict to certain courses
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Student = mongoose.model("Student", studentSchema);

module.exports = Student;
