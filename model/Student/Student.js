const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Student Model
const studentSchema = new Schema({
  student_id: { type: String, unique: true, required: true },
  name: { type: String, required: true },
  year: { type: Number, required: true },
  branch: { type: String, required: true },
  gender: { type: String, enum: ['Male', 'Female', 'Other'] },
  tenth_score: { type: Number, min: 0, max: 100 },
  twelfth_score: { type: Number, min: 0, max: 100 },
  father_name: String,
  current_semester: { type: Number, min: 1, max: 8 },
  dob: Date,
  current_status: { type: Boolean, default: true },
  addresses: [{ type: Schema.Types.ObjectId, ref: 'Address' }],
  categories: [{ type: Schema.Types.ObjectId, ref: 'Category' }],
  sgpa_records: [{ type: Schema.Types.ObjectId, ref: 'SGPA' }],
  current_program: { type: Schema.Types.ObjectId, ref: 'CurrentProgram' }
}, { timestamps: true });

const Student = mongoose.model('Student', studentSchema);

// Current Program Model
const currentProgramSchema = new Schema({
  student: { type: Schema.Types.ObjectId, ref: 'Student', unique: true },
  program: { type: Schema.Types.ObjectId, ref: 'Degree' },
  specialization: { type: Schema.Types.ObjectId, ref: 'Specialization' }
});

const CurrentProgram = mongoose.model('CurrentProgram', currentProgramSchema);

// Degree Model
const degreeSchema = new Schema({
  type: { type: String, enum: ['UG', 'PG'], required: true },
  name: { type: String, required: true, unique: true },
  description: String,
  specializations: [{ type: Schema.Types.ObjectId, ref: 'Specialization' }]
});

const Degree = mongoose.model('Degree', degreeSchema);

// Specialization Model
const specializationSchema = new Schema({
  degree: { type: Schema.Types.ObjectId, ref: 'Degree', required: true },
  name: { type: String, required: true },
  description: String,
  code: { type: String, required: true, unique: true }
});

const Specialization = mongoose.model('Specialization', specializationSchema);

// Category Model
const categorySchema = new Schema({
  name: { type: String, required: true, unique: true },
  description: String
});

const Category = mongoose.model('Category', categorySchema);

// SGPA Model
const sgpaSchema = new Schema({
  student: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
  sgpa: { type: Number, min: 0, max: 10, required: true },
  semester: { type: Number, min: 1, max: 8, required: true },
  last_updated: { type: Date, default: Date.now }
});

const SGPA = mongoose.model('SGPA', sgpaSchema);

// Address Model
const addressSchema = new Schema({
  student: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
  city: String,
  state: String,
  pincode: String
});

const Address = mongoose.model('Address', addressSchema);

module.exports = {
  Student,
  CurrentProgram,
  Degree,
  Specialization,
  Category,
  SGPA,
  Address
};
