const express = require('express');
const path = require('path');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));

// Brand configuration
const brand = {
  name: 'Ella Rises',
  tagline: 'Inviting young women to pursue higher education and embrace their heritage by providing culturally rooted programs and educational experiences.',
  palette: {
    primary: '#1a1a1a',      // Dark charcoal for text/buttons
    accent: '#f4a5a0',       // Soft coral/salmon
    peach: '#fcd5ce',        // Light peach background
    cream: '#fff8f5',        // Warm cream white
    charcoal: '#1a1a1a',
    white: '#ffffff',
  },
};

// Content data (will eventually come from database)
const focusAreas = [
  {
    title: 'Mentorship',
    copy: 'Pairing young women with mentors and leaders who open doors, share wisdom, and help chart clear next steps.',
  },
  {
    title: 'Education',
    copy: 'Workshops, scholarships, and skill-building that equip girls with confidence and practical tools.',
  },
  {
    title: 'Community',
    copy: 'Circles of support where women advocate for each other, celebrate wins, and show up in service.',
  },
];

const stats = [
  { label: 'Students served', value: '1,200+' },
  { label: 'Mentor matches', value: '350' },
  { label: 'Workshops delivered', value: '80+' },
];

const stories = [
  {
    quote: 'Ella Rises gave me the confidence to speak up, ask for what I need, and step into leadership at school.',
    name: 'Amina, high school fellow',
  },
  {
    quote: 'My mentor helped me land my first internship and reminded me that my voice matters.',
    name: 'Jasmine, college scholar',
  },
];

// Middleware to pass common data to all views
app.use((req, res, next) => {
  res.locals.brand = brand;
  res.locals.currentYear = new Date().getFullYear();
  next();
});

// Routes
app.get('/', (req, res) => {
  res.render('home', { 
    currentPage: 'home',
    pageTitle: 'Welcome',
    focusAreas, 
    stats, 
    stories 
  });
});

app.get('/about', (req, res) => {
  res.render('about', { 
    currentPage: 'about',
    pageTitle: 'About Us',
    pageDescription: 'Learn about our mission, team, and the story behind Ella Rises.'
  });
});

app.get('/programs', (req, res) => {
  res.render('programs', { 
    currentPage: 'programs',
    pageTitle: 'Our Programs',
    pageDescription: 'Explore our mentorship, education, and community programs.',
    focusAreas
  });
});

app.get('/stories', (req, res) => {
  res.render('stories', { 
    currentPage: 'stories',
    pageTitle: 'Success Stories',
    pageDescription: 'Read inspiring stories from the women and girls we serve.',
    stories
  });
});

app.get('/events', (req, res) => {
  res.render('events', { 
    currentPage: 'events',
    pageTitle: 'Events',
    pageDescription: 'Find upcoming workshops, community gatherings, and fundraising events.'
  });
});

app.get('/get-involved', (req, res) => {
  res.render('get-involved', { 
    currentPage: 'get-involved',
    pageTitle: 'Get Involved',
    pageDescription: 'Discover ways to volunteer, mentor, donate, and partner with Ella Rises.'
  });
});

app.get('/donate', (req, res) => {
  res.render('donate', { 
    currentPage: 'donate',
    pageTitle: 'Donate',
    pageDescription: 'Support our mission with a tax-deductible donation.'
  });
});

app.get('/contact', (req, res) => {
  res.render('contact', { 
    currentPage: 'contact',
    pageTitle: 'Contact Us',
    pageDescription: 'Get in touch with the Ella Rises team.'
  });
});

app.get('/resources', (req, res) => {
  res.render('resources', { 
    currentPage: 'resources',
    pageTitle: 'Resources',
    pageDescription: 'Tools and information for students, mentors, and families.'
  });
});

// Handle contact form submission (placeholder - will connect to database later)
app.post('/contact', (req, res) => {
  // For now, just redirect back with a success message
  // Later this will save to database and/or send email
  res.redirect('/contact?success=true');
});

// 404 handler
app.use((req, res) => {
  res.status(404).render('404', {
    currentPage: '404',
    pageTitle: 'Page Not Found'
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Ella Rises site running at http://localhost:${PORT}`);
});
