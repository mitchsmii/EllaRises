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


const sampleRsvps = [];

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
      phone: person ? person.phone : null, // Add phone to session
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
  res.render('public/stories', { currentPage: 'stories', pageTitle: 'Success Stories', pageDescription: 'Read inspiring stories from the women and girls we serve.', stories });
});

app.get('/events', async (req, res) => {
  try {
    // Join events with event_details to get full event info
    const events = await knex('events')
      .leftJoin('event_details', 'events.eventid', 'event_details.eventid')
      .select(
        'events.eventid as id',
        'events.eventname as title',
        'events.eventtype as eventType',
        'events.eventdescription as description',
        'events.eventrecurrence as recurrence',
        'event_details.eventdatetimestart as eventDate',
        'event_details.eventregistrationdeadline as registrationDeadline',
        'event_details.eventcapacity as capacity',
        'event_details.eventlocation as location'
      )
      .orderBy('event_details.eventdatetimestart', 'desc')
      .limit(10);
    
    res.render('public/events-public', { 
      currentPage: 'events', 
      pageTitle: 'Events', 
      pageDescription: 'Find upcoming workshops, community gatherings, and fundraising events.', 
      events 
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    res.render('public/events-public', { 
      currentPage: 'events', 
      pageTitle: 'Events', 
      pageDescription: 'Find upcoming workshops, community gatherings, and fundraising events.', 
      events: [] 
    });
  }
});

app.get('/events/:id', async (req, res) => {
  try {
    const eventId = parseInt(req.params.id);
    const event = await knex('events')
      .leftJoin('event_details', 'events.eventid', 'event_details.eventid')
      .select(
        'events.eventid as id',
        'events.eventname as title',
        'events.eventtype as eventType',
        'events.eventdescription as description',
        'events.eventrecurrence as recurrence',
        'event_details.eventdatetimestart as eventDate',
        'event_details.eventregistrationdeadline as registrationDeadline',
        'event_details.eventcapacity as capacity',
        'event_details.eventlocation as location'
      )
      .where('events.eventid', eventId)
      .first(); // Use .first() because we expect only one result

    if (!event) {
      return res.status(404).render('errors/404', { currentPage: '404', pageTitle: 'Event Not Found' });
    }

    res.render('public/event-detail', {
      currentPage: 'events',
      pageTitle: event.title,
      event
    });
  } catch (error) {
    console.error('Error fetching event:', error);
    res.status(500).render('errors/404', { currentPage: '404', pageTitle: 'Error' }); // Or a 500 error page
  }
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

app.post('/events/:id/rsvp', requireLogin, (req, res) => {
  const eventId = parseInt(req.params.id);
  const userEmail = req.session.user.email;
  const { option, address, radius, seatCount } = req.body;

  // Basic validation
  if (!option) {
    return res.status(400).json({ success: false, message: 'An RSVP option is required.' });
  }

  const rsvp = {
    eventId,
    userEmail,
    option,
    address: address || null,
    radius: radius || null,
    seatCount: seatCount || null,
    timestamp: new Date()
  };

  sampleRsvps.push(rsvp);
  console.log('New RSVP:', rsvp);

  let message = "Your RSVP has been confirmed. Thank you!";
  switch(option) {
    case 'virtual':
      message = "Thank you for RSVPing! The link for this virtual event will be sent to your email closer to the event date.";
      break;
    case 'driver-offer':
      message = `Thank you for offering to drive! We've noted you have ${seatCount} seat(s) available. We'll be in touch if we find a match.`;
      break;
    case 'carpool-request':
      message = "We've added you to the carpool request list. We will notify you via email if a spot becomes available.";
      break;
    case 'no-drive':
      message = "Got it. Your RSVP is confirmed. See you at the event!";
      break;
    case 'bus':
      message = "Your RSVP is confirmed. We've opened a new tab with Google Maps for your convenience.";
      break;
  }

  res.json({ success: true, message });
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

app.get('/milestones', requireLogin, async (req, res) => {
  try {
    // Get the logged-in user's personid first
    const loggedInPerson = await knex('people')
      .where('email', req.session.user.email)
      .first();

    // Get the logged-in user's milestones (matching by personid AND has a completion date)
    let userMilestones = [];
    if (loggedInPerson) {
      userMilestones = await knex('milestones')
        .select(
          'milestoneid',
          'personid',
          'milestoneno',
          'milestonetitle',
          'milestonedate'
        )
        .where('personid', loggedInPerson.personid)
        .whereNotNull('milestonedate')  // Only completed milestones (has a date)
        .orderBy('milestonedate', 'desc');
    }

    // Calculate progress (user's completed milestones)
    const userCompletedCount = userMilestones.length;

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
        .orderBy('milestones.milestonedate', 'desc')
        .limit(20);
    }

    res.render('user/milestones', { 
      currentPage: 'milestones', 
      pageTitle: 'Milestones', 
      userMilestones,
      userCompletedCount,
      participantMilestones
    });
  } catch (error) {
    console.error('Error fetching milestones:', error);
    res.render('user/milestones', { 
      currentPage: 'milestones', 
      pageTitle: 'Milestones', 
      userMilestones: [],
      userCompletedCount: 0,
      participantMilestones: []
    });
  }
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

app.get('/manage/events', requireManager, async (req, res) => {
  try {
    const events = await knex('events')
      .leftJoin('event_details', 'events.eventid', 'event_details.eventid')
      .select(
        'events.eventid as id',
        'events.eventname as title',
        'events.eventtype as eventType',
        'events.eventdescription as description',
        'events.eventrecurrence as recurrence',
        'event_details.eventdatetimestart as eventDate',
        'event_details.eventregistrationdeadline as registrationDeadline',
        'event_details.eventcapacity as capacity',
        'event_details.eventlocation as location'
      )
      .orderBy('event_details.eventdatetimestart', 'desc');

    // The view expects 'registered' and 'eventTime'. We'll add them here.
    const eventsWithRegistration = events.map(event => {
        const registeredCount = sampleRsvps.filter(r => r.eventId === event.id).length;
        return {
            ...event,
            registered: registeredCount,
            eventTime: event.eventDate ? new Date(event.eventDate).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : 'N/A'
        };
    });

    res.render('admin/events-manage', {
      currentPage: 'events',
      pageTitle: 'Manage Events',
      events: eventsWithRegistration
    });
  } catch (error) {
    console.error('Error fetching events for admin:', error);
    res.render('admin/events-manage', {
      currentPage: 'events',
      pageTitle: 'Manage Events',
      events: [] // Render with empty array on error
    });
  }
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

app.get('/manage/events/:id/transportation', requireManager, async (req, res) => {
  try {
    const eventId = parseInt(req.params.id);
    
    const event = await knex('events')
      .where('eventid', eventId)
      .select('eventid as id', 'eventname as title')
      .first();

    if (!event) {
      return res.status(404).render('errors/404', { pageTitle: 'Event Not Found' });
    }

    const eventRsvps = sampleRsvps.filter(r => r.eventId === eventId);
    
    // Filter out riders who are already matched
    const riders = eventRsvps.filter(r => r.option === 'carpool-request' && !r.matchedWithDriver);
    
    // Find drivers with available seats
    const drivers = eventRsvps.filter(r => {
      if (r.option !== 'driver-offer') return false;
      const matchedSeats = r.matchedRiders ? r.matchedRiders.length : 0;
      return matchedSeats < r.seatCount;
    });

    res.render('admin/manage-transportation', {
      currentPage: 'events',
      pageTitle: 'Manage Transportation',
      event,
      drivers,
      riders,
      // Pass match messages from query params to the view
      matchMessage: req.query.matchMessage,
      matchSuccess: req.query.matchSuccess === 'true'
    });

  } catch (error) {
    console.error('Error fetching transportation data:', error);
    res.status(500).render('errors/404', { pageTitle: 'Error' });
  }
});

app.post('/manage/events/:id/match', requireManager, async (req, res) => {
  const eventId = parseInt(req.params.id);
  const { driverEmail, riderEmail } = req.body;
  const redirectUrl = `/manage/events/${eventId}/transportation`;

  try {
    // Find the full user objects from the DATABASE
    const driverUser = await knex('people').where('email', driverEmail).first();
    const riderUser = await knex('people').where('email', riderEmail).first();
    
    // Find the specific RSVP records from the in-memory array
    const driverRsvp = sampleRsvps.find(r => r.eventId === eventId && r.userEmail === driverEmail && r.option === 'driver-offer');
    const riderRsvp = sampleRsvps.find(r => r.eventId === eventId && r.userEmail === riderEmail && r.option === 'carpool-request');

    if (!driverUser || !riderUser || !driverRsvp || !riderRsvp) {
      console.error("Match lookup failed:", { driverUser, riderUser, driverRsvp, riderRsvp });
      return res.redirect(`${redirectUrl}?matchSuccess=false&matchMessage=Error: Could not find driver or rider details.`);
    }

    const driverPhone = driverUser.phone || 'Not Available';
    const riderPhone = riderUser.phone || 'Not Available';

    // Mark as matched
    riderRsvp.matchedWithDriver = driverEmail;
    if (!driverRsvp.matchedRiders) {
      driverRsvp.matchedRiders = [];
    }
    driverRsvp.matchedRiders.push(riderEmail);

    // --- SIMULATE SENDING TEXT MESSAGES ---
    console.log("\n--- SIMULATING TEXT MESSAGE API ---");
    console.log(`To: ${riderPhone} (Rider)`);
    console.log(`Body: A carpool driver was found for your event! Your driver, ${driverUser.firstname}, will coordinate with you. Their phone number is ${driverPhone}.`);
    console.log("------------------------------------");
    console.log(`To: ${driverPhone} (Driver)`);
    console.log(`Body: You have been matched with a rider! Please contact ${riderUser.firstname} ${riderUser.lastname} at ${riderPhone} to coordinate the ride.`);
    console.log("--- END SIMULATION ---\n");
    
    const message = `Successfully matched ${driverUser.firstname} with ${riderUser.firstname}. Notifications have been sent.`;
    res.redirect(`${redirectUrl}?matchSuccess=true&matchMessage=${encodeURIComponent(message)}`);

  } catch (error) {
    console.error("Matching Error:", error);
    const message = "An unexpected error occurred during the matching process.";
    res.redirect(`${redirectUrl}?matchSuccess=false&matchMessage=${encodeURIComponent(message)}`);
  }
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

    // Get all milestones for this participant (both completed and incomplete)
    const allMilestones = await knex('milestones')
      .where('personid', personid)
      .orderBy('milestoneno', 'asc');

    // Separate completed and incomplete milestones
    const completedMilestones = allMilestones.filter(m => m.milestonedate !== null);
    const incompleteMilestones = allMilestones.filter(m => m.milestonedate === null);

    res.render('admin/milestones-participant', {
      currentPage: 'milestones',
      pageTitle: `Milestones - ${participant.firstname} ${participant.lastname}`,
      participant,
      completedMilestones,
      incompleteMilestones,
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
    const { personid, milestonetitle, milestonedate } = req.body;

    // Validate required fields
    if (!personid || !milestonetitle || !milestonedate) {
      return res.status(400).json({ 
        success: false, 
        message: 'All fields are required' 
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
    await knex('milestones').insert({
      milestoneid: nextMilestoneId,
      personid: parseInt(personid),
      milestoneno: nextMilestoneNo,
      milestonetitle: milestonetitle,
      milestonedate: milestonedate
    });

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
    const { email, password, level, firstname, lastname } = req.body;

    // Validate required fields
    if (!email || !password || !level) {
      return res.render('admin/user-form', {
        currentPage: 'admin',
        pageTitle: 'Add New User',
        user: { email, level, firstname, lastname },
        error: 'Email, password, and role are required.'
      });
    }

    // Check if user already exists
    const existingUser = await knex('login')
      .where('email', email)
      .first();

    if (existingUser) {
      return res.render('admin/user-form', {
        currentPage: 'admin',
        pageTitle: 'Add New User',
        user: { email, level, firstname, lastname },
        error: 'A user with this email already exists.'
      });
    }

    // Insert into login table
    await knex('login').insert({
      email: email,
      password: password, // TODO: Hash with bcrypt in production
      level: level
    });

    // If name provided, check if person exists and update/create
    if (firstname || lastname) {
      const existingPerson = await knex('people')
        .where('email', email)
        .first();

      if (existingPerson) {
        // Update existing person
        await knex('people')
          .where('email', email)
          .update({
            firstname: firstname || existingPerson.firstname,
            lastname: lastname || existingPerson.lastname
          });
      } else {
        // Create new person (we'll need personid - let's get max and add 1)
        const maxPerson = await knex('people')
          .max('personid as maxid')
          .first();
        const nextPersonId = maxPerson && maxPerson.maxid ? parseInt(maxPerson.maxid) + 1 : 1;

        await knex('people').insert({
          personid: nextPersonId,
          email: email,
          firstname: firstname || '',
          lastname: lastname || ''
        });
      }
    }

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
    const { password, level, firstname, lastname } = req.body;

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

    if (existingPerson) {
      // Update existing person
      await knex('people')
        .where('email', email)
        .update({
          firstname: firstname || existingPerson.firstname,
          lastname: lastname || existingPerson.lastname
        });
    } else if (firstname || lastname) {
      // Create new person if name provided
      const maxPerson = await knex('people')
        .max('personid as maxid')
        .first();
      const nextPersonId = maxPerson && maxPerson.maxid ? parseInt(maxPerson.maxid) + 1 : 1;

      await knex('people').insert({
        personid: nextPersonId,
        email: email,
        firstname: firstname || '',
        lastname: lastname || ''
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
