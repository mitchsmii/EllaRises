require('dotenv').config();

const express = require('express');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const session = require('express-session');

// Database connection (uncomment when ready to use)
// const { db, testConnection } = require('./db');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ============================================
// SESSION CONFIGURATION
// ============================================

app.use(session({
  secret: process.env.SESSION_SECRET || 'ella-rises-dev-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000
  }
}));

// ============================================
// Knex Connection
// ============================================

const knex = require("knex")({
  client: "pg",
  connection: {
      host: process.env.DB_HOST || "localhost",
      user: process.env.DB_USER || "postgres",
      password: process.env.DB_PASSWORD || "admin",
      database: process.env.DB_NAME || "postgres",
      port: process.env.DB_PORT || 5432,
      ssl: { rejectUnauthorized: false }
  }
});


// ============================================
// SAMPLE DATA (will come from database later)
// ============================================

const sampleParticipants = [
  { id: 1, firstName: 'Maria', lastName: 'Garcia', email: 'maria@example.com', phone: '(555) 123-4567', school: 'Lincoln High School', gradeLevel: '11th Grade', status: 'active', joinDate: '2024-09-01' },
  { id: 2, firstName: 'Jasmine', lastName: 'Williams', email: 'jasmine@example.com', phone: '(555) 234-5678', school: 'State University', gradeLevel: 'Freshman', status: 'active', joinDate: '2024-08-15' },
  { id: 3, firstName: 'Amina', lastName: 'Hassan', email: 'amina@example.com', phone: '(555) 345-6789', school: 'Roosevelt High School', gradeLevel: '10th Grade', status: 'active', joinDate: '2024-10-01' },
  { id: 4, firstName: 'Sofia', lastName: 'Martinez', email: 'sofia@example.com', phone: '(555) 456-7890', school: 'Kennedy Middle School', gradeLevel: '8th Grade', status: 'pending', joinDate: '2024-11-15' },
  { id: 5, firstName: 'Destiny', lastName: 'Johnson', email: 'destiny@example.com', phone: '(555) 567-8901', school: 'Central High School', gradeLevel: '12th Grade', status: 'alumni', joinDate: '2022-09-01' },
];

const sampleEvents = [
  { id: 1, title: 'Annual Gala: Rising Together', description: 'Join us for our biggest fundraising event of the year! Celebrate the achievements of our scholars.', eventDate: '2025-03-15', eventTime: '18:00', location: 'Grand Ballroom, Downtown Convention Center', eventType: 'fundraising', capacity: 200, registered: 145 },
  { id: 2, title: 'Resume Writing 101', description: 'Learn how to craft a resume that stands out. Perfect for high school juniors and seniors.', eventDate: '2025-01-20', eventTime: '15:00', location: 'Community Center, Room 204', eventType: 'workshop', capacity: 30, registered: 24 },
  { id: 3, title: 'Mentor Meet & Greet', description: 'Monthly gathering for mentors to connect, share experiences, and learn from each other.', eventDate: '2025-01-27', eventTime: '18:00', location: 'Ella Rises HQ', eventType: 'community', capacity: 50, registered: 32 },
  { id: 4, title: 'Financial Literacy for Teens', description: 'Budgeting, saving, and understanding credit—essential skills for young adults.', eventDate: '2025-02-03', eventTime: '16:00', location: 'Virtual Event', eventType: 'workshop', capacity: 100, registered: 67 },
  { id: 5, title: 'Public Speaking Bootcamp', description: 'Build confidence and learn techniques to speak with impact. All skill levels welcome.', eventDate: '2025-02-22', eventTime: '10:00', location: 'City Library, Auditorium', eventType: 'workshop', capacity: 40, registered: 38 },
];

const sampleMilestones = [
  { id: 1, title: 'Program Orientation', description: 'Complete new member orientation session', category: 'Onboarding', points: 10 },
  { id: 2, title: 'First Mentor Meeting', description: 'Attend first one-on-one meeting with assigned mentor', category: 'Mentorship', points: 15 },
  { id: 3, title: 'Workshop Attendance', description: 'Attend at least one skill-building workshop', category: 'Education', points: 10 },
  { id: 4, title: 'Community Service', description: 'Complete 5 hours of community service', category: 'Community', points: 25 },
  { id: 5, title: 'Goal Setting', description: 'Create and document personal goals with mentor', category: 'Mentorship', points: 20 },
  { id: 6, title: 'Leadership Role', description: 'Take on a leadership role in a group activity', category: 'Leadership', points: 30 },
  { id: 7, title: 'Public Speaking', description: 'Give a presentation or speech at an event', category: 'Leadership', points: 35 },
  { id: 8, title: 'Program Completion', description: 'Successfully complete one full year of the program', category: 'Achievement', points: 100 },
];

const sampleParticipantMilestones = [
  { participantId: 1, participantName: 'Maria Garcia', milestoneId: 1, milestoneTitle: 'Program Orientation', completedAt: '2024-09-05' },
  { participantId: 1, participantName: 'Maria Garcia', milestoneId: 2, milestoneTitle: 'First Mentor Meeting', completedAt: '2024-09-15' },
  { participantId: 1, participantName: 'Maria Garcia', milestoneId: 3, milestoneTitle: 'Workshop Attendance', completedAt: '2024-10-01' },
  { participantId: 2, participantName: 'Jasmine Williams', milestoneId: 1, milestoneTitle: 'Program Orientation', completedAt: '2024-08-20' },
  { participantId: 2, participantName: 'Jasmine Williams', milestoneId: 2, milestoneTitle: 'First Mentor Meeting', completedAt: '2024-09-01' },
  { participantId: 3, participantName: 'Amina Hassan', milestoneId: 1, milestoneTitle: 'Program Orientation', completedAt: '2024-10-05' },
];

const sampleSurveys = [
  { id: 1, title: 'Program Satisfaction Survey', description: 'Help us improve by sharing your feedback on the program.', status: 'active', responses: 45, createdAt: '2024-11-01' },
  { id: 2, title: 'Mentor Feedback Form', description: 'Rate your experience with your assigned mentor.', status: 'active', responses: 32, createdAt: '2024-10-15' },
  { id: 3, title: 'Workshop Evaluation', description: 'Tell us what you thought of the recent workshop.', status: 'active', responses: 28, createdAt: '2024-12-01' },
  { id: 4, title: 'End of Year Survey', description: 'Comprehensive feedback on your year with Ella Rises.', status: 'draft', responses: 0, createdAt: '2024-12-10' },
];

const sampleDonations = [
  { id: 1, donorName: 'Sarah Mitchell', donorEmail: 'sarah@example.com', amount: 500, designation: 'Scholarships', donationDate: '2024-12-01', paymentMethod: 'Credit Card' },
  { id: 2, donorName: 'Anonymous', donorEmail: null, amount: 1000, designation: 'Where needed most', donationDate: '2024-11-28', paymentMethod: 'Check' },
  { id: 3, donorName: 'Johnson Family Foundation', donorEmail: 'grants@jff.org', amount: 5000, designation: 'Mentorship Program', donationDate: '2024-11-15', paymentMethod: 'Bank Transfer' },
  { id: 4, donorName: 'Maria Lopez', donorEmail: 'maria.l@example.com', amount: 100, designation: 'Where needed most', donationDate: '2024-12-05', paymentMethod: 'Credit Card' },
  { id: 5, donorName: 'Tech Corp Inc.', donorEmail: 'giving@techcorp.com', amount: 2500, designation: 'Workshops', donationDate: '2024-10-20', paymentMethod: 'Bank Transfer' },
  { id: 6, donorName: 'David Chen', donorEmail: 'dchen@example.com', amount: 250, designation: 'Scholarships', donationDate: '2024-12-08', paymentMethod: 'Credit Card' },
];

// ============================================
// MULTER IMAGE UPLOAD CONFIGURATION
// ============================================

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const category = req.params.category || 'general';
    const uploadPath = path.join(__dirname, 'public', 'uploads', category);
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, '-');
    cb(null, `${baseName}-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/avif'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, GIF, WebP, and AVIF images are allowed.'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }
});

// ============================================
// BRAND & CONTENT CONFIGURATION
// ============================================

const brand = {
  name: 'Ella Rises',
  tagline: 'Inviting young women to pursue higher education and embrace their heritage by providing culturally rooted programs and educational experiences.',
  palette: {
    primary: '#1a1a1a',
    accent: '#f4a5a0',
    peach: '#fcd5ce',
    cream: '#fff8f5',
    charcoal: '#1a1a1a',
    white: '#ffffff',
  },
};

const focusAreas = [
  { title: 'Mentorship', copy: 'Pairing young women with mentors and leaders who open doors, share wisdom, and help chart clear next steps.' },
  { title: 'Education', copy: 'Workshops, scholarships, and skill-building that equip girls with confidence and practical tools.' },
  { title: 'Community', copy: 'Circles of support where women advocate for each other, celebrate wins, and show up in service.' },
];

const stats = [
  { label: 'Students served', value: '1,200+' },
  { label: 'Mentor matches', value: '350' },
  { label: 'Workshops delivered', value: '80+' },
];

const stories = [
  { quote: 'Ella Rises gave me the confidence to speak up, ask for what I need, and step into leadership at school.', name: 'Amina, high school fellow' },
  { quote: 'My mentor helped me land my first internship and reminded me that my voice matters.', name: 'Jasmine, college scholar' },
];

// ============================================
// MIDDLEWARE
// ============================================

app.use((req, res, next) => {
  res.locals.brand = brand;
  res.locals.currentYear = new Date().getFullYear();
  res.locals.user = req.session.user || null;
  next();
});

// ============================================
// AUTH HELPER MIDDLEWARE
// ============================================

function requireLogin(req, res, next) {
  if (!req.session.user) {
    return res.redirect('/login?redirect=' + encodeURIComponent(req.originalUrl));
  }
  next();
}

function requireManager(req, res, next) {
  if (!req.session.user) {
    return res.redirect('/login?redirect=' + encodeURIComponent(req.originalUrl));
  }
  if (req.session.user.role !== 'manager') {
    return res.status(403).render('errors/403', {
      currentPage: '403',
      pageTitle: 'Access Denied',
      message: 'You do not have permission to access this page.'
    });
  }
  next();
}

// ============================================
// DATABASE TEST ROUTE (remove after testing)
// ============================================

app.get('/db-test', async (req, res) => {
  try {
    const result = await knex.raw('SELECT NOW() as current_time');
    res.json({
      success: true,
      message: 'Database connection successful!',
      serverTime: result.rows[0].current_time
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Database connection failed',
      error: error.message
    });
  }
});

// ============================================
// AUTHENTICATION ROUTES
// ============================================

app.get('/login', (req, res) => {
  if (req.session.user) {
    return res.redirect('/dashboard');
  }
  res.render('auth/login', { 
    currentPage: 'login', 
    pageTitle: 'Login',
    error: null,
    redirect: req.query.redirect || null
  });
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const redirect = req.body.redirect || '/dashboard';
  
  try {
    // Find user by email/username
    const user = await knex('users')
      .where('email', email)
      .orWhere('email', email)
      .first();
    
    if (!user) {
      return res.render('auth/login', {
        currentPage: 'login',
        pageTitle: 'Login',
        error: 'Invalid username or password',
        redirect
      });
    }
    
    // For now, plain text password comparison (add bcrypt later)
    if (user.password !== password) {
      return res.render('auth/login', {
        currentPage: 'login',
        pageTitle: 'Login',
        error: 'Invalid username or password',
        redirect
      });
    }
    
    // Set session
    req.session.user = {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role
    };
    
    res.redirect(redirect);
  } catch (error) {
    console.error('Login error:', error);
    res.render('auth/login', {
      currentPage: 'login',
      pageTitle: 'Login',
      error: 'An error occurred. Please try again.',
      redirect
    });
  }
});

app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) console.error('Logout error:', err);
    res.redirect('/');
  });
});

// ============================================
// IMAGE UPLOAD ROUTES
// ============================================

app.post('/upload/:category', upload.single('image'), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const imageUrl = `/uploads/${req.params.category}/${req.file.filename}`;
    res.json({ success: true, message: 'Image uploaded successfully', filename: req.file.filename, url: imageUrl, size: req.file.size, mimetype: req.file.mimetype });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/upload/:category/multiple', upload.array('images', 10), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) return res.status(400).json({ error: 'No files uploaded' });
    const uploadedFiles = req.files.map(file => ({ filename: file.filename, url: `/uploads/${req.params.category}/${file.filename}`, size: file.size, mimetype: file.mimetype }));
    res.json({ success: true, message: `${req.files.length} images uploaded successfully`, files: uploadedFiles });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/images/:category', (req, res) => {
  const category = req.params.category;
  const uploadPath = path.join(__dirname, 'public', 'uploads', category);
  if (!fs.existsSync(uploadPath)) return res.json({ images: [] });
  const files = fs.readdirSync(uploadPath).filter(file => /\.(jpg|jpeg|png|gif|webp|avif)$/i.test(file)).map(file => ({ filename: file, url: `/uploads/${category}/${file}` }));
  res.json({ images: files });
});

app.delete('/api/images/:category/:filename', (req, res) => {
  const { category, filename } = req.params;
  const filePath = path.join(__dirname, 'public', 'uploads', category, filename);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Image not found' });
  try {
    fs.unlinkSync(filePath);
    res.json({ success: true, message: 'Image deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete image' });
  }
});

// ============================================
// PUBLIC PAGE ROUTES (views/public/)
// ============================================

app.get('/', (req, res) => {
  res.render('public/home', { currentPage: 'home', pageTitle: 'Welcome', focusAreas, stats, stories });
});

app.get('/about', (req, res) => {
  res.render('public/about', { currentPage: 'about', pageTitle: 'About Us', pageDescription: 'Learn about our mission, team, and the story behind Ella Rises.' });
});

app.get('/programs', (req, res) => {
  res.render('public/programs', { currentPage: 'programs', pageTitle: 'Our Programs', pageDescription: 'Explore our mentorship, education, and community programs.', focusAreas });
});

app.get('/stories', (req, res) => {
  res.render('public/stories', { currentPage: 'stories', pageTitle: 'Success Stories', pageDescription: 'Read inspiring stories from the women and girls we serve.', stories });
});

app.get('/events', (req, res) => {
  res.render('public/events-public', { currentPage: 'events', pageTitle: 'Events', pageDescription: 'Find upcoming workshops, community gatherings, and fundraising events.', events: sampleEvents });
});

app.get('/get-involved', (req, res) => {
  res.render('public/get-involved', { currentPage: 'get-involved', pageTitle: 'Get Involved', pageDescription: 'Discover ways to volunteer, mentor, donate, and partner with Ella Rises.' });
});

app.get('/donate', (req, res) => {
  res.render('public/donate', { currentPage: 'donate', pageTitle: 'Donate', pageDescription: 'Support our mission with a tax-deductible donation.' });
});

app.get('/contact', (req, res) => {
  res.render('public/contact', { currentPage: 'contact', pageTitle: 'Contact Us', pageDescription: 'Get in touch with the Ella Rises team.' });
});

app.get('/resources', (req, res) => {
  res.render('public/resources', { currentPage: 'resources', pageTitle: 'Resources', pageDescription: 'Tools and information for students, mentors, and families.' });
});

app.post('/contact', (req, res) => {
  res.redirect('/contact?success=true');
});

// ============================================
// USER PAGES (views/user/) - requires login
// ============================================

app.get('/dashboard', requireLogin, (req, res) => {
  res.render('user/dashboard', { currentPage: 'dashboard', pageTitle: 'Dashboard', pageDescription: 'Your personal dashboard' });
});

app.get('/participants', requireLogin, (req, res) => {
  res.render('user/participants', { 
    currentPage: 'participants', 
    pageTitle: 'Participants', 
    participants: sampleParticipants 
  });
});

app.get('/participants/:id', requireLogin, (req, res) => {
  const participant = sampleParticipants.find(p => p.id === parseInt(req.params.id));
  if (!participant) return res.status(404).render('errors/404', { currentPage: '404', pageTitle: 'Not Found' });
  const milestones = sampleParticipantMilestones.filter(m => m.participantId === participant.id);
  res.render('user/participant-detail', { 
    currentPage: 'participants', 
    pageTitle: participant.firstName + ' ' + participant.lastName, 
    participant,
    milestones,
    allMilestones: sampleMilestones
  });
});

app.get('/milestones', requireLogin, (req, res) => {
  res.render('user/milestones', { 
    currentPage: 'milestones', 
    pageTitle: 'Milestones', 
    milestones: sampleMilestones,
    participantMilestones: sampleParticipantMilestones,
    participants: sampleParticipants
  });
});

app.get('/surveys', requireLogin, (req, res) => {
  res.render('user/surveys', { 
    currentPage: 'surveys', 
    pageTitle: 'Surveys', 
    surveys: sampleSurveys 
  });
});

// ============================================
// ADMIN PAGES (views/admin/) - requires manager
// ============================================

app.get('/manage/events', requireManager, (req, res) => {
  res.render('admin/events-manage', { 
    currentPage: 'events', 
    pageTitle: 'Manage Events', 
    events: sampleEvents 
  });
});

app.get('/manage/events/new', requireManager, (req, res) => {
  res.render('admin/event-form', { 
    currentPage: 'events', 
    pageTitle: 'Create Event', 
    event: null 
  });
});

app.get('/manage/events/:id/edit', requireManager, (req, res) => {
  const event = sampleEvents.find(e => e.id === parseInt(req.params.id));
  if (!event) return res.status(404).render('errors/404', { currentPage: '404', pageTitle: 'Not Found' });
  res.render('admin/event-form', { 
    currentPage: 'events', 
    pageTitle: 'Edit Event', 
    event 
  });
});

app.get('/donations', requireManager, (req, res) => {
  const totalDonations = sampleDonations.reduce((sum, d) => sum + d.amount, 0);
  res.render('admin/donations', { 
    currentPage: 'donations', 
    pageTitle: 'Donations', 
    donations: sampleDonations,
    totalDonations
  });
});

app.get('/admin/users', requireManager, (req, res) => {
  const allUsers = [
    { id: 1, email: 'manager@test.com', firstName: 'Admin', lastName: 'User', role: 'manager', status: 'active', createdAt: '2024-01-01' },
    { id: 2, email: 'user@test.com', firstName: 'Regular', lastName: 'User', role: 'user', status: 'active', createdAt: '2024-06-15' },
    { id: 3, email: 'maria@example.com', firstName: 'Maria', lastName: 'Garcia', role: 'user', status: 'active', createdAt: '2024-09-01' },
    { id: 4, email: 'jasmine@example.com', firstName: 'Jasmine', lastName: 'Williams', role: 'user', status: 'active', createdAt: '2024-08-15' },
  ];
  res.render('admin/admin-users', { 
    currentPage: 'admin', 
    pageTitle: 'Manage Users', 
    users: allUsers 
  });
});

// ============================================
// ERROR HANDLING
// ============================================

app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ error: 'File too large. Maximum size is 5MB.' });
    return res.status(400).json({ error: err.message });
  } else if (err) {
    return res.status(400).json({ error: err.message });
  }
  next();
});

app.use((req, res) => {
  res.status(404).render('errors/404', { currentPage: '404', pageTitle: 'Page Not Found' });
});

// ============================================
// START SERVER
// ============================================

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Ella Rises site running at http://localhost:${PORT}`);
});
