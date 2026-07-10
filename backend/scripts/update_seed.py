"""One-off script to update seed.py property types and images."""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
seed_path = ROOT / "app" / "seed.py"
img_path = ROOT / "app" / "seed_images.py"

text = seed_path.read_text(encoding="utf-8")
new_img = img_path.read_text(encoding="utf-8").strip()
text = re.sub(r"# Stable direct Unsplash URLs.*?\n\}", new_img, text, flags=re.DOTALL)

MAPPING = [
    ("Traditional Kerala", "Beachfront"),
    ("Sea-view Villa", "Beachfront"),
    ("Palolem Beach", "Beachfront"),
    ("Manali Pine", "Cabins"),
    ("Shimla Hillside", "Cabins"),
    ("Coorg Coffee", "Cabins"),
    ("Udaipur Lake", "Luxury"),
    ("Jaipur Pink", "Private room"),
    ("Jaisalmer Desert", "Luxury"),
    ("Bandra West", "Apartment"),
    ("Koramangala", "Apartment"),
    ("Connaught Place", "Apartment"),
    ("Rishikesh Ganges", "Trending"),
    ("Varanasi Ghats", "Trending"),
    ("Pondicherry French", "Villa"),
    ("Hampi Boulder", "Trending"),
    ("Ooty Nilgiri", "Cabins"),
    ("Hyderabad Banjara", "City"),
]

for title_part, pt in MAPPING:
    pattern = (
        rf'("title": "{re.escape(title_part)}[^"]*",.*?'
        rf'"price": \d+,)\s*"type": "[^"]+",\s*"category": "[^"]+",'
    )
    repl = rf'\1\n        "property_type": "{pt}",'
    text = re.sub(pattern, repl, text, flags=re.DOTALL)

text = text.replace('property_type=data["type"],\n            category=data["category"],', 'property_type=data["property_type"],')

# Update legacy detection
text = text.replace(
    """    if not getattr(listing, "category", None):
        return True""",
    """    if db.query(Listing).filter(Listing.property_type == "Beachfront").count() == 0:
        return True""",
)

text = text.replace(
    """def ensure_schema() -> None:
    inspector = inspect(engine)
    if "listings" not in inspector.get_table_names():
        return
    cols = {c["name"] for c in inspector.get_columns("listings")}
    if "category" not in cols:
        with engine.begin() as conn:
            conn.execute(
                text("ALTER TABLE listings ADD COLUMN category VARCHAR(50) DEFAULT 'trending'")
            )


""",
    "",
)

text = text.replace("    ensure_schema()\n\n    if db.query(User).count()", "    if db.query(User).count()")

# Add dead photo check
text = text.replace(
    """    bad_photo = (
        db.query(ListingPhoto)
        .filter(ListingPhoto.url.ilike("%muscache%"))
        .first()
    )
    return bad_photo is not None""",
    """    dead_photos = (
        "photo-1583422409516",
        "photo-1602216056096",
        "photo-1449158743715",
        "muscache",
    )
    for fragment in dead_photos:
        if db.query(ListingPhoto).filter(ListingPhoto.url.ilike(f"%{fragment}%")).first():
            return True
    return False""",
)

seed_path.write_text(text, encoding="utf-8")
print("Updated", seed_path)
