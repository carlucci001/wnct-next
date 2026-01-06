import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, doc, writeBatch, serverTimestamp, getDocs, deleteDoc } from 'firebase/firestore';

// Force dynamic to prevent prerendering during build
export const dynamic = 'force-dynamic';

// 10 Master Directory Categories for a local newspaper
export const DIRECTORY_CATEGORIES = [
  {
    name: 'Restaurants & Dining',
    slug: 'restaurants-dining',
    icon: 'utensils',
    googleType: 'restaurant',
    description: 'Local restaurants, cafes, bars, and eateries'
  },
  {
    name: 'Shopping & Retail',
    slug: 'shopping-retail',
    icon: 'shopping-bag',
    googleType: 'store',
    description: 'Shops, boutiques, and retail stores'
  },
  {
    name: 'Health & Medical',
    slug: 'health-medical',
    icon: 'heart-pulse',
    googleType: 'doctor',
    description: 'Doctors, dentists, clinics, and medical services'
  },
  {
    name: 'Professional Services',
    slug: 'professional-services',
    icon: 'briefcase',
    googleType: 'lawyer',
    description: 'Lawyers, accountants, consultants, and business services'
  },
  {
    name: 'Home Services',
    slug: 'home-services',
    icon: 'home',
    googleType: 'plumber',
    description: 'Contractors, plumbers, electricians, and home repair'
  },
  {
    name: 'Automotive',
    slug: 'automotive',
    icon: 'car',
    googleType: 'car_repair',
    description: 'Auto repair, dealerships, and car services'
  },
  {
    name: 'Beauty & Personal Care',
    slug: 'beauty-personal-care',
    icon: 'scissors',
    googleType: 'beauty_salon',
    description: 'Salons, spas, barbers, and personal care'
  },
  {
    name: 'Entertainment & Recreation',
    slug: 'entertainment-recreation',
    icon: 'ticket',
    googleType: 'movie_theater',
    description: 'Entertainment venues, gyms, and recreation'
  },
  {
    name: 'Real Estate',
    slug: 'real-estate',
    icon: 'building',
    googleType: 'real_estate_agency',
    description: 'Real estate agents, property management, and rentals'
  },
  {
    name: 'Education & Childcare',
    slug: 'education-childcare',
    icon: 'graduation-cap',
    googleType: 'school',
    description: 'Schools, tutoring, daycare, and educational services'
  }
];

// Fallback mock data for each category (real Asheville-area businesses for demo)
const MOCK_BUSINESSES_BY_CATEGORY: Record<string, Array<{
  name: string;
  description: string;
  address: { street: string; city: string; state: string; zip: string };
  phone: string;
  website?: string;
  hours?: Record<string, string>;
}>> = {
  'Restaurants & Dining': [
    { name: 'Curate', description: 'Award-winning Spanish tapas restaurant featuring authentic flavors and an extensive wine list.', address: { street: '13 Biltmore Ave', city: 'Asheville', state: 'NC', zip: '28801' }, phone: '(828) 239-2946', website: 'https://www.curatetapasbar.com', hours: { monday: '5:30 PM - 10:00 PM', tuesday: '5:30 PM - 10:00 PM', wednesday: '5:30 PM - 10:00 PM', thursday: '5:30 PM - 10:00 PM', friday: '5:30 PM - 11:00 PM', saturday: '5:30 PM - 11:00 PM', sunday: '5:30 PM - 9:00 PM' } },
    { name: 'Tupelo Honey', description: 'Southern comfort food with a modern twist, featuring locally-sourced ingredients.', address: { street: '12 College St', city: 'Asheville', state: 'NC', zip: '28801' }, phone: '(828) 255-4863', website: 'https://tupelohoneycafe.com' },
    { name: 'Rhubarb', description: 'Farm-to-table restaurant showcasing Appalachian cuisine with seasonal ingredients.', address: { street: '7 SW Pack Square', city: 'Asheville', state: 'NC', zip: '28801' }, phone: '(828) 785-1503', website: 'https://www.rhubarbasheville.com' },
    { name: 'Early Girl Eatery', description: 'Beloved breakfast and brunch spot serving Southern favorites with local ingredients.', address: { street: '8 Wall St', city: 'Asheville', state: 'NC', zip: '28801' }, phone: '(828) 259-9292', website: 'https://earlygirleatery.com' },
    { name: 'Chai Pani', description: 'Authentic Indian street food in a vibrant, casual setting.', address: { street: '22 Battery Park Ave', city: 'Asheville', state: 'NC', zip: '28801' }, phone: '(828) 254-4003', website: 'https://chaipaniasheville.com' },
    { name: 'Biscuit Head', description: 'Cat-head biscuits and creative Southern breakfast dishes.', address: { street: '417 Biltmore Ave', city: 'Asheville', state: 'NC', zip: '28801' }, phone: '(828) 333-5145', website: 'https://biscuitheads.com' },
    { name: 'White Duck Taco Shop', description: 'Creative gourmet tacos with globally-inspired fillings.', address: { street: '12 Roberts St', city: 'Asheville', state: 'NC', zip: '28801' }, phone: '(828) 258-1660', website: 'https://whiteducktacoshop.com' },
    { name: 'Limones', description: 'Upscale Mexican and California cuisine with an extensive tequila selection.', address: { street: '153 Coxe Ave', city: 'Asheville', state: 'NC', zip: '28801' }, phone: '(828) 252-2327', website: 'https://www.limonesrestaurant.com' },
    { name: 'The Admiral', description: 'Innovative American cuisine in an intimate, creative setting.', address: { street: '400 Haywood Rd', city: 'Asheville', state: 'NC', zip: '28806' }, phone: '(828) 252-2541', website: 'https://theadmiralnc.com' },
    { name: 'Zambra', description: 'Spanish and Mediterranean tapas with an elegant atmosphere.', address: { street: '85A Walnut St', city: 'Asheville', state: 'NC', zip: '28801' }, phone: '(828) 232-1060', website: 'https://zambratapas.com' }
  ],
  'Shopping & Retail': [
    { name: 'Mast General Store', description: 'Historic general store featuring outdoor gear, candy, and Appalachian goods.', address: { street: '15 Biltmore Ave', city: 'Asheville', state: 'NC', zip: '28801' }, phone: '(828) 232-1883', website: 'https://mastgeneralstore.com' },
    { name: 'The Regeneration Station', description: 'Vintage and antique finds in the River Arts District.', address: { street: '111 Riverside Dr', city: 'Asheville', state: 'NC', zip: '28801' }, phone: '(828) 505-1599' },
    { name: 'Tops for Shoes', description: 'Quality footwear and expert fitting since 1957.', address: { street: '27 N Lexington Ave', city: 'Asheville', state: 'NC', zip: '28801' }, phone: '(828) 254-6721', website: 'https://topsforshoes.com' },
    { name: 'Battery Park Book Exchange', description: 'Used bookstore and champagne bar in historic Grove Arcade.', address: { street: '1 Page Ave', city: 'Asheville', state: 'NC', zip: '28801' }, phone: '(828) 252-0020', website: 'https://batteryparkbookexchange.com' },
    { name: 'Woolworth Walk', description: 'Art gallery and gift shop featuring local artists.', address: { street: '25 Haywood St', city: 'Asheville', state: 'NC', zip: '28801' }, phone: '(828) 254-9234', website: 'https://woolworthwalk.com' },
    { name: 'East Fork Pottery', description: 'Handcrafted pottery made in Asheville since 2009.', address: { street: '82 N Lexington Ave', city: 'Asheville', state: 'NC', zip: '28801' }, phone: '(828) 505-4010', website: 'https://eastfork.com' },
    { name: 'The Asheville Bee Charmer', description: 'Local honey, bee products, and gifts.', address: { street: '38 Battery Park Ave', city: 'Asheville', state: 'NC', zip: '28801' }, phone: '(828) 505-7500', website: 'https://ashevillebeecharmer.com' },
    { name: 'Dancing Bear Toys', description: 'Classic toys and games for all ages.', address: { street: '418 N Main St', city: 'Hendersonville', state: 'NC', zip: '28792' }, phone: '(828) 693-4500', website: 'https://dancingbeartoys.com' },
    { name: 'Instant Karma', description: 'Vintage clothing and unique fashion finds.', address: { street: '60 N Lexington Ave', city: 'Asheville', state: 'NC', zip: '28801' }, phone: '(828) 505-3303' },
    { name: 'Mountain Made', description: 'Gallery featuring handcrafted work by Southern Appalachian artists.', address: { street: '1 Page Ave', city: 'Asheville', state: 'NC', zip: '28801' }, phone: '(828) 350-0307', website: 'https://mountainmade.com' }
  ],
  'Health & Medical': [
    { name: 'Mission Hospital', description: 'Comprehensive medical center serving Western North Carolina.', address: { street: '509 Biltmore Ave', city: 'Asheville', state: 'NC', zip: '28801' }, phone: '(828) 213-1111', website: 'https://missionhealth.org' },
    { name: 'MAHEC Family Health Center', description: 'Community health center providing primary care services.', address: { street: '123 Hendersonville Rd', city: 'Asheville', state: 'NC', zip: '28803' }, phone: '(828) 257-4740', website: 'https://mahec.net' },
    { name: 'Asheville Eye Associates', description: 'Comprehensive eye care and vision services.', address: { street: '31 Doctors Dr', city: 'Asheville', state: 'NC', zip: '28801' }, phone: '(828) 258-1586', website: 'https://ashevilleeyeassociates.com' },
    { name: 'Blue Ridge Dental', description: 'Family dentistry with modern technology and compassionate care.', address: { street: '1855 Hendersonville Rd', city: 'Asheville', state: 'NC', zip: '28803' }, phone: '(828) 274-9440' },
    { name: 'Asheville Integrative Medicine', description: 'Holistic healthcare combining conventional and alternative medicine.', address: { street: '87 Haywood St', city: 'Asheville', state: 'NC', zip: '28801' }, phone: '(828) 505-0039' },
    { name: 'Mountain Physical Therapy', description: 'Expert physical therapy and rehabilitation services.', address: { street: '1350 Tunnel Rd', city: 'Asheville', state: 'NC', zip: '28805' }, phone: '(828) 298-0492' },
    { name: 'Asheville Cardiology Associates', description: 'Specialized cardiovascular care and treatment.', address: { street: '18 Medical Park Dr', city: 'Asheville', state: 'NC', zip: '28803' }, phone: '(828) 274-6000' },
    { name: 'WNC Pediatrics', description: 'Caring for children from newborn to young adult.', address: { street: '1 Vanderbilt Park Dr', city: 'Asheville', state: 'NC', zip: '28803' }, phone: '(828) 277-0661' },
    { name: 'Asheville Wellness Center', description: 'Chiropractic, massage, and wellness services.', address: { street: '85 Tunnel Rd', city: 'Asheville', state: 'NC', zip: '28805' }, phone: '(828) 299-4555' },
    { name: 'Blue Ridge Urgent Care', description: '24/7 urgent care for non-emergency medical needs.', address: { street: '1833 Hendersonville Rd', city: 'Asheville', state: 'NC', zip: '28803' }, phone: '(828) 277-2273' }
  ],
  'Professional Services': [
    { name: 'Roberts & Stevens PA', description: 'Full-service law firm serving WNC since 1973.', address: { street: '301 College St', city: 'Asheville', state: 'NC', zip: '28801' }, phone: '(828) 252-6600', website: 'https://roberts-stevens.com' },
    { name: 'Dixon Hughes Goodman', description: 'Accounting, tax, and advisory services.', address: { street: '500 Ridgefield Ct', city: 'Asheville', state: 'NC', zip: '28806' }, phone: '(828) 254-2254', website: 'https://dhg.com' },
    { name: 'Edward Jones - Asheville', description: 'Financial advisor services for individuals and families.', address: { street: '1 Town Square Blvd', city: 'Asheville', state: 'NC', zip: '28803' }, phone: '(828) 274-4242', website: 'https://edwardjones.com' },
    { name: 'Asheville Insurance Center', description: 'Independent insurance agency for home, auto, and business.', address: { street: '145 Coxe Ave', city: 'Asheville', state: 'NC', zip: '28801' }, phone: '(828) 258-1181' },
    { name: 'Mountain BizWorks', description: 'Small business loans and consulting services.', address: { street: '153 S Lexington Ave', city: 'Asheville', state: 'NC', zip: '28801' }, phone: '(828) 253-2834', website: 'https://mountainbizworks.org' },
    { name: 'Asheville Notary Services', description: 'Mobile notary and signing agent services.', address: { street: '25 Page Ave', city: 'Asheville', state: 'NC', zip: '28801' }, phone: '(828) 505-8765' },
    { name: 'WNC Marketing Group', description: 'Digital marketing and advertising agency.', address: { street: '48 Patton Ave', city: 'Asheville', state: 'NC', zip: '28801' }, phone: '(828) 252-9876' },
    { name: 'Blue Ridge IT Solutions', description: 'Managed IT services for small businesses.', address: { street: '500 Sweeten Creek Rd', city: 'Asheville', state: 'NC', zip: '28803' }, phone: '(828) 277-4444' },
    { name: 'Asheville HR Consulting', description: 'Human resources consulting and support.', address: { street: '1 Vanderbilt Park Dr', city: 'Asheville', state: 'NC', zip: '28803' }, phone: '(828) 505-3000' },
    { name: 'Mountain Translation Services', description: 'Professional translation and interpretation.', address: { street: '60 Biltmore Ave', city: 'Asheville', state: 'NC', zip: '28801' }, phone: '(828) 258-5555' }
  ],
  'Home Services': [
    { name: 'Asheville Plumbing & Heating', description: 'Residential and commercial plumbing services.', address: { street: '1090 Hendersonville Rd', city: 'Asheville', state: 'NC', zip: '28803' }, phone: '(828) 274-1478' },
    { name: 'Four Seasons Heating & Air', description: 'HVAC installation, repair, and maintenance.', address: { street: '20 Old Airport Rd', city: 'Asheville', state: 'NC', zip: '28805' }, phone: '(828) 298-3600', website: 'https://4seasonsheating.com' },
    { name: 'Mountain Electric', description: 'Licensed electricians serving WNC.', address: { street: '500 Sweeten Creek Rd', city: 'Asheville', state: 'NC', zip: '28803' }, phone: '(828) 277-7200' },
    { name: 'Blue Ridge Roofing', description: 'Roofing installation and repair specialists.', address: { street: '85 Haywood St', city: 'Asheville', state: 'NC', zip: '28801' }, phone: '(828) 254-7663' },
    { name: 'Asheville Cleaning Company', description: 'Residential and commercial cleaning services.', address: { street: '1350 Tunnel Rd', city: 'Asheville', state: 'NC', zip: '28805' }, phone: '(828) 252-5555' },
    { name: 'Mountain Landscaping', description: 'Lawn care, landscaping, and outdoor design.', address: { street: '225 Smoky Park Hwy', city: 'Asheville', state: 'NC', zip: '28806' }, phone: '(828) 665-1234' },
    { name: 'WNC Pest Control', description: 'Residential and commercial pest management.', address: { street: '450 Weaverville Hwy', city: 'Asheville', state: 'NC', zip: '28804' }, phone: '(828) 645-2222' },
    { name: 'Asheville Garage Door', description: 'Garage door installation and repair.', address: { street: '1450 Patton Ave', city: 'Asheville', state: 'NC', zip: '28806' }, phone: '(828) 253-4567' },
    { name: 'Blue Ridge Painting', description: 'Interior and exterior painting services.', address: { street: '789 Tunnel Rd', city: 'Asheville', state: 'NC', zip: '28805' }, phone: '(828) 298-9999' },
    { name: 'Mountain Movers', description: 'Local and long-distance moving services.', address: { street: '100 Thompson St', city: 'Asheville', state: 'NC', zip: '28803' }, phone: '(828) 274-6868' }
  ],
  'Automotive': [
    { name: 'Hunter Subaru', description: 'New and used Subaru vehicles and service.', address: { street: '75 Smoky Park Hwy', city: 'Asheville', state: 'NC', zip: '28806' }, phone: '(828) 667-2211', website: 'https://huntersubaru.com' },
    { name: 'Asheville Honda', description: 'Honda sales, service, and parts.', address: { street: '931 Brevard Rd', city: 'Asheville', state: 'NC', zip: '28806' }, phone: '(828) 665-9900' },
    { name: 'Jody\'s Auto Service', description: 'Honest auto repair and maintenance.', address: { street: '855 Hendersonville Rd', city: 'Asheville', state: 'NC', zip: '28803' }, phone: '(828) 277-7999' },
    { name: 'Carstar Collision', description: 'Auto body repair and collision services.', address: { street: '125 Sweeten Creek Rd', city: 'Asheville', state: 'NC', zip: '28803' }, phone: '(828) 274-0099' },
    { name: 'Discount Tire', description: 'Tire sales, installation, and service.', address: { street: '1800 Hendersonville Rd', city: 'Asheville', state: 'NC', zip: '28803' }, phone: '(828) 274-8473' },
    { name: 'Asheville Auto Detailing', description: 'Professional car wash and detailing.', address: { street: '500 Tunnel Rd', city: 'Asheville', state: 'NC', zip: '28805' }, phone: '(828) 298-7788' },
    { name: 'Mountain Transmission', description: 'Transmission repair specialists.', address: { street: '1050 Patton Ave', city: 'Asheville', state: 'NC', zip: '28806' }, phone: '(828) 254-3333' },
    { name: 'Blue Ridge Towing', description: '24-hour towing and roadside assistance.', address: { street: '75 Weaverville Hwy', city: 'Asheville', state: 'NC', zip: '28804' }, phone: '(828) 645-7777' },
    { name: 'Firestone Complete Auto Care', description: 'Full-service auto maintenance and repair.', address: { street: '365 Tunnel Rd', city: 'Asheville', state: 'NC', zip: '28805' }, phone: '(828) 298-5050' },
    { name: 'Enterprise Rent-A-Car', description: 'Car rental services.', address: { street: '61 Terminal Dr', city: 'Asheville', state: 'NC', zip: '28732' }, phone: '(828) 684-7000', website: 'https://enterprise.com' }
  ],
  'Beauty & Personal Care': [
    { name: 'The Salon at Grove Park', description: 'Full-service salon at the Omni Grove Park Inn.', address: { street: '290 Macon Ave', city: 'Asheville', state: 'NC', zip: '28804' }, phone: '(828) 252-2711' },
    { name: 'Wake Foot Sanctuary', description: 'Foot spa and relaxation sanctuary.', address: { street: '28 Biltmore Ave', city: 'Asheville', state: 'NC', zip: '28801' }, phone: '(828) 412-9253', website: 'https://wakefootsanctuary.com' },
    { name: 'Shoji Spa', description: 'Japanese-inspired spa and hot tubs.', address: { street: '96 Avondale Rd', city: 'Asheville', state: 'NC', zip: '28803' }, phone: '(828) 299-0999', website: 'https://shojispa.com' },
    { name: 'Floyd\'s 99 Barbershop', description: 'Modern barbershop with vintage feel.', address: { street: '1 Page Ave', city: 'Asheville', state: 'NC', zip: '28801' }, phone: '(828) 254-2525' },
    { name: 'Asheville Nails & Spa', description: 'Nail care and spa services.', address: { street: '1350 Tunnel Rd', city: 'Asheville', state: 'NC', zip: '28805' }, phone: '(828) 298-2233' },
    { name: 'Mountain Massage', description: 'Therapeutic massage and bodywork.', address: { street: '45 Haywood St', city: 'Asheville', state: 'NC', zip: '28801' }, phone: '(828) 505-8888' },
    { name: 'Blue Ridge Dermatology', description: 'Medical and cosmetic dermatology.', address: { street: '1855 Hendersonville Rd', city: 'Asheville', state: 'NC', zip: '28803' }, phone: '(828) 274-4880' },
    { name: 'Sola Salon Studios', description: 'Individual salon suites for beauty professionals.', address: { street: '800 Fairview Rd', city: 'Asheville', state: 'NC', zip: '28803' }, phone: '(828) 505-3300' },
    { name: 'Asheville Yoga Center', description: 'Yoga classes for all levels.', address: { street: '211 S Liberty St', city: 'Asheville', state: 'NC', zip: '28801' }, phone: '(828) 254-0380', website: 'https://ashevilleyogacenter.com' },
    { name: 'The Spa at Biltmore', description: 'Luxury spa at Biltmore Estate.', address: { street: '1 Lodge St', city: 'Asheville', state: 'NC', zip: '28803' }, phone: '(828) 225-1600', website: 'https://biltmore.com' }
  ],
  'Entertainment & Recreation': [
    { name: 'Asheville Civic Center', description: 'Concert and event venue downtown.', address: { street: '87 Haywood St', city: 'Asheville', state: 'NC', zip: '28801' }, phone: '(828) 259-5736', website: 'https://harrahscherokeecenterasheville.com' },
    { name: 'Orange Peel', description: 'Legendary live music venue.', address: { street: '101 Biltmore Ave', city: 'Asheville', state: 'NC', zip: '28801' }, phone: '(828) 398-1837', website: 'https://theorangepeel.net' },
    { name: 'Fine Arts Theatre', description: 'Independent and foreign films downtown.', address: { street: '36 Biltmore Ave', city: 'Asheville', state: 'NC', zip: '28801' }, phone: '(828) 232-1536', website: 'https://fineartstheatre.com' },
    { name: 'Asheville Pinball Museum', description: 'Play vintage pinball machines.', address: { street: '1 Battle Square', city: 'Asheville', state: 'NC', zip: '28801' }, phone: '(828) 776-5671', website: 'https://ashevillepinball.com' },
    { name: 'LaZoom Comedy Tours', description: 'Comedy bus tours of Asheville.', address: { street: '76 Biltmore Ave', city: 'Asheville', state: 'NC', zip: '28801' }, phone: '(828) 225-6932', website: 'https://lazoomtours.com' },
    { name: 'Navitat Canopy Adventures', description: 'Zipline and aerial adventures.', address: { street: '242 Poverty Branch Rd', city: 'Barnardsville', state: 'NC', zip: '28709' }, phone: '(855) 628-4828', website: 'https://navitat.com' },
    { name: 'French Broad Outfitters', description: 'Kayak, paddleboard, and tube rentals.', address: { street: '704 Riverside Dr', city: 'Asheville', state: 'NC', zip: '28801' }, phone: '(828) 505-7371', website: 'https://frenchbroadoutfitters.com' },
    { name: 'YMCA of WNC', description: 'Fitness centers and community programs.', address: { street: '30 Woodfin St', city: 'Asheville', state: 'NC', zip: '28801' }, phone: '(828) 251-5910', website: 'https://ymcawnc.org' },
    { name: 'Asheville Tourists Baseball', description: 'Minor league baseball at McCormick Field.', address: { street: '30 Buchanan Pl', city: 'Asheville', state: 'NC', zip: '28801' }, phone: '(828) 258-0428', website: 'https://milb.com/asheville' },
    { name: 'Biltmore Estate', description: 'America\'s largest home with gardens and winery.', address: { street: '1 Lodge St', city: 'Asheville', state: 'NC', zip: '28803' }, phone: '(800) 411-3812', website: 'https://biltmore.com' }
  ],
  'Real Estate': [
    { name: 'Beverly-Hanks Realtors', description: 'Leading real estate firm in Western NC.', address: { street: '33 N Main St', city: 'Weaverville', state: 'NC', zip: '28787' }, phone: '(828) 645-1900', website: 'https://beverly-hanks.com' },
    { name: 'Keller Williams Asheville', description: 'Full-service real estate brokerage.', address: { street: '22 Regent Park Blvd', city: 'Asheville', state: 'NC', zip: '28806' }, phone: '(828) 252-4663' },
    { name: 'Mosaic Realty', description: 'Boutique real estate for distinctive properties.', address: { street: '10 S Pack Square', city: 'Asheville', state: 'NC', zip: '28801' }, phone: '(828) 707-6200', website: 'https://mymosaicrealty.com' },
    { name: 'Greybeard Realty', description: 'Mountain home specialists since 1999.', address: { street: '4 N Main St', city: 'Black Mountain', state: 'NC', zip: '28711' }, phone: '(828) 669-8687', website: 'https://greybeardrealty.com' },
    { name: 'Allen Tate Realtors', description: 'Comprehensive real estate services.', address: { street: '1 Town Square Blvd', city: 'Asheville', state: 'NC', zip: '28803' }, phone: '(828) 274-1100', website: 'https://allentate.com' },
    { name: 'NAI Beverly-Hanks Commercial', description: 'Commercial real estate services.', address: { street: '22 Battery Park Ave', city: 'Asheville', state: 'NC', zip: '28801' }, phone: '(828) 254-6155' },
    { name: 'Asheville Property Management', description: 'Rental property management services.', address: { street: '500 Sweeten Creek Rd', city: 'Asheville', state: 'NC', zip: '28803' }, phone: '(828) 277-4000' },
    { name: 'Premier Sothebys', description: 'Luxury real estate specialists.', address: { street: '17 Coxe Ave', city: 'Asheville', state: 'NC', zip: '28801' }, phone: '(828) 505-5000' },
    { name: 'Carolina Mountain Real Estate', description: 'Residential and land sales in WNC.', address: { street: '100 Tunnel Rd', city: 'Asheville', state: 'NC', zip: '28805' }, phone: '(828) 298-1234' },
    { name: 'Mountain Home Appraisals', description: 'Certified residential appraisals.', address: { street: '85 Tunnel Rd', city: 'Asheville', state: 'NC', zip: '28805' }, phone: '(828) 298-4567' }
  ],
  'Education & Childcare': [
    { name: 'UNCA - UNC Asheville', description: 'Public liberal arts university.', address: { street: '1 University Heights', city: 'Asheville', state: 'NC', zip: '28804' }, phone: '(828) 251-6600', website: 'https://unca.edu' },
    { name: 'AB Tech Community College', description: 'Community college serving Buncombe County.', address: { street: '340 Victoria Rd', city: 'Asheville', state: 'NC', zip: '28801' }, phone: '(828) 398-7900', website: 'https://abtech.edu' },
    { name: 'Asheville City Schools', description: 'Public school district for Asheville.', address: { street: '85 Mountain St', city: 'Asheville', state: 'NC', zip: '28801' }, phone: '(828) 350-6100', website: 'https://ashevillecityschools.net' },
    { name: 'Carolina Day School', description: 'Independent college preparatory school.', address: { street: '1345 Hendersonville Rd', city: 'Asheville', state: 'NC', zip: '28803' }, phone: '(828) 274-0757', website: 'https://cfrday.org' },
    { name: 'Asheville Montessori School', description: 'Montessori education for ages 2-12.', address: { street: '20 Willow Rd', city: 'Asheville', state: 'NC', zip: '28804' }, phone: '(828) 258-1297' },
    { name: 'Rainbow Community School', description: 'Progressive education pre-K through 8th grade.', address: { street: '574 Haywood Rd', city: 'Asheville', state: 'NC', zip: '28806' }, phone: '(828) 258-0005', website: 'https://rainbowlearning.org' },
    { name: 'Goddard School', description: 'Early childhood education and daycare.', address: { street: '1 Beaverdam Rd', city: 'Asheville', state: 'NC', zip: '28804' }, phone: '(828) 505-2233', website: 'https://goddardschool.com' },
    { name: 'Kumon Math & Reading', description: 'After-school tutoring programs.', address: { street: '1833 Hendersonville Rd', city: 'Asheville', state: 'NC', zip: '28803' }, phone: '(828) 277-1900', website: 'https://kumon.com' },
    { name: 'Sylvan Learning', description: 'Tutoring and test prep services.', address: { street: '85 Tunnel Rd', city: 'Asheville', state: 'NC', zip: '28805' }, phone: '(828) 298-6161', website: 'https://sylvanlearning.com' },
    { name: 'KinderCare Asheville', description: 'Early childhood education and daycare.', address: { street: '95 Weaverville Hwy', city: 'Asheville', state: 'NC', zip: '28804' }, phone: '(828) 645-3388', website: 'https://kindercare.com' }
  ]
};

// Business data structure from Google Places or mock
interface BusinessData {
  name: string;
  description: string;
  address: { street: string; city: string; state: string; zip: string };
  phone: string;
  website?: string;
  hours?: Record<string, string>;
}

// Google Places API integration (if API key is available)
async function fetchFromGooglePlaces(category: string, googleType: string): Promise<BusinessData[] | null> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;

  if (!apiKey) {
    console.log('[Seed] No Google Places API key found, using mock data');
    return null;
  }

  try {
    // Search for businesses in Asheville, NC
    const location = '35.5951,-82.5515'; // Asheville coordinates
    const radius = 15000; // 15km radius

    const searchUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${location}&radius=${radius}&type=${googleType}&key=${apiKey}`;

    const response = await fetch(searchUrl);
    const data = await response.json();

    if (data.status !== 'OK' || !data.results) {
      console.warn('[Seed] Google Places API returned:', data.status);
      return null;
    }

    // Get details for each place
    const businesses = [];
    for (const place of data.results.slice(0, 10)) {
      try {
        const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=name,formatted_address,formatted_phone_number,website,opening_hours,geometry&key=${apiKey}`;
        const detailsResponse = await fetch(detailsUrl);
        const detailsData = await detailsResponse.json();

        if (detailsData.result) {
          const details = detailsData.result;

          // Parse address components
          const addressParts = details.formatted_address?.split(',') || [];
          const street = addressParts[0]?.trim() || '';
          const cityState = addressParts[1]?.trim() || '';
          const zipMatch = addressParts[2]?.match(/\d{5}/);

          businesses.push({
            name: details.name,
            description: `${details.name} is a local ${category.toLowerCase()} business in Asheville.`,
            address: {
              street,
              city: cityState.split(' ')[0] || 'Asheville',
              state: 'NC',
              zip: zipMatch?.[0] || '28801'
            },
            phone: details.formatted_phone_number || '',
            website: details.website || '',
            hours: details.opening_hours?.weekday_text ? {
              monday: details.opening_hours.weekday_text[0]?.replace('Monday: ', '') || '',
              tuesday: details.opening_hours.weekday_text[1]?.replace('Tuesday: ', '') || '',
              wednesday: details.opening_hours.weekday_text[2]?.replace('Wednesday: ', '') || '',
              thursday: details.opening_hours.weekday_text[3]?.replace('Thursday: ', '') || '',
              friday: details.opening_hours.weekday_text[4]?.replace('Friday: ', '') || '',
              saturday: details.opening_hours.weekday_text[5]?.replace('Saturday: ', '') || '',
              sunday: details.opening_hours.weekday_text[6]?.replace('Sunday: ', '') || ''
            } : undefined
          });
        }
      } catch (detailError) {
        console.warn('[Seed] Error fetching place details:', detailError);
      }
    }

    return businesses.length > 0 ? businesses : null;
  } catch (error) {
    console.error('[Seed] Google Places API error:', error);
    return null;
  }
}

// Generate slug from name
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export async function GET() {
  try {
    const batch = writeBatch(db);
    const businessesRef = collection(db, 'businesses');
    let totalSeeded = 0;
    const categoryStats: Record<string, number> = {};

    // Process each category
    for (const category of DIRECTORY_CATEGORIES) {
      console.log(`[Seed] Processing category: ${category.name}`);

      // Try Google Places API first, fall back to mock data
      let businesses = await fetchFromGooglePlaces(category.name, category.googleType);

      if (!businesses) {
        // Use mock data for this category
        businesses = MOCK_BUSINESSES_BY_CATEGORY[category.name] || [];
      }

      let categoryCount = 0;
      for (const business of businesses.slice(0, 10)) {
        const docRef = doc(businessesRef);
        const slug = generateSlug(business.name);

        batch.set(docRef, {
          id: docRef.id,
          name: business.name,
          slug,
          description: business.description,
          category: category.name,
          address: business.address,
          phone: business.phone || '',
          email: '',
          website: business.website || '',
          hours: business.hours || {},
          images: [],
          logo: '',
          featured: categoryCount < 2, // First 2 in each category are featured
          verified: false, // Not verified until claimed
          ownerId: null, // Can be claimed
          status: 'active',
          claimable: true, // Indicates this listing can be claimed
          source: businesses === MOCK_BUSINESSES_BY_CATEGORY[category.name] ? 'mock' : 'google',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        categoryCount++;
        totalSeeded++;
      }

      categoryStats[category.name] = categoryCount;
    }

    await batch.commit();

    return NextResponse.json({
      success: true,
      message: `Successfully seeded ${totalSeeded} businesses across ${DIRECTORY_CATEGORIES.length} categories.`,
      categories: categoryStats,
      totalBusinesses: totalSeeded,
      note: process.env.GOOGLE_PLACES_API_KEY
        ? 'Used Google Places API for real business data'
        : 'Used mock data (add GOOGLE_PLACES_API_KEY to .env.local for real data)'
    });
  } catch (error) {
    console.error('Error seeding businesses:', error);
    return NextResponse.json({
      success: false,
      error: (error as Error).message
    }, { status: 500 });
  }
}

// DELETE - Clear all businesses (for re-seeding)
export async function DELETE() {
  try {
    const businessesRef = collection(db, 'businesses');
    const snapshot = await getDocs(businessesRef);

    let deleteCount = 0;
    for (const docSnap of snapshot.docs) {
      await deleteDoc(doc(db, 'businesses', docSnap.id));
      deleteCount++;
    }

    return NextResponse.json({
      success: true,
      message: `Deleted ${deleteCount} businesses.`,
      deletedCount: deleteCount
    });
  } catch (error) {
    console.error('Error clearing businesses:', error);
    return NextResponse.json({
      success: false,
      error: (error as Error).message
    }, { status: 500 });
  }
}
