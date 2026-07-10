"""Seed database with Indian sample listings."""

import random

from datetime import date, timedelta

from sqlalchemy import inspect, text
from sqlalchemy.orm import Session

from app.database import engine
from app.models import (
    Amenity,
    Booking,
    Conversation,
    Favorite,
    Listing,
    ListingAmenity,
    ListingPhoto,
    Message,
    Review,
    User,
)

AMENITIES = [
    "WiFi",
    "Kitchen",
    "Free parking",
    "Air conditioning",
    "Washer",
    "Pool",
    "Breakfast",
    "Workspace",
    "Pet friendly",
    "Geyser",
    "Power backup",
    "Housekeeping",
]

HOSTS = [
    {"name": "Priya Sharma", "email": "priya@example.com"},
    {"name": "Sarah Mitchell", "email": "sarah@example.com"},
    {"name": "Marcus Chen", "email": "marcus@example.com"},
    {"name": "James Wilson", "email": "james@example.com"},
    {"name": "David Rao", "email": "david@example.com"},
]

GUESTS = [
    {"name": "Alex Rivera", "email": "alex@example.com"},
    {"name": "Emma Johnson", "email": "emma@example.com"},
    {"name": "Liam Brown", "email": "liam@example.com"},
    {"name": "Noah Patel", "email": "noah@example.com"},
    {"name": "Olivia Smith", "email": "olivia@example.com"},
]

# Verified working Unsplash direct URLs (images.unsplash.com)
IMG = {
    "beach": "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?auto=format&fit=crop&w=800&q=80",
    "houseboat": "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80",
    "goa_villa": "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&w=800&q=80",
    "pool_villa": "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=800&q=80",
    "cabin": "https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=800&q=80",
    "mountain": "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=800&q=80",
    "hill": "https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=800&q=80",
    "haveli": "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80",
    "palace": "https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=800&q=80",
    "desert": "https://images.unsplash.com/photo-1449844908441-8829872d2607?auto=format&fit=crop&w=800&q=80",
    "apartment": "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80",
    "loft": "https://images.unsplash.com/photo-1505843513577-22bb7d21e455?auto=format&fit=crop&w=800&q=80",
    "city_view": "https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=800&q=80",
    "riverside": "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=800&q=80",
    "heritage": "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800&q=80",
    "coastal": "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=800&q=80",
    "interior": "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=800&q=80",
    "modern": "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80",
    "house": "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
    "estate": "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80",
}

LISTINGS_DATA = [
    {
        "host_idx": 0,
        "title": "Traditional Kerala Houseboat on Backwaters",
        "description": "Drift through Alleppey's palm-lined canals on a handcrafted kettuvallam with ensuite bedroom, sundeck, and home-cooked Kerala meals served by your crew.",
        "city": "Alleppey",
        "area": "Vembanad Lake",
        "lat": 9.4981,
        "lng": 76.3388,
        "price": 7500,
        "property_type": "Entire home",
        "vibe": "Beachfront",
        "guests": 4,
        "bedrooms": 2,
        "beds": 2,
        "baths": 1,
        "photos": [IMG["houseboat"], IMG["coastal"]],
        "amenities": ["Breakfast", "Kitchen", "Housekeeping"],
    },
    {
        "host_idx": 1,
        "title": "Sea-view Villa near Calangute Beach",
        "description": "Portuguese-inspired villa five minutes from Calangute Beach with private plunge pool, tropical garden, and shaded veranda for sunset chai.",
        "city": "Goa",
        "area": "Calangute",
        "lat": 15.5439,
        "lng": 73.7553,
        "price": 6200,
        "property_type": "Villa",
        "vibe": "Beachfront",
        "guests": 6,
        "bedrooms": 3,
        "beds": 3,
        "baths": 2,
        "photos": [IMG["goa_villa"], IMG["pool_villa"]],
        "amenities": ["WiFi", "Pool", "Kitchen", "Free parking", "Air conditioning"],
    },
    {
        "host_idx": 1,
        "title": "Palolem Beach Coconut Grove Cottage",
        "description": "Rustic-chic cottage steps from Palolem's crescent beach. Wake to fishing boats, enjoy fresh seafood, and unwind in a hammock under coconut palms.",
        "city": "Goa",
        "area": "Palolem",
        "lat": 15.0100,
        "lng": 74.0230,
        "price": 3800,
        "property_type": "Entire home",
        "vibe": "Beachfront",
        "guests": 3,
        "bedrooms": 1,
        "beds": 2,
        "baths": 1,
        "photos": [IMG["beach"], IMG["coastal"]],
        "amenities": ["WiFi", "Kitchen", "Pet friendly"],
    },
    {
        "host_idx": 2,
        "title": "Manali Pine Forest Cottage",
        "description": "Cozy wooden cottage in Old Manali surrounded by deodar pines. Fireplace, mountain views, and walking distance to cafés along the Beas River.",
        "city": "Manali",
        "area": "Old Manali",
        "lat": 32.2432,
        "lng": 77.1892,
        "price": 4200,
        "property_type": "Entire home",
        "vibe": "Cabins",
        "guests": 4,
        "bedrooms": 2,
        "beds": 2,
        "baths": 1,
        "photos": [IMG["cabin"], IMG["mountain"]],
        "amenities": ["WiFi", "Kitchen", "Geyser", "Free parking"],
    },
    {
        "host_idx": 2,
        "title": "Shimla Hillside Cedar Cabin",
        "description": "Escape to the Himalayas in this cedar-clad cabin with valley views, a reading nook, and crisp mountain air — perfect after exploring Mall Road.",
        "city": "Shimla",
        "area": "Mashobra",
        "lat": 31.1048,
        "lng": 77.1734,
        "price": 5100,
        "property_type": "Entire home",
        "vibe": "Cabins",
        "guests": 5,
        "bedrooms": 2,
        "beds": 3,
        "baths": 2,
        "photos": [IMG["mountain"], IMG["cabin"]],
        "amenities": ["WiFi", "Kitchen", "Geyser", "Workspace"],
    },
    {
        "host_idx": 3,
        "title": "Coorg Coffee Estate Mountain Cabin",
        "description": "Stay amid rolling coffee plantations in Coorg. Morning mist, bird calls, estate walks, and filter coffee on the wraparound deck included.",
        "city": "Coorg",
        "area": "Madikeri",
        "lat": 12.4244,
        "lng": 75.7382,
        "price": 4500,
        "property_type": "Entire home",
        "vibe": "Cabins",
        "guests": 4,
        "bedrooms": 2,
        "beds": 2,
        "baths": 1,
        "photos": [IMG["hill"], IMG["cabin"]],
        "amenities": ["Breakfast", "Kitchen", "Free parking", "Pet friendly"],
    },
    {
        "host_idx": 0,
        "title": "Udaipur Lake-view Heritage Haveli",
        "description": "Stay in a restored Rajput haveli overlooking Lake Pichola. Courtyard fountain, jharokha windows, and rooftop dinner with Aravalli sunset views.",
        "city": "Udaipur",
        "area": "Lake Pichola",
        "lat": 24.5760,
        "lng": 73.6800,
        "price": 9800,
        "property_type": "Entire home",
        "vibe": "Luxury",
        "guests": 6,
        "bedrooms": 3,
        "beds": 4,
        "baths": 3,
        "photos": [IMG["haveli"], IMG["palace"]],
        "amenities": ["WiFi", "Breakfast", "Housekeeping", "Air conditioning"],
    },
    {
        "host_idx": 0,
        "title": "Jaipur Pink City Royal Haveli Suite",
        "description": "Live like royalty in a 19th-century haveli near Hawa Mahal. Hand-painted frescoes, marble floors, and a courtyard café serving Rajasthani thali.",
        "city": "Jaipur",
        "area": "Pink City",
        "lat": 26.9239,
        "lng": 75.8267,
        "price": 8500,
        "property_type": "Private room",
        "vibe": "Luxury",
        "guests": 2,
        "bedrooms": 1,
        "beds": 1,
        "baths": 1,
        "photos": [IMG["palace"], IMG["heritage"]],
        "amenities": ["WiFi", "Breakfast", "Air conditioning", "Housekeeping"],
    },
    {
        "host_idx": 3,
        "title": "Jaisalmer Desert Luxury Tent",
        "description": "Glamp under the stars in the Thar Desert. Hand-embroidered interiors, folk music evenings, camel safaris, and a gourmet Rajasthani dinner.",
        "city": "Jaisalmer",
        "area": "Sam Sand Dunes",
        "lat": 26.9157,
        "lng": 70.9083,
        "price": 11200,
        "property_type": "Entire home",
        "vibe": "Luxury",
        "guests": 2,
        "bedrooms": 1,
        "beds": 1,
        "baths": 1,
        "photos": [IMG["desert"], IMG["haveli"]],
        "amenities": ["Breakfast", "Housekeeping", "Free parking"],
    },
    {
        "host_idx": 1,
        "title": "Bandra West Sea-facing Apartment",
        "description": "Stylish 2BHK in Bandra with Arabian Sea glimpses, open kitchen, and easy access to Carter Road promenade, cafés, and Bandstand.",
        "city": "Mumbai",
        "area": "Bandra West",
        "lat": 19.0596,
        "lng": 72.8295,
        "price": 5500,
        "property_type": "Apartment",
        "vibe": "City",
        "guests": 4,
        "bedrooms": 2,
        "beds": 2,
        "baths": 2,
        "photos": [IMG["apartment"], IMG["city_view"]],
        "amenities": ["WiFi", "Kitchen", "Air conditioning", "Workspace", "Power backup"],
    },
    {
        "host_idx": 2,
        "title": "Koramangala Designer Loft",
        "description": "Sunlit loft in Bangalore's startup hub with high ceilings, fast WiFi, and walkable access to breweries, co-working cafés, and metro.",
        "city": "Bangalore",
        "area": "Koramangala",
        "lat": 12.9352,
        "lng": 77.6245,
        "price": 3200,
        "property_type": "Apartment",
        "vibe": "City",
        "guests": 3,
        "bedrooms": 1,
        "beds": 2,
        "baths": 1,
        "photos": [IMG["loft"], IMG["modern"]],
        "amenities": ["WiFi", "Workspace", "Kitchen", "Air conditioning"],
    },
    {
        "host_idx": 1,
        "title": "Connaught Place Heritage Apartment",
        "description": "Central Delhi apartment in a colonial-era building. Steps from CP's restaurants, India Gate, and Khan Market — ideal for business or sightseeing.",
        "city": "Delhi",
        "area": "Connaught Place",
        "lat": 28.6315,
        "lng": 77.2167,
        "price": 4800,
        "property_type": "Apartment",
        "vibe": "City",
        "guests": 3,
        "bedrooms": 1,
        "beds": 2,
        "baths": 1,
        "photos": [IMG["apartment"], IMG["interior"]],
        "amenities": ["WiFi", "Kitchen", "Air conditioning", "Power backup"],
    },
    {
        "host_idx": 3,
        "title": "Rishikesh Ganges Riverside Retreat",
        "description": "Peaceful stay on the banks of the Ganges near Laxman Jhula. Yoga deck, riverside aarti views, and easy access to cafés and rafting points.",
        "city": "Rishikesh",
        "area": "Tapovan",
        "lat": 30.1290,
        "lng": 78.3153,
        "price": 2900,
        "property_type": "Private room",
        "vibe": "Trending",
        "guests": 2,
        "bedrooms": 1,
        "beds": 1,
        "baths": 1,
        "photos": [IMG["riverside"], IMG["mountain"]],
        "amenities": ["WiFi", "Breakfast", "Workspace"],
    },
    {
        "host_idx": 0,
        "title": "Varanasi Ghats Heritage Guesthouse",
        "description": "Wake to temple bells and boat rides on the Ganges. Heritage guesthouse near Assi Ghat with rooftop chai and Banarasi silk shops nearby.",
        "city": "Varanasi",
        "area": "Assi Ghat",
        "lat": 25.2854,
        "lng": 83.0060,
        "price": 2200,
        "property_type": "Private room",
        "vibe": "Trending",
        "guests": 2,
        "bedrooms": 1,
        "beds": 1,
        "baths": 1,
        "photos": [IMG["heritage"], IMG["riverside"]],
        "amenities": ["WiFi", "Breakfast", "Housekeeping"],
    },
    {
        "host_idx": 2,
        "title": "Pondicherry French Quarter Villa",
        "description": "Colonial villa on a quiet French Quarter lane. Yellow walls, arched doorways, bicycle rentals, and Promenade Beach a short stroll away.",
        "city": "Pondicherry",
        "area": "White Town",
        "lat": 11.9344,
        "lng": 79.8306,
        "price": 4100,
        "property_type": "Villa",
        "vibe": "Trending",
        "guests": 4,
        "bedrooms": 2,
        "beds": 2,
        "baths": 1,
        "photos": [IMG["heritage"], IMG["beach"]],
        "amenities": ["WiFi", "Kitchen", "Free parking", "Air conditioning"],
    },
    {
        "host_idx": 3,
        "title": "Hampi Boulder-stay Eco Cottage",
        "description": "Trending boulder-country escape near Hampi's UNESCO ruins. Eco cottage with stargazing deck, local guide connections, and sunrise Tungabhadra views.",
        "city": "Hampi",
        "area": "Hippie Island",
        "lat": 15.3350,
        "lng": 76.4600,
        "price": 2600,
        "property_type": "Entire home",
        "vibe": "Trending",
        "guests": 3,
        "bedrooms": 1,
        "beds": 2,
        "baths": 1,
        "photos": [IMG["hill"], IMG["desert"]],
        "amenities": ["WiFi", "Kitchen", "Pet friendly"],
    },
    {
        "host_idx": 2,
        "title": "Ooty Nilgiri Hill Station Cottage",
        "description": "British-era charm in the Nilgiris. Flower gardens, misty mornings, toy train nearby, and homemade Ooty chocolate on arrival.",
        "city": "Ooty",
        "area": "Fern Hill",
        "lat": 11.4064,
        "lng": 76.6932,
        "price": 3600,
        "property_type": "Entire home",
        "vibe": "Cabins",
        "guests": 4,
        "bedrooms": 2,
        "beds": 2,
        "baths": 1,
        "photos": [IMG["hill"], IMG["cabin"]],
        "amenities": ["WiFi", "Kitchen", "Geyser", "Free parking"],
    },
    {
        "host_idx": 1,
        "title": "Hyderabad Banjara Hills Penthouse",
        "description": "Modern penthouse overlooking Banjara Hills with skyline views, smart home amenities, and quick access to Hitec City and Charminar.",
        "city": "Hyderabad",
        "area": "Banjara Hills",
        "lat": 17.4126,
        "lng": 78.4482,
        "price": 5200,
        "property_type": "Apartment",
        "vibe": "City",
        "guests": 4,
        "bedrooms": 2,
        "beds": 2,
        "baths": 2,
        "photos": [IMG["modern"], IMG["city_view"]],
        "amenities": ["WiFi", "Pool", "Kitchen", "Air conditioning", "Workspace"],
    },
]

LEGACY_CITIES = {"Austin", "New York", "Chicago", "Los Angeles"}
NUM_HOSTS = 5
NUM_GUESTS = 5
LISTINGS_PER_HOST = 20
TARGET_LISTINGS = NUM_HOSTS * LISTINGS_PER_HOST

AREA_SUFFIXES = ["Heights", "Gardens", "Enclave", "Residency", "Nagar", "Colony", "Park", "View"]

REVIEW_TEMPLATES_5STAR = [
    (5, "Absolutely wonderful stay — exceeded every expectation. Would book again."),
    (5, "Perfect location, spotless rooms, and the host was incredibly responsive."),
    (5, "One of the best stays we've had in India. Highly recommend."),
    (5, "Stunning views and authentic local hospitality. Memorable experience."),
    (5, "Felt right at home. The little touches made all the difference."),
    (5, "Flawless from check-in to checkout. Already planning our return."),
]

REVIEW_TEMPLATES = [
    (5, "Absolutely wonderful stay — exceeded every expectation. Would book again."),
    (5, "Perfect location, spotless rooms, and the host was incredibly responsive."),
    (4, "Great value for money. Minor noise one evening but overall a lovely trip."),
    (4, "Comfortable beds and thoughtful amenities. Check-in was seamless."),
    (5, "One of the best stays we've had in India. Highly recommend."),
    (3, "Good stay overall. WiFi could be faster but the space was charming."),
    (5, "Stunning views and authentic local hospitality. Memorable experience."),
    (4, "Clean, well-equipped, and walking distance to everything we needed."),
    (5, "Felt right at home. The little touches made all the difference."),
    (4, "Lovely property with character. Would stay here on our next visit."),
]

MESSAGE_THREADS = [
    [
        "Hi! Is this place available for next weekend?",
        "Yes, it's available! We'd love to host you.",
        "Great — is early check-in possible on Saturday?",
        "Absolutely, we can arrange a 1 PM check-in for you.",
    ],
    [
        "Hello! Does the listing have reliable WiFi for remote work?",
        "Yes, we have 100 Mbps fiber and a dedicated workspace.",
        "Perfect. I'll book for three nights starting Friday.",
        "Wonderful — looking forward to welcoming you!",
    ],
    [
        "We're travelling with a toddler — is the place child-friendly?",
        "Yes, we have a crib and safety gates available on request.",
        "That's helpful. Are there restaurants within walking distance?",
        "Several family-friendly cafés are just a 5-minute walk away.",
    ],
]


def ensure_schema() -> None:
    inspector = inspect(engine)
    if "listings" not in inspector.get_table_names():
        return
    cols = {c["name"] for c in inspector.get_columns("listings")}
    if "vibe" not in cols:
        with engine.begin() as conn:
            conn.execute(text("ALTER TABLE listings ADD COLUMN vibe VARCHAR(50) DEFAULT 'Trending'"))


def build_listings_catalog() -> list[dict]:
    catalog: list[dict] = []
    idx = 0
    while len(catalog) < TARGET_LISTINGS:
        base = LISTINGS_DATA[idx % len(LISTINGS_DATA)]
        variant = idx // len(LISTINGS_DATA)
        title = base["title"] if variant == 0 else f"{base['title']} · Unit {variant + 1}"
        area = (
            base["area"]
            if variant == 0
            else f"{base['area']} {AREA_SUFFIXES[variant % len(AREA_SUFFIXES)]}"
        )
        price = base["price"] + (variant * 173) % 1800
        catalog.append({**base, "title": title, "area": area, "price": price})
        idx += 1
    return catalog


def _needs_reseed(db: Session) -> bool:
    if db.query(User).filter(User.is_host.is_(True)).count() != NUM_HOSTS:
        return True
    if db.query(User).filter(User.is_host.is_(False)).count() != NUM_GUESTS:
        return True
    if db.query(Listing).count() != TARGET_LISTINGS:
        return True
    hosts = db.query(User).filter(User.is_host.is_(True)).all()
    for host in hosts:
        if db.query(Listing).filter(Listing.host_id == host.id).count() != LISTINGS_PER_HOST:
            return True
    listing = db.query(Listing).first()
    if listing and listing.location_city in LEGACY_CITIES:
        return True
    dead_photos = (
        "photo-1583422409516",
        "photo-1602216056096",
        "photo-1449158743715",
        "photo-1477587450883",
        "photo-1518780664697",
        "photo-1524492412937",
        "muscache",
    )
    for fragment in dead_photos:
        if db.query(ListingPhoto).filter(ListingPhoto.url.ilike(f"%{fragment}%")).first():
            return True
    return False


def _clear_all(db: Session) -> None:
    db.query(Message).delete()
    db.query(Conversation).delete()
    db.query(Review).delete()
    db.query(Booking).delete()
    db.query(Favorite).delete()
    db.query(ListingAmenity).delete()
    db.query(ListingPhoto).delete()
    db.query(Listing).delete()
    db.query(User).delete()
    db.query(Amenity).delete()
    db.commit()


def seed_database(db: Session) -> None:
    ensure_schema()

    if db.query(User).count() > 0 and not _needs_reseed(db):
        return

    if db.query(User).count() > 0:
        _clear_all(db)

    amenity_map: dict[str, Amenity] = {}
    for name in AMENITIES:
        a = Amenity(name=name)
        db.add(a)
        amenity_map[name] = a
    db.flush()

    hosts: list[User] = []
    for h in HOSTS:
        user = User(name=h["name"], email=h["email"], role="host", is_host=True)
        db.add(user)
        hosts.append(user)
    db.flush()

    guests: list[User] = []
    for g in GUESTS:
        user = User(name=g["name"], email=g["email"], role="guest", is_host=False)
        db.add(user)
        guests.append(user)
    db.flush()

    listings: list[Listing] = []
    catalog = build_listings_catalog()
    for idx, data in enumerate(catalog):
        host_idx = idx // LISTINGS_PER_HOST
        listing = Listing(
            host_id=hosts[host_idx].id,
            title=data["title"],
            description=data["description"],
            location_city=data["city"],
            location_area=data["area"],
            lat=data["lat"],
            lng=data["lng"],
            price_per_night=data["price"],
            property_type=data["property_type"],
            vibe=data["vibe"],
            max_guests=data["guests"],
            bedrooms=data["bedrooms"],
            beds=data["beds"],
            bathrooms=data["baths"],
        )
        db.add(listing)
        db.flush()
        listings.append(listing)

        for i, url in enumerate(data["photos"]):
            db.add(ListingPhoto(listing_id=listing.id, url=url, sort_order=i))

        for amenity_name in data["amenities"]:
            amenity = amenity_map.get(amenity_name)
            if not amenity:
                amenity = Amenity(name=amenity_name)
                db.add(amenity)
                db.flush()
                amenity_map[amenity_name] = amenity
            db.add(ListingAmenity(listing_id=listing.id, amenity_id=amenity.id))

    today = date.today()
    rng = random.Random(42)

    # Future bookings — each guest gets 2 upcoming trips
    booking_specs = [
        (0, 0, today + timedelta(days=5), today + timedelta(days=8), 2),
        (3, 0, today + timedelta(days=15), today + timedelta(days=18), 2),
        (21, 1, today + timedelta(days=10), today + timedelta(days=14), 4),
        (25, 1, today + timedelta(days=20), today + timedelta(days=25), 3),
        (42, 2, today + timedelta(days=3), today + timedelta(days=6), 2),
        (48, 2, today + timedelta(days=12), today + timedelta(days=16), 2),
        (63, 3, today + timedelta(days=7), today + timedelta(days=10), 2),
        (70, 3, today + timedelta(days=18), today + timedelta(days=22), 3),
        (85, 4, today + timedelta(days=9), today + timedelta(days=13), 2),
        (92, 4, today + timedelta(days=25), today + timedelta(days=28), 2),
    ]

    for listing_idx, guest_idx, check_in, check_out, guests_count in booking_specs:
        listing = listings[listing_idx]
        nights = (check_out - check_in).days
        total = round(listing.price_per_night * nights * 1.12 + 500, 2)
        db.add(
            Booking(
                listing_id=listing.id,
                guest_id=guests[guest_idx].id,
                check_in=check_in,
                check_out=check_out,
                guests_count=guests_count,
                total_price=total,
                status="confirmed",
            )
        )

    # Past bookings + reviews per listing (every other listing gets 5-star reviews for Guest favourite badges)
    for i, listing in enumerate(listings):
        templates = REVIEW_TEMPLATES_5STAR if i % 2 == 0 else REVIEW_TEMPLATES
        num_reviews = rng.randint(4, 6) if i % 2 == 0 else rng.randint(3, 4)
        for j in range(num_reviews):
            guest = guests[j % len(guests)]
            nights = rng.randint(2, 6)
            check_out_past = today - timedelta(days=rng.randint(5, 90))
            check_in_past = check_out_past - timedelta(days=nights)
            total = round(listing.price_per_night * nights * 1.12 + 500, 2)
            booking = Booking(
                listing_id=listing.id,
                guest_id=guest.id,
                check_in=check_in_past,
                check_out=check_out_past,
                guests_count=rng.randint(1, min(4, listing.max_guests)),
                total_price=total,
                status="confirmed",
            )
            db.add(booking)
            db.flush()

            rating, comment = templates[(listing.id + j) % len(templates)]
            db.add(
                Review(
                    listing_id=listing.id,
                    guest_id=guest.id,
                    booking_id=booking.id,
                    rating=rating,
                    comment=comment,
                )
            )

    # Alex gets one past trip without a review (leave-review demo on Trips)
    past_listing = listings[4]
    db.add(
        Booking(
            listing_id=past_listing.id,
            guest_id=guests[0].id,
            check_in=today - timedelta(days=14),
            check_out=today - timedelta(days=10),
            guests_count=2,
            total_price=round(past_listing.price_per_night * 4 * 1.12 + 500, 2),
            status="confirmed",
        )
    )

    # Wishlists — 4 favorites per guest across different hosts' listings
    for guest_idx, guest in enumerate(guests):
        fav_indices = [
            guest_idx * 7 + 1,
            guest_idx * 7 + 3,
            guest_idx * 7 + 5,
            guest_idx * 7 + 8,
        ]
        for li in fav_indices:
            if li < len(listings):
                db.add(Favorite(user_id=guest.id, listing_id=listings[li].id))

    # Sample conversations with alternating guest/host messages
    for thread_idx, thread in enumerate(MESSAGE_THREADS):
        listing = listings[thread_idx * 5]
        guest = guests[thread_idx % len(guests)]
        host_user = next(h for h in hosts if h.id == listing.host_id)
        conv = Conversation(
            guest_id=guest.id,
            host_id=host_user.id,
            listing_id=listing.id,
        )
        db.add(conv)
        db.flush()
        for msg_idx, body in enumerate(thread):
            sender = guest if msg_idx % 2 == 0 else host_user
            db.add(Message(conversation_id=conv.id, sender_id=sender.id, body=body))

    db.commit()
