const express = require('express');
const router = express.Router();
const { Recruiter, JobPosting } = require('../model/Recruiter/Recruiter_model'); // Adjust path to your models

// POST route to create recruiter and job posting
router.post('/recruiter/submit', async (req, res) => {
  try {
    const {
      // Recruiter details
      first_name,
      last_name,
      email,
      phone,
      // Company details
      company_name,
      company_address,
      company_website,
      company_industry,
      company_description,
      // Job posting details
      job_title,
      job_description,
      job_location,
      job_duration,
      job_stipend,
      job_start_date,
      // Requirements
      min_cgpa,
      allowed_branches,
      academic_years,
      allowed_degrees,
      allowed_specializations,
      additional_requirements
    } = req.body;

    // Create or find recruiter
    let recruiter = await Recruiter.findOne({ email });
    
    if (!recruiter) {
      recruiter = new Recruiter({
        first_name,
        last_name,
        email,
        phone,
        company: {
          name: company_name,
          address: company_address,
          website: company_website,
          industry: company_industry,
          description: company_description
        }
      });
      await recruiter.save();
    }

    // Create job posting
    const jobPosting = new JobPosting({
      recruiter_id: recruiter._id,
      title: job_title,
      description: job_description,
      location: job_location,
      duration: job_duration,
      stipend: job_stipend,
      start_date: job_start_date ? new Date(job_start_date) : null,
      status: 'active',
      requirements: {
        min_cgpa: parseFloat(min_cgpa),
        allowed_branches: Array.isArray(allowed_branches) ? allowed_branches : [allowed_branches],
        academic_years: Array.isArray(academic_years) ? academic_years.map(Number) : [Number(academic_years)],
        allowed_degrees: allowed_degrees ? (Array.isArray(allowed_degrees) ? allowed_degrees : [allowed_degrees]) : [],
        allowed_specializations: allowed_specializations ? (Array.isArray(allowed_specializations) ? allowed_specializations : [allowed_specializations]) : [],
        additional_requirements
      }
    });

    await jobPosting.save();

    res.status(201).json({
      success: true,
      message: 'Job posting created successfully',
      data: {
        recruiter_id: recruiter._id,
        job_posting_id: jobPosting._id
      }
    });

  } catch (error) {
    console.error('Error creating job posting:', error);
    res.status(400).json({
      success: false,
      message: 'Error creating job posting',
      error: error.message
    });
  }
});

// GET route to view all job postings (for admin)
router.get('/admin/job-postings', async (req, res) => {
  try {
    const jobPostings = await JobPosting.find()
      .populate('recruiter_id', 'first_name last_name email company')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: jobPostings.length,
      data: jobPostings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching job postings',
      error: error.message
    });
  }
});

// GET route to view all recruiters (for admin)
router.get('/admin/recruiters', async (req, res) => {
  try {
    const recruiters = await Recruiter.find().sort({ createdAt: -1 });

    res.json({
      success: true,
      count: recruiters.length,
      data: recruiters
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching recruiters',
      error: error.message
    });
  }
});

// GET route to view specific recruiter's job postings
router.get('/recruiter/:recruiterId/job-postings', async (req, res) => {
  try {
    const { recruiterId } = req.params;
    
    const jobPostings = await JobPosting.find({ recruiter_id: recruiterId })
      .populate('recruiter_id', 'first_name last_name email company')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: jobPostings.length,
      data: jobPostings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching recruiter job postings',
      error: error.message
    });
  }
});

// GET route to view job posting details
router.get('/job-posting/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    
    const jobPosting = await JobPosting.findById(jobId)
      .populate('recruiter_id', 'first_name last_name email phone company');

    if (!jobPosting) {
      return res.status(404).json({
        success: false,
        message: 'Job posting not found'
      });
    }

    res.json({
      success: true,
      data: jobPosting
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching job posting',
      error: error.message
    });
  }
});

// PUT route to update job posting status
router.put('/job-posting/:jobId/status', async (req, res) => {
  try {
    const { jobId } = req.params;
    const { status } = req.body;

    const validStatuses = ['draft', 'active', 'paused', 'closed', 'expired'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value'
      });
    }

    const jobPosting = await JobPosting.findByIdAndUpdate(
      jobId,
      { status },
      { new: true }
    ).populate('recruiter_id', 'first_name last_name email company');

    if (!jobPosting) {
      return res.status(404).json({
        success: false,
        message: 'Job posting not found'
      });
    }

    res.json({
      success: true,
      message: 'Job posting status updated successfully',
      data: jobPosting
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating job posting status',
      error: error.message
    });
  }
});

// GET route to get form options (for frontend dropdowns)
router.get('/form-options', (req, res) => {
  res.json({
    success: true,
    data: {
      industries: [
        'Technology', 'Finance', 'Healthcare', 'Manufacturing', 
        'Retail', 'Education', 'Consulting', 'Media', 
        'Government', 'Non-profit', 'Other'
      ],
      branches: [
        'Computer Science', 'Information Technology', 'Electronics', 
        'Mechanical', 'Civil', 'Chemical', 'Electrical', 'Aerospace', 
        'Biotechnology', 'Mathematics', 'Physics', 'Other'
      ],
      degrees: ['BTech', 'MTech', 'BCA', 'MCA', 'BSc', 'MSc', 'PhD', 'Diploma'],
      durations: ['1 month', '2 months', '3 months', '6 months', '12 months', 'Flexible'],
      academic_years: [1, 2, 3, 4]
    }
  });
});

module.exports = router;