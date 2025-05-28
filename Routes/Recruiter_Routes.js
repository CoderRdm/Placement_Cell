const express = require('express');
const router = express.Router();
const { Recruiter, InternshipPosting } = require('../model/Recruiter/Recruiter_model'); // Adjust path to your models

// POST route to create recruiter and internship posting
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
      // Internship posting details
      internship_title,
      internship_description,
      internship_location,
      internship_duration,
      internship_stipend,
      internship_start_date,
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

    // Create internship posting
    const internshipPosting = new InternshipPosting({
      recruiter_id: recruiter._id,
      title: internship_title,
      description: internship_description,
      location: internship_location,
      duration: internship_duration,
      stipend: internship_stipend,
      start_date: internship_start_date ? new Date(internship_start_date) : null,
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

    await internshipPosting.save();

    res.status(201).json({
      success: true,
      message: 'Internship posting created successfully',
      data: {
        recruiter_id: recruiter._id,
        internship_posting_id: internshipPosting._id
      }
    });

  } catch (error) {
    console.error('Error creating internship posting:', error);
    res.status(400).json({
      success: false,
      message: 'Error creating internship posting',
      error: error.message
    });
  }
});

// GET route to view all internship postings (for admin)
router.get('/admin/internship-postings', async (req, res) => {
  try {
    const internshipPostings = await InternshipPosting.find()
      .populate('recruiter_id', 'first_name last_name email company')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: internshipPostings.length,
      data: internshipPostings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching internship postings',
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

// GET route to view specific recruiter's internship postings
router.get('/recruiter/:recruiterId/internship-postings', async (req, res) => {
  try {
    const { recruiterId } = req.params;
    
    const internshipPostings = await InternshipPosting.find({ recruiter_id: recruiterId })
      .populate('recruiter_id', 'first_name last_name email company')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: internshipPostings.length,
      data: internshipPostings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching recruiter internship postings',
      error: error.message
    });
  }
});

// GET route to view internship posting details
router.get('/internship-posting/:internshipId', async (req, res) => {
  try {
    const { internshipId } = req.params;
    
    const internshipPosting = await InternshipPosting.findById(internshipId)
      .populate('recruiter_id', 'first_name last_name email phone company');

    if (!internshipPosting) {
      return res.status(404).json({
        success: false,
        message: 'Internship posting not found'
      });
    }

    res.json({
      success: true,
      data: internshipPosting
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching internship posting',
      error: error.message
    });
  }
});

// PUT route to update internship posting status
router.put('/internship-posting/:internshipId/status', async (req, res) => {
  try {
    const { internshipId } = req.params;
    const { status } = req.body;

    const validStatuses = ['draft', 'active', 'paused', 'closed', 'expired'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value'
      });
    }

    const internshipPosting = await InternshipPosting.findByIdAndUpdate(
      internshipId,
      { status },
      { new: true }
    ).populate('recruiter_id', 'first_name last_name email company');

    if (!internshipPosting) {
      return res.status(404).json({
        success: false,
        message: 'Internship posting not found'
      });
    }

    res.json({
      success: true,
      message: 'Internship posting status updated successfully',
      data: internshipPosting
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating internship posting status',
      error: error.message
    });
  }
});

// PUT route to update internship posting
router.put('/internship-posting/:internshipId', async (req, res) => {
  try {
    const { internshipId } = req.params;
    const {
      title,
      description,
      location,
      duration,
      stipend,
      start_date,
      min_cgpa,
      allowed_branches,
      academic_years,
      allowed_degrees,
      allowed_specializations,
      additional_requirements
    } = req.body;

    const updateData = {
      title,
      description,
      location,
      duration,
      stipend,
      start_date: start_date ? new Date(start_date) : null,
      requirements: {
        min_cgpa: parseFloat(min_cgpa),
        allowed_branches: Array.isArray(allowed_branches) ? allowed_branches : [allowed_branches],
        academic_years: Array.isArray(academic_years) ? academic_years.map(Number) : [Number(academic_years)],
        allowed_degrees: allowed_degrees ? (Array.isArray(allowed_degrees) ? allowed_degrees : [allowed_degrees]) : [],
        allowed_specializations: allowed_specializations ? (Array.isArray(allowed_specializations) ? allowed_specializations : [allowed_specializations]) : [],
        additional_requirements
      }
    };

    const internshipPosting = await InternshipPosting.findByIdAndUpdate(
      internshipId,
      updateData,
      { new: true, runValidators: true }
    ).populate('recruiter_id', 'first_name last_name email company');

    if (!internshipPosting) {
      return res.status(404).json({
        success: false,
        message: 'Internship posting not found'
      });
    }

    res.json({
      success: true,
      message: 'Internship posting updated successfully',
      data: internshipPosting
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating internship posting',
      error: error.message
    });
  }
});

// DELETE route to delete internship posting
router.delete('/internship-posting/:internshipId', async (req, res) => {
  try {
    const { internshipId } = req.params;
    
    const internshipPosting = await InternshipPosting.findByIdAndDelete(internshipId);

    if (!internshipPosting) {
      return res.status(404).json({
        success: false,
        message: 'Internship posting not found'
      });
    }

    res.json({
      success: true,
      message: 'Internship posting deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting internship posting',
      error: error.message
    });
  }
});

// GET route to search/filter internship postings
router.get('/internship-postings/search', async (req, res) => {
  try {
    const {
      location,
      min_cgpa,
      branch,
      duration,
      industry,
      status = 'active',
      page = 1,
      limit = 10,
      search
    } = req.query;

    // Build query object
    let query = { status };

    // Location filter
    if (location) {
      query.location = { $regex: location, $options: 'i' };
    }

    // CGPA filter
    if (min_cgpa) {
      query['requirements.min_cgpa'] = { $lte: parseFloat(min_cgpa) };
    }

    // Branch filter
    if (branch) {
      query['requirements.allowed_branches'] = { $in: [branch] };
    }

    // Duration filter
    if (duration) {
      query.duration = duration;
    }

    // Text search in title and description
    if (search) {
      query.$text = { $search: search };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const internshipPostings = await InternshipPosting.find(query)
      .populate('recruiter_id', 'first_name last_name email company')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await InternshipPosting.countDocuments(query);

    res.json({
      success: true,
      data: internshipPostings,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(total / parseInt(limit)),
        total_records: total,
        per_page: parseInt(limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error searching internship postings',
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
      degrees: ['BTech', 'MTech', 'BCA', 'MCA', 'BSc', 'MSc', 'PhD', 'Diploma', 'MBA'],
      durations: ['1 month', '2 months', '3 months', '4 months', '6 months', '12 months', 'Flexible'],
      academic_years: [1, 2, 3, 4],
      statuses: ['draft', 'active', 'paused', 'closed', 'expired']
    }
  });
});

module.exports = router;