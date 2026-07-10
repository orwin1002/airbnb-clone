"""Split merged property_type into property_type + vibe in seed data."""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
seed_path = ROOT / "app" / "seed.py"
text = seed_path.read_text(encoding="utf-8")

MAPPING = [
    ("Traditional Kerala", "Entire home", "Beachfront"),
    ("Sea-view Villa", "Villa", "Beachfront"),
    ("Palolem Beach", "Entire home", "Beachfront"),
    ("Manali Pine", "Entire home", "Cabins"),
    ("Shimla Hillside", "Entire home", "Cabins"),
    ("Coorg Coffee", "Entire home", "Cabins"),
    ("Udaipur Lake", "Entire home", "Luxury"),
    ("Jaipur Pink", "Private room", "Luxury"),
    ("Jaisalmer Desert", "Entire home", "Luxury"),
    ("Bandra West", "Apartment", "City"),
    ("Koramangala", "Apartment", "City"),
    ("Connaught Place", "Apartment", "City"),
    ("Rishikesh Ganges", "Private room", "Trending"),
    ("Varanasi Ghats", "Private room", "Trending"),
    ("Pondicherry French", "Villa", "Trending"),
    ("Hampi Boulder", "Entire home", "Trending"),
    ("Ooty Nilgiri", "Entire home", "Cabins"),
    ("Hyderabad Banjara", "Apartment", "City"),
]

for title_part, ptype, vibe in MAPPING:
    pattern = (
        rf'("title": "{re.escape(title_part)}[^"]*",.*?'
        rf'"price": \d+,)\s*"property_type": "[^"]+",'
    )
    repl = rf'\1\n        "property_type": "{ptype}",\n        "vibe": "{vibe}",'
    text = re.sub(pattern, repl, text, flags=re.DOTALL)

text = text.replace(
    'property_type=data["property_type"],\n            max_guests=data["guests"],',
    'property_type=data["property_type"],\n            vibe=data["vibe"],\n            max_guests=data["guests"],',
)

VIBE_VALUES = '{"Beachfront", "Cabins", "Trending", "City", "Luxury"}'

text = text.replace(
    """    if db.query(Listing).filter(Listing.property_type == "Beachfront").count() == 0:
        return True""",
    f"""    if db.query(Listing).filter(Listing.vibe == "Beachfront").count() == 0:
        return True
    listing = db.query(Listing).first()
    if listing and listing.property_type in {VIBE_VALUES}:
        return True""",
)

ensure_schema = '''
from sqlalchemy import inspect, text

from app.database import engine


def ensure_schema() -> None:
    inspector = inspect(engine)
    if "listings" not in inspector.get_table_names():
        return
    cols = {c["name"] for c in inspector.get_columns("listings")}
    if "vibe" not in cols:
        with engine.begin() as conn:
            conn.execute(text("ALTER TABLE listings ADD COLUMN vibe VARCHAR(50) DEFAULT 'Trending'"))


'''

if "def ensure_schema" not in text:
    text = text.replace(
        "from sqlalchemy.orm import Session\n\nfrom app.models import",
        "from sqlalchemy import inspect, text\nfrom sqlalchemy.orm import Session\n\nfrom app.database import engine\nfrom app.models import",
    )
    text = text.replace(
        "def build_listings_catalog()",
        ensure_schema + "def build_listings_catalog()",
    )
    text = text.replace(
        "def seed_database(db: Session) -> None:\n    if db.query(User).count()",
        "def seed_database(db: Session) -> None:\n    ensure_schema()\n\n    if db.query(User).count()",
    )

seed_path.write_text(text, encoding="utf-8")
print("Updated seed.py")
