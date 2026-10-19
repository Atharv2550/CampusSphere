import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

import { User } from '../models/User.js';
import { Department } from '../models/Department.js';
import { Event } from '../models/Event.js';
import { EventRegistration } from '../models/EventRegistration.js';
import { LostFoundItem } from '../models/LostFoundItem.js';
import { LostFoundClaim } from '../models/LostFoundClaim.js';
import { MarketplaceListing } from '../models/MarketplaceListing.js';
import { MarketplaceRequest } from '../models/MarketplaceRequest.js';
import { TutorProfile } from '../models/TutorProfile.js';
import { TutoringSession } from '../models/TutoringSession.js';
import { TutoringReview } from '../models/TutoringReview.js';
import { Club } from '../models/Club.js';
import { ClubMembership } from '../models/ClubMembership.js';
import { Announcement } from '../models/Announcement.js';
import { Notification } from '../models/Notification.js';
import { CampusResource } from '../models/CampusResource.js';
import { ResourceBooking } from '../models/ResourceBooking.js';
import { VolunteeringActivity } from '../models/VolunteeringActivity.js';
import { VolunteeringRegistration } from '../models/VolunteeringRegistration.js';
import { PlatformSetting } from '../models/PlatformSetting.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/campussphere';

export const seedDatabase = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('[Seed] Connected to MongoDB. Clearing existing collections...');

    // Clear existing collections safely
    await Promise.all([
      User.deleteMany({}),
      Department.deleteMany({}),
      Event.deleteMany({}),
      EventRegistration.deleteMany({}),
      LostFoundItem.deleteMany({}),
      LostFoundClaim.deleteMany({}),
      MarketplaceListing.deleteMany({}),
      MarketplaceRequest.deleteMany({}),
      TutorProfile.deleteMany({}),
      TutoringSession.deleteMany({}),
      TutoringReview.deleteMany({}),
      Club.deleteMany({}),
      ClubMembership.deleteMany({}),
      Announcement.deleteMany({}),
      Notification.deleteMany({}),
      CampusResource.deleteMany({}),
      ResourceBooking.deleteMany({}),
      VolunteeringActivity.deleteMany({}),
      VolunteeringRegistration.deleteMany({}),
      PlatformSetting.deleteMany({}),
    ]);

    console.log('[Seed] Collections cleared. Seeding Departments...');

    // 1. Departments
    const departments = await Department.insertMany([
      {
        name: 'Computer Science & Engineering',
        code: 'CSE',
        description: 'Department of Computing, Artificial Intelligence & Software Systems',
        headOfDepartment: 'Dr. Alan Turing',
        contactEmail: 'cse-dept@campussphere.edu',
      },
      {
        name: 'Electrical & Electronics Engineering',
        code: 'EEE',
        description: 'Department of Robotics, Embedded Systems & Microelectronics',
        headOfDepartment: 'Dr. Nikola Tesla',
        contactEmail: 'eee-dept@campussphere.edu',
      },
      {
        name: 'Mechanical Engineering',
        code: 'ME',
        description: 'Department of Design, Thermal Engineering & Advanced Manufacturing',
        headOfDepartment: 'Dr. James Watt',
        contactEmail: 'me-dept@campussphere.edu',
      },
      {
        name: 'School of Business & Management',
        code: 'SBM',
        description: 'Department of Finance, Strategy & Entrepreneurship',
        headOfDepartment: 'Dr. Peter Drucker',
        contactEmail: 'business-dept@campussphere.edu',
      },
      {
        name: 'School of Arts, Media & Design',
        code: 'AMD',
        description: 'Department of Visual Communication, UI/UX & Digital Media',
        headOfDepartment: 'Prof. Maya Lin',
        contactEmail: 'arts-dept@campussphere.edu',
      },
    ]);

    const cseDept = departments[0];
    const eeeDept = departments[1];
    const sbmDept = departments[3];

    console.log('[Seed] Seeding Demo Users...');

    // 2. Demo Users
    const salt = await bcrypt.genSalt(10);
    const adminPassword = await bcrypt.hash('Admin@123', salt);
    const facultyPassword = await bcrypt.hash('Faculty@123', salt);
    const coordPassword = await bcrypt.hash('Coordinator@123', salt);
    const managerPassword = await bcrypt.hash('Manager@123', salt);
    const studentPassword = await bcrypt.hash('Student@123', salt);

    const users = await User.insertMany([
      {
        fullName: 'Dr. Eleanor Vance (Admin)',
        email: 'admin@campussphere.edu',
        password: adminPassword,
        role: 'admin',
        department: cseDept._id,
        academicYear: 'Faculty/Staff',
        studentId: 'STAFF-ADM-001',
        bio: 'Campus Sphere Chief Platform Administrator and Dean of Student Affairs.',
        interests: ['Administration', 'Campus Policy', 'Security'],
      },
      {
        fullName: 'Prof. Marcus Chen (Faculty)',
        email: 'faculty@campussphere.edu',
        password: facultyPassword,
        role: 'faculty',
        department: cseDept._id,
        academicYear: 'Faculty/Staff',
        studentId: 'FAC-CSE-104',
        bio: 'Associate Professor of Computer Science specializing in Distributed Systems & AI.',
        interests: ['Distributed Systems', 'Research', 'AI Workshops'],
      },
      {
        fullName: 'Sarah Jenkins (Club Coordinator)',
        email: 'coordinator@campussphere.edu',
        password: coordPassword,
        role: 'coordinator',
        department: cseDept._id,
        academicYear: '3rd Year',
        studentId: 'CS2023-042',
        bio: 'Lead Coordinator for Google Developer Student Club & ACM Student Chapter.',
        interests: ['Hackathons', 'Open Source', 'Web Development'],
      },
      {
        fullName: 'David Kowalski (Resource Manager)',
        email: 'resourcemanager@campussphere.edu',
        password: managerPassword,
        role: 'resource_manager',
        department: eeeDept._id,
        academicYear: 'Faculty/Staff',
        studentId: 'STAFF-FAC-302',
        bio: 'Campus Resource Coordinator managing halls, labs, and audiovisual equipment.',
        interests: ['Facility Management', 'Lab Safety', 'Equipment Scheduling'],
      },
      {
        fullName: 'Alex Morgan (Student)',
        email: 'student@campussphere.edu',
        password: studentPassword,
        role: 'student',
        department: cseDept._id,
        academicYear: '3rd Year',
        studentId: 'CS2023-118',
        bio: 'Junior CSE student interested in Full-Stack Web Development, Algorithms, and Robotics.',
        interests: ['Hackathons', 'Web Development', 'Robotics', 'Basketball'],
      },
      {
        fullName: 'Priya Sharma (Student 2)',
        email: 'student2@campussphere.edu',
        password: studentPassword,
        role: 'student',
        department: sbmDept._id,
        academicYear: '2nd Year',
        studentId: 'BA2024-055',
        bio: 'Sophomore Business & Tech student, peer tutor in Business Statistics & Microeconomics.',
        interests: ['Business Analytics', 'Tutoring', 'Volunteering', 'Debate'],
      },
    ]);

    const [adminUser, facultyUser, coordUser, resourceManagerUser, studentAlex, studentPriya] = users;

    console.log('[Seed] Seeding Clubs & Societies...');

    // 3. Clubs
    const clubs = await Club.insertMany([
      {
        name: 'ACM Student Chapter',
        code: 'ACM-CS',
        description: 'Premier computing society organizing hackathons, competitive programming contests, and tech symposiums.',
        category: 'Technical',
        department: cseDept._id,
        coordinators: [coordUser._id],
        committeeMembers: [
          { user: studentAlex._id, roleTitle: 'Technical Head' },
        ],
        status: 'Active',
        meetingInfo: 'Weekly meetups every Wednesday at 5:00 PM in Room CS-204',
      },
      {
        name: 'Robotics & Automation Society',
        code: 'RAS-TECH',
        description: 'Hands-on robotics club building autonomous rovers, drones, and combat bots for national competitions.',
        category: 'Technical',
        department: eeeDept._id,
        coordinators: [coordUser._id],
        committeeMembers: [],
        status: 'Active',
        meetingInfo: 'Tuesdays & Thursdays at 4:30 PM in Robotics Lab',
      },
      {
        name: 'Social Impact & Rotary Youth',
        code: 'SIA-VOL',
        description: 'Dedicated to community upliftment, educational outreach, campus clean drives, and blood donation camps.',
        category: 'Social Service',
        department: sbmDept._id,
        coordinators: [coordUser._id],
        committeeMembers: [],
        status: 'Active',
        meetingInfo: 'Bi-weekly Saturdays at 10:00 AM in Student Centre',
      },
      {
        name: 'Campus Shutterbugs & Media Guild',
        code: 'CSM-ART',
        description: 'Photography, filmmaking, graphic design, and campus digital media coverage collective.',
        category: 'Arts & Media',
        coordinators: [coordUser._id],
        committeeMembers: [],
        status: 'Active',
        meetingInfo: 'Fridays at 4:00 PM in Multimedia Studio',
      },
    ]);

    const [acmClub, roboticsClub, socialClub, photoClub] = clubs;

    // Link coordinator's assigned club
    coordUser.assignedClub = acmClub._id;
    await coordUser.save();

    // Club Memberships
    await ClubMembership.insertMany([
      { club: acmClub._id, user: studentAlex._id, role: 'committee', status: 'approved' },
      { club: acmClub._id, user: studentPriya._id, role: 'member', status: 'approved' },
      { club: socialClub._id, user: studentPriya._id, role: 'member', status: 'approved' },
      { club: roboticsClub._id, user: studentAlex._id, role: 'member', status: 'pending', applicationReason: 'Eager to contribute to the autonomous drone project.' },
    ]);

    console.log('[Seed] Seeding Campus Events...');

    // 4. Campus Events
    const now = new Date();
    const event1Date = new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000);
    const event2Date = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000);
    const event3Date = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

    const events = await Event.insertMany([
      {
        title: 'SphereHacks 2026: 36-Hour National Campus Hackathon',
        description: 'Join 500+ student innovators for 36 hours of coding, hardware building, and problem-solving. Over $10,000 in prizes, free food, mentor workshops, and sponsor swag!',
        category: 'Hackathon',
        organizer: coordUser._id,
        department: cseDept._id,
        club: acmClub._id,
        venue: 'Campus Innovation Center & Central Auditorium',
        startDate: event1Date,
        endDate: new Date(event1Date.getTime() + 36 * 60 * 60 * 1000),
        registrationDeadline: new Date(event1Date.getTime() - 24 * 60 * 60 * 1000),
        capacity: 150,
        waitlistCapacity: 50,
        currentRegisteredCount: 2,
        currentWaitlistCount: 0,
        status: 'Published',
        checkInCode: 'HACK26',
        tags: ['Hackathons', 'Web Development', 'AI', 'Coding'],
      },
      {
        title: 'Hands-on Generative AI & LLM Systems Workshop',
        description: 'Comprehensive technical workshop hosted by faculty covering Retrieval-Augmented Generation (RAG), local model fine-tuning, and building agentic applications.',
        category: 'Workshop',
        organizer: facultyUser._id,
        department: cseDept._id,
        venue: 'Computer Center Lab 4 (Block A)',
        startDate: event2Date,
        endDate: new Date(event2Date.getTime() + 4 * 60 * 60 * 1000),
        registrationDeadline: new Date(event2Date.getTime() - 48 * 60 * 60 * 1000),
        capacity: 40,
        waitlistCapacity: 20,
        currentRegisteredCount: 1,
        currentWaitlistCount: 0,
        status: 'Published',
        checkInCode: 'AIGEN1',
        tags: ['AI Workshops', 'Machine Learning', 'Research'],
      },
      {
        title: 'Campus Leadership & Entrepreneurship Summit',
        description: 'Past campus flagship symposium featuring keynote speeches from alumni founders, venture capitalists, and industry executives.',
        category: 'Seminar',
        organizer: facultyUser._id,
        department: sbmDept._id,
        venue: 'Main Auditorium',
        startDate: event3Date,
        endDate: new Date(event3Date.getTime() + 6 * 60 * 60 * 1000),
        registrationDeadline: new Date(event3Date.getTime() - 24 * 60 * 60 * 1000),
        capacity: 200,
        waitlistCapacity: 50,
        currentRegisteredCount: 2,
        currentWaitlistCount: 0,
        status: 'Completed',
        checkInCode: 'SUMMIT',
        tags: ['Business', 'Entrepreneurship', 'Leadership'],
      },
    ]);

    // Registrations
    await EventRegistration.insertMany([
      { event: events[0]._id, user: studentAlex._id, status: 'registered' },
      { event: events[0]._id, user: studentPriya._id, status: 'registered' },
      { event: events[1]._id, user: studentAlex._id, status: 'registered' },
      { event: events[2]._id, user: studentAlex._id, status: 'attended', checkInTime: event3Date },
      { event: events[2]._id, user: studentPriya._id, status: 'attended', checkInTime: event3Date },
    ]);

    console.log('[Seed] Seeding Lost & Found Reports...');

    // 5. Lost & Found Items (crafted to trigger high match in algorithm)
    const lostDate = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
    const foundDate = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);

    const lostFoundItems = await LostFoundItem.insertMany([
      {
        type: 'lost',
        title: 'Lost Apple AirPods Pro 2nd Gen in White Case',
        category: 'Electronics',
        description: 'Lost my AirPods Pro white charging case with a small Pikachu sticker on the back. Dropped somewhere near 2nd floor library quiet section.',
        color: 'White',
        dateOccurred: lostDate,
        location: 'Central Library 2nd Floor Study Area',
        reporter: studentAlex._id,
        status: 'Potential Match',
      },
      {
        type: 'found',
        title: 'Found AirPods Pro Charging Case with Anime Sticker',
        category: 'Electronics',
        description: 'Found white earbuds case sitting on desk near 2nd floor library window. Handed over to library circulation desk for safekeeping.',
        color: 'White',
        dateOccurred: foundDate,
        location: 'Central Library 2nd Floor Window Seats',
        reporter: studentPriya._id,
        status: 'Open',
      },
      {
        type: 'lost',
        title: 'Lost TI-84 Plus CE Graphing Calculator',
        category: 'Electronics',
        description: 'Dark blue graphing calculator with name scratched lightly on inside of slider cover.',
        color: 'Blue',
        dateOccurred: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000),
        location: 'Block B Mathematics Lecture Hall 102',
        reporter: studentPriya._id,
        status: 'Open',
      },
      {
        type: 'found',
        title: 'Found Metal HydroFlask Water Bottle',
        category: 'Bottles & Containers',
        description: 'Black stainless steel 32oz water bottle with several coding and mountain stickers.',
        color: 'Black',
        dateOccurred: new Date(now.getTime() - 12 * 60 * 60 * 1000),
        location: 'Cafeteria Outdoor Patio',
        reporter: studentAlex._id,
        status: 'Open',
      },
    ]);

    console.log('[Seed] Seeding Campus Marketplace...');

    // 6. Marketplace Listings
    const listings = await MarketplaceListing.insertMany([
      {
        title: 'Texas Instruments TI-84 Plus Graphing Calculator',
        description: 'In pristine condition, includes charging cable and protective slip case. Essential for Calculus, Linear Algebra, and Engineering Statistics.',
        category: 'Calculators & Tools',
        condition: 'Like New',
        listingType: 'Sell',
        price: 45,
        seller: studentAlex._id,
        status: 'Available',
      },
      {
        title: 'Introduction to Algorithms (CLRS) 4th Edition Hardcover',
        description: 'Standard textbook for Data Structures & Algorithms. Minimal highlighter marks on first two chapters, spine in excellent condition.',
        category: 'Textbooks',
        condition: 'Gently Used',
        listingType: 'Sell',
        price: 35,
        seller: studentAlex._id,
        status: 'Available',
      },
      {
        title: 'Organic Chemistry Lab Coat (Size M) + Chemical Splash Goggles',
        description: 'Official 100% cotton white lab coat and ANSI-approved eye protection. Clean, freshly washed, ready for semester chemistry lab.',
        category: 'Lab Coats & Equipment',
        condition: 'Like New',
        listingType: 'Exchange',
        price: 0,
        exchangePreference: 'Looking for EE 3rd sem breadboard or Multimeter',
        seller: studentPriya._id,
        status: 'Available',
      },
      {
        title: 'Logitech Wireless Ergonomic Mouse & Keyboard Combo',
        description: 'Upgrading my desk setup. Selling my silent wireless mouse and keyboard. Works perfectly with USB dongle included.',
        category: 'Electronics & Gadgets',
        condition: 'Gently Used',
        listingType: 'Sell',
        price: 20,
        seller: studentPriya._id,
        status: 'Available',
      },
    ]);

    // Sample marketplace request
    await MarketplaceRequest.create({
      listing: listings[0]._id,
      buyer: studentPriya._id,
      offerType: 'Buy',
      offeredPrice: 40,
      message: 'Hi Alex! Would you be willing to meet at the library foyer tomorrow afternoon for $40 cash/exchange?',
      handoverLocation: 'Central Library Foyer',
      status: 'Pending',
    });

    console.log('[Seed] Seeding Peer Tutoring & Reviews...');

    // 7. Tutor Profiles
    const tutorProfile = await TutorProfile.create({
      user: studentAlex._id,
      subjects: ['Data Structures & Algorithms', 'Web Development (MERN)', 'Object-Oriented Programming (Java)'],
      bio: 'Junior CSE student with an A grade in CS201 & CS202. Passionate about helping fellow peers master pointers, dynamic programming, and full-stack web development.',
      experience: '2 semesters as peer mentor, author of open-source coding guides.',
      department: cseDept._id,
      meetingModes: ['In-person', 'Online', 'Hybrid'],
      availableSlots: [
        { dayOfWeek: 'Monday', startTime: '15:00', endTime: '17:00' },
        { dayOfWeek: 'Wednesday', startTime: '14:00', endTime: '16:00' },
        { dayOfWeek: 'Friday', startTime: '16:00', endTime: '18:00' },
      ],
      ratingAverage: 4.8,
      ratingCount: 3,
      isActive: true,
    });

    const pastTutoringDate = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
    const completedSession = await TutoringSession.create({
      tutor: studentAlex._id,
      student: studentPriya._id,
      subject: 'Data Structures & Algorithms',
      date: pastTutoringDate,
      startTime: '15:00',
      endTime: '16:00',
      meetingMode: 'In-person',
      locationOrLink: 'Library Quiet Study Room 2',
      notes: 'Focused on Binary Search Trees and balanced AVL rotation mechanics.',
      status: 'Completed',
      hasReview: true,
    });

    await TutoringReview.create({
      session: completedSession._id,
      tutor: studentAlex._id,
      student: studentPriya._id,
      rating: 5,
      comment: 'Alex was patient, clear, and drew out the tree transformations on the whiteboard. Helped me ace my midterm quiz!',
    });

    console.log('[Seed] Seeding Campus Resources & Bookings...');

    // 8. Campus Resources
    const resources = await CampusResource.insertMany([
      {
        name: 'Seminar Hall A (Auditorium Wing)',
        type: 'Hall',
        location: 'Block A, Ground Floor',
        capacity: 120,
        description: 'Acoustically treated tiered seminar hall equipped with twin 4K laser projectors, wireless lapel mics, and lecture capture.',
        operatingHours: { open: '08:00', close: '20:00' },
        allowedRoles: ['faculty', 'coordinator', 'admin'],
        department: cseDept._id,
      },
      {
        name: 'Advanced Robotics & IoT Innovation Lab',
        type: 'Lab',
        location: 'Engineering Workshop Block, Room 104',
        capacity: 25,
        description: 'Specialized lab featuring 3D printers, oscilloscopes, soldering stations, CNC router, and robotic arm test benches.',
        operatingHours: { open: '09:00', close: '19:00' },
        allowedRoles: ['student', 'faculty', 'coordinator', 'resource_manager', 'admin'],
        department: eeeDept._id,
      },
      {
        name: 'High-Performance 4K Projector & Audio Kit #1',
        type: 'Equipment',
        location: 'Equipment Dispatch Desk (Room B-02)',
        capacity: 1,
        description: 'Portable Epson 4K projector, tripod projection screen, HDMI splitters, and JBL Bluetooth PA speaker in road case.',
        operatingHours: { open: '08:00', close: '18:00' },
        allowedRoles: ['student', 'faculty', 'coordinator', 'resource_manager', 'admin'],
      },
      {
        name: 'Multimedia & Podcast Recording Studio',
        type: 'Room',
        location: 'Media Arts Annex, Studio 3',
        capacity: 8,
        description: 'Sound-isolated acoustic recording room with 4 Shure SM7B mics, audio interface, and green screen backdrop.',
        operatingHours: { open: '10:00', close: '21:00' },
        allowedRoles: ['student', 'faculty', 'coordinator', 'admin'],
      },
    ]);

    // Bookings
    const bookingDate = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
    bookingDate.setHours(0, 0, 0, 0);

    await ResourceBooking.insertMany([
      {
        resource: resources[0]._id,
        requestedBy: coordUser._id,
        purpose: 'ACM Technical Speaker Session on System Architecture',
        date: bookingDate,
        startTime: '14:00',
        endTime: '17:00',
        expectedAttendees: 60,
        status: 'Approved',
        reviewedBy: resourceManagerUser._id,
        reviewNotes: 'Approved. AV technician assigned to assist.',
      },
      {
        resource: resources[1]._id,
        requestedBy: studentAlex._id,
        purpose: 'Robotics autonomous vehicle motor controller calibration',
        date: bookingDate,
        startTime: '10:00',
        endTime: '12:00',
        expectedAttendees: 4,
        status: 'Pending',
      },
    ]);

    console.log('[Seed] Seeding Volunteering & Certificates...');

    // 9. Volunteering Activities
    const volDate1 = new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000);
    const volDate2 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const volunteeringActs = await VolunteeringActivity.insertMany([
      {
        title: 'Annual Campus Red Cross Blood Donation Drive 2026',
        description: 'Volunteer support team needed to assist donor check-in, distribute nutritional refreshments, coordinate queues, and manage awareness stalls.',
        organizer: facultyUser._id,
        department: cseDept._id,
        venue: 'Student Health & Wellness Pavilion',
        date: volDate1,
        startTime: '09:00',
        endTime: '15:00',
        allocatedHours: 6.0,
        requiredSkills: ['Donor registration', 'Compassion', 'Queue assistance'],
        capacity: 30,
        currentRegisteredCount: 2,
        status: 'Open',
      },
      {
        title: 'Community Green Campus & Urban Tree Plantation',
        description: 'Completed environmental conservation drive where students planted 150 indigenous saplings across the university campus periphery.',
        organizer: facultyUser._id,
        department: sbmDept._id,
        venue: 'Campus North Gardens',
        date: volDate2,
        startTime: '08:00',
        endTime: '12:00',
        allocatedHours: 4.0,
        requiredSkills: ['Gardening', 'Teamwork', 'Physical activity'],
        capacity: 40,
        currentRegisteredCount: 2,
        status: 'Completed',
      },
    ]);

    // Volunteering Registrations
    await VolunteeringRegistration.insertMany([
      {
        activity: volunteeringActs[0]._id,
        volunteer: studentAlex._id,
        status: 'registered',
      },
      {
        activity: volunteeringActs[0]._id,
        volunteer: studentPriya._id,
        status: 'registered',
      },
      {
        activity: volunteeringActs[1]._id,
        volunteer: studentAlex._id,
        status: 'attended',
        verifiedHours: 4.0,
        verifiedBy: facultyUser._id,
        verificationNotes: 'Actively participated throughout the tree plantation drive and assisted with tree staking.',
        certificateIssued: true,
        certificateCode: 'CS-VOL-2026-ALEX-7841',
        issuedAt: volDate2,
      },
      {
        activity: volunteeringActs[1]._id,
        volunteer: studentPriya._id,
        status: 'attended',
        verifiedHours: 4.0,
        verifiedBy: facultyUser._id,
        verificationNotes: 'Managed seedling distribution and sapling labeling effectively.',
        certificateIssued: true,
        certificateCode: 'CS-VOL-2026-PRIYA-9122',
        issuedAt: volDate2,
      },
    ]);

    console.log('[Seed] Seeding Announcements & Notifications...');

    // 10. Announcements
    await Announcement.insertMany([
      {
        title: 'Campus IT Infrastructure Maintenance & Gigabit Fiber Upgrade',
        content: 'Campus network switches will undergo scheduled firmware upgrades this Saturday between 1:00 AM and 5:00 AM. Intermittent Wi-Fi access may occur in dorms.',
        author: adminUser._id,
        targetAudience: 'All',
        category: 'Maintenance',
        isPinned: true,
      },
      {
        title: 'SphereHacks 2026 Registration Open — Limited Slots Available!',
        content: 'Registration is now live for our flagship 36-hour hackathon. Form your team of 2-4 and submit your project track preference before the deadline.',
        author: coordUser._id,
        targetAudience: 'All',
        category: 'Event',
        isPinned: true,
      },
      {
        title: 'CSE Department Research Assistantships for Fall 2026',
        content: 'Applications are open for undergraduate research assistantships in Computer Vision, Quantum Computing, and Distributed Systems. Submit CV to faculty mentor.',
        author: facultyUser._id,
        targetAudience: 'Department',
        targetDepartment: cseDept._id,
        category: 'Academic',
        isPinned: false,
      },
    ]);

    // 11. Notifications
    await Notification.insertMany([
      {
        recipient: studentAlex._id,
        title: 'Event Confirmed: SphereHacks 2026',
        message: 'Your seat for SphereHacks 2026 has been confirmed! Check-in code: HACK26',
        type: 'event',
        actionUrl: `/events/${events[0]._id}`,
        isRead: false,
      },
      {
        recipient: studentAlex._id,
        title: '🎖️ Volunteering Certificate Ready',
        message: 'Your certificate for 4.0 verified hours in "Community Green Campus" is available for download.',
        type: 'volunteering',
        actionUrl: '/volunteering/my-records',
        isRead: false,
      },
      {
        recipient: studentAlex._id,
        title: '🛒 New Marketplace Offer',
        message: 'Priya submitted an offer of $40 on your TI-84 Plus Graphing Calculator.',
        type: 'marketplace',
        actionUrl: `/marketplace/${listings[0]._id}`,
        isRead: true,
      },
      {
        recipient: studentPriya._id,
        title: 'Event Confirmed: SphereHacks 2026',
        message: 'Your seat for SphereHacks 2026 has been confirmed! Check-in code: HACK26',
        type: 'event',
        actionUrl: `/events/${events[0]._id}`,
        isRead: false,
      },
    ]);

    // 12. Platform Settings
    await PlatformSetting.insertMany([
      { key: 'CAMPUS_NAME', value: 'Apex Institute of Technology & Science', description: 'Institutional Name' },
      { key: 'ALLOWED_EMAIL_DOMAIN', value: 'campussphere.edu', description: 'Authorized institutional email domain' },
      { key: 'ENABLE_WAITLISTS', value: true, description: 'Enable automatic event waitlist queue and promotions' },
      { key: 'MAX_ACTIVE_BOOKINGS_PER_USER', value: 3, description: 'Maximum active resource bookings allowed per student' },
    ]);

    console.log('[Seed] Seeding completed successfully!');
    console.log('========================================================');
    console.log('DEMO ACCOUNTS READY:');
    console.log('1. Admin:            admin@campussphere.edu           / Admin@123');
    console.log('2. Faculty:          faculty@campussphere.edu         / Faculty@123');
    console.log('3. Club Coordinator: coordinator@campussphere.edu     / Coordinator@123');
    console.log('4. Resource Manager: resourcemanager@campussphere.edu / Manager@123');
    console.log('5. Student 1:        student@campussphere.edu         / Student@123');
    console.log('6. Student 2:        student2@campussphere.edu        / Student@123');
    console.log('========================================================');

    if (process.env.NODE_ENV !== 'test') {
      process.exit(0);
    }
  } catch (error) {
    console.error('[Seed Error]:', error);
    if (process.env.NODE_ENV !== 'test') {
      process.exit(1);
    }
  }
};

if (process.argv[1]?.endsWith('seed.js')) {
  seedDatabase();
}
