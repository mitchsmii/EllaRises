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

// ============================================
// CARPOOLING DATA (In-Memory Storage)
// ============================================

// Store carpooling data in memory: { eventDetailId: { drivers: [], riders: [] } }
const carpoolingData = {};

// Helper function to get or initialize carpooling data for an event
function getCarpoolingData(eventDetailId) {
  if (!carpoolingData[eventDetailId]) {
    carpoolingData[eventDetailId] = {
      drivers: [],
      riders: []
    };
  }
  return carpoolingData[eventDetailId];
}

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
  // Check for both 'manager' and 'admin' roles
  if (req.session.user.role !== 'manager' && req.session.user.role !== 'admin') {
    return res.status(403).render('errors/403', {
      currentPage: '403',
      pageTitle: 'Access Denied',
      message: 'You do not have permission to access this page.'
    });
  }
  next();
}









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
    // Find user in login table
    const loginUser = await knex('login')
      .where('email', email)
      .first();
    
    if (!loginUser) {
      return res.render('auth/login', {
        currentPage: 'login',
        pageTitle: 'Login',
        error: 'Invalid username or password',
        redirect
      });
    }
    
    // Plain text password comparison (add bcrypt later)
    if (loginUser.password !== password) {
      return res.render('auth/login', {
        currentPage: 'login',
        pageTitle: 'Login',
        error: 'Invalid username or password',
        redirect
      });
    }
    
    // Try to get person details from people table (if linked)
    const person = await knex('people')
      .where('email', loginUser.email)
      .first();
    
    // Set session with user info
    // Normalize 'admin' to 'manager' for consistency
    const userRole = loginUser.level === 'admin' ? 'manager' : (loginUser.level || 'user');
    
    req.session.user = {
      email: loginUser.email,
      firstName: person ? person.firstname : (loginUser.email === 'admin' ? 'Admin' : 'User'),
      lastName: person ? person.lastname : '',
      role: userRole
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
  res.render('public/stories', { 
    currentPage: 'media', 
    pageTitle: 'Media Coverage', 
    pageDescription: 'See where Ella Rises has been featured in local news, radio, and digital publications.' 
  });
});

// Redirect /media to /stories for consistency
app.get('/media', (req, res) => {
  res.redirect('/stories');
});

app.get('/events', async (req, res) => {
  try {
    const now = new Date();
    const searchTerm = req.query.search ? `%${req.query.search.toLowerCase()}%` : '';
    
    // Build query for upcoming events
    let upcomingQuery = knex('events')
      .leftJoin('event_details', 'events.eventid', 'event_details.eventid')
      .whereNotNull('event_details.eventdatetimestart')
      .where('event_details.eventdatetimestart', '>=', now)
      .select(
        'events.eventid as id',
        'events.eventname as title',
        'events.eventtype as eventType',
        'events.eventdescription as description',
        'event_details.eventdetailid as detailId',
        'event_details.eventdatetimestart as eventDate',
        'event_details.eventregistrationdeadline as registrationDeadline',
        'event_details.eventcapacity as capacity',
        'event_details.eventlocation as location'
      );

    // Build query for past events
    let pastQuery = knex('events')
      .leftJoin('event_details', 'events.eventid', 'event_details.eventid')
      .whereNotNull('event_details.eventdatetimestart')
      .where('event_details.eventdatetimestart', '<', now)
      .select(
        'events.eventid as id',
        'events.eventname as title',
        'events.eventtype as eventType',
        'events.eventdescription as description',
        'event_details.eventdetailid as detailId',
        'event_details.eventdatetimestart as eventDate',
        'event_details.eventregistrationdeadline as registrationDeadline',
        'event_details.eventcapacity as capacity',
        'event_details.eventlocation as location'
      );

    // Apply search filter if provided
    if (searchTerm) {
      upcomingQuery = upcomingQuery.where(function() {
        this.whereRaw('LOWER(events.eventname) ILIKE ?', [searchTerm])
            .orWhereRaw('LOWER(events.eventdescription) ILIKE ?', [searchTerm])
            .orWhereRaw('LOWER(events.eventtype) ILIKE ?', [searchTerm])
            .orWhereRaw('LOWER(event_details.eventlocation) ILIKE ?', [searchTerm]);
      });
      pastQuery = pastQuery.where(function() {
        this.whereRaw('LOWER(events.eventname) ILIKE ?', [searchTerm])
            .orWhereRaw('LOWER(events.eventdescription) ILIKE ?', [searchTerm])
            .orWhereRaw('LOWER(events.eventtype) ILIKE ?', [searchTerm])
            .orWhereRaw('LOWER(event_details.eventlocation) ILIKE ?', [searchTerm]);
      });
    }
    
    // Get upcoming events
    const upcomingEventsRaw = await upcomingQuery
      .orderBy('event_details.eventdatetimestart', 'asc')
      .limit(20);
    
    // Get past events
    const pastEventsRaw = await pastQuery
      .orderBy('event_details.eventdatetimestart', 'desc')
      .limit(20);
    
    // Get registration counts and user RSVP status
    let userPersonId = null;
    if (req.session.user) {
      const person = await knex('people')
        .where('email', req.session.user.email)
        .first();
      if (person) {
        userPersonId = person.personid;
      }
    }
    
    // Get registration counts for all event details
    const allDetailIds = [...upcomingEventsRaw, ...pastEventsRaw]
      .map(e => e.detailId)
      .filter(id => id !== null);
    
    const registrationCounts = {};
    const userRegistrations = {};
    
    if (allDetailIds.length > 0) {
      // Get registration counts (only active registrations, not cancelled)
      // Using raw SQL to handle potential case-sensitive column names
      const counts = await knex.raw(`
        SELECT eventdetailid, COUNT(*) as count
        FROM registration
        WHERE eventdetailid = ANY(?::int[])
        AND (registrationstatus != 'cancelled' OR registrationstatus IS NULL)
        GROUP BY eventdetailid
      `, [allDetailIds]);
      
      counts.rows.forEach(row => {
        registrationCounts[row.eventdetailid] = parseInt(row.count);
      });
      
      // Get user's registrations if logged in
      if (userPersonId) {
        const userRegs = await knex.raw(`
          SELECT eventdetailid, registrationid, registrationstatus
          FROM registration
          WHERE eventdetailid = ANY(?::int[])
          AND personid = ?
          AND (registrationstatus != 'cancelled' OR registrationstatus IS NULL)
        `, [allDetailIds, userPersonId]);
        
        userRegs.rows.forEach(reg => {
          userRegistrations[reg.eventdetailid] = {
            registrationId: reg.registrationid,
            status: reg.registrationstatus
          };
        });
      }
    }
    
    // Format events with registration data
    const upcomingEvents = upcomingEventsRaw.map(event => ({
      ...event,
      registered: registrationCounts[event.detailId] || 0,
      userHasRSVPd: !!userRegistrations[event.detailId],
      userRegistrationId: userRegistrations[event.detailId]?.registrationId || null,
      isFull: event.capacity && (registrationCounts[event.detailId] || 0) >= event.capacity
    }));
    
    const pastEvents = pastEventsRaw.map(event => ({
      ...event,
      registered: registrationCounts[event.detailId] || 0,
      userHasRSVPd: !!userRegistrations[event.detailId],
      userRegistrationId: userRegistrations[event.detailId]?.registrationId || null
    }));
    
    res.render('public/events-public', { 
      currentPage: 'events', 
      pageTitle: 'Events', 
      pageDescription: 'Find upcoming workshops, community gatherings, and fundraising events.', 
      events: upcomingEvents,
      pastEvents: pastEvents,
      searchTerm: req.query.search || '',
      user: req.session.user
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    res.render('public/events-public', { 
      currentPage: 'events', 
      pageTitle: 'Events', 
      pageDescription: 'Find upcoming workshops, community gatherings, and fundraising events.', 
      events: [],
      pastEvents: []
    });
  }
});

// POST /events/:detailId/rsvp - RSVP to an event
app.post('/events/:detailId/rsvp', requireLogin, async (req, res) => {
  try {
    const eventDetailId = parseInt(req.params.detailId);

    // Get the logged-in user's personid
    const person = await knex('people')
      .where('email', req.session.user.email)
      .first();

    if (!person) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found. Please contact support.'
      });
    }

    // Check if event detail exists
    const eventDetail = await knex('event_details')
      .where('eventdetailid', eventDetailId)
      .first();

    if (!eventDetail) {
      return res.status(404).json({
        success: false,
        message: 'Event not found.'
      });
    }

    // Check if event is in the past
    if (new Date(eventDetail.eventdatetimestart) < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot RSVP to past events.'
      });
    }

    // Check if registration deadline has passed
    if (eventDetail.eventregistrationdeadline && new Date(eventDetail.eventregistrationdeadline) < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Registration deadline has passed for this event.'
      });
    }

    // Check if user already has an active registration
    const existingRegistration = await knex.raw(`
      SELECT registrationid, registrationstatus
      FROM registration
      WHERE eventdetailid = ?
      AND personid = ?
      AND (registrationstatus != 'cancelled' OR registrationstatus IS NULL)
      LIMIT 1
    `, [eventDetailId, person.personid]);

    if (existingRegistration.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'You have already RSVP\'d to this event.'
      });
    }

    // Check if event is full
    const registrationCount = await knex.raw(`
      SELECT COUNT(*) as count
      FROM registration
      WHERE eventdetailid = ?
      AND (registrationstatus != 'cancelled' OR registrationstatus IS NULL)
    `, [eventDetailId]);

    const currentCount = parseInt(registrationCount.rows[0].count || 0);
    if (eventDetail.eventcapacity && currentCount >= eventDetail.eventcapacity) {
      return res.status(400).json({
        success: false,
        message: 'This event is full.'
      });
    }

    // Get max registrationid and add 1
    const maxReg = await knex.raw(`
      SELECT MAX(registrationid) as maxid
      FROM registration
    `);
    const nextRegistrationId = maxReg.rows[0].maxid ? parseInt(maxReg.rows[0].maxid) + 1 : 1;

    // Create registration
    // Using 'active' instead of 'registered' to fit within character varying(9) constraint
    await knex.raw(`
      INSERT INTO registration (registrationid, personid, eventdetailid, registrationstatus, registrationattendedflag, registrationcreateddate)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [nextRegistrationId, person.personid, eventDetailId, 'active', 0, new Date()]);

    // Handle carpooling data if provided
    const { option, address, radius, seatCount } = req.body;
    if (option) {
      const carpoolData = getCarpoolingData(eventDetailId);
      const userEmail = req.session.user.email;
      const userName = `${person.firstname || ''} ${person.lastname || ''}`.trim() || userEmail;
      const userPhone = person.phone || 'Not provided';

      if (option === 'carpool-request' && address) {
        // Add rider request
        carpoolData.riders.push({
          email: userEmail,
          name: userName,
          phone: userPhone,
          address: address,
          personid: person.personid
        });
      } else if (option === 'driver-offer' && address && radius && seatCount) {
        // Add driver offer
        carpoolData.drivers.push({
          email: userEmail,
          name: userName,
          phone: userPhone,
          address: address,
          radius: parseInt(radius),
          seatCount: parseInt(seatCount),
          personid: person.personid
        });
      } else if (option === 'bus' || option === 'virtual' || option === 'no-drive') {
        // User has their own transportation or virtual event - no carpooling needed
      }
    }

    let message = 'Successfully RSVP\'d to the event!';
    if (option === 'carpool-request') {
      message = 'Your carpool request has been submitted! We\'ll match you with a driver soon.';
    } else if (option === 'driver-offer') {
      message = 'Thank you for offering to drive! We\'ll match you with riders who need a ride.';
    } else if (option === 'bus') {
      message = 'RSVP confirmed! We\'ve opened transit directions for you.';
    }

    res.json({
      success: true,
      message: message
    });
  } catch (error) {
    console.error('Error creating RSVP:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while processing your RSVP: ' + error.message
    });
  }
});

// DELETE /events/:detailId/rsvp - Cancel RSVP
app.delete('/events/:detailId/rsvp', requireLogin, async (req, res) => {
  try {
    const eventDetailId = parseInt(req.params.detailId);

    // Get the logged-in user's personid
    const person = await knex('people')
      .where('email', req.session.user.email)
      .first();

    if (!person) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found.'
      });
    }

    // Find and cancel the registration
    const registration = await knex.raw(`
      SELECT registrationid, registrationstatus
      FROM registration
      WHERE eventdetailid = ?
      AND personid = ?
      AND (registrationstatus != 'cancelled' OR registrationstatus IS NULL)
      LIMIT 1
    `, [eventDetailId, person.personid]);

    if (registration.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'You do not have an active RSVP for this event.'
      });
    }

    // Update registration status to cancelled
    await knex.raw(`
      UPDATE registration
      SET registrationstatus = 'cancelled'
      WHERE registrationid = ?
    `, [registration.rows[0].registrationid]);

    // Remove user from carpooling data if they're in it
    const carpoolData = getCarpoolingData(eventDetailId);
    const userEmail = req.session.user.email;
    
    // Remove from drivers
    carpoolData.drivers = carpoolData.drivers.filter(driver => driver.email !== userEmail);
    
    // Remove from riders
    carpoolData.riders = carpoolData.riders.filter(rider => rider.email !== userEmail);

    res.json({
      success: true,
      message: 'RSVP cancelled successfully.'
    });
  } catch (error) {
    console.error('Error cancelling RSVP:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while cancelling your RSVP: ' + error.message
    });
  }
});

app.get('/get-involved', (req, res) => {
  res.render('public/get-involved', { currentPage: 'get-involved', pageTitle: 'Get Involved', pageDescription: 'Discover ways to volunteer, mentor, donate, and partner with Ella Rises.' });
});

app.get('/donate', async (req, res) => {
  let userInfo = null;
  
  // If user is logged in, pre-fill their information
  if (req.session.user && req.session.user.email) {
    try {
      const person = await knex('people')
        .where('email', req.session.user.email)
        .first();
      
      if (person) {
        userInfo = {
          firstname: person.firstname || '',
          lastname: person.lastname || '',
          email: person.email || req.session.user.email,
          phone: person.phone || '',
          city: person.city || '',
          state: person.state || ''
        };
      } else {
        // Fallback to session data
        userInfo = {
          firstname: req.session.user.firstName || '',
          lastname: req.session.user.lastName || '',
          email: req.session.user.email || '',
          phone: req.session.user.phone || '',
          city: '',
          state: ''
        };
      }
    } catch (error) {
      console.error('Error fetching user info for donation form:', error);
    }
  }
  
  res.render('public/donate', { 
    currentPage: 'donate', 
    pageTitle: 'Donate', 
    pageDescription: 'Support our mission with a tax-deductible donation.',
    error: req.query.error || null,
    success: req.query.success || null,
    userInfo: userInfo,
    isLoggedIn: !!req.session.user
  });
});

// POST /donate - Handle donation submission
app.post('/donate', async (req, res) => {
  try {
    const { firstname, lastname, email, phone, city, state, donationAmount, frequency, designation } = req.body;

    // Validate required fields
    if (!firstname || !lastname || !email || !donationAmount) {
      return res.redirect('/donate?error=' + encodeURIComponent('Please fill in all required fields (name, email, and donation amount).'));
    }

    const amount = parseFloat(donationAmount);
    if (isNaN(amount) || amount <= 0) {
      return res.redirect('/donate?error=' + encodeURIComponent('Please enter a valid donation amount.'));
    }

    // Clean phone number - strip all non-numeric characters
    const cleanedPhone = phone ? phone.replace(/\D/g, '') : null;

    // Check if user already exists in login table
    const existingLogin = await knex('login')
      .where('email', email)
      .first();

    // If email exists and user is not logged in (or logged in with different email), require login
    if (existingLogin && (!req.session.user || req.session.user.email !== email)) {
      return res.render('public/donate', {
        currentPage: 'donate',
        pageTitle: 'Donate',
        pageDescription: 'Support our mission with a tax-deductible donation.',
        error: `An account with the email "${email}" already exists. Please <a href="/login?redirect=/donate" style="color: var(--salmon); text-decoration: underline;">log in</a> to make a donation.`,
        success: null,
        userInfo: null,
        isLoggedIn: false
      });
    }

    const wasNewUser = !existingLogin;

    // Start transaction to ensure all operations succeed or fail together
    await knex.transaction(async (trx) => {
      // If user doesn't exist, create login entry
      if (!existingLogin) {
        // Generate a temporary password (user can reset later)
        const tempPassword = 'temp123'; // TODO: Consider generating a random password and emailing it
        
        await trx('login').insert({
          email: email,
          password: tempPassword,
          level: 'user' // Default to regular user
        });
      }

      // Check if person exists in people table
      let existingPerson = await trx('people')
        .where('email', email)
        .first();

      // Get max personid if we need to create a new person
      let personId;
      if (existingPerson) {
        personId = existingPerson.personid;
        // Update existing person with new information
        await trx('people')
          .where('email', email)
          .update({
            firstname: firstname || existingPerson.firstname,
            lastname: lastname || existingPerson.lastname,
            phone: cleanedPhone || existingPerson.phone,
            city: city || existingPerson.city,
            state: state || existingPerson.state
          });
      } else {
        // Create new person
        const maxPerson = await trx('people')
          .max('personid as maxid')
          .first();
        personId = maxPerson && maxPerson.maxid ? parseInt(maxPerson.maxid) + 1 : 1;

        await trx('people').insert({
          personid: personId,
          email: email,
          firstname: firstname,
          lastname: lastname,
          phone: cleanedPhone || null,
          city: city || null,
          state: state || null
        });
      }

      // Create donation record
      const maxDonation = await trx('donations')
        .max('donationid as maxid')
        .first();
      const nextDonationId = maxDonation && maxDonation.maxid ? parseInt(maxDonation.maxid) + 1 : 1;

      // Get donation number for this person (count existing donations + 1)
      const donationCount = await trx('donations')
        .where('personid', personId)
        .count('* as count')
        .first();
      const donationNo = parseInt(donationCount.count) + 1;

      // Format date as string (since donationdate is character varying)
      const donationDate = new Date().toISOString().slice(0, 19).replace('T', ' ');

      await trx('donations').insert({
        donationid: nextDonationId,
        personid: personId,
        donationno: donationNo,
        donationdate: donationDate,
        donationamount: amount
      });
    });

    // Success - redirect with success message
    let successMessage = `Thank you, ${firstname}! Your donation of $${amount.toFixed(2)} has been processed.`;
    
    if (wasNewUser) {
      // New user - mention they can log in
      successMessage += ' An account has been created for you. You can log in with your email and password "temp123" (please change it after logging in).';
    } else {
      // Existing user
      successMessage += ' Thank you for your continued support!';
    }
    
    res.redirect('/donate?success=' + encodeURIComponent(successMessage));
  } catch (error) {
    console.error('Error processing donation:', error);
    res.redirect('/donate?error=' + encodeURIComponent('An error occurred while processing your donation. Please try again or contact us for assistance.'));
  }
});

app.get('/contact', (req, res) => {
  res.render('public/contact', { currentPage: 'contact', pageTitle: 'Contact Us', pageDescription: 'Get in touch with the Ella Rises team.' });
});

// 418 I'm a Teapot - Easter Egg Route
app.get('/418', (req, res) => {
  res.status(418).render('errors/418', { 
    currentPage: '418', 
    pageTitle: "I'm a Teapot",
    pageDescription: 'HTCPCP/1.0 - The server refuses to brew coffee because it is, permanently, a teapot.'
  });
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

app.get('/participants', requireLogin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 25;
    const offset = (page - 1) * limit;
    const searchTerm = req.query.search ? `%${req.query.search.toLowerCase()}%` : '';

    // Build query
    let query = knex('people')
      .select(
        'personid',
        'email',
        'firstname',
        'lastname',
        'city',
        'state',
        'phone',
        'birthdate'
      );

    let countQuery = knex('people').count('* as total');

    // Apply search filter if provided
    if (searchTerm) {
      query = query.where(function() {
        this.whereRaw('LOWER(firstname) ILIKE ?', [searchTerm])
            .orWhereRaw('LOWER(lastname) ILIKE ?', [searchTerm])
            .orWhereRaw('LOWER(email) ILIKE ?', [searchTerm])
            .orWhereRaw('LOWER(city) ILIKE ?', [searchTerm])
            .orWhereRaw('LOWER(state) ILIKE ?', [searchTerm]);
      });
      countQuery = countQuery.where(function() {
        this.whereRaw('LOWER(firstname) ILIKE ?', [searchTerm])
            .orWhereRaw('LOWER(lastname) ILIKE ?', [searchTerm])
            .orWhereRaw('LOWER(email) ILIKE ?', [searchTerm])
            .orWhereRaw('LOWER(city) ILIKE ?', [searchTerm])
            .orWhereRaw('LOWER(state) ILIKE ?', [searchTerm]);
      });
    }

    // Get total count
    const totalResult = await countQuery.first();
    const totalParticipants = parseInt(totalResult.total);
    const totalPages = Math.ceil(totalParticipants / limit);

    // Get paginated results
    const allParticipants = await query
      .orderBy('lastname', 'asc')
      .orderBy('firstname', 'asc')
      .limit(limit)
      .offset(offset);

    // Format participants for display
    const participants = allParticipants.map(p => ({
      id: p.personid,
      firstName: p.firstname || '',
      lastName: p.lastname || '',
      email: p.email || '',
      city: p.city || '',
      state: p.state || '',
      phone: p.phone || '',
      birthdate: p.birthdate || null
    }));

    res.render('user/participants', { 
      currentPage: 'participants', 
      pageTitle: 'Participants', 
      participants: participants,
      searchTerm: req.query.search || '',
      currentPageNum: page,
      totalPages: totalPages,
      totalParticipants: totalParticipants,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
      message: req.query.message || null,
      messageType: req.query.messageType || null
    });
  } catch (error) {
    console.error('Error fetching participants:', error);
    res.status(500).render('errors/500', {
      currentPage: 'participants',
      pageTitle: 'Error',
      message: 'Failed to load participants.'
    });
  }
});

// GET /manage/participants/new - Redirect to user creation (merged functionality)
app.get('/manage/participants/new', requireManager, (req, res) => {
  res.redirect('/admin/users/new');
});

// GET /manage/participants/:id/edit - Show form to edit participant (manager only)
app.get('/manage/participants/:id/edit', requireManager, async (req, res) => {
  try {
    const personId = parseInt(req.params.id);
    
    const participant = await knex('people')
      .where('personid', personId)
      .first();

    if (!participant) {
      return res.status(404).render('errors/404', {
        currentPage: 'participants',
        pageTitle: 'Participant Not Found'
      });
    }

    res.render('admin/participant-form', {
      currentPage: 'participants',
      pageTitle: 'Edit Participant',
      participant: {
        personid: participant.personid,
        email: participant.email || '',
        firstname: participant.firstname || '',
        lastname: participant.lastname || '',
        city: participant.city || '',
        state: participant.state || '',
        phone: participant.phone || '',
        birthdate: participant.birthdate ? new Date(participant.birthdate).toISOString().split('T')[0] : ''
      },
      error: null
    });
  } catch (error) {
    console.error('Error fetching participant:', error);
    res.status(500).render('errors/500', {
      currentPage: 'participants',
      pageTitle: 'Error',
      message: 'Failed to load participant.'
    });
  }
});

// POST /manage/participants/:id - Update participant (manager only)
app.post('/manage/participants/:id', requireManager, async (req, res) => {
  try {
    const personId = parseInt(req.params.id);
    const { email, firstname, lastname, city, state, phone, birthdate } = req.body;

    // Check if participant exists
    const existingParticipant = await knex('people')
      .where('personid', personId)
      .first();

    if (!existingParticipant) {
      return res.status(404).render('errors/404', {
        currentPage: 'participants',
        pageTitle: 'Participant Not Found'
      });
    }

    // Validate required fields
    if (!firstname || !lastname) {
      return res.render('admin/participant-form', {
        currentPage: 'participants',
        pageTitle: 'Edit Participant',
        participant: { personid: personId, ...req.body },
        error: 'First name and last name are required.'
      });
    }

    // Email is read-only when editing (foreign key constraint)
    // Keep the existing email - don't update it
    const emailToUpdate = existingParticipant.email;

    // Update people table
    await knex('people')
      .where('personid', personId)
      .update({
        email: emailToUpdate,
        firstname: firstname,
        lastname: lastname,
        city: city || null,
        state: state || null,
        phone: phone || null,
        birthdate: birthdate || null
      });

    res.redirect('/participants?message=Participant updated successfully!&messageType=success');
  } catch (error) {
    console.error('Error updating participant:', error);
    res.status(500).render('errors/500', {
      currentPage: 'participants',
      pageTitle: 'Error',
      message: 'An error occurred while updating the participant: ' + error.message
    });
  }
});

// DELETE /manage/participants/:id - Delete participant (manager only)
app.delete('/manage/participants/:id', requireManager, async (req, res) => {
  try {
    const personId = parseInt(req.params.id);

    // Check if participant exists
    const participant = await knex('people')
      .where('personid', personId)
      .first();

    if (!participant) {
      return res.status(404).json({
        success: false,
        message: 'Participant not found.'
      });
    }

    // Delete participant (cascade should handle related records)
    await knex('people')
      .where('personid', personId)
      .del();

    res.json({
      success: true,
      message: 'Participant deleted successfully.'
    });
  } catch (error) {
    console.error('Error deleting participant:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting participant: ' + error.message
    });
  }
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

app.get('/milestones', requireLogin, async (req, res) => {
  try {
    // Get the logged-in user's personid first
    const loggedInPerson = await knex('people')
      .where('email', req.session.user.email)
      .first();

    // Get all milestone types from the system
    const allMilestoneTypes = await knex('milestonetypes')
      .orderBy('milestonecategory', 'asc')
      .orderBy('milestonetypeid', 'asc');

    // Get the logged-in user's milestones with milestone type info (both completed and incomplete)
    let userMilestones = [];
    if (loggedInPerson) {
      userMilestones = await knex('milestones')
        .leftJoin('milestonetypes', 'milestones.milestonetypeid', 'milestonetypes.milestonetypeid')
        .select(
          'milestones.milestoneid',
          'milestones.personid',
          'milestones.milestoneno',
          'milestones.milestonetitle',
          'milestones.milestonedate',
          'milestones.milestonetypeid',
          'milestonetypes.milestonecategory',
          'milestonetypes.milestonelevel'
        )
        .where('milestones.personid', loggedInPerson.personid)
        .orderBy('milestonetypes.milestonecategory', 'asc')
        .orderBy('milestonetypes.milestonetypeid', 'asc')
        .orderBy('milestones.milestonedate', 'asc');
    }

    // Create a map of user's milestones by milestonetypeid
    const userMilestonesByTypeId = {};
    userMilestones.forEach(m => {
      if (m.milestonetypeid) {
        userMilestonesByTypeId[m.milestonetypeid] = m;
      }
    });

    // Build full track structure: all milestone types with user's completion status
    const milestonesByCategory = {};
    allMilestoneTypes.forEach(milestoneType => {
      const category = milestoneType.milestonecategory || 'Uncategorized';
      if (!milestonesByCategory[category]) {
        milestonesByCategory[category] = [];
      }

      // Check if user has completed this milestone type
      const userMilestone = userMilestonesByTypeId[milestoneType.milestonetypeid];
      
      milestonesByCategory[category].push({
        milestonetypeid: milestoneType.milestonetypeid,
        milestonecategory: milestoneType.milestonecategory,
        milestonelevel: milestoneType.milestonelevel,
        // User's milestone data (if exists)
        milestoneid: userMilestone?.milestoneid || null,
        milestonetitle: userMilestone?.milestonetitle || null,
        milestonedate: userMilestone?.milestonedate || null,
        isCompleted: userMilestone && userMilestone.milestonedate !== null,
        isIncomplete: userMilestone && userMilestone.milestonedate === null
      });
    });

    // Determine primary track (category with most completed milestones)
    let primaryTrack = null;
    let maxCount = 0;
    Object.entries(milestonesByCategory).forEach(([category, milestones]) => {
      const completedCount = milestones.filter(m => m.isCompleted).length;
      if (completedCount > maxCount) {
        maxCount = completedCount;
        primaryTrack = category;
      }
    });

    // Calculate progress (user's completed milestones)
    const userCompletedCount = userMilestones.filter(m => m.milestonedate !== null).length;

    // Get all unique milestone titles that exist in the system
    const searchTerm = req.query.search ? `%${req.query.search.toLowerCase()}%` : '';
    let allUniqueMilestonesQuery = knex('milestones')
      .distinct('milestonetitle')
      .select('milestonetitle')
      .whereNotNull('milestonetitle');
    
    // Apply search filter if provided
    if (searchTerm) {
      allUniqueMilestonesQuery = allUniqueMilestonesQuery.whereRaw('LOWER(milestonetitle) ILIKE ?', [searchTerm]);
    }
    
    const allUniqueMilestones = await allUniqueMilestonesQuery.orderBy('milestonetitle', 'asc');

    // Create a map of completed milestone titles for the current user
    const completedMilestoneTitles = new Set(
      userMilestones.map(m => m.milestonetitle)
    );

    // Build list of all milestones with completion status
    const allMilestones = allUniqueMilestones.map(m => ({
      title: m.milestonetitle,
      isCompleted: completedMilestoneTitles.has(m.milestonetitle),
      completedDate: userMilestones.find(um => um.milestonetitle === m.milestonetitle)?.milestonedate || null
    }));

    // For managers: get recent completions across all users
    let participantMilestones = [];
    if (req.session.user.role === 'manager') {
      participantMilestones = await knex('milestones')
        .join('people', 'milestones.personid', 'people.personid')
        .select(
          'milestones.milestoneid',
          'milestones.personid as participantId',
          'milestones.milestonetitle as milestoneTitle',
          'milestones.milestonedate as completedAt',
          knex.raw("CONCAT(people.firstname, ' ', people.lastname) as participantName")
        )
        .whereNotNull('milestones.milestonedate')
        .orderBy('milestones.milestonedate', 'desc')
        .limit(20);
    }

    res.render('user/milestones', { 
      currentPage: 'milestones', 
      pageTitle: 'Milestones', 
      userMilestones,
      userCompletedCount,
      milestonesByCategory,
      primaryTrack,
      allMilestones,
      participantMilestones,
      searchTerm: req.query.search || '',
      user: req.session.user
    });
  } catch (error) {
    console.error('Error fetching milestones:', error);
    res.render('user/milestones', { 
      currentPage: 'milestones', 
      pageTitle: 'Milestones', 
      userMilestones: [],
      userCompletedCount: 0,
      milestonesByCategory: {},
      primaryTrack: null,
      allMilestones: [],
      participantMilestones: [],
      searchTerm: '',
      user: req.session.user
    });
  }
});

app.get('/surveys', requireLogin, async (req, res) => {
  try {
    if (req.session.user.role === 'manager') {
      // Manager view: All surveys with search and pagination
      const page = parseInt(req.query.page) || 1;
      const limit = 20;
      const offset = (page - 1) * limit;
      const searchTerm = req.query.search ? `%${req.query.search.toLowerCase()}%` : '';

      // Based on ERD: survey table stores responses, surveyquestions stores question definitions
      // We'll group by event_detail to show surveys per event, or use surveyquestions
      // For now, let's use DISTINCT eventdetailid from survey table to represent surveys
      let query;
      let countQuery;
      
      if (searchTerm) {
        // Search surveys by event name or description - show all events (each event has a survey)
        query = knex.raw(`
          SELECT DISTINCT
            ed.eventdetailid as surveyid,
            e.eventname as title,
            e.eventdescription as description,
            ed.eventdatetimestart as createdat
          FROM events e
          INNER JOIN event_details ed ON e.eventid = ed.eventid
          WHERE (LOWER(e.eventname) ILIKE ? OR LOWER(e.eventdescription) ILIKE ?)
          ORDER BY ed.eventdatetimestart DESC
          LIMIT ? OFFSET ?
        `, [searchTerm, searchTerm, limit, offset]);
        
        countQuery = knex.raw(`
          SELECT COUNT(DISTINCT ed.eventdetailid) as total
          FROM events e
          INNER JOIN event_details ed ON e.eventid = ed.eventid
          WHERE (LOWER(e.eventname) ILIKE ? OR LOWER(e.eventdescription) ILIKE ?)
        `, [searchTerm, searchTerm]);
      } else {
        // Show all events (assuming each event has a survey)
        query = knex.raw(`
          SELECT DISTINCT
            ed.eventdetailid as surveyid,
            e.eventname as title,
            e.eventdescription as description,
            ed.eventdatetimestart as createdat
          FROM events e
          INNER JOIN event_details ed ON e.eventid = ed.eventid
          ORDER BY ed.eventdatetimestart DESC
          LIMIT ? OFFSET ?
        `, [limit, offset]);
        
        countQuery = knex.raw(`
          SELECT COUNT(DISTINCT ed.eventdetailid) as total
          FROM events e
          INNER JOIN event_details ed ON e.eventid = ed.eventid
        `);
      }

      // Get total count
      const countResult = await countQuery;
      const totalSurveys = parseInt(countResult.rows[0].total);
      const totalPages = Math.ceil(totalSurveys / limit);

      // Get paginated results
      const allSurveysResult = await query;
      const allSurveys = allSurveysResult.rows;

      // Get response counts for each survey (count responses per eventdetailid)
      const eventDetailIds = allSurveys.map(s => s.surveyid);
      const responseCounts = {};
      
      if (eventDetailIds.length > 0) {
        try {
          const responses = await knex.raw(`
            SELECT eventdetailid, COUNT(DISTINCT personid) as count
            FROM survey
            WHERE eventdetailid = ANY(?::int[])
            GROUP BY eventdetailid
          `, [eventDetailIds]);
          
          responses.rows.forEach(row => {
            responseCounts[row.eventdetailid] = parseInt(row.count);
          });
        } catch (err) {
          console.log('Note: Could not get response counts:', err.message);
        }
      }

      // Format surveys for display
      const surveys = allSurveys.map(s => ({
        id: s.surveyid,
        title: s.title || 'Event Survey',
        description: s.description || '',
        status: 'active',
        responses: responseCounts[s.surveyid] || 0,
        createdAt: s.createdat || null // Use eventdatetimestart from event_details
      }));

      res.render('admin/surveys-manage', {
        currentPage: 'surveys',
        pageTitle: 'Manage Surveys',
        surveys: surveys,
        searchTerm: req.query.search || '',
        currentPageNum: page,
        totalPages: totalPages,
        totalSurveys: totalSurveys,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
        message: req.query.message || null,
        messageType: req.query.messageType || null
      });
    } else {
      // User view: Show surveys for upcoming events
      const activeSurveysResult = await knex.raw(`
        SELECT DISTINCT
          ed.eventdetailid as surveyid,
          e.eventname as title,
          e.eventdescription as description,
          ed.eventdatetimestart as createdat
        FROM survey s
        INNER JOIN event_details ed ON s.eventdetailid = ed.eventdetailid
        INNER JOIN events e ON ed.eventid = e.eventid
        WHERE ed.eventdatetimestart >= NOW()
        ORDER BY ed.eventdatetimestart ASC
        LIMIT 20
      `);
      const activeSurveys = activeSurveysResult.rows;

      const surveys = activeSurveys.map(s => ({
        id: s.surveyid,
        title: s.title || 'Untitled Survey',
        description: s.description || '',
        status: 'active',
        responses: 0,
        createdAt: s.createdat || null // Use eventdatetimestart from event_details
      }));

      res.render('user/surveys', {
        currentPage: 'surveys',
        pageTitle: 'Surveys',
        surveys: surveys
      });
    }
  } catch (error) {
    console.error('Error fetching surveys:', error);
    res.status(500).render('errors/500', {
      currentPage: 'surveys',
      pageTitle: 'Error',
      message: 'Failed to load surveys.'
    });
  }
});











// ============================================
// ADMIN PAGES (views/admin/) - requires manager
// ============================================

app.get('/manage/events', requireManager, async (req, res) => {
  try {
    const search = req.query.search || '';
    const page = parseInt(req.query.page) || 1;
    const limit = 20;
    const offset = (page - 1) * limit;

    // Build query
    let query = knex('events')
      .leftJoin('event_details', 'events.eventid', 'event_details.eventid')
      .select(
        'events.eventid as id',
        'events.eventname as title',
        'events.eventtype as eventType',
        'events.eventdescription as description',
        'event_details.eventdatetimestart as eventDate',
        'event_details.eventdatetimeend as eventEndDate',
        'event_details.eventregistrationdeadline as registrationDeadline',
        'event_details.eventcapacity as capacity',
        'event_details.eventlocation as location',
        'event_details.eventdetailid as detailId'
      );

    // Apply search filter if provided
    if (search) {
      query = query.where(function() {
        this.where('events.eventname', 'ilike', `%${search}%`)
          .orWhere('events.eventdescription', 'ilike', `%${search}%`)
          .orWhere('event_details.eventlocation', 'ilike', `%${search}%`);
      });
    }

    // Get total count for pagination
    const countQuery = query.clone().clearSelect().count('* as total').first();
    const totalResult = await countQuery;
    const totalEvents = parseInt(totalResult.total);
    const totalPages = Math.ceil(totalEvents / limit);

    // Apply pagination and ordering
    const allEvents = await query
      .orderBy('event_details.eventdatetimestart', 'desc')
      .limit(limit)
      .offset(offset);

    // Format events for display
    const events = allEvents.map(event => {
      const eventDate = event.eventDate ? new Date(event.eventDate) : null;
      return {
        id: event.id,
        title: event.title,
        eventType: event.eventType,
        description: event.description,
        recurrence: event.recurrence,
        eventDate: event.eventDate,
        eventTime: eventDate ? eventDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : 'N/A',
        eventEndDate: event.eventEndDate,
        registrationDeadline: event.registrationDeadline,
        capacity: event.capacity,
        location: event.location,
        detailId: event.detailId,
        registered: 0 // TODO: Get actual registration count from database
      };
    });

    res.render('admin/events-manage', { 
      currentPage: 'events', 
      pageTitle: 'Manage Events', 
      events,
      search,
      currentPageNum: page,
      totalPages,
      totalEvents,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
      message: req.query.message || null,
      messageType: req.query.messageType || null
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).render('errors/500', {
      currentPage: 'events',
      pageTitle: 'Error',
      message: 'Failed to load events.'
    });
  }
});

app.get('/manage/events/new', requireManager, (req, res) => {
  res.render('admin/event-form', { 
    currentPage: 'events', 
    pageTitle: 'Create Event', 
    event: null,
    error: null
  });
});

app.get('/manage/events/:id/edit', requireManager, async (req, res) => {
  try {
    const eventId = parseInt(req.params.id);
    
    const event = await knex('events')
      .leftJoin('event_details', 'events.eventid', 'event_details.eventid')
      .where('events.eventid', eventId)
      .select(
        'events.eventid as id',
        'events.eventname as title',
        'events.eventtype as eventType',
        'events.eventdescription as description',
        'event_details.eventdatetimestart as eventDate',
        'event_details.eventdatetimeend as eventEndDate',
        'event_details.eventregistrationdeadline as registrationDeadline',
        'event_details.eventcapacity as capacity',
        'event_details.eventlocation as location',
        'event_details.eventdetailid as detailId'
      )
      .first();

    if (!event) {
      return res.status(404).render('errors/404', { 
        currentPage: 'events', 
        pageTitle: 'Event Not Found' 
      });
    }

    // Format date and time for form inputs
    const eventDate = event.eventDate ? new Date(event.eventDate) : null;
    const formattedEvent = {
      id: event.id,
      title: event.title,
      eventType: event.eventType,
      description: event.description,
      recurrence: event.recurrence,
      eventDate: eventDate ? eventDate.toISOString().split('T')[0] : '',
      eventTime: eventDate ? eventDate.toTimeString().slice(0, 5) : '',
      eventEndDate: event.eventEndDate ? new Date(event.eventEndDate).toISOString().split('T')[0] : '',
      eventEndTime: event.eventEndDate ? new Date(event.eventEndDate).toTimeString().slice(0, 5) : '',
      registrationDeadline: event.registrationDeadline ? new Date(event.registrationDeadline).toISOString().split('T')[0] : '',
      capacity: event.capacity,
      location: event.location,
      detailId: event.detailId
    };

    res.render('admin/event-form', { 
      currentPage: 'events', 
      pageTitle: 'Edit Event', 
      event: formattedEvent,
      error: null
    });
  } catch (error) {
    console.error('Error fetching event:', error);
    res.status(500).render('errors/500', {
      currentPage: 'events',
      pageTitle: 'Error',
      message: 'Failed to load event.'
    });
  }
});

// POST /manage/events - Create new event
app.post('/manage/events', requireManager, async (req, res) => {
  try {
    const { title, eventType, description, eventDate, eventTime, eventEndDate, eventEndTime, location, capacity, registrationDeadline, recurrence } = req.body;

    // Validate required fields
    if (!title || !eventType || !description || !eventDate || !eventTime || !location || !capacity) {
      return res.render('admin/event-form', {
        currentPage: 'events',
        pageTitle: 'Create Event',
        event: req.body,
        error: 'All required fields must be filled.'
      });
    }

    // Get max eventid and add 1
    const maxEvent = await knex('events')
      .max('eventid as maxid')
      .first();
    const nextEventId = maxEvent && maxEvent.maxid ? parseInt(maxEvent.maxid) + 1 : 1;

    // Combine date and time for eventdatetimestart
    const eventDateTimeStart = new Date(`${eventDate}T${eventTime}`);
    
    // Combine date and time for eventdatetimeend (use eventEndDate if provided, otherwise use eventDate)
    let eventDateTimeEnd = null;
    if (eventEndDate && eventEndTime) {
      eventDateTimeEnd = new Date(`${eventEndDate}T${eventEndTime}`);
    } else if (eventEndDate) {
      eventDateTimeEnd = new Date(`${eventEndDate}T${eventTime}`);
    }

    // Insert into events table
    await knex('events').insert({
      eventid: nextEventId,
      eventname: title,
      eventtype: eventType,
      eventdescription: description
    });

    // Get max eventdetailid and add 1
    const maxDetail = await knex('event_details')
      .max('eventdetailid as maxid')
      .first();
    const nextDetailId = maxDetail && maxDetail.maxid ? parseInt(maxDetail.maxid) + 1 : 1;

    // Insert into event_details table
    await knex('event_details').insert({
      eventdetailid: nextDetailId,
      eventid: nextEventId,
      eventdatetimestart: eventDateTimeStart,
      eventdatetimeend: eventDateTimeEnd,
      eventlocation: location,
      eventcapacity: parseInt(capacity),
      eventregistrationdeadline: registrationDeadline ? new Date(registrationDeadline) : null
    });

    res.redirect('/manage/events?message=Event created successfully!&messageType=success');
  } catch (error) {
    console.error('Error creating event:', error);
    res.render('admin/event-form', {
      currentPage: 'events',
      pageTitle: 'Create Event',
      event: req.body,
      error: 'An error occurred while creating the event: ' + error.message
    });
  }
});

// POST /manage/events/:id - Update event
app.post('/manage/events/:id', requireManager, async (req, res) => {
  try {
    const eventId = parseInt(req.params.id);
    const { title, eventType, description, eventDate, eventTime, eventEndDate, eventEndTime, location, capacity, registrationDeadline, recurrence } = req.body;

    // Check if event exists
    const existingEvent = await knex('events')
      .where('eventid', eventId)
      .first();

    if (!existingEvent) {
      return res.status(404).render('errors/404', {
        currentPage: 'events',
        pageTitle: 'Event Not Found'
      });
    }

    // Combine date and time for eventdatetimestart
    const eventDateTimeStart = new Date(`${eventDate}T${eventTime}`);
    
    // Combine date and time for eventdatetimeend
    let eventDateTimeEnd = null;
    if (eventEndDate && eventEndTime) {
      eventDateTimeEnd = new Date(`${eventEndDate}T${eventEndTime}`);
    } else if (eventEndDate) {
      eventDateTimeEnd = new Date(`${eventEndDate}T${eventTime}`);
    }

    // Update events table
    await knex('events')
      .where('eventid', eventId)
      .update({
        eventname: title,
        eventtype: eventType,
        eventdescription: description
      });

    // Update or create event_details
    const existingDetail = await knex('event_details')
      .where('eventid', eventId)
      .first();

    if (existingDetail) {
      await knex('event_details')
        .where('eventid', eventId)
        .update({
          eventdatetimestart: eventDateTimeStart,
          eventdatetimeend: eventDateTimeEnd,
          eventlocation: location,
          eventcapacity: parseInt(capacity),
          eventregistrationdeadline: registrationDeadline ? new Date(registrationDeadline) : null
        });
    } else {
      // Create new detail if it doesn't exist
      const maxDetail = await knex('event_details')
        .max('eventdetailid as maxid')
        .first();
      const nextDetailId = maxDetail && maxDetail.maxid ? parseInt(maxDetail.maxid) + 1 : 1;

      await knex('event_details').insert({
        eventdetailid: nextDetailId,
        eventid: eventId,
        eventdatetimestart: eventDateTimeStart,
        eventdatetimeend: eventDateTimeEnd,
        eventlocation: location,
        eventcapacity: parseInt(capacity),
        eventregistrationdeadline: registrationDeadline ? new Date(registrationDeadline) : null
      });
    }

    res.redirect('/manage/events?message=Event updated successfully!&messageType=success');
  } catch (error) {
    console.error('Error updating event:', error);
    res.render('admin/event-form', {
      currentPage: 'events',
      pageTitle: 'Edit Event',
      event: { ...req.body, id: parseInt(req.params.id) },
      error: 'An error occurred while updating the event: ' + error.message
    });
  }
});

// DELETE /manage/events/:id - Delete event
app.delete('/manage/events/:id', requireManager, async (req, res) => {
  try {
    const eventId = parseInt(req.params.id);

    // Delete from event_details first (foreign key constraint)
    await knex('event_details')
      .where('eventid', eventId)
      .del();

    // Then delete from events table
    await knex('events')
      .where('eventid', eventId)
      .del();

    res.json({
      success: true,
      message: 'Event deleted successfully.'
    });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting event: ' + error.message
    });
  }
});

// ============================================
// TRANSPORTATION / CARPOOLING ROUTES
// ============================================

// GET /admin/events/:detailId/transportation - View transportation management page
app.get('/admin/events/:detailId/transportation', requireManager, async (req, res) => {
  try {
    const eventDetailId = parseInt(req.params.detailId);

    // Get event details
    const eventDetail = await knex('event_details')
      .join('events', 'event_details.eventid', 'events.eventid')
      .where('event_details.eventdetailid', eventDetailId)
      .select(
        'events.eventname as title',
        'events.eventdescription as description',
        'event_details.eventlocation as location',
        'event_details.eventdatetimestart as eventDate'
      )
      .first();

    if (!eventDetail) {
      return res.status(404).render('errors/404', {
        currentPage: 'events',
        pageTitle: 'Event Not Found'
      });
    }

    // Get carpooling data for this event
    const carpoolData = getCarpoolingData(eventDetailId);

    // Get existing matches
    const matches = carpoolData.matches || [];
    const matchedRiderEmails = matches.map(m => m.riderEmail);
    const driverMatchCounts = {};
    matches.forEach(match => {
      driverMatchCounts[match.driverEmail] = (driverMatchCounts[match.driverEmail] || 0) + 1;
    });

    // Format drivers and riders for display
    const drivers = carpoolData.drivers.map(driver => ({
      userEmail: driver.email,
      userName: driver.name,
      userPhone: driver.phone,
      address: driver.address,
      radius: driver.radius,
      seatCount: driver.seatCount,
      matchedCount: driverMatchCounts[driver.email] || 0,
      availableSeats: driver.seatCount - (driverMatchCounts[driver.email] || 0)
    }));

    // Filter out already matched riders
    const availableRiders = carpoolData.riders
      .filter(rider => !matchedRiderEmails.includes(rider.email))
      .map(rider => ({
        userEmail: rider.email,
        userName: rider.name,
        userPhone: rider.phone,
        address: rider.address
      }));

    // Format matches for display
    const formattedMatches = matches.map(match => {
      const driver = carpoolData.drivers.find(d => d.email === match.driverEmail);
      const rider = carpoolData.riders.find(r => r.email === match.riderEmail);
      return {
        driverEmail: match.driverEmail,
        driverName: driver?.name || match.driverEmail,
        riderEmail: match.riderEmail,
        riderName: rider?.name || match.riderEmail,
        matchedAt: match.matchedAt
      };
    });

    res.render('admin/manage-transportation', {
      currentPage: 'events',
      pageTitle: 'Manage Transportation',
      event: {
        ...eventDetail,
        detailId: eventDetailId
      },
      drivers: drivers,
      riders: availableRiders,
      matches: formattedMatches,
      matchMessage: req.query.message || null,
      matchSuccess: req.query.success === 'true'
    });
  } catch (error) {
    console.error('Error loading transportation page:', error);
    res.status(500).render('errors/500', {
      currentPage: 'events',
      pageTitle: 'Error',
      message: 'Failed to load transportation page.'
    });
  }
});

// POST /admin/events/:detailId/match - Match a driver with a rider
app.post('/admin/events/:detailId/match', requireManager, async (req, res) => {
  try {
    const eventDetailId = parseInt(req.params.detailId);
    const { driverEmail, riderEmail } = req.body;

    if (!driverEmail || !riderEmail) {
      return res.redirect(`/admin/events/${eventDetailId}/transportation?message=${encodeURIComponent('Please select both a driver and a rider.')}&success=false`);
    }

    const carpoolData = getCarpoolingData(eventDetailId);

    // Find driver and rider
    const driver = carpoolData.drivers.find(d => d.email === driverEmail);
    const rider = carpoolData.riders.find(r => r.email === riderEmail);

    if (!driver || !rider) {
      return res.redirect(`/admin/events/${eventDetailId}/transportation?message=${encodeURIComponent('Driver or rider not found.')}&success=false`);
    }

    // Check if driver has available seats
    const currentMatches = carpoolData.matches || [];
    const driverMatches = currentMatches.filter(m => m.driverEmail === driverEmail).length;
    
    if (driverMatches >= driver.seatCount) {
      return res.redirect(`/admin/events/${eventDetailId}/transportation?message=${encodeURIComponent('Driver has no available seats remaining.')}&success=false`);
    }

    // Check if rider is already matched
    const riderAlreadyMatched = currentMatches.some(m => m.riderEmail === riderEmail);
    if (riderAlreadyMatched) {
      return res.redirect(`/admin/events/${eventDetailId}/transportation?message=${encodeURIComponent('This rider has already been matched with a driver.')}&success=false`);
    }

    // Check if this exact match already exists
    const duplicateMatch = currentMatches.some(m => m.driverEmail === driverEmail && m.riderEmail === riderEmail);
    if (duplicateMatch) {
      return res.redirect(`/admin/events/${eventDetailId}/transportation?message=${encodeURIComponent('This match already exists.')}&success=false`);
    }

    // Create match
    if (!carpoolData.matches) {
      carpoolData.matches = [];
    }
    
    carpoolData.matches.push({
      driverEmail: driverEmail,
      riderEmail: riderEmail,
      matchedAt: new Date()
    });

    // TODO: Send notification emails to driver and rider
    // For now, just redirect with success message

    res.redirect(`/admin/events/${eventDetailId}/transportation?message=${encodeURIComponent(`Successfully matched ${driverEmail} with ${riderEmail}!`)}&success=true`);
  } catch (error) {
    console.error('Error creating match:', error);
    res.redirect(`/admin/events/${req.params.detailId}/transportation?message=${encodeURIComponent('Error creating match: ' + error.message)}&success=false`);
  }
});

// GET /manage/surveys/new - Show form to add new survey (manager only)
app.get('/manage/surveys/new', requireManager, (req, res) => {
  res.render('admin/survey-form', {
    currentPage: 'surveys',
    pageTitle: 'Create Survey',
    survey: null,
    error: null
  });
});

// GET /surveys/:id/edit - Show form to edit survey (manager only)
app.get('/surveys/:id/edit', requireManager, async (req, res) => {
  try {
    const surveyId = parseInt(req.params.id);
    
    // Get event details for this survey (survey is identified by eventdetailid)
    const surveyResult = await knex.raw(`
      SELECT 
        ed.eventdetailid,
        e.eventname,
        e.eventdescription
      FROM event_details ed
      INNER JOIN events e ON ed.eventid = e.eventid
      WHERE ed.eventdetailid = ?
      LIMIT 1
    `, [surveyId]);
    const survey = surveyResult.rows[0];

    if (!survey) {
      return res.status(404).render('errors/404', {
        currentPage: 'surveys',
        pageTitle: 'Survey Not Found'
      });
    }

    res.render('admin/survey-form', {
      currentPage: 'surveys',
      pageTitle: 'Edit Survey',
      survey: {
        surveyid: survey.eventdetailid,
        surveytitle: survey.eventname || '',
        surveydescription: survey.eventdescription || ''
      },
      error: null
    });
  } catch (error) {
    console.error('Error fetching survey:', error);
    res.status(500).render('errors/500', {
      currentPage: 'surveys',
      pageTitle: 'Error',
      message: 'Failed to load survey.'
    });
  }
});

// POST /manage/surveys - Create new survey (manager only)
app.post('/manage/surveys', requireManager, async (req, res) => {
  try {
    const { surveytitle, surveydescription } = req.body;

    // Validate required fields
    if (!surveytitle) {
      return res.render('admin/survey-form', {
        currentPage: 'surveys',
        pageTitle: 'Create Survey',
        survey: req.body,
        error: 'Survey title is required.'
      });
    }

    // Note: Based on ERD, surveys are linked to events via event_details
    // For now, we'll create a new event and event_detail for the survey
    // Get max eventid and eventdetailid
    const maxEventResult = await knex.raw(`SELECT MAX(eventid) as maxid FROM events`);
    const maxEvent = maxEventResult.rows[0];
    const nextEventId = maxEvent && maxEvent.maxid ? parseInt(maxEvent.maxid) + 1 : 1;

    const maxDetailResult = await knex.raw(`SELECT MAX(eventdetailid) as maxid FROM event_details`);
    const maxDetail = maxDetailResult.rows[0];
    const nextDetailId = maxDetail && maxDetail.maxid ? parseInt(maxDetail.maxid) + 1 : 1;

    // Insert into events table
    await knex.raw(`
      INSERT INTO events (eventid, eventname, eventtype, eventdescription)
      VALUES (?, ?, ?, ?)
    `, [nextEventId, surveytitle, 'Survey', surveydescription || null]);

    // Insert into event_details table
    // Set created date to today (current date/time)
    // This represents when the survey was created
    const today = new Date();
    const eventEndDate = new Date(today);
    eventEndDate.setHours(today.getHours() + 2); // Default 2 hour duration for the event
    
    await knex.raw(`
      INSERT INTO event_details (eventdetailid, eventid, eventdatetimestart, eventdatetimeend)
      VALUES (?, ?, ?, ?)
    `, [nextDetailId, nextEventId, today, eventEndDate]);
    
    // Note: No survey responses are created here - the survey table will be empty
    // until participants actually submit responses to this survey

    res.redirect('/surveys?message=Survey created successfully!&messageType=success');
  } catch (error) {
    console.error('Error creating survey:', error);
    res.render('admin/survey-form', {
      currentPage: 'surveys',
      pageTitle: 'Create Survey',
      survey: req.body,
      error: 'An error occurred while creating the survey: ' + error.message
    });
  }
});

// POST /manage/surveys/:id - Update survey (manager only)
app.post('/manage/surveys/:id', requireManager, async (req, res) => {
  try {
    const surveyId = parseInt(req.params.id);
    const { surveytitle, surveydescription } = req.body;

    // Check if event_detail exists (survey is identified by eventdetailid)
    const existingSurveyResult = await knex.raw(`
      SELECT ed.eventdetailid, ed.eventid
      FROM event_details ed
      WHERE ed.eventdetailid = ? LIMIT 1
    `, [surveyId]);
    const existingSurvey = existingSurveyResult.rows[0];

    if (!existingSurvey) {
      return res.status(404).render('errors/404', {
        currentPage: 'surveys',
        pageTitle: 'Survey Not Found'
      });
    }

    // Validate required fields
    if (!surveytitle) {
      return res.render('admin/survey-form', {
        currentPage: 'surveys',
        pageTitle: 'Edit Survey',
        survey: { surveyid: surveyId, ...req.body },
        error: 'Survey title is required.'
      });
    }

    // Update events table
    await knex.raw(`
      UPDATE events
      SET eventname = ?, eventdescription = ?
      WHERE eventid = ?
    `, [surveytitle, surveydescription || null, existingSurvey.eventid]);

    res.redirect('/surveys?message=Survey updated successfully!&messageType=success');
  } catch (error) {
    console.error('Error updating survey:', error);
    res.status(500).render('errors/500', {
      currentPage: 'surveys',
      pageTitle: 'Error',
      message: 'An error occurred while updating the survey: ' + error.message
    });
  }
});

// DELETE /manage/surveys/:id - Delete survey (manager only)
app.delete('/manage/surveys/:id', requireManager, async (req, res) => {
  try {
    const surveyId = parseInt(req.params.id);

    // Check if event_detail exists (survey is identified by eventdetailid)
    const surveyResult = await knex.raw(`
      SELECT ed.eventdetailid, ed.eventid
      FROM event_details ed
      WHERE ed.eventdetailid = ? LIMIT 1
    `, [surveyId]);
    const survey = surveyResult.rows[0];

    if (!survey) {
      return res.status(404).json({
        success: false,
        message: 'Survey not found.'
      });
    }

    // Delete survey responses first
    try {
      await knex.raw(`
        DELETE FROM survey WHERE eventdetailid = ?
      `, [surveyId]);
    } catch (err) {
      console.log('Note: Could not delete survey responses:', err.message);
    }

    // Delete event_details
    await knex.raw(`
      DELETE FROM event_details WHERE eventdetailid = ?
    `, [surveyId]);

    // Delete event (if no other event_details exist for this event)
    const otherDetails = await knex.raw(`
      SELECT COUNT(*) as count FROM event_details WHERE eventid = ?
    `, [survey.eventid]);
    
    if (parseInt(otherDetails.rows[0].count) === 0) {
      await knex.raw(`
        DELETE FROM events WHERE eventid = ?
      `, [survey.eventid]);
    }

    res.json({
      success: true,
      message: 'Survey deleted successfully.'
    });
  } catch (error) {
    console.error('Error deleting survey:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting survey: ' + error.message
    });
  }
});

// GET /surveys/:id/responses - View survey responses (manager only)
app.get('/surveys/:id/responses', requireManager, async (req, res) => {
  try {
    const eventDetailId = parseInt(req.params.id);

    // Get survey/event info
    const surveyInfoResult = await knex.raw(`
      SELECT 
        ed.eventdetailid,
        e.eventname,
        e.eventdescription,
        ed.eventdatetimestart
      FROM event_details ed
      INNER JOIN events e ON ed.eventid = e.eventid
      WHERE ed.eventdetailid = ?
      LIMIT 1
    `, [eventDetailId]);
    
    const surveyInfo = surveyInfoResult.rows[0];
    
    if (!surveyInfo) {
      return res.status(404).render('errors/404', {
        currentPage: 'surveys',
        pageTitle: 'Survey Not Found'
      });
    }

    // Get all responses for this survey (eventdetailid)
    const responsesResult = await knex.raw(`
      SELECT 
        s.questionid,
        s.personid,
        s.surveyquestionno,
        s.surveyresponse,
        sq.surveyquestionname,
        p.firstname,
        p.lastname,
        p.email
      FROM survey s
      INNER JOIN surveyquestions sq ON s.surveyquestionno = sq.surveyquestionno
      INNER JOIN people p ON s.personid = p.personid
      WHERE s.eventdetailid = ?
      ORDER BY p.lastname, p.firstname, sq.surveyquestionno
    `, [eventDetailId]);

    const allResponses = responsesResult.rows;

    // Group responses by participant
    const responsesByParticipant = {};
    allResponses.forEach(response => {
      const participantKey = response.personid;
      if (!responsesByParticipant[participantKey]) {
        responsesByParticipant[participantKey] = {
          personid: response.personid,
          name: `${response.firstname || ''} ${response.lastname || ''}`.trim() || 'Unknown',
          email: response.email || '',
          responses: []
        };
      }
      responsesByParticipant[participantKey].responses.push({
        questionno: response.surveyquestionno,
        questionname: response.surveyquestionname,
        response: response.surveyresponse
      });
    });

    // Convert to array and sort by name
    const participants = Object.values(responsesByParticipant).sort((a, b) => 
      a.name.localeCompare(b.name)
    );

    // Get all unique questions for this survey (to show question order)
    const questionsResult = await knex.raw(`
      SELECT DISTINCT
        sq.surveyquestionno,
        sq.surveyquestionname
      FROM survey s
      INNER JOIN surveyquestions sq ON s.surveyquestionno = sq.surveyquestionno
      WHERE s.eventdetailid = ?
      ORDER BY sq.surveyquestionno
    `, [eventDetailId]);
    
    const questions = questionsResult.rows;

    res.render('admin/survey-responses', {
      currentPage: 'surveys',
      pageTitle: `Survey Responses - ${surveyInfo.eventname}`,
      surveyInfo: {
        id: surveyInfo.eventdetailid,
        title: surveyInfo.eventname,
        description: surveyInfo.eventdescription,
        eventDate: surveyInfo.eventdatetimestart
      },
      participants: participants,
      questions: questions,
      totalResponses: allResponses.length,
      totalParticipants: participants.length
    });
  } catch (error) {
    console.error('Error fetching survey responses:', error);
    res.status(500).render('errors/500', {
      currentPage: 'surveys',
      pageTitle: 'Error',
      message: 'Failed to load survey responses.'
    });
  }
});

// GET /donations - View all donations (manager only, or logged in user)
app.get('/donations', requireLogin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 20;
    const offset = (page - 1) * limit;
    const searchTerm = req.query.search ? `%${req.query.search.toLowerCase()}%` : '';

    // Build query
    let query = knex('donations')
      .leftJoin('people', 'donations.personid', 'people.personid')
      .select(
        'donations.donationid',
        'donations.personid',
        'donations.donationamount',
        'donations.donationdate',
        'people.firstname',
        'people.lastname',
        'people.email'
      );

    let countQuery = knex('donations').count('* as total');

    // Apply search filter if provided
    if (searchTerm) {
      query = query.where(function() {
        this.whereRaw('LOWER(people.firstname) ILIKE ?', [searchTerm])
            .orWhereRaw('LOWER(people.lastname) ILIKE ?', [searchTerm])
            .orWhereRaw('LOWER(people.email) ILIKE ?', [searchTerm])
            .orWhereRaw('CAST(donations.donationamount AS TEXT) ILIKE ?', [searchTerm]);
      });
      countQuery = countQuery
        .leftJoin('people', 'donations.personid', 'people.personid')
        .where(function() {
          this.whereRaw('LOWER(people.firstname) ILIKE ?', [searchTerm])
              .orWhereRaw('LOWER(people.lastname) ILIKE ?', [searchTerm])
              .orWhereRaw('LOWER(people.email) ILIKE ?', [searchTerm])
              .orWhereRaw('CAST(donations.donationamount AS TEXT) ILIKE ?', [searchTerm]);
        });
    }

    // Get total count
    const totalResult = await countQuery.first();
    const totalDonations = parseInt(totalResult.total);
    const totalPages = Math.ceil(totalDonations / limit);

    // Get paginated results
    const allDonations = await query
      .orderBy('donations.donationid', 'desc')
      .limit(limit)
      .offset(offset);

    // Calculate total amount
    const totalAmountResult = await knex('donations').sum('donationamount as total').first();
    const totalAmount = parseFloat(totalAmountResult.total) || 0;

    // Format donations for display
    const donations = allDonations.map(d => ({
      id: d.donationid,
      donorName: d.firstname && d.lastname ? `${d.firstname} ${d.lastname}` : (d.firstname || d.lastname || 'Anonymous'),
      donorEmail: d.email || null,
      amount: parseFloat(d.donationamount) || 0,
      donationDate: d.donationdate,
      personId: d.personid
    }));

    res.render('admin/donations', {
      currentPage: 'donations',
      pageTitle: 'Donations',
      donations: donations,
      totalDonations: totalDonations,
      totalAmount: totalAmount,
      searchTerm: req.query.search || '',
      currentPageNum: page,
      totalPages: totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
      message: req.query.message || null,
      messageType: req.query.messageType || null
    });
  } catch (error) {
    console.error('Error fetching donations:', error);
    res.status(500).render('errors/500', {
      currentPage: 'donations',
      pageTitle: 'Error',
      message: 'Failed to load donations.'
    });
  }
});

// GET /manage/donations/new - Show form to add new donation (manager only)
// API endpoint to search for users/participants
app.get('/api/search-users', requireManager, async (req, res) => {
  try {
    const searchTerm = req.query.q || '';
    
    if (!searchTerm || searchTerm.length < 2) {
      return res.json([]);
    }

    const users = await knex('people')
      .select('personid', 'firstname', 'lastname', 'email', 'city', 'state')
      .where(function() {
        this.whereRaw('LOWER(firstname) ILIKE ?', [`%${searchTerm.toLowerCase()}%`])
          .orWhereRaw('LOWER(lastname) ILIKE ?', [`%${searchTerm.toLowerCase()}%`])
          .orWhereRaw('LOWER(email) ILIKE ?', [`%${searchTerm.toLowerCase()}%`]);
      })
      .orderBy('lastname', 'asc')
      .orderBy('firstname', 'asc')
      .limit(20);

    res.json(users);
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({ error: 'Error searching users' });
  }
});

app.get('/manage/donations/new', requireManager, (req, res) => {
  res.render('admin/donation-form', {
    currentPage: 'donations',
    pageTitle: 'Record Donation',
    donation: null,
    error: null
  });
});

// POST /manage/donations - Create new donation (manager only)
app.post('/manage/donations', requireManager, async (req, res) => {
  try {
    const { personid, donationamount, donationdate } = req.body;

    // Validate required fields
    if (!donationamount || !donationdate) {
      return res.render('admin/donation-form', {
        currentPage: 'donations',
        pageTitle: 'Record Donation',
        donation: req.body,
        error: 'Amount and date are required.'
      });
    }

    // Get max donationid and add 1
    const maxDonation = await knex('donations')
      .max('donationid as maxid')
      .first();
    const nextDonationId = maxDonation && maxDonation.maxid ? parseInt(maxDonation.maxid) + 1 : 1;

    // Insert into donation table
    await knex('donations').insert({
      donationid: nextDonationId,
      personid: personid || null,
      donationamount: parseFloat(donationamount),
      donationdate: donationdate
    });

    res.redirect('/donations?message=Donation recorded successfully!&messageType=success');
  } catch (error) {
    console.error('Error creating donation:', error);
    res.render('admin/donation-form', {
      currentPage: 'donations',
      pageTitle: 'Record Donation',
      donation: req.body,
      error: 'An error occurred while recording the donation: ' + error.message
    });
  }
});

// GET /manage/donations/:id/edit - Show form to edit donation (manager only)
app.get('/manage/donations/:id/edit', requireManager, async (req, res) => {
  try {
    const donationId = parseInt(req.params.id);
    
    const donation = await knex('donations')
      .leftJoin('people', 'donations.personid', 'people.personid')
      .where('donations.donationid', donationId)
      .select(
        'donations.donationid',
        'donations.personid',
        'donations.donationamount',
        'donations.donationdate',
        'people.firstname',
        'people.lastname',
        'people.email'
      )
      .first();

    if (!donation) {
      return res.status(404).render('errors/404', {
        currentPage: 'donations',
        pageTitle: 'Donation Not Found'
      });
    }

    // Parse date - handle "UNKNOWN_DATE" and various formats
    let formattedDate = '';
    if (donation.donationdate && donation.donationdate !== 'UNKNOWN_DATE') {
      try {
        const dateObj = new Date(donation.donationdate);
        if (!isNaN(dateObj.getTime())) {
          formattedDate = dateObj.toISOString().split('T')[0];
        }
      } catch (e) {
        formattedDate = '';
      }
    }

    res.render('admin/donation-form', {
      currentPage: 'donations',
      pageTitle: 'Edit Donation',
      donation: {
        donationid: donation.donationid,
        personid: donation.personid,
        donationamount: donation.donationamount,
        donationdate: formattedDate,
        firstname: donation.firstname || '',
        lastname: donation.lastname || '',
        email: donation.email || ''
      },
      error: null
    });
  } catch (error) {
    console.error('Error fetching donation:', error);
    res.status(500).render('errors/500', {
      currentPage: 'donations',
      pageTitle: 'Error',
      message: 'Failed to load donation.'
    });
  }
});

// POST /manage/donations/:id - Update donation (manager only)
app.post('/manage/donations/:id', requireManager, async (req, res) => {
  try {
    const donationId = parseInt(req.params.id);
    const { personid, donationamount, donationdate } = req.body;

    // Check if donation exists
    const existingDonation = await knex('donations')
      .where('donationid', donationId)
      .first();

    if (!existingDonation) {
      return res.status(404).render('errors/404', {
        currentPage: 'donations',
        pageTitle: 'Donation Not Found'
      });
    }

    // Validate required fields
    if (!donationamount || !donationdate) {
      return res.render('admin/donation-form', {
        currentPage: 'donations',
        pageTitle: 'Edit Donation',
        donation: { donationid: donationId, ...req.body },
        error: 'Amount and date are required.'
      });
    }

    // Update donation
    await knex('donations')
      .where('donationid', donationId)
      .update({
        personid: personid || null,
        donationamount: parseFloat(donationamount),
        donationdate: donationdate
      });

    res.redirect('/donations?message=Donation updated successfully!&messageType=success');
  } catch (error) {
    console.error('Error updating donation:', error);
    res.status(500).render('errors/500', {
      currentPage: 'donations',
      pageTitle: 'Error',
      message: 'An error occurred while updating the donation: ' + error.message
    });
  }
});

// DELETE /manage/donations/:id - Delete donation (manager only)
app.delete('/manage/donations/:id', requireManager, async (req, res) => {
  try {
    const donationId = parseInt(req.params.id);

    await knex('donations')
      .where('donationid', donationId)
      .del();

    res.json({
      success: true,
      message: 'Donation deleted successfully.'
    });
  } catch (error) {
    console.error('Error deleting donation:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting donation: ' + error.message
    });
  }
});

app.get('/manage/milestones', requireManager, async (req, res) => {
  try {
    const search = req.query.search || '';
    let participants = [];

    if (search) {
      // Search for participants by first name or last name
      participants = await knex('people')
        .select('personid', 'email', 'firstname', 'lastname', 'city', 'state')
        .where(function() {
          this.where('firstname', 'ilike', `%${search}%`)
            .orWhere('lastname', 'ilike', `%${search}%`);
        })
        .orderBy('lastname', 'asc')
        .limit(50);
    }

    res.render('admin/milestones-manage', {
      currentPage: 'milestones',
      pageTitle: 'Manage Milestones',
      search,
      participants
    });
  } catch (error) {
    console.error('Error searching participants:', error);
    res.render('admin/milestones-manage', {
      currentPage: 'milestones',
      pageTitle: 'Manage Milestones',
      search: '',
      participants: []
    });
  }
});

app.get('/manage/milestones/:personid', requireManager, async (req, res) => {
  try {
    const personid = parseInt(req.params.personid);

    // Get participant info
    const participant = await knex('people')
      .where('personid', personid)
      .first();

    if (!participant) {
      return res.status(404).render('errors/404', {
        currentPage: 'milestones',
        pageTitle: 'Participant Not Found'
      });
    }

    // Get all milestone types from the system
    const allMilestoneTypes = await knex('milestonetypes')
      .orderBy('milestonecategory', 'asc')
      .orderBy('milestonetypeid', 'asc');

    // Get all milestones for this participant with milestone type info
    const userMilestones = await knex('milestones')
      .leftJoin('milestonetypes', 'milestones.milestonetypeid', 'milestonetypes.milestonetypeid')
      .where('milestones.personid', personid)
      .select(
        'milestones.milestoneid',
        'milestones.personid',
        'milestones.milestoneno',
        'milestones.milestonetitle',
        'milestones.milestonedate',
        'milestones.milestonetypeid',
        'milestonetypes.milestonecategory',
        'milestonetypes.milestonelevel'
      )
      .orderBy('milestonetypes.milestonecategory', 'asc')
      .orderBy('milestonetypes.milestonetypeid', 'asc')
      .orderBy('milestones.milestonedate', 'asc');

    // Create a map of user's milestones by milestonetypeid
    const userMilestonesByTypeId = {};
    userMilestones.forEach(m => {
      if (m.milestonetypeid) {
        userMilestonesByTypeId[m.milestonetypeid] = m;
      }
    });

    // Build full track structure: all milestone types with user's completion status
    const milestonesByCategory = {};
    allMilestoneTypes.forEach(milestoneType => {
      const category = milestoneType.milestonecategory || 'Uncategorized';
      if (!milestonesByCategory[category]) {
        milestonesByCategory[category] = [];
      }

      // Check if user has completed this milestone type
      const userMilestone = userMilestonesByTypeId[milestoneType.milestonetypeid];
      
      milestonesByCategory[category].push({
        milestonetypeid: milestoneType.milestonetypeid,
        milestonecategory: milestoneType.milestonecategory,
        milestonelevel: milestoneType.milestonelevel,
        // User's milestone data (if exists)
        milestoneid: userMilestone?.milestoneid || null,
        milestonetitle: userMilestone?.milestonetitle || null,
        milestonedate: userMilestone?.milestonedate || null,
        isCompleted: userMilestone && userMilestone.milestonedate !== null,
        isIncomplete: userMilestone && userMilestone.milestonedate === null
      });
    });

    // Determine primary track (category with most completed milestones)
    let primaryTrack = null;
    let maxCount = 0;
    Object.entries(milestonesByCategory).forEach(([category, milestones]) => {
      const completedCount = milestones.filter(m => m.isCompleted).length;
      if (completedCount > maxCount) {
        maxCount = completedCount;
        primaryTrack = category;
      }
    });

    // Separate completed and incomplete for backward compatibility
    const completedMilestones = userMilestones.filter(m => m.milestonedate !== null);
    const incompleteMilestones = userMilestones.filter(m => m.milestonedate === null);

    // Get all milestone types for the form dropdown
    const milestoneTypes = await knex('milestonetypes')
      .orderBy('milestonecategory', 'asc')
      .orderBy('milestonetypeid', 'asc');

    res.render('admin/milestones-participant', {
      currentPage: 'milestones',
      pageTitle: `Milestones - ${participant.firstname} ${participant.lastname}`,
      participant,
      completedMilestones,
      incompleteMilestones,
      milestonesByCategory,
      primaryTrack,
      milestoneTypes,
      message: req.query.message || null,
      messageType: req.query.messageType || null
    });
  } catch (error) {
    console.error('Error fetching participant milestones:', error);
    res.status(500).render('errors/500', {
      currentPage: 'milestones',
      pageTitle: 'Error',
      message: 'Failed to load participant milestones.'
    });
  }
});

app.post('/manage/milestones/assign', requireManager, async (req, res) => {
  try {
    const { personid, milestonetitle, milestonedate, milestonetypeid } = req.body;

    // Validate required fields
    if (!personid || !milestonetitle || !milestonedate) {
      return res.status(400).json({ 
        success: false, 
        message: 'Person ID, milestone title, and date are required' 
      });
    }

    // Verify person exists
    const person = await knex('people')
      .where('personid', personid)
      .first();

    if (!person) {
      return res.status(404).json({ 
        success: false, 
        message: 'Participant not found' 
      });
    }

    // Get the highest milestoneno for this person
    const lastMilestone = await knex('milestones')
      .where('personid', personid)
      .orderBy('milestoneno', 'desc')
      .first();

    // Calculate next milestone number (highest + 1, or 1 if no milestones exist)
    const nextMilestoneNo = lastMilestone ? lastMilestone.milestoneno + 1 : 1;

    // Get the max milestoneid and add 1 (to avoid primary key conflicts)
    // This handles cases where the sequence might be out of sync
    const maxMilestone = await knex('milestones')
      .max('milestoneid as maxid')
      .first();
    
    const nextMilestoneId = maxMilestone && maxMilestone.maxid ? parseInt(maxMilestone.maxid) + 1 : 1;

    // Insert milestone - milestoneid will be explicitly set to avoid sequence issues
    const insertData = {
      milestoneid: nextMilestoneId,
      personid: parseInt(personid),
      milestoneno: nextMilestoneNo,
      milestonetitle: milestonetitle,
      milestonedate: milestonedate
    };

    // Add milestonetypeid if provided
    if (milestonetypeid) {
      insertData.milestonetypeid = parseInt(milestonetypeid);
    }

    await knex('milestones').insert(insertData);

    res.json({
      success: true,
      message: 'Milestone assigned successfully',
      redirect: `/manage/milestones/${personid}?message=Milestone assigned successfully!&messageType=success`
    });
  } catch (error) {
    console.error('Error assigning milestone:', error);
    res.status(500).json({
      success: false,
      message: 'Error assigning milestone: ' + error.message
    });
  }
});

// PUT /manage/milestones/:id - Update milestone (manager only)
app.put('/manage/milestones/:id', requireManager, async (req, res) => {
  try {
    const milestoneId = parseInt(req.params.id);
    const { personid, milestonetitle, milestonedate, milestonetypeid } = req.body;

    // Validate required fields
    if (!milestonetitle) {
      return res.status(400).json({
        success: false,
        message: 'Milestone title is required.'
      });
    }

    // Check if milestone exists and get personid
    const existingMilestone = await knex('milestones')
      .where('milestoneid', milestoneId)
      .first();

    if (!existingMilestone) {
      return res.status(404).json({
        success: false,
        message: 'Milestone not found.'
      });
    }

    // Use personid from milestone if not provided in body
    const targetPersonId = personid || existingMilestone.personid;

    // Update milestone
    const updateData = {
      milestonetitle: milestonetitle
    };

    // If date is provided, set it; if empty string, set to null (incomplete)
    if (milestonedate && milestonedate.trim() !== '') {
      updateData.milestonedate = milestonedate;
    } else {
      updateData.milestonedate = null;
    }

    // Update milestonetypeid if provided
    if (milestonetypeid) {
      updateData.milestonetypeid = parseInt(milestonetypeid);
    }

    await knex('milestones')
      .where('milestoneid', milestoneId)
      .update(updateData);

    res.json({
      success: true,
      message: 'Milestone updated successfully',
      redirect: `/manage/milestones/${targetPersonId}?message=Milestone updated successfully!&messageType=success`
    });
  } catch (error) {
    console.error('Error updating milestone:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating milestone: ' + error.message
    });
  }
});

// DELETE /manage/milestones/:id - Delete milestone (manager only)
app.delete('/manage/milestones/:id', requireManager, async (req, res) => {
  try {
    const milestoneId = parseInt(req.params.id);

    // Get milestone to find personid for redirect
    const milestone = await knex('milestones')
      .where('milestoneid', milestoneId)
      .first();

    if (!milestone) {
      return res.status(404).json({
        success: false,
        message: 'Milestone not found.'
      });
    }

    const personid = milestone.personid;

    // Delete milestone
    await knex('milestones')
      .where('milestoneid', milestoneId)
      .del();

    res.json({
      success: true,
      message: 'Milestone deleted successfully',
      redirect: `/manage/milestones/${personid}?message=Milestone deleted successfully!&messageType=success`
    });
  } catch (error) {
    console.error('Error deleting milestone:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting milestone: ' + error.message
    });
  }
});

app.get('/admin/users', requireManager, async (req, res) => {
  try {
    // Pagination settings
    const page = parseInt(req.query.page) || 1;
    const limit = 20; // Users per page
    const offset = (page - 1) * limit;
    
    // Search query
    const search = req.query.search || '';
    
    // Build query
    let query = knex('login')
      .leftJoin('people', 'login.email', 'people.email')
      .select(
        'login.email',
        'login.level as role',
        'people.firstname',
        'people.lastname',
        'people.personid'
      );
    
    // Apply search filter if provided
    if (search) {
      query = query.where(function() {
        this.where('login.email', 'ilike', `%${search}%`)
          .orWhere('people.firstname', 'ilike', `%${search}%`)
          .orWhere('people.lastname', 'ilike', `%${search}%`);
      });
    }
    
    // Get total count for pagination
    const countQuery = query.clone().clearSelect().count('* as total').first();
    const totalResult = await countQuery;
    const totalUsers = parseInt(totalResult.total);
    const totalPages = Math.ceil(totalUsers / limit);
    
    // Apply pagination and ordering
    const allUsers = await query
      .orderBy('login.email', 'asc')
      .limit(limit)
      .offset(offset);
    
    // Format users for display
    const users = allUsers.map(u => ({
      email: u.email,
      firstName: u.firstname || 'N/A',
      lastName: u.lastname || '',
      role: u.role || 'user',
      personId: u.personid || null
    }));
    
    res.render('admin/admin-users', { 
      currentPage: 'admin', 
      pageTitle: 'Manage Users', 
      users,
      search,
      currentPageNum: page,
      totalPages,
      totalUsers,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
      message: req.query.message || null,
      messageType: req.query.messageType || null
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.render('admin/admin-users', { 
      currentPage: 'admin', 
      pageTitle: 'Manage Users', 
      users: [],
      search: '',
      currentPageNum: 1,
      totalPages: 0,
      totalUsers: 0,
      hasNextPage: false,
      hasPrevPage: false
    });
  }
});

// GET /admin/users/new - Show form to add new user
app.get('/admin/users/new', requireManager, (req, res) => {
  res.render('admin/user-form', {
    currentPage: 'admin',
    pageTitle: 'Add New User',
    user: null,
    error: null
  });
});

// POST /admin/users - Create new user
app.post('/admin/users', requireManager, async (req, res) => {
  try {
    const { email, password, level, firstname, lastname, phone, city, state, birthdate } = req.body;

    // Validate required fields
    if (!email || !level) {
      return res.render('admin/user-form', {
        currentPage: 'admin',
        pageTitle: 'Add New User',
        user: req.body,
        error: 'Email and role are required.'
      });
    }

    // Use default password "temp123" if no password provided
    const userPassword = password && password.trim() !== '' ? password : 'temp123';

    // Check if user already exists
    const existingUser = await knex('login')
      .where('email', email)
      .first();

    if (existingUser) {
      return res.render('admin/user-form', {
        currentPage: 'admin',
        pageTitle: 'Add New User',
        user: req.body,
        error: 'A user with this email already exists.'
      });
    }

    // Clean phone number - strip all non-numeric characters
    const cleanedPhone = phone ? phone.replace(/\D/g, '') : null;

    // Start transaction to ensure both user and participant are created
    await knex.transaction(async (trx) => {
      // Insert into login table
      await trx('login').insert({
        email: email,
        password: userPassword, // TODO: Hash with bcrypt in production
        level: level
      });

      // Check if person exists and update/create
      const existingPerson = await trx('people')
        .where('email', email)
        .first();

      if (existingPerson) {
        // Update existing person
        await trx('people')
          .where('email', email)
          .update({
            firstname: firstname || existingPerson.firstname,
            lastname: lastname || existingPerson.lastname,
            phone: cleanedPhone || existingPerson.phone,
            city: city || existingPerson.city,
            state: state || existingPerson.state,
            birthdate: birthdate || existingPerson.birthdate
          });
      } else {
        // Create new person
        const maxPerson = await trx('people')
          .max('personid as maxid')
          .first();
        const nextPersonId = maxPerson && maxPerson.maxid ? parseInt(maxPerson.maxid) + 1 : 1;

        await trx('people').insert({
          personid: nextPersonId,
          email: email,
          firstname: firstname || '',
          lastname: lastname || '',
          phone: cleanedPhone || null,
          city: city || null,
          state: state || null,
          birthdate: birthdate || null
        });
      }
    });

    res.redirect('/admin/users?message=User created successfully!&messageType=success');
  } catch (error) {
    console.error('Error creating user:', error);
    res.render('admin/user-form', {
      currentPage: 'admin',
      pageTitle: 'Add New User',
      user: req.body,
      error: 'An error occurred while creating the user: ' + error.message
    });
  }
});

// GET /admin/users/:email/edit - Show form to edit user
app.get('/admin/users/:email/edit', requireManager, async (req, res) => {
  try {
    const email = decodeURIComponent(req.params.email);
    
    const loginUser = await knex('login')
      .where('email', email)
      .first();

    if (!loginUser) {
      return res.status(404).render('errors/404', {
        currentPage: 'admin',
        pageTitle: 'User Not Found'
      });
    }

    const person = await knex('people')
      .where('email', email)
      .first();

    res.render('admin/user-form', {
      currentPage: 'admin',
      pageTitle: 'Edit User',
      user: {
        email: loginUser.email,
        level: loginUser.level,
        firstname: person ? person.firstname : '',
        lastname: person ? person.lastname : '',
        phone: person ? person.phone : '',
        city: person ? person.city : '',
        state: person ? person.state : '',
        birthdate: person && person.birthdate ? new Date(person.birthdate).toISOString().split('T')[0] : '',
        personid: person ? person.personid : null
      },
      error: null
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).render('errors/500', {
      currentPage: 'admin',
      pageTitle: 'Error',
      message: 'Failed to load user.'
    });
  }
});

// POST /admin/users/:email - Update user
app.post('/admin/users/:email', requireManager, async (req, res) => {
  try {
    const email = decodeURIComponent(req.params.email);
    const { password, level, firstname, lastname, phone, city, state, birthdate } = req.body;

    // Check if user exists
    const existingUser = await knex('login')
      .where('email', email)
      .first();

    if (!existingUser) {
      return res.status(404).render('errors/404', {
        currentPage: 'admin',
        pageTitle: 'User Not Found'
      });
    }

    // Update login table
    const updateData = { level: level };
    if (password && password.trim() !== '') {
      updateData.password = password; // TODO: Hash with bcrypt in production
    }

    await knex('login')
      .where('email', email)
      .update(updateData);

    // Update or create person record
    const existingPerson = await knex('people')
      .where('email', email)
      .first();

    // Clean phone number - strip all non-numeric characters
    const cleanedPhone = phone ? phone.replace(/\D/g, '') : null;

    if (existingPerson) {
      // Update existing person
      await knex('people')
        .where('email', email)
        .update({
          firstname: firstname || existingPerson.firstname,
          lastname: lastname || existingPerson.lastname,
          phone: cleanedPhone !== null ? cleanedPhone : existingPerson.phone,
          city: city !== undefined ? city : existingPerson.city,
          state: state !== undefined ? state : existingPerson.state,
          birthdate: birthdate || existingPerson.birthdate
        });
    } else {
      // Create new person if any participant data provided
      const maxPerson = await knex('people')
        .max('personid as maxid')
        .first();
      const nextPersonId = maxPerson && maxPerson.maxid ? parseInt(maxPerson.maxid) + 1 : 1;

      await knex('people').insert({
        personid: nextPersonId,
        email: email,
        firstname: firstname || '',
        lastname: lastname || '',
        phone: cleanedPhone || null,
        city: city || null,
        state: state || null,
        birthdate: birthdate || null
      });
    }

    res.redirect('/admin/users?message=User updated successfully!&messageType=success');
  } catch (error) {
    console.error('Error updating user:', error);
    res.render('admin/user-form', {
      currentPage: 'admin',
      pageTitle: 'Edit User',
      user: { ...req.body, email: decodeURIComponent(req.params.email) },
      error: 'An error occurred while updating the user: ' + error.message
    });
  }
});

// DELETE /admin/users/:email - Delete user
app.delete('/admin/users/:email', requireManager, async (req, res) => {
  try {
    const email = decodeURIComponent(req.params.email);

    // Prevent deleting yourself
    if (email === req.session.user.email) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account.'
      });
    }

    // Delete from people table first (to avoid foreign key constraint violation)
    await knex('people')
      .where('email', email)
      .del();

    // Then delete from login table
    await knex('login')
      .where('email', email)
      .del();

    res.json({
      success: true,
      message: 'User deleted successfully.'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting user: ' + error.message
    });
  }
});

// GET /admin/analytics - Analytics dashboard with Tableau embed (manager only)
app.get('/admin/analytics', requireManager, (req, res) => {
  res.render('admin/analytics', {
    currentPage: 'analytics',
    pageTitle: 'Analytics Dashboard',
    pageDescription: 'View data analytics and insights'
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
