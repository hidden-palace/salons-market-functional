const express = require('express');
const multer = require('multer');
const StorageService = require('../services/storage-service');
const SupabaseService = require('../services/supabase-client');

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 2 * 1024 * 1024 // 2MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/png', 'image/jpeg', 'image/svg+xml'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PNG, JPG, and SVG files are allowed.'));
    }
  }
});

// Initialize services
let storageService;
let supabaseService;

try {
  storageService = new StorageService();
  supabaseService = new SupabaseService();
} catch (error) {
  console.error('Failed to initialize storage services:', error.message);
}

/**
 * POST /storage/logo - Upload company logo
 */
router.post('/logo', upload.single('logo'), async (req, res, next) => {
  console.log('🔍 LOGO UPLOAD DEBUG: Route handler started');
  console.log('🔍 LOGO UPLOAD DEBUG: Request method:', req.method);
  console.log('🔍 LOGO UPLOAD DEBUG: Request headers:', req.headers);
  
  try {
    if (!storageService || !supabaseService) {
      console.error('❌ LOGO UPLOAD DEBUG: Services not initialized');
      return res.status(503).json({
        error: 'Service unavailable',
        details: 'Storage services are not properly configured.'
      });
    }

    if (!req.file) {
      console.error('❌ LOGO UPLOAD DEBUG: No file received from multer');
      console.error('❌ LOGO UPLOAD DEBUG: req.body:', req.body);
      console.error('❌ LOGO UPLOAD DEBUG: req.files:', req.files);
      return res.status(400).json({
        error: 'No file uploaded',
        details: 'Please select a logo file to upload.'
      });
    }

    console.log('📤 LOGO UPLOAD DEBUG: File received by multer:', {
      fieldname: req.file.fieldname,
      originalName: req.file.originalname,
      encoding: req.file.encoding,
      mimetype: req.file.mimetype,
      size: req.file.size,
      bufferLength: req.file.buffer ? req.file.buffer.length : 'N/A',
      hasBuffer: !!req.file.buffer
    });
    
    // Additional validation
    const allowedTypes = ['image/png', 'image/jpeg', 'image/svg+xml'];
    if (!allowedTypes.includes(req.file.mimetype)) {
      console.error('❌ LOGO UPLOAD DEBUG: Invalid file type detected:', req.file.mimetype);
      return res.status(400).json({
        error: 'Invalid file type',
        details: 'Only PNG, JPEG, and SVG files are allowed for logos.'
      });
    }
    
    if (req.file.size > 2 * 1024 * 1024) {
      console.error('❌ LOGO UPLOAD DEBUG: File too large:', req.file.size);
      return res.status(400).json({
        error: 'File too large',
        details: 'Logo file size must be less than 2MB.'
      });
    }

    // Upload to storage
    console.log('🚀 LOGO UPLOAD DEBUG: Calling storageService.uploadLogo...');
    const uploadResult = await storageService.uploadLogo(req.file, req.file.originalname);
    console.log('✅ LOGO UPLOAD DEBUG: Storage upload result:', uploadResult);

    // Update database with new logo URL using upsert
    console.log('💾 LOGO UPLOAD DEBUG: Updating company_branding table...');
    console.log('💾 LOGO UPLOAD DEBUG: Logo URL to save:', uploadResult.url);
    const { data: result, error: dbUpdateError } = await supabaseService.client
      .from('company_branding')
      .upsert({ 
        id: '00000000-0000-0000-0000-000000000001', // Use a fixed UUID for single row
        logo_url: uploadResult.url 
      }, { 
        onConflict: 'id',
        ignoreDuplicates: false 
      })
      .select()
      .single();

    if (dbUpdateError) {
      console.error('❌ Database update error:', dbUpdateError);
      console.error('❌ LOGO UPLOAD DEBUG: Full database error details:', JSON.stringify(dbUpdateError, null, 2));
      throw dbUpdateError;
    }

    console.log('✅ LOGO UPLOAD DEBUG: Database update successful:', result);
    console.log('✅ LOGO UPLOAD DEBUG: Complete logo upload process finished successfully');
    res.json({
      success: true,
      message: 'Logo uploaded successfully',
      logo_url: uploadResult.url,
      branding: result
    });

  } catch (err) {
    console.error('❌ LOGO UPLOAD DEBUG: Catch block activated - Critical error:', err);
    console.error('❌ LOGO UPLOAD DEBUG: Error type:', err.constructor.name);
    console.error('❌ LOGO UPLOAD DEBUG: Error message:', err.message);
    console.error('❌ LOGO UPLOAD DEBUG: Error stack:', err.stack);
    
    // Enhanced error response for debugging
    const failureResponse = {
      message: 'Logo upload failed',
      details: err.message,
      suggestion: err.message.includes('Bucket not found') ? 
        'The storage buckets may not exist. Please check your Supabase dashboard and ensure the "logos" bucket is created.' : 
        'Check your Supabase configuration and file format.',
      context: {
        hasFile: !!req.file,
        fileName: req.file?.originalname,
        fileSize: req.file?.size,
        mimeType: req.file?.mimetype,
        supabaseConfigured: !!(process.env.VITE_SUPABASE_URL && process.env.VITE_SUPABASE_ANON_KEY),
        timestamp: new Date().toISOString()
      }
    };
    
    res.status(500).json(failureResponse);
  }
});

/**
 * POST /storage/employee-avatar - Upload employee avatar
 */
router.post('/employee-avatar', upload.single('avatar'), async (req, res, next) => {
  console.log('DEBUG: Entered /api/storage/employee-avatar route handler.');
  console.log('DEBUG: Multer processed file, proceeding to try/catch block.');
  
  try {
    if (!storageService || !supabaseService) {
      return res.status(503).json({
        error: 'Service unavailable',
        details: 'Storage services are not properly configured.'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        error: 'No file uploaded',
        details: 'Please select an avatar file to upload.'
      });
    }

    const { employee_id } = req.body;
    if (!employee_id) {
      return res.status(400).json({
        error: 'Missing employee_id',
        details: 'Employee ID is required for avatar upload.'
      });
    }

    console.log('📤 Processing avatar upload for employee:', employee_id, {
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    });

    // Additional validation for file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    if (!allowedTypes.includes(req.file.mimetype)) {
      return res.status(400).json({
        error: 'Invalid file type',
        details: 'Only PNG and JPG files are allowed for avatars.'
      });
    }

    // Additional validation for file size
    if (req.file.size > 1024 * 1024) {
      return res.status(400).json({
        error: 'File too large',
        details: 'Avatar file size must be less than 1MB.'
      });
    }

    // Upload to storage
    const uploadResult = await storageService.uploadEmployeeAvatar(req.file, employee_id);
    
    // Update database with new avatar URL using upsert to bypass RLS
    const { data: result, error: avatarUpdateError } = await supabaseService.client
      .from('employee_profiles')
      .upsert({ 
        employee_id: employee_id, 
        profile_picture_url: uploadResult.url 
      }, { 
        onConflict: 'employee_id',
        ignoreDuplicates: false 
      })
      .select()
      .single();

    if (avatarUpdateError) {
      console.error('❌ Database update error:', avatarUpdateError);
      throw avatarUpdateError;
    }

    console.log('✅ Avatar upload completed successfully for employee:', employee_id);
    res.json({
      success: true,
      message: 'Avatar uploaded successfully',
      employee_id: employee_id,
      avatar_url: uploadResult.url,
      profile: result
    });

  } catch (err) {
    console.error('❌ Failure uploading avatar:', err);
    
    // Enhanced error response for debugging
    const failureResponse = {
      message: 'Avatar upload failed',
      details: err.message,
      context: {
        hasFile: !!req.file,
        fileName: req.file?.originalname,
        fileSize: req.file?.size,
        mimeType: req.file?.mimetype,
        employeeId: req.body?.employee_id,
        timestamp: new Date().toISOString()
      }
    };
    
    res.status(500).json(failureResponse);
    next(err);
  }
});

/**
 * DELETE /storage/logo - Delete company logo
 */
router.delete('/logo', async (req, res, next) => {
  try {
    if (!supabaseService) {
      return res.status(503).json({
        error: 'Service unavailable',
        details: 'Storage services are not properly configured.'
      });
    }

    // Clear logo URL from database
    const { data: existing } = await supabaseService.client
      .from('company_branding')
      .select('id, logo_url')
      .limit(1)
      .single();

    if (existing && existing.logo_url) {
      // Update database to remove logo URL
      const { error: logoRemoveError } = await supabaseService.client
        .from('company_branding')
        .update({ logo_url: null })
        .eq('id', existing.id);

      if (logoRemoveError) throw logoRemoveError;
    }

    res.json({
      success: true,
      message: 'Logo removed successfully'
    });

  } catch (err) {
    console.error('❌ Failure removing logo:', err);
    next(err);
  }
});

module.exports = router;