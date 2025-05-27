//PACKAGES
const express = require("express");
const app = express();
const mongoose = require('mongoose');
const dotenv= require('dotenv');
const connectToDb = require('../config/db');
const jwt = require('jsonwebtoken');
const cookieParser= require('cookie-parser');
const bcrypt= require('bcrypt');
const { 
Student,
  CurrentProgram,
  Degree,
  Specialization,
  Category,
  SGPA,
  Address 
} = require('../model/Student/Student'); 
const router = express.Router();

router.post('/api/register-student', async (req, res) => {
  try {
    const {
      student_id,
      name,
      year,
      branch,
      gender,
      tenth_score,
      twelfth_score,
      father_name,
      current_semester,
      dob,
      current_status = true,
      addresses = [],
      categories = [],
      sgpa_records = [],
      current_program
    } = req.body;

    // Validate required fields
    if (!student_id || !name || !year || !branch) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: student_id, name, year, and branch are required'
      });
    }

    // Check if student already exists
    const existingStudent = await Student.findOne({ student_id });
    if (existingStudent) {
      return res.status(409).json({
        success: false,
        message: 'Student with this ID already exists'
      });
    }

    // Create new student
    const studentData = {
      student_id,
      name,
      year,
      branch,
      current_status
    };

    // Add optional fields if provided
    if (gender) studentData.gender = gender;
    if (tenth_score !== undefined) studentData.tenth_score = tenth_score;
    if (twelfth_score !== undefined) studentData.twelfth_score = twelfth_score;
    if (father_name) studentData.father_name = father_name;
    if (current_semester) studentData.current_semester = current_semester;
    if (dob) studentData.dob = new Date(dob);

    const newStudent = new Student(studentData);
    const savedStudent = await newStudent.save();

    // Handle addresses if provided
    if (addresses && addresses.length > 0) {
      const addressDocs = [];
      for (const addr of addresses) {
        const address = new Address({
          student: savedStudent._id,
          city: addr.city,
          state: addr.state,
          pincode: addr.pincode
        });
        const savedAddress = await address.save();
        addressDocs.push(savedAddress._id);
      }
      savedStudent.addresses = addressDocs;
    }

  // Handle categories if provided
    if (categories && categories.length > 0) {
      const categoryIds = [];
      
      for (const category of categories) {
        let categoryDoc;
        
        // Check if it's a valid ObjectId or a category name
        if (mongoose.Types.ObjectId.isValid(category)) {
          categoryDoc = await Category.findById(category);
        } else {
          // Treat as category name
          categoryDoc = await Category.findOne({ name: category });
        }
        
        if (!categoryDoc) {
          return res.status(400).json({
            success: false,
            message: `Category '${category}' not found. Please provide valid category names or ObjectIds.`
          });
        }
        
        categoryIds.push(categoryDoc._id);
      }
      
      savedStudent.categories = categoryIds;
    }

    // Handle SGPA records if provided
    if (sgpa_records && sgpa_records.length > 0) {
      const sgpaDocs = [];
      for (const sgpa of sgpa_records) {
        const sgpaRecord = new SGPA({
          student: savedStudent._id,
          sgpa: sgpa.sgpa,
          semester: sgpa.semester,
          last_updated: sgpa.last_updated ? new Date(sgpa.last_updated) : new Date()
        });
        const savedSGPA = await sgpaRecord.save();
        sgpaDocs.push(savedSGPA._id);
      }
      savedStudent.sgpa_records = sgpaDocs;
    }

    // Handle current program if provided
   if (current_program) {
      let degreeDoc, specializationDoc;
      
      // Handle degree - can be ObjectId or degree name
      if (mongoose.Types.ObjectId.isValid(current_program.program)) {
        degreeDoc = await Degree.findById(current_program.program);
      } else {
        degreeDoc = await Degree.findOne({ name: current_program.program });
      }
      
      if (!degreeDoc) {
        return res.status(400).json({
          success: false,
          message: `Degree '${current_program.program}' not found. Please provide valid degree name or ObjectId.`
        });
      }
      
      // Handle specialization if provided
      if (current_program.specialization) {
        if (mongoose.Types.ObjectId.isValid(current_program.specialization)) {
          specializationDoc = await Specialization.findById(current_program.specialization);
        } else {
          // Find by name or code
          specializationDoc = await Specialization.findOne({
            $or: [
              { name: current_program.specialization },
              { code: current_program.specialization }
            ]
          });
        }
        
        if (!specializationDoc) {
          return res.status(400).json({
            success: false,
            message: `Specialization '${current_program.specialization}' not found. Please provide valid specialization name, code, or ObjectId.`
          });
        }
      }

      const currentProgram = new CurrentProgram({
        student: savedStudent._id,
        program: degreeDoc._id,
        specialization: specializationDoc ? specializationDoc._id : undefined
      });
      const savedCurrentProgram = await currentProgram.save();
      savedStudent.current_program = savedCurrentProgram._id;
    }
    // Save student with all references
    await savedStudent.save();

    // Populate and return the complete student data
    const populatedStudent = await Student.findById(savedStudent._id)
      .populate('addresses')
      .populate('categories')
      .populate('sgpa_records')
      .populate({
        path: 'current_program',
        populate: [
          { path: 'program' },
          { path: 'specialization' }
        ]
      });

    res.status(201).json({
      success: true,
      message: 'Student registered successfully',
      data: populatedStudent
    });

  } catch (error) {
    console.error('Student registration error:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors
      });
    }

    // Handle duplicate key errors
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Student with this ID already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get all students rout
router.get('/students', async (req, res) => {
  try {
    const students = await Student.find()
      .populate('addresses')
      .populate('categories')
      .populate('sgpa_records')
      .populate({
        path: 'current_program',
        populate: [
          { path: 'program' },
          { path: 'specialization' }
        ]
      });

    res.json({
      success: true,
      data: students
    });
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching students',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get student by ID route (bonus) for future admin
router.get('/students/:student_id', async (req, res) => {
  try {
    const student = await Student.findOne({ student_id: req.params.student_id })
      .populate('addresses')
      .populate('categories')
      .populate('sgpa_records')
      .populate({
        path: 'current_program',
        populate: [
          { path: 'program' },
          { path: 'specialization' }
        ]
      });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    res.json({
      success: true,
      data: student
    });
  } catch (error) {
    console.error('Error fetching student:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching student',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});
// Seed database route (for development only)
router.post('/seed-database', async (req, res) => {
  try {
    // Clear existing data
    await Student.deleteMany({});
    await CurrentProgram.deleteMany({});
    await Degree.deleteMany({});
    await Specialization.deleteMany({});
    await Category.deleteMany({});
    await SGPA.deleteMany({});
    await Address.deleteMany({});

    // Create Categories
    const categories = await Category.create([
      { name: "General", description: "General category students" },
      { name: "OBC", description: "Other Backward Classes" },
      { name: "SC", description: "Scheduled Caste" },
      { name: "ST", description: "Scheduled Tribe" },
      { name: "EWS", description: "Economically Weaker Section" },
      { name: "Merit", description: "Merit-based category" },
      { name: "Sports", description: "Sports quota" }
    ]);

    // Create Degrees
    const ugDegrees = await Degree.create([
      { type: "UG", name: "Bachelor of Technology", description: "4-year undergraduate engineering program" },
      { type: "UG", name: "Bachelor of Science", description: "3-year undergraduate science program" },
      { type: "UG", name: "Bachelor of Computer Applications", description: "3-year undergraduate computer applications program" }
    ]);

    const pgDegrees = await Degree.create([
      { type: "PG", name: "Master of Technology", description: "2-year postgraduate engineering program" },
      { type: "PG", name: "Master of Science", description: "2-year postgraduate science program" }
    ]);

    // Create Specializations
    const specializations = await Specialization.create([
      { degree: ugDegrees[0]._id, name: "Computer Science and Engineering", code: "CSE001", description: "Computer Science and Engineering" },
      { degree: ugDegrees[0]._id, name: "Electronics and Communication Engineering", code: "ECE001", description: "Electronics and Communication Engineering" },
      { degree: ugDegrees[0]._id, name: "Mechanical Engineering", code: "ME001", description: "Mechanical Engineering" },
      { degree: ugDegrees[1]._id, name: "Physics", code: "PHY001", description: "Physics specialization" },
      { degree: ugDegrees[1]._id, name: "Chemistry", code: "CHE001", description: "Chemistry specialization" },
      { degree: ugDegrees[2]._id, name: "Software Development", code: "SD001", description: "Software Development specialization" },
      { degree: pgDegrees[0]._id, name: "Computer Science", code: "CS002", description: "Computer Science specialization" },
      { degree: pgDegrees[0]._id, name: "Data Science", code: "DS001", description: "Data Science specialization" }
    ]);

    res.json({
      success: true,
      message: 'Database seeded successfully',
      data: {
        categories: categories.length,
        degrees: ugDegrees.length + pgDegrees.length,
        specializations: specializations.length,
        sample_data: {
          categories: categories.map(c => ({ name: c.name, id: c._id })),
          degrees: [...ugDegrees, ...pgDegrees].map(d => ({ name: d.name, type: d.type, id: d._id })),
          specializations: specializations.map(s => ({ name: s.name, code: s.code, id: s._id }))
        }
      }
    });

  } catch (error) {
    console.error('Error seeding database:', error);
    res.status(500).json({
      success: false,
      message: 'Error seeding database',
      error: error.message
    });
  }
});
module.exports = router;