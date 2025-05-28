const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Company Model (Embedded in Recruiter)
const companySchema = new Schema({
  name: { type: String, required: true },
  address: String,
  website: { type: String, match: /^https?:\/\/.+/ },
  industry: { 
    type: String, 
    enum: ['Technology', 'Finance', 'Healthcare', 'Manufacturing', 'Retail', 'Education', 'Consulting', 'Media', 'Government', 'Non-profit', 'Other'],
    required: true 
  },
  description: { type: String, maxlength: 1000 }
});

// Recruiter Model
const recruiterSchema = new Schema({
  first_name: { type: String, required: true, maxlength: 50 },
  last_name: { type: String, required: true, maxlength: 50 },
  email: { 
    type: String, 
    required: true, 
    unique: true,
    match: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  },
  phone: { type: String, minlength: 10, maxlength: 15 },
  company: { type: companySchema, required: true }
}, { timestamps: true });

const Recruiter = mongoose.model('Recruiter', recruiterSchema);

// Requirements Model (Embedded in JobPosting)
const requirementsSchema = new Schema({
  min_cgpa: { type: Number, min: 0, max: 10, required: true },
  allowed_branches: {
    type: [String],
    enum: ['Computer Science', 'Information Technology', 'Electronics', 'Mechanical', 'Civil', 'Chemical', 'Electrical', 'Aerospace', 'Biotechnology', 'Mathematics', 'Physics', 'Other'],
    required: true,
    validate: [arrayLimit, 'At least one branch must be specified']
  },
  academic_years: {
    type: [Number],
    min: 1,
    max: 4,
    required: true,
    validate: [arrayLimit, 'At least one academic year must be specified']
  },
  allowed_degrees: {
    type: [String],
    enum: ['BTech', 'MTech', 'BCA', 'MCA', 'BSc', 'MSc', 'PhD', 'Diploma','MBA']
  },
  allowed_specializations: [String],
  additional_requirements: { type: String, maxlength: 500 }
});

function arrayLimit(val) {
  return val.length > 0;
}

// Job Posting Model
const jobPostingSchema = new Schema({
  recruiter_id: { type: Schema.Types.ObjectId, ref: 'Recruiter', required: true },
  title: { type: String, required: true, minlength: 5, maxlength: 100 },
  description: { type: String, required: true, minlength: 50, maxlength: 2000 },
  requirements: { type: requirementsSchema, required: true },
  location: { type: String, required: true, minlength: 2, maxlength: 100 },
  duration: { 
    type: String, 
    enum: ['1 month', '2 months', '3 months','4 months', '6 months', '12 months', 'Flexible']
  },
  stipend: { type: Number, min: 0 },
  start_date: Date,
  status: { 
    type: String, 
    enum: ['draft', 'active', 'paused', 'closed', 'expired'],
    required: true,
    default: 'draft'
  }
}, { timestamps: true });

// Add indexes for better performance
jobPostingSchema.index({ recruiter_id: 1 });
jobPostingSchema.index({ status: 1 });
jobPostingSchema.index({ location: 1 });
jobPostingSchema.index({ 'requirements.allowed_branches': 1 });
jobPostingSchema.index({ 'requirements.min_cgpa': 1 });
jobPostingSchema.index({ start_date: 1 });
jobPostingSchema.index({ title: 'text', description: 'text' });

const JobPosting = mongoose.model('JobPosting', jobPostingSchema);

// Internship Application Model
const internshipApplicationSchema = new Schema({
  job_posting_id: { type: Schema.Types.ObjectId, ref: 'JobPosting', required: true },
  student_id: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
  recruiter_id: { type: Schema.Types.ObjectId, ref: 'Recruiter', required: true },
  status: { 
    type: String, 
    enum: ['pending', 'under_review', 'shortlisted', 'accepted', 'rejected', 'withdrawn'],
    required: true,
    default: 'pending'
  },
  applied_date: { type: Date, required: true, default: Date.now },
  notes: { type: String, maxlength: 1000 }
}, { timestamps: true });

// Add compound indexes for common queries
internshipApplicationSchema.index({ job_posting_id: 1, status: 1 });
internshipApplicationSchema.index({ student_id: 1, status: 1 });
internshipApplicationSchema.index({ recruiter_id: 1, status: 1 });
internshipApplicationSchema.index({ applied_date: -1 });

// Ensure a student can apply only once per job posting
internshipApplicationSchema.index({ job_posting_id: 1, student_id: 1 }, { unique: true });

const InternshipApplication = mongoose.model('InternshipApplication', internshipApplicationSchema);

// Pre-save middleware to validate recruiter consistency in applications
internshipApplicationSchema.pre('save', async function(next) {
  if (this.isNew) {
    const jobPosting = await JobPosting.findById(this.job_posting_id);
    if (jobPosting && jobPosting.recruiter_id.toString() !== this.recruiter_id.toString()) {
      return next(new Error('Application recruiter_id must match job posting recruiter_id'));
    }
  }
  next();
});

module.exports = {
  Recruiter,
  JobPosting,
  InternshipApplication
};